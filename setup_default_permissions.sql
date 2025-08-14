-- Insert default permissions for the loyalty system
INSERT INTO permissions (name, description, module, action) VALUES 

-- Customer Management
('upload_customers', 'Upload and import customer data', 'customer_management', 'upload'),
('manage_customers', 'View and edit customer profiles', 'customer_management', 'manage'),
('view_customers', 'View customer information', 'customer_management', 'view'),
('delete_customers', 'Delete customer records', 'customer_management', 'delete'),
('assign_card_types', 'Assign card types to customers', 'customer_management', 'assign'),
('extend_validity', 'Extend card validity periods', 'customer_management', 'extend'),

-- Transaction Management  
('upload_transactions', 'Upload and import transaction data', 'transaction_management', 'upload'),
('view_transactions', 'View transaction history', 'transaction_management', 'view'),
('manage_transactions', 'Edit and manage transactions', 'transaction_management', 'manage'),
('refund_transactions', 'Process refunds', 'transaction_management', 'refund'),

-- Content Management
('manage_coupons', 'Create and manage coupons', 'content_management', 'manage'),
('assign_coupons', 'Assign coupons to customers', 'content_management', 'assign'),
('manage_offers', 'Create and manage offers', 'content_management', 'manage'),
('manage_gifts', 'Manage special gifts and rewards', 'content_management', 'manage'),

-- User Management
('manage_users', 'Manage admin users', 'user_management', 'manage'),
('create_users', 'Create new admin users', 'user_management', 'create'),
('delete_users', 'Delete admin users', 'user_management', 'delete'),
('assign_roles', 'Assign roles to users', 'user_management', 'assign'),
('reset_passwords', 'Reset user passwords', 'user_management', 'reset'),

-- System Settings
('manage_branches', 'Manage branch locations and settings', 'system_settings', 'manage'),
('manage_card_types', 'Create and manage card types', 'system_settings', 'manage'),
('system_configuration', 'Access system configuration', 'system_settings', 'configure'),

-- Analytics & Reports
('view_analytics', 'View system analytics', 'analytics', 'view'),
('generate_reports', 'Generate and export reports', 'analytics', 'generate'),
('customer_reports', 'Generate customer reports', 'analytics', 'generate'),
('transaction_reports', 'Generate transaction reports', 'analytics', 'generate'),
('user_reports', 'Generate user activity reports', 'analytics', 'generate'),

-- Financial
('view_financial', 'View financial data', 'financial', 'view'),
('manage_points', 'Manage customer points', 'financial', 'manage'),
('process_redemptions', 'Process point redemptions', 'financial', 'process'),

-- Notifications
('send_notifications', 'Send notifications to customers', 'notifications', 'send'),
('manage_templates', 'Manage notification templates', 'notifications', 'manage')

ON CONFLICT (name) DO NOTHING;

-- Create some default role permissions
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id, 
    p.id as permission_id
FROM roles r, permissions p 
WHERE r.name = 'Super Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin gets most permissions (exclude system config and user deletion)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id, 
    p.id as permission_id
FROM roles r, permissions p 
WHERE r.name = 'Admin' 
    AND p.name NOT IN ('system_configuration', 'delete_users')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager gets operational permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id, 
    p.id as permission_id
FROM roles r, permissions p 
WHERE r.name = 'Manager' 
    AND p.name IN (
        'view_customers', 'manage_customers', 'assign_card_types', 'extend_validity',
        'view_transactions', 'manage_transactions',
        'assign_coupons', 'manage_offers',
        'view_analytics', 'generate_reports', 'customer_reports',
        'manage_points', 'process_redemptions',
        'send_notifications'
    )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Staff gets basic operational permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id, 
    p.id as permission_id
FROM roles r, permissions p 
WHERE r.name = 'Staff' 
    AND p.name IN (
        'view_customers', 'view_transactions', 
        'assign_coupons', 'process_redemptions',
        'send_notifications'
    )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Cashier gets minimal permissions for point-of-sale
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id, 
    p.id as permission_id
FROM roles r, permissions p 
WHERE r.name = 'Cashier' 
    AND p.name IN (
        'view_customers', 'view_transactions', 'process_redemptions'
    )
ON CONFLICT (role_id, permission_id) DO NOTHING;
