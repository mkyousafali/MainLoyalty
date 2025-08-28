<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { language } from '$lib/stores/language';

  let branches = [];
  let branchStats = [];
  let loading = true;
  let totalGuestLogins = 0;
  let dateFilter = 'today';
  
  const dateFilters = [
    { value: 'today', label: 'Today', labelAr: 'اليوم' },
    { value: 'week', label: 'This Week', labelAr: 'هذا الأسبوع' },
    { value: 'month', label: 'This Month', labelAr: 'هذا الشهر' },
    { value: 'all', label: 'All Time', labelAr: 'كل الوقت' }
  ];

  onMount(() => {
    loadBranchData();
  });

  async function loadBranchData() {
    try {
      loading = true;
      
      // Load branches
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('id, name, name_en, name_ar')
        .eq('is_active', true)
        .order('name');

      if (branchError) throw branchError;
      branches = branchData || [];

      // Load REAL guest login statistics from database
      await loadRealGuestStats();
      
    } catch (error) {
      console.error('Error loading branch data:', error);
    } finally {
      loading = false;
    }
  }

  async function loadRealGuestStats() {
    try {
      let query = supabase
        .from('guest_login_logs')
        .select(`
          id,
          branch_id,
          login_time,
          logout_time,
          device_type,
          time_spent,
          branches (
            id,
            name,
            name_en,
            name_ar
          )
        `);

      // Apply date filter to the query
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'all':
          startDate = new Date('2020-01-01'); // Far back date
          break;
      }

      if (dateFilter !== 'all') {
        query = query.gte('login_time', startDate.toISOString());
      }

      const { data: guestLogs, error } = await query.order('login_time', { ascending: false });

      if (error) throw error;

      // Process the data to create branch statistics
      const branchStatsMap = new Map();
      
      // Initialize all branches with zero stats
      branches.forEach(branch => {
        branchStatsMap.set(branch.id, {
          id: branch.id,
          name: branch.name || branch.name_en,
          name_en: branch.name_en || branch.name,
          name_ar: branch.name_ar || branch.name_en || branch.name,
          guestLogins: 0,
          lastGuestLogin: null,
          averageDaily: 0,
          percentage: 0,
          uniqueSessions: new Set(),
          totalTimeSpent: 0,
          mobileLogins: 0,
          desktopLogins: 0
        });
      });

      // Process guest login logs
      guestLogs?.forEach(log => {
        const branchId = log.branch_id;
        const stat = branchStatsMap.get(branchId);
        
        if (stat) {
          stat.guestLogins += 1;
          
          if (log.session_id) {
            stat.uniqueSessions.add(log.session_id);
          }
          
          if (!stat.lastGuestLogin || new Date(log.login_time) > new Date(stat.lastGuestLogin)) {
            stat.lastGuestLogin = log.login_time;
          }
          
          if (log.time_spent) {
            stat.totalTimeSpent += log.time_spent;
          }
          
          if (log.device_type === 'mobile') {
            stat.mobileLogins += 1;
          } else {
            stat.desktopLogins += 1;
          }
        }
      });

      // Calculate daily averages and percentages
      let daysMultiplier = 1;
      switch (dateFilter) {
        case 'today': daysMultiplier = 1; break;
        case 'week': daysMultiplier = 7; break;
        case 'month': daysMultiplier = 30; break;
        case 'all': daysMultiplier = 365; break;
      }

      branchStats = Array.from(branchStatsMap.values()).map(stat => ({
        ...stat,
        uniqueSessions: stat.uniqueSessions.size,
        averageTimeSpent: stat.guestLogins > 0 ? Math.round(stat.totalTimeSpent / stat.guestLogins) : 0,
        averageDaily: Math.round(stat.guestLogins / daysMultiplier)
      }));

      // Calculate totals and percentages
      totalGuestLogins = branchStats.reduce((sum, stat) => sum + stat.guestLogins, 0);
      branchStats = branchStats.map(stat => ({
        ...stat,
        percentage: totalGuestLogins > 0 ? Math.round((stat.guestLogins / totalGuestLogins) * 100) : 0
      }));

      // Sort by guest logins descending
      branchStats.sort((a, b) => b.guestLogins - a.guestLogins);

    } catch (error) {
      console.error('Error loading real guest statistics:', error);
      // Fallback to empty stats if there's an error
      branchStats = branches.map(branch => ({
        id: branch.id,
        name: branch.name || branch.name_en,
        name_en: branch.name_en || branch.name,
        name_ar: branch.name_ar || branch.name_en || branch.name,
        guestLogins: 0,
        lastGuestLogin: null,
        averageDaily: 0,
        percentage: 0
      }));
      totalGuestLogins = 0;
    }
  }

  function handleDateFilterChange() {
    loadRealGuestStats();
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat($language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  function exportData() {
    const csvContent = [
      ['Branch Name (EN)', 'Branch Name (AR)', 'Guest Logins', 'Percentage', 'Average Daily', 'Last Guest Login'],
      ...branchStats.map(stat => [
        stat.name_en,
        stat.name_ar,
        stat.guestLogins,
        `${stat.percentage}%`,
        stat.averageDaily,
        formatDate(stat.lastGuestLogin)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest_branch_stats_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const translations = {
    en: {
      title: 'Guest Branch Login Statistics',
      subtitle: 'Monitor guest user branch selection patterns',
      dateFilter: 'Date Filter',
      totalLogins: 'Total Guest Logins',
      exportData: 'Export Data',
      loading: 'Loading statistics...',
      branchName: 'Branch Name',
      guestLogins: 'Guest Logins',
      percentage: 'Percentage',
      averageDaily: 'Avg Daily',
      lastLogin: 'Last Guest Login',
      noData: 'No data available'
    },
    ar: {
      title: 'إحصائيات دخول الضيوف حسب الفرع',
      subtitle: 'مراقبة أنماط اختيار الفروع للمستخدمين الضيوف',
      dateFilter: 'تصفية التاريخ',
      totalLogins: 'إجمالي دخول الضيوف',
      exportData: 'تصدير البيانات',
      loading: 'جاري تحميل الإحصائيات...',
      branchName: 'اسم الفرع',
      guestLogins: 'دخول الضيوف',
      percentage: 'النسبة المئوية',
      averageDaily: 'المتوسط اليومي',
      lastLogin: 'آخر دخول ضيف',
      noData: 'لا توجد بيانات متاحة'
    }
  };

  $: localTranslations = translations[$language];
</script>

<div class="p-6 bg-gray-50 min-h-screen" dir="{$language === 'ar' ? 'rtl' : 'ltr'}">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
        <span class="text-white text-xl">📊</span>
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">{localTranslations.title}</h1>
        <p class="text-gray-600">{localTranslations.subtitle}</p>
      </div>
    </div>
  </div>

  <!-- Controls -->
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <!-- Date Filter -->
    <div class="flex items-center gap-3">
      <label class="text-sm font-medium text-gray-700">{localTranslations.dateFilter}:</label>
      <select 
        bind:value={dateFilter} 
        on:change={handleDateFilterChange}
        class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {#each dateFilters as filter}
          <option value={filter.value}>
            {$language === 'ar' ? filter.labelAr : filter.label}
          </option>
        {/each}
      </select>
    </div>

    <!-- Export Button -->
    <button
      on:click={exportData}
      disabled={loading || branchStats.length === 0}
      class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      {localTranslations.exportData}
    </button>
  </div>

  {#if loading}
    <!-- Loading State -->
    <div class="bg-white rounded-xl p-8 shadow-sm">
      <div class="flex items-center justify-center">
        <div class="flex items-center gap-3 text-gray-600">
          <svg class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{localTranslations.loading}</span>
        </div>
      </div>
    </div>
  {:else}
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Total Guest Logins -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">{localTranslations.totalLogins}</p>
            <p class="text-3xl font-bold text-blue-600">{totalGuestLogins.toLocaleString()}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Active Branches -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Active Branches</p>
            <p class="text-3xl font-bold text-green-600">{branches.length}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Average per Branch -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Average per Branch</p>
            <p class="text-3xl font-bold text-purple-600">
              {branches.length > 0 ? Math.round(totalGuestLogins / branches.length).toLocaleString() : 0}
            </p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Branch Statistics Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800">Branch Statistics</h2>
      </div>
      
      {#if branchStats.length > 0}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {localTranslations.branchName}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {localTranslations.guestLogins}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {localTranslations.percentage}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {localTranslations.averageDaily}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {localTranslations.lastLogin}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each branchStats as stat}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {$language === 'ar' ? (stat.name_ar || stat.name_en) : stat.name_en}
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="text-sm font-semibold text-gray-900">{stat.guestLogins.toLocaleString()}</div>
                      <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style="width: {stat.percentage}%"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm font-medium text-gray-900">{stat.percentage}%</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900">{stat.averageDaily}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(stat.lastGuestLogin)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">{localTranslations.noData}</h3>
        </div>
      {/if}
    </div>
  {/if}
</div>
