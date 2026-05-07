import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { fmtMoney, fmtDate, STATUS_LABELS, STATUS_COLORS } from '../../utils/helpers'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'

function pct(a, b) {
  if (!a || !b || b === 0) return null
  return (a / b) * 100
}

function calcTransportPerKg(freight, kg) {
  if (!freight || !kg || kg === 0) return null
  return freight / kg
}

// Разпределя транспортни разходи по артикули пропорционално на стойността
function allocateFreight(items, freightCost) {
  if (!items?.length || !freightCost) return []
  const totals = items.map(it => {
    const qty = parseFloat(it.quantity) || 0
    const price = parseFloat(it.unit_price) || 0
    return { ...it, lineValue: qty * price }
  })
  const totalValue = totals.reduce((s, it) => s + it.lineValue, 0)
  return totals.map(it => ({
    ...it,
    freightShare: totalValue > 0 ? (it.lineValue / totalValue) * freightCost : 0,
    freightPct: totalValue > 0 ? (it.lineValue / totalValue) * 100 : 0,
  }))
}

function Row({ shipment }) {
  const [open, setOpen] = useState(false)

  const inv = parseFloat(shipment.invoice_value) || 0
  const freight = parseFloat(shipment.freight_cost) || 0
  const kg = parseFloat(shipment.weight_kg) || 0
  const transportPct = pct(freight, inv)
  const transportPerKg = calcTransportPerKg(freight, kg)
  const allocatedItems = allocateFreight(shipment.items, freight)
  const hasItems = allocatedItems.length > 0 && allocatedItems.some(it => it.description)

  const statusCls = STATUS_COLORS[shipment.status] || 'bg-gray-100 text-gray-700'

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
        onClick={() => setOpen(o => !o)}
      >
        <td className="px-4 py-3 w-6 text-gray-400">
          {hasItems
            ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)
            : null}
        </td>
        <td className="px-4 py-3">
          <div className="font-mono text-xs text-blue-700 font-semibold">{shipment.tracking_number}</div>
          <div className="text-xs text-gray-400 mt-0.5">{fmtDate(shipment.departure_date)}</div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">{shipment.supplier || '—'}</td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls}`}>
            {STATUS_LABELS[shipment.status] || shipment.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
          {inv ? fmtMoney(inv, shipment.invoice_value_currency) : '—'}
        </td>
        <td className="px-4 py-3 text-right text-sm font-medium text-gray-800">
          {freight ? fmtMoney(freight, shipment.freight_cost_currency) : '—'}
        </td>
        <td className="px-4 py-3 text-right text-sm">
          {transportPct != null
            ? <span className={`font-semibold ${transportPct > 20 ? 'text-red-600' : transportPct > 10 ? 'text-orange-600' : 'text-green-700'}`}>
                {transportPct.toFixed(1)} %
              </span>
            : '—'}
        </td>
        <td className="px-4 py-3 text-right text-sm">
          {transportPerKg != null
            ? <span className="text-gray-700">{fmtMoney(transportPerKg, shipment.freight_cost_currency)}<span className="text-xs text-gray-400">/кг</span></span>
            : '—'}
        </td>
        <td className="px-4 py-3 text-right text-xs text-gray-500">
          {kg ? `${kg} кг` : '—'}
        </td>
      </tr>

      {/* Разгъване — артикули */}
      {open && hasItems && (
        <tr className="bg-blue-50 border-b border-blue-100">
          <td colSpan={9} className="px-6 py-3">
            <div className="text-xs font-semibold text-blue-700 mb-2">Разпределение на транспортните разходи по артикули</div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-gray-500 border-b border-blue-100">
                  <th className="text-left py-1.5 pr-4 font-medium">Артикул</th>
                  <th className="text-right py-1.5 pr-4 font-medium">Кол.</th>
                  <th className="text-right py-1.5 pr-4 font-medium">Ед. цена</th>
                  <th className="text-right py-1.5 pr-4 font-medium">Стойност</th>
                  <th className="text-right py-1.5 pr-4 font-medium">Дял %</th>
                  <th className="text-right py-1.5 font-medium">Транспорт</th>
                </tr>
              </thead>
              <tbody>
                {allocatedItems.filter(it => it.description).map((it, i) => (
                  <tr key={i} className="border-b border-blue-50">
                    <td className="py-1.5 pr-4 text-gray-700">{it.description}</td>
                    <td className="py-1.5 pr-4 text-right text-gray-600">{it.quantity} {it.unit}</td>
                    <td className="py-1.5 pr-4 text-right text-gray-600">
                      {it.unit_price ? fmtMoney(it.unit_price, it.unit_price_currency || 'EUR') : '—'}
                    </td>
                    <td className="py-1.5 pr-4 text-right font-medium text-gray-800">
                      {it.lineValue ? fmtMoney(it.lineValue, it.unit_price_currency || 'EUR') : '—'}
                    </td>
                    <td className="py-1.5 pr-4 text-right text-gray-500">
                      {it.freightPct ? `${it.freightPct.toFixed(1)} %` : '—'}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-blue-700">
                      {it.freightShare ? fmtMoney(it.freightShare, shipment.freight_cost_currency) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-blue-200 bg-blue-100">
                  <td colSpan={3} className="py-1.5 pr-4 font-semibold text-blue-800">Общо</td>
                  <td className="py-1.5 pr-4 text-right font-bold text-blue-900">
                    {fmtMoney(allocatedItems.reduce((s, it) => s + it.lineValue, 0), shipment.invoice_value_currency || 'EUR')}
                  </td>
                  <td className="py-1.5 pr-4 text-right font-semibold text-blue-800">100 %</td>
                  <td className="py-1.5 text-right font-bold text-blue-900">
                    {freight ? fmtMoney(freight, shipment.freight_cost_currency) : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}

export default function DocumentsPage() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState('')

  useEffect(() => {
    api.get('/shipments', { params: { limit: 200 } })
      .then(r => setShipments(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = shipments.filter(s => {
    const term = search.toLowerCase()
    const matchSearch = !term ||
      (s.tracking_number || '').toLowerCase().includes(term) ||
      (s.supplier || '').toLowerCase().includes(term) ||
      (s.invoice_number || '').toLowerCase().includes(term)
    const matchStatus = !status || s.status === status
    return matchSearch && matchStatus
  })

  // Обобщения
  const totals = filtered.reduce((acc, s) => {
    const inv = parseFloat(s.invoice_value) || 0
    const fr = parseFloat(s.freight_cost) || 0
    const kg = parseFloat(s.weight_kg) || 0
    acc.inv += inv
    acc.freight += fr
    acc.kg += kg
    return acc
  }, { inv: 0, freight: 0, kg: 0 })

  const totalPct = pct(totals.freight, totals.inv)
  const totalPerKg = calcTransportPerKg(totals.freight, totals.kg)

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" /> Документи & Транспортни разходи
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Фактурни стойности, транспортни разходи и тяхното разпределение</p>
        </div>
      </div>

      {/* Обобщаващи карти */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Фактурна стойност', value: totals.inv ? fmtMoney(totals.inv, 'EUR') : '—', sub: `${filtered.length} пратки`, color: 'blue' },
          { label: 'Транспортни разходи', value: totals.freight ? fmtMoney(totals.freight, 'EUR') : '—', sub: 'общо', color: 'orange' },
          { label: '% транспорт', value: totalPct != null ? `${totalPct.toFixed(1)} %` : '—', sub: 'от фактурната стойност', color: totalPct > 20 ? 'red' : totalPct > 10 ? 'yellow' : 'green' },
          { label: 'Транспорт / кг', value: totalPerKg != null ? fmtMoney(totalPerKg, 'EUR') : '—', sub: `${totals.kg.toFixed(0)} кг общо`, color: 'purple' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-${color}-100 p-4 shadow-sm`}>
            <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
            <div className="text-sm text-gray-600 mt-1">{label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Филтри */}
      <div className="flex gap-3">
        <input
          className="input max-w-xs"
          placeholder="Търсене по tracking, доставчик, фактура..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-44" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Всички статуси</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-6 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tracking</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Доставчик</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Статус</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Фактурна стойност</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Транспорт</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">% Транспорт</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Транспорт/кг</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Тегло</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9} className="text-center py-12 text-gray-400">Няма намерени пратки</td></tr>
              : filtered.map(s => <Row key={s.id} shipment={s} />)
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
