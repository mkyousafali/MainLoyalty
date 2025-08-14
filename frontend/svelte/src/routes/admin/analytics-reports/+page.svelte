<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let isLoading = false;
  let error = '';
  let selectedDateRange = 'alltime';
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
      case 'alltime':
        // Return a date far in the past to get all records
        return '1900-01-01T00:00:00.000Z';
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

    return startDate.toISOString();
  }

  async function loadOverviewStats(dateFilter: string) {
    try {
      // DIRECT TEST: Check if ANY redeem data exists in the entire table
      console.log('🔍 DIRECT DATABASE TEST - Checking for ANY redeem data...');
      
      const { data: redeemTest, count: redeemCount } = await supabase
        .from('customer_transactions')
        .select('redeem, id, created_at', { count: 'exact' })
        .gt('redeem', 0)
        .limit(10);
        
      console.log('🔍 Records with redeem > 0:', {
        count: redeemCount,
        records: redeemTest
      });
      
      // Also check for negative redeem values (in case they're stored as negative)
      const { data: negativeRedeemTest, count: negativeRedeemCount } = await supabase
        .from('customer_transactions')
        .select('redeem, id, created_at', { count: 'exact' })
        .lt('redeem', 0)
        .limit(10);
        
      console.log('🔍 Records with redeem < 0:', {
        count: negativeRedeemCount,
        records: negativeRedeemTest
      });

      // SIMPLE BRUTE FORCE TEST - Get ALL redeem values and sum them
      console.log('🔍 BRUTE FORCE TEST - Getting ALL redeem values...');
      const { data: bruteForceRedeem } = await supabase
        .from('customer_transactions')
        .select('redeem')
        .range(0, 100000);
        
      if (bruteForceRedeem) {
        const bruteForceSum = bruteForceRedeem.reduce((sum, row) => {
          const val = parseFloat(row.redeem) || 0;
          return sum + Math.abs(val);
        }, 0);
        
        console.log('🔍 BRUTE FORCE RESULT:', {
          totalRecords: bruteForceRedeem.length,
          bruteForceSum,
          nonZeroCount: bruteForceRedeem.filter(r => r.redeem != 0).length,
          sampleNonZero: bruteForceRedeem.filter(r => r.redeem != 0).slice(0, 10)
        });
        
        // TEMPORARILY set this directly to test
        if (bruteForceSum > 0) {
          totalPointsRedeemed = bruteForceSum;
          console.log('🔍 SETTING totalPointsRedeemed directly to:', bruteForceSum);
        }
      }

      // Total customers from customer_numbers table
      const { count: totalCustomersCount } = await supabase
        .from('customer_numbers')
        .select('*', { count: 'exact', head: true });
      
      totalCustomers = totalCustomersCount || 0;

      // New customers who registered today (updated card_status to 'registered')
      let newCustomerQuery = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('card_status', 'registered');

      // For current date filter, check updated_at for when they became 'registered'
      if (dateFilter !== '1900-01-01T00:00:00.000Z') {
        newCustomerQuery = newCustomerQuery.gte('updated_at', dateFilter);
      }
      
      if (selectedBranch) {
        newCustomerQuery = newCustomerQuery.eq('branch_id', selectedBranch);
      }

      const { count: newCustomersCount } = await newCustomerQuery;
      newCustomersThisPeriod = newCustomersCount || 0;

      // Get total transaction count with date/branch filter
      let totalTransactionQuery = supabase
        .from('customer_transactions')
        .select('*', { count: 'exact', head: true });

      if (dateFilter !== '1900-01-01T00:00:00.000Z') {
        totalTransactionQuery = totalTransactionQuery.gte('created_at', dateFilter);
      }
      
      if (selectedBranch) {
        totalTransactionQuery = totalTransactionQuery.eq('branch_id', selectedBranch);
      }

      const { count: transactionCount } = await totalTransactionQuery;
      totalTransactions = transactionCount || 0;

      // Use multiple queries to get ACTUAL sums from the database (not limited by row fetch)
      console.log('🔍 Getting database totals with unlimited queries...');
      console.log('🔍 Date filter being used:', dateFilter);
      console.log('🔍 Branch filter being used:', selectedBranch);
      
      // First, let's check the total count and some sample data WITHOUT any filters
      const { data: unfiltered, count: unfilteredCount } = await supabase
        .from('customer_transactions')
        .select('redeem', { count: 'exact' })
        .range(0, 10);
      
      console.log('🔍 UNFILTERED sample data (first 10 records):', {
        totalCount: unfilteredCount,
        sampleData: unfiltered,
        nonZeroRedeems: unfiltered?.filter(r => r.redeem > 0).length || 0
      });
      
      // Now let's get ALL redeem values without any date/branch filters first
      const { data: allRedeemData } = await supabase
        .from('customer_transactions')
        .select('redeem')
        .range(0, 100000);
        
      console.log('🔍 ALL redeem data (no filters):', {
        totalRecords: allRedeemData?.length || 0,
        nonZeroCount: allRedeemData?.filter(r => r.redeem > 0).length || 0,
        totalSum: allRedeemData?.reduce((sum, r) => sum + (parseFloat(r.redeem) || 0), 0) || 0,
        sampleNonZero: allRedeemData?.filter(r => r.redeem > 0).slice(0, 5) || []
      });
      
      // Base query builder function
      const buildQuery = () => {
        let query = supabase
          .from('customer_transactions')
          .select('amount, add_amt, redeem')
          .range(0, 100000); // Get up to 100k records to ensure we get all data
          
        // Only apply date filter if it's NOT "All Time"
        if (dateFilter !== '1900-01-01T00:00:00.000Z') {
          console.log('🔍 Applying date filter:', dateFilter);
          query = query.gte('created_at', dateFilter);
        } else {
          console.log('🔍 Using ALL TIME - no date filter applied');
        }
        
        if (selectedBranch) {
          console.log('🔍 Applying branch filter:', selectedBranch);
          query = query.eq('branch_id', selectedBranch);
        } else {
          console.log('🔍 No branch filter - showing all branches');
        }
        
        return query;
      };

      // Get ALL records for calculation (this will bypass the default limit)
      const { data: allTransactionData } = await buildQuery();

      console.log('🔍 Database query results:', {
        totalRecords: allTransactionData?.length || 0,
        sampleRecord: allTransactionData?.[0],
        dateFilter,
        branchFilter: selectedBranch
      });
      
      // Calculate totals from ALL records (not limited to default 100)
      if (allTransactionData) {
        totalRevenue = allTransactionData.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
        totalPointsIssued = allTransactionData.reduce((sum, row) => sum + (parseFloat(row.add_amt) || 0), 0);
        
        // Use ONLY the redeem column directly - check both positive and negative values
        const positiveRedeems = allTransactionData.reduce((sum, row) => {
          const val = parseFloat(row.redeem) || 0;
          return val > 0 ? sum + val : sum;
        }, 0);
        
        const negativeRedeems = allTransactionData.reduce((sum, row) => {
          const val = parseFloat(row.redeem) || 0;
          return val < 0 ? sum + Math.abs(val) : sum;
        }, 0);
        
        // Use absolute values if redeem is stored as negative
        totalPointsRedeemed = positiveRedeems > 0 ? positiveRedeems : negativeRedeems;
        
        // Average Order Value = Total Revenue / Total Transactions  
        averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        // Find all non-zero redeem records for debugging
        const nonZeroRedeems = allTransactionData.filter(r => (parseFloat(r.redeem) || 0) > 0);

        console.log('📊 Final Calculated Totals (FILTERED results):', {
          totalRecords: allTransactionData.length,
          totalTransactions,
          totalRevenue,
          totalPointsIssued,
          positiveRedeems,
          negativeRedeems,
          totalPointsRedeemed_FromRedeemColumn: totalPointsRedeemed,
          averageOrderValue,
          nonZeroRedeems: nonZeroRedeems.length,
          nonZeroRedeemsSample: nonZeroRedeems.slice(0, 5),
          allPositiveRedeems: allTransactionData.filter(r => r.redeem > 0).map(r => r.redeem),
          allNegativeRedeems: allTransactionData.filter(r => r.redeem < 0).map(r => r.redeem)
        });
      }

      // Get Active Customers (unique customers from ALL transactions, not filtered by date)
      const { data: allCustomerData } = await supabase
        .from('customer_transactions')
        .select('customer_code, customer_id, customer_mobile')
        .range(0, 100000); // Get all records
      
      if (allCustomerData) {
        // Try different customer identifiers to find which one has data
        const customerCodes = new Set(allCustomerData.map(t => t.customer_code).filter(Boolean));
        const customerIds = new Set(allCustomerData.map(t => t.customer_id).filter(Boolean));
        const customerMobiles = new Set(allCustomerData.map(t => t.customer_mobile).filter(Boolean));
        
        // Use the identifier that has the most unique values
        const counts = [
          { name: 'customer_code', count: customerCodes.size },
          { name: 'customer_id', count: customerIds.size },
          { name: 'customer_mobile', count: customerMobiles.size }
        ];
        
        const bestIdentifier = counts.reduce((prev, current) => 
          current.count > prev.count ? current : prev
        );
        
        activeCustomers = bestIdentifier.count;
        
        console.log('📊 Debug - Active Customers Analysis:', {
          totalTransactionRecords: allCustomerData.length,
          customerIdentifiers: counts,
          bestIdentifier: bestIdentifier.name,
          finalActiveCustomers: activeCustomers,
          sampleData: allCustomerData.slice(0, 3).map(t => ({
            customer_code: t.customer_code,
            customer_id: t.customer_id,
            customer_mobile: t.customer_mobile
          }))
        });
      }

    } catch (err: any) {
      console.error('Error loading overview stats:', err);
      error = 'Failed to load analytics data';
    }
  }

  async function loadCardTypeStats() {
    try {
      let query = supabase
        .from('customers')
        .select('card_status, total_points');
      
      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data } = await query;

      if (data) {
        const stats = data.reduce((acc: any, customer: any) => {
          const cardType = customer.card_status || 'No Card';
          const colors: Record<string, string> = {
            'Bronze': '#CD7F32',
            'Silver': '#C0C0C0',
            'Gold': '#FFD700',
            'Platinum': '#E5E4E2',
            'No Card': '#6B7280'
          };
          const color = colors[cardType] || '#6B7280';
          
          if (!acc[cardType]) {
            acc[cardType] = {
              name: cardType,
              color: color,
              count: 0,
              totalPoints: 0
            };
          }
          
          acc[cardType].count++;
          acc[cardType].totalPoints += customer.total_points || 0;
          
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

      // Get branches
      const { data: branchesData } = await supabase
        .from('branches')
        .select('*');

      if (branchesData) {
        // For each branch, get stats from customer_transactions
        branchStats = await Promise.all(branchesData.map(async (branch) => {
          // Get customers count for this branch
          const { count: customersCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', branch.id);
          
          // Get transactions for this branch in the date range
          const { data: transactionsData } = await supabase
            .from('customer_transactions')
            .select('amount, created_at')
            .eq('branch_id', branch.id)
            .gte('created_at', dateFilter);
          
          const transactionCount = transactionsData?.length || 0;
          const revenue = transactionsData?.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0) || 0;
          
          return {
            name: branch.name_en || branch.name,
            customers: customersCount || 0,
            transactions: transactionCount,
            revenue: revenue
          };
        }));
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
      // Recent transactions from customer_transactions table
      let transactionQuery = supabase
        .from('customer_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (selectedBranch) {
        transactionQuery = transactionQuery.eq('branch_id', selectedBranch);
      }

      const { data: transactions } = await transactionQuery;
      recentTransactions = (transactions || []).map(t => ({
        ...t,
        customers: { name: t.customer_code || 'Unknown' }, // Fallback customer name
        bill_no: t.bill_no || t.id,
        bill_amount: Math.abs(parseFloat(t.amount) || 0)
      }));

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
        .from('customer_transactions')
        .select('created_at, amount, add_amt, redeem')
        .gte('created_at', dateFilter)
        .order('created_at');
      
      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data } = await query;

      if (data) {
        // Group by date for charts
        const chartData = data.reduce((acc: any, transaction: any) => {
          const date = new Date(transaction.created_at).toISOString().split('T')[0];
          
          if (!acc[date]) {
            acc[date] = {
              date,
              revenue: 0,
              pointsIssued: 0,
              pointsRedeemed: 0
            };
          }
          
          acc[date].revenue += Math.abs(parseFloat(transaction.amount) || 0);
          acc[date].pointsIssued += parseFloat(transaction.add_amt) || 0;
          acc[date].pointsRedeemed += parseFloat(transaction.redeem) || 0;
          
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
          <label for="date-range-select" class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <select
            id="date-range-select"
            bind:value={selectedDateRange}
            class="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="alltime">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
        
        <div>
          <label for="branch-select" class="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <select
            id="branch-select"
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
                  <div class="font-medium">{customer.full_name || customer.name || 'Unknown'}</div>
                  <div class="text-gray-500 font-mono">{customer.customer_code || customer.mobile || 'No ID'}</div>
                </div>
                <div class="text-right">
                  <div class="font-medium">{customer.total_points || customer.points || 0} pts</div>
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
