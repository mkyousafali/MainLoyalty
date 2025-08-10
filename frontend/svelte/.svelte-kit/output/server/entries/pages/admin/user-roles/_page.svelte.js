import { F as store_get, P as ensure_array_like, T as head, K as escape_html, I as attr, G as attr_class, J as stringify, M as unsubscribe_stores, D as pop, z as push } from "../../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/state.svelte.js";
import { a as availableRoles, b as availablePermissions } from "../../../../chunks/permissions.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let allRoles, filteredRoles;
  let selectedRole = null;
  let searchTerm = "";
  let users = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      currentRole: "Admin"
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      currentRole: "Manager"
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      currentRole: "Staff"
    },
    {
      id: "4",
      name: "Alice Brown",
      email: "alice@example.com",
      currentRole: "Viewer"
    },
    {
      id: "5",
      name: "Mike Wilson",
      email: "mike@example.com",
      currentRole: "Operator"
    },
    {
      id: "6",
      name: "Sarah Davis",
      email: "sarah@example.com",
      currentRole: "Support"
    }
  ];
  let availableFunctions = [
    {
      id: "upload-customers",
      name: "Upload Customers",
      category: "customer_management",
      description: "Upload and import customer data"
    },
    {
      id: "upload-transactions",
      name: "Upload Transactions",
      category: "financial",
      description: "Upload and import transaction data"
    },
    {
      id: "customer-management",
      name: "Customer Management",
      category: "customer_management",
      description: "Manage customer profiles and information"
    },
    {
      id: "assign-card-type",
      name: "Assign Card Type",
      category: "customer_management",
      description: "Assign card types to customers"
    },
    {
      id: "extend-validity",
      name: "Extend Validity",
      category: "customer_management",
      description: "Extend card validity periods"
    },
    {
      id: "assign-coupons",
      name: "Assign Coupons",
      category: "content_management",
      description: "Assign coupons to customers"
    },
    {
      id: "manage-card-types",
      name: "Manage Card Types",
      category: "system_settings",
      description: "Create and manage card types"
    },
    {
      id: "manage-branches",
      name: "Manage Branches",
      category: "system_settings",
      description: "Manage branch locations and settings"
    },
    {
      id: "user-management",
      name: "User Management",
      category: "user_management",
      description: "Manage system users and access"
    },
    {
      id: "manage-user-roles",
      name: "Manage User Roles",
      category: "user_management",
      description: "Configure user roles and permissions"
    },
    {
      id: "support-settings",
      name: "Support Settings",
      category: "system_settings",
      description: "Configure customer support settings"
    },
    {
      id: "terms-conditions",
      name: "Terms & Conditions",
      category: "content_management",
      description: "Manage terms and conditions content"
    },
    {
      id: "notification-center",
      name: "Notification Center",
      category: "notifications",
      description: "Manage system notifications"
    },
    {
      id: "export-data",
      name: "Export Data",
      category: "analytics",
      description: "Export system data and reports"
    },
    {
      id: "analytics-reports",
      name: "Analytics Reports",
      category: "analytics",
      description: "View analytics and business reports"
    },
    {
      id: "user-reports",
      name: "User Reports",
      category: "analytics",
      description: "Generate user activity reports"
    },
    {
      id: "password-reset",
      name: "Password Reset",
      category: "user_management",
      description: "Manage password reset functionality"
    }
  ];
  let categories = [
    "customer_management",
    "user_management",
    "content_management",
    "system_settings",
    "analytics",
    "financial",
    "notifications"
  ];
  allRoles = store_get($$store_subs ??= {}, "$availableRoles", availableRoles);
  store_get($$store_subs ??= {}, "$availablePermissions", availablePermissions);
  filteredRoles = allRoles.filter((role) => !role.isMasterAdmin && (role.name.toLowerCase().includes(searchTerm.toLowerCase()) || role.description.toLowerCase().includes(searchTerm.toLowerCase())));
  categories.reduce(
    (acc, category) => {
      acc[category] = availableFunctions.filter((func) => func.category === category);
      return acc;
    },
    {}
  );
  const each_array = ensure_array_like(
    // Check access on mount
    // Load permissions data first
    // For now, allow all admin users to access this page
    // Later you can uncomment this to restrict to master admin only
    // if (!$isMasterAdmin) {
    //   goto('/admin');
    // }
    // Load current permissions for the user
    // Remove all category permissions
    // Add all category permissions
    // Type assertion for category
    // Update local user data (replace with actual API call)
    filteredRoles
  );
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Manage User Roles - Admin Panel</title>`;
  });
  $$payload.out.push(`<div class="user-roles-container svelte-z5khzo"><div class="page-header svelte-z5khzo"><div class="header-content svelte-z5khzo"><h1 class="svelte-z5khzo">Manage User Roles</h1> <p class="svelte-z5khzo">Configure user roles and permissions for complete admin panel access</p> <div class="stats-row svelte-z5khzo"><span class="stat-item svelte-z5khzo"><strong class="svelte-z5khzo">${escape_html(availableFunctions.length)}</strong> Total Functions</span> <span class="stat-item svelte-z5khzo"><strong class="svelte-z5khzo">${escape_html(filteredRoles.length)}</strong> Manageable Roles</span> <span class="stat-item svelte-z5khzo"><strong class="svelte-z5khzo">${escape_html(users.length)}</strong> Users</span></div></div> <div class="header-actions svelte-z5khzo"><button class="btn btn-primary svelte-z5khzo">➕ Create New Role</button> <button class="btn btn-secondary svelte-z5khzo">👤 Assign User Roles</button> <button class="btn btn-outline svelte-z5khzo">📤 Export Roles</button></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="content-grid svelte-z5khzo"><div class="roles-panel svelte-z5khzo"><div class="panel-header svelte-z5khzo"><h2 class="svelte-z5khzo">Manageable Roles (${escape_html(filteredRoles.length)})</h2> <div class="search-box svelte-z5khzo"><input type="text" placeholder="Search roles..."${attr("value", searchTerm)} class="search-input svelte-z5khzo"/> <span class="search-icon svelte-z5khzo">🔍</span></div></div> <div class="roles-list svelte-z5khzo"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let role = each_array[$$index];
    $$payload.out.push(`<div${attr_class(`role-card ${stringify(selectedRole?.id === role.id ? "selected" : "")}`, "svelte-z5khzo")} role="button" tabindex="0"><div class="role-header svelte-z5khzo"><h3 class="svelte-z5khzo">${escape_html(role.name)}</h3></div> <p class="role-description svelte-z5khzo">${escape_html(role.description)}</p> <div class="role-stats svelte-z5khzo"><span class="permission-count svelte-z5khzo">${escape_html(role.permissions.length)} functions</span> <span${attr_class(`status-badge ${stringify(role.isActive ? "active" : "inactive")}`, "svelte-z5khzo")}>${escape_html(role.isActive ? "Active" : "Inactive")}</span></div> <div class="role-actions svelte-z5khzo"><button class="action-btn edit-btn svelte-z5khzo" title="Edit Role">✏️</button> <button class="action-btn delete-btn svelte-z5khzo" title="Delete Role">🗑️</button> <button class="action-btn duplicate-btn svelte-z5khzo" title="Duplicate Role">📋</button></div></div>`);
  }
  $$payload.out.push(`<!--]--> `);
  if (filteredRoles.length === 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="empty-state svelte-z5khzo"><span class="empty-icon svelte-z5khzo">📝</span> <h3 class="svelte-z5khzo">No roles found</h3> <p class="svelte-z5khzo">Create your first role to get started</p></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div> <div class="details-panel svelte-z5khzo">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="no-selection svelte-z5khzo"><div class="no-selection-content svelte-z5khzo"><span class="no-selection-icon svelte-z5khzo">👥</span> <h3 class="svelte-z5khzo">Select a role to view details</h3> <p class="svelte-z5khzo">Choose a role from the list to view its functions and settings.</p> <p class="help-text svelte-z5khzo">Master Administrator role has access to all ${escape_html(availableFunctions.length)} functions automatically.</p></div></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
