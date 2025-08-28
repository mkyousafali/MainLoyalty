<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { sendNotificationToCustomers } from '$lib/stores/notifications';
  import { fixNotificationBranchNames } from '$lib/utils/notificationFixer';

  let notifications: any[] = [];
  let isLoading = false;
  let error = '';
  let success = '';
  let isFixingNotifications = false;

  // Filters
  let selectedType = '';
  let selectedStatus = '';
  let searchTerm = '';

  // Create modal
  let showCreateModal = false;
  let formData = {
    type: 'system',
    title: '',
    title_ar: '',
    message: '',
    message_ar: '',
    recipient_type: 'all',
    target_customers: '',
    target_branches: '',
    target_card_types: '',
    channels: ['app'],
    priority: 'normal',
    scheduled_at: '',
    expires_at: ''
  };

  // Customer data for targeting
  let customers: any[] = [];
  let branches: any[] = [];
  let cardTypes: any[] = [];

  // Statistics
  let totalNotifications = 0;
  let unreadCount = 0;
  let notificationsByType: any = {};

  const notificationTypes = [
    { value: 'system', label: 'System Alert', icon: '🔔', color: 'gray' },
    { value: 'promotion', label: 'Promotion/Offer', icon: '🎉', color: 'green' },
    { value: 'welcome', label: 'Welcome Message', icon: '👋', color: 'blue' },
    { value: 'birthday', label: 'Birthday Reward', icon: '🎂', color: 'pink' },
    { value: 'upgrade', label: 'Card Upgrades', icon: '⬆️', color: 'blue' },
    { value: 'expiry', label: 'Expiry Warnings', icon: '⏰', color: 'yellow' },
    { value: 'transaction', label: 'Transaction Alert', icon: '💳', color: 'indigo' },
    { value: 'reward', label: 'Reward Assigned', icon: '🏆', color: 'purple' }
  ];

  const recipientTypes = [
    { value: 'all', label: 'All Customers', icon: '👥' },
    { value: 'customer', label: 'Specific Customers', icon: '👤' },
    { value: 'branch', label: 'Branch Customers', icon: '�' },
    { value: 'card_type', label: 'Card Type Holders', icon: '💳' }
  ];

  const channelOptions = [
    { value: 'app', label: 'In-App', icon: '📱', description: 'Show in customer dashboard' },
    { value: 'push', label: 'Push Notification', icon: '🔔', description: 'Browser/mobile push' },
    { value: 'sms', label: 'SMS', icon: '💬', description: 'Text message (requires SMS service)' },
    { value: 'email', label: 'Email', icon: '✉️', description: 'Email notification (requires email service)' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '📞', description: 'WhatsApp message (requires WhatsApp API)' }
  ];

  onMount(() => {
    loadNotifications();
    loadStatistics();
    loadCustomers();
    loadBranches();
    loadCardTypes();
  });

  async function loadCustomers() {
    try {
      const { data, error: loadError } = await supabase
        .from('customers')
        .select('id, name, mobile')
        .order('name');

      if (loadError) throw loadError;
      customers = data || [];
    } catch (err: any) {
      console.error('Failed to load customers:', err);
    }
  }

  async function loadBranches() {
    try {
      const { data, error: loadError } = await supabase
        .from('branches')
        .select('id, name_en, name_ar, location')
        .order('name_en');

      if (loadError) throw loadError;
      branches = data || [];
    } catch (err: any) {
      console.error('Failed to load branches:', err);
    }
  }

  async function loadCardTypes() {
    try {
      const { data, error: loadError } = await supabase
        .from('card_types')
        .select('id, name, tier_level')
        .order('tier_level');

      if (loadError) throw loadError;
      cardTypes = data || [];
    } catch (err: any) {
      console.error('Failed to load card types:', err);
    }
  }

  async function loadNotifications() {
    try {
      isLoading = true;
      
      // Load notifications without problematic relationships
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (selectedType) {
        query = query.eq('type', selectedType);
      }
      
      if (selectedStatus === 'read') {
        query = query.not('read_at', 'is', null);
      } else if (selectedStatus === 'unread') {
        query = query.is('read_at', null);
      }

      if (searchTerm) {
        query = query.ilike('message', `%${searchTerm}%`);
      }

      const { data, error: loadError } = await query;

      if (loadError) throw loadError;

      // If we need user data, load it separately and map it
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(n => n.visible_to).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', userIds);

          const usersMap = {};
          usersData?.forEach(user => {
            usersMap[user.id] = user;
          });

          notifications = data.map(notification => ({
            ...notification,
            visible_to_user: notification.visible_to ? usersMap[notification.visible_to] : null
          }));
        } else {
          notifications = data.map(notification => ({
            ...notification,
            visible_to_user: null
          }));
        }
      } else {
        notifications = data || [];
      }
    } catch (err: any) {
      error = `Failed to load notifications: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function loadStatistics() {
    try {
      // Total notifications
      const { count: total } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      totalNotifications = total || 0;

      // Unread notifications
      const { count: unread } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null);

      unreadCount = unread || 0;

      // Notifications by type
      const { data: typeData } = await supabase
        .from('notifications')
        .select('type');

      if (typeData) {
        notificationsByType = typeData.reduce((acc: any, notif: any) => {
          acc[notif.type] = (acc[notif.type] || 0) + 1;
          return acc;
        }, {});
      }

    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    }
  }

  function openCreateModal() {
    formData = {
      type: 'system',
      title: '',
      title_ar: '',
      message: '',
      message_ar: '',
      recipient_type: 'all',
      target_customers: '',
      target_branches: '',
      target_card_types: '',
      channels: ['app'],
      priority: 'normal',
      scheduled_at: '',
      expires_at: ''
    };
    showCreateModal = true;
  }

  function closeCreateModal() {
    showCreateModal = false;
    error = '';
    success = '';
  }

  async function createNotification() {
    try {
      isLoading = true;

      // Validate required fields
      if (!formData.title.trim()) {
        error = 'Title is required';
        return;
      }
      if (!formData.message.trim()) {
        error = 'Message is required';
        return;
      }
      if (formData.channels.length === 0) {
        error = 'At least one delivery channel must be selected';
        return;
      }

      // Prepare target audience data
      let targetAudience = {};
      switch (formData.recipient_type) {
        case 'customer':
          if (!formData.target_customers.trim()) {
            error = 'Please specify target customers';
            return;
          }
          targetAudience = {
            type: 'customer',
            customer_ids: formData.target_customers.split(',').map(id => id.trim()).filter(id => id)
          };
          break;
        case 'branch':
          if (!formData.target_branches.trim()) {
            error = 'Please select target branches';
            return;
          }
          targetAudience = {
            type: 'branch',
            branch_ids: formData.target_branches.split(',').map(id => id.trim()).filter(id => id)
          };
          break;
        case 'card_type':
          if (!formData.target_card_types.trim()) {
            error = 'Please select target card types';
            return;
          }
          targetAudience = {
            type: 'card_type',
            card_type_ids: formData.target_card_types.split(',').map(id => id.trim()).filter(id => id)
          };
          break;
        default:
          targetAudience = { type: 'all' };
      }

      // Use the new store function for better integration
      const notificationPayload = {
        type: formData.type,
        title: formData.title.trim(),
        title_ar: formData.title_ar.trim() || undefined,
        message: formData.message.trim(),
        message_ar: formData.message_ar.trim() || undefined,
        priority: formData.priority,
        channels: formData.channels,
        target_audience: targetAudience
      };

      console.log('Creating notification with payload:', notificationPayload);

      // Determine target customers if specific targeting
      let targetCustomers: string[] = [];
      if (formData.recipient_type === 'customer' && formData.target_customers.trim()) {
        targetCustomers = formData.target_customers.split(',').map(id => id.trim()).filter(id => id);
      }

      const notificationData = await sendNotificationToCustomers(notificationPayload, targetCustomers);

      // Create notification recipients based on target audience
      if (notificationData) {
        await createNotificationRecipients(notificationData.id, targetAudience);
      }

      success = 'Customer notification created successfully! It will be delivered through the selected channels.';
      closeCreateModal();
      loadNotifications();
      loadStatistics();
    } catch (err: any) {
      error = `Failed to create notification: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function createNotificationRecipients(notificationId: string, targetAudience: any) {
    try {
      let customerIds: string[] = [];

      switch (targetAudience.type) {
        case 'all':
          // Get all customer IDs
          const { data: allCustomers } = await supabase
            .from('customers')
            .select('id');
          customerIds = allCustomers?.map(c => c.id) || [];
          break;
        
        case 'customer':
          customerIds = targetAudience.customer_ids || [];
          break;
        
        case 'branch':
          // Get customers from specific branches
          const { data: branchCustomers } = await supabase
            .from('customers')
            .select('id')
            .in('branch_id', targetAudience.branch_ids || []);
          customerIds = branchCustomers?.map(c => c.id) || [];
          break;
        
        case 'card_type':
          // Get customers with specific card types
          const { data: cardTypeCustomers } = await supabase
            .from('customers')
            .select('id')
            .in('card_type_id', targetAudience.card_type_ids || []);
          customerIds = cardTypeCustomers?.map(c => c.id) || [];
          break;
      }

      // Create recipient records
      if (customerIds.length > 0) {
        const recipients = customerIds.map(customerId => ({
          notification_id: notificationId,
          customer_id: customerId,
          status: 'pending'
        }));

        const { error: recipientError } = await supabase
          .from('notification_recipients')
          .insert(recipients);

        if (recipientError) {
          console.error('Failed to create notification recipients:', recipientError);
        } else {
          console.log(`Created ${recipients.length} notification recipients`);
        }
      }
    } catch (err: any) {
      console.error('Failed to create notification recipients:', err);
    }
  }

  async function markAsRead(notification: any) {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notification.id);

      if (updateError) throw updateError;

      loadNotifications();
      loadStatistics();
    } catch (err: any) {
      error = `Failed to mark notification as read: ${err.message}`;
    }
  }

  async function markAsUnread(notification: any) {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: null })
        .eq('id', notification.id);

      if (updateError) throw updateError;

      loadNotifications();
      loadStatistics();
    } catch (err: any) {
      error = `Failed to mark notification as unread: ${err.message}`;
    }
  }

  async function deleteNotification(notification: any) {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      if (deleteError) throw deleteError;

      success = 'Notification deleted successfully!';
      loadNotifications();
      loadStatistics();
    } catch (err: any) {
      error = `Failed to delete notification: ${err.message}`;
    }
  }

  async function markAllAsRead() {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);

      if (updateError) throw updateError;

      success = 'All notifications marked as read!';
      loadNotifications();
      loadStatistics();
    } catch (err: any) {
      error = `Failed to mark all notifications as read: ${err.message}`;
    }
  }

  async function clearAllNotifications() {
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      success = 'All notifications cleared!';
      loadNotifications();
      loadStatistics();
    } catch (err: any) {
      error = `Failed to clear notifications: ${err.message}`;
    }
  }

  async function fixBranchNamesInNotifications() {
    try {
      isFixingNotifications = true;
      error = '';
      success = '';

      const result = await fixNotificationBranchNames();

      if (result.success) {
        success = `Successfully fixed ${result.updated} notification(s) with Arabic branch names!`;
        // Reload notifications to show updated content
        loadNotifications();
      } else {
        error = `Failed to fix notifications: ${result.error?.message || 'Unknown error'}`;
      }
    } catch (err: any) {
      error = `Error fixing notifications: ${err.message}`;
    } finally {
      isFixingNotifications = false;
    }
  }

  function getTypeConfig(type: string) {
    return notificationTypes.find(t => t.value === type) || notificationTypes[4];
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  function applyFilters() {
    loadNotifications();
  }

  function clearFilters() {
    selectedType = '';
    selectedStatus = '';
    searchTerm = '';
    loadNotifications();
  }
</script>

<div class="p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">📱 Customer Notification Center</h1>
          <p class="text-gray-600">Send notifications and alerts directly to your customers through multiple channels.</p>
        </div>
        <div class="flex space-x-3">
          <button
            on:click={markAllAsRead}
            class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
          >
            Mark All Read
          </button>
          <button
            on:click={clearAllNotifications}
            class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Clear All
          </button>
          <button
            on:click={fixBranchNamesInNotifications}
            disabled={isFixingNotifications}
            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
          >
            {isFixingNotifications ? '⏳ Fixing...' : '🔧 Fix Arabic Names'}
          </button>
          <button
            on:click={openCreateModal}
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            📱 Send to Customers
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="text-3xl text-blue-600 mr-4">🔔</div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Notifications</p>
            <p class="text-2xl font-bold text-gray-900">{totalNotifications}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="text-3xl text-red-600 mr-4">🔴</div>
          <div>
            <p class="text-sm font-medium text-gray-500">Unread</p>
            <p class="text-2xl font-bold text-gray-900">{unreadCount}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="text-3xl text-green-600 mr-4">✅</div>
          <div>
            <p class="text-sm font-medium text-gray-500">Read</p>
            <p class="text-2xl font-bold text-gray-900">{totalNotifications - unreadCount}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="text-3xl text-purple-600 mr-4">📊</div>
          <div>
            <p class="text-sm font-medium text-gray-500">Most Common</p>
            <p class="text-sm font-bold text-gray-900">
              {Object.keys(notificationsByType).length > 0 
                ? Object.entries(notificationsByType).sort(([,a], [,b]) => b - a)[0][0] 
                : 'None'}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Filters</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            bind:value={selectedType}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {#each notificationTypes as type}
              <option value={type.value}>{type.icon} {type.label}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            bind:value={selectedStatus}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search messages..."
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div class="flex gap-4">
        <button
          on:click={applyFilters}
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Apply Filters
        </button>
        <button
          on:click={clearFilters}
          class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold">
          Notifications ({notifications.length})
        </h2>
      </div>

      {#if isLoading}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Loading notifications...</p>
        </div>
      {:else if notifications.length === 0}
        <div class="p-8 text-center text-gray-500">
          No notifications found matching your criteria.
        </div>
      {:else}
        <div class="divide-y divide-gray-200">
          {#each notifications as notification}
            {@const typeConfig = getTypeConfig(notification.type)}
            <div class="p-6 hover:bg-gray-50 {!notification.read_at ? 'bg-blue-50 border-l-4 border-blue-400' : ''}">
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-4">
                  <div class="text-2xl">{typeConfig.icon}</div>
                  <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-{typeConfig.color}-100 text-{typeConfig.color}-800">
                        {typeConfig.label}
                      </span>
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        📱 Customer Notification
                      </span>
                      {#if !notification.read_at}
                        <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
                      {/if}
                      {#if notification.priority !== 'normal'}
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {
                          notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }">
                          {notification.priority === 'urgent' ? '🔴' : 
                           notification.priority === 'high' ? '🟠' : '🟢'} {notification.priority}
                        </span>
                      {/if}
                    </div>
                    
                    {#if notification.title}
                      <h4 class="font-semibold text-gray-900 mb-1">{notification.title}</h4>
                    {/if}
                    <p class="text-gray-900 mb-2">{notification.message}</p>
                    
                    {#if notification.message_ar}
                      <p class="text-gray-700 text-sm mb-2 text-right border-t pt-2" dir="rtl">{notification.message_ar}</p>
                    {/if}

                    <!-- Delivery Info -->
                    <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-2">
                      <span>📡 Channels:</span>
                      {#if notification.channels}
                        {#each notification.channels as channel}
                          <span class="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {channelOptions.find(c => c.value === channel)?.icon || '📱'}
                            {channelOptions.find(c => c.value === channel)?.label || channel}
                          </span>
                        {/each}
                      {:else}
                        <span class="text-gray-400">No channels specified</span>
                      {/if}
                    </div>

                    <!-- Target Audience -->
                    <div class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <span>🎯 Target:</span>
                      {#if notification.recipient_type === 'all'}
                        <span class="font-medium text-green-600">All Customers</span>
                      {:else if notification.recipient_type === 'customer'}
                        <span class="font-medium text-blue-600">Specific Customers</span>
                      {:else if notification.recipient_type === 'branch'}
                        <span class="font-medium text-purple-600">Branch Customers</span>
                      {:else if notification.recipient_type === 'card_type'}
                        <span class="font-medium text-orange-600">Card Type Holders</span>
                      {:else}
                        <span class="font-medium text-gray-600">{notification.recipient_type || 'Unknown'}</span>
                      {/if}
                    </div>

                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatTimeAgo(notification.created_at)}</span>
                      <span>• Status: {notification.status || 'sent'}</span>
                      {#if notification.scheduled_at}
                        <span>• Scheduled: {formatTimeAgo(notification.scheduled_at)}</span>
                      {/if}
                      {#if notification.read_at}
                        <span>• Read {formatTimeAgo(notification.read_at)}</span>
                      {/if}
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center space-x-2">
                  {#if notification.read_at}
                    <button
                      on:click={() => markAsUnread(notification)}
                      class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Mark Unread
                    </button>
                  {:else}
                    <button
                      on:click={() => markAsRead(notification)}
                      class="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Mark Read
                    </button>
                  {/if}
                  <button
                    on:click={() => deleteNotification(notification)}
                    class="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Create Notification Modal -->
    {#if showCreateModal}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
          <div class="mt-3">
            <h3 class="text-xl font-bold text-gray-900 mb-6">📱 Send Notification to Customers</h3>
            
            <form on:submit|preventDefault={createNotification} class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left Column -->
                <div class="space-y-4">
                  <!-- Notification Type -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      📋 Notification Type *
                    </label>
                    <select
                      bind:value={formData.type}
                      required
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {#each notificationTypes as type}
                        <option value={type.value}>{type.icon} {type.label}</option>
                      {/each}
                    </select>
                  </div>
                  
                  <!-- Title -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      📝 Title (English) *
                    </label>
                    <input
                      type="text"
                      bind:value={formData.title}
                      required
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter notification title..."
                    />
                  </div>

                  <!-- Arabic Title -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      🌍 Title (Arabic) - Optional
                    </label>
                    <input
                      type="text"
                      bind:value={formData.title_ar}
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      placeholder="أدخل عنوان الإشعار بالعربية..."
                      dir="rtl"
                    />
                  </div>

                  <!-- Quick Templates -->
                  <div class="bg-blue-50 p-4 rounded-lg">
                    <label class="block text-sm font-medium text-blue-800 mb-3">
                      ⚡ Quick Templates - Click to auto-fill
                    </label>
                    <div class="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        on:click={() => {
                          formData.type = 'promotion';
                          formData.title = 'New Offer Available 🛒';
                          formData.title_ar = 'عرض جديد متاح 🛒';
                          formData.message = 'Check out our new offer! Save money on your next purchase at [Branch Name].';
                          formData.message_ar = 'تحقق من عرضنا الجديد! وفر المال على مشترياتك القادمة في فرع [اسم الفرع].';
                        }}
                        class="text-left text-sm bg-white hover:bg-blue-100 border border-blue-200 rounded px-3 py-2 transition-colors"
                      >
                        🛒 New Offer Available / عرض جديد متاح
                      </button>
                      <button
                        type="button"
                        on:click={() => {
                          formData.type = 'promotion';
                          formData.title = 'Special Discount Available';
                          formData.title_ar = 'خصم خاص متاح';
                          formData.message = 'Limited time offer! Get special discounts on selected items.';
                          formData.message_ar = 'عرض لفترة محدودة! احصل على خصومات خاصة على المنتجات المختارة.';
                        }}
                        class="text-left text-sm bg-white hover:bg-blue-100 border border-blue-200 rounded px-3 py-2 transition-colors"
                      >
                        💰 Special Discount / خصم خاص
                      </button>
                      <button
                        type="button"
                        on:click={() => {
                          formData.type = 'promotion';
                          formData.title = 'Weekend Sale';
                          formData.title_ar = 'تخفيضات نهاية الأسبوع';
                          formData.message = 'Weekend special! Great deals on all your favorite products.';
                          formData.message_ar = 'عروض نهاية الأسبوع! صفقات رائعة على جميع منتجاتك المفضلة.';
                        }}
                        class="text-left text-sm bg-white hover:bg-blue-100 border border-blue-200 rounded px-3 py-2 transition-colors"
                      >
                        🎉 Weekend Sale / تخفيضات نهاية الأسبوع
                      </button>
                    </div>
                  </div>

                  <!-- Message -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      💬 Message (English) *
                    </label>
                    <textarea
                      bind:value={formData.message}
                      required
                      rows="4"
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter notification message..."
                    ></textarea>
                  </div>

                  <!-- Arabic Message -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      🌍 Message (Arabic) - Optional
                    </label>
                    <textarea
                      bind:value={formData.message_ar}
                      rows="3"
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      placeholder="أدخل رسالة الإشعار بالعربية..."
                      dir="rtl"
                    ></textarea>
                  </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4">
                  <!-- Target Audience -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Target Audience *
                    </label>
                    <select
                      bind:value={formData.recipient_type}
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {#each recipientTypes as recipient}
                        <option value={recipient.value}>{recipient.icon} {recipient.label}</option>
                      {/each}
                    </select>
                  </div>

                  <!-- Conditional targeting fields -->
                  {#if formData.recipient_type === 'customer'}
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        👤 Specific Customers (Customer IDs, comma separated)
                      </label>
                      <input
                        type="text"
                        bind:value={formData.target_customers}
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., cust123, cust456, cust789"
                      />
                      <p class="text-xs text-gray-500 mt-1">Enter customer IDs separated by commas</p>
                    </div>
                  {/if}

                  {#if formData.recipient_type === 'branch'}
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        🏪 Target Branches
                      </label>
                      <select
                        bind:value={formData.target_branches}
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select branches...</option>
                        {#each branches as branch}
                          <option value={branch.id}>{branch.name} - {branch.location}</option>
                        {/each}
                      </select>
                    </div>
                  {/if}

                  {#if formData.recipient_type === 'card_type'}
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        💳 Target Card Types
                      </label>
                      <select
                        bind:value={formData.target_card_types}
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select card type...</option>
                        {#each cardTypes as cardType}
                          <option value={cardType.id}>{cardType.name} (Tier {cardType.tier_level})</option>
                        {/each}
                      </select>
                    </div>
                  {/if}

                  <!-- Delivery Channels -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      📡 Delivery Channels * (Select multiple)
                    </label>
                    <div class="space-y-2">
                      {#each channelOptions as channel}
                        <label class="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            bind:group={formData.channels}
                            value={channel.value}
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div class="flex-1">
                            <div class="flex items-center space-x-2">
                              <span class="text-lg">{channel.icon}</span>
                              <span class="font-medium">{channel.label}</span>
                            </div>
                            <p class="text-xs text-gray-500">{channel.description}</p>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Priority -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      ⚡ Priority
                    </label>
                    <select
                      bind:value={formData.priority}
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="normal">🟡 Normal</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>

                  <!-- Schedule -->
                  <div class="grid grid-cols-1 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        ⏰ Schedule (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        bind:value={formData.scheduled_at}
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p class="text-xs text-gray-500 mt-1">Leave empty to send immediately</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  on:click={closeCreateModal}
                  class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  ❌ Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {#if isLoading}
                    ⏳ Sending...
                  {:else if formData.scheduled_at}
                    📅 Schedule Notification
                  {:else}
                    🚀 Send Now
                  {/if}
                </button>
              </div>
            </form>

            <!-- Preview Section -->
            {#if formData.title || formData.message}
              <div class="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <h4 class="font-medium text-gray-700 mb-2">📱 Preview (How it will look to customers):</h4>
                <div class="bg-white p-4 rounded-lg shadow-sm border">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="text-lg">{notificationTypes.find(t => t.value === formData.type)?.icon || '🔔'}</span>
                    <span class="font-semibold">{formData.title || 'Notification Title'}</span>
                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {notificationTypes.find(t => t.value === formData.type)?.label || 'System'}
                    </span>
                  </div>
                  <p class="text-gray-700">{formData.message || 'Notification message will appear here...'}</p>
                  {#if formData.message_ar}
                    <p class="text-gray-700 text-right mt-2 border-t pt-2" dir="rtl">{formData.message_ar}</p>
                  {/if}
                  <div class="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                    <span>Channels:</span>
                    {#each formData.channels as channel}
                      <span class="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {channelOptions.find(c => c.value === channel)?.icon} {channelOptions.find(c => c.value === channel)?.label}
                      </span>
                    {/each}
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Messages -->
    {#if error}
      <div class="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
        {success}
      </div>
    {/if}
  </div>
</div>
