import './ClaimConfirmation.css'
import type { ClaimResponse } from '../services/claims'

interface Props {
  claim: ClaimResponse
  onReset: () => void
}

export function ClaimConfirmation({ claim, onReset }: Props) {
  const refNumber = claim.id.slice(0, 8).toUpperCase()
  const statusClass = `badge badge-${claim.status}`

  const message =
    claim.status === 'approved' || claim.status === 'auto_approved'
      ? 'Your claim has been automatically approved.'
      : 'Your claim has been submitted and is awaiting manager review.'

  return (
    <div className="claim-confirmation">
      <div className="card">
        <h2>Claim Submitted</h2>
        <p className="claim-confirmation-ref">
          Reference: <strong>{refNumber}</strong>
        </p>
        <span className={statusClass}>
          {claim.status.replace('_', ' ')}
        </span>
        <p className="claim-confirmation-message">{message}</p>
        <button className="btn-secondary" onClick={onReset}>
          Submit Another Claim
        </button>
      </div>
    </div>
  )
}
