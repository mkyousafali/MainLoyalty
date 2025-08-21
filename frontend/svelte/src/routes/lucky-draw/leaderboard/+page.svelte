<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { language } from '$lib/stores/language';
  import { browser } from '$app/environment';
  
  let customerData: any = null;
  let isLoading = true;
  let error = '';
  let leaderboard: any[] = [];
  let userPosition: number | null = null;
  let timeFilter = 'week'; // week, month, all
  
  const translations = {
    en: {
      title: 'Lucky Draw Winners',
      backToLucky: 'Back to Lucky Draw',
      loading: 'Loading...',
      noWinners: 'No winners yet',
      filters: {
        week: 'This Week',
        month: 'This Month',
        all: 'All Time'
      },
      position: 'Position',
      customer: 'Customer',
      totalWins: 'Total Wins',
      totalAmount: 'Total Amount',
      lastWin: 'Last Win',
      you: 'You',
      yourPosition: 'Your Position',
      notOnLeaderboard: 'Not on leaderboard yet',
      startSpinning: 'Start spinning to appear here!'
    },
    ar: {
      title: 'الفائزون في العجلة المحظوظة',
      backToLucky: 'العودة للعجلة المحظوظة',
      loading: 'جاري التحميل...',
      noWinners: 'لا يوجد فائزون بعد',
      filters: {
        week: 'هذا الأسبوع',
        month: 'هذا الشهر',
        all: 'كل الأوقات'
      },
      position: 'الترتيب',
      customer: 'العميل',
      totalWins: 'إجمالي الفوز',
      totalAmount: 'إجمالي المبلغ',
      lastWin: 'آخر فوز',
      you: 'أنت',
      yourPosition: 'ترتيبك',
      notOnLeaderboard: 'غير موجود في القائمة بعد',
      startSpinning: 'ابدأ الدوران للظهور هنا!'
    }
  };
  
  $: currentTranslations = translations[$language];
  
  onMount(() => {
    loadLeaderboard();
  });
  
  async function loadLeaderboard() {
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
      
      // Load leaderboard data
      await fetchLeaderboard();
      
    } catch (err: any) {
      error = 'Something went wrong';
      console.error('Error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  async function fetchLeaderboard() {
    try {
      let dateFilter = '';
      
      // Set date filter based on selection
      const now = new Date();
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString();
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = monthAgo.toISOString();
      }
      
      // Create the query
      let query = supabase
        .from('lucky_draw_spins')
        .select(`
          customer_code,
          spun_at,
          lucky_draw_prizes!inner (
            prize_amount,
            created_at
          )
        `)
        .eq('spin_result', 'win');
        
      if (dateFilter) {
        query = query.gte('spun_at', dateFilter);
      }
      
      const { data: spinsData, error: spinsError } = await query;
      
      if (spinsError) {
        console.error('Error fetching leaderboard:', spinsError);
        error = 'Failed to load leaderboard';
        return;
      }
      
      // Process data to create leaderboard
      const customerStats: { [key: string]: any } = {};
      
      (spinsData || []).forEach((spin: any) => {
        const customerCode = spin.customer_code;
        const prize = spin.lucky_draw_prizes;
        
        if (!customerStats[customerCode]) {
          customerStats[customerCode] = {
            customer_code: customerCode,
            masked_customer: maskCustomerCode(customerCode),
            total_wins: 0,
            total_amount_won: 0,
            last_win_date: null
          };
        }
        
        customerStats[customerCode].total_wins += 1;
        customerStats[customerCode].total_amount_won += parseFloat(prize.prize_amount || 0);
        
        const winDate = new Date(spin.spun_at);
        if (!customerStats[customerCode].last_win_date || winDate > customerStats[customerCode].last_win_date) {
          customerStats[customerCode].last_win_date = winDate;
        }
      });
      
      // Convert to array and sort
      leaderboard = Object.values(customerStats).sort((a: any, b: any) => {
        // Sort by total amount won, then by total wins
        if (b.total_amount_won !== a.total_amount_won) {
          return b.total_amount_won - a.total_amount_won;
        }
        return b.total_wins - a.total_wins;
      });
      
      // Find user position
      userPosition = null;
      if (customerData) {
        const userIndex = leaderboard.findIndex(entry => entry.customer_code === customerData.customer_code);
        if (userIndex !== -1) {
          userPosition = userIndex + 1;
        }
      }
      
    } catch (err: any) {
      console.error('Error processing leaderboard:', err);
      error = 'Failed to process leaderboard data';
    }
  }
  
  function maskCustomerCode(code: string): string {
    if (code.length <= 4) return code;
    return code.substring(0, code.length - 4) + 'XXXX';
  }
  
  function setTimeFilter(filter: string) {
    timeFilter = filter;
    fetchLeaderboard();
  }
  
  function getPositionIcon(position: number): string {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  }
  
  function getPositionClass(position: number): string {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900';
      default: return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900';
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
          👑 {currentTranslations.title}
        </h1>
        
        <div></div>
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto p-4">
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
      <!-- Time Filter -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="flex flex-wrap gap-2 justify-center">
          {#each Object.entries(currentTranslations.filters) as [key, label]}
            <button
              on:click={() => setTimeFilter(key)}
              class="px-6 py-2 rounded-lg font-semibold transition-all duration-200 {timeFilter === key 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
            >
              {label}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- User Position Card -->
      {#if customerData}
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-200">
          <div class="text-center">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">{currentTranslations.yourPosition}</h3>
            
            {#if userPosition}
              <div class="flex items-center justify-center space-x-4" class:space-x-reverse={$language === 'ar'}>
                <div class={`text-2xl font-bold px-4 py-2 rounded-full ${getPositionClass(userPosition)}`}>
                  {getPositionIcon(userPosition)}
                </div>
                <div class="text-left" class:text-right={$language === 'ar'}>
                  <p class="text-sm text-gray-600">{currentTranslations.position} {userPosition}</p>
                  <p class="font-semibold">
                    {leaderboard[userPosition - 1]?.total_wins} wins • ${leaderboard[userPosition - 1]?.total_amount_won.toFixed(2)}
                  </p>
                </div>
              </div>
            {:else}
              <div class="text-center py-4">
                <div class="text-4xl mb-2">🎯</div>
                <p class="text-gray-600 font-semibold">{currentTranslations.notOnLeaderboard}</p>
                <p class="text-sm text-gray-500">{currentTranslations.startSpinning}</p>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      
      <!-- Leaderboard -->
      {#if leaderboard.length === 0}
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🏆</div>
          <p class="text-xl text-gray-600">{currentTranslations.noWinners}</p>
        </div>
      {:else}
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <h3 class="text-xl font-bold">
              🏆 {currentTranslations.filters[timeFilter]} Leaderboard
            </h3>
          </div>
          
          <div class="divide-y divide-gray-200">
            {#each leaderboard.slice(0, 20) as entry, index}
              {@const position = index + 1}
              {@const isCurrentUser = customerData && entry.customer_code === customerData.customer_code}
              
              <div class="px-6 py-4 hover:bg-gray-50 transition-colors {isCurrentUser ? 'bg-purple-50 border-l-4 border-purple-500' : ''}">
                <div class="flex items-center justify-between">
                  <!-- Position and Customer -->
                  <div class="flex items-center space-x-4" class:space-x-reverse={$language === 'ar'}>
                    <div class={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${getPositionClass(position)}`}>
                      {getPositionIcon(position)}
                    </div>
                    
                    <div>
                      <p class="font-semibold text-gray-900 flex items-center">
                        {isCurrentUser ? currentTranslations.you : entry.masked_customer}
                        {#if isCurrentUser}
                          <span class="ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                            {currentTranslations.you}
                          </span>
                        {/if}
                      </p>
                      <p class="text-sm text-gray-600">
                        {currentTranslations.lastWin}: {entry.last_win_date ? entry.last_win_date.toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Stats -->
                  <div class="flex items-center space-x-6" class:space-x-reverse={$language === 'ar'} class:text-right={$language === 'ar'}>
                    <div class="text-center">
                      <p class="text-2xl font-bold text-purple-600">{entry.total_wins}</p>
                      <p class="text-xs text-gray-500">{currentTranslations.totalWins}</p>
                    </div>
                    
                    <div class="text-center">
                      <p class="text-2xl font-bold text-green-600">${entry.total_amount_won.toFixed(2)}</p>
                      <p class="text-xs text-gray-500">{currentTranslations.totalAmount}</p>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
          
          {#if leaderboard.length > 20}
            <div class="px-6 py-4 bg-gray-50 text-center">
              <p class="text-sm text-gray-600">
                Showing top 20 of {leaderboard.length} winners
              </p>
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  @media (max-width: 640px) {
    .space-x-4 > * + * {
      margin-left: 1rem;
    }
    
    .space-x-6 > * + * {
      margin-left: 1.5rem;
    }
    
    [dir="rtl"] .space-x-reverse > * + * {
      margin-right: 1rem;
      margin-left: 0;
    }
  }
</style>
