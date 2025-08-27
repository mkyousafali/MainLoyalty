<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let isLoading = true;
  let coupons: any[] = [];
  let showAddModal = false;
  let editingCoupon: any = null;
  let newCoupon = {
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase: 0,
    max_uses: 100,
    expires_at: '',
    active: true
  };
  
  onMount(() => {
    checkAdminAuth();
    loadCoupons();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadCoupons() {
    try {
      // This would connect to your database
      // For now, showing placeholder data
      coupons = [
        {
          id: 1,
          code: 'LUCKY10',
          description: '10% off your next purchase',
          discount_type: 'percentage',
          discount_value: 10,
          min_purchase: 50,
          max_uses: 100,
          used_count: 25,
          expires_at: '2024-12-31T23:59:59Z',
          active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          code: 'WHEEL25',
          description: '25 off when you spend 100 or more',
          discount_type: 'fixed',
          discount_value: 25,
          min_purchase: 100,
          max_uses: 50,
          used_count: 12,
          expires_at: '2024-06-30T23:59:59Z',
          active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          code: 'FREESHIP',
          description: 'Free shipping on any order',
          discount_type: 'shipping',
          discount_value: 0,
          min_purchase: 0,
          max_uses: 200,
          used_count: 89,
          expires_at: '2024-03-31T23:59:59Z',
          active: false,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function generateCouponCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (editingCoupon) {
      editingCoupon.code = code;
    } else {
      newCoupon.code = code;
    }
  }
  
  function openAddModal() {
    newCoupon = {
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 0,
      max_uses: 100,
      expires_at: '',
      active: true
    };
    showAddModal = true;
  }
  
  function editCoupon(coupon: any) {
    editingCoupon = { ...coupon };
    // Format date for input
    if (editingCoupon.expires_at) {
      editingCoupon.expires_at = new Date(editingCoupon.expires_at).toISOString().slice(0, 16);
    }
    showAddModal = true;
  }
  
  async function saveCoupon() {
    try {
      if (editingCoupon) {
        // Update existing coupon
        console.log('Updating coupon:', editingCoupon);
      } else {
        // Add new coupon
        console.log('Adding coupon:', newCoupon);
      }
      showAddModal = false;
      editingCoupon = null;
      await loadCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  }
  
  async function toggleCoupon(couponId: number) {
    const coupon = coupons.find(c => c.id === couponId);
    if (coupon) {
      coupon.active = !coupon.active;
      console.log('Toggling coupon:', coupon);
    }
  }
  
  async function deleteCoupon(couponId: number) {
    if (confirm('Are you sure you want to delete this coupon?')) {
      console.log('Deleting coupon:', couponId);
      coupons = coupons.filter(c => c.id !== couponId);
    }
  }
  
  function closeModal() {
    showAddModal = false;
    editingCoupon = null;
  }
  
  function getDiscountDisplay(coupon: any) {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    } else if (coupon.discount_type === 'fixed') {
      return `¤${coupon.discount_value}`;
    } else {
      return 'Free Shipping';
    }
  }
</script>

<svelte:head>
  <title>Coupon Management - Lucky Wheel Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            🎟️ Coupon Management
          </h1>
          <p class="text-gray-600 mt-2">Create and manage discount coupons for prizes</p>
        </div>
        <button 
          on:click={openAddModal}
          class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          ➕ Create Coupon
        </button>
      </div>
    </div>

    <!-- Coupons Table -->
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      {#if isLoading}
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each coupons as coupon}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-mono font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      {coupon.code}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">{coupon.description}</div>
                    {#if coupon.min_purchase > 0}
                      <div class="text-xs text-gray-500">Min purchase: ¤{coupon.min_purchase}</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-green-600">{getDiscountDisplay(coupon)}</div>
                    <div class="text-xs text-gray-500 capitalize">{coupon.discount_type}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{coupon.used_count} / {coupon.max_uses}</div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        class="bg-blue-600 h-2 rounded-full" 
                        style="width: {Math.min((coupon.used_count / coupon.max_uses) * 100, 100)}%"
                      ></div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(coupon.expires_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      coupon.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {coupon.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button 
                      on:click={() => editCoupon(coupon)}
                      class="text-blue-600 hover:text-blue-900"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      on:click={() => toggleCoupon(coupon.id)}
                      class="text-yellow-600 hover:text-yellow-900"
                    >
                      {coupon.active ? '⏸️' : '▶️'}
                    </button>
                    <button 
                      on:click={() => deleteCoupon(coupon.id)}
                      class="text-red-600 hover:text-red-900"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Add/Edit Coupon Modal -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-screen overflow-y-auto">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
            <div class="flex space-x-2">
              {#if editingCoupon}
                <input 
                  type="text" 
                  bind:value={editingCoupon.code}
                  placeholder="e.g., LUCKY10"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                />
              {:else}
                <input 
                  type="text" 
                  bind:value={newCoupon.code}
                  placeholder="e.g., LUCKY10"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                />
              {/if}
              <button 
                on:click={generateCouponCode}
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            {#if editingCoupon}
              <textarea 
                bind:value={editingCoupon.description}
                placeholder="Brief description of the discount"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              ></textarea>
            {:else}
              <textarea 
                bind:value={newCoupon.description}
                placeholder="Brief description of the discount"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              ></textarea>
            {/if}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
            {#if editingCoupon}
              <select 
                bind:value={editingCoupon.discount_type}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="shipping">Free Shipping</option>
              </select>
            {:else}
              <select 
                bind:value={newCoupon.discount_type}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="shipping">Free Shipping</option>
              </select>
            {/if}
          </div>
          
          {#if (editingCoupon?.discount_type || newCoupon.discount_type) !== 'shipping'}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Discount Value {(editingCoupon?.discount_type || newCoupon.discount_type) === 'percentage' ? '(%)' : '(¤)'}
              </label>
              {#if editingCoupon}
                <input 
                  type="number" 
                  bind:value={editingCoupon.discount_value}
                  min="1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {:else}
                <input 
                  type="number" 
                  bind:value={newCoupon.discount_value}
                  min="1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {/if}
            </div>
          {/if}
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Min Purchase (¤)</label>
              {#if editingCoupon}
                <input 
                  type="number" 
                  bind:value={editingCoupon.min_purchase}
                  min="0"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {:else}
                <input 
                  type="number" 
                  bind:value={newCoupon.min_purchase}
                  min="0"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {/if}
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Max Uses</label>
              {#if editingCoupon}
                <input 
                  type="number" 
                  bind:value={editingCoupon.max_uses}
                  min="1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {:else}
                <input 
                  type="number" 
                  bind:value={newCoupon.max_uses}
                  min="1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {/if}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Expires At</label>
            {#if editingCoupon}
              <input 
                type="datetime-local" 
                bind:value={editingCoupon.expires_at}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            {:else}
              <input 
                type="datetime-local" 
                bind:value={newCoupon.expires_at}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            {/if}
          </div>
          
          <div class="flex items-center space-x-3">
            {#if editingCoupon}
              <input 
                type="checkbox" 
                bind:checked={editingCoupon.active}
                id="couponActive"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
            {:else}
              <input 
                type="checkbox" 
                bind:checked={newCoupon.active}
                id="couponActive"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
            {/if}
            <label for="couponActive" class="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button 
            on:click={saveCoupon}
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {editingCoupon ? 'Update' : 'Create'} Coupon
          </button>
          <button 
            on:click={closeModal}
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
