<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  
  let currentLang: 'en' | 'ar' = 'en' as 'en' | 'ar';
  let isAuthenticated = false;
  let adminUser: any = null;
  
  // Real data from database
  let dashboardStats = {
    totalCustomers: 0,
    activeCards: 0,
    rewardsRedeemed: 0,
    totalRevenue: 0
  };
  let isLoadingStats = true;
  let statsError = '';
  let lastUpdated: Date | null = null;
  
  // Check authentication on mount
  onMount(async () => {
    const adminSession = localStorage.getItem('adminSession');
    const adminUserData = localStorage.getItem('adminUser');
    
    if (adminSession === 'active' && adminUserData) {
      try {
        adminUser = JSON.parse(adminUserData);
        isAuthenticated = true;
        // Load real data from database
        await loadDashboardStats();
      } catch (e) {
        // Invalid session data
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminUser');
        goto('/admin-login');
      }
    } else {
      // No valid session, redirect to admin login
      goto('/admin-login');
    }
  });

  async function loadDashboardStats() {
    try {
      isLoadingStats = true;
      statsError = '';
      
      console.log('📊 Loading dashboard statistics...');

      // Parallel queries for better performance
      const [customerNumbersResult, customerTransactionsResult, customersResult] = await Promise.allSettled([
        // Fetch total customers count from customer_numbers table (count only, no data)
        supabase
          .from('customer_numbers')
          .select('*', { count: 'exact', head: true }),
          
        // Fetch revenue from customer_transactions table
        supabase
          .from('customer_transactions')
          .select('amount, redeem, created_at')
          .order('created_at', { ascending: false }),
          
        // Fetch customers for active cards and rewards calculations
        supabase
          .from('customers')
          .select('id, card_status, points, total_points, created_at')
          .order('created_at', { ascending: false })
      ]);

      // Process customer_numbers data for total customers count
      if (customerNumbersResult.status === 'fulfilled' && !customerNumbersResult.value.error) {
        // Use the count property instead of data length
        const customerCount = customerNumbersResult.value.count || 0;
        dashboardStats.totalCustomers = customerCount;
        
        console.log('✅ Customer numbers count loaded:', {
          total: dashboardStats.totalCustomers,
          count: customerCount
        });
      } else {
        console.warn('⚠️ Failed to fetch customer_numbers count:', customerNumbersResult);
        if (customerNumbersResult.status === 'fulfilled') {
          console.error('Supabase error:', customerNumbersResult.value.error);
        }
      }

      // Process customer_transactions data for revenue and rewards redeemed
      if (customerTransactionsResult.status === 'fulfilled' && !customerTransactionsResult.value.error) {
        const customerTransactions = customerTransactionsResult.value.data || [];
        
        // Calculate total revenue from amount column
        dashboardStats.totalRevenue = customerTransactions.reduce((sum, t) => {
          const amount = parseFloat(t.amount) || 0;
          return sum + Math.abs(amount); // Use absolute value for revenue calculation
        }, 0);
        
        // Calculate rewards redeemed from redeem column
        dashboardStats.rewardsRedeemed = customerTransactions.reduce((sum, t) => {
          const redeem = parseFloat(t.redeem) || 0;
          return sum + Math.abs(redeem); // Sum all redemptions
        }, 0);
        
        console.log('✅ Customer transactions loaded:', {
          transactions: customerTransactions.length,
          revenue: dashboardStats.totalRevenue,
          rewardsRedeemed: dashboardStats.rewardsRedeemed
        });
      } else {
        console.warn('⚠️ Failed to fetch customer_transactions data:', customerTransactionsResult);
      }

      // Process customers data for active cards calculation only
      if (customersResult.status === 'fulfilled' && !customersResult.value.error) {
        const customers = customersResult.value.data || [];
        dashboardStats.activeCards = customers.filter(c => 
          c.card_status === 'registered' || c.card_status === 'active'
        ).length;
        
        console.log('✅ Customer active cards loaded:', {
          active: dashboardStats.activeCards
        });
      } else {
        console.warn('⚠️ Failed to fetch customers data:', customersResult);
      }

      console.log('📊 Final dashboard stats:', dashboardStats);
      lastUpdated = new Date();

    } catch (error) {
      console.error('❌ Failed to load dashboard stats:', error);
      statsError = 'Failed to load dashboard statistics. Please try again.';
    } finally {
      isLoadingStats = false;
    }
  }
  
  // Individual section collapse states
  let sectionStates = {
    branchCustomer: false,
    transactionsRewards: false,
    cardCoupon: false,
    supportComm: false,
    reportsData: false,
    userControl: false
  };

  // Simple translations object
  const translations = {
    en: {
      adminDashboard: 'Admin Dashboard',
      welcomeMessage: 'Welcome to the Urban Market Loyalty Admin Panel',
      dashboard: 'Home',
      collapseAll: 'Collapse All',
      expandAll: 'Expand All',
      totalCustomers: 'Total Customers',
      activeCards: 'Active Cards',
      rewardsRedeemed: 'Rewards Redeemed',
      revenue: 'Revenue (﷼)',
      quickActions: 'Quick Actions',
      branchCustomerMgmt: 'Branch & Customer Management',
      transactionsRewards: 'Transactions & Rewards',
      cardCouponControl: 'Card & Coupon Control',
      supportCommunication: 'Support & Communication',
      reportsData: 'Reports & Data',
      userControl: 'User Control & Settings',
      uploadCustomers: 'Upload Customers',
      importCustomerData: 'Import customer data',
      manageBranches: 'Manage Branches',
      createBranches: 'Create branches with auto transaction tables',
      uploadTransactions: 'Upload Transactions',
      bulkUpload: 'Bulk upload to branch-specific tables',
      manageCoupons: 'Manage Coupons',
      createEditCoupons: 'Create and edit coupons',
      viewAnalytics: 'View Analytics',
      performanceReports: 'Performance reports',
      manageCustomers: 'Manage Customers',
      customerDatabase: 'Customer database',
      sendNotifications: 'Send Notifications',
      customerMessaging: 'Customer messaging',
      exportData: 'Export Data',
      downloadReports: 'Download reports',
      manageUsers: 'Manage Users & Employees',
      userManagement: 'User management and access control',
      resetPasswords: 'Reset Passwords',
      blockActivateUsers: 'Block/Activate users and manage permissions',
      userActionReports: 'User Action Reports',
      employeeActivityLogs: 'Employee activity and audit logs'
    },
    ar: {
      adminDashboard: 'لوحة تحكم الإدارة',
      welcomeMessage: 'مرحباً بك في لوحة إدارة برنامج الولاء',
      dashboard: 'الرئيسية',
      collapseAll: 'طي الكل',
      expandAll: 'توسيع الكل',
      totalCustomers: 'إجمالي العملاء',
      activeCards: 'البطاقات النشطة',
      rewardsRedeemed: 'المكافآت المستبدلة',
      revenue: 'الإيرادات (ريال)',
      quickActions: 'الإجراءات السريعة',
      branchCustomerMgmt: 'إدارة الفروع والعملاء',
      transactionsRewards: 'المعاملات والمكافآت',
      cardCouponControl: 'تحكم البطاقات والكوبونات',
      supportCommunication: 'الدعم والتواصل',
      reportsData: 'التقارير والبيانات',
      userControl: 'تحكم المستخدمين والإعدادات',
      uploadCustomers: 'رفع العملاء',
      importCustomerData: 'استيراد بيانات العملاء',
      manageBranches: 'إدارة الفروع',
      createBranches: 'إنشاء فروع مع جداول المعاملات التلقائية',
      uploadTransactions: 'رفع المعاملات',
      bulkUpload: 'رفع مجمع لجداول الفروع المحددة',
      manageCoupons: 'إدارة الكوبونات',
      createEditCoupons: 'إنشاء وتعديل الكوبونات',
      viewAnalytics: 'عرض التحليلات',
      performanceReports: 'تقارير الأداء',
      manageCustomers: 'إدارة العملاء',
      customerDatabase: 'قاعدة بيانات العملاء',
      sendNotifications: 'إرسال الإشعارات',
      customerMessaging: 'مراسلة العملاء',
      exportData: 'تصدير البيانات',
      downloadReports: 'تحميل التقارير',
      manageUsers: 'إدارة المستخدمين والموظفين',
      userManagement: 'إدارة المستخدمين والتحكم في الصلاحيات',
      resetPasswords: 'إعادة تعيين كلمات المرور',
      blockActivateUsers: 'حظر/تفعيل المستخدمين وإدارة الصلاحيات',
      userActionReports: 'تقارير أنشطة المستخدمين',
      employeeActivityLogs: 'سجلات أنشطة الموظفين والمراجعة'
    }
  } as const;

  $: t = translations[currentLang] || translations.en;
  $: allCollapsed = Object.values(sectionStates).every(state => state);

  function toggleAllSections() {
    const newState = !allCollapsed;
    sectionStates = {
      branchCustomer: newState,
      transactionsRewards: newState,
      cardCoupon: newState,
      supportComm: newState,
      reportsData: newState,
      userControl: newState
    };
  }

  function toggleSection(section: keyof typeof sectionStates) {
    sectionStates[section] = !sectionStates[section];
  }
  
  // Sample data to match the screenshot - using reactive statements for translations and real data
  $: stats = [
    { 
      title: t.totalCustomers, 
      value: isLoadingStats ? '...' : dashboardStats.totalCustomers.toLocaleString(), 
      icon: '👥', 
      color: 'blue' 
    },
    { 
      title: t.activeCards, 
      value: isLoadingStats ? '...' : dashboardStats.activeCards.toLocaleString(), 
      icon: '💳', 
      color: 'green' 
    },
    { 
      title: t.rewardsRedeemed, 
      value: isLoadingStats ? '...' : dashboardStats.rewardsRedeemed.toLocaleString(), 
      icon: '🎁', 
      color: 'red' 
    },
    { 
      title: t.revenue, 
      value: isLoadingStats ? '...' : dashboardStats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 }), 
      icon: '💰', 
      color: 'yellow' 
    }
  ];

  $: quickActions = [
    { title: t.uploadCustomers, desc: t.importCustomerData, icon: '👥', color: 'blue', href: '/admin/upload-customers' },
    { title: t.manageBranches, desc: t.createBranches, icon: '🏢', color: 'red', href: '/admin/manage-branches' },
    { title: t.uploadTransactions, desc: t.bulkUpload, icon: '📊', color: 'green', href: '/admin/upload-transactions' },
    { title: t.viewAnalytics, desc: t.performanceReports, icon: '📈', color: 'purple', href: '/admin/analytics-reports' },
    { title: t.manageCustomers, desc: t.customerDatabase, icon: '👤', color: 'green', href: '/admin/customer-management' },
    { title: t.sendNotifications, desc: t.customerMessaging, icon: '🔔', color: 'purple', href: '/admin/notification-center' },
    { title: t.exportData, desc: t.downloadReports, icon: '📤', color: 'blue', href: '/admin/export-data' }
  ];

  function getColorClasses(color: string) {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      red: 'bg-red-100 text-red-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colors[color] || colors.blue;
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden">
  <!-- Futuristic Background Pattern -->
  <div class="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
  <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
  <div class="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-cyan-400/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
  
  <div class="relative z-10 p-6 max-w-7xl mx-auto">
  {#if !isAuthenticated}
    <!-- Loading state while checking authentication -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-600">Checking authentication...</p>
      </div>
    </div>
  {:else}
  <!-- Header -->
  <div class="flex justify-between items-center mb-8 pr-6">
    <div class="flex-1">
      <h1 class="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3" class:text-right={currentLang === 'ar'}>{t.adminDashboard}</h1>
      <div class="flex items-center space-x-4" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
        <p class="text-gray-500 text-lg" class:text-right={currentLang === 'ar'}>{t.welcomeMessage}</p>
        {#if lastUpdated && !isLoadingStats}
          <span class="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        {/if}
      </div>
    </div>
    <div class="flex items-center space-x-6">
      {#if adminUser}
        <div class="text-right">
          <p class="text-sm font-medium text-gray-600">{adminUser.name || adminUser.email}</p>
          <p class="text-xs text-gray-400 capitalize">Master Admin</p>
        </div>
      {/if}
      <button 
        on:click={loadDashboardStats} 
        class="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoadingStats}
      >
        <span class="text-sm" class:animate-spin={isLoadingStats}>{isLoadingStats ? '🔄' : '↻'}</span>
        <span>Refresh Data</span>
      </button>
      <button on:click={toggleAllSections} class="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg">
        <span>{allCollapsed ? '➕' : '➖'}</span>
        <span>{allCollapsed ? t.expandAll : t.collapseAll}</span>
      </button>
    </div>
  </div>

  <!-- Unified Top Stats Layout -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {#each stats as stat}
      <div class="bg-white shadow-md rounded-2xl p-6 flex items-center space-x-4 hover:shadow-lg transition-all duration-200">
        <div class="p-3 {getColorClasses(stat.color)} rounded-full">
          <span class="text-xl">{stat.icon}</span>
        </div>
        <div class="flex-1">
          <p class="text-gray-500 text-sm font-medium" class:text-right={currentLang === 'ar'}>{stat.title}</p>
          {#if isLoadingStats}
            <div class="flex items-center" class:justify-end={currentLang === 'ar'}>
              <div class="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
            </div>
          {:else if statsError}
            <p class="text-xl font-bold text-red-600" class:text-right={currentLang === 'ar'}>Error</p>
          {:else}
            <p class="text-2xl font-bold text-gray-900" class:text-right={currentLang === 'ar'}>{stat.value}</p>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if statsError}
    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-red-500 text-xl">⚠️</span>
          <p class="text-red-700 font-medium">{statsError}</p>
        </div>
        <button on:click={loadDashboardStats} class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-all duration-200">
          🔄 Retry
        </button>
      </div>
    </div>
  {/if}

  <!-- Modern Quick Actions Accordion -->
  <div class="mb-8">
    <h2 class="text-2xl font-bold text-gray-800 mb-6" class:text-right={currentLang === 'ar'}>{t.quickActions}</h2>
    
    <!-- Branch & Customer Management Section -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
      <button on:click={() => toggleSection('branchCustomer')} class="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-3">
          <span class="text-blue-600">🏢</span>
          <span>{t.branchCustomerMgmt}</span>
        </h3>
        <span class="text-gray-500 text-xl transform transition-transform duration-200" class:rotate-180={!sectionStates.branchCustomer}>{sectionStates.branchCustomer ? '➖' : '➕'}</span>
      </button>
      {#if !sectionStates.branchCustomer}
        <div class="px-6 pb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/admin/upload-customers" class="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 cursor-pointer block border border-blue-200 hover:border-blue-300 hover:shadow-md">
              <div class="flex items-start space-x-3" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
                <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span class="text-lg text-blue-600">👥</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate" class:text-right={currentLang === 'ar'}>{t.uploadCustomers}</h4>
                  <p class="text-sm text-gray-600 mt-1" class:text-right={currentLang === 'ar'}>{t.importCustomerData}</p>
                </div>
              </div>
            </a>
            <a href="/admin/manage-branches" class="group bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 hover:from-red-100 hover:to-red-200 transition-all duration-200 cursor-pointer block border border-red-200 hover:border-red-300 hover:shadow-md">
              <div class="flex items-start space-x-3" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
                <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span class="text-lg text-red-600">🏢</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate" class:text-right={currentLang === 'ar'}>{t.manageBranches}</h4>
                  <p class="text-sm text-gray-600 mt-1" class:text-right={currentLang === 'ar'}>{t.createBranches}</p>
                </div>
              </div>
            </a>
            <a href="/admin/customer-management" class="group bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 hover:from-green-100 hover:to-green-200 transition-all duration-200 cursor-pointer block border border-green-200 hover:border-green-300 hover:shadow-md">
              <div class="flex items-start space-x-3" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
                <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span class="text-lg text-green-600">👤</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate" class:text-right={currentLang === 'ar'}>{t.manageCustomers}</h4>
                  <p class="text-sm text-gray-600 mt-1" class:text-right={currentLang === 'ar'}>{t.customerDatabase}</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      {/if}
    </div>

    <!-- Transactions & Rewards Section -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
      <button on:click={() => toggleSection('transactionsRewards')} class="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-3">
          <span class="text-green-600">💰</span>
          <span>{t.transactionsRewards}</span>
        </h3>
        <span class="text-gray-500 text-xl transform transition-transform duration-200" class:rotate-180={!sectionStates.transactionsRewards}>{sectionStates.transactionsRewards ? '➖' : '➕'}</span>
      </button>
      {#if !sectionStates.transactionsRewards}
        <div class="px-6 pb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/admin/upload-transactions" class="group bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 hover:from-green-100 hover:to-green-200 transition-all duration-200 cursor-pointer block border border-green-200 hover:border-green-300 hover:shadow-md">
              <div class="flex items-start space-x-3" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
                <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span class="text-lg text-green-600">📊</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate" class:text-right={currentLang === 'ar'}>{t.uploadTransactions}</h4>
                  <p class="text-sm text-gray-600 mt-1" class:text-right={currentLang === 'ar'}>{t.bulkUpload}</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      {/if}
    </div>

    <!-- Card & Coupon Control Section -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
      <button on:click={() => toggleSection('cardCoupon')} class="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-all duration-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-3">
          <span class="text-yellow-600">🎫</span>
          <span>{t.cardCouponControl}</span>
        </h3>
        <span class="text-gray-500 text-xl transform transition-transform duration-200" class:rotate-180={!sectionStates.cardCoupon}>{sectionStates.cardCoupon ? '➖' : '➕'}</span>
      </button>
      {#if !sectionStates.cardCoupon}
        <div class="px-6 pb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Removed manage-coupons card -->
          </div>
        </div>
      {/if}
    </div>

    <!-- Support & Communication Section -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
      <button on:click={() => toggleSection('supportComm')} class="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-3">
          <span class="text-purple-600">💬</span>
          <span>{t.supportCommunication}</span>
        </h3>
        <span class="text-gray-500 text-xl transform transition-transform duration-200" class:rotate-180={!sectionStates.supportComm}>{sectionStates.supportComm ? '➖' : '➕'}</span>
      </button>
      {#if !sectionStates.supportComm}
        <div class="px-6 pb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/admin/notification-center" class="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 cursor-pointer block border border-purple-200 hover:border-purple-300 hover:shadow-md">
              <div class="flex items-start space-x-3" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
                <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span class="text-lg text-purple-600">🔔</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate" class:text-right={currentLang === 'ar'}>{t.sendNotifications}</h4>
                  <p class="text-sm text-gray-600 mt-1" class:text-right={currentLang === 'ar'}>{t.customerMessaging}</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      {/if}
    </div>

    <!-- Reports & Data Section -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
      <button on:click={() => toggleSection('reportsData')} class="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-3">
          <span class="text-purple-600">📊</span>
          <span>{t.reportsData}</span>
        </h3>
        <span class="text-gray-500 text-xl transform transition-transform duration-200" class:rotate-180={!sectionStates.reportsData}>{sectionStates.reportsData ? '➖' : '➕'}</span>
      </button>
      {#if !sectionStates.reportsData}
        <div class="px-6 pb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/admin/analytics-reports" class="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 cursor-pointer block border border-purple-200 hover:border-purple-300 hover:shadow-md">
              <div class="flex items-start space-x-3" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
                <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span class="text-lg text-purple-600">📈</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate" class:text-right={currentLang === 'ar'}>{t.viewAnalytics}</h4>
                  <p class="text-sm text-gray-600 mt-1" class:text-right={currentLang === 'ar'}>{t.performanceReports}</p>
                </div>
              </div>
            </a>
            <a href="/admin/export-data" class="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 cursor-pointer block border border-blue-200 hover:border-blue-300 hover:shadow-md">
              <div class="flex items-start space-x-3" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
                <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span class="text-lg text-blue-600">📤</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate" class:text-right={currentLang === 'ar'}>{t.exportData}</h4>
                  <p class="text-sm text-gray-600 mt-1" class:text-right={currentLang === 'ar'}>{t.downloadReports}</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      {/if}
    </div>

    <!-- User Control & Settings Section -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
      <button on:click={() => toggleSection('userControl')} class="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all duration-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-3">
          <span class="text-indigo-600">⚙️</span>
          <span>{t.userControl}</span>
        </h3>
        <span class="text-gray-500 text-xl transform transition-transform duration-200" class:rotate-180={!sectionStates.userControl}>{sectionStates.userControl ? '➖' : '➕'}</span>
      </button>
      {#if !sectionStates.userControl}
        <div class="px-6 pb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="/admin/user-management" class="group bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 cursor-pointer block border border-indigo-200 hover:border-indigo-300 hover:shadow-md">
              <div class="flex items-start space-x-3" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
                <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span class="text-lg text-indigo-600">👥</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate" class:text-right={currentLang === 'ar'}>{t.manageUsers}</h4>
                  <p class="text-sm text-gray-600 mt-1" class:text-right={currentLang === 'ar'}>{t.userManagement}</p>
                </div>
              </div>
            </a>
            <a href="/admin/password-reset" class="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 cursor-pointer block border border-orange-200 hover:border-orange-300 hover:shadow-md">
              <div class="flex items-start space-x-3" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
                <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span class="text-lg text-orange-600">🔑</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate" class:text-right={currentLang === 'ar'}>{t.resetPasswords}</h4>
                  <p class="text-sm text-gray-600 mt-1" class:text-right={currentLang === 'ar'}>{t.blockActivateUsers}</p>
                </div>
              </div>
            </a>
            <a href="/admin/user-reports" class="group bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 hover:from-teal-100 hover:to-teal-200 transition-all duration-200 cursor-pointer block border border-teal-200 hover:border-teal-300 hover:shadow-md">
              <div class="flex items-start space-x-3" class:flex-row-reverse={currentLang === 'ar'} class:space-x-reverse={currentLang === 'ar'}>
                <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span class="text-lg text-teal-600">📋</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate" class:text-right={currentLang === 'ar'}>{t.userActionReports}</h4>
                  <p class="text-sm text-gray-600 mt-1" class:text-right={currentLang === 'ar'}>{t.employeeActivityLogs}</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      {/if}
    </div>
  </div>
  {/if}
  </div>
</div>

<style>
  .rtl {
    direction: rtl;
    font-family: 'Cairo', sans-serif;
  }
  
  /* Loading animation */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  .bg-grid-pattern {
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
  }
  
  /* Custom scrollbar for webkit browsers */
  :global(::-webkit-scrollbar) {
    width: 8px;
  }
  
  :global(::-webkit-scrollbar-track) {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  :global(::-webkit-scrollbar-thumb) {
    background: linear-gradient(45deg, #3b82f6, #6366f1);
    border-radius: 4px;
  }
  
  :global(::-webkit-scrollbar-thumb:hover) {
    background: linear-gradient(45deg, #2563eb, #4f46e5);
  }
</style>