<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { user, logout as authLogout } from '$lib/stores/auth';

  // Dashboard item definition
  const dashboardItem = {
    path: '/admin',
    label: 'Dashboard',
    icon: '🏠',
    description: 'Main overview panel'
  };

  // Categories with their buttons
  const categories = {
    dataManagement: {
      title: 'Data Management',
      icon: '📊',
      buttons: [
        { path: '/admin/upload-customers', label: 'Upload Customers', icon: '📥', description: 'Import customer data' },
        { path: '/admin/upload-transactions', label: 'Upload Transactions', icon: '📊', description: 'Import transaction data' }
      ]
    },
    customerOperations: {
      title: 'Customer Operations',
      icon: '👤',
      buttons: [
        { path: '/admin/customer-management', label: 'Customer Management', icon: '👤', description: 'Manage customer profiles' },
        { path: '/admin/assign-card-type', label: 'Assign Card Type', icon: '🏷️', description: 'Assign card types to customers' },
        { path: '/admin/extend-validity', label: 'Extend Validity', icon: '⏰', description: 'Extend card validity periods' }
      ]
    },
    loyaltyManagement: {
      title: 'Loyalty Management',
      icon: '🎁',
      buttons: [
        { path: '/admin/assign-coupons', label: 'Assign Coupons', icon: '🎯', description: 'Assign coupons to customers' },
        { path: '/admin/manage-card-types', label: 'Manage Card Types', icon: '💳', description: 'Configure card type settings' },
        { path: '/admin/manage-branches', label: 'Manage Branches', icon: '🏢', description: 'Branch management' }
      ]
    },
    systemManagement: {
      title: 'System Management',
      icon: '⚙️',
      buttons: [
        { path: '/admin/user-management', label: 'User Management', icon: '👥', description: 'Manage admin users' },
        { path: '/admin/user-roles', label: 'User Roles', icon: '🔐', description: 'Manage user roles and permissions' },
        { path: '/admin/support-settings', label: 'Support Settings', icon: '⚙️', description: 'Configure support options' },
        { path: '/admin/terms-management', label: 'Terms & Conditions', icon: '📋', description: 'Edit Terms & Conditions' },
        { path: '/admin/privacy-policy', label: 'Privacy Policy', icon: '🔒', description: 'Manage Privacy Policy content' },
        { path: '/admin/notification-center', label: 'Notification Center', icon: '🔔', description: 'Manage notifications' },
        { path: '/admin/export-data', label: 'Export Data', icon: '📤', description: 'Export system data' }
      ]
    },
    systemTools: {
      title: 'System Tools',
      icon: '🔧',
      buttons: [
        { path: '/admin/user-reports', label: 'User Reports', icon: '📋', description: 'User activity reports' },
        { path: '/admin/password-reset', label: 'Password Reset', icon: '🔑', description: 'Password reset management' },
        { path: '/admin/database-test', label: 'Database Test', icon: '🔧', description: 'Test database connections' }
      ]
    },
    reports: {
      title: 'Reports',
      icon: '📈',
      buttons: [
        { path: '/admin/reports/transaction-report', label: 'Transaction Report', icon: '💰', description: 'View transaction analytics and reports' },
        { path: '/admin/reports/customer-usage', label: 'Customer Usage Report', icon: '👥', description: 'Analyze customer usage patterns' },
        { path: '/admin/reports/registrations', label: 'Registrations Report', icon: '📝', description: 'Track customer registrations' }
      ]
    },
    adminTools: {
      title: 'Admin Tools',
      icon: '👑',
      buttons: [
        { path: '/admin/create-offer', label: 'Create Offer', icon: '➕', description: 'Create new promotional offers' },
        { path: '/admin/offers-management', label: 'Offers Management', icon: '📋', description: 'Manage all store offers' },
        { path: '/admin/set-master-admin', label: 'Set Master Admin', icon: '👑', description: 'Configure master admin settings' }
      ]
    }
  };

  let sidebarEl: HTMLElement;
  let activeCategory: string | null = null;
  let extensionPanelEl: HTMLElement;

  function toggleCategory(categoryKey: string) {
    if (activeCategory === categoryKey) {
      activeCategory = null;
    } else {
      activeCategory = categoryKey;
    }
  }

  function closeExtension() {
    activeCategory = null;
  }

  // Close extension when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (extensionPanelEl && !extensionPanelEl.contains(event.target as Node) && 
        sidebarEl && !sidebarEl.contains(event.target as Node)) {
      closeExtension();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="layout-container">
  <!-- Sidebar Navigation -->
  <aside class="sidebar" bind:this={sidebarEl}>
    <!-- Brand Logo -->
    <div class="sidebar-header">
      <div class="logo-container-simple">
        <img 
          src="/logo.png" 
          alt="Urban Market Logo" 
          class="logo-image-simple"
        />
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
      <!-- Dashboard Link -->
      <a 
        href={dashboardItem.path}
        class="nav-item dashboard {$page.url.pathname === dashboardItem.path ? 'active' : ''}"
        title={dashboardItem.description}
      >
        <span class="nav-icon">{dashboardItem.icon}</span>
        <span class="nav-label">{dashboardItem.label}</span>
      </a>

      <!-- Category Buttons -->
      {#each Object.entries(categories) as [categoryKey, category]}
        <button 
          class="category-item {activeCategory === categoryKey ? 'active' : ''}"
          on:click={() => toggleCategory(categoryKey)}
          title="Click to expand {category.title}"
        >
          <span class="nav-icon">{category.icon}</span>
          <span class="nav-label">{category.title}</span>
          <span class="expand-icon {activeCategory === categoryKey ? 'expanded' : ''}">▶</span>
        </button>
      {/each}
    </nav>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer">
      <button 
        class="logout-button"
        on:click={authLogout}
        title="Logout"
      >
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </div>
  </aside>

  <!-- Extension Panel for Category Buttons -->
  {#if activeCategory}
    <div 
      class="extension-panel"
      bind:this={extensionPanelEl}
      style="transform: translateX(0); opacity: 1;"
    >
      <div class="extension-header">
        <h3 class="extension-title">
          <span class="extension-icon">{categories[activeCategory].icon}</span>
          {categories[activeCategory].title}
        </h3>
        <button class="close-extension" on:click={closeExtension}>
          <span>✕</span>
        </button>
      </div>
      
      <div class="extension-content">
        {#each categories[activeCategory].buttons as button}
          <a 
            href={button.path}
            class="extension-item {$page.url.pathname === button.path ? 'active' : ''}"
            title={button.description}
            on:click={closeExtension}
          >
            <span class="extension-item-icon">{button.icon}</span>
            <div class="extension-item-content">
              <span class="extension-item-label">{button.label}</span>
              <span class="extension-item-description">{button.description}</span>
            </div>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <main 
    class="main-content {activeCategory ? 'with-extension' : ''}"
    role="main"
    aria-label="Main content"
  >
    <slot />
  </main>
</div>

<style>
  .layout-container {
    display: flex;
    min-height: 100vh;
    background: #f8fafc;
  }

  /* Sidebar Styles */
  .sidebar {
    width: 300px;
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    border-right: 2px solid rgba(59, 130, 246, 0.3);
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    z-index: 50;
  }

  .sidebar-header {
    padding: 2rem 1.5rem 1.5rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 120px;
  }

  .logo-container-simple {
    width: 140px;
    height: 80px;
    background: white;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .logo-container-simple:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  .logo-image-simple {
    width: 110px;
    height: 75px;
    object-fit: contain;
  }

  /* Sidebar Navigation */
  .sidebar-nav {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    margin: 0.25rem 0;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    border-left: 3px solid transparent;
  }

  .nav-item:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #dbeafe;
    border-left-color: rgba(59, 130, 246, 0.5);
    transform: translateX(2px);
  }

  .nav-item.active {
    background: rgba(59, 130, 246, 0.2);
    color: #dbeafe;
    border-left-color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
  }

  /* Dashboard button special styling */
  .nav-item.dashboard {
    background: rgba(251, 146, 60, 0.1);
    border: 1px solid rgba(251, 146, 60, 0.3);
    margin-bottom: 1rem;
  }

  .nav-item.dashboard:hover {
    background: rgba(251, 146, 60, 0.2);
    border-left-color: #fb923c;
    color: #fed7aa;
  }

  .nav-item.dashboard.active {
    background: rgba(251, 146, 60, 0.3);
    border-left-color: #fb923c;
    color: #fed7aa;
    box-shadow: 0 0 15px rgba(251, 146, 60, 0.3);
  }

  .nav-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .nav-label {
    font-weight: 500;
    font-size: 0.875rem;
  }

  /* Category buttons */
  .category-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    margin: 0.25rem 0;
    color: rgba(255, 255, 255, 0.7);
    border: none;
    background: transparent;
    border-radius: 8px;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    border-left: 3px solid transparent;
    width: 100%;
    text-align: left;
    cursor: pointer;
    position: relative;
  }

  .category-item:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #dbeafe;
    border-left-color: rgba(59, 130, 246, 0.5);
    transform: translateX(2px);
  }

  .category-item.active {
    background: rgba(59, 130, 246, 0.2);
    color: #dbeafe;
    border-left-color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
  }

  .expand-icon {
    margin-left: auto;
    font-size: 0.75rem;
    transition: transform 0.2s ease;
  }

  .expand-icon.expanded {
    transform: rotate(90deg);
  }

  /* Extension Panel */
  .extension-panel {
    position: fixed;
    left: 300px;
    top: 0;
    height: 100vh;
    width: 320px;
    background: linear-gradient(180deg, #1e293b 0%, #334155 50%, #1e293b 100%);
    border-right: 2px solid rgba(59, 130, 246, 0.3);
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
    z-index: 45;
    overflow-y: auto;
    transform: translateX(-100%);
    opacity: 0;
    transition: all 0.3s ease;
  }

  .extension-header {
    padding: 2rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .extension-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #dbeafe;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }

  .extension-icon {
    font-size: 1.25rem;
  }

  .close-extension {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .close-extension:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #dbeafe;
  }

  .extension-content {
    padding: 1rem;
  }

  .extension-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    margin: 0.5rem 0;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
    background: rgba(255, 255, 255, 0.05);
  }

  .extension-item:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #dbeafe;
    border-left-color: rgba(59, 130, 246, 0.5);
    transform: translateX(4px);
  }

  .extension-item.active {
    background: rgba(59, 130, 246, 0.2);
    color: #dbeafe;
    border-left-color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
  }

  .extension-item-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .extension-item-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .extension-item-label {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .extension-item-description {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.3;
  }

  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .logout-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .logout-button:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #dbeafe;
    transform: translateY(-1px);
  }

  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 300px;
    padding: 2rem;
    overflow-y: auto;
    background: #f8fafc;
    min-height: 100vh;
    transition: margin-left 0.3s ease;
  }

  .main-content.with-extension {
    margin-left: 620px;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    
    .sidebar.mobile-open {
      transform: translateX(0);
    }

    .extension-panel {
      width: 100%;
      left: 0;
    }
    
    .main-content {
      margin-left: 0;
      padding: 1rem;
    }

    .main-content.with-extension {
      margin-left: 0;
    }
  }
</style>
