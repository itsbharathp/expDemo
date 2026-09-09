import { useState } from 'react'
import './PolicyConfigPage.css'
import { type PolicyRule, type PolicyRuleUpdate, usePolicyRules, useUpdatePolicyRule } from '../../services/admin'

function PolicyRuleRow({ rule }: { rule: PolicyRule }) {
  const [threshold, setThreshold] = useState(rule.threshold_value ?? '')
  const [action, setAction] = useState(rule.enforcement_action)
  const [enabled, setEnabled] = useState(rule.is_enabled)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const updateMutation = useUpdatePolicyRule()

  const handleSave = () => {
    setError('')
    setSaved(false)
    const update: PolicyRuleUpdate = {
      enforcement_action: action,
      is_enabled: enabled,
    }
    if (threshold !== '') update.threshold_value = parseFloat(String(threshold))
    updateMutation.mutate(
      { id: rule.id, update },
      {
        onSuccess: () => setSaved(true),
        onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
      }
    )
  }

  return (
    <tr>
      <td style={{ fontWeight: 'var(--font-weight-medium)' } as React.CSSProperties}>{rule.name}</td>
      <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-text-xs-size)' }}>{rule.rule_type}</code></td>
      <td>
        <input
          className="form-input policy-table-threshold"
          type="number"
          value={threshold}
          onChange={e => { setSaved(false); setThreshold(e.target.value) }}
          step="0.01"
        />
      </td>
      <td>
        <select
          className="form-select policy-table-enforcement"
          value={action}
          onChange={e => { setSaved(false); setAction(e.target.value) }}
        >
          <option value="reject">reject</option>
          <option value="flag">flag</option>
          <option value="require_review">require_review</option>
        </select>
      </td>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => { setSaved(false); setEnabled(e.target.checked) }}
          style={{ width: 18, height: 18, cursor: 'pointer' }}
        />
      </td>
      <td>
        <button
          className="btn-primary"
          style={{ minHeight: 36, padding: '6px 16px' }}
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="policy-save-feedback inline-success">✓ Saved</span>}
        {error && <span className="policy-save-feedback inline-error">{error}</span>}
      </td>
    </tr>
  )
}

export default function PolicyConfigPage() {
  const { data: rules, isLoading, error } = usePolicyRules()

  if (isLoading) return <div className="state-loading">Loading policy rules…</div>
  if (error) return <div className="state-error">Failed to load policy rules.</div>

  return (
    <div className="page-container">
      <h1 className="page-header">Policy Configuration</h1>
      <p className="policy-page-hint">Changes take effect for new submissions within 60 seconds.</p>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Threshold ($)</th>
              <th>Enforcement</th>
              <th style={{ textAlign: 'center' }}>Enabled</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(rules ?? []).map((rule) => (
              <PolicyRuleRow key={rule.id} rule={rule} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
