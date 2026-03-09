import { apiClient } from './client'
import type { ExpireSubscriptionsResponse } from '@/types/api'

export const adminApi = {
  expireSubscriptions: () =>
    apiClient.post<ExpireSubscriptionsResponse>('/admin/subscriptions/expire'),
}
