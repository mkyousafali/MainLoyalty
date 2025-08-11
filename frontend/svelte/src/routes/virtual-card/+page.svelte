<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getCardTypeColor, getCardTypeGradient } from '$lib/stores/cardTypes';
  import { supabase } from '$lib/supabase';
  import { language, t } from '$lib/stores/language';

  let customerData: any = null;
  let cardTypeData: any = null;
  let isLoading = true;
  let error = '';

  // Load customer data from database
  async function loadCustomerData() {
    try {
      isLoading = true;
      error = '';

      // Only run in browser
      if (typeof window === 'undefined') {
        isLoading = false;
        return;
      }

      // Get current user mobile from auth store
      const currentUser = JSON.parse(localStorage.getItem('loyaltyUser') || '{}');
      console.log('🔍 Virtual Card: Current user from localStorage:', currentUser);
      
      if (!currentUser.mobile) {
        error = 'No user found. Please login again.';
        console.log('❌ Virtual Card: No mobile found in localStorage');
        goto('/login');
        return;
      }

      console.log('🔍 Virtual Card: Fetching customer data for mobile:', currentUser.mobile);

      // Try to get customer data from database first with card information and card type
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select(`
          *,
          customer_cards (
            card_number
          ),
          card_types (
            name,
            name_ar,
            color,
            point_limit
          )
        `)
        .eq('customer_code', currentUser.mobile)
        .single();

      if (customerError) {
        console.error('❌ Virtual Card: Error fetching customer:', customerError);
        error = `Failed to load customer data: ${customerError.message}`;
        return;
      }

      if (!customer) {
        console.log('❌ Virtual Card: No customer found for mobile:', currentUser.mobile);
        error = 'Customer not found. Please contact support.';
        return;
      }

      console.log('✅ Virtual Card: Customer data loaded:', customer);
      console.log('📅 Virtual Card: Date fields check:', {
        registration_date: customer.registration_date,
        joined_at: customer.joined_at,
        created_at: customer.created_at,
        valid_until: customer.valid_until,
        card_expiry_date: customer.card_expiry_date,
        card_issued_date: customer.card_issued_date
      });
      
      customerData = customer;
      
      // Use card type data from database if available, otherwise fallback to customer.card_type
      if (customer.card_types) {
        cardTypeData = customer.card_types;
      } else {
        // Fallback for customers without proper card_types relationship
        cardTypeData = {
          name: customer.card_type || 'bronze',
          name_ar: customer.card_type || 'برونزي',
          color: customer.card_type === 'gold' ? '#FFD700' : customer.card_type === 'silver' ? '#C0C0C0' : '#CD7F32',
          point_limit: customer.card_type === 'gold' ? 5000 : customer.card_type === 'silver' ? 2500 : 1000
        };
      }

      // Clear any previous errors since customer data loaded successfully
      error = '';

    } catch (err) {
      console.error('💥 Virtual Card: Unexpected error:', err);
      error = `Unexpected error: ${err}`;
    } finally {
      isLoading = false;
      console.log('🏁 Virtual Card: Loading completed. Error:', error);
    }
  }

  // Get dynamic card colors based on customer's card type - use database color if available
  $: cardColor = cardTypeData && cardTypeData.color ? cardTypeData.color : getCardTypeColor(cardTypeData?.name || 'Gold');
  $: cardGradient = (() => {
    if (cardTypeData && cardTypeData.color) {
      const baseColor = cardTypeData.color;
      return { 
        from: baseColor, 
        to: adjustBrightness(baseColor, -20) 
      };
    }
    return cardTypeData ? getCardTypeGradient(cardTypeData.name) : getCardTypeGradient('Gold');
  })();

  // Helper function to adjust color brightness for gradient effect  
  function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  
  // Helper function to determine if color is light or dark for text contrast
  function getContrastTextColor(hexColor: string): 'light' | 'dark' | 'gold' {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Special handling for gold colors
    if (hexColor.toLowerCase() === '#ffd700' || 
        (r > 200 && g > 180 && b < 100)) {
      return 'gold';
    }
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? 'dark' : 'light';
  }
  
  $: textTheme = getContrastTextColor(cardColor);

  function goBack() {
    history.back();
  }

  // Helper function to format date
  function formatExpiryDate(dateString: string): string {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return '';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return '';
    }
  }

  // Helper function to format any date consistently
  function formatDate(dateString: string): string {
    return formatExpiryDate(dateString);
  }

  // Generate a default expiry date (end of current year)
  function generateDefaultExpiryDate(): string {
    try {
      // Set expiry to December 31st of current year
      const currentYear = new Date().getFullYear();
      const expiryDate = new Date(currentYear, 11, 31); // Month 11 = December, day 31
      
      return formatDate(expiryDate.toISOString());
    } catch {
      // If all else fails, return current date formatted
      const endOfYear = new Date();
      endOfYear.setMonth(11, 31); // December 31st
      return formatDate(endOfYear.toISOString());
    }
  }

  // Member number helpers (UI only, no logic changes)
  function memberId(): string {
    return customerData?.customer_cards?.[0]?.card_number
      || customerData?.customer_code
      || 'N/A';
  }
  let copyMsg = '';
  async function copyMemberId() {
    const id = memberId();
    if (!id || id === 'N/A') return;
    try {
      await navigator.clipboard.writeText(id);
      copyMsg = $language === 'ar' ? 'تم النسخ' : 'Copied';
      setTimeout(() => (copyMsg = ''), 1500);
    } catch {
      copyMsg = $language === 'ar' ? 'تعذر النسخ' : 'Copy failed';
      setTimeout(() => (copyMsg = ''), 1500);
    }
  }

  // Generate content on mount
  onMount(() => {
    loadCustomerData();
  });
