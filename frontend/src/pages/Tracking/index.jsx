import { useState, useEffect } from 'react'
import { Search, MapPin, Plus, CheckCircle2, Clock, Truck, Package, AlertCircle } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import { fmtDateTime, fmtDate, STATUS_LABELS, TRANSPORT_ICONS } from '../../utils/helpers'
import { StatusBadge } from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_ICONS = {
  pending: Clock, confirmed: CheckCircle2, in_transit: Truck,
  customs: AlertCircle, delivered: CheckCircle2, cancelled: AlertCircle, returned: Package,
}

const STATUS_TIMELINE_COLOR = {
  pending: 'bg-yellow-400', confirmed: 'bg-blue-400', in_transit: 'bg-purple-400',
  customs: 'bg-orange-400', delivered: 'bg-green-500', cancelled: 'bg-red-400', returned: 'bg-gray-400',
}

export default function TrackingPage() {
  const { isManager } = useAuth()
  const [query, setQuery]       = useState('')
  const [shipment, setShipment] = useState(null)
  const [recent, setRecent]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [allShipments, setAll]  = useState([])

  useEffect(() => {
    api.get('/tracking?limit=8').then(r => setRecent(r.data))
    api.get('/shipments?limit=100').then(r => setAll(r.data.data))
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setShipment(null)
    try {
      const { data } = await api.get(`/tracking/${query.trim()}`)
      setShipment(data)
    } catch (err) {
      toast.error(err.response?.status === 404 ? 'Пратката не е намерена' : 'Грешка при търсене')
    } finally { setLoading(false) }
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const body = Object.fromEntries(fd)
    if (!body.shipment_id || !body.description) return toast.error('Попълнете задължителните полета')
    setSaving(true)
    try {
      await api.post('/tracking/events', body)
      toast.success('Събитието е добавено')
      setAddModal(false)
      // refresh if same shipment
      if (shipment && String(shipment.id) === String(body.shipment_id)) {
        const { data } = await api.get(`/tracking/${shipment.tracking_number}`)
        setShipment(data)
      }
      api.get('/tracking?limit=8').then(r => setRecent(r.data))
    } catch (err) { toast.error(err.response?.data?.error || 'Грешка') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Проследяване на пратка</h3>
        <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Въведете tracking номер (напр. INF-2024-001)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <LoadingSpinner size="sm" /> : <Search size={15} />}
            Търси
          </button>
          {isManager && (
            <button type="button" onClick={() => setAddModal(true)} className="btn-secondary">
              <Plus size={15} />Добави събитие
            </button>
          )}
        </form>
      </div>

      {/* Result */}
      {shipment && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{TRANSPORT_ICONS[shipment.transport_type] || '📦'}</span>
                <div>
                  <div className="font-bold text-gray-800 text-lg">{shipment.tracking_number}</div>
                  <div className="text-sm text-gray-500">{shipment.sender_name} → {shipment.recipient_name}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-gray-500">{shipment.origin_country} → {shipment.dest_country}</div>
              {shipment.courier_name && <div className="text-gray-500">via {shipment.courier_name}</div>}
              <StatusBadge status={shipment.status} />
            </div>
          </div>

          {shipment.estimated_delivery && (
            <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 text-sm text-blue-700 flex items-center gap-2">
              <Clock size={14} />
              Очаквана доставка: <strong>{fmtDate(shipment.estimated_delivery)}</strong>
              {shipment.actual_delivery && <span className="ml-3">• Доставена: <strong>{fmtDate(shipment.actual_delivery)}</strong></span>}
            </div>
          )}

          {/* Timeline */}
          <div className="p-6">
            <h4 className="text-sm font-semibold text-gray-600 mb-5">История на движението</h4>
            {shipment.events.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Няма регистрирани събития</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {[...shipment.events].reverse().map((ev, i) => {
                    const Icon = STATUS_ICONS[ev.status] || Package
                    const isFirst = i === 0
                    return (
                      <div key={ev.id} className="relative flex gap-4 pl-10">
                        <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center -translate-x-0.5 ${isFirst ? STATUS_TIMELINE_COLOR[ev.status] || 'bg-brand-500' : 'bg-gray-300'} ${isFirst ? 'ring-2 ring-white shadow' : ''}`}>
                          <Icon size={11} className="text-white" />
                        </div>
                        <div className={`flex-1 rounded-lg px-4 py-3 ${isFirst ? 'bg-brand-50 border border-brand-100' : 'bg-gray-50'}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className={`text-sm font-semibold ${isFirst ? 'text-brand-700' : 'text-gray-700'}`}>
                                {ev.description}
                              </div>
                              {ev.location && <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={10} />{ev.location}</div>}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs text-gray-400">{fmtDateTime(ev.timestamp)}</div>
                              {ev.user_name && <div className="text-xs text-gray-300">{ev.user_name}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent events */}
      {!shipment && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">Последни движения</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Няма данни</div>
            ) : recent.map(ev => (
              <div key={ev.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer" onClick={() => { setQuery(ev.tracking_number); api.get(`/tracking/${ev.tracking_number}`).then(r => setShipment(r.data)) }}>
                <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{ev.description}</div>
                  <div className="text-xs text-gray-400">{ev.tracking_number} • {ev.sender_name} → {ev.recipient_name}</div>
                </div>
                <div className="text-xs text-gray-400 shrink-0">{fmtDateTime(ev.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add event modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Добавяне на tracking събитие">
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div>
            <label className="label">Пратка *</label>
            <select className="select" name="shipment_id" required>
              <option value="">— изберете пратка —</option>
              {allShipments.map(s => <option key={s.id} value={s.id}>{s.tracking_number} — {s.sender_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Статус</label>
              <select className="select" name="status">
                <option value="">— без промяна —</option>
                {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Местоположение</label>
              <input className="input" name="location" placeholder="напр. Sofia Airport, BG" />
            </div>
          </div>
          <div>
            <label className="label">Описание *</label>
            <input className="input" name="description" placeholder="напр. Пратката е заминала с рейс LH1234" required />
          </div>
          <div>
            <label className="label">Дата и час</label>
            <input className="input" type="datetime-local" name="timestamp" defaultValue={new Date().toISOString().slice(0,16)} />
          </div>
          <div className="flex gap-3 pt-2 border-t">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <LoadingSpinner size="sm" /> : null}
              {saving ? 'Запазване...' : 'Добави събитие'}
            </button>
            <button type="button" onClick={() => setAddModal(false)} className="btn-secondary">Отказ</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
