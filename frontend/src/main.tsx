import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import NotFoundPage from './pages/NotFoundPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import { getCurrentUser } from './services/auth'

const SubmitClaimPage = lazy(() => import('./pages/employee/SubmitClaimPage'))
const ReviewQueuePage = lazy(() => import('./pages/manager/ReviewQueuePage'))
const ClaimDetailPage = lazy(() => import('./pages/manager/ClaimDetailPage'))
const AuditDashboardPage = lazy(() => import('./pages/auditor/AuditDashboardPage'))
const PolicyConfigPage = lazy(() => import('./pages/admin/PolicyConfigPage'))

const queryClient = new QueryClient()

function RoleRedirect() {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  const destinations: Record<string, string> = {
    employee: '/employee/submit',
    manager: '/manager/queue',
    auditor: '/auditor/dashboard',
    admin: '/admin/policy',
  }
  return <Navigate to={destinations[user.role] ?? '/unauthorized'} replace />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout>
          <Suspense fallback={<div>Loading…</div>}>
            <Routes>
              <Route path="/" element={<RoleRedirect />} />
              <Route path="/employee/submit" element={<SubmitClaimPage />} />
              <Route path="/manager/queue" element={<ReviewQueuePage />} />
              <Route path="/manager/claims/:claim_id" element={<ClaimDetailPage />} />
              <Route path="/auditor/dashboard" element={<AuditDashboardPage />} />
              <Route path="/admin/policy" element={<PolicyConfigPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
