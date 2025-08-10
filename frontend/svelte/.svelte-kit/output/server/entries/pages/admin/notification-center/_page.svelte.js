import { P as ensure_array_like, K as escape_html, R as maybe_selected, I as attr, G as attr_class, J as stringify, D as pop, z as push } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let notifications = [];
  let selectedType = "";
  let selectedStatus = "";
  let searchTerm = "";
  let totalNotifications = 0;
  let unreadCount = 0;
  let notificationsByType = {};
  const notificationTypes = [
    {
      value: "upgrade",
      label: "Card Upgrades",
      icon: "⬆️",
      color: "blue"
    },
    {
      value: "expiry",
      label: "Expiry Warnings",
      icon: "⏰",
      color: "yellow"
    },
    {
      value: "gift_claim",
      label: "Gift Claims",
      icon: "🎁",
      color: "green"
    },
    {
      value: "reward_assigned",
      label: "Reward Assignments",
      icon: "🏆",
      color: "purple"
    },
    {
      value: "system",
      label: "System Messages",
      icon: "🔔",
      color: "gray"
    }
  ];
  function getTypeConfig(type) {
    return notificationTypes.find((t) => t.value === type) || notificationTypes[4];
  }
  function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = /* @__PURE__ */ new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1e3);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592e3) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
  const each_array = ensure_array_like(notificationTypes);
  $$payload.out.push(`<div class="p-6"><div class="max-w-7xl mx-auto"><div class="mb-8"><div class="flex justify-between items-center"><div><h1 class="text-3xl font-bold text-gray-900 mb-2">Notification Center</h1> <p class="text-gray-600">Manage system notifications and alerts.</p></div> <div class="flex space-x-3"><button class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm">Mark All Read</button> <button class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">Clear All</button> <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">+ Create Notification</button></div></div></div> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-blue-600 mr-4">🔔</div> <div><p class="text-sm font-medium text-gray-500">Total Notifications</p> <p class="text-2xl font-bold text-gray-900">${escape_html(totalNotifications)}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-red-600 mr-4">🔴</div> <div><p class="text-sm font-medium text-gray-500">Unread</p> <p class="text-2xl font-bold text-gray-900">${escape_html(unreadCount)}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-green-600 mr-4">✅</div> <div><p class="text-sm font-medium text-gray-500">Read</p> <p class="text-2xl font-bold text-gray-900">${escape_html(totalNotifications - unreadCount)}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-purple-600 mr-4">📊</div> <div><p class="text-sm font-medium text-gray-500">Most Common</p> <p class="text-sm font-bold text-gray-900">${escape_html(Object.keys(notificationsByType).length > 0 ? Object.entries(notificationsByType).sort(([, a], [, b]) => b - a)[0][0] : "None")}</p></div></div></div></div> <div class="bg-white rounded-lg shadow p-6 mb-6"><h2 class="text-lg font-semibold mb-4">Filters</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">Type</label> <select class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedType;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>All Types</option><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let type = each_array[$$index];
    $$payload.out.push(`<option${attr("value", type.value)}${maybe_selected($$payload, type.value)}>${escape_html(type.icon)} ${escape_html(type.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Status</label> <select class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedStatus;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>All Status</option><option value="unread"${maybe_selected($$payload, "unread")}>Unread</option><option value="read"${maybe_selected($$payload, "read")}>Read</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Search</label> <input type="text"${attr("value", searchTerm)} placeholder="Search messages..." class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div></div> <div class="flex gap-4"><button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Apply Filters</button> <button class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">Clear Filters</button></div></div> <div class="bg-white rounded-lg shadow overflow-hidden"><div class="px-6 py-4 border-b border-gray-200"><h2 class="text-lg font-semibold">Notifications (${escape_html(notifications.length)})</h2></div> `);
  {
    $$payload.out.push("<!--[!-->");
    if (notifications.length === 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="p-8 text-center text-gray-500">No notifications found matching your criteria.</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      const each_array_1 = ensure_array_like(notifications);
      $$payload.out.push(`<div class="divide-y divide-gray-200"><!--[-->`);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let notification = each_array_1[$$index_1];
        const typeConfig = getTypeConfig(notification.type);
        $$payload.out.push(`<div${attr_class(`p-6 hover:bg-gray-50 ${stringify(!notification.read_at ? "bg-blue-50 border-l-4 border-blue-400" : "")}`)}><div class="flex items-start justify-between"><div class="flex items-start space-x-4"><div class="text-2xl">${escape_html(typeConfig.icon)}</div> <div class="flex-1"><div class="flex items-center space-x-2 mb-1"><span${attr_class(`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${stringify(typeConfig.color)}-100 text-${stringify(typeConfig.color)}-800`)}>${escape_html(typeConfig.label)}</span> `);
        if (!notification.read_at) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<span class="w-2 h-2 bg-blue-600 rounded-full"></span>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></div> <p class="text-gray-900 mb-2">${escape_html(notification.message)}</p> <div class="flex items-center space-x-4 text-sm text-gray-500"><span>${escape_html(formatTimeAgo(notification.created_at))}</span> `);
        if (notification.visible_to_user) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<span>• To: ${escape_html(notification.visible_to_user.name)}</span>`);
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<span>• To: All Admins</span>`);
        }
        $$payload.out.push(`<!--]--> `);
        if (notification.read_at) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<span>• Read ${escape_html(formatTimeAgo(notification.read_at))}</span>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></div></div></div> <div class="flex items-center space-x-2">`);
        if (notification.read_at) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<button class="text-blue-600 hover:text-blue-800 text-sm font-medium">Mark Unread</button>`);
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<button class="text-green-600 hover:text-green-800 text-sm font-medium">Mark Read</button>`);
        }
        $$payload.out.push(`<!--]--> <button class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button></div></div></div>`);
      }
      $$payload.out.push(`<!--]--></div>`);
    }
    $$payload.out.push(`<!--]-->`);
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
  $$payload.out.push(`<!--]--></div></div>`);
  pop();
}
export {
  _page as default
};
