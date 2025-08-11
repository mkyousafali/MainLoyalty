<script lang="ts">
  import { onMount } from 'svelte';
  import { getCardTypeGradient } from '$lib/stores/cardTypes';
  import { supabase } from '$lib/supabase';
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { language, t } from '$lib/stores/language';
  import { formatCurrency, formatCurrencyText } from '$lib/formatCurrency';

  let selectedBranch = 'all';
  let customerData: any = null;
  let cardTypeData: any = null;
  let branches: any[] = [];
  let transactions: any[] = [];
  let allTransactions: any[] = []; // Store all transactions for filtering
  let isLoading = true;
  let error = '';

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

      const { data: transactionsData, error: transactionsError } = await query.limit(5);

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

      // Load customer transactions (only latest 5 for dashboard, sorted by newest first)
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
        .limit(5);

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



<!-- Dashboard Widgets -->
<main class="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto mt-4 sm:mt-6 md:mt-8">
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
    <!-- Main Widgets - Mobile-First Responsive Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
      <!-- Points Widget with Premium Brand Design -->
      <div class="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300" style="box-shadow: 0 4px 20px rgba(240, 131, 0, 0.1);">
        
        <!-- Mobile-Optimized Points Display -->
        <div class="text-center mb-6 md:mb-8">
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-8">
            <!-- Current Points - Mobile Responsive Card -->
            <div class="relative group w-full sm:w-auto">
              <!-- Animated background glow -->
              <div class="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 animate-pulse"></div>
              
              <!-- Main card - Responsive sizing -->
              <div class="relative w-full sm:w-32 md:w-36 h-32 sm:h-36 md:h-44 rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, rgba(19, 165, 56, 0.9) 0%, rgba(119, 171, 57, 0.9) 100%); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
                <!-- Holographic grid pattern -->
                <div class="absolute inset-0 opacity-10" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px);"></div>
                
                <!-- Animated corner accents - Responsive -->
                <div class="absolute top-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-l-2 border-white opacity-50"></div>
                <div class="absolute top-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-r-2 border-white opacity-50"></div>
                <div class="absolute bottom-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-l-2 border-white opacity-50"></div>
                <div class="absolute bottom-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-r-2 border-white opacity-50"></div>
                
                <!-- Content - Responsive -->
                <div class="relative z-10 h-full flex flex-col justify-center items-center p-3 sm:p-4">
                  <!-- LED-style indicator -->
                  <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 shadow-lg animate-pulse mb-1 sm:mb-2" style="box-shadow: 0 0 10px #00ffff;"></div>
                  
                  <!-- Number display - Responsive text -->
                  <div class="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 font-mono tracking-wider" style="text-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 10px rgba(19,165,56,0.8);">
                    {isLoading ? '...' : currentBalance.toFixed(2)}
                  </div>
                  
                  <!-- Label with futuristic styling - Responsive -->
                  <div class="text-xs sm:text-xs text-white uppercase tracking-widest font-bold opacity-90 px-2 py-1 rounded border border-white border-opacity-30" style="background: rgba(255,255,255,0.1); text-shadow: 0 0 10px rgba(255,255,255,0.8);">
                    {$language === 'ar' ? 'الحالي' : 'CURRENT'}
                  </div>
                  
                  <!-- Scanning line animation -->
                  <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                </div>
                
                <!-- Holographic shimmer effect -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 animate-pulse"></div>
              </div>
            </div>
            
            <!-- Lifetime Points - Mobile Responsive Card -->
            <div class="relative group w-full sm:w-auto">
              <!-- Animated background glow -->
              <div class="absolute -inset-1 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 animate-pulse"></div>
              
              <!-- Main card - Responsive sizing -->
              <div class="relative w-full sm:w-32 md:w-36 h-32 sm:h-36 md:h-44 rounded-2xl overflow-hidden" style="background: linear-gradient(135deg, rgba(240, 131, 0, 0.9) 0%, rgba(255, 149, 0, 0.9) 100%); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
                <!-- Holographic grid pattern -->
                <div class="absolute inset-0 opacity-10" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px);"></div>
                
                <!-- Animated corner accents - Responsive -->
                <div class="absolute top-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-l-2 border-white opacity-50"></div>
                <div class="absolute top-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-r-2 border-white opacity-50"></div>
                <div class="absolute bottom-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-l-2 border-white opacity-50"></div>
                <div class="absolute bottom-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-r-2 border-white opacity-50"></div>
                
                <!-- Content - Responsive -->
                <div class="relative z-10 h-full flex flex-col justify-center items-center p-3 sm:p-4">
                  <!-- LED-style indicator -->
                  <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400 shadow-lg animate-pulse mb-1 sm:mb-2" style="box-shadow: 0 0 10px #ffff00;"></div>
                  
                  <!-- Number display - Responsive text -->
                  <div class="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 font-mono tracking-wider" style="text-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 10px rgba(240,131,0,0.8);">
                    {isLoading ? '...' : lifetimeEarned.toFixed(2)}
                  </div>
                  
                  <!-- Label with futuristic styling - Responsive -->
                  <div class="text-xs sm:text-xs text-white uppercase tracking-widest font-bold opacity-90 px-2 py-1 rounded border border-white border-opacity-30" style="background: rgba(255,255,255,0.1); text-shadow: 0 0 10px rgba(255,255,255,0.8);">
                    {$language === 'ar' ? 'مدى الحياة' : 'LIFETIME'}
                  </div>
                  
                  <!-- Scanning line animation -->
                  <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
                </div>
                
                <!-- Holographic shimmer effect -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <!-- Mobile-Optimized Description Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-center">
            <div class="relative group">
              <!-- Glow background -->
              <div class="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              
              <!-- Card content - Mobile responsive padding -->
              <div class="relative p-3 sm:p-4 rounded-xl border border-emerald-500 border-opacity-30" style="background: linear-gradient(135deg, rgba(19, 165, 56, 0.1) 0%, rgba(119, 171, 57, 0.1) 100%); backdrop-filter: blur(5px);">
                <!-- LED indicator -->
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 mx-auto mb-1 sm:mb-2 animate-pulse" style="box-shadow: 0 0 8px #10b981;"></div>
                
                <h3 class="text-base sm:text-lg font-bold mb-1 sm:mb-2" style="color: #13A538; text-shadow: 0 0 10px rgba(19, 165, 56, 0.5);">
                  {$t.yourBalance}
                </h3>
                <p class="text-gray-600 text-xs sm:text-sm font-mono opacity-80">
                  {selectedBranch === 'all' ? 
                    $t.totalAvailable : 
                    ($language === 'ar' ? 
                      (branches.find(b => b.id.toString() === selectedBranch)?.name_ar || branches.find(b => b.id.toString() === selectedBranch)?.name_en || 'Selected Branch') : 
                      (branches.find(b => b.id.toString() === selectedBranch)?.name_en || branches.find(b => b.id.toString() === selectedBranch)?.name || 'Selected Branch'))}
                </p>
              </div>
            </div>
            
            <div class="relative group">
              <!-- Glow background -->
              <div class="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              
              <!-- Card content - Mobile responsive padding -->
              <div class="relative p-3 sm:p-4 rounded-xl border border-orange-500 border-opacity-30" style="background: linear-gradient(135deg, rgba(240, 131, 0, 0.1) 0%, rgba(255, 149, 0, 0.1) 100%); backdrop-filter: blur(5px);">
                <!-- LED indicator -->
                <div class="w-1.5 h-1.5 rounded-full bg-orange-400 mx-auto mb-1 sm:mb-2 animate-pulse" style="box-shadow: 0 0 8px #f97316;"></div>
                
                <h3 class="text-base sm:text-lg font-bold mb-1 sm:mb-2" style="color: #f08300; text-shadow: 0 0 10px rgba(240, 131, 0, 0.5);">
                  {$t.lifetimeEarned}
                </h3>
                <p class="text-gray-600 text-xs sm:text-sm font-mono opacity-80">
                  {selectedBranch === 'all' ? 
                    $t.totalAmountEarned : 
                    ($language === 'ar' ? 
                      (branches.find(b => b.id.toString() === selectedBranch)?.name_ar || branches.find(b => b.id.toString() === selectedBranch)?.name_en || 'Selected Branch') : 
                      (branches.find(b => b.id.toString() === selectedBranch)?.name_en || branches.find(b => b.id.toString() === selectedBranch)?.name || 'Selected Branch'))}
                </p>
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

      <!-- Quick Actions Widget -->
      <div class="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
        <h3 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center" style="color: #13A538;">
          {$t.quickActions}
        </h3>
        
        <div class="space-y-3 sm:space-y-4">
          <!-- Virtual Card Button -->
          <a href="/virtual-card" class="block">
            <div class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-300 hover:shadow-md transform hover:scale-[1.02] cursor-pointer" style="background: linear-gradient(135deg, #f08300 0%, #ff9500 100%); color: white;">
              <div class="text-2xl sm:text-3xl">💳</div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-base sm:text-lg truncate">{$t.virtualCard}</h4>
                <p class="text-orange-100 text-xs sm:text-sm truncate">{$t.viewYourCard}</p>
              </div>
              <div class="text-xl sm:text-2xl opacity-70 flex-shrink-0">→</div>
            </div>
          </a>

          <!-- Customer Support Button -->
          <a href="/customer-support" class="block">
            <div class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-300 hover:shadow-md transform hover:scale-[1.02] cursor-pointer" style="background: linear-gradient(135deg, #13A538 0%, #77AB39 100%); color: white;" class:flex-row-reverse={$language === 'ar'}>
              <div class="text-2xl sm:text-3xl">💬</div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-base sm:text-lg truncate">{$t.customerSupport}</h4>
                <p class="text-green-100 text-xs sm:text-sm truncate">{$t.needHelp}</p>
              </div>
              <div class="text-xl sm:text-2xl opacity-70 flex-shrink-0">→</div>
            </div>
          </a>

          <!-- My Offers Button -->
          <a href="/my-offers" class="block">
            <div class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-300 hover:shadow-md transform hover:scale-[1.02] cursor-pointer" style="background: linear-gradient(135deg, #C0A32A 0%, #D4B836 100%); color: white;" class:flex-row-reverse={$language === 'ar'}>
              <div class="text-2xl sm:text-3xl">🎁</div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-base sm:text-lg truncate">{$t.myOffers}</h4>
                <p class="text-yellow-100 text-xs sm:text-sm truncate">{$t.viewSpecialOffers}</p>
              </div>
              <div class="text-xl sm:text-2xl opacity-70 flex-shrink-0">→</div>
            </div>
          </a>
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
            {$t.redemptionConditions || 'Point Redemption Conditions'}
          </h3>
          <p class="text-gray-600 text-xs sm:text-sm">
            {$t.redemptionRules || 'Important rules for using your points'}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <!-- Redemption Values -->
        <div class="space-y-3 sm:space-y-4">
          <h4 class="font-bold text-base sm:text-lg" style="color: #13A538;">
            {$t.allowedRedemptions || 'Allowed Redemption Values'}
          </h4>
          <div class="grid grid-cols-2 gap-2 sm:gap-3">
            {#each [50, 100, 150, 200] as points}
              <div class="flex items-center justify-between p-2 sm:p-3 rounded-lg border-2" style="border-color: #77AB39; background: #F3FFF8;">
                <span class="font-bold text-base sm:text-lg" style="color: #13A538;">{points}</span>
                <span class="text-xs sm:text-sm text-gray-600">{$t.points || 'Points'}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Important Rules -->
        <div class="space-y-3 sm:space-y-4">
          <h4 class="font-bold text-base sm:text-lg" style="color: #f08300;">
            {$t.importantRules || 'Important Rules'}
          </h4>
          <div class="space-y-2 sm:space-y-3">
            <div class="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg" style="background: #FFF8F0; border: 1px solid #f08300;">
              <span class="text-base sm:text-lg flex-shrink-0">⚠️</span>
              <div class="flex-1 text-xs sm:text-sm min-w-0">
                <p class="font-medium text-gray-800">
                  {$t.noCustomValues || 'No Custom Values Allowed'}
                </p>
                <p class="text-gray-600 mt-1">
                  {$t.noCustomValuesDesc || 'Points can only be redeemed in the specified amounts: 50, 100, 150, or 200 points.'}
                </p>
              </div>
            </div>
            
            <div class="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg" style="background: #FFF8F0; border: 1px solid #f08300;">
              <span class="text-base sm:text-lg flex-shrink-0">💸</span>
              <div class="flex-1 text-xs sm:text-sm min-w-0">
                <p class="font-medium text-gray-800">
                  {$t.noCashExchange || 'No Cash Exchange'}
                </p>
                <p class="text-gray-600 mt-1">
                  {$t.noCashExchangeDesc || 'Points cannot be converted to cash. They can only be used for discounts on purchases.'}
                </p>
              </div>
            </div>

            <div class="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg" style="background: #F3FFF8; border: 1px solid #77AB39;">
              <span class="text-base sm:text-lg flex-shrink-0">✅</span>
              <div class="flex-1 text-xs sm:text-sm min-w-0">
                <p class="font-medium text-gray-800">
                  {$t.storeUseOnly || 'Store Use Only'}
                </p>
                <p class="text-gray-600 mt-1">
                  {$t.storeUseOnlyDesc || 'Points can be used for discounts on future purchases at Urban Market stores.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Support for Redemption - Mobile optimized -->
      <div class="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl text-center" style="background: linear-gradient(135deg, #EAFBEF 0%, #F3FFF8 100%); border: 2px solid #77AB39;">
        <p class="text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">
          <span class="font-bold" style="color: #13A538;">{$t.readyToRedeem || 'Ready to redeem your points?'}</span>
        </p>
        <p class="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          {$t.contactStoreStaff || 'Contact store staff during your next visit or reach out to customer support for assistance with point redemption.'}
        </p>
        <a href="/customer-support" class="inline-flex items-center gap-2 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm sm:text-base" style="background: #13A538;">
          <span class="text-base sm:text-xl">💬</span>
          <span>{$t.contactSupport || 'Contact Support'}</span>
        </a>
      </div>
    </section>
  {/if}
</main>


