import { useState, useEffect, useRef } from 'react'
import { Upload, Package, Trash2, ChevronDown, ChevronRight, FileText, Link2 } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { fmtDate } from '../../utils/helpers'
import { useAuth } from '../../contexts/AuthContext'

function num(v, dec = 2) {
  if (v == null) return '—'
  return typeof v === 'number' ? v.toFixed(dec) : v
}

function ItemsTable({ items }) {
  if (!items || items.length === 0) return <p className="text-sm text-gray-400 px-4 py-3">Няма артикули</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-3 py-2 font-medium text-gray-600 text-xs">Описание</th>
            <th className="px-3 py-2 font-medium text-gray-600 text-xs text-right">Кол.</th>
            <th className="px-3 py-2 font-medium text-gray-600 text-xs text-right">Картони</th>
            <th className="px-3 py-2 font-medium text-gray-600 text-xs text-right">Нетно (кг)</th>
            <th className="px-3 py-2 font-medium text-gray-600 text-xs text-right">Бруто (кг)</th>
            <th className="px-3 py-2 font-medium text-gray-600 text-xs text-right">CBM (м³)</th>
            <th className="px-3 py-2 font-medium text-gray-600 text-xs">Размери</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-3 py-2 max-w-xs">{item.description || '—'}</td>
              <td className="px-3 py-2 text-right">{item.quantity != null ? `${item.quantity} ${item.unit || 'pcs'}` : '—'}</td>
              <td className="px-3 py-2 text-right">{item.cartons ?? '—'}</td>
              <td className="px-3 py-2 text-right">{num(item.nw_kg)}</td>
              <td className="px-3 py-2 text-right">{num(item.gw_kg)}</td>
              <td className="px-3 py-2 text-right">{num(item.cbm, 3)}</td>
              <td className="px-3 py-2 text-xs text-gray-500">{item.dimensions || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PackingListCard({ record, onDelete, onLink, isManager, shipments }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="text-gray-400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <FileText size={16} className="text-brand-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{record.source_file}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {record.tracking_number
              ? <span className="text-brand-600 font-mono">{record.tracking_number}</span>
              : <span className="italic">Без пратка</span>
            }
            {' · '}
            {fmtDate(record.uploaded_at)}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
          <span><strong>{record.items?.length || 0}</strong> арт.</span>
          {record.total_gw_kg != null && <span><strong>{record.total_gw_kg}</strong> кг (бруто)</span>}
          {record.total_cbm   != null && <span><strong>{record.total_cbm}</strong> м³</span>}
          {record.total_cartons != null && <span><strong>{record.total_cartons}</strong> кт.</span>}
        </div>
        {isManager && (
          <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onLink(record)}
              className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded"
              title="Свържи с пратка"
            >
              <Link2 size={14} />
            </button>
            <button
              onClick={() => onDelete(record.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Изтрий"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      {expanded && (
        <div className="border-t border-gray-100">
          <ItemsTable items={record.items} />
          {(record.total_qty != null || record.total_nw_kg != null || record.total_gw_kg != null || record.total_cbm != null) && (
            <div className="flex gap-6 px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 font-medium">
              {record.total_qty    != null && <span>Общо бр.: {record.total_qty}</span>}
              {record.total_nw_kg != null && <span>Нетно: {record.total_nw_kg} кг</span>}
              {record.total_gw_kg != null && <span>Бруто: {record.total_gw_kg} кг</span>}
              {record.total_cbm   != null && <span>Обем: {record.total_cbm} м³</span>}
              {record.total_cartons != null && <span>Картони: {record.total_cartons}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ContentsPage() {
  const { isManager } = useAuth()
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [shipments, setShipments] = useState([])
  const [filterShipment, setFilterShipment] = useState('')
  const [linkModal, setLinkModal] = useState({ open: false, record: null })
  const [linkShipmentId, setLinkShipmentId] = useState('')
  const fileRef = useRef()

  const load = async (sid = filterShipment) => {
    setLoading(true)
    try {
      const params = { limit: 50 }
      if (sid) params.shipment_id = sid
      const { data } = await api.get('/contents', { params })
      setRecords(data.data)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.get('/shipments', { params: { limit: 100 } }).then(r => setShipments(r.data.data || []))
    load()
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    if (filterShipment) fd.append('shipment_id', filterShipment)
    setUploading(true)
    try {
      await api.post('/contents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(`"${file.name}" е обработен`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Грешка при качване')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Изтрий пакинг листа?')) return
    try {
      await api.delete(`/contents/${id}`)
      toast.success('Изтрито')
      load()
    } catch { toast.error('Грешка') }
  }

  const handleLink = async () => {
    if (!linkModal.record) return
    try {
      await api.put(`/contents/${linkModal.record.id}`, { shipment_id: linkShipmentId || null })
      toast.success('Свързан с пратка')
      setLinkModal({ open: false, record: null })
      load()
    } catch { toast.error('Грешка') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Съдържание на пратки</h1>
          <p className="text-sm text-gray-500 mt-0.5">Пакинг листи — PDF и Excel</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="select w-52"
            value={filterShipment}
            onChange={e => { setFilterShipment(e.target.value); load(e.target.value) }}
          >
            <option value="">Всички пратки</option>
            {shipments.map(s => (
              <option key={s.id} value={s.id}>{s.tracking_number} — {s.dest_country}</option>
            ))}
          </select>
          <label className={`btn-primary cursor-pointer flex items-center gap-2 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? <LoadingSpinner size="sm" /> : <Upload size={14} />}
            Качи пакинг лист
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.xlsx,.xls"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>

      {/* Stats bar */}
      {records.length > 0 && (() => {
        const totalGw  = records.reduce((s, r) => s + (r.total_gw_kg || 0), 0)
        const totalNw  = records.reduce((s, r) => s + (r.total_nw_kg || 0), 0)
        const totalCbm = records.reduce((s, r) => s + (r.total_cbm || 0), 0)
        const totalQty = records.reduce((s, r) => s + (r.total_qty || 0), 0)
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Артикули', value: totalQty, unit: 'бр.' },
              { label: 'Нетно', value: totalNw.toFixed(1), unit: 'кг' },
              { label: 'Бруто', value: totalGw.toFixed(1), unit: 'кг' },
              { label: 'Обем', value: totalCbm.toFixed(3), unit: 'м³' },
            ].map(c => (
              <div key={c.label} className="card p-4">
                <div className="text-lg font-bold text-gray-800">{c.value} <span className="text-sm font-normal text-gray-500">{c.unit}</span></div>
                <div className="text-xs text-gray-500">{c.label}</div>
              </div>
            ))}
          </div>
        )
      })()}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : records.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Няма пакинг листи</p>
          <p className="text-sm mt-1">Качете PDF или Excel файл</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(r => (
            <PackingListCard
              key={r.id}
              record={r}
              onDelete={handleDelete}
              onLink={rec => { setLinkShipmentId(rec.shipment_id || ''); setLinkModal({ open: true, record: rec }) }}
              isManager={isManager}
              shipments={shipments}
            />
          ))}
        </div>
      )}

      <Modal open={linkModal.open} onClose={() => setLinkModal({ open: false, record: null })} title="Свържи с пратка">
        <div className="space-y-4">
          <div>
            <label className="label">Пратка</label>
            <select className="select" value={linkShipmentId} onChange={e => setLinkShipmentId(e.target.value)}>
              <option value="">— без пратка —</option>
              {shipments.map(s => (
                <option key={s.id} value={s.id}>{s.tracking_number} — {s.dest_country}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2 border-t">
            <button className="btn-primary" onClick={handleLink}>Запази</button>
            <button className="btn-secondary" onClick={() => setLinkModal({ open: false, record: null })}>Отказ</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
