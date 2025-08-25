import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// App Settings Store
export interface AppSettings {
  myOffersEnabled: boolean;
}

// Default settings
const defaultSettings: AppSettings = {
  myOffersEnabled: true
};

// Create the store
function createAppSettingsStore() {
  const { subscribe, set, update } = writable<AppSettings>(defaultSettings);

  return {
    subscribe,
    
    // Initialize settings from localStorage
    init: () => {
      if (browser) {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            set({ ...defaultSettings, ...parsed });
          } catch (error) {
            console.error('Error parsing app settings:', error);
            set(defaultSettings);
          }
        }
      }
    },

    // Toggle My Offers page
    toggleMyOffers: () => {
      update(settings => {
        const newSettings = { ...settings, myOffersEnabled: !settings.myOffersEnabled };
        if (browser) {
          localStorage.setItem('appSettings', JSON.stringify(newSettings));
        }
        return newSettings;
      });
    },

    // Set My Offers enabled state
    setMyOffersEnabled: (enabled: boolean) => {
      update(settings => {
        const newSettings = { ...settings, myOffersEnabled: enabled };
        if (browser) {
          localStorage.setItem('appSettings', JSON.stringify(newSettings));
        }
        return newSettings;
      });
    },

    // Reset to defaults
    reset: () => {
      set(defaultSettings);
      if (browser) {
        localStorage.removeItem('appSettings');
      }
    }
  };
}

export const appSettings = createAppSettingsStore();

// Initialize on first load
if (browser) {
  appSettings.init();
}
