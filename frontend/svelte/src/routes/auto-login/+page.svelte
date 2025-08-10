<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { loginAdmin } from '$lib/stores/auth';
  
  onMount(() => {
    // Force login as master admin
    
    const adminInfo = {
      email: 'admin',
      role: 'master_admin',
      name: 'Master User',
      loginTime: new Date().toISOString()
    };
    
    // Set the authentication
    loginAdmin(adminInfo);
    
    // Redirect to admin panel
    setTimeout(() => {
      goto('/admin');
    }, 500);
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
  <div class="bg-white p-8 rounded-lg shadow-lg text-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <h2 class="text-xl font-semibold text-gray-800 mb-2">Logging you in...</h2>
    <p class="text-gray-600">Please wait while we authenticate you as Master Admin</p>
    
    <div class="mt-6 p-4 bg-blue-50 rounded border-l-4 border-blue-400">
      <p class="text-sm text-blue-700">
        <strong>Auto Login:</strong> admin<br>
        <strong>Role:</strong> Master Admin<br>
        <strong>Access:</strong> Full System Access
      </p>
    </div>
  </div>
</div>

<style>
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
