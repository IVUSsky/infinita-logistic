const db = require('../database/db')

exports.getByTracking = (req, res) => {
  const { number } = req.params
  const shipment = db.prepare(`
    SELECT s.id, s.tracking_number, s.status, s.direction,
           s.origin_country, s.origin_city, s.dest_country, s.dest_city,
           s.sender_name, s.recipient_name, s.description, s.weight_kg,
           s.transport_type, s.estimated_delivery, s.actual_delivery,
           c.name AS courier_name
    FROM shipments s LEFT JOIN couriers c ON s.courier_id = c.id
    WHERE s.tracking_number = ?
  `).get(number)
  if (!shipment) return res.status(404).json({ error: 'Пратката не е намерена' })

  const events = db.prepare(`
    SELECT te.*, u.first_name||' '||u.last_name AS user_name
    FROM tracking_events te LEFT JOIN users u ON te.created_by = u.id
    WHERE te.shipment_id = ? ORDER BY te.timestamp ASC
  `).all(shipment.id)

  res.json({ ...shipment, events })
}

exports.addEvent = (req, res) => {
  const { shipment_id, status, location, description, timestamp } = req.body
  if (!shipment_id || !description) return res.status(400).json({ error: 'Пратката и описанието са задължителни' })
  const result = db.prepare(`INSERT INTO tracking_events (shipment_id, status, location, description, timestamp, created_by) VALUES (?,?,?,?,?,?)`)
    .run(shipment_id, status||null, location||null, description, timestamp||new Date().toISOString(), req.user.id)

  if (status) {
    db.prepare("UPDATE shipments SET status=?, updated_at=datetime('now') WHERE id=?").run(status, shipment_id)
  }
  res.status(201).json({ id: result.lastInsertRowid })
}

exports.updateEvent = (req, res) => {
  const { status, location, description, timestamp } = req.body
  db.prepare('UPDATE tracking_events SET status=?,location=?,description=?,timestamp=? WHERE id=?')
    .run(status||null, location||null, description, timestamp, req.params.id)
  res.json({ message: 'Събитието е обновено' })
}

exports.deleteEvent = (req, res) => {
  db.prepare('DELETE FROM tracking_events WHERE id = ?').run(req.params.id)
  res.json({ message: 'Събитието е изтрито' })
}

exports.listAll = (req, res) => {
  const { status, limit = 10 } = req.query
  let query = `
    SELECT te.*, s.tracking_number, s.sender_name, s.recipient_name
    FROM tracking_events te JOIN shipments s ON te.shipment_id = s.id
  `
  const params = []
  if (status) { query += ' WHERE te.status = ?'; params.push(status) }
  query += ' ORDER BY te.timestamp DESC LIMIT ?'
  params.push(parseInt(limit))
  res.json(db.prepare(query).all(...params))
}
