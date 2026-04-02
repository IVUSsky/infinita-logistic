import { useState, useEffect } from 'react'
import Modal from '../../components/common/Modal'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const STATUSES = ['pending','confirmed','in_transit','customs','delivered','cancelled','returned']
const STATUS_BG = { pending:'Чакащ', confirmed:'Потвърден', in_transit:'В транзит', customs:'Митница', delivered:'Доставен', cancelled:'Анулиран', returned:'Върнат' }
const COUNTRIES = { BG:'България',GR:'Гърция',DE:'Германия',AT:'Австрия',CN:'Китай',US:'САЩ',JP:'Япония',FR:'Франция',IT:'Италия',NL:'Нидерландия',GB:'Великобритания',CH:'Швейцария' }
const TRANSPORT = { air:'Въздушен ✈️',sea:'Морски 🚢',road:'Наземен 🚛',express:'Експрес ⚡' }
const CURRENCIES = ['EUR','USD','BGN','GBP','CNY']
// Очакван транзит в дни по вид транспорт
const TRANSIT_DAYS = { air: 5, sea: 28, road: 7, express: 2 }

const EMPTY_ITEM = { hs_code: '', customs_duty: '', customs_duty_currency: 'EUR' }

const EMPTY = {
  tracking_number:'', status:'pending', direction:'import', origin_country:'DE', origin_city:'',
  dest_country:'BG', dest_city:'София', sender_name:'', sender_address:'',
  recipient_name:'Инфинита ООД', recipient_address:'',
  courier_id:'', transport_type:'road',
  weight_kg:'', packages_count:1,
  length_cm:'', width_cm:'', height_cm:'',
  items:[{ ...EMPTY_ITEM }],
  description:'',
  declared_value:'', declared_value_currency:'EUR',
  freight_cost:'', freight_cost_currency:'EUR',
  total_cost:'', total_cost_currency:'EUR',
  invoice_number:'', po_number:'', notes:'',
  departure_date:'', estimated_delivery:''
}

