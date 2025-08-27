<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let isLoading = true;
  let campaigns: any[] = [];
  let showAddModal = false;
  let editingCampaign: any = null;
  let newCampaign = {
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    target_audience: 'all',
    bonus_multiplier: 1.5,
    extra_spins: 0,
    min_purchase: 0,
    active: true
  };
  
  onMount(() => {
    checkAdminAuth();
    loadCampaigns();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadCampaigns() {
    try {
      // This would connect to your database
      // For now, showing placeholder data
      campaigns = [
        {
          id: 1,
          name: 'New Year Special',
          description: 'Double prizes for all spins during New Year week',
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-07T23:59:59Z',
          target_audience: 'all',
          bonus_multiplier: 2.0,
          extra_spins: 1,
          min_purchase: 0,
          active: false,
          participants: 245,
          total_spins: 1250,
          total_prizes: 15600,
          created_at: '2023-12-25T00:00:00Z'
        },
        {
          id: 2,
          name: 'VIP Weekend',
          description: 'Exclusive weekend campaign for VIP customers',
          start_date: '2024-02-10T00:00:00Z',
          end_date: '2024-02-11T23:59:59Z',
          target_audience: 'vip',
          bonus_multiplier: 1.5,
          extra_spins: 2,
          min_purchase: 100,
          active: false,
          participants: 89,
          total_spins: 445,
          total_prizes: 8900,
          created_at: '2024-02-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Spring Launch',
          description: 'Celebrate our spring collection launch',
          start_date: '2024-03-20T00:00:00Z',
          end_date: '2024-03-31T23:59:59Z',
          target_audience: 'new',
          bonus_multiplier: 1.25,
          extra_spins: 0,
          min_purchase: 50,
          active: true,
          participants: 156,
          total_spins: 890,
          total_prizes: 6750,
          created_at: '2024-03-15T00:00:00Z'
        }
      ];
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function openAddModal() {
    // Set default dates
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    newCampaign = {
      name: '',
      description: '',
      start_date: tomorrow.toISOString().slice(0, 16),
      end_date: nextWeek.toISOString().slice(0, 16),
      target_audience: 'all',
      bonus_multiplier: 1.5,
      extra_spins: 0,
      min_purchase: 0,
      active: true
    };
    showAddModal = true;
  }
  
  function editCampaign(campaign: any) {
    editingCampaign = { ...campaign };
    // Format dates for input
    if (editingCampaign.start_date) {
      editingCampaign.start_date = new Date(editingCampaign.start_date).toISOString().slice(0, 16);
    }
    if (editingCampaign.end_date) {
      editingCampaign.end_date = new Date(editingCampaign.end_date).toISOString().slice(0, 16);
    }
    showAddModal = true;
  }
  
  async function saveCampaign() {
    try {
      if (editingCampaign) {
        // Update existing campaign
        console.log('Updating campaign:', editingCampaign);
      } else {
        // Add new campaign
        console.log('Adding campaign:', newCampaign);
      }
      showAddModal = false;
      editingCampaign = null;
      await loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  }
  
  async function toggleCampaign(campaignId: number) {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      campaign.active = !campaign.active;
      console.log('Toggling campaign:', campaign);
    }
  }
  
  async function deleteCampaign(campaignId: number) {
    if (confirm('Are you sure you want to delete this campaign?')) {
      console.log('Deleting campaign:', campaignId);
      campaigns = campaigns.filter(c => c.id !== campaignId);
    }
  }
  
  function closeModal() {
    showAddModal = false;
    editingCampaign = null;
  }
  
  function getCampaignStatus(campaign: any) {
    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);
    
    if (!campaign.active) return 'inactive';
    if (now < start) return 'scheduled';
    if (now > end) return 'ended';
    return 'active';
  }
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function getAudienceDisplay(audience: string) {
    switch (audience) {
      case 'all': return 'All Customers';
      case 'vip': return 'VIP Customers';
      case 'new': return 'New Customers';
      case 'regular': return 'Regular Customers';
      default: return audience;
    }
  }
</script>

<svelte:head>
  <title>Marketing Campaigns - Lucky Wheel Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            📢 Marketing Campaigns
          </h1>
          <p class="text-gray-600 mt-2">Create and manage special promotional campaigns</p>
        </div>
        <button 
          on:click={openAddModal}
          class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          ➕ Create Campaign
        </button>
      </div>
    </div>

    <!-- Campaigns Grid -->
    {#if isLoading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {#each campaigns as campaign}
          {@const status = getCampaignStatus(campaign)}
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="p-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-bold text-gray-900 mb-2">{campaign.name}</h3>
                  <p class="text-gray-600 text-sm">{campaign.description}</p>
                </div>
                <span class={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                  {status.toUpperCase()}
                </span>
              </div>
              
              <!-- Campaign Details -->
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-xs text-gray-500 mb-1">Duration</div>
                  <div class="text-sm font-medium">
                    {new Date(campaign.start_date).toLocaleDateString()} - 
                    {new Date(campaign.end_date).toLocaleDateString()}
                  </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-xs text-gray-500 mb-1">Target Audience</div>
                  <div class="text-sm font-medium">{getAudienceDisplay(campaign.target_audience)}</div>
                </div>
              </div>
              
              <!-- Campaign Benefits -->
              <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                <div class="text-sm font-medium text-gray-700 mb-2">Campaign Benefits:</div>
                <div class="space-y-1 text-sm">
                  {#if campaign.bonus_multiplier > 1}
                    <div class="flex items-center">
                      <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Prize multiplier: {campaign.bonus_multiplier}x
                    </div>
                  {/if}
                  {#if campaign.extra_spins > 0}
                    <div class="flex items-center">
                      <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Extra spins: +{campaign.extra_spins}
                    </div>
                  {/if}
                  {#if campaign.min_purchase > 0}
                    <div class="flex items-center">
                      <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Minimum purchase: ¤{campaign.min_purchase}
                    </div>
                  {/if}
                </div>
              </div>
              
              <!-- Statistics -->
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">{campaign.participants || 0}</div>
                  <div class="text-xs text-gray-500">Participants</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">{campaign.total_spins || 0}</div>
                  <div class="text-xs text-gray-500">Total Spins</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-purple-600">¤{campaign.total_prizes || 0}</div>
                  <div class="text-xs text-gray-500">Prizes Given</div>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex space-x-2">
                <button 
                  on:click={() => editCampaign(campaign)}
                  class="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button 
                  on:click={() => toggleCampaign(campaign.id)}
                  class="flex-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  {campaign.active ? '⏸️ Pause' : '▶️ Activate'}
                </button>
                <button 
                  on:click={() => deleteCampaign(campaign.id)}
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

<!-- Add/Edit Campaign Modal -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
            {#if editingCampaign}
              <input 
                type="text" 
                bind:value={editingCampaign.name}
                placeholder="e.g., Summer Special"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            {:else}
              <input 
                type="text" 
                bind:value={newCampaign.name}
                placeholder="e.g., Summer Special"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            {/if}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            {#if editingCampaign}
              <textarea 
                bind:value={editingCampaign.description}
                placeholder="Brief description of the campaign"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              ></textarea>
            {:else}
              <textarea 
                bind:value={newCampaign.description}
                placeholder="Brief description of the campaign"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              ></textarea>
            {/if}
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              {#if editingCampaign}
                <input 
                  type="datetime-local" 
                  bind:value={editingCampaign.start_date}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {:else}
                <input 
                  type="datetime-local" 
                  bind:value={newCampaign.start_date}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {/if}
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              {#if editingCampaign}
                <input 
                  type="datetime-local" 
                  bind:value={editingCampaign.end_date}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {:else}
                <input 
                  type="datetime-local" 
                  bind:value={newCampaign.end_date}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {/if}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            {#if editingCampaign}
              <select 
                bind:value={editingCampaign.target_audience}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Customers</option>
                <option value="vip">VIP Customers</option>
                <option value="new">New Customers</option>
                <option value="regular">Regular Customers</option>
              </select>
            {:else}
              <select 
                bind:value={newCampaign.target_audience}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Customers</option>
                <option value="vip">VIP Customers</option>
                <option value="new">New Customers</option>
                <option value="regular">Regular Customers</option>
              </select>
            {/if}
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Bonus Multiplier</label>
              {#if editingCampaign}
                <input 
                  type="number" 
                  bind:value={editingCampaign.bonus_multiplier}
                  min="1"
                  max="5"
                  step="0.1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {:else}
                <input 
                  type="number" 
                  bind:value={newCampaign.bonus_multiplier}
                  min="1"
                  max="5"
                  step="0.1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {/if}
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Extra Spins</label>
              {#if editingCampaign}
                <input 
                  type="number" 
                  bind:value={editingCampaign.extra_spins}
                  min="0"
                  max="10"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {:else}
                <input 
                  type="number" 
                  bind:value={newCampaign.extra_spins}
                  min="0"
                  max="10"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {/if}
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Min Purchase (¤)</label>
              {#if editingCampaign}
                <input 
                  type="number" 
                  bind:value={editingCampaign.min_purchase}
                  min="0"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {:else}
                <input 
                  type="number" 
                  bind:value={newCampaign.min_purchase}
                  min="0"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              {/if}
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            {#if editingCampaign}
              <input 
                type="checkbox" 
                bind:checked={editingCampaign.active}
                id="campaignActive"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
            {:else}
              <input 
                type="checkbox" 
                bind:checked={newCampaign.active}
                id="campaignActive"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
            {/if}
            <label for="campaignActive" class="text-sm font-medium text-gray-700">Campaign is Active</label>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button 
            on:click={saveCampaign}
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {editingCampaign ? 'Update' : 'Create'} Campaign
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
