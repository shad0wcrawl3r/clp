import { apiClient } from './client'
import type { EntitlementEvent, SearchEventsByMetadataRequest } from '@/types/api'

export const eventsApi = {
  listForTenant: (tenantId: string, params?: { limit?: number; offset?: number }) =>
    apiClient.get<EntitlementEvent[]>(`/tenants/${tenantId}/events`, params),

  listByType: (eventType: string) =>
    apiClient.get<EntitlementEvent[]>('/events', { type: eventType }),

  searchByMetadata: (body: SearchEventsByMetadataRequest) =>
    apiClient.post<EntitlementEvent[]>('/events/search', body),
}
