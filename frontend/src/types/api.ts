export type TenantStatus = 'active' | 'suspended' | 'deleted'
export type SubscriptionStatus = 'trial' | 'active' | 'grace' | 'past_due' | 'cancelled' | 'expired'
export type BillingModel = 'prepaid' | 'postpaid'
export type DeploymentType = 'aws' | 'azure' | 'gcp' | 'onprem'
export type DeploymentStatus = 'active' | 'suspended' | 'revoked'
export type EndpointStatus = 'active' | 'inactive' | 'deleted'

export interface Tenant {
  id: string
  name: string
  external_ref: string | null
  status: TenantStatus
  created_at: string | null
  updated_at: string | null
}

export interface Subscription {
  id: string
  tenant_id: string
  plan_code: string
  billing_model: BillingModel
  status: SubscriptionStatus
  start_date: string | null
  end_date: string | null
  trial_end: string | null
  auto_renew: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface Feature {
  id: string
  feature_code: string
  name: string
  description: string | null
  category: string | null
  created_at: string | null
}

export interface ListSubscriptionFeaturesRow {
  subscription_id: string
  feature_id: string
  enabled: boolean
  limits: Record<string, unknown> | null
  created_at: string | null
  feature_code: string
  name: string
}

export interface Deployment {
  id: string
  tenant_id: string
  deployment_type: DeploymentType
  region: string | null
  environment: string | null
  deployment_key: string
  status: DeploymentStatus
  created_at: string | null
  updated_at: string | null
}

export interface DeploymentWithTenant extends Deployment {
  tenant_name: string
}

export interface SubscribeResponse {
  access_token: string
  refresh_token: string
  tenant_id: string
  deployment_id: string
}

export interface Endpoint {
  id: string
  tenant_id: string
  deployment_id: string
  hostname: string | null
  os: string | null
  agent_version: string | null
  status: EndpointStatus
  first_seen: string | null
  last_seen: string | null
  created_at: string | null
}

export interface TenantCloudAccount {
  id: string
  tenant_id: string
  cloud_provider: DeploymentType
  cloud_account_id: string
  created_at: string | null
}

export interface EntitlementEvent {
  id: string
  tenant_id: string
  subscription_id: string
  deployment_id: string
  event_type: string
  metadata: Record<string, unknown> | null
  created_at: string | null
}

export interface UsageMetricsDaily {
  id: string
  tenant_id: string
  usage_date: string | null
  endpoints_active: number
  events_ingested: number
  eps_avg: number
  eps_peak: number
  created_at: string | null
}

// Request body types
export interface CreateTenantRequest {
  name: string
  external_ref?: string
  status?: TenantStatus
}

export interface UpdateTenantStatusRequest {
  status: TenantStatus
}

export interface CreateSubscriptionRequest {
  plan_code: string
  billing_model: BillingModel
  status?: SubscriptionStatus
  start_date?: string
  end_date?: string
  trial_end?: string
  auto_renew?: boolean
}

export interface UpdateSubscriptionStatusRequest {
  status: SubscriptionStatus
}

export interface CreateFeatureRequest {
  feature_code: string
  name: string
  description?: string
  category?: string
}

export interface CreateDeploymentRequest {
  deployment_type: DeploymentType
  region?: string
  environment?: string
}

export interface RegisterEndpointRequest {
  deployment_id: string
  hostname?: string
  os?: string
  agent_version?: string
}

export interface UpdateEndpointStatusRequest {
  status: EndpointStatus
}

export interface AddCloudAccountRequest {
  cloud_provider: DeploymentType
  cloud_account_id: string
}

export interface AddSubscriptionFeatureRequest {
  feature_id: string
  enabled?: boolean
  limits?: Record<string, unknown>
}

export interface UpsertUsageMetricsRequest {
  usage_date: string
  endpoints_active: number
  events_ingested: number
  eps_avg: number
  eps_peak: number
}

export interface SearchEventsByMetadataRequest {
  metadata: Record<string, unknown>
}

export interface ListResponse<T> {
  data: T[]
  total?: number
}

export interface CountResponse {
  count: number
}

export interface ExpireSubscriptionsResponse {
  expired: number
}
