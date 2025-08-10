<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  interface CardType {
    id: string;
    name_en: string;
    name_ar: string;
    color: string;
    point_limit: number;
    upgrade_to: string | null;
    created_at: string;
    customer_count?: number;
    upgrade_to_name?: string;
  }

  let cardTypes: CardType[] = [];
  let isLoading = false;
  let showCreateModal = false;
  let editingCardType: CardType | null = null;
  let error = '';
  let successMessage = '';

  // Form data
  let cardTypeForm = {
    name_en: '',
    name_ar: '',
    color: '#3B82F6',
    point_limit: 0,
    upgrade_to: null as string | null
  };

  // Predefined colors
  const predefinedColors = [
    { name: 'Bronze', value: '#CD7F32' },
    { name: 'Silver', value: '#C0C0C0' },
    { name: 'Gold', value: '#FFD700' },
    { name: 'Platinum', value: '#E5E4E2' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' }
  ];

  onMount(() => {
    loadCardTypes();
  });

  async function loadCardTypes() {
    try {
      isLoading = true;
      error = '';

      const { data, error: loadError } = await supabase
        .from('card_types')
        .select('*')
        .order('point_limit');

      if (loadError) throw loadError;

      // Get customer counts for each card type and resolve upgrade_to names
      const cardTypesWithCounts = await Promise.all(
        (data || []).map(async (cardType) => {
          const { count } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('card_type_id', cardType.id);

          // Find upgrade_to name from the same data array
          const upgradeToCard = data?.find(ct => ct.id === cardType.upgrade_to);

          return {
            ...cardType,
            customer_count: count || 0,
            upgrade_to_name: upgradeToCard?.name_en || null
          };
        })
      );

      cardTypes = cardTypesWithCounts;
    } catch (err: any) {
      error = `Failed to load card types: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingCardType = null;
    cardTypeForm = {
      name_en: '',
      name_ar: '',
      color: '#3B82F6',
      point_limit: 0,
      upgrade_to: null
    };
    showCreateModal = true;
  }

  function editCardType(cardType: CardType) {
    editingCardType = cardType;
    cardTypeForm = {
      name_en: cardType.name_en,
      name_ar: cardType.name_ar || '',
      color: cardType.color,
      point_limit: cardType.point_limit,
      upgrade_to: cardType.upgrade_to
    };
    showCreateModal = true;
  }

  async function saveCardType() {
    try {
      error = '';
      successMessage = '';

      if (!cardTypeForm.name_en.trim()) {
        error = 'English name is required';
        return;
      }

      if (cardTypeForm.point_limit < 0) {
        error = 'Point limit cannot be negative';
        return;
      }

      if (editingCardType) {
        // Update existing card type
        const { error: updateError } = await supabase
          .from('card_types')
          .update({
            name_en: cardTypeForm.name_en.trim(),
            name_ar: cardTypeForm.name_ar.trim() || null,
            color: cardTypeForm.color,
            point_limit: cardTypeForm.point_limit,
            upgrade_to: cardTypeForm.upgrade_to || null
          })
          .eq('id', editingCardType.id);

        if (updateError) throw updateError;
        successMessage = 'Card type updated successfully';
      } else {
        // Create new card type
        const { error: insertError } = await supabase
          .from('card_types')
          .insert([{
            name_en: cardTypeForm.name_en.trim(),
            name_ar: cardTypeForm.name_ar.trim() || null,
            color: cardTypeForm.color,
            point_limit: cardTypeForm.point_limit,
            upgrade_to: cardTypeForm.upgrade_to || null
          }]);

        if (insertError) throw insertError;
        successMessage = 'Card type created successfully';
      }

      showCreateModal = false;
      await loadCardTypes();
    } catch (err: any) {
      error = `Failed to save card type: ${err.message}`;
    }
  }

  async function deleteCardType(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      error = '';
      
      // Check if any customers are using this card type
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('card_type_id', id);

      if (count && count > 0) {
        error = `Cannot delete "${name}" because ${count} customers are using this card type`;
        return;
      }

      const { error: deleteError } = await supabase
        .from('card_types')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      successMessage = 'Card type deleted successfully';
      await loadCardTypes();
    } catch (err: any) {
      error = `Failed to delete card type: ${err.message}`;
    }
  }

  function getAvailableUpgradeOptions(currentCardType?: CardType) {
    return cardTypes.filter(ct => {
      // Don't allow upgrading to self
      if (currentCardType && ct.id === currentCardType.id) return false;
      // Only allow upgrading to higher point limits
      if (currentCardType && ct.point_limit <= currentCardType.point_limit) return false;
      return true;
    });
  }

  // Clear messages after 5 seconds
  $: if (successMessage || error) {
    setTimeout(() => {
      successMessage = '';
      error = '';
    }, 5000);
  }
</script>

<div class="min-h-screen bg-gray-50 p-4 md:p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Manage Card Types</h1>
        <p class="text-gray-600">Create and manage customer loyalty card types and upgrade paths</p>
      </div>
      <button
        on:click={openCreateModal}
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Add Card Type
      </button>
    </div>

    <!-- Messages -->
    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <p class="text-red-800">{error}</p>
        </div>
      </div>
    {/if}

    {#if successMessage}
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <svg class="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-green-800">{successMessage}</p>
        </div>
      </div>
    {/if}

    <!-- Loading State -->
    {#if isLoading}
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading card types...</p>
      </div>
    {:else}
      <!-- Card Types Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each cardTypes as cardType}
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <!-- Card Header with Color -->
            <div class="h-20 relative" style="background-color: {cardType.color}">
              <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <div class="absolute top-4 left-4">
                <div class="w-12 h-8 bg-white/30 rounded backdrop-blur-sm flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                  </svg>
                </div>
              </div>
              <div class="absolute top-4 right-4">
                <div class="flex space-x-2">
                  <button
                    on:click={() => editCardType(cardType)}
                    class="p-1.5 bg-white/30 hover:bg-white/50 rounded backdrop-blur-sm transition-colors"
                  >
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button
                    on:click={() => deleteCardType(cardType.id, cardType.name_en)}
                    class="p-1.5 bg-white/30 hover:bg-red-500/70 rounded backdrop-blur-sm transition-colors"
                  >
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Card Content -->
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">{cardType.name_en}</h3>
                  {#if cardType.name_ar}
                    <p class="text-sm text-gray-600">{cardType.name_ar}</p>
                  {/if}
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {cardType.customer_count} customers
                </span>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Point Requirement:</span>
                  <span class="font-medium">{cardType.point_limit.toLocaleString()} pts</span>
                </div>

                {#if cardType.upgrade_to_name}
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Upgrades to:</span>
                    <span class="text-sm font-medium text-blue-600">{cardType.upgrade_to_name}</span>
                  </div>
                {:else}
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Upgrades to:</span>
                    <span class="text-sm text-gray-400">Top tier</span>
                  </div>
                {/if}

                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Color:</span>
                  <div class="flex items-center space-x-2">
                    <div class="w-4 h-4 rounded border border-gray-300" style="background-color: {cardType.color}"></div>
                    <span class="text-sm font-mono">{cardType.color}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/each}

        {#if cardTypes.length === 0}
          <div class="col-span-full text-center py-12">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No card types found</h3>
            <p class="text-gray-600 mb-4">Get started by creating your first loyalty card type</p>
            <button
              on:click={openCreateModal}
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Card Type
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Create/Edit Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            {editingCardType ? 'Edit Card Type' : 'Create New Card Type'}
          </h3>
          <button
            on:click={() => showCreateModal = false}
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form on:submit|preventDefault={saveCardType} class="space-y-4">
          <!-- English Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              English Name *
            </label>
            <input
              type="text"
              bind:value={cardTypeForm.name_en}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Bronze, Silver, Gold"
            />
          </div>

          <!-- Arabic Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Arabic Name
            </label>
            <input
              type="text"
              bind:value={cardTypeForm.name_ar}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., برونزي، فضي، ذهبي"
            />
          </div>

          <!-- Point Limit -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Point Requirement
            </label>
            <input
              type="number"
              bind:value={cardTypeForm.point_limit}
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <p class="text-xs text-gray-500 mt-1">Minimum points needed to qualify for this card type</p>
          </div>

          <!-- Color -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Card Color
            </label>
            <div class="grid grid-cols-4 gap-2 mb-2">
              {#each predefinedColors as color}
                <button
                  type="button"
                  on:click={() => cardTypeForm.color = color.value}
                  class="w-full h-10 rounded border-2 {cardTypeForm.color === color.value ? 'border-gray-900' : 'border-gray-300'} hover:border-gray-400 transition-colors"
                  style="background-color: {color.value}"
                  title={color.name}
                >
                </button>
              {/each}
            </div>
            <input
              type="color"
              bind:value={cardTypeForm.color}
              class="w-full h-10 border border-gray-300 rounded cursor-pointer"
            />
          </div>

          <!-- Upgrade To -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Upgrades To
            </label>
            <select
              bind:value={cardTypeForm.upgrade_to}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={null}>No upgrade (Top tier)</option>
              {#each getAvailableUpgradeOptions(editingCardType) as option}
                <option value={option.id}>{option.name_en} ({option.point_limit} pts)</option>
              {/each}
            </select>
            <p class="text-xs text-gray-500 mt-1">Next card type customers upgrade to automatically</p>
          </div>

          <!-- Buttons -->
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              on:click={() => showCreateModal = false}
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingCardType ? 'Update' : 'Create'} Card Type
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
