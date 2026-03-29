const db = require('../database/db')

exports.list = (req, res) => {
  const { type, status, year, month, page = 1, limit = 20 } = req.query
  const conditions = []
  const params = []
  if (type)   { conditions.push('fr.type = ?');   params.push(type) }
  if (status) { conditions.push('fr.status = ?'); params.push(status) }
  if (year)   { conditions.push("strftime('%Y', fr.created_at) = ?"); params.push(year) }
  if (month)  { conditions.push("strftime('%m', fr.created_at) = ?"); params.push(String(month).padStart(2,'0')) }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const offset = (parseInt(page)-1) * parseInt(limit)
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM financial_records fr ${where}`).get(...params).cnt
  const rows = db.prepare(`
    SELECT fr.*, s.tracking_number, c.name AS courier_name,
           u.first_name||' '||u.last_name AS created_name
    FROM financial_records fr
    LEFT JOIN shipments s ON fr.shipment_id = s.id
    LEFT JOIN couriers c ON fr.courier_id = c.id
    LEFT JOIN users u ON fr.created_by = u.id
    ${where} ORDER BY fr.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset)
  res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) })
}

exports.create = (req, res) => {
  const { type, shipment_id, amount, currency, amount_bgn, description, category, courier_id, invoice_number, due_date, status } = req.body
  if (!type || !amount || !description) return res.status(400).json({ error: 'Типът, сумата и описанието са задължителни' })
  const result = db.prepare(`
    INSERT INTO financial_records (type,shipment_id,amount,currency,amount_bgn,description,category,courier_id,invoice_number,due_date,status,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(type, shipment_id||null, amount, currency||'EUR', amount_bgn||null, description, category||null, courier_id||null, invoice_number||null, due_date||null, status||'pending', req.user.id)
  res.status(201).json({ id: result.lastInsertRowid })
}

exports.update = (req, res) => {
  const { type, amount, currency, amount_bgn, description, category, invoice_number, due_date, paid_date, status } = req.body
  const r = db.prepare(`UPDATE financial_records SET type=?,amount=?,currency=?,amount_bgn=?,description=?,category=?,invoice_number=?,due_date=?,paid_date=?,status=? WHERE id=?`)
    .run(type, amount, currency||'EUR', amount_bgn||null, description, category||null, invoice_number||null, due_date||null, paid_date||null, status, req.params.id)
  if (!r.changes) return res.status(404).json({ error: 'Записът не е намерен' })
  res.json({ message: 'Записът е обновен' })
}

exports.remove = (req, res) => {
  db.prepare('DELETE FROM financial_records WHERE id = ?').run(req.params.id)
  res.json({ message: 'Записът е изтрит' })
}

exports.dashboard = (req, res) => {
  const { year = new Date().getFullYear() } = req.query
  const y = String(year)

  const monthlyTotals = db.prepare(`
    SELECT strftime('%m', created_at) AS month,
           SUM(CASE WHEN type IN ('invoice','expense') THEN amount ELSE 0 END) AS expenses,
           SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) AS income
    FROM financial_records
    WHERE strftime('%Y', created_at) = ?
    GROUP BY month ORDER BY month
  `).all(y)

  const byCourier = db.prepare(`
    SELECT c.name, SUM(fr.amount) AS total, COUNT(*) AS count
    FROM financial_records fr JOIN couriers c ON fr.courier_id = c.id
    WHERE strftime('%Y', fr.created_at) = ? AND fr.type = 'invoice'
    GROUP BY c.id ORDER BY total DESC
  `).all(y)

  const byCategory = db.prepare(`
    SELECT COALESCE(category,'Без категория') AS category, SUM(amount) AS total, COUNT(*) AS count
    FROM financial_records
    WHERE strftime('%Y', created_at) = ?
    GROUP BY category ORDER BY total DESC
  `).all(y)

  const summary = db.prepare(`
    SELECT
      SUM(CASE WHEN type='invoice' AND status!='cancelled' THEN amount ELSE 0 END) AS total_invoiced,
      SUM(CASE WHEN type='invoice' AND status='paid' THEN amount ELSE 0 END) AS total_paid,
      SUM(CASE WHEN type='invoice' AND status='pending' THEN amount ELSE 0 END) AS total_pending,
      SUM(CASE WHEN type='invoice' AND status='overdue' THEN amount ELSE 0 END) AS total_overdue,
      COUNT(CASE WHEN type='invoice' AND status='pending' THEN 1 END) AS pending_count,
      COUNT(CASE WHEN type='invoice' AND status='overdue' THEN 1 END) AS overdue_count
    FROM financial_records WHERE strftime('%Y', created_at) = ?
  `).get(y)

  const recentShipmentCosts = db.prepare(`
    SELECT s.tracking_number, s.dest_country, s.origin_country, c.name AS courier,
           s.freight_cost, s.total_cost, s.currency, s.created_at
    FROM shipments s LEFT JOIN couriers c ON s.courier_id = c.id
    WHERE s.freight_cost IS NOT NULL ORDER BY s.created_at DESC LIMIT 8
  `).all()

  res.json({ monthlyTotals, byCourier, byCategory, summary, recentShipmentCosts })
}
