import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import './AuditClaimDetailPage.css'
import { useClearFlag, useInvestigateClaim } from '../../services/audit'
import { api } from '../../services/api'
import type { ClaimResponse } from '../../services/claims'

export default function AuditClaimDetailPage() {
  const { claim_id } = useParams<{ claim_id: string }>()
  const navigate = useNavigate()
  const [clearNote, setClearNote] = useState('')
  const [showClearInput, setShowClearInput] = useState(false)
  const [actionError, setActionError] = useState('')

  const { data: claim, isLoading, isError } = useQuery<ClaimResponse>({
    queryKey: ['audit-claim', claim_id],
    queryFn: () => api.get<ClaimResponse>(`/api/v1/claims/${claim_id}`),
    enabled: !!claim_id,
  })

  const investigateMutation = useInvestigateClaim()
  const clearMutation = useClearFlag()

  async function handleInvestigate() {
    setActionError('')
    try {
      await investigateMutation.mutateAsync(claim_id!)
      navigate('/auditor/dashboard')
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  async function handleClear() {
    setActionError('')
    if (!clearNote.trim()) {
      setActionError('A resolution note is required to clear a flag.')
      return
    }
    try {
      await clearMutation.mutateAsync({ claimId: claim_id!, resolution_note: clearNote })
      navigate('/auditor/dashboard')
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  if (isLoading) return <div className="state-loading">Loading claim…</div>
  if (isError || !claim) return <div className="state-error">Claim not found.</div>

  const rows: [string, string][] = [
    ['Reference', claim.id.slice(0, 8)],
    ['Full ID', claim.id],
    ['Employee ID', claim.employee_id],
    ['Amount', `${claim.currency} ${claim.amount}`],
    ['Merchant', claim.merchant_name],
    ['Expense Date', claim.expense_date],
    ['Status', claim.status],
    ['Submitted', new Date(claim.submitted_at).toLocaleString()],
    ['Receipt', claim.receipt_path ?? 'None'],
  ]

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <button className="btn-back" onClick={() => navigate('/auditor/dashboard')}>
        ← Back to Dashboard
      </button>

      <h1 className="page-header">Audit Claim Detail</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <table className="detail-table">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <td>{label}</td>
                <td style={{ wordBreak: 'break-all' }}>
                  {label === 'Status'
                    ? <span className={`badge badge-${value}`}>{value.replace('_', ' ')}</span>
                    : value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="page-subheader">Violation Flags</h2>
        <div className="card-section" style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 'var(--font-text-sm-size)', color: 'var(--color-text-secondary)' }}>
            This claim carries at least one active violation flag. Use the actions below to investigate or clear.
          </p>
        </div>

        {actionError && <p className="inline-error">{actionError}</p>}

        <div className="audit-detail-actions">
          <button
            className="btn-warning"
            onClick={handleInvestigate}
            disabled={investigateMutation.isPending}
          >
            {investigateMutation.isPending ? 'Processing…' : 'Mark for Investigation'}
          </button>

          {!showClearInput ? (
            <button className="btn-secondary" onClick={() => setShowClearInput(true)}>
              Clear Flag
            </button>
          ) : (
            <div className="audit-clear-form">
              <input
                className="form-input"
                type="text"
                placeholder="Resolution note (required)…"
                value={clearNote}
                onChange={e => setClearNote(e.target.value)}
              />
              <button
                className="btn-success"
                onClick={handleClear}
                disabled={clearMutation.isPending}
              >
                {clearMutation.isPending ? 'Clearing…' : 'Confirm Clear'}
              </button>
              <button className="btn-secondary" onClick={() => setShowClearInput(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
