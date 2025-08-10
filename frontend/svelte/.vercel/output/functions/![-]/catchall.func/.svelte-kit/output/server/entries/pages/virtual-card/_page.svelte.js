import { G as attr_class, F as store_get, M as unsubscribe_stores, D as pop, z as push } from "../../../chunks/index.js";
import "qrcode";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "clsx";
import "../../../chunks/state.svelte.js";
import { a as getCardTypeColor, g as getCardTypeGradient } from "../../../chunks/cardTypes.js";
import "../../../chunks/supabase.js";
import { l as language } from "../../../chunks/language.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let cardColor;
  function getContrastTextColor(hexColor) {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    if (hexColor.toLowerCase() === "#ffd700" || r > 200 && g > 180 && b < 100) {
      return "gold";
    }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "dark" : "light";
  }
  cardColor = getCardTypeColor("Gold");
  (() => {
    return getCardTypeGradient("Gold");
  })();
  getContrastTextColor(cardColor);
  $$payload.out.push(`<div${attr_class("min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8 font-sans text-gray-800 svelte-108zud2", void 0, {
    "rtl": (
      // Use card number from customer_cards table, fallback to customer_code
      // Responsive QR code size based on screen size
      // sm breakpoint
      // Use dynamic card color
      store_get($$store_subs ??= {}, "$language", language) === "ar"
    )
  })}><div class="max-w-md sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex justify-center items-center h-64 svelte-108zud2"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
