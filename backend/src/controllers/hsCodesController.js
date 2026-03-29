const { db, nextId, now } = require('../database/db')

exports.list = (req, res) => {
  const { search, category } = req.query
  let rows = db.get('hs_codes').value()
  if (search) {
    const s = search.toLowerCase()
    rows = rows.filter(h =>
      (h.code && h.code.toLowerCase().includes(s)) ||
      (h.description_bg && h.description_bg.toLowerCase().includes(s)) ||
      (h.description_en && h.description_en.toLowerCase().includes(s))
    )
  }
  if (category) {
    rows = rows.filter(h => h.category === category)
  }
  rows = rows.slice().sort((a, b) => (a.code || '').localeCompare(b.code || ''))
  res.json(rows)
}

exports.get = (req, res) => {
  const param = req.params.id
  const hs = db.get('hs_codes').find(h => h.id == param || h.code == param).value()
  if (!hs) return res.status(404).json({ error: 'HS кодът не е намерен' })
  res.json(hs)
}

exports.categories = (req, res) => {
  const all = db.get('hs_codes').value()
  const cats = [...new Set(all.map(h => h.category).filter(Boolean))].sort()
  res.json(cats)
}

exports.create = (req, res) => {
  const { code, description_bg, description_en, category, duty_rate, vat_rate, notes } = req.body
  if (!code || !description_bg || !category) return res.status(400).json({ error: 'Кодът, описанието и категорията са задължителни' })
  const existing = db.get('hs_codes').find({ code }).value()
  if (existing) return res.status(409).json({ error: 'HS кодът вече съществува' })
  const id = nextId('hs_codes')
  db.get('hs_codes').push({
    id,
    code,
    description_bg,
    description_en: description_en || null,
    category,
    duty_rate: duty_rate || 0,
    vat_rate: vat_rate || 20,
    notes: notes || null,
    created_at: now()
  }).write()
  res.status(201).json({ id })
}

exports.update = (req, res) => {
  const id = parseInt(req.params.id)
  const { code, description_bg, description_en, category, duty_rate, vat_rate, notes } = req.body
  const hs = db.get('hs_codes').find({ id }).value()
  if (!hs) return res.status(404).json({ error: 'HS кодът не е намерен' })
  db.get('hs_codes').find({ id }).assign({
    code,
    description_bg,
    description_en: description_en || null,
    category,
    duty_rate: duty_rate || 0,
    vat_rate: vat_rate || 20,
    notes: notes || null
  }).write()
  res.json({ message: 'HS кодът е обновен' })
}

exports.remove = (req, res) => {
  const id = parseInt(req.params.id)
  db.get('hs_codes').remove({ id }).write()
  res.json({ message: 'HS кодът е изтрит' })
}

exports.classify = (req, res) => {
  const { description } = req.query
  if (!description) return res.status(400).json({ error: 'Въведете описание' })
  const keywords = description.toLowerCase().split(' ').filter(w => w.length > 3)
  const results = []
  const allCodes = db.get('hs_codes').value()
  for (const kw of keywords) {
    const rows = allCodes.filter(h =>
      (h.description_bg && h.description_bg.toLowerCase().includes(kw)) ||
      (h.description_en && h.description_en.toLowerCase().includes(kw))
    ).slice(0, 5)
    rows.forEach(r => { if (!results.find(x => x.id === r.id)) results.push(r) })
  }
  res.json(results.slice(0, 10))
}
