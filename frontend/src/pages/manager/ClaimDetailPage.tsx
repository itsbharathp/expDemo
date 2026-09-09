import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import './ClaimDetailPage.css'
import { api } from '../../services/api'
import { useDecideClaim } from '../../services/manager'
import type { ClaimResponse } from '../../services/claims'

export default function ClaimDetailPage() {
  const { claim_id } = useParams<{ claim_id: string }>()
  const navigate = useNavigate()
  const [action, setAction] = useState<'approved' | 'rejected'>('approved')
  const [note, setNote] = useState('')
  const [submitError, setSubmitError] = useState('')

  const { data: claim, isLoading, isError } = useQuery<ClaimResponse>({
    queryKey: ['claim', claim_id],
    queryFn: () => api.get<ClaimResponse>(`/api/v1/claims/${claim_id}`),
    enabled: !!claim_id,
  })

  const decideMutation = useDecideClaim()

  if (isLoading) return <div className="state-loading">Loading claim…</div>
  if (isError || !claim) return <div className="state-error">Claim not found.</div>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    if (action === 'rejected' && !note.trim()) {
      setSubmitError('A note is required when rejecting a claim.')
      return
    }
    try {
      await decideMutation.mutateAsync({ claimId: claim!.id, body: { action, note: note || undefined } })
      navigate('/manager/queue')
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Decision failed')
    }
  }

  const rows: [string, string][] = [
    ['Reference', claim.id.slice(0, 8)],
    ['Amount', `${claim.currency} ${claim.amount}`],
    ['Merchant', claim.merchant_name],
    ['Expense Date', claim.expense_date],
    ['Status', claim.status],
    ['Submitted', new Date(claim.submitted_at).toLocaleString()],
  ]

  return (
    <div className="page-container claim-detail-page">
      <button className="btn-back" onClick={() => navigate('/manager/queue')}>
        ← Back to Queue
      </button>

      <h1 className="page-header">Claim Detail</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <table className="detail-table">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>
                  {label === 'Status'
                    ? <span className={`badge badge-${value}`}>{value.replace('_', ' ')}</span>
                    : value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="claim-detail-flags">
          <h3>Policy Flags</h3>
          <p className="claim-detail-flags-empty">
            Violation flags are displayed here when the claims API includes flag data.
          </p>
        </div>

        <div className="claim-detail-decision">
          <h3>Decision</h3>
          <form onSubmit={handleSubmit}>
            <div className="claim-detail-radios">
              <label className="claim-detail-radio-label">
                <input type="radio" name="action" value="approved"
                  checked={action === 'approved'} onChange={() => setAction('approved')} />
                Approve
              </label>
              <label className="claim-detail-radio-label">
                <input type="radio" name="action" value="rejected"
                  checked={action === 'rejected'} onChange={() => setAction('rejected')} />
                Reject
              </label>
            </div>

            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder={action === 'rejected' ? 'Reason (required)' : 'Optional comment'}
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />
            </div>

            {submitError && <p className="inline-error">{submitError}</p>}

            <div className="claim-detail-actions">
              <button
                type="submit"
                disabled={decideMutation.isPending}
                className={action === 'approved' ? 'btn-success' : 'btn-danger'}
              >
                {decideMutation.isPending ? 'Submitting…' : action === 'approved' ? 'Approve Claim' : 'Reject Claim'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/manager/queue')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
