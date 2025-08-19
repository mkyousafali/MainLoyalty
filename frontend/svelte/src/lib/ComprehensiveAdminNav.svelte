<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { isAuthenticated, user, logout } from '$lib/stores/auth';

  // Comprehensive admin navigation structure
  const adminNavigation = [
    {
      section: 'Data Management',
      icon: '📊',
      items: [
        { name: 'Upload Customers', href: '/admin/upload-customers', icon: '👥' },
        { name: 'Upload Transactions', href: '/admin/upload-transactions', icon: '💳' },
        { name: 'Customer Management', href: '/admin/customer-management', icon: '🔍' },
        { name: 'Export Data', href: '/admin/export-data', icon: '📤' }
      ]
    },
    {
      section: 'Card Management',
      icon: '💳',
      items: [
        { name: 'Assign Card Types', href: '/admin/assign-card-types', icon: '🏷️' },
        { name: 'Extend Validity', href: '/admin/extend-validity', icon: '📅' },
        { name: 'Manage Card Types', href: '/admin/manage-card-types', icon: '🎨' }
      ]
    },
    {
      section: 'Rewards & Coupons',
      icon: '🎁',
      items: [
        { name: 'Assign Coupons', href: '/admin/assign-coupons', icon: '📮' },
        { name: 'Create Special Gift', href: '/admin/create-gift', icon: '🎁' },
        { name: 'Assign Rewards', href: '/admin/assign-rewards', icon: '🏆' }
      ]
    },
    {
      section: 'System Management',
      icon: '⚙️',
      items: [
        { name: 'Manage Branches', href: '/admin/manage-branches', icon: '🏢' },
        { name: 'User Management', href: '/admin/user-management', icon: '👤' },
        { name: 'User Roles', href: '/admin/user-roles', icon: '🔑' },
        { name: 'Support Settings', href: '/admin/support-settings', icon: '📞' },
        { name: 'Privacy Policy Management', href: '/admin/privacy-policy', icon: '🔒' }
      ]
    },
    {
      section: 'Reports',
      icon: '📈',
      items: [
        { name: 'Transaction Report', href: '/admin/reports/transaction-report', icon: '💰' },
        { name: 'Customer Usage Report', href: '/admin/reports/customer-usage', icon: '👥' },
        { name: 'Registrations Report', href: '/admin/reports/registrations', icon: '📝' }
      ]
    },
    {
      section: 'Admin Tools',
      icon: '🔧',
      items: [
        { name: 'User Reports', href: '/admin/user-reports', icon: '📋' },
        { name: 'Password Reset', href: '/admin/password-reset', icon: '🔒' }
      ]
    }
  ];

  let isOpen = false;
  let currentPath = '';

  onMount(() => {
    currentPath = $page.url.pathname;
  });

  $: currentPath = $page.url.pathname;

  function handleLogout() {
    logout();
    goto('/admin-login');
  }

  function isActiveRoute(href: string): boolean {
    return currentPath === href || currentPath.startsWith(href + '/');
  }
</script>

<nav class="bg-gray-900 text-white h-screen w-64 fixed left-0 top-0 overflow-y-auto z-50">
  <!-- Header -->
  <div class="p-4 border-b border-gray-700">
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-sm">UL</span>
      </div>
      <div>
        <h1 class="font-bold text-lg">Urban Loyalty</h1>
        <p class="text-xs text-gray-400">Admin Panel</p>
      </div>
    </div>
  </div>

  <!-- User Info -->
  {#if $isAuthenticated && $user}
    <div class="p-4 border-b border-gray-700">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
          <span class="text-white text-sm font-bold">
            {($user.name || 'A').charAt(0).toUpperCase()}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{$user.name || 'Admin'}</p>
          <p class="text-xs text-gray-400 truncate">{$user.email || ''}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Navigation Menu -->
  <div class="py-4">
    {#each adminNavigation as section}
      <div class="mb-6">
        <!-- Section Header -->
        <div class="px-4 mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-lg">{section.icon}</span>
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.section}
            </h3>
          </div>
        </div>

        <!-- Section Items -->
        <div class="space-y-1">
          {#each section.items as item}
            <a
              href={item.href}
              class="flex items-center space-x-3 px-4 py-2 text-sm rounded-md mx-2 transition-colors
                {isActiveRoute(item.href) 
                  ? 'bg-blue-600 text-white' 
                  : item.danger
                    ? 'text-red-300 hover:bg-red-900 hover:text-red-100'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }"
            >
              <span class="text-base">{item.icon}</span>
              <span class="flex-1">{item.name}</span>
              {#if item.danger}
                <span class="text-xs bg-red-600 px-1 rounded">⚠️</span>
              {/if}
            </a>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- Footer Actions -->
  <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
    <div class="space-y-2">
      <button
        on:click={() => goto('/dashboard')}
        class="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
      >
        <span>🏠</span>
        <span>Customer Dashboard</span>
      </button>
      <button
        on:click={handleLogout}
        class="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-300 hover:bg-red-900 hover:text-red-100 rounded-md transition-colors"
      >
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </div>
  </div>
</nav>

<!-- Mobile Navigation Overlay -->
{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" on:click={() => isOpen = false}></div>
{/if}

<!-- Mobile Toggle Button -->
<button
  on:click={() => isOpen = !isOpen}
  class="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-md"
>
  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
  </svg>
</button>

<style>
  /* Custom scrollbar for navigation */
  nav::-webkit-scrollbar {
    width: 4px;
  }
  
  nav::-webkit-scrollbar-track {
    background: #374151;
  }
  
  nav::-webkit-scrollbar-thumb {
    background: #6B7280;
    border-radius: 2px;
  }
  
  nav::-webkit-scrollbar-thumb:hover {
    background: #9CA3AF;
  }
</style>
