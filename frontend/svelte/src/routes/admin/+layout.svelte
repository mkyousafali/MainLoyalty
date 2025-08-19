<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { user, logout as authLogout } from '$lib/stores/auth';
  import { language, toggleLanguage, t } from '$lib/stores/language';
  import { customerNotifications, unreadNotificationCount, loadCustomerNotifications, markAsRead } from '$lib/stores/notifications';

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

  // Notification panel state
  let showNotificationPanel = false;

  function toggleNotificationPanel() {
    showNotificationPanel = !showNotificationPanel;
  }

  function closeNotificationPanel() {
    showNotificationPanel = false;
  }

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
    // Also close notification panel when clicking outside
    if (showNotificationPanel && !(event.target as Element).closest('.notification-area')) {
      closeNotificationPanel();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    // Load notifications for admin users too
    loadCustomerNotifications($language);
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
    <!-- Admin Top Bar -->
    <div class="admin-top-bar">
      <div class="admin-top-bar-content">
        <!-- Page Title Area -->
        <div class="page-title-area">
          <h1 class="page-title">Admin Panel</h1>
        </div>

        <!-- Right Side Controls -->
        <div class="top-bar-controls">
          <!-- Notification Bell -->
          <div class="notification-area relative">
            <button 
              on:click={toggleNotificationPanel}
              class="flex items-center justify-center bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-700 hover:text-yellow-800 p-3 rounded-xl font-medium transition-all duration-200 border border-yellow-200/60 hover:border-yellow-300 shadow-sm hover:shadow-md transform hover:scale-105 group relative"
              title="Notifications"
              aria-label="Notifications"
            >
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              
              <!-- Notification badge -->
              {#if $unreadNotificationCount > 0}
                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {$unreadNotificationCount > 99 ? '99+' : $unreadNotificationCount}
                </span>
              {/if}
              
              <!-- Glow effect -->
              <div class="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            <!-- Notification Panel -->
            {#if showNotificationPanel}
              <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">🔔 Notifications</h3>
                  <button 
                    on:click={closeNotificationPanel}
                    class="text-gray-400 hover:text-gray-600 transition-colors"
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
                      <p>No notifications yet</p>
                      <p class="text-sm">We'll notify you about important updates</p>
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
                                {notification.title}
                              </p>
                              <p class="text-sm text-gray-500 line-clamp-2">
                                {notification.message}
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
                        View All Notifications →
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

          <!-- Language Toggle -->
          <button 
            on:click={toggleLanguage}
            class="flex items-center justify-center bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 hover:text-indigo-800 p-3 rounded-xl font-medium transition-all duration-200 border border-indigo-200/60 hover:border-indigo-300 shadow-sm hover:shadow-md transform hover:scale-105 group relative"
            title="Toggle Language"
            aria-label="Toggle Language"
          >
            <span class="text-sm font-semibold group-hover:scale-110 transition-transform duration-200">
              {$language === 'en' ? 'عربي' : 'EN'}
            </span>
            <div class="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-indigo-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>

          <!-- Admin User Info & Logout -->
          <div class="admin-user-info">
            <span class="text-sm text-gray-600">Admin</span>
            <button 
              class="logout-btn"
              on:click={authLogout}
              title="Logout"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Page Content -->
    <div class="page-content">
      <slot />
    </div>
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
    background: #f8fafc;
    min-height: 100vh;
    transition: margin-left 0.3s ease;
    display: flex;
    flex-direction: column;
  }

  .main-content.with-extension {
    margin-left: 620px;
  }

  /* Admin Top Bar */
  .admin-top-bar {
    background: linear-gradient(90deg, #ffffff 0%, #f8fafc 100%);
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 40;
  }

  .admin-top-bar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    max-width: none;
  }

  .page-title-area {
    flex: 1;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .top-bar-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .admin-user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-left: 1rem;
    border-left: 1px solid #e2e8f0;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    color: #dc2626;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #b91c1c;
    transform: translateY(-1px);
  }

  /* Page Content */
  .page-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
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
