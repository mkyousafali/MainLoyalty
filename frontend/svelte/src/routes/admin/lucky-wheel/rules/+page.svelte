<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let isLoading = true;
  let rules: any[] = [];
  let showAddModal = false;
  let editingRule: any = null;
  let newRule = {
    name: '',
    description: '',
    condition_type: 'customer_level',
    condition_value: '',
    action_type: 'multiply_prize',
    action_value: '2',
    priority: 1,
    active: true
  };
  
  onMount(() => {
    checkAdminAuth();
    loadRules();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadRules() {
    try {
      // This would connect to your database
      // For now, showing placeholder data
      rules = [
        {
          id: 1,
          name: 'VIP Customer Bonus',
          description: 'VIP customers get 2x prize value',
          condition_type: 'customer_level',
          condition_value: 'VIP',
          action_type: 'multiply_prize',
          action_value: '2',
          priority: 1,
          active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'First Time Spinner',
          description: 'First time users get guaranteed minimum 10 value',
          condition_type: 'spin_count',
          condition_value: '1',
          action_type: 'minimum_prize',
          action_value: '10',
          priority: 2,
          active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Weekend Special',
          description: 'Weekend spins get bonus points',
          condition_type: 'time_based',
          condition_value: 'weekend',
          action_type: 'add_bonus',
          action_value: '5',
          priority: 3,
          active: false,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 4,
          name: 'High Spender Reward',
          description: 'Customers who spent over 500 get enhanced prizes',
          condition_type: 'total_spent',
          condition_value: '500',
          action_type: 'multiply_prize',
          action_value: '1.5',
          priority: 2,
          active: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function openAddModal() {
    newRule = {
      name: '',
      description: '',
      condition_type: 'customer_level',
      condition_value: '',
      action_type: 'multiply_prize',
      action_value: '2',
      priority: 1,
      active: true
    };
    showAddModal = true;
  }
  
  function editRule(rule: any) {
    editingRule = { ...rule };
    showAddModal = true;
  }
  
  async function saveRule() {
    try {
      if (editingRule) {
        // Update existing rule
        console.log('Updating rule:', editingRule);
      } else {
        // Add new rule
        console.log('Adding rule:', newRule);
      }
      showAddModal = false;
      editingRule = null;
      await loadRules();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  }
  
  async function toggleRule(ruleId: number) {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      rule.active = !rule.active;
      console.log('Toggling rule:', rule);
    }
  }
  
  async function deleteRule(ruleId: number) {
    if (confirm('Are you sure you want to delete this rule?')) {
      console.log('Deleting rule:', ruleId);
      rules = rules.filter(r => r.id !== ruleId);
    }
  }
  
  function closeModal() {
    showAddModal = false;
    editingRule = null;
  }
  
  function getConditionDisplay(rule: any) {
    switch (rule.condition_type) {
      case 'customer_level':
        return `Customer Level: ${rule.condition_value}`;
      case 'spin_count':
        return `Spin Count: ${rule.condition_value}`;
      case 'time_based':
        return `Time: ${rule.condition_value}`;
      case 'total_spent':
        return `Total Spent: ¤${rule.condition_value}`;
      default:
        return `${rule.condition_type}: ${rule.condition_value}`;
    }
  }
  
  function getActionDisplay(rule: any) {
    switch (rule.action_type) {
      case 'multiply_prize':
        return `Multiply Prize by ${rule.action_value}x`;
      case 'minimum_prize':
        return `Minimum Prize: ¤${rule.action_value}`;
      case 'add_bonus':
        return `Add Bonus: ¤${rule.action_value}`;
      case 'extra_spin':
        return `Grant ${rule.action_value} Extra Spins`;
      default:
        return `${rule.action_type}: ${rule.action_value}`;
    }
  }
</script>

<svelte:head>
  <title>Business Rules - Lucky Wheel Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            ⚖️ Business Rules
          </h1>
          <p class="text-gray-600 mt-2">Define conditions and actions for special prize scenarios</p>
        </div>
        <button 
          on:click={openAddModal}
          class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          ➕ Add Rule
        </button>
      </div>
    </div>

    <!-- Rules List -->
    {#if isLoading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    {:else}
      <div class="space-y-4">
        {#each rules.sort((a, b) => a.priority - b.priority) as rule}
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h3 class="text-xl font-bold text-gray-900">{rule.name}</h3>
                  <span class="text-sm text-gray-500">Priority: {rule.priority}</span>
                  <span class={`px-2 py-1 text-xs rounded-full ${
                    rule.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p class="text-gray-600 mb-4">{rule.description}</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="bg-blue-50 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-900 mb-2">🔍 Condition</h4>
                    <p class="text-blue-800">{getConditionDisplay(rule)}</p>
                  </div>
                  <div class="bg-green-50 rounded-lg p-4">
                    <h4 class="font-semibold text-green-900 mb-2">⚡ Action</h4>
                    <p class="text-green-800">{getActionDisplay(rule)}</p>
                  </div>
                </div>
              </div>
              
              <div class="flex space-x-2 ml-6">
                <button 
                  on:click={() => editRule(rule)}
                  class="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button 
                  on:click={() => toggleRule(rule.id)}
                  class="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  {rule.active ? '⏸️ Disable' : '▶️ Enable'}
                </button>
                <button 
                  on:click={() => deleteRule(rule.id)}
                  class="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Add/Edit Rule Modal -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          {editingRule ? 'Edit Business Rule' : 'Create New Business Rule'}
        </h2>
        
        <div class="space-y-6">
          <!-- Basic Info -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
              {#if editingRule}
                <input 
                  type="text" 
                  bind:value={editingRule.name}
                  placeholder="e.g., VIP Customer Bonus"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {:else}
                <input 
                  type="text" 
                  bind:value={newRule.name}
                  placeholder="e.g., VIP Customer Bonus"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {/if}
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              {#if editingRule}
                <textarea 
                  bind:value={editingRule.description}
                  placeholder="Brief description of what this rule does"
                  rows="2"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                ></textarea>
              {:else}
                <textarea 
                  bind:value={newRule.description}
                  placeholder="Brief description of what this rule does"
                  rows="2"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                ></textarea>
              {/if}
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Priority (lower = higher priority)</label>
              {#if editingRule}
                <input 
                  type="number" 
                  bind:value={editingRule.priority}
                  min="1"
                  max="10"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {:else}
                <input 
                  type="number" 
                  bind:value={newRule.priority}
                  min="1"
                  max="10"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {/if}
            </div>
          </div>
          
          <!-- Condition Section -->
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-blue-900 mb-4">🔍 Condition (When to trigger)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Condition Type</label>
                {#if editingRule}
                  <select 
                    bind:value={editingRule.condition_type}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="customer_level">Customer Level</option>
                    <option value="spin_count">Spin Count</option>
                    <option value="time_based">Time Based</option>
                    <option value="total_spent">Total Spent</option>
                    <option value="purchase_amount">Recent Purchase Amount</option>
                  </select>
                {:else}
                  <select 
                    bind:value={newRule.condition_type}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="customer_level">Customer Level</option>
                    <option value="spin_count">Spin Count</option>
                    <option value="time_based">Time Based</option>
                    <option value="total_spent">Total Spent</option>
                    <option value="purchase_amount">Recent Purchase Amount</option>
                  </select>
                {/if}
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Condition Value</label>
                {#if editingRule}
                  <input 
                    type="text" 
                    bind:value={editingRule.condition_value}
                    placeholder="e.g., VIP, 1, weekend, 500"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                {:else}
                  <input 
                    type="text" 
                    bind:value={newRule.condition_value}
                    placeholder="e.g., VIP, 1, weekend, 500"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                {/if}
              </div>
            </div>
          </div>
          
          <!-- Action Section -->
          <div class="bg-green-50 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-green-900 mb-4">⚡ Action (What to do)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                {#if editingRule}
                  <select 
                    bind:value={editingRule.action_type}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="multiply_prize">Multiply Prize</option>
                    <option value="minimum_prize">Set Minimum Prize</option>
                    <option value="add_bonus">Add Bonus Amount</option>
                    <option value="extra_spin">Grant Extra Spins</option>
                    <option value="free_spin">Free Spin (No Limit Deduction)</option>
                  </select>
                {:else}
                  <select 
                    bind:value={newRule.action_type}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="multiply_prize">Multiply Prize</option>
                    <option value="minimum_prize">Set Minimum Prize</option>
                    <option value="add_bonus">Add Bonus Amount</option>
                    <option value="extra_spin">Grant Extra Spins</option>
                    <option value="free_spin">Free Spin (No Limit Deduction)</option>
                  </select>
                {/if}
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Action Value</label>
                {#if editingRule}
                  <input 
                    type="text" 
                    bind:value={editingRule.action_value}
                    placeholder="e.g., 2, 10, 5, 1"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                {:else}
                  <input 
                    type="text" 
                    bind:value={newRule.action_value}
                    placeholder="e.g., 2, 10, 5, 1"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                {/if}
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            {#if editingRule}
              <input 
                type="checkbox" 
                bind:checked={editingRule.active}
                id="ruleActive"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
            {:else}
              <input 
                type="checkbox" 
                bind:checked={newRule.active}
                id="ruleActive"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
            {/if}
            <label for="ruleActive" class="text-sm font-medium text-gray-700">Rule is Active</label>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button 
            on:click={saveRule}
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {editingRule ? 'Update' : 'Create'} Rule
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
