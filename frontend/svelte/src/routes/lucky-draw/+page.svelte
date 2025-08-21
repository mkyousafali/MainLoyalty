<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { language, t } from '$lib/stores/language';
  import { browser } from '$app/environment';

  // Custom currency symbol - using the original currency-symbol.svg from static folder
  // For wheel segments, we'll use a simplified character due to space constraints
  const wheelCurrencySymbol = '¤'; // Simple currency symbol for wheel text
  
  // For larger displays, create a simplified SVG based on the original
  const currencySymbolSVG = `
    <svg viewBox="0 0 24 24" class="inline-block" fill="currentColor">
      <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M8 8l8 8M8 16l8-8" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `;
  
  // Function to get currency symbol for different contexts
  function getCurrencyDisplay(context = 'wheel', amount = '') {
    if (context === 'wheel') {
      return wheelCurrencySymbol + amount;
    } else {
      // For larger displays, we could use the SVG or enhanced symbol
      return wheelCurrencySymbol + amount;
    }
  }
  
  let customerData: any = null;
  let isLoading = true;
  let error = '';
  let spinning = false;
  let showWheel = false;
  let wheelResult: any = null;
  let showResult = false;
  let qrInterval: any = null;
  
  // Error popup state
  let showError = false;
  let errorMessage = '';
  
  // Wheel state
  let canSpin = false;
  let spinStatus: any = null;
  let nextSpinDate = '';
  let remainingSpins = { daily: 0, weekly: 0 };
  
  // Wheel animation variables
  let wheelAngle = 0;
  let wheelRotation = 0;
  let wheelSegments: any[] = [];
  
  // Prize state
  let activePrizes: any[] = [];
  let showQR = false;
  let currentPrizeQR = '';
  let showRules = false;
  
  const translations = {
    en: {
      title: 'Lucky Draw',
      spinNow: 'Spin Now',
      tryAgain: 'Try Again on',
      howItWorks: 'How It Works',
      myPrizes: 'My Prizes',
      showQR: 'Show QR',
      copyCode: 'Copy Code',
      winnersThisWeek: 'Winners This Week',
      loading: 'Loading...',
      spin: 'Spin!',
      spinning: 'Spinning...',
      congratulations: 'Congratulations!',
      youWon: 'You Won',
      betterLuck: 'Better luck next time!',
      noStock: 'Prize pool is empty, try again later!',
      prizesTitle: 'My Lucky Draw Prizes',
      active: 'Active',
      redeemed: 'Redeemed',
      expired: 'Expired',
      expiresIn: 'Expires in',
      prizeExpired: 'Prize Expired',
      prizeRedeemed: 'Prize Redeemed',
      rules: [
        'Each spin costs points based on your card type',
        'Gold cards: 3-day cooldown, 2 spins/day, 5 spins/week',
        'Silver cards: 5-day cooldown, 1 spin/day, 3 spins/week', 
        'Bronze cards: 7-day cooldown, 1 spin/day, 2 spins/week',
        'First-time spinners are guaranteed to win!',
        'Prizes must be redeemed within 24 hours',
        'QR codes refresh every 30 seconds for security'
      ]
    },
    ar: {
      title: 'العجلة المحظوظة',
      spinNow: 'إبدأ الدوران',
      tryAgain: 'المحاولة التالية في',
      howItWorks: 'كيفية الاستخدام',
      myPrizes: 'جوائزي',
      showQR: 'إظهار QR',
      copyCode: 'نسخ الرمز',
      winnersThisWeek: 'الفائزون هذا الأسبوع',
      loading: 'جاري التحميل...',
      spin: 'دوران!',
      spinning: 'جاري الدوران...',
      congratulations: 'تهانينا!',
      youWon: 'لقد فزت',
      betterLuck: 'حظ أوفر المرة القادمة!',
      noStock: 'مخزون الجوائز فارغ، حاول مرة أخرى لاحقاً!',
      prizesTitle: 'جوائز العجلة المحظوظة',
      active: 'ساري',
      redeemed: 'مستخدم',
      expired: 'منتهي',
      expiresIn: 'ينتهي خلال',
      prizeExpired: 'انتهت صلاحية الجائزة',
      prizeRedeemed: 'تم استخدام الجائزة',
      rules: [
        'كل دوران يكلف نقاط حسب نوع بطاقتك',
        'البطاقة الذهبية: انتظار 3 أيام، دورانان يومياً، 5 دورانات أسبوعياً',
        'البطاقة الفضية: انتظار 5 أيام، دوران واحد يومياً، 3 دورانات أسبوعياً',
        'البطاقة البرونزية: انتظار 7 أيام، دوران واحد يومياً، دورانان أسبوعياً',
        'الدوران الأول مضمون الفوز!',
        'يجب استبدال الجوائز خلال 24 ساعة',
        'رموز QR تتجدد كل 30 ثانية للأمان'
      ]
    }
  };
  
  $: currentTranslations = translations[$language];
  
  onMount(() => {
    loadCustomerData();
    generateDefaultWheelSegments();
  });
  
  function generateDefaultWheelSegments() {
    // Create default wheel segments for display
    const defaultSegments = [
      { name: '5 OFF', name_ar: '5 خصم', color: '#E74C3C', prize_amount: 5 },
      { name: '10 OFF', name_ar: '10 خصم', color: '#27AE60', prize_amount: 10 },
      { name: 'Try Again', name_ar: 'حاول مرة أخرى', color: '#95A5A6', prize_amount: 0 },
      { name: '25 OFF', name_ar: '25 خصم', color: '#3498DB', prize_amount: 25 },
      { name: '15 OFF', name_ar: '15 خصم', color: '#F39C12', prize_amount: 15 },
      { name: 'Try Again', name_ar: 'حاول مرة أخرى', color: '#95A5A6', prize_amount: 0 },
      { name: '20 OFF', name_ar: '20 خصم', color: '#9B59B6', prize_amount: 20 },
      { name: 'Try Again', name_ar: 'حاول مرة أخرى', color: '#95A5A6', prize_amount: 0 }
    ];
    
    const segmentAngle = 360 / defaultSegments.length;
    
    wheelSegments = defaultSegments.map((segment, index) => ({
      ...segment,
      startAngle: index * segmentAngle,
      endAngle: (index + 1) * segmentAngle,
      centerAngle: index * segmentAngle + segmentAngle / 2
    }));
  }
  
  async function loadCustomerData() {
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
        .select(`
          *,
          card_types (
            name,
            name_ar,
            color
          )
        `)
        .eq('customer_code', currentUser.mobile)
        .single();
        
      if (customerError) {
        error = 'Failed to load customer data';
        return;
      }
      
      customerData = customer;
      
      // Check spin eligibility
      await checkSpinEligibility();
      
      // Load active prizes
      await loadActivePrizes();
      
    } catch (err: any) {
      error = 'Something went wrong';
      console.error('Error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  async function checkSpinEligibility() {
    if (!customerData) return;
    
    try {
      const { data, error } = await supabase
        .rpc('can_customer_spin', {
          p_customer_code: customerData.customer_code,
          p_card_type: customerData.card_types?.name?.toLowerCase() || 'bronze'
        });
        
      if (error) {
        console.error('Error checking spin eligibility:', error);
        return;
      }
      
      spinStatus = data;
      canSpin = data?.can_spin || false;
      
      if (data?.next_spin_date) {
        nextSpinDate = new Date(data.next_spin_date).toLocaleDateString();
      }
      
    } catch (err: any) {
      console.error('Error checking spin eligibility:', err);
    }
  }
  
  async function loadActivePrizes() {
    if (!customerData) return;
    
    try {
      const { data, error } = await supabase
        .from('customer_active_prizes')
        .select('*')
        .eq('customer_code', customerData.customer_code)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        activePrizes = data;
      }
    } catch (err: any) {
      console.error('Error loading prizes:', err);
    }
  }
  
  async function spinForFun() {
    if (spinning) return;
    
    try {
      spinning = true;
      showWheel = true;
      error = '';
      
      // Animate the wheel spinning
      const spins = 5 + Math.random() * 3; // 5-8 rotations
      const randomLanding = Math.random() * 360; // Random final position
      const totalRotation = (360 * spins) + randomLanding;
      
      wheelAngle += totalRotation;
      wheelRotation = wheelAngle;
      
      // Wait for wheel animation to complete
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Generate a fun result (always "no win" but entertaining)
      const funMessages = [
        'Better luck next time!',
        'Almost got it!',
        'So close!',
        'Keep trying!',
        'Nice spin!',
        'Great technique!'
      ];
      
      wheelResult = {
        result: 'fun_mode',
        message: funMessages[Math.floor(Math.random() * funMessages.length)],
        note: 'This was just for fun - no real prizes in fun mode!'
      };
      
      showResult = true;
      
    } catch (err: any) {
      console.error('Fun spin error:', err);
      showErrorPopup('Oops! Even the fun mode had a hiccup. Try again!');
    } finally {
      spinning = false;
    }
  }
  
  function showErrorPopup(message: string) {
    errorMessage = message;
    showError = true;
    
    // Auto-close after 4 seconds
    setTimeout(() => {
      showError = false;
    }, 4000);
  }
  
  async function executeSpin() {
    if (spinning || !customerData) return;
    
    // Check if user has credits first
    if (!canSpin) {
      if (spinStatus?.reason === 'no_credits') {
        showErrorPopup('You have no spin chances left. Come back tomorrow!');
        return;
      } else if (spinStatus?.reason === 'cooldown') {
        showErrorPopup(`You can spin again on ${nextSpinDate}. Please wait!`);
        return;
      } else {
        showErrorPopup('You cannot spin right now. Please check back later.');
        return;
      }
    }
    
    try {
      spinning = true;
      showWheel = true;
      error = ''; // Clear any previous errors
      
      // Check if there are prizes available in the system
      const { data: prizesCheck, error: prizesError } = await supabase
        .from('lucky_draw_prizes')
        .select('id')
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .limit(1);
        
      if (prizesError) {
        throw new Error('Failed to check prize availability');
      }
      
      if (!prizesCheck || prizesCheck.length === 0) {
        spinning = false;
        showWheel = false;
        showErrorPopup('Try again later - no prizes available right now!');
        return;
      }
      
      // Simulate wheel spinning animation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { data, error: spinError } = await supabase
        .rpc('execute_lucky_spin', {
          p_customer_code: customerData.customer_code,
          p_card_type: customerData.card_types?.name?.toLowerCase() || 'bronze'
        });
        
      if (spinError) {
        console.error('Spin RPC error:', spinError);
        
        // Handle specific error cases
        if (spinError.message?.includes('no_credits') || spinError.message?.includes('insufficient')) {
          showErrorPopup('You have no spin chances left!');
        } else if (spinError.message?.includes('cooldown') || spinError.message?.includes('wait')) {
          showErrorPopup(`Please wait until ${nextSpinDate} to spin again!`);
        } else if (spinError.message?.includes('stock') || spinError.message?.includes('prize')) {
          showErrorPopup('Try again later - no prizes available!');
        } else {
          showErrorPopup('Something went wrong. Please try again later!');
        }
        return;
      }
      
      if (!data) {
        showErrorPopup('No response from server. Please try again!');
        return;
      }
      
      wheelResult = data;
      showResult = true;
      
      // Refresh data after successful spin
      await checkSpinEligibility();
      await loadActivePrizes();
      
    } catch (err: any) {
      console.error('Spin execution error:', err);
      
      // Show user-friendly error message
      if (err.message?.includes('network') || err.message?.includes('fetch')) {
        showErrorPopup('Connection error. Please check your internet and try again!');
      } else if (err.message?.includes('prize')) {
        showErrorPopup('Try again later - no prizes available right now!');
      } else {
        showErrorPopup('Something went wrong. Please try again later!');
      }
      
    } finally {
      spinning = false;
      setTimeout(() => {
        showWheel = false;
      }, 1000);
    }
  }
  
  async function generateQRCode(prizeId: string) {
    try {
      const { data, error } = await supabase
        .rpc('generate_qr_data', {
          p_prize_id: prizeId
        });
        
      if (!error && data) {
        currentPrizeQR = data;
        showQR = true;
        
        // Auto-refresh QR every 30 seconds
        if (qrInterval) clearInterval(qrInterval);
        qrInterval = setInterval(() => {
          generateQRCode(prizeId);
        }, 30000);
      }
    } catch (err: any) {
      console.error('Error generating QR:', err);
    }
  }
  
  function closeQR() {
    showQR = false;
    currentPrizeQR = '';
    if (qrInterval) {
      clearInterval(qrInterval);
      qrInterval = null;
    }
  }
  
  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    // Show toast or feedback
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
</script>

