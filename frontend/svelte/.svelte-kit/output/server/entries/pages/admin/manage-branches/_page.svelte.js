import { P as ensure_array_like, K as escape_html, I as attr, D as pop, z as push } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let branches = [];
  const each_array = ensure_array_like(branches);
  $$payload.out.push(`<div class="max-w-7xl mx-auto"><div class="mb-8"><div class="flex justify-between items-center"><div><h1 class="text-3xl font-bold text-gray-900 mb-2">Branch Management</h1> <p class="text-gray-600">Manage all branch locations, contact information, and social media links.</p></div> <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">+ Add Branch</button></div></div> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let branch = each_array[$$index];
    $$payload.out.push(`<div class="bg-white rounded-lg shadow p-6"><div class="flex justify-between items-start mb-4"><div><h3 class="text-lg font-semibold text-gray-900">${escape_html(branch.name_en)}</h3> `);
    if (branch.name_ar) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<p class="text-sm text-gray-600">${escape_html(branch.name_ar)}</p>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div class="w-3 h-3 bg-green-400 rounded-full"></div></div> <div class="space-y-3 mb-4">`);
    if (branch.contact_number) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="flex items-center text-sm"><span class="text-gray-400 mr-2">📞</span> <span>${escape_html(branch.contact_number)}</span></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    if (branch.address) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="flex items-start text-sm"><span class="text-gray-400 mr-2 mt-0.5">📍</span> <span class="text-gray-600">${escape_html(branch.address)}</span></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> `);
    if (branch.website || branch.instagram || branch.snapchat) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="flex space-x-3 mb-4">`);
      if (branch.website) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button class="text-blue-600 hover:text-blue-800" title="Website">🌐</button>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (branch.instagram) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button class="text-pink-600 hover:text-pink-800" title="Instagram">📷</button>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (branch.snapchat) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button class="text-yellow-500 hover:text-yellow-700" title="Snapchat">👻</button>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div class="grid grid-cols-1 gap-4 mb-4 pt-4 border-t"><div class="text-center"><div class="text-lg font-bold text-blue-600">${escape_html(branch.customers_count || 0)}</div> <div class="text-xs text-gray-500">Customers</div></div></div> <div class="flex justify-end space-x-2"><button class="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button> <button class="text-red-600 hover:text-red-800 text-sm font-medium"${attr("disabled", branch.customers_count > 0, true)}>Delete</button></div></div>`);
  }
  $$payload.out.push(`<!--]--> `);
  if (branches.length === 0 && true) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="col-span-full text-center py-12"><div class="text-gray-400 text-6xl mb-4">🏢</div> <h3 class="text-lg font-medium text-gray-900 mb-2">No Branches</h3> <p class="text-gray-500 mb-4">Create your first branch to get started.</p> <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">+ Add Branch</button></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  {
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
