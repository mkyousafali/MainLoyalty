import { E as fallback, F as store_get, G as attr_class, I as attr, J as stringify, K as escape_html, M as unsubscribe_stores, N as bind_props, D as pop, z as push } from "../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/state.svelte.js";
import { p as page } from "../../chunks/stores.js";
import { t, l as language } from "../../chunks/language.js";
import { w as writable } from "../../chunks/index2.js";
import "clsx";
const user = writable(null);
function TopBar($$payload, $$props) {
  push();
  var $$store_subs;
  let currentTitle, isLoginPage;
  let showBackButton = fallback($$props["showBackButton"], true);
  let title = fallback($$props["title"], "");
  let showLanguageToggle = fallback($$props["showLanguageToggle"], true);
  let showLogout = fallback($$props["showLogout"], true);
  function getPageTitle(pathname) {
    const titles = {
      "/dashboard": store_get($$store_subs ??= {}, "$t", t).dashboard || "Dashboard",
      "/virtual-card": store_get($$store_subs ??= {}, "$t", t).virtualCard || "Virtual Card",
      "/customer-support": store_get($$store_subs ??= {}, "$t", t).customerSupport || "Customer Support",
      "/my-offers": store_get($$store_subs ??= {}, "$t", t).myOffers || "My Offers",
      "/admin": store_get($$store_subs ??= {}, "$t", t).adminPanel || "Admin Panel",
      "/admin-login": "Admin Login",
      "/login": "Login",
      "/register": "Register"
    };
    return titles[pathname] || "MainLoyalty";
  }
  currentTitle = title || getPageTitle(store_get($$store_subs ??= {}, "$page", page).url.pathname);
  store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith("/admin");
  isLoginPage = store_get($$store_subs ??= {}, "$page", page).url.pathname === "/login" || store_get($$store_subs ??= {}, "$page", page).url.pathname === "/admin-login";
  $$payload.out.push(`<header${attr_class("bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 svelte-1awjdlf", void 0, {
    "rtl": store_get($$store_subs ??= {}, "$language", language) === "ar"
  })}><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="flex justify-between items-center h-16"><div${attr_class("flex items-center space-x-4 min-w-0 flex-1", void 0, {
    "space-x-reverse": store_get($$store_subs ??= {}, "$language", language) === "ar"
  })}>`);
  if (showBackButton && !isLoginPage) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="flex items-center text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-100"${attr("title", store_get($$store_subs ??= {}, "$t", t).back || "Back")}${attr("aria-label", store_get($$store_subs ??= {}, "$t", t).back || "Back")}><svg${attr_class(`w-5 h-5 ${stringify(store_get($$store_subs ??= {}, "$language", language) === "ar" ? "rotate-180" : "")}`)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (!isLoginPage && store_get($$store_subs ??= {}, "$user", user)) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class("flex items-center space-x-3", void 0, {
      "space-x-reverse": store_get($$store_subs ??= {}, "$language", language) === "ar"
    })}><div class="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm">${escape_html(store_get($$store_subs ??= {}, "$user", user).name.charAt(0))}</div> <div class="hidden sm:block"><p class="text-xs text-gray-500">${escape_html(store_get($$store_subs ??= {}, "$t", t).welcome || "Welcome")}</p> <p class="font-medium text-gray-900 text-sm">${escape_html(store_get($$store_subs ??= {}, "$user", user).name)}</p></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="flex-2 flex items-center justify-center mx-4 svelte-1awjdlf"><h1 class="relative bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-bold text-base tracking-wide shadow-lg transition-all duration-300 max-w-xs truncate text-center"><span class="relative z-10 drop-shadow-lg">${escape_html(currentTitle)}</span></h1></div> <div${attr_class("flex items-center space-x-2 min-w-0 flex-1 justify-end", void 0, {
    "space-x-reverse": store_get($$store_subs ??= {}, "$language", language) === "ar"
  })}>`);
  if (showLanguageToggle) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="group relative bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-xl font-semibold transition-all duration-200 text-sm border border-blue-200/50 hover:border-blue-300/70 shadow-sm hover:shadow-md transform hover:scale-105" title="Toggle Language"><span class="font-bold tracking-wide">${escape_html(store_get($$store_subs ??= {}, "$language", language) === "ar" ? "EN" : "AR")}</span> <div class="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div></button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (showLogout && !isLoginPage && store_get($$store_subs ??= {}, "$user", user)) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button${attr_class("hidden sm:flex items-center space-x-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm", void 0, {
      "space-x-reverse": store_get($$store_subs ??= {}, "$language", language) === "ar"
    })}><span>🔓</span> <span>${escape_html(store_get($$store_subs ??= {}, "$t", t).logout || "Logout")}</span></button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="sm:hidden"><button class="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100" title="Menu" aria-label="Menu"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></button></div></div></div> `);
  if (!isLoginPage && store_get($$store_subs ??= {}, "$user", user)) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="sm:hidden pb-3 pt-1 border-t border-gray-100"><div class="flex items-center justify-between"><div${attr_class("flex items-center space-x-3", void 0, {
      "space-x-reverse": store_get($$store_subs ??= {}, "$language", language) === "ar"
    })}><div class="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-xs">${escape_html(store_get($$store_subs ??= {}, "$user", user).name.charAt(0))}</div> <div><p class="text-xs text-gray-500">${escape_html(store_get($$store_subs ??= {}, "$t", t).welcome || "Welcome")} ${escape_html(store_get($$store_subs ??= {}, "$user", user).name)}</p></div></div> <div${attr_class("flex items-center space-x-2", void 0, {
      "space-x-reverse": store_get($$store_subs ??= {}, "$language", language) === "ar"
    })}>`);
    if (showLanguageToggle) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<button class="group bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-gray-700 hover:text-gray-900 px-3 py-1 rounded-lg font-semibold transition-all duration-200 text-xs border border-blue-200/50 hover:border-blue-300/70 shadow-sm hover:shadow-md transform hover:scale-105" title="Toggle Language"><span class="font-bold tracking-wide">${escape_html(store_get($$store_subs ??= {}, "$language", language) === "ar" ? "EN" : "AR")}</span></button>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    if (showLogout && store_get($$store_subs ??= {}, "$user", user)) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<button class="text-red-600 text-xs px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors">🔓 Logout</button>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></header>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { showBackButton, title, showLanguageToggle, showLogout });
  pop();
}
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let { children } = $$props;
  const hideTopBar = store_get($$store_subs ??= {}, "$page", page).url.pathname === "/" || store_get($$store_subs ??= {}, "$page", page).url.pathname === "/test" || store_get($$store_subs ??= {}, "$page", page).url.pathname === "/login";
  if (
    // Authentication guard - check on route changes
    // Skip authentication for public routes
    // Check if user is authenticated for protected routes
    // Admin routes
    // Customer routes
    !hideTopBar
  ) {
    $$payload.out.push("<!--[-->");
    TopBar($$payload, {});
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <main class="min-h-screen bg-gray-50">`);
  children($$payload);
  $$payload.out.push(`<!----></main>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
