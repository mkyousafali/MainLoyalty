<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { user } from '$lib/stores/auth';
  import { language, t } from '$lib/stores/language';
  import { customerNotifications, markAsRead, markAllAsRead, clearAllNotifications, loadCustomerNotifications } from '$lib/stores/notifications';

  let isLoading = false;
  let error = '';
  let selectedFilter = 'all'; // all, unread, read
  let selectedType = 'all'; // all, system, promotion, etc.

  // Notification types for filtering
  const notificationTypes = [
    { value: 'all', label: 'All Types', icon: '📋' },
    { value: 'system', label: 'System', icon: '🔔' },
    { value: 'promotion', label: 'Promotions', icon: '🎉' },
    { value: 'birthday', label: 'Birthday', icon: '🎂' },
    { value: 'welcome', label: 'Welcome', icon: '👋' },
    { value: 'upgrade', label: 'Upgrades', icon: '⬆️' },
    { value: 'expiry', label: 'Expiry', icon: '⏰' },
    { value: 'transaction', label: 'Transactions', icon: '💳' },
    { value: 'reward', label: 'Rewards', icon: '🏆' }
  ];

  onMount(() => {
    loadNotifications();
    // Load notifications from Supabase
    loadCustomerNotifications($language);
  });

  async function loadNotifications() {
    if (!$user || $user.type !== 'customer') {
      return;
    }

    try {
      isLoading = true;
      // Load from Supabase using the store function
      await loadCustomerNotifications($language);
      error = '';
    } catch (err) {
      console.error('Error loading notifications:', err);
      error = 'Failed to load notifications. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function handleMarkAsRead(notification: any) {
    try {
      await markAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // You could show a toast notification here
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // You could show a toast notification here
    }
  }

  async function handleClearAll() {
    if (confirm($language === 'ar' ? 
      'هل أنت متأكد من إخفاء جميع الإشعارات؟' : 
      'Are you sure you want to hide all notifications?'
    )) {
      try {
        await clearAllNotifications();
      } catch (error) {
        console.error('Failed to clear all notifications:', error);
        // You could show a toast notification here
      }
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if ($language === 'ar') {
      if (diffInSeconds < 60) return 'الآن';
      if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
      if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
      if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
      return date.toLocaleDateString('ar-SA');
    } else {
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return date.toLocaleDateString();
    }
  }

  function getNotificationIcon(type: string): string {
    const typeConfig = notificationTypes.find(t => t.value === type);
    return typeConfig?.icon || '📢';
  }

  // Filter notifications based on selected filters
  $: filteredNotifications = $customerNotifications.filter(notification => {
    // Filter by read status
    if (selectedFilter === 'unread' && notification.isRead) return false;
    if (selectedFilter === 'read' && !notification.isRead) return false;
    
    // Filter by type
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    
    return true;
  });

  $: unreadCount = $customerNotifications.filter(n => !n.isRead).length;
</script>

<div class="min-h-screen bg-gray-50" dir={$language === 'ar' ? 'rtl' : 'ltr'}>
  <div class="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
    
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2" class:text-right={$language === 'ar'}>
            🔔 {$language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h1>
          <p class="text-gray-600" class:text-right={$language === 'ar'}>
            {$language === 'ar' ? 
              'تابع آخر الأخبار والعروض والتحديثات المهمة' : 
              'Stay updated with the latest news, offers, and important updates'}
          </p>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-2">
          <button
            on:click={handleMarkAllAsRead}
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            disabled={unreadCount === 0}
          >
            {$language === 'ar' ? 'إخفاء الكل' : 'Hide All'}
          </button>
          
          <button
            on:click={handleClearAll}
            class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            {$language === 'ar' ? 'إخفاء الكل' : 'Hide All'}
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
        <div class="flex items-center">
          <div class="text-3xl mr-4">📬</div>
          <div>
            <p class="text-sm font-medium text-gray-500" class:text-right={$language === 'ar'}>
              {$language === 'ar' ? 'إجمالي الإشعارات' : 'Total Notifications'}
            </p>
            <p class="text-2xl font-bold text-gray-900">{$customerNotifications.length}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
        <div class="flex items-center">
          <div class="text-3xl mr-4">🔴</div>
          <div>
            <p class="text-sm font-medium text-gray-500" class:text-right={$language === 'ar'}>
              {$language === 'ar' ? 'غير مقروء' : 'Unread'}
            </p>
            <p class="text-2xl font-bold text-gray-900">{unreadCount}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
        <div class="flex items-center">
          <div class="text-3xl mr-4">✅</div>
          <div>
            <p class="text-sm font-medium text-gray-500" class:text-right={$language === 'ar'}>
              {$language === 'ar' ? 'مقروء' : 'Read'}
            </p>
            <p class="text-2xl font-bold text-gray-900">{$customerNotifications.length - unreadCount}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4" class:text-right={$language === 'ar'}>
        {$language === 'ar' ? 'فلترة الإشعارات' : 'Filter Notifications'}
      </h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2" class:text-right={$language === 'ar'}>
            {$language === 'ar' ? 'الحالة' : 'Status'}
          </label>
          <select
            bind:value={selectedFilter}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{$language === 'ar' ? 'جميع الإشعارات' : 'All Notifications'}</option>
            <option value="unread">{$language === 'ar' ? 'غير مقروء' : 'Unread'}</option>
            <option value="read">{$language === 'ar' ? 'مقروء' : 'Read'}</option>
          </select>
        </div>

        <!-- Type Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2" class:text-right={$language === 'ar'}>
            {$language === 'ar' ? 'النوع' : 'Type'}
          </label>
          <select
            bind:value={selectedType}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {#each notificationTypes as type}
              <option value={type.value}>
                {type.icon} {$language === 'ar' ? 
                  (type.value === 'all' ? 'جميع الأنواع' :
                   type.value === 'system' ? 'النظام' :
                   type.value === 'promotion' ? 'العروض' :
                   type.value === 'birthday' ? 'عيد الميلاد' :
                   type.value === 'welcome' ? 'الترحيب' :
                   type.value === 'upgrade' ? 'الترقيات' :
                   type.value === 'expiry' ? 'انتهاء الصلاحية' :
                   type.value === 'transaction' ? 'المعاملات' :
                   type.value === 'reward' ? 'المكافآت' : type.label)
                  : type.label}
              </option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold" class:text-right={$language === 'ar'}>
          {$language === 'ar' ? 'الإشعارات' : 'Notifications'} ({filteredNotifications.length})
        </h2>
      </div>

      {#if isLoading}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">
            {$language === 'ar' ? 'جاري التحميل...' : 'Loading notifications...'}
          </p>
        </div>
      {:else if filteredNotifications.length === 0}
        <div class="p-8 text-center text-gray-500">
          <div class="text-6xl mb-4">📭</div>
          <h3 class="text-lg font-medium mb-2">
            {$language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
          </h3>
          <p>
            {$language === 'ar' ? 
              'لا توجد إشعارات تطابق المعايير المحددة.' : 
              'No notifications match your current filters.'}
          </p>
        </div>
      {:else}
        <div class="divide-y divide-gray-200">
          {#each filteredNotifications as notification}
            <div class="p-6 hover:bg-gray-50 {!notification.isRead ? 'bg-blue-50 border-l-4 border-blue-400' : ''} transition-colors">
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-4" class:space-x-reverse={$language === 'ar'}>
                  <div class="text-3xl">{getNotificationIcon(notification.type)}</div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-2" class:space-x-reverse={$language === 'ar'}>
                      <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {notificationTypes.find(t => t.value === notification.type)?.label || notification.type}
                      </span>
                      {#if !notification.isRead}
                        <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
                      {/if}
                      <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {
                        notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }">
                        {notification.priority === 'urgent' ? '🔴' : 
                         notification.priority === 'high' ? '🟠' : 
                         notification.priority === 'medium' ? '🟡' : '⚪'} 
                        {$language === 'ar' ? 
                          (notification.priority === 'urgent' ? 'عاجل' :
                           notification.priority === 'high' ? 'عالي' :
                           notification.priority === 'medium' ? 'متوسط' : 'عادي') :
                          notification.priority}
                      </span>
                    </div>
                    
                    <h3 class="text-lg font-semibold text-gray-900 mb-2" class:text-right={$language === 'ar'}>
                      {notification.title}
                    </h3>
                    <p class="text-gray-700 mb-3 leading-relaxed" class:text-right={$language === 'ar'}>
                      {notification.message}
                    </p>
                    
                    <div class="flex items-center space-x-4 text-sm text-gray-500" class:space-x-reverse={$language === 'ar'}>
                      <span>{formatDate(notification.timestamp)}</span>
                      {#if notification.isRead}
                        <span>• {$language === 'ar' ? 'مقروء' : 'Read'}</span>
                      {:else}
                        <span class="text-blue-600 font-medium">• {$language === 'ar' ? 'جديد' : 'New'}</span>
                      {/if}
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center space-x-2" class:space-x-reverse={$language === 'ar'}>
                  {#if !notification.isRead}
                    <button
                      on:click={() => handleMarkAsRead(notification)}
                      class="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      {$language === 'ar' ? 'إخفاء' : 'Hide'}
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Error Message -->
    {#if error}
      <div class="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
        {error}
      </div>
    {/if}
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
