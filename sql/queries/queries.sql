-- =========================================================
-- TENANTS
-- =========================================================

-- name: CreateTenant :one
INSERT INTO tenants (
    name,
    external_ref,
    status
) VALUES (
    $1, $2, $3
)
RETURNING *;

-- name: GetTenant :one
SELECT *
FROM tenants
WHERE id = $1
LIMIT 1;

-- name: GetTenantByExternalRef :one
SELECT *
FROM tenants
WHERE external_ref = $1
LIMIT 1;

-- name: ListTenants :many
SELECT *
FROM tenants
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateTenantStatus :exec
UPDATE tenants
SET status = $2,
    updated_at = now()
WHERE id = $1;

-- name: DeleteTenant :exec
DELETE FROM tenants
WHERE id = $1;


-- =========================================================
-- CLOUD ACCOUNT MAPPINGS
-- =========================================================

-- name: AddTenantCloudAccount :one
INSERT INTO tenant_cloud_accounts (
    tenant_id,
    cloud_provider,
    cloud_account_id
) VALUES (
    $1, $2, $3
)
RETURNING *;

-- name: ListTenantCloudAccounts :many
SELECT *
FROM tenant_cloud_accounts
WHERE tenant_id = $1;

-- name: GetTenantCloudAccount :one
SELECT *
FROM tenant_cloud_accounts
WHERE cloud_provider = $1
AND cloud_account_id = $2
LIMIT 1;

-- name: DeleteTenantCloudAccount :exec
DELETE FROM tenant_cloud_accounts
WHERE id = $1;


-- =========================================================
-- FEATURES
-- =========================================================

