<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let notifications: any[] = [];
  let isLoading = false;
  let error = '';
  let success = '';

  // Filters
  let selectedType = '';
  let selectedStatus = '';
  let searchTerm = '';

  // Create modal
  let showCreateModal = false;
  let formData = {
    type: 'system',
    message: '',
    visible_to: ''
  };

  // Statistics
  let totalNotifications = 0;
  let unreadCount = 0;
  let notificationsByType: any = {};

  const notificationTypes = [
    { value: 'upgrade', label: 'Card Upgrades', icon: '⬆️', color: 'blue' },
    { value: 'expiry', label: 'Expiry Warnings', icon: '⏰', color: 'yellow' },
    { value: 'gift_claim', label: 'Gift Claims', icon: '🎁', color: 'green' },
    { value: 'reward_assigned', label: 'Reward Assignments', icon: '🏆', color: 'purple' },
    { value: 'system', label: 'System Messages', icon: '🔔', color: 'gray' }
  ];

  onMount(() => {
    loadNotifications();
    loadStatistics();
  });

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
      message: '',
      visible_to: ''
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

      const payload = {
        type: formData.type,
        message: formData.message.trim(),
        visible_to: formData.visible_to || null
      };

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(payload);

      if (insertError) throw insertError;

      success = 'Notification created successfully!';
      closeCreateModal();
      loadNotifications();
      loadStatistics();
    } catch (err: any) {
      error = `Failed to create notification: ${err.message}`;
    } finally {
      isLoading = false;
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
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Notification Center</h1>
          <p class="text-gray-600">Manage system notifications and alerts.</p>
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
            on:click={openCreateModal}
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create Notification
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
                    <div class="flex items-center space-x-2 mb-1">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-{typeConfig.color}-100 text-{typeConfig.color}-800">
                        {typeConfig.label}
                      </span>
                      {#if !notification.read_at}
                        <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
                      {/if}
                    </div>
                    <p class="text-gray-900 mb-2">{notification.message}</p>
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatTimeAgo(notification.created_at)}</span>
                      {#if notification.visible_to_user}
                        <span>• To: {notification.visible_to_user.name}</span>
                      {:else}
                        <span>• To: All Admins</span>
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
        <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Create Notification</h3>
            
            <form on:submit|preventDefault={createNotification} class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  bind:value={formData.type}
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {#each notificationTypes as type}
                    <option value={type.value}>{type.icon} {type.label}</option>
                  {/each}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  bind:value={formData.message}
                  required
                  rows="3"
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notification message..."
                ></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Visible To (Optional)</label>
                <input
                  type="text"
                  bind:value={formData.visible_to}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty for all admins"
                />
                <p class="text-xs text-gray-500 mt-1">User ID to show this notification to specifically</p>
              </div>
              
              <div class="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  on:click={closeCreateModal}
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
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
