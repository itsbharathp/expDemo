import { useState } from 'react'
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
      <td>{rule.name}</td>
      <td><code>{rule.rule_type}</code></td>
      <td>
        <input
          type="number"
          value={threshold}
          onChange={(e) => { setSaved(false); setThreshold(e.target.value) }}
          style={{ width: '80px' }}
          step="0.01"
        />
      </td>
      <td>
        <select value={action} onChange={(e) => { setSaved(false); setAction(e.target.value) }}>
          <option value="reject">reject</option>
          <option value="flag">flag</option>
          <option value="require_review">require_review</option>
        </select>
      </td>
      <td>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => { setSaved(false); setEnabled(e.target.checked) }}
        />
      </td>
      <td>
        <button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving…' : 'Save'}
        </button>
        {saved && <span style={{ color: 'green', marginLeft: '8px' }}>✓ Saved</span>}
        {error && <span style={{ color: 'red', marginLeft: '8px' }}>{error}</span>}
      </td>
    </tr>
  )
}

export default function PolicyConfigPage() {
  const { data: rules, isLoading, error } = usePolicyRules()

  if (isLoading) return <p>Loading policy rules…</p>
  if (error) return <p style={{ color: 'red' }}>Failed to load policy rules.</p>

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1>Policy Configuration</h1>
      <p>Changes take effect for new submissions within 60 seconds.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th style={{ textAlign: 'left' }}>Type</th>
            <th style={{ textAlign: 'left' }}>Threshold ($)</th>
            <th style={{ textAlign: 'left' }}>Enforcement</th>
            <th style={{ textAlign: 'left' }}>Enabled</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(rules ?? []).map((rule) => (
            <PolicyRuleRow key={rule.id} rule={rule} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
