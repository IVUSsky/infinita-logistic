const { db, nextId, now } = require('../database/db')

exports.list = (req, res) => {
  const { type, status, year, month, page = 1, limit = 20 } = req.query

  let records = db.get('financial_records').value()

  if (type)   records = records.filter(r => r.type === type)
  if (status) records = records.filter(r => r.status === status)
  if (year && month) {
    const mm = String(month).padStart(2, '0')
    records = records.filter(r => r.created_at && r.created_at.startsWith(`${year}-${mm}`))
  } else if (year) {
    records = records.filter(r => r.created_at && r.created_at.startsWith(String(year)))
  } else if (month) {
    const mm = String(month).padStart(2, '0')
    records = records.filter(r => r.created_at && r.created_at.slice(5, 7) === mm)
  }

  records = records.slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

  const total = records.length
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const offset = (pageNum - 1) * limitNum
  const paged = records.slice(offset, offset + limitNum)

  const shipments = db.get('shipments').value()
  const couriers = db.get('couriers').value()
  const users = db.get('users').value()

  const rows = paged.map(fr => {
    const s = shipments.find(s => s.id === fr.shipment_id)
    const c = couriers.find(c => c.id === fr.courier_id)
    const u = users.find(u => u.id === fr.created_by)
    return {
      ...fr,
      tracking_number: s ? s.tracking_number : null,
      courier_name: c ? c.name : null,
      created_name: u ? `${u.first_name} ${u.last_name}` : null
    }
  })

  res.json({ data: rows, total, page: pageNum, limit: limitNum })
}

exports.create = (req, res) => {
  const { type, shipment_id, amount, currency, amount_bgn, description, category, courier_id, invoice_number, due_date, status, invoice_value, invoice_value_currency } = req.body
  if (!type || !amount || !description) return res.status(400).json({ error: 'Типът, сумата и описанието са задължителни' })
  const id = nextId('financial_records')
  db.get('financial_records').push({
    id,
    type,
    shipment_id: shipment_id || null,
    amount: parseFloat(amount),
    currency: currency || 'EUR',
    amount_bgn: amount_bgn ? parseFloat(amount_bgn) : null,
    description,
    category: category || null,
    courier_id: courier_id || null,
    invoice_number: invoice_number || null,
    due_date: due_date || null,
    paid_date: null,
    status: status || 'pending',
    invoice_value: invoice_value ? parseFloat(invoice_value) : null,
    invoice_value_currency: invoice_value_currency || 'EUR',
    created_by: req.user.id,
    created_at: now()
  }).write()
  res.status(201).json({ id })
}

exports.update = (req, res) => {
  const id = parseInt(req.params.id)
  const { type, amount, currency, amount_bgn, description, category, invoice_number, due_date, paid_date, status, invoice_value, invoice_value_currency } = req.body
  const record = db.get('financial_records').find({ id }).value()
  if (!record) return res.status(404).json({ error: 'Записът не е намерен' })
  db.get('financial_records').find({ id }).assign({
    type,
    amount: parseFloat(amount),
    currency: currency || 'EUR',
    amount_bgn: amount_bgn ? parseFloat(amount_bgn) : null,
    description,
    category: category || null,
    invoice_number: invoice_number || null,
    due_date: due_date || null,
    paid_date: paid_date || null,
    status,
    invoice_value: invoice_value ? parseFloat(invoice_value) : null,
    invoice_value_currency: invoice_value_currency || 'EUR'
  }).write()
  res.json({ message: 'Записът е обновен' })
}

exports.remove = (req, res) => {
  const id = parseInt(req.params.id)
  db.get('financial_records').remove({ id }).write()
  res.json({ message: 'Записът е изтрит' })
}

