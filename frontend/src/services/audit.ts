import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { ClaimResponse } from './claims'

export interface AuditFilters {
  violation_type?: string
  date_from?: string
  date_to?: string
  employee_id?: string
}

export function useAuditClaims(filters: AuditFilters) {
  const params = new URLSearchParams()
  if (filters.violation_type) params.set('violation_type', filters.violation_type)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.employee_id) params.set('employee_id', filters.employee_id)
  const query = params.toString()

  return useQuery<ClaimResponse[]>({
    queryKey: ['audit-claims', filters],
    queryFn: () => api.get<ClaimResponse[]>(`/api/v1/audit/claims${query ? `?${query}` : ''}`),
  })
}

export function useInvestigateClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (claimId: string) =>
      api.post<{ status: string }>(`/api/v1/audit/claims/${claimId}/investigate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-claims'] }),
  })
}

export function useClearFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ claimId, resolution_note }: { claimId: string; resolution_note: string }) =>
      api.post<{ status: string }>(`/api/v1/audit/claims/${claimId}/clear`, { resolution_note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-claims'] }),
  })
}
