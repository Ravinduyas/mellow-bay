# Booking API

Express + TypeScript service behind the booking engine. Owns prices, computes
quotes and records enquiries.

```bash
cp .env.example .env          # then set ADMIN_TOKEN
npm run dev -w @mellow-bay/backend
```

Pricing itself lives in `@mellow-bay/booking-engine`, shared with the frontend
so a stay is priced identically on both sides.

## Endpoints

| Method | Path                 | Auth  | Purpose                                  |
| ------ | -------------------- | ----- | ---------------------------------------- |
| GET    | `/api/health`        | —     | Liveness, and whether admin is configured |
| GET    | `/api/prices`        | —     | Current price config                     |
| PUT    | `/api/prices`        | admin | Replace the price config                 |
| POST   | `/api/prices/reset`  | admin | Restore defaults                         |
| POST   | `/api/quote`         | —     | Price a selection                        |
| POST   | `/api/enquiries`     | —     | Submit an enquiry                        |
| GET    | `/api/enquiries`     | admin | List enquiries, newest first             |

Admin routes take `Authorization: Bearer <ADMIN_TOKEN>`.

## The rule that shapes this service

**The client never sends a price.** It sends a selection; the server prices it
from its own config. A total echoed back from the browser would be trivially
editable, so `/api/enquiries` reprices before storing and keeps its own figure.

Two consequences worth knowing:

- `ADMIN_TOKEN` unset means admin routes return **503**, not "open". A
  misconfigured deploy fails closed.
- Room capacity is enforced from the live config, so a client cannot book
  twenty people into a double by editing the request.

## Storage

JSON files under `DATA_DIR` (default `backend/data/`), written via
write-temp-then-rename so a crash mid-write cannot leave a truncated price file.
Enquiry writes are serialised through a promise chain so concurrent submissions
cannot clobber each other.

The store is deliberately the only module that knows about persistence —
`src/store.ts` is the seam to reimplement for Postgres, and nothing else needs
to change.

`prices.json` is revalidated on read: it is hand-editable, and a config that has
drifted out of shape falls back to defaults with a logged error rather than
quoting `NaN`.

## Checks

```bash
npm test -w @mellow-bay/booking-engine   # pricing + validators
npm run smoke -w @mellow-bay/backend     # API against a real port
```

The smoke test runs against a throwaway data directory, so it never touches
saved prices.

## Not done yet

- No rate limiting. Add one before exposing `/api/enquiries` publicly.
- A single shared admin token, not user accounts.
- Enquiries are stored, not emailed — nothing notifies staff of a new one.
