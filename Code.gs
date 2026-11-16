/**
 * IMPACT SERVICE CENTER - Garage Management System
 * Google Apps Script Backend (Web App)
 */

const SPREADSHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';
const INVENTORY_SHEET = 'Inventory';
const PURCHASES_SHEET = 'Purchases';
const DAILYSALES_SHEET = 'DailySales';
const WORKSHOPREPAIRS_SHEET = 'WorkshopRepairs';
const REPAIRPARTS_SHEET = 'RepairParts';
const CUSTOMERS_SHEET = 'Customers';
const SUPPLIERS_SHEET = 'Suppliers';
const STOCKMOVEMENTS_SHEET = 'StockMovements';
const USERS_SHEET = 'Users';
const AUDITLOGS_SHEET = 'AuditLogs';
const SETTINGS_SHEET = 'Settings';

const INVENTORY_COLS = ['id', 'code', 'name', 'category', 'open', 'min', 'cost', 'price', 'supplier', 'photo'];
const PURCHASES_COLS = ['id', 'date', 'code', 'qty', 'cost', 'supplier', 'ref'];
const DAILYSALES_COLS = ['id', 'date', 'code', 'qty', 'price', 'customer', 'ref', 'repairId', 'labour'];
const WORKSHOPREPAIRS_COLS = ['id', 'date', 'job', 'customer', 'vehicle', 'work', 'code', 'qty', 'price', 'labour'];
const REPAIRPARTS_COLS = ['id', 'date', 'repairId', 'job', 'code', 'qty', 'price', 'labour'];
const CUSTOMERS_COLS = ['id', 'name', 'phone', 'email', 'notes'];
const SUPPLIERS_COLS = ['id', 'name', 'phone', 'email', 'notes'];
const STOCKMOVEMENTS_COLS = ['id', 'date', 'type', 'code', 'qty', 'ref', 'balance', 'note'];
const USERS_COLS = ['id', 'email', 'name', 'role', 'pin', 'active', 'createdAt'];
const AUDITLOGS_COLS = ['id', 'at', 'actor', 'action', 'detail'];
const SETTINGS_COLS = ['key', 'value'];

function withScope(sheetName, fn) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Missing sheet: ' + sheetName);
  const rows = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).getValues();
  const header = rows.length ? rows[0].map(v => String(v || '').trim()) : [];
  const data = rows.slice(1).filter(r => r[0] !== '' && r[0] !== null).map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
  return { sh: sh, header: header, data: data, fn: fn(data, header, sh) };
}

function writeTable(sheetName, rows, columns) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Missing sheet: ' + sheetName);
  sh.clearContents();
  sh.getRange(1, 1, 1, columns.length).setValues([columns]);
  if (rows.length) {
    sh.getRange(2, 1, rows.length, columns.length).setValues(rows.map(r => columns.map(c => (r[c] === undefined || r[c] === null) ? '' : r[c])));
  }
  return { ok: true, rows: rows.length };
}

function toNumber(v, fallback) { const n = Number(v); return isFinite(n) ? n : (fallback === undefined ? 0 : fallback); }
function toText(v) { return v === undefined || v === null ? '' : String(v); }
function toDate(v) { const s = toText(v); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : new Date().toISOString().slice(0, 10); }
function uid(prefix) { return prefix + '_' + Utilities.getUuid(); }

function stockOf(item, purchases, sales, repairs) {
  const open = toNumber(item.open, 0);
  const purchased = purchases.filter(r => r.code === item.code).reduce((a, r) => a + toNumber(r.qty, 0), 0);
  const sold = sales.filter(r => r.code === item.code && !r.repairId).reduce((a, r) => a + toNumber(r.qty, 0), 0);
  const repaired = repairs.filter(r => r.code === item.code).reduce((a, r) => a + toNumber(r.qty, 0), 0);
  return open + purchased - sold - repaired;
}

