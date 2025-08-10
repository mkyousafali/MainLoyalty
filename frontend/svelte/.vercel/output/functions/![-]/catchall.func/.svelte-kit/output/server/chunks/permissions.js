import { d as derived, w as writable } from "./index2.js";
const currentUserRole = writable(null);
const userPermissions = writable([]);
const availableRoles = writable([]);
const availablePermissions = writable([]);
const adminFunctions = writable([]);
derived(
  currentUserRole,
  ($currentUserRole) => $currentUserRole?.isMasterAdmin || false
);
derived(
  [adminFunctions, userPermissions],
  ([$adminFunctions, $userPermissions]) => {
    const userPermissionIds = $userPermissions.map((p) => p.id);
    return $adminFunctions.filter((func) => {
      if (func.isCore) return true;
      return func.requiredPermissions.every(
        (permission) => userPermissionIds.includes(permission)
      );
    });
  }
);
const defaultPermissions = [
  // User Management
  {
    id: "user_view",
    name: "View Users",
    description: "View user list and details",
    category: "user_management",
    resource: "users",
    action: "read",
    isRequired: false
  },
  {
    id: "user_create",
    name: "Create Users",
    description: "Create new user accounts",
    category: "user_management",
    resource: "users",
    action: "create",
    isRequired: false
  },
  {
    id: "user_edit",
    name: "Edit Users",
    description: "Modify user information",
    category: "user_management",
    resource: "users",
    action: "update",
    isRequired: false
  },
  {
    id: "user_delete",
    name: "Delete Users",
    description: "Delete user accounts",
    category: "user_management",
    resource: "users",
    action: "delete",
    isRequired: false
  },
  {
    id: "role_manage",
    name: "Manage Roles",
    description: "Create and modify user roles",
    category: "user_management",
    resource: "roles",
    action: "manage",
    isRequired: false
  },
  // Customer Management
  {
    id: "customer_view",
    name: "View Customers",
    description: "View customer list and details",
    category: "customer_management",
    resource: "customers",
    action: "read",
    isRequired: false
  },
  {
    id: "customer_edit",
    name: "Edit Customers",
    description: "Modify customer information",
    category: "customer_management",
    resource: "customers",
    action: "update",
    isRequired: false
  },
  {
    id: "customer_upload",
    name: "Upload Customers",
    description: "Bulk upload customer data",
    category: "customer_management",
    resource: "customers",
    action: "bulk_create",
    isRequired: false
  },
  // Analytics
  {
    id: "analytics_view",
    name: "View Analytics",
    description: "Access analytics and reports",
    category: "analytics",
    resource: "analytics",
    action: "read",
    isRequired: false
  },
  {
    id: "reports_export",
    name: "Export Reports",
    description: "Export reports and data",
    category: "analytics",
    resource: "reports",
    action: "export",
    isRequired: false
  },
  // Content Management
  {
    id: "offers_manage",
    name: "Manage Offers",
    description: "Create and manage offers",
    category: "content_management",
    resource: "offers",
    action: "manage",
    isRequired: false
  },
  {
    id: "rewards_manage",
    name: "Manage Rewards",
    description: "Create and manage rewards",
    category: "content_management",
    resource: "rewards",
    action: "manage",
    isRequired: false
  },
  {
    id: "cards_manage",
    name: "Manage Card Types",
    description: "Create and manage card types",
    category: "content_management",
    resource: "cards",
    action: "manage",
    isRequired: false
  },
  {
    id: "terms_manage",
    name: "Manage Terms & Conditions",
    description: "Edit terms and conditions",
    category: "content_management",
    resource: "terms",
    action: "manage",
    isRequired: false
  },
  // Notifications
  {
    id: "notifications_send",
    name: "Send Notifications",
    description: "Send notifications to customers",
    category: "notifications",
    resource: "notifications",
    action: "create",
    isRequired: false
  },
  {
    id: "notifications_manage",
    name: "Manage Notifications",
    description: "Manage notification center",
    category: "notifications",
    resource: "notifications",
    action: "manage",
    isRequired: false
  },
  // System Settings
  {
    id: "system_settings",
    name: "System Settings",
    description: "Access system configuration",
    category: "system_settings",
    resource: "system",
    action: "manage",
    isRequired: false
  },
  {
    id: "branches_manage",
    name: "Manage Branches",
    description: "Manage branch locations",
    category: "system_settings",
    resource: "branches",
    action: "manage",
    isRequired: false
  }
];
[
  {
    id: "master_admin",
    name: "Master Administrator",
    description: "Full system access with all permissions",
    isMasterAdmin: true,
    permissions: defaultPermissions,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "admin",
    name: "Administrator",
    description: "General admin access with most permissions",
    isMasterAdmin: false,
    permissions: defaultPermissions.filter(
      (p) => !["role_manage", "user_delete", "system_settings"].includes(p.id)
    ),
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "manager",
    name: "Manager",
    description: "Limited admin access for daily operations",
    isMasterAdmin: false,
    permissions: defaultPermissions.filter(
      (p) => ["customer_view", "customer_edit", "analytics_view", "notifications_send"].includes(p.id)
    ),
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "operator",
    name: "Operator",
    description: "Basic access for customer service",
    isMasterAdmin: false,
    permissions: defaultPermissions.filter(
      (p) => ["customer_view", "customer_edit"].includes(p.id)
    ),
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
export {
  availableRoles as a,
  availablePermissions as b
};
