/**
 * Sanity checks for the pricing engine. Run with `npx tsx scripts/check-pricing.ts`.
 *
 * Not a test framework — just enough to prove the arithmetic in the chart is
 * implemented as specified before it goes near a real price.
 */
import { DEFAULT_PRICES, airportPickupPrice, nightsBetween, quote, withMargin } from '../src/booking/pricing';
import { BookingSelection } from '../src/booking/types';

let failures = 0;
const check = (name: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  expected ${expected}, got ${actual}`}`);
};

const base = (over: Partial<BookingSelection> = {}): BookingSelection => ({
  model: 'rooms',
  checkIn: '2026-09-01',
  checkOut: '2026-09-04', // 3 nights
  room: { kind: 'double', people: 2 },
  coworking: { seatType: 'normal', seats: 2 },
  surf: {
    date: '2026-09-02',
    guests: [
      { id: 'a', name: 'Ada', level: 'beginner', lessonType: 'general' },
      { id: 'b', name: 'Bo', level: 'advanced', lessonType: 'private' },
    ],
  },
  addons: { airportPickup: false },
  contact: { name: '', email: '', phone: '', notes: '' },
  ...over,
});

const P = DEFAULT_PRICES;

// --- nights ---------------------------------------------------------------
check('nights across 3 days', nightsBetween('2026-09-01', '2026-09-04'), 3);
check('nights when reversed clamps to 0', nightsBetween('2026-09-04', '2026-09-01'), 0);
check('nights with empty input', nightsBetween('', ''), 0);
// A DST transition in Europe (last Sunday of October) must not lose a night.
check('nights across a DST boundary', nightsBetween('2026-10-24', '2026-10-26'), 2);

// --- margin ---------------------------------------------------------------
check('margin adds a percentage', withMargin(100, 25), 125);
check('margin of zero is a no-op', withMargin(80, 0), 80);

// --- rooms ----------------------------------------------------------------
{
  const q = quote(base(), P);
  const expect = withMargin(P.rooms.double.basePerNight * 3, P.rooms.double.marginPct);
  check('double, 2 guests, 3 nights', q.total, expect);
  check('rooms-only model yields one line', q.lines.length, 1);
}
{
  // 3 guests in a double: 1 beyond the 2 included.
  const q = quote(base({ room: { kind: 'double', people: 3 } }), P);
  const perNight = P.rooms.double.basePerNight + P.rooms.double.perExtraPersonPerNight;
  check('extra guest is charged per night', q.total, withMargin(perNight * 3, P.rooms.double.marginPct));
}

// --- model gating ---------------------------------------------------------
{
  const q = quote(base({ model: 'rooms' }), P);
  check('rooms model ignores coworking and surf', q.lines.map((l) => l.id), ['room']);
}
{
  const q = quote(base({ model: 'rooms-coworking' }), P);
  check('coworking model adds one coworking line', q.lines.map((l) => l.id), ['room', 'coworking']);
  const cw = q.lines.find((l) => l.id === 'coworking')!;
  check(
    'coworking = seats x nights x rate + margin',
    cw.amount,
    withMargin(P.coworking.seatPerDay.normal * 2 * 3, P.coworking.marginPct),
  );
}
{
  const q = quote(base({ model: 'rooms-surf' }), P);
  check('surf model adds a line per guest', q.lines.length, 3);
  check(
    'each surfer priced at their own level and type',
    q.lines.filter((l) => l.id.startsWith('surf-')).map((l) => l.amount),
    [P.surf.lesson.beginner.general, P.surf.lesson.advanced.private],
  );
}
{
  const q = quote(base({ model: 'rooms-coworking-surf' }), P);
  check('full model includes everything', q.lines.map((l) => l.id), [
    'room',
    'coworking',
    'surf-a',
    'surf-b',
  ]);
}

// --- addons ---------------------------------------------------------------
check('pickup band: 2 people falls in the <=3 band', airportPickupPrice(P, 2), 75);
check('pickup band: exactly 3', airportPickupPrice(P, 3), 75);
check('pickup band: exactly 4', airportPickupPrice(P, 4), 100);
check('pickup band: above every band uses the largest', airportPickupPrice(P, 9), 100);

// --- edge cases -----------------------------------------------------------
{
  const q = quote(base({ checkIn: '2026-09-04', checkOut: '2026-09-01' }), P);
  check('reversed dates produce no room charge', q.lines.length, 0);
  check('reversed dates total zero', q.total, 0);
}
{
  const q = quote(base({ model: 'rooms-coworking', coworking: { seatType: 'normal', seats: 0 } }), P);
  check('zero seats adds no coworking line', q.lines.map((l) => l.id), ['room']);
}
{
  const q = quote(base({ addons: { airportPickup: true } }), P);
  check('pickup priced off the larger of room guests and surfers', q.lines.at(-1)!.amount, 75);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
