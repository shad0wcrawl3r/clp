import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cloudAccountsApi } from '@/lib/api/cloudaccounts'
import { qk } from '@/lib/query-keys'
import type { AddCloudAccountRequest } from '@/types/api'

export function useTenantCloudAccounts(tenantId: string) {
  return useQuery({
    queryKey: qk.cloudAccounts.forTenant(tenantId),
    queryFn: () => cloudAccountsApi.listForTenant(tenantId),
    enabled: !!tenantId,
  })
}

export function useAddCloudAccount(tenantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddCloudAccountRequest) => cloudAccountsApi.add(tenantId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cloudAccounts.forTenant(tenantId) }),
  })
}

export function useDeleteCloudAccount(tenantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cloudAccountsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cloudAccounts.forTenant(tenantId) }),
  })
}
