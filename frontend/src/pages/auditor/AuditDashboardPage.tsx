import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AuditDashboardPage.css'
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
    <div className="page-container">
      <h1 className="page-header">Audit Dashboard</h1>

      <div className="audit-filters">
        <select
          className="form-select"
          value={filters.violation_type ?? ''}
          onChange={e => handleFilter('violation_type', e.target.value)}
        >
          {VIOLATION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          className="form-input"
          type="date"
          value={filters.date_from ?? ''}
          onChange={e => handleFilter('date_from', e.target.value)}
        />
        <input
          className="form-input"
          type="date"
          value={filters.date_to ?? ''}
          onChange={e => handleFilter('date_to', e.target.value)}
        />
        <input
          className="form-input"
          type="text"
          placeholder="Employee ID (UUID)"
          value={filters.employee_id ?? ''}
          onChange={e => handleFilter('employee_id', e.target.value)}
          style={{ minWidth: 260 }}
        />
      </div>

      {isLoading && <div className="state-loading">Loading flagged claims…</div>}
      {isError && <div className="state-error">Failed to load audit claims.</div>}
      {!isLoading && claims?.length === 0 && (
        <div className="state-empty">No flagged claims matching the current filters.</div>
      )}

      {claims && claims.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Employee</th>
                <th>Amount</th>
                <th>Submitted</th>
                <th>Flags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim: ClaimResponse) => (
                <tr key={claim.id}>
                  <td>
                    <button className="btn-link" onClick={() => navigate(`/auditor/claims/${claim.id}`)}>
                      {claim.id.slice(0, 8)}
                    </button>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-text-xs-size)' }}>
                    {claim.employee_id.slice(0, 8)}…
                  </td>
                  <td>{claim.currency} {claim.amount}</td>
                  <td>{new Date(claim.submitted_at).toLocaleDateString()}</td>
                  <td><span className="badge badge-flagged">flagged</span></td>
                  <td>
                    <div className="audit-action-group">
                      <button
                        className="btn-warning"
                        style={{ minHeight: 36, padding: '6px 14px' }}
                        onClick={() => handleInvestigate(claim.id)}
                        disabled={investigateMutation.isPending}
                      >
                        Investigate
                      </button>
                      {clearOpen === claim.id ? (
                        <div className="audit-clear-inline">
                          <input
                            className="form-input"
                            type="text"
                            placeholder="Resolution note…"
                            value={clearNote[claim.id] ?? ''}
                            onChange={e => setClearNote(prev => ({ ...prev, [claim.id]: e.target.value }))}
                          />
                          <button
                            className="btn-success"
                            style={{ minHeight: 36, padding: '6px 14px' }}
                            onClick={() => handleClear(claim.id)}
                            disabled={clearMutation.isPending}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ minHeight: 36, padding: '6px 12px' }}
                            onClick={() => setClearOpen(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-secondary"
                          style={{ minHeight: 36, padding: '6px 14px' }}
                          onClick={() => setClearOpen(claim.id)}
                        >
                          Clear
                        </button>
                      )}
                    </div>
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
