import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Types
type Language = 'en' | 'ar';

interface Translations {
  [key: string]: string;
}

// Language store
export const language = writable<Language>('en');

// Translation store
export const translations: Record<Language, Translations> = {
  en: {
    // Common
    welcome: 'Welcome',
    logout: 'Logout',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    date: 'Date',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',

    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // Dashboard
    dashboard: 'Dashboard',
    selectBranch: 'Select Branch',
    lastUpdated: 'Last updated',
    points: 'Points',
    current: 'Current',
    lifetime: 'Lifetime',
    yourBalance: 'Your Balance',
    availablePoints: 'Available for rewards',
    lifetimeEarned: 'Lifetime Earned',
    totalEarned: 'Total points earned',
    totalAvailable: 'Total available points',
    totalAmountEarned: 'Total amount earned (﷼)',
    filterTransactions: 'Filter Transactions',
    filterNote: 'This filters the transaction list below. Your balance shows total points from all branches.',
    branchPoints: 'Branch Points',
    redemptionConditions: 'Point Redemption Conditions',
    redemptionRules: 'Important rules for using your points',
    allowedRedemptions: 'Allowed Redemption Values',
    importantRules: 'Important Rules',
    noCustomValues: 'No Custom Values Allowed',
    noCustomValuesDesc: 'Points can only be redeemed in the specified amounts: 50, 100, 150, or 200 points.',
    noCashExchange: 'No Cash Exchange',
    noCashExchangeDesc: 'Points cannot be converted to cash. They can only be used for discounts on purchases.',
    storeUseOnly: 'Store Use Only',
    storeUseOnlyDesc: 'Points can be used for discounts on future purchases at Urban Market stores.',
    readyToRedeem: 'Ready to redeem your points?',
    contactStoreStaff: 'Contact store staff during your next visit or reach out to customer support for assistance with point redemption.',
    contactSupport: 'Contact Support',
    comingSoon: 'Coming Soon',
    quickActions: 'Quick Actions',
    virtualCard: 'Virtual Card',
    customerSupport: 'Customer Support',
    showMyGift: 'Show My Gift',
    myOffers: 'My Offers',
    billHistory: 'Bill History',
    recentTransactions: 'Recent Transactions (Latest 5)',
    noTransactions: 'No transactions found',
    viewAll: 'View All',
    branch: 'Branch',
    amount: 'Amount',
    pointsEarned: 'Points Earned',
    completed: 'Completed',
    viewSpecialOffers: 'View special offers',
    
    // Features
    
    // Admin
    adminPanel: 'Admin Panel',
    adminDashboard: 'Admin Dashboard',
    adminWelcome: 'Welcome to the Urban Market Loyalty Admin Panel',
    manageBranches: 'Manage Branches',
    manageCardTypes: 'Manage Card Types',
    totalCustomers: 'Total Customers',
    activeCards: 'Active Cards',
    rewardsRedeemed: 'Rewards Redeemed',
    totalRevenue: 'Revenue (﷼)',
    quickActionsAdmin: 'Quick Actions',
    customerManagement: 'Customer Management',
    customerDatabase: 'Customer database',
    cardTypeManagement: 'Card Type Management',
    rewardCategories: 'Reward Categories',
    analyticsReports: 'Analytics & Reports',
    performanceReports: 'Performance reports',
    viewAnalytics: 'View Analytics',
    uploadCustomers: 'Upload Customers',
    importCustomerData: 'Import customer data',
    uploadTransactions: 'Upload Transactions',
    manageCoupons: 'Manage Coupons',
    createEditCoupons: 'Create and edit coupons',
    manageCustomers: 'Manage Customers',
    assignCardType: 'Assign Card Type',
    extendValidity: 'Extend Validity',
    supportSettings: 'Support Settings',
    notificationCenter: 'Notification Center',
    sendNotifications: 'Send Notifications',
    customerMessaging: 'Customer messaging',
    exportData: 'Export Data',
    downloadReports: 'Download reports',
    
    // Login & Register
    login: 'Login',
    register: 'Register',
    mobileNumber: 'Mobile Number',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Name',
    email: 'Email',
    
    // Virtual Card
    loyaltyCard: 'Loyalty Card',
    cardHolder: 'Card Holder',
    cardNumber: 'Card Number',
    validFrom: 'Valid From',
    cardType: 'Card Type',
    
    // Coming Soon Pages
    launchingSoon: 'Launching Soon',
    comingSoonMessage: 'We\'re working hard to bring you the best experience',
    notifyWhenAvailable: 'Notify Me When Available',
    whatToExpect: 'What to Expect',
    wideProductSelection: 'Wide Product Selection',
    freshProduceDesc: 'Fresh produce, pantry staples, and daily essentials',
    fastDelivery: 'Fast Delivery',
    getOrdersDesc: 'Get your orders within 30-60 minutes',
    earnLoyaltyPoints: 'Earn Loyalty Points',
    getPointsDesc: 'Get points for every delivery order',
    specialOffers: 'Special Offers',
    exclusiveDiscounts: 'Exclusive discounts for loyal customers',
    
    // Error Messages
    pageNotFound: 'Page Not Found',
    goHome: 'Go Home',
    tryAgain: 'Try Again',
    noUserFound: 'No user found. Please login again.',
    customerNotFound: 'Customer not found. Please contact support.',
    failedToLoadData: 'Failed to load data',
    refreshPage: 'Refresh Page',
    allBranches: 'All Branches',
    notAvailable: 'N/A',
    startShopping: 'Start shopping to see your purchase history!',
    noTransactionsForBranch: 'No transactions found for this branch',
    viewYourCard: 'View your loyalty card',
    needHelp: 'Get help and support',
    howToUse: 'How to use:'
  },
  ar: {
    // Common
    welcome: 'مرحباً',
    logout: 'تسجيل الخروج',
    back: 'رجوع',
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    search: 'بحث',
    filter: 'تصفية',
    date: 'التاريخ',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    yes: 'نعم',
    no: 'لا',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',

    // Admin Navigation
    adminPanel: 'لوحة الإدارة',
    manageBranches: 'إدارة الفروع',
    manageCardTypes: 'إدارة أنواع البطاقات',
    
    // Dashboard
    dashboard: 'لوحة القيادة',
    selectBranch: 'اختر الفرع',
    lastUpdated: 'آخر تحديث',
    points: 'النقاط',
    current: 'الحالي',
    lifetime: 'مدى الحياة',
    yourBalance: 'رصيدك',
    availablePoints: 'متاحة للمكافآت',
    lifetimeEarned: 'المكتسب مدى الحياة',
    totalEarned: 'إجمالي النقاط المكتسبة',
    totalAvailable: 'إجمالي النقاط المتاحة',
    totalAmountEarned: 'إجمالي المبلغ المكتسب (ريال)',
    filterTransactions: 'تصفية المعاملات',
    filterNote: 'هذا يفلتر قائمة المعاملات أدناه. رصيدك يُظهر إجمالي النقاط من جميع الفروع.',
    branchPoints: 'نقاط الفرع',
    redemptionConditions: 'شروط استرداد النقاط',
    redemptionRules: 'قواعد مهمة لاستخدام نقاطك',
    allowedRedemptions: 'قيم الاسترداد المسموحة',
    importantRules: 'قواعد مهمة',
    noCustomValues: 'لا توجد قيم مخصصة مسموحة',
    noCustomValuesDesc: 'يمكن استرداد النقاط فقط بالمبالغ المحددة: 50، 100، 150، أو 200 نقطة.',
    noCashExchange: 'لا يمكن تحويلها لنقد',
    noCashExchangeDesc: 'لا يمكن تحويل النقاط إلى نقد. يمكن استخدامها فقط للحصول على خصومات على المشتريات.',
    storeUseOnly: 'للاستخدام في المتجر فقط',
    storeUseOnlyDesc: 'يمكن استخدام النقاط للحصول على خصومات على المشتريات المستقبلية في متاجر أوربان ماركت.',
    readyToRedeem: 'مستعد لاسترداد نقاطك؟',
    contactStoreStaff: 'تواصل مع موظفي المتجر خلال زيارتك القادمة أو تواصل مع دعم العملاء للمساعدة في استرداد النقاط.',
    contactSupport: 'تواصل مع الدعم',
    comingSoon: 'قريباً',
    quickActions: 'إجراءات سريعة',
    virtualCard: 'البطاقة الافتراضية',
    customerSupport: 'دعم العملاء',
    showMyGift: 'عرض هديتي',
    myOffers: 'عروضي',
    billHistory: 'سجل الفواتير',
    recentTransactions: 'المعاملات الحديثة (آخر 5)',
    noTransactions: 'لم يتم العثور على معاملات',
    viewAll: 'عرض الكل',
    branch: 'الفرع',
    amount: 'المبلغ',
    pointsEarned: 'النقاط المكتسبة',
    completed: 'مكتمل',
    viewSpecialOffers: 'عرض العروض الخاصة',
    
    // Features
    
    // Admin
    adminDashboard: 'لوحة الإدارة',
    adminWelcome: 'مرحباً بك في لوحة إدارة ولاء ايربين ماركت',
    totalCustomers: 'إجمالي العملاء',
    activeCards: 'البطاقات النشطة',
    rewardsRedeemed: 'المكافآت المستبدلة',
    totalRevenue: 'الإيرادات (ريال)',
    quickActionsAdmin: 'إجراءات سريعة',
    customerManagement: 'إدارة العملاء',
    customerDatabase: 'قاعدة بيانات العملاء',
    cardTypeManagement: 'إدارة أنواع البطاقات',
    rewardCategories: 'فئات المكافآت',
    analyticsReports: 'التحليلات والتقارير',
    performanceReports: 'تقارير الأداء',
    viewAnalytics: 'عرض التحليلات',
    uploadCustomers: 'تحميل العملاء',
    importCustomerData: 'استيراد بيانات العملاء',
    uploadTransactions: 'تحميل المعاملات',
    manageCoupons: 'إدارة الكوبونات',
    createEditCoupons: 'إنشاء وتعديل الكوبونات',
    manageCustomers: 'إدارة العملاء',
    assignCardType: 'تعيين نوع البطاقة',
    extendValidity: 'تمديد الصلاحية',
    supportSettings: 'إعدادات الدعم',
    notificationCenter: 'مركز الإشعارات',
    sendNotifications: 'إرسال الإشعارات',
    customerMessaging: 'مراسلة العملاء',
    exportData: 'تصدير البيانات',
    downloadReports: 'تحميل التقارير',
    
    // Login & Register
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    mobileNumber: 'رقم الجوال',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    
    // Virtual Card
    loyaltyCard: 'بطاقة الولاء',
    cardHolder: 'حامل البطاقة',
    cardNumber: 'رقم البطاقة',
    validFrom: 'صالحة من',
    cardType: 'نوع البطاقة',
    
    // Coming Soon Pages
    launchingSoon: 'قريباً',
    comingSoonMessage: 'نحن نعمل بجد لنقدم لك أفضل تجربة',
    notifyWhenAvailable: 'أعلمني عندما تصبح متاحة',
    whatToExpected: 'ما يمكن توقعه',
    wideProductSelection: 'تشكيلة واسعة من المنتجات',
    freshProduceDesc: 'منتجات طازجة وأساسيات المنزل والاحتياجات اليومية',
    fastDelivery: 'توصيل سريع',
    getOrdersDesc: 'احصل على طلباتك خلال 30-60 دقيقة',
    earnLoyaltyPoints: 'اكسب نقاط الولاء',
    getPointsDesc: 'احصل على نقاط مع كل طلب توصيل',
    specialOffers: 'عروض خاصة',
    exclusiveDiscounts: 'خصومات حصرية للعملاء الأوفياء',
    
    // Error Messages
    pageNotFound: 'الصفحة غير موجودة',
    goHome: 'الذهاب للرئيسية',
    tryAgain: 'حاول مرة أخرى',
    noUserFound: 'لم يتم العثور على المستخدم. يرجى تسجيل الدخول مرة أخرى.',
    customerNotFound: 'لم يتم العثور على العميل. يرجى التواصل مع الدعم.',
    failedToLoadData: 'فشل في تحميل البيانات',
    refreshPage: 'تحديث الصفحة',
    allBranches: 'جميع الفروع',
    notAvailable: 'غير متاح',
    startShopping: 'ابدأ التسوق لرؤية تاريخ مشترياتك!',
    noTransactionsForBranch: 'لا توجد معاملات لهذا الفرع',
    viewYourCard: 'عرض بطاقة الولاء الخاصة بك',
    needHelp: 'احصل على المساعدة والدعم',
    howToUse: 'كيفية الاستخدام:'
  }
};

// Derived store for current translations
export const t = derived(language, ($language: Language) => translations[$language]);

// Helper function to toggle language
export function toggleLanguage() {
  language.update((lang: Language) => lang === 'en' ? 'ar' : 'en');
}

// Initialize language from localStorage if available
if (browser) {
  const stored = localStorage.getItem('language');
  if (stored && (stored === 'en' || stored === 'ar')) {
    language.set(stored as Language);
  }
  
  // Save language changes to localStorage
  language.subscribe((value: Language) => {
    localStorage.setItem('language', value);
  });
}
