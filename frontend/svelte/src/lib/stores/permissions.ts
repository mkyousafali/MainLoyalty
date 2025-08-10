import { writable, derived } from 'svelte/store';
import { getStorageItem, setStorageItem } from '$lib/utils/storage';
import type { UserRole, Permission, AdminFunction, PermissionCategory } from '$lib/types';

// Current user's role and permissions
export const currentUserRole = writable<UserRole | null>(null);
export const userPermissions = writable<Permission[]>([]);

// All available roles and permissions
export const availableRoles = writable<UserRole[]>([]);
export const availablePermissions = writable<Permission[]>([]);

// Admin functions configuration
export const adminFunctions = writable<AdminFunction[]>([]);

// Derived store to check if current user is master admin
export const isMasterAdmin = derived(
  currentUserRole,
  ($currentUserRole) => $currentUserRole?.isMasterAdmin || false
);

// Derived store for allowed admin functions based on user permissions
export const allowedAdminFunctions = derived(
  [adminFunctions, userPermissions],
  ([$adminFunctions, $userPermissions]) => {
    const userPermissionIds = $userPermissions.map(p => p.id);
    
    return $adminFunctions.filter(func => {
      // Core functions are always allowed for admins
      if (func.isCore) return true;
      
      // Check if user has required permissions
      return func.requiredPermissions.every(permission => 
        userPermissionIds.includes(permission)
      );
    });
  }
);

// Default permissions for different categories
export const defaultPermissions: Permission[] = [
  // User Management
  {
    id: 'user_view',
    name: 'View Users',
    description: 'View user list and details',
    category: 'user_management',
    resource: 'users',
    action: 'read',
    isRequired: false
  },
  {
    id: 'user_create',
    name: 'Create Users',
    description: 'Create new user accounts',
    category: 'user_management',
    resource: 'users',
    action: 'create',
    isRequired: false
  },
  {
    id: 'user_edit',
    name: 'Edit Users',
    description: 'Modify user information',
    category: 'user_management',
    resource: 'users',
    action: 'update',
    isRequired: false
  },
  {
    id: 'user_delete',
    name: 'Delete Users',
    description: 'Delete user accounts',
    category: 'user_management',
    resource: 'users',
    action: 'delete',
    isRequired: false
  },
  {
    id: 'role_manage',
    name: 'Manage Roles',
    description: 'Create and modify user roles',
    category: 'user_management',
    resource: 'roles',
    action: 'manage',
    isRequired: false
  },
  
  // Customer Management
  {
    id: 'customer_view',
    name: 'View Customers',
    description: 'View customer list and details',
    category: 'customer_management',
    resource: 'customers',
    action: 'read',
    isRequired: false
  },
  {
    id: 'customer_edit',
    name: 'Edit Customers',
    description: 'Modify customer information',
    category: 'customer_management',
    resource: 'customers',
    action: 'update',
    isRequired: false
  },
  {
    id: 'customer_upload',
    name: 'Upload Customers',
    description: 'Bulk upload customer data',
    category: 'customer_management',
    resource: 'customers',
    action: 'bulk_create',
    isRequired: false
  },
  
  // Analytics
  {
    id: 'analytics_view',
    name: 'View Analytics',
    description: 'Access analytics and reports',
    category: 'analytics',
    resource: 'analytics',
    action: 'read',
    isRequired: false
  },
  {
    id: 'reports_export',
    name: 'Export Reports',
    description: 'Export reports and data',
    category: 'analytics',
    resource: 'reports',
    action: 'export',
    isRequired: false
  },
  
  // Content Management
  {
    id: 'offers_manage',
    name: 'Manage Offers',
    description: 'Create and manage offers',
    category: 'content_management',
    resource: 'offers',
    action: 'manage',
    isRequired: false
  },
  {
    id: 'rewards_manage',
    name: 'Manage Rewards',
    description: 'Create and manage rewards',
    category: 'content_management',
    resource: 'rewards',
    action: 'manage',
    isRequired: false
  },
  {
    id: 'cards_manage',
    name: 'Manage Card Types',
    description: 'Create and manage card types',
    category: 'content_management',
    resource: 'cards',
    action: 'manage',
    isRequired: false
  },
  {
    id: 'terms_manage',
    name: 'Manage Terms & Conditions',
    description: 'Edit terms and conditions',
    category: 'content_management',
    resource: 'terms',
    action: 'manage',
    isRequired: false
  },
  
  // Notifications
  {
    id: 'notifications_send',
    name: 'Send Notifications',
    description: 'Send notifications to customers',
    category: 'notifications',
    resource: 'notifications',
    action: 'create',
    isRequired: false
  },
  {
    id: 'notifications_manage',
    name: 'Manage Notifications',
    description: 'Manage notification center',
    category: 'notifications',
    resource: 'notifications',
    action: 'manage',
    isRequired: false
  },
  
  // System Settings
  {
    id: 'system_settings',
    name: 'System Settings',
    description: 'Access system configuration',
    category: 'system_settings',
    resource: 'system',
    action: 'manage',
    isRequired: false
  },
  {
    id: 'branches_manage',
    name: 'Manage Branches',
    description: 'Manage branch locations',
    category: 'system_settings',
    resource: 'branches',
    action: 'manage',
    isRequired: false
  }
];

