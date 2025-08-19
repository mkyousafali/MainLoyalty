import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';

// Privacy Policy Store
function createPrivacyPolicyStore() {
  const { subscribe, set, update } = writable({
    content: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  return {
    subscribe,
    
    // Load the active privacy policy
    async load() {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const { data, error } = await supabase
          .from('privacy_policy')
          .select('*')
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        update(state => ({
          ...state,
          content: data,
          isLoading: false,
          lastUpdated: new Date().toISOString(),
          error: null
        }));

        return data;
      } catch (err) {
        console.error('Error loading privacy policy:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load privacy policy';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage
        }));
        throw err;
      }
    },

    // Refresh the privacy policy content
    async refresh() {
      return await this.load();
    },

    // Clear the store
    clear() {
      set({
        content: null,
        isLoading: false,
        error: null,
        lastUpdated: null
      });
    }
  };
}

export const privacyPolicyStore = createPrivacyPolicyStore();
