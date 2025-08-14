<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let users: any[] = [];
  let branches: any[] = [];
  let roles: any[] = [];
  let isLoading = false;
  let error = '';
  let success = '';

  // Create/Edit modal
  let showModal = false;
  let editingUser: any = null;
  let formData = {
    full_name: '',
    username: '',
    email: '',
    password: '',
    role_id: '',
    is_active: true
  };

  onMount(() => {
    loadInitialData();
    loadUsers();
  });

  async function loadInitialData() {
    try {
      const [branchesRes, rolesRes] = await Promise.all([
        supabase.from('branches').select('*').order('name_en'),
        supabase.from('roles').select('*').order('name')
      ]);

      branches = branchesRes.data || [];
      roles = rolesRes.data || [];
    } catch (err: any) {
      error = `Failed to load initial data: ${err.message}`;
    }
  }

  async function loadUsers() {
    try {
      isLoading = true;
      
      // Load admin users with role relationships
      const { data: usersData, error: loadError } = await supabase
        .from('admin_users')
        .select(`
          *,
          roles (
            id,
            name,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (loadError) throw loadError;

      // Map users with role relationships (branches aren't needed for admin users)
      users = (usersData || []).map(user => ({
        ...user,
        name: user.full_name, // Map full_name to name for display
        role: user.roles ? user.roles.name : 'No Role',
        role_name: user.roles?.name
      }));

    } catch (err: any) {
      error = `Failed to load users: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingUser = null;
    formData = {
      full_name: '',
      username: '',
      email: '',
      password: '',
      role_id: '',
      is_active: true
    };
    showModal = true;
  }

  function openEditModal(user: any) {
    editingUser = user;
    formData = {
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
      role_id: user.role_id || '',
      is_active: user.is_active
    };
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingUser = null;
    error = '';
    success = '';
  }

  async function saveUser() {
    try {
      isLoading = true;

      const payload: any = {
        full_name: formData.full_name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        role_id: formData.role_id || null,
        is_active: formData.is_active
      };

      // Only include password if provided
      if (formData.password) {
        // In a real app, you'd hash the password here  
        payload.password_hash = formData.password; // This should be hashed
      }

      if (editingUser) {
        // Update existing admin user
        const { error: updateError } = await supabase
          .from('admin_users')
          .update(payload)
          .eq('id', editingUser.id);

        if (updateError) throw updateError;
        success = 'Admin user updated successfully!';
      } else {
        // Create new admin user
        if (!formData.password) {
          throw new Error('Password is required for new users');
        }

        const { error: insertError } = await supabase
          .from('admin_users')
          .insert(payload);

        if (insertError) throw insertError;
        success = 'Admin user created successfully!';
      }

      closeModal();
      loadUsers();
    } catch (err: any) {
      error = `Failed to save user: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function toggleUserStatus(user: any) {
    try {
      const newStatus = !user.is_active;
      
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ is_active: newStatus })
        .eq('id', user.id);

      if (updateError) throw updateError;

      success = `Admin user ${newStatus ? 'activated' : 'deactivated'} successfully!`;
      loadUsers();
    } catch (err: any) {
      error = `Failed to update user status: ${err.message}`;
    }
  }

  async function deleteUser(user: any) {
    if (!confirm(`Are you sure you want to delete admin user "${user.full_name || user.username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      isLoading = true;

      const { error: deleteError } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', user.id);

      if (deleteError) throw deleteError;

      success = 'Admin user deleted successfully!';
      loadUsers();
    } catch (err: any) {
      error = `Failed to delete admin user: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function getRoleBadgeColor(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
</script>

<div class="p-6">
  <div class="max-w-7xl mx-auto">
  <!-- Page Header -->
  <div class="mb-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p class="text-gray-600">Manage admin users, roles, and permissions.</p>
      </div>
      <button
        on:click={openCreateModal}
        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        + Add User
      </button>
    </div>
  </div>

    <!-- Users Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold">
          Users ({users.length})
        </h2>
      </div>

      {#if isLoading}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Loading users...</p>
        </div>
      {:else if users.length === 0}
        <div class="p-8 text-center text-gray-500">
          No users found. Create your first user to get started.
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each users as user}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{user.full_name || user.username}</div>
                        <div class="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getRoleBadgeColor(user.role_name)}">
                      {user.role_name || 'No Role'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.username || 'N/A'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                 {user.status === 'active' ? 'bg-green-100 text-green-800' : 
                                   user.status === 'blocked' ? 'bg-red-100 text-red-800' : 
                                   'bg-gray-100 text-gray-800'}">
                      {user.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      on:click={() => openEditModal(user)}
                      class="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      on:click={() => toggleUserStatus(user)}
                      class="{user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}"
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      on:click={() => deleteUser(user)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Create/Edit Modal -->
    {#if showModal}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Create User'}
            </h3>
            
            <form on:submit|preventDefault={saveUser} class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  bind:value={formData.full_name}
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  bind:value={formData.username}
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john_doe"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  bind:value={formData.email}
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser ? '(leave empty to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  bind:value={formData.password}
                  required={!editingUser}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  bind:value={formData.role_id}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a role...</option>
                  {#each roles as role}
                    <option value={role.id}>{role.name}</option>
                  {/each}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  bind:value={formData.is_active}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>
              
              <div class="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  on:click={closeModal}
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !validateEmail(formData.email)}
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
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
