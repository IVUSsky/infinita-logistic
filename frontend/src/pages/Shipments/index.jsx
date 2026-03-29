import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Download, Upload, Filter, RefreshCw } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { StatusBadge, DirectionBadge } from '../../components/common/StatusBadge'
import { fmtDate, fmtMoney, fmtWeight, TRANSPORT_ICONS } from '../../utils/helpers'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ShipmentModal from './ShipmentModal'
import { useAuth } from '../../contexts/AuthContext'

const STATUSES = ['', 'pending', 'confirmed', 'in_transit', 'customs', 'delivered', 'cancelled', 'returned']
const STATUS_BG = { '': 'Всички статуси', pending: 'Чакащ', confirmed: 'Потвърден', in_transit: 'В транзит', customs: 'Митница', delivered: 'Доставен', cancelled: 'Анулиран', returned: 'Върнат' }

export default function ShipmentsPage() {
  const { isManager } = useAuth()
  const [rows, setRows]           = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('')
  const [modal, setModal]         = useState({ open: false, data: null })
  const fileRef = useRef()

  const load = async (p = page, s = search, st = statusFilter) => {
    setLoading(true)
    try {
      const { data } = await api.get('/shipments', { params: { page: p, limit: 15, search: s || undefined, status: st || undefined } })
      setRows(data.data)
      setTotal(data.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(1, search, statusFilter) }, [statusFilter])
  useEffect(() => { load(page, search, statusFilter) }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load(1, search, statusFilter)
  }

  const handleExport = async () => {
    const res = await api.get('/shipments/export', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href = url; a.download = `pратки_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV файлът е изтеглен')
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      const { data } = await api.post('/shipments/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(`Импортирани: ${data.imported} пратки`)
      if (data.errors.length) toast.error(`Грешки: ${data.errors.slice(0,3).join(', ')}`)
      load(1, search, statusFilter)
    } catch (err) { toast.error(err.response?.data?.error || 'Грешка при импорт') }
    fileRef.current.value = ''
  }

  const handleSave = () => { setModal({ open: false, data: null }); load(1, search, statusFilter) }

  const handleDelete = async (id) => {
    if (!confirm('Изтриване на пратката?')) return
    try {
      await api.delete(`/shipments/${id}`)
      toast.success('Пратката е изтрита')
      load(page, search, statusFilter)
    } catch (err) { toast.error(err.response?.data?.error || 'Грешка') }
  }

  const pages = Math.ceil(total / 15)

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0 max-w-lg">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Търсене по номер, изпращач, получател..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn-secondary">Търси</button>
        </form>
        <div className="flex gap-2 flex-wrap">
          <select className="select w-44" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_BG[s]}</option>)}
          </select>
          <button onClick={() => load(1, search, statusFilter)} className="btn-secondary"><RefreshCw size={14} /></button>
          <button onClick={handleExport} className="btn-secondary"><Download size={14} />CSV</button>
          {isManager && (
            <>
              <button onClick={() => fileRef.current.click()} className="btn-secondary"><Upload size={14} />Импорт</button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
              <button onClick={() => setModal({ open: true, data: null })} className="btn-primary"><Plus size={14} />Нова пратка</button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">Общо: <strong>{total}</strong> пратки</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-gray-100">
                {['Tracking №', 'Статус', 'Посока', 'Маршрут', 'Изпращач / Получател', 'Куриер', 'Тегло', 'Стойност', 'Дата', ''].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={10} className="py-12 text-center"><LoadingSpinner className="mx-auto" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-gray-400 text-sm">Няма намерени пратки</td></tr>
              ) : rows.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-mono text-xs font-medium text-brand-700">{s.tracking_number}</td>
                  <td className="table-cell"><StatusBadge status={s.status} /></td>
                  <td className="table-cell"><DirectionBadge direction={s.direction} /></td>
                  <td className="table-cell whitespace-nowrap">
                    <span className="text-sm">{TRANSPORT_ICONS[s.transport_type] || ''} {s.origin_country} → {s.dest_country}</span>
                  </td>
                  <td className="table-cell max-w-xs">
                    <div className="text-sm truncate font-medium">{s.sender_name}</div>
                    <div className="text-xs text-gray-400 truncate">{s.recipient_name}</div>
                  </td>
                  <td className="table-cell text-sm">{s.courier_name || '—'}</td>
                  <td className="table-cell whitespace-nowrap">{fmtWeight(s.weight_kg)}</td>
                  <td className="table-cell whitespace-nowrap">{fmtMoney(s.declared_value, s.currency)}</td>
                  <td className="table-cell whitespace-nowrap text-xs">{fmtDate(s.created_at)}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ open: true, data: s })} className="text-xs text-brand-600 hover:underline">Редакция</button>
                      {isManager && <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline">Изтрий</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Страница {page} от {pages}</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 text-xs rounded ${p === page ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ShipmentModal open={modal.open} data={modal.data} onClose={() => setModal({ open: false, data: null })} onSave={handleSave} />
    </div>
  )
}
