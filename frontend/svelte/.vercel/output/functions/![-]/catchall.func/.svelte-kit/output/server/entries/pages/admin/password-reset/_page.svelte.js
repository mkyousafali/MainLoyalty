import { P as ensure_array_like, G as attr_class, K as escape_html, R as maybe_selected, I as attr, J as stringify } from "../../../../chunks/index.js";
function _page($$payload) {
  let t;
  let currentLang = "en";
  let selectedUsers = [];
  let bulkAction = "";
  let users = [
    {
      id: 1,
      name: "Ahmed Hassan",
      email: "ahmed@company.com",
      role: "Admin",
      status: "Active",
      branch: "Main Branch"
    },
    {
      id: 2,
      name: "Sarah Ali",
      email: "sarah@company.com",
      role: "Manager",
      status: "Active",
      branch: "Branch 2"
    },
    {
      id: 3,
      name: "Omar Mohammed",
      email: "omar@company.com",
      role: "Employee",
      status: "Blocked",
      branch: "Branch 3"
    },
    {
      id: 4,
      name: "Fatima Ibrahim",
      email: "fatima@company.com",
      role: "Employee",
      status: "Active",
      branch: "Main Branch"
    }
  ];
  const translations = {
    en: {
      passwordReset: "Password Reset & User Control",
      backToAdmin: "Back to Admin",
      selectUsers: "Select users to reset passwords",
      bulkActions: "Bulk Actions",
      resetSelected: "Reset Selected Passwords",
      blockSelected: "Block Selected Users",
      activateSelected: "Activate Selected Users",
      selectAll: "Select All",
      clearSelection: "Clear Selection",
      name: "Name",
      email: "Email",
      role: "Role",
      status: "Status",
      branch: "Branch",
      lastPasswordReset: "Last Password Reset",
      action: "Action",
      resetPassword: "Reset Password",
      active: "Active",
      blocked: "Blocked",
      admin: "Admin",
      manager: "Manager",
      employee: "Employee",
      confirmBulkReset: "Confirm Bulk Password Reset",
      bulkResetWarning: "Are you sure you want to reset passwords for selected users?",
      usersSelected: "users selected",
      proceed: "Proceed",
      cancel: "Cancel"
    },
    ar: {
      passwordReset: "إعادة تعيين كلمات المرور وتحكم المستخدمين",
      backToAdmin: "العودة للإدارة",
      selectUsers: "اختر المستخدمين لإعادة تعيين كلمات المرور",
      bulkActions: "الإجراءات المجمعة",
      resetSelected: "إعادة تعيين كلمات المرور المحددة",
      blockSelected: "حظر المستخدمين المحددين",
      activateSelected: "تفعيل المستخدمين المحددين",
      selectAll: "تحديد الكل",
      clearSelection: "مسح التحديد",
      name: "الاسم",
      email: "البريد الإلكتروني",
      role: "الدور",
      status: "الحالة",
      branch: "الفرع",
      lastPasswordReset: "آخر إعادة تعيين كلمة مرور",
      action: "الإجراء",
      resetPassword: "إعادة تعيين كلمة المرور",
      active: "نشط",
      blocked: "محظور",
      admin: "مدير",
      manager: "مشرف",
      employee: "موظف",
      confirmBulkReset: "تأكيد إعادة تعيين كلمات المرور المجمعة",
      bulkResetWarning: "هل أنت متأكد من إعادة تعيين كلمات المرور للمستخدمين المحددين؟",
      usersSelected: "مستخدم محدد",
      proceed: "متابعة",
      cancel: "إلغاء"
    }
  };
  function getStatusColor(status) {
    return status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  }
  function getRoleColor(role) {
    const colors = {
      "Admin": "bg-purple-100 text-purple-800",
      "Manager": "bg-blue-100 text-blue-800",
      "Employee": "bg-gray-100 text-gray-800"
    };
    return colors[role] || colors["Employee"];
  }
  t = translations[currentLang];
  const each_array = ensure_array_like(users);
  $$payload.out.push(`<div${attr_class("min-h-screen bg-[#f6f8fb] p-6 svelte-cfm7uc", void 0, { "rtl": currentLang === "ar" })}><div class="flex justify-between items-center mb-6 svelte-cfm7uc"><div><h1${attr_class("text-3xl font-bold text-gray-900 mb-2", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.passwordReset)}</h1> <p${attr_class("text-gray-600", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.selectUsers)}</p></div></div> `);
  if (selectedUsers.length > 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"><div${attr_class("flex items-center justify-between svelte-cfm7uc", void 0, { "flex-row-reverse": currentLang === "ar" })}><div${attr_class("flex items-center gap-4 svelte-cfm7uc", void 0, { "flex-row-reverse": currentLang === "ar" })}><span class="text-blue-800 font-semibold">${escape_html(selectedUsers.length)} ${escape_html(t.usersSelected)}</span> <select class="px-3 py-2 border border-blue-300 rounded-lg bg-white">`);
    $$payload.select_value = bulkAction;
    $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>${escape_html(t.bulkActions)}</option><option value="reset"${maybe_selected($$payload, "reset")}>${escape_html(t.resetSelected)}</option><option value="block"${maybe_selected($$payload, "block")}>${escape_html(t.blockSelected)}</option><option value="activate"${maybe_selected($$payload, "activate")}>${escape_html(t.activateSelected)}</option>`);
    $$payload.select_value = void 0;
    $$payload.out.push(`</select> <button${attr("disabled", !bulkAction, true)} class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed svelte-cfm7uc">${escape_html(t.proceed)}</button></div> <button class="text-blue-600 hover:text-blue-800 underline svelte-cfm7uc">${escape_html(t.clearSelection)}</button></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="bg-white rounded-lg shadow p-4 mb-6"><div${attr_class("flex gap-4 svelte-cfm7uc", void 0, { "flex-row-reverse": currentLang === "ar" })}><button class="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition svelte-cfm7uc">${escape_html(t.selectAll)}</button> <button class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition svelte-cfm7uc">${escape_html(t.clearSelection)}</button></div></div> <div class="bg-white rounded-lg shadow overflow-hidden"><div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200 svelte-cfm7uc"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><input type="checkbox"${attr("checked", selectedUsers.length === users.length, true)} class="rounded border-gray-300"/></th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.name)}</th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.email)}</th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.role)}</th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.status)}</th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.branch)}</th><th${attr_class("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.action)}</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let user = each_array[$$index];
    $$payload.out.push(`<tr${attr_class("hover:bg-gray-50", void 0, { "bg-blue-50": selectedUsers.includes(user.id) })}><td class="px-6 py-4 whitespace-nowrap"><input type="checkbox"${attr("checked", selectedUsers.includes(user.id), true)} class="rounded border-gray-300"/></td><td${attr_class("px-6 py-4 whitespace-nowrap", void 0, { "text-right": currentLang === "ar" })}><div class="text-sm font-medium text-gray-900">${escape_html(user.name)}</div></td><td${attr_class("px-6 py-4 whitespace-nowrap", void 0, { "text-right": currentLang === "ar" })}><div class="text-sm text-gray-500">${escape_html(user.email)}</div></td><td${attr_class("px-6 py-4 whitespace-nowrap", void 0, { "text-right": currentLang === "ar" })}><span${attr_class(`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stringify(getRoleColor(user.role))}`, "svelte-cfm7uc")}>${escape_html(user.role)}</span></td><td${attr_class("px-6 py-4 whitespace-nowrap", void 0, { "text-right": currentLang === "ar" })}><span${attr_class(`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stringify(getStatusColor(user.status))}`, "svelte-cfm7uc")}>${escape_html(user.status === "Active" ? t.active : t.blocked)}</span></td><td${attr_class("px-6 py-4 whitespace-nowrap text-sm text-gray-500", void 0, { "text-right": currentLang === "ar" })}>${escape_html(user.branch)}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium"><button class="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition flex items-center gap-2 svelte-cfm7uc"><span>🔑</span> <span>${escape_html(t.resetPassword)}</span></button></td></tr>`);
  }
  $$payload.out.push(`<!--]--></tbody></table></div></div></div>`);
}
export {
  _page as default
};