-- name: CreateFeature :one
INSERT INTO features (
    feature_code,
    name,
    description,
    category
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;

-- name: GetFeatureByCode :one
SELECT *
FROM features
WHERE feature_code = $1
LIMIT 1;

-- name: ListFeatures :many
SELECT *
FROM features
ORDER BY feature_code;

-- name: DeleteFeature :exec
DELETE FROM features
WHERE id = $1;


-- =========================================================
-- SUBSCRIPTIONS
-- =========================================================

-- name: CreateSubscription :one
INSERT INTO subscriptions (
    tenant_id,
    plan_code,
    billing_model,
    status,
    start_date,
    end_date,
    trial_end,
    auto_renew
) VALUES (
    $1, $2, $3, $4,
    $5, $6, $7, $8
)
RETURNING *;

-- name: GetSubscription :one
SELECT *
FROM subscriptions
WHERE id = $1
LIMIT 1;

-- name: GetTenantActiveSubscription :one
SELECT *
FROM subscriptions
WHERE tenant_id = $1
AND status IN ('trial','active','grace')
ORDER BY created_at DESC
LIMIT 1;

-- name: ListTenantSubscriptions :many
SELECT *
FROM subscriptions
WHERE tenant_id = $1
ORDER BY created_at DESC;

-- name: UpdateSubscriptionStatus :exec
UPDATE subscriptions
SET status = $2,
    updated_at = now()
WHERE id = $1;

-- name: CancelSubscription :exec
UPDATE subscriptions
SET status = 'cancelled',
    updated_at = now()
WHERE id = $1;

-- name: ExpireSubscriptions :execrows
UPDATE subscriptions
SET status = 'expired',
    updated_at = now()
WHERE end_date < CURRENT_DATE
AND status NOT IN ('expired','cancelled');


-- =========================================================
-- SUBSCRIPTION FEATURE ENTITLEMENTS
-- =========================================================

-- name: AddSubscriptionFeature :exec
INSERT INTO subscription_features (
    subscription_id,
    feature_id,
    enabled,
    limits
) VALUES (
    $1, $2, $3, $4
)
ON CONFLICT (subscription_id, feature_id)
DO UPDATE
SET enabled = EXCLUDED.enabled,
    limits = EXCLUDED.limits;

-- name: ListSubscriptionFeatures :many
SELECT
    sf.*,
    f.feature_code,
    f.name
FROM subscription_features sf
JOIN features f ON f.id = sf.feature_id
WHERE sf.subscription_id = $1;

-- name: CheckFeatureEnabled :one
SELECT enabled
FROM subscription_features
WHERE subscription_id = $1
AND feature_id = $2
LIMIT 1;

-- name: RemoveSubscriptionFeature :exec
DELETE FROM subscription_features
WHERE subscription_id = $1
AND feature_id = $2;


-- =========================================================
-- DEPLOYMENTS
-- =========================================================

-- name: CreateDeployment :one
INSERT INTO deployments (
    tenant_id,
    deployment_type,
    region,
    environment
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;

-- name: GetDeployment :one
SELECT *
FROM deployments
WHERE id = $1
LIMIT 1;

-- name: ListTenantDeployments :many
SELECT *
FROM deployments
WHERE tenant_id = $1
ORDER BY created_at DESC;

-- name: DeleteDeployment :exec
DELETE FROM deployments
WHERE id = $1;

-- name: GetDeploymentByKey :one
SELECT id, tenant_id, status
FROM deployments
WHERE deployment_key = $1
LIMIT 1;

-- name: ListAllDeployments :many
SELECT d.id, d.tenant_id, d.deployment_type, d.region, d.environment,
       d.deployment_key, d.status, d.created_at, d.updated_at,
       t.name AS tenant_name
FROM deployments d
JOIN tenants t ON t.id = d.tenant_id
ORDER BY d.created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateDeploymentStatus :exec
UPDATE deployments
SET status = $2,
    updated_at = now()
WHERE id = $1;


-- =========================================================
-- ENDPOINTS / AGENTS
-- =========================================================

-- name: RegisterEndpoint :one
INSERT INTO endpoints (
    tenant_id,
    deployment_id,
    hostname,
    os,
    agent_version
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;

-- name: GetEndpoint :one
SELECT *
FROM endpoints
WHERE id = $1
LIMIT 1;

-- name: ListTenantEndpoints :many
SELECT *
FROM endpoints
WHERE tenant_id = $1
ORDER BY created_at DESC;

-- name: UpdateEndpointHeartbeat :exec
UPDATE endpoints
SET last_seen = now()
WHERE id = $1;

-- name: UpdateEndpointStatus :exec
UPDATE endpoints
SET status = $2
WHERE id = $1;

-- name: CountActiveEndpoints :one
SELECT COUNT(*)
FROM endpoints
WHERE tenant_id = $1
AND status = 'active';

-- name: DeleteEndpoint :exec
DELETE FROM endpoints
WHERE id = $1;


-- =========================================================
-- USAGE METRICS
-- =========================================================

-- name: UpsertUsageMetricsDaily :exec
INSERT INTO usage_metrics_daily (
    tenant_id,
    usage_date,
    endpoints_active,
    events_ingested,
    eps_avg,
    eps_peak
) VALUES (
    $1, $2, $3, $4, $5, $6
)
ON CONFLICT (tenant_id, usage_date)
DO UPDATE
SET endpoints_active = EXCLUDED.endpoints_active,
    events_ingested = EXCLUDED.events_ingested,
    eps_avg = EXCLUDED.eps_avg,
    eps_peak = EXCLUDED.eps_peak;

-- name: GetUsageForDate :one
SELECT *
FROM usage_metrics_daily
WHERE tenant_id = $1
AND usage_date = $2
LIMIT 1;

-- name: GetUsageRange :many
SELECT *
FROM usage_metrics_daily
WHERE tenant_id = $1
AND usage_date BETWEEN $2 AND $3
ORDER BY usage_date DESC;


-- =========================================================
-- ENTITLEMENT EVENTS
-- =========================================================

-- name: CreateEntitlementEvent :one
INSERT INTO entitlement_events (
    tenant_id,
    subscription_id,
    deployment_id,
    event_type,
    metadata
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;

-- name: ListTenantEvents :many
SELECT *
FROM entitlement_events
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListSubscriptionEvents :many
SELECT *
FROM entitlement_events
WHERE subscription_id = $1
ORDER BY created_at DESC;

-- name: ListEventsByType :many
SELECT *
FROM entitlement_events
WHERE event_type = $1
ORDER BY created_at DESC
LIMIT $2;

-- name: SearchEventsByMetadata :many
SELECT *
FROM entitlement_events
WHERE metadata @> $1
ORDER BY created_at DESC
LIMIT $2;
