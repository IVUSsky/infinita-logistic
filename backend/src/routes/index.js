const router = require('express').Router()
const { auth, requireRole } = require('../middleware/auth')
const auth_ctrl    = require('../controllers/authController')
const ship_ctrl    = require('../controllers/shipmentsController')
const courier_ctrl = require('../controllers/couriersController')
const hs_ctrl      = require('../controllers/hsCodesController')
const fin_ctrl     = require('../controllers/financialController')
const track_ctrl   = require('../controllers/trackingController')
const multer       = require('multer')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/login',           auth_ctrl.login)
router.get('/auth/me',          auth, auth_ctrl.getMe)
router.put('/auth/password',    auth, auth_ctrl.changePassword)
router.get('/users',            auth, requireRole('admin','manager'), auth_ctrl.getUsers)
router.post('/users',           auth, requireRole('admin'), auth_ctrl.createUser)
router.put('/users/:id',        auth, requireRole('admin'), auth_ctrl.updateUser)

// ─── Shipments ────────────────────────────────────────────────────────────────
router.get('/shipments',        auth, ship_ctrl.list)
router.get('/shipments/stats',  auth, ship_ctrl.getStats)
router.get('/shipments/export', auth, ship_ctrl.exportCSV)
router.post('/shipments/import',auth, upload.single('file'), ship_ctrl.importCSV)
router.get('/shipments/:id',    auth, ship_ctrl.get)
router.post('/shipments',       auth, ship_ctrl.create)
router.put('/shipments/:id',    auth, ship_ctrl.update)
router.delete('/shipments/:id', auth, requireRole('admin','manager'), ship_ctrl.remove)

// ─── Couriers ─────────────────────────────────────────────────────────────────
router.get('/couriers',             auth, courier_ctrl.list)
router.get('/couriers/rates',       auth, courier_ctrl.listRates)
router.get('/couriers/compare',     auth, courier_ctrl.compare)
router.get('/couriers/:id',         auth, courier_ctrl.get)
router.post('/couriers',            auth, requireRole('admin','manager'), courier_ctrl.create)
router.put('/couriers/:id',         auth, requireRole('admin','manager'), courier_ctrl.update)
router.post('/couriers/rates',      auth, requireRole('admin','manager'), courier_ctrl.upsertRate)
router.put('/couriers/rates/:rateId', auth, requireRole('admin','manager'), courier_ctrl.upsertRate)
router.delete('/couriers/rates/:rateId', auth, requireRole('admin'), courier_ctrl.deleteRate)

// ─── HS Codes ─────────────────────────────────────────────────────────────────
router.get('/hs-codes',              auth, hs_ctrl.list)
router.get('/hs-codes/categories',   auth, hs_ctrl.categories)
router.get('/hs-codes/classify',     auth, hs_ctrl.classify)
router.get('/hs-codes/:id',          auth, hs_ctrl.get)
router.post('/hs-codes',             auth, requireRole('admin','manager'), hs_ctrl.create)
router.put('/hs-codes/:id',          auth, requireRole('admin','manager'), hs_ctrl.update)
router.delete('/hs-codes/:id',       auth, requireRole('admin'), hs_ctrl.remove)

// ─── Financial ────────────────────────────────────────────────────────────────
router.get('/financial/dashboard',  auth, requireRole('admin','manager'), fin_ctrl.dashboard)
router.get('/financial',            auth, requireRole('admin','manager'), fin_ctrl.list)
router.post('/financial',           auth, requireRole('admin','manager'), fin_ctrl.create)
router.put('/financial/:id',        auth, requireRole('admin','manager'), fin_ctrl.update)
router.delete('/financial/:id',     auth, requireRole('admin'), fin_ctrl.remove)

// ─── Tracking ─────────────────────────────────────────────────────────────────
router.get('/tracking',             auth, track_ctrl.listAll)
router.get('/tracking/:number',     track_ctrl.getByTracking)   // публичен endpoint
router.post('/tracking/events',     auth, track_ctrl.addEvent)
router.put('/tracking/events/:id',  auth, track_ctrl.updateEvent)
router.delete('/tracking/events/:id', auth, requireRole('admin','manager'), track_ctrl.deleteEvent)

module.exports = router
