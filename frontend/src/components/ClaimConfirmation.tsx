import type { ClaimResponse } from '../services/claims'

interface Props {
  claim: ClaimResponse
  onReset: () => void
}

export function ClaimConfirmation({ claim, onReset }: Props) {
  const isApproved = claim.status === 'approved'
  const refNumber = claim.id.slice(0, 8).toUpperCase()

  return (
    <div style={{ padding: '2rem', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <h2>Claim Submitted</h2>
      <p>
        <strong>Reference:</strong> {refNumber}
      </p>
      <span
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: 4,
          backgroundColor: isApproved ? '#d4edda' : '#fff3cd',
          color: isApproved ? '#155724' : '#856404',
          fontWeight: 600,
        }}
      >
        {isApproved ? 'Auto-Approved' : 'Pending Review'}
      </span>
      <p style={{ marginTop: '1.5rem' }}>
        {isApproved
          ? 'Your claim has been automatically approved.'
          : 'Your claim has been submitted and is awaiting manager review.'}
      </p>
      <button onClick={onReset} style={{ marginTop: '1rem' }}>
        Submit Another Claim
      </button>
    </div>
  )
}
