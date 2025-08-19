<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { language, t, toggleLanguage } from '$lib/stores/language.js';
  import { user, logout as authLogout } from '$lib/stores/auth';

  // Props
  export let showBackButton = true;
  export let title = '';
  export let showLogout = true;

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
      '/dashboard': $t.dashboard || 'Dashboard',
      '/virtual-card': $t.virtualCard || 'Virtual Card',
      '/customer-support': $t.customerSupport || 'Customer Support',
      '/my-offers': $t.myOffers || 'My Offers',
      '/admin': $t.adminPanel || 'Admin Panel',
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
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      
      <!-- Left Section - Navigation -->
      <div class="flex items-center space-x-3 min-w-0 flex-1" class:space-x-reverse={$language === 'ar'}>
        <!-- Back Button -->
        {#if showBackButton && !isLoginPage}
          <button 
            on:click={goBack}
            class="flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 p-2.5 rounded-xl hover:bg-gray-100 hover:shadow-sm"
            title={$t.back || 'Back'}
            aria-label={$t.back || 'Back'}
          >
            <svg 
              class="w-5 h-5 {$language === 'ar' ? 'rotate-180' : ''}" 
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
      <div class="flex items-center justify-center mx-4">
        <h1 class="relative bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-base tracking-wide shadow-lg transition-all duration-300 max-w-xs truncate text-center">
          <span class="relative z-10 drop-shadow-sm">{currentTitle}</span>
          <!-- Subtle shine effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-xl"></div>
        </h1>
      </div>

      <!-- Right Section - Actions -->
      <div class="flex items-center space-x-2 min-w-0 flex-1 justify-end" class:space-x-reverse={$language === 'ar'}>
        
        <!-- PWA Install Button -->
        <button 
          id="pwa-install-button"
          class="hidden group relative bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 hover:text-blue-800 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm border border-blue-200/60 hover:border-blue-300 shadow-sm hover:shadow-md transform hover:scale-105"
          title="Install App"
          aria-label="Install App"
        >
          <span class="text-sm">📱</span>
          <span class="hidden sm:inline ml-1.5 font-semibold">Install</span>
          <!-- Glow effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>

        <!-- Logout Button -->
        {#if showLogout && !isLoginPage && $user}
          <button 
            on:click={logout} 
            class="flex items-center space-x-2 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 hover:text-red-700 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm border border-red-200/60 hover:border-red-300 shadow-sm hover:shadow-md transform hover:scale-105 group"
            class:space-x-reverse={$language === 'ar'}
            title={$t.logout || 'Logout'}
            aria-label={$t.logout || 'Logout'}
          >
            <span class="text-sm group-hover:scale-110 transition-transform duration-200">🔓</span>
            <span class="font-semibold">{$t.logout || 'Logout'}</span>
            <!-- Glow effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        {/if}

        <!-- Mobile Menu Button -->
        <div class="sm:hidden">
          <button
            class="flex items-center justify-center p-2.5 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 hover:shadow-sm"
            title="Menu"
            aria-label="Menu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
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

  /* Mobile responsiveness improvements */
  @media (max-width: 640px) {
    .hidden {
      display: none !important;
    }
  }
</style>
