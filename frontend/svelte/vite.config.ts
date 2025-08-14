import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
	server: {
		port: 5000,
		host: '0.0.0.0'
	},
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			srcDir: './src',
			mode: 'production',
			scope: '/',
			base: '/',
			selfDestroying: process.env.NODE_ENV === 'production',
			manifest: {
				name: 'Urban Market Loyalty',
				short_name: 'Urban Market',
				description: 'Urban Market Loyalty Program - Earn points, get rewards, and enjoy exclusive benefits',
				theme_color: '#f08300',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				lang: 'en',
				categories: ['business', 'shopping', 'lifestyle'],
				icons: [
					{
						src: '/icons/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				],
				shortcuts: [
					{
						name: 'Dashboard',
						short_name: 'Dashboard',
						description: 'View your loyalty dashboard',
						url: '/dashboard',
						icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
					},
					{
						name: 'Scan QR',
						short_name: 'Scan',
						description: 'Scan QR code for points',
						url: '/dashboard?tab=scan',
						icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
				navigateFallback: '/',
				navigateFallbackDenylist: [/^\/admin/],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheKeyWillBeUsed: async ({ request }) => `${request.url}`
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'gstatic-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							}
						}
					}
				]
			},
			devOptions: {
				enabled: process.env.NODE_ENV === 'development',
				suppressWarnings: true,
				navigateFallback: '/',
				navigateFallbackAllowlist: [/^\/$/]
			}
		})
	],
	css: {
		postcss: {
			plugins: [
				tailwindcss,
				autoprefixer,
			],
		},
	},
});
