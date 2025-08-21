<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  
  let isLoading = false;
  let error = '';
  let success = '';
  let branches: any[] = [];
  let staffUsers: any[] = [];
  let loadingStaff = false;
  
  // Form data for creating new staff
  let newStaff = {
    username: '',
    password: '',
    full_name: '',
    phone: '',
    branch_id: '',
    can_redeem_coupons: true,
    can_scan_qr: true,
    can_search_customers: true,
    can_view_history: true
  };
  
  onMount(() => {
    checkAdminAuth();
    loadBranches();
    loadStaffUsers();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadBranches() {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, name_en, name_ar')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      branches = data || [];
    } catch (err: any) {
      console.error('Error loading branches:', err);
    }
  }
  
  async function loadStaffUsers() {
    try {
      loadingStaff = true;
      const { data, error } = await supabase
        .from('checkout_staff')
        .select(`
          *,
          branches (
            name,
            name_en,
            name_ar
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      staffUsers = data || [];
    } catch (err: any) {
      console.error('Error loading staff users:', err);
    } finally {
      loadingStaff = false;
    }
  }
  
  async function createStaffUser() {
    if (!validateForm()) return;
    
    try {
      isLoading = true;
      error = '';
      success = '';
      
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      
      const { data, error: insertError } = await supabase
        .from('checkout_staff')
        .insert([{
          username: newStaff.username.trim(),
          password_hash: newStaff.password, // In production, hash on backend
          full_name: newStaff.full_name.trim(),
          phone: newStaff.phone.trim(),
          branch_id: newStaff.branch_id || null,
          can_redeem_coupons: newStaff.can_redeem_coupons,
          can_scan_qr: newStaff.can_scan_qr,
          can_search_customers: newStaff.can_search_customers,
          can_view_history: newStaff.can_view_history,
          created_by: adminUser.username || adminUser.email || 'admin',
          is_active: true
        }]);
      
      if (insertError) throw insertError;
      
      success = 'Checkout staff user created successfully!';
      resetForm();
      await loadStaffUsers();
      
    } catch (err: any) {
      console.error('Error creating staff user:', err);
      error = err.message || 'Failed to create staff user';
    } finally {
      isLoading = false;
    }
  }
  
  function validateForm(): boolean {
    if (!newStaff.username.trim()) {
      error = 'Username is required';
      return false;
    }
    if (newStaff.username.length < 3) {
      error = 'Username must be at least 3 characters';
      return false;
    }
    if (!newStaff.password.trim()) {
      error = 'Password is required';
      return false;
    }
    if (newStaff.password.length < 6) {
      error = 'Password must be at least 6 characters';
      return false;
    }
    if (!newStaff.full_name.trim()) {
      error = 'Full name is required';
      return false;
    }
    if (!newStaff.phone.trim()) {
      error = 'Phone number is required';
      return false;
    }
    return true;
  }
  
  function resetForm() {
    newStaff = {
      username: '',
      password: '',
      full_name: '',
      phone: '',
      branch_id: '',
      can_redeem_coupons: true,
      can_scan_qr: true,
      can_search_customers: true,
      can_view_history: true
    };
  }
  
  async function toggleStaffStatus(staffId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('checkout_staff')
        .update({ is_active: !currentStatus })
        .eq('id', staffId);
      
      if (error) throw error;
      
      await loadStaffUsers();
    } catch (err: any) {
      console.error('Error updating staff status:', err);
      error = 'Failed to update staff status';
    }
  }
</script>

<svelte:head>
  <title>Create Checkout Staff - MainLoyalty Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            👤 Create Checkout Staff Users
          </h1>
          <p class="text-gray-600 mt-2">Manage checkout staff accounts for prize redemption</p>
        </div>
        <div class="text-sm text-gray-500">
          <p>Access: Customer Login → Click 10 times → Checkout Staff Login</p>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Create New Staff Form -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Create New Staff User</h2>
        
        {#if error}
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-600">{error}</p>
          </div>
        {/if}
        
        {#if success}
          <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-green-600">{success}</p>
          </div>
        {/if}
        
        <form on:submit|preventDefault={createStaffUser} class="space-y-4">
          <!-- Username -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              bind:value={newStaff.username}
              placeholder="Enter unique username"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <!-- Password -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              bind:value={newStaff.password}
              placeholder="Enter secure password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <!-- Full Name -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              bind:value={newStaff.full_name}
              placeholder="Enter full name"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <!-- Phone -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              bind:value={newStaff.phone}
              placeholder="Enter phone number"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <!-- Branch -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Branch (Optional)
            </label>
            <select
              bind:value={newStaff.branch_id}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Branches</option>
              {#each branches as branch}
                <option value={branch.id}>{branch.name || branch.name_en}</option>
              {/each}
            </select>
          </div>
          
          <!-- Permissions -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-700">Permissions</h3>
            
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={newStaff.can_redeem_coupons}
                class="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="text-sm text-gray-700">Can Redeem Coupons</span>
            </label>
            
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={newStaff.can_scan_qr}
                class="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="text-sm text-gray-700">Can Scan QR Codes</span>
            </label>
            
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={newStaff.can_search_customers}
                class="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="text-sm text-gray-700">Can Search Customers</span>
            </label>
            
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={newStaff.can_view_history}
                class="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="text-sm text-gray-700">Can View History</span>
            </label>
          </div>
          
          <!-- Submit Button -->
          <button
            type="submit"
            disabled={isLoading}
            class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Staff User'}
          </button>
        </form>
      </div>
      
      <!-- Existing Staff Users -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900">Existing Staff Users</h2>
          <button
            on:click={loadStaffUsers}
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
        
        {#if loadingStaff}
          <div class="flex justify-center items-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        {:else if staffUsers.length === 0}
          <div class="text-center py-8">
            <div class="text-4xl mb-4">👤</div>
            <p class="text-gray-600">No checkout staff users created yet</p>
          </div>
        {:else}
          <div class="space-y-4 max-h-96 overflow-y-auto">
            {#each staffUsers as staff}
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-900">{staff.full_name}</h3>
                  <div class="flex items-center gap-2">
                    <span class={`px-2 py-1 rounded-full text-xs font-semibold ${
                      staff.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {staff.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      on:click={() => toggleStaffStatus(staff.id, staff.is_active)}
                      class="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                    >
                      {staff.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
                
                <div class="text-sm text-gray-600 space-y-1">
                  <p><span class="font-medium">Username:</span> {staff.username}</p>
                  <p><span class="font-medium">Phone:</span> {staff.phone}</p>
                  <p><span class="font-medium">Branch:</span> {staff.branches?.name || 'All Branches'}</p>
                  <p><span class="font-medium">Created:</span> {new Date(staff.created_at).toLocaleDateString()}</p>
                  {#if staff.last_login}
                    <p><span class="font-medium">Last Login:</span> {new Date(staff.last_login).toLocaleString()}</p>
                  {/if}
                </div>
                
                <div class="mt-3 flex flex-wrap gap-1">
                  {#if staff.can_redeem_coupons}
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Redeem</span>
                  {/if}
                  {#if staff.can_scan_qr}
                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Scan QR</span>
                  {/if}
                  {#if staff.can_search_customers}
                    <span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Search</span>
                  {/if}
                  {#if staff.can_view_history}
                    <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">History</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Instructions -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
      <h3 class="text-lg font-bold text-blue-900 mb-3">🔑 Access Instructions</h3>
      <div class="text-blue-800 space-y-2">
        <p><strong>For Checkout Staff:</strong></p>
        <ol class="list-decimal list-inside space-y-1 ml-4">
          <li>Go to the customer login page</li>
          <li>Click on the "Customer Login" badge 10 times quickly</li>
          <li>This will redirect to the checkout staff login page</li>
          <li>Use the username and password created here to login</li>
          <li>Access the separate checkout staff dashboard for prize redemption</li>
        </ol>
        <p class="mt-3"><strong>Note:</strong> The checkout staff system is completely separate from the admin panel for security.</p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom scrollbar for staff list */
  .max-h-96::-webkit-scrollbar {
    width: 6px;
  }
  
  .max-h-96::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .max-h-96::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .max-h-96::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>
