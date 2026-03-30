require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')
const errorHandler = require('./src/middleware/errorHandler')

// Auto-seed if database is empty
const { db } = require('./src/database/db')
if (db.get('users').value().length === 0) {
  console.log('База данни е празна — стартиране на seed...')
  require('./src/database/seed')
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
app.get('/health', (_, res) => res.json({ status: 'ok', app: 'Infinita Logistic API', time: new Date().toISOString() }))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`\n🚀 Infinita Logistic API стартиран на http://localhost:${PORT}`)
  console.log(`📦 База данни: ${process.env.DB_PATH || './database/infinita.db'}`)
  console.log(`🌍 Среда: ${process.env.NODE_ENV || 'development'}\n`)
})
