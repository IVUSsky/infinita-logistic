import { useState, useEffect } from 'react'
import Modal from '../../components/common/Modal'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const STATUSES = ['pending','confirmed','in_transit','customs','delivered','cancelled','returned']
const STATUS_BG = { pending:'Чакащ', confirmed:'Потвърден', in_transit:'В транзит', customs:'Митница', delivered:'Доставен', cancelled:'Анулиран', returned:'Върнат' }
const COUNTRIES = { BG:'България',GR:'Гърция',DE:'Германия',AT:'Австрия',CN:'Китай',US:'САЩ',JP:'Япония',FR:'Франция',IT:'Италия',NL:'Нидерландия',GB:'Великобритания',CH:'Швейцария' }
const TRANSPORT = { air:'Въздушен ✈️',sea:'Морски 🚢',road:'Наземен 🚛',express:'Експрес ⚡' }

const EMPTY = {
  tracking_number:'', status:'pending', direction:'import', origin_country:'DE', origin_city:'',
  dest_country:'BG', dest_city:'София', sender_name:'', sender_address:'', recipient_name:'Инфинита ООД', recipient_address:'',
  courier_id:'', transport_type:'road', weight_kg:'', packages_count:1, hs_code:'', description:'',
  declared_value:'', currency:'EUR', freight_cost:'', customs_duty:'', total_cost:'',
  invoice_number:'', po_number:'', notes:'', estimated_delivery:''
}

export default function ShipmentModal({ open, data, onClose, onSave }) {
  const [form, setForm]       = useState(EMPTY)
  const [couriers, setCouriers] = useState([])
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (open) {
      api.get('/couriers').then(r => setCouriers(r.data))
      setForm(data ? { ...EMPTY, ...data } : EMPTY)
    }
  }, [open, data])

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

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

  return (
    <Modal open={open} onClose={onClose} title={data ? `Редакция: ${data.tracking_number}` : 'Нова пратка'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1 */}
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

        {/* Route */}
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

        {/* Sender / Recipient */}
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

        {/* Courier / Transport */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Куриер</label>
            <select className="select" value={form.courier_id} onChange={f('courier_id')}>
              <option value="">— без куриер —</option>
              {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Транспорт</label>
            <select className="select" value={form.transport_type} onChange={f('transport_type')}>
              <option value="">— изберете —</option>
              {Object.entries(TRANSPORT).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Очаквана доставка</label>
            <input className="input" type="date" value={form.estimated_delivery?.slice(0,10) || ''} onChange={f('estimated_delivery')} />
          </div>
        </div>

        {/* Cargo */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="label">Тегло (кг)</label>
            <input className="input" type="number" step="0.1" min="0" value={form.weight_kg} onChange={f('weight_kg')} />
          </div>
          <div>
            <label className="label">Колети</label>
            <input className="input" type="number" min="1" value={form.packages_count} onChange={f('packages_count')} />
          </div>
          <div>
            <label className="label">HS Код</label>
            <input className="input" placeholder="9018.12" value={form.hs_code} onChange={f('hs_code')} />
          </div>
          <div>
            <label className="label">Валута</label>
            <select className="select" value={form.currency} onChange={f('currency')}>
              {['EUR','USD','BGN','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Описание на стоките</label>
          <input className="input" value={form.description} onChange={f('description')} />
        </div>

        {/* Financials */}
        <div className="grid grid-cols-4 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label className="label">Декл. стойност</label>
            <input className="input" type="number" min="0" step="0.01" value={form.declared_value} onChange={f('declared_value')} />
          </div>
          <div>
            <label className="label">Транспортна цена</label>
            <input className="input" type="number" min="0" step="0.01" value={form.freight_cost} onChange={f('freight_cost')} />
          </div>
          <div>
            <label className="label">Мито</label>
            <input className="input" type="number" min="0" step="0.01" value={form.customs_duty} onChange={f('customs_duty')} />
          </div>
          <div>
            <label className="label">Обща цена</label>
            <input className="input" type="number" min="0" step="0.01" value={form.total_cost} onChange={f('total_cost')} />
          </div>
        </div>

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
