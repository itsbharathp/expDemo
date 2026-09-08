import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export type UserRole = 'employee' | 'manager' | 'auditor' | 'admin'

export interface CurrentUser {
  id: string
  name: string
  role: UserRole
  manager_id?: string
  department?: string
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export function getCurrentUser(): CurrentUser | null {
  const token = localStorage.getItem('auth_token')
  if (!token) return null
  const payload = parseJwt(token)
  if (!payload || !payload.sub || !payload.role) return null
  return {
    id: payload.sub as string,
    name: (payload.name as string) ?? '',
    role: payload.role as UserRole,
    manager_id: payload.manager_id as string | undefined,
    department: payload.department as string | undefined,
  }
}

export function useRequireRole(role: UserRole): CurrentUser | null {
  const navigate = useNavigate()
  const user = getCurrentUser()

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    } else if (user.role !== role) {
      navigate('/unauthorized', { replace: true })
    }
  }, [user, role, navigate])

  return user?.role === role ? user : null
}

interface ProtectedRouteProps {
  role: UserRole
  children: React.ReactNode
}

export function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const user = useRequireRole(role)
  if (!user) return null
  return <>{children}</>
}
