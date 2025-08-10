import { Y as current_component, P as ensure_array_like, K as escape_html, G as attr_class, J as stringify, S as attr_style, D as pop, z as push, T as head } from "../../../../chunks/index.js";
import { u as uploadManager } from "../../../../chunks/uploadManager.js";
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
function UploadStatusDashboard($$payload, $$props) {
  push();
  let activeUploads = {};
  let completedUploads = [];
  onDestroy(() => {
    uploadManager.destroy();
  });
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString();
  }
  function formatDuration(startStr, endStr) {
    if (!startStr || !endStr) return "";
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = end.getTime() - start.getTime();
    const seconds = Math.round(diff / 1e3);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  }
  function getProgressBarColor(status) {
    switch (status) {
      case "processing":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "paused":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-yellow-500";
    }
  }
  $$payload.out.push(`<div class="max-w-6xl mx-auto p-6 svelte-19rb0n8"><div class="mb-8 svelte-19rb0n8"><h1 class="text-3xl font-bold text-gray-900 mb-2 svelte-19rb0n8">Upload Status Dashboard</h1> <p class="text-gray-600 svelte-19rb0n8">Monitor your transaction upload progress in real-time</p></div> `);
  if (Object.keys(activeUploads).length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(Object.values(activeUploads));
    $$payload.out.push(`<div class="mb-8 svelte-19rb0n8"><h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center svelte-19rb0n8"><span class="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse svelte-19rb0n8"></span> Active Uploads (${escape_html(Object.keys(activeUploads).length)})</h2> <div class="space-y-4 svelte-19rb0n8"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let upload = each_array[$$index];
      $$payload.out.push(`<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 svelte-19rb0n8"><div class="flex items-center justify-between mb-4 svelte-19rb0n8"><div class="flex items-center space-x-3 svelte-19rb0n8"><span class="text-2xl svelte-19rb0n8">${escape_html(uploadManager.getStatusIcon(upload.status))}</span> <div class="svelte-19rb0n8"><h3 class="font-medium text-gray-900 svelte-19rb0n8">${escape_html(upload.fileName)}</h3> <p class="text-sm text-gray-500 svelte-19rb0n8">Job ID: ${escape_html(upload.jobId)}</p></div></div> <div class="flex items-center space-x-3 svelte-19rb0n8"><span${attr_class(`px-3 py-1 rounded-full text-sm font-medium ${stringify(uploadManager.getStatusColor(upload.status))} bg-gray-100`, "svelte-19rb0n8")}>${escape_html(upload.status.toUpperCase())}</span> `);
      if (upload.status === "pending") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button class="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors svelte-19rb0n8">Cancel</button>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></div> <div class="mb-3 svelte-19rb0n8"><div class="flex justify-between text-sm text-gray-600 mb-1 svelte-19rb0n8"><span class="svelte-19rb0n8">Progress: ${escape_html(upload.progress.processed)} / ${escape_html(upload.progress.total)}</span> <span class="svelte-19rb0n8">${escape_html(uploadManager.getProgressPercentage(upload))}%</span></div> <div class="w-full bg-gray-200 rounded-full h-2 svelte-19rb0n8"><div${attr_class(`h-2 rounded-full transition-all duration-300 ${stringify(getProgressBarColor(upload.status))}`, "svelte-19rb0n8")}${attr_style(`width: ${stringify(uploadManager.getProgressPercentage(upload))}%`)}></div></div></div> <div class="flex space-x-6 text-sm text-gray-600 svelte-19rb0n8"><span class="svelte-19rb0n8">✅ Processed: ${escape_html(upload.progress.processed)}</span> `);
      if (upload.progress.failed > 0) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="text-red-600 svelte-19rb0n8">❌ Failed: ${escape_html(upload.progress.failed)}</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div> `);
      if (upload.error) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md svelte-19rb0n8"><p class="text-sm text-red-700 svelte-19rb0n8">${escape_html(upload.error)}</p></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    }
    $$payload.out.push(`<!--]--></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="mb-8 text-center py-8 svelte-19rb0n8"><div class="text-gray-400 text-6xl mb-4 svelte-19rb0n8">📋</div> <h3 class="text-lg font-medium text-gray-900 mb-2 svelte-19rb0n8">No Active Uploads</h3> <p class="text-gray-600 svelte-19rb0n8">Upload some transaction files to see progress here</p></div>`);
  }
  $$payload.out.push(`<!--]--> `);
  if (completedUploads.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array_1 = ensure_array_like(completedUploads);
    $$payload.out.push(`<div class="svelte-19rb0n8"><h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center svelte-19rb0n8"><span class="w-3 h-3 bg-gray-400 rounded-full mr-2 svelte-19rb0n8"></span> Recent Uploads (${escape_html(completedUploads.length)})</h2> <div class="bg-white rounded-lg shadow-md border border-gray-200 svelte-19rb0n8"><div class="overflow-x-auto svelte-19rb0n8"><table class="min-w-full divide-y divide-gray-200 svelte-19rb0n8"><thead class="bg-gray-50 svelte-19rb0n8"><tr class="svelte-19rb0n8"><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider svelte-19rb0n8">File</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider svelte-19rb0n8">Status</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider svelte-19rb0n8">Progress</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider svelte-19rb0n8">Duration</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider svelte-19rb0n8">Completed</th></tr></thead><tbody class="bg-white divide-y divide-gray-200 svelte-19rb0n8"><!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let upload = each_array_1[$$index_1];
      $$payload.out.push(`<tr class="hover:bg-gray-50 svelte-19rb0n8"><td class="px-6 py-4 whitespace-nowrap svelte-19rb0n8"><div class="flex items-center svelte-19rb0n8"><span class="text-lg mr-2 svelte-19rb0n8">${escape_html(uploadManager.getStatusIcon(upload.status))}</span> <div class="svelte-19rb0n8"><div class="text-sm font-medium text-gray-900 svelte-19rb0n8">${escape_html(upload.fileName)}</div> <div class="text-sm text-gray-500 svelte-19rb0n8">${escape_html(upload.progress.total)} transactions</div></div></div></td><td class="px-6 py-4 whitespace-nowrap svelte-19rb0n8"><span${attr_class(
        `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${stringify(upload.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}`,
        "svelte-19rb0n8"
      )}>${escape_html(upload.status.toUpperCase())}</span></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 svelte-19rb0n8"><div class="flex items-center svelte-19rb0n8"><div class="w-16 bg-gray-200 rounded-full h-2 mr-2 svelte-19rb0n8"><div${attr_class(`h-2 rounded-full ${stringify(upload.status === "completed" ? "bg-green-500" : "bg-red-500")}`, "svelte-19rb0n8")}${attr_style(`width: ${stringify(uploadManager.getProgressPercentage(upload))}%`)}></div></div> <span class="svelte-19rb0n8">${escape_html(upload.progress.processed)}/${escape_html(upload.progress.total)}</span> `);
      if (upload.progress.failed > 0) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="ml-2 text-red-600 text-xs svelte-19rb0n8">(${escape_html(upload.progress.failed)} failed)</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 svelte-19rb0n8">${escape_html(formatDuration(upload.started_at, upload.completed_at))}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 svelte-19rb0n8">${escape_html(upload.completed_at ? formatDate(upload.completed_at) : "")}</td></tr>`);
    }
    $$payload.out.push(`<!--]--></tbody></table></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function _page($$payload) {
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Upload Status Dashboard - Urban Market Loyalty System</title>`;
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-100">`);
  UploadStatusDashboard($$payload);
  $$payload.out.push(`<!----></div>`);
}
export {
  _page as default
};
