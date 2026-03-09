-- =========================================================
-- 000_init.sql
-- SaaS Licensing + Entitlement System
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SET TIMEZONE = 'Asia/Kathmandu';

-- =========================================================
-- ENUMS
-- =========================================================

CREATE TYPE tenant_status AS ENUM (
    'active',
    'suspended',
    'deleted'
);

CREATE TYPE subscription_status AS ENUM (
    'trial',
    'active',
    'grace',
    'past_due',
    'cancelled',
    'expired'
);

CREATE TYPE billing_model AS ENUM (
    'prepaid',
    'postpaid'
);

CREATE TYPE deployment_type AS ENUM (
    'aws',
    'azure',
    'gcp',
    'onprem'
);

CREATE TYPE endpoint_status AS ENUM (
    'active',
    'inactive',
    'deleted'
);

-- =========================================================
-- TENANTS
-- =========================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name TEXT NOT NULL,
    external_ref TEXT,

    status tenant_status NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_status ON tenants(status);

-- =========================================================
-- CLOUD ACCOUNT MAPPINGS
-- =========================================================

CREATE TABLE tenant_cloud_accounts (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    cloud_provider deployment_type NOT NULL,

    cloud_account_id TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (cloud_provider, cloud_account_id)
);

CREATE INDEX idx_cloud_accounts_tenant
ON tenant_cloud_accounts(tenant_id);

-- =========================================================
-- FEATURES CATALOG
-- =========================================================

CREATE TABLE features (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    feature_code TEXT UNIQUE NOT NULL,

    name TEXT NOT NULL,

    description TEXT,

    category TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_features_code ON features(feature_code);

-- =========================================================
-- SUBSCRIPTIONS
-- =========================================================

CREATE TABLE subscriptions (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    plan_code TEXT NOT NULL,

    billing_model billing_model NOT NULL DEFAULT 'prepaid',

    status subscription_status NOT NULL DEFAULT 'trial',

    start_date DATE NOT NULL,
    end_date DATE,

    trial_end DATE,

    auto_renew BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_subscriptions_tenant
ON subscriptions(tenant_id);

CREATE INDEX idx_subscriptions_status
ON subscriptions(status);

-- =========================================================
-- SUBSCRIPTION FEATURE ENTITLEMENTS
-- =========================================================

CREATE TABLE subscription_features (

    subscription_id UUID NOT NULL
        REFERENCES subscriptions(id)
        ON DELETE CASCADE,

    feature_id UUID NOT NULL
        REFERENCES features(id)
        ON DELETE CASCADE,

    enabled BOOLEAN NOT NULL DEFAULT TRUE,

    limits JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (subscription_id, feature_id)
);

CREATE INDEX idx_subscription_features_feature
ON subscription_features(feature_id);

-- =========================================================
-- DEPLOYMENTS
-- =========================================================

CREATE TABLE deployments (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    deployment_type deployment_type NOT NULL,

    region TEXT,

    environment TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deployments_tenant
ON deployments(tenant_id);

-- =========================================================
-- ENDPOINTS / AGENTS
-- =========================================================

CREATE TABLE endpoints (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    deployment_id UUID
        REFERENCES deployments(id)
        ON DELETE SET NULL,

    hostname TEXT,
    os TEXT,
    agent_version TEXT,

    status endpoint_status NOT NULL DEFAULT 'active',

    first_seen TIMESTAMPTZ DEFAULT now(),
    last_seen TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_endpoints_tenant
ON endpoints(tenant_id);

CREATE INDEX idx_endpoints_last_seen
ON endpoints(last_seen);

-- =========================================================
-- USAGE METRICS
-- =========================================================

CREATE TABLE usage_metrics_daily (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    usage_date DATE NOT NULL,

    endpoints_active INTEGER NOT NULL DEFAULT 0,

    events_ingested BIGINT NOT NULL DEFAULT 0,

    eps_avg INTEGER NOT NULL DEFAULT 0,
    eps_peak INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (tenant_id, usage_date)
);

CREATE INDEX idx_usage_metrics_tenant_date
ON usage_metrics_daily(tenant_id, usage_date DESC);

-- =========================================================
-- LICENSE / ENTITLEMENT EVENTS
-- =========================================================

CREATE TABLE entitlement_events (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    subscription_id UUID
        REFERENCES subscriptions(id)
        ON DELETE CASCADE,

    deployment_id UUID
        REFERENCES deployments(id)
        ON DELETE SET NULL,

    event_type TEXT NOT NULL,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_tenant
ON entitlement_events(tenant_id);

CREATE INDEX idx_events_subscription
ON entitlement_events(subscription_id);

CREATE INDEX idx_events_type
ON entitlement_events(event_type);

CREATE INDEX idx_events_metadata
ON entitlement_events USING GIN(metadata);
