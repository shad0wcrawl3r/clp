import { apiClient } from './client'
import type { TenantCloudAccount, AddCloudAccountRequest } from '@/types/api'

export const cloudAccountsApi = {
  listForTenant: (tenantId: string) =>
    apiClient.get<TenantCloudAccount[]>(`/tenants/${tenantId}/cloud-accounts`),

  add: (tenantId: string, body: AddCloudAccountRequest) =>
    apiClient.post<TenantCloudAccount>(`/tenants/${tenantId}/cloud-accounts`, body),

  delete: (id: string) => apiClient.delete<void>(`/cloud-accounts/${id}`),
}
