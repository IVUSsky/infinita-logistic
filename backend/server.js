require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')
const errorHandler = require('./src/middleware/errorHandler')

// Auto-seed if database is empty
const { db } = require('./src/database/db')
try {
  if (db.get('users').value().length === 0) {
    console.log('База данни е празна — стартиране на seed...')
    require('./src/database/seed')
    console.log('Seed завърши успешно. Потребители:', db.get('users').value().length)
  } else {
    console.log('База данни има потребители:', db.get('users').value().length)
  }
} catch (e) {
  console.error('Seed грешка:', e.message)
}

const app  = express()
const PORT = process.env.PORT || 5000

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5173']

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.railway.app')) {
      return cb(null, true)
    }
    cb(new Error('CORS: не е разрешен достъп от ' + origin))
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api', require('./src/routes/index'))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  app: 'Infinita Logistic API',
  time: new Date().toISOString(),
  users: db.get('users').value().length,
  db_path: process.env.DB_PATH || './database/infinita.json'
}))

// ─── Manual seed (temporary) ──────────────────────────────────────────────────
app.post('/api/seed-reset', (req, res) => {
  const { secret } = req.body
  if (secret !== (process.env.SEED_SECRET || 'infinita-seed-2026')) {
    return res.status(403).json({ error: 'Невалиден secret' })
  }
  try {
    // Clear module cache so seed runs fresh
    delete require.cache[require.resolve('./src/database/seed')]
    require('./src/database/seed')
    res.json({ ok: true, users: db.get('users').value().length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`\n🚀 Infinita Logistic API стартиран на http://localhost:${PORT}`)
  console.log(`📦 База данни: ${process.env.DB_PATH || './database/infinita.db'}`)
  console.log(`🌍 Среда: ${process.env.NODE_ENV || 'development'}\n`)
})