</script>

<!-- PAGE -->
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8 font-sans text-gray-800" class:rtl={$language === 'ar'}>
  <div class="max-w-md sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p class="text-red-600">{error}</p>
        <button 
          on:click={loadCustomerData} 
          class="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          { $language === 'ar' ? 'حاول مرة أخرى' : 'Try Again' }
        </button>
      </div>
    {:else if customerData}
      <!-- Premium Loyalty Card -->
      <div class="relative mb-6 sm:mb-8 lg:mb-12">
        <div 
          class="w-full h-64 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem] rounded-3xl shadow-2xl relative overflow-hidden transform hover:scale-[1.02] transition-all duration-500"
          style="background: linear-gradient(135deg, {cardGradient.from}, {cardColor}, {cardGradient.to})"
        >
          <!-- Corner & Shine Effects -->
          <div class="absolute top-0 left-0 w-16 h-16">
            <div class="absolute inset-0 rounded-tl-3xl bg-gradient-to-br from-white/30 to-transparent"></div>
            <div class="absolute top-1 left-1 w-4 h-4 rounded-tl-2xl bg-white/20 shadow-inner"></div>
          </div>
          <div class="absolute top-0 right-0 w-16 h-16">
            <div class="absolute inset-0 rounded-tr-3xl bg-gradient-to-bl from-white/30 to-transparent"></div>
            <div class="absolute top-1 right-1 w-4 h-4 rounded-tr-2xl bg-white/20 shadow-inner"></div>
          </div>
          <div class="absolute bottom-0 left-0 w-16 h-16">
            <div class="absolute inset-0 rounded-bl-3xl bg-gradient-to-tr from-white/20 to-transparent"></div>
            <div class="absolute bottom-1 left-1 w-4 h-4 rounded-bl-2xl bg-white/15 shadow-inner"></div>
          </div>
          <div class="absolute bottom-0 right-0 w-16 h-16">
            <div class="absolute inset-0 rounded-br-3xl bg-gradient-to-tl from-white/20 to-transparent"></div>
            <div class="absolute bottom-1 right-1 w-4 h-4 rounded-br-2xl bg-white/15 shadow-inner"></div>
          </div>

          <!-- Animated Glow -->
          <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse"></div>
          <!-- Geometric Background -->
          <div class="absolute top-4 right-8 w-16 h-16 bg-white/5 rounded-full blur-sm"></div>
          <div class="absolute bottom-6 left-8 w-12 h-12 bg-white/10 rounded-full"></div>
          <div class="absolute top-1/3 right-1/4 w-8 h-8 bg-white/5 rounded-full blur-xl"></div>
          <div class="absolute top-2/3 left-1/4 w-6 h-6 bg-white/10 rounded-full"></div>

          <!-- Flowing Lines -->
          <svg class="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300" fill="none">
            <path d="M0,150 Q100,50 200,150 T400,150" stroke="white" stroke-width="2" fill="none"/>
            <path d="M0,200 Q150,100 300,200 T600,200" stroke="white" stroke-width="1.5" fill="none"/>
            <path d="M-100,100 Q50,0 200,100 T500,100" stroke="white" stroke-width="1" fill="none"/>
          </svg>

          <!-- Card Content -->
          <div class="relative h-full p-3 sm:p-6 md:p-8 lg:p-10 xl:p-12 flex flex-col" 
               class:text-white={textTheme === 'light'} 
               class:text-gray-900={textTheme === 'dark'}
               style={textTheme === 'gold' ? 'color: #1A1A1A;' : ''}>
            <!-- Top Row -->
            <div class="flex justify-between items-start mb-4">
              <!-- Logo -->
              <div class="flex-shrink-0">
                <div class="bg-white/95 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 shadow-lg flex items-center justify-center w-20 sm:w-24 md:w-28 lg:w-32">
                  <img src="/logo.png" alt="Brand Logo" class="h-8 sm:h-10 md:h-12 lg:h-14 w-auto" />
                </div>
              </div>
              <!-- Card Type -->
              <div class="flex-shrink-0">
                <div class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-3 sm:px-4 md:px-5 py-1 sm:py-2 rounded-full text-xs sm:text-sm md:text-base font-bold shadow-lg">
                  {$language === 'ar' ? 
                    (cardTypeData?.name === 'gold' ? 'ذهبي' : 
                     cardTypeData?.name === 'silver' ? 'فضي' : 
                     cardTypeData?.name === 'bronze' ? 'برونزي' : 
                     cardTypeData?.name === 'platinum' ? 'بلاتيني' :
                     cardTypeData?.name === 'diamond' ? 'ماسي' : 'برونزي') :
                    (cardTypeData?.name?.toUpperCase() || 'BRONZE')
                  }
                </div>
              </div>
            </div>

            <!-- Member Number (Responsive, no logic/color changes) -->
            <div class="mb-6">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <!-- Left: icon + number -->
                <div class="flex items-center gap-2 justify-center sm:justify-start">
                  <div class="w-8 sm:w-10 md:w-12 lg:w-14 h-6 sm:h-7 md:h-8 lg:h-10 rounded-md flex items-center justify-center" 
                       class:bg-white={textTheme === 'light'} 
                       class:opacity-20={textTheme === 'light'}
                       class:bg-gray-800={textTheme === 'dark'}
                       style={textTheme === 'gold' ? 'background: rgba(26,26,26,0.15);' : (textTheme === 'dark' ? 'background: rgba(31, 41, 55, 0.2);' : '')}>
                    <svg class="w-4 sm:w-5 md:w-6 lg:w-7 h-4 sm:h-5 md:h-6 lg:h-7" 
                         class:text-white={textTheme === 'light'} 
                         class:text-gray-800={textTheme === 'dark'}
                         style={textTheme === 'gold' ? 'color: #1A0F08;' : ''} 
                         fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                      <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <span class="text-sm sm:text-lg md:text-xl lg:text-2xl font-mono tracking-wider font-semibold break-all sm:break-normal" 
                        class:text-gray-100={textTheme === 'light'} 
                        class:text-gray-800={textTheme === 'dark'}
                        style={textTheme === 'gold' ? 'color: #1A0F08; text-shadow: 1px 1px 2px rgba(255,255,255,0.3);' : ''}>
                    {customerData?.customer_cards?.[0]?.card_number || customerData?.customer_code || 'N/A'}
                  </span>
                </div>

                <!-- Right: Copy -->
                <div class="flex justify-center sm:justify-end gap-2">
                  <button
                    on:click={copyMemberId}
                    class="px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white shadow text-xs sm:text-sm font-medium"
                  >
                    {$language === 'ar' ? 'نسخ' : 'Copy'}
                  </button>
                </div>
              </div>
              {#if copyMsg}
                <div class="mt-1 text-center sm:text-right text-xs opacity-80">{copyMsg}</div>
              {/if}

              <!-- Cardholder Info -->
              <div class="mt-3 sm:mt-4 md:mt-6 space-y-1 md:space-y-2">
                <div class="text-xs md:text-sm uppercase tracking-wider font-medium" 
                     class:text-gray-300={textTheme === 'light'} 
                     class:text-gray-600={textTheme === 'dark'}
                     style={textTheme === 'gold' ? 'color: #2D1810; font-weight: 600;' : ''}>{$t.cardHolder || 'Cardholder'}</div>
                <div class="font-bold text-sm sm:text-lg md:text-xl lg:text-2xl drop-shadow-md" 
                     class:text-white={textTheme === 'light'} 
                     class:text-gray-900={textTheme === 'dark'}
                     style={textTheme === 'gold' ? 'color: #1A0F08; text-shadow: 1px 1px 2px rgba(255,255,255,0.3);' : ''}>{customerData?.full_name?.toUpperCase() || 'N/A'}</div>
              </div>
            </div>

            <!-- Middle Section - Chip -->
            <div class="flex justify-center items-center mb-6">
              <div class="w-full flex justify-end pr-4 sm:pr-6 md:pr-8">
                <div class="flex items-center justify-center w-12 sm:w-16 md:w-20 lg:w-24 h-10 sm:h-12 md:h-16 lg:h-20 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 rounded-lg shadow-lg border-2 border-yellow-600 relative transform hover:scale-105 transition-transform duration-200">
                  <div class="grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-2 w-8 sm:w-10 md:w-12 lg:w-14 h-6 sm:h-8 md:h-10 lg:h-12">
                    <div class="bg-yellow-800 rounded-sm opacity-90"></div>
                    <div class="bg-yellow-800 rounded-sm opacity-90"></div>
                    <div class="bg-yellow-800 rounded-sm opacity-90"></div>
                    <div class="bg-yellow-800 rounded-sm opacity-90"></div>
                    <div class="bg-yellow-800 rounded-sm opacity-90"></div>
                    <div class="bg-yellow-800 rounded-sm opacity-90"></div>
                    <div class="bg-yellow-800 rounded-sm opacity-90"></div>
                    <div class="bg-yellow-800 rounded-sm opacity-90"></div>
                    <div class="bg-yellow-800 rounded-sm opacity-90"></div>
                  </div>
                  <div class="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent rounded-lg"></div>
                  <div class="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full blur-sm"></div>
                </div>
              </div>
            </div>

            <!-- Bottom Row - Member Info -->
            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-auto pt-4">
              <div class="space-y-1 md:space-y-2">
                <div class="flex items-center gap-2">
                  <svg class="w-4 md:w-5 lg:w-6 h-4 md:h-5 lg:h-6 drop-shadow-sm" 
                       class:text-white={textTheme === 'light'} 
                       class:text-gray-800={textTheme === 'dark'}
                       style={textTheme === 'gold' ? 'color: #1A0F08;' : ''} 
                       fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span class="text-sm md:text-base lg:text-lg font-semibold drop-shadow-sm" 
                        class:text-white={textTheme === 'light'} 
                        class:text-gray-900={textTheme === 'dark'}
                        style={textTheme === 'gold' ? 'color: #1A0F08; text-shadow: 1px 1px 2px rgba(255,255,255,0.4);' : ''}>{$t.premiumMember || 'Premium Member'}</span>
                </div>
                <div class="mt-2">
                  <div class="text-xs md:text-sm lg:text-base uppercase tracking-wider font-medium" 
                       class:text-gray-300={textTheme === 'light'} 
                       class:text-gray-600={textTheme === 'dark'}
                       style={textTheme === 'gold' ? 'color: #2D1810; font-weight: 600;' : ''}>{$t.memberSince || 'Member Since'}</div>
                  <div class="font-semibold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl" 
                       class:text-gray-100={textTheme === 'light'} 
                       class:text-gray-800={textTheme === 'dark'}
                       style={textTheme === 'gold' ? 'color: #1A0F08; text-shadow: 1px 1px 2px rgba(255,255,255,0.3);' : ''}>
                    {formatDate(customerData?.registration_date || customerData?.joined_at || customerData?.created_at)}
                  </div>
                </div>
              </div>

              <div class="text-right space-y-1 md:space-y-2">
                <div class="text-xs md:text-sm lg:text-base uppercase tracking-wider font-medium" 
                     class:text-gray-300={textTheme === 'light'} 
                     class:text-gray-600={textTheme === 'dark'}
                     style={textTheme === 'gold' ? 'color: #2D1810; font-weight: 600;' : ''}>{$t.validUntil || 'Valid Until'}</div>
                <div class="font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl drop-shadow-sm" 
                     class:text-white={textTheme === 'light'} 
                     class:text-gray-900={textTheme === 'dark'}
                     style={textTheme === 'gold' ? 'color: #1A0F08; text-shadow: 1px 1px 2px rgba(255,255,255,0.3);' : ''}>
                  {formatDate(customerData?.valid_until || customerData?.card_expiry_date) || generateDefaultExpiryDate()}
                </div>
              </div>
            </div>
          </div>

          <!-- Holographic overlay effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent to-transparent transform -skew-x-12 translate-x-full animate-pulse" 
               style="background: linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent);"></div>
        </div>
      </div>

      <!-- How to Use -->
      <div class="backdrop-blur-sm p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 rounded-2xl shadow-xl border" 
           style="background: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.2);">
        <div class="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div class="w-6 sm:w-8 md:w-10 lg:w-12 xl:w-14 h-6 sm:h-8 md:h-10 lg:h-12 xl:h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg class="w-3 sm:w-4 md:w-5 lg:w-6 xl:w-7 h-3 sm:h-4 md:h-5 lg:h-6 xl:h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h3 class="font-bold text-gray-800 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl" class:text-right={$language === 'ar'}>{$t.howToUse || 'How to use:'}</h3>
        </div>
        
        <div class="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
          <div class="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100" class:flex-row-reverse={$language === 'ar'}>
            <div class="w-8 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-8 sm:h-12 md:h-14 lg:h-16 xl:h-20 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">1</div>
            <div class="flex-1">
              <p class="font-semibold text-gray-800 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">{$language === 'ar' ? 'استخدم البطاقة الافتراضية' : 'Use Virtual Card'}</p>
              <p class="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 mt-1 md:mt-2">{$language === 'ar' ? 'اعرض البطاقة للكاشير عند الدفع' : 'Show this card to cashier during checkout'}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100" class:flex-row-reverse={$language === 'ar'}>
            <div class="w-8 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-8 sm:h-12 md:h-14 lg:h-16 xl:h-20 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">2</div>
            <div class="flex-1">
              <p class="font-semibold text-gray-800 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">{$t.earnPoints || 'Earn points on every purchase'}</p>
              <p class="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 mt-1 md:mt-2">{$language === 'ar' ? 'اجمع النقاط مع كل عملية شراء' : 'Collect points with every purchase'}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100" class:flex-row-reverse={$language === 'ar'}>
            <div class="w-8 sm:w-12 md:w-14 lg:w-16 xl:w-20 h-8 sm:h-12 md:h-14 lg:h-16 xl:h-20 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">3</div>
            <div class="flex-1">
              <p class="font-semibold text-gray-800 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">{$t.redeemPoints || 'Redeem points for rewards'}</p>
              <p class="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 mt-1 md:mt-2">{$language === 'ar' ? 'استبدل النقاط بالمكافآت الحصرية' : 'Exchange points for exclusive rewards'}</p>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .rtl {
    direction: rtl;
    font-family: 'Cairo', sans-serif;
  }

  /* Improve RTL spacing without changing your colors or logic */
  .rtl .flex {
    gap: 0.75rem;
  }
</style>
