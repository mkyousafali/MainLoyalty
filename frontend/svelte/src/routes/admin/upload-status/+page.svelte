<script lang="ts">
  import { onMount } from 'svelte';
  import UploadStatusDashboard from '$lib/components/UploadStatusDashboard.svelte';
  import { uploadManager } from '$lib/uploadManager';
  
  let pageTitle = 'Upload Status Dashboard';
</script>

<svelte:head>
  <title>{pageTitle} - Urban Market Loyalty System</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
  <UploadStatusDashboard />
</div>
