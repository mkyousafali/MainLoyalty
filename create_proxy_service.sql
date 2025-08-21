-- ========================================
-- PROXY SERVICE FOR IFRAME-BLOCKED SITES
-- ========================================
-- Create a proxy table to store proxy configurations

CREATE TABLE IF NOT EXISTS app_proxies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID REFERENCES other_apps(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    proxy_endpoint TEXT NOT NULL,
    proxy_type TEXT DEFAULT 'iframe', -- 'iframe', 'embed', 'screenshot'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sample proxy configurations
INSERT INTO app_proxies (app_id, original_url, proxy_endpoint, proxy_type) 
SELECT id, url, CONCAT('https://your-proxy-service.com/embed?url=', url), 'iframe'
FROM other_apps 
WHERE name = 'Wabis' 
ON CONFLICT DO NOTHING;

SELECT 'Proxy service table created!' as status;
