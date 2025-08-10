<script lang="ts">
	import '../app.css';
	import TopBar from '$lib/TopBar.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { initializeAuth, user, isAuthenticated, isProtectedRoute, requireAuth, requireCustomerAuth, requireAdminAuth } from '$lib/stores/auth';

	let { children } = $props();

	// Pages that shouldn't show the top bar
	const hideTopBar = $derived($page.url.pathname === '/' || $page.url.pathname === '/test' || $page.url.pathname === '/login');

	// Initialize authentication on app start
	onMount(() => {
		initializeAuth();
	});

	// Authentication guard - check on route changes
	$effect(() => {
		const pathname = $page.url.pathname;
		const currentUser = $user;
		
		// Skip authentication for public routes
		if (!isProtectedRoute(pathname)) {
			return;
		}

		// Check if user is authenticated for protected routes
		if (isProtectedRoute(pathname)) {
			// Admin routes
			if (pathname.startsWith('/admin') && pathname !== '/admin-login') {
				requireAdminAuth(currentUser, pathname);
			}
			// Customer routes
			else if (!pathname.startsWith('/admin-login') && !pathname.startsWith('/login')) {
				requireCustomerAuth(currentUser, pathname);
			}
		}
	});
</script>

{#if !hideTopBar}
	<TopBar />
{/if}

<main class="min-h-screen bg-gray-50">
	{@render children()}
</main>
