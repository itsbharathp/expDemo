import React from 'react'
import { Link } from 'react-router-dom'
import { useManagerQueue } from '../../services/manager'

export default function ReviewQueuePage() {
  const { data: claims, isLoading, isError } = useManagerQueue()

  if (isLoading) return <div style={{ padding: 24 }}>Loading review queue…</div>
  if (isError) return <div style={{ padding: 24, color: 'red' }}>Failed to load queue.</div>
  if (!claims?.length) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Manager Review Queue</h2>
        <p>No claims pending review.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Manager Review Queue</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Reference', 'Amount', 'Merchant', 'Date', 'Status', 'Action'].map(h => (
              <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px 12px' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {claims.map(claim => (
            <tr key={claim.id}>
              <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>
                {claim.id.slice(0, 8)}
              </td>
              <td style={{ padding: '8px 12px' }}>
                {claim.currency} {claim.amount}
              </td>
              <td style={{ padding: '8px 12px' }}>{claim.merchant_name}</td>
              <td style={{ padding: '8px 12px' }}>{claim.expense_date}</td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{
                  background: '#fef3c7', color: '#92400e',
                  borderRadius: 4, padding: '2px 8px', fontSize: 12,
                }}>
                  {claim.status}
                </span>
              </td>
              <td style={{ padding: '8px 12px' }}>
                <Link to={`/manager/claims/${claim.id}`} style={{ color: '#2563eb' }}>
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
