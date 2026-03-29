import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPass, setShow]   = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error('Попълнете всички полета')
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      toast.success(`Добре дошли, ${user.first_name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Грешни данни за вход')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <span className="text-3xl">📦</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Инфинита ООД</h1>
          <p className="text-brand-300 mt-1 text-sm">Логистичен мениджмънт система</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Вход в системата</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Потребителско име / Имейл</label>
              <input
                className="input"
                placeholder="admin"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoFocus
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Парола</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <LoadingSpinner size="sm" /> : <LogIn size={16} />}
              {loading ? 'Влизане...' : 'Влез в системата'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
            <div className="font-semibold mb-2 text-gray-600">Тестови акаунти:</div>
            <div>👤 <strong>admin</strong> / Admin123! &nbsp;•&nbsp; <strong>manager</strong> / Manager123!</div>
            <div className="mt-0.5">👤 <strong>ivanova</strong> / Pass123!</div>
          </div>
        </div>

        <p className="text-center text-brand-400 text-xs mt-6">
          © 2024 Инфинита ООД — Медицинска апаратура
        </p>
      </div>
    </div>
  )
}
