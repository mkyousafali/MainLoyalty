import { P as ensure_array_like, K as escape_html, G as attr_class, S as attr_style, J as stringify, R as maybe_selected, I as attr, D as pop, z as push } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
import { u as uploadManager } from "../../../../chunks/uploadManager.js";
function _page($$payload, $$props) {
  push();
  let branches = [];
  let selectedBranch = "";
  let recentUploads = [];
  let manualTransaction = {
    bill_no: "",
    bill_date: "",
    bill_amount: "",
    customer: "",
    add_amt: "",
    redeem: ""
  };
  let uploadErrors = [];
  const each_array_1 = ensure_array_like(branches);
  $$payload.out.push(`<div class="max-w-6xl mx-auto"><div class="mb-8"><h1 class="text-3xl font-bold text-gray-900 mb-2">Upload Transactions</h1> <p class="text-gray-600">Add customer transactions manually or upload from Excel file with automatic points calculation.</p></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (recentUploads.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(recentUploads.slice(0, 5));
    $$payload.out.push(`<div class="bg-white rounded-lg shadow p-6 mb-6"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-semibold">Recent Uploads</h2> <a href="/admin/upload-status" class="text-blue-600 hover:text-blue-700 text-sm font-medium">View Dashboard →</a></div> <div class="overflow-x-auto"><table class="min-w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left font-medium text-gray-700">File</th><th class="px-3 py-2 text-left font-medium text-gray-700">Status</th><th class="px-3 py-2 text-left font-medium text-gray-700">Progress</th><th class="px-3 py-2 text-left font-medium text-gray-700">Time</th><th class="px-3 py-2 text-left font-medium text-gray-700">Actions</th></tr></thead><tbody class="divide-y divide-gray-200"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let upload = each_array[$$index];
      $$payload.out.push(`<tr class="hover:bg-gray-50"><td class="px-3 py-2"><div class="flex items-center gap-2"><span class="text-lg">${escape_html(uploadManager.getStatusIcon(upload.status))}</span> <span class="font-medium">${escape_html(upload.fileName)}</span></div></td><td class="px-3 py-2"><span${attr_class(`px-2 py-1 text-xs rounded-full ${stringify(upload.status === "completed" ? "bg-green-100 text-green-800" : upload.status === "failed" ? "bg-red-100 text-red-800" : upload.status === "processing" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800")}`)}>${escape_html(upload.status.toUpperCase())}</span></td><td class="px-3 py-2"><div class="flex items-center gap-2"><div class="w-16 bg-gray-200 rounded-full h-1.5"><div${attr_class(`h-1.5 rounded-full ${stringify(upload.status === "completed" ? "bg-green-500" : upload.status === "failed" ? "bg-red-500" : upload.status === "processing" ? "bg-blue-500" : "bg-yellow-500")}`)}${attr_style(`width: ${stringify(uploadManager.getProgressPercentage(upload))}%`)}></div></div> <span class="text-xs">${escape_html(upload.progress.processed)}/${escape_html(upload.progress.total)}</span></div></td><td class="px-3 py-2 text-gray-600">${escape_html(new Date(upload.created_at).toLocaleString())}</td><td class="px-3 py-2">`);
      if (upload.status === "processing") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="flex gap-1"><button class="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600" title="Pause Upload">⏸️</button> <button class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600" title="Cancel Upload">🚫</button></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
        if (upload.status === "paused") {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div class="flex gap-1"><button class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600" title="Resume Upload">▶️</button> <button class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600" title="Cancel Upload">🚫</button></div>`);
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<span class="text-gray-400 text-xs">-</span>`);
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]--></td></tr>`);
    }
    $$payload.out.push(`<!--]--></tbody></table></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="bg-white rounded-lg shadow p-6 mb-6"><h2 class="text-lg font-semibold mb-4">Select Branch</h2> <select class="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>`);
  $$payload.select_value = selectedBranch;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Choose a branch...</option><!--[-->`);
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let branch = each_array_1[$$index_1];
    $$payload.out.push(`<option${attr("value", branch.id)}${maybe_selected($$payload, branch.id)}>${escape_html(branch.name_en)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div class="bg-white rounded-lg shadow p-6 mb-6"><h2 class="text-lg font-semibold mb-4">Manual Transaction Entry</h2> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">Bill Number</label> <input type="text"${attr("value", manualTransaction.bill_no)} placeholder="INV001" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Bill Date</label> <input type="date"${attr("value", manualTransaction.bill_date)} class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Bill Amount (﷼)</label> <input type="number" step="0.01"${attr("value", manualTransaction.bill_amount)} placeholder="100.50" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Customer Mobile</label> <input type="text"${attr("value", manualTransaction.customer)} placeholder="5xxxxxxxx" maxlength="10" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Points to Add</label> <input type="number"${attr("value", manualTransaction.add_amt)} placeholder="10" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Points to Redeem</label> <input type="number"${attr("value", manualTransaction.redeem)} placeholder="0" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div></div> <button${attr("disabled", !selectedBranch, true)} class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">${escape_html("Add Transaction")}</button></div> <div class="bg-white rounded-lg shadow p-6 mb-6"><div class="flex justify-between items-center mb-4"><h2 class="text-lg font-semibold">Excel File Upload</h2> <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"><span>📥</span> Download Template</button></div> <div class="mb-4"><label class="block text-sm font-medium text-gray-700 mb-2">Choose Excel File</label> <input type="file" accept=".xlsx,.xls" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/> <p class="text-sm text-gray-500 mt-1">Columns: Bill No, Bill Date (YYYY-MM-DD), Bill Amount, Customer Mobile, Points to Add, Points to Redeem</p></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="flex gap-4"><button${attr("disabled", true, true)} class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">${escape_html("Upload Excel File")}</button> <button class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">Clear All</button></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (uploadErrors.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array_3 = ensure_array_like(uploadErrors);
    $$payload.out.push(`<div class="bg-white rounded-lg shadow p-6 mb-6"><h2 class="text-lg font-semibold mb-4 text-red-600">Upload Errors</h2> <div class="overflow-x-auto"><table class="min-w-full border border-gray-200 rounded-lg"><thead class="bg-red-50"><tr><th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Row</th><th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Customer</th><th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Error</th></tr></thead><tbody><!--[-->`);
    for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
      let error = each_array_3[$$index_3];
      $$payload.out.push(`<tr class="border-t"><td class="px-4 py-2 text-sm">${escape_html(error.row)}</td><td class="px-4 py-2 text-sm font-mono">${escape_html(error.customer)}</td><td class="px-4 py-2 text-sm text-red-600">${escape_html(error.error)}</td></tr>`);
    }
    $$payload.out.push(`<!--]--></tbody></table></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
export {
  _page as default
};
