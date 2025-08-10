import { G as attr_class, K as escape_html, F as store_get, P as ensure_array_like, I as attr, M as unsubscribe_stores, D as pop, z as push, J as stringify } from "../../../chunks/index.js";
import "../../../chunks/supabase.js";
import "../../../chunks/globalSettings.js";
import { l as language, t } from "../../../chunks/language.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let branches = [];
  let selectedBranch = null;
  $$payload.out.push(`<div${attr_class("min-h-screen bg-gray-100 py-10 px-4 font-[Montserrat] svelte-pbcxxe", void 0, {
    "rtl": store_get($$store_subs ??= {}, "$language", language) === "ar"
  })}><div class="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6"><div class="text-center mb-8"><div class="logo-container svelte-pbcxxe"><img src="/logo.png" alt="Urban Market Logo" class="logo-image svelte-pbcxxe"/></div></div> <div class="text-center mb-10 p-6 bg-green-50 rounded-xl border border-green-200"><h2 class="text-lg font-semibold text-gray-800 mb-3">${escape_html(store_get($$store_subs ??= {}, "$t", t).needHelp)}</h2> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="inline-block bg-gray-400 text-white px-8 py-4 rounded-xl shadow-lg font-semibold text-lg">⏳ ${escape_html(store_get($$store_subs ??= {}, "$t", t).loading)}</div>`);
  }
  $$payload.out.push(`<!--]--></div> `);
  if (branches.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(branches);
    $$payload.out.push(`<div class="mb-8"><h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3 svelte-pbcxxe"><span class="text-3xl">📍</span> <span>${escape_html(store_get($$store_subs ??= {}, "$t", t).branchContactInfo)}</span></h2> <div class="space-y-4"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let branch = each_array[$$index];
      $$payload.out.push(`<div class="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all bg-white group"><button class="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between transition-colors svelte-pbcxxe"><div class="flex items-center gap-3 svelte-pbcxxe"><span class="text-2xl">🏬</span> <div><h3 class="font-bold text-xl text-gray-900 mb-1">${escape_html(branch.name || branch.name_ar || store_get($$store_subs ??= {}, "$t", t).unnamedBranch)}</h3> <p class="text-sm text-gray-600 flex items-center gap-2 svelte-pbcxxe"><span class="text-red-500">📍</span> <span>${escape_html(branch.address || store_get($$store_subs ??= {}, "$t", t).locationNotSpecified)}</span></p></div></div> <div class="flex items-center gap-3 svelte-pbcxxe">`);
      if (selectedBranch === branch) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">${escape_html(store_get($$store_subs ??= {}, "$t", t).open)}</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> <div class="bg-gray-100 group-hover:bg-blue-100 p-2 rounded-full transition-all duration-300"><span${attr_class(`text-2xl transition-transform duration-300 ${stringify(selectedBranch === branch ? "rotate-90 text-blue-600" : "text-gray-500")}`)}>${escape_html(store_get($$store_subs ??= {}, "$language", language) === "ar" ? "⬅️" : "➡️")}</span></div></div></button> `);
      if (selectedBranch === branch) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50"><div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8"><div class="space-y-4"><h4 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2 svelte-pbcxxe"><span class="text-xl">🔗</span> <span>${escape_html(store_get($$store_subs ??= {}, "$t", t).quickContact)}</span></h4> `);
        if (branch.website || branch.website_url) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<a${attr("href", branch.website || branch.website_url)} target="_blank" class="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg svelte-pbcxxe"><div class="bg-white bg-opacity-20 p-2 rounded-lg"><span class="text-2xl">🌐</span></div> <div class="flex-1"><p class="font-semibold text-lg">${escape_html(store_get($$store_subs ??= {}, "$t", t).visitWebsite)}</p> <p class="text-blue-100 text-sm">${escape_html((branch.website || branch.website_url).replace(/^https?:\/\//, ""))}</p></div> <span class="text-xl opacity-75">${escape_html(store_get($$store_subs ??= {}, "$language", language) === "ar" ? "↙️" : "↗️")}</span></a>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--> `);
        if (branch.contact_phone || branch.phone) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<a${attr("href", `https://wa.me/${(branch.contact_phone || branch.phone).replace(/[^\d]/g, "")}`)} target="_blank" class="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors svelte-pbcxxe"><span class="text-xl">📞</span> <div><p class="font-medium">${escape_html(store_get($$store_subs ??= {}, "$t", t).whatsappContact)}</p> <p class="text-sm opacity-75">${escape_html(branch.contact_phone || branch.phone)}</p></div> <span class="ml-auto text-xs svelte-pbcxxe">${escape_html(store_get($$store_subs ??= {}, "$language", language) === "ar" ? "↙️" : "↗️")}</span></a>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--> `);
        if (branch.instagram || branch.instagram_url) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<a${attr("href", branch.instagram || branch.instagram_url)} target="_blank" class="flex items-center gap-3 p-3 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors svelte-pbcxxe"><span class="text-xl">📸</span> <div><p class="font-medium">${escape_html(store_get($$store_subs ??= {}, "$t", t).instagram)}</p> <p class="text-sm opacity-75">@${escape_html(((branch.instagram || branch.instagram_url).split("/").pop() || "").replace("@", ""))}</p></div> <span class="ml-auto text-xs svelte-pbcxxe">${escape_html(store_get($$store_subs ??= {}, "$language", language) === "ar" ? "↙️" : "↗️")}</span></a>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--> `);
        if (branch.snap || branch.snap_url) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<a${attr("href", branch.snap || branch.snap_url)} target="_blank" class="flex items-center gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors svelte-pbcxxe"><span class="text-xl">👻</span> <div><p class="font-medium">${escape_html(store_get($$store_subs ??= {}, "$t", t).snapchat)}</p> <p class="text-sm opacity-75">@${escape_html(((branch.snap || branch.snap_url).split("/").pop() || "").replace("@", ""))}</p></div> <span class="ml-auto text-xs svelte-pbcxxe">${escape_html(store_get($$store_subs ??= {}, "$language", language) === "ar" ? "↙️" : "↗️")}</span></a>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></div> <div class="space-y-4"><h4 class="font-medium text-gray-800 mb-3">📄 ${escape_html(store_get($$store_subs ??= {}, "$t", t).resources)}</h4> `);
        if (branch.code || branch.email) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div class="space-y-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">`);
          if (branch.code) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<p><span class="font-medium">${escape_html(store_get($$store_subs ??= {}, "$t", t).branchCode)}:</span> ${escape_html(branch.code)}</p>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]--> `);
          if (branch.email) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<p><span class="font-medium">${escape_html(store_get($$store_subs ??= {}, "$t", t).email)}:</span> <a${attr("href", `mailto:${branch.email}`)} class="text-blue-600 hover:underline">${escape_html(branch.email)}</a></p>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]--></div>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></div></div></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    }
    $$payload.out.push(`<!--]--></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
