import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import './SubmitClaimPage.css'
import { ClaimConfirmation } from '../../components/ClaimConfirmation'
import { useSubmitClaim, type ClaimResponse } from '../../services/claims'
import { api } from '../../services/api'

interface Category {
  id: string
  name: string
  spending_cap: string
}

interface FieldErrors {
  amount?: string
  category_id?: string
  expense_date?: string
  merchant_name?: string
  receipt?: string
  general?: string
  spending_cap?: string
  receipt_required?: string
  retroactive_submission?: string
  weekend_policy?: string
  [key: string]: string | undefined
}

export default function SubmitClaimPage() {
  const { mutateAsync, isPending } = useSubmitClaim()
  const [submitted, setSubmitted] = useState<ClaimResponse | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/api/v1/categories'),
  })

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
      } catch { /* not JSON */ }
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

  const isWeekend = (() => {
    if (!form.expense_date) return false
    const d = new Date(form.expense_date + 'T00:00:00')
    const day = d.getDay()
    return day === 0 || day === 6
  })()

  return (
    <div className="submit-claim-page">
      <h2>Submit Expense Claim</h2>
      {errors.general && <p className="inline-error">{errors.general}</p>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label className="form-label" htmlFor="amount">Amount (USD)</label>
            <input
              id="amount"
              className="form-input"
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
            {errors.amount && <span className="form-error">{errors.amount}</span>}
            {errors.spending_cap && <span className="form-error">{errors.spending_cap}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category_id">Category</label>
            <select
              id="category_id"
              className="form-select"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a category…</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (cap: ${c.spending_cap})
                </option>
              ))}
            </select>
            {errors.category_id && <span className="form-error">{errors.category_id}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="expense_date">Expense Date</label>
            <input
              id="expense_date"
              className="form-input"
              type="date"
              name="expense_date"
              value={form.expense_date}
              onChange={handleChange}
              required
            />
            {errors.expense_date && <span className="form-error">{errors.expense_date}</span>}
            {errors.retroactive_submission && (
              <span className="form-error">{errors.retroactive_submission}</span>
            )}
            {errors.weekend_policy && (
              <span className="form-error">{errors.weekend_policy}</span>
            )}
            {isWeekend && (
              <span className="submit-claim-weekend-hint">
                ⚠ Weekend date — this claim will require manager review
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="merchant_name">Merchant Name</label>
            <input
              id="merchant_name"
              className="form-input"
              type="text"
              name="merchant_name"
              value={form.merchant_name}
              onChange={handleChange}
              required
            />
            {errors.merchant_name && <span className="form-error">{errors.merchant_name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Receipt (JPEG, PNG, or PDF — max 10 MB)</label>
            <input
              className="form-input"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFile}
              style={{ padding: '10px 12px' }}
            />
            {errors.receipt && <span className="form-error">{errors.receipt}</span>}
            {errors.receipt_required && (
              <span className="form-error">{errors.receipt_required}</span>
            )}
          </div>

          <div className="submit-claim-actions">
            <button className="btn-primary" type="submit" disabled={isPending}>
              {isPending ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
