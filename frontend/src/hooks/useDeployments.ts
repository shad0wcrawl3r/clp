import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deploymentsApi } from '@/lib/api/deployments'
import { qk } from '@/lib/query-keys'
import type { CreateDeploymentRequest, DeploymentStatus } from '@/types/api'

export function useAllDeployments(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: qk.deployments.all(params),
    queryFn: () => deploymentsApi.listAll(params),
  })
}

export function useTenantDeployments(tenantId: string) {
  return useQuery({
    queryKey: qk.deployments.forTenant(tenantId),
    queryFn: () => deploymentsApi.listForTenant(tenantId),
    enabled: !!tenantId,
  })
}

export function useCreateDeployment(tenantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateDeploymentRequest) => deploymentsApi.create(tenantId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.deployments.forTenant(tenantId) })
      qc.invalidateQueries({ queryKey: qk.deployments.all() })
    },
  })
}

export function useUpdateDeploymentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DeploymentStatus }) =>
      deploymentsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deployments'] })
    },
  })
}

export function useDeleteDeployment(tenantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deploymentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.deployments.forTenant(tenantId) })
      qc.invalidateQueries({ queryKey: qk.deployments.all() })
    },
  })
}
