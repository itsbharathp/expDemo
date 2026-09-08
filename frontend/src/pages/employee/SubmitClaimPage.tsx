import { useState } from 'react'
import { ClaimConfirmation } from '../../components/ClaimConfirmation'
import { useSubmitClaim, type ClaimResponse } from '../../services/claims'

const CATEGORIES = [
  { id: 'meal', label: 'Meal' },
  { id: 'travel', label: 'Travel' },
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'other', label: 'Other' },
]

interface FieldErrors {
  amount?: string
  category_id?: string
  expense_date?: string
  merchant_name?: string
  receipt?: string
  general?: string
}

export default function SubmitClaimPage() {
  const { mutateAsync, isPending } = useSubmitClaim()
  const [submitted, setSubmitted] = useState<ClaimResponse | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [form, setForm] = useState({
    amount: '',
    category_id: '',
    expense_date: '',
    merchant_name: '',
    receipt: null as File | null,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: undefined }))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, receipt: e.target.files?.[0] ?? null }))
    setErrors(prev => ({ ...prev, receipt: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const fd = new FormData()
    fd.append('amount', form.amount)
    fd.append('currency', 'USD')
    fd.append('expense_date', form.expense_date)
    fd.append('category_id', form.category_id)
    fd.append('merchant_name', form.merchant_name)
    if (form.receipt) fd.append('receipt', form.receipt)

    try {
      const claim = await mutateAsync(fd)
      setSubmitted(claim)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // Try to parse structured 422 detail array
      try {
        const detail = JSON.parse(msg)
        if (Array.isArray(detail)) {
          const fieldErrors: FieldErrors = {}
          for (const item of detail) {
            const key = (item.rule_type ?? item.loc?.[1] ?? 'general') as keyof FieldErrors
            fieldErrors[key] = item.message ?? item.msg ?? String(item)
          }
          setErrors(fieldErrors)
          return
        }
      } catch {
        // not JSON
      }
      setErrors({ general: msg })
    }
  }

  if (submitted) {
    return (
      <ClaimConfirmation
        claim={submitted}
        onReset={() => {
          setSubmitted(null)
          setForm({ amount: '', category_id: '', expense_date: '', merchant_name: '', receipt: null })
        }}
      />
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 480, margin: '0 auto' }}>
      <h2>Submit Expense Claim</h2>
      {errors.general && (
        <p style={{ color: 'red' }}>{errors.general}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Amount (USD)</label>
          <input
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%' }}
          />
          {errors.amount && <span style={{ color: 'red' }}>{errors.amount}</span>}
          {errors.spending_cap && <span style={{ color: 'red' }}>{errors.spending_cap}</span>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Category</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%' }}
          >
            <option value="">Select a category…</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category_id && <span style={{ color: 'red' }}>{errors.category_id}</span>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Expense Date</label>
          <input
            type="date"
            name="expense_date"
            value={form.expense_date}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%' }}
          />
          {errors.expense_date && <span style={{ color: 'red' }}>{errors.expense_date}</span>}
          {errors.retroactive_submission && (
            <span style={{ color: 'red' }}>{errors.retroactive_submission}</span>
          )}
          {errors.weekend_policy && (
            <span style={{ color: 'orange' }}>{errors.weekend_policy}</span>
          )}
          {form.expense_date && (() => {
            const d = new Date(form.expense_date + 'T00:00:00')
            const day = d.getDay()
            return day === 0 || day === 6 ? (
              <span style={{ color: 'orange', display: 'block' }}>
                ⚠️ Weekend date — this claim will require manager review
              </span>
            ) : null
          })()}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Merchant Name</label>
          <input
            type="text"
            name="merchant_name"
            value={form.merchant_name}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%' }}
          />
          {errors.merchant_name && <span style={{ color: 'red' }}>{errors.merchant_name}</span>}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label>Receipt (JPEG, PNG, or PDF — max 10 MB)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFile}
            style={{ display: 'block' }}
          />
          {errors.receipt && <span style={{ color: 'red' }}>{errors.receipt}</span>}
          {errors.receipt_required && (
            <span style={{ color: 'red' }}>{errors.receipt_required}</span>
          )}
        </div>

        <button type="submit" disabled={isPending}>
          {isPending ? 'Submitting…' : 'Submit Claim'}
        </button>
      </form>
    </div>
  )
}
