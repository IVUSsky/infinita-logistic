const { db, nextId, now } = require('../database/db')
const { v4: uuidv4 } = require('uuid')
const { Parser } = require('json2csv')
const csv = require('csv-parser')
const { Readable } = require('stream')

function joinShipment(s, couriers, users) {
  const courier = couriers.find(c => c.id === s.courier_id)
  const assigned = users.find(u => u.id === s.assigned_to)
  const created = users.find(u => u.id === s.created_by)
  return {
    ...s,
    courier_name: courier ? courier.name : null,
    assigned_name: assigned ? `${assigned.first_name} ${assigned.last_name}` : null,
    created_name: created ? `${created.first_name} ${created.last_name}` : null
  }
}

exports.list = (req, res) => {
  const { status, direction, courier_id, search, country, page = 1, limit = 20 } = req.query

  let rows = db.get('shipments').value()

  if (status)     rows = rows.filter(s => s.status === status)
  if (direction)  rows = rows.filter(s => s.direction === direction)
  if (courier_id) rows = rows.filter(s => s.courier_id == courier_id)
  if (country)    rows = rows.filter(s => s.origin_country === country || s.dest_country === country)
  if (search) {
    const term = search.toLowerCase()
    rows = rows.filter(s =>
      (s.tracking_number && s.tracking_number.toLowerCase().includes(term)) ||
      (s.sender_name && s.sender_name.toLowerCase().includes(term)) ||
      (s.recipient_name && s.recipient_name.toLowerCase().includes(term)) ||
      (s.description && s.description.toLowerCase().includes(term))
    )
  }

  rows = rows.slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

  const total = rows.length
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const offset = (pageNum - 1) * limitNum
  const paged = rows.slice(offset, offset + limitNum)

  const couriers = db.get('couriers').value()
  const users = db.get('users').value()
  const data = paged.map(s => joinShipment(s, couriers, users))

  res.json({ data, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) })
}

exports.get = (req, res) => {
  const id = parseInt(req.params.id)
  const shipment = db.get('shipments').find({ id }).value()
  if (!shipment) return res.status(404).json({ error: 'Пратката не е намерена' })

  const couriers = db.get('couriers').value()
  const users = db.get('users').value()
  const joined = joinShipment(shipment, couriers, users)

  const events = db.get('tracking_events').filter(e => e.shipment_id === id).value()
    .map(e => {
      const u = users.find(u => u.id === e.created_by)
      return { ...e, user_name: u ? `${u.first_name} ${u.last_name}` : null }
    })
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))

  res.json({ ...joined, events })
}

exports.create = (req, res) => {
  const d = req.body
  const tracking = d.tracking_number || `INF-${new Date().getFullYear()}-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`

  const existing = db.get('shipments').find({ tracking_number: tracking }).value()
  if (existing) return res.status(409).json({ error: 'Tracking номерът вече съществува' })

  const id = nextId('shipments')
  const createdAt = now()

  db.get('shipments').push({
    id,
    tracking_number: tracking,
    status: d.status || 'pending',
    direction: d.direction || 'import',
    origin_country: d.origin_country,
    origin_city: d.origin_city || null,
    dest_country: d.dest_country,
    dest_city: d.dest_city || null,
    sender_name: d.sender_name,
    sender_address: d.sender_address || null,
    recipient_name: d.recipient_name,
    recipient_address: d.recipient_address || null,
    courier_id: d.courier_id || null,
    transport_type: d.transport_type || null,
    weight_kg: d.weight_kg || null,
    length_cm: d.length_cm || null,
    width_cm: d.width_cm || null,
    height_cm: d.height_cm || null,
    packages_count: d.packages_count || 1,
    items: Array.isArray(d.items) ? d.items : [],
    description: d.description || null,
    declared_value: d.declared_value || null,
    declared_value_currency: d.declared_value_currency || 'EUR',
    freight_cost: d.freight_cost || null,
    freight_cost_currency: d.freight_cost_currency || 'EUR',
    insurance_cost: d.insurance_cost || null,
    total_cost: d.total_cost || null,
    total_cost_currency: d.total_cost_currency || 'EUR',
    invoice_number: d.invoice_number || null,
    po_number: d.po_number || null,
    notes: d.notes || null,
    assigned_to: d.assigned_to || null,
    created_by: req.user.id,
    created_at: createdAt,
    updated_at: createdAt,
    departure_date: d.departure_date || null,
    estimated_delivery: d.estimated_delivery || null,
    actual_delivery: null
  }).write()

  const eventId = nextId('tracking_events')
  db.get('tracking_events').push({
    id: eventId,
    shipment_id: id,
    status: d.status || 'pending',
    location: null,
    description: 'Пратката е създадена в системата',
    timestamp: createdAt,
    created_by: req.user.id
  }).write()

  res.status(201).json({ id, tracking_number: tracking })
}

