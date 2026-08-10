import { useCallback, useEffect, useState } from 'react';
import { BookingSelection, Enquiry, EnquiryStatus, Quote } from '@mellow-bay/booking-engine';
import {
  EnquiryStats,
  apiEnabled,
  listEnquiriesRemote,
  patchEnquiryRemote,
  submitEnquiry,
} from './api';
import { readAdminToken } from './store';

const KEY = 'mellow-bay.enquiries.v1';

/**
 * Enquiries, from the backend when one is configured and from browser storage
 * when not.
 *
 * The local half exists so the admin panel is not an empty shell on the static
 * build: a booking made in the browser is recorded there and shows up here with
 * the same shape the API returns. It is per-browser and obviously not a real
 * record — the panel says so rather than implying these reached anyone.
 */

function readLocal(): Enquiry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Shape-check rather than trust: this is hand-editable storage, and a
    // malformed row would crash the table that renders it.
    return parsed.filter(
      (e): e is Enquiry =>
        e && typeof e.id === 'string' && typeof e.createdAt === 'string' && e.selection && e.quote,
    );
  } catch {
    return [];
  }
}

function writeLocal(all: Enquiry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable — nothing useful to do */
  }
}

/** Records a locally-made booking. Only used when no API is configured. */
export function saveEnquiryLocal(selection: BookingSelection, quote: Quote): Enquiry {
  const enquiry: Enquiry = {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    selection,
    quote,
    status: 'new',
  };
  writeLocal([enquiry, ...readLocal()]);
  return enquiry;
}

/** Submit through whichever path this build has. */
export async function submit(selection: BookingSelection, quote: Quote): Promise<Enquiry> {
  if (apiEnabled) return submitEnquiry(selection);
  return saveEnquiryLocal(selection, quote);
}

export interface EnquiriesState {
  enquiries: Enquiry[];
  stats: EnquiryStats;
  loading: boolean;
  error: string | null;
  reload: () => void;
  update: (id: string, patch: { status?: EnquiryStatus; staffNotes?: string }) => Promise<boolean>;
}

/** Derived here rather than fetched, so local and remote agree on the numbers. */
function computeStats(all: Enquiry[]): EnquiryStats {
  const byStatus = all.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  return {
    total: all.length,
    byStatus,
    confirmedValue: all
      .filter((e) => e.status === 'confirmed')
      .reduce((sum, e) => sum + e.quote.total, 0),
    pipelineValue: all
      .filter((e) => e.status === 'new' || e.status === 'contacted')
      .reduce((sum, e) => sum + e.quote.total, 0),
    currency: all[0]?.quote.currency ?? 'EUR',
  };
}

export function useEnquiries(): EnquiriesState {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => (apiEnabled ? [] : readLocal()));
  const [loading, setLoading] = useState(apiEnabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!apiEnabled) {
      setEnquiries(readLocal());
      return;
    }

    const token = readAdminToken();
    if (!token) {
      setEnquiries([]);
      setLoading(false);
      setError('Enter the admin token to load enquiries.');
      return;
    }

    setLoading(true);
    listEnquiriesRemote(token)
      .then((all) => {
        setEnquiries(all);
        setError(null);
      })
      .catch((err: { status?: number; message?: string }) => {
        setEnquiries([]);
        setError(
          err.status === 401
            ? 'That admin token was rejected.'
            : (err.message ?? 'Could not load enquiries.'),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const update = useCallback(
    async (id: string, patch: { status?: EnquiryStatus; staffNotes?: string }) => {
      if (!apiEnabled) {
        const next = readLocal().map((e) =>
          e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
        );
        writeLocal(next);
        setEnquiries(next);
        return true;
      }

      const token = readAdminToken();
      if (!token) {
        setError('Enter the admin token before making changes.');
        return false;
      }

      try {
        const updated = await patchEnquiryRemote(id, patch, token);
        setEnquiries((all) => all.map((e) => (e.id === id ? updated : e)));
        setError(null);
        return true;
      } catch (err) {
        const e = err as { status?: number; message?: string };
        setError(
          e.status === 401 ? 'That admin token was rejected.' : (e.message ?? 'Update failed.'),
        );
        return false;
      }
    },
    [],
  );

  return { enquiries, stats: computeStats(enquiries), loading, error, reload: load, update };
}
