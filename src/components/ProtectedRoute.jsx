import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { currentNinja } = useAuth()
  
  if (!currentNinja) {
    return <Navigate to="/ninja-select" replace />
  }
  
  return children
}

export default ProtectedRoute