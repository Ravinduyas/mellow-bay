import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * End-to-end check against a real server on a real port.
 *
 * Runs against a throwaway data directory so it never touches saved prices, and
 * sets ADMIN_TOKEN before importing the app — the app reads it at module load.
 */
const TOKEN = 'test-token-not-a-secret';
process.env.ADMIN_TOKEN = TOKEN;
const dataDir = await mkdtemp(join(tmpdir(), 'mellow-smoke-'));
process.env.DATA_DIR = dataDir;

const { createApp } = await import('./app.js');
const { DEFAULT_PRICES } = await import('@mellow-bay/booking-engine');

let failures = 0;
const check = (name: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`);
};

const server = createApp().listen(0);
await new Promise((r) => server.once('listening', r));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const base = `http://127.0.0.1:${port}`;

// Response bodies are deliberately untyped here: this harness exists to check
// what the server actually returns, so asserting a compile-time shape over it
// would defeat the point.
/* eslint-disable @typescript-eslint/no-explicit-any */
const call = async (path: string, init: RequestInit = {}) => {
  const res = await fetch(base + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = (await res.json().catch(() => null)) as any;
  return { status: res.status, body };
};

const auth = { authorization: `Bearer ${TOKEN}` };

const selection = {
  model: 'rooms-coworking-surf',
  checkIn: '2026-09-01',
  checkOut: '2026-09-04',
  room: { kind: 'double', people: 2 },
  coworking: { seatType: 'normal', seats: 2 },
  surf: {
    date: '2026-09-02',
    guests: [{ id: 'a', name: 'Ada', level: 'beginner', lessonType: 'general' }],
  },
  addons: { airportPickup: true },
  contact: { name: 'Ada Lovelace', email: 'ada@example.com', phone: '', notes: '' },
};

try {
  // --- health -------------------------------------------------------------
  check('health is ok', (await call('/api/health')).body, { ok: true, adminConfigured: true });

  // --- prices are public to read -----------------------------------------
  const prices = await call('/api/prices');
  check('GET /api/prices is public', prices.status, 200);
  check('serves the defaults initially', prices.body, DEFAULT_PRICES);

  // --- writes require auth ------------------------------------------------
  check('PUT /api/prices without a token is 401', (await call('/api/prices', { method: 'PUT', body: JSON.stringify(DEFAULT_PRICES) })).status, 401);
  check('PUT with a wrong token is 401', (await call('/api/prices', { method: 'PUT', headers: { authorization: 'Bearer wrong' }, body: JSON.stringify(DEFAULT_PRICES) })).status, 401);
  check('GET /api/enquiries without a token is 401', (await call('/api/enquiries')).status, 401);

  // --- writes validate ----------------------------------------------------
  const badWrite = await call('/api/prices', { method: 'PUT', headers: auth, body: JSON.stringify({ ...DEFAULT_PRICES, currency: 'euros' }) });
  check('invalid config is rejected', badWrite.status, 400);

  const raised = structuredClone(DEFAULT_PRICES);
  raised.rooms.double.basePerNight = 100;
  raised.rooms.double.marginPct = 0;
  const goodWrite = await call('/api/prices', { method: 'PUT', headers: auth, body: JSON.stringify(raised) });
  check('valid config is accepted', goodWrite.status, 200);
  check('written config is served back', (await call('/api/prices')).body.rooms.double.basePerNight, 100);

  // --- quoting uses server-side prices ------------------------------------
  const quoted = await call('/api/quote', { method: 'POST', body: JSON.stringify(selection) });
  check('quote succeeds', quoted.status, 200);
  // 3 nights x 100, no margin — proves the quote used the config just written.
  const roomLine = quoted.body.quote.lines.find((l: { id: string }) => l.id === 'room');
  check('room priced from the saved config', roomLine.amount, 300);

  const badQuote = await call('/api/quote', { method: 'POST', body: JSON.stringify({ ...selection, room: { kind: 'double', people: 99 } }) });
  check('over-capacity quote rejected', badQuote.status, 400);

  // --- a client-supplied total is ignored ---------------------------------
  const spoofed = await call('/api/quote', { method: 'POST', body: JSON.stringify({ ...selection, quote: { total: 1 }, total: 1 }) });
  check('client-sent total does not change the price', spoofed.body.quote.lines.find((l: { id: string }) => l.id === 'room').amount, 300);

  // --- enquiries ----------------------------------------------------------
  const noContact = await call('/api/enquiries', { method: 'POST', body: JSON.stringify({ ...selection, contact: { name: '', email: '', phone: '', notes: '' } }) });
  check('enquiry without contact details rejected', noContact.status, 400);

  const created = await call('/api/enquiries', { method: 'POST', body: JSON.stringify(selection) });
  check('enquiry created', created.status, 201);
  check('enquiry stores the server-computed quote', created.body.quote.lines.find((l: { id: string }) => l.id === 'room').amount, 300);
  check('enquiry starts as new', created.body.status, 'new');

  // --- concurrent writes do not lose enquiries ----------------------------
  await Promise.all(
    Array.from({ length: 8 }, () => call('/api/enquiries', { method: 'POST', body: JSON.stringify(selection) })),
  );
  const listed = await call('/api/enquiries', { headers: auth });
  check('all concurrent enquiries were persisted', listed.body.length, 9);

  // --- enquiry detail and staff updates -----------------------------------
  const id = created.body.id;
  check('enquiry fetched by id', (await call(`/api/enquiries/${id}`, { headers: auth })).body.id, id);
  check('enquiry detail needs auth', (await call(`/api/enquiries/${id}`)).status, 401);
  check('unknown id is 404', (await call('/api/enquiries/does-not-exist', { headers: auth })).status, 404);

  check('bad status rejected', (await call(`/api/enquiries/${id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ status: 'cancelled' }) })).status, 400);
  check('empty patch rejected', (await call(`/api/enquiries/${id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({}) })).status, 400);

  const patched = await call(`/api/enquiries/${id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ status: 'confirmed', staffNotes: 'Called, holding the room.' }) });
  check('status updated', patched.body.status, 'confirmed');
  check('staff notes stored', patched.body.staffNotes, 'Called, holding the room.');
  check('updatedAt stamped', typeof patched.body.updatedAt, 'string');
  // The quote is a record of what the guest was told, so a staff edit must not
  // reprice it against the config that happens to be live now.
  check('patching does not reprice the quote', patched.body.quote.total, created.body.quote.total);
  check('patching does not alter the selection', patched.body.selection, created.body.selection);

  // --- stats --------------------------------------------------------------
  const stats = await call('/api/enquiries/stats', { headers: auth });
  check('stats needs auth', (await call('/api/enquiries/stats')).status, 401);
  check('stats counts every enquiry', stats.body.total, 9);
  check('one confirmed', stats.body.byStatus.confirmed, 1);
  check('confirmed value is the confirmed quote only', stats.body.confirmedValue, created.body.quote.total);

  // --- reset --------------------------------------------------------------
  check('reset restores defaults', (await call('/api/prices/reset', { method: 'POST', headers: auth })).body.rooms.double.basePerNight, DEFAULT_PRICES.rooms.double.basePerNight);

  // --- unknown route ------------------------------------------------------
  check('unknown route is 404 json', (await call('/api/nope')).status, 404);
} finally {
  server.close();
  await rm(dataDir, { recursive: true, force: true });
}

console.log(failures === 0 ? '\nAll API checks passed.' : `\n${failures} API check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
