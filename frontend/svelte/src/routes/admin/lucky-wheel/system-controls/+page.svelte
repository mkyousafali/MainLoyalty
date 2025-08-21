<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { language } from '$lib/stores/language.js';
  
  let isLuckyDrawEnabled = true;
  let isLoading = false;
  let message = '';
  let messageType: 'success' | 'error' | 'info' = 'info';
  
  const translations = {
    en: {
      title: 'Lucky Draw System Controls',
      subtitle: 'Enable or disable Lucky Draw feature for all customers',
      currentStatus: 'Current Status',
      enabled: 'Enabled',
      disabled: 'Disabled',
      enableButton: 'Enable Lucky Draw',
      disableButton: 'Disable Lucky Draw',
      loading: 'Updating...',
      description: 'When disabled, the Lucky Draw quick action button will be hidden from all customer dashboards.',
      warningDisable: '⚠️ This will hide the Lucky Draw feature from ALL customers immediately.',
      successEnable: '✅ Lucky Draw feature has been enabled for all customers!',
      successDisable: '❌ Lucky Draw feature has been disabled for all customers.',
      errorUpdate: '❌ Failed to update Lucky Draw setting. Please try again.',
      statusInfo: 'This setting affects all customer accounts immediately.',
      securityNote: 'Only administrators can change this setting.',
      lastUpdated: 'Last updated',
      updateBy: 'Updated by'
    },
    ar: {
      title: 'التحكم في نظام السحب المحظوظ',
      subtitle: 'تفعيل أو إلغاء تفعيل ميزة السحب المحظوظ لجميع العملاء',
      currentStatus: 'الحالة الحالية',
      enabled: 'مفعل',
      disabled: 'معطل',
      enableButton: 'تفعيل السحب المحظوظ',
      disableButton: 'إلغاء تفعيل السحب المحظوظ',
      loading: 'جاري التحديث...',
      description: 'عند الإلغاء، سيتم إخفاء زر السحب المحظوظ من لوحات تحكم جميع العملاء.',
      warningDisable: '⚠️ هذا سيخفي ميزة السحب المحظوظ من جميع العملاء فوراً.',
      successEnable: '✅ تم تفعيل ميزة السحب المحظوظ لجميع العملاء!',
      successDisable: '❌ تم إلغاء تفعيل ميزة السحب المحظوظ لجميع العملاء.',
      errorUpdate: '❌ فشل في تحديث إعداد السحب المحظوظ. يرجى المحاولة مرة أخرى.',
      statusInfo: 'هذا الإعداد يؤثر على جميع حسابات العملاء فوراً.',
      securityNote: 'المدراء فقط يمكنهم تغيير هذا الإعداد.',
      lastUpdated: 'آخر تحديث',
      updateBy: 'تم التحديث بواسطة'
    }
  };
  
  $: t = translations[$language];
  
  onMount(async () => {
    await loadCurrentStatus();
  });
  
  async function loadCurrentStatus() {
    try {
      isLoading = true;
      
      const { data, error } = await supabase
        .rpc('get_lucky_draw_enabled');
      
      if (error) {
        console.error('Error loading Lucky Draw status:', error);
        showMessage('Failed to load current status', 'error');
        return;
      }
      
      isLuckyDrawEnabled = data === true;
      console.log('✅ Lucky Draw status loaded:', isLuckyDrawEnabled);
      
    } catch (err) {
      console.error('Error:', err);
      showMessage('Failed to load current status', 'error');
    } finally {
      isLoading = false;
    }
  }
  
  async function toggleLuckyDraw() {
    const newStatus = !isLuckyDrawEnabled;
    
    // Confirm action for disable
    if (!newStatus) {
      const confirmed = confirm(t.warningDisable + '\\n\\nAre you sure you want to continue?');
      if (!confirmed) return;
    }
    
    try {
      isLoading = true;
      
      const { data, error } = await supabase
        .rpc('toggle_lucky_draw_setting', { enabled: newStatus });
      
      if (error) {
        console.error('Error toggling Lucky Draw:', error);
        showMessage(t.errorUpdate, 'error');
        return;
      }
      
      isLuckyDrawEnabled = data;
      
      // Show success message
      const successMsg = newStatus ? t.successEnable : t.successDisable;
      showMessage(successMsg, 'success');
      
      console.log('✅ Lucky Draw status updated:', isLuckyDrawEnabled);
      
    } catch (err) {
      console.error('Error:', err);
      showMessage(t.errorUpdate, 'error');
    } finally {
      isLoading = false;
    }
  }
  
  function showMessage(msg: string, type: 'success' | 'error' | 'info') {
    message = msg;
    messageType = type;
    
    // Auto-clear message after 5 seconds
    setTimeout(() => {
      message = '';
    }, 5000);
  }
