<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let isLoading = false;
  let error = '';
  let selectedDateRange = '30days';
  let selectedBranch = '';
  let branches: any[] = [];

  // Analytics data
  let totalCustomers = 0;
  let totalTransactions = 0;
  let totalRevenue = 0;
  let totalPointsIssued = 0;
  let totalPointsRedeemed = 0;
  let activeCustomers = 0;
  let newCustomersThisPeriod = 0;
  let averageOrderValue = 0;

  // Card type distribution
  let cardTypeStats: any[] = [];
  
  // Branch performance
  let branchStats: any[] = [];
  
  // Customer growth data
  let customerGrowthData: any[] = [];
  
  // Recent activities
  let recentTransactions: any[] = [];
  let recentRegistrations: any[] = [];

  // Chart data
  let revenueChartData: any[] = [];
  let pointsChartData: any[] = [];

  onMount(() => {
    loadBranches();
    loadAnalytics();
  });

  async function loadBranches() {
    try {
      const { data, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .order('name_en');

      if (branchError) throw branchError;
      branches = data || [];
    } catch (err: any) {
      error = `Failed to load branches: ${err.message}`;
    }
  }

  async function loadAnalytics() {
    try {
      isLoading = true;
      const dateFilter = getDateFilter();

      // Load all analytics data in parallel
      await Promise.all([
        loadOverviewStats(dateFilter),
        loadCardTypeStats(),
        loadBranchStats(dateFilter),
        loadCustomerGrowth(dateFilter),
        loadRecentActivities(),
        loadChartData(dateFilter)
      ]);

    } catch (err: any) {
      error = `Failed to load analytics: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function getDateFilter() {
    const now = new Date();
    let startDate: Date;

    switch (selectedDateRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return startDate.toISOString().split('T')[0];
  }

  async function loadOverviewStats(dateFilter: string) {
    try {
      // Total customers
      let customerQuery = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      if (selectedBranch) {
        customerQuery = customerQuery.eq('branch_id', selectedBranch);
      }

      const { count: totalCustomersCount } = await customerQuery;
      totalCustomers = totalCustomersCount || 0;

      // New customers in period
      let newCustomerQuery = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dateFilter);
      
      if (selectedBranch) {
        newCustomerQuery = newCustomerQuery.eq('branch_id', selectedBranch);
      }

      const { count: newCustomersCount } = await newCustomerQuery;
      newCustomersThisPeriod = newCustomersCount || 0;

      // Transactions and revenue
      let transactionQuery = supabase
        .from('transactions')
        .select('bill_amount, add_amt, redeem')
        .gte('bill_date', dateFilter);
      
      if (selectedBranch) {
        transactionQuery = transactionQuery.eq('branch_id', selectedBranch);
      }

      const { data: transactionData } = await transactionQuery;
      
      if (transactionData) {
        totalTransactions = transactionData.length;
        totalRevenue = transactionData.reduce((sum, t) => sum + (t.bill_amount || 0), 0);
        totalPointsIssued = transactionData.reduce((sum, t) => sum + (t.add_amt || 0), 0);
        totalPointsRedeemed = transactionData.reduce((sum, t) => sum + (t.redeem || 0), 0);
        averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      }

      // Active customers (customers with transactions in period)
      let activeCustomerQuery = supabase
        .from('transactions')
        .select('customer', { count: 'exact' })
        .gte('bill_date', dateFilter);
      
      if (selectedBranch) {
        activeCustomerQuery = activeCustomerQuery.eq('branch_id', selectedBranch);
      }

      const { data: activeCustomerData } = await activeCustomerQuery;
      activeCustomers = activeCustomerData ? new Set(activeCustomerData.map(t => t.customer)).size : 0;

    } catch (err: any) {
      console.error('Error loading overview stats:', err);
    }
  }

  async function loadCardTypeStats() {
    try {
      let query = supabase
        .from('customers')
        .select(`
          card_types(name_en, color),
          points
        `);
      
      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data } = await query;

      if (data) {
        const stats = data.reduce((acc: any, customer: any) => {
          const cardType = customer.card_types?.name_en || 'No Card';
          const color = customer.card_types?.color || '#gray';
          
          if (!acc[cardType]) {
            acc[cardType] = {
              name: cardType,
              color: color,
              count: 0,
              totalPoints: 0
            };
          }
          
          acc[cardType].count++;
          acc[cardType].totalPoints += customer.points || 0;
          
          return acc;
        }, {});

        cardTypeStats = Object.values(stats);
      }
    } catch (err: any) {
      console.error('Error loading card type stats:', err);
    }
  }

  async function loadBranchStats(dateFilter: string) {
    try {
      if (selectedBranch) {
        branchStats = [];
        return;
      }

      const { data } = await supabase
        .from('branches')
        .select(`
          *,
          customers(count),
          transactions!inner(bill_amount, bill_date)
        `);

      if (data) {
        branchStats = data.map(branch => {
          const recentTransactions = branch.transactions.filter(
            (t: any) => t.bill_date >= dateFilter
          );
          
          return {
            name: branch.name_en,
            customers: branch.customers.length,
            transactions: recentTransactions.length,
            revenue: recentTransactions.reduce((sum: number, t: any) => sum + (t.bill_amount || 0), 0)
          };
        });
      }
    } catch (err: any) {
      console.error('Error loading branch stats:', err);
    }
  }

  async function loadCustomerGrowth(dateFilter: string) {
    try {
      let query = supabase
        .from('customers')
        .select('created_at')
        .gte('created_at', dateFilter)
        .order('created_at');
      
      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data } = await query;

      if (data) {
        // Group by date
        const growth = data.reduce((acc: any, customer: any) => {
          const date = new Date(customer.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        customerGrowthData = Object.entries(growth).map(([date, count]) => ({
          date,
          count
        }));
      }
    } catch (err: any) {
      console.error('Error loading customer growth:', err);
    }
  }

  async function loadRecentActivities() {
    try {
      // Recent transactions
      let transactionQuery = supabase
        .from('transactions')
        .select(`
          *,
          customers(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (selectedBranch) {
        transactionQuery = transactionQuery.eq('branch_id', selectedBranch);
      }

      const { data: transactions } = await transactionQuery;
      recentTransactions = transactions || [];

      // Recent registrations
      let registrationQuery = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (selectedBranch) {
        registrationQuery = registrationQuery.eq('branch_id', selectedBranch);
      }

      const { data: registrations } = await registrationQuery;
      recentRegistrations = registrations || [];

    } catch (err: any) {
      console.error('Error loading recent activities:', err);
    }
  }

  async function loadChartData(dateFilter: string) {
    try {
      let query = supabase
        .from('transactions')
        .select('bill_date, bill_amount, add_amt, redeem')
        .gte('bill_date', dateFilter)
        .order('bill_date');
      
      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data } = await query;

      if (data) {
        // Group by date for charts
        const chartData = data.reduce((acc: any, transaction: any) => {
          const date = transaction.bill_date;
          
          if (!acc[date]) {
            acc[date] = {
              date,
              revenue: 0,
              pointsIssued: 0,
              pointsRedeemed: 0
            };
          }
          
          acc[date].revenue += transaction.bill_amount || 0;
          acc[date].pointsIssued += transaction.add_amt || 0;
          acc[date].pointsRedeemed += transaction.redeem || 0;
          
          return acc;
        }, {});

        const chartArray = Object.values(chartData);
        revenueChartData = chartArray;
        pointsChartData = chartArray;
      }
    } catch (err: any) {
      console.error('Error loading chart data:', err);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount).replace('SAR', '﷼');
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  function exportData() {
    // Implementation for exporting analytics data
    const dataToExport = {
      overview: {
        totalCustomers,
        totalTransactions,
        totalRevenue,
        totalPointsIssued,
        totalPointsRedeemed,
        activeCustomers,
        newCustomersThisPeriod,
        averageOrderValue
      },
      cardTypeStats,
      branchStats,
      dateRange: selectedDateRange,
      branch: selectedBranch,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  $: {
    if (selectedDateRange || selectedBranch) {
      loadAnalytics();
    }
  }
</script>

<div class="p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
          <p class="text-gray-600">Comprehensive analytics and insights for your loyalty program.</p>
        </div>
        <button
          on:click={exportData}
          class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          📊 Export Data
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex flex-wrap gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <select
            bind:value={selectedDateRange}
            class="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <select
            bind:value={selectedBranch}
            class="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {#each branches as branch}
              <option value={branch.id}>{branch.name_en}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    {#if isLoading}
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-2">Loading analytics...</p>
      </div>
    {:else}
      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-3xl text-blue-600 mr-4">👥</div>
            <div>
              <p class="text-sm font-medium text-gray-500">Total Customers</p>
              <p class="text-2xl font-bold text-gray-900">{formatNumber(totalCustomers)}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-3xl text-green-600 mr-4">💰</div>
            <div>
              <p class="text-sm font-medium text-gray-500">Total Revenue</p>
              <p class="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-3xl text-purple-600 mr-4">🛒</div>
            <div>
              <p class="text-sm font-medium text-gray-500">Total Transactions</p>
              <p class="text-2xl font-bold text-gray-900">{formatNumber(totalTransactions)}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-3xl text-orange-600 mr-4">⭐</div>
            <div>
              <p class="text-sm font-medium text-gray-500">Points Issued</p>
              <p class="text-2xl font-bold text-gray-900">{formatNumber(totalPointsIssued)}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-3xl text-red-600 mr-4">🎁</div>
            <div>
              <p class="text-sm font-medium text-gray-500">Points Redeemed</p>
              <p class="text-2xl font-bold text-gray-900">{formatNumber(totalPointsRedeemed)}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-3xl text-teal-600 mr-4">🔥</div>
            <div>
              <p class="text-sm font-medium text-gray-500">Active Customers</p>
              <p class="text-2xl font-bold text-gray-900">{formatNumber(activeCustomers)}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-3xl text-indigo-600 mr-4">📈</div>
            <div>
              <p class="text-sm font-medium text-gray-500">New Customers</p>
              <p class="text-2xl font-bold text-gray-900">{formatNumber(newCustomersThisPeriod)}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="text-3xl text-pink-600 mr-4">💳</div>
            <div>
              <p class="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p class="text-2xl font-bold text-gray-900">{formatCurrency(averageOrderValue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Card Type Distribution -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">Card Type Distribution</h3>
          <div class="space-y-4">
            {#each cardTypeStats as cardType}
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-4 h-4 rounded-full mr-3" style="background-color: {cardType.color}"></div>
                  <span class="font-medium">{cardType.name}</span>
                </div>
                <div class="text-right">
                  <div class="font-bold">{cardType.count}</div>
                  <div class="text-sm text-gray-500">{formatNumber(cardType.totalPoints)} pts</div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Branch Performance -->
        {#if !selectedBranch}
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Branch Performance</h3>
            <div class="space-y-4">
              {#each branchStats as branch}
                <div class="border-l-4 border-blue-400 pl-4">
                  <div class="font-medium">{branch.name}</div>
                  <div class="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span class="font-medium">{branch.customers}</span>
                      <span>customers</span>
                    </div>
                    <div>
                      <span class="font-medium">{branch.transactions}</span>
                      <span>transactions</span>
                    </div>
                    <div>
                      <span class="font-medium">{formatCurrency(branch.revenue)}</span>
                      <span>revenue</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Recent Activities -->
        <div class="bg-white rounded-lg shadow p-6 {selectedBranch ? 'lg:col-span-1' : ''}">
          <h3 class="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div class="space-y-3">
            {#each recentTransactions.slice(0, 5) as transaction}
              <div class="flex justify-between items-center text-sm">
                <div>
                  <div class="font-medium">{transaction.customers?.name || 'Unknown'}</div>
                  <div class="text-gray-500">Bill #{transaction.bill_no}</div>
                </div>
                <div class="text-right">
                  <div class="font-medium">{formatCurrency(transaction.bill_amount)}</div>
                  <div class="text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Recent Registrations -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">Recent Registrations</h3>
          <div class="space-y-3">
            {#each recentRegistrations.slice(0, 5) as customer}
              <div class="flex justify-between items-center text-sm">
                <div>
                  <div class="font-medium">{customer.name}</div>
                  <div class="text-gray-500 font-mono">{customer.customer}</div>
                </div>
                <div class="text-right">
                  <div class="font-medium">{customer.points} pts</div>
                  <div class="text-gray-500">{new Date(customer.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Customer Growth Chart -->
      {#if customerGrowthData.length > 0}
        <div class="bg-white rounded-lg shadow p-6 mb-8">
          <h3 class="text-lg font-semibold mb-4">Customer Growth</h3>
          <div class="h-64 flex items-end space-x-2">
            {#each customerGrowthData as dataPoint}
              <div class="flex flex-col items-center">
                <div 
                  class="bg-blue-500 rounded-t"
                  style="height: {(dataPoint.count / Math.max(...customerGrowthData.map(d => d.count))) * 200}px; width: 20px;"
                ></div>
                <div class="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                  {new Date(dataPoint.date).toLocaleDateString()}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}

    <!-- Messages -->
    {#if error}
      <div class="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
        {error}
      </div>
    {/if}
  </div>
</div>
