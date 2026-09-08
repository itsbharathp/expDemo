import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

export interface PolicyRule {
  id: string
  rule_type: string
  name: string
  threshold_value: string | null
  enforcement_action: string
  category_id: string | null
  is_enabled: boolean
  updated_at: string
}

export interface PolicyRuleUpdate {
  threshold_value?: number | null
  enforcement_action?: string
  is_enabled?: boolean
}

export function usePolicyRules() {
  return useQuery<PolicyRule[]>({
    queryKey: ['policy-rules'],
    queryFn: () => api.get<PolicyRule[]>('/api/v1/admin/policy-rules'),
  })
}

export function useUpdatePolicyRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: PolicyRuleUpdate }) =>
      api.patch<PolicyRule>(`/api/v1/admin/policy-rules/${id}`, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-rules'] })
    },
  })
}
