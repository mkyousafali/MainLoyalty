import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initialize dark mode from localStorage or default to false
function createDarkModeStore() {
  const { subscribe, set, update } = writable(false);

  return {
    subscribe,
    toggle: () => update(n => {
      const newValue = !n;
      if (browser) {
        localStorage.setItem('darkMode', JSON.stringify(newValue));
        // Apply/remove dark class to html element
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return newValue;
    }),
    init: () => {
      if (browser) {
        const stored = localStorage.getItem('darkMode');
        const isDark = stored ? JSON.parse(stored) : false;
        set(isDark);
        
        // Apply initial class
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  };
}

export const darkMode = createDarkModeStore();
