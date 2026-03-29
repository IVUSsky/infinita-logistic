import { Menu, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

const PAGE_TITLES = {
  '/':          'Начало',
  '/shipments': 'Пратки',
  '/couriers':  'Куриери и Тарифи',
  '/hs-codes':  'HS Код Класификатор',
  '/financial': 'Финансов Dashboard',
  '/tracking':  'Tracking на Пратки',
}

export default function Header({ onMenuClick }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Излязохте от системата')
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="text-gray-500 hover:text-gray-700 lg:hidden">
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">{PAGE_TITLES[pathname] || 'Инфинита'}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 relative">
          <Bell size={18} />
        </button>
        <div className="text-sm text-gray-600 hidden sm:block">
          {user?.first_name} {user?.last_name}
        </div>
        <button onClick={handleLogout} className="btn-secondary text-xs py-1.5 px-3">
          <LogOut size={14} />
          Изход
        </button>
      </div>
    </header>
  )
}
