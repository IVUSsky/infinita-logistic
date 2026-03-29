const { db, nextId, now } = require('../database/db')

exports.getByTracking = (req, res) => {
  const { number } = req.params
  const shipment = db.get('shipments').find({ tracking_number: number }).value()
  if (!shipment) return res.status(404).json({ error: 'Пратката не е намерена' })

  const couriers = db.get('couriers').value()
  const courier = couriers.find(c => c.id === shipment.courier_id)
  const users = db.get('users').value()

  const events = db.get('tracking_events').filter(e => e.shipment_id === shipment.id).value()
    .map(e => {
      const u = users.find(u => u.id === e.created_by)
      return { ...e, user_name: u ? `${u.first_name} ${u.last_name}` : null }
    })
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))

  const result = {
    id: shipment.id,
    tracking_number: shipment.tracking_number,
    status: shipment.status,
    direction: shipment.direction,
    origin_country: shipment.origin_country,
    origin_city: shipment.origin_city,
    dest_country: shipment.dest_country,
    dest_city: shipment.dest_city,
    sender_name: shipment.sender_name,
    recipient_name: shipment.recipient_name,
    description: shipment.description,
    weight_kg: shipment.weight_kg,
    transport_type: shipment.transport_type,
    estimated_delivery: shipment.estimated_delivery,
    actual_delivery: shipment.actual_delivery,
    courier_name: courier ? courier.name : null
  }

  res.json({ ...result, events })
}

exports.addEvent = (req, res) => {
  const { shipment_id, status, location, description, timestamp } = req.body
  if (!shipment_id || !description) return res.status(400).json({ error: 'Пратката и описанието са задължителни' })

  const id = nextId('tracking_events')
  db.get('tracking_events').push({
    id,
    shipment_id,
    status: status || null,
    location: location || null,
    description,
    timestamp: timestamp || new Date().toISOString(),
    created_by: req.user.id
  }).write()

  if (status) {
    db.get('shipments').find({ id: shipment_id }).assign({ status, updated_at: now() }).write()
  }
  res.status(201).json({ id })
}

exports.updateEvent = (req, res) => {
  const id = parseInt(req.params.id)
  const { status, location, description, timestamp } = req.body
  db.get('tracking_events').find({ id }).assign({
    status: status || null,
    location: location || null,
    description,
    timestamp
  }).write()
  res.json({ message: 'Събитието е обновено' })
}

exports.deleteEvent = (req, res) => {
  const id = parseInt(req.params.id)
  db.get('tracking_events').remove({ id }).write()
  res.json({ message: 'Събитието е изтрито' })
}

exports.listAll = (req, res) => {
  const { status, limit = 10 } = req.query
  const shipments = db.get('shipments').value()

  let events = db.get('tracking_events').value()
  if (status) {
    events = events.filter(e => e.status === status)
  }

  const result = events
    .map(e => {
      const s = shipments.find(s => s.id === e.shipment_id)
      return {
        ...e,
        tracking_number: s ? s.tracking_number : null,
        sender_name: s ? s.sender_name : null,
        recipient_name: s ? s.recipient_name : null
      }
    })
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    .slice(0, parseInt(limit))

  res.json(result)
}
