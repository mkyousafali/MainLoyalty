import { F as store_get, T as head, P as ensure_array_like, I as attr, R as maybe_selected, K as escape_html, M as unsubscribe_stores, D as pop, z as push } from "../../../../../chunks/index.js";
import { p as page } from "../../../../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/state.svelte.js";
import "../../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let title = "";
  let description = "";
  let selectedBranchId = "";
  let discountPercentage = 0;
  let discountAmount = 0;
  let minimumPurchase = 0;
  let validFrom = "";
  let validUntil = "";
  let termsConditions = "";
  let maxRedemptions = 0;
  let isActive = true;
  let branches = [];
  let saving = false;
  store_get($$store_subs ??= {}, "$page", page).params.id;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Edit Offer - Admin Panel</title>`;
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-50 py-8"><div class="max-w-4xl mx-auto px-4"><div class="mb-8"><div class="flex items-center space-x-4"><button class="text-gray-600 hover:text-gray-800 transition-colors">← Back to Offers Management</button></div> <h1 class="text-3xl font-bold text-gray-900 mt-4">Edit Offer</h1> <p class="text-gray-600 mt-2">Update the offer details and settings</p></div> `);
  {
    $$payload.out.push("<!--[!-->");
    const each_array = ensure_array_like(branches);
    $$payload.out.push(`<form class="space-y-8"><div class="bg-white rounded-xl shadow-sm p-6"><h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center"><span class="text-blue-600 mr-2">📝</span> Basic Information</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label for="title" class="block text-sm font-medium text-gray-700 mb-2">Offer Title *</label> <input type="text" id="title"${attr("value", title)} required placeholder="e.g., Summer Sale - 25% Off" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div><label for="branch" class="block text-sm font-medium text-gray-700 mb-2">Target Branch</label> <select id="branch" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
    $$payload.select_value = selectedBranchId;
    $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>All Branches</option><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let branch = each_array[$$index];
      $$payload.out.push(`<option${attr("value", branch.branch_id)}${maybe_selected($$payload, branch.branch_id)}>${escape_html(branch.branch_name)}</option>`);
    }
    $$payload.out.push(`<!--]-->`);
    $$payload.select_value = void 0;
    $$payload.out.push(`</select></div></div> <div class="mt-6"><label for="description" class="block text-sm font-medium text-gray-700 mb-2">Description</label> <textarea id="description" rows="3" placeholder="Describe the offer details..." class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
    const $$body = escape_html(description);
    if ($$body) {
      $$payload.out.push(`${$$body}`);
    }
    $$payload.out.push(`</textarea></div></div> <div class="bg-white rounded-xl shadow-sm p-6"><h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center"><span class="text-green-600 mr-2">💰</span> Discount Settings</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-6"><div><label for="discountPercentage" class="block text-sm font-medium text-gray-700 mb-2">Discount Percentage</label> <div class="relative"><input type="number" id="discountPercentage"${attr("value", discountPercentage)} min="0" max="100" step="0.01" placeholder="25" class="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/> <span class="absolute right-3 top-3 text-gray-500">%</span></div></div> <div><label for="discountAmount" class="block text-sm font-medium text-gray-700 mb-2">Fixed Discount Amount</label> <div class="relative"><input type="number" id="discountAmount"${attr("value", discountAmount)} min="0" step="0.01" placeholder="50" class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/> <span class="absolute right-3 top-3 text-gray-500">SAR</span></div></div> <div><label for="minimumPurchase" class="block text-sm font-medium text-gray-700 mb-2">Minimum Purchase</label> <div class="relative"><input type="number" id="minimumPurchase"${attr("value", minimumPurchase)} min="0" step="0.01" placeholder="100" class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/> <span class="absolute right-3 top-3 text-gray-500">SAR</span></div></div></div></div> <div class="bg-white rounded-xl shadow-sm p-6"><h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center"><span class="text-purple-600 mr-2">📅</span> Validity Period</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label for="validFrom" class="block text-sm font-medium text-gray-700 mb-2">Valid From</label> <input type="date" id="validFrom"${attr("value", validFrom)} class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div><label for="validUntil" class="block text-sm font-medium text-gray-700 mb-2">Valid Until *</label> <input type="date" id="validUntil"${attr("value", validUntil)} required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div></div></div> <div class="bg-white rounded-xl shadow-sm p-6"><h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center"><span class="text-orange-600 mr-2">📎</span> Visual Content</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-8"><div><label class="block text-sm font-medium text-gray-700 mb-3">Offer Image (PNG, JPG - Max 5MB)</label> `);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"><div class="text-gray-400 mb-2">📷</div> <p class="text-sm text-gray-600 mb-4">Upload an image for your offer</p></div>`);
    }
    $$payload.out.push(`<!--]--> <input type="file" accept="image/*" class="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-3">Offer Details PDF (Max 10MB)</label> `);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"><div class="text-gray-400 mb-2">📄</div> <p class="text-sm text-gray-600 mb-4">Upload a PDF with offer details</p></div>`);
    }
    $$payload.out.push(`<!--]--> <input type="file" accept=".pdf" class="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/></div></div></div> <div class="bg-white rounded-xl shadow-sm p-6"><h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center"><span class="text-gray-600 mr-2">⚙️</span> Additional Settings</h2> <div class="space-y-6"><div><label for="maxRedemptions" class="block text-sm font-medium text-gray-700 mb-2">Maximum Redemptions (Optional)</label> <input type="number" id="maxRedemptions"${attr("value", maxRedemptions)} min="0" placeholder="Leave empty for unlimited" class="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div><label for="termsConditions" class="block text-sm font-medium text-gray-700 mb-2">Terms &amp; Conditions</label> <textarea id="termsConditions" rows="4" placeholder="Enter terms and conditions for this offer..." class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
    const $$body_1 = escape_html(termsConditions);
    if ($$body_1) {
      $$payload.out.push(`${$$body_1}`);
    }
    $$payload.out.push(`</textarea></div> <div class="flex items-center"><input type="checkbox" id="isActive"${attr("checked", isActive, true)} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"/> <label for="isActive" class="ml-2 text-sm font-medium text-gray-700">Offer is active and visible to customers</label></div></div></div> <div class="flex items-center justify-between pt-6"><button type="button" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button> <button type="submit"${attr("disabled", saving, true)} class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2">`);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<span>Update Offer</span>`);
    }
    $$payload.out.push(`<!--]--></button></div></form>`);
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
