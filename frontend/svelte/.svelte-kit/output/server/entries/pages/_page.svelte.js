import "clsx";
import { D as pop, z as push } from "../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/state.svelte.js";
function _page($$payload, $$props) {
  push();
  $$payload.out.push(`<div class="min-h-screen bg-gray-100 flex items-center justify-center"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div> <p class="text-gray-600 font-medium">Loading MainLoyalty...</p></div></div>`);
  pop();
}
export {
  _page as default
};
