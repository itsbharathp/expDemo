import { useMutation } from '@tanstack/react-query'
import { api } from './api'

export interface ClaimResponse {
  id: string
  employee_id: string
  amount: string
  currency: string
  expense_date: string
  category_id: string
  merchant_name: string
  receipt_path: string | null
  status: string
  submitted_at: string
}

export function useSubmitClaim() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.postForm<ClaimResponse>('/api/v1/claims/', formData),
  })
}
