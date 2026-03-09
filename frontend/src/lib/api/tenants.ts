import { apiClient } from './client'
import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantStatusRequest,
} from '@/types/api'

export const tenantsApi = {
  list: (params?: { limit?: number; offset?: number; status?: string }) =>
    apiClient.get<Tenant[]>('/tenants', params),

  get: (id: string) => apiClient.get<Tenant>(`/tenants/${id}`),

  getByExternalRef: (ref: string) => apiClient.get<Tenant>(`/tenants/external/${ref}`),

  create: (body: CreateTenantRequest) => apiClient.post<Tenant>('/tenants', body),

  updateStatus: (id: string, body: UpdateTenantStatusRequest) =>
    apiClient.patch<Tenant>(`/tenants/${id}/status`, body),

  delete: (id: string) => apiClient.delete<void>(`/tenants/${id}`),
}
