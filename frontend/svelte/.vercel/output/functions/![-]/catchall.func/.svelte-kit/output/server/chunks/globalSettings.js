import { w as writable } from "./index2.js";
import { b as browser } from "./index3.js";
import { s as supabase } from "./supabase.js";
const defaultGlobalSettings = {
  whatsappSupportLink: "https://wa.me/966112345678"
};
function createGlobalSettingsStore() {
  const { subscribe, set, update } = writable(defaultGlobalSettings);
  return {
    subscribe,
    // Load global settings from Supabase database
    loadGlobalSettings: async () => {
      try {
        console.log("🔄 Loading global settings from database...");
        const { data, error } = await supabase.from("global_settings").select("setting_key, setting_value").in("setting_key", ["whatsapp_support_link"]);
        if (error) {
          console.warn("⚠️ Failed to load global settings from database:", error.message);
          if (browser) ;
          set(defaultGlobalSettings);
          return;
        }
        if (data && data.length > 0) {
          console.log("✅ Global settings loaded from database");
          const settings = {
            whatsappSupportLink: defaultGlobalSettings.whatsappSupportLink
          };
          data.forEach((setting) => {
            if (setting.setting_key === "whatsapp_support_link" && setting.setting_value) {
              settings.whatsappSupportLink = setting.setting_value;
            }
          });
          set(settings);
        } else {
          console.warn("⚠️ No global settings found in database, using defaults");
          set(defaultGlobalSettings);
        }
      } catch (error) {
        console.error("❌ Failed to load global settings:", error);
        set(defaultGlobalSettings);
      }
    },
    // Get current WhatsApp support link
    getWhatsAppLink: async () => {
      try {
        const { data, error } = await supabase.from("global_settings").select("setting_value").eq("setting_key", "whatsapp_support_link").single();
        if (error || !data?.setting_value) {
          console.warn("Failed to get WhatsApp link from database, using fallback");
          if (browser) ;
          return defaultGlobalSettings.whatsappSupportLink;
        }
        return data.setting_value;
      } catch (error) {
        console.error("Error getting WhatsApp link:", error);
        return defaultGlobalSettings.whatsappSupportLink;
      }
    },
    // Update WhatsApp support link
    updateWhatsAppLink: (newLink) => {
      update((settings) => ({
        ...settings,
        whatsappSupportLink: newLink
      }));
    }
  };
}
createGlobalSettingsStore();
