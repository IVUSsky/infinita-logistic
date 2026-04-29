import { useState, useEffect } from 'react'
import Modal from '../../components/common/Modal'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Upload, Trash2, Download, Lock, Unlock } from 'lucide-react'

const STATUSES = ['pending','confirmed','in_transit','customs','delivered','cancelled','returned']
const STATUS_BG = {
  pending:'Чакащ', confirmed:'Потвърден', in_transit:'В транзит',
  customs:'Митница', delivered:'Доставен', cancelled:'Анулиран', returned:'Върнат'
}
const COUNTRIES = {
  BG:'България', GR:'Гърция', DE:'Германия', AT:'Австрия', CN:'Китай',
  US:'САЩ', JP:'Япония', FR:'Франция', IT:'Италия', NL:'Нидерландия',
  GB:'Великобритания', CH:'Швейцария', TR:'Турция', RO:'Румъния', RS:'Сърбия',
  PL:'Полша', HU:'Унгария', CZ:'Чехия', SK:'Словакия', IN:'Индия', KR:'Южна Корея'
}
const TRANSPORT = { air:'Въздушен ✈️', sea:'Морски 🚢', rail:'Жп 🚂', road:'Наземен 🚛', express:'Експрес ⚡' }
const TRANSIT_DAYS = { air: 5, sea: 28, rail: 18, road: 7, express: 2 }
const INCOTERMS = ['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP']
const CURRENCIES = ['EUR','USD','BGN','GBP','CNY']
const UNITS = ['бр.','кг','м','м²','м³','л','компл.','чифт','кутия']
const DOC_TYPES = {
  offer: 'Оферта спедитор',
  bl: 'Товарителница (B/L)',
  insurance: 'Застрах. сертификат',
  customs: 'Митническа декларация',
  invoice: 'Фактура',
  other: 'Друго'
}
const TABS = [
  { id: 'basic',      label: 'Основни' },
  { id: 'transport',  label: 'Транспорт & Дати' },
  { id: 'cargo',      label: 'Съдържание' },
  { id: 'financial',  label: 'Финанси' },
  { id: 'documents',  label: 'Документи' },
]

const EMPTY_ITEM = {
  description: '', quantity: '', unit: 'бр.',
  hs_code: '', unit_price: '', unit_price_currency: 'EUR',
  customs_duty: '', customs_duty_currency: 'EUR',
  vat: '', vat_currency: 'BGN'
}

const EMPTY = {
  tracking_number: '', status: 'pending', direction: 'import',
  supplier: '', order_date: '', incoterms: '',
  origin_country: 'DE', origin_city: '', dest_country: 'BG', dest_city: 'София',
  sender_name: '', sender_address: '', recipient_name: 'Инфинита ООД', recipient_address: '',
  freight_forwarder: '', courier_id: '', transport_type: 'road',
  readiness_date: '', departure_date: '', estimated_delivery: '',
  weight_kg: '', packages_count: 1, length_cm: '', width_cm: '', height_cm: '',
  items: [{ ...EMPTY_ITEM }],
  description: '',
  declared_value: '', declared_value_currency: 'EUR',
  freight_cost: '', freight_cost_currency: 'EUR',
  insurance_cost: '', insurance_cost_currency: 'EUR',
  total_cost: '', total_cost_currency: 'EUR',
  invoice_number: '', po_number: '', notes: '',
  // ДДС & Мито при доставка
  expected_vat: '', expected_vat_currency: 'EUR',
  actual_vat: '', actual_vat_currency: 'EUR',
  actual_customs_duty: '', actual_customs_duty_currency: 'EUR'
}

