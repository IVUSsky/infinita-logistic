const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const path = require('path')
const fs = require('fs')

const DB_PATH = process.env.DB_PATH || './database/infinita.json'
const dbDir = path.dirname(path.resolve(DB_PATH))
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

const adapter = new FileSync(path.resolve(DB_PATH))
const db = low(adapter)

db.defaults({
  users: [],
  couriers: [],
  courier_rates: [],
  hs_codes: [],
  shipments: [],
  tracking_events: [],
  financial_records: []
}).write()

function nextId(collection) {
  const items = db.get(collection).value()
  if (!items || items.length === 0) return 1
  return Math.max(...items.map(i => i.id || 0)) + 1
}

function now() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

module.exports = { db, nextId, now }
