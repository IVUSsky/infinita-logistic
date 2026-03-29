const db = require('../database/db')
const { v4: uuidv4 } = require('uuid')
const { Parser } = require('json2csv')
const csv = require('csv-parser')
const { Readable } = require('stream')

const BASE_QUERY = `
  SELECT s.*, c.name AS courier_name, u1.first_name||' '||u1.last_name AS assigned_name,
         u2.first_name||' '||u2.last_name AS created_name
  FROM shipments s
  LEFT JOIN couriers c ON s.courier_id = c.id
  LEFT JOIN users u1 ON s.assigned_to = u1.id
  LEFT JOIN users u2 ON s.created_by = u2.id
`

exports.list = (req, res) => {
  const { status, direction, courier_id, search, country, page = 1, limit = 20 } = req.query
  const conditions = []
  const params = []

  if (status)     { conditions.push('s.status = ?');     params.push(status) }
  if (direction)  { conditions.push('s.direction = ?');  params.push(direction) }
  if (courier_id) { conditions.push('s.courier_id = ?'); params.push(courier_id) }
  if (country)    { conditions.push('(s.origin_country = ? OR s.dest_country = ?)'); params.push(country, country) }
  if (search) {
    conditions.push('(s.tracking_number LIKE ? OR s.sender_name LIKE ? OR s.recipient_name LIKE ? OR s.description LIKE ?)')
    const term = `%${search}%`
    params.push(term, term, term, term)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const offset = (parseInt(page) - 1) * parseInt(limit)

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM shipments s ${where}`).get(...params).cnt
  const rows  = db.prepare(`${BASE_QUERY} ${where} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset)

  res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) })
}

exports.get = (req, res) => {
  const shipment = db.prepare(`${BASE_QUERY} WHERE s.id = ?`).get(req.params.id)
  if (!shipment) return res.status(404).json({ error: 'Пратката не е намерена' })
  const events = db.prepare(`
    SELECT te.*, u.first_name||' '||u.last_name AS user_name
    FROM tracking_events te LEFT JOIN users u ON te.created_by = u.id
    WHERE te.shipment_id = ? ORDER BY te.timestamp ASC
  `).all(req.params.id)
  res.json({ ...shipment, events })
}

