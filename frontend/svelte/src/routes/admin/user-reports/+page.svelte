<script lang="ts">
  let currentLang: 'en' | 'ar' = 'en';
  let selectedDateRange = 'week';
  let selectedUser = 'all';
  let selectedAction = 'all';

  // Sample user activity data
  let userActivities = [
    { id: 1, user: 'Ahmed Hassan', action: 'Login', timestamp: '2024-01-15 10:30:45', ip: '192.168.1.100', details: 'Successful login from main branch', category: 'Authentication' },
    { id: 2, user: 'Sarah Ali', action: 'Upload Customers', timestamp: '2024-01-15 10:25:12', ip: '192.168.1.101', details: 'Uploaded 25 customer records', category: 'Data Management' },
    { id: 3, user: 'Omar Mohammed', action: 'Reset Password', timestamp: '2024-01-15 09:15:30', ip: '192.168.1.102', details: 'Password reset for user ID: 1234', category: 'User Management' },
    { id: 4, user: 'Fatima Ibrahim', action: 'View Reports', timestamp: '2024-01-15 08:45:20', ip: '192.168.1.103', details: 'Accessed customer analytics dashboard', category: 'Reporting' },
    { id: 5, user: 'Ahmed Hassan', action: 'Manage Branches', timestamp: '2024-01-14 16:20:15', ip: '192.168.1.100', details: 'Created new branch: Downtown Location', category: 'Branch Management' },
    { id: 6, user: 'Sarah Ali', action: 'Block User', timestamp: '2024-01-14 15:10:08', ip: '192.168.1.101', details: 'Blocked user account: omar@company.com', category: 'User Management' },
    { id: 7, user: 'Ahmed Hassan', action: 'Export Data', timestamp: '2024-01-14 14:30:45', ip: '192.168.1.100', details: 'Exported transaction data for Q4 2023', category: 'Data Management' },
    { id: 8, user: 'Fatima Ibrahim', action: 'Login Failed', timestamp: '2024-01-14 11:20:12', ip: '192.168.1.103', details: 'Failed login attempt - incorrect password', category: 'Authentication' }
  ];

  const translations = {
    en: {
      userActionReports: 'User Action Reports & Activity Logs',
      backToAdmin: 'Back to Admin',
      activityFilters: 'Activity Filters',
      dateRange: 'Date Range',
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      quarter: 'This Quarter',
      year: 'This Year',
      custom: 'Custom Range',
      user: 'User',
      allUsers: 'All Users',
      actionType: 'Action Type',
      allActions: 'All Actions',
      exportReport: 'Export Report',
      totalActivities: 'Total Activities',
      uniqueUsers: 'Unique Users',
      failedAttempts: 'Failed Attempts',
      successfulActions: 'Successful Actions',
      timestamp: 'Timestamp',
      userColumn: 'User',
      action: 'Action',
      ipAddress: 'IP Address',
      details: 'Details',
      category: 'Category',
      authentication: 'Authentication',
      dataManagement: 'Data Management',
      userManagement: 'User Management',
      reporting: 'Reporting',
      branchManagement: 'Branch Management',
      systemAdmin: 'System Administration',
      refreshData: 'Refresh Data'
    },
    ar: {
      userActionReports: 'تقارير أنشطة المستخدمين وسجلات الأنشطة',
      backToAdmin: 'العودة للإدارة',
      activityFilters: 'مرشحات الأنشطة',
      dateRange: 'النطاق الزمني',
      today: 'اليوم',
      week: 'هذا الأسبوع',
      month: 'هذا الشهر',
      quarter: 'هذا الربع',
      year: 'هذا العام',
      custom: 'نطاق مخصص',
      user: 'المستخدم',
      allUsers: 'جميع المستخدمين',
      actionType: 'نوع النشاط',
      allActions: 'جميع الأنشطة',
      exportReport: 'تصدير التقرير',
      totalActivities: 'إجمالي الأنشطة',
      uniqueUsers: 'المستخدمين الفريدين',
      failedAttempts: 'المحاولات الفاشلة',
      successfulActions: 'الأنشطة الناجحة',
      timestamp: 'الوقت والتاريخ',
      userColumn: 'المستخدم',
      action: 'النشاط',
      ipAddress: 'عنوان IP',
      details: 'التفاصيل',
      category: 'الفئة',
      authentication: 'المصادقة',
      dataManagement: 'إدارة البيانات',
      userManagement: 'إدارة المستخدمين',
      reporting: 'التقارير',
      branchManagement: 'إدارة الفروع',
      systemAdmin: 'إدارة النظام',
      refreshData: 'تحديث البيانات'
    }
  } as const;

  $: t = translations[currentLang];
  $: filteredActivities = userActivities.filter(activity => {
    let matchesUser = selectedUser === 'all' || activity.user === selectedUser;
    let matchesAction = selectedAction === 'all' || activity.category === selectedAction;
    return matchesUser && matchesAction;
  });

  $: stats = {
    total: filteredActivities.length,
    uniqueUsers: new Set(filteredActivities.map(a => a.user)).size,
    failed: filteredActivities.filter(a => a.action.includes('Failed')).length,
    successful: filteredActivities.filter(a => !a.action.includes('Failed')).length
  };

  function goToAdmin() {
    window.location.href = '/admin';
  }

  function handleLanguageToggle() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
  }

  function exportReport() {
    // Implement export functionality
    console.log('Exporting report with filters:', { selectedDateRange, selectedUser, selectedAction });
    alert('Report export functionality would be implemented here');
  }

  function refreshData() {
    // Implement data refresh
    console.log('Refreshing user activity data...');
    alert('Data refresh functionality would be implemented here');
  }

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      'Authentication': 'bg-blue-100 text-blue-800',
      'Data Management': 'bg-green-100 text-green-800',
      'User Management': 'bg-purple-100 text-purple-800',
      'Reporting': 'bg-yellow-100 text-yellow-800',
      'Branch Management': 'bg-red-100 text-red-800',
      'System Administration': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['System Administration'];
  }

  function getActionStatus(action: string) {
    return action.includes('Failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  }
</script>

<div class="min-h-screen bg-[#f6f8fb] p-6" class:rtl={currentLang === 'ar'}>
  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2" class:text-right={currentLang === 'ar'}>{t.userActionReports}</h1>
    </div>
  </div>

  <!-- Statistics Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center" class:flex-row-reverse={currentLang === 'ar'}>
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <span class="text-lg">📊</span>
          </div>
        </div>
        <div class="ml-4" class:ml-0={currentLang === 'ar'} class:mr-4={currentLang === 'ar'}>
          <p class="text-sm font-medium text-gray-600" class:text-right={currentLang === 'ar'}>{t.totalActivities}</p>
          <p class="text-2xl font-semibold text-gray-900" class:text-right={currentLang === 'ar'}>{stats.total}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center" class:flex-row-reverse={currentLang === 'ar'}>
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <span class="text-lg">👥</span>
          </div>
        </div>
        <div class="ml-4" class:ml-0={currentLang === 'ar'} class:mr-4={currentLang === 'ar'}>
          <p class="text-sm font-medium text-gray-600" class:text-right={currentLang === 'ar'}>{t.uniqueUsers}</p>
          <p class="text-2xl font-semibold text-gray-900" class:text-right={currentLang === 'ar'}>{stats.uniqueUsers}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center" class:flex-row-reverse={currentLang === 'ar'}>
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <span class="text-lg">❌</span>
          </div>
        </div>
        <div class="ml-4" class:ml-0={currentLang === 'ar'} class:mr-4={currentLang === 'ar'}>
          <p class="text-sm font-medium text-gray-600" class:text-right={currentLang === 'ar'}>{t.failedAttempts}</p>
          <p class="text-2xl font-semibold text-gray-900" class:text-right={currentLang === 'ar'}>{stats.failed}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center" class:flex-row-reverse={currentLang === 'ar'}>
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
            <span class="text-lg">✅</span>
          </div>
        </div>
        <div class="ml-4" class:ml-0={currentLang === 'ar'} class:mr-4={currentLang === 'ar'}>
          <p class="text-sm font-medium text-gray-600" class:text-right={currentLang === 'ar'}>{t.successfulActions}</p>
          <p class="text-2xl font-semibold text-gray-900" class:text-right={currentLang === 'ar'}>{stats.successful}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <h3 class="text-lg font-semibold mb-4" class:text-right={currentLang === 'ar'}>{t.activityFilters}</h3>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>{t.dateRange}</label>
        <select bind:value={selectedDateRange} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="today">{t.today}</option>
          <option value="week">{t.week}</option>
          <option value="month">{t.month}</option>
          <option value="quarter">{t.quarter}</option>
          <option value="year">{t.year}</option>
          <option value="custom">{t.custom}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>{t.user}</label>
        <select bind:value={selectedUser} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="all">{t.allUsers}</option>
          <option value="Ahmed Hassan">Ahmed Hassan</option>
          <option value="Sarah Ali">Sarah Ali</option>
          <option value="Omar Mohammed">Omar Mohammed</option>
          <option value="Fatima Ibrahim">Fatima Ibrahim</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>{t.actionType}</label>
        <select bind:value={selectedAction} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="all">{t.allActions}</option>
          <option value="Authentication">{t.authentication}</option>
          <option value="Data Management">{t.dataManagement}</option>
          <option value="User Management">{t.userManagement}</option>
          <option value="Reporting">{t.reporting}</option>
          <option value="Branch Management">{t.branchManagement}</option>
        </select>
      </div>

      <div class="flex items-end gap-2">
        <button on:click={exportReport} class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2">
          <span>📊</span>
          <span>{t.exportReport}</span>
        </button>
        <button on:click={refreshData} class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
          <span>🔄</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Activity Table -->
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.timestamp}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.userColumn}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.action}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.category}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.ipAddress}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.details}</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each filteredActivities as activity}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" class:text-right={currentLang === 'ar'}>
                {activity.timestamp}
              </td>
              <td class="px-6 py-4 whitespace-nowrap" class:text-right={currentLang === 'ar'}>
                <div class="text-sm font-medium text-gray-900">{activity.user}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap" class:text-right={currentLang === 'ar'}>
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getActionStatus(activity.action)}">
                  {activity.action}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap" class:text-right={currentLang === 'ar'}>
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getCategoryColor(activity.category)}">
                  {activity.category}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" class:text-right={currentLang === 'ar'}>
                {activity.ip}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500" class:text-right={currentLang === 'ar'}>
                {activity.details}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .rtl {
    direction: rtl;
    font-family: 'Cairo', sans-serif;
  }
  
  .rtl .flex {
    gap: 0.75rem;
  }
  
  .rtl button {
    text-align: center;
  }
  
  .rtl table {
    text-align: right;
  }
</style>
