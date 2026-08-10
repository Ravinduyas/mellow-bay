import {
  BookingSelection,
  Enquiry,
  EnquiryStatus,
  PriceConfig,
  Quote,
} from '@mellow-bay/booking-engine';

/**
 * Client for the booking API.
 *
 * The API is optional. Set VITE_API_URL to point the site at a running backend;
 * with it unset the site falls back to bundled defaults and browser storage, so
 * the statically-hosted build keeps working with no server behind it.
 */

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

/** Whether a backend is configured for this build. */
export const apiEnabled = BASE.length > 0;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    // fetch only rejects on network-level failure, which the caller must be
    // able to tell apart from a 4xx in order to fall back.
    throw new ApiError('Could not reach the booking service.', 0);
  }

  const body = (await res.json().catch(() => null)) as
    | (T & { error?: string; details?: string[] })
    | null;

  if (!res.ok) {
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status, body?.details ?? []);
  }
  return body as T;
}

export const fetchPrices = () => request<PriceConfig>('/api/prices');

export const savePricesRemote = (config: PriceConfig, token: string) =>
  request<PriceConfig>('/api/prices', {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(config),
  });

export const resetPricesRemote = (token: string) =>
  request<PriceConfig>('/api/prices/reset', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  });

/** Server-side quote. The browser's own total is only ever a preview. */
export const fetchQuote = (selection: BookingSelection) =>
  request<{ selection: BookingSelection; quote: Quote }>('/api/quote', {
    method: 'POST',
    body: JSON.stringify(selection),
  });

export const submitEnquiry = (selection: BookingSelection) =>
  request<Enquiry>('/api/enquiries', {
    method: 'POST',
    body: JSON.stringify(selection),
  });

export interface EnquiryStats {
  total: number;
  byStatus: Record<string, number>;
  confirmedValue: number;
  pipelineValue: number;
  currency: string;
}

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

export const listEnquiriesRemote = (token: string) =>
  request<Enquiry[]>('/api/enquiries', { headers: bearer(token) });

export const fetchStatsRemote = (token: string) =>
  request<EnquiryStats>('/api/enquiries/stats', { headers: bearer(token) });

export const patchEnquiryRemote = (
  id: string,
  patch: { status?: EnquiryStatus; staffNotes?: string },
  token: string,
) =>
  request<Enquiry>(`/api/enquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: bearer(token),
    body: JSON.stringify(patch),
  });
