import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantsApi } from '@/lib/api/tenants'
import { qk } from '@/lib/query-keys'
import type { CreateTenantRequest, UpdateTenantStatusRequest } from '@/types/api'

export function useTenantList(params?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: qk.tenants.list(params),
    queryFn: () => tenantsApi.list(params),
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: qk.tenants.detail(id),
    queryFn: () => tenantsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTenantRequest) => tenantsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tenants.all() }),
  })
}

export function useUpdateTenantStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateTenantStatusRequest) => tenantsApi.updateStatus(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tenants.all() })
      qc.invalidateQueries({ queryKey: qk.tenants.detail(id) })
    },
  })
}

export function useDeleteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tenants.all() }),
  })
}
