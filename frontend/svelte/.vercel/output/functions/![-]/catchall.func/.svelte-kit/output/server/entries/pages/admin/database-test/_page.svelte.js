import { I as attr, K as escape_html, P as ensure_array_like, D as pop, z as push } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let testResults = [];
  let errors = [];
  let isLoading = true;
  let connectionStatus = "Testing...";
  $$payload.out.push(`<div class="p-6"><div class="max-w-4xl mx-auto"><div class="mb-8"><div class="flex justify-between items-center"><div><h1 class="text-3xl font-bold text-gray-900 mb-2">Database Connection Test</h1> <p class="text-gray-600">Test database connectivity and table accessibility.</p></div> <button${attr("disabled", isLoading, true)} class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">${escape_html("Testing...")}</button></div></div> <div class="mb-6"><div class="bg-white rounded-lg shadow p-6"><h2 class="text-xl font-semibold mb-4">Connection Status</h2> <div class="flex items-center space-x-3">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>`);
  }
  $$payload.out.push(`<!--]--> <span class="text-lg font-medium">${escape_html(connectionStatus)}</span></div></div></div> <div class="mb-6"><div class="bg-white rounded-lg shadow overflow-hidden"><div class="px-6 py-4 border-b border-gray-200"><h2 class="text-xl font-semibold">Tables Status</h2> <p class="text-sm text-gray-600 mt-1">Status of all database tables</p></div> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="p-8 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div> <p class="text-gray-600 mt-2">Testing database tables...</p></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (errors.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array_1 = ensure_array_like(errors);
    $$payload.out.push(`<div class="mb-6"><div class="bg-white rounded-lg shadow overflow-hidden"><div class="px-6 py-4 border-b border-gray-200"><h2 class="text-xl font-semibold text-red-600">Errors Detected</h2> <p class="text-sm text-gray-600 mt-1">${escape_html(errors.length)} error(s) found during testing</p></div> <div class="p-6"><div class="space-y-3"><!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let error = each_array_1[$$index_1];
      $$payload.out.push(`<div class="bg-red-50 border border-red-200 rounded-lg p-4"><code class="text-red-800 text-sm">${escape_html(error)}</code></div>`);
    }
    $$payload.out.push(`<!--]--></div></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="bg-gray-50 rounded-lg p-6"><h3 class="text-lg font-semibold mb-4">Database Information</h3> <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div><span class="font-medium text-gray-700">Database Type:</span> <span class="text-gray-600 ml-2">Supabase PostgreSQL</span></div> <div><span class="font-medium text-gray-700">Connection Method:</span> <span class="text-gray-600 ml-2">Supabase Client</span></div> <div><span class="font-medium text-gray-700">Test Date:</span> <span class="text-gray-600 ml-2">${escape_html((/* @__PURE__ */ new Date()).toLocaleString())}</span></div> <div><span class="font-medium text-gray-700">Tables Tested:</span> <span class="text-gray-600 ml-2">${escape_html(testResults.length)} tables</span></div></div></div></div></div>`);
  pop();
}
export {
  _page as default
};
