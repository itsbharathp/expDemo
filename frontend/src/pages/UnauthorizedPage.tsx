import { useNavigate } from 'react-router-dom'
import './ErrorPage.css'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <div className="error-page">
      <div className="error-page-card card">
        <p className="error-page-code">403</p>
        <h1 className="error-page-title">Unauthorized</h1>
        <p className="error-page-message">You do not have permission to access this page.</p>
        <button className="btn-secondary" onClick={() => navigate('/login', { replace: true })}>
          Sign in with a different account
        </button>
      </div>
    </div>
  )
}
