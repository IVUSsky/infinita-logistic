import { useState, useEffect } from 'react'
import { Plus, Search, ArrowLeftRight, Star } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { fmtMoney } from '../../utils/helpers'
import { useAuth } from '../../contexts/AuthContext'

const TRANSPORT_LABELS = { air: 'Въздушен ✈️', sea: 'Морски 🚢', road: 'Наземен 🚛', express: 'Експрес ⚡' }
const COUNTRIES = { BG:'България',GR:'Гърция',DE:'Германия',AT:'Австрия',CN:'Китай',US:'САЩ',JP:'Япония',FR:'Франция',IT:'Италия',GB:'Великобритания' }

export default function CouriersPage() {
  const { isManager } = useAuth()
  const [couriers, setCouriers]     = useState([])
  const [selected, setSelected]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [compareForm, setCompare]   = useState({ origin_country:'DE', dest_country:'BG', weight:'50', transport_type:'' })
  const [compareResults, setResults]= useState(null)
  const [comparing, setComparing]   = useState(false)
  const [tab, setTab]               = useState('couriers') // couriers | compare
  const [modal, setModal]           = useState({ open: false, data: null })

  const load = async () => {
    setLoading(true)
    const { data } = await api.get('/couriers')
    setCouriers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCompare = async (e) => {
    e.preventDefault()
    setComparing(true)
    setResults(null)
    try {
      const { data } = await api.get('/couriers/compare', { params: compareForm })
      setResults(data)
    } catch (err) { toast.error(err.response?.data?.error || 'Грешка') }
    finally { setComparing(false) }
  }

  const handleSaveCourier = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const body = Object.fromEntries(fd)
    try {
      if (modal.data?.id) {
        await api.put(`/couriers/${modal.data.id}`, body)
        toast.success('Куриерът е обновен')
      } else {
        await api.post('/couriers', body)
        toast.success('Куриерът е добавен')
      }
      setModal({ open: false, data: null })
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Грешка') }
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['couriers', '🚚 Куриери'], ['compare', '⚖️ Сравнение на тарифи']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-brand-700' : 'text-gray-600 hover:text-gray-800'}`}>{l}</button>
        ))}
      </div>

      {tab === 'couriers' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* List */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Логистични партньори</span>
              {isManager && <button onClick={() => setModal({ open: true, data: null })} className="btn-primary text-xs py-1.5 px-3"><Plus size={13} />Добави</button>}
            </div>
            {loading ? <div className="py-10 flex justify-center"><LoadingSpinner /></div> : (
              <div className="divide-y divide-gray-50">
                {couriers.map(c => (
                  <div key={c.id} onClick={() => setSelected(c.id === selected?.id ? null : c)} className={`px-4 py-3 cursor-pointer transition-colors ${selected?.id === c.id ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className={`w-2 h-2 rounded-full ${c.active ? 'bg-green-400' : 'bg-gray-300'}`} />
                    </div>
                    {c.email && <div className="text-xs text-gray-400 mt-0.5">{c.email}</div>}
                    {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                    {c.notes && <div className="text-xs text-gray-400 mt-1 italic">{c.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3">
            {selected ? <CourierDetail courier={selected} isManager={isManager} onEdit={() => setModal({ open: true, data: selected })} /> : (
              <div className="card p-10 text-center text-gray-400">
                <div className="text-4xl mb-3">🚚</div>
                <div>Изберете куриер за детайли и тарифи</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'compare' && (
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Параметри за сравнение</h3>
            <form onSubmit={handleCompare} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Произход</label>
                <select className="select" value={compareForm.origin_country} onChange={e => setCompare(f => ({ ...f, origin_country: e.target.value }))}>
                  {Object.entries(COUNTRIES).map(([k,v]) => <option key={k} value={k}>{k} — {v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Дестинация</label>
                <select className="select" value={compareForm.dest_country} onChange={e => setCompare(f => ({ ...f, dest_country: e.target.value }))}>
                  {Object.entries(COUNTRIES).map(([k,v]) => <option key={k} value={k}>{k} — {v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Тегло (кг)</label>
                <input className="input" type="number" min="0.1" step="0.1" value={compareForm.weight} onChange={e => setCompare(f => ({ ...f, weight: e.target.value }))} />
              </div>
              <div>
                <label className="label">Тип транспорт</label>
                <select className="select" value={compareForm.transport_type} onChange={e => setCompare(f => ({ ...f, transport_type: e.target.value }))}>
                  <option value="">Всички</option>
                  {Object.entries(TRANSPORT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="md:col-span-4">
                <button type="submit" disabled={comparing} className="btn-primary">
                  {comparing ? <LoadingSpinner size="sm" /> : <ArrowLeftRight size={15} />}
                  Сравни куриери
                </button>
              </div>
            </form>
          </div>

          {compareResults && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-semibold text-gray-700">
                  Резултати: {compareForm.origin_country} → {compareForm.dest_country} • {compareForm.weight} кг
                </span>
                <span className="text-xs text-gray-400 ml-3">({compareResults.length} оферти)</span>
              </div>
              {compareResults.length === 0 ? (
                <div className="p-8 text-center text-gray-400">Няма намерени тарифи за тези параметри</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {compareResults.map((r, i) => (
                    <div key={r.id} className={`px-5 py-4 flex items-center gap-5 ${i === 0 ? 'bg-green-50' : ''}`}>
                      {i === 0 && <Star size={16} className="text-yellow-500 fill-yellow-400 shrink-0" />}
                      {i > 0 && <div className="w-4 text-center text-sm text-gray-400">{i+1}.</div>}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{r.courier_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {TRANSPORT_LABELS[r.transport_type]} • {r.transit_days ? `${r.transit_days} дни` : 'TBD'} • {r.price_per_kg} {r.currency}/кг
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${i === 0 ? 'text-green-700' : 'text-gray-800'}`}>
                          {r.calculated_price.toFixed(2)} {r.currency}
                        </div>
                        <div className="text-xs text-gray-400">за {compareForm.weight} кг</div>
                      </div>
                      {i === 0 && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium shrink-0">Най-изгодно</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? 'Редакция на куриер' : 'Нов куриер'}>
        <form onSubmit={handleSaveCourier} className="space-y-4">
          <div><label className="label">Наименование *</label><input className="input" name="name" defaultValue={modal.data?.name} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Контактно лице</label><input className="input" name="contact_name" defaultValue={modal.data?.contact_name} /></div>
            <div><label className="label">Телефон</label><input className="input" name="phone" defaultValue={modal.data?.phone} /></div>
          </div>
          <div><label className="label">Имейл</label><input className="input" type="email" name="email" defaultValue={modal.data?.email} /></div>
          <div><label className="label">Уебсайт</label><input className="input" name="website" defaultValue={modal.data?.website} /></div>
          <div><label className="label">Бележки</label><textarea className="input" name="notes" rows={2} defaultValue={modal.data?.notes} /></div>
          <div className="flex gap-3 pt-2 border-t">
            <button type="submit" className="btn-primary">{modal.data ? 'Запази' : 'Добави'}</button>
            <button type="button" onClick={() => setModal({ open: false, data: null })} className="btn-secondary">Отказ</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function CourierDetail({ courier, isManager, onEdit }) {
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    api.get(`/couriers/${courier.id}`).then(r => setDetail(r.data))
  }, [courier.id])

  if (!detail) return <div className="card p-10 flex justify-center"><LoadingSpinner /></div>

  const byType = (detail.rates || []).reduce((acc, r) => {
    if (!acc[r.transport_type]) acc[r.transport_type] = []
    acc[r.transport_type].push(r)
    return acc
  }, {})

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">{detail.name}</h3>
          <div className="text-xs text-gray-400 mt-0.5">{detail.email} • {detail.phone}</div>
        </div>
        {isManager && <button onClick={onEdit} className="btn-secondary text-xs py-1.5 px-3">Редакция</button>}
      </div>

      <div className="p-5">
        <h4 className="text-sm font-semibold text-gray-600 mb-3">Тарифи</h4>
        {Object.entries(byType).length === 0 ? (
          <p className="text-sm text-gray-400">Няма добавени тарифи</p>
        ) : Object.entries(byType).map(([type, rates]) => (
          <div key={type} className="mb-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {{ air:'Въздушен ✈️',sea:'Морски 🚢',road:'Наземен 🚛',express:'Експрес ⚡' }[type]}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-1.5 text-left text-gray-500">Маршрут</th>
                  <th className="px-2 py-1.5 text-left text-gray-500">Тегло</th>
                  <th className="px-2 py-1.5 text-left text-gray-500">Цена/кг</th>
                  <th className="px-2 py-1.5 text-left text-gray-500">Минимум</th>
                  <th className="px-2 py-1.5 text-left text-gray-500">Дни</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rates.map(r => (
                  <tr key={r.id}>
                    <td className="px-2 py-1.5 font-medium">{r.origin_country} → {r.dest_country}</td>
                    <td className="px-2 py-1.5">{r.weight_from}–{r.weight_to} кг</td>
                    <td className="px-2 py-1.5">{r.price_per_kg} {r.currency}</td>
                    <td className="px-2 py-1.5">{r.min_price} {r.currency}</td>
                    <td className="px-2 py-1.5">{r.transit_days || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
