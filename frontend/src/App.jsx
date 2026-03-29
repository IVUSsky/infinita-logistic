import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ShipmentsPage from './pages/Shipments'
import CouriersPage from './pages/Couriers'
import HsCodesPage from './pages/HsCodes'
import FinancialPage from './pages/Financial'
import TrackingPage from './pages/Tracking'
import LoadingSpinner from './components/common/LoadingSpinner'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="shipments"  element={<ShipmentsPage />} />
        <Route path="couriers"   element={<CouriersPage />} />
        <Route path="hs-codes"   element={<HsCodesPage />} />
        <Route path="financial"  element={<FinancialPage />} />
        <Route path="tracking"   element={<TrackingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
