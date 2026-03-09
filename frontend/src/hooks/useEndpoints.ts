import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { endpointsApi } from '@/lib/api/endpoints'
import { qk } from '@/lib/query-keys'
import type { RegisterEndpointRequest, UpdateEndpointStatusRequest } from '@/types/api'

export function useTenantEndpoints(tenantId: string) {
  return useQuery({
    queryKey: qk.endpoints.forTenant(tenantId),
    queryFn: () => endpointsApi.listForTenant(tenantId),
    enabled: !!tenantId,
  })
}

export function useTenantEndpointCount(tenantId: string) {
  return useQuery({
    queryKey: qk.endpoints.countForTenant(tenantId),
    queryFn: () => endpointsApi.countActiveForTenant(tenantId),
    enabled: !!tenantId,
  })
}

export function useRegisterEndpoint(tenantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RegisterEndpointRequest) => endpointsApi.register(tenantId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.endpoints.forTenant(tenantId) })
      qc.invalidateQueries({ queryKey: qk.endpoints.countForTenant(tenantId) })
    },
  })
}

export function useEndpointHeartbeat(tenantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => endpointsApi.heartbeat(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.endpoints.forTenant(tenantId) }),
  })
}

export function useUpdateEndpointStatus(tenantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateEndpointStatusRequest }) =>
      endpointsApi.updateStatus(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.endpoints.forTenant(tenantId) }),
  })
}

export function useDeleteEndpoint(tenantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => endpointsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.endpoints.forTenant(tenantId) })
      qc.invalidateQueries({ queryKey: qk.endpoints.countForTenant(tenantId) })
    },
  })
}
