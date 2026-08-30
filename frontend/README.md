# Pharmacy Expiry Frontend

Responsive React dashboard for the P02 Pharmacy Expiry Shelf Check.

## Run locally

Start the backend first on port 4000, then:

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

Copy `.env.example` to `.env` only when the backend URL differs from the local
default.

## Required flows

- Four current-date expiry groups and active counts
- Expired and within-30-day value at risk in taka
- Search and group filtering
- Return-to-distributor confirmation and persistence
- Separate returned-stock view
