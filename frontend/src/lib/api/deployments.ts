import { apiClient } from './client'
import type { Deployment, DeploymentWithTenant, DeploymentStatus, CreateDeploymentRequest, SubscribeResponse } from '@/types/api'

export const deploymentsApi = {
  listForTenant: (tenantId: string) =>
    apiClient.get<Deployment[]>(`/tenants/${tenantId}/deployments`),

  listAll: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<DeploymentWithTenant[]>('/deployments', params as Record<string, number>),

  get: (id: string) => apiClient.get<Deployment>(`/deployments/${id}`),

  create: (tenantId: string, body: CreateDeploymentRequest) =>
    apiClient.post<Deployment>(`/tenants/${tenantId}/deployments`, body),

  updateStatus: (id: string, status: DeploymentStatus) =>
    apiClient.patch<void>(`/deployments/${id}/status`, { status }),

  delete: (id: string) => apiClient.delete<void>(`/deployments/${id}`),

  subscribe: (deploymentKey: string) =>
    apiClient.post<SubscribeResponse>('/subscribe', { deployment_key: deploymentKey }),

  refreshTokens: (refreshToken: string) =>
    apiClient.post<SubscribeResponse>('/subscribe/refresh', { refresh_token: refreshToken }),
}
