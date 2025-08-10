import { K as escape_html, P as ensure_array_like, G as attr_class, J as stringify, D as pop, z as push } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let users = [];
  function getRoleBadgeColor(roleName) {
    switch (roleName?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "staff":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
  $$payload.out.push(`<div class="p-6"><div class="max-w-7xl mx-auto"><div class="mb-8"><div class="flex justify-between items-center"><div><h1 class="text-3xl font-bold text-gray-900 mb-2">User Management</h1> <p class="text-gray-600">Manage admin users, roles, and permissions.</p></div> <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">+ Add User</button></div></div> <div class="bg-white rounded-lg shadow overflow-hidden"><div class="px-6 py-4 border-b border-gray-200"><h2 class="text-lg font-semibold">Users (${escape_html(users.length)})</h2></div> `);
  {
    $$payload.out.push("<!--[!-->");
    if (users.length === 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="p-8 text-center text-gray-500">No users found. Create your first user to get started.</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      const each_array = ensure_array_like(users);
      $$payload.out.push(`<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let user = each_array[$$index];
        $$payload.out.push(`<tr class="hover:bg-gray-50"><td class="px-6 py-4 whitespace-nowrap"><div class="flex items-center"><div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"><span class="text-sm font-medium text-gray-700">${escape_html(user.name.charAt(0).toUpperCase())}</span></div> <div class="ml-4"><div class="text-sm font-medium text-gray-900">${escape_html(user.name)}</div> <div class="text-sm text-gray-500">${escape_html(user.email)}</div></div></div></td><td class="px-6 py-4 whitespace-nowrap"><span${attr_class(`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stringify(getRoleBadgeColor(user.roles?.name))}`)}>${escape_html(user.roles?.name || "No Role")}</span></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(user.branches?.name_en || "No Branch")}</td><td class="px-6 py-4 whitespace-nowrap"><span${attr_class(`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stringify(user.status === "active" ? "bg-green-100 text-green-800" : user.status === "blocked" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800")}`)}>${escape_html(user.status)}</span></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never")}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(new Date(user.created_at).toLocaleDateString())}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2"><button class="text-blue-600 hover:text-blue-900">Edit</button> <button${attr_class(user.status === "active" ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900")}>${escape_html(user.status === "active" ? "Block" : "Activate")}</button> <button class="text-red-600 hover:text-red-900">Delete</button></td></tr>`);
      }
      $$payload.out.push(`<!--]--></tbody></table></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div>`);
  pop();
}
export {
  _page as default
};
