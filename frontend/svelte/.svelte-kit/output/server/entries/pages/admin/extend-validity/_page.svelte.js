import { P as ensure_array_like, I as attr, K as escape_html, S as attr_style, D as pop, z as push, J as stringify } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let singleCard = "";
  let singleDate = "";
  let bulkDate = "";
  let customers = [];
  let filtered = [];
  let selected = [];
  let search = "";
  let progress = 0;
  let sortBy = "card_number";
  let extendAllDate = "";
  let extendAllProgress = 0;
  {
    filtered = [...customers];
  }
  filtered.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
  const each_array = ensure_array_like(
    // Use the stored function to extend card validity
    // Reload customers to show updated data
    // Clear form
    // Get selected card numbers
    // Use the stored function to extend multiple cards
    // Reload customers to show updated data
    // Clear selections
    // Use the stored function to extend all cards
    // Reload customers to show updated data
    // Clear form
    filtered
  );
  $$payload.out.push(`<div class="p-6 max-w-6xl mx-auto bg-white shadow rounded-xl"><h1 class="text-2xl font-bold text-red-600 mb-6">⏳ Extend Validity</h1> <div class="mb-10 bg-blue-50 p-5 rounded-lg border border-blue-200"><h2 class="text-lg font-semibold text-blue-700 mb-3">📘 Extend Single Card</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"><input type="text" placeholder="Enter card number"${attr("value", singleCard)} class="border px-3 py-2 rounded"/> <input type="date"${attr("value", singleDate)} class="border px-3 py-2 rounded"/> <button class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Extend</button></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="flex justify-between items-center mb-2"><h2 class="text-lg font-semibold text-gray-800">📋 Registered Customers</h2> <input type="text" placeholder="🔍 Search by name or number"${attr("value", search)} class="border px-3 py-2 rounded w-64"/></div> <div class="h-[320px] overflow-y-scroll border border-purple-300 rounded-md shadow-sm mb-6"><table class="w-full text-sm text-left border-collapse min-w-[600px]"><thead class="sticky top-0 bg-purple-100 text-purple-900"><tr><th class="px-3 py-2 border-b border-purple-300">✔️</th><th class="px-3 py-2 border-b border-purple-300 cursor-pointer">Card Number ${escape_html("↑")}</th><th class="px-3 py-2 border-b border-purple-300 cursor-pointer">Name ${escape_html("")}</th><th class="px-3 py-2 border-b border-purple-300 cursor-pointer">Current Expiry ${escape_html("")}</th></tr></thead><tbody><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let c = each_array[$$index];
    $$payload.out.push(`<tr class="bg-purple-50 hover:bg-purple-100 text-purple-900 border-b border-purple-200"><td class="px-3 py-2"><input type="checkbox"${attr("checked", selected.includes(c.id), true)}/></td><td class="px-3 py-2 font-mono">${escape_html(c.card_number)}</td><td class="px-3 py-2">${escape_html(c.name)}</td><td class="px-3 py-2">${escape_html(c.valid_until)}</td></tr>`);
  }
  $$payload.out.push(`<!--]--></tbody></table></div> <div class="bg-yellow-50 p-5 border border-yellow-200 rounded-lg"><h3 class="font-semibold text-yellow-800 mb-2">⚡ Bulk Extend</h3> <div class="flex flex-wrap gap-4 items-center mb-2"><input type="date"${attr("value", bulkDate)} class="border px-3 py-2 rounded"/> <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-300"${attr("disabled", !bulkDate, true)}>Extend Selected (${escape_html(selected.length)})</button></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="w-full bg-gray-200 rounded-full h-3"><div class="bg-green-500 h-3 rounded-full transition-all duration-300"${attr_style(`width: ${stringify(progress)}%`)}></div></div> <p class="text-sm text-gray-600 mt-1">${escape_html(progress)}% ${escape_html(
    "Idle"
  )}</p></div> <div class="mt-8 bg-yellow-50 p-5 border border-yellow-200 rounded-lg"><h3 class="font-semibold text-yellow-800 mb-3">🟡 Extend All Registered Customers</h3> <div class="flex flex-wrap gap-4 items-center mb-3"><input type="date"${attr("value", extendAllDate)} class="border px-3 py-2 rounded"/> <button class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:bg-red-300"${attr("disabled", !extendAllDate, true)}>Extend All</button></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="w-full bg-gray-200 rounded-full h-3"><div class="bg-red-500 h-3 rounded-full transition-all duration-300"${attr_style(`width: ${stringify(extendAllProgress)}%`)}></div></div> <p class="text-sm text-gray-600 mt-1">${escape_html(extendAllProgress)}% ${escape_html(
    "Idle"
  )}</p></div></div>`);
  pop();
}
export {
  _page as default
};
