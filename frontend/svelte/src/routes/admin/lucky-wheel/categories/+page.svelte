<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let isLoading = true;
  let categories: any[] = [];
  let showAddModal = false;
  let editingCategory: any = null;
  let newCategory = {
    name: '',
    color: '#8B5CF6',
    weight: 10,
    min_value: 5,
    max_value: 25,
    description: ''
  };
  
  onMount(() => {
    checkAdminAuth();
    loadCategories();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadCategories() {
    try {
      // This would connect to your database
      // For now, showing placeholder data
      categories = [
        {
          id: 1,
          name: 'Discount Coupon',
          color: '#10B981',
          weight: 40,
          min_value: 5,
          max_value: 25,
          description: 'Discount coupons for purchases',
          active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Cash Prize',
          color: '#F59E0B',
          weight: 20,
          min_value: 10,
          max_value: 50,
          description: 'Direct cash rewards',
          active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Free Product',
          color: '#EF4444',
          weight: 15,
          min_value: 15,
          max_value: 100,
          description: 'Free product vouchers',
          active: false,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 4,
          name: 'Loyalty Points',
          color: '#8B5CF6',
          weight: 25,
          min_value: 20,
          max_value: 200,
          description: 'Additional loyalty points',
          active: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function openAddModal() {
    newCategory = {
      name: '',
      color: '#8B5CF6',
      weight: 10,
      min_value: 5,
      max_value: 25,
      description: ''
    };
    showAddModal = true;
  }
  
  function editCategory(category: any) {
    editingCategory = { ...category };
    showAddModal = true;
  }
  
  async function saveCategory() {
    try {
      if (editingCategory) {
        // Update existing category
        console.log('Updating category:', editingCategory);
      } else {
        // Add new category
        console.log('Adding category:', newCategory);
      }
      showAddModal = false;
      editingCategory = null;
      await loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  }
  
  async function toggleCategory(categoryId: number) {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      category.active = !category.active;
      console.log('Toggling category:', category);
    }
  }
  
  async function deleteCategory(categoryId: number) {
    if (confirm('Are you sure you want to delete this category?')) {
      console.log('Deleting category:', categoryId);
      categories = categories.filter(c => c.id !== categoryId);
    }
  }
  
  function closeModal() {
    showAddModal = false;
    editingCategory = null;
  }
</script>

<svelte:head>
  <title>Prize Categories - Lucky Wheel Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            🎨 Prize Categories
          </h1>
          <p class="text-gray-600 mt-2">Manage wheel segments and prize categories</p>
        </div>
        <button 
          on:click={openAddModal}
          class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          ➕ Add Category
        </button>
      </div>
    </div>

    <!-- Categories Grid -->
    {#if isLoading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each categories as category}
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="h-4" style="background-color: {category.color}"></div>
            <div class="p-6">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-bold text-gray-900">{category.name}</h3>
                <div class="flex items-center space-x-2">
                  <span class={`px-2 py-1 text-xs rounded-full ${
                    category.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <p class="text-gray-600 text-sm mb-4">{category.description}</p>
              
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Weight:</span>
                  <span class="font-medium">{category.weight}%</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Value Range:</span>
                  <span class="font-medium">¤{category.min_value} - ¤{category.max_value}</span>
                </div>
              </div>
              
              <div class="flex space-x-2">
                <button 
                  on:click={() => editCategory(category)}
                  class="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button 
                  on:click={() => toggleCategory(category.id)}
                  class="flex-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  {category.active ? '⏸️' : '▶️'} {category.active ? 'Disable' : 'Enable'}
                </button>
                <button 
                  on:click={() => deleteCategory(category.id)}
                  class="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Add/Edit Category Modal -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
            {#if editingCategory}
              <input 
                type="text" 
                bind:value={editingCategory.name}
                placeholder="e.g., Discount Coupon"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            {:else}
              <input 
                type="text" 
                bind:value={newCategory.name}
                placeholder="e.g., Discount Coupon"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            {/if}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            {#if editingCategory}
              <textarea 
                bind:value={editingCategory.description}
                placeholder="Brief description of this prize category"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              ></textarea>
            {:else}
              <textarea 
                bind:value={newCategory.description}
                placeholder="Brief description of this prize category"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              ></textarea>
            {/if}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Segment Color</label>
            {#if editingCategory}
              <input 
                type="color" 
                bind:value={editingCategory.color}
                class="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            {:else}
              <input 
                type="color" 
                bind:value={newCategory.color}
                class="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            {/if}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Weight (%)</label>
            {#if editingCategory}
              <input 
                type="number" 
                bind:value={editingCategory.weight}
                min="1"
                max="100"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            {:else}
              <input 
                type="number" 
                bind:value={newCategory.weight}
                min="1"
                max="100"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            {/if}
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Min Value</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-gray-500">¤</span>
                {#if editingCategory}
                  <input 
                    type="number" 
                    bind:value={editingCategory.min_value}
                    min="1"
                    class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                {:else}
                  <input 
                    type="number" 
                    bind:value={newCategory.min_value}
                    min="1"
                    class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                {/if}
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Max Value</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-gray-500">¤</span>
                {#if editingCategory}
                  <input 
                    type="number" 
                    bind:value={editingCategory.max_value}
                    min="1"
                    class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                {:else}
                  <input 
                    type="number" 
                    bind:value={newCategory.max_value}
                    min="1"
                    class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                {/if}
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button 
            on:click={saveCategory}
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {editingCategory ? 'Update' : 'Create'} Category
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
