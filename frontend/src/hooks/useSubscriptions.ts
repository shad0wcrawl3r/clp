import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { qk } from '@/lib/query-keys'
import type {
  CreateSubscriptionRequest,
  UpdateSubscriptionStatusRequest,
  AddSubscriptionFeatureRequest,
} from '@/types/api'

export function useTenantSubscriptions(tenantId: string) {
  return useQuery({
    queryKey: qk.subscriptions.forTenant(tenantId),
    queryFn: () => subscriptionsApi.listForTenant(tenantId),
    enabled: !!tenantId,
  })
}

export function useTenantActiveSubscription(tenantId: string) {
  return useQuery({
    queryKey: qk.subscriptions.activeForTenant(tenantId),
    queryFn: () => subscriptionsApi.getActiveForTenant(tenantId),
    enabled: !!tenantId,
  })
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: qk.subscriptions.detail(id),
    queryFn: () => subscriptionsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateSubscription(tenantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSubscriptionRequest) => subscriptionsApi.create(tenantId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.subscriptions.forTenant(tenantId) })
      qc.invalidateQueries({ queryKey: qk.subscriptions.activeForTenant(tenantId) })
    },
  })
}

export function useUpdateSubscriptionStatus(id: string, tenantId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateSubscriptionStatusRequest) =>
      subscriptionsApi.updateStatus(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.subscriptions.detail(id) })
      if (tenantId) qc.invalidateQueries({ queryKey: qk.subscriptions.forTenant(tenantId) })
    },
  })
}

export function useCancelSubscription(id: string, tenantId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => subscriptionsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.subscriptions.detail(id) })
      if (tenantId) qc.invalidateQueries({ queryKey: qk.subscriptions.forTenant(tenantId) })
    },
  })
}

export function useSubscriptionFeatures(id: string) {
  return useQuery({
    queryKey: qk.subscriptions.features(id),
    queryFn: () => subscriptionsApi.listFeatures(id),
    enabled: !!id,
  })
}

export function useAddSubscriptionFeature(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddSubscriptionFeatureRequest) => subscriptionsApi.addFeature(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subscriptions.features(id) }),
  })
}

export function useRemoveSubscriptionFeature(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (featureId: string) => subscriptionsApi.removeFeature(id, featureId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subscriptions.features(id) }),
  })
}

export function useSubscriptionEvents(id: string, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: qk.subscriptions.events(id, params),
    queryFn: () => subscriptionsApi.listEvents(id, params),
    enabled: !!id,
  })
}
