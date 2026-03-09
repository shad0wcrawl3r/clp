ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS decryption_key TEXT UNIQUE NOT NULL
    DEFAULT replace(uuid_generate_v4()::text, '-', '') || replace(uuid_generate_v4()::text, '-', '');
