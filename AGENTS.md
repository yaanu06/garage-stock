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
- Code.gs (2026-11-17) normalizes date cells to `yyyy-MM-dd` server-side (`ndate`). Requires manual redeploy in Apps Script. index.html also normalizes dates client-side, so the app works either way.
- Single-file app: keep `index.html` self-contained. Sales schema is one row per item with a shared `ref` for multi-item receipts.

## Tone / audience
- Small-business owner; app is used in a garage shop; simple, reliable interface.

## Local skills
- Skills live in `.agents/`, `.claude/`, `agent/` (HyperFrames + Ponytail + Taste Skill) — fresh session needed to register them.
