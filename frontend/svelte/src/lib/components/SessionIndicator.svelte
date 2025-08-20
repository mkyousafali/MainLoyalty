<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { user, getSessionInfo } from '$lib/stores/auth';
  import { language } from '$lib/stores/language';
  
  let sessionInfo = { isValid: false, timeRemaining: 0, lastActivity: '' };
  let showSessionInfo = false;
  let interval: NodeJS.Timeout;
  
  const t = {
    en: {
      sessionActive: 'Session Active',
      lastActivity: 'Last Activity',
      sessionExpires: 'Session Expires',
      neverExpires: 'Never Expires',
      extendSession: 'Extend Session',
      minutes: 'minutes',
      hours: 'hours', 
      days: 'days',
      ago: 'ago',
      now: 'now',
      persistentSession: 'You will stay logged in until manual logout'
    },
    ar: {
      sessionActive: 'الجلسة نشطة',
      lastActivity: 'آخر نشاط',
      sessionExpires: 'تنتهي الجلسة',
      neverExpires: 'لا تنتهي أبداً',
      extendSession: 'تمديد الجلسة',
      minutes: 'دقائق',
      hours: 'ساعات',
      days: 'أيام',
      ago: 'مضت',
      now: 'الآن',
      persistentSession: 'ستبقى مسجل الدخول حتى الخروج اليدوي'
    }
  };
  
  $: currentLang = $language as 'en' | 'ar';
  $: translations = t[currentLang];
  
  onMount(() => {
    updateSessionInfo();
    // Update every 30 seconds
    interval = setInterval(updateSessionInfo, 30000);
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
  
  function updateSessionInfo() {
    sessionInfo = getSessionInfo();
  }
  
  function formatTimeRemaining(ms: number): string {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} ${translations.days}`;
    if (hours > 0) return `${hours} ${translations.hours}`;
    if (minutes > 0) return `${minutes} ${translations.minutes}`;
    return translations.now;
  }
  
  function formatLastActivity(timestamp: string): string {
    if (!timestamp) return translations.now;
    
    const now = new Date().getTime();
    const activity = new Date(timestamp).getTime();
    const diff = now - activity;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours > 0) return `${hours} ${translations.hours} ${translations.ago}`;
    if (minutes > 0) return `${minutes} ${translations.minutes} ${translations.ago}`;
    return translations.now;
  }
</script>

{#if $user && sessionInfo.isValid}
  <div 
    class="fixed bottom-4 right-4 z-50 transition-all duration-300"
    class:translate-x-full={!showSessionInfo}
    class:translate-x-0={showSessionInfo}
  >
    <!-- Session Toggle Button -->
    <button
      on:click={() => showSessionInfo = !showSessionInfo}
      class="absolute -left-12 top-3 bg-green-500 hover:bg-green-600 text-white p-2 rounded-l-lg shadow-lg transition-colors"
      title={translations.sessionActive}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
    
    <!-- Session Info Panel -->
    <div class="bg-white rounded-lg shadow-lg border p-4 w-80" class:rtl={currentLang === 'ar'}>
      <!-- Header -->
      <div class="flex items-center justify-between mb-3 pb-2 border-b">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span class="font-semibold text-gray-800">{translations.sessionActive}</span>
        </div>
        <button
          on:click={() => showSessionInfo = false}
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- User Info -->
      <div class="mb-3">
        <div class="text-sm text-gray-600 mb-1">
          {#if $user.type === 'customer'}
            📱 {$user.mobile}
          {:else}
            👤 {$user.name}
          {/if}
        </div>
        <div class="text-xs text-gray-500">{$user.name}</div>
      </div>
      
      <!-- Session Details -->
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">{translations.lastActivity}:</span>
          <span class="text-gray-800 font-medium">
            {sessionInfo.lastActivity ? formatLastActivity(sessionInfo.lastActivity) : translations.now}
          </span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-600">{translations.sessionExpires}:</span>
          <span class="text-green-600 font-medium">
            {translations.neverExpires}
          </span>
        </div>
      </div>
      
      <!-- Persistent Session Notice -->
      <div class="mt-3 pt-3 border-t">
        <div class="flex items-start gap-2">
          <svg class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p class="text-xs text-gray-600 leading-relaxed">
            {translations.persistentSession}
          </p>
        </div>
      </div>
      
      <!-- Close hint -->
      <div class="mt-2 text-center">
        <span class="text-xs text-gray-400">Click outside to close</span>
      </div>
    </div>
  </div>
  
  <!-- Overlay to close panel -->
  {#if showSessionInfo}
    <div 
      class="fixed inset-0 z-40 bg-transparent"
      on:click={() => showSessionInfo = false}
    ></div>
  {/if}
{/if}

<style>
  .rtl {
    direction: rtl;
    text-align: right;
  }
  
  .rtl .flex {
    flex-direction: row-reverse;
  }
  
  .rtl .justify-between {
    justify-content: space-between;
  }
  
  .rtl .gap-2 > * + * {
    margin-left: 0;
    margin-right: 0.5rem;
  }
</style>
