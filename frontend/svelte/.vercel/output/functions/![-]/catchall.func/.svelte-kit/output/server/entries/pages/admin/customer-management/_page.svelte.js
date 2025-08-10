import { P as ensure_array_like, I as attr, R as maybe_selected, K as escape_html, S as attr_style, G as attr_class, J as stringify, D as pop, z as push } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let totalPages;
  let customers = [];
  let branches = [];
  let cardTypes = [];
  let searchTerm = "";
  let selectedBranch = "";
  let selectedCardType = "";
  let selectedStatus = "";
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalCustomers = 0;
  totalPages = Math.ceil(totalCustomers / itemsPerPage);
  const each_array = ensure_array_like(branches);
  const each_array_1 = ensure_array_like(cardTypes);
  $$payload.out.push(`<div class="max-w-7xl mx-auto"><div class="mb-8"><h1 class="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1> <p class="text-gray-600">Search, filter, and manage customer accounts, points, and status.</p></div> <div class="bg-white rounded-lg shadow p-6 mb-6"><h2 class="text-lg font-semibold mb-4">Search &amp; Filters</h2> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">Search</label> <input type="text"${attr("value", searchTerm)} placeholder="Mobile, name, or email..." class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Branch</label> <select class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedBranch;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>All Branches</option><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let branch = each_array[$$index];
    $$payload.out.push(`<option${attr("value", branch.id)}${maybe_selected($$payload, branch.id)}>${escape_html(branch.name_en)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Card Type</label> <select class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedCardType;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>All Card Types</option><!--[-->`);
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let cardType = each_array_1[$$index_1];
    $$payload.out.push(`<option${attr("value", cardType.id)}${maybe_selected($$payload, cardType.id)}>${escape_html(cardType.name_en)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Status</label> <select class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedStatus;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>All Statuses</option><option value="active"${maybe_selected($$payload, "active")}>Active</option><option value="inactive"${maybe_selected($$payload, "inactive")}>Inactive</option><option value="blocked"${maybe_selected($$payload, "blocked")}>Blocked</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div></div> <div class="flex gap-4"><button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Apply Filters</button> <button class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">Clear Filters</button></div></div> <div class="bg-white rounded-lg shadow overflow-hidden"><div class="px-6 py-4 border-b border-gray-200"><h2 class="text-lg font-semibold">Customers (${escape_html(totalCustomers)} total)</h2></div> `);
  {
    $$payload.out.push("<!--[!-->");
    if (customers.length === 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="p-8 text-center text-gray-500">No customers found matching your criteria.</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      const each_array_2 = ensure_array_like(customers);
      $$payload.out.push(`<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Mobile ${escape_html("")}</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Name ${escape_html("")}</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Type</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Points ${escape_html("")}</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Joined ${escape_html("↓")}</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let customer = each_array_2[$$index_2];
        $$payload.out.push(`<tr class="hover:bg-gray-50"><td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">${escape_html(customer.customer)}</td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${escape_html(customer.name)}</div> <div class="text-sm text-gray-500">${escape_html(customer.email || "No email")}</div></td><td class="px-6 py-4 whitespace-nowrap"><span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"${attr_style(`background-color: ${stringify(customer.card_types?.color)}20; color: ${stringify(customer.card_types?.color)}`)}>${escape_html(customer.card_types?.name_en || "No Card")}</span></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${escape_html(customer.points)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(customer.branches?.name_en || "No Branch")}</td><td class="px-6 py-4 whitespace-nowrap"><span${attr_class(`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stringify(customer.status === "active" ? "bg-green-100 text-green-800" : customer.status === "blocked" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800")}`)}>${escape_html(customer.status)}</span></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escape_html(new Date(customer.created_at).toLocaleDateString())}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2"><button class="text-blue-600 hover:text-blue-900">Edit</button> <button${attr_class(customer.status === "active" ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900")}>${escape_html(customer.status === "active" ? "Block" : "Activate")}</button></td></tr>`);
      }
      $$payload.out.push(`<!--]--></tbody></table></div> `);
      if (totalPages > 1) {
        $$payload.out.push("<!--[-->");
        const each_array_3 = ensure_array_like(Array(totalPages));
        $$payload.out.push(`<div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"><div class="flex-1 flex justify-between sm:hidden"><button${attr("disabled", currentPage === 1, true)} class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed">Previous</button> <button${attr("disabled", currentPage === totalPages, true)} class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed">Next</button></div> <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"><div><p class="text-sm text-gray-700">Showing <span class="font-medium">${escape_html((currentPage - 1) * itemsPerPage + 1)}</span> to <span class="font-medium">${escape_html(Math.min(currentPage * itemsPerPage, totalCustomers))}</span> of <span class="font-medium">${escape_html(totalCustomers)}</span> results</p></div> <div><nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"><!--[-->`);
        for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
          each_array_3[i];
          $$payload.out.push(`<button${attr_class(`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${stringify(currentPage === i + 1 ? "z-10 bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50")}`)}>${escape_html(i + 1)}</button>`);
        }
        $$payload.out.push(`<!--]--></nav></div></div></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
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
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
export {
  _page as default
};
