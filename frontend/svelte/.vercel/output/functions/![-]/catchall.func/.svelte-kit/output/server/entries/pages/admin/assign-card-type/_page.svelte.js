import { P as ensure_array_like, I as attr, R as maybe_selected, K as escape_html, G as attr_class, S as attr_style, J as stringify, D as pop, z as push } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let filteredCustomers;
  let customers = [];
  let cardTypes = [];
  let selectedCardType = "";
  let selectedCustomers = /* @__PURE__ */ new Set();
  let searchTerm = "";
  let singleCardNumber = "";
  function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  }
  function getCardTypeName(cardTypeId) {
    if (!cardTypeId) return "Unassigned";
    return cardTypes.find((ct) => ct.id == cardTypeId)?.name || "Unassigned";
  }
  function getCardTypeColor(cardTypeId) {
    if (!cardTypeId) return "#6b7280";
    return cardTypes.find((ct) => ct.id == cardTypeId)?.color || "#6b7280";
  }
  filteredCustomers = customers.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.card_number.includes(searchTerm) || getCardTypeName(c.card_type_id).toLowerCase().includes(searchTerm.toLowerCase()));
  $$payload.out.push(`<div class="p-6 space-y-6 max-w-7xl mx-auto"><h1 class="text-3xl font-bold text-gray-800 flex items-center gap-2">📌 Card Type Assignment Management</h1> `);
  {
    $$payload.out.push("<!--[!-->");
    const each_array = ensure_array_like(cardTypes);
    const each_array_1 = ensure_array_like(cardTypes);
    const each_array_2 = ensure_array_like(filteredCustomers);
    const each_array_3 = ensure_array_like(cardTypes);
    $$payload.out.push(`<div class="bg-white p-6 rounded-xl shadow-md border border-gray-100"><h2 class="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">🧍 Single Customer Assignment</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"><div class="space-y-2"><label for="cardNumber" class="block text-sm font-medium text-gray-700">Card Number</label> <div class="relative"><input id="cardNumber" placeholder="Enter full card number"${attr("value", singleCardNumber)} class="input w-full pl-10 svelte-15ui3mo" aria-label="Customer card number"/> <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span class="text-gray-400">💳</span></div></div></div> <div class="space-y-2"><label for="cardType" class="block text-sm font-medium text-gray-700">Card Type</label> <select id="cardType" class="select w-full svelte-15ui3mo" aria-label="Select card type">`);
    $$payload.select_value = selectedCardType;
    $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Choose card type...</option><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let ct = each_array[$$index];
      $$payload.out.push(`<option${attr("value", ct.id)}${maybe_selected($$payload, ct.id)}>${escape_html(ct.name)}</option>`);
    }
    $$payload.out.push(`<!--]-->`);
    $$payload.select_value = void 0;
    $$payload.out.push(`</select></div> <button class="btn bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 svelte-15ui3mo"${attr("disabled", !singleCardNumber, true)} aria-label="Assign card type to single customer">✅ Assign</button></div></div> <div class="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-100"><h2 class="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">👥 Bulk Assignment to All Customers</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"><div class="space-y-2"><label for="bulkCardType" class="block text-sm font-medium text-gray-700">Card Type for All Customers</label> <select id="bulkCardType" class="select w-full svelte-15ui3mo" aria-label="Select card type for all customers">`);
    $$payload.select_value = selectedCardType;
    $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Choose card type...</option><!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let ct = each_array_1[$$index_1];
      $$payload.out.push(`<option${attr("value", ct.id)}${maybe_selected($$payload, ct.id)}>${escape_html(ct.name)}</option>`);
    }
    $$payload.out.push(`<!--]-->`);
    $$payload.select_value = void 0;
    $$payload.out.push(`</select></div> <button class="btn bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 svelte-15ui3mo"${attr("disabled", !selectedCardType, true)} aria-label="Assign card type to all customers">🚀 Assign to All</button></div></div> <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100"><h2 class="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">📋 Table-based Customer Selection</h2> <div class="mb-6 flex gap-3"><div class="relative flex-1"><input placeholder="Search by name, card number, or card type..."${attr("value", searchTerm)} class="input w-full pl-10 pr-10 svelte-15ui3mo" aria-label="Search customers"/> <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span class="text-gray-400">🔍</span></div> `);
    {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div></div> <div class="mb-4 flex justify-between items-center"><div class="text-sm text-gray-600">Showing <span class="font-medium">${escape_html(filteredCustomers.length)}</span> of <span class="font-medium">${escape_html(customers.length)}</span> customers</div> `);
    if (selectedCustomers.size > 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">${escape_html(selectedCustomers.size)} customer${escape_html(selectedCustomers.size !== 1 ? "s" : "")} selected</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div class="overflow-x-auto border rounded-lg"><table class="w-full table-auto"><thead class="bg-gray-100"><tr><th class="p-4 text-left"><input type="checkbox"${attr("checked", filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedCustomers.has(c.id)), true)} class="rounded focus:ring-2 focus:ring-purple-500" aria-label="Select all customers"/></th><th class="p-4 text-left font-semibold text-gray-700">👤 Name</th><th class="p-4 text-left font-semibold text-gray-700">💳 Card Number</th><th class="p-4 text-left font-semibold text-gray-700">🏷️ Card Type</th><th class="p-4 text-left font-semibold text-gray-700">📅 Expiry Date</th></tr></thead><tbody><!--[-->`);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let c = each_array_2[$$index_2];
      $$payload.out.push(`<tr${attr_class("border-t hover:bg-gray-100 transition-colors duration-150", void 0, {
        "bg-purple-50": selectedCustomers.has(c.id),
        "border-purple-200": selectedCustomers.has(c.id)
      })}><td class="p-4"><input type="checkbox"${attr("checked", selectedCustomers.has(c.id), true)} class="rounded focus:ring-2 focus:ring-purple-500"${attr("aria-label", `Select customer ${stringify(c.name)}`)}/></td><td class="p-4 font-medium text-gray-900">${escape_html(c.name)}</td><td class="p-4 font-mono text-gray-600">${escape_html(c.card_number)}</td><td class="p-4"><span class="px-3 py-1 rounded-full text-sm font-semibold text-white flex items-center gap-1 inline-flex"${attr_style(`background-color: ${stringify(getCardTypeColor(c.card_type_id))}`)}>`);
      if (getCardTypeName(c.card_type_id).toLowerCase().includes("premium")) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`👑`);
      } else {
        $$payload.out.push("<!--[!-->");
        if (getCardTypeName(c.card_type_id).toLowerCase().includes("gold")) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`⭐`);
        } else {
          $$payload.out.push("<!--[!-->");
          if (getCardTypeName(c.card_type_id).toLowerCase().includes("silver")) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`🥈`);
          } else {
            $$payload.out.push("<!--[!-->");
            $$payload.out.push(`🏷️`);
          }
          $$payload.out.push(`<!--]-->`);
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]--> ${escape_html(getCardTypeName(c.card_type_id))}</span></td><td class="p-4 text-gray-600">${escape_html(formatDate(c.expiry_date))}</td></tr>`);
    }
    $$payload.out.push(`<!--]--></tbody></table> `);
    if (filteredCustomers.length === 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="p-8 text-center text-gray-500"><div class="text-4xl mb-2">🔍</div> <p class="text-lg font-medium">No customers found</p> <p class="text-sm">Try adjusting your search criteria</p></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200"><h3 class="text-sm font-medium text-gray-700 mb-3">Assign Card Type to Selected Customers</h3> <div class="flex flex-wrap gap-3 items-end"><div class="flex-1 min-w-[200px] space-y-2"><label for="bulkSelectCardType" class="block text-sm font-medium text-gray-700">Card Type</label> <select id="bulkSelectCardType" class="select w-full svelte-15ui3mo" aria-label="Select card type for selected customers">`);
    $$payload.select_value = selectedCardType;
    $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Choose card type...</option><!--[-->`);
    for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
      let ct = each_array_3[$$index_3];
      $$payload.out.push(`<option${attr("value", ct.id)}${maybe_selected($$payload, ct.id)}>${escape_html(ct.name)}</option>`);
    }
    $$payload.out.push(`<!--]-->`);
    $$payload.select_value = void 0;
    $$payload.out.push(`</select></div> <button class="btn bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2 svelte-15ui3mo"${attr("disabled", selectedCustomers.size === 0 || !selectedCardType, true)} aria-label="Assign card type to selected customers">📋 Assign to Selected (${escape_html(selectedCustomers.size)})</button></div></div></div> `);
    {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
export {
  _page as default
};