export default function ShipmentModal({ open, data, onClose, onSave }) {
  const [form, setForm]             = useState(EMPTY)
  const [tab, setTab]               = useState('basic')
  const [couriers, setCouriers]     = useState([])
  const [saving, setSaving]         = useState(false)
  const [deliveryManual, setDeliveryManual] = useState(false)
  const [vatManual, setVatManual]   = useState(false)
  const [eurRates, setEurRates]     = useState({})
  const [rateDate, setRateDate]     = useState(null)
  const [docs, setDocs]             = useState([])
  const [uploading, setUploading]   = useState(false)

  useEffect(() => {
    if (open) {
      setTab('basic')
      api.get('/couriers').then(r => setCouriers(r.data)).catch(() => {})

      fetch('https://open.er-api.com/v6/latest/EUR')
        .then(r => r.json())
        .then(d => {
          if (d.rates) { setEurRates(d.rates); setRateDate(d.time_last_update_utc || null) }
        })
        .catch(() => {})

      if (data) {
        let items = data.items
        if (items && typeof items === 'string') {
          try { items = JSON.parse(items) } catch { items = null }
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
          items = data.hs_code
            ? [{ ...EMPTY_ITEM, hs_code: data.hs_code, customs_duty: data.customs_duty || '' }]
            : [{ ...EMPTY_ITEM }]
        }
        setForm({ ...EMPTY, ...data, items })
        setDeliveryManual(!!data.estimated_delivery)
        setVatManual(!!data.expected_vat)
        if (data.id) {
          api.get(`/shipments/${data.id}/documents`).then(r => setDocs(r.data)).catch(() => setDocs([]))
        }
      } else {
        setForm(EMPTY)
        setDeliveryManual(false)
        setVatManual(false)
        setDocs([])
      }
    }
  }, [open, data])

  // Авто-изчисляване на очаквана доставка
  useEffect(() => {
    if (!deliveryManual && form.departure_date && form.transport_type && TRANSIT_DAYS[form.transport_type]) {
      const dep = new Date(form.departure_date)
      dep.setDate(dep.getDate() + TRANSIT_DAYS[form.transport_type])
      setForm(p => ({ ...p, estimated_delivery: dep.toISOString().slice(0, 10) }))
    }
  }, [form.departure_date, form.transport_type, deliveryManual])

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }))
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, key, val) => setForm(p => ({
    ...p, items: p.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item)
  }))

  // ─── Изчисления ──────────────────────────────────────────────────────────────
  const weightNum = parseFloat(form.weight_kg) || 0
  const tons = weightNum > 0 ? (weightNum / 1000).toFixed(3) : null
  const cbm = (form.length_cm && form.width_cm && form.height_cm)
    ? ((parseFloat(form.length_cm) * parseFloat(form.width_cm) * parseFloat(form.height_cm)) / 1_000_000
        * parseInt(form.packages_count || 1)).toFixed(3)
    : null

  function toEUR(amount, currency) {
    const val = parseFloat(amount)
    if (!amount || isNaN(val)) return null
    if (currency === 'EUR') return val
    if (eurRates[currency]) return val / eurRates[currency]
    return null
  }

  const invoiceEUR   = toEUR(form.declared_value, form.declared_value_currency)
  const freightEUR   = toEUR(form.freight_cost, form.freight_cost_currency)
  const insuranceEUR = toEUR(form.insurance_cost, form.insurance_cost_currency)
  const freightPct    = invoiceEUR && freightEUR ? ((freightEUR / invoiceEUR) * 100).toFixed(2) : null
  const freightPerKg  = freightEUR && weightNum > 0 ? (freightEUR / weightNum).toFixed(3) : null
  const freightPerCbm = freightEUR && cbm ? (freightEUR / parseFloat(cbm)).toFixed(2) : null

  // Митническа основа и авто-изчислено ДДС (20%)
  // Митн. основа = фактурна стойност + транспорт + застраховка + мито
  const totalDutyEUR = form.items.reduce((sum, it) => {
    const d = toEUR(it.customs_duty, it.customs_duty_currency)
    return sum + (d || 0)
  }, 0)
  const customsBaseEUR = (invoiceEUR || 0) + (freightEUR || 0) + (insuranceEUR || 0) + totalDutyEUR
  const autoVatEUR = customsBaseEUR > 0 ? customsBaseEUR * 0.20 : null

  // ─── Документи ───────────────────────────────────────────────────────────────
  const handleDocUpload = async (type, file) => {
    if (!data?.id || !file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    try {
      const res = await api.post(`/shipments/${data.id}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setDocs(prev => [...prev, res.data])
      toast.success('Документът е прикачен')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Грешка при качване')
    } finally { setUploading(false) }
  }

  const handleDocDownload = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = doc.original_name
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch { toast.error('Грешка при изтегляне') }
  }

  const handleDocDelete = async (docId) => {
    if (!confirm('Изтриване на документа?')) return
    try {
      await api.delete(`/documents/${docId}`)
      setDocs(prev => prev.filter(d => d.id !== docId))
      toast.success('Документът е изтрит')
    } catch { toast.error('Грешка') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sender_name || !form.recipient_name || !form.origin_country || !form.dest_country) {
      return toast.error('Попълнете задължителните полета (*)')
    }
    setSaving(true)
    try {
      if (data?.id) {
        await api.put(`/shipments/${data.id}`, form)
        toast.success('Пратката е обновена')
      } else {
        await api.post('/shipments', form)
        toast.success('Пратката е създадена')
      }
      onSave()
    } catch (err) { toast.error(err.response?.data?.error || 'Грешка') }
    finally { setSaving(false) }
  }

  const CurrencySelect = ({ field }) => (
    <select className="select !w-20 flex-shrink-0 text-sm" value={form[field]} onChange={f(field)}>
      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  )

  const fmtBytes = (b) => b > 1024*1024 ? `${(b/1024/1024).toFixed(1)} MB` : `${Math.round(b/1024)} KB`

  return (
    <Modal open={open} onClose={onClose} title={data ? `Редакция: ${data.tracking_number}` : 'Нова пратка'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Таб бар ──────────────────────────────────────────────────────── */}
        <div className="flex gap-0.5 border-b border-gray-200 -mt-1">
          {TABS.map(t => (
            <button
              key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
              {t.id === 'documents' && docs.length > 0 && (
                <span className="ml-1.5 bg-blue-100 text-blue-600 text-xs rounded-full px-1.5 py-0.5">{docs.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ТАБ: ОСНОВНИ                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Tracking / Реф. №</label>
                <input className="input" placeholder="INF-2024-..." value={form.tracking_number} onChange={f('tracking_number')} />
              </div>
              <div>
                <label className="label">Статус *</label>
                <select className="select" value={form.status} onChange={f('status')}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_BG[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Посока</label>
                <select className="select" value={form.direction} onChange={f('direction')}>
                  <option value="import">Внос</option>
                  <option value="export">Износ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="label">Доставчик</label>
                <input className="input" placeholder="Наименование..." value={form.supplier} onChange={f('supplier')} />
              </div>
              <div>
                <label className="label">Номер на поръчка</label>
                <input className="input" placeholder="PO-2024-001" value={form.po_number} onChange={f('po_number')} />
              </div>
              <div>
                <label className="label">Дата на поръчка</label>
                <input className="input" type="date" value={form.order_date} onChange={f('order_date')} />
              </div>
              <div>
                <label className="label">Условия на доставка</label>
                <select className="select" value={form.incoterms} onChange={f('incoterms')}>
                  <option value="">— Incoterms —</option>
                  {INCOTERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Произход *</label>
                  <select className="select" value={form.origin_country} onChange={f('origin_country')}>
                    {Object.entries(COUNTRIES).map(([k,v]) => <option key={k} value={k}>{k} — {v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Град</label>
                  <input className="input" value={form.origin_city} onChange={f('origin_city')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Дестинация *</label>
                  <select className="select" value={form.dest_country} onChange={f('dest_country')}>
                    {Object.entries(COUNTRIES).map(([k,v]) => <option key={k} value={k}>{k} — {v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Град</label>
                  <input className="input" value={form.dest_city} onChange={f('dest_city')} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Изпращач *</label>
                <input className="input" value={form.sender_name} onChange={f('sender_name')} required />
                <input className="input mt-1.5" placeholder="Адрес" value={form.sender_address} onChange={f('sender_address')} />
              </div>
              <div>
                <label className="label">Получател *</label>
                <input className="input" value={form.recipient_name} onChange={f('recipient_name')} required />
                <input className="input mt-1.5" placeholder="Адрес" value={form.recipient_address} onChange={f('recipient_address')} />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ТАБ: ТРАНСПОРТ & ДАТИ                                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'transport' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Спедитор</label>
                <input className="input" placeholder="Наименование..." value={form.freight_forwarder} onChange={f('freight_forwarder')} />
              </div>
              <div>
                <label className="label">Куриер (в системата)</label>
                <select className="select" value={form.courier_id} onChange={f('courier_id')}>
                  <option value="">— без куриер —</option>
                  {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Вид транспорт</label>
                <select className="select" value={form.transport_type} onChange={f('transport_type')}>
                  <option value="">— изберете —</option>
                  {Object.entries(TRANSPORT).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {form.transport_type && TRANSIT_DAYS[form.transport_type] && (
                  <p className="text-xs text-gray-400 mt-1">
                    Стандартен транзит: <strong>{TRANSIT_DAYS[form.transport_type]} дни</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="label">Дата на готовност</label>
                <input className="input" type="date" value={form.readiness_date} onChange={f('readiness_date')} />
              </div>
              <div>
                <label className="label">Дата на отпътуване</label>
                <input className="input" type="date" value={form.departure_date} onChange={f('departure_date')} />
              </div>
              <div>
                <label className="label">Транзит (дни)</label>
                <input
                  className="input bg-gray-50 text-gray-500 text-center cursor-default"
                  readOnly
                  value={form.transport_type && TRANSIT_DAYS[form.transport_type] ? `${TRANSIT_DAYS[form.transport_type]} дни` : '—'}
                />
              </div>
              <div>
                <label className="label flex items-center gap-1.5">
                  Очаквана доставка
                  <button
                    type="button"
                    title={deliveryManual ? 'Включи авто-изчисление' : 'Ръчно въвеждане'}
                    onClick={() => setDeliveryManual(p => !p)}
                    className={`transition-colors ${deliveryManual ? 'text-orange-400 hover:text-orange-600' : 'text-blue-400 hover:text-blue-600'}`}
                  >
                    {deliveryManual ? <Unlock size={12} /> : <Lock size={12} />}
                  </button>
                </label>
                <input
                  className={`input ${!deliveryManual ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  type="date"
                  value={form.estimated_delivery?.slice(0,10) || ''}
                  onChange={e => { setDeliveryManual(true); setForm(p => ({ ...p, estimated_delivery: e.target.value })) }}
                />
                <p className={`text-xs mt-0.5 ${deliveryManual ? 'text-orange-400' : 'text-blue-400'}`}>
                  {deliveryManual ? '✎ Ръчно въведена' : '🔄 Авто-изчислена'}
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <label className="label font-semibold mb-0">Размери на пратката</label>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="label text-xs text-gray-500">Тегло (кг)</label>
                  <input className="input" type="number" step="0.01" min="0" value={form.weight_kg} onChange={f('weight_kg')} />
                </div>
                <div>
                  <label className="label text-xs text-gray-500">Брой колети</label>
                  <input className="input" type="number" min="1" value={form.packages_count} onChange={f('packages_count')} />
                </div>
                <div>
                  <label className="label text-xs text-gray-500">Размер 1 колет (см)</label>
                  <div className="flex gap-1">
                    <input className="input text-sm" type="number" min="0" placeholder="Д" value={form.length_cm} onChange={f('length_cm')} />
                    <input className="input text-sm" type="number" min="0" placeholder="Ш" value={form.width_cm} onChange={f('width_cm')} />
                    <input className="input text-sm" type="number" min="0" placeholder="В" value={form.height_cm} onChange={f('height_cm')} />
                  </div>
                </div>
                <div>
                  <label className="label text-xs text-gray-500">Тонаж</label>
                  <input className="input bg-gray-50 text-gray-600 font-semibold cursor-default" readOnly value={tons ? `${tons} т` : '—'} />
                </div>
                <div>
                  <label className="label text-xs text-gray-500">Обем CBM</label>
                  <input className="input bg-gray-50 text-gray-600 font-semibold cursor-default" readOnly value={cbm ? `${cbm} м³` : '—'} />
                </div>
              </div>
              {cbm && <p className="text-xs text-gray-400">CBM = Д × Ш × В (1 колет) × брой колети</p>}
            </div>

            <div>
              <label className="label">Описание на стоките <span className="text-gray-400 font-normal">(общо)</span></label>
              <input className="input" placeholder="напр. Медицински консумативи..." value={form.description} onChange={f('description')} />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ТАБ: СЪДЪРЖАНИЕ                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'cargo' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Артикули — съдържание на пратката</h3>
              <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                + Добави артикул
              </button>
            </div>

            {/* Header row */}
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <div className="grid gap-1.5 text-xs text-gray-400 font-medium px-1 mb-1"
                  style={{ gridTemplateColumns: '180px 110px 55px 65px 85px 60px 80px 60px 80px 60px 24px' }}>
                  <span>Описание на стоката</span>
                  <span>HS Код</span>
                  <span>Кол.</span>
                  <span>Ед.</span>
                  <span>Ед. цена</span>
                  <span>Вал.</span>
                  <span className="text-amber-600 font-semibold">Мито ↗</span>
                  <span>Вал.</span>
                  <span className="text-purple-500">ДДС ℹ</span>
                  <span>Вал.</span>
                  <span></span>
                </div>

                {form.items.map((item, i) => (
                  <div key={i} className="grid gap-1.5 items-center mb-1.5"
                    style={{ gridTemplateColumns: '180px 110px 55px 65px 85px 60px 80px 60px 80px 60px 24px' }}>
                    <input
                      className="input text-sm" placeholder="Стока..."
                      value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                    />
                    <input
                      className="input text-sm" placeholder="9018.12"
                      value={item.hs_code}
                      onChange={e => updateItem(i, 'hs_code', e.target.value)}
                    />
                    <input
                      className="input text-sm text-center" type="number" min="0" step="1" placeholder="1"
                      value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                    />
                    <select className="select text-sm" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input
                      className="input text-sm" type="number" min="0" step="0.01" placeholder="0.00"
                      value={item.unit_price}
                      onChange={e => updateItem(i, 'unit_price', e.target.value)}
                    />
                    <select className="select text-sm" value={item.unit_price_currency} onChange={e => updateItem(i, 'unit_price_currency', e.target.value)}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {/* Мито — включва се в разходи */}
                    <input
                      className="input text-sm border-amber-200 focus:ring-amber-300" type="number" min="0" step="0.01" placeholder="0.00"
                      value={item.customs_duty}
                      onChange={e => updateItem(i, 'customs_duty', e.target.value)}
                    />
                    <select className="select text-sm" value={item.customs_duty_currency} onChange={e => updateItem(i, 'customs_duty_currency', e.target.value)}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {/* ДДС — само информативно, не се включва в разходи */}
                    <input
                      className="input text-sm border-purple-200 focus:ring-purple-300 bg-purple-50" type="number" min="0" step="0.01" placeholder="0.00"
                      value={item.vat}
                      onChange={e => updateItem(i, 'vat', e.target.value)}
                    />
                    <select className="select text-sm" value={item.vat_currency} onChange={e => updateItem(i, 'vat_currency', e.target.value)}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {form.items.length > 1 ? (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xl leading-none text-center">×</button>
                    ) : <span />}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400">
              <span className="text-amber-600 font-medium">Мито ↗</span> — включва се в разходите на пратката &nbsp;|&nbsp;
              <span className="text-purple-500">ДДС ℹ</span> — само за информация, не се включва в разходите
            </p>

            {/* Item totals */}
            {form.items.some(it => parseFloat(it.quantity) > 0 && parseFloat(it.unit_price) > 0) && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1">
                <p className="text-xs font-semibold text-gray-500 mb-1">Стойности по артикул:</p>
                {form.items.map((item, i) => {
                  const total = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)
                  if (total <= 0) return null
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.description || `Артикул ${i+1}`}</span>
                      <span className="font-medium text-gray-800">{total.toFixed(2)} {item.unit_price_currency}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ТАБ: ФИНАНСИ                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'financial' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Фактурна стойност</label>
                <div className="flex gap-1.5">
                  <input className="input flex-1" type="number" min="0" step="0.01" value={form.declared_value} onChange={f('declared_value')} />
                  <CurrencySelect field="declared_value_currency" />
                </div>
              </div>
              <div>
                <label className="label">Фактура №</label>
                <input className="input" value={form.invoice_number} onChange={f('invoice_number')} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Цена на транспорт</label>
                <div className="flex gap-1.5">
                  <input className="input flex-1" type="number" min="0" step="0.01" value={form.freight_cost} onChange={f('freight_cost')} />
                  <CurrencySelect field="freight_cost_currency" />
                </div>
              </div>
              <div>
                <label className="label">Застраховка</label>
                <div className="flex gap-1.5">
                  <input className="input flex-1" type="number" min="0" step="0.01" value={form.insurance_cost} onChange={f('insurance_cost')} />
                  <CurrencySelect field="insurance_cost_currency" />
                </div>
              </div>
              <div>
                <label className="label">Обща цена</label>
                <div className="flex gap-1.5">
                  <input className="input flex-1" type="number" min="0" step="0.01" value={form.total_cost} onChange={f('total_cost')} />
                  <CurrencySelect field="total_cost_currency" />
                </div>
              </div>
            </div>

            {/* Calculation panel */}
            {(freightPct || freightPerKg || freightPerCbm) && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">Анализ на транспортните разходи</h4>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {freightPct && (
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-blue-100">
                      <div className="text-2xl font-bold text-blue-700">{freightPct}%</div>
                      <div className="text-xs text-gray-500 mt-0.5">от фактурната стойност</div>
                    </div>
                  )}
                  {freightPerKg && (
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-blue-100">
                      <div className="text-2xl font-bold text-blue-700">{freightPerKg} €</div>
                      <div className="text-xs text-gray-500 mt-0.5">на килограм</div>
                    </div>
                  )}
                  {freightPerCbm && (
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-blue-100">
                      <div className="text-2xl font-bold text-blue-700">{freightPerCbm} €</div>
                      <div className="text-xs text-gray-500 mt-0.5">на кубичен метър</div>
                    </div>
                  )}
                </div>

                {/* EUR equivalents */}
                {Object.keys(eurRates).length > 0 && (
                  <div className="text-xs text-blue-600 space-y-0.5 pt-2 border-t border-blue-100">
                    {form.declared_value_currency !== 'EUR' && invoiceEUR && (
                      <div>Фактурна стойност: <strong>{invoiceEUR.toFixed(2)} EUR</strong>
                        {' '}(курс: 1 EUR = {eurRates[form.declared_value_currency]?.toFixed(4)} {form.declared_value_currency})</div>
                    )}
                    {form.freight_cost_currency !== 'EUR' && freightEUR && (
                      <div>Транспорт: <strong>{freightEUR.toFixed(2)} EUR</strong>
                        {' '}(курс: 1 EUR = {eurRates[form.freight_cost_currency]?.toFixed(4)} {form.freight_cost_currency})</div>
                    )}
                    {rateDate && (
                      <div className="text-gray-400 pt-1">Курс към: {new Date(rateDate).toLocaleDateString('bg-BG')}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Очаквано ДДС & реални стойности при доставка ── */}
            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-purple-800">ДДС & Мито при доставка</h4>
                {autoVatEUR && (
                  <span className="text-xs text-purple-500">
                    Митническа основа: <strong>{customsBaseEUR.toFixed(2)} EUR</strong>
                  </span>
                )}
              </div>

              {/* Очаквано ДДС */}
              <div>
                <label className="label text-purple-700 flex items-center gap-2">
                  Очаквано ДДС (20%)
                  <button
                    type="button"
                    title={vatManual ? 'Включи авто-изчисление' : 'Ръчна корекция'}
                    onClick={() => {
                      if (!vatManual && autoVatEUR) {
                        setForm(p => ({ ...p, expected_vat: autoVatEUR.toFixed(2) }))
                      }
                      setVatManual(p => !p)
                    }}
                    className={`transition-colors ${vatManual ? 'text-orange-400 hover:text-orange-600' : 'text-purple-400 hover:text-purple-600'}`}
                  >
                    {vatManual ? <Unlock size={12} /> : <Lock size={12} />}
                  </button>
                </label>
                <div className="flex gap-1.5 items-center">
                  <div className="flex gap-1.5 flex-1">
                    <input
                      className={`input flex-1 ${!vatManual ? 'bg-purple-100 text-purple-800 font-semibold' : ''}`}
                      type="number" min="0" step="0.01"
                      placeholder={autoVatEUR ? autoVatEUR.toFixed(2) : '0.00'}
                      value={vatManual ? form.expected_vat : (autoVatEUR ? autoVatEUR.toFixed(2) : '')}
                      onChange={e => { setVatManual(true); setForm(p => ({ ...p, expected_vat: e.target.value })) }}
                    />
                    <select className="select !w-20" value={form.expected_vat_currency} onChange={f('expected_vat_currency')}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {!vatManual && autoVatEUR && (
                    <button
                      type="button"
                      onClick={() => { setForm(p => ({ ...p, expected_vat: autoVatEUR.toFixed(2), expected_vat_currency: 'EUR' })); setVatManual(true) }}
                      className="text-xs text-purple-600 hover:text-purple-800 border border-purple-300 rounded px-2 py-1 whitespace-nowrap"
                    >
                      Приеми {autoVatEUR.toFixed(2)} EUR
                    </button>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${vatManual ? 'text-orange-400' : 'text-purple-400'}`}>
                  {vatManual ? '✎ Ръчно коригирано' : '🔄 Авто: (фактура + транспорт + застраховка + мито) × 20% в EUR'}
                </p>
              </div>

              {/* Реални стойности при доставка */}
              <div className="border-t border-purple-200 pt-3">
                <p className="text-xs font-semibold text-purple-700 mb-2">Реални стойности при получаване на стоката:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs text-purple-700">Реално платено Мито</label>
                    <div className="flex gap-1.5">
                      <input className="input flex-1 border-amber-300" type="number" min="0" step="0.01" placeholder="0.00"
                        value={form.actual_customs_duty} onChange={f('actual_customs_duty')} />
                      <select className="select !w-20" value={form.actual_customs_duty_currency} onChange={f('actual_customs_duty_currency')}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs text-purple-700">Реално платено ДДС</label>
                    <div className="flex gap-1.5">
                      <input className="input flex-1 border-purple-300" type="number" min="0" step="0.01" placeholder="0.00"
                        value={form.actual_vat} onChange={f('actual_vat')} />
                      <select className="select !w-20" value={form.actual_vat_currency} onChange={f('actual_vat_currency')}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                {/* Отклонение */}
                {form.actual_vat && (vatManual ? form.expected_vat : autoVatBGN) && form.actual_vat_currency === form.expected_vat_currency && (() => {
                  const expected = vatManual ? parseFloat(form.expected_vat) : autoVatBGN
                  const actual   = parseFloat(form.actual_vat)
                  const diff = actual - expected
                  if (isNaN(diff)) return null
                  return (
                    <p className={`text-xs mt-2 font-medium ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {diff > 0 ? `▲ С ${diff.toFixed(2)} ${form.actual_vat_currency} повече от очакваното` :
                       diff < 0 ? `▼ С ${Math.abs(diff).toFixed(2)} ${form.actual_vat_currency} по-малко от очакваното` :
                       '✓ Точно съвпада с очакваното'}
                    </p>
                  )
                })()}
              </div>
            </div>

            {/* Мито & ДДС резюме от артикули */}
            {form.items.some(it => parseFloat(it.customs_duty) > 0 || parseFloat(it.vat) > 0) && (() => {
              const dutyByCur = {}
              const vatByCur  = {}
              form.items.forEach(it => {
                if (parseFloat(it.customs_duty) > 0) {
                  dutyByCur[it.customs_duty_currency] = (dutyByCur[it.customs_duty_currency] || 0) + parseFloat(it.customs_duty)
                }
                if (parseFloat(it.vat) > 0) {
                  vatByCur[it.vat_currency] = (vatByCur[it.vat_currency] || 0) + parseFloat(it.vat)
                }
              })
              return (
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(dutyByCur).length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Общо Мито (включено в разходи)</p>
                      {Object.entries(dutyByCur).map(([cur, amt]) => (
                        <p key={cur} className="text-lg font-bold text-amber-800">{amt.toFixed(2)} {cur}</p>
                      ))}
                    </div>
                  )}
                  {Object.keys(vatByCur).length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-700 mb-1">Общо ДДС (не се включва в разходи)</p>
                      {Object.entries(vatByCur).map(([cur, amt]) => (
                        <p key={cur} className="text-lg font-bold text-purple-800">{amt.toFixed(2)} {cur}</p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            <div>
              <label className="label">Бележки</label>
              <textarea className="input" rows={3} value={form.notes} onChange={f('notes')} />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ТАБ: ДОКУМЕНТИ                                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'documents' && (
          <div className="space-y-4">
            {!data?.id ? (
              <div className="text-center py-10 text-gray-400">
                <Upload size={42} className="mx-auto mb-3 opacity-25" />
                <p className="text-sm">Запазете пратката първо, след което<br/>можете да прикачвате документи.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(DOC_TYPES).map(([type, label]) => {
                    const typeDocs = docs.filter(d => d.type === type)
                    return (
                      <div key={type} className="border border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                          <label className={`cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-medium ${uploading ? 'opacity-40 pointer-events-none' : ''}`}>
                            + Прикачи
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx,.zip"
                              onChange={e => { if (e.target.files[0]) handleDocUpload(type, e.target.files[0]); e.target.value = '' }}
                            />
                          </label>
                        </div>
                        {typeDocs.length === 0 ? (
                          <p className="text-xs text-gray-400">Няма прикачени файлове</p>
                        ) : (
                          <div className="space-y-1">
                            {typeDocs.map(doc => (
                              <div key={doc.id} className="flex items-center bg-gray-50 rounded px-2 py-1 gap-2">
                                <span className="text-xs text-gray-600 truncate flex-1" title={doc.original_name}>
                                  📄 {doc.original_name}
                                  <span className="text-gray-400 ml-1">({fmtBytes(doc.size)})</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDocDownload(doc)}
                                  className="text-blue-400 hover:text-blue-600 flex-shrink-0"
                                  title="Изтегли"
                                >
                                  <Download size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDocDelete(doc.id)}
                                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                                  title="Изтрий"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <LoadingSpinner size="sm" />
                    <span>Качване на файл...</span>
                  </div>
                )}

                <p className="text-xs text-gray-400">Поддържани формати: PDF, JPG, PNG, Excel, Word, ZIP (макс. 10 MB)</p>
              </>
            )}
          </div>
        )}

        {/* ── Бутони ───────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <LoadingSpinner size="sm" />}
            {saving ? 'Запазване...' : data ? 'Запази промените' : 'Създай пратка'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Отказ</button>
        </div>
      </form>
    </Modal>
  )
}
