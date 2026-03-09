import { apiClient } from './client'
import type {
  Endpoint,
  RegisterEndpointRequest,
  UpdateEndpointStatusRequest,
  CountResponse,
} from '@/types/api'

export const endpointsApi = {
  listForTenant: (tenantId: string) =>
    apiClient.get<Endpoint[]>(`/tenants/${tenantId}/endpoints`),

  countActiveForTenant: (tenantId: string) =>
    apiClient.get<CountResponse>(`/tenants/${tenantId}/endpoints/count`),

  get: (id: string) => apiClient.get<Endpoint>(`/endpoints/${id}`),

  register: (tenantId: string, body: RegisterEndpointRequest) =>
    apiClient.post<Endpoint>(`/tenants/${tenantId}/endpoints`, body),

  heartbeat: (id: string) => apiClient.post<Endpoint>(`/endpoints/${id}/heartbeat`),

  updateStatus: (id: string, body: UpdateEndpointStatusRequest) =>
    apiClient.patch<Endpoint>(`/endpoints/${id}/status`, body),

  delete: (id: string) => apiClient.delete<void>(`/endpoints/${id}`),
}
