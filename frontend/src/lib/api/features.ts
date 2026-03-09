import { apiClient } from './client'
import type { Feature, CreateFeatureRequest } from '@/types/api'

export const featuresApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<Feature[]>('/features', params),

  getByCode: (code: string) => apiClient.get<Feature>(`/features/${code}`),

  create: (body: CreateFeatureRequest) => apiClient.post<Feature>('/features', body),

  delete: (id: string) => apiClient.delete<void>(`/features/${id}`),
}
