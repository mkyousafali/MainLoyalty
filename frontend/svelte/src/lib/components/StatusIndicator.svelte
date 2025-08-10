<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let type: 'notifications' | 'support' = 'notifications';
  export let count = 0;
  export let status: 'online' | 'offline' | 'busy' = 'online';

  let intervalId: number;

  // Mock API call to fetch live status
  async function fetchStatus() {
    try {
      // Mock API endpoint - replace with actual backend call
      const response = await fetch(`/api/admin/${type}/status`);
      if (response.ok) {
        const data = await response.json();
        count = data.count || 0;
        status = data.status || 'online';
      }
    } catch (error) {
      // Mock data for development
      if (type === 'notifications') {
        count = Math.floor(Math.random() * 10);
      } else {
        count = Math.floor(Math.random() * 5);
      }
    }
  }

  onMount(() => {
    // Initial fetch
    fetchStatus();
    
    // Set up periodic updates every 30 seconds
    intervalId = setInterval(fetchStatus, 30000);
  });

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  $: badgeColor = count > 0 ? (count > 5 ? 'bg-red-500' : 'bg-orange-500') : 'bg-gray-400';
  $: statusColor = status === 'online' ? 'bg-green-500' : status === 'busy' ? 'bg-orange-500' : 'bg-gray-400';
</script>

<div class="status-container">
  {#if count > 0}
    <span class="badge {badgeColor}">
      {count > 99 ? '99+' : count}
    </span>
  {/if}
  
  {#if type === 'support'}
    <div class="status-dot {statusColor}" title="Support status: {status}"></div>
  {/if}
</div>

<style>
  .status-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .badge {
    color: white;
    font-size: 0.75rem;
    border-radius: 9999px;
    padding: 0.125rem 0.5rem;
    font-weight: 600;
    min-width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s infinite;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
  }

  .bg-red-500 {
    background-color: #ef4444;
  }

  .bg-orange-500 {
    background-color: #f97316;
  }

  .bg-gray-400 {
    background-color: #9ca3af;
  }

  .bg-green-500 {
    background-color: #22c55e;
  }

  .status-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    animation: statusPulse 3s infinite;
  }

  @keyframes pulse {
    0%, 100% { 
      transform: scale(1);
      opacity: 1;
    }
    50% { 
      transform: scale(1.05);
      opacity: 0.9;
    }
  }

  @keyframes statusPulse {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
</style>
