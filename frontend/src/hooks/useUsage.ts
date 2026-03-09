import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usageApi } from '@/lib/api/usage'
import { qk } from '@/lib/query-keys'
import type { UpsertUsageMetricsRequest } from '@/types/api'

export function useUsageRange(tenantId: string, params: { from: string; to: string }) {
  return useQuery({
    queryKey: qk.usage.range(tenantId, params),
    queryFn: () => usageApi.getRange(tenantId, params),
    enabled: !!tenantId && !!params.from && !!params.to,
  })
}

export function useUpsertUsage(tenantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertUsageMetricsRequest) => usageApi.upsert(tenantId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usage', tenantId] }),
  })
}
