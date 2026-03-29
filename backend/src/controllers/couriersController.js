const { db, nextId, now } = require('../database/db')

exports.list = (req, res) => {
  const couriers = db.get('couriers').value().slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  res.json(couriers)
}

exports.get = (req, res) => {
  const id = parseInt(req.params.id)
  const courier = db.get('couriers').find({ id }).value()
  if (!courier) return res.status(404).json({ error: 'Куриерът не е намерен' })
  const rates = db.get('courier_rates').filter(r => r.courier_id === id).value()
    .slice().sort((a, b) => {
      if (a.transport_type < b.transport_type) return -1
      if (a.transport_type > b.transport_type) return 1
      if (a.origin_country < b.origin_country) return -1
      if (a.origin_country > b.origin_country) return 1
      return (a.weight_from || 0) - (b.weight_from || 0)
    })
  res.json({ ...courier, rates })
}

exports.create = (req, res) => {
  const { name, contact_name, email, phone, website, notes } = req.body
  if (!name) return res.status(400).json({ error: 'Името е задължително' })
  const existing = db.get('couriers').find(c => c.name === name).value()
  if (existing) return res.status(409).json({ error: 'Куриер с това име вече съществува' })
  const id = nextId('couriers')
  db.get('couriers').push({
    id,
    name,
    contact_name: contact_name || null,
    email: email || null,
    phone: phone || null,
    website: website || null,
    notes: notes || null,
    active: 1,
    created_at: now()
  }).write()
  res.status(201).json({ id })
}

exports.update = (req, res) => {
  const id = parseInt(req.params.id)
  const { name, contact_name, email, phone, website, notes, active } = req.body
  const courier = db.get('couriers').find({ id }).value()
  if (!courier) return res.status(404).json({ error: 'Куриерът не е намерен' })
  db.get('couriers').find({ id }).assign({
    name,
    contact_name: contact_name || null,
    email: email || null,
    phone: phone || null,
    website: website || null,
    notes: notes || null,
    active: active ?? 1
  }).write()
  res.json({ message: 'Куриерът е обновен' })
}

// ─── Тарифи ───────────────────────────────────────────────────────────────────

exports.listRates = (req, res) => {
  const couriers = db.get('couriers').value()
  const rates = db.get('courier_rates').value().map(r => {
    const courier = couriers.find(c => c.id === r.courier_id)
    return { ...r, courier_name: courier ? courier.name : null }
  }).sort((a, b) => {
    if (a.courier_name < b.courier_name) return -1
    if (a.courier_name > b.courier_name) return 1
    if (a.transport_type < b.transport_type) return -1
    if (a.transport_type > b.transport_type) return 1
    return 0
  })
  res.json(rates)
}

exports.upsertRate = (req, res) => {
  const { courier_id, transport_type, origin_country, dest_country, weight_from, weight_to, price_per_kg, min_price, currency, transit_days } = req.body
  if (req.params.rateId) {
    const rateId = parseInt(req.params.rateId)
    db.get('courier_rates').find({ id: rateId }).assign({
      courier_id,
      transport_type,
      origin_country,
      dest_country,
      weight_from,
      weight_to,
      price_per_kg,
      min_price: min_price || 0,
      currency: currency || 'EUR',
      transit_days: transit_days || null,
      updated_at: now()
    }).write()
    return res.json({ message: 'Тарифата е обновена' })
  }
  const id = nextId('courier_rates')
  db.get('courier_rates').push({
    id,
    courier_id,
    transport_type,
    origin_country,
    dest_country,
    weight_from: weight_from || 0,
    weight_to,
    price_per_kg,
    min_price: min_price || 0,
    currency: currency || 'EUR',
    transit_days: transit_days || null,
    updated_at: now()
  }).write()
  res.status(201).json({ id })
}

exports.deleteRate = (req, res) => {
  const rateId = parseInt(req.params.rateId)
  db.get('courier_rates').remove({ id: rateId }).write()
  res.json({ message: 'Тарифата е изтрита' })
}

// ─── Сравнение ────────────────────────────────────────────────────────────────

exports.compare = (req, res) => {
  const { origin_country, dest_country, weight, transport_type } = req.query
  if (!origin_country || !dest_country || !weight) {
    return res.status(400).json({ error: 'Попълнете произход, дестинация и тегло' })
  }
  const w = parseFloat(weight)
  const couriers = db.get('couriers').value()

  let rates = db.get('courier_rates').filter(r => {
    if (r.origin_country !== origin_country) return false
    if (r.dest_country !== dest_country) return false
    if (r.weight_from > w) return false
    if (r.weight_to < w) return false
    if (transport_type && r.transport_type !== transport_type) return false
    const courier = couriers.find(c => c.id === r.courier_id)
    if (!courier || courier.active !== 1) return false
    return true
  }).value()

  rates = rates.map(r => {
    const courier = couriers.find(c => c.id === r.courier_id)
    const calculated_price = Math.max(r.price_per_kg * w, r.min_price)
    return {
      ...r,
      courier_name: courier ? courier.name : null,
      courier_email: courier ? courier.email : null,
      courier_phone: courier ? courier.phone : null,
      calculated_price
    }
  }).sort((a, b) => a.calculated_price - b.calculated_price)

  res.json(rates)
}
