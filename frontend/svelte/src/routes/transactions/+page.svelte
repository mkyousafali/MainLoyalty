<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  let currentLang: 'en' | 'ar' = 'en';
  let customerData: any = null;
  let transactions: any[] = [];
  let isLoading = true;
  let error = '';
  let selectedBranch = 'all';
  let branches: any[] = [];

  // Update language on mount
  onMount(() => {
    const savedLang = localStorage.getItem('selectedLanguage') as 'en' | 'ar';
    if (savedLang) {
      currentLang = savedLang;
    }
    loadTransactions();
  });

  // Simple translations object
  const translations = {
    en: {
      transactionHistory: 'Transaction History',
      filterByBranch: 'Filter by Branch',
      allBranches: 'All Branches',
      date: 'Date',
      branch: 'Branch',
      amount: 'Amount',
      status: 'Status',
      completed: 'Completed',
      noTransactions: 'No transactions found',
      startShopping: 'Start shopping to see your purchase history!'
    },
    ar: {
      transactionHistory: 'تاريخ المعاملات',
      filterByBranch: 'فلترة حسب الفرع',
      allBranches: 'جميع الفروع',
      date: 'التاريخ',
      branch: 'الفرع',
      amount: 'المبلغ',
      status: 'الحالة',
      completed: 'مكتمل',
      noTransactions: 'لا توجد معاملات',
      startShopping: 'ابدأ التسوق لرؤية تاريخ مشترياتك!'
    }
  } as const;

  $: t = translations[currentLang];

  // Load all customer transactions
  async function loadTransactions() {
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
      console.log('🔍 Transactions: Current user from localStorage:', currentUser);
      
      if (!currentUser.mobile) {
        error = 'No user found. Please login again.';
        console.log('❌ Transactions: No mobile found in localStorage');
        if (browser) {
          goto('/login');
        }
        return;
      }

      // Fetch customer data first
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_code', currentUser.mobile)
        .single();

      if (customerError || !customer) {
        console.error('❌ Transactions: Error fetching customer:', customerError);
        error = 'Customer not found. Please contact support.';
        return;
      }

      customerData = customer;

      // Load branches data
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (branchesError) {
        console.warn('⚠️ Transactions: Error fetching branches:', branchesError);
        branches = [];
      } else {
        branches = branchesData || [];
      }

      // Load all customer transactions
      console.log('🔍 Transactions: Fetching all transactions for customer_code:', customer.customer_code);
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('customer_transactions')
        .select(`
          *,
          branches (
            name,
            name_ar
          )
        `)
        .eq('customer_code', customer.customer_code)
        .order('bill_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.warn('⚠️ Transactions: Error fetching transactions:', transactionsError);
        transactions = [];
      } else {
        transactions = transactionsData || [];
        console.log('✅ Transactions: All transactions loaded:', transactions.length);
      }

    } catch (err) {
      console.error('💥 Transactions: Unexpected error:', err);
      error = `Unexpected error: ${err}`;
    } finally {
      isLoading = false;
    }
  }

  // Reactive branches based on language
  $: branchOptions = currentLang === 'ar' 
    ? [{ id: 'all', name: 'جميع الفروع' }, ...branches.map(b => ({ id: b.id, name: b.name_ar || b.name }))]
    : [{ id: 'all', name: 'All Branches' }, ...branches.map(b => ({ id: b.id, name: b.name }))];

  // Filter transactions by selected branch
  $: filteredTransactions = selectedBranch === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.branch_id === selectedBranch);

  // Format date helper
  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'N/A';
    }
  }

  // Format currency helper
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount).replace('SAR', '﷼');
  }
</script>

<svelte:head>
  <title>Transaction History - Urban Market Loyalty</title>
</svelte:head>

<div class="min-h-screen bg-[#f6f8fb] font-sans text-gray-800" class:rtl={currentLang === 'ar'}>
  <!-- Main Content -->
  <main class="p-6 max-w-6xl mx-auto">
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
          on:click={loadTransactions} 
          class="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    {:else}
      <!-- Filter Section -->
      <div class="bg-white rounded-xl shadow p-6 mb-6">
        <div class="flex items-center gap-4" class:flex-row-reverse={currentLang === 'ar'}>
          <label for="branch-filter" class="text-sm font-semibold whitespace-nowrap">
            {t.filterByBranch}:
          </label>
          <select 
            id="branch-filter" 
            bind:value={selectedBranch} 
            class="px-3 py-2 border rounded-lg bg-gray-50 min-w-48"
            class:text-right={currentLang === 'ar'}
          >
            {#each branchOptions as branch}
              <option value={branch.id}>{branch.name}</option>
            {/each}
          </select>
          <div class="text-sm text-gray-500 ml-auto" class:mr-auto={currentLang === 'ar'} class:ml-0={currentLang === 'ar'}>
            {filteredTransactions.length} {currentLang === 'ar' ? 'معاملة' : 'transactions'}
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white rounded-xl shadow">
        <div class="overflow-x-auto">
          <table class="w-full text-sm" class:text-left={currentLang === 'en'} class:text-right={currentLang === 'ar'}>
            <thead>
              <tr class="bg-gray-100 text-gray-600 font-semibold">
                <th class="p-4">{t.date}</th>
                <th class="p-4">{t.branch}</th>
                <th class="p-4">{t.amount}</th>
                <th class="p-4">{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {#if filteredTransactions.length > 0}
                {#each filteredTransactions as tx}
                  <tr class="border-b hover:bg-gray-50 transition-colors">
                    <td class="p-4 font-medium">{formatDate(tx.bill_date || tx.created_at)}</td>
                    <td class="p-4">
                      {currentLang === 'ar' ? (tx.branches?.name_ar || tx.branches?.name || 'N/A') : (tx.branches?.name || 'N/A')}
                    </td>
                    <td class="p-4 font-semibold text-gray-900" class:text-right={currentLang === 'en'} class:text-left={currentLang === 'ar'}>
                      {formatCurrency(tx.amount || 0)}
                    </td>
                    <td class="p-4">
                      <span class="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
                        {t.completed}
                      </span>
                    </td>
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td colspan="4" class="p-12 text-center text-gray-500">
                    <div class="flex flex-col items-center gap-3">
                      <span class="text-6xl">📋</span>
                      <p class="text-lg font-medium">{t.noTransactions}</p>
                      <p class="text-sm">{t.startShopping}</p>
                    </div>
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </main>
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
  
  /* Better table alignment for RTL */
  .rtl table {
    direction: rtl;
  }
  
  .rtl th, .rtl td {
    text-align: right;
  }
  
  /* Fix select dropdown in RTL */
  .rtl select {
    padding-right: 2.5rem;
    padding-left: 0.75rem;
  }
</style>
