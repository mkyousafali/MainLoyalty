import { I as attr, D as pop, z as push } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let supportSettings = { whatsappNumber: "https://wa.me/966500000000" };
  let loading = false;
  $$payload.out.push(`<div class="p-6 bg-green-50 border border-green-200 rounded-xl shadow mb-6 max-w-4xl mx-auto svelte-1rg79sv"><div class="flex items-center gap-3 mb-4 svelte-1rg79sv"><div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center svelte-1rg79sv"><svg class="w-6 h-6 text-green-600 svelte-1rg79sv" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" class="svelte-1rg79sv"></path></svg></div> <div class="svelte-1rg79sv"><h2 class="text-xl font-bold text-green-800 svelte-1rg79sv">🌍 Global WhatsApp Support</h2> <p class="text-sm text-gray-700 svelte-1rg79sv">Add WhatsApp link for customer support across the app</p></div></div> <div class="mb-4 svelte-1rg79sv"><label class="block text-sm font-medium text-gray-800 mb-2 svelte-1rg79sv">WhatsApp Link</label> <input type="url"${attr("value", supportSettings.whatsappNumber)} placeholder="https://wa.me/966500000000" class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg text-gray-900 bg-white placeholder-gray-500 svelte-1rg79sv" style="color: #111827 !important;"/> <p class="text-xs text-gray-600 mt-1 svelte-1rg79sv">Enter the complete WhatsApp link (e.g., https://wa.me/966500000000)</p></div> <button${attr("disabled", loading, true)} class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed svelte-1rg79sv">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`💾 Save WhatsApp Link`);
  }
  $$payload.out.push(`<!--]--></button> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
export {
  _page as default
};
