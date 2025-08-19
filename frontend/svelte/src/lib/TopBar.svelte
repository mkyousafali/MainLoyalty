<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { language, t, toggleLanguage } from '$lib/stores/language.js';
  import { user, logout as authLogout } from '$lib/stores/auth';
  import { customerNotifications, unreadNotificationCount, loadCustomerNotifications } from '$lib/stores/notifications';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  // Props
  export let showBackButton = true;
  export let title = '';
  export let showLogout = true;

  // Notification panel state
  let showNotificationPanel = false;

  onMount(() => {
    // Load notifications when component mounts
    // Use get() to safely access language store value
    const currentLang = get(language) || 'en';
    loadCustomerNotifications(currentLang);
  });

  function toggleNotificationPanel() {
    showNotificationPanel = !showNotificationPanel;
  }

  function closeNotificationPanel() {
    showNotificationPanel = false;
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      goto('/dashboard');
    }
  }

  function logout() {
    authLogout();
  }

  // Dynamic title based on current route
  $: currentTitle = title || getPageTitle($page.url.pathname);

  function getPageTitle(pathname: string): string {
    const titles: Record<string, string> = {
      '/dashboard': $t?.dashboard || 'Dashboard',
      '/virtual-card': $t?.virtualCard || 'Virtual Card',
      '/customer-support': $t?.customerSupport || 'Customer Support',
      '/my-offers': $t?.myOffers || 'My Offers',
      '/admin': $t?.adminPanel || 'Admin Panel',
      '/admin-login': 'Admin Login',
      '/login': 'Login',
      '/register': 'Register' // Separate registration page
    };
    return titles[pathname] || 'MainLoyalty';
  }

  // Check if current page is admin
  $: isAdminPage = $page.url.pathname.startsWith('/admin');
  $: isLoginPage = $page.url.pathname === '/login' || $page.url.pathname === '/admin-login';
</script>

