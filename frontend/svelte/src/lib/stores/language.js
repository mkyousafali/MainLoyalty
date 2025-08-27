import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Language store
export const language = writable('en');

// Translation store
export const translations = {
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
    comingSoon: 'Coming Soon',
    quickActions: 'Quick Actions',
    virtualCard: 'Virtual Card',
    customerSupport: 'Customer Support',
    billHistory: 'Bill History',
    branch: 'Branch',
    amount: 'Amount',
    pointsEarned: 'Points Earned',
    completed: 'Completed',
    
    // Features
    
    // Admin
    adminDashboard: 'Admin Dashboard',
    adminWelcome: 'Welcome to the Urban Market Loyalty Admin Panel',
    totalCustomers: 'Total Customers',
    activeCards: 'Active Cards',
    rewardsRedeemed: 'Rewards Redeemed',
    totalRevenue: 'Total Revenue',
    customerManagement: 'Customer Management',
    cardTypeManagement: 'Card Type Management',
    rewardCategories: 'Reward Categories',
    analyticsReports: 'Analytics & Reports',
    uploadCustomers: 'Upload Customers',
    uploadTransactions: 'Upload Transactions',
    manageCoupons: 'Manage Coupons',
    assignCardType: 'Assign Card Type',
    extendValidity: 'Extend Validity',
    supportSettings: 'Support Settings',
    notificationCenter: 'Notification Center',
    exportData: 'Export Data',
    
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
    validUntil: 'Valid Until',
    cardType: 'Card Type',
    memberSince: 'Member Since',
    premiumMember: 'Premium Member',
    howToUse: 'How to use:',
    showQR: 'Show QR code to cashier',
    earnPoints: 'Earn points on every purchase',
    redeemPoints: 'Redeem points for rewards',
    
    // Coming Soon Pages
    launchingSoon: 'Launching Soon',
    comingSoonMessage: 'We\'re working hard to bring you the best experience',
    notifyWhenAvailable: 'Notify Me When Available',
    
    // Error Messages
    pageNotFound: 'Page Not Found',
    goHome: 'Go Home',
    tryAgain: 'Try Again',
    
    // Offers Page
    storeOffers: 'Store Offers',
    discoverDeals: 'Discover amazing deals',
    searchOffers: 'Search offers...',
    allOffers: 'All Offers',
    allBranches: 'All Branches',
    availableOffers: 'Available Offers',
    locations: 'Locations',
    loadingOffers: 'Loading your exclusive offers...',
    unableToLoad: 'Unable to Load Offers',
    noOffersFound: 'No offers found',
    adjustFilters: 'Try adjusting your search terms or branch filter',
    clearFilters: 'Clear Filters',
    daysLeft: 'days left',
    expired: 'EXPIRED',
    offerExpired: 'Offer Expired',
    validUntil: 'Valid Until',
    expiredOn: 'Expired On',
    thisOfferExpired: 'This offer is no longer available',
    noLongerAvailable: 'No longer available',
    downloadFullOfferDetails: 'Download Full Offer Details',
    noAdditionalDetails: 'No additional details available',
    shareOffer: 'Share Offer',
    offerLinkCopied: 'Offer link copied to clipboard!',
    visualOffers: 'Visual Offers',
    visualOffersDesc: 'Eye-catching images show you exactly what\'s on offer',
    pdfDownloads: 'PDF Downloads',
    pdfDownloadsDesc: 'Download detailed terms and conditions when available',
    branchSpecific: 'Branch Specific',
    branchSpecificDesc: 'Find offers for specific branches or available everywhere',
    wasOff: 'WAS OFF',
    
    // Customer Support Page
    needHelp: 'Need Help? Chat with us!',
    loading: 'Loading...',
    retry: 'Retry',
    chatWithAI: 'Chat with Urban Smart AI',
    branchContactInfo: 'Branch Contact Information',
    unnamedBranch: 'Unnamed Branch',
    locationNotSpecified: 'Location not specified',
    open: 'Open',
    quickContact: 'Quick Contact',
    visitWebsite: 'Visit Website',
    whatsappContact: 'WhatsApp / Contact',
    instagram: 'Instagram',
    snapchat: 'Snapchat',
    tiktok: 'TikTok',
    branchManager: 'Branch Manager',
    branchDetails: 'Branch Details',
    managerInfoNotAvailable: 'Manager contact information not available',
    visitWebsite: 'Visit Website',
    whatsappContact: 'WhatsApp Contact',
    emailContact: 'Email Contact',
    whatsapp: 'WhatsApp',
    email: 'Email',
    resources: 'Resources',
    branchCode: 'Branch Code',
    email: 'Email'
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
    
    // Dashboard
    dashboard: 'لوحة القيادة',
    selectBranch: 'اختر الفرع',
    lastUpdated: 'آخر تحديث',
    points: 'النقاط',
    comingSoon: 'قريباً',
    quickActions: 'إجراءات سريعة',
    virtualCard: 'البطاقة الافتراضية',
    customerSupport: 'دعم العملاء',
    billHistory: 'سجل الفواتير',
    branch: 'الفرع',
    amount: 'المبلغ',
    pointsEarned: 'النقاط المكتسبة',
    completed: 'مكتمل',
    
    // Features
    
    // Admin
    adminDashboard: 'لوحة الإدارة',
    adminWelcome: 'مرحباً بك في لوحة إدارة ولاء ايربين ماركت',
    totalCustomers: 'إجمالي العملاء',
    activeCards: 'البطاقات النشطة',
    rewardsRedeemed: 'المكافآت المستبدلة',
    totalRevenue: 'إجمالي الإيرادات',
    customerManagement: 'إدارة العملاء',
    cardTypeManagement: 'إدارة أنواع البطاقات',
    rewardCategories: 'فئات المكافآت',
    analyticsReports: 'التحليلات والتقارير',
    uploadCustomers: 'تحميل العملاء',
    uploadTransactions: 'تحميل المعاملات',
    manageCoupons: 'إدارة الكوبونات',
    assignCardType: 'تعيين نوع البطاقة',
    extendValidity: 'تمديد الصلاحية',
    supportSettings: 'إعدادات الدعم',
    notificationCenter: 'مركز الإشعارات',
    exportData: 'تصدير البيانات',
    
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
    validUntil: 'صالحة حتى',
    cardType: 'نوع البطاقة',
    memberSince: 'عضو منذ',
    premiumMember: 'عضو مميز',
    howToUse: 'كيفية الاستخدام:',
    showQR: 'اعرض رمز الاستجابة السريعة للكاشير',
    earnPoints: 'اكسب نقاط مع كل عملية شراء',
    redeemPoints: 'استبدل النقاط بالمكافآت',
    
    // Coming Soon Pages
    launchingSoon: 'قريباً',
    comingSoonMessage: 'نحن نعمل بجد لنقدم لك أفضل تجربة',
    notifyWhenAvailable: 'أعلمني عندما تصبح متاحة',
    
    // Error Messages
    pageNotFound: 'الصفحة غير موجودة',
    goHome: 'الذهاب للرئيسية',
    tryAgain: 'حاول مرة أخرى',
    
    // Offers Page
    storeOffers: 'عروض ايربن ماركت',
    discoverDeals: 'اكتشف عروض مذهلة',
    searchOffers: 'البحث في العروض...',
    allOffers: 'جميع العروض',
    allBranches: 'جميع الفروع',
    availableOffers: 'العروض المتاحة',
    locations: 'المواقع',
    loadingOffers: 'جاري تحميل عروضك الحصرية...',
    unableToLoad: 'تعذر تحميل العروض',
    noOffersFound: 'لم يتم العثور على عروض',
    adjustFilters: 'جرب تعديل مصطلحات البحث أو مرشح الفرع',
    clearFilters: 'مسح المرشحات',
    daysLeft: 'أيام متبقية',
    expired: 'منتهي الصلاحية',
    offerExpired: 'انتهت صلاحية العرض',
    validUntil: 'صالح حتى',
    expiredOn: 'انتهت الصلاحية في',
    thisOfferExpired: 'هذا العرض لم يعد متاحاً',
    noLongerAvailable: 'لم يعد متاحاً',
    downloadFullOfferDetails: 'تحميل تفاصيل العرض كاملة',
    noAdditionalDetails: 'لا توجد تفاصيل إضافية متاحة',
    shareOffer: 'مشاركة العرض',
    offerLinkCopied: 'تم نسخ رابط العرض إلى الحافظة!',
    visualOffers: 'عروض مرئية',
    visualOffersDesc: 'صور جذابة تُظهر لك بالضبط ما هو معروض',
    pdfDownloads: 'تحميل ملفات PDF',
    pdfDownloadsDesc: 'حمل الشروط والأحكام التفصيلية عند توفرها',
    branchSpecific: 'خاص بالفروع',
    branchSpecificDesc: 'ابحث عن عروض فروع محددة أو متاحة في كل مكان',
    wasOff: 'كان خصم',
    
    // Customer Support Page
    needHelp: 'تحتاج مساعدة؟ تحدث معنا!',
    loading: 'جاري التحميل...',
    retry: 'إعادة المحاولة',
    chatWithAI: 'تحدث مع ذكي ايربن ماركت',
    branchContactInfo: 'معلومات الاتصال بالفروع',
    unnamedBranch: 'فرع بلا اسم',
    locationNotSpecified: 'الموقع غير محدد',
    open: 'مفتوح',
    quickContact: 'اتصال سريع',
    visitWebsite: 'زيارة الموقع',
    whatsappContact: 'واتساب / اتصال',
    instagram: 'انستغرام',
    snapchat: 'سناب شات',
    tiktok: 'تيك توك',
    branchManager: 'مدير الفرع',
    branchDetails: 'تفاصيل الفرع',
    managerInfoNotAvailable: 'معلومات الاتصال بالمدير غير متوفرة',
    visitWebsite: 'زيارة الموقع',
    whatsappContact: 'واتساب',
    emailContact: 'البريد الإلكتروني',
    whatsapp: 'واتساب',
    email: 'البريد الإلكتروني',
    resources: 'الموارد',
    branchCode: 'كود الفرع',
    email: 'البريد الإلكتروني'
  }
};

// Derived store for current translations
export const t = derived(language, ($language) => translations[$language] || translations.en);

// Helper function to toggle language
export function toggleLanguage() {
  language.update(lang => lang === 'en' ? 'ar' : 'en');
}

// Initialize language from localStorage if available
if (browser) {
  const stored = localStorage.getItem('language');
  if (stored && (stored === 'en' || stored === 'ar')) {
    language.set(stored);
  }
  
  // Save language changes to localStorage
  language.subscribe(value => {
    localStorage.setItem('language', value);
  });
}
