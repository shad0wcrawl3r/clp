SET TIMEZONE = 'Asia/Kathmandu';

DROP INDEX IF EXISTS idx_events_metadata;
DROP INDEX IF EXISTS idx_events_type;
DROP INDEX IF EXISTS idx_events_subscription;
DROP INDEX IF EXISTS idx_events_tenant;

DROP INDEX IF EXISTS idx_usage_metrics_tenant_date;

DROP INDEX IF EXISTS idx_endpoints_last_seen;
DROP INDEX IF EXISTS idx_endpoints_tenant;

DROP INDEX IF EXISTS idx_deployments_tenant;

DROP INDEX IF EXISTS idx_subscription_features_feature;

DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_tenant;

DROP INDEX IF EXISTS idx_features_code;

DROP INDEX IF EXISTS idx_cloud_accounts_tenant;

DROP INDEX IF EXISTS idx_tenants_status;

DROP TABLE IF EXISTS entitlement_events;

DROP TABLE IF EXISTS usage_metrics_daily;

DROP TABLE IF EXISTS endpoints;

DROP TABLE IF EXISTS deployments;

DROP TABLE IF EXISTS subscription_features;

DROP TABLE IF EXISTS subscriptions;

DROP TABLE IF EXISTS features;

DROP TABLE IF EXISTS tenant_cloud_accounts;

DROP TABLE IF EXISTS tenants;

DROP TYPE IF EXISTS endpoint_status;

DROP TYPE IF EXISTS deployment_type;

DROP TYPE IF EXISTS billing_model;

DROP TYPE IF EXISTS subscription_status;

DROP TYPE IF EXISTS tenant_status;

DROP EXTENSION IF EXISTS "uuid-ossp";
