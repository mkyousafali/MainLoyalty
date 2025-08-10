import { P as ensure_array_like, T as head, I as attr, K as escape_html, R as maybe_selected, G as attr_class, J as stringify, D as pop, z as push } from "../../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/state.svelte.js";
import { s as supabase } from "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let totalPages, hasNextPage, hasPrevPage;
  let offers = [];
  let branches = [];
  let loading = false;
  let searchQuery = "";
  let selectedBranch = "";
  let statusFilter = "all";
  let message = "";
  let messageType = "success";
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalOffers = 0;
  let showCreateModal = false;
  async function loadOffers() {
    try {
      loading = true;
      console.log("Loading offers with filters:", { selectedBranch, statusFilter, searchQuery });
      let query = supabase.from("offers").select("*", { count: "exact" }).order("created_at", { ascending: false });
      if (selectedBranch) ;
      if (statusFilter === "active") ;
      else if (statusFilter === "expired") ;
      else if (statusFilter === "inactive") ;
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      query = query.range(start, end);
      const { data, error, count } = await query;
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      console.log("Loaded offers:", data?.length || 0);
      offers = data || [];
      totalOffers = count || 0;
      if (offers.length > 0) {
        await loadBranchInfoForOffers();
      }
    } catch (error) {
      console.error("Error loading offers:", error);
      showMessage(`Failed to load offers: ${error.message}`, "error");
    } finally {
      loading = false;
    }
  }
  async function loadBranchInfoForOffers() {
    try {
      const branchIds = offers.filter((offer) => offer.branch_id).map((offer) => offer.branch_id);
      if (branchIds.length === 0) return;
      const { data: branchData, error } = await supabase.from("branches").select("*").in("id", branchIds);
      if (error) {
        console.error("Error loading branch info:", error);
        return;
      }
      const branchMap = /* @__PURE__ */ new Map();
      branchData?.forEach((branch) => {
        const branchName = branch.branch_name || branch.name || branch.title || `Branch ${branch.id?.slice(0, 8)}`;
        branchMap.set(branch.id, { ...branch, display_name: branchName });
      });
      offers = offers.map((offer) => ({
        ...offer,
        branch_info: offer.branch_id ? branchMap.get(offer.branch_id) : null
      }));
    } catch (error) {
      console.error("Error loading branch info:", error);
    }
  }
  function showMessage(text, type) {
    message = text;
    messageType = type;
    setTimeout(
      () => {
        message = "";
      },
      5e3
    );
  }
  function getOfferStatus(offer) {
    const now = /* @__PURE__ */ new Date();
    const validUntil = new Date(offer.valid_until);
    if (!offer.is_active) {
      return { label: "Inactive", color: "bg-gray-100 text-gray-800" };
    }
    if (validUntil < now) {
      return { label: "Expired", color: "bg-red-100 text-red-800" };
    }
    return { label: "Active", color: "bg-green-100 text-green-800" };
  }
  function getBranchName(offer) {
    if (offer.branch_info) {
      return offer.branch_info.display_name || "Unknown Branch";
    }
    return offer.branch_id ? "Loading..." : "All Branches";
  }
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  {
    currentPage = 1;
    if (typeof window !== "undefined") {
      loadOffers();
    }
  }
  {
    console.log("🎭 MODAL STATE CHANGED:", showCreateModal);
  }
  totalPages = Math.ceil(totalOffers / itemsPerPage);
  hasNextPage = currentPage < totalPages;
  hasPrevPage = currentPage > 1;
  const each_array = ensure_array_like(branches);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Offers Management - Admin Panel</title>`;
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-50"><div class="max-w-7xl mx-auto px-4 py-8"><div class="mb-8"><div><h1 class="text-3xl font-bold text-gray-900">Offers Management</h1> <p class="text-gray-600 mt-2">Manage all store offers and promotions</p></div></div> <div class="bg-white rounded-xl shadow-sm p-6 mb-6"><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div><label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search Offers</label> <input type="text" id="search"${attr("value", searchQuery)} placeholder="Search by title or description..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div> <div><label for="branchFilter" class="block text-sm font-medium text-gray-700 mb-2">Branch (${escape_html(branches.length)} loaded)</label> <select id="branchFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedBranch;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>All Branches</option><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let branch = each_array[$$index];
    $$payload.out.push(`<option${attr("value", branch.id)}${maybe_selected($$payload, branch.id)}>${escape_html(branch.name)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label for="statusFilter" class="block text-sm font-medium text-gray-700 mb-2">Status (${escape_html(totalOffers)} total)</label> <select id="statusFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = statusFilter;
  $$payload.out.push(`<option value="all"${maybe_selected($$payload, "all")}>All Status</option><option value="active"${maybe_selected($$payload, "active")}>Active</option><option value="expired"${maybe_selected($$payload, "expired")}>Expired</option><option value="inactive"${maybe_selected($$payload, "inactive")}>Inactive</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label for="itemsPerPage" class="block text-sm font-medium text-gray-700 mb-2">Items per page</label> <select id="itemsPerPage" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = itemsPerPage;
  $$payload.out.push(`<option${attr("value", 10)}${maybe_selected($$payload, 10)}>10</option><option${attr("value", 25)}${maybe_selected($$payload, 25)}>25</option><option${attr("value", 50)}${maybe_selected($$payload, 50)}>50</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div></div></div> <div class="bg-white rounded-xl shadow-sm overflow-hidden">`);
  if (loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="p-8 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div> <p class="text-gray-600 mt-4">Loading offers...</p></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    if (offers.length === 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="p-8 text-center"><div class="text-gray-400 text-6xl mb-4">📋</div> <h3 class="text-lg font-semibold text-gray-900 mb-2">No offers found</h3> <p class="text-gray-600 mb-4">${escape_html("Use the Create Offer page to add your first offer")}</p></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      const each_array_1 = ensure_array_like(offers);
      $$payload.out.push(`<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let offer = each_array_1[$$index_1];
        const status = getOfferStatus(offer);
        $$payload.out.push(`<tr class="hover:bg-gray-50"><td class="px-6 py-4"><div class="flex items-center">`);
        if (offer.image_url) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<img${attr("src", offer.image_url)}${attr("alt", offer.title)} class="w-12 h-12 rounded-lg object-cover mr-4"/>`);
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4 text-gray-400">📷</div>`);
        }
        $$payload.out.push(`<!--]--> <div><div class="text-sm font-medium text-gray-900">${escape_html(offer.title)}</div> `);
        if (offer.description) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div class="text-sm text-gray-500">${escape_html(offer.description.slice(0, 60))}...</div>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></div></div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escape_html(getBranchName(offer))}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">`);
        if (offer.discount_percentage > 0) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`${escape_html(offer.discount_percentage)}% off`);
        } else {
          $$payload.out.push("<!--[!-->");
          if (offer.discount_amount > 0) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`${escape_html(offer.discount_amount)} SAR off`);
          } else {
            $$payload.out.push("<!--[!-->");
            $$payload.out.push(`No discount`);
          }
          $$payload.out.push(`<!--]-->`);
        }
        $$payload.out.push(`<!--]--></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escape_html(formatDate(offer.valid_until))}</td><td class="px-6 py-4 whitespace-nowrap"><span${attr_class(`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stringify(status.color)}`)}>${escape_html(status.label)}</span></td><td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div class="flex items-center justify-end space-x-2"><button class="text-blue-600 hover:text-blue-800 transition-colors p-1" title="Edit Offer">✏️</button> <button class="text-gray-600 hover:text-gray-800 transition-colors p-1"${attr("title", `${stringify(offer.is_active ? "Deactivate" : "Activate")} Offer`)}>${escape_html(offer.is_active ? "🔽" : "🔼")}</button> <button class="text-red-600 hover:text-red-800 transition-colors p-1" title="Delete Offer">🗑️</button></div></td></tr>`);
      }
      $$payload.out.push(`<!--]--></tbody></table></div> `);
      if (totalPages > 1) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6"><div class="flex items-center justify-between"><div class="flex items-center text-sm text-gray-700">Showing ${escape_html((currentPage - 1) * itemsPerPage + 1)} to ${escape_html(Math.min(currentPage * itemsPerPage, totalOffers))} of ${escape_html(totalOffers)} offers</div> <div class="flex items-center space-x-2"><button${attr("disabled", !hasPrevPage, true)} class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors">Previous</button> <span class="px-4 py-2 text-sm text-gray-700">Page ${escape_html(currentPage)} of ${escape_html(totalPages)}</span> <button${attr("disabled", !hasNextPage, true)} class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors">Next</button></div></div></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (message) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="fixed top-4 right-4 z-50 max-w-sm"><div${attr_class(`rounded-lg p-4 shadow-lg ${stringify(messageType === "success" ? "bg-green-500" : "bg-red-500")} text-white`)}>${escape_html(message)}</div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
export {
  _page as default
};
