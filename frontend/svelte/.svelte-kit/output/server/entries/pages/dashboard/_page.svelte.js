import { F as store_get, T as head, M as unsubscribe_stores, D as pop, z as push, K as escape_html } from "../../../chunks/index.js";
import { g as getCardTypeGradient } from "../../../chunks/cardTypes.js";
import "../../../chunks/supabase.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/state.svelte.js";
import { l as language, t } from "../../../chunks/language.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let cardTypeData = null;
  let branches = [];
  function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 255) + amt;
    const B = (num & 255) + amt;
    return "#" + (16777216 + (R < 255 ? R < 1 ? 0 : R : 255) * 65536 + (G < 255 ? G < 1 ? 0 : G : 255) * 256 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  [
    {
      id: "all",
      name: store_get($$store_subs ??= {}, "$language", language) === "ar" ? "جميع الفروع" : "All Branches"
    },
    ...branches.map((b) => ({
      id: b.id,
      name: store_get($$store_subs ??= {}, "$language", language) === "ar" ? b.name_ar || b.name_en || b.name || "Unknown" : b.name_en || b.name || b.name_ar || "Unknown"
    }))
  ];
  (() => {
    try {
      if (cardTypeData && cardTypeData.color) ;
      return cardTypeData ? getCardTypeGradient(cardTypeData.name) : getCardTypeGradient("Gold");
    } catch (err) {
      console.warn("Failed to get card gradient, using default:", err);
      return { from: "#FFD700", to: "#FFA500" };
    }
  })();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(store_get($$store_subs ??= {}, "$t", t).dashboard)} - Urban Market Loyalty</title>`;
  });
  $$payload.out.push(`<main class="p-6 max-w-6xl mx-auto mt-8">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex justify-center items-center h-64"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>`);
  }
  $$payload.out.push(`<!--]--></main>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
