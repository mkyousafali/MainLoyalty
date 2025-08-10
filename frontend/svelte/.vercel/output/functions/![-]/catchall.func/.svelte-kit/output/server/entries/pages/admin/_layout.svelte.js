import { P as ensure_array_like, I as attr, G as attr_class, K as escape_html, J as stringify, F as store_get, Q as slot, M as unsubscribe_stores, D as pop, z as push } from "../../../chunks/index.js";
import { p as page } from "../../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/state.svelte.js";
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  const dashboardItem = {
    path: "/admin",
    label: "Dashboard",
    icon: "🏠",
    description: "Main overview panel"
  };
  const categories = {
    dataManagement: {
      title: "Data Management",
      icon: "📊",
      buttons: [
        {
          path: "/admin/upload-customers",
          label: "Upload Customers",
          icon: "📥",
          description: "Import customer data"
        },
        {
          path: "/admin/upload-transactions",
          label: "Upload Transactions",
          icon: "📊",
          description: "Import transaction data"
        }
      ]
    },
    customerOperations: {
      title: "Customer Operations",
      icon: "👤",
      buttons: [
        {
          path: "/admin/customer-management",
          label: "Customer Management",
          icon: "👤",
          description: "Manage customer profiles"
        },
        {
          path: "/admin/assign-card-type",
          label: "Assign Card Type",
          icon: "🏷️",
          description: "Assign card types to customers"
        },
        {
          path: "/admin/extend-validity",
          label: "Extend Validity",
          icon: "⏰",
          description: "Extend card validity periods"
        }
      ]
    },
    loyaltyManagement: {
      title: "Loyalty Management",
      icon: "🎁",
      buttons: [
        {
          path: "/admin/assign-coupons",
          label: "Assign Coupons",
          icon: "🎯",
          description: "Assign coupons to customers"
        },
        {
          path: "/admin/manage-card-types",
          label: "Manage Card Types",
          icon: "💳",
          description: "Configure card type settings"
        },
        {
          path: "/admin/manage-branches",
          label: "Manage Branches",
          icon: "🏢",
          description: "Branch management"
        }
      ]
    },
    systemManagement: {
      title: "System Management",
      icon: "⚙️",
      buttons: [
        {
          path: "/admin/user-management",
          label: "User Management",
          icon: "👥",
          description: "Manage admin users"
        },
        {
          path: "/admin/user-roles",
          label: "User Roles",
          icon: "🔐",
          description: "Manage user roles and permissions"
        },
        {
          path: "/admin/support-settings",
          label: "Support Settings",
          icon: "⚙️",
          description: "Configure support options"
        },
        {
          path: "/admin/terms-management",
          label: "Terms & Conditions",
          icon: "📋",
          description: "Edit Terms & Conditions"
        },
        {
          path: "/admin/notification-center",
          label: "Notification Center",
          icon: "🔔",
          description: "Manage notifications"
        },
        {
          path: "/admin/export-data",
          label: "Export Data",
          icon: "📤",
          description: "Export system data"
        }
      ]
    },
    reportsAnalytics: {
      title: "Reports & Analytics",
      icon: "📈",
      buttons: [
        {
          path: "/admin/analytics-reports",
          label: "Analytics Reports",
          icon: "📈",
          description: "View system analytics"
        },
        {
          path: "/admin/user-reports",
          label: "User Reports",
          icon: "📋",
          description: "User activity reports"
        },
        {
          path: "/admin/analytics",
          label: "Analytics",
          icon: "📊",
          description: "Analytics dashboard"
        }
      ]
    },
    systemTools: {
      title: "System Tools",
      icon: "🔧",
      buttons: [
        {
          path: "/admin/password-reset",
          label: "Password Reset",
          icon: "🔑",
          description: "Password reset management"
        },
        {
          path: "/admin/clear-transactions",
          label: "Clear Transactions",
          icon: "🗑️",
          description: "Clear transaction data"
        },
        {
          path: "/admin/database-test",
          label: "Database Test",
          icon: "🔧",
          description: "Test database connections"
        }
      ]
    },
    adminTools: {
      title: "Admin Tools",
      icon: "👑",
      buttons: [
        {
          path: "/admin/create-offer",
          label: "Create Offer",
          icon: "➕",
          description: "Create new promotional offers"
        },
        {
          path: "/admin/offers-management",
          label: "Offers Management",
          icon: "📋",
          description: "Manage all store offers"
        },
        {
          path: "/admin/set-master-admin",
          label: "Set Master Admin",
          icon: "👑",
          description: "Configure master admin settings"
        }
      ]
    }
  };
  let activeCategory = null;
  const each_array = ensure_array_like(Object.entries(categories));
  $$payload.out.push(`<div class="layout-container svelte-1ftvwc7"><aside class="sidebar svelte-1ftvwc7"><div class="sidebar-header svelte-1ftvwc7"><div class="logo-container-simple svelte-1ftvwc7"><img src="/logo.png" alt="Urban Market Logo" class="logo-image-simple svelte-1ftvwc7"/></div></div> <nav class="sidebar-nav svelte-1ftvwc7"><a${attr("href", dashboardItem.path)}${attr_class(`nav-item dashboard ${stringify(store_get($$store_subs ??= {}, "$page", page).url.pathname === dashboardItem.path ? "active" : "")}`, "svelte-1ftvwc7")}${attr("title", dashboardItem.description)}><span class="nav-icon svelte-1ftvwc7">${escape_html(dashboardItem.icon)}</span> <span class="nav-label svelte-1ftvwc7">${escape_html(dashboardItem.label)}</span></a> <!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let [categoryKey, category] = each_array[$$index];
    $$payload.out.push(`<button${attr_class(`category-item ${stringify(activeCategory === categoryKey ? "active" : "")}`, "svelte-1ftvwc7")}${attr("title", `Click to expand ${stringify(category.title)}`)}><span class="nav-icon svelte-1ftvwc7">${escape_html(category.icon)}</span> <span class="nav-label svelte-1ftvwc7">${escape_html(category.title)}</span> <span${attr_class(`expand-icon ${stringify(activeCategory === categoryKey ? "expanded" : "")}`, "svelte-1ftvwc7")}>▶</span></button>`);
  }
  $$payload.out.push(`<!--]--></nav> <div class="sidebar-footer svelte-1ftvwc7"><button class="logout-button svelte-1ftvwc7" title="Logout"><span>🚪</span> <span>Logout</span></button></div></aside> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <main${attr_class(`main-content ${stringify("")}`, "svelte-1ftvwc7")} role="main" aria-label="Main content"><!---->`);
  slot($$payload, $$props, "default", {});
  $$payload.out.push(`<!----></main></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
