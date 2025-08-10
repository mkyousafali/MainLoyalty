import "clsx";
import { D as pop, z as push } from "../../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/state.svelte.js";
function _page($$payload, $$props) {
  push();
  $$payload.out.push(`<div class="flex items-center justify-center min-h-screen"><div class="text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div> <p class="mt-2 text-gray-600">Redirecting to Analytics...</p></div></div>`);
  pop();
}
export {
  _page as default
};
