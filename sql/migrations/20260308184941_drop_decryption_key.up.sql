-- decryption_key is replaced by JWT access/refresh tokens issued at subscribe time
ALTER TABLE tenants DROP COLUMN IF EXISTS decryption_key;
