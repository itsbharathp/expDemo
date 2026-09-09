import React from 'react'
import { useNavigate } from 'react-router-dom'
import './AppLayout.css'
import NotificationBell from './NotificationBell'
import { getCurrentUser } from '../services/auth'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const user = getCurrentUser()
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('auth_token')
    navigate('/login', { replace: true })
  }

  return (
    <div>
      <header className="app-header">
        <span className="app-header-logo">Expense Reimbursement</span>
        <div className="app-header-right">
          {user && (
            <span className="app-header-user">
              {user.name} · <span>{user.role}</span>
            </span>
          )}
          {user && <NotificationBell />}
          {user && (
            <button className="app-header-signout" onClick={logout}>
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
