<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let isLoading = false;
  export let lastRefresh: Date | null = null;
  export let autoRefreshInterval = 0; // 0 = disabled, otherwise milliseconds
  
  let autoRefreshTimer: NodeJS.Timeout | null = null;
  
  onMount(() => {
    if (autoRefreshInterval > 0) {
      startAutoRefresh();
    }
    
    return () => {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
      }
    };
  });
  
  function handleRefresh() {
    lastRefresh = new Date();
    dispatch('refresh');
  }
  
  function startAutoRefresh() {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
    }
    
    autoRefreshTimer = setInterval(() => {
      handleRefresh();
    }, autoRefreshInterval);
  }
  
  function stopAutoRefresh() {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }
  }
  
  function toggleAutoRefresh() {
    if (autoRefreshTimer) {
      stopAutoRefresh();
    } else if (autoRefreshInterval > 0) {
      startAutoRefresh();
    }
  }
  
  function formatLastRefresh(date: Date | null): string {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }
</script>

<div class="flex items-center gap-3">
  <!-- Refresh Button -->
  <button
    on:click={handleRefresh}
    disabled={isLoading}
    class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    title="Refresh data from Supabase"
  >
    <svg 
      class="w-4 h-4 {isLoading ? 'animate-spin' : ''}" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        stroke-width="2" 
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
    <span class="hidden sm:inline">
      {isLoading ? 'Refreshing...' : 'Refresh'}
    </span>
  </button>
  
  <!-- Auto-refresh toggle (if enabled) -->
  {#if autoRefreshInterval > 0}
    <button
      on:click={toggleAutoRefresh}
      class="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border {autoRefreshTimer ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-50 border-gray-200'}"
      title="{autoRefreshTimer ? 'Stop' : 'Start'} auto-refresh"
    >
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        {#if autoRefreshTimer}
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"/>
        {:else}
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
        {/if}
      </svg>
      <span class="hidden md:inline">Auto</span>
    </button>
  {/if}
  
  <!-- Last refresh indicator -->
  <span class="text-xs text-gray-500 hidden lg:inline">
    Last: {formatLastRefresh(lastRefresh)}
  </span>
</div>
