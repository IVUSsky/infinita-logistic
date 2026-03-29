const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database/db')

const SECRET = process.env.JWT_SECRET || 'infinita_secret'
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

exports.login = (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Попълнете потребителско име и парола' })

  const user = db.prepare('SELECT * FROM users WHERE (username = ? OR email = ?) AND active = 1').get(username, username)
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Невалидни данни за вход' })
  }

  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id)

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: EXPIRES })
  const { password: _, ...safeUser } = user
  res.json({ token, user: safeUser })
}

exports.getMe = (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, first_name, last_name, department, phone, last_login FROM users WHERE id = ?').get(req.user.id)
  res.json(user)
}

exports.getUsers = (req, res) => {
  const users = db.prepare('SELECT id, username, email, role, first_name, last_name, department, phone, active, created_at, last_login FROM users ORDER BY first_name').all()
  res.json(users)
}

exports.createUser = (req, res) => {
  const { username, email, password, role, first_name, last_name, department, phone } = req.body
  if (!username || !email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Попълнете всички задължителни полета' })
  }
  try {
    const hashed = bcrypt.hashSync(password, 10)
    const result = db.prepare(`
      INSERT INTO users (username, email, password, role, first_name, last_name, department, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(username, email, hashed, role || 'employee', first_name, last_name, department || null, phone || null)
    res.status(201).json({ id: result.lastInsertRowid, message: 'Потребителят е създаден' })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Потребителско име или имейл вече съществуват' })
    throw e
  }
}

exports.updateUser = (req, res) => {
  const { id } = req.params
  const { email, role, first_name, last_name, department, phone, active } = req.body
  db.prepare(`
    UPDATE users SET email=?, role=?, first_name=?, last_name=?, department=?, phone=?, active=?
    WHERE id=?
  `).run(email, role, first_name, last_name, department, phone, active ?? 1, id)
  res.json({ message: 'Потребителят е обновен' })
}

exports.changePassword = (req, res) => {
  const { current_password, new_password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!bcrypt.compareSync(current_password, user.password)) {
    return res.status(400).json({ error: 'Грешна текуща парола' })
  }
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 10), req.user.id)
  res.json({ message: 'Паролата е сменена успешно' })
}
