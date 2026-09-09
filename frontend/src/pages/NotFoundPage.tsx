import { useNavigate } from 'react-router-dom'
import './ErrorPage.css'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="error-page">
      <div className="error-page-card card">
        <p className="error-page-code">404</p>
        <h1 className="error-page-title">Page Not Found</h1>
        <p className="error-page-message">The page you are looking for does not exist.</p>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  )
}
