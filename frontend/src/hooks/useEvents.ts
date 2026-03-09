import { useQuery, useMutation } from '@tanstack/react-query'
import { eventsApi } from '@/lib/api/events'
import { qk } from '@/lib/query-keys'
import type { SearchEventsByMetadataRequest } from '@/types/api'

export function useTenantEvents(tenantId: string, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: qk.events.forTenant(tenantId, params),
    queryFn: () => eventsApi.listForTenant(tenantId, params),
    enabled: !!tenantId,
  })
}

export function useEventsByType(eventType: string) {
  return useQuery({
    queryKey: qk.events.byType(eventType),
    queryFn: () => eventsApi.listByType(eventType),
    enabled: !!eventType,
  })
}

export function useSearchEventsByMetadata() {
  return useMutation({
    mutationFn: (body: SearchEventsByMetadataRequest) => eventsApi.searchByMetadata(body),
  })
}
