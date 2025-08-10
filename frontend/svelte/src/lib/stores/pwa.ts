import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface PWAStore {
	isInstallable: boolean;
	isInstalled: boolean;
	showInstallPrompt: boolean;
	deferredPrompt: any;
	isOffline: boolean;
	needsUpdate: boolean;
}

function createPWAStore() {
	const { subscribe, set, update } = writable<PWAStore>({
		isInstallable: false,
		isInstalled: false,
		showInstallPrompt: false,
		deferredPrompt: null,
		isOffline: false,
		needsUpdate: false
	});

	let deferredPrompt: any = null;

	if (browser) {
		// Check if app is already installed
		const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
						   (window.navigator as any).standalone === true;
		
		if (isInstalled) {
			update(state => ({ ...state, isInstalled: true }));
		}

		// Listen for install prompt
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			
			update(state => ({ 
				...state, 
				isInstallable: true, 
				showInstallPrompt: !isInstalled,
				deferredPrompt: e 
			}));
			
			console.log('PWA: Install prompt available');
		});

		// Listen for successful installation
		window.addEventListener('appinstalled', () => {
			update(state => ({ 
				...state, 
				isInstalled: true, 
				showInstallPrompt: false,
				isInstallable: false,
				deferredPrompt: null 
			}));
			
			console.log('PWA: App installed successfully');
		});

		// Listen for online/offline status
		window.addEventListener('online', () => {
			update(state => ({ ...state, isOffline: false }));
		});

		window.addEventListener('offline', () => {
			update(state => ({ ...state, isOffline: true }));
		});

		// Listen for service worker updates
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				update(state => ({ ...state, needsUpdate: true }));
			});
		}
	}

	return {
		subscribe,
		
		// Install the PWA
		install: async () => {
			if (deferredPrompt) {
				deferredPrompt.prompt();
				const { outcome } = await deferredPrompt.userChoice;
				
				console.log('PWA: Install choice:', outcome);
				
				if (outcome === 'accepted') {
					update(state => ({ 
						...state, 
						showInstallPrompt: false,
						isInstallable: false 
					}));
				}
				
				deferredPrompt = null;
				update(state => ({ ...state, deferredPrompt: null }));
			}
		},

		// Dismiss the install prompt
		dismissInstall: () => {
			update(state => ({ ...state, showInstallPrompt: false }));
		},

		// Reload to apply service worker update
		reloadForUpdate: () => {
			if (browser) {
				window.location.reload();
			}
		}
	};
}

export const pwa = createPWAStore();