exports.update = (req, res) => {
  const id = parseInt(req.params.id)
  const d = req.body
  const old = db.get('shipments').find({ id }).value()
  if (!old) return res.status(404).json({ error: 'Пратката не е намерена' })

  db.get('shipments').find({ id }).assign({
    status: d.status,
    direction: d.direction,
    origin_country: d.origin_country,
    origin_city: d.origin_city || null,
    dest_country: d.dest_country,
    dest_city: d.dest_city || null,
    sender_name: d.sender_name,
    sender_address: d.sender_address || null,
    recipient_name: d.recipient_name,
    recipient_address: d.recipient_address || null,
    courier_id: d.courier_id || null,
    transport_type: d.transport_type || null,
    weight_kg: d.weight_kg || null,
    length_cm: d.length_cm || null,
    width_cm: d.width_cm || null,
    height_cm: d.height_cm || null,
    packages_count: d.packages_count || 1,
    items: Array.isArray(d.items) ? d.items : [],
    description: d.description || null,
    declared_value: d.declared_value || null,
    declared_value_currency: d.declared_value_currency || 'EUR',
    freight_cost: d.freight_cost || null,
    freight_cost_currency: d.freight_cost_currency || 'EUR',
    insurance_cost: d.insurance_cost || null,
    total_cost: d.total_cost || null,
    total_cost_currency: d.total_cost_currency || 'EUR',
    invoice_number: d.invoice_number || null,
    po_number: d.po_number || null,
    notes: d.notes || null,
    assigned_to: d.assigned_to || null,
    departure_date: d.departure_date || null,
    estimated_delivery: d.estimated_delivery || null,
    actual_delivery: d.actual_delivery || null,
    updated_at: now()
  }).write()

  if (old.status !== d.status) {
    const eventId = nextId('tracking_events')
    db.get('tracking_events').push({
      id: eventId,
      shipment_id: id,
      status: d.status,
      location: null,
      description: `Статусът е сменен на: ${d.status}`,
      timestamp: now(),
      created_by: req.user.id
    }).write()
  }

  res.json({ message: 'Пратката е обновена' })
}

exports.remove = (req, res) => {
  const id = parseInt(req.params.id)
  const shipment = db.get('shipments').find({ id }).value()
  if (!shipment) return res.status(404).json({ error: 'Пратката не е намерена' })
  db.get('shipments').remove({ id }).write()
  res.json({ message: 'Пратката е изтрита' })
}

exports.exportCSV = (req, res) => {
  const couriers = db.get('couriers').value()
  const users = db.get('users').value()
  const rows = db.get('shipments').value()
    .slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .map(s => joinShipment(s, couriers, users))

  const fields = [
    'id','tracking_number','status','direction','origin_country','dest_country',
    'sender_name','recipient_name','courier_name','transport_type','weight_kg',
    'declared_value','currency','freight_cost','total_cost','hs_code','description',
    'invoice_number','estimated_delivery','actual_delivery','created_at'
  ]
  const parser = new Parser({ fields })
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="shipments_${Date.now()}.csv"`)
  res.send('\uFEFF' + parser.parse(rows))  // BOM for Excel
}

exports.importCSV = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Моля изберете CSV файл' })
  const results = []
  const errors = []
  let row = 0

  const stream = Readable.from(req.file.buffer.toString('utf-8'))
  stream.pipe(csv())
    .on('data', (data) => {
      row++
      try {
        if (!data.tracking_number || !data.sender_name || !data.recipient_name) {
          errors.push(`Ред ${row}: липсват задължителни полета`)
          return
        }
        const existing = db.get('shipments').find({ tracking_number: data.tracking_number }).value()
        if (existing) return
        const id = nextId('shipments')
        const createdAt = now()
        db.get('shipments').push({
          id,
          tracking_number: data.tracking_number,
          status: data.status || 'pending',
          direction: data.direction || 'import',
          origin_country: data.origin_country || '',
          dest_country: data.dest_country || '',
          sender_name: data.sender_name,
          recipient_name: data.recipient_name,
          description: data.description || null,
          weight_kg: data.weight_kg || null,
          declared_value: data.declared_value || null,
          currency: data.currency || 'EUR',
          created_by: req.user.id,
          created_at: createdAt,
          updated_at: createdAt
        }).write()
        results.push(data.tracking_number)
      } catch (e) {
        errors.push(`Ред ${row}: ${e.message}`)
      }
    })
    .on('end', () => res.json({ imported: results.length, errors }))
    .on('error', (e) => res.status(500).json({ error: e.message }))
}

exports.getStats = (req, res) => {
  const { country } = req.query

  let shipments = db.get('shipments').value()
  if (country) {
    shipments = shipments.filter(s => s.origin_country === country || s.dest_country === country)
  }

  const couriers = db.get('couriers').value()

  const now_ym = (() => {
    const d = new Date()
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}`
  })()

  // by_status
  const statusMap = {}
  shipments.forEach(s => {
    statusMap[s.status] = (statusMap[s.status] || 0) + 1
  })
  const by_status = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

  // by_direction
  const dirMap = {}
  shipments.forEach(s => {
    dirMap[s.direction] = (dirMap[s.direction] || 0) + 1
  })
  const by_direction = Object.entries(dirMap).map(([direction, count]) => ({ direction, count }))

  // by_courier (only shipments with courier_id)
  const courierMap = {}
  shipments.filter(s => s.courier_id).forEach(s => {
    const c = couriers.find(c => c.id === s.courier_id)
    if (!c) return
    const key = c.id
    if (!courierMap[key]) courierMap[key] = { name: c.name, count: 0 }
    courierMap[key].count++
  })
  const by_courier = Object.values(courierMap)

  const total = shipments.length
  const this_month = shipments.filter(s => s.created_at && s.created_at.startsWith(now_ym)).length

  res.json({ by_status, by_direction, by_courier, total, this_month })
}