<svelte:head>
  <title>{currentTranslations.title} - MainLoyalty</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50" dir="{$language === 'ar' ? 'rtl' : 'ltr'}">
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
    <div class="max-w-4xl mx-auto p-2 sm:p-4">
      
      <!-- Lucky Wheel Section -->
      <div class="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 mb-4 sm:mb-6 text-center">
        <div class="wheel-container mb-6 sm:mb-8">
          <div class="relative flex justify-center">
            <!-- Prize Indicator Pointer (pointing down into wheel) -->
            <div class="absolute top-0 left-1/2 transform -translate-x-1/2 translate-y-1 sm:translate-y-2 z-30">
              <div class="prize-pointer">
                <svg width="28" height="36" viewBox="0 0 32 40" class="sm:w-8 sm:h-10">
                  <!-- Outer triangle pointing down -->
                  <path d="M16 32 L6 8 L26 8 Z" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
                  <!-- Inner highlight -->
                  <path d="M16 28 L10 12 L22 12 Z" fill="#FFF8DC" opacity="0.8"/>
                  <!-- Center line for definition -->
                  <path d="M16 8 L16 32" stroke="#B8860B" stroke-width="1"/>
                  <!-- Top accent -->
                  <circle cx="16" cy="8" r="3" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
                </svg>
              </div>
            </div>
            
            <!-- Static Logo in Center -->
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              <div class="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full border-3 sm:border-4 border-gray-700 flex items-center justify-center shadow-lg">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  class="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                />
              </div>
            </div>
            
            <!-- Professional Lucky Wheel -->
            <div 
              class="lucky-wheel {spinning ? 'spinning' : ''}"
              style="transform: rotate({wheelRotation || 0}deg);"
            >
              <svg viewBox="0 0 200 200" class="wheel-svg">
                {#if wheelSegments && wheelSegments.length > 0}
                  {#each wheelSegments as segment, index}
                    <!-- Main segment -->
                    <path
                      d="M 100 100 L {100 + 90 * Math.cos((segment.startAngle - 90) * Math.PI / 180)} {100 + 90 * Math.sin((segment.startAngle - 90) * Math.PI / 180)} A 90 90 0 {segment.endAngle - segment.startAngle > 180 ? 1 : 0} 1 {100 + 90 * Math.cos((segment.endAngle - 90) * Math.PI / 180)} {100 + 90 * Math.sin((segment.endAngle - 90) * Math.PI / 180)} Z"
                      fill={segment.color}
                      stroke="#ffffff"
                      stroke-width="3"
                      class="segment-path"
                    />
                    
                    <!-- Star decorations -->
                    <g transform="translate({100 + 75 * Math.cos((segment.centerAngle - 90) * Math.PI / 180)}, {100 + 75 * Math.sin((segment.centerAngle - 90) * Math.PI / 180)})">
                      <path
                        d="M0,-4 L1.2,-1.2 L4,0 L1.2,1.2 L0,4 L-1.2,1.2 L-4,0 L-1.2,-1.2 Z"
                        fill="white"
                        opacity="0.8"
                      />
                    </g>
                    
                    <!-- Prize text - smaller font on mobile -->
                    <g transform="translate({100 + 70 * Math.cos((segment.centerAngle - 90) * Math.PI / 180)}, {100 + 70 * Math.sin((segment.centerAngle - 90) * Math.PI / 180)}) rotate({segment.centerAngle + (segment.centerAngle > 90 && segment.centerAngle < 270 ? 180 : 0)})">
                      <text
                        x="0"
                        y="0"
                        text-anchor="middle"
                        dominant-baseline="central"
                        fill="white"
                        font-size="9"
                        font-weight="bold"
                        font-family="Arial, sans-serif"
                        style="text-shadow: 2px 2px 4px rgba(0,0,0,0.8);"
                        class="sm:text-[10px]"
                      >
                        {#if segment.prize_amount > 0}
                          {$language === 'ar' ? `${segment.prize_amount} ${wheelCurrencySymbol} خصم` : `${wheelCurrencySymbol}${segment.prize_amount} OFF`}
                        {:else}
                          {$language === 'ar' ? segment.name_ar : segment.name}
                        {/if}
                      </text>
                    </g>
                  {/each}
                {:else}
                  <!-- Default wheel segments -->
                  {#each Array(8) as _, i}
                    <path
                      d="M 100 100 L {100 + 90 * Math.cos((i * 45 - 90) * Math.PI / 180)} {100 + 90 * Math.sin((i * 45 - 90) * Math.PI / 180)} A 90 90 0 0 1 {100 + 90 * Math.cos(((i + 1) * 45 - 90) * Math.PI / 180)} {100 + 90 * Math.sin(((i + 1) * 45 - 90) * Math.PI / 180)} Z"
                      fill={['#E74C3C', '#27AE60', '#3498DB', '#F39C12', '#9B59B6', '#E74C3C', '#27AE60', '#3498DB'][i]}
                      stroke="#ffffff"
                      stroke-width="3"
                    />
                    
                    <!-- Star decorations -->
                    <g transform="translate({100 + 75 * Math.cos((i * 45 + 22.5 - 90) * Math.PI / 180)}, {100 + 75 * Math.sin((i * 45 + 22.5 - 90) * Math.PI / 180)})">
                      <path
                        d="M0,-4 L1.2,-1.2 L4,0 L1.2,1.2 L0,4 L-1.2,1.2 L-4,0 L-1.2,-1.2 Z"
                        fill="white"
                        opacity="0.8"
                      />
                    </g>
                  {/each}
                {/if}
                
                <!-- Outer ring decoration -->
                <circle cx="100" cy="100" r="88" fill="none" stroke="#34495E" stroke-width="4" opacity="0.3"/>
                
                <!-- Small dots around the edge -->
                {#each Array(12) as _, i}
                  <circle 
                    cx={100 + 92 * Math.cos((i * 30 - 90) * Math.PI / 180)} 
                    cy={100 + 92 * Math.sin((i * 30 - 90) * Math.PI / 180)} 
                    r="2" 
                    fill="white" 
                    opacity="0.9"
                  />
                {/each}
                
                <!-- Center circle (empty, logo is placed outside) -->
                <circle cx="100" cy="100" r="25" fill="transparent" stroke="none"/>
              </svg>
            </div>
          </div>
        </div>
        
        <!-- Spin Button -->
        {#if canSpin}
          <button 
            on:click={executeSpin}
            disabled={spinning}
            class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-lg sm:text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none w-full sm:w-auto"
          >
            {spinning ? currentTranslations.spinning : currentTranslations.spinNow}
          </button>
        {:else}
          <div class="text-center">
            <div class="bg-gray-100 text-gray-600 px-4 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold mb-4">
              {currentTranslations.tryAgain} {nextSpinDate}
            </div>
            {#if spinStatus?.reason}
              <p class="text-sm text-gray-500 mb-4">{spinStatus.message}</p>
            {/if}
            
            <!-- Fun Mode Button -->
            <button 
              on:click={spinForFun}
              disabled={spinning}
              class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none w-full sm:w-auto"
            >
              🎯 {spinning ? 'Spinning for Fun...' : 'Spin for Fun!'}
            </button>
            <p class="text-xs text-gray-500 mt-2">No prizes, just for entertainment!</p>
          </div>
        {/if}
        
        <!-- Pills for remaining spins -->
        <div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-4">
          <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs sm:text-sm text-center">
            Daily: {remainingSpins.daily} left
          </div>
          <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs sm:text-sm text-center">
            Weekly: {remainingSpins.weekly} left
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button 
          on:click={() => goto('/lucky-draw/prizes')}
          class="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 text-center"
        >
          <div class="text-2xl sm:text-3xl mb-2">🏆</div>
          <h3 class="font-semibold text-gray-900 text-sm sm:text-base">{currentTranslations.myPrizes}</h3>
          <p class="text-xs sm:text-sm text-gray-600">{activePrizes.length} active prizes</p>
        </button>
        
        <button 
          on:click={() => showRules = !showRules}
          class="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 text-center"
        >
          <div class="text-2xl sm:text-3xl mb-2">📋</div>
          <h3 class="font-semibold text-gray-900 text-sm sm:text-base">{currentTranslations.howItWorks}</h3>
          <p class="text-xs sm:text-sm text-gray-600">View game rules</p>
        </button>
        
        <button 
          on:click={() => goto('/lucky-draw/leaderboard')}
          class="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 text-center"
        >
          <div class="text-2xl sm:text-3xl mb-2">👑</div>
          <h3 class="font-semibold text-gray-900 text-sm sm:text-base">{currentTranslations.winnersThisWeek}</h3>
          <p class="text-xs sm:text-sm text-gray-600">See top winners</p>
        </button>
      </div>
      
      <!-- Active Prizes Quick View -->
      {#if activePrizes.length > 0}
        <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
            🎁 {currentTranslations.myPrizes}
          </h3>
          
          <div class="grid gap-3 sm:gap-4">
            {#each activePrizes.slice(0, 3) as prize}
              <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 gap-3 sm:gap-4">
                <div class="flex-1">
                  <p class="font-semibold text-green-800 text-sm sm:text-base">
                    {$language === 'ar' ? prize.category_name_ar : prize.category_name}
                  </p>
                  <p class="text-xl sm:text-2xl font-bold text-green-900 flex items-center gap-1">
                    <img src="/currency-symbol.svg" alt="Currency" class="w-5 h-5 inline-block" />
                    {prize.prize_amount}
                  </p>
                  <p class="text-xs sm:text-sm text-green-600">
                    {currentTranslations.expiresIn}: {formatTimeRemaining(prize.expires_at)}
                  </p>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-2">
                  <button 
                    on:click={() => generateQRCode(prize.id)}
                    class="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
                  >
                    {currentTranslations.showQR}
                  </button>
                  <button 
                    on:click={() => copyCode(prize.coupon_code)}
                    class="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm"
                  >
                    {currentTranslations.copyCode}
                  </button>
                </div>
              </div>
            {/each}
          </div>
          
          {#if activePrizes.length > 3}
            <div class="text-center mt-3 sm:mt-4">
              <button 
                on:click={() => goto('/lucky-draw/prizes')}
                class="text-purple-600 hover:text-purple-700 font-semibold text-sm sm:text-base"
              >
                View all {activePrizes.length} prizes →
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Rules Modal -->
{#if showRules}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" on:click={() => showRules = false}>
    <div class="bg-white rounded-xl max-w-md w-full p-6" on:click|stopPropagation>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">{currentTranslations.howItWorks}</h3>
        <button on:click={() => showRules = false} class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <ul class="space-y-3 text-sm text-gray-700">
        {#each currentTranslations.rules as rule}
          <li class="flex items-start">
            <span class="text-purple-600 mr-2">•</span>
            {rule}
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<!-- QR Modal -->
{#if showQR}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" on:click={closeQR}>
    <div class="bg-white rounded-xl max-w-sm w-full p-6 text-center" on:click|stopPropagation>
      <h3 class="text-xl font-bold text-gray-900 mb-4">{currentTranslations.showQR}</h3>
      
      <!-- QR Code would be generated here -->
      <div class="w-48 h-48 mx-auto mb-4 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
        <span class="text-gray-500">QR Code</span>
      </div>
      
      <p class="text-sm text-gray-600 mb-4">Code: {currentPrizeQR}</p>
      <p class="text-xs text-gray-500 mb-4">Auto-refreshes every 30 seconds</p>
      
      <button on:click={closeQR} class="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors">
        Close
      </button>
    </div>
  </div>
{/if}

<!-- Result Modal -->
{#if showResult && wheelResult}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl max-w-md w-full p-6 text-center">
      {#if wheelResult.result === 'win'}
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="text-2xl font-bold text-green-600 mb-2">{currentTranslations.congratulations}</h3>
        <p class="text-xl text-gray-700 mb-4">{currentTranslations.youWon}</p>
        <div class="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
          <p class="text-2xl font-bold text-green-800 flex items-center gap-2">
            <img src="/currency-symbol.svg" alt="Currency" class="w-6 h-6 inline-block" />
            {wheelResult.prize.amount}
          </p>
          <p class="text-green-600">{$language === 'ar' ? wheelResult.prize.category_ar : wheelResult.prize.category}</p>
          <p class="text-sm text-green-600 mt-2">Expires: {new Date(wheelResult.prize.expires_at).toLocaleString()}</p>
        </div>
      {:else if wheelResult.result === 'no_stock'}
        <div class="text-6xl mb-4">😔</div>
        <h3 class="text-xl font-bold text-orange-600 mb-2">{currentTranslations.noStock}</h3>
      {:else if wheelResult.result === 'fun_mode'}
        <div class="text-6xl mb-4">🎯</div>
        <h3 class="text-xl font-bold text-blue-600 mb-2">Fun Mode Spin!</h3>
        <p class="text-lg text-gray-700 mb-2">{wheelResult.message}</p>
        <p class="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">{wheelResult.note}</p>
      {:else}
        <div class="text-6xl mb-4">🍀</div>
        <h3 class="text-xl font-bold text-blue-600 mb-2">{currentTranslations.betterLuck}</h3>
      {/if}
      
      <button 
        on:click={() => { showResult = false; showWheel = false; wheelResult = null; }}
        class="w-full {wheelResult.result === 'fun_mode' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white py-3 rounded-lg transition-colors mt-4"
      >
        Continue
      </button>
    </div>
  </div>
{/if}

<!-- Error Popup Modal -->
{#if showError}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" on:click={() => showError = false}>
    <div class="bg-white rounded-xl max-w-md w-full p-6 text-center" on:click|stopPropagation>
      <div class="text-6xl mb-4">⚠️</div>
      <h3 class="text-xl font-bold text-red-600 mb-4">Oops!</h3>
      <p class="text-gray-700 mb-6">{errorMessage}</p>
      
      <button 
        on:click={() => showError = false}
        class="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
      >
        Got it
      </button>
    </div>
  </div>
{/if}

<style>
  .lucky-wheel {
    width: 200px;
    height: 200px;
    margin: 0 auto;
    position: relative;
    border-radius: 50%;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    transition: transform 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  
  /* Desktop wheel size */
  @media (min-width: 640px) {
    .lucky-wheel {
      width: 256px;
      height: 256px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    }
  }
  
  .lucky-wheel.spinning {
    animation: none; /* Use transition instead of animation for smooth control */
  }
  
  .wheel-svg {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
  }
  
  .prize-pointer {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    animation: pointer-glow 2s ease-in-out infinite;
  }
  
  @media (min-width: 640px) {
    .prize-pointer {
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    }
  }
  
  @keyframes pointer-glow {
    0%, 100% { 
      transform: scale(1);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
    50% { 
      transform: scale(1.05);
      filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 12px rgba(255, 215, 0, 0.4));
    }
  }
  
  @media (min-width: 640px) {
    @keyframes pointer-glow {
      0%, 100% { 
        transform: scale(1);
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      }
      50% { 
        transform: scale(1.05);
        filter: drop-shadow(0 6px 12px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.4));
      }
    }
  }
  
  .segment-path {
    transition: opacity 0.2s ease;
  }
  
  .segment-path:hover {
    opacity: 0.9;
  }
  
  .wheel-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
  }
  
  @media (min-width: 640px) {
    .wheel-container {
      padding: 20px;
    }
  }
  
  /* Mobile-first responsive design */
  @media (max-width: 480px) {
    .lucky-wheel {
      width: 180px;
      height: 180px;
    }
    
    /* Ensure text remains readable on very small screens */
    .segment-path text {
      font-size: 8px !important;
    }
  }
  
  /* Smooth transitions for all wheel interactions */
  .lucky-wheel * {
    transition: all 0.3s ease;
  }
  
  /* Touch-friendly buttons on mobile */
  @media (max-width: 640px) {
    button {
      min-height: 44px; /* iOS recommended minimum touch target */
    }
  }
  
  /* Prevent horizontal scrolling on mobile */
  .min-h-screen {
    overflow-x: hidden;
  }
  
  /* Ensure modals are mobile-friendly */
  @media (max-width: 640px) {
    .fixed .bg-white {
      margin: 1rem;
      max-height: 90vh;
      overflow-y: auto;
    }
  }
</style>