exports.create = (req, res) => {
  const d = req.body
  const tracking = d.tracking_number || `INF-${new Date().getFullYear()}-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`
  try {
    const result = db.prepare(`
      INSERT INTO shipments (
        tracking_number, status, direction, origin_country, origin_city,
        dest_country, dest_city, sender_name, sender_address, recipient_name, recipient_address,
        courier_id, transport_type, weight_kg, length_cm, width_cm, height_cm, packages_count,
        hs_code, description, declared_value, currency, freight_cost, insurance_cost,
        customs_duty, total_cost, invoice_number, po_number, notes,
        assigned_to, created_by, estimated_delivery
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      tracking, d.status||'pending', d.direction||'import',
      d.origin_country, d.origin_city||null, d.dest_country, d.dest_city||null,
      d.sender_name, d.sender_address||null, d.recipient_name, d.recipient_address||null,
      d.courier_id||null, d.transport_type||null,
      d.weight_kg||null, d.length_cm||null, d.width_cm||null, d.height_cm||null,
      d.packages_count||1, d.hs_code||null, d.description||null,
      d.declared_value||null, d.currency||'EUR',
      d.freight_cost||null, d.insurance_cost||null, d.customs_duty||null, d.total_cost||null,
      d.invoice_number||null, d.po_number||null, d.notes||null,
      d.assigned_to||null, req.user.id, d.estimated_delivery||null
    )
    // auto tracking event
    db.prepare(`INSERT INTO tracking_events (shipment_id, status, description, created_by) VALUES (?,?,?,?)`)
      .run(result.lastInsertRowid, d.status||'pending', 'Пратката е създадена в системата', req.user.id)
    res.status(201).json({ id: result.lastInsertRowid, tracking_number: tracking })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Tracking номерът вече съществува' })
    throw e
  }
}

exports.update = (req, res) => {
  const { id } = req.params
  const d = req.body
  const old = db.prepare('SELECT status FROM shipments WHERE id = ?').get(id)
  if (!old) return res.status(404).json({ error: 'Пратката не е намерена' })

  db.prepare(`
    UPDATE shipments SET
      status=?, direction=?, origin_country=?, origin_city=?, dest_country=?, dest_city=?,
      sender_name=?, sender_address=?, recipient_name=?, recipient_address=?,
      courier_id=?, transport_type=?, weight_kg=?, length_cm=?, width_cm=?, height_cm=?,
      packages_count=?, hs_code=?, description=?, declared_value=?, currency=?,
      freight_cost=?, insurance_cost=?, customs_duty=?, total_cost=?,
      invoice_number=?, po_number=?, notes=?, assigned_to=?,
      estimated_delivery=?, actual_delivery=?,
      updated_at=datetime('now')
    WHERE id=?
  `).run(
    d.status, d.direction, d.origin_country, d.origin_city||null, d.dest_country, d.dest_city||null,
    d.sender_name, d.sender_address||null, d.recipient_name, d.recipient_address||null,
    d.courier_id||null, d.transport_type||null,
    d.weight_kg||null, d.length_cm||null, d.width_cm||null, d.height_cm||null,
    d.packages_count||1, d.hs_code||null, d.description||null,
    d.declared_value||null, d.currency||'EUR',
    d.freight_cost||null, d.insurance_cost||null, d.customs_duty||null, d.total_cost||null,
    d.invoice_number||null, d.po_number||null, d.notes||null,
    d.assigned_to||null, d.estimated_delivery||null, d.actual_delivery||null,
    id
  )

  if (old.status !== d.status) {
    db.prepare(`INSERT INTO tracking_events (shipment_id, status, description, created_by) VALUES (?,?,?,?)`)
      .run(id, d.status, `Статусът е сменен на: ${d.status}`, req.user.id)
  }
  res.json({ message: 'Пратката е обновена' })
}

exports.remove = (req, res) => {
  const r = db.prepare('DELETE FROM shipments WHERE id = ?').run(req.params.id)
  if (!r.changes) return res.status(404).json({ error: 'Пратката не е намерена' })
  res.json({ message: 'Пратката е изтрита' })
}

exports.exportCSV = (req, res) => {
  const rows = db.prepare(`${BASE_QUERY} ORDER BY s.created_at DESC`).all()
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

  const insert = db.prepare(`
    INSERT OR IGNORE INTO shipments (tracking_number, status, direction, origin_country, dest_country, sender_name, recipient_name, description, weight_kg, declared_value, currency, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `)

  const stream = Readable.from(req.file.buffer.toString('utf-8'))
  stream.pipe(csv())
    .on('data', (data) => {
      row++
      try {
        if (!data.tracking_number || !data.sender_name || !data.recipient_name) {
          errors.push(`Ред ${row}: липсват задължителни полета`)
          return
        }
        insert.run(
          data.tracking_number, data.status||'pending', data.direction||'import',
          data.origin_country||'', data.dest_country||'',
          data.sender_name, data.recipient_name, data.description||null,
          data.weight_kg||null, data.declared_value||null, data.currency||'EUR',
          req.user.id
        )
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
  const where = country ? `WHERE (origin_country = '${country}' OR dest_country = '${country}')` : ''
  const whereS = country ? `WHERE (s.origin_country = '${country}' OR s.dest_country = '${country}')` : ''

  const stats = {
    by_status:    db.prepare(`SELECT status, COUNT(*) as count FROM shipments ${where} GROUP BY status`).all(),
    by_direction: db.prepare(`SELECT direction, COUNT(*) as count FROM shipments ${where} GROUP BY direction`).all(),
    by_courier:   db.prepare(`SELECT c.name, COUNT(s.id) as count FROM shipments s JOIN couriers c ON s.courier_id = c.id ${whereS} GROUP BY c.id`).all(),
    total:        db.prepare(`SELECT COUNT(*) as cnt FROM shipments ${where}`).get().cnt,
    this_month:   db.prepare(`SELECT COUNT(*) as cnt FROM shipments ${where ? where + ' AND' : 'WHERE'} strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`).get().cnt,
  }
  res.json(stats)
}
