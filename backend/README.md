# Pharmacy Expiry Backend

Standalone TypeScript API with JSON-file persistence for the P02 Pharmacy
Expiry Shelf Check.

## Setup

```bash
npm install
copy .env.example .env
npm run data:seed
npm run dev
```

The seed command selects `PUB-12` from the provided public dataset and writes 44
records to `data/medicines.json`. The API persists return actions in that working
file. The server starts on `http://localhost:4000`.

## API

- `GET /health`
- `GET /api/medicines`
- `GET /api/medicines?status=expired`
- `GET /api/medicines?search=napa`
- `GET /api/dashboard`
- `GET /api/returns`
- `PATCH /api/medicines/:id/return`

Expiry groups are calculated from the current date in `Asia/Dhaka`:

- fewer than 0 days: expired
- 0–30 days inclusive: expiring soon
- 31–90 days inclusive: expiring within 90 days
- more than 90 days: safe

Returned medicines remain in the same table with `returned_at` set and are
excluded from all active counts and value totals. This file-based persistence is
intended for a single-process hackathon demo; deploy it on a host with a writable,
persistent filesystem.
