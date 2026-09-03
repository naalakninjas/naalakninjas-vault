import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import NinjaSelection from './pages/NinjaSelection'
import Dashboard from './pages/DashboardNew'
import Contributions from './pages/ContributionsNew'
import Missions from './pages/MissionsNew'
import Settings from './pages/SettingsNew'
import Layout from './components/LayoutNew'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/ninja-select" element={<NinjaSelection />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="contributions" element={<Contributions />} />
            <Route path="missions" element={<Missions />} />
            <Route path="settings" element={<Settings />} />
            {/* Redirects for removed pages */}
            <Route path="repayments" element={<Navigate to="/missions" replace />} />
            <Route path="activity" element={<Navigate to="/dashboard" replace />} />
          </Route>
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/ninja-select" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App