import { P as ensure_array_like, G as attr_class, K as escape_html, R as maybe_selected, J as stringify, D as pop, z as push } from "../../../../chunks/index.js";
function _page($$payload, $$props) {
  push();
  let t, filteredActivities, stats;
  let currentLang = "en";
  let selectedDateRange = "week";
  let selectedUser = "all";
  let selectedAction = "all";
  let userActivities = [
    {
      id: 1,
      user: "Ahmed Hassan",
      action: "Login",
      timestamp: "2024-01-15 10:30:45",
      ip: "192.168.1.100",
      details: "Successful login from main branch",
      category: "Authentication"
    },
    {
      id: 2,
      user: "Sarah Ali",
      action: "Upload Customers",
      timestamp: "2024-01-15 10:25:12",
      ip: "192.168.1.101",
      details: "Uploaded 25 customer records",
      category: "Data Management"
    },
    {
      id: 3,
      user: "Omar Mohammed",
      action: "Reset Password",
      timestamp: "2024-01-15 09:15:30",
      ip: "192.168.1.102",
      details: "Password reset for user ID: 1234",
      category: "User Management"
    },
    {
      id: 4,
      user: "Fatima Ibrahim",
      action: "View Reports",
      timestamp: "2024-01-15 08:45:20",
      ip: "192.168.1.103",
      details: "Accessed customer analytics dashboard",
      category: "Reporting"
    },
    {
      id: 5,
      user: "Ahmed Hassan",
      action: "Manage Branches",
      timestamp: "2024-01-14 16:20:15",
      ip: "192.168.1.100",
      details: "Created new branch: Downtown Location",
      category: "Branch Management"
    },
    {
      id: 6,
      user: "Sarah Ali",
      action: "Block User",
      timestamp: "2024-01-14 15:10:08",
      ip: "192.168.1.101",
      details: "Blocked user account: omar@company.com",
      category: "User Management"
    },
    {
      id: 7,
      user: "Ahmed Hassan",
      action: "Export Data",
      timestamp: "2024-01-14 14:30:45",
      ip: "192.168.1.100",
      details: "Exported transaction data for Q4 2023",
      category: "Data Management"
    },
    {
      id: 8,
      user: "Fatima Ibrahim",
      action: "Login Failed",
      timestamp: "2024-01-14 11:20:12",
      ip: "192.168.1.103",
      details: "Failed login attempt - incorrect password",
      category: "Authentication"
    }
  ];
  const translations = {
    en: {
      userActionReports: "User Action Reports & Activity Logs",
      backToAdmin: "Back to Admin",
      activityFilters: "Activity Filters",
      dateRange: "Date Range",
      today: "Today",
      week: "This Week",
      month: "This Month",
      quarter: "This Quarter",
      year: "This Year",
      custom: "Custom Range",
      user: "User",
      allUsers: "All Users",
      actionType: "Action Type",
      allActions: "All Actions",
      exportReport: "Export Report",
      totalActivities: "Total Activities",
      uniqueUsers: "Unique Users",
      failedAttempts: "Failed Attempts",
      successfulActions: "Successful Actions",
      timestamp: "Timestamp",
      userColumn: "User",
      action: "Action",
      ipAddress: "IP Address",
      details: "Details",
      category: "Category",
      authentication: "Authentication",
      dataManagement: "Data Management",
      userManagement: "User Management",
      reporting: "Reporting",
      branchManagement: "Branch Management",
      systemAdmin: "System Administration",
      refreshData: "Refresh Data"
    },
    ar: {
      userActionReports: "تقارير أنشطة المستخدمين وسجلات الأنشطة",
      backToAdmin: "العودة للإدارة",
      activityFilters: "مرشحات الأنشطة",
      dateRange: "النطاق الزمني",
      today: "اليوم",
      week: "هذا الأسبوع",
      month: "هذا الشهر",
      quarter: "هذا الربع",
      year: "هذا العام",
      custom: "نطاق مخصص",
      user: "المستخدم",
      allUsers: "جميع المستخدمين",
      actionType: "نوع النشاط",
      allActions: "جميع الأنشطة",
      exportReport: "تصدير التقرير",
      totalActivities: "إجمالي الأنشطة",
      uniqueUsers: "المستخدمين الفريدين",
      failedAttempts: "المحاولات الفاشلة",
      successfulActions: "الأنشطة الناجحة",
      timestamp: "الوقت والتاريخ",
      userColumn: "المستخدم",
      action: "النشاط",
      ipAddress: "عنوان IP",
      details: "التفاصيل",
      category: "الفئة",
      authentication: "المصادقة",
      dataManagement: "إدارة البيانات",
      userManagement: "إدارة المستخدمين",
      reporting: "التقارير",
      branchManagement: "إدارة الفروع",
      systemAdmin: "إدارة النظام",
      refreshData: "تحديث البيانات"
    }
  };
  function getCategoryColor(category) {
    const colors = {
      "Authentication": "bg-blue-100 text-blue-800",
      "Data Management": "bg-green-100 text-green-800",
      "User Management": "bg-purple-100 text-purple-800",
      "Reporting": "bg-yellow-100 text-yellow-800",
      "Branch Management": "bg-red-100 text-red-800",
      "System Administration": "bg-gray-100 text-gray-800"
    };
    return colors[category] || colors["System Administration"];
  }
  function getActionStatus(action) {
    return action.includes("Failed") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
  }
  t = translations[currentLang];
  filteredActivities = userActivities.filter((activity) => {
    let matchesAction = selectedAction === "all";
    return matchesAction;
  });
  stats = {
    total: filteredActivities.length,
    uniqueUsers: new Set(filteredActivities.map((a) => a.user)).size,
    failed: filteredActivities.filter((a) => a.action.includes("Failed")).length,
    successful: filteredActivities.filter((a) => !a.action.includes("Failed")).length
  };
  const each_array = ensure_array_like(
    // Implement export functionality
    // Implement data refresh
    filteredActivities
  );
  $$payload.out.push(`<div${attr_class("min-h-screen bg-[#f6f8fb] p-6 svelte-cfm7uc", void 0, { "rtl": currentLang === "ar" })}><div class="flex justify-between items-center mb-6 svelte-cfm7uc"><div><h1${attr_class("text-3xl font-bold text-gray-900 mb-2", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.userActionReports)}</h1></div></div> <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"><div class="bg-white rounded-lg shadow p-6"><div${attr_class("flex items-center svelte-cfm7uc", void 0, { "flex-row-reverse": currentLang === "ar" })}><div class="flex-shrink-0"><div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center svelte-cfm7uc"><span class="text-lg">📊</span></div></div> <div${attr_class("ml-4", void 0, { "ml-0": currentLang === "ar", "mr-4": currentLang === "ar" })}><p${attr_class("text-sm font-medium text-gray-600", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.totalActivities)}</p> <p${attr_class("text-2xl font-semibold text-gray-900", void 0, { "text-right": currentLang === "ar" })}>${escape_html(stats.total)}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div${attr_class("flex items-center svelte-cfm7uc", void 0, { "flex-row-reverse": currentLang === "ar" })}><div class="flex-shrink-0"><div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center svelte-cfm7uc"><span class="text-lg">👥</span></div></div> <div${attr_class("ml-4", void 0, { "ml-0": currentLang === "ar", "mr-4": currentLang === "ar" })}><p${attr_class("text-sm font-medium text-gray-600", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.uniqueUsers)}</p> <p${attr_class("text-2xl font-semibold text-gray-900", void 0, { "text-right": currentLang === "ar" })}>${escape_html(stats.uniqueUsers)}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div${attr_class("flex items-center svelte-cfm7uc", void 0, { "flex-row-reverse": currentLang === "ar" })}><div class="flex-shrink-0"><div class="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center svelte-cfm7uc"><span class="text-lg">❌</span></div></div> <div${attr_class("ml-4", void 0, { "ml-0": currentLang === "ar", "mr-4": currentLang === "ar" })}><p${attr_class("text-sm font-medium text-gray-600", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.failedAttempts)}</p> <p${attr_class("text-2xl font-semibold text-gray-900", void 0, { "text-right": currentLang === "ar" })}>${escape_html(stats.failed)}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div${attr_class("flex items-center svelte-cfm7uc", void 0, { "flex-row-reverse": currentLang === "ar" })}><div class="flex-shrink-0"><div class="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center svelte-cfm7uc"><span class="text-lg">✅</span></div></div> <div${attr_class("ml-4", void 0, { "ml-0": currentLang === "ar", "mr-4": currentLang === "ar" })}><p${attr_class("text-sm font-medium text-gray-600", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.successfulActions)}</p> <p${attr_class("text-2xl font-semibold text-gray-900", void 0, { "text-right": currentLang === "ar" })}>${escape_html(stats.successful)}</p></div></div></div></div> <div class="bg-white rounded-lg shadow p-6 mb-6"><h3${attr_class("text-lg font-semibold mb-4", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.activityFilters)}</h3> <div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div><label${attr_class("block text-sm font-medium text-gray-700 mb-2", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.dateRange)}</label> <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedDateRange;
  $$payload.out.push(`<option value="today"${maybe_selected($$payload, "today")}>${escape_html(t.today)}</option><option value="week"${maybe_selected($$payload, "week")}>${escape_html(t.week)}</option><option value="month"${maybe_selected($$payload, "month")}>${escape_html(t.month)}</option><option value="quarter"${maybe_selected($$payload, "quarter")}>${escape_html(t.quarter)}</option><option value="year"${maybe_selected($$payload, "year")}>${escape_html(t.year)}</option><option value="custom"${maybe_selected($$payload, "custom")}>${escape_html(t.custom)}</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label${attr_class("block text-sm font-medium text-gray-700 mb-2", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.user)}</label> <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedUser;
  $$payload.out.push(`<option value="all"${maybe_selected($$payload, "all")}>${escape_html(t.allUsers)}</option><option value="Ahmed Hassan"${maybe_selected($$payload, "Ahmed Hassan")}>Ahmed Hassan</option><option value="Sarah Ali"${maybe_selected($$payload, "Sarah Ali")}>Sarah Ali</option><option value="Omar Mohammed"${maybe_selected($$payload, "Omar Mohammed")}>Omar Mohammed</option><option value="Fatima Ibrahim"${maybe_selected($$payload, "Fatima Ibrahim")}>Fatima Ibrahim</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label${attr_class("block text-sm font-medium text-gray-700 mb-2", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.actionType)}</label> <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedAction;
  $$payload.out.push(`<option value="all"${maybe_selected($$payload, "all")}>${escape_html(t.allActions)}</option><option value="Authentication"${maybe_selected($$payload, "Authentication")}>${escape_html(t.authentication)}</option><option value="Data Management"${maybe_selected($$payload, "Data Management")}>${escape_html(t.dataManagement)}</option><option value="User Management"${maybe_selected($$payload, "User Management")}>${escape_html(t.userManagement)}</option><option value="Reporting"${maybe_selected($$payload, "Reporting")}>${escape_html(t.reporting)}</option><option value="Branch Management"${maybe_selected($$payload, "Branch Management")}>${escape_html(t.branchManagement)}</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div class="flex items-end gap-2 svelte-cfm7uc"><button class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2 svelte-cfm7uc"><span>📊</span> <span>${escape_html(t.exportReport)}</span></button> <button class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition svelte-cfm7uc"><span>🔄</span></button></div></div></div> <div class="bg-white rounded-lg shadow overflow-hidden"><div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200 svelte-cfm7uc"><thead class="bg-gray-50"><tr><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.timestamp)}</th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.userColumn)}</th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.action)}</th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.category)}</th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.ipAddress)}</th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.details)}</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let activity = each_array[$$index];
    $$payload.out.push(`<tr class="hover:bg-gray-50"><td${attr_class("px-6 py-4 whitespace-nowrap text-sm text-gray-900", void 0, { "text-right": currentLang === "ar" })}>${escape_html(activity.timestamp)}</td><td${attr_class("px-6 py-4 whitespace-nowrap", void 0, { "text-right": currentLang === "ar" })}><div class="text-sm font-medium text-gray-900">${escape_html(activity.user)}</div></td><td${attr_class("px-6 py-4 whitespace-nowrap", void 0, { "text-right": currentLang === "ar" })}><span${attr_class(`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stringify(getActionStatus(activity.action))}`, "svelte-cfm7uc")}>${escape_html(activity.action)}</span></td><td${attr_class("px-6 py-4 whitespace-nowrap", void 0, { "text-right": currentLang === "ar" })}><span${attr_class(`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stringify(getCategoryColor(activity.category))}`, "svelte-cfm7uc")}>${escape_html(activity.category)}</span></td><td${attr_class("px-6 py-4 whitespace-nowrap text-sm text-gray-500", void 0, { "text-right": currentLang === "ar" })}>${escape_html(activity.ip)}</td><td${attr_class("px-6 py-4 text-sm text-gray-500", void 0, { "text-right": currentLang === "ar" })}>${escape_html(activity.details)}</td></tr>`);
  }
  $$payload.out.push(`<!--]--></tbody></table></div></div></div>`);
  pop();
}
export {
  _page as default
};
