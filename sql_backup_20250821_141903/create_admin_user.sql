-- Create a default admin user for testing notifications
-- This will allow the notification system to properly link notifications to an admin user

-- Create a system admin user for notifications using existing table structure
-- Username: admin, Password: admin
INSERT INTO admin_users (
    username,
    email,
    password_hash,
    full_name,
    is_active,
    created_at,
    updated_at
)
VALUES (
    'admin',
    'admin@mainloyalty.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'admin'
    'Master Administrator',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    updated_at = NOW(),
    full_name = 'Master Administrator',
    username = 'admin',
    password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    is_active = true;

-- Display the created admin user
SELECT 
    id,
    email,
    username,
    full_name,
    is_active,
    'Admin user created/updated successfully! Username: admin, Password: admin' as message
FROM admin_users 
WHERE email = 'admin@mainloyalty.com';
