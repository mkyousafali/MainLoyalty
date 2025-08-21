<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { browser } from '$app/environment';
  
  let staffUser: any = null;
  let isLoading = true;
  let error = '';
  let customerCode = '';
  let customerPrizes: any[] = [];
  let searchLoading = false;
  let showScanner = false;
  let selectedPrize: any = null;
  let redeemLoading = false;
  let currentLang: 'en' | 'ar' = 'en';
  
  const translations = {
    en: {
      title: 'Checkout Staff Dashboard',
      welcome: 'Welcome',
      logout: 'Logout',
      customerSearch: 'Customer Search',
      enterCustomerCode: 'Enter Customer Code',
      search: 'Search',
      scan: 'Scan QR',
      customerNotFound: 'Customer not found',
      noPrizes: 'No active prizes found',
      activePrizes: 'Active Prizes',
      redeem: 'Redeem',
      redeemed: 'Redeemed Successfully',
      redeeming: 'Redeeming...',
      searching: 'Searching...',
      amount: 'Amount',
      category: 'Category',
      expires: 'Expires',
      couponCode: 'Coupon Code',
      confirmRedeem: 'Confirm Redemption',
      cancel: 'Cancel',
      close: 'Close',
      refresh: 'Refresh',
      customerHistory: 'Customer History',
      viewHistory: 'View History',
      totalValue: 'Total Value',
      expiresIn: 'Expires in',
      expired: 'Expired',
      selectPrize: 'Select a prize to redeem'
    },
    ar: {
      title: 'لوحة تحكم موظف الصندوق',
      welcome: 'مرحباً',
      logout: 'خروج',
      customerSearch: 'البحث عن العميل',
      enterCustomerCode: 'أدخل رقم العميل',
      search: 'بحث',
      scan: 'مسح QR',
      customerNotFound: 'لم يتم العثور على العميل',
      noPrizes: 'لا توجد جوائز نشطة',
      activePrizes: 'الجوائز النشطة',
      redeem: 'استبدال',
      redeemed: 'تم الاستبدال بنجاح',
      redeeming: 'جاري الاستبدال...',
      searching: 'جاري البحث...',
      amount: 'المبلغ',
      category: 'الفئة',
      expires: 'ينتهي',
      couponCode: 'رمز الكوبون',
      confirmRedeem: 'تأكيد الاستبدال',
      cancel: 'إلغاء',
      close: 'إغلاق',
      refresh: 'تحديث',
      customerHistory: 'تاريخ العميل',
      viewHistory: 'عرض التاريخ',
      totalValue: 'القيمة الإجمالية',
      expiresIn: 'ينتهي خلال',
      expired: 'منتهي الصلاحية',
      selectPrize: 'اختر جائزة للاستبدال'
    }
  };
  
  $: t = translations[currentLang];
  
  onMount(() => {
    checkAuthAndLoadData();
  });
  
  async function checkAuthAndLoadData() {
    if (!browser) return;
    
    try {
      // Check if staff is logged in
      const staffSession = localStorage.getItem('checkoutStaffSession');
      const staffUserData = localStorage.getItem('checkoutStaffUser');
      
      if (staffSession !== 'active' || !staffUserData) {
        goto('/checkout-staff/login');
        return;
      }
      
      staffUser = JSON.parse(staffUserData);
      console.log('✅ Checkout staff authenticated:', staffUser);
      
    } catch (err: any) {
      console.error('❌ Auth check failed:', err);
      goto('/checkout-staff/login');
    } finally {
      isLoading = false;
    }
  }
  
  async function searchCustomer() {
    if (!customerCode.trim()) {
      error = 'Please enter a customer code';
      return;
    }
    
    try {
      searchLoading = true;
      error = '';
      customerPrizes = [];
      
      console.log('🔍 Searching for customer:', customerCode);
      
      // Search for active prizes for this customer
      const { data: prizes, error: prizesError } = await supabase
        .from('lucky_draw_prizes')
        .select(`
          *,
          lucky_draw_categories (
            name,
            name_ar,
            color
          )
        `)
        .eq('customer_code', customerCode.trim())
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (prizesError) {
        console.error('❌ Error searching prizes:', prizesError);
        error = 'Error searching for customer prizes';
        return;
      }
      
      if (!prizes || prizes.length === 0) {
        error = t.noPrizes;
        return;
      }
      
      customerPrizes = prizes;
      console.log('✅ Found prizes:', prizes.length);
      
    } catch (err: any) {
      console.error('❌ Search error:', err);
      error = 'Search failed. Please try again.';
    } finally {
      searchLoading = false;
    }
  }
  
  async function redeemPrize(prize: any) {
    if (!prize || !staffUser) return;
    
    try {
      redeemLoading = true;
      error = '';
      
      console.log('🎯 Redeeming prize:', prize.id);
      
      // Update prize status to redeemed
      const { error: updateError } = await supabase
        .from('lucky_draw_prizes')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redeemed_by: staffUser.username,
          redeemed_branch_id: staffUser.branch_id
        })
        .eq('id', prize.id);
      
      if (updateError) {
        console.error('❌ Error updating prize:', updateError);
        error = 'Failed to redeem prize';
        return;
      }
      
      // Update coupon status to redeemed
      const { error: couponError } = await supabase
        .from('lucky_draw_coupons')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redeemed_by: staffUser.username,
          redeemed_branch_id: staffUser.branch_id
        })
        .eq('id', prize.coupon_id);
      
      if (couponError) {
        console.error('❌ Error updating coupon:', couponError);
      }
      
      // Log redemption activity
      await supabase
        .from('checkout_staff_activity')
        .insert({
          staff_id: staffUser.id,
          activity_type: 'coupon_redeem',
          customer_code: customerCode,
          coupon_code: prize.coupon_code,
          details: {
            prize_id: prize.id,
            amount: prize.prize_amount,
            redemption_method: 'manual'
          }
        });
      
      // Remove redeemed prize from list
      customerPrizes = customerPrizes.filter(p => p.id !== prize.id);
      selectedPrize = null;
      
      // Show success message
      alert(t.redeemed);
      
      console.log('✅ Prize redeemed successfully');
      
    } catch (err: any) {
      console.error('❌ Redemption error:', err);
      error = 'Redemption failed. Please try again.';
    } finally {
      redeemLoading = false;
    }
  }
  
  function formatTimeRemaining(expiresAt: string): string {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return t.expired;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
  
  function logout() {
    localStorage.removeItem('checkoutStaffSession');
    localStorage.removeItem('checkoutStaffUser');
    localStorage.removeItem('checkoutStaffSessionId');
    goto('/checkout-staff/login');
  }
  
  function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
  }
  
  function clearSearch() {
    customerCode = '';
    customerPrizes = [];
    error = '';
    selectedPrize = null;
  }
