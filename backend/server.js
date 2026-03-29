require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')
const errorHandler = require('./src/middleware/errorHandler')

const app  = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }))
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
