import {
  BookingSelection,
  LESSON_LABELS,
  LEVEL_LABELS,
  MODEL_INCLUDES,
  PriceConfig,
  Quote,
  QuoteLine,
  ROOM_LABELS,
  SEAT_LABELS,
} from './types';

/**
 * Starting prices. Every figure here is a placeholder — the chart specifies the
 * shape of the price model but carries no real numbers (its admin counters all
 * read 0), so these exist to make the engine demonstrable and are meant to be
 * replaced from the admin screen.
 *
 * The two airport-pickup bands are the exception: 3 people at 75 and 4 at 100
 * are the only concrete figures the chart gives.
 */
export const DEFAULT_PRICES: PriceConfig = {
  currency: 'EUR',
  rooms: {
    dorm: {
      basePerNight: 18,
      perExtraPersonPerNight: 0,
      includedPeople: 1,
      maxPeople: 1,
      marginPct: 20,
    },
    double: {
      basePerNight: 55,
      perExtraPersonPerNight: 15,
      includedPeople: 2,
      maxPeople: 3,
      marginPct: 25,
    },
    family: {
      basePerNight: 90,
      perExtraPersonPerNight: 18,
      includedPeople: 3,
      maxPeople: 5,
      marginPct: 25,
    },
  },
  coworking: {
    seatPerDay: { normal: 8, office: 12 },
    marginPct: 15,
  },
  surf: {
    lesson: {
      beginner: { general: 35, private: 60 },
      intermediate: { general: 40, private: 70 },
      advanced: { general: 45, private: 80 },
    },
  },
  addons: {
    airportPickup: [
      { upToPeople: 3, price: 75 },
      { upToPeople: 4, price: 100 },
    ],
  },
};

const MS_PER_NIGHT = 24 * 60 * 60 * 1000;

/**
 * Nights between two yyyy-mm-dd strings. Parsed as UTC so a DST boundary in the
 * viewer's timezone cannot round a stay to the wrong number of nights.
 */
export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / MS_PER_NIGHT));
}

/** Cost plus the configured margin, rounded to whole currency units. */
export function withMargin(cost: number, marginPct: number): number {
  return Math.round(cost * (1 + marginPct / 100));
}

/**
 * Airport pickup is charged per party. Bands are "up to N people"; a party
 * larger than every band falls back to the largest one rather than going free.
 */
export function airportPickupPrice(config: PriceConfig, people: number): number {
  const bands = config.addons.airportPickup;
  if (!bands.length) return 0;
  const match = bands.find((b) => people <= b.upToPeople);
  return match ? match.price : bands[bands.length - 1].price;
}

/**
 * Turns a selection into an itemised quote.
 *
 * Pure, and the single place price is decided — the steps and the review screen
 * both render from this rather than each doing their own arithmetic.
 */
export function quote(selection: BookingSelection, config: PriceConfig): Quote {
  const includes = MODEL_INCLUDES[selection.model];
  const nights = nightsBetween(selection.checkIn, selection.checkOut);
  const lines: QuoteLine[] = [];

  // --- Rooms: in every model ---
  const room = config.rooms[selection.room.kind];
  if (nights > 0) {
    const extraPeople = Math.max(0, selection.room.people - room.includedPeople);
    const perNight = room.basePerNight + extraPeople * room.perExtraPersonPerNight;
    const extraNote = extraPeople > 0 ? ` · ${extraPeople} extra guest${extraPeople > 1 ? 's' : ''}` : '';
    lines.push({
      id: 'room',
      label: ROOM_LABELS[selection.room.kind],
      detail: `${nights} night${nights > 1 ? 's' : ''} · ${selection.room.people} guest${
        selection.room.people > 1 ? 's' : ''
      }${extraNote}`,
      amount: withMargin(perNight * nights, room.marginPct),
    });
  }

  // --- Coworking: seats x days, priced by chair type ---
  if (includes.coworking && nights > 0 && selection.coworking.seats > 0) {
    const perDay = config.coworking.seatPerDay[selection.coworking.seatType];
    const cost = perDay * selection.coworking.seats * nights;
    lines.push({
      id: 'coworking',
      label: 'Coworking',
      detail: `${selection.coworking.seats} × ${SEAT_LABELS[
        selection.coworking.seatType
      ].toLowerCase()} · ${nights} day${nights > 1 ? 's' : ''}`,
      amount: withMargin(cost, config.coworking.marginPct),
    });
  }

  // --- Surf: one line per guest, priced by their own level and lesson type ---
  if (includes.surf) {
    selection.surf.guests.forEach((guest, i) => {
      const price = config.surf.lesson[guest.level][guest.lessonType];
      lines.push({
        id: `surf-${guest.id}`,
        label: guest.name.trim() || `Surfer ${i + 1}`,
        detail: `${LEVEL_LABELS[guest.level]} · ${LESSON_LABELS[guest.lessonType]} lesson`,
        amount: price,
      });
    });
  }

  // --- Addons ---
  if (selection.addons.airportPickup) {
    const party = Math.max(selection.room.people, includes.surf ? selection.surf.guests.length : 0);
    lines.push({
      id: 'airport',
      label: 'Airport pickup and drop',
      detail: `Party of ${party}`,
      amount: airportPickupPrice(config, party),
    });
  }

  return {
    lines,
    total: lines.reduce((sum, l) => sum + l.amount, 0),
    currency: config.currency,
    nights,
  };
}

/** Formats an amount in the configured currency, with no trailing decimals. */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // An unrecognised currency code should not blank out every price on screen.
    return `${currency} ${Math.round(amount)}`;
  }
}
