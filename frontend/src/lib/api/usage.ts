import { apiClient } from './client'
import type { UsageMetricsDaily, UpsertUsageMetricsRequest } from '@/types/api'

export const usageApi = {
  getRange: (tenantId: string, params: { from: string; to: string }) =>
    apiClient.get<UsageMetricsDaily[]>(`/tenants/${tenantId}/usage`, params),

  getForDate: (tenantId: string, date: string) =>
    apiClient.get<UsageMetricsDaily>(`/tenants/${tenantId}/usage/${date}`),

  upsert: (tenantId: string, body: UpsertUsageMetricsRequest) =>
    apiClient.put<UsageMetricsDaily>(`/tenants/${tenantId}/usage`, body),
}
