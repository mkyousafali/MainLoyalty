<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // Clear any old demo data first
    const currentUser = JSON.parse(localStorage.getItem('loyaltyUser') || '{}');
    const storedCustomer = localStorage.getItem('currentCustomer');
    
    // Check for and clear demo data
    if (currentUser.mobile === '0548357066' || 
        (storedCustomer && JSON.parse(storedCustomer).mobile === '0548357066')) {
      localStorage.clear();
    }
    
    // Check if user is logged in
    const loyaltyCardNumber = localStorage.getItem('loyaltyCardNumber');
    
    if (loyaltyCardNumber) {
      // User is logged in, redirect to dashboard
      goto('/dashboard');
    } else {
      // User not logged in, redirect to login
      goto('/login');
    }
  });
</script>

<!-- Loading screen while redirecting -->
<div class="min-h-screen bg-gray-100 flex items-center justify-center">
  <div class="text-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
    <p class="text-gray-600 font-medium">Loading MainLoyalty...</p>
  </div>
</div>
