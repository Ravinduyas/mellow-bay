import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  BookingSelection,
  DEFAULT_PRICES,
  Enquiry,
  EnquiryStatus,
  PriceConfig,
  Quote,
  validatePriceConfig,
} from '@mellow-bay/booking-engine';

/**
 * JSON-file persistence.
 *
 * Chosen over a database because the data is small, single-writer and needs no
 * query surface — and because a file store has no service to run alongside the
 * API. `loadPrices`/`saveEnquiry` are the seam: swapping in Postgres means
 * reimplementing this module and nothing else.
 */

const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), 'data');
const PRICES_FILE = join(DATA_DIR, 'prices.json');
const ENQUIRIES_FILE = join(DATA_DIR, 'enquiries.json');

/**
 * Write to a temp file and rename over the target. Rename is atomic on the same
 * filesystem, so a crash mid-write leaves the previous file intact rather than
 * a truncated one — a half-written price file would take down every quote.
 */
async function writeAtomic(file: string, data: unknown): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, file);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ prices -- */

// Cached because prices are read on every quote and written rarely.
let cachedPrices: PriceConfig | null = null;

export async function loadPrices(): Promise<PriceConfig> {
  if (cachedPrices) return cachedPrices;

  const raw = await readJson<unknown>(PRICES_FILE, null);
  if (raw === null) {
    cachedPrices = DEFAULT_PRICES;
    return cachedPrices;
  }

  // Revalidate on read: the file is editable by hand, and a config that has
  // drifted out of shape must not silently produce NaN prices.
  const result = validatePriceConfig(raw);
  if (!result.ok) {
    console.error(
      `[store] ${PRICES_FILE} is not a valid price config, falling back to defaults:\n  - ${result.errors.join('\n  - ')}`,
    );
    cachedPrices = DEFAULT_PRICES;
    return cachedPrices;
  }

  cachedPrices = result.value;
  return cachedPrices;
}

export async function savePrices(config: PriceConfig): Promise<void> {
  await writeAtomic(PRICES_FILE, config);
  cachedPrices = config;
}

export async function resetPrices(): Promise<PriceConfig> {
  await writeAtomic(PRICES_FILE, DEFAULT_PRICES);
  cachedPrices = DEFAULT_PRICES;
  return DEFAULT_PRICES;
}

/* --------------------------------------------------------------- enquiries -- */

/**
 * Serialised through a promise chain so two concurrent submissions cannot
 * read-modify-write the same array and lose one of the enquiries.
 */
let enquiryQueue: Promise<unknown> = Promise.resolve();

export async function saveEnquiry(
  selection: BookingSelection,
  quote: Quote,
): Promise<Enquiry> {
  const run = enquiryQueue.then(async () => {
    const all = await readJson<Enquiry[]>(ENQUIRIES_FILE, []);
    const enquiry: Enquiry = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      selection,
      quote,
      status: 'new',
    };
    all.push(enquiry);
    await writeAtomic(ENQUIRIES_FILE, all);
    return enquiry;
  });

  // Keep the chain alive even if this write fails, so one bad write does not
  // wedge every later submission.
  enquiryQueue = run.catch(() => undefined);
  return run;
}

export async function listEnquiries(): Promise<Enquiry[]> {
  const all = await readJson<Enquiry[]>(ENQUIRIES_FILE, []);
  return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEnquiry(id: string): Promise<Enquiry | null> {
  const all = await readJson<Enquiry[]>(ENQUIRIES_FILE, []);
  return all.find((e) => e.id === id) ?? null;
}

/**
 * Updates the staff-owned fields only. The selection and the quote are never
 * touched — an enquiry is a record of what a guest asked for and what they were
 * quoted, and editing either after the fact would rewrite history.
 */
export async function updateEnquiry(
  id: string,
  patch: { status?: EnquiryStatus; staffNotes?: string },
): Promise<Enquiry | null> {
  const run = enquiryQueue.then(async () => {
    const all = await readJson<Enquiry[]>(ENQUIRIES_FILE, []);
    const index = all.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const updated: Enquiry = {
      ...all[index],
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.staffNotes !== undefined ? { staffNotes: patch.staffNotes } : {}),
      updatedAt: new Date().toISOString(),
    };
    all[index] = updated;
    await writeAtomic(ENQUIRIES_FILE, all);
    return updated;
  });

  // Shares the enquiry queue with saveEnquiry: a status change landing at the
  // same moment as a new submission must not drop either write.
  enquiryQueue = run.catch(() => undefined);
  return run;
}

/** Counts and revenue for the admin overview. */
export async function enquiryStats() {
  const all = await listEnquiries();
  const byStatus = all.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  // Confirmed value only — counting every enquiry as revenue would overstate it.
  const confirmedValue = all
    .filter((e) => e.status === 'confirmed')
    .reduce((sum, e) => sum + e.quote.total, 0);

  return {
    total: all.length,
    byStatus,
    confirmedValue,
    pipelineValue: all
      .filter((e) => e.status === 'new' || e.status === 'contacted')
      .reduce((sum, e) => sum + e.quote.total, 0),
    currency: all[0]?.quote.currency ?? DEFAULT_PRICES.currency,
  };
}
