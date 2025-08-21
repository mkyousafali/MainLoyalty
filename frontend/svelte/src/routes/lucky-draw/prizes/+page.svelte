<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { language } from '$lib/stores/language';
  import { browser } from '$app/environment';
  
  let customerData: any = null;
  let isLoading = true;
  let error = '';
  let prizes: any[] = [];
  let filteredPrizes: any[] = [];
  let activeFilter = 'all';
  let qrInterval: any = null;
  let showQR = false;
  let currentPrizeQR = '';
  let selectedPrize: any = null;
  
  const translations = {
    en: {
      title: 'My Lucky Draw Prizes',
      backToLucky: 'Back to Lucky Draw',
      loading: 'Loading...',
      noPrizes: 'No prizes found',
      filters: {
        all: 'All',
        active: 'Active',
        redeemed: 'Redeemed',
        expired: 'Expired'
      },
      status: {
        active: 'Active',
        redeemed: 'Redeemed',
        expired: 'Expired'
      },
      showQR: 'Show QR',
      copyCode: 'Copy Code',
      expiresIn: 'Expires in',
      expired: 'Expired',
      redeemed: 'Redeemed on',
      wonOn: 'Won on',
      amount: 'Amount'
    },
    ar: {
      title: 'جوائز العجلة المحظوظة',
      backToLucky: 'العودة للعجلة المحظوظة',
      loading: 'جاري التحميل...',
      noPrizes: 'لا توجد جوائز',
      filters: {
        all: 'الكل',
        active: 'ساري',
        redeemed: 'مستخدم',
        expired: 'منتهي'
      },
      status: {
        active: 'ساري',
        redeemed: 'مستخدم',
        expired: 'منتهي'
      },
      showQR: 'إظهار QR',
      copyCode: 'نسخ الرمز',
      expiresIn: 'ينتهي خلال',
      expired: 'منتهي الصلاحية',
      redeemed: 'تم الاستخدام في',
      wonOn: 'فاز في',
      amount: 'المبلغ'
    }
  };
  
  $: currentTranslations = translations[$language];
  
  onMount(() => {
    loadPrizes();
    
    // Auto-refresh every 30 seconds to update countdowns
    const refreshInterval = setInterval(() => {
      updateCountdowns();
    }, 1000);
    
    return () => {
      clearInterval(refreshInterval);
      if (qrInterval) clearInterval(qrInterval);
    };
  });
  
  async function loadPrizes() {
    if (!browser) return;
    
    try {
      isLoading = true;
      error = '';
      
      const currentUser = JSON.parse(localStorage.getItem('loyaltyUser') || '{}');
      if (!currentUser.mobile) {
        goto('/login');
        return;
      }
      
      // Get customer data
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_code', currentUser.mobile)
        .single();
        
      if (customerError) {
        error = 'Failed to load customer data';
        return;
      }
      
      customerData = customer;
      
      // Load all prizes for this customer
      const { data: prizesData, error: prizesError } = await supabase
        .from('lucky_draw_prizes')
        .select(`
          *,
          lucky_draw_categories (
            name,
            name_ar,
            color
          )
        `)
        .eq('customer_code', customerData.customer_code)
        .order('created_at', { ascending: false });
        
      if (prizesError) {
        error = 'Failed to load prizes';
        console.error('Prizes error:', prizesError);
        return;
      }
      
      prizes = prizesData || [];
      applyFilter();
      
    } catch (err: any) {
      error = 'Something went wrong';
      console.error('Error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  function applyFilter() {
    if (activeFilter === 'all') {
      filteredPrizes = prizes;
    } else {
      filteredPrizes = prizes.filter(prize => prize.status === activeFilter);
    }
  }
  
  function setFilter(filter: string) {
    activeFilter = filter;
    applyFilter();
  }
  
  function updateCountdowns() {
    // Force reactivity update for time-based data
    prizes = [...prizes];
    filteredPrizes = [...filteredPrizes];
  }
  
  function formatTimeRemaining(expiresAt: string): string {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return '00:00:00';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  function isExpired(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() < new Date().getTime();
  }
  
  async function generateQRCode(prize: any) {
    try {
      selectedPrize = prize;
      
      const { data, error } = await supabase
        .rpc('generate_qr_data', {
          p_prize_id: prize.id
        });
        
      if (!error && data) {
        currentPrizeQR = data;
        showQR = true;
        
        // Auto-refresh QR every 30 seconds
        if (qrInterval) clearInterval(qrInterval);
        qrInterval = setInterval(() => {
          generateQRCode(prize);
        }, 30000);
      }
    } catch (err: any) {
      console.error('Error generating QR:', err);
    }
  }
  
  function closeQR() {
    showQR = false;
    currentPrizeQR = '';
    selectedPrize = null;
    if (qrInterval) {
      clearInterval(qrInterval);
      qrInterval = null;
    }
  }
  
  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      // Could show a toast notification here
      alert('Code copied to clipboard!');
    });
  }
  
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'redeemed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
  
  function getPrizeCardClass(prize: any): string {
    const baseClass = 'bg-white rounded-xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl';
    
    if (prize.status === 'active' && !isExpired(prize.expires_at)) {
      return `${baseClass} border-green-200 hover:border-green-300`;
    } else if (prize.status === 'redeemed') {
      return `${baseClass} border-blue-200 hover:border-blue-300`;
    } else {
      return `${baseClass} border-gray-200 hover:border-gray-300 opacity-75`;
    }
  }
