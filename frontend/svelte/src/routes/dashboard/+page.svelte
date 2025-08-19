<script lang="ts">
  import { onMount } from 'svelte';
  import { getCardTypeGradient } from '$lib/stores/cardTypes';
  import { supabase } from '$lib/supabase';
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { language, t, toggleLanguage } from '$lib/stores/language';
  import { formatCurrency, formatCurrencyText } from '$lib/formatCurrency';
  import QRCode from 'qrcode';
  import JsBarcode from 'jsbarcode';

  let selectedBranch = 'all';
  let customerData: any = null;
  let cardTypeData: any = null;
  let branches: any[] = [];
  let transactions: any[] = [];
  let allTransactions: any[] = []; // Store all transactions for filtering
  let isLoading = true;
  let error = '';

  // Reactive translations based on current language
  $: currentTranslations = $language === 'ar' ? {
    redemptionConditions: 'شروط استرداد النقاط',
    redemptionRules: 'قواعد مهمة لاستخدام نقاطك', 
    allowedRedemptions: 'قيم الاسترداد المسموحة',
    points: 'النقاط',
    importantRules: 'قواعد مهمة',
    noCustomValues: 'لا توجد قيم مخصصة مسموحة',
    noCustomValuesDesc: 'يمكن استرداد النقاط فقط بالمبالغ المحددة: 50، 100، 150، أو 200 نقطة.',
    noCashExchange: 'لا يمكن تحويلها لنقد',
    noCashExchangeDesc: 'لا يمكن تحويل النقاط إلى نقد. يمكن استخدامها فقط للحصول على خصومات على المشتريات.',
    storeUseOnly: 'للاستخدام في المتجر فقط',
    storeUseOnlyDesc: 'يمكن استخدام النقاط للحصول على خصومات على المشتريات المستقبلية في متاجر أوربان ماركت.',
    branchSpecificRedemption: 'استرداد خاص بالفرع',
    branchSpecificRedemptionDesc: 'يمكن استرداد النقاط فقط إذا كان لدى الفرع المحدد نقاط كافية متاحة. لا يمكنك دمج النقاط من فروع مختلفة للاسترداد.',
    readyToRedeem: 'مستعد لاسترداد نقاطك؟',
    contactStoreStaff: 'تواصل مع موظفي المتجر خلال زيارتك القادمة أو تواصل مع دعم العملاء للمساعدة في استرداد النقاط.',
    contactSupport: 'تواصل مع الدعم'
  } : {
    redemptionConditions: 'Point Redemption Conditions',
    redemptionRules: 'Important rules for using your points',
    allowedRedemptions: 'Allowed Redemption Values',
    points: 'Points',
    importantRules: 'Important Rules',
    noCustomValues: 'No Custom Values Allowed',
    noCustomValuesDesc: 'Points can only be redeemed in the specified amounts: 50, 100, 150, or 200 points.',
    noCashExchange: 'No Cash Exchange',
    noCashExchangeDesc: 'Points cannot be converted to cash. They can only be used for discounts on purchases.',
    storeUseOnly: 'Store Use Only',
    storeUseOnlyDesc: 'Points can be used for discounts on future purchases at Urban Market stores.',
    branchSpecificRedemption: 'Branch-Specific Redemption',
    branchSpecificRedemptionDesc: 'Points can only be redeemed if the specific branch has enough points available. You cannot combine points from different branches for redemption.',
    readyToRedeem: 'Ready to redeem your points?',
    contactStoreStaff: 'Contact store staff during your next visit or reach out to customer support for assistance with point redemption.',
    contactSupport: 'Contact Support'
  };

  // QR/Barcode Toggle Variables
  let showQRCode = true; // true for QR, false for barcode
  let qrCanvas: HTMLCanvasElement;
  let barcodeCanvas: HTMLCanvasElement;

  // Branch filtering reactive variables
  $: filteredTransactions = selectedBranch === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.branch_id?.toString() === selectedBranch.toString());
    
  // Current balance - changes based on branch selection  
  $: currentBalance = (() => {
    if (isLoading || !customerData) return 0;
    
    if (selectedBranch === 'all') {
      return calculateCurrentBalance();
    } else {
      return calculateBranchPoints(selectedBranch);
    }
  })();
  
  // Lifetime earned - changes based on branch selection  
  $: lifetimeEarned = (() => {
    if (isLoading || !customerData) return 0;
    
    if (selectedBranch === 'all') {
      return calculateTotalLifetimeEarned();
    } else {
      return calculateBranchLifetimeEarned(selectedBranch);
    }
  })();
  
  // Debug reactive variables - Enhanced logging
  $: if (customerData) {
    console.log('🔄 Enhanced Reactive Update:', {
      selectedBranch,
      currentBalance,
      lifetimeEarned,
      allTransactionsLength: allTransactions?.length || 0,
      customerTotalPoints: customerData.total_points,
      customerLifetimeEarned: customerData.lifetime_earned,
      hasAllTransactions: !!allTransactions,
      hasCustomerData: !!customerData,
      isLoading
    });
  }

  // Calculate points for specific branch
  function calculateBranchPoints(branchId: string): number {
    if (!allTransactions || branchId === 'all') return calculateCurrentBalance();
    
    // Handle both numeric and UUID branch IDs
    const branchTransactions = allTransactions.filter(tx => {
      if (!tx.branch_id) return false;
      return tx.branch_id?.toString() === branchId.toString();
    });
    
    const branchAddAmt = branchTransactions.reduce((total, tx) => total + (parseFloat(tx.add_amt) || 0), 0);
    const branchRedeem = branchTransactions.reduce((total, tx) => total + (parseFloat(tx.redeem) || 0), 0);
    
    return parseFloat((branchAddAmt - branchRedeem).toFixed(2));
  }

  // Calculate lifetime earned for specific branch
  function calculateBranchLifetimeEarned(branchId: string): number {
    if (!allTransactions || branchId === 'all') return calculateTotalLifetimeEarned();
    
    // Handle both numeric and UUID branch IDs
    const branchTransactions = allTransactions.filter(tx => {
      if (!tx.branch_id) return false;
      return tx.branch_id?.toString() === branchId.toString();
    });
    
    const branchLifetimeEarned = branchTransactions.reduce((total, tx) => total + (parseFloat(tx.add_amt) || 0), 0);
    
    return parseFloat(branchLifetimeEarned.toFixed(2));
  }

  // Calculate total lifetime earned from all transactions
  function calculateTotalLifetimeEarned(): number {
    console.log('🎯 calculateTotalLifetimeEarned called:', {
      hasAllTransactions: !!allTransactions,
      allTransactionsLength: allTransactions?.length || 0,
      hasCustomerData: !!customerData,
      customerLifetimeEarned: customerData?.lifetime_earned,
      isLoading
    });

    // If no transactions loaded yet, return customer stored lifetime earned
    if (!allTransactions || allTransactions.length === 0) {
      const fallbackLifetime = customerData?.lifetime_earned || 0;
      console.log('🎯 Using fallback lifetime earned:', fallbackLifetime);
      return fallbackLifetime;
    }
    
    // Calculate total lifetime earned = total add_amt from all transactions
    const totalLifetimeEarned = allTransactions.reduce((total, tx) => {
      return total + (parseFloat(tx.add_amt) || 0);
    }, 0);
    
    console.log('🎯 Total Lifetime Earned Calculation:', {
      totalLifetimeEarned,
      transactionsCount: allTransactions.length,
      customerLifetimeEarned: customerData?.lifetime_earned
    });
    
    return parseFloat(totalLifetimeEarned.toFixed(2));
  }
  
  // Calculate current balance from transactions (available points)
  function calculateCurrentBalance(): number {
    console.log('💰 calculateCurrentBalance called:', {
      hasAllTransactions: !!allTransactions,
      allTransactionsLength: allTransactions?.length || 0,
      hasCustomerData: !!customerData,
      customerTotalPoints: customerData?.total_points,
      isLoading
    });

    // If no transactions loaded yet, return customer stored balance
    if (!allTransactions || allTransactions.length === 0) {
      const fallbackBalance = customerData?.total_points || 0;
      console.log('💰 Using fallback balance:', fallbackBalance);
      return fallbackBalance;
    }
    
    // Calculate current balance = total add_amt - total redeem
    const totalAddAmt = allTransactions.reduce((total, tx) => {
      return total + (parseFloat(tx.add_amt) || 0);
    }, 0);
    
    const totalRedeem = allTransactions.reduce((total, tx) => {
      return total + (parseFloat(tx.redeem) || 0);
    }, 0);
    
    const currentBalance = totalAddAmt - totalRedeem;
    
    console.log('💰 Current Balance Calculation:', {
      totalAddAmt,
      totalRedeem,
      currentBalance,
      transactionsCount: allTransactions.length
    });
    
    return parseFloat(currentBalance.toFixed(2));
  }

  // Load filtered transactions based on selected branch
  async function loadFilteredTransactions() {
    if (!customerData?.customer_code) return;
    
    try {
      let query = supabase
        .from('customer_transactions')
        .select(`
          *,
          branches (
            name,
            name_ar
          )
        `)
        .or(`customer_code.eq.${customerData.customer_code},customer_mobile.eq.${customerData.customer_code}`)
        .order('bill_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply branch filter if not 'all'
      if (selectedBranch !== 'all') {
        // Handle both numeric and UUID branch IDs
        const branchIdValue = isNaN(Number(selectedBranch)) ? selectedBranch : parseInt(selectedBranch);
        query = query.eq('branch_id', branchIdValue);
      }

      const { data: transactionsData, error: transactionsError } = await query.limit(3);

      if (transactionsError) {
        console.warn('⚠️ Dashboard: Error fetching filtered transactions:', transactionsError);
      } else {
        transactions = transactionsData || [];
        console.log(`✅ Dashboard: Filtered transactions loaded for branch ${selectedBranch}:`, transactions.length, transactions);
      }
    } catch (err) {
      console.error('💥 Dashboard: Error loading filtered transactions:', err);
    }
  }

  // Watch for branch selection changes
  $: if (selectedBranch && customerData) {
    loadFilteredTransactions();
  }

  // Load customer data from database
  async function loadCustomerData() {
    try {
      isLoading = true;
      error = '';

      // Only run in browser
      if (!browser) {
        isLoading = false;
        return;
      }

      // Get current user mobile from auth store
      const currentUser = JSON.parse(localStorage.getItem('loyaltyUser') || '{}');
      console.log('🔍 Dashboard: Current user from localStorage:', currentUser);
      
      if (!currentUser.mobile) {
        error = $t.noUserFound;
        console.log('❌ Dashboard: No mobile found in localStorage');
        if (browser) {
          goto('/login');
        }
        return;
      }

      console.log('🔍 Dashboard: Fetching customer data for mobile:', currentUser.mobile);

      // Fetch customer data with card type - FIXED: use customer_code instead of mobile
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select(`
          *,
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
        console.error('❌ Dashboard: Error fetching customer:', customerError);
        error = `Failed to load customer data: ${customerError.message}`;
        return;
      }

      if (!customer) {
        console.log('❌ Dashboard: No customer found for mobile:', currentUser.mobile);
        error = $t.customerNotFound;
        return;
      }

      console.log('✅ Dashboard: Customer data loaded:', customer);
      customerData = customer;
      cardTypeData = customer.card_types;
      console.log('✅ Dashboard: Card type data:', cardTypeData);

      // Clear any previous errors since customer data loaded successfully
      error = '';

      // Load branches data
      console.log('🔍 Dashboard: Fetching branches...');
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name, name_en, name_ar')
        .order('name');

      if (branchesError) {
        console.warn('⚠️ Dashboard: Error fetching branches:', branchesError);
        branches = []; // Set empty array if branches fail to load
      } else {
        branches = branchesData || [];
        console.log('✅ Dashboard: Branches loaded:', branches.length);
      }

      // Load customer transactions (only latest 3 for dashboard, sorted by newest first)
      console.log('🔍 Dashboard: Fetching transactions for customer_code:', customer.customer_code);
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('customer_transactions')
        .select(`
          *,
          branches (
            name,
            name_ar
          )
        `)
        .or(`customer_code.eq.${customer.customer_code},customer_mobile.eq.${customer.customer_code}`)
        .order('bill_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);

      if (transactionsError) {
        console.warn('⚠️ Dashboard: Error fetching transactions:', transactionsError);
        transactions = []; // Set empty array if transactions fail to load
      } else {
        transactions = transactionsData || [];
        console.log('✅ Dashboard: Transactions loaded:', transactions.length, transactions);
      }

      // Load ALL transactions for lifetime points and branch filtering
      console.log('🔍 Dashboard: Fetching all transactions for lifetime points...');
      const { data: allTransactionsData, error: allTransactionsError } = await supabase
        .from('customer_transactions')
        .select(`
          points_earned,
          points_redeemed,
          branch_id,
          amount,
          add_amt,
          redeem,
          bill_date,
          created_at,
          customer_code,
          customer_mobile,
          bill_no
        `)
        .or(`customer_code.eq.${customer.customer_code},customer_mobile.eq.${customer.customer_code}`);

      console.log('🔍 Dashboard: Transaction query for customer:', customer.customer_code);
      console.log('🔍 Dashboard: All transactions result:', { allTransactionsData, allTransactionsError });

      if (allTransactionsError) {
        console.warn('⚠️ Dashboard: Error fetching all transactions:', allTransactionsError);
        customerData.lifetime_earned = customerData.total_points || 0; // Fallback to current points
        customerData.lifetime_points = customerData.total_points || 0; // Keep for backward compatibility
        allTransactions = [];
      } else {
        allTransactions = allTransactionsData || [];
        
        // Sum all add_amt values from transactions for lifetime earned total
        const lifetimeEarned = allTransactions.reduce((total, tx) => {
          return total + (parseFloat(tx.add_amt) || 0);
        }, 0);
        
        // Sum all points earned from transactions for lifetime points (for backward compatibility)
        const lifetimePoints = allTransactions.reduce((total, tx) => {
          return total + (tx.points_earned || 0);
        }, 0);
        
        // Sum all redeem values
        const totalRedeemed = allTransactions.reduce((total, tx) => {
          return total + (parseFloat(tx.redeem) || 0);
        }, 0);
        
        customerData.lifetime_earned = lifetimeEarned; // New field for lifetime earned amount
        customerData.lifetime_points = lifetimePoints;
        
        // Calculate current balance (add_amt - redeem)
        const calculatedCurrentBalance = lifetimeEarned - totalRedeemed;
        
        // Update current balance if customer doesn't have current points but has transactions
        if ((!customerData.total_points || customerData.total_points === 0) && calculatedCurrentBalance > 0) {
          customerData.total_points = calculatedCurrentBalance;
        }
        
        console.log('✅ Dashboard: Points Summary:', {
          lifetimeEarned: lifetimeEarned,
          lifetimePoints: lifetimePoints,
          totalRedeemed: totalRedeemed,
          calculatedBalance: calculatedCurrentBalance,
          customerStoredBalance: customerData.total_points,
          transactionCount: allTransactions.length
        });
        console.log('✅ Dashboard: All transactions:', allTransactions);
        
        // Force reactive update by reassigning allTransactions
        allTransactions = [...allTransactions];
      }

    } catch (err) {
      console.error('💥 Dashboard: Unexpected error:', err);
      error = `Unexpected error: ${err}`;
    } finally {
      isLoading = false;
      console.log('🏁 Dashboard: Loading completed. Error:', error);
    }
  }

  onMount(() => {
    loadCustomerData();
  });

  // Generate QR Code
  async function generateQRCode() {
    if (!qrCanvas || !customerData) return;
    
    try {
      const qrData = customerData.customer_code || customerData.mobile;
      console.log('🔍 Generating QR code for:', qrData);
      
      await QRCode.toCanvas(qrCanvas, qrData, {
        width: 180,
        height: 180,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  }

  // Generate Barcode
  function generateBarcode() {
    if (!barcodeCanvas || !customerData) return;
    
    try {
      const barcodeData = customerData.customer_code || customerData.mobile;
      console.log('🔍 Generating barcode for:', barcodeData);
      
      JsBarcode(barcodeCanvas, barcodeData, {
        format: "CODE128",
        width: 3,
        height: 80,
        fontSize: 16,
        textMargin: 12,
        background: "#FFFFFF",
        margin: 15
      });
    } catch (err) {
      console.error('Error generating barcode:', err);
    }
  }

  // Generate codes when customer data is loaded
  $: if (customerData && qrCanvas && showQRCode) {
    generateQRCode();
  }

  $: if (customerData && barcodeCanvas && !showQRCode) {
    generateBarcode();
  }

  // Reactive branches based on language
  $: branchOptions = [
    { id: 'all', name: $language === 'ar' ? 'جميع الفروع' : 'All Branches' },
    ...branches.map(b => ({ 
      id: b.id, 
      name: $language === 'ar' ? (b.name_ar || b.name_en || b.name || 'Unknown') : (b.name_en || b.name || b.name_ar || 'Unknown')
    }))
  ];

  // Get dynamic card colors based on customer's card type - with fallback
  $: cardGradient = (() => {
    try {
      if (cardTypeData && cardTypeData.color) {
        // Use the actual color from the database
        const baseColor = cardTypeData.color;
        return { from: baseColor, to: adjustBrightness(baseColor, -20) };
      }
      return cardTypeData ? getCardTypeGradient(cardTypeData.name) : getCardTypeGradient('Gold');
    } catch (err) {
      console.warn('Failed to get card gradient, using default:', err);
      return { from: '#FFD700', to: '#FFA500' }; // Gold gradient fallback
    }
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

  // Format date with modern, readable format
  function formatDate(dateString: string): string {
    if (!dateString) return $language === 'ar' ? 'غير متاح' : 'Not Available';
    try {
      const date = new Date(dateString);
      const months = $language === 'ar' ? 
        ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] :
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return $language === 'ar' ? `${day} ${month} ${year}` : `${day} ${month} ${year}`;
    } catch {
      return $language === 'ar' ? 'غير متاح' : 'Not Available';
    }
  }
</script>

<svelte:head>
  <title>{$t.dashboard} - Urban Market Loyalty</title>
</svelte:head>



<!-- Logo Header Section -->
<div class="text-center py-6 sm:py-8">
  <div class="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
    <div class="relative inline-block transform hover:scale-105 transition-all duration-300">
      <div class="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-lg opacity-20 animate-pulse"></div>
      <div class="relative bg-white p-4 sm:p-6 rounded-3xl shadow-2xl border border-gray-100">
        <img src="/logo.png" alt="Urban Market Logo" class="h-12 sm:h-16 w-auto mx-auto" />
      </div>
    </div>
    <div class="mt-4">
      <div class="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 sm:px-4 py-2 rounded-full border border-green-200">
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-sm font-medium text-green-700" class:text-right={$language === 'ar'}>
          {$language === 'ar' ? 'لوحة تحكم العميل' : 'Customer Dashboard'}
        </span>
      </div>
    </div>
  </div>
</div>

<!-- Dashboard Widgets -->
<main class="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto mt-4 sm:mt-6 md:mt-8" dir="{$language === 'ar' ? 'rtl' : 'ltr'}" lang="{$language}">
  
  <!-- Language Toggle Button for Testing -->
  <div class="fixed top-4 right-4 z-50">
    <button 
      on:click={toggleLanguage}
      class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg"
    >
      {$language === 'ar' ? 'EN' : 'العربية'}
    </button>
  </div>

  {#if isLoading}
    <!-- Loading State -->
    <div class="flex justify-center items-center h-32 sm:h-48 md:h-64">
      <div class="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <p class="text-red-600 text-sm sm:text-base">{error}</p>
      <button 
        on:click={loadCustomerData} 
        class="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm sm:text-base"
      >
        Try Again
      </button>
    </div>
  {:else if customerData}
    <!-- QR/Barcode Toggle Card - New Feature -->
    <div class="mb-6 sm:mb-8">
      <div class="relative group">
        <!-- Animated background glow -->
        <div class="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 animate-pulse"></div>
        
        <!-- Main card -->
        <div class="relative bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            
            <!-- Left Section: Title and Toggle -->
            <div class="flex-1 text-center sm:text-left">
              <div class="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style="box-shadow: 0 0 10px #3b82f6;"></div>
                <h3 class="text-lg sm:text-xl font-bold" style="color: #13A538;">
                  {$language === 'ar' ? 'رمز العضوية' : 'MEMBERSHIP CODE'}
                </h3>
              </div>
              
              <!-- Toggle Button -->
              <div class="flex items-center justify-center sm:justify-start gap-3">
                <span class="text-sm font-medium text-gray-600" class:opacity-50={!showQRCode}>
                  {$language === 'ar' ? 'كيو آر' : 'QR'}
                </span>
                
                <button
                  on:click={() => showQRCode = !showQRCode}
                  class="relative w-12 h-6 bg-gray-300 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  class:bg-blue-500={showQRCode}
                  class:bg-orange-500={!showQRCode}
                >
                  <div
                    class="absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 top-0.5"
                    class:translate-x-0.5={!showQRCode}
                    class:translate-x-6={showQRCode}
                  ></div>
                </button>
                
                <span class="text-sm font-medium text-gray-600" class:opacity-50={showQRCode}>
                  {$language === 'ar' ? 'باركود' : 'BARCODE'}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 mt-2">
                {$language === 'ar' ? 
                  'اعرض هذا الرمز عند الدفع لكسب النقاط' : 
                  'Show this code at checkout to earn points'}
              </p>
            </div>
            
            <!-- Right Section: QR/Barcode Display -->
            <div class="relative">
              <!-- Code display container -->
              <div class="relative p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <!-- QR Code -->
                {#if showQRCode}
                  <div class="flex flex-col items-center">
                    <canvas 
                      bind:this={qrCanvas}
                      class="bg-white rounded-lg shadow-sm"
                      width="180" 
                      height="180"
                    ></canvas>
                    <div class="mt-3 text-sm font-mono text-gray-600 text-center font-bold">
                      {customerData?.customer_code || customerData?.mobile}
                    </div>
                  </div>
                {:else}
                  <!-- Barcode -->
                  <div class="flex flex-col items-center">
                    <canvas 
                      bind:this={barcodeCanvas}
                      class="bg-white rounded-lg shadow-sm max-w-full"
                    ></canvas>
                  </div>
                {/if}
                
                <!-- Scanning line animation -->
                <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" class:via-orange-400={!showQRCode}></div>
              </div>
            </div>
          </div>
          
          <!-- Bottom accent line -->
          <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent" class:via-orange-400={!showQRCode}></div>
        </div>
      </div>
    </div>

    <!-- Main Widgets - Mobile-First Responsive Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
      <!-- Points Widget with Premium Brand Design -->
      <div class="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300" style="box-shadow: 0 4px 20px rgba(240, 131, 0, 0.1);">
        
        <!-- Mobile-Optimized Points Display -->
        <div class="text-center mb-6 md:mb-8">
          <div class="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12 mb-8 md:mb-10">
            <!-- Current Points - Enhanced Modern Card -->
            <div class="relative group w-full sm:w-auto">
              <!-- Enhanced animated background glow -->
              <div class="absolute -inset-2 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 animate-pulse transition-opacity duration-500"></div>
              
              <!-- Main card - Enhanced styling -->
              <div class="relative w-full sm:w-40 md:w-44 h-40 sm:h-44 md:h-48 rounded-3xl overflow-hidden transform hover:scale-105 transition-all duration-500" style="background: linear-gradient(135deg, #13A538 0%, #10B981 50%, #059669 100%); box-shadow: 0 20px 40px rgba(19, 165, 56, 0.2);">
                
                <!-- Enhanced holographic pattern -->
                <div class="absolute inset-0 opacity-15" style="background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);"></div>
                
                <!-- Floating particles effect -->
                <div class="absolute top-4 left-4 w-1 h-1 bg-white rounded-full animate-ping opacity-60"></div>
                <div class="absolute top-8 right-6 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse opacity-70"></div>
                <div class="absolute bottom-6 left-6 w-1 h-1 bg-white rounded-full animate-ping opacity-50" style="animation-delay: 1s;"></div>
                
                <!-- Enhanced corner accents -->
                <div class="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-3 border-l-3 border-white opacity-60 rounded-tl-3xl"></div>
                <div class="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-3 border-r-3 border-white opacity-60 rounded-tr-3xl"></div>
                <div class="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-3 border-l-3 border-white opacity-60 rounded-bl-3xl"></div>
                <div class="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-3 border-r-3 border-white opacity-60 rounded-br-3xl"></div>
                
                <!-- Content - Enhanced -->
                <div class="relative z-10 h-full flex flex-col justify-center items-center p-4 sm:p-5">
                  <!-- Enhanced LED indicator -->
                  <div class="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-400 shadow-2xl animate-pulse mb-2 sm:mb-3" style="box-shadow: 0 0 20px #22d3ee, 0 0 40px #22d3ee;"></div>
                  
                  <!-- Enhanced number display -->
                  <div class="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 font-mono tracking-wider drop-shadow-2xl" style="text-shadow: 0 0 30px rgba(255,255,255,0.8), 0 0 15px rgba(19,165,56,0.9);">
                    {isLoading ? '...' : currentBalance.toFixed(2)}
                  </div>
                  
                  <!-- Enhanced label -->
                  <div class="text-xs sm:text-sm text-white uppercase tracking-widest font-black opacity-95 px-3 py-1.5 rounded-lg border border-white border-opacity-40" style="background: rgba(255,255,255,0.15); text-shadow: 0 0 15px rgba(255,255,255,1); backdrop-filter: blur(10px);">
                    {$language === 'ar' ? 'الحالي' : 'CURRENT'}
                  </div>
                  
                  <!-- Enhanced scanning line -->
                  <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" style="box-shadow: 0 0 10px #22d3ee;"></div>
                </div>
                
                <!-- Enhanced shimmer effect -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 animate-pulse transition-opacity duration-700"></div>
              </div>
            </div>
            
            <!-- Lifetime Points - Enhanced Modern Card -->
            <div class="relative group w-full sm:w-auto">
              <!-- Enhanced animated background glow -->
              <div class="absolute -inset-2 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 animate-pulse transition-opacity duration-500"></div>
              
              <!-- Main card - Enhanced styling -->
              <div class="relative w-full sm:w-40 md:w-44 h-40 sm:h-44 md:h-48 rounded-3xl overflow-hidden transform hover:scale-105 transition-all duration-500" style="background: linear-gradient(135deg, #f08300 0%, #fb923c 50%, #ea580c 100%); box-shadow: 0 20px 40px rgba(240, 131, 0, 0.2);">
                
                <!-- Enhanced holographic pattern -->
                <div class="absolute inset-0 opacity-15" style="background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);"></div>
                
                <!-- Floating particles effect -->
                <div class="absolute top-4 right-4 w-1 h-1 bg-white rounded-full animate-ping opacity-60"></div>
                <div class="absolute top-8 left-6 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse opacity-70"></div>
                <div class="absolute bottom-6 right-6 w-1 h-1 bg-white rounded-full animate-ping opacity-50" style="animation-delay: 1s;"></div>
                
                <!-- Enhanced corner accents -->
                <div class="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-3 border-l-3 border-white opacity-60 rounded-tl-3xl"></div>
                <div class="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-3 border-r-3 border-white opacity-60 rounded-tr-3xl"></div>
                <div class="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-3 border-l-3 border-white opacity-60 rounded-bl-3xl"></div>
                <div class="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-3 border-r-3 border-white opacity-60 rounded-br-3xl"></div>
                
                <!-- Content - Enhanced -->
                <div class="relative z-10 h-full flex flex-col justify-center items-center p-4 sm:p-5">
                  <!-- Enhanced LED indicator -->
                  <div class="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400 shadow-2xl animate-pulse mb-2 sm:mb-3" style="box-shadow: 0 0 20px #facc15, 0 0 40px #facc15;"></div>
                  
                  <!-- Enhanced number display -->
                  <div class="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 font-mono tracking-wider drop-shadow-2xl" style="text-shadow: 0 0 30px rgba(255,255,255,0.8), 0 0 15px rgba(240,131,0,0.9);">
                    {isLoading ? '...' : lifetimeEarned.toFixed(2)}
                  </div>
                  
                  <!-- Enhanced label -->
                  <div class="text-xs sm:text-sm text-white uppercase tracking-widest font-black opacity-95 px-3 py-1.5 rounded-lg border border-white border-opacity-40" style="background: rgba(255,255,255,0.15); text-shadow: 0 0 15px rgba(255,255,255,1); backdrop-filter: blur(10px);">
                    {$language === 'ar' ? 'مدى الحياة' : 'LIFETIME'}
                  </div>
                  
                  <!-- Enhanced scanning line -->
                  <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse" style="box-shadow: 0 0 10px #facc15;"></div>
                </div>
                
                <!-- Enhanced shimmer effect -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 animate-pulse transition-opacity duration-700"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Branch Filter -->
        <label for="branch-select" class="text-sm font-bold uppercase tracking-wide mb-2 sm:mb-3 block" style="color: #13A538;" class:text-right={$language === 'ar'}>{$t.filterTransactions}</label>
        <select 
          id="branch-select" 
          bind:value={selectedBranch} 
          class="px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl w-full bg-white mt-2 focus:ring-2 focus:border-transparent transition-all shadow-sm hover:border-gray-300 text-sm sm:text-base" 
          style="focus:ring-color: #77AB39; focus:border-color: #77AB39;" 
          class:text-right={$language === 'ar'}
        >
          {#each branchOptions as branch}
            <option value={branch.id}>{branch.name}</option>
          {/each}
        </select>
        <p class="text-xs text-gray-500 mt-1 sm:mt-2" class:text-right={$language === 'ar'}>
          {$t.filterNote}
        </p>
      </div>

      <!-- Enhanced Quick Actions Widget -->
      <div class="relative group">
        <!-- Enhanced glow background -->
        <div class="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 animate-pulse transition-opacity duration-500"></div>
        
        <!-- Main container -->
        <div class="relative bg-white p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-500" style="backdrop-filter: blur(20px);">
          
          <!-- Enhanced header -->
          <div class="text-center mb-6 sm:mb-8">
            <div class="inline-flex items-center gap-3 mb-4">
              <div class="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" style="box-shadow: 0 0 20px #6366f1;"></div>
              <h3 class="text-2xl sm:text-3xl font-black" style="background: linear-gradient(135deg, #13A538 0%, #3b82f6 50%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-shadow: 0 0 30px rgba(19, 165, 56, 0.3);">
                {$t.quickActions}
              </h3>
              <div class="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" style="box-shadow: 0 0 20px #6366f1; animation-delay: 0.5s;"></div>
            </div>
          </div>
        
          <div class="space-y-4 sm:space-y-5">
            <!-- Enhanced My Offers Button - Moved to Top -->
            <a href="/my-offers" class="block group/offers" class:flex-row-reverse={$language === 'ar'}>
              <div class="relative overflow-hidden rounded-2xl transform hover:scale-[1.03] transition-all duration-500">
                <!-- Animated background -->
                <div class="absolute inset-0 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-700 opacity-90"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover/offers:opacity-10 transform -skew-x-12 translate-x-[-100%] group-hover/offers:translate-x-[100%] transition-all duration-700"></div>
                
                <!-- Content -->
                <div class="relative flex items-center gap-4 sm:gap-5 p-4 sm:p-5 text-white" class:flex-row-reverse={$language === 'ar'}>
                  <div class="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <div class="text-3xl sm:text-4xl">🎁</div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-black text-lg sm:text-xl truncate drop-shadow-lg">{$t.myOffers}</h4>
                    <p class="text-yellow-100 text-sm sm:text-base truncate font-medium">{$t.viewSpecialOffers}</p>
                  </div>
                  <div class="flex-shrink-0 p-2 bg-white/20 rounded-lg backdrop-blur-sm transform group-hover/offers:translate-x-1 transition-transform duration-300">
                    <div class="text-2xl sm:text-3xl opacity-90">→</div>
                  </div>
                </div>
                
                <!-- Decorative elements -->
                <div class="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-ping opacity-60"></div>
                <div class="absolute bottom-2 left-2 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse opacity-70"></div>
              </div>
            </a>

            <!-- Enhanced Virtual Card Button -->
            <a href="/virtual-card" class="block group/card">
              <div class="relative overflow-hidden rounded-2xl transform hover:scale-[1.03] transition-all duration-500">
                <!-- Animated background -->
                <div class="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 opacity-90"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover/card:opacity-10 transform -skew-x-12 translate-x-[-100%] group-hover/card:translate-x-[100%] transition-all duration-700"></div>
                
                <!-- Content -->
                <div class="relative flex items-center gap-4 sm:gap-5 p-4 sm:p-5 text-white">
                  <div class="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <div class="text-3xl sm:text-4xl">�</div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-black text-lg sm:text-xl truncate drop-shadow-lg">{$t.virtualCard}</h4>
                    <p class="text-orange-100 text-sm sm:text-base truncate font-medium">{$t.viewYourCard}</p>
                  </div>
                  <div class="flex-shrink-0 p-2 bg-white/20 rounded-lg backdrop-blur-sm transform group-hover/card:translate-x-1 transition-transform duration-300">
                    <div class="text-2xl sm:text-3xl opacity-90">→</div>
                  </div>
                </div>
                
                <!-- Decorative elements -->
                <div class="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-ping opacity-60"></div>
                <div class="absolute bottom-2 left-2 w-1.5 h-1.5 bg-orange-200 rounded-full animate-pulse opacity-70"></div>
              </div>
            </a>

            <!-- Enhanced Customer Support Button -->
            <a href="/customer-support" class="block group/support" class:flex-row-reverse={$language === 'ar'}>
              <div class="relative overflow-hidden rounded-2xl transform hover:scale-[1.03] transition-all duration-500">
                <!-- Animated background -->
                <div class="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 opacity-90"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover/support:opacity-10 transform -skew-x-12 translate-x-[-100%] group-hover/support:translate-x-[100%] transition-all duration-700"></div>
                
                <!-- Content -->
                <div class="relative flex items-center gap-4 sm:gap-5 p-4 sm:p-5 text-white" class:flex-row-reverse={$language === 'ar'}>
                  <div class="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <div class="text-3xl sm:text-4xl">💬</div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-black text-lg sm:text-xl truncate drop-shadow-lg">{$t.customerSupport}</h4>
                    <p class="text-green-100 text-sm sm:text-base truncate font-medium">{$t.needHelp}</p>
                  </div>
                  <div class="flex-shrink-0 p-2 bg-white/20 rounded-lg backdrop-blur-sm transform group-hover/support:translate-x-1 transition-transform duration-300">
                    <div class="text-2xl sm:text-3xl opacity-90">→</div>
                  </div>
                </div>
                
                <!-- Decorative elements -->
                <div class="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-ping opacity-60"></div>
                <div class="absolute bottom-2 left-2 w-1.5 h-1.5 bg-green-200 rounded-full animate-pulse opacity-70"></div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions Section - Mobile-Optimized Futuristic Design -->
    <section class="relative mt-4 sm:mt-6 md:mt-8">
      <!-- Animated background glow -->
      <div class="absolute -inset-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 rounded-3xl blur opacity-20 animate-pulse"></div>
      
      <!-- Main container -->
      <div class="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden" style="backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
        
        <!-- Header with holographic effect -->
        <div class="relative p-4 sm:p-6 md:p-8 pb-4 sm:pb-6" style="background: linear-gradient(135deg, rgba(19, 165, 56, 0.05) 0%, rgba(119, 171, 57, 0.05) 100%);">
          <!-- Grid pattern overlay -->
          <div class="absolute inset-0 opacity-5" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(19,165,56,0.2) 2px, rgba(19,165,56,0.2) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(19,165,56,0.2) 2px, rgba(19,165,56,0.2) 4px);"></div>
          
          <!-- Header content -->
          <div class="relative flex justify-between items-center">
            <div class="flex items-center gap-2 sm:gap-3 md:gap-4">
              <!-- LED indicator -->
              <div class="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-400 animate-pulse" style="box-shadow: 0 0 15px #10b981;"></div>
              
              <h3 class="text-lg sm:text-2xl md:text-3xl font-bold font-mono tracking-wide" style="color: #13A538; text-shadow: 0 0 20px rgba(19, 165, 56, 0.3);">
                {$language === 'ar' ? 'المعاملات الأخيرة' : 'RECENT TRANSACTIONS'}
              </h3>
            </div>
          </div>
          
          <!-- Scanning line -->
          <div class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse"></div>
        </div>

        <!-- Transaction Cards Container -->
        <div class="p-3 sm:p-4 md:p-6">
          {#if filteredTransactions.length > 0}
            <div class="space-y-3 sm:space-y-4">
              {#each filteredTransactions as tx}
                <!-- Individual Transaction Card - Mobile Optimized -->
                <div class="relative group">
                  <!-- Card glow -->
                  <div class="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  
                  <!-- Card content -->
                  <div class="relative p-3 sm:p-4 md:p-6 rounded-2xl border border-gray-200 transition-all duration-300 group-hover:border-emerald-300" style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%); backdrop-filter: blur(5px);">
                    
                    <!-- Corner accents -->
                    <div class="absolute top-0 left-0 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-emerald-400 opacity-30"></div>
                    <div class="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-emerald-400 opacity-30"></div>
                    
                    <!-- Transaction content - Mobile responsive layout -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 items-start sm:items-center">
                      
                      <!-- Date Section -->
                      <div class="flex items-center gap-2 sm:gap-3">
                        <!-- Date icon -->
                        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, #C0A32A 0%, #D4B836 100%);">
                          <span class="text-white text-sm sm:text-lg font-bold">📅</span>
                        </div>
                        
                        <div class="min-w-0 flex-1">
                          <div class="font-mono text-gray-800 font-semibold text-xs sm:text-sm md:text-base truncate">
                            {formatDate(tx.bill_date || tx.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <!-- Branch Section -->
                      <div class="flex items-center gap-2 sm:gap-3">
                        <!-- Branch icon -->
                        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, #13A538 0%, #77AB39 100%);">
                          <span class="text-white text-sm sm:text-lg font-bold">🏪</span>
                        </div>
                        
                        <div class="min-w-0 flex-1">
                          <div class="font-semibold text-gray-800 text-xs sm:text-sm md:text-base truncate">
                            {$language === 'ar' ? (tx.branches?.name_ar || tx.branches?.name || 'غير متاح') : (tx.branches?.name || 'N/A')}
                          </div>
                        </div>
                      </div>
                      
                      <!-- Amount Section -->
                      <div class="flex items-center gap-2 sm:gap-3 justify-start sm:justify-end">
                        <div class="text-left sm:text-right">
                          <div class="text-lg sm:text-xl md:text-2xl font-bold font-mono currency-display" style="color: #f08300; text-shadow: 0 0 10px rgba(240, 131, 0, 0.3);">
                            {@html formatCurrency(tx.amount || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Status indicator line -->
                    <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 opacity-20"></div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <!-- No transactions state - Mobile optimized -->
            <div class="text-center py-8 sm:py-12 md:py-16">
              <!-- Empty state container -->
              <div class="relative">
                <!-- Glow effect -->
                <div class="absolute -inset-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-3xl blur opacity-20"></div>
                
                <!-- Content -->
                <div class="relative p-4 sm:p-6 md:p-8 rounded-3xl" style="background: linear-gradient(135deg, rgba(243, 244, 246, 0.5) 0%, rgba(249, 250, 251, 0.8) 100%); backdrop-filter: blur(5px); border: 1px solid rgba(156, 163, 175, 0.2);">
                  
                  <!-- Large icon with animation -->
                  <div class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center animate-pulse" style="background: linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%);">
                    <span class="text-2xl sm:text-3xl md:text-4xl">📋</span>
                  </div>
                  
                  <!-- Main message -->
                  <h4 class="text-lg sm:text-xl md:text-2xl font-bold text-gray-700 mb-2 sm:mb-3 font-mono">
                    {$language === 'ar' ? 'لا توجد معاملات' : 'NO TRANSACTIONS FOUND'}
                  </h4>
                  
                  <!-- Subtitle -->
                  <p class="text-gray-500 font-medium text-sm sm:text-base">
                    {selectedBranch === 'all' ? 
                      ($language === 'ar' ? 'ابدأ التسوق لرؤية معاملاتك هنا' : 'Start shopping to see your transactions here') :
                      ($language === 'ar' ? 'لا توجد معاملات لهذا الفرع' : 'No transactions found for this branch')}
                  </p>
                  
                  <!-- Decorative elements -->
                  <div class="flex justify-center gap-1 sm:gap-2 mt-4 sm:mt-6">
                    <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 animate-pulse"></div>
                    <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 animate-pulse" style="animation-delay: 0.2s;"></div>
                    <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 animate-pulse" style="animation-delay: 0.4s;"></div>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
        
        <!-- Bottom accent line -->
        <div class="h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
      </div>
    </section>

    <!-- Point Redemption Conditions Section - Mobile Optimized -->
    <section class="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 mt-4 sm:mt-6 md:mt-8">
      <div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, #C0A32A 0%, #D4B836 100%);">
          <span class="text-lg sm:text-2xl">🎯</span>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg sm:text-xl md:text-2xl font-bold" style="color: #C0A32A;">
            {currentTranslations.redemptionConditions}
          </h3>
          <p class="text-gray-600 text-xs sm:text-sm">
            {currentTranslations.redemptionRules}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <!-- Left Side: Redemption Values + Store Rules -->
        <div class="space-y-3 sm:space-y-4">
          <h4 class="font-bold text-base sm:text-lg" style="color: #13A538;">
            {currentTranslations.allowedRedemptions}
          </h4>
          <div class="grid grid-cols-2 gap-2 sm:gap-3">
            {#each [50, 100, 150, 200] as points}
              <div class="flex items-center justify-between p-2 sm:p-3 rounded-lg border-2" style="border-color: #77AB39; background: #F3FFF8;">
                <span class="font-bold text-base sm:text-lg" style="color: #13A538;">{points}</span>
                <span class="text-xs sm:text-sm text-gray-600">{currentTranslations.points}</span>
              </div>
            {/each}
          </div>
          
          <!-- Store Use Only Rule -->
          <div class="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg" style="background: #F3FFF8; border: 1px solid #77AB39;">
            <span class="text-base sm:text-lg flex-shrink-0">✅</span>
            <div class="flex-1 text-xs sm:text-sm min-w-0">
              <p class="font-medium text-gray-800">
                {currentTranslations.storeUseOnly}
              </p>
              <p class="text-gray-600 mt-1">
                {currentTranslations.storeUseOnlyDesc}
              </p>
            </div>
          </div>

          <!-- Branch-Specific Redemption Rule -->
          <div class="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg" style="background: #F0F8FF; border: 1px solid #13A538;">
            <span class="text-base sm:text-lg flex-shrink-0">🏪</span>
            <div class="flex-1 text-xs sm:text-sm min-w-0">
              <p class="font-medium text-gray-800">
                {currentTranslations.branchSpecificRedemption}
              </p>
              <p class="text-gray-600 mt-1">
                {currentTranslations.branchSpecificRedemptionDesc}
              </p>
            </div>
          </div>
        </div>

        <!-- Right Side: Important Rules -->
        <div class="space-y-3 sm:space-y-4">
          <h4 class="font-bold text-base sm:text-lg" style="color: #f08300;">
            {currentTranslations.importantRules}
          </h4>
          <div class="space-y-2 sm:space-y-3">
            <div class="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg" style="background: #FFF8F0; border: 1px solid #f08300;">
              <span class="text-base sm:text-lg flex-shrink-0">⚠️</span>
              <div class="flex-1 text-xs sm:text-sm min-w-0">
                <p class="font-medium text-gray-800">
                  {currentTranslations.noCustomValues}
                </p>
                <p class="text-gray-600 mt-1">
                  {currentTranslations.noCustomValuesDesc}
                </p>
              </div>
            </div>
            
            <div class="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg" style="background: #FFF8F0; border: 1px solid #f08300;">
              <span class="text-base sm:text-lg flex-shrink-0">💸</span>
              <div class="flex-1 text-xs sm:text-sm min-w-0">
                <p class="font-medium text-gray-800">
                  {currentTranslations.noCashExchange}
                </p>
                <p class="text-gray-600 mt-1">
                  {currentTranslations.noCashExchangeDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Support for Redemption - Mobile optimized -->
      <div class="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl text-center" style="background: linear-gradient(135deg, #EAFBEF 0%, #F3FFF8 100%); border: 2px solid #77AB39;">
        <p class="text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">
          <span class="font-bold" style="color: #13A538;">{currentTranslations.readyToRedeem}</span>
        </p>
        <p class="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          {currentTranslations.contactStoreStaff}
        </p>
        <a href="/customer-support" class="inline-flex items-center gap-2 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm sm:text-base" style="background: #13A538;">
          <span class="text-base sm:text-xl">💬</span>
          <span>{currentTranslations.contactSupport}</span>
        </a>
      </div>
    </section>
  {/if}
  
  <!-- Footer Links -->
  <footer class="mt-8 py-6 border-t border-gray-200">
    <div class="text-center">
      <div class="flex justify-center items-center space-x-6 text-sm" class:space-x-reverse={$language === 'ar'}>
        <a 
          href="/terms-conditions" 
          class="text-blue-600 hover:text-blue-800 font-medium transition-colors underline"
        >
          {$language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
        </a>
        <span class="text-gray-400">•</span>
        <a 
          href="/privacy-policy" 
          class="text-blue-600 hover:text-blue-800 font-medium transition-colors underline"
        >
          {$language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </a>
        <span class="text-gray-400">•</span>
        <a 
          href="/customer-support" 
          class="text-blue-600 hover:text-blue-800 font-medium transition-colors underline"
        >
          {$language === 'ar' ? 'الدعم' : 'Support'}
        </a>
      </div>
      <p class="mt-2 text-xs text-gray-500">
        © 2025 Urban Loyalty. All rights reserved.
      </p>
    </div>
  </footer>
</main>

<style>
  /* Arabic Typography Support */
  :global([dir="rtl"]) {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  /* RTL specific adjustments for Point Redemption Conditions */
  :global([dir="rtl"] .flex.items-start.gap-2) {
    direction: rtl;
  }
  
  :global([dir="rtl"] .grid.grid-cols-2.gap-2) {
    direction: rtl;
  }
  
  /* Ensure proper text alignment for Arabic */
  :global([dir="rtl"] p) {
    text-align: right;
  }
  
  :global([dir="rtl"] h3, [dir="rtl"] h4) {
    text-align: right;
  }
</style>