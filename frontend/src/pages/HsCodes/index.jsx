import { useState, useEffect } from 'react'
import { Search, Plus, Wand2 } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'

export default function HsCodesPage() {
  const { isManager } = useAuth()
  const [codes, setCodes]           = useState([])
  const [cats, setCats]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [modal, setModal]           = useState({ open: false, data: null })
  const [classifyQuery, setQuery]   = useState('')
  const [classifyResult, setResult] = useState([])
  const [classifying, setClassifying] = useState(false)
  const [tab, setTab]               = useState('list')

  const load = async (s = '', c = '') => {
    setLoading(true)
    const { data } = await api.get('/hs-codes', { params: { search: s || undefined, category: c || undefined } })
    setCodes(data)
    setLoading(false)
  }

  useEffect(() => {
    api.get('/hs-codes/categories').then(r => setCats(r.data))
    load()
  }, [])

  const handleSearch = (e) => { e.preventDefault(); load(search, catFilter) }

  const handleClassify = async (e) => {
    e.preventDefault()
    if (!classifyQuery.trim()) return toast.error('Въведете описание')
    setClassifying(true)
    setResult([])
    try {
      const { data } = await api.get('/hs-codes/classify', { params: { description: classifyQuery } })
      setResult(data)
      if (!data.length) toast('Не са намерени подходящи кодове', { icon: 'ℹ️' })
    } catch { toast.error('Грешка') }
    finally { setClassifying(false) }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const body = { ...Object.fromEntries(fd), duty_rate: parseFloat(fd.get('duty_rate')), vat_rate: parseFloat(fd.get('vat_rate')) }
    try {
      if (modal.data?.id) {
        await api.put(`/hs-codes/${modal.data.id}`, body)
        toast.success('HS кодът е обновен')
      } else {
        await api.post('/hs-codes', body)
        toast.success('HS кодът е добавен')
      }
      setModal({ open: false, data: null })
      load(search, catFilter)
    } catch (err) { toast.error(err.response?.data?.error || 'Грешка') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Изтриване?')) return
    await api.delete(`/hs-codes/${id}`)
    toast.success('Изтрит')
    load(search, catFilter)
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['list','📋 База данни HS кодове'],['classify','🔍 Класификатор']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t?'bg-white shadow text-brand-700':'text-gray-600 hover:text-gray-800'}`}>{l}</button>
        ))}
      </div>

      {tab === 'classify' && (
        <div className="card p-6 max-w-2xl">
          <h3 className="font-semibold text-gray-700 mb-1">Автоматична класификация</h3>
          <p className="text-xs text-gray-400 mb-4">Въведете описание на медицинска апаратура и системата ще предложи подходящи HS кодове</p>
          <form onSubmit={handleClassify} className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="напр. ултразвуков апарат, кардиостимулатор, рентген..."
              value={classifyQuery}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" disabled={classifying} className="btn-primary">
              {classifying ? <LoadingSpinner size="sm" /> : <Wand2 size={15} />}
              Класифицирай
            </button>
          </form>
          {classifyResult.length > 0 && (
            <div className="mt-5 space-y-2">
              <h4 className="text-sm font-semibold text-gray-600">Предложени кодове:</h4>
              {classifyResult.map(c => (
                <div key={c.id} className="border border-brand-100 bg-brand-50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-brand-700 text-sm">{c.code}</span>
                    <span className="text-sm font-medium text-gray-700">{c.description_bg}</span>
                    <span className="ml-auto text-xs bg-white border border-brand-200 px-2 py-0.5 rounded text-brand-600">{c.category}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Мито: {c.duty_rate}% • ДДС: {c.vat_rate}%
                    {c.description_en && <span className="ml-3 italic">{c.description_en}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'list' && (
        <>
          <div className="flex gap-3 flex-wrap items-center justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0 max-w-xl">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" placeholder="Търсене по код или описание..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="select w-44" value={catFilter} onChange={e => { setCatFilter(e.target.value); load(search, e.target.value) }}>
                <option value="">Всички категории</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="btn-secondary">Търси</button>
            </form>
            {isManager && (
              <button onClick={() => setModal({ open: true, data: null })} className="btn-primary"><Plus size={14} />Нов HS код</button>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 text-xs text-gray-500">
              {codes.length} кода намерени
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['HS Код','Описание (BG)','Описание (EN)','Категория','Мито %','ДДС %','Бележки',''].map(h => (
                      <th key={h} className="table-header whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={8} className="py-10 text-center"><LoadingSpinner className="mx-auto" /></td></tr>
                  ) : codes.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono font-bold text-brand-700 text-sm">{c.code}</td>
                      <td className="table-cell text-sm max-w-xs">{c.description_bg}</td>
                      <td className="table-cell text-xs text-gray-400 max-w-xs">{c.description_en || '—'}</td>
                      <td className="table-cell">
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{c.category}</span>
                      </td>
                      <td className="table-cell text-center">{c.duty_rate > 0 ? <span className="text-orange-600 font-medium">{c.duty_rate}%</span> : <span className="text-green-600">0%</span>}</td>
                      <td className="table-cell text-center">{c.vat_rate}%</td>
                      <td className="table-cell text-xs text-gray-400 max-w-xs truncate">{c.notes || '—'}</td>
                      <td className="table-cell">
                        {isManager && (
                          <div className="flex gap-2">
                            <button onClick={() => setModal({ open: true, data: c })} className="text-xs text-brand-600 hover:underline">Редакция</button>
                            <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">Изтрий</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? 'Редакция на HS код' : 'Нов HS код'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">HS Код *</label><input className="input font-mono" name="code" defaultValue={modal.data?.code} placeholder="9018.12" required /></div>
            <div><label className="label">Категория *</label>
              <input className="input" name="category" list="cats-list" defaultValue={modal.data?.category} required />
              <datalist id="cats-list">{cats.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
          <div><label className="label">Описание (BG) *</label><input className="input" name="description_bg" defaultValue={modal.data?.description_bg} required /></div>
          <div><label className="label">Описание (EN)</label><input className="input" name="description_en" defaultValue={modal.data?.description_en} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Митническа ставка %</label><input className="input" type="number" step="0.01" min="0" name="duty_rate" defaultValue={modal.data?.duty_rate ?? 0} /></div>
            <div><label className="label">ДДС %</label><input className="input" type="number" step="0.01" min="0" name="vat_rate" defaultValue={modal.data?.vat_rate ?? 20} /></div>
          </div>
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
