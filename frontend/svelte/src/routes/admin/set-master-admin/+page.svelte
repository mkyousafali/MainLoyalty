<script lang="ts">
	import { onMount } from 'svelte';
	import { setProductionMasterAdmin } from '$lib/stores/permissions';
	import { goto } from '$app/navigation';

	let message = '';

	onMount(() => {
		// Set the current user as production master admin
		setProductionMasterAdmin();
		message = 'You have been set as Production Master Admin. You can now access all admin functions.';
		
		// Redirect to user roles management after 3 seconds
		setTimeout(() => {
			goto('/admin/user-roles');
		}, 3000);
	});
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
	<div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
		<div class="mb-4">
			<svg class="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
		</div>
		
		<h1 class="text-2xl font-bold text-gray-900 mb-4">Setting Master Admin</h1>
		
		<p class="text-gray-600 mb-6">{message}</p>
		
		<div class="flex justify-center">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
		</div>
		
		<p class="text-sm text-gray-500 mt-4">Redirecting to User Roles Management...</p>
	</div>
</div>
