import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { ClaimResponse } from './claims'

export interface DecisionRequest {
  action: 'approved' | 'rejected'
  note?: string
}

export function useManagerQueue() {
  return useQuery<ClaimResponse[]>({
    queryKey: ['manager', 'queue'],
    queryFn: () => api.get<ClaimResponse[]>('/api/v1/manager/claims'),
  })
}

export function useDecideClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ claimId, body }: { claimId: string; body: DecisionRequest }) =>
      api.post<ClaimResponse>(`/api/v1/manager/claims/${claimId}/decision`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'queue'] })
    },
  })
}
