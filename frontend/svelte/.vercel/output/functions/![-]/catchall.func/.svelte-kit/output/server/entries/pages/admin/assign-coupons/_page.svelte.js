import { P as ensure_array_like, R as maybe_selected, I as attr, K as escape_html, G as attr_class, J as stringify, D as pop, z as push } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let filteredCustomers, validCoupons;
  let selectedCoupon = "";
  let assignmentType = "individual";
  let selectedCustomers = [];
  let searchQuery = "";
  let availableCoupons = [];
  let allCustomers = [];
  filteredCustomers = allCustomers.filter((customer) => customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || customer.mobile.includes(searchQuery) || customer.id.toLowerCase().includes(searchQuery.toLowerCase()));
  validCoupons = availableCoupons.filter((coupon) => new Date(coupon.expiresAt) > /* @__PURE__ */ new Date());
  const each_array = ensure_array_like(validCoupons);
  $$payload.out.push(`<div class="min-h-screen bg-gray-50 p-4 md:p-6"><div class="max-w-7xl mx-auto"><div class="mb-6"><h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Assign Coupons</h1> <p class="text-gray-600">Assign coupons to individual customers, bulk selection, or all customers</p></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-1"><div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center"><span class="text-blue-500 mr-2">🎟️</span> Select Coupon</h2> <div class="space-y-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">Available Coupons</label> <select class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedCoupon;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Select a coupon...</option><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let coupon = each_array[$$index];
    $$payload.out.push(`<option${attr("value", coupon.id)}${maybe_selected($$payload, coupon.id)}>${escape_html(coupon.code)} - ${escape_html(coupon.description)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div><label class="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label> <div class="space-y-2"><label class="flex items-center"><input type="radio"${attr("checked", assignmentType === "individual", true)} value="individual" class="mr-2"/> <span class="text-sm">Individual Selection</span></label> <label class="flex items-center"><input type="radio"${attr("checked", assignmentType === "bulk", true)} value="bulk" class="mr-2"/> <span class="text-sm">Bulk Selection</span></label> <label class="flex items-center"><input type="radio"${attr("checked", assignmentType === "all", true)} value="all" class="mr-2"/> <span class="text-sm">All Customers</span></label></div></div></div></div></div> <div class="lg:col-span-2">`);
  {
    $$payload.out.push("<!--[-->");
    const each_array_1 = ensure_array_like(filteredCustomers);
    $$payload.out.push(`<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"><h2 class="text-lg font-semibold text-gray-900 flex items-center mb-2 sm:mb-0"><span class="text-green-500 mr-2">👥</span> Select Customers</h2> <div class="text-sm text-gray-500">${escape_html(selectedCustomers.length)} of ${escape_html(filteredCustomers.length)} selected</div></div> <div class="flex flex-col sm:flex-row gap-3 mb-4"><div class="flex-1"><input type="text"${attr("value", searchQuery)} placeholder="Search by name, mobile, or customer ID..." class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div class="flex gap-2"><button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap">Select All</button> <button class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm whitespace-nowrap">Clear</button></div></div> <div class="overflow-x-auto"><div class="max-h-96 overflow-y-auto"><table class="w-full text-sm"><thead class="bg-gray-50 sticky top-0"><tr><th class="px-4 py-3 text-left"><input type="checkbox"${attr("checked", selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0, true)} class="rounded"/></th><th class="px-4 py-3 text-left font-medium text-gray-700">Customer ID</th><th class="px-4 py-3 text-left font-medium text-gray-700">Name</th><th class="px-4 py-3 text-left font-medium text-gray-700">Mobile</th><th class="px-4 py-3 text-left font-medium text-gray-700">Card Type</th><th class="px-4 py-3 text-left font-medium text-gray-700">Points</th></tr></thead><tbody class="divide-y divide-gray-200"><!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let customer = each_array_1[$$index_1];
      $$payload.out.push(`<tr class="hover:bg-gray-50"><td class="px-4 py-3"><input type="checkbox"${attr("checked", selectedCustomers.includes(customer.id), true)} class="rounded"/></td><td class="px-4 py-3 font-mono text-xs">${escape_html(customer.id)}</td><td class="px-4 py-3 font-medium">${escape_html(customer.name)}</td><td class="px-4 py-3 font-mono">${escape_html(customer.mobile)}</td><td class="px-4 py-3"><span${attr_class(`px-2 py-1 rounded-full text-xs font-medium ${stringify(customer.cardType === "Gold" ? "bg-yellow-100 text-yellow-800" : customer.cardType === "Silver" ? "bg-gray-100 text-gray-800" : "bg-orange-100 text-orange-800")}`)}>${escape_html(customer.cardType)}</span></td><td class="px-4 py-3 text-gray-600">${escape_html(customer.points.toLocaleString())}</td></tr>`);
    }
    $$payload.out.push(`<!--]--></tbody></table></div></div> `);
    if (filteredCustomers.length === 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="text-center py-8 text-gray-500"><span class="text-4xl mb-2 block">🔍</span> No customers found matching your search</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="mt-6 flex justify-center"><button${attr("disabled", !selectedCoupon, true)} class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 text-lg font-medium">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<span class="text-xl">🎯</span> Assign Coupon `);
    {
      $$payload.out.push("<!--[!-->");
      if (selectedCustomers.length > 0) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`to ${escape_html(selectedCustomers.length)} Customer${escape_html(selectedCustomers.length > 1 ? "s" : "")}`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></button></div></div></div>`);
  pop();
}
export {
  _page as default
};
