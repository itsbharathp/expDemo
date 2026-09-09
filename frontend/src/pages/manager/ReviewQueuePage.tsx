import { Link } from 'react-router-dom'
import './ReviewQueuePage.css'
import { useManagerQueue } from '../../services/manager'

export default function ReviewQueuePage() {
  const { data: claims, isLoading, isError } = useManagerQueue()

  if (isLoading) return <div className="state-loading">Loading review queue…</div>
  if (isError) return <div className="state-error">Failed to load queue.</div>

  return (
    <div className="page-container">
      <h1 className="page-header">Manager Review Queue</h1>

      {!claims?.length ? (
        <div className="card">
          <p className="state-empty" style={{ padding: 0 }}>No claims pending review.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                {['Reference', 'Amount', 'Merchant', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr key={claim.id}>
                  <td className="review-queue-ref">{claim.id.slice(0, 8)}</td>
                  <td>{claim.currency} {claim.amount}</td>
                  <td>{claim.merchant_name}</td>
                  <td>{claim.expense_date}</td>
                  <td>
                    <span className={`badge badge-${claim.status}`}>
                      {claim.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <Link to={`/manager/claims/${claim.id}`} className="btn-link">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
