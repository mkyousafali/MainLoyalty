import { I as attr, G as attr_class, K as escape_html, D as pop, z as push, J as stringify } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/supabase.js";
import "../../../chunks/terms.js";
import "../../../chunks/globalSettings.js";
function _page($$payload, $$props) {
  push();
  let isValidMobile, t;
  let currentLang = "en";
  let mobile = "";
  let isLoading = false;
  let pageLoaded = false;
  let whatsappSupportLink = "https://wa.me/966112345678";
  const translations = {
    en: {
      title: "Urban Market Loyalty",
      mobileNumber: "Mobile Number",
      mobilePlaceholder: "05XXXXXXXX",
      checkEligibility: "Check Eligibility",
      loading: "Checking...",
      registrationForm: "Complete Your Registration",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      place: "Place / Area",
      placePlaceholder: "Enter your area or city",
      nearestBranch: "Select Nearest Branch",
      selectBranch: "Choose your preferred branch",
      createCard: "Create My Card",
      enterPassword: "Enter Password",
      confirmPassword: "Confirm Password",
      passwordPlaceholder: "Enter a secure password (min 6 characters)",
      confirmPasswordPlaceholder: "Re-enter your password",
      securityVerification: "Security Verification",
      solveMath: "Solve this math problem:",
      captchaPlaceholder: "Enter your answer",
      refreshCaptcha: "🔄 New Question",
      termsCheckbox: "I have read and agree to the",
      termsAndConditions: "Terms & Conditions",
      welcomeBack: "Welcome Back!",
      enterYourPassword: "Enter your password to continue",
      loginButton: "Login to Dashboard",
      success: "Registration Successful!",
      successMessage: "Your loyalty card has been created successfully.",
      goToDashboard: "Go to Dashboard",
      backToCheck: "Back to Check",
      contactUs: "Contact Us",
      needHelp: "Need help? Contact our support team",
      phone: "Phone",
      email: "Email",
      address: "Address",
      chatWhatsApp: "Chat on WhatsApp",
      readTerms: "Read Terms",
      needHelpLogin: "Need help with login?",
      termsAndConditionsTitle: "Terms and Conditions",
      loadingTerms: "Loading terms...",
      enterPasswordPlaceholder: "Enter your password"
    },
    ar: {
      title: "برنامج ولاء ايربن ماركت",
      mobileNumber: "رقم الجوال",
      mobilePlaceholder: "05XXXXXXXX",
      checkEligibility: "تحقق من الأهلية",
      loading: "جاري التحقق...",
      registrationForm: "أكمل تسجيلك",
      fullName: "الاسم الكامل",
      fullNamePlaceholder: "أدخل اسمك الكامل",
      place: "المكان / المنطقة",
      placePlaceholder: "أدخل منطقتك أو مدينتك",
      nearestBranch: "اختر أقرب فرع",
      selectBranch: "اختر الفرع المفضل لديك",
      createCard: "إنشاء بطاقتي",
      enterPassword: "أدخل كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      passwordPlaceholder: "أدخل كلمة مرور آمنة (6 أحرف على الأقل)",
      confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
      securityVerification: "التحقق الأمني",
      solveMath: "حل هذه المسألة الرياضية:",
      captchaPlaceholder: "أدخل إجابتك",
      refreshCaptcha: "🔄 سؤال جديد",
      termsCheckbox: "لقد قرأت ووافقت على",
      termsAndConditions: "الشروط والأحكام",
      welcomeBack: "مرحباً بعودتك!",
      enterYourPassword: "أدخل كلمة المرور للمتابعة",
      loginButton: "تسجيل الدخول للوحة التحكم",
      success: "تم التسجيل بنجاح!",
      successMessage: "تم إنشاء بطاقة الولاء الخاصة بك بنجاح.",
      goToDashboard: "اذهب إلى لوحة التحكم",
      backToCheck: "العودة للتحقق",
      contactUs: "اتصل بنا",
      needHelp: "تحتاج مساعدة؟ اتصل بفريق الدعم",
      phone: "الهاتف",
      email: "البريد الإلكتروني",
      address: "العنوان",
      chatWhatsApp: "محادثة واتساب",
      readTerms: "اقرأ الشروط",
      needHelpLogin: "تحتاج مساعدة في تسجيل الدخول؟",
      termsAndConditionsTitle: "الشروط والأحكام",
      loadingTerms: "جارٍ تحميل الشروط...",
      enterPasswordPlaceholder: "أدخل كلمة المرور"
    }
  };
  isValidMobile = mobile.length === 10 && mobile.startsWith("05");
  t = translations[currentLang];
  $$payload.out.push(`<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50 flex items-center justify-center p-4"${attr("dir", "ltr")}><div class="w-full max-w-md"><div${attr_class("bg-white rounded-3xl shadow-2xl p-8 transform transition-all duration-700 delay-200", void 0, {
    "translate-y-0": pageLoaded,
    "translate-y-4": !pageLoaded,
    "opacity-100": pageLoaded,
    "opacity-0": !pageLoaded
  })}><div class="flex justify-end mb-6"><div class="flex bg-gray-100 rounded-full p-1 shadow-sm"><button type="button"${attr_class(`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${stringify(
    "bg-white text-gray-900 shadow-md"
  )}`)}>EN</button> <button type="button"${attr_class(`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${stringify("text-gray-500 hover:text-gray-700")}`)}>ع</button></div></div> <div class="text-center mb-10"><div class="mb-6"><img src="/logo.png" alt="Urban Market Logo" class="mx-auto h-24 w-auto mb-6"/></div> <h1 class="text-3xl font-bold text-gray-800 mb-3 tracking-tight">${escape_html(t.title)}</h1></div> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<form class="space-y-8"><div><label class="block text-sm font-semibold text-gray-700 mb-4">${escape_html(t.mobileNumber)}</label> <div class="relative"><div class="absolute inset-y-0 left-0 flex items-center pl-4"><span class="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-full">SA +966</span></div> <input type="tel"${attr("placeholder", t.mobilePlaceholder)}${attr("value", mobile)} class="w-full pl-24 pr-4 py-5 border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all duration-200 text-lg shadow-sm" maxlength="10"/></div></div> <button type="submit"${attr("disabled", !isValidMobile || isLoading, true)} class="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-5 px-6 rounded-3xl font-semibold focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">`);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`${escape_html(t.checkEligibility)} →`);
    }
    $$payload.out.push(`<!--]--></button></form> <div${attr_class("mt-10 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl border border-green-100 transform transition-all duration-500 delay-700", void 0, {
      "opacity-100": pageLoaded,
      "opacity-0": !pageLoaded,
      "translate-y-2": !pageLoaded
    })}><div class="flex items-center gap-3 text-green-700 mb-4"><svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <span class="font-semibold text-base">${escape_html(t.needHelpLogin)}</span></div> <a${attr("href", whatsappSupportLink)} target="_blank" class="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-5 rounded-2xl font-semibold text-center mb-3 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"><div class="flex items-center justify-center gap-3"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"></path></svg> <span>${escape_html(t.chatWhatsApp)}</span></div></a> <button type="button" class="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-5 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"><div class="flex items-center justify-center gap-3"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> <span>${escape_html(t.readTerms)}</span></div></button> `);
    {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
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
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div${attr_class("text-center mt-8 transform transition-all duration-500 delay-300", void 0, {
    "translate-y-0": pageLoaded,
    "translate-y-4": !pageLoaded,
    "opacity-100": pageLoaded,
    "opacity-0": !pageLoaded
  })}><div class="flex justify-center items-center gap-1"><span${attr_class(`text-3xl cursor-pointer hover:scale-125 transition-transform duration-300 select-none ${stringify("")} ${stringify("")}`)} role="button" tabindex="0"${attr("title", "😊")}>`);
  {
    $$payload.out.push("<!--[!-->");
    {
      $$payload.out.push("<!--[!-->");
      {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`😊`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></span></div></div></div></div>`);
  pop();
}
export {
  _page as default
};
