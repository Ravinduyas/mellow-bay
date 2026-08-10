import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_PRICES } from './pricing';
import { PriceConfig } from './types';

const KEY = 'mellow-bay.prices.v1';

/**
 * Price config persisted to localStorage.
 *
 * This is the seam where a real backend would go: swap `read`/`write` for
 * fetches and nothing above this file changes. Until then the admin screen is
 * genuinely functional, but per-browser — edits do not reach anyone else.
 */

/**
 * Merged field by field against the defaults so a config saved by an older
 * build — missing a room type or a lesson level added since — cannot leave the
 * pricing engine reading `undefined` and rendering NaN across every total.
 */
function merge(stored: unknown): PriceConfig {
  if (!stored || typeof stored !== 'object') return DEFAULT_PRICES;
  const s = stored as Partial<PriceConfig>;

  const rooms = { ...DEFAULT_PRICES.rooms };
  for (const kind of Object.keys(DEFAULT_PRICES.rooms) as (keyof typeof rooms)[]) {
    rooms[kind] = { ...DEFAULT_PRICES.rooms[kind], ...(s.rooms?.[kind] ?? {}) };
  }

  const lesson = { ...DEFAULT_PRICES.surf.lesson };
  for (const level of Object.keys(DEFAULT_PRICES.surf.lesson) as (keyof typeof lesson)[]) {
    lesson[level] = { ...DEFAULT_PRICES.surf.lesson[level], ...(s.surf?.lesson?.[level] ?? {}) };
  }

  return {
    currency: s.currency ?? DEFAULT_PRICES.currency,
    rooms,
    coworking: {
      seatPerDay: {
        ...DEFAULT_PRICES.coworking.seatPerDay,
        ...(s.coworking?.seatPerDay ?? {}),
      },
      marginPct: s.coworking?.marginPct ?? DEFAULT_PRICES.coworking.marginPct,
    },
    surf: { lesson },
    addons: {
      airportPickup: Array.isArray(s.addons?.airportPickup) && s.addons.airportPickup.length
        ? s.addons.airportPickup
        : DEFAULT_PRICES.addons.airportPickup,
    },
  };
}

function read(): PriceConfig {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? merge(JSON.parse(raw)) : DEFAULT_PRICES;
  } catch {
    // Private-browsing modes and corrupt JSON both land here. Falling back to
    // defaults keeps the booking flow usable rather than crashing the page.
    return DEFAULT_PRICES;
  }
}

function write(config: PriceConfig): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the live price config. Kept in sync across tabs — an admin editing
 * prices in one tab should not leave a booking tab quoting stale figures.
 */
export function usePrices() {
  const [prices, setPrices] = useState<PriceConfig>(read);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setPrices(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = useCallback((next: PriceConfig) => {
    setPrices(next);
    return write(next);
  }, []);

  const reset = useCallback(() => {
    setPrices(DEFAULT_PRICES);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nothing useful to do if storage is unavailable */
    }
  }, []);

  return { prices, save, reset };
}
