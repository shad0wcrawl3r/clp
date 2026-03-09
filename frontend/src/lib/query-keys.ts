export const qk = {
  tenants: {
    all: () => ['tenants'] as const,
    list: (params?: object) => ['tenants', 'list', params] as const,
    detail: (id: string) => ['tenants', id] as const,
  },
  subscriptions: {
    forTenant: (tenantId: string) => ['subscriptions', 'tenant', tenantId] as const,
    activeForTenant: (tenantId: string) => ['subscriptions', 'active', tenantId] as const,
    detail: (id: string) => ['subscriptions', id] as const,
    features: (id: string) => ['subscriptions', id, 'features'] as const,
    events: (id: string, params?: object) => ['subscriptions', id, 'events', params] as const,
  },
  features: {
    all: () => ['features'] as const,
    list: (params?: object) => ['features', 'list', params] as const,
  },
  deployments: {
    all: (params?: object) => ['deployments', 'all', params] as const,
    forTenant: (tenantId: string) => ['deployments', 'tenant', tenantId] as const,
  },
  endpoints: {
    forTenant: (tenantId: string) => ['endpoints', 'tenant', tenantId] as const,
    countForTenant: (tenantId: string) => ['endpoints', 'count', tenantId] as const,
  },
  cloudAccounts: {
    forTenant: (tenantId: string) => ['cloudAccounts', 'tenant', tenantId] as const,
  },
  events: {
    forTenant: (tenantId: string, params?: object) =>
      ['events', 'tenant', tenantId, params] as const,
    byType: (type: string) => ['events', 'type', type] as const,
    search: (query: object) => ['events', 'search', query] as const,
  },
  usage: {
    range: (tenantId: string, params: object) => ['usage', tenantId, params] as const,
  },
}
