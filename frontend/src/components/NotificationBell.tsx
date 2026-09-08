import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get<NotificationItem[]>('/api/v1/notifications/'),
    refetchInterval: 30_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = notifications.filter(n => !n.is_read)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, position: 'relative' }}
        aria-label="Notifications"
      >
        🔔
        {unread.length > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#dc2626', color: '#fff',
            borderRadius: '50%', fontSize: 10, width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', width: 300,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100,
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: 14, color: '#6b7280' }}>No notifications</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markRead.mutate(n.id)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  background: n.is_read ? '#fff' : '#eff6ff',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: 13,
                }}
              >
                <div>{n.message}</div>
                <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
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
