const db = require('../database/db')

exports.list = (req, res) => {
  const couriers = db.prepare('SELECT * FROM couriers ORDER BY name').all()
  res.json(couriers)
}

exports.get = (req, res) => {
  const courier = db.prepare('SELECT * FROM couriers WHERE id = ?').get(req.params.id)
  if (!courier) return res.status(404).json({ error: 'Куриерът не е намерен' })
  const rates = db.prepare('SELECT * FROM courier_rates WHERE courier_id = ? ORDER BY transport_type, origin_country, weight_from').all(req.params.id)
  res.json({ ...courier, rates })
}

exports.create = (req, res) => {
  const { name, contact_name, email, phone, website, notes } = req.body
  if (!name) return res.status(400).json({ error: 'Името е задължително' })
  try {
    const result = db.prepare(`INSERT INTO couriers (name, contact_name, email, phone, website, notes) VALUES (?,?,?,?,?,?)`)
      .run(name, contact_name||null, email||null, phone||null, website||null, notes||null)
    res.status(201).json({ id: result.lastInsertRowid })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Куриер с това име вече съществува' })
    throw e
  }
}

exports.update = (req, res) => {
  const { name, contact_name, email, phone, website, notes, active } = req.body
  const r = db.prepare(`UPDATE couriers SET name=?,contact_name=?,email=?,phone=?,website=?,notes=?,active=? WHERE id=?`)
    .run(name, contact_name||null, email||null, phone||null, website||null, notes||null, active??1, req.params.id)
  if (!r.changes) return res.status(404).json({ error: 'Куриерът не е намерен' })
  res.json({ message: 'Куриерът е обновен' })
}

// ─── Тарифи ───────────────────────────────────────────────────────────────────

exports.listRates = (req, res) => {
  const rates = db.prepare(`
    SELECT cr.*, c.name AS courier_name
    FROM courier_rates cr JOIN couriers c ON cr.courier_id = c.id
    ORDER BY c.name, cr.transport_type
  `).all()
  res.json(rates)
}

exports.upsertRate = (req, res) => {
  const { courier_id, transport_type, origin_country, dest_country, weight_from, weight_to, price_per_kg, min_price, currency, transit_days } = req.body
  if (req.params.rateId) {
    db.prepare(`UPDATE courier_rates SET courier_id=?,transport_type=?,origin_country=?,dest_country=?,weight_from=?,weight_to=?,price_per_kg=?,min_price=?,currency=?,transit_days=?,updated_at=datetime('now') WHERE id=?`)
      .run(courier_id, transport_type, origin_country, dest_country, weight_from, weight_to, price_per_kg, min_price||0, currency||'EUR', transit_days||null, req.params.rateId)
    return res.json({ message: 'Тарифата е обновена' })
  }
  const result = db.prepare(`INSERT INTO courier_rates (courier_id,transport_type,origin_country,dest_country,weight_from,weight_to,price_per_kg,min_price,currency,transit_days) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(courier_id, transport_type, origin_country, dest_country, weight_from||0, weight_to, price_per_kg, min_price||0, currency||'EUR', transit_days||null)
  res.status(201).json({ id: result.lastInsertRowid })
}

exports.deleteRate = (req, res) => {
  db.prepare('DELETE FROM courier_rates WHERE id = ?').run(req.params.rateId)
  res.json({ message: 'Тарифата е изтрита' })
}

// ─── Сравнение ────────────────────────────────────────────────────────────────

exports.compare = (req, res) => {
  const { origin_country, dest_country, weight, transport_type } = req.query
  if (!origin_country || !dest_country || !weight) {
    return res.status(400).json({ error: 'Попълнете произход, дестинация и тегло' })
  }
  const w = parseFloat(weight)
  let query = `
    SELECT cr.*, c.name AS courier_name, c.email AS courier_email, c.phone AS courier_phone,
      CASE WHEN cr.price_per_kg * ? < cr.min_price THEN cr.min_price ELSE cr.price_per_kg * ? END AS calculated_price
    FROM courier_rates cr
    JOIN couriers c ON cr.courier_id = c.id
    WHERE cr.origin_country = ? AND cr.dest_country = ?
      AND cr.weight_from <= ? AND cr.weight_to >= ?
      AND c.active = 1
  `
  const params = [w, w, origin_country, dest_country, w, w]
  if (transport_type) { query += ' AND cr.transport_type = ?'; params.push(transport_type) }
  query += ' ORDER BY calculated_price ASC'
  const results = db.prepare(query).all(...params)
  res.json(results)
}
