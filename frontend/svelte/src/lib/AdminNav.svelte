<script lang="ts">
  import { language, t } from '$lib/stores/language';
  
  export let currentPage: string = '';
  
  const navItems = [
    { href: '/admin', key: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/admin/manage-branches', key: 'manageBranches', icon: '🏪', label: 'Manage Branches' },
    { href: '/admin/upload-customers', key: 'uploadCustomers', icon: '📤', label: 'Upload Customers' },
    { href: '/admin/upload-transactions', key: 'uploadTransactions', icon: '📊', label: 'Upload Transactions' },
    { href: '/admin/manage-card-types', key: 'manageCardTypes', icon: '💳', label: 'Card Types' },
    { href: '/admin/assign-card-type', key: 'assignCardType', icon: '🎯', label: 'Assign Cards' },
    { href: '/admin/customer-management', key: 'customerManagement', icon: '👥', label: 'Customers' },
    { href: '/admin/notification-center', key: 'notificationCenter', icon: '📧', label: 'Notifications' },
    { href: '/admin/support-settings', key: 'supportSettings', icon: '⚙️', label: 'Settings' },
    { href: '/admin/export-data', key: 'exportData', icon: '📋', label: 'Export' }
  ];
</script>

<nav class="bg-white rounded-lg shadow-md mb-6 p-4">
  <div class="flex flex-wrap gap-2" class:flex-row-reverse={$language === 'ar'}>
    {#each navItems as item}
      {@const isCurrent = currentPage === item.key}
      <a 
        href={item.href} 
        class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition {isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700'}"
      >
        <span>{item.icon}</span>
        <span>{$t[item.key] || item.label}</span>
      </a>
    {/each}
  </div>
</nav>

<style>
  .logo-image-simple {
    width: 70px;
    height: 60px;
    object-fit: contain;
  }
</style>