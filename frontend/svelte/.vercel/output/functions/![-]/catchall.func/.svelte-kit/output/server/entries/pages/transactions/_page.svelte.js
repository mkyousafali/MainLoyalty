import { T as head, G as attr_class, D as pop, z as push } from "../../../chunks/index.js";
import "../../../chunks/supabase.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "clsx";
import "../../../chunks/state.svelte.js";
function _page($$payload, $$props) {
  push();
  let currentLang = "en";
  let branches = [];
  [
    { id: "all", name: "All Branches" },
    ...branches.map((b) => ({ id: b.id, name: b.name }))
  ];
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Transaction History - Urban Market Loyalty</title>`;
  });
  $$payload.out.push(`<div${attr_class("min-h-screen bg-[#f6f8fb] font-sans text-gray-800 svelte-aj2hht", void 0, { "rtl": currentLang === "ar" })}><main class="p-6 max-w-6xl mx-auto">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex justify-center items-center h-64 svelte-aj2hht"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>`);
  }
  $$payload.out.push(`<!--]--></main></div>`);
  pop();
}
export {
  _page as default
};
