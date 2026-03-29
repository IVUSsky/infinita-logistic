const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_PATH = process.env.DB_PATH || './database/infinita.db'
const dbDir = path.dirname(path.resolve(DB_PATH))
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

const db = new Database(path.resolve(DB_PATH))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    UNIQUE NOT NULL,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'employee' CHECK(role IN ('admin','manager','employee')),
    first_name  TEXT    NOT NULL,
    last_name   TEXT    NOT NULL,
    department  TEXT,
    phone       TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    last_login  TEXT
  );

  CREATE TABLE IF NOT EXISTS couriers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL UNIQUE,
    contact_name TEXT,
    email        TEXT,
    phone        TEXT,
    website      TEXT,
    notes        TEXT,
    active       INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS courier_rates (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    courier_id       INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
    transport_type   TEXT    NOT NULL CHECK(transport_type IN ('air','sea','road','express')),
    origin_country   TEXT    NOT NULL,
    dest_country     TEXT    NOT NULL,
    weight_from      REAL    NOT NULL DEFAULT 0,
    weight_to        REAL    NOT NULL,
    price_per_kg     REAL    NOT NULL,
    min_price        REAL    NOT NULL DEFAULT 0,
    currency         TEXT    NOT NULL DEFAULT 'EUR',
    transit_days     INTEGER,
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS hs_codes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    code            TEXT    NOT NULL UNIQUE,
    description_bg  TEXT    NOT NULL,
    description_en  TEXT,
    category        TEXT    NOT NULL,
    duty_rate       REAL    NOT NULL DEFAULT 0,
    vat_rate        REAL    NOT NULL DEFAULT 20,
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shipments (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number    TEXT    UNIQUE NOT NULL,
    status             TEXT    NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending','confirmed','in_transit','customs','delivered','cancelled','returned')),
    direction          TEXT    NOT NULL DEFAULT 'import' CHECK(direction IN ('import','export')),
    origin_country     TEXT    NOT NULL,
    origin_city        TEXT,
    dest_country       TEXT    NOT NULL,
    dest_city          TEXT,
    sender_name        TEXT    NOT NULL,
    sender_address     TEXT,
    recipient_name     TEXT    NOT NULL,
    recipient_address  TEXT,
    courier_id         INTEGER REFERENCES couriers(id),
    transport_type     TEXT    CHECK(transport_type IN ('air','sea','road','express')),
    weight_kg          REAL,
    length_cm          REAL,
    width_cm           REAL,
    height_cm          REAL,
    packages_count     INTEGER NOT NULL DEFAULT 1,
    hs_code            TEXT,
    description        TEXT,
    declared_value     REAL,
    currency           TEXT    NOT NULL DEFAULT 'EUR',
    freight_cost       REAL,
    insurance_cost     REAL,
    customs_duty       REAL,
    total_cost         REAL,
    invoice_number     TEXT,
    po_number          TEXT,
    notes              TEXT,
    assigned_to        INTEGER REFERENCES users(id),
    created_by         INTEGER REFERENCES users(id),
    created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at         TEXT    NOT NULL DEFAULT (datetime('now')),
    estimated_delivery TEXT,
    actual_delivery    TEXT
  );

  CREATE TABLE IF NOT EXISTS tracking_events (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id  INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status       TEXT    NOT NULL,
    location     TEXT,
    description  TEXT    NOT NULL,
    timestamp    TEXT    NOT NULL DEFAULT (datetime('now')),
    created_by   INTEGER REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS financial_records (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    type           TEXT    NOT NULL CHECK(type IN ('invoice','expense','payment','refund')),
    shipment_id    INTEGER REFERENCES shipments(id),
    amount         REAL    NOT NULL,
    currency       TEXT    NOT NULL DEFAULT 'EUR',
    amount_bgn     REAL,
    description    TEXT    NOT NULL,
    category       TEXT,
    courier_id     INTEGER REFERENCES couriers(id),
    invoice_number TEXT,
    due_date       TEXT,
    paid_date      TEXT,
    status         TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','overdue','cancelled')),
    created_by     INTEGER REFERENCES users(id),
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_shipments_status   ON shipments(status);
  CREATE INDEX IF NOT EXISTS idx_shipments_courier  ON shipments(courier_id);
  CREATE INDEX IF NOT EXISTS idx_tracking_shipment  ON tracking_events(shipment_id);
  CREATE INDEX IF NOT EXISTS idx_financial_shipment ON financial_records(shipment_id);
`)

module.exports = db