export default function ShipmentModal({ open, data, onClose, onSave }) {
  const [form, setForm]       = useState(EMPTY)
  const [couriers, setCouriers] = useState([])
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (open) {
      api.get('/couriers').then(r => setCouriers(r.data))
      if (data) {
        // Backwards compat: ако старите данни имат hs_code/customs_duty вместо items
        let items = data.items
        if (items && typeof items === 'string') {
          try { items = JSON.parse(items) } catch { items = null }
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
          items = data.hs_code
            ? [{ hs_code: data.hs_code, customs_duty: data.customs_duty || '', customs_duty_currency: 'EUR' }]
            : [{ ...EMPTY_ITEM }]
        }
        setForm({ ...EMPTY, ...data, items })
      } else {
        setForm(EMPTY)
      }
    }
  }, [open, data])

  // Автоматично изчисляване на очаквана дата на доставка
  useEffect(() => {
    if (form.departure_date && form.transport_type && TRANSIT_DAYS[form.transport_type]) {
      const dep = new Date(form.departure_date)
      dep.setDate(dep.getDate() + TRANSIT_DAYS[form.transport_type])
      setForm(p => ({ ...p, estimated_delivery: dep.toISOString().slice(0, 10) }))
    }
  }, [form.departure_date, form.transport_type])

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  // Управление на артикули
  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }))
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, key, val) => setForm(p => ({
    ...p, items: p.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item)
  }))

  // Изчислени стойности
  const tons = form.weight_kg ? (parseFloat(form.weight_kg) / 1000).toFixed(3) : null
  const cbm = (form.length_cm && form.width_cm && form.height_cm)
    ? ((parseFloat(form.length_cm) * parseFloat(form.width_cm) * parseFloat(form.height_cm)) / 1_000_000 * parseInt(form.packages_count || 1)).toFixed(3)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sender_name || !form.recipient_name || !form.origin_country || !form.dest_country) {
      return toast.error('Попълнете задължителните полета')
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
    <select className="select !w-20 flex-shrink-0" value={form[field]} onChange={f(field)}>
      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  )

  return (
    <Modal open={open} onClose={onClose} title={data ? `Редакция: ${data.tracking_number}` : 'Нова пратка'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Ред 1: Tracking / Статус / Посока */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Tracking №</label>
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

        {/* Маршрут */}
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

        {/* Изпращач / Получател */}
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

        {/* Куриер / Транспорт */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Куриер</label>
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
          </div>
        </div>

        {/* Дати */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Дата на отпътуване</label>
            <input className="input" type="date" value={form.departure_date} onChange={f('departure_date')} />
          </div>
          <div>
            <label className="label">Очакван транзит</label>
            <input
              className="input bg-gray-50 text-gray-500 cursor-default"
              readOnly
              value={form.transport_type && TRANSIT_DAYS[form.transport_type] ? `${TRANSIT_DAYS[form.transport_type]} дни` : '—'}
            />
          </div>
          <div>
            <label className="label">Очаквана дата на доставка</label>
            <input className="input" type="date" value={form.estimated_delivery?.slice(0,10) || ''} onChange={f('estimated_delivery')} />
          </div>
        </div>

        {/* Товар + размери + изчисления */}
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-3">
            <div>
              <label className="label">Тегло (кг)</label>
              <input className="input" type="number" step="0.1" min="0" value={form.weight_kg} onChange={f('weight_kg')} />
            </div>
            <div>
              <label className="label">Брой колети</label>
              <input className="input" type="number" min="1" value={form.packages_count} onChange={f('packages_count')} />
            </div>
            <div>
              <label className="label">Размер на колет (см)</label>
              <div className="flex gap-1">
                <input className="input text-sm" type="number" min="0" placeholder="Д" value={form.length_cm} onChange={f('length_cm')} />
                <input className="input text-sm" type="number" min="0" placeholder="Ш" value={form.width_cm} onChange={f('width_cm')} />
                <input className="input text-sm" type="number" min="0" placeholder="В" value={form.height_cm} onChange={f('height_cm')} />
              </div>
            </div>
            <div>
              <label className="label">Тонаж (общо)</label>
              <input className="input bg-gray-50 text-gray-600 font-medium cursor-default" readOnly value={tons ? `${tons} т` : '—'} />
            </div>
            <div>
              <label className="label">Кубик CBM (общо)</label>
              <input className="input bg-gray-50 text-gray-600 font-medium cursor-default" readOnly value={cbm ? `${cbm} м³` : '—'} />
            </div>
          </div>
          {(tons || cbm) && (
            <p className="text-xs text-gray-400">CBM = Д×Ш×В на 1 колет × брой колети</p>
          )}
        </div>

        {/* Описание на стоките — общо */}
        <div>
          <label className="label">Описание на стоките <span className="text-gray-400 font-normal">(общо за пратката)</span></label>
          <input className="input" placeholder="напр. Медицински консумативи, хирургически инструменти..." value={form.description} onChange={f('description')} />
        </div>

        {/* Артикули — HS код + Мито по артикул */}
        <div className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="label mb-0 font-semibold text-gray-700">Артикули — HS код & Мито</label>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Добави артикул
            </button>
          </div>
          <div className="grid gap-2 text-xs text-gray-400 font-medium px-1" style={{ gridTemplateColumns: '1fr 1fr auto auto' }}>
            <span>HS Код</span>
            <span>Мито</span>
            <span>Валута</span>
            <span></span>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 1fr auto auto' }}>
              <input
                className="input text-sm"
                placeholder="напр. 9018.12"
                value={item.hs_code}
                onChange={e => updateItem(i, 'hs_code', e.target.value)}
              />
              <input
                className="input text-sm"
                type="number" min="0" step="0.01"
                placeholder="0.00"
                value={item.customs_duty}
                onChange={e => updateItem(i, 'customs_duty', e.target.value)}
              />
              <select
                className="select text-sm"
                style={{ width: '80px' }}
                value={item.customs_duty_currency}
                onChange={e => updateItem(i, 'customs_duty_currency', e.target.value)}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {form.items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-red-400 hover:text-red-600 text-xl leading-none w-6 text-center"
                >×</button>
              ) : (
                <span className="w-6" />
              )}
            </div>
          ))}
        </div>

        {/* Финансови полета — всяко с валута */}
        <div className="pt-2 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">
                Декларирана стойност
                <span className="text-gray-400 font-normal ml-1">(= фактурна)</span>
              </label>
              <div className="flex gap-1.5">
                <input className="input flex-1" type="number" min="0" step="0.01" value={form.declared_value} onChange={f('declared_value')} />
                <CurrencySelect field="declared_value_currency" />
              </div>
            </div>
            <div>
              <label className="label">Транспортна цена</label>
              <div className="flex gap-1.5">
                <input className="input flex-1" type="number" min="0" step="0.01" value={form.freight_cost} onChange={f('freight_cost')} />
                <CurrencySelect field="freight_cost_currency" />
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
        </div>

        {/* Фактура / PO */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Фактура №</label>
            <input className="input" value={form.invoice_number} onChange={f('invoice_number')} />
          </div>
          <div>
            <label className="label">PO №</label>
            <input className="input" value={form.po_number} onChange={f('po_number')} />
          </div>
        </div>

        <div>
          <label className="label">Бележки</label>
          <textarea className="input" rows={2} value={form.notes} onChange={f('notes')} />
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <LoadingSpinner size="sm" /> : null}
            {saving ? 'Запазване...' : data ? 'Запази промените' : 'Създай пратка'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Отказ</button>
        </div>
      </form>
    </Modal>
  )
}
