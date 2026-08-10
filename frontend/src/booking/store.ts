import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_PRICES, PriceConfig, validatePriceConfig } from '@mellow-bay/booking-engine';
import { apiEnabled, fetchPrices, resetPricesRemote, savePricesRemote } from './api';

const KEY = 'mellow-bay.prices.v1';
const TOKEN_KEY = 'mellow-bay.admin-token';

/**
 * Price config, from the backend when one is configured and from browser
 * storage when not.
 *
 * The fallback is what keeps the statically-hosted build usable: with no API
 * the admin screen still works, it just only affects the browser it was used
 * in. `source` lets the UI say which of the two is in play rather than leaving
 * an admin to guess whether a save reached anyone else.
 */

export type PriceSource = 'api' | 'local';

/**
 * Read back through the same validator the server uses. Stored config is
 * editable by hand and may predate a shape change; anything invalid must not
 * reach the pricing engine, where a missing field becomes NaN on every total.
 */
function readLocal(): PriceConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PRICES;
    const result = validatePriceConfig(JSON.parse(raw));
    return result.ok ? result.value : DEFAULT_PRICES;
  } catch {
    // Private browsing and corrupt JSON both land here.
    return DEFAULT_PRICES;
  }
}

function writeLocal(config: PriceConfig): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

/** The admin token is held in browser storage so it survives a reload. */
export function readAdminToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writeAdminToken(token: string): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — the token simply will not persist */
  }
}

export interface SaveResult {
  ok: boolean;
  error?: string;
  details?: string[];
}

export function usePrices() {
  const [prices, setPrices] = useState<PriceConfig>(() => (apiEnabled ? DEFAULT_PRICES : readLocal()));
  const [source, setSource] = useState<PriceSource>(apiEnabled ? 'api' : 'local');
  const [loading, setLoading] = useState(apiEnabled);

  useEffect(() => {
    if (!apiEnabled) return;
    let cancelled = false;

    fetchPrices()
      .then((config) => {
        if (cancelled) return;
        setPrices(config);
        setSource('api');
      })
      .catch(() => {
        // The backend is configured but unreachable. Quoting from the bundled
        // defaults beats showing an empty page, but the source flips to
        // 'local' so the UI can say the figures may be stale.
        if (cancelled) return;
        setPrices(readLocal());
        setSource('local');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep tabs in step when prices live in this browser.
  useEffect(() => {
    if (apiEnabled) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setPrices(readLocal());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = useCallback(async (next: PriceConfig): Promise<SaveResult> => {
    // Validate before sending so an obviously bad config is caught without a
    // round trip. The server revalidates regardless — this is not the guard.
    const check = validatePriceConfig(next);
    // `=== false` rather than `!check.ok`: this project's tsconfig omits
    // `strict`, and without strictNullChecks the negated form does not narrow
    // the discriminated union.
    if (check.ok === false) {
      return { ok: false, error: 'These prices are not valid.', details: check.errors };
    }

    if (!apiEnabled) {
      const ok = writeLocal(check.value);
      setPrices(check.value);
      return ok ? { ok: true } : { ok: false, error: 'Browser storage is unavailable.' };
    }

    const token = readAdminToken();
    if (!token) return { ok: false, error: 'Enter the admin token before saving.' };

    try {
      const saved = await savePricesRemote(check.value, token);
      setPrices(saved);
      setSource('api');
      return { ok: true };
    } catch (err) {
      const e = err as { message?: string; status?: number; details?: string[] };
      return {
        ok: false,
        error: e.status === 401 ? 'That admin token was rejected.' : (e.message ?? 'Save failed.'),
        details: e.details,
      };
    }
  }, []);

  const reset = useCallback(async (): Promise<SaveResult> => {
    if (!apiEnabled) {
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* nothing useful to do */
      }
      setPrices(DEFAULT_PRICES);
      return { ok: true };
    }

    const token = readAdminToken();
    if (!token) return { ok: false, error: 'Enter the admin token before resetting.' };

    try {
      setPrices(await resetPricesRemote(token));
      return { ok: true };
    } catch (err) {
      const e = err as { message?: string; status?: number };
      return {
        ok: false,
        error: e.status === 401 ? 'That admin token was rejected.' : (e.message ?? 'Reset failed.'),
      };
    }
  }, []);

  return { prices, save, reset, source, loading };
}
