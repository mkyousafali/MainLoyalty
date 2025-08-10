import "clsx";
import { D as pop, z as push } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let t;
  let currentLang = "en";
  let sectionStates = {
    branchCustomer: false,
    transactionsRewards: false,
    cardCoupon: false,
    supportComm: false,
    reportsData: false,
    userControl: false
  };
  const translations = {
    en: {
      adminDashboard: "Admin Dashboard",
      welcomeMessage: "Welcome to the Urban Market Loyalty Admin Panel",
      dashboard: "Home",
      collapseAll: "Collapse All",
      expandAll: "Expand All",
      totalCustomers: "Total Customers",
      activeCards: "Active Cards",
      rewardsRedeemed: "Rewards Redeemed",
      revenue: "Revenue (﷼)",
      quickActions: "Quick Actions",
      branchCustomerMgmt: "Branch & Customer Management",
      transactionsRewards: "Transactions & Rewards",
      cardCouponControl: "Card & Coupon Control",
      supportCommunication: "Support & Communication",
      reportsData: "Reports & Data",
      userControl: "User Control & Settings",
      uploadCustomers: "Upload Customers",
      importCustomerData: "Import customer data",
      manageBranches: "Manage Branches",
      createBranches: "Create branches with auto transaction tables",
      uploadTransactions: "Upload Transactions",
      bulkUpload: "Bulk upload to branch-specific tables",
      manageCoupons: "Manage Coupons",
      createEditCoupons: "Create and edit coupons",
      viewAnalytics: "View Analytics",
      performanceReports: "Performance reports",
      manageCustomers: "Manage Customers",
      customerDatabase: "Customer database",
      sendNotifications: "Send Notifications",
      customerMessaging: "Customer messaging",
      exportData: "Export Data",
      downloadReports: "Download reports",
      manageUsers: "Manage Users & Employees",
      userManagement: "User management and access control",
      resetPasswords: "Reset Passwords",
      blockActivateUsers: "Block/Activate users and manage permissions",
      userActionReports: "User Action Reports",
      employeeActivityLogs: "Employee activity and audit logs"
    },
    ar: {
      adminDashboard: "لوحة تحكم الإدارة",
      welcomeMessage: "مرحباً بك في لوحة إدارة برنامج الولاء",
      dashboard: "الرئيسية",
      collapseAll: "طي الكل",
      expandAll: "توسيع الكل",
      totalCustomers: "إجمالي العملاء",
      activeCards: "البطاقات النشطة",
      rewardsRedeemed: "المكافآت المستبدلة",
      revenue: "الإيرادات (ريال)",
      quickActions: "الإجراءات السريعة",
      branchCustomerMgmt: "إدارة الفروع والعملاء",
      transactionsRewards: "المعاملات والمكافآت",
      cardCouponControl: "تحكم البطاقات والكوبونات",
      supportCommunication: "الدعم والتواصل",
      reportsData: "التقارير والبيانات",
      userControl: "تحكم المستخدمين والإعدادات",
      uploadCustomers: "رفع العملاء",
      importCustomerData: "استيراد بيانات العملاء",
      manageBranches: "إدارة الفروع",
      createBranches: "إنشاء فروع مع جداول المعاملات التلقائية",
      uploadTransactions: "رفع المعاملات",
      bulkUpload: "رفع مجمع لجداول الفروع المحددة",
      manageCoupons: "إدارة الكوبونات",
      createEditCoupons: "إنشاء وتعديل الكوبونات",
      viewAnalytics: "عرض التحليلات",
      performanceReports: "تقارير الأداء",
      manageCustomers: "إدارة العملاء",
      customerDatabase: "قاعدة بيانات العملاء",
      sendNotifications: "إرسال الإشعارات",
      customerMessaging: "مراسلة العملاء",
      exportData: "تصدير البيانات",
      downloadReports: "تحميل التقارير",
      manageUsers: "إدارة المستخدمين والموظفين",
      userManagement: "إدارة المستخدمين والتحكم في الصلاحيات",
      resetPasswords: "إعادة تعيين كلمات المرور",
      blockActivateUsers: "حظر/تفعيل المستخدمين وإدارة الصلاحيات",
      userActionReports: "تقارير أنشطة المستخدمين",
      employeeActivityLogs: "سجلات أنشطة الموظفين والمراجعة"
    }
  };
  t = translations[currentLang] || translations.en;
  Object.values(sectionStates).every((state) => state);
  [
    {
      title: t.totalCustomers,
      value: "...",
      icon: "👥",
      color: "blue"
    },
    {
      title: t.activeCards,
      value: "...",
      icon: "💳",
      color: "green"
    },
    {
      title: t.rewardsRedeemed,
      value: "...",
      icon: "🎁",
      color: "red"
    },
    {
      title: t.revenue,
      value: "...",
      icon: "💰",
      color: "yellow"
    }
  ];
  [
    {
      title: t.uploadCustomers,
      desc: t.importCustomerData,
      icon: "👥",
      color: "blue",
      href: "/admin/upload-customers"
    },
    {
      title: t.manageBranches,
      desc: t.createBranches,
      icon: "🏢",
      color: "red",
      href: "/admin/manage-branches"
    },
    {
      title: t.uploadTransactions,
      desc: t.bulkUpload,
      icon: "📊",
      color: "green",
      href: "/admin/upload-transactions"
    },
    {
      title: t.viewAnalytics,
      desc: t.performanceReports,
      icon: "📈",
      color: "purple",
      href: "/admin/analytics-reports"
    },
    {
      title: t.manageCustomers,
      desc: t.customerDatabase,
      icon: "👤",
      color: "green",
      href: "/admin/customer-management"
    },
    {
      title: t.sendNotifications,
      desc: t.customerMessaging,
      icon: "🔔",
      color: "purple",
      href: "/admin/notification-center"
    },
    {
      title: t.exportData,
      desc: t.downloadReports,
      icon: "📤",
      color: "blue",
      href: "/admin/export-data"
    }
  ];
  $$payload.out.push(`<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden"><div class="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none svelte-1dz7lvo"></div> <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div> <div class="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-cyan-400/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div> <div class="relative z-10 p-6 max-w-7xl mx-auto">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex items-center justify-center min-h-screen"><div class="text-center"><div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 svelte-1dz7lvo"></div> <p class="text-gray-600">Checking authentication...</p></div></div>`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  pop();
}
export {
  _page as default
};
