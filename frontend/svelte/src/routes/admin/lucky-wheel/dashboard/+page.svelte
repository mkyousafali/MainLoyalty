<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  // Custom currency symbol - same as customer and test wheel
  const wheelCurrencySymbol = '¤';
  
  let isLoading = true;
  let stats = {
    spinsToday: 0,
    spinsThisWeek: 0,
    winsToday: 0,
    winsThisWeek: 0,
    totalSpins: 0,
    totalWins: 0,
    overallWinRate: 0,
    activePrizes: 0,
    availableCoupons: 0,
    reservedCoupons: 0,
    redeemedCoupons: 0,
    expiredCoupons: 0
  };
  
  let recentActivity: any[] = [];
  let topWinners: any[] = [];
  let categoryStats: any[] = [];
  let isGlobalPaused = false;
  let loadingToggle = false;
  
  onMount(() => {
    checkAdminAuth();
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadDashboardData() {
    try {
      await Promise.all([
        loadSystemStats(),
        loadRecentActivity(),
        loadTopWinners(),
        loadCategoryStats(),
        checkGlobalStatus()
      ]);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
    } finally {
      isLoading = false;
    }
  }
  
  async function loadSystemStats() {
    try {
      // Get stats from the view we created
      const { data, error } = await supabase
        .from('lucky_draw_stats')
        .select('*')
        .single();
      
      if (!error && data) {
        stats = { ...stats, ...data };
      }
      
      // Get coupon stats
      const { data: couponStats, error: couponError } = await supabase
        .from('lucky_draw_coupons')
        .select('status');
      
      if (!couponError && couponStats) {
        stats.availableCoupons = couponStats.filter(c => c.status === 'available').length;
        stats.reservedCoupons = couponStats.filter(c => c.status === 'reserved').length;
        stats.redeemedCoupons = couponStats.filter(c => c.status === 'redeemed').length;
        stats.expiredCoupons = couponStats.filter(c => c.status === 'expired').length;
      }
      
      // Get active prizes count
      const { data: prizes, error: prizesError } = await supabase
        .from('lucky_draw_prizes')
        .select('id', { count: 'exact' })
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());
      
      if (!prizesError) {
        stats.activePrizes = prizes?.length || 0;
      }
      
    } catch (err: any) {
      console.error('Error loading system stats:', err);
    }
  }
  
  async function loadRecentActivity() {
    try {
      const { data, error } = await supabase
        .from('lucky_draw_spins')
        .select(`
          *,
          lucky_draw_categories (
            name,
            name_ar
          ),
          lucky_draw_prizes (
            prize_amount,
            coupon_code
          )
        `)
        .order('spun_at', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        recentActivity = data;
      }
    } catch (err: any) {
      console.error('Error loading recent activity:', err);
    }
  }
  
  async function loadTopWinners() {
    try {
      const { data, error } = await supabase
        .from('lucky_draw_leaderboard')
        .select('*')
        .limit(5);
      
      if (!error && data) {
        topWinners = data;
      }
    } catch (err: any) {
      console.error('Error loading top winners:', err);
    }
  }
  
  async function loadCategoryStats() {
    try {
      const { data, error } = await supabase
        .from('lucky_draw_categories')
        .select(`
          *,
          lucky_draw_coupons!inner (
            status
          )
        `)
        .eq('is_active', true);
      
      if (!error && data) {
        categoryStats = data.map(category => {
          const coupons = category.lucky_draw_coupons;
          return {
            ...category,
            total_coupons: coupons.length,
            available_coupons: coupons.filter(c => c.status === 'available').length,
            reserved_coupons: coupons.filter(c => c.status === 'reserved').length,
            redeemed_coupons: coupons.filter(c => c.status === 'redeemed').length
          };
        });
      }
    } catch (err: any) {
      console.error('Error loading category stats:', err);
    }
  }
  
  async function checkGlobalStatus() {
    try {
      const { data, error } = await supabase
        .from('lucky_draw_controls')
        .select('*')
        .eq('control_type', 'global_pause')
        .eq('is_active', true)
        .single();
      
      isGlobalPaused = !error && data;
    } catch (err: any) {
      // No global pause found, which is fine
      isGlobalPaused = false;
    }
  }
  
  async function toggleGlobalPause() {
    try {
      loadingToggle = true;
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      
      if (isGlobalPaused) {
        // Remove global pause
        await supabase
          .from('lucky_draw_controls')
          .delete()
          .eq('control_type', 'global_pause');
      } else {
        // Add global pause
        await supabase
          .from('lucky_draw_controls')
          .insert({
            control_type: 'global_pause',
            reason: 'Manual pause by admin',
            created_by: adminUser.username || adminUser.email || 'admin',
            is_active: true
          });
      }
      
      isGlobalPaused = !isGlobalPaused;
      
    } catch (err: any) {
      console.error('Error toggling global pause:', err);
    } finally {
      loadingToggle = false;
    }
  }
  
  function formatCustomerCode(code: string): string {
    if (code.length <= 4) return code;
    return code.substring(0, code.length - 4) + 'XXXX';
  }
  
  function exportExcel() {
    // Placeholder for Excel export functionality
    console.log('Excel export functionality to be implemented');
  }
</script>

<svelte:head>
  <title>Lucky Draw Dashboard - MainLoyalty Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            🎯 Lucky Draw Dashboard (Live)
          </h1>
          <p class="text-gray-600 mt-2">Real-time monitoring and control center</p>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          
          <!-- Global Controls -->
          <button
            on:click={exportExcel}
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            📊 Export Excel
          </button>
          
          <button
            on:click={toggleGlobalPause}
            disabled={loadingToggle}
            class={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
              isGlobalPaused 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {loadingToggle ? 'Please wait...' : (isGlobalPaused ? '▶️ Resume All' : '⏸️ Pause All')}
          </button>
        </div>
      </div>
      
      <!-- Status Indicator -->
      <div class="mt-4">
        <div class={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          isGlobalPaused 
            ? 'bg-red-100 text-red-800 border border-red-200' 
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          <div class={`w-2 h-2 rounded-full ${isGlobalPaused ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
          <span class="font-semibold">
            {isGlobalPaused ? 'Lucky Draw is PAUSED' : 'Lucky Draw is ACTIVE'}
          </span>
        </div>
      </div>
    </div>
    
    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    {:else}
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <!-- Spins Today -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-semibold">Spins Today</p>
              <p class="text-3xl font-bold text-blue-600">{stats.spinsToday}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">🎰</span>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-500">
            {stats.spinsThisWeek} this week
          </div>
        </div>
        
        <!-- Wins Today -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-semibold">Wins Today</p>
              <p class="text-3xl font-bold text-green-600">{stats.winsToday}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">🏆</span>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-500">
            {stats.winsThisWeek} this week
          </div>
        </div>
        
        <!-- Win Rate -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-semibold">Overall Win Rate</p>
              <p class="text-3xl font-bold text-purple-600">{stats.overallWinRate}%</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">📊</span>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-500">
            {stats.totalWins} / {stats.totalSpins} total
          </div>
        </div>
        
        <!-- Active Prizes -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-semibold">Active Prizes</p>
              <p class="text-3xl font-bold text-orange-600">{stats.activePrizes}</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">🎁</span>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-500">
            Waiting for redemption
          </div>
        </div>
      </div>
      
      <!-- Coupon Pool Status -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Coupon Pool Status</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div class="text-2xl font-bold text-green-600">{stats.availableCoupons}</div>
            <div class="text-sm text-green-700 font-semibold">Available</div>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div class="text-2xl font-bold text-yellow-600">{stats.reservedCoupons}</div>
            <div class="text-sm text-yellow-700 font-semibold">Reserved</div>
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="text-2xl font-bold text-blue-600">{stats.redeemedCoupons}</div>
            <div class="text-sm text-blue-700 font-semibold">Redeemed</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-2xl font-bold text-gray-600">{stats.expiredCoupons}</div>
            <div class="text-sm text-gray-700 font-semibold">Expired</div>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Activity -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div class="space-y-4 max-h-64 overflow-y-auto">
            {#each recentActivity as activity}
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p class="font-semibold text-gray-900">
                    {formatCustomerCode(activity.customer_code)}
                  </p>
                  <p class="text-sm text-gray-600">
                    {activity.spin_result === 'win' ? '🏆 Won' : '🍀 No luck'} • 
                    {new Date(activity.spun_at).toLocaleTimeString()}
                  </p>
                </div>
                {#if activity.lucky_draw_prizes?.[0]}
                  <div class="text-right">
                    <div class="text-lg font-bold text-green-600 flex items-center gap-1">
                      <img src="/currency-symbol.svg" alt="Currency" class="w-4 h-4 inline-block" />
                      {activity.lucky_draw_prizes[0].prize_amount}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
        
        <!-- Top Winners -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Top Winners This Week</h3>
          <div class="space-y-4">
            {#each topWinners as winner, index}
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">{winner.masked_customer}</p>
                    <p class="text-sm text-gray-600">{winner.total_wins} wins</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-green-600 flex items-center gap-1">
                    <img src="/currency-symbol.svg" alt="Currency" class="w-4 h-4 inline-block" />
                    {winner.total_amount_won}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Category Statistics -->
      {#if categoryStats.length > 0}
        <div class="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Category Statistics</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each categoryStats as category}
              <div class="p-4 border border-gray-200 rounded-lg">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-4 h-4 rounded-full" style="background-color: {category.color}"></div>
                  <h4 class="font-semibold text-gray-900">{category.name}</h4>
                </div>
                
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span class="text-gray-600">Available:</span>
                    <span class="font-semibold text-green-600">{category.available_coupons}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Reserved:</span>
                    <span class="font-semibold text-yellow-600">{category.reserved_coupons}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Redeemed:</span>
                    <span class="font-semibold text-blue-600">{category.redeemed_coupons}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Total:</span>
                    <span class="font-semibold text-gray-700">{category.total_coupons}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  /* Custom scrollbar */
  .max-h-64::-webkit-scrollbar {
    width: 6px;
  }
  
  .max-h-64::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .max-h-64::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .max-h-64::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>