</script>

<svelte:head>
  <title>{currentTranslations.title} - MainLoyalty</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50" dir="{$language === 'ar' ? 'rtl' : 'ltr'}">
  <!-- Header -->
  <div class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <button on:click={() => goto('/lucky-draw')} class="flex items-center text-gray-600 hover:text-gray-900">
          <svg class="w-5 h-5 {$language === 'ar' ? 'ml-2 rotate-180' : 'mr-2'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {currentTranslations.backToLucky}
        </button>
        
        <h1 class="text-2xl font-bold text-gray-900 flex items-center">
          🏆 {currentTranslations.title}
        </h1>
        
        <div></div>
      </div>
    </div>
  </div>

  <div class="max-w-6xl mx-auto p-4">
    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p class="text-gray-600">{currentTranslations.loading}</p>
        </div>
      </div>
    {:else if error}
      <div class="max-w-md mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-600 text-center">{error}</p>
      </div>
    {:else}
      <!-- Filter Tabs -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="flex flex-wrap gap-2 mb-6">
          {#each Object.entries(currentTranslations.filters) as [key, label]}
            <button
              on:click={() => setFilter(key)}
              class="px-4 py-2 rounded-lg font-semibold transition-all duration-200 {activeFilter === key 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
            >
              {label}
              {#if key !== 'all'}
                <span class="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {prizes.filter(p => key === 'all' ? true : p.status === key).length}
                </span>
              {:else}
                <span class="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {prizes.length}
                </span>
              {/if}
            </button>
          {/each}
        </div>
        
        <!-- Summary Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{prizes.filter(p => p.status === 'active').length}</div>
            <div class="text-sm text-gray-600">{currentTranslations.status.active}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{prizes.filter(p => p.status === 'redeemed').length}</div>
            <div class="text-sm text-gray-600">{currentTranslations.status.redeemed}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-600">{prizes.filter(p => p.status === 'expired').length}</div>
            <div class="text-sm text-gray-600">{currentTranslations.status.expired}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">
              ${prizes.filter(p => p.status === 'redeemed').reduce((sum, p) => sum + parseFloat(p.prize_amount), 0).toFixed(2)}
            </div>
            <div class="text-sm text-gray-600">Total Redeemed</div>
          </div>
        </div>
      </div>
      
      <!-- Prizes Grid -->
      {#if filteredPrizes.length === 0}
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🎁</div>
          <p class="text-xl text-gray-600">{currentTranslations.noPrizes}</p>
        </div>
      {:else}
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {#each filteredPrizes as prize}
            <div class={getPrizeCardClass(prize)}>
              <div class="p-6">
                <!-- Prize Header -->
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">
                      {$language === 'ar' ? prize.lucky_draw_categories?.name_ar : prize.lucky_draw_categories?.name}
                    </h3>
                    <p class="text-sm text-gray-600">
                      {currentTranslations.wonOn}: {new Date(prize.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div class={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeClass(prize.status)}`}>
                    {currentTranslations.status[prize.status]}
                  </div>
                </div>
                
                <!-- Prize Amount -->
                <div class="mb-4">
                  <p class="text-3xl font-bold" style="color: {prize.lucky_draw_categories?.color || '#6B7280'}">
                    ${prize.prize_amount}
                  </p>
                  <p class="text-sm text-gray-600">Code: {prize.coupon_code}</p>
                </div>
                
                <!-- Status-specific Info -->
                {#if prize.status === 'active' && !isExpired(prize.expires_at)}
                  <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p class="text-sm text-green-800 font-semibold mb-1">{currentTranslations.expiresIn}:</p>
                    <p class="text-lg font-mono text-green-900 countdown">
                      {formatTimeRemaining(prize.expires_at)}
                    </p>
                  </div>
                {:else if prize.status === 'expired' || isExpired(prize.expires_at)}
                  <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <p class="text-sm text-gray-600">{currentTranslations.expired}</p>
                    <p class="text-sm text-gray-500">{new Date(prize.expires_at).toLocaleString()}</p>
                  </div>
                {:else if prize.status === 'redeemed'}
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p class="text-sm text-blue-800 font-semibold">{currentTranslations.redeemed}</p>
                    <p class="text-sm text-blue-600">{prize.redeemed_at ? new Date(prize.redeemed_at).toLocaleString() : 'N/A'}</p>
                  </div>
                {/if}
                
                <!-- Action Buttons -->
                {#if prize.status === 'active' && !isExpired(prize.expires_at)}
                  <div class="flex gap-2">
                    <button
                      on:click={() => generateQRCode(prize)}
                      class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                    >
                      {currentTranslations.showQR}
                    </button>
                    <button
                      on:click={() => copyCode(prize.coupon_code)}
                      class="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
                    >
                      {currentTranslations.copyCode}
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- QR Modal -->
{#if showQR && selectedPrize}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" on:click={closeQR}>
    <div class="bg-white rounded-xl max-w-sm w-full p-6 text-center" on:click|stopPropagation>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">{currentTranslations.showQR}</h3>
        <button on:click={closeQR} class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Prize Info -->
      <div class="mb-4 text-left bg-gray-50 p-3 rounded-lg">
        <p class="text-sm text-gray-600">{currentTranslations.amount}:</p>
        <p class="text-2xl font-bold" style="color: {selectedPrize.lucky_draw_categories?.color || '#6B7280'}">
          ${selectedPrize.prize_amount}
        </p>
        <p class="text-sm text-gray-600 mt-1">
          {$language === 'ar' ? selectedPrize.lucky_draw_categories?.name_ar : selectedPrize.lucky_draw_categories?.name}
        </p>
      </div>
      
      <!-- QR Code Placeholder -->
      <div class="w-48 h-48 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-dashed border-purple-300 flex items-center justify-center rounded-lg">
        <div class="text-center">
          <div class="text-4xl mb-2">📱</div>
          <span class="text-purple-600 font-semibold">QR Code</span>
        </div>
      </div>
      
      <div class="bg-blue-50 p-3 rounded-lg mb-4">
        <p class="text-sm text-blue-800 font-semibold mb-1">Code:</p>
        <p class="text-lg font-mono text-blue-900">{selectedPrize.coupon_code}</p>
      </div>
      
      <p class="text-xs text-gray-500 mb-4">
        Auto-refreshes every 30 seconds • Valid until: {new Date(selectedPrize.expires_at).toLocaleString()}
      </p>
      
      <div class="flex gap-2">
        <button 
          on:click={() => copyCode(selectedPrize.coupon_code)}
          class="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
        >
          {currentTranslations.copyCode}
        </button>
        <button 
          on:click={closeQR} 
          class="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .countdown {
    font-variant-numeric: tabular-nums;
  }
</style>
