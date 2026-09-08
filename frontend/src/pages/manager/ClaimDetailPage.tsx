import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useDecideClaim } from '../../services/manager'
import type { ClaimResponse } from '../../services/claims'

const FLAG_COLORS: Record<string, string> = {
  weekend_policy: '#f97316',
  duplicate_detection: '#eab308',
  spending_cap: '#ef4444',
  receipt_required: '#8b5cf6',
}

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

  if (isLoading) return <div style={{ padding: 24 }}>Loading claim…</div>
  if (isError || !claim) return <div style={{ padding: 24, color: 'red' }}>Claim not found.</div>

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

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <button onClick={() => navigate('/manager/queue')} style={{ marginBottom: 16 }}>
        ← Back to Queue
      </button>
      <h2>Claim Detail</h2>

      <table style={{ width: '100%', marginBottom: 24 }}>
        <tbody>
          {[
            ['Reference', claim.id.slice(0, 8)],
            ['Amount', `${claim.currency} ${claim.amount}`],
            ['Merchant', claim.merchant_name],
            ['Expense Date', claim.expense_date],
            ['Status', claim.status],
            ['Submitted', new Date(claim.submitted_at).toLocaleString()],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ fontWeight: 600, padding: '6px 12px 6px 0', width: 140 }}>{label}</td>
              <td style={{ padding: '6px 0' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Policy Flags</h3>
      {/* violation_flags not in ClaimResponse yet; show placeholder */}
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        Violation flags are displayed here when the claims API includes flag data.
      </p>

      <h3>Decision</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 16 }}>
            <input type="radio" name="action" value="approved"
              checked={action === 'approved'} onChange={() => setAction('approved')} />
            {' '}Approve
          </label>
          <label>
            <input type="radio" name="action" value="rejected"
              checked={action === 'rejected'} onChange={() => setAction('rejected')} />
            {' '}Reject
          </label>
        </div>
        <textarea
          placeholder={action === 'rejected' ? 'Reason (required)' : 'Optional comment'}
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        {submitError && <p style={{ color: 'red', marginBottom: 8 }}>{submitError}</p>}
        <button type="submit" disabled={decideMutation.isPending}
          style={{ background: action === 'approved' ? '#16a34a' : '#dc2626', color: '#fff', padding: '8px 20px', border: 'none', borderRadius: 4 }}>
          {decideMutation.isPending ? 'Submitting…' : action === 'approved' ? 'Approve Claim' : 'Reject Claim'}
        </button>
      </form>
    </div>
  )
}
