<script lang="ts">
  import { pwa } from '$lib/stores/pwa';
  import { onMount } from 'svelte';
  
  export let showInHeader = false;
  export let customClass = '';
  export let buttonText = 'Install App';
  export let buttonTextAr = 'تثبيت التطبيق';
  export let currentLang: 'en' | 'ar' = 'en';
  
  let showPrompt = false;
  
  // Subscribe to PWA store
  $: if ($pwa.showInstallPrompt && !$pwa.isInstalled) {
    showPrompt = true;
  }
  
  onMount(() => {
    // Check if user has dismissed the install prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      showPrompt = false;
    }
  });
  
  function handleInstall() {
    pwa.install();
    showPrompt = false;
  }
  
  function dismissPrompt() {
    showPrompt = false;
    localStorage.setItem('pwa-install-dismissed', 'true');
    pwa.dismissInstall();
  }
</script>

{#if showPrompt && $pwa.isInstallable}
  <!-- Install Banner -->
  <div class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-green-600 text-white p-4 shadow-lg animate-slide-down" class:rtl={currentLang === 'ar'}>
    <div class="max-w-md mx-auto flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          <span class="text-2xl">📱</span>
        </div>
        <div>
          <p class="font-semibold text-sm">
            {currentLang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
          </p>
          <p class="text-xs opacity-90">
            {currentLang === 'ar' 
              ? 'للوصول السريع والسهل' 
              : 'For quick and easy access'}
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button
          on:click={handleInstall}
          class="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-gray-100 transition-colors"
        >
          {currentLang === 'ar' ? 'تثبيت' : 'Install'}
        </button>
        <button
          on:click={dismissPrompt}
          class="text-white/70 hover:text-white text-lg p-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Install Button (for custom placement) -->
{#if $pwa.isInstallable && !$pwa.isInstalled}
  <button
    id="pwa-install-button"
    on:click={handleInstall}
    class="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 {customClass}"
    class:hidden={showInHeader && showPrompt}
  >
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19,18H5V6H19M19,4H5A2,2 0 0,0 3,6V18A2,2 0 0,0 5,20H19A2,2 0 0,0 21,18V6A2,2 0 0,0 19,4M17,7H7V9H17V7M17,11H7V13H17V11M14,15H7V17H14V15Z"/>
    </svg>
    <span>{currentLang === 'ar' ? buttonTextAr : buttonText}</span>
  </button>
{/if}

<!-- Offline Indicator -->
{#if $pwa.isOffline}
  <div class="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
    <div class="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up">
      <div class="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
      <span class="text-sm">
        {currentLang === 'ar' 
          ? 'أنت غير متصل بالإنترنت' 
          : 'You are offline'}
      </span>
    </div>
  </div>
{/if}

<!-- Update Available Banner -->
{#if $pwa.needsUpdate}
  <div class="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
    <div class="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 animate-slide-up">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <span class="text-lg">🔄</span>
        </div>
        <div>
          <p class="font-semibold text-sm">
            {currentLang === 'ar' ? 'تحديث متاح' : 'Update Available'}
          </p>
          <p class="text-xs opacity-90">
            {currentLang === 'ar' ? 'إعادة تحميل للتحديث' : 'Reload to update'}
          </p>
        </div>
      </div>
      
      <button
        on:click={pwa.reloadForUpdate}
        class="bg-white text-blue-600 px-3 py-1 rounded font-semibold text-xs hover:bg-gray-100 transition-colors"
      >
        {currentLang === 'ar' ? 'تحديث' : 'Update'}
      </button>
    </div>
  </div>
{/if}

<style>
  .rtl {
    direction: rtl;
  }
  
  @keyframes slide-down {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
</style>