// Default admin functions
export const defaultAdminFunctions: AdminFunction[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Main dashboard overview',
    path: '/admin',
    icon: '🏠',
    category: 'analytics',
    requiredPermissions: [],
    isCore: true
  },
  {
    id: 'user_management',
    name: 'User Management',
    description: 'Manage admin users',
    path: '/admin/user-management',
    icon: '👥',
    category: 'user_management',
    requiredPermissions: ['user_view'],
    isCore: false
  },
  {
    id: 'user_roles',
    name: 'Manage User Roles',
    description: 'Manage user roles and permissions',
    path: '/admin/user-roles',
    icon: '🔐',
    category: 'user_management',
    requiredPermissions: ['role_manage'],
    isCore: false
  },
  {
    id: 'customer_management',
    name: 'Customer Management',
    description: 'Manage customers',
    path: '/admin/customer-management',
    icon: '👤',
    category: 'customer_management',
    requiredPermissions: ['customer_view'],
    isCore: false
  },
  {
    id: 'analytics_reports',
    name: 'Analytics & Reports',
    description: 'View analytics and reports',
    path: '/admin/analytics-reports',
    icon: '📊',
    category: 'analytics',
    requiredPermissions: ['analytics_view'],
    isCore: false
  },
  {
    id: 'notification_center',
    name: 'Notification Center',
    description: 'Manage notifications',
    path: '/admin/notification-center',
    icon: '🔔',
    category: 'notifications',
    requiredPermissions: ['notifications_manage'],
    isCore: false
  },
  {
    id: 'terms_management',
    name: 'Terms & Conditions',
    description: 'Manage terms and conditions',
    path: '/admin/terms-management',
    icon: '📋',
    category: 'content_management',
    requiredPermissions: ['terms_manage'],
    isCore: false
  },
  {
    id: 'manage_cards',
    name: 'Manage Card Types',
    description: 'Manage card types',
    path: '/admin/manage-card-types',
    icon: '💳',
    category: 'content_management',
    requiredPermissions: ['cards_manage'],
    isCore: false
  },
  {
    id: 'manage_branches',
    name: 'Manage Branches',
    description: 'Manage branch locations',
    path: '/admin/manage-branches',
    icon: '🏢',
    category: 'system_settings',
    requiredPermissions: ['branches_manage'],
    isCore: false
  }
];

