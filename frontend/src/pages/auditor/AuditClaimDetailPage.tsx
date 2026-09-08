import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClearFlag, useInvestigateClaim } from '../../services/audit'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import type { ClaimResponse } from '../../services/claims'

const FLAG_COLORS: Record<string, string> = {
  weekend_policy: '#f97316',
  duplicate_detection: '#eab308',
  spending_cap: '#ef4444',
  receipt_required: '#8b5cf6',
}

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

  if (isLoading) return <div style={{ padding: 24 }}>Loading claim…</div>
  if (isError || !claim) return <div style={{ padding: 24, color: 'red' }}>Claim not found.</div>

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <button onClick={() => navigate('/auditor/dashboard')} style={{ marginBottom: 16 }}>
        ← Back to Dashboard
      </button>
      <h2>Audit Claim Detail</h2>

      <table style={{ width: '100%', marginBottom: 24 }}>
        <tbody>
          {[
            ['Reference', claim.id.slice(0, 8)],
            ['Full ID', claim.id],
            ['Employee ID', claim.employee_id],
            ['Amount', `${claim.currency} ${claim.amount}`],
            ['Merchant', claim.merchant_name],
            ['Expense Date', claim.expense_date],
            ['Status', claim.status],
            ['Submitted', new Date(claim.submitted_at).toLocaleString()],
            ['Receipt', claim.receipt_path ?? 'None'],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ fontWeight: 600, padding: '6px 12px 6px 0', width: 140, verticalAlign: 'top' }}>{label}</td>
              <td style={{ padding: '6px 0', wordBreak: 'break-all', fontSize: 14 }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Violation Flags</h3>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
        This claim carries at least one active violation flag. Use the actions below to investigate or clear.
      </p>

      {actionError && <p style={{ color: 'red', marginBottom: 12 }}>{actionError}</p>}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={handleInvestigate}
          disabled={investigateMutation.isPending}
          style={{
            padding: '8px 18px',
            background: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            opacity: investigateMutation.isPending ? 0.6 : 1,
          }}
        >
          {investigateMutation.isPending ? 'Processing…' : 'Mark for Investigation'}
        </button>

        {!showClearInput ? (
          <button
            onClick={() => setShowClearInput(true)}
            style={{ padding: '8px 18px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Clear Flag
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Resolution note (required)…"
              value={clearNote}
              onChange={e => setClearNote(e.target.value)}
              style={{ padding: '7px 10px', minWidth: 260 }}
            />
            <button
              onClick={handleClear}
              disabled={clearMutation.isPending}
              style={{ padding: '7px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              {clearMutation.isPending ? 'Clearing…' : 'Confirm Clear'}
            </button>
            <button onClick={() => setShowClearInput(false)} style={{ padding: '7px 10px' }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
