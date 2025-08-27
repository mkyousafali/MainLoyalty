<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let isLoading = true;
  let dateRange = 'last-7-days';
  let reportData = {
    totalSpins: 0,
    totalPrizes: 0,
    uniqueUsers: 0,
    avgPrizeValue: 0,
    topCategories: [],
    dailyStats: [],
    topWinners: [],
    conversionRate: 0
  };
  let customStartDate = '';
  let customEndDate = '';
  
  onMount(() => {
    checkAdminAuth();
    loadReportData();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadReportData() {
    isLoading = true;
    try {
      // This would connect to your database to generate reports
      // For now, showing placeholder data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      reportData = {
        totalSpins: 2847,
        totalPrizes: 35680,
        uniqueUsers: 1205,
        avgPrizeValue: 12.5,
        conversionRate: 85.2,
        topCategories: [
          { name: 'Discount Coupon', spins: 1240, percentage: 43.6, total_value: 15500 },
          { name: 'Cash Prize', spins: 890, percentage: 31.3, total_value: 12400 },
          { name: 'Loyalty Points', spins: 517, percentage: 18.2, total_value: 6200 },
          { name: 'Free Product', spins: 200, percentage: 7.0, total_value: 1580 }
        ],
        dailyStats: [
          { date: '2024-01-08', spins: 145, prizes: 1820, users: 67 },
          { date: '2024-01-09', spins: 198, prizes: 2450, users: 89 },
          { date: '2024-01-10', spins: 167, prizes: 2100, users: 74 },
          { date: '2024-01-11', spins: 203, prizes: 2680, users: 95 },
          { date: '2024-01-12', spins: 189, prizes: 2340, users: 82 },
          { date: '2024-01-13', spins: 223, prizes: 2890, users: 108 },
          { date: '2024-01-14', spins: 234, prizes: 3100, users: 115 }
        ],
        topWinners: [
          { customer_code: 'CUST001', customer_name: 'John Doe', total_winnings: 450, spin_count: 8 },
          { customer_code: 'CUST045', customer_name: 'Jane Smith', total_winnings: 380, spin_count: 6 },
          { customer_code: 'CUST089', customer_name: 'Mike Johnson', total_winnings: 320, spin_count: 7 },
          { customer_code: 'CUST123', customer_name: 'Sarah Wilson', total_winnings: 290, spin_count: 5 },
          { customer_code: 'CUST156', customer_name: 'David Brown', total_winnings: 275, spin_count: 9 }
        ]
      };
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function handleDateRangeChange() {
    loadReportData();
  }
  
  function exportReport(format: string) {
    console.log(`Exporting report in ${format} format...`);
    // Implement export functionality
    alert(`Report export in ${format} format would be implemented here.`);
  }
  
  function formatCurrency(amount: number) {
    return `¤${amount.toLocaleString()}`;
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Analytics & Reports - Lucky Wheel Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            📊 Analytics & Reports
          </h1>
          <p class="text-gray-600 mt-2">Detailed insights and performance metrics</p>
        </div>
        
        <!-- Date Range Selector -->
        <div class="flex items-center space-x-4">
          <select 
            bind:value={dateRange} 
            on:change={handleDateRangeChange}
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last-7-days">Last 7 Days</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
          
          <div class="flex space-x-2">
            <button 
              on:click={() => exportReport('pdf')}
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              📄 PDF
            </button>
            <button 
              on:click={() => exportReport('excel')}
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              📊 Excel
            </button>
          </div>
        </div>
      </div>
      
      {#if dateRange === 'custom'}
        <div class="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input 
              type="date" 
              bind:value={customStartDate}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input 
              type="date" 
              bind:value={customEndDate}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      {/if}
    </div>

    {#if isLoading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    {:else}
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-white text-lg font-semibold">Total Spins</h3>
              <p class="text-white text-3xl font-bold">{reportData.totalSpins.toLocaleString()}</p>
            </div>
            <div class="text-white text-4xl opacity-80">🎯</div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-white text-lg font-semibold">Total Prizes</h3>
              <p class="text-white text-3xl font-bold">{formatCurrency(reportData.totalPrizes)}</p>
            </div>
            <div class="text-white text-4xl opacity-80">💰</div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-white text-lg font-semibold">Unique Users</h3>
              <p class="text-white text-3xl font-bold">{reportData.uniqueUsers.toLocaleString()}</p>
            </div>
            <div class="text-white text-4xl opacity-80">👥</div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-white text-lg font-semibold">Avg Prize</h3>
              <p class="text-white text-3xl font-bold">{formatCurrency(reportData.avgPrizeValue)}</p>
            </div>
            <div class="text-white text-4xl opacity-80">📈</div>
          </div>
        </div>
      </div>
      
      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Daily Performance Chart -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Daily Performance</h2>
          <div class="h-64 flex items-end justify-between space-x-2">
            {#each reportData.dailyStats as day, index}
              {@const maxValue = Math.max(...reportData.dailyStats.map(d => d.spins))}
              {@const height = (day.spins / maxValue) * 100}
              <div class="flex-1 flex flex-col items-center">
                <div 
                  class="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all hover:from-purple-600 hover:to-purple-500"
                  style="height: {height}%"
                  title="Spins: {day.spins}, Prizes: {formatCurrency(day.prizes)}"
                ></div>
                <div class="text-xs text-gray-500 mt-2 transform -rotate-45">
                  {formatDate(day.date)}
                </div>
              </div>
            {/each}
          </div>
          <div class="mt-4 text-center">
            <span class="text-sm text-gray-500">Hover bars for details</span>
          </div>
        </div>
        
        <!-- Prize Categories Distribution -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Prize Categories</h2>
          <div class="space-y-4">
            {#each reportData.topCategories as category}
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">{category.name}</span>
                    <span class="text-sm text-gray-500">{category.percentage}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                      style="width: {category.percentage}%"
                    ></div>
                  </div>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-xs text-gray-500">{category.spins} spins</span>
                    <span class="text-xs text-gray-500">{formatCurrency(category.total_value)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Bottom Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Winners -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">🏆 Top Winners</h2>
          <div class="space-y-3">
            {#each reportData.topWinners as winner, index}
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">{winner.customer_name}</div>
                    <div class="text-sm text-gray-500">{winner.customer_code}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-green-600">{formatCurrency(winner.total_winnings)}</div>
                  <div class="text-sm text-gray-500">{winner.spin_count} spins</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
        
        <!-- Additional Metrics -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">📋 Additional Metrics</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span class="text-gray-700">Conversion Rate</span>
              <span class="font-bold text-green-600">{reportData.conversionRate}%</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span class="text-gray-700">Spins per User</span>
              <span class="font-bold text-blue-600">{(reportData.totalSpins / reportData.uniqueUsers).toFixed(1)}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span class="text-gray-700">Prize Distribution Rate</span>
              <span class="font-bold text-purple-600">{((reportData.totalSpins / reportData.totalSpins) * 100).toFixed(1)}%</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span class="text-gray-700">Avg Session Duration</span>
              <span class="font-bold text-orange-600">4.2 min</span>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