// Default roles
export const defaultRoles: UserRole[] = [
  {
    id: 'master_admin',
    name: 'Master Administrator',
    description: 'Full system access with all permissions',
    isMasterAdmin: true,
    permissions: defaultPermissions,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'General admin access with most permissions',
    isMasterAdmin: false,
    permissions: defaultPermissions.filter(p => 
      !['role_manage', 'user_delete', 'system_settings'].includes(p.id)
    ),
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Limited admin access for daily operations',
    isMasterAdmin: false,
    permissions: defaultPermissions.filter(p => 
      ['customer_view', 'customer_edit', 'analytics_view', 'notifications_send'].includes(p.id)
    ),
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'operator',
    name: 'Operator',
    description: 'Basic access for customer service',
    isMasterAdmin: false,
    permissions: defaultPermissions.filter(p => 
      ['customer_view', 'customer_edit'].includes(p.id)
    ),
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Load permissions and roles
export function loadPermissionsData() {
  const roles = getStorageItem<UserRole[]>('userRoles', defaultRoles);
  const permissions = getStorageItem<Permission[]>('permissions', defaultPermissions);
  const functions = getStorageItem<AdminFunction[]>('adminFunctions', defaultAdminFunctions);
  
  availableRoles.set(roles);
  availablePermissions.set(permissions);
  adminFunctions.set(functions);
  
  // Check if we should set master admin role
  let shouldSetMasterAdmin = isDemoMasterAdmin() || isProductionMasterAdmin();
  
  // Set master admin role if enabled
  if (shouldSetMasterAdmin) {
    const masterAdminRole = roles.find(r => r.isMasterAdmin);
    if (masterAdminRole) {
      setCurrentUserRole(masterAdminRole);
    }
  }
}

// Set current user role and permissions
export function setCurrentUserRole(role: UserRole) {
  currentUserRole.set(role);
  userPermissions.set(role.permissions);
}

// Check if user has specific permission
export function hasPermission(permissionId: string): boolean {
  let result = false;
  const unsubscribe = userPermissions.subscribe(permissions => {
    result = permissions.some(p => p.id === permissionId);
  });
  unsubscribe();
  return result;
}

// Check if user can access admin function
export function canAccessFunction(functionId: string): boolean {
  let result = false;
  const unsubscribe = allowedAdminFunctions.subscribe(functions => {
    result = functions.some(f => f.id === functionId);
  });
  unsubscribe();
  return result;
}

// Save roles to storage
export function saveRoles(roles: UserRole[]) {
  setStorageItem('userRoles', roles);
  availableRoles.set(roles);
}

// Save permissions to storage
export function savePermissions(permissions: Permission[]) {
  setStorageItem('permissions', permissions);
  availablePermissions.set(permissions);
}

// Save admin functions to storage
export function saveAdminFunctions(functions: AdminFunction[]) {
  setStorageItem('adminFunctions', functions);
  adminFunctions.set(functions);
}

// Demo function to set current user as master admin (for testing)
export function setDemoMasterAdmin() {
  const masterAdminRole = defaultRoles.find(r => r.isMasterAdmin);
  if (masterAdminRole) {
    setCurrentUserRole(masterAdminRole);
    setStorageItem('demoMasterAdmin', true);
  }
}

// Production function to set current user as master admin
export function setProductionMasterAdmin() {
  const roles = getStorageItem<UserRole[]>('userRoles', defaultRoles);
  const masterAdminRole = roles.find(r => r.isMasterAdmin);
  if (masterAdminRole) {
    setCurrentUserRole(masterAdminRole);
    setStorageItem('isMasterAdmin', true);
  }
}

// Check if demo master admin is enabled
export function isDemoMasterAdmin(): boolean {
  return getStorageItem<boolean>('demoMasterAdmin', false);
}

// Check if production master admin is enabled
export function isProductionMasterAdmin(): boolean {
  return getStorageItem<boolean>('isMasterAdmin', false);
}

// Role management functions
export function createRole(roleData: Omit<UserRole, 'id'> & { id: string }) {
  availableRoles.update(roles => {
    const newRole: UserRole = {
      ...roleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedRoles = [...roles, newRole];
    setStorageItem('roles', updatedRoles);
    
    return updatedRoles;
  });
}

export function updateRole(roleId: string, updates: Partial<UserRole>) {
  availableRoles.update(roles => {
    const updatedRoles = roles.map((role: UserRole) => 
      role.id === roleId 
        ? { ...role, ...updates, updatedAt: new Date().toISOString() }
        : role
    );
    
    setStorageItem('roles', updatedRoles);
    
    return updatedRoles;
  });
}

export function deleteRole(roleId: string) {
  availableRoles.update(roles => {
    const roleToDelete = roles.find((r: UserRole) => r.id === roleId);
    
    // Prevent deletion of master admin role
    if (roleToDelete?.isMasterAdmin) {
      throw new Error('Cannot delete master admin role');
    }
    
    const updatedRoles = roles.filter((role: UserRole) => role.id !== roleId);
    setStorageItem('roles', updatedRoles);
    
    return updatedRoles;
  });
}

// Demo mode functionality
export const isDemo = writable<boolean>(false);

export function enableDemoMode() {
  isDemo.set(true);
  setDemoMasterAdmin();
}

export function disableDemoMode() {
  isDemo.set(false);
  setStorageItem('demoMasterAdmin', false);
  
  // Reset to default user role
  currentUserRole.set(null);
}
