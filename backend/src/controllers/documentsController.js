const path = require('path')
const fs = require('fs')
const { db, nextId, now } = require('../database/db')

const DB_PATH = process.env.DB_PATH || './database/infinita.json'
const UPLOADS_DIR = path.join(path.dirname(path.resolve(DB_PATH)), 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

exports.UPLOADS_DIR = UPLOADS_DIR

exports.list = (req, res) => {
  const shipment_id = parseInt(req.params.id)
  const docs = db.get('shipment_documents').filter({ shipment_id }).value()
  res.json(docs)
}

exports.upload = (req, res) => {
  const shipment_id = parseInt(req.params.id)
  const shipment = db.get('shipments').find({ id: shipment_id }).value()
  if (!shipment) return res.status(404).json({ error: 'Пратката не е намерена' })
  if (!req.file) return res.status(400).json({ error: 'Моля изберете файл' })

  const id = nextId('shipment_documents')
  const doc = {
    id,
    shipment_id,
    type: req.body.type || 'other',
    filename: req.file.filename,
    original_name: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploaded_by: req.user.id,
    uploaded_at: now()
  }
  db.get('shipment_documents').push(doc).write()
  res.status(201).json(doc)
}

exports.download = (req, res) => {
  const id = parseInt(req.params.docId)
  const doc = db.get('shipment_documents').find({ id }).value()
  if (!doc) return res.status(404).json({ error: 'Документът не е намерен' })

  const filePath = path.join(UPLOADS_DIR, doc.filename)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Файлът не е намерен на диска' })

  res.download(filePath, doc.original_name)
}

exports.remove = (req, res) => {
  const id = parseInt(req.params.docId)
  const doc = db.get('shipment_documents').find({ id }).value()
  if (!doc) return res.status(404).json({ error: 'Документът не е намерен' })

  const filePath = path.join(UPLOADS_DIR, doc.filename)
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath) } catch (e) { /* ignore */ }
  }

  db.get('shipment_documents').remove({ id }).write()
  res.json({ message: 'Документът е изтрит' })
}
