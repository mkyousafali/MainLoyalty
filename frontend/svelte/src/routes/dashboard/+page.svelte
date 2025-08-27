<script lang="ts">
  import { onMount } from 'svelte';
  import { getCardTypeGradient } from '$lib/stores/cardTypes';
  import { supabase } from '$lib/supabase';
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { language, t, toggleLanguage } from '$lib/stores/language';
  import { formatCurrency, formatCurrencyText } from '$lib/formatCurrency';
  import { customerNotifications, unreadNotificationCount, loadCustomerNotifications } from '$lib/stores/notifications';
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
  let isLuckyDrawEnabled = true; // Lucky Draw feature toggle

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
    branchSpecificRedemptionDesc: 'يمكن استرداد النقاط فقط إذا كان لدى الفرع المحدد نقاط كافية متاحة. لا يمكنك دمج النقاط من فروع مختلفة للاسترداد.'
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
    branchSpecificRedemptionDesc: 'Points can only be redeemed if the specific branch has enough points available. You cannot combine points from different branches for redemption.'
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
  
  // Last transaction date - changes based on branch selection
  $: lastTransactionDate = (() => {
    if (isLoading || !allTransactions || allTransactions.length === 0) return null;
    
    const relevantTransactions = selectedBranch === 'all' 
      ? allTransactions 
      : allTransactions.filter(tx => tx.branch_id?.toString() === selectedBranch.toString());
    
    if (relevantTransactions.length === 0) return null;
    
    // Sort by date and get the most recent one
    const sortedTransactions = relevantTransactions.sort((a, b) => {
      const dateA = new Date(a.bill_date || a.transaction_date || a.created_at);
      const dateB = new Date(b.bill_date || b.transaction_date || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    const lastDate = sortedTransactions[0].bill_date || sortedTransactions[0].transaction_date || sortedTransactions[0].created_at;
    return lastDate ? new Date(lastDate) : null;
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

  // Format date for display
  function formatLastTransactionDate(date: Date | null): string {
    if (!date) return $language === 'ar' ? 'لا توجد معاملات' : 'No transactions';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return $language === 'ar' ? 'اليوم' : 'Today';
    } else if (days === 1) {
      return $language === 'ar' ? 'أمس' : 'Yesterday';
    } else if (days < 7) {
      return $language === 'ar' ? `منذ ${days} أيام` : `${days} days ago`;
    } else {
      return date.toLocaleDateString($language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
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
    checkLuckyDrawStatus();
    
    // Load notifications from Supabase
    loadCustomerNotifications($language);
  });

  // Check Lucky Draw enabled status
  async function checkLuckyDrawStatus() {
    try {
      const { data, error } = await supabase
        .rpc('get_lucky_draw_enabled');
      
      if (error) {
        console.error('Error checking Lucky Draw status:', error);
        // Default to enabled if we can't check
        isLuckyDrawEnabled = true;
        return;
      }
      
      isLuckyDrawEnabled = data === true;
      console.log('🎯 Lucky Draw enabled status:', isLuckyDrawEnabled);
      
    } catch (err) {
      console.error('Error checking Lucky Draw status:', err);
      // Default to enabled if there's an error
      isLuckyDrawEnabled = true;
    }
  }

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



<!-- Logo Header Section - Compact on Mobile -->
<div class="text-center py-2 sm:py-6 md:py-8">
  <div class="max-w-6xl mx-auto px-2 sm:px-4 md:px-6">
    <div class="relative inline-block transform hover:scale-105 transition-all duration-300">
      <div class="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl sm:rounded-3xl blur-lg opacity-20 animate-pulse"></div>
      <div class="relative bg-white p-2 sm:p-4 md:p-6 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-gray-100">
        <img src="/logo.png" alt="Urban Market Logo" class="h-8 sm:h-12 md:h-16 w-auto mx-auto" />
      </div>
    </div>
    <div class="mt-2 sm:mt-4">
      <div class="inline-flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full border border-green-200">
        <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-xs sm:text-sm font-medium text-green-700" class:text-right={$language === 'ar'}>
          {$language === 'ar' ? 'لوحة تحكم العميل' : 'Customer Dashboard'}
        </span>
      </div>
    </div>
  </div>
</div>

<!-- Dashboard Widgets -->
<main class="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto mt-2 sm:mt-4 md:mt-8" dir="{$language === 'ar' ? 'rtl' : 'ltr'}" lang="{$language}">
  
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
        <!-- Ocean Wave Background -->
        <div class="absolute inset-0 rounded-2xl overflow-hidden">
          <!-- Gradient Ocean Background -->
          <div class="absolute inset-0 bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-600"></div>
          
          <!-- Animated Ocean Waves -->
          <svg class="absolute bottom-0 left-0 w-full h-16" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V120H1200V0C1200,0 1050,100 900,100C750,100 600,0 450,0C300,0 150,100 0,100Z" 
                  fill="rgba(255,255,255,0.1)" class="animate-pulse">
              <animate attributeName="d" 
                       values="M0,0V120H1200V0C1200,0 1050,100 900,100C750,100 600,0 450,0C300,0 150,100 0,100Z;
                               M0,0V120H1200V0C1200,0 1050,80 900,80C750,80 600,20 450,20C300,20 150,80 0,80Z;
                               M0,0V120H1200V0C1200,0 1050,100 900,100C750,100 600,0 450,0C300,0 150,100 0,100Z"
                       dur="4s" repeatCount="indefinite"/>
            </path>
            <path d="M0,20V120H1200V20C1200,20 1050,80 900,80C750,80 600,40 450,40C300,40 150,80 0,80Z" 
                  fill="rgba(255,255,255,0.05)">
              <animate attributeName="d" 
                       values="M0,20V120H1200V20C1200,20 1050,80 900,80C750,80 600,40 450,40C300,40 150,80 0,80Z;
                               M0,20V120H1200V20C1200,20 1050,60 900,60C750,60 600,60 450,60C300,60 150,60 0,60Z;
                               M0,20V120H1200V20C1200,20 1050,80 900,80C750,80 600,40 450,40C300,40 150,80 0,80Z"
                       dur="3s" repeatCount="indefinite"/>
            </path>
          </svg>
          
          <!-- Floating Bubbles -->
          <div class="absolute inset-0">
            <div class="absolute top-4 left-8 w-2 h-2 bg-white/20 rounded-full animate-bounce"></div>
            <div class="absolute top-12 right-12 w-1.5 h-1.5 bg-white/15 rounded-full animate-pulse"></div>
            <div class="absolute top-8 left-1/3 w-1 h-1 bg-white/25 rounded-full animate-bounce" style="animation-delay: 0.5s"></div>
            <div class="absolute top-16 right-1/4 w-1.5 h-1.5 bg-white/10 rounded-full animate-pulse" style="animation-delay: 1s"></div>
            <div class="absolute bottom-20 left-16 w-2.5 h-2.5 bg-white/20 rounded-full animate-bounce" style="animation-delay: 1.5s"></div>
            <div class="absolute bottom-24 right-20 w-1 h-1 bg-white/30 rounded-full animate-pulse" style="animation-delay: 2s"></div>
          </div>
          
          <!-- Shimmer Effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-shimmer"></div>
        </div>
        
        <!-- Main card with glass effect -->
        <div class="relative bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6" class:sm:flex-row-reverse={$language === 'ar'}>
            
            <!-- Left Section: Title and Toggle -->
            <div class="flex-1 text-center sm:text-left" class:sm:text-right={$language === 'ar'}>
              <div class="flex items-center justify-center sm:justify-start gap-3 mb-4" class:sm:justify-end={$language === 'ar'}>
                <!-- Ocean Icon -->
                <div class="relative">
                  <div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="absolute -top-1 -right-1 w-3 h-3 bg-cyan-300/60 rounded-full animate-ping"></div>
                </div>
                
                <div class="text-center sm:text-left" class:sm:text-right={$language === 'ar'}>
                  <h3 class="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                    {$language === 'ar' ? 'رمز العضوية' : 'MEMBERSHIP CODE'}
                  </h3>
                  <div class="w-16 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto sm:mx-0" class:sm:mr-auto={$language === 'ar'} class:sm:ml-0={$language === 'ar'}></div>
                </div>
              </div>
              
              <!-- Toggle Button with Ocean Theme -->
              <div class="inline-flex items-center justify-center gap-2 sm:gap-3 bg-white/50 backdrop-blur-sm p-2 sm:p-3 rounded-xl border border-white/30 overflow-hidden" class:flex-row-reverse={$language === 'ar'}>
                <span class="text-xs sm:text-sm font-medium text-cyan-700 flex items-center gap-1 whitespace-nowrap flex-shrink-0" class:opacity-50={!showQRCode}>
                  <div class="w-2 h-2 bg-cyan-500 rounded-full" class:animate-pulse={showQRCode}></div>
                  {$language === 'ar' ? 'كيو آر' : 'QR'}
                </span>
                
                <button
                  on:click={() => showQRCode = !showQRCode}
                  class="relative w-14 sm:w-16 h-7 sm:h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 shadow-inner flex-shrink-0 overflow-hidden"
                  class:from-cyan-400={showQRCode}
                  class:to-blue-500={showQRCode}
                  class:from-orange-400={!showQRCode}
                  class:to-amber-500={!showQRCode}
                  aria-label="Toggle between QR and Barcode"
                >
                  <div
                    class="absolute w-6 sm:w-7 h-6 sm:h-7 bg-white rounded-full shadow-md transition-transform duration-300 top-0.5 flex items-center justify-center will-change-transform"
                    class:translate-x-0.5={!showQRCode && $language !== 'ar'}
                    class:translate-x-7={showQRCode && $language !== 'ar'}
                    class:sm:translate-x-8={showQRCode && $language !== 'ar'}
                    class:translate-x-6.5={showQRCode && $language === 'ar'}
                    class:sm:translate-x-7.5={showQRCode && $language === 'ar'}
                    class:translate-x-1={!showQRCode && $language === 'ar'}
                  >
                    {#if showQRCode}
                      <div class="w-3 sm:w-3.5 h-3 sm:h-3.5 border border-cyan-600 grid grid-cols-2 gap-0.5 p-0.5">
                        <div class="bg-cyan-600 rounded-sm"></div>
                        <div class="bg-cyan-600 rounded-sm"></div>
                        <div class="bg-cyan-600 rounded-sm"></div>
                        <div class="bg-cyan-600 rounded-sm"></div>
                      </div>
                    {:else}
                      <div class="flex gap-0.5 items-center">
                        <div class="w-0.5 h-3 sm:h-3.5 bg-orange-600 rounded-full"></div>
                        <div class="w-0.5 h-3 sm:h-3.5 bg-orange-600 rounded-full"></div>
                        <div class="w-0.5 h-3 sm:h-3.5 bg-orange-600 rounded-full"></div>
                      </div>
                    {/if}
                  </div>
                </button>
                
                <span class="text-xs sm:text-sm font-medium text-orange-600 flex items-center gap-1 whitespace-nowrap flex-shrink-0" class:opacity-50={showQRCode}>
                  <div class="w-2 h-2 bg-orange-500 rounded-full" class:animate-pulse={!showQRCode}></div>
                  {$language === 'ar' ? 'باركود' : 'BARCODE'}
                </span>
              </div>
              
              <p class="text-sm text-cyan-800/80 mt-3 flex items-center justify-center sm:justify-start gap-2" class:sm:justify-end={$language === 'ar'} class:sm:text-right={$language === 'ar'}>
                <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {$language === 'ar' ? 
                  'اعرض هذا الرمز عند الدفع لكسب النقاط' : 
                  'Show this code at checkout to earn points'}
              </p>
            </div>
            
            <!-- Right Section: QR/Barcode Display -->
            <div class="relative">
              <!-- Code display container with ocean theme -->
              <div class="relative p-4 bg-gradient-to-br from-white via-cyan-50/50 to-blue-50/30 backdrop-blur-sm rounded-2xl border-2 border-white/40 shadow-xl">
                <!-- Floating elements around the code -->
                <div class="absolute -top-2 -left-2 w-4 h-4 bg-cyan-300/40 rounded-full animate-bounce"></div>
                <div class="absolute -top-1 -right-3 w-2 h-2 bg-blue-400/50 rounded-full animate-pulse"></div>
                <div class="absolute -bottom-2 -left-1 w-3 h-3 bg-cyan-400/30 rounded-full animate-bounce" style="animation-delay: 0.5s"></div>
                
                <!-- QR Code -->
                {#if showQRCode}
                  <div class="flex flex-col items-center">
                    <div class="relative">
                      <canvas 
                        bind:this={qrCanvas}
                        class="bg-white rounded-lg shadow-lg border-2 border-cyan-100"
                        width="180" 
                        height="180"
                      ></canvas>
                      <!-- QR Corner decorations -->
                      <div class="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-400 rounded-tl-lg"></div>
                      <div class="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-cyan-400 rounded-tr-lg"></div>
                      <div class="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-cyan-400 rounded-bl-lg"></div>
                      <div class="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-400 rounded-br-lg"></div>
                    </div>
                    <div class="mt-3 px-3 py-1 bg-cyan-100/50 rounded-lg text-sm font-mono text-cyan-800 text-center font-bold border border-cyan-200/50">
                      {customerData?.customer_code || customerData?.mobile}
                    </div>
                  </div>
                {:else}
                  <!-- Barcode -->
                  <div class="flex flex-col items-center">
                    <div class="relative">
                      <canvas 
                        bind:this={barcodeCanvas}
                        class="bg-white rounded-lg shadow-lg border-2 border-orange-100 max-w-full"
                      ></canvas>
                      <!-- Barcode corner decorations -->
                      <div class="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-orange-400 rounded-tl-lg"></div>
                      <div class="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-orange-400 rounded-tr-lg"></div>
                      <div class="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-orange-400 rounded-bl-lg"></div>
                      <div class="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-orange-400 rounded-br-lg"></div>
                    </div>
                  </div>
                {/if}
                
                <!-- Scanning line animation with ocean theme -->
                <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent to-transparent animate-pulse {showQRCode ? 'via-cyan-400' : 'via-orange-400'}"></div>
                
                <!-- Bottom glow -->
                <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent to-transparent blur-sm {showQRCode ? 'via-cyan-300/50' : 'via-orange-300/50'}"></div>
              </div>
              
              <!-- Status indicator -->
              <div class="absolute -bottom-2 -right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border border-white/50 shadow-sm">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span class="text-xs text-green-700 font-medium">{$language === 'ar' ? 'جاهز' : 'Ready'}</span>
              </div>
            </div>
          </div>
          
          <!-- Bottom ocean wave accent -->
          <div class="absolute bottom-0 left-0 w-full overflow-hidden">
            <svg class="w-full h-3" viewBox="0 0 1200 20" preserveAspectRatio="none">
              <path d="M0,10 Q300,0 600,10 T1200,10 L1200,20 L0,20 Z" fill="url(#oceanGradient)">
                <animate attributeName="d" 
                         values="M0,10 Q300,0 600,10 T1200,10 L1200,20 L0,20 Z;
                                 M0,10 Q300,20 600,10 T1200,10 L1200,20 L0,20 Z;
                                 M0,10 Q300,0 600,10 T1200,10 L1200,20 L0,20 Z"
                         dur="3s" repeatCount="indefinite"/>
              </path>
              <defs>
                <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#22d3ee;stop-opacity:0.3"/>
                  <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:0.5"/>
                  <stop offset="100%" style="stop-color:#22d3ee;stop-opacity:0.3"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications Widget - Recent Notifications Preview -->
    {#if $customerNotifications.length > 0}
      <div class="mb-6 sm:mb-8">
        <div class="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="relative">
                <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {#if $unreadNotificationCount > 0}
                  <div class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {$unreadNotificationCount}
                  </div>
                {/if}
              </div>
              <h3 class="text-lg font-semibold text-gray-800">
                {$language === 'ar' ? 'الإشعارات الأخيرة' : 'Recent Notifications'}
              </h3>
            </div>
            <a 
              href="/notifications" 
              class="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
            >
              {$language === 'ar' ? 'عرض الكل' : 'View All'}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
          
          <div class="space-y-3">
            {#each $customerNotifications.slice(0, 3) as notification}
              <div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <div class="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" class:bg-gray-400={notification.is_read}></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate" class:text-gray-600={notification.is_read}>
                    {notification.title}
                  </p>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleDateString($language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

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
        <div class="relative">
          <select 
            id="branch-select" 
            bind:value={selectedBranch} 
            class="py-2 sm:py-3 border-2 border-gray-200 rounded-xl w-full bg-white mt-2 focus:ring-2 focus:border-transparent transition-all shadow-sm hover:border-gray-300 text-sm sm:text-base appearance-none" 
            style="focus:ring-color: #77AB39; focus:border-color: #77AB39; background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K'); background-repeat: no-repeat;" 
            class:text-right={$language === 'ar'}
            class:px-3={$language !== 'ar'}
            class:sm:px-4={$language !== 'ar'}
            class:pr-12={$language !== 'ar'}
            class:px-12={$language === 'ar'}
            class:sm:px-14={$language === 'ar'}
            class:pl-3={$language === 'ar'}
            class:sm:pl-4={$language === 'ar'}
            style:background-position={$language === 'ar' ? 'left 1rem center' : 'right 1rem center'}
          >
            {#each branchOptions as branch}
              <option value={branch.id}>{branch.name}</option>
            {/each}
          </select>
        </div>
        <p class="text-xs text-gray-500 mt-1 sm:mt-2" class:text-right={$language === 'ar'}>
          {$t.filterNote}
        </p>
        
        <!-- Last Updated Date -->
        <div class="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100" class:text-right={$language === 'ar'}>
          <div class="flex items-center gap-2" class:flex-row-reverse={$language === 'ar'}>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-xs font-medium text-gray-600">
              {$language === 'ar' ? 'آخر تحديث:' : 'Last Updated:'}
            </span>
            <span class="text-xs text-gray-800 font-semibold">
              {formatLastTransactionDate(lastTransactionDate)}
            </span>
          </div>
        </div>
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

            <!-- Enhanced My Offers Button -->
            <a href="/my-offers" class="block group/offers" class:flex-row-reverse={$language === 'ar'}>
              <div class="relative overflow-hidden rounded-2xl transform hover:scale-[1.03] transition-all duration-500">
                <!-- Animated background -->
                <div class="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700 opacity-90"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover/offers:opacity-10 transform -skew-x-12 translate-x-[-100%] group-hover/offers:translate-x-[100%] transition-all duration-700"></div>
                
                <!-- Content -->
                <div class="relative flex items-center gap-4 sm:gap-5 p-4 sm:p-5 text-white" class:flex-row-reverse={$language === 'ar'}>
                  <div class="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <div class="text-3xl sm:text-4xl">🎁</div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-black text-lg sm:text-xl truncate drop-shadow-lg">{$language === 'ar' ? 'عروضي' : 'My Offers'}</h4>
                    <p class="text-emerald-100 text-sm sm:text-base truncate font-medium">{$language === 'ar' ? 'اكتشف العروض الحصرية' : 'Discover exclusive offers'}</p>
                  </div>
                  <div class="flex-shrink-0 p-2 bg-white/20 rounded-lg backdrop-blur-sm transform group-hover/offers:translate-x-1 transition-transform duration-300">
                    <div class="text-2xl sm:text-3xl opacity-90">→</div>
                  </div>
                </div>
                
                <!-- Decorative elements -->
                <div class="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-ping opacity-60"></div>
                <div class="absolute bottom-2 left-2 w-1.5 h-1.5 bg-emerald-200 rounded-full animate-pulse opacity-70"></div>
              </div>
            </a>

            <!-- Enhanced Lucky Draw Button (Conditional) -->
            {#if isLuckyDrawEnabled}
              <a href="/lucky-draw" class="block group/lucky" class:flex-row-reverse={$language === 'ar'}>
                <div class="relative overflow-hidden rounded-2xl transform hover:scale-[1.03] transition-all duration-500">
                  <!-- Animated background -->
                  <div class="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 opacity-90"></div>
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover/lucky:opacity-10 transform -skew-x-12 translate-x-[-100%] group-hover/lucky:translate-x-[100%] transition-all duration-700"></div>
                  
                  <!-- Content -->
                  <div class="relative flex items-center gap-4 sm:gap-5 p-4 sm:p-5 text-white" class:flex-row-reverse={$language === 'ar'}>
                    <div class="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <div class="text-3xl sm:text-4xl">🎯</div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-black text-lg sm:text-xl truncate drop-shadow-lg">{$language === 'ar' ? 'العجلة المحظوظة' : 'Lucky Draw'}</h4>
                      <p class="text-purple-100 text-sm sm:text-base truncate font-medium">{$language === 'ar' ? 'دوّر واربح جوائز مذهلة!' : 'Spin and win amazing prizes!'}</p>
                    </div>
                    <div class="flex-shrink-0 p-2 bg-white/20 rounded-lg backdrop-blur-sm transform group-hover/lucky:translate-x-1 transition-transform duration-300">
                      <div class="text-2xl sm:text-3xl opacity-90">→</div>
                    </div>
                  </div>
                  
                  <!-- Decorative elements -->
                  <div class="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-ping opacity-60"></div>
                  <div class="absolute bottom-2 left-2 w-1.5 h-1.5 bg-purple-200 rounded-full animate-pulse opacity-70"></div>
                </div>
              </a>
            {/if}

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
    </section>
  {/if}
  
  <!-- Footer Card -->
  <footer class="mt-8 py-6">
    <div class="max-w-md mx-auto">
      <div class="bg-gradient-to-br from-gray-50 to-slate-100 hover:from-gray-100 hover:to-slate-200 border-2 border-gray-200 hover:border-gray-300 rounded-2xl p-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg">
        <div class="text-center space-y-3">
          <!-- Buttons -->
          <div class="flex justify-center items-center gap-3 mb-2" class:flex-row-reverse={$language === 'ar'}>
            <button
              on:click={() => window.open('/terms-conditions', '_blank')}
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              {$language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </button>
            <span class="text-gray-400">•</span>
            <button
              on:click={() => window.open('/privacy-policy', '_blank')}
              class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              {$language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </button>
          </div>
          <!-- Copyright -->
          <p class="text-xs text-gray-600">
            © 2025 Urban Loyalty. All rights reserved.
          </p>
        </div>
      </div>
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
  
  /* Ocean Wave Theme Animations */
  @keyframes shimmer {
    0% {
      transform: translateX(-100%) skewX(-12deg);
    }
    100% {
      transform: translateX(200%) skewX(-12deg);
    }
  }
  
  .animate-shimmer {
    animation: shimmer 3s infinite;
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  @keyframes wave {
    0%, 100% {
      transform: translateX(0%);
    }
    50% {
      transform: translateX(-25%);
    }
  }
  
  .animate-wave {
    animation: wave 4s ease-in-out infinite;
  }
</style>