<header class="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50" class:rtl={$language === 'ar'}>
  <div class="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-14 sm:h-16 gap-0.5 sm:gap-2">
      
      <!-- Left Section - Navigation -->
      <div class="flex items-center min-w-0 flex-shrink-0" class:space-x-reverse={$language === 'ar'}>
        <!-- Back Button -->
        {#if showBackButton && !isLoginPage}
          <button 
            on:click={goBack}
            class="flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl hover:bg-gray-100 hover:shadow-sm"
            title={$t?.back || 'Back'}
            aria-label={$t?.back || 'Back'}
          >
            <svg 
              class="w-4 h-4 sm:w-5 sm:h-5 {$language === 'ar' ? 'rotate-180' : ''}" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Center Section - Page Title -->
      <div class="flex items-center justify-center flex-1 mx-0.5 sm:mx-4 min-w-0">
        <h1 class="relative bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white px-1.5 py-1 sm:px-6 sm:py-2.5 rounded-md sm:rounded-xl font-bold text-xs sm:text-base tracking-wide shadow-lg transition-all duration-300 max-w-[80px] sm:max-w-xs truncate text-center">
          <span class="relative z-10 drop-shadow-sm">{currentTitle}</span>
          <!-- Subtle shine effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-md sm:rounded-xl"></div>
        </h1>
      </div>

      <!-- Right Section - Actions -->
      <div class="flex items-center space-x-0.5 sm:space-x-3 min-w-0 flex-shrink-0 justify-end" class:space-x-reverse={$language === 'ar'}>
        
        <!-- Language Toggle Button -->
        {#if !isLoginPage}
          <button 
            on:click={toggleLanguage}
            class="flex items-center justify-center bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 hover:text-purple-800 px-1 py-1.5 sm:px-3 sm:py-2.5 rounded-md sm:rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm border border-purple-200/60 hover:border-purple-300 shadow-sm hover:shadow-md transform hover:scale-105 group min-w-[32px] sm:min-w-auto"
            class:space-x-reverse={$language === 'ar'}
            title={$language === 'ar' ? 'Switch to English' : 'تبديل إلى العربية'}
            aria-label={$language === 'ar' ? 'Switch to English' : 'تبديل إلى العربية'}
          >
            <span class="text-xs sm:text-sm group-hover:scale-110 transition-transform duration-200">🌐</span>
            <span class="font-semibold hidden md:inline ml-1">{$language === 'ar' ? 'EN' : 'العربية'}</span>
            <!-- Glow effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-500/20 rounded-md sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        {/if}

        <!-- Notification Bell (always visible when user is logged in) -->
        {#if !isLoginPage && $user}
          <div class="relative">
            <button 
              on:click={toggleNotificationPanel}
              class="flex items-center justify-center bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-700 hover:text-yellow-800 p-1.5 sm:p-3 rounded-md sm:rounded-xl font-medium transition-all duration-200 border border-yellow-200/60 hover:border-yellow-300 shadow-sm hover:shadow-md transform hover:scale-105 group relative min-w-[32px] sm:min-w-auto"
              title={$t?.notifications || 'Notifications'}
              aria-label={$t?.notifications || 'Notifications'}
            >
              <svg class="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              
              <!-- Notification badge -->
              {#if $unreadNotificationCount > 0}
                <span class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full h-3.5 w-3.5 sm:h-5 sm:w-5 flex items-center justify-center animate-pulse text-[8px] sm:text-xs">
                  {$unreadNotificationCount > 9 ? '9+' : $unreadNotificationCount}
                </span>
              {/if}
              
              <!-- Glow effect -->
              <div class="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 rounded-md sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            <!-- Notification Panel -->
            {#if showNotificationPanel}
              <div class="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">🔔 {$t?.notifications || 'Notifications'}</h3>
                  <button 
                    on:click={closeNotificationPanel}
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close notifications panel"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <div class="max-h-80 overflow-y-auto">
                  {#if $customerNotifications.length === 0}
                    <div class="p-6 text-center text-gray-500">
                      <div class="text-4xl mb-2">📭</div>
                      <p>{$t?.noNotifications || 'No notifications yet'}</p>
                      <p class="text-sm">{$t?.notificationHint || "We'll notify you about important updates"}</p>
                    </div>
                  {:else}
                    <div class="divide-y divide-gray-100">
                      {#each $customerNotifications.slice(0, 10) as notification}
                        <div class="p-4 hover:bg-gray-50 {!notification.isRead ? 'bg-blue-50' : ''} transition-colors">
                          <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0">
                              {#if notification.type === 'system'}
                                🔔
                              {:else if notification.type === 'promotion'}
                                🎉
                              {:else if notification.type === 'birthday'}
                                🎂
                              {:else if notification.type === 'welcome'}
                                👋
                              {:else if notification.type === 'upgrade'}
                                ⬆️
                              {:else if notification.type === 'expiry'}
                                ⏰
                              {:else if notification.type === 'transaction'}
                                💳
                              {:else if notification.type === 'reward'}
                                🏆
                              {:else}
                                📢
                              {/if}
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-gray-900 truncate">
                                {$language === 'ar' && notification.title_ar ? notification.title_ar : notification.title}
                              </p>
                              <p class="text-sm text-gray-500 line-clamp-2">
                                {$language === 'ar' && notification.message_ar ? notification.message_ar : notification.message}
                              </p>
                              <p class="text-xs text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            {#if !notification.isRead}
                              <div class="flex-shrink-0">
                                <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                    
                    <div class="p-4 border-t border-gray-200 bg-gray-50">
                      <button 
                        on:click={() => { closeNotificationPanel(); goto('/notifications'); }}
                        class="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {$t?.viewAllNotifications || 'View All Notifications'} →
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- PWA Install Button -->
        <button 
          id="pwa-install-button"
          class="hidden group relative bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 hover:text-blue-800 px-2 py-2 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm border border-blue-200/60 hover:border-blue-300 shadow-sm hover:shadow-md transform hover:scale-105"
          title="Install App"
          aria-label="Install App"
        >
          <span class="text-xs sm:text-sm">📱</span>
          <span class="hidden sm:inline ml-1.5 font-semibold">Install</span>
          <!-- Glow effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-500/20 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>

        <!-- Logout Button -->
        {#if showLogout && !isLoginPage && $user}
          <button 
            on:click={logout} 
            class="flex items-center justify-center bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 hover:text-red-700 px-1 py-1.5 sm:px-3 sm:py-2.5 rounded-md sm:rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm border border-red-200/60 hover:border-red-300 shadow-sm hover:shadow-md transform hover:scale-105 group min-w-[32px] sm:min-w-auto"
            class:space-x-reverse={$language === 'ar'}
            title={$t?.logout || 'Logout'}
            aria-label={$t?.logout || 'Logout'}
          >
            <span class="text-xs sm:text-sm group-hover:scale-110 transition-transform duration-200">🔓</span>
            <span class="font-semibold hidden md:inline ml-1">{$t?.logout || 'Logout'}</span>
            <!-- Glow effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-500/20 rounded-md sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        {/if}

        <!-- Mobile Menu Button -->
        <div class="sm:hidden">
          <button
            class="flex items-center justify-center p-1.5 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 hover:shadow-sm min-w-[32px]"
            title="Menu"
            aria-label="Menu"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</header>

<style>
  .rtl {
    direction: rtl;
  }
  
  header {
    backdrop-filter: blur(12px);
    background-color: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid rgba(229, 231, 235, 0.8);
  }

  /* Ensure proper button positioning and spacing */
  .flex-1 {
    flex: 1 1 0%;
    min-width: 0;
  }

  /* Enhanced button hover effects */
  button {
    position: relative;
    overflow: hidden;
  }

  /* Smooth transitions for all interactive elements */
  * {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Mobile-specific improvements */
  @media (max-width: 640px) {
    header {
      padding-left: 0.25rem;
      padding-right: 0.25rem;
    }
    
    .max-w-7xl {
      padding-left: 0.25rem;
      padding-right: 0.25rem;
    }
    
    /* Ensure proper button spacing on mobile */
    .flex.items-center.space-x-0\.5 {
      gap: 0.125rem; /* 2px gap between buttons */
    }
    
    .flex.items-center.space-x-0\.5.space-x-reverse {
      gap: 0.125rem;
    }
    
    /* Make buttons compact but touchable on mobile */
    button {
      min-height: 2rem; /* 32px minimum touch target */
      min-width: 2rem;  /* 32px minimum touch target */
      font-size: 0.75rem; /* 12px */
    }
    
    /* Ensure title takes minimal space */
    .max-w-\[80px\] {
      max-width: 60px;
      font-size: 10px;
      padding: 0.125rem 0.25rem;
    }
    
    /* Hide text labels on mobile for more space */
    .hidden.md\:inline {
      display: none !important;
    }
    
    /* Ensure notification panel doesn't overflow on mobile */
    .absolute.right-0.mt-2 {
      right: -0.5rem;
      left: 0.5rem;
      width: auto;
      max-width: calc(100vw - 2rem);
    }
    
    /* Better flex distribution for ultra-compact mobile */
    .flex-shrink-0 {
      flex-shrink: 0;
    }
    
    .flex-1 {
      flex: 1 1 0%;
      min-width: 0;
    }
    
    /* Smaller header height on mobile */
    .h-14 {
      height: 3rem; /* 48px instead of 64px */
    }
    
    /* Notification badge adjustments */
    .h-3\.5.w-3\.5 {
      height: 0.75rem;
      width: 0.75rem;
      font-size: 8px;
    }
  }

  /* Prevent notification panel from going off-screen */
  @media (max-width: 768px) {
    .absolute.right-0.mt-2.w-72 {
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      width: calc(100vw - 2rem);
      max-width: 20rem;
    }
  }

  /* Mobile responsiveness improvements */
  @media (max-width: 640px) {
    .hidden {
      display: none !important;
    }
  }
</style>