</script>

<svelte:head>
  <title>{t.title} - MainLoyalty Admin</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6" dir="{$language === 'ar' ? 'rtl' : 'ltr'}">
  
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
    <p class="text-gray-600">{t.subtitle}</p>
  </div>
  
  <!-- Message Display -->
  {#if message}
    <div class="mb-6 p-4 rounded-lg border {
      messageType === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
      messageType === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
      'bg-blue-50 border-blue-200 text-blue-700'
    }">
      <p>{message}</p>
    </div>
  {/if}
  
  <!-- Main Control Panel -->
  <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
    
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">🎯 {t.currentStatus}</h2>
          <p class="text-gray-600 text-sm mt-1">{t.description}</p>
        </div>
        
        <!-- Status Badge -->
        <div class="flex items-center gap-3">
          <div class="text-2xl">
            {isLuckyDrawEnabled ? '✅' : '❌'}
          </div>
          <div class="text-right">
            <div class="text-lg font-bold {isLuckyDrawEnabled ? 'text-green-600' : 'text-red-600'}">
              {isLuckyDrawEnabled ? t.enabled : t.disabled}
            </div>
            <div class="text-xs text-gray-500">
              {t.statusInfo}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Control Section -->
    <div class="px-8 py-8">
      <div class="flex flex-col items-center text-center">
        
        <!-- Status Indicator -->
        <div class="mb-6">
          <div class="w-24 h-24 rounded-full flex items-center justify-center mb-4 {
            isLuckyDrawEnabled 
              ? 'bg-green-100 border-4 border-green-300' 
              : 'bg-red-100 border-4 border-red-300'
          }">
            <div class="text-4xl">
              {isLuckyDrawEnabled ? '🎰' : '🚫'}
            </div>
          </div>
          
          <h3 class="text-2xl font-bold {isLuckyDrawEnabled ? 'text-green-700' : 'text-red-700'}">
            {isLuckyDrawEnabled ? t.enabled : t.disabled}
          </h3>
        </div>
        
        <!-- Description -->
        <div class="mb-8 max-w-2xl">
          <p class="text-gray-600 leading-relaxed">
            {t.description}
          </p>
          
          {#if !isLuckyDrawEnabled}
            <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-yellow-800 text-sm">
                {t.warningDisable}
              </p>
            </div>
          {/if}
        </div>
        
        <!-- Toggle Button -->
        <button
          on:click={toggleLuckyDraw}
          disabled={isLoading}
          class="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none {
            isLuckyDrawEnabled
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-200'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-200'
          }"
        >
          {#if isLoading}
            <div class="flex items-center gap-2">
              <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t.loading}
            </div>
          {:else}
            <div class="flex items-center gap-2">
              <span class="text-2xl">
                {isLuckyDrawEnabled ? '❌' : '✅'}
              </span>
              {isLuckyDrawEnabled ? t.disableButton : t.enableButton}
            </div>
          {/if}
        </button>
        
        <!-- Security Note -->
        <div class="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-lg">
          <div class="flex items-center gap-2 text-gray-600 text-sm">
            <span>🔒</span>
            <span>{t.securityNote}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Information Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
    
    <!-- Impact Card -->
    <div class="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span class="text-blue-600 text-lg">📊</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900">Impact</h3>
      </div>
      <div class="space-y-3">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span class="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Affects all customer dashboards</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>Changes take effect immediately</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
          <span>Quick Actions menu visibility</span>
        </div>
      </div>
    </div>
    
    <!-- Related Features Card -->
    <div class="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <span class="text-indigo-600 text-lg">🎯</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900">Related Features</h3>
      </div>
      <div class="space-y-2">
        <a href="/admin/lucky-wheel/dashboard" class="block text-sm text-blue-600 hover:text-blue-800 transition-colors">
          📊 Lucky Draw Dashboard
        </a>
        <a href="/admin/lucky-wheel/controls" class="block text-sm text-blue-600 hover:text-blue-800 transition-colors">
          ⏸️ Blocklist & Pauses
        </a>
        <a href="/admin/lucky-wheel/rules" class="block text-sm text-blue-600 hover:text-blue-800 transition-colors">
          ⚙️ Odds & Rules
        </a>
        <a href="/admin/lucky-wheel/campaigns" class="block text-sm text-blue-600 hover:text-blue-800 transition-colors">
          📅 Campaign Scheduler
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom styles for better visual appeal */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* RTL Support */
  [dir="rtl"] .text-right {
    text-align: left;
  }
  
  [dir="rtl"] .text-left {
    text-align: right;
  }
  
  /* Enhanced hover effects */
  button:hover:not(:disabled) {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .grid {
      grid-template-columns: 1fr;
    }
    
    .px-8 {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }
</style>
