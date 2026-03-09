DROP INDEX IF EXISTS idx_deployments_key;
ALTER TABLE deployments DROP COLUMN IF EXISTS deployment_key, DROP COLUMN IF EXISTS status;
DROP TYPE IF EXISTS deployment_status;
ALTER TABLE tenants DROP COLUMN IF EXISTS decryption_key;
