import { timingSafeEqual } from 'node:crypto';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import {
  ENQUIRY_STATUSES,
  EnquiryStatus,
  quote as computeQuote,
  validateEnquiryContact,
  validatePriceConfig,
  validateSelection,
} from '@mellow-bay/booking-engine';
import {
  enquiryStats,
  getEnquiry,
  listEnquiries,
  loadPrices,
  resetPrices,
  saveEnquiry,
  savePrices,
  updateEnquiry,
} from './store.js';

/**
 * The API.
 *
 * The one rule that shapes everything here: the client never sends a price.
 * It sends a selection, and the server prices it from its own config. A quote
 * echoed back from the browser would be trivially editable.
 */

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? '';

/**
 * Constant-time compare so a token cannot be recovered a character at a time by
 * timing the response. Lengths are compared first because timingSafeEqual
 * throws on a length mismatch.
 */
function tokenMatches(provided: string): boolean {
  if (!ADMIN_TOKEN) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(ADMIN_TOKEN);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!ADMIN_TOKEN) {
    // Failing closed: an unset token must not mean "no auth required", or a
    // misconfigured deploy would silently expose price writes to the world.
    res.status(503).json({
      error: 'Admin access is not configured. Set ADMIN_TOKEN on the server.',
    });
    return;
  }

  const header = req.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!provided || !tokenMatches(provided)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

/** Async handlers that reject would otherwise hang the request in Express 4. */
const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export function createApp() {
  const app = express();

  // The frontend is served from a different origin (GitHub Pages) than the API,
  // so the allowed origins have to be explicit. Comma-separated, or "*" to
  // allow any — the latter is fine here because no endpoint uses cookies.
  const origins = (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(cors({ origin: origins.includes('*') ? true : origins }));

  // Bounded so a large body cannot be used to exhaust memory.
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, adminConfigured: Boolean(ADMIN_TOKEN) });
  });

  /* ----------------------------------------------------------- prices ---- */

  app.get(
    '/api/prices',
    wrap(async (_req, res) => {
      res.json(await loadPrices());
    }),
  );

  app.put(
    '/api/prices',
    requireAdmin,
    wrap(async (req, res) => {
      const result = validatePriceConfig(req.body);
      if (!result.ok) {
        res.status(400).json({ error: 'Invalid price config', details: result.errors });
        return;
      }
      await savePrices(result.value);
      res.json(result.value);
    }),
  );

  app.post(
    '/api/prices/reset',
    requireAdmin,
    wrap(async (_req, res) => {
      res.json(await resetPrices());
    }),
  );

  /* ------------------------------------------------------------ quote ---- */

  app.post(
    '/api/quote',
    wrap(async (req, res) => {
      const prices = await loadPrices();
      const result = validateSelection(req.body, prices);
      if (!result.ok) {
        res.status(400).json({ error: 'Invalid selection', details: result.errors });
        return;
      }
      res.json({ selection: result.value, quote: computeQuote(result.value, prices) });
    }),
  );

  /* -------------------------------------------------------- enquiries ---- */

  app.post(
    '/api/enquiries',
    wrap(async (req, res) => {
      const prices = await loadPrices();
      const result = validateSelection(req.body, prices);
      if (!result.ok) {
        res.status(400).json({ error: 'Invalid selection', details: result.errors });
        return;
      }

      const contactErrors = validateEnquiryContact(result.value);
      if (contactErrors.length) {
        res.status(400).json({ error: 'Invalid contact details', details: contactErrors });
        return;
      }

      // Priced here, from server-side config — whatever total the browser was
      // showing is not consulted.
      const priced = computeQuote(result.value, prices);
      const enquiry = await saveEnquiry(result.value, priced);
      res.status(201).json(enquiry);
    }),
  );

  app.get(
    '/api/enquiries',
    requireAdmin,
    wrap(async (_req, res) => {
      res.json(await listEnquiries());
    }),
  );

  app.get(
    '/api/enquiries/stats',
    requireAdmin,
    wrap(async (_req, res) => {
      res.json(await enquiryStats());
    }),
  );

  app.get(
    '/api/enquiries/:id',
    requireAdmin,
    wrap(async (req, res) => {
      const found = await getEnquiry(req.params.id);
      if (!found) {
        res.status(404).json({ error: 'Enquiry not found' });
        return;
      }
      res.json(found);
    }),
  );

  app.patch(
    '/api/enquiries/:id',
    requireAdmin,
    wrap(async (req, res) => {
      const body = (req.body ?? {}) as { status?: unknown; staffNotes?: unknown };
      const errors: string[] = [];

      let status: EnquiryStatus | undefined;
      if (body.status !== undefined) {
        if (typeof body.status !== 'string' || !ENQUIRY_STATUSES.includes(body.status as EnquiryStatus)) {
          errors.push(`status must be one of: ${ENQUIRY_STATUSES.join(', ')}`);
        } else {
          status = body.status as EnquiryStatus;
        }
      }

      let staffNotes: string | undefined;
      if (body.staffNotes !== undefined) {
        if (typeof body.staffNotes !== 'string' || body.staffNotes.length > 4000) {
          errors.push('staffNotes must be a string of 4000 characters or fewer');
        } else {
          staffNotes = body.staffNotes;
        }
      }

      if (errors.length) {
        res.status(400).json({ error: 'Invalid update', details: errors });
        return;
      }
      if (status === undefined && staffNotes === undefined) {
        res.status(400).json({ error: 'Nothing to update' });
        return;
      }

      const updated = await updateEnquiry(req.params.id, { status, staffNotes });
      if (!updated) {
        res.status(404).json({ error: 'Enquiry not found' });
        return;
      }
      res.json(updated);
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Four-arg signature is what marks this as Express's error handler.
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[api] unhandled error:', err);
    // Never echo the message back — it can carry paths or internals.
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
