<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { language, t, toggleLanguage } from '$lib/stores/language.js';
  import { user, logout as authLogout } from '$lib/stores/auth';

  // Props
  export let showBackButton = true;
  export let title = '';
  export let showLanguageToggle = true;
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

  function handleLanguageToggle() {
    console.log('Language toggle clicked, current language:', $language);
    toggleLanguage();
    console.log('Language after toggle:', $language);
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
      '/register': 'Register'
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
      
      <!-- Left Section -->
      <div class="flex items-center space-x-4 min-w-0 flex-1" class:space-x-reverse={$language === 'ar'}>
        <!-- Back Button -->
        {#if showBackButton && !isLoginPage}
          <button 
            on:click={goBack}
            class="flex items-center text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title={$t.back || 'Back'}
            aria-label={$t.back || 'Back'}
          >
            <svg 
              class="w-5 h-5 {$language === 'ar' ? 'rotate-180' : ''}" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        {/if}

        <!-- User Info (for non-login pages) -->
        {#if !isLoginPage && $user}
          <div class="flex items-center space-x-3" class:space-x-reverse={$language === 'ar'}>
            <div class="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {$user.name.charAt(0)}
            </div>
            <div class="hidden sm:block">
              <p class="text-xs text-gray-500">{$t.welcome || 'Welcome'}</p>
              <p class="font-medium text-gray-900 text-sm">{$user.name}</p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Center Section - Title -->
      <div class="flex-2 flex items-center justify-center mx-4">
        <h1 class="relative bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-bold text-base tracking-wide shadow-lg transition-all duration-300 max-w-xs truncate text-center">
          <!-- Title Text -->
          <span class="relative z-10 drop-shadow-lg">{currentTitle}</span>
        </h1>
      </div>

      <!-- Right Section -->
      <div class="flex items-center space-x-2 min-w-0 flex-1 justify-end" class:space-x-reverse={$language === 'ar'}>
        
        <!-- Language Toggle -->
        {#if showLanguageToggle}
          <button 
            on:click={handleLanguageToggle} 
            class="group relative bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-xl font-semibold transition-all duration-200 text-sm border border-blue-200/50 hover:border-blue-300/70 shadow-sm hover:shadow-md transform hover:scale-105"
            title="Toggle Language"
          >
            <span class="font-bold tracking-wide">
              {$language === 'ar' ? 'EN' : 'AR'}
            </span>
            <!-- Subtle glow effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
          </button>
        {/if}

        <!-- Logout Button (for non-login pages) -->
        {#if showLogout && !isLoginPage && $user}
          <button 
            on:click={logout} 
            class="hidden sm:flex items-center space-x-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
            class:space-x-reverse={$language === 'ar'}
          >
            <span>🔓</span>
            <span>{$t.logout || 'Logout'}</span>
          </button>
        {/if}

        <!-- Mobile Menu Button (for smaller screens) -->
        <div class="sm:hidden">
          <button
            class="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            title="Menu"
            aria-label="Menu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile User Info (visible on small screens) -->
    {#if !isLoginPage && $user}
      <div class="sm:hidden pb-3 pt-1 border-t border-gray-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3" class:space-x-reverse={$language === 'ar'}>
            <div class="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
              {$user.name.charAt(0)}
            </div>
            <div>
              <p class="text-xs text-gray-500">{$t.welcome || 'Welcome'} {$user.name}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-2" class:space-x-reverse={$language === 'ar'}>
            {#if showLanguageToggle}
              <button 
                on:click={handleLanguageToggle} 
                class="group bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-gray-700 hover:text-gray-900 px-3 py-1 rounded-lg font-semibold transition-all duration-200 text-xs border border-blue-200/50 hover:border-blue-300/70 shadow-sm hover:shadow-md transform hover:scale-105"
                title="Toggle Language"
              >
                <span class="font-bold tracking-wide">
                  {$language === 'ar' ? 'EN' : 'AR'}
                </span>
              </button>
            {/if}
            {#if showLogout && $user}
              <button 
                on:click={logout} 
                class="text-red-600 text-xs px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors"
              >
                🔓 Logout
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</header>

<style>
  .rtl {
    direction: rtl;
  }
  
  header {
    backdrop-filter: blur(10px);
    background-color: rgba(255, 255, 255, 0.95);
  }

  .flex-2 {
    flex: 2 1 0%;
  }

  /* Ensure proper responsive behavior */
  @media (max-width: 640px) {
    .sm\\:hidden {
      display: block !important;
    }
    .hidden.sm\\:flex {
      display: none !important;
    }
    .hidden.sm\\:block {
      display: none !important;
    }
  }

  @media (min-width: 641px) {
    .sm\\:hidden {
      display: none !important;
    }
    .hidden.sm\\:flex {
      display: flex !important;
    }
    .hidden.sm\\:block {
      display: block !important;
    }
  }
</style>
