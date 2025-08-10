import { G as attr_class, K as escape_html, I as attr, D as pop, z as push } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/state.svelte.js";
function _page($$payload, $$props) {
  push();
  let t;
  let currentLang = "en";
  let email = "";
  let password = "";
  let isLoading = false;
  const translations = {
    en: {
      title: "User Panel Login",
      subtitle: "Secure login for authorized users only",
      email: "Email",
      password: "Password",
      signIn: "Sign In",
      forgotPassword: "Forgot Password?",
      loading: "Signing in...",
      invalidCredentials: "Invalid credentials. Access denied.",
      accountInactive: "Account is inactive. Contact Master User.",
      emailPlaceholder: "Enter your user email",
      passwordPlaceholder: "Enter your password",
      accessDenied: "Access denied. Unauthorized user.",
      masterAdminAccess: "Master User Access",
      branchAdminAccess: "Branch User Access",
      supportAgentAccess: "Support Agent Access",
      uploaderAccess: "Uploader Access",
      securityNotice: "This is a secure area. All access attempts are logged.",
      customerLogin: "Customer Login",
      backToCustomer: "Back to Customer Login",
      createAdminAccount: "Create User Account",
      onlyMasterAdmin: "Only Master User can create accounts",
      newAdminRegistration: "New User Registration",
      adminName: "User Name",
      adminEmail: "User Email",
      adminPassword: "User Password",
      confirmPassword: "Confirm Password",
      nationalId: "National ID / Resident ID",
      whatsappNumber: "WhatsApp Number",
      adminRole: "User Role",
      adminBranch: "User Branch (if applicable)",
      createAccount: "Create Account",
      backToLogin: "Back to Login",
      namePlaceholder: "Enter user full name",
      newEmailPlaceholder: "Enter user email address",
      newPasswordPlaceholder: "Create a strong password",
      confirmPasswordPlaceholder: "Re-enter your password",
      nationalIdPlaceholder: "Enter National ID or Resident ID",
      whatsappPlaceholder: "Enter WhatsApp number (e.g., +966XXXXXXXXX)",
      branchPlaceholder: "Enter branch name (for branch users)",
      registrationSuccess: "User account created successfully!",
      masterAdminRole: "Master User",
      branchAdminRole: "Branch User",
      supportAgentRole: "Support Agent",
      uploaderRole: "Uploader"
    },
    ar: {
      title: "تسجيل دخول لوحة المستخدم",
      subtitle: "تسجيل دخول آمن للمستخدمين المصرح لهم فقط",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      signIn: "تسجيل الدخول",
      forgotPassword: "نسيت كلمة المرور؟",
      loading: "جاري تسجيل الدخول...",
      invalidCredentials: "بيانات اعتماد غير صحيحة. تم رفض الوصول.",
      accountInactive: "الحساب غير نشط. اتصل بالمستخدم الرئيسي.",
      emailPlaceholder: "أدخل بريد المستخدم الإلكتروني",
      passwordPlaceholder: "أدخل كلمة المرور",
      accessDenied: "تم رفض الوصول. مستخدم غير مصرح.",
      masterAdminAccess: "وصول المستخدم الرئيسي",
      branchAdminAccess: "وصول مستخدم الفرع",
      supportAgentAccess: "وصول وكيل الدعم",
      uploaderAccess: "وصول المحمل",
      securityNotice: "هذه منطقة آمنة. يتم تسجيل جميع محاولات الوصول.",
      customerLogin: "دخول العملاء",
      backToCustomer: "العودة لدخول العملاء",
      createAdminAccount: "إنشاء حساب مستخدم",
      onlyMasterAdmin: "فقط المستخدم الرئيسي يمكنه إنشاء الحسابات",
      newAdminRegistration: "تسجيل مستخدم جديد",
      adminName: "اسم المستخدم",
      adminEmail: "بريد المستخدم الإلكتروني",
      adminPassword: "كلمة مرور المستخدم",
      confirmPassword: "تأكيد كلمة المرور",
      nationalId: "الهوية الوطنية / هوية المقيم",
      whatsappNumber: "رقم الواتساب",
      adminRole: "دور المستخدم",
      adminBranch: "فرع المستخدم (إن وجد)",
      createAccount: "إنشاء الحساب",
      backToLogin: "العودة لتسجيل الدخول",
      namePlaceholder: "أدخل الاسم الكامل للمستخدم",
      newEmailPlaceholder: "أدخل عنوان البريد الإلكتروني للمستخدم",
      newPasswordPlaceholder: "إنشاء كلمة مرور قوية",
      confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
      nationalIdPlaceholder: "أدخل الهوية الوطنية أو هوية المقيم",
      whatsappPlaceholder: "أدخل رقم الواتساب (مثال: +966XXXXXXXXX)",
      branchPlaceholder: "أدخل اسم الفرع (لمستخدمي الفروع)",
      registrationSuccess: "تم إنشاء حساب المستخدم بنجاح!",
      masterAdminRole: "مستخدم رئيسي",
      branchAdminRole: "مستخدم فرع",
      supportAgentRole: "وكيل دعم",
      uploaderRole: "محمل"
    }
  };
  t = translations[currentLang];
  $$payload.out.push(`<div${attr_class("min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center p-4 svelte-m674pr", void 0, { "rtl": currentLang === "ar" })}><div class="max-w-md w-full space-y-8"><div class="flex justify-end"><button class="bg-white bg-opacity-10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm hover:bg-opacity-20 transition-all">${escape_html("عربي")}</button></div> <div class="bg-white rounded-2xl shadow-2xl p-8 space-y-6">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class("text-center", void 0, { "text-right": currentLang === "ar" })}><div class="flex justify-center mb-4"><div class="w-16 h-16 bg-gradient-to-r from-gray-800 to-blue-800 rounded-full flex items-center justify-center"><span class="text-white text-2xl">🔐</span></div></div> <h1 class="text-2xl font-bold text-gray-900">${escape_html(t.title)}</h1> <p class="text-gray-600 mt-2 text-sm">${escape_html(t.subtitle)}</p></div> <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3"><div class="flex"><div class="flex-shrink-0"><span class="text-yellow-400">⚠️</span></div> <div${attr_class("ml-3", void 0, { "ml-0": currentLang === "ar", "mr-3": currentLang === "ar" })}><p${attr_class("text-sm text-yellow-700", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.securityNotice)}</p></div></div></div> <form class="space-y-4"><div><label for="email"${attr_class("block text-sm font-medium text-gray-700 mb-2", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.email)}</label> <input id="email"${attr("value", email)} type="text"${attr("placeholder", t.emailPlaceholder)}${attr_class("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50 svelte-m674pr", void 0, { "text-right": currentLang === "ar" })} required autocomplete="email"/></div> <div><label for="password"${attr_class("block text-sm font-medium text-gray-700 mb-2", void 0, { "text-right": currentLang === "ar" })}>${escape_html(t.password)}</label> <input id="password"${attr("value", password)} type="password"${attr("placeholder", t.passwordPlaceholder)}${attr_class("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50 svelte-m674pr", void 0, { "text-right": currentLang === "ar" })} required autocomplete="current-password"/></div> `);
    {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <button type="submit"${attr("disabled", isLoading, true)} class="w-full bg-gradient-to-r from-gray-800 to-blue-800 text-white py-3 px-4 rounded-lg font-semibold hover:from-gray-900 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all">`);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`${escape_html(t.signIn)}`);
    }
    $$payload.out.push(`<!--]--></button></form> <div class="text-center"><button class="text-blue-600 hover:text-blue-800 text-sm font-medium underline">${escape_html(t.forgotPassword)}</button></div> <div class="relative"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-300"></div></div> <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-500">or</span></div></div> <button class="w-full flex items-center justify-center gap-2 py-2 px-4 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-green-700 hover:text-green-800"><span>➕</span> <span class="text-sm">${escape_html(t.createAdminAccount)}</span></button> <p class="text-xs text-center text-gray-500">${escape_html(t.onlyMasterAdmin)}</p> <div class="bg-gray-50 rounded-lg p-4"><h3${attr_class("text-sm font-semibold text-gray-700 mb-2", void 0, { "text-right": currentLang === "ar" })}>User Roles:</h3> <div${attr_class("space-y-1 text-xs text-gray-600", void 0, { "text-right": currentLang === "ar" })}><div${attr_class("flex items-center gap-2 svelte-m674pr", void 0, { "flex-row-reverse": currentLang === "ar" })}><span class="w-2 h-2 bg-red-500 rounded-full"></span> <span>${escape_html(t.masterAdminAccess)} - Full Control</span></div> <div${attr_class("flex items-center gap-2 svelte-m674pr", void 0, { "flex-row-reverse": currentLang === "ar" })}><span class="w-2 h-2 bg-blue-500 rounded-full"></span> <span>${escape_html(t.branchAdminAccess)} - Branch Data</span></div> <div${attr_class("flex items-center gap-2 svelte-m674pr", void 0, { "flex-row-reverse": currentLang === "ar" })}><span class="w-2 h-2 bg-green-500 rounded-full"></span> <span>${escape_html(t.supportAgentAccess)} - Customer Support</span></div> <div${attr_class("flex items-center gap-2 svelte-m674pr", void 0, { "flex-row-reverse": currentLang === "ar" })}><span class="w-2 h-2 bg-yellow-500 rounded-full"></span> <span>${escape_html(t.uploaderAccess)} - File Uploads</span></div></div></div> <div class="relative"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-300"></div></div> <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-500">or</span></div></div> <button class="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"><span>👤</span> <span class="text-sm">${escape_html(t.customerLogin)}</span></button>`);
  }
  $$payload.out.push(`<!--]--></div> <div class="text-center text-sm text-white opacity-75"><p>© 2024 Urban Market User Panel</p> <p class="text-xs mt-1">Secure User Access Only</p></div></div></div>`);
  pop();
}
export {
  _page as default
};
