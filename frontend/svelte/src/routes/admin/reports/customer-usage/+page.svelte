<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../../../../lib/supabase';

  // State variables
  let isLoading = false;
  let error: string | null = null;
  let customers: any[] = [];
  let branches: any[] = [];
  let loadingProgress = '';
  
  // Filter states
  let dateFilter = 'this-month';
  let startDate = '';
  let endDate = '';
  let selectedBranch = 'all';
  let minTransactions = '';
  let sortBy = 'total_spent';
  let sortOrder = 'desc';

  // Analytics data
  let totalCustomers = 0;
  let activeCustomers = 0;
  let newCustomers = 0;
  let avgTransactionsPerCustomer = 0;
  let avgSpentPerCustomer = 0;
  let topSpenders: any[] = [];
  let engagementLevels = {
    high: 0,
    medium: 0,
    low: 0,
    inactive: 0
  };

  // Date filter options
  const dateFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'this-week', label: 'This Week' },
    { value: 'last-week', label: 'Last Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'this-quarter', label: 'This Quarter' },
    { value: 'this-year', label: 'This Year' },
    { value: 'custom', label: 'Custom Date Range' }
  ];

  const sortOptions = [
    { value: 'total_spent', label: 'Total Spent' },
    { value: 'total_transactions', label: 'Total Transactions' },
    { value: 'total_points', label: 'Total Points' },
    { value: 'last_activity', label: 'Last Activity' },
    { value: 'join_date', label: 'Join Date' }
  ];

  onMount(() => {
    loadBranches();
    loadCustomerUsageReport();
  });

  async function loadBranches() {
    try {
      const { data, error: branchError } = await supabase
        .from('branches')
        .select('id, name_en, name_ar, code')
        .eq('is_active', true)
        .order('name_en');

      if (branchError) throw branchError;
      branches = data || [];
    } catch (err: any) {
      console.error('Error loading branches:', err);
    }
  }

  async function loadCustomerUsageReport() {
    try {
      isLoading = true;
      error = null;
      loadingProgress = 'Loading customer data...';

      // Get date range
      const dateRange = getDateRange(dateFilter);
      let dateCondition = '';
      
      if (dateFilter !== 'all-time') {
        if (dateRange.start && dateRange.end) {
          dateCondition = `AND ct.bill_date >= '${dateRange.start}' AND ct.bill_date <= '${dateRange.end}'`;
        } else if (dateRange.start) {
          dateCondition = `AND ct.bill_date >= '${dateRange.start}'`;
        }
      }

      if (dateFilter === 'custom' && startDate && endDate) {
        dateCondition = `AND ct.bill_date >= '${startDate}' AND ct.bill_date <= '${endDate}'`;
      }

      // Branch filter
      let branchCondition = '';
      if (selectedBranch !== 'all') {
        branchCondition = `AND ct.branch_id = ${selectedBranch}`;
      }

      loadingProgress = 'Analyzing customer engagement...';

      // Main customer usage query with comprehensive analytics
      const { data: customerData, error: customerError } = await supabase.rpc('get_customer_usage_analytics', {
        date_condition: dateCondition,
        branch_condition: branchCondition,
        min_transactions: minTransactions ? parseInt(minTransactions) : 0
      });

      if (customerError) {
        console.log('RPC not available, using direct queries...');
        await loadCustomerDataDirect();
        return;
      }

      customers = customerData || [];
      calculateAnalytics();

    } catch (err: any) {
      console.log('Fallback to direct queries due to:', err.message);
      await loadCustomerDataDirect();
    } finally {
      isLoading = false;
      loadingProgress = '';
    }
  }

  async function loadCustomerDataDirect() {
    try {
      loadingProgress = 'Loading customer transactions...';

      // Get customers with transaction data
      let transactionQuery = supabase
        .from('customer_transactions')
        .select(`
          customer_code,
          customer_mobile,
          amount,
          add_amt,
          redeem,
          bill_date,
          branch_id,
          branches:branch_id (
            id,
            name_en,
            name_ar,
            code
          )
        `);

      // Apply date filter
      const dateRange = getDateRange(dateFilter);
      if (dateFilter !== 'all-time') {
        if (dateRange.start) {
          transactionQuery = transactionQuery.gte('bill_date', dateRange.start);
        }
        if (dateRange.end) {
          transactionQuery = transactionQuery.lte('bill_date', dateRange.end);
        }
      }

      if (dateFilter === 'custom' && startDate && endDate) {
        transactionQuery = transactionQuery.gte('bill_date', startDate).lte('bill_date', endDate);
      }

      // Apply branch filter
      if (selectedBranch !== 'all') {
        transactionQuery = transactionQuery.eq('branch_id', selectedBranch);
      }

      const { data: transactions, error: transError } = await transactionQuery
        .order('bill_date', { ascending: false });

      if (transError) throw transError;

      loadingProgress = 'Processing customer analytics...';

      // Group transactions by customer
      const customerMap = new Map();
      
      transactions?.forEach(transaction => {
        const key = transaction.customer_code || transaction.customer_mobile || 'unknown';
        
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            customer_code: transaction.customer_code,
            customer_mobile: transaction.customer_mobile,
            total_transactions: 0,
            total_spent: 0,
            total_points_earned: 0,
            total_points_redeemed: 0,
            last_activity: transaction.bill_date,
            first_activity: transaction.bill_date,
            branches: new Set(),
            transaction_dates: []
          });
        }

        const customer = customerMap.get(key);
        customer.total_transactions += 1;
        customer.total_spent += parseFloat(transaction.amount) || 0;
        customer.total_points_earned += parseFloat(transaction.add_amt) || 0;
        customer.total_points_redeemed += parseFloat(transaction.redeem) || 0;
        customer.transaction_dates.push(transaction.bill_date);
        
        if (transaction.bill_date > customer.last_activity) {
          customer.last_activity = transaction.bill_date;
        }
        if (transaction.bill_date < customer.first_activity) {
          customer.first_activity = transaction.bill_date;
        }
        
        if (transaction.branches) {
          customer.branches.add(transaction.branches.name_en || transaction.branches.code);
        }
      });

      // Convert to array and add calculated fields
      customers = Array.from(customerMap.values()).map(customer => ({
        ...customer,
        branches_visited: customer.branches.size,
        avg_transaction_value: customer.total_transactions > 0 ? customer.total_spent / customer.total_transactions : 0,
        days_active: calculateDaysActive(customer.transaction_dates),
        engagement_score: calculateEngagementScore(customer),
        customer_type: determineCustomerType(customer)
      }));

      // Apply minimum transactions filter
      if (minTransactions) {
        customers = customers.filter(c => c.total_transactions >= parseInt(minTransactions));
      }

      // Sort customers
      customers.sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        
        if (sortOrder === 'desc') {
          return bVal - aVal;
        } else {
          return aVal - bVal;
        }
      });

      calculateAnalytics();

    } catch (err: any) {
      error = `Failed to load customer usage report: ${err.message}`;
      console.error('Error loading customer data:', err);
    }
  }

  function getDateRange(filter: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return { start: today.toISOString().split('T')[0] };
      case 'this-week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek.toISOString().split('T')[0] };
      case 'last-week':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
        return {
          start: lastWeekStart.toISOString().split('T')[0],
          end: lastWeekEnd.toISOString().split('T')[0]
        };
      case 'this-month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth.toISOString().split('T')[0] };
      case 'last-month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: lastMonthStart.toISOString().split('T')[0],
          end: lastMonthEnd.toISOString().split('T')[0]
        };
      case 'this-quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return { start: quarterStart.toISOString().split('T')[0] };
      case 'this-year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear.toISOString().split('T')[0] };
      default:
        return {};
    }
  }

  function calculateDaysActive(dates: string[]) {
    if (dates.length === 0) return 0;
    const uniqueDates = new Set(dates.map(d => d.split('T')[0]));
    return uniqueDates.size;
  }

  function calculateEngagementScore(customer: any) {
    // Engagement score based on transactions, recency, and spending
    let score = 0;
    
    // Transaction frequency (0-40 points)
    score += Math.min(customer.total_transactions * 2, 40);
    
    // Spending level (0-30 points)
    score += Math.min(customer.total_spent / 100, 30);
    
    // Recency (0-20 points)
    const daysSinceLastActivity = Math.floor((Date.now() - new Date(customer.last_activity).getTime()) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 20 - daysSinceLastActivity / 7);
    
    // Branch diversity (0-10 points)
    score += Math.min(customer.branches_visited * 2, 10);
    
    return Math.round(score);
  }

  function determineCustomerType(customer: any) {
    const score = customer.engagement_score || calculateEngagementScore(customer);
    
    if (score >= 80) return 'VIP';
    if (score >= 60) return 'Loyal';
    if (score >= 40) return 'Regular';
    if (score >= 20) return 'Occasional';
    return 'Inactive';
  }

  function calculateAnalytics() {
    totalCustomers = customers.length;
    
    // Active customers (had activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    activeCustomers = customers.filter(c => new Date(c.last_activity) >= thirtyDaysAgo).length;
    
    // New customers (joined in selected period)
    const dateRange = getDateRange(dateFilter);
    if (dateRange.start) {
      newCustomers = customers.filter(c => c.first_activity >= dateRange.start).length;
    }
    
    // Averages
    if (totalCustomers > 0) {
      avgTransactionsPerCustomer = customers.reduce((sum, c) => sum + c.total_transactions, 0) / totalCustomers;
      avgSpentPerCustomer = customers.reduce((sum, c) => sum + c.total_spent, 0) / totalCustomers;
    }
    
    // Top spenders
    topSpenders = customers.slice(0, 10);
    
    // Engagement levels
    engagementLevels = {
      high: customers.filter(c => c.engagement_score >= 70).length,
      medium: customers.filter(c => c.engagement_score >= 40 && c.engagement_score < 70).length,
      low: customers.filter(c => c.engagement_score >= 20 && c.engagement_score < 40).length,
      inactive: customers.filter(c => c.engagement_score < 20).length
    };
  }

  function handleFilterChange() {
    loadCustomerUsageReport();
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function exportReport() {
    try {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Customer Code,Customer Mobile,Total Transactions,Total Spent,Total Points Earned,Total Points Redeemed,Branches Visited,Avg Transaction Value,Days Active,Engagement Score,Customer Type,Last Activity\n" +
        customers.map(c => 
          `"${c.customer_code || ''}","${c.customer_mobile || ''}","${c.total_transactions}","${c.total_spent}","${c.total_points_earned}","${c.total_points_redeemed}","${c.branches_visited}","${c.avg_transaction_value?.toFixed(2) || '0'}","${c.days_active}","${c.engagement_score}","${c.customer_type}","${c.last_activity || ''}"`
        ).join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `customer_usage_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }
</script>

<svelte:head>
  <title>Customer Usage Report - Admin Panel</title>
</svelte:head>

<div class="customer-usage-report">
  <!-- Header -->
  <div class="report-header">
    <div class="header-left">
      <h1>👥 Customer Usage Report</h1>
      <p>Analyze customer engagement and usage patterns</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary" on:click={() => window.history.back()}>
        ← Back to Reports
      </button>
      <button class="btn btn-primary" on:click={exportReport} disabled={isLoading || customers.length === 0}>
        📤 Export CSV
      </button>
    </div>
  </div>

  {#if error}
    <div class="error-banner">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span>{error}</span>
      </div>
    </div>
  {/if}

  <!-- Filters -->
  <div class="filters-section">
    <h3>Report Filters</h3>
    <div class="filters-grid">
      <!-- Date Filter -->
      <div class="filter-group">
        <label for="dateFilter">Date Range</label>
        <select 
          id="dateFilter"
          bind:value={dateFilter} 
          on:change={handleFilterChange}
          class="filter-select"
        >
          {#each dateFilterOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <!-- Custom Date Range -->
      {#if dateFilter === 'custom'}
        <div class="filter-group">
          <label for="startDate">Start Date</label>
          <input 
            id="startDate"
            type="date" 
            bind:value={startDate}
            on:change={handleFilterChange}
            class="filter-input"
          />
        </div>
        <div class="filter-group">
          <label for="endDate">End Date</label>
          <input 
            id="endDate"
            type="date" 
            bind:value={endDate}
            on:change={handleFilterChange}
            class="filter-input"
          />
        </div>
      {/if}

      <!-- Branch Filter -->
      <div class="filter-group">
        <label for="branchFilter">Branch Filter</label>
        <select 
          id="branchFilter"
          bind:value={selectedBranch} 
          on:change={handleFilterChange}
          class="filter-select"
        >
          <option value="all">All Branches</option>
          {#each branches as branch}
            <option value={branch.id}>{branch.name_en}</option>
          {/each}
        </select>
      </div>

      <!-- Min Transactions Filter -->
      <div class="filter-group">
        <label for="minTransactions">Min Transactions</label>
        <input 
          id="minTransactions"
          type="number" 
          placeholder="0"
          bind:value={minTransactions}
          on:input={handleFilterChange}
          class="filter-input"
        />
      </div>

      <!-- Sort Options -->
      <div class="filter-group">
        <label for="sortBy">Sort By</label>
        <select 
          id="sortBy"
          bind:value={sortBy} 
          on:change={handleFilterChange}
          class="filter-select"
        >
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <label for="sortOrder">Order</label>
        <select 
          id="sortOrder"
          bind:value={sortOrder} 
          on:change={handleFilterChange}
          class="filter-select"
        >
          <option value="desc">Highest First</option>
          <option value="asc">Lowest First</option>
        </select>
      </div>
    </div>

    {#if loadingProgress}
      <div class="loading-progress">
        <div class="progress-text">{loadingProgress}</div>
      </div>
    {/if}
  </div>

  <!-- Analytics Summary -->
  <div class="analytics-section">
    <h3>Customer Analytics Overview</h3>
    
    <!-- Main Metrics -->
    <div class="summary-cards">
      <div class="summary-card customers">
        <div class="card-icon">👥</div>
        <div class="card-content">
          <div class="card-value">{totalCustomers.toLocaleString()}</div>
          <div class="card-label">Total Customers</div>
        </div>
      </div>
      
      <div class="summary-card active">
        <div class="card-icon">�</div>
        <div class="card-content">
          <div class="card-value">{activeCustomers.toLocaleString()}</div>
          <div class="card-label">Active (30 days)</div>
        </div>
      </div>
      
      <div class="summary-card new-customers">
        <div class="card-icon">🆕</div>
        <div class="card-content">
          <div class="card-value">{newCustomers.toLocaleString()}</div>
          <div class="card-label">New in Period</div>
        </div>
      </div>
      
      <div class="summary-card avg-transactions">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <div class="card-value">{avgTransactionsPerCustomer.toFixed(1)}</div>
          <div class="card-label">Avg Transactions</div>
        </div>
      </div>
      
      <div class="summary-card avg-spent">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <div class="card-value">{formatCurrency(avgSpentPerCustomer)}</div>
          <div class="card-label">Avg Spent</div>
        </div>
      </div>
    </div>

    <!-- Engagement Levels -->
    <div class="engagement-section">
      <h4>Customer Engagement Levels</h4>
      <div class="engagement-cards">
        <div class="engagement-card high">
          <div class="engagement-count">{engagementLevels.high}</div>
          <div class="engagement-label">High Engagement</div>
          <div class="engagement-desc">Score 70+</div>
        </div>
        
        <div class="engagement-card medium">
          <div class="engagement-count">{engagementLevels.medium}</div>
          <div class="engagement-label">Medium Engagement</div>
          <div class="engagement-desc">Score 40-69</div>
        </div>
        
        <div class="engagement-card low">
          <div class="engagement-count">{engagementLevels.low}</div>
          <div class="engagement-label">Low Engagement</div>
          <div class="engagement-desc">Score 20-39</div>
        </div>
        
        <div class="engagement-card inactive">
          <div class="engagement-count">{engagementLevels.inactive}</div>
          <div class="engagement-label">Inactive</div>
          <div class="engagement-desc">Score &lt; 20</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Customer Details Table -->
  <div class="table-section">
    <div class="table-header">
      <h3>Customer Usage Details ({customers.length.toLocaleString()} customers)</h3>
      <div class="table-info">
        <span class="info-badge">Sorted by {sortOptions.find(o => o.value === sortBy)?.label}</span>
      </div>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Type</th>
            <th>Transactions</th>
            <th>Total Spent</th>
            <th>Avg Order</th>
            <th>Points</th>
            <th>Branches</th>
            <th>Engagement</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {#each customers.slice(0, 100) as customer}
            <tr>
              <td class="customer-cell">
                <div class="customer-info">
                  <div class="customer-id">
                    {#if customer.customer_code}
                      #{customer.customer_code}
                    {:else if customer.customer_mobile}
                      📱 {customer.customer_mobile}
                    {:else}
                      Unknown
                    {/if}
                  </div>
                </div>
              </td>
              <td class="type-cell">
                <span class="customer-type-badge {customer.customer_type?.toLowerCase()}">
                  {customer.customer_type || 'Regular'}
                </span>
              </td>
              <td class="number-cell">{customer.total_transactions.toLocaleString()}</td>
              <td class="currency-cell">{formatCurrency(customer.total_spent)}</td>
              <td class="currency-cell">{formatCurrency(customer.avg_transaction_value || 0)}</td>
              <td class="points-cell">
                <div class="points-breakdown">
                  <div class="points-earned">+{customer.total_points_earned?.toLocaleString() || '0'}</div>
                  <div class="points-redeemed">-{customer.total_points_redeemed?.toLocaleString() || '0'}</div>
                </div>
              </td>
              <td class="number-cell">{customer.branches_visited || 0}</td>
              <td class="engagement-cell">
                <div class="engagement-score">
                  <div class="score-value">{customer.engagement_score || 0}</div>
                  <div class="score-bar">
                    <div class="score-fill" style="width: {Math.min((customer.engagement_score || 0), 100)}%"></div>
                  </div>
                </div>
              </td>
              <td class="date-cell">{formatDate(customer.last_activity)}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if customers.length > 100}
        <div class="table-footer">
          <p>Showing first 100 customers. Total: {customers.length.toLocaleString()} customers</p>
          <p>Export to CSV to get all records</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .customer-usage-report {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    background: #f9fafb;
    min-height: 100vh;
  }

  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .header-left h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .header-left p {
    color: #6b7280;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .error-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #991b1b;
  }

  .error-icon {
    font-size: 1.25rem;
  }

  .filters-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .filters-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    align-items: end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-group label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .filter-select, .filter-input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  .filter-select:focus, .filter-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .loading-progress {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 0.375rem;
  }

  .progress-text {
    color: #1d4ed8;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .analytics-section {
    margin-bottom: 1.5rem;
  }

  .analytics-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .summary-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .summary-card.customers {
    border-left: 4px solid #3b82f6;
  }

  .summary-card.active {
    border-left: 4px solid #10b981;
  }

  .summary-card.new-customers {
    border-left: 4px solid #8b5cf6;
  }

  .summary-card.avg-transactions {
    border-left: 4px solid #f59e0b;
  }

  .summary-card.avg-spent {
    border-left: 4px solid #ef4444;
  }

  .card-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .card-content {
    min-width: 0;
    flex: 1;
  }

  .card-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
    overflow-wrap: break-word;
  }

  .card-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .engagement-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
  }

  .engagement-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .engagement-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .engagement-card {
    text-align: center;
    padding: 1rem;
    border-radius: 0.375rem;
    border: 2px solid;
  }

  .engagement-card.high {
    background: #f0fdf4;
    border-color: #16a34a;
  }

  .engagement-card.medium {
    background: #fefce8;
    border-color: #ca8a04;
  }

  .engagement-card.low {
    background: #fff7ed;
    border-color: #ea580c;
  }

  .engagement-card.inactive {
    background: #fef2f2;
    border-color: #dc2626;
  }

  .engagement-count {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
  }

  .engagement-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-top: 0.25rem;
  }

  .engagement-desc {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.125rem;
  }

  .table-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .table-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .table-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .table-info {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .info-badge {
    background: #eff6ff;
    color: #1d4ed8;
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    text-align: left;
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }

  td {
    font-size: 0.875rem;
  }

  .customer-cell {
    font-weight: 500;
  }

  .customer-id {
    color: #374151;
  }

  .type-cell {
    text-align: center;
  }

  .customer-type-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  .customer-type-badge.vip {
    background: #fef3c7;
    color: #92400e;
  }

  .customer-type-badge.loyal {
    background: #d1fae5;
    color: #065f46;
  }

  .customer-type-badge.regular {
    background: #dbeafe;
    color: #1e40af;
  }

  .customer-type-badge.occasional {
    background: #fde4e8;
    color: #9f1239;
  }

  .customer-type-badge.inactive {
    background: #f3f4f6;
    color: #6b7280;
  }

  .number-cell, .currency-cell {
    text-align: right;
    font-family: monospace;
  }

  .currency-cell {
    font-weight: 500;
  }

  .points-cell {
    text-align: right;
  }

  .points-breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .points-earned {
    color: #059669;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .points-redeemed {
    color: #dc2626;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .engagement-cell {
    min-width: 100px;
  }

  .engagement-score {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .score-value {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }

  .score-bar {
    width: 60px;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    background: linear-gradient(to right, #ef4444, #f59e0b, #10b981);
    transition: width 0.3s ease;
  }

  .date-cell {
    color: #6b7280;
    font-family: monospace;
    font-size: 0.75rem;
  }

  .table-footer {
    padding: 1rem;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .table-footer p {
    margin: 0.25rem 0;
  }

  @media (max-width: 768px) {
    .customer-usage-report {
      padding: 1rem;
    }

    .summary-cards {
      grid-template-columns: 1fr;
    }

    .engagement-cards {
      grid-template-columns: repeat(2, 1fr);
    }

    .filters-grid {
      grid-template-columns: 1fr;
    }

    .report-header {
      flex-direction: column;
      gap: 1rem;
    }

    .header-actions {
      flex-direction: column;
    }

    .table-container {
      font-size: 0.75rem;
    }

    th, td {
      padding: 0.5rem;
    }
  }
</style>
