import { P as ensure_array_like, K as escape_html, G as attr_class, J as stringify, I as attr, D as pop, z as push } from "../../../../chunks/index.js";
function _page($$payload, $$props) {
  push();
  let exports = [];
  const exportTypes = [
    {
      value: "customers",
      label: "Customer Data",
      description: "Export customer information and statistics"
    },
    {
      value: "transactions",
      label: "Transaction Data",
      description: "Export transaction history and details"
    },
    {
      value: "analytics",
      label: "Analytics Report",
      description: "Export analytics and performance data"
    },
    {
      value: "rewards",
      label: "Rewards Data",
      description: "Export rewards and redemption data"
    }
  ];
  function getStatusColor(status) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
  function getTypeIcon(type) {
    switch (type) {
      case "customers":
        return "👥";
      case "transactions":
        return "💳";
      case "analytics":
        return "📊";
      case "rewards":
        return "🎁";
      default:
        return "📄";
    }
  }
  function getFormatIcon(format) {
    switch (format) {
      case "csv":
        return "📝";
      case "excel":
        return "📗";
      case "pdf":
        return "📄";
      default:
        return "📁";
    }
  }
  $$payload.out.push(`<div class="p-6"><div class="flex justify-between items-center mb-6"><div><h1 class="text-2xl font-bold text-gray-900 mb-2">Export Data</h1> <p class="text-gray-600">Export and download data in various formats</p></div> <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"><span class="mr-2">📤</span> Create Export</button></div> `);
  {
    $$payload.out.push("<!--[!-->");
    const each_array = ensure_array_like(exportTypes);
    const each_array_1 = ensure_array_like(exports);
    $$payload.out.push(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let type = each_array[$$index];
      $$payload.out.push(`<div class="bg-white rounded-lg shadow p-6 border hover:border-blue-300 cursor-pointer transition-colors"><div class="flex items-center mb-3"><span class="text-2xl mr-3">${escape_html(getTypeIcon(type.value))}</span> <h3 class="text-lg font-semibold text-gray-900">${escape_html(type.label)}</h3></div> <p class="text-gray-600 text-sm mb-4">${escape_html(type.description)}</p> <button class="w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium">Quick Export</button></div>`);
    }
    $$payload.out.push(`<!--]--></div> <div class="bg-white rounded-lg shadow overflow-hidden"><div class="px-6 py-4 border-b border-gray-200"><h3 class="text-lg font-medium text-gray-900">Export History</h3></div> <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Export</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let exportData = each_array_1[$$index_1];
      $$payload.out.push(`<tr><td class="px-6 py-4"><div><div class="text-sm font-medium text-gray-900">${escape_html(exportData.name)}</div> <div class="text-sm text-gray-500">${escape_html(exportData.description)}</div> `);
      if (exportData.fileSize) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="text-xs text-gray-400 mt-1">Size: ${escape_html(exportData.fileSize)}</div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></td><td class="px-6 py-4 whitespace-nowrap"><div class="flex items-center"><span class="text-lg mr-2">${escape_html(getTypeIcon(exportData.type))}</span> <span class="text-sm text-gray-900 capitalize">${escape_html(exportData.type)}</span></div></td><td class="px-6 py-4 whitespace-nowrap"><div class="flex items-center"><span class="text-lg mr-2">${escape_html(getFormatIcon(exportData.format))}</span> <span class="text-sm text-gray-900 uppercase">${escape_html(exportData.format)}</span></div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escape_html(exportData.recordCount?.toLocaleString() || "-")}</td><td class="px-6 py-4 whitespace-nowrap"><div><span${attr_class(`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stringify(getStatusColor(exportData.status))}`)}>${escape_html(exportData.status)}</span> `);
      if (exportData.status === "processing") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="text-xs text-gray-500 mt-1"><div class="w-full bg-gray-200 rounded-full h-1"><div class="bg-blue-600 h-1 rounded-full animate-pulse" style="width: 45%"></div></div></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><div>${escape_html(new Date(exportData.createdDate).toLocaleDateString())} `);
      if (exportData.completedDate) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="text-xs text-gray-500">Completed: ${escape_html(new Date(exportData.completedDate).toLocaleDateString())}</div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium"><div class="flex space-x-2">`);
      if (exportData.status === "completed" && exportData.downloadUrl) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<a${attr("href", exportData.downloadUrl)} download="" class="text-green-600 hover:text-green-900">Download</a>`);
      } else {
        $$payload.out.push("<!--[!-->");
        if (exportData.status === "failed") {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<button class="text-blue-600 hover:text-blue-900">Retry</button>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]--> <button class="text-red-600 hover:text-red-900">Delete</button></div></td></tr>`);
    }
    $$payload.out.push(`<!--]--></tbody></table></div></div> <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6"><div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="flex-shrink-0"><div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><span class="text-blue-600 text-sm font-semibold">📊</span></div></div> <div class="ml-4"><p class="text-sm font-medium text-gray-600">Total Exports</p> <p class="text-lg font-semibold text-gray-900">${escape_html(exports.length)}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="flex-shrink-0"><div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><span class="text-green-600 text-sm font-semibold">✅</span></div></div> <div class="ml-4"><p class="text-sm font-medium text-gray-600">Completed</p> <p class="text-lg font-semibold text-gray-900">${escape_html(exports.filter((e) => e.status === "completed").length)}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="flex-shrink-0"><div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center"><span class="text-yellow-600 text-sm font-semibold">⏳</span></div></div> <div class="ml-4"><p class="text-sm font-medium text-gray-600">Processing</p> <p class="text-lg font-semibold text-gray-900">${escape_html(exports.filter((e) => e.status === "processing" || e.status === "pending").length)}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="flex-shrink-0"><div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><span class="text-red-600 text-sm font-semibold">❌</span></div></div> <div class="ml-4"><p class="text-sm font-medium text-gray-600">Failed</p> <p class="text-lg font-semibold text-gray-900">${escape_html(exports.filter((e) => e.status === "failed").length)}</p></div></div></div></div>`);
  }
  $$payload.out.push(`<!--]--></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
export {
  _page as default
};
