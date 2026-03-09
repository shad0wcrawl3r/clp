import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { featuresApi } from '@/lib/api/features'
import { qk } from '@/lib/query-keys'
import type { CreateFeatureRequest } from '@/types/api'

export function useFeatureList(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: qk.features.list(params),
    queryFn: () => featuresApi.list(params),
  })
}

export function useCreateFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateFeatureRequest) => featuresApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.features.all() }),
  })
}

export function useDeleteFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => featuresApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.features.all() }),
  })
}
