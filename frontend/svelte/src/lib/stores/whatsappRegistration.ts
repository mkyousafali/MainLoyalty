import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';

interface WhatsAppRegistrationSettings {
  id: number | null;
  whatsapp_link: string;
  message_template_en: string;
  message_template_ar: string;
  is_active: boolean;
}

// Default settings
const defaultSettings: WhatsAppRegistrationSettings = {
  id: null,
  whatsapp_link: 'https://wa.me/966500000000',
  message_template_en: 'Hi! I need help with loyalty program registration. Mobile number: {mobile}',
  message_template_ar: 'مرحباً! أحتاج مساعدة في التسجيل في برنامج الولاء. رقم الجوال: {mobile}',
  is_active: true
};

// Create writable store
export const whatsappRegistrationSettings = writable<WhatsAppRegistrationSettings>(defaultSettings);

// Function to load settings from database
export async function loadWhatsAppRegistrationSettings(): Promise<WhatsAppRegistrationSettings> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_registration_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.warn('WhatsApp registration settings not found, using defaults:', error);
      return defaultSettings;
    }

    const settings = {
      id: data.id,
      whatsapp_link: data.whatsapp_link,
      message_template_en: data.message_template_en,
      message_template_ar: data.message_template_ar,
      is_active: data.is_active
    };

    // Update the store
    whatsappRegistrationSettings.set(settings);
    return settings;

  } catch (err) {
    console.error('Error loading WhatsApp registration settings:', err);
    return defaultSettings;
  }
}

// Function to get WhatsApp registration link
export async function getWhatsAppRegistrationLink(): Promise<string> {
  try {
    const settings = await loadWhatsAppRegistrationSettings();
    return settings.whatsapp_link;
  } catch (err) {
    console.error('Error getting WhatsApp registration link:', err);
    return defaultSettings.whatsapp_link;
  }
}

// Function to get message template
export async function getWhatsAppMessageTemplate(language: 'en' | 'ar' = 'en'): Promise<string> {
  try {
    const settings = await loadWhatsAppRegistrationSettings();
    return language === 'ar' ? settings.message_template_ar : settings.message_template_en;
  } catch (err) {
    console.error('Error getting WhatsApp message template:', err);
    return language === 'ar' ? defaultSettings.message_template_ar : defaultSettings.message_template_en;
  }
}

// Function to create WhatsApp URL with message
export async function createWhatsAppRegistrationURL(mobile: string, language: 'en' | 'ar' = 'en'): Promise<string> {
  try {
    const [link, template] = await Promise.all([
      getWhatsAppRegistrationLink(),
      getWhatsAppMessageTemplate(language)
    ]);

    const message = template.replace('{mobile}', mobile);
    const encodedMessage = encodeURIComponent(message);
    return `${link}?text=${encodedMessage}`;

  } catch (err) {
    console.error('Error creating WhatsApp registration URL:', err);
    // Fallback
    const fallbackMessage = language === 'ar' 
      ? `مرحباً! أحتاج مساعدة في التسجيل في برنامج الولاء. رقم الجوال: ${mobile}`
      : `Hi! I need help with loyalty program registration. Mobile number: ${mobile}`;
    const encodedMessage = encodeURIComponent(fallbackMessage);
    return `${defaultSettings.whatsapp_link}?text=${encodedMessage}`;
  }
}
