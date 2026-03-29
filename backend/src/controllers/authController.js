const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { db, nextId, now } = require('../database/db')

const SECRET = process.env.JWT_SECRET || 'infinita_secret'
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

exports.login = (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Попълнете потребителско име и парола' })

  const user = db.get('users').find(u => (u.username === username || u.email === username) && u.active === 1).value()
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Невалидни данни за вход' })
  }

  db.get('users').find({ id: user.id }).assign({ last_login: now() }).write()

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: EXPIRES })
  const { password: _, ...safeUser } = user
  res.json({ token, user: safeUser })
}

exports.getMe = (req, res) => {
  const user = db.get('users').find({ id: req.user.id }).value()
  if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' })
  const { password, ...safeUser } = user
  res.json(safeUser)
}

exports.getUsers = (req, res) => {
  const users = db.get('users').value()
    .map(u => {
      const { password, ...safe } = u
      return safe
    })
    .sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''))
  res.json(users)
}

exports.createUser = (req, res) => {
  const { username, email, password, role, first_name, last_name, department, phone } = req.body
  if (!username || !email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Попълнете всички задължителни полета' })
  }
  const existing = db.get('users').find(u => u.username === username || u.email === email).value()
  if (existing) return res.status(409).json({ error: 'Потребителско име или имейл вече съществуват' })

  const id = nextId('users')
  const hashed = bcrypt.hashSync(password, 10)
  db.get('users').push({
    id,
    username,
    email,
    password: hashed,
    role: role || 'employee',
    first_name,
    last_name,
    department: department || null,
    phone: phone || null,
    active: 1,
    created_at: now(),
    last_login: null
  }).write()
  res.status(201).json({ id, message: 'Потребителят е създаден' })
}

exports.updateUser = (req, res) => {
  const { id } = req.params
  const { email, role, first_name, last_name, department, phone, active } = req.body
  db.get('users').find({ id: parseInt(id) }).assign({
    email,
    role,
    first_name,
    last_name,
    department: department || null,
    phone: phone || null,
    active: active ?? 1
  }).write()
  res.json({ message: 'Потребителят е обновен' })
}

exports.changePassword = (req, res) => {
  const { current_password, new_password } = req.body
  const user = db.get('users').find({ id: req.user.id }).value()
  if (!bcrypt.compareSync(current_password, user.password)) {
    return res.status(400).json({ error: 'Грешна текуща парола' })
  }
  db.get('users').find({ id: req.user.id }).assign({ password: bcrypt.hashSync(new_password, 10) }).write()
  res.json({ message: 'Паролата е сменена успешно' })
}
