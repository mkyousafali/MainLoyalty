<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated, user, isAdmin } from '$lib/stores/auth';
  import ComprehensiveAdminNav from '$lib/ComprehensiveAdminNav.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';

  const dispatch = createEventDispatcher();
  
  let isRefreshing = false;
  let lastRefresh: Date | null = null;

  onMount(() => {
    // Check authentication on mount
    if (!$isAuthenticated || !$isAdmin) {
      goto('/admin-login');
    }
  });

  // Reactive check for authentication changes
  $: if (!$isAuthenticated || !$isAdmin) {
    goto('/admin-login');
  }

  function handleGlobalRefresh() {
    isRefreshing = true;
    dispatch('refresh');
    // Reset loading state after a delay
    setTimeout(() => {
      isRefreshing = false;
    }, 1000);
  }
</script>

{#if $isAuthenticated && $isAdmin}
  <div class="min-h-screen bg-gray-50">
    <!-- Side Navigation -->
    <ComprehensiveAdminNav />
    
    <!-- Main Content Area -->
    <div class="ml-64 mr-80 min-h-screen">
      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>

    <!-- Right Sidebar -->
    <div class="fixed top-0 right-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-30">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-900">Admin Dashboard</h2>
        <p class="text-sm text-gray-600 mt-1">Urban Market Loyalty Management System</p>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6 overflow-y-auto h-full pb-32">
        <!-- Global Refresh Section -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">System Controls</h3>
          <RefreshButton 
            isLoading={isRefreshing}
            {lastRefresh}
            autoRefreshInterval={30000}
            on:refresh={handleGlobalRefresh}
            class="w-full"
          />
        </div>

        <!-- Notifications Section -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
            Notifications
            <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
          </h3>
          <div class="space-y-3">
            <div class="bg-white p-3 rounded border-l-4 border-blue-500">
              <p class="text-sm font-medium text-gray-900">New customer registered</p>
              <p class="text-xs text-gray-600 mt-1">Ali Ahmed joined 5 minutes ago</p>
            </div>
            <div class="bg-white p-3 rounded border-l-4 border-green-500">
              <p class="text-sm font-medium text-gray-900">Card upgrade completed</p>
              <p class="text-xs text-gray-600 mt-1">Customer upgraded to Gold</p>
            </div>
            <div class="bg-white p-3 rounded border-l-4 border-yellow-500">
              <p class="text-sm font-medium text-gray-900">Low points balance</p>
              <p class="text-xs text-gray-600 mt-1">Customer needs attention</p>
            </div>
          </div>
          <button class="text-blue-600 text-sm font-medium mt-3 hover:text-blue-700">
            View all notifications
          </button>
        </div>

        <!-- Quick Stats -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Total Customers</span>
              <span class="font-semibold text-gray-900">1,247</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Active Cards</span>
              <span class="font-semibold text-gray-900">1,156</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Points Issued</span>
              <span class="font-semibold text-gray-900">245,892</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">This Month</span>
              <span class="font-semibold text-green-600">+12.5%</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
          <div class="space-y-2 text-sm">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="text-gray-600">Transaction processed</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span class="text-gray-600">Customer registered</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span class="text-gray-600">Coupon assigned</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span class="text-gray-600">Reward claimed</span>
            </div>
          </div>
        </div>

        <!-- User Info -->
        {#if $user}
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Current User</h3>
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span class="text-white text-lg font-bold">
                  {($user.name || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p class="font-medium text-gray-900">{$user.name || 'Admin'}</p>
                <p class="text-sm text-gray-600">{$user.email || 'admin@urbanmarket.com'}</p>
                <p class="text-xs text-gray-500">Last login: Today 2:30 PM</p>
              </div>
            </div>
            <button class="w-full mt-3 bg-red-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-red-700 transition-colors">
              Sign Out
            </button>
          </div>
        {/if}

        <!-- System Status -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">System Status</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Database</span>
              <span class="flex items-center">
                <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span class="text-xs text-green-600">Online</span>
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">API Services</span>
              <span class="flex items-center">
                <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span class="text-xs text-green-600">Running</span>
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Backup Status</span>
              <span class="flex items-center">
                <div class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                <span class="text-xs text-yellow-600">Scheduled</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- Loading or redirect -->
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading admin panel...</p>
    </div>
  </div>
{/if}

<style>
  /* Ensure proper spacing on mobile */
  @media (max-width: 1024px) {
    .ml-64 {
      margin-left: 0;
    }
    .mr-80 {
      margin-right: 0;
    }
    /* Hide right sidebar on mobile and show as overlay */
    .fixed.right-0.w-80 {
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
    }
  }

  @media (max-width: 1280px) {
    .mr-80 {
      margin-right: 20rem; /* Adjust for smaller screens */
    }
  }
</style>
