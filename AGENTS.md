# AGENTS.md — IMPACT SERVICE CENTER (Garage Management System)

## Project
- Repo: https://github.com/yaanu06/garage-stock  ·  Branch `main`  ·  Local root `D:\garage`
- App entry: `index.html`  ·  Backend: `Code.gs` (Google Apps Script)
- Preview: http://localhost:8642/index.html (serve D:\garage on port 8642)

## Live / deployed
- Netlify: https://impact-service-center.netlify.app  (owner: yaanu06, auto-deploys from `main`)
- Google Sheet id: `1hZqZMD2wFi4qoMqmPQNLMo18x6jxXXCd8QjXogBE8f0`
- Apps Script `/exec` URL is hardcoded in `index.html` as `BACKEND_URL`

## Backend facts
- Web app URL: `https://script.google.com/macros/s/AKfycbyByuR8Ec-cGzjRi7c2j68dk9fdbDn5INUCnJ6eyz_M6TnCUrfD13I9-SIBtU6ObLaODQ/exec`
- Actions: `getAll`, `saveAll`, `addItem`, `updateItem`, `deleteItem`, `addPurchase`, `addSale`, `addRepair`, `addCustomer`, `addSupplier`, `addUser`, `auth`, `changePin`
- 11 sheets: Inventory, Purchases, DailySales, WorkshopRepairs, RepairParts, Customers, Suppliers, StockMovements, Users, AuditLogs, Settings

## Admin
- Server-side PIN validation; session kept in `sessionStorage`, not `localStorage`
- Default PIN (change it!): `impact123` — admin email `admin@impact.local`

## Do not do
- Do **not** re-run `initDatabase` in Apps Script — it clears all sheets by design.
- Local preview is plain **http://** — https on port 8642 throws EPROTO (TLS handshake).

## Notes
- Apps Script redeployed 2026-11-18 as **Version 3** (project id `1Ueg3u-IzPsRZZ3BN-YMZD2rU6UQifmZ3loCooVmLunalbcSeKz7r_BjJ`, `/u/2` account). `DAILYSALES_COLS` now includes `paid`; date cells normalize to `yyyy-MM-dd` server-side (`ndate`). Deployment URL unchanged.
- `index.html` normalizes dates client-side too, so the app works even if the backend reverted.
- Admin-only: inventory add/edit/delete, paid/credit toggle. Purchases and everything else are counter-level.
- Tabs: Inventory (includes Stock-In / Record Purchase), Payments (paid/credit tracking + invoice generator), Daily Sales (multi-item, service charges), Workshop Repairs, Customers, Suppliers, Daily Summary, Monthly Reports, Admin Panel, Backup.
- Invoice PDF: "Download PDF" in the Payments tab rasterises #invoiceView with html2canvas → jsPDF (`vendor.js`, lazy-loaded only on tap) and saves `Impact-Invoice-<ref>.pdf`. Print path is kept as a fallback. Do not rename `vendor.js` without updating `loadPdfLibs()` in index.html; do not edit it (regenerate from npm if updating jspdf/html2canvas).
- Single-file app: keep `index.html` self-contained. Sales schema is one row per line (item or `SRV: <service>`), shared `ref` groups a receipt.
- The 60 s backend sync no longer re-renders while the user has unsaved form input (`formDirty` guard); it applies silently and renders after the next save/submit.

## Tone / audience
- Small-business owner; app is used in a garage shop; simple, reliable interface.

## Local skills
- Skills live in `.agents/`, `.claude/`, `agent/` (HyperFrames + Ponytail + Taste Skill) — fresh session needed to register them.
