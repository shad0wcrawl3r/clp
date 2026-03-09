import type { TenantStatus, SubscriptionStatus, BillingModel, DeploymentType, DeploymentStatus, EndpointStatus } from '@/types/api'

export const TENANT_STATUSES: TenantStatus[] = ['active', 'suspended', 'deleted']
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['trial', 'active', 'grace', 'past_due', 'cancelled', 'expired']
export const BILLING_MODELS: BillingModel[] = ['prepaid', 'postpaid']
export const DEPLOYMENT_TYPES: DeploymentType[] = ['aws', 'azure', 'gcp', 'onprem']
export const DEPLOYMENT_STATUSES: DeploymentStatus[] = ['active', 'suspended', 'revoked']
export const ENDPOINT_STATUSES: EndpointStatus[] = ['active', 'inactive', 'deleted']
