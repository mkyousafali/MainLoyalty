import { T as head, K as escape_html, D as pop, z as push } from "../../../chunks/index.js";
import "../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let debugInfo = "";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Simple Dashboard Test</title>`;
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-100 p-6"><div class="max-w-4xl mx-auto"><h1 class="text-3xl font-bold mb-6">Simple Dashboard Test</h1> <div class="bg-white border rounded-lg p-4 mb-6"><h3 class="font-bold mb-2">Debug Info:</h3> <pre class="text-sm bg-gray-100 p-3 rounded whitespace-pre-wrap">${escape_html(debugInfo)}</pre></div> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4"><p>⏳ Loading...</p></div>`);
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
    {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <div class="mt-6 space-x-2"><button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Reload Data</button> <button class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Try Full Dashboard</button></div></div></div>`);
  pop();
}
export {
  _page as default
};
