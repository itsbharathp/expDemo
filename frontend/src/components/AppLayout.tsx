import React from 'react'
import NotificationBell from './NotificationBell'
import { getCurrentUser } from '../services/auth'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const user = getCurrentUser()

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{
        background: '#1e40af', color: '#fff',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>Expense Reimbursement</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <span style={{ fontSize: 13, opacity: 0.85 }}>
              {user.name} · <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
            </span>
          )}
          <NotificationBell />
        </div>
      </header>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  )
}
