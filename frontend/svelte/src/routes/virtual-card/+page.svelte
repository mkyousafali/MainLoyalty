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
  
  // NFC Variables
  let nfcSupported = false;
  let nfcEnabled = false;
  let nfcWriting = false;
  let nfcStatus = '';
  let nfcMessage = '';
  
  // Check NFC Support
  function checkNFCSupport() {
    if ('NDEFReader' in window) {
      nfcSupported = true;
      nfcStatus = $language === 'ar' ? 'NFC مدعوم' : 'NFC Supported';
      console.log('✅ NFC is supported');
    } else {
      nfcSupported = false;
      nfcStatus = $language === 'ar' ? 'NFC غير مدعوم' : 'NFC Not Supported';
      console.log('❌ NFC is not supported');
    }
  }

  // Enable NFC Writing
  async function enableNFC() {
    if (!nfcSupported) {
      nfcMessage = $language === 'ar' ? 'NFC غير مدعوم على هذا الجهاز' : 'NFC not supported on this device';
      return;
    }

    try {
      const ndef = new (window as any).NDEFReader();
      
      // Request permission
      await ndef.scan();
      nfcEnabled = true;
      nfcStatus = $language === 'ar' ? 'NFC جاهز للكتابة' : 'NFC Ready to Write';
      nfcMessage = $language === 'ar' ? 'ضع بطاقة NFC بالقرب من الجهاز للكتابة' : 'Hold NFC card near device to write';
      
      console.log('✅ NFC enabled successfully');
    } catch (error) {
      console.error('❌ NFC enable error:', error);
      nfcMessage = $language === 'ar' ? 'فشل في تمكين NFC. تحقق من إعدادات الجهاز' : 'Failed to enable NFC. Check device settings';
      nfcEnabled = false;
    }
  }

  // Write customer data to NFC card
  async function writeToNFC() {
    if (!nfcEnabled || !customerData) {
      nfcMessage = $language === 'ar' ? 'يجب تمكين NFC أولاً' : 'NFC must be enabled first';
      return;
    }

    try {
      nfcWriting = true;
      nfcStatus = $language === 'ar' ? 'جاري الكتابة...' : 'Writing...';
      
      const ndef = new (window as any).NDEFReader();
      
      // Prepare customer data for NFC
      const customerInfo = {
        id: customerData.customer_code || customerData.mobile,
        name: customerData.full_name,
        cardType: cardTypeData?.name || 'bronze',
        cardNumber: customerData.customer_cards?.[0]?.card_number || customerData.customer_code
      };
      
      // Write to NFC card
      await ndef.write({
        records: [
          {
            recordType: "text",
            data: JSON.stringify(customerInfo)
          },
          {
            recordType: "url", 
            data: `${window.location.origin}/loyalty/${customerData.customer_code}`
          }
        ]
      });
      
      nfcStatus = $language === 'ar' ? 'تم الكتابة بنجاح!' : 'Successfully Written!';
      nfcMessage = $language === 'ar' ? 'تم حفظ بيانات العضوية على بطاقة NFC' : 'Membership data saved to NFC card';
      
      setTimeout(() => {
        nfcStatus = $language === 'ar' ? 'NFC جاهز للكتابة' : 'NFC Ready to Write';
        nfcMessage = $language === 'ar' ? 'يمكنك كتابة بطاقة أخرى' : 'You can write another card';
      }, 3000);
      
    } catch (error) {
      console.error('❌ NFC write error:', error);
      nfcStatus = $language === 'ar' ? 'فشل في الكتابة' : 'Write Failed';
      nfcMessage = $language === 'ar' ? 'تأكد من وضع البطاقة بالقرب من الجهاز' : 'Make sure card is close to device';
    } finally {
      nfcWriting = false;
    }
  }

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

  // Generate QR Code
  onMount(() => {
    loadCustomerData();
    checkNFCSupport();
  });