function audit(actor, action, detail) {
  try {
    const got = withScope(AUDITLOGS_SHEET, (rows) => { rows.push({ id: uid('log'), at: new Date().toISOString(), actor: actor, action: action, detail: detail }); return rows; });
    writeTable(AUDITLOGS_SHEET, got, AUDITLOGS_COLS);
  } catch (err) { }
}

function getSetting(key, fallback) {
  const v = withScope(SETTINGS_SHEET, (rows) => { const hit = rows.find(r => toText(r.key) === key); return hit ? toText(hit.value) : fallback; });
  return v;
}

function handleGetAll() {
  const data = {};
  data.items = [];
  data.purchases = [];
  data.sales = [];
  data.repairs = [];
  data.customers = [];
  data.suppliers = [];
  const map = { 'Inventory': 'items', 'Purchases': 'purchases', 'DailySales': 'sales', 'WorkshopRepairs': 'repairs', 'RepairParts': 'repairParts', 'Customers': 'customers', 'Suppliers': 'suppliers' };
  Object.keys(map).forEach(name => {
    const got = withScope(name, (rows) => rows);
    data[map[name]] = got;
  });
  return data;
}

function doPost(e) {
  const body = (e && e.postData && e.postData.contents) ? (() => { try { return JSON.parse(e.postData.contents); } catch (err) { return e.parameter || {}; } })() : (e.parameter || {});
  const action = toText(body.action);
  const actor = toText(body.actor || 'system');

  if (action === 'getAll') return ContentService.createTextOutput(JSON.stringify(handleGetAll())).setMimeType(ContentService.MimeType.JSON);

  if (action === 'saveAll') {
    const d = body.data || {};
    writeTable(INVENTORY_SHEET, d.items || [], INVENTORY_COLS);
    writeTable(PURCHASES_SHEET, d.purchases || [], PURCHASES_COLS);
    writeTable(DAILYSALES_SHEET, d.sales || [], DAILYSALES_COLS);
    writeTable(WORKSHOPREPAIRS_SHEET, d.repairs || [], WORKSHOPREPAIRS_COLS);
    writeTable(REPAIRPARTS_SHEET, d.repairParts || [], REPAIRPARTS_COLS);
    writeTable(CUSTOMERS_SHEET, d.customers || [], CUSTOMERS_COLS);
    writeTable(SUPPLIERS_SHEET, d.suppliers || [], SUPPLIERS_COLS);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'addItem') {
    const it = body.item || {};
    const row = Object.assign({ id: uid('itm'), open: 0, min: 2, cost: 0, price: 0 }, it, { id: it.id || uid('itm') });
    const got = withScope(INVENTORY_SHEET, (rows) => { rows.push(row); return rows; });
    audit(actor, 'ITEM_CREATE', 'Created inventory item ' + row.code);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, row: row })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'updateItem') {
    const it = body.item || {};
    const got = withScope(INVENTORY_SHEET, (rows) => { const i = rows.findIndex(r => toText(r.id) === toText(it.id)); if (i < 0) throw new Error('Item not found'); rows[i] = Object.assign({}, rows[i], it); return rows; });
    audit(actor, 'ITEM_UPDATE', 'Updated inventory item ' + it.code);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'deleteItem') {
    const id = toText(body.id);
    const got = withScope(INVENTORY_SHEET, (rows) => { const before = rows.length; const next = rows.filter(r => toText(r.id) !== id); writeTable(INVENTORY_SHEET, next, INVENTORY_COLS); return { before: before, next: next }; });
    audit(actor, 'ITEM_DELETE', 'Deleted inventory item ' + id);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'addPurchase') {
    const p = body.purchase || {};
    p.id = p.id || uid('pur');
    p.date = toDate(p.date);
    const got = withScope(PURCHASES_SHEET, (rows) => { rows.push(p); return rows; });
    audit(actor, 'PURCHASE_CREATE', 'Purchase ' + p.ref + ' qty ' + p.qty);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, row: p })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'addSale') {
    const s = body.sale || {};
    s.id = s.id || uid('sal');
    s.date = toDate(s.date);
    const got = withScope(DAILYSALES_SHEET, (rows) => { rows.push(s); return rows; });
    audit(actor, 'SALE_CREATE', 'Sale ' + (s.ref || s.code) + ' qty ' + s.qty);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, row: s })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'addRepair') {
    const r = body.repair || {};
    r.id = r.id || uid('rep');
    r.date = toDate(r.date);
    const got = withScope(WORKSHOPREPAIRS_SHEET, (rows) => { rows.push(r); return rows; });
    if (r.code) {
      const rp = Object.assign({ id: uid('rpart'), date: r.date, repairId: r.id, job: r.job, code: r.code, qty: r.qty, price: r.price, labour: r.labour }, body.repairPart || {});
      withScope(REPAIRPARTS_SHEET, (rows2) => { rows2.push(rp); return rows2; });
    }
    audit(actor, 'REPAIR_CREATE', 'Repair ' + (r.job || '') + ' qty ' + r.qty);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, row: r })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'deleteRecord') {
    const key = toText(body.key);
    const id = toText(body.id);
    const map = { purchases: PURCHASES_SHEET, sales: DAILYSALES_SHEET, repairs: WORKSHOPREPAIRS_SHEET, repairParts: REPAIRPARTS_SHEET, customers: CUSTOMERS_SHEET, suppliers: SUPPLIERS_SHEET, items: INVENTORY_SHEET };
    const sheetName = map[key];
    if (!sheetName) throw new Error('Unknown record key');
    const cols = INVENTORY_SHEET === sheetName ? INVENTORY_COLS : PURCHASES_SHEET === sheetName ? PURCHASES_COLS : DAILYSALES_SHEET === sheetName ? DAILYSALES_COLS : WORKSHOPREPAIRS_SHEET === sheetName ? WORKSHOPREPAIRS_COLS : REPAIRPARTS_SHEET === sheetName ? REPAIRPARTS_COLS : CUSTOMERS_SHEET === sheetName ? CUSTOMERS_COLS : SUPPLIERS_SHEET === sheetName ? SUPPLIERS_COLS : INVENTORY_COLS;
    const got = withScope(sheetName, (rows) => { const before = rows.length; const next = rows.filter(r => toText(r.id) !== id); writeTable(sheetName, next, cols); return { before: before, next: next }; });
    audit(actor, 'RECORD_DELETE', 'Deleted ' + key + ' ' + id);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'auth') { const res = handleAuth(toText(body.email), toText(body.pin), toText(body.name || ''), toText(body.role || '')); return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON); }  if (action === 'addUser') { const res = addUser(body.user || {}); return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON); }  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
}

function handleAuth(email, pin, name, role) { const users = withScope(USERS_SHEET, (rows) => rows); const u = users.find(r => toText(r.email) === toText(email)); if (!u) return { ok: false, error: 'User not found' }; if (toText(u.active) === 'false') return { ok: false, error: 'User inactive' }; const pinOk = toText(u.pin) === toText(String(pin)); const isAdmin = toText(u.role) === 'admin' || toText(u.role) === 'owner'; if (!pinOk) return { ok: false, error: 'Invalid PIN' }; if (toText(role) !== 'admin' && !isAdmin) return { ok: false, error: 'Admin access required' }; return { ok: true, user: { email: toText(u.email), name: toText(u.name), role: toText(u.role) } }; } function addUser(u) { const row = { id: uid('usr'), email: toText(u.email), name: toText(u.name), role: toText(u.role || 'employee'), pin: toText(u.pin || ''), active: u.active === undefined ? true : !!u.active, createdAt: new Date().toISOString() }; const got = withScope(USERS_SHEET, (rows) => { rows.push(row); return rows; }); return { ok: true, user: row }; } function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'Impact Service Center Garage API', time: new Date().toISOString() })).setMimeType(ContentService.MimeType.JSON);
}