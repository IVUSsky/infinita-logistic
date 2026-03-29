const jwt = require('jsonwebtoken')
const { db } = require('../database/db')

const auth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Неоторизиран достъп' })
  }
  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'infinita_secret')
    const user = db.get('users').find({ id: payload.id }).value()
    if (!user || !user.active) return res.status(401).json({ error: 'Потребителят не е активен' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Невалиден токен' })
  }
}

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Нямате права за тази операция' })
  }
  next()
}

module.exports = { auth, requireRole }
