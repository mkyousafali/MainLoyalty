import { P as ensure_array_like, T as head, G as attr_class, K as escape_html, I as attr, F as store_get, J as stringify, R as maybe_selected, M as unsubscribe_stores, D as pop, z as push } from "../../../chunks/index.js";
import "../../../chunks/supabase.js";
import { t, l as language } from "../../../chunks/language.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let branches, filteredOffers;
  let offers = [];
  let allBranches = [];
  let searchTerm = "";
  let selectedBranch = "all";
  branches = allBranches.map((b) => b.branch_name);
  filteredOffers = offers.filter((offer) => {
    const matchesBranch = selectedBranch === "all";
    return matchesBranch;
  });
  const each_array = ensure_array_like(branches);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(store_get($$store_subs ??= {}, "$t", t).storeOffers)} - Store Deals</title>`;
  });
  $$payload.out.push(`<div${attr_class("min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 svelte-5xerg1", void 0, {
    "rtl": store_get($$store_subs ??= {}, "$language", language) === "ar"
  })}><header class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white svelte-5xerg1"><div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 svelte-5xerg1"><div class="text-center svelte-5xerg1"><div class="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 p-2 shadow-lg svelte-5xerg1"><span class="text-4xl svelte-5xerg1">🎯</span></div> <h1 class="text-5xl font-bold mb-4 tracking-tight svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).storeOffers)}</h1> <p class="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).discoverDeals)}</p></div> <div class="max-w-4xl mx-auto mt-8 svelte-5xerg1"><div class="flex flex-col sm:flex-row gap-4 svelte-5xerg1"><div class="relative flex-1 svelte-5xerg1"><input type="text"${attr("value", searchTerm)}${attr("placeholder", store_get($$store_subs ??= {}, "$t", t).searchOffers)} class="w-full px-6 py-4 text-lg rounded-2xl bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/25 transition-all svelte-5xerg1"/> <svg${attr_class(`absolute ${stringify(store_get($$store_subs ??= {}, "$language", language) === "ar" ? "left-4" : "right-4")} top-1/2 -translate-y-1/2 w-6 h-6 text-white/70`, "svelte-5xerg1")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" class="svelte-5xerg1"></path></svg></div> <select class="px-6 py-4 text-lg rounded-2xl bg-white/20 backdrop-blur-sm text-white border border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/25 transition-all svelte-5xerg1">`);
  $$payload.select_value = selectedBranch;
  $$payload.out.push(`<option value="all"${maybe_selected($$payload, "all")} class="text-gray-800 svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).allOffers)}</option><option value="all_branches"${maybe_selected($$payload, "all_branches")} class="text-gray-800 svelte-5xerg1">🌐 ${escape_html(store_get($$store_subs ??= {}, "$t", t).allBranches)}</option><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let branch = each_array[$$index];
    $$payload.out.push(`<option${attr("value", branch)}${maybe_selected($$payload, branch)} class="text-gray-800 svelte-5xerg1">🏪 ${escape_html(branch)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div class="flex justify-center items-center gap-8 mt-6 text-center svelte-5xerg1"><div class="text-white/90 svelte-5xerg1"><div class="text-3xl font-bold svelte-5xerg1">${escape_html(filteredOffers.length)}</div> <div class="text-sm svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).availableOffers)}</div></div> <div class="w-px h-8 bg-white/30 svelte-5xerg1"></div> <div class="text-white/90 svelte-5xerg1"><div class="text-3xl font-bold svelte-5xerg1">${escape_html(allBranches.length + 1)}</div> <div class="text-sm svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).locations)}</div></div></div></div></div></header> <main class="max-w-7xl mx-auto px-4 sm:px-6 py-12 svelte-5xerg1">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex flex-col items-center justify-center py-16 svelte-5xerg1"><div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4 svelte-5xerg1"></div> <p class="text-gray-600 text-lg svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).loadingOffers)}</p></div>`);
  }
  $$payload.out.push(`<!--]--></main> <footer class="bg-gray-50 border-t mt-16 svelte-5xerg1"><div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 svelte-5xerg1"><div class="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center svelte-5xerg1"><div class="space-y-3 svelte-5xerg1"><div class="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center svelte-5xerg1"><svg class="w-6 h-6 text-blue-600 svelte-5xerg1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" class="svelte-5xerg1"></path></svg></div> <h3 class="font-semibold text-gray-900 svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).visualOffers)}</h3> <p class="text-sm text-gray-600 svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).visualOffersDesc)}</p></div> <div class="space-y-3 svelte-5xerg1"><div class="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center svelte-5xerg1"><svg class="w-6 h-6 text-green-600 svelte-5xerg1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" class="svelte-5xerg1"></path></svg></div> <h3 class="font-semibold text-gray-900 svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).pdfDownloads)}</h3> <p class="text-sm text-gray-600 svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).pdfDownloadsDesc)}</p></div> <div class="space-y-3 svelte-5xerg1"><div class="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center svelte-5xerg1"><svg class="w-6 h-6 text-purple-600 svelte-5xerg1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" class="svelte-5xerg1"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" class="svelte-5xerg1"></path></svg></div> <h3 class="font-semibold text-gray-900 svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).branchSpecific)}</h3> <p class="text-sm text-gray-600 svelte-5xerg1">${escape_html(store_get($$store_subs ??= {}, "$t", t).branchSpecificDesc)}</p></div></div></div></footer></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
