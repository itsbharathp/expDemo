import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import './NotificationBell.css'
import { api } from '../services/api'

interface NotificationItem {
  id: string
  claim_id: string
  event_type: string
  message: string
  is_read: boolean
  created_at: string
}

export default function NotificationBell() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const hasToken = !!localStorage.getItem('auth_token')

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get<NotificationItem[]>('/api/v1/notifications/'),
    refetchInterval: 30_000,
    enabled: hasToken,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = notifications.filter(n => !n.is_read)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="notif-bell-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
      >
        🔔
        {unread.length > 0 && (
          <span className="notif-badge">{unread.length}</span>
        )}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">Notifications</div>
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`notif-item ${!n.is_read ? 'notif-item-unread' : ''}`}
                onClick={() => markRead.mutate(n.id)}
              >
                <div className="notif-item-message">{n.message}</div>
                <div className="notif-item-time">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
