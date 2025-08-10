<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  // Redirect to the full analytics-reports page
  onMount(() => {
    goto('/admin/analytics-reports', { replaceState: true });
  });
</script>

<!-- This page redirects to analytics-reports -->
<div class="flex items-center justify-center min-h-screen">
  <div class="text-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    <p class="mt-2 text-gray-600">Redirecting to Analytics...</p>
  </div>
</div>
