const db = require('../database/db')

exports.list = (req, res) => {
  const { search, category } = req.query
  const conditions = []
  const params = []
  if (search) {
    conditions.push('(code LIKE ? OR description_bg LIKE ? OR description_en LIKE ?)')
    const t = `%${search}%`
    params.push(t, t, t)
  }
  if (category) { conditions.push('category = ?'); params.push(category) }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const rows = db.prepare(`SELECT * FROM hs_codes ${where} ORDER BY code`).all(...params)
  res.json(rows)
}

exports.get = (req, res) => {
  const hs = db.prepare('SELECT * FROM hs_codes WHERE id = ? OR code = ?').get(req.params.id, req.params.id)
  if (!hs) return res.status(404).json({ error: 'HS кодът не е намерен' })
  res.json(hs)
}

exports.categories = (req, res) => {
  const cats = db.prepare('SELECT DISTINCT category FROM hs_codes ORDER BY category').all().map(r => r.category)
  res.json(cats)
}

exports.create = (req, res) => {
  const { code, description_bg, description_en, category, duty_rate, vat_rate, notes } = req.body
  if (!code || !description_bg || !category) return res.status(400).json({ error: 'Кодът, описанието и категорията са задължителни' })
  try {
    const result = db.prepare(`INSERT INTO hs_codes (code,description_bg,description_en,category,duty_rate,vat_rate,notes) VALUES (?,?,?,?,?,?,?)`)
      .run(code, description_bg, description_en||null, category, duty_rate||0, vat_rate||20, notes||null)
    res.status(201).json({ id: result.lastInsertRowid })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'HS кодът вече съществува' })
    throw e
  }
}

exports.update = (req, res) => {
  const { code, description_bg, description_en, category, duty_rate, vat_rate, notes } = req.body
  const r = db.prepare(`UPDATE hs_codes SET code=?,description_bg=?,description_en=?,category=?,duty_rate=?,vat_rate=?,notes=? WHERE id=?`)
    .run(code, description_bg, description_en||null, category, duty_rate||0, vat_rate||20, notes||null, req.params.id)
  if (!r.changes) return res.status(404).json({ error: 'HS кодът не е намерен' })
  res.json({ message: 'HS кодът е обновен' })
}

exports.remove = (req, res) => {
  db.prepare('DELETE FROM hs_codes WHERE id = ?').run(req.params.id)
  res.json({ message: 'HS кодът е изтрит' })
}

exports.classify = (req, res) => {
  const { description } = req.query
  if (!description) return res.status(400).json({ error: 'Въведете описание' })
  const keywords = description.toLowerCase().split(' ').filter(w => w.length > 3)
  const results = []
  for (const kw of keywords) {
    const rows = db.prepare(`SELECT * FROM hs_codes WHERE lower(description_bg) LIKE ? OR lower(description_en) LIKE ? LIMIT 5`).all(`%${kw}%`, `%${kw}%`)
    rows.forEach(r => { if (!results.find(x => x.id === r.id)) results.push(r) })
  }
  res.json(results.slice(0, 10))
}
