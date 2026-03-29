import { useState, useEffect } from 'react'
import { Plus, TrendingDown, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { fmtMoney, fmtDate, MONTHS_BG, FINANCIAL_STATUS } from '../../utils/helpers'
import { useAuth } from '../../contexts/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

const YEARS = [2024, 2025, 2026].filter(y => y <= new Date().getFullYear() + 1)
const COLORS = ['#2952ee','#7c3aed','#0891b2','#d97706','#16a34a','#dc2626','#6b7280','#0d9488']
const TYPE_LABELS = { invoice:'Фактура', expense:'Разход', payment:'Плащане', refund:'Възстановяване' }

export default function FinancialPage() {
  const { isManager } = useAuth()
  const [year, setYear]       = useState(new Date().getFullYear())
  const [dash, setDash]       = useState(null)
  const [records, setRecords] = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('dashboard')
  const [modal, setModal]     = useState({ open: false, data: null })
  const [couriers, setCouriers] = useState([])
  const [statusFilter, setStatusFilter] = useState('')

  const loadDash = async (y = year) => {
    const { data } = await api.get('/financial/dashboard', { params: { year: y } })
    setDash(data)
  }

  const loadRecords = async (s = '') => {
    setLoading(true)
    const { data } = await api.get('/financial', { params: { year, status: s || undefined, limit: 30 } })
    setRecords(data.data)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => {
    api.get('/couriers').then(r => setCouriers(r.data))
  }, [])

  useEffect(() => { loadDash(year); loadRecords(statusFilter) }, [year])

  const handleSave = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const body = { ...Object.fromEntries(fd), amount: parseFloat(fd.get('amount')), amount_bgn: parseFloat(fd.get('amount_bgn')) || null }
    try {
      if (modal.data?.id) { await api.put(`/financial/${modal.data.id}`, body); toast.success('Записът е обновен') }
      else { await api.post('/financial', body); toast.success('Записът е добавен') }
      setModal({ open: false, data: null })
      loadDash(year); loadRecords(statusFilter)
    } catch (err) { toast.error(err.response?.data?.error || 'Грешка') }
  }

  const barData = (dash?.monthlyTotals || []).map(m => ({
    month: MONTHS_BG[parseInt(m.month)-1],
    'Разходи': Math.round(m.expenses),
  }))

  const summaryCards = [
    { label: 'Общо фактурирано', value: dash?.summary?.total_invoiced, icon: TrendingDown, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Платено',          value: dash?.summary?.total_paid,     icon: TrendingUp,  color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Чакащо',           value: dash?.summary?.total_pending,  icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Просрочено',       value: dash?.summary?.total_overdue,  icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[['dashboard','📊 Dashboard'],['list','📋 Записи']].map(([t,l]) => (
            <button key={t} onClick={() => { setTab(t); if(t==='list') loadRecords(statusFilter) }} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t?'bg-white shadow text-brand-700':'text-gray-600 hover:text-gray-800'}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Година:</label>
          <select className="select w-28" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {isManager && tab === 'list' && (
            <button onClick={() => setModal({ open: true, data: null })} className="btn-primary"><Plus size={14} />Нов запис</button>
          )}
        </div>
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryCards.map(c => (
              <div key={c.label} className="card p-5">
                <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <c.icon size={18} className={c.color} />
                </div>
                <div className="text-xl font-bold text-gray-800">{fmtMoney(c.value)}</div>
                <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="card p-5 xl:col-span-2">
              <h3 className="font-semibold text-gray-700 mb-4">Транспортни разходи по месеци (EUR)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => [`€${v}`, 'Разходи']} />
                  <Bar dataKey="Разходи" fill="#2952ee" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 mb-4">По куриери</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={(dash?.byCourier||[]).slice(0,6).map(c=>({name:c.name,value:Math.round(c.total)}))} cx="50%" cy="50%" outerRadius={80} dataKey="value" fontSize={10}>
                    {(dash?.byCourier||[]).slice(0,6).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v=>[`€${v}`]} />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">Последни транспортни разходи</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Tracking №','Маршрут','Куриер','Транспортна цена','Обща цена','Дата'].map(h=>(
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(dash?.recentShipmentCosts||[]).map(s=>(
                    <tr key={s.tracking_number} className="hover:bg-gray-50">
                      <td className="table-cell font-mono text-xs text-brand-700">{s.tracking_number}</td>
                      <td className="table-cell text-sm">{s.origin_country} → {s.dest_country}</td>
                      <td className="table-cell text-sm">{s.courier||'—'}</td>
                      <td className="table-cell font-medium">{fmtMoney(s.freight_cost, s.currency)}</td>
                      <td className="table-cell font-medium">{fmtMoney(s.total_cost, s.currency)}</td>
                      <td className="table-cell text-xs text-gray-400">{fmtDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'list' && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <select className="select w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); loadRecords(e.target.value) }}>
              <option value="">Всички статуси</option>
              {Object.entries(FINANCIAL_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span className="text-xs text-gray-400">Общо: {total}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Тип','Описание','Пратка','Куриер','Сума','Фактура №','Падеж','Статус',''].map(h=>(
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? <tr><td colSpan={9} className="py-10 text-center"><LoadingSpinner className="mx-auto" /></td></tr>
                : records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{TYPE_LABELS[r.type]||r.type}</span>
                    </td>
                    <td className="table-cell text-sm max-w-xs truncate">{r.description}</td>
                    <td className="table-cell font-mono text-xs text-brand-600">{r.tracking_number||'—'}</td>
                    <td className="table-cell text-sm">{r.courier_name||'—'}</td>
                    <td className="table-cell font-semibold">{fmtMoney(r.amount, r.currency)}</td>
                    <td className="table-cell text-xs">{r.invoice_number||'—'}</td>
                    <td className="table-cell text-xs">{fmtDate(r.due_date)}</td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${FINANCIAL_STATUS[r.status]?.color || 'bg-gray-100'}`}>
                        {FINANCIAL_STATUS[r.status]?.label || r.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {isManager && <button onClick={() => setModal({ open: true, data: r })} className="text-xs text-brand-600 hover:underline">Редакция</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? 'Редакция на запис' : 'Нов финансов запис'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Тип *</label>
              <select className="select" name="type" defaultValue={modal.data?.type||'invoice'}>
                {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="label">Статус</label>
              <select className="select" name="status" defaultValue={modal.data?.status||'pending'}>
                {Object.entries(FINANCIAL_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Описание *</label><input className="input" name="description" defaultValue={modal.data?.description} required /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Сума *</label><input className="input" type="number" step="0.01" name="amount" defaultValue={modal.data?.amount} required /></div>
            <div><label className="label">Валута</label>
              <select className="select" name="currency" defaultValue={modal.data?.currency||'EUR'}>
                {['EUR','USD','BGN','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Сума (BGN)</label><input className="input" type="number" step="0.01" name="amount_bgn" defaultValue={modal.data?.amount_bgn} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Куриер</label>
              <select className="select" name="courier_id" defaultValue={modal.data?.courier_id||''}>
                <option value="">— без куриер —</option>
                {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Фактура №</label><input className="input" name="invoice_number" defaultValue={modal.data?.invoice_number} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Падеж</label><input className="input" type="date" name="due_date" defaultValue={modal.data?.due_date?.slice(0,10)} /></div>
            <div><label className="label">Дата плащане</label><input className="input" type="date" name="paid_date" defaultValue={modal.data?.paid_date?.slice(0,10)} /></div>
          </div>
          <div className="flex gap-3 pt-2 border-t">
            <button type="submit" className="btn-primary">{modal.data ? 'Запази' : 'Добави'}</button>
            <button type="button" onClick={() => setModal({ open: false, data: null })} className="btn-secondary">Отказ</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
