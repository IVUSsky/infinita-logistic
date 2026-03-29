import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Truck, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight, TrendingDown, Globe } from 'lucide-react'
import api from '../utils/api'
import { fmtMoney, fmtDate, STATUS_LABELS, STATUS_COLORS, TRANSPORT_ICONS } from '../utils/helpers'
import { StatusBadge } from '../components/common/StatusBadge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const PIE_COLORS = ['#2952ee', '#7c3aed', '#0891b2', '#d97706', '#16a34a', '#dc2626', '#6b7280']

const REGIONS = [
  { key: 'all', label: 'Всички' },
  { key: 'BG',  label: 'България' },
  { key: 'GR',  label: 'Гърция' },
]

// Q1 2026 реални финансови данни (Януари – Март 2026)
const Q1_2026 = {
  revenue:   1226764,
  expenses:  1281242,
  transport:   31014,
  customs:     77477,
}

export default function Dashboard() {
  const [stats, setStats]         = useState(null)
  const [finData, setFinData]     = useState(null)
  const [shipments, setShipments] = useState([])
  const [loading, setLoading]     = useState(true)
  const [region, setRegion]       = useState('all')

  useEffect(() => {
    const params = region !== 'all' ? `&country=${region}` : ''
    Promise.all([
      api.get(`/shipments/stats${region !== 'all' ? `?country=${region}` : ''}`),
      api.get('/financial/dashboard'),
      api.get(`/shipments?limit=6&page=1${params}`),
    ]).then(([s, f, sh]) => {
      setStats(s.data)
      setFinData(f.data)
      setShipments(sh.data.data)
    }).finally(() => setLoading(false))
  }, [region])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  const summaryCards = [
    { label: 'Общо пратки',    value: stats?.total || 0,        icon: Package,      color: 'text-brand-600',  bg: 'bg-brand-50' },
    { label: 'Този месец',     value: stats?.this_month || 0,   icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'В транзит',      value: stats?.by_status?.find(s => s.status==='in_transit')?.count || 0, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Чакащи',         value: stats?.by_status?.find(s => s.status==='pending')?.count || 0,   icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Доставени',      value: stats?.by_status?.find(s => s.status==='delivered')?.count || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Просрочени плащания', value: finData?.summary?.overdue_count || 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  const barData = (finData?.monthlyTotals || []).map(m => ({
    month: ['Яну','Фев','Мар','Апр','Май','Юни','Юли','Авг','Сеп','Окт','Ное','Дек'][parseInt(m.month)-1],
    'Разходи': Math.round(m.expenses),
  }))

  const pieData = (stats?.by_status || []).map(s => ({ name: STATUS_LABELS[s.status] || s.status, value: s.count }))

  const profit = Q1_2026.revenue - Q1_2026.expenses
  const margin = ((profit / Q1_2026.revenue) * 100).toFixed(1)

  return (
    <div className="space-y-6">

      {/* Header with region filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Преглед на операциите – Q1 2026</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <Globe size={14} className="text-gray-400 ml-2" />
          {REGIONS.map(r => (
            <button
              key={r.key}
              onClick={() => setRegion(r.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                region === r.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map(c => (
          <div key={c.label} className="card p-4">
            <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
              <c.icon size={18} className={c.color} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Q1 2026 Financial Analysis Banner */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-700">Финансов анализ – Януари / Март 2026</h3>
            <p className="text-xs text-gray-400 mt-0.5">Реални данни от счетоводен отчет</p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {profit >= 0 ? '+' : ''}{fmtMoney(profit)} ({margin}%)
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={15} className="text-green-600" />
              <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Приходи</span>
            </div>
            <div className="text-xl font-bold text-green-700">{fmtMoney(Q1_2026.revenue)}</div>
            <div className="text-xs text-green-600 mt-0.5">EUR</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={15} className="text-red-600" />
              <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Разходи</span>
            </div>
            <div className="text-xl font-bold text-red-700">{fmtMoney(Q1_2026.expenses)}</div>
            <div className="text-xs text-red-600 mt-0.5">EUR</div>
          </div>
          <div className="bg-brand-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck size={15} className="text-brand-600" />
              <span className="text-xs font-medium text-brand-700 uppercase tracking-wide">Транспорт</span>
            </div>
            <div className="text-xl font-bold text-brand-700">{fmtMoney(Q1_2026.transport)}</div>
            <div className="text-xs text-brand-600 mt-0.5">EUR</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={15} className="text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Мита</span>
            </div>
            <div className="text-xl font-bold text-yellow-700">{fmtMoney(Q1_2026.customs)}</div>
            <div className="text-xs text-yellow-600 mt-0.5">EUR</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Monthly costs chart */}
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-semibold text-gray-700 mb-4">Транспортни разходи по месеци (EUR)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`€${v}`, 'Разходи']} />
              <Bar dataKey="Разходи" fill="#2952ee" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-4">
            Пратки по статус{region !== 'all' ? ` · ${REGIONS.find(r => r.key === region)?.label}` : ''}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent shipments */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">
              Последни пратки{region !== 'all' ? ` · ${REGIONS.find(r => r.key === region)?.label}` : ''}
            </h3>
            <Link to="/shipments" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Всички <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {shipments.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Няма пратки за избрания регион</div>
            )}
            {shipments.map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <span className="text-xl">{TRANSPORT_ICONS[s.transport_type] || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{s.tracking_number}</div>
                  <div className="text-xs text-gray-500">{s.origin_country} → {s.dest_country} • {s.courier_name || '—'}</div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Financial summary */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">Финансово резюме ({new Date().getFullYear()})</h3>
            <Link to="/financial" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Dashboard <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Общо фактурирано', value: finData?.summary?.total_invoiced, color: 'text-gray-800' },
              { label: 'Платено', value: finData?.summary?.total_paid, color: 'text-green-600' },
              { label: 'Чакащо плащане', value: finData?.summary?.total_pending, color: 'text-yellow-600' },
              { label: 'Просрочено', value: finData?.summary?.total_overdue, color: 'text-red-600' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{r.label}</span>
                <span className={`text-sm font-semibold ${r.color}`}>{fmtMoney(r.value)}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Разходи по куриери</h4>
              {(finData?.byCourier || []).slice(0, 4).map(c => (
                <div key={c.name} className="flex items-center gap-3 mb-2">
                  <div className="text-xs text-gray-600 w-32 truncate">{c.name}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min(100, (c.total / (finData?.byCourier?.[0]?.total || 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs font-medium text-gray-700 w-16 text-right">{fmtMoney(c.total)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