</script>

<svelte:head>
  <title>{t.title} - MainLoyalty</title>
</svelte:head>

<div class="min-h-screen bg-gray-50" dir="{currentLang === 'ar' ? 'rtl' : 'ltr'}">
  {#if isLoading}
    <div class="flex justify-center items-center h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading...</p>
      </div>
    </div>
  {:else}
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">💳 {t.title}</h1>
            <p class="text-gray-600">{t.welcome}, {staffUser?.full_name || staffUser?.username}</p>
          </div>
          
          <div class="flex items-center gap-4">
            <button 
              on:click={toggleLanguage}
              class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              🌐 {currentLang === 'en' ? 'العربية' : 'English'}
            </button>
            
            <button 
              on:click={logout}
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="max-w-6xl mx-auto p-6">
      <!-- Customer Search -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">🔍 {t.customerSearch}</h2>
        
        <div class="flex gap-4 mb-4">
          <div class="flex-1">
            <input
              type="text"
              bind:value={customerCode}
              placeholder={t.enterCustomerCode}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              class:text-right={currentLang === 'ar'}
              on:keydown={(e) => e.key === 'Enter' && searchCustomer()}
            />
          </div>
          
          <button
            on:click={searchCustomer}
            disabled={searchLoading}
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searchLoading ? t.searching : t.search}
          </button>
          
          <button
            on:click={() => showScanner = true}
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📱 {t.scan}
          </button>
          
          <button
            on:click={clearSearch}
            class="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t.refresh}
          </button>
        </div>
        
        {#if error}
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p class="text-red-600">{error}</p>
          </div>
        {/if}
      </div>
      
      <!-- Active Prizes -->
      {#if customerPrizes.length > 0}
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold text-gray-900">🎁 {t.activePrizes}</h3>
            <div class="text-sm text-gray-600">
              Customer: <span class="font-semibold">{customerCode}</span> • 
              Total: <span class="font-semibold">{customerPrizes.length}</span> prizes •
              Value: <span class="font-semibold">${customerPrizes.reduce((sum, p) => sum + parseFloat(p.prize_amount), 0).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each customerPrizes as prize}
              <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h4 class="font-semibold text-gray-900">
                      {currentLang === 'ar' ? prize.lucky_draw_categories?.name_ar : prize.lucky_draw_categories?.name}
                    </h4>
                    <p class="text-sm text-gray-600">{t.couponCode}: {prize.coupon_code}</p>
                  </div>
                  
                  <div class="text-right">
                    <p class="text-2xl font-bold text-green-600">${prize.prize_amount}</p>
                  </div>
                </div>
                
                <div class="text-sm text-gray-600 mb-4">
                  <p>{t.expiresIn}: {formatTimeRemaining(prize.expires_at)}</p>
                  <p>Won: {new Date(prize.created_at).toLocaleDateString()}</p>
                </div>
                
                <button
                  on:click={() => selectedPrize = prize}
                  class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  {t.redeem}
                </button>
              </div>
            {/each}
          </div>
        </div>
      {:else if customerCode && !searchLoading}
        <div class="bg-white rounded-xl shadow-lg p-8 text-center">
          <div class="text-6xl mb-4">🎁</div>
          <p class="text-xl text-gray-600">{t.noPrizes}</p>
          <p class="text-gray-500 mt-2">Customer: {customerCode}</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Redemption Confirmation Modal -->
{#if selectedPrize}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" on:click={() => selectedPrize = null}>
    <div class="bg-white rounded-xl max-w-md w-full p-6" on:click|stopPropagation>
      <h3 class="text-xl font-bold text-gray-900 mb-4">{t.confirmRedeem}</h3>
      
      <!-- Prize Details -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <div class="flex justify-between items-center mb-2">
          <span class="text-gray-600">{t.category}:</span>
          <span class="font-semibold">
            {currentLang === 'ar' ? selectedPrize.lucky_draw_categories?.name_ar : selectedPrize.lucky_draw_categories?.name}
          </span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <span class="text-gray-600">{t.amount}:</span>
          <span class="text-2xl font-bold text-green-600">${selectedPrize.prize_amount}</span>
        </div>
        
        <div class="flex justify-between items-center mb-2">
          <span class="text-gray-600">{t.couponCode}:</span>
          <span class="font-mono text-sm">{selectedPrize.coupon_code}</span>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-gray-600">{t.expires}:</span>
          <span class="text-sm">{formatTimeRemaining(selectedPrize.expires_at)}</span>
        </div>
      </div>
      
      <div class="flex gap-3">
        <button
          on:click={() => redeemPrize(selectedPrize)}
          disabled={redeemLoading}
          class="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {redeemLoading ? t.redeeming : t.redeem}
        </button>
        
        <button
          on:click={() => selectedPrize = null}
          disabled={redeemLoading}
          class="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 font-semibold"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- QR Scanner Modal (Placeholder) -->
{#if showScanner}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" on:click={() => showScanner = false}>
    <div class="bg-white rounded-xl max-w-md w-full p-6 text-center" on:click|stopPropagation>
      <h3 class="text-xl font-bold text-gray-900 mb-4">📱 QR Code Scanner</h3>
      
      <!-- Scanner Placeholder -->
      <div class="w-64 h-64 mx-auto mb-4 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
        <div class="text-center">
          <div class="text-4xl mb-2">📷</div>
          <span class="text-gray-500">QR Scanner</span>
        </div>
      </div>
      
      <p class="text-sm text-gray-600 mb-4">Position the QR code within the camera frame</p>
      
      <button 
        on:click={() => showScanner = false}
        class="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        {t.close}
      </button>
    </div>
  </div>
{/if}

<style>
  [dir="rtl"] input {
    text-align: right;
  }
</style>
