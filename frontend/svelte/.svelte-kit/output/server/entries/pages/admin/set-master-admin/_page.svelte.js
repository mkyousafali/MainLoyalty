import { K as escape_html, D as pop, z as push } from "../../../../chunks/index.js";
import "clsx";
import "../../../../chunks/permissions.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/state.svelte.js";
function _page($$payload, $$props) {
  push();
  let message = "";
  $$payload.out.push(`<div class="flex items-center justify-center min-h-screen bg-gray-100"><div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center"><div class="mb-4"><svg class="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div> <h1 class="text-2xl font-bold text-gray-900 mb-4">Setting Master Admin</h1> <p class="text-gray-600 mb-6">${escape_html(message)}</p> <div class="flex justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div> <p class="text-sm text-gray-500 mt-4">Redirecting to User Roles Management...</p></div></div>`);
  pop();
}
export {
  _page as default
};