</script>



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
          Try Again
        </button>
      </div>
    {:else if customerData}
      <!-- Premium Loyalty Card with Enhanced QR Background -->
    <div class="relative mb-6 sm:mb-8 lg:mb-12">
      <div 
        class="w-full h-64 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem] rounded-3xl shadow-2xl relative overflow-hidden transform hover:scale-[1.02] transition-all duration-500"
        style="background: linear-gradient(135deg, {cardGradient.from}, {cardColor}, {cardGradient.to})"
      >
        <!-- 3D Corner Effects -->
        <!-- Top Left Corner -->
        <div class="absolute top-0 left-0 w-16 h-16">
          <div class="absolute inset-0 rounded-tl-3xl bg-gradient-to-br from-white/30 to-transparent"></div>
          <div class="absolute top-1 left-1 w-4 h-4 rounded-tl-2xl bg-white/20 shadow-inner"></div>
        </div>
        
        <!-- Top Right Corner -->
        <div class="absolute top-0 right-0 w-16 h-16">
          <div class="absolute inset-0 rounded-tr-3xl bg-gradient-to-bl from-white/30 to-transparent"></div>
          <div class="absolute top-1 right-1 w-4 h-4 rounded-tr-2xl bg-white/20 shadow-inner"></div>
        </div>
        
        <!-- Bottom Left Corner -->
        <div class="absolute bottom-0 left-0 w-16 h-16">
          <div class="absolute inset-0 rounded-bl-3xl bg-gradient-to-tr from-white/20 to-transparent"></div>
          <div class="absolute bottom-1 left-1 w-4 h-4 rounded-bl-2xl bg-white/15 shadow-inner"></div>
        </div>
        
        <!-- Bottom Right Corner -->
        <div class="absolute bottom-0 right-0 w-16 h-16">
          <div class="absolute inset-0 rounded-br-3xl bg-gradient-to-tl from-white/20 to-transparent"></div>
          <div class="absolute bottom-1 right-1 w-4 h-4 rounded-br-2xl bg-white/15 shadow-inner"></div>
        </div>
        <!-- Animated Background Pattern -->
        <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse"></div>
        
        <!-- Geometric Background Elements -->
        <div class="absolute top-4 right-8 w-16 h-16 bg-white/5 rounded-full blur-sm"></div>
        <div class="absolute bottom-6 left-8 w-12 h-12 bg-white/10 rounded-full"></div>
        <div class="absolute top-1/3 right-1/4 w-8 h-8 bg-white/5 rounded-full blur-xl"></div>
        <div class="absolute top-2/3 left-1/4 w-6 h-6 bg-white/10 rounded-full"></div>
        
        <!-- Flowing Lines Background -->
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
          <div class="flex justify-between items-start">
            <div class="flex flex-col space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
              <!-- White container for logo -->
              <div class="bg-white/90 backdrop-blur-sm rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 shadow-lg flex items-center justify-between">
                <img src="/logo.png" alt="Brand Logo" class="h-10 sm:h-16 md:h-20 lg:h-24 xl:h-28 w-auto" />
                <!-- Chip icon on right side -->
                <div class="ml-2 sm:ml-4 md:ml-6 lg:ml-8 flex items-center justify-center w-8 sm:w-12 md:w-14 lg:w-16 h-6 sm:h-8 md:h-10 lg:h-12 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-md shadow-inner border border-yellow-600 relative">
                  <!-- Chip contact lines -->
                  <div class="grid grid-cols-3 gap-0.5 sm:gap-1 md:gap-1.5 w-5 sm:w-8 md:w-10 lg:w-12 h-4 sm:h-6 md:h-7 lg:h-8">
                    <div class="bg-yellow-800 rounded-sm"></div>
                    <div class="bg-yellow-800 rounded-sm"></div>
                    <div class="bg-yellow-800 rounded-sm"></div>
                    <div class="bg-yellow-800 rounded-sm"></div>
                    <div class="bg-yellow-800 rounded-sm"></div>
                    <div class="bg-yellow-800 rounded-sm"></div>
                  </div>
                  <!-- Chip shine effect -->
                  <div class="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-md"></div>
                </div>
              </div>
              <!-- Card Number with Icon - directly under logo -->
              <div class="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
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
                <span class="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-mono tracking-wider font-semibold" 
                      class:text-gray-100={textTheme === 'light'} 
                      class:text-gray-800={textTheme === 'dark'}
                      style={textTheme === 'gold' ? 'color: #1A0F08; text-shadow: 1px 1px 2px rgba(255,255,255,0.3);' : ''}>{customerData?.customer_cards?.[0]?.card_number || customerData?.customer_code || 'N/A'}</span>
              </div>
              <!-- Cardholder Info - directly under card number -->
              <div class="space-y-1 md:space-y-2">
                <div class="text-xs md:text-sm lg:text-base uppercase tracking-wider font-medium" 
                     class:text-gray-300={textTheme === 'light'} 
                     class:text-gray-600={textTheme === 'dark'}
                     style={textTheme === 'gold' ? 'color: #2D1810; font-weight: 600;' : ''}>{$t.cardHolder || 'Cardholder'}</div>
                <div class="font-bold text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl drop-shadow-md" 
                     class:text-white={textTheme === 'light'} 
                     class:text-gray-900={textTheme === 'dark'}
                     style={textTheme === 'gold' ? 'color: #1A0F08; text-shadow: 1px 1px 2px rgba(255,255,255,0.3);' : ''}>{customerData?.full_name?.toUpperCase() || 'N/A'}</div>
              </div>
            </div>
            <div class="flex flex-col items-end space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5">
              <!-- Card Type Badge -->
              <div class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-2 sm:px-4 md:px-5 lg:px-6 py-1 sm:py-2 md:py-2.5 lg:py-3 rounded-full text-xs sm:text-sm md:text-base lg:text-lg font-bold shadow-lg">
                {$language === 'ar' ? 
                  (cardTypeData?.name === 'gold' ? 'ذهبي' : 
                   cardTypeData?.name === 'silver' ? 'فضي' : 
                   cardTypeData?.name === 'bronze' ? 'برونزي' : 
                   cardTypeData?.name === 'platinum' ? 'بلاتيني' :
                   cardTypeData?.name === 'diamond' ? 'ماسي' : 'برونزي') :
                  (cardTypeData?.name?.toUpperCase() || 'BRONZE')
                }
              </div>
              <!-- NFC Section moved here -->
              <div class="relative">
                <!-- NFC Background with Glassmorphism -->
                <div class="relative backdrop-blur-sm p-2 sm:p-3 md:p-4 lg:p-5 rounded-2xl shadow-2xl border"
                     style={textTheme === 'gold' ? 'background: rgba(255,255,255,0.95); border-color: #999999;' : 'background: rgba(255,255,255,0.95); border-color: rgba(255,255,255,0.2);'}>
                  
                  <!-- Decorative corners -->
                  <div class="absolute top-1 left-1 w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 border-l-2 border-t-2 rounded-tl" style="border-color: {cardColor}"></div>
                  <div class="absolute top-1 right-1 w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 border-r-2 border-t-2 rounded-tr" style="border-color: {cardColor}"></div>
                  <div class="absolute bottom-1 left-1 w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 border-l-2 border-b-2 rounded-bl" style="border-color: {cardColor}"></div>
                  <div class="absolute bottom-1 right-1 w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 border-r-2 border-b-2 rounded-br" style="border-color: {cardColor}"></div>
                  
                  <!-- NFC Content -->
                  <div class="flex flex-col items-center space-y-2 sm:space-y-3 w-16 sm:w-24 md:w-28 lg:w-32 xl:w-36 h-16 sm:h-24 md:h-28 lg:h-32 xl:h-36">
                    <!-- NFC Icon -->
                    <div class="flex-1 flex items-center justify-center">
                      <svg class="w-8 sm:w-12 md:w-14 lg:w-16 xl:w-18 h-8 sm:h-12 md:h-14 lg:h-16 xl:h-18" 
                           style="color: {cardColor}" 
                           fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20,2H4A2,2 0 0,0 2,4V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V4A2,2 0 0,0 20,2M20,20H4V4H20V20M18,6H16.5V7.5H15V9H16.5V10.5H18V9H19.5V7.5H18V6M12.5,6H11V7.5H9.5V9H11V10.5H12.5V9H14V7.5H12.5V6M7,6H5.5V7.5H4V9H5.5V10.5H7V9H8.5V7.5H7V6M18,12H16.5V13.5H15V15H16.5V16.5H18V15H19.5V13.5H18V12M12.5,12H11V13.5H9.5V15H11V16.5H12.5V15H14V13.5H12.5V12M7,12H5.5V13.5H4V15H5.5V16.5H7V15H8.5V13.5H7V12Z"/>
                      </svg>
                    </div>
                    
                    <!-- Status Text -->
                    <div class="text-center">
                      <div class="text-xs sm:text-xs md:text-sm font-bold text-gray-800">
                        {nfcSupported ? 'NFC' : 'NO NFC'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Glow effect around NFC -->
                <div class="absolute inset-0 rounded-2xl blur-xl -z-10"
                     class:bg-gradient-to-r={!nfcEnabled}
                     class:from-blue-400={!nfcEnabled}
                     class:to-purple-400={!nfcEnabled}
                     style="background: {nfcEnabled ? 'linear-gradient(to right, rgb(34 197 94 / 0.3), rgb(16 185 129 / 0.3))' : 'linear-gradient(to right, rgb(96 165 250 / 0.2), rgb(168 85 247 / 0.2))'}"></div>
              </div>
            </div>
          </div>

          <!-- Middle Section - Empty space for better card proportions -->
          <div class="flex-grow"></div>

          <!-- Bottom Row - Member Info -->
          <div class="flex justify-between items-end">
            <div class="space-y-1 md:space-y-2">
              <div class="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                <svg class="w-3 sm:w-4 md:w-5 lg:w-6 h-3 sm:h-4 md:h-5 lg:h-6 drop-shadow-sm" 
                     class:text-white={textTheme === 'light'} 
                     class:text-gray-800={textTheme === 'dark'}
                     style={textTheme === 'gold' ? 'color: #1A0F08;' : ''} 
                     fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="text-xs sm:text-sm md:text-base lg:text-lg font-semibold drop-shadow-sm" 
                      class:text-white={textTheme === 'light'} 
                      class:text-gray-900={textTheme === 'dark'}
                      style={textTheme === 'gold' ? 'color: #1A0F08; text-shadow: 1px 1px 2px rgba(255,255,255,0.4);' : ''}>{$t.premiumMember || 'Premium Member'}</span>
              </div>
              <div>
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

    <!-- Enhanced How to Use Section -->
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
            <p class="font-semibold text-gray-800 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">{$language === 'ar' ? 'اقترب من قارئ NFC' : 'Tap card on NFC reader'}</p>
            <p class="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 mt-1 md:mt-2">{$language === 'ar' ? 'ضع البطاقة على قارئ NFC عند الدفع' : 'Hold your NFC card near the reader at checkout'}</p>
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
      
      <!-- NFC Control Section -->
      {#if customerData}
        <div class="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20,2H4A2,2 0 0,0 2,4V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V4A2,2 0 0,0 20,2M20,20H4V4H20V20M18,6H16.5V7.5H15V9H16.5V10.5H18V9H19.5V7.5H18V6M12.5,6H11V7.5H9.5V9H11V10.5H12.5V9H14V7.5H12.5V6M7,6H5.5V7.5H4V9H5.5V10.5H7V9H8.5V7.5H7V6M18,12H16.5V13.5H15V15H16.5V16.5H18V15H19.5V13.5H18V12M12.5,12H11V13.5H9.5V15H11V16.5H12.5V15H14V13.5H12.5V12M7,12H5.5V13.5H4V15H5.5V16.5H7V15H8.5V13.5H7V12Z"/>
              </svg>
            </div>
            <h4 class="font-bold text-gray-800 text-lg">{$language === 'ar' ? 'إعداد بطاقة NFC' : 'NFC Card Setup'}</h4>
          </div>
          
          <div class="space-y-4">
            <div class="text-sm text-gray-600">
              <p class="font-semibold mb-2">{$language === 'ar' ? 'الحالة:' : 'Status:'} <span class="text-indigo-600">{nfcStatus}</span></p>
              {#if nfcMessage}
                <p class="text-gray-500 italic">{nfcMessage}</p>
              {/if}
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3">
              {#if !nfcSupported}
                <div class="flex-1 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p class="text-red-600 text-sm font-medium">{$language === 'ar' ? 'NFC غير مدعوم على هذا الجهاز' : 'NFC not supported on this device'}</p>
                </div>
              {:else if !nfcEnabled}
                <button
                  on:click={enableNFC}
                  class="flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 shadow-lg"
                >
                  {$language === 'ar' ? 'تمكين NFC' : 'Enable NFC'}
                </button>
              {:else}
                <button
                  on:click={writeToNFC}
                  disabled={nfcWriting}
                  class="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {#if nfcWriting}
                    <span class="flex items-center justify-center gap-2">
                      <svg class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      {$language === 'ar' ? 'جاري الكتابة...' : 'Writing...'}
                    </span>
                  {:else}
                    {$language === 'ar' ? 'كتابة بيانات العضوية' : 'Write Membership Data'}
                  {/if}
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
    {/if}
  </div>
</div>

<style>
  .rtl {
    direction: rtl;
    font-family: 'Cairo', sans-serif;
  }
  
  /* Fix spacing for RTL */
  .rtl .flex {
    gap: 0.75rem;
  }
</style>