exports.dashboard = (req, res) => {
  const { year = new Date().getFullYear() } = req.query
  const y = String(year)

  const allRecords = db.get('financial_records').value()
  const yearRecords = allRecords.filter(r => r.created_at && r.created_at.startsWith(y))

  // Monthly totals
  const monthlyMap = {}
  yearRecords.forEach(r => {
    const month = r.created_at ? r.created_at.slice(5, 7) : '01'
    if (!monthlyMap[month]) monthlyMap[month] = { month, expenses: 0, income: 0 }
    if (r.type === 'invoice' || r.type === 'expense') monthlyMap[month].expenses += r.amount || 0
    if (r.type === 'payment') monthlyMap[month].income += r.amount || 0
  })
  const monthlyTotals = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month))

  // By courier
  const couriers = db.get('couriers').value()
  const byCourierMap = {}
  yearRecords.filter(r => r.type === 'invoice' && r.courier_id).forEach(r => {
    const key = r.courier_id
    if (!byCourierMap[key]) {
      const c = couriers.find(c => c.id === key)
      byCourierMap[key] = { name: c ? c.name : null, total: 0, count: 0 }
    }
    byCourierMap[key].total += r.amount || 0
    byCourierMap[key].count += 1
  })
  const byCourier = Object.values(byCourierMap).sort((a, b) => b.total - a.total)

  // By category
  const byCategoryMap = {}
  yearRecords.forEach(r => {
    const cat = r.category || 'Без категория'
    if (!byCategoryMap[cat]) byCategoryMap[cat] = { category: cat, total: 0, count: 0 }
    byCategoryMap[cat].total += r.amount || 0
    byCategoryMap[cat].count += 1
  })
  const byCategory = Object.values(byCategoryMap).sort((a, b) => b.total - a.total)

  // Summary
  const summary = {
    total_invoiced: 0,
    total_paid: 0,
    total_pending: 0,
    total_overdue: 0,
    pending_count: 0,
    overdue_count: 0
  }
  yearRecords.forEach(r => {
    if (r.type === 'invoice' && r.status !== 'cancelled') summary.total_invoiced += r.amount || 0
    if (r.type === 'invoice' && r.status === 'paid') summary.total_paid += r.amount || 0
    if (r.type === 'invoice' && r.status === 'pending') { summary.total_pending += r.amount || 0; summary.pending_count++ }
    if (r.type === 'invoice' && r.status === 'overdue') { summary.total_overdue += r.amount || 0; summary.overdue_count++ }
  })

  // Recent shipment costs with invoice value metrics
  const shipments = db.get('shipments').value()
  const packingLists = db.get('packing_lists').value()

  const recentShipmentCosts = shipments
    .filter(s => s.freight_cost != null)
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 8)
    .map(s => {
      const c = couriers.find(c => c.id === s.courier_id)
      // Find related financial record with invoice_value
      const finRec = allRecords.find(r => r.shipment_id === s.id && r.invoice_value)
      // Find packing list totals for cost/kg
      const pl = packingLists.find(p => p.shipment_id === s.id)
      const transport_cost = s.freight_cost || 0
      const invoice_value = finRec ? finRec.invoice_value : null
      const gw_kg = pl ? pl.total_gw_kg : null
      return {
        tracking_number: s.tracking_number,
        dest_country: s.dest_country,
        origin_country: s.origin_country,
        courier: c ? c.name : null,
        freight_cost: s.freight_cost,
        total_cost: s.total_cost,
        currency: s.currency,
        created_at: s.created_at,
        invoice_value,
        invoice_value_currency: finRec ? finRec.invoice_value_currency : null,
        transport_pct_of_invoice: (invoice_value && invoice_value > 0)
          ? parseFloat(((transport_cost / invoice_value) * 100).toFixed(2))
          : null,
        cost_per_kg: (gw_kg && gw_kg > 0)
          ? parseFloat((transport_cost / gw_kg).toFixed(3))
          : null
      }
    })

  res.json({ monthlyTotals, byCourier, byCategory, summary, recentShipmentCosts })
}
