-- Add deployment_status enum
CREATE TYPE deployment_status AS ENUM ('active', 'suspended', 'revoked');

-- Add deployment key (secret token for subscribe flow) and status to deployments
ALTER TABLE deployments
    ADD COLUMN deployment_key TEXT UNIQUE NOT NULL DEFAULT replace(uuid_generate_v4()::text, '-', ''),
    ADD COLUMN status deployment_status NOT NULL DEFAULT 'active';

CREATE INDEX idx_deployments_key ON deployments(deployment_key);

-- Add per-tenant decryption key returned to subscribers on successful auth
ALTER TABLE tenants
    ADD COLUMN decryption_key TEXT UNIQUE NOT NULL DEFAULT replace(uuid_generate_v4()::text, '-', '') || replace(uuid_generate_v4()::text, '-', '');
