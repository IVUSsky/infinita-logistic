import { useEffect, useState } from 'react'
import api from '../../utils/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts'
import { Clock, TrendingUp, Package, Truck, Shield, AlertCircle, CheckCircle, MapPin } from 'lucide-react'

const TRANSPORT_BG  = { air:'Въздушен ✈️', sea:'Морски 🚢', rail:'Жп 🚂', road:'Наземен 🚛', express:'Експрес ⚡', unknown:'Неизвестен' }
const TRANSPORT_DAYS = { air: 5, sea: 28, rail: 18, road: 7, express: 2 }
const PIE_COLORS = ['#2952ee','#7c3aed','#0891b2','#d97706','#16a34a','#dc2626','#6b7280','#ec4899']
const MONTHS_BG = ['Яну','Фев','Мар','Апр','Май','Юни','Юли','Авг','Сеп','Окт','Ное','Дек']

function fmtEUR(v) {
  if (!v && v !== 0) return '—'
  return new Intl.NumberFormat('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' €'
}

function StatCard({ icon: Icon, label, value, sub, color = 'blue', small }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red:    'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div className={`font-bold text-gray-800 ${small ? 'text-xl' : 'text-2xl'}`}>{value ?? '—'}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!data)   return <div className="text-center py-20 text-gray-400">Грешка при зареждане</div>

  const { delivery, shipments, financial } = data

  // Charts data
  const transportPieData = Object.entries(shipments.by_transport)
    .map(([type, count]) => ({ name: TRANSPORT_BG[type] || type, value: count }))

  const monthData = shipments.by_month.map(m => ({
    month: MONTHS_BG[parseInt(m.month.slice(5)) - 1] + ' ' + m.month.slice(2,4),
    пратки: m.count
  }))

  const transitData = Object.entries(delivery.avg_days_by_transport).map(([type, avg]) => ({
    transport: TRANSPORT_BG[type] || type,
    'Реално (дни)': avg,
    'Стандарт (дни)': TRANSPORT_DAYS[type] || null
  }))

  const freightByTransportData = financial.freight_by_transport.map(f => ({
    name: TRANSPORT_BG[f.type] || f.type,
    'Разход (€)': f.eur
  }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Аналитика & Статистика</h1>
        <p className="text-sm text-gray-500 mt-0.5">Пълен анализ на логистиката, транспорта, времето за доставка и финансите</p>
        <p className="text-xs text-gray-400 mt-1">* Финансовите стойности са конвертирани в EUR по приблизителни фиксирани курсове</p>
      </div>

      {/* ── Доставки & Транзитни времена ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Доставки & Транзитни времена</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard icon={Package}      label="Общо пратки"         value={shipments.total}                          color="blue" />
          <StatCard icon={CheckCircle}  label="Доставени"           value={delivery.delivered_count}                 color="green" />
          <StatCard icon={Clock}        label="Средно дни доставка" value={delivery.avg_days_total ? `${delivery.avg_days_total} дни` : '—'} color="indigo" />
          <StatCard icon={TrendingUp}   label="В срок"              value={delivery.on_time_rate ? `${delivery.on_time_rate}%` : '—'} sub={`${delivery.on_time_count} от ${delivery.on_time_count + delivery.late_count}`} color="green" />
          <StatCard icon={AlertCircle}  label="Закъснели"           value={delivery.late_count}                      color="red" />
          <StatCard icon={Truck}        label="Видове транспорт"    value={Object.keys(shipments.by_transport).length} color="purple" />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Средно транзитно време по транспорт */}
        {transitData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-1">Средно транзитно време по вид транспорт</h3>
            <p className="text-xs text-gray-400 mb-4">Реално спрямо стандартното</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={transitData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="transport" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" д" />
                <Tooltip formatter={(v, n) => [`${v} дни`, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Реално (дни)"   fill="#2952ee" radius={[4,4,0,0]} />
                <Bar dataKey="Стандарт (дни)" fill="#e2e8f0" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Пратки по транспорт */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Пратки по вид транспорт</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={transportPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {transportPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Месечна динамика */}
      {monthData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Пратки по месеци</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="пратки" stroke="#2952ee" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Финансова статистика ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Финансова статистика (EUR)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard icon={TrendingUp}  label="Общо фактурирано"    value={fmtEUR(financial.total_invoice_eur)}   color="blue"   small />
          <StatCard icon={Truck}       label="Общо транспорт"      value={fmtEUR(financial.total_freight_eur)}   color="indigo" small />
          <StatCard icon={Shield}      label="Общо застраховки"    value={fmtEUR(financial.total_insurance_eur)} color="green"  small />
          <StatCard icon={AlertCircle} label="Общо мита (артикули)" value={fmtEUR(financial.total_customs_eur)}  color="amber"  small />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard icon={TrendingUp}  label="Очаквано ДДС"        value={fmtEUR(financial.total_expected_vat_eur)}  color="purple" small />
          <StatCard icon={CheckCircle} label="Реално платено ДДС"  value={fmtEUR(financial.total_actual_vat_eur)}    color="green"  small />
          <StatCard icon={CheckCircle} label="Реално платено Мито" value={fmtEUR(financial.total_actual_customs_eur)} color="amber"  small />
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-blue-50 text-blue-600">
              <TrendingUp size={18} />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-500">Ср. транспорт / фактура</div>
              <div className="text-xl font-bold text-gray-800">{financial.avg_freight_pct ? `${financial.avg_freight_pct}%` : '—'}</div>
              <div className="text-xs text-gray-400">Ср. транспорт / кг: {financial.avg_freight_per_kg ? `${financial.avg_freight_per_kg} €` : '—'}</div>
            </div>
          </div>
        </div>

        {/* Транспортни разходи по вид */}
        {freightByTransportData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Транспортни разходи по вид (EUR)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={freightByTransportData} margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`€${v}`, 'Разход']} />
                <Bar dataKey="Разход (€)" fill="#7c3aed" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Топ доставчици */}
        {shipments.top_suppliers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Топ доставчици</h3>
            <div className="space-y-2">
              {shipments.top_suppliers.map((s, i) => (
                <div key={s.supplier} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">{s.supplier}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, (s.count / shipments.top_suppliers[0].count) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-gray-800">{s.count} пр.</div>
                    <div className="text-xs text-gray-400">{fmtEUR(s.freight_eur)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Топ спедитори */}
        {shipments.top_forwarders.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Топ спедитори</h3>
            <div className="space-y-2">
              {shipments.top_forwarders.map((f, i) => (
                <div key={f.forwarder} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">{f.forwarder}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${Math.min(100, (f.freight_eur / shipments.top_forwarders[0].freight_eur) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-gray-800">{fmtEUR(f.freight_eur)}</div>
                    <div className="text-xs text-gray-400">{f.count} пр.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Топ произходи */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin size={15} className="text-gray-400" /> Топ страни — произход
          </h3>
          <div className="space-y-2">
            {shipments.top_origins.map((o, i) => (
              <div key={o.country} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5">{i+1}</span>
                <span className="text-sm font-medium text-gray-700 w-8">{o.country}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${(o.count / shipments.top_origins[0].count) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-8 text-right">{o.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Топ дестинации */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin size={15} className="text-gray-400" /> Топ страни — дестинация
          </h3>
          <div className="space-y-2">
            {shipments.top_dests.map((d, i) => (
              <div key={d.country} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5">{i+1}</span>
                <span className="text-sm font-medium text-gray-700 w-8">{d.country}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full"
                    style={{ width: `${(d.count / shipments.top_dests[0].count) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incoterms */}
        {shipments.by_incoterms.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Условия на доставка (Incoterms)</h3>
            <div className="space-y-2">
              {shipments.by_incoterms.map((it, i) => (
                <div key={it.term} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-5">{i+1}</span>
                  <span className="text-sm font-bold text-gray-700 w-12">{it.term}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${(it.count / shipments.by_incoterms[0].count) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-8 text-right">{it.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
