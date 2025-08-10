import { P as ensure_array_like, S as attr_style, K as escape_html, J as stringify, D as pop, z as push } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let cardTypes = [];
  $$payload.out.push(`<div class="min-h-screen bg-gray-50 p-4 md:p-6"><div class="max-w-7xl mx-auto"><div class="flex justify-between items-center mb-6"><div><h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Manage Card Types</h1> <p class="text-gray-600">Create and manage customer loyalty card types and upgrade paths</p></div> <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"><svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Add Card Type</button></div> `);
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
    const each_array = ensure_array_like(cardTypes);
    $$payload.out.push(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let cardType = each_array[$$index];
      $$payload.out.push(`<div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"><div class="h-20 relative"${attr_style(`background-color: ${stringify(cardType.color)}`)}><div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div> <div class="absolute top-4 left-4"><div class="w-12 h-8 bg-white/30 rounded backdrop-blur-sm flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg></div></div> <div class="absolute top-4 right-4"><div class="flex space-x-2"><button class="p-1.5 bg-white/30 hover:bg-white/50 rounded backdrop-blur-sm transition-colors"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button> <button class="p-1.5 bg-white/30 hover:bg-red-500/70 rounded backdrop-blur-sm transition-colors"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></div></div> <div class="p-6"><div class="flex items-start justify-between mb-4"><div><h3 class="text-lg font-semibold text-gray-900">${escape_html(cardType.name_en)}</h3> `);
      if (cardType.name_ar) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<p class="text-sm text-gray-600">${escape_html(cardType.name_ar)}</p>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${escape_html(cardType.customer_count)} customers</span></div> <div class="space-y-3"><div class="flex items-center justify-between"><span class="text-sm text-gray-600">Point Requirement:</span> <span class="font-medium">${escape_html(cardType.point_limit.toLocaleString())} pts</span></div> `);
      if (cardType.upgrade_to_name) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="flex items-center justify-between"><span class="text-sm text-gray-600">Upgrades to:</span> <span class="text-sm font-medium text-blue-600">${escape_html(cardType.upgrade_to_name)}</span></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`<div class="flex items-center justify-between"><span class="text-sm text-gray-600">Upgrades to:</span> <span class="text-sm text-gray-400">Top tier</span></div>`);
      }
      $$payload.out.push(`<!--]--> <div class="flex items-center justify-between"><span class="text-sm text-gray-600">Color:</span> <div class="flex items-center space-x-2"><div class="w-4 h-4 rounded border border-gray-300"${attr_style(`background-color: ${stringify(cardType.color)}`)}></div> <span class="text-sm font-mono">${escape_html(cardType.color)}</span></div></div></div></div></div>`);
    }
    $$payload.out.push(`<!--]--> `);
    if (cardTypes.length === 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="col-span-full text-center py-12"><svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> <h3 class="text-lg font-medium text-gray-900 mb-2">No card types found</h3> <p class="text-gray-600 mb-4">Get started by creating your first loyalty card type</p> <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">Create Card Type</button></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
export {
  _page as default
};
