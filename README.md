# PharmaShelf - Pharmacy Expiry Shelf Check (P02)

**Team ID:** T001  
**Problem ID:** P02  
**Start Code:** `LSH26-8490-C900`
**Live:** `https://lsh26-t001-p02.vercel.app/`
---

## 📌 Problem Overview
PharmaShelf is an end-to-end pharmacy inventory auditing and expiry management system built to tackle medicine waste, prevent expired dispensing, and streamline supplier returns.




---

## 🏗️ Architecture & Modules

The repository consists of 3 integrated applications:

```
lsh26-t001-p02/
├── backend/          # Node.js + Express 5 + TypeScript REST API
├── frontend/         # React 19 + Vite + TypeScript + Tailwind CSS Web App
├── streamlit_app/    # Python Streamlit Real-Time Analytics Dashboard
├── P02_pharmacy_expiry_public.json  # Benchmark dataset (20 test cases)
└── event.md          # Team and problem identification
```



## 📊 API Endpoints
- `GET /health` — Health check
- `GET /api/medicines` — Filterable medicine inventory (`?status=expired&search=napa&company=beximco`)
- `GET /api/dashboard` — Live KPI metrics & value-at-risk breakdown in BDT (৳)
- `GET /api/returns` — List of returned batches
- `PATCH /api/medicines/:id/return` — Mark batch as returned to vendor

---

## 🧪 Testing
```bash
cd backend
npm test
```
