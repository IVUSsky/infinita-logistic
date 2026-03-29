import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Truck, FileCode, BarChart3, MapPin, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Начало' },
  { to: '/shipments', icon: Package,         label: 'Пратки' },
  { to: '/couriers',  icon: Truck,           label: 'Куриери' },
  { to: '/hs-codes',  icon: FileCode,        label: 'HS Кодове' },
  { to: '/financial', icon: BarChart3,       label: 'Финанси' },
  { to: '/tracking',  icon: MapPin,          label: 'Tracking' },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-60 bg-brand-950 text-white flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-800">
          <div>
            <div className="text-lg font-bold tracking-wide">Инфинита</div>
            <div className="text-xs text-brand-300">Логистичен мениджмънт</div>
          </div>
          <button onClick={onClose} className="lg:hidden text-brand-400 hover:text-white"><X size={18} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-700 text-white'
                    : 'text-brand-200 hover:bg-brand-800 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-brand-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</div>
              <div className="text-xs text-brand-400 capitalize">{user?.role === 'admin' ? 'Администратор' : user?.role === 'manager' ? 'Мениджър' : 'Служител'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
