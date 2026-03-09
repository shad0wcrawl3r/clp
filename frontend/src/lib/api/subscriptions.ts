import { apiClient } from './client'
import type {
  Subscription,
  ListSubscriptionFeaturesRow,
  EntitlementEvent,
  CreateSubscriptionRequest,
  UpdateSubscriptionStatusRequest,
  AddSubscriptionFeatureRequest,
} from '@/types/api'

export const subscriptionsApi = {
  listForTenant: (tenantId: string) =>
    apiClient.get<Subscription[]>(`/tenants/${tenantId}/subscriptions`),

  getActiveForTenant: (tenantId: string) =>
    apiClient.get<Subscription>(`/tenants/${tenantId}/subscriptions/active`),

  get: (id: string) => apiClient.get<Subscription>(`/subscriptions/${id}`),

  create: (tenantId: string, body: CreateSubscriptionRequest) =>
    apiClient.post<Subscription>(`/tenants/${tenantId}/subscriptions`, body),

  updateStatus: (id: string, body: UpdateSubscriptionStatusRequest) =>
    apiClient.patch<Subscription>(`/subscriptions/${id}/status`, body),

  cancel: (id: string) => apiClient.post<Subscription>(`/subscriptions/${id}/cancel`),

  listFeatures: (id: string) =>
    apiClient.get<ListSubscriptionFeaturesRow[]>(`/subscriptions/${id}/features`),

  addFeature: (id: string, body: AddSubscriptionFeatureRequest) =>
    apiClient.post<ListSubscriptionFeaturesRow>(`/subscriptions/${id}/features`, body),

  removeFeature: (id: string, featureId: string) =>
    apiClient.delete<void>(`/subscriptions/${id}/features/${featureId}`),

  listEvents: (id: string, params?: { limit?: number; offset?: number }) =>
    apiClient.get<EntitlementEvent[]>(`/subscriptions/${id}/events`, params),
}
