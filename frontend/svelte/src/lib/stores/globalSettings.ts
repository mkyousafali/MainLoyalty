import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';

// Global Settings structure
export interface GlobalSettings {
  whatsappSupportLink: string;
}

// Default settings (fallback)
const defaultGlobalSettings: GlobalSettings = {
  whatsappSupportLink: 'https://wa.me/966112345678'
};

// Create the store
function createGlobalSettingsStore() {
  const { subscribe, set, update } = writable<GlobalSettings>(defaultGlobalSettings);

  return {
    subscribe,
    
    // Load global settings from Supabase database
    loadGlobalSettings: async () => {
      try {
        console.log('🔄 Loading global settings from database...');
        
        const { data, error } = await supabase
          .from('global_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['whatsapp_support_link']);

        if (error) {
          console.warn('⚠️ Failed to load global settings from database:', error.message);
          
          // Fallback to localStorage
          if (browser) {
            const savedLink = localStorage.getItem('globalWhatsAppSupportLink');
            if (savedLink) {
              set({
                whatsappSupportLink: savedLink
              });
              return;
            }
          }
          
          set(defaultGlobalSettings);
          return;
        }

        if (data && data.length > 0) {
          console.log('✅ Global settings loaded from database');
          
          const settings: GlobalSettings = {
            whatsappSupportLink: defaultGlobalSettings.whatsappSupportLink
          };
          
          // Process the results
          data.forEach(setting => {
            if (setting.setting_key === 'whatsapp_support_link' && setting.setting_value) {
              settings.whatsappSupportLink = setting.setting_value;
            }
          });
          
          set(settings);
        } else {
          console.warn('⚠️ No global settings found in database, using defaults');
          set(defaultGlobalSettings);
        }
        
      } catch (error) {
        console.error('❌ Failed to load global settings:', error);
        
        // Fallback to localStorage
        if (browser) {
          try {
            const savedLink = localStorage.getItem('globalWhatsAppSupportLink');
            if (savedLink) {
              set({
                whatsappSupportLink: savedLink
              });
              return;
            }
          } catch (localError) {
            console.warn('Failed to load global settings from localStorage:', localError);
          }
        }
        
        // Final fallback to default settings
        set(defaultGlobalSettings);
      }
    },
    
    // Get current WhatsApp support link
    getWhatsAppLink: async (): Promise<string> => {
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('setting_value')
          .eq('setting_key', 'whatsapp_support_link')
          .single();

        if (error || !data?.setting_value) {
          console.warn('Failed to get WhatsApp link from database, using fallback');
          
          // Fallback to localStorage
          if (browser) {
            const savedLink = localStorage.getItem('globalWhatsAppSupportLink');
            if (savedLink) {
              return savedLink;
            }
          }
          
          return defaultGlobalSettings.whatsappSupportLink;
        }

        return data.setting_value;
      } catch (error) {
        console.error('Error getting WhatsApp link:', error);
        return defaultGlobalSettings.whatsappSupportLink;
      }
    },
    
    // Update WhatsApp support link
    updateWhatsAppLink: (newLink: string) => {
      update(settings => ({
        ...settings,
        whatsappSupportLink: newLink
      }));
    }
  };
}

export const globalSettingsStore = createGlobalSettingsStore();

// Utility function to get WhatsApp link (can be used anywhere)
export async function getGlobalWhatsAppLink(): Promise<string> {
  return await globalSettingsStore.getWhatsAppLink();
}
