import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuditClaims, useClearFlag, useInvestigateClaim } from '../../services/audit'
import type { AuditFilters } from '../../services/audit'
import type { ClaimResponse } from '../../services/claims'

const VIOLATION_TYPES = [
  { value: '', label: 'All types' },
  { value: 'spending_cap', label: 'Spending Cap' },
  { value: 'receipt_required', label: 'Receipt Required' },
  { value: 'weekend_policy', label: 'Weekend Policy' },
  { value: 'duplicate_detection', label: 'Duplicate Detection' },
]

const FLAG_COLORS: Record<string, string> = {
  weekend_policy: '#f97316',
  duplicate_detection: '#eab308',
  spending_cap: '#ef4444',
  receipt_required: '#8b5cf6',
}

export default function AuditDashboardPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<AuditFilters>({})
  const [clearNote, setClearNote] = useState<Record<string, string>>({})
  const [clearOpen, setClearOpen] = useState<string | null>(null)

  const { data: claims, isLoading, isError } = useAuditClaims(filters)
  const investigateMutation = useInvestigateClaim()
  const clearMutation = useClearFlag()

  function handleFilter(key: keyof AuditFilters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value || undefined }))
  }

  async function handleInvestigate(claimId: string) {
    await investigateMutation.mutateAsync(claimId)
  }

  async function handleClear(claimId: string) {
    const note = clearNote[claimId] ?? ''
    if (!note.trim()) return
    await clearMutation.mutateAsync({ claimId, resolution_note: note })
    setClearOpen(null)
    setClearNote(prev => ({ ...prev, [claimId]: '' }))
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Audit Dashboard</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <select
          value={filters.violation_type ?? ''}
          onChange={e => handleFilter('violation_type', e.target.value)}
          style={{ padding: '6px 10px' }}
        >
          {VIOLATION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          type="date"
          placeholder="From date"
          value={filters.date_from ?? ''}
          onChange={e => handleFilter('date_from', e.target.value)}
          style={{ padding: '6px 10px' }}
        />
        <input
          type="date"
          placeholder="To date"
          value={filters.date_to ?? ''}
          onChange={e => handleFilter('date_to', e.target.value)}
          style={{ padding: '6px 10px' }}
        />
        <input
          type="text"
          placeholder="Employee ID (UUID)"
          value={filters.employee_id ?? ''}
          onChange={e => handleFilter('employee_id', e.target.value)}
          style={{ padding: '6px 10px', minWidth: 280 }}
        />
      </div>

      {isLoading && <p>Loading flagged claims…</p>}
      {isError && <p style={{ color: 'red' }}>Failed to load audit claims.</p>}
      {!isLoading && claims?.length === 0 && (
        <p style={{ color: '#6b7280' }}>No flagged claims matching the current filters.</p>
      )}

      {claims && claims.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>Ref</th>
              <th style={{ padding: '8px 12px' }}>Employee</th>
              <th style={{ padding: '8px 12px' }}>Amount</th>
              <th style={{ padding: '8px 12px' }}>Submitted</th>
              <th style={{ padding: '8px 12px' }}>Flags</th>
              <th style={{ padding: '8px 12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim: ClaimResponse) => (
              <tr key={claim.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 12px' }}>
                  <button
                    onClick={() => navigate(`/auditor/claims/${claim.id}`)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    {claim.id.slice(0, 8)}
                  </button>
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>
                  {claim.employee_id.slice(0, 8)}…
                </td>
                <td style={{ padding: '8px 12px' }}>{claim.currency} {claim.amount}</td>
                <td style={{ padding: '8px 12px' }}>
                  {new Date(claim.submitted_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span
                    style={{
                      background: FLAG_COLORS['weekend_policy'] + '22',
                      color: FLAG_COLORS['weekend_policy'],
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  >
                    flagged
                  </span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <button
                    onClick={() => handleInvestigate(claim.id)}
                    disabled={investigateMutation.isPending}
                    style={{ marginRight: 8, padding: '4px 10px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Investigate
                  </button>
                  {clearOpen === claim.id ? (
                    <span>
                      <input
                        type="text"
                        placeholder="Resolution note…"
                        value={clearNote[claim.id] ?? ''}
                        onChange={e => setClearNote(prev => ({ ...prev, [claim.id]: e.target.value }))}
                        style={{ padding: '3px 6px', marginRight: 4 }}
                      />
                      <button
                        onClick={() => handleClear(claim.id)}
                        disabled={clearMutation.isPending}
                        style={{ padding: '4px 10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 4 }}
                      >
                        Confirm
                      </button>
                      <button onClick={() => setClearOpen(null)} style={{ padding: '4px 8px' }}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setClearOpen(claim.id)}
                      style={{ padding: '4px 10px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
