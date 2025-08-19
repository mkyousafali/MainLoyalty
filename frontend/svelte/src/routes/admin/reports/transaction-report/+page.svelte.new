<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../../../../lib/supabase';

  // State variables
  let isLoading = false;
  let error: string | null = null;
  let transactions: any[] = [];
  let customers: any[] = [];
  let loadingProgress = '';
  
  // Filter states
  let dateFilter = 'all-time';
  let startDate = '';
  let endDate = '';
  let selectedCustomer = 'all';
  let searchCustomer = '';
  let selectedBranch = 'all';
  let branches: any[] = [];

  // Computed totals
  let totalTransactions = 0;
  let totalBillValue = 0;
  let totalPoints = 0;
  let totalRedeemed = 0;

  // Filtered customers for search
  $: filteredCustomers = customers.filter(customer => 
    customer.name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    customer.customer_code?.toString().includes(searchCustomer)
  ).slice(0, 50); // Limit to 50 results for performance

  // Date filter options
  const dateFilterOptions = [
    { value: 'all-time', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this-week', label: 'This Week' },
    { value: 'last-week', label: 'Last Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'this-year', label: 'This Year' },
    { value: 'custom', label: 'Custom Date Range' }
  ];

  onMount(() => {
    loadCustomers();
    loadBranches();
    loadTransactionReport();
  });

  async function loadCustomers() {
    try {
      const { data, error: customerError } = await supabase
        .from('customers')
        .select('id, name, customer_code')
        .order('name');

      if (customerError) throw customerError;
      customers = data || [];
    } catch (err: any) {
      console.error('Error loading customers:', err);
    }
  }

  async function loadBranches() {
    try {
      const { data, error: branchError } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (branchError) throw branchError;
      branches = data || [];
    } catch (err: any) {
      console.error('Error loading branches:', err);
    }
  }

  async function loadTransactionReport() {
    try {
      isLoading = true;
      error = null;

      // Fetch ALL transactions with proper pagination to avoid limits
      let allTransactions: any[] = [];
      let from = 0;
      const batchSize = 1000; // Fetch in batches of 1000
      let hasMore = true;

      while (hasMore) {
        loadingProgress = `Loading batch ${Math.floor(from / batchSize) + 1}... (${allTransactions.length} records so far)`;
        
        // Build the query with no row limit (Supabase default limit is 1000, we want all)
        let query = supabase
          .from('customer_transactions')
          .select(`
            *,
            branches:branch_id (
              id,
              name,
              code
            )
          `);

        // Apply filters
        if (selectedCustomer !== 'all') {
          query = query.eq('customer_code', selectedCustomer);
        }

        // Apply branch filter
        if (selectedBranch !== 'all') {
          query = query.eq('branch_id', selectedBranch);
        }

        // Apply date filters
        if (dateFilter !== 'all-time') {
          const dateRange = getDateRange(dateFilter);
          if (dateRange.start) {
            query = query.gte('bill_date', dateRange.start);
          }
          if (dateRange.end) {
            query = query.lte('bill_date', dateRange.end);
          }
        }

        // Custom date range
        if (dateFilter === 'custom' && startDate && endDate) {
          query = query.gte('bill_date', startDate).lte('bill_date', endDate);
        }

        // Execute query with pagination
        const { data, error: transactionError } = await query
          .range(from, from + batchSize - 1)
          .order('bill_date', { ascending: false });

        if (transactionError) throw transactionError;

        const batchData = data || [];
        allTransactions = [...allTransactions, ...batchData];

        // Check if we have more data
        hasMore = batchData.length === batchSize;
        from += batchSize;

        // Safety check to prevent infinite loop
        if (from > 100000) {
          console.warn('Reached safety limit of 100,000 records');
          break;
        }
      }

      transactions = allTransactions;
      calculateTotals();

      console.log(`Loaded ${transactions.length} total transactions`);

    } catch (err: any) {
      error = `Failed to load transaction report: ${err.message}`;
      console.error('Error loading transactions:', err);
    } finally {
      isLoading = false;
      loadingProgress = '';
    }
  }

  function getDateRange(filter: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return { start: today.toISOString().split('T')[0] };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { 
          start: yesterday.toISOString().split('T')[0],
          end: yesterday.toISOString().split('T')[0]
        };
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
      case 'this-year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear.toISOString().split('T')[0] };
      default:
        return {};
    }
  }

  function calculateTotals() {
    totalTransactions = transactions.length;
    totalBillValue = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    totalPoints = transactions.reduce((sum, t) => sum + (parseFloat(t.add_amt) || 0), 0);
    totalRedeemed = transactions.reduce((sum, t) => sum + (parseFloat(t.redeem) || 0), 0);
  }

  function handleFilterChange() {
    loadTransactionReport();
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function exportReport() {
    try {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Transaction ID,Customer Code,Customer Mobile,Date,Amount,Points Added,Points Redeemed,Branch,Card Type\n" +
        transactions.map(t => 
          `"${t.id || ''}","${t.customer_code || ''}","${t.customer_mobile || ''}","${t.bill_date || ''}","${t.amount || 0}","${t.add_amt || 0}","${t.redeem || 0}","${t.branches?.name || t.branches?.code || ''}","${t.card_type || ''}"`
        ).join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `transaction_report_${new Date().toISOString().split('T')[0]}.csv`);
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
  <title>Transaction Report - Admin Panel</title>
</svelte:head>

<div class="transaction-report">
  <!-- Header -->
  <div class="report-header">
    <div class="header-left">
      <h1>💰 Transaction Report</h1>
      <p>Comprehensive transaction analysis and insights</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary" on:click={() => window.history.back()}>
        ← Back
      </button>
      <button class="btn btn-primary" on:click={exportReport} disabled={isLoading || transactions.length === 0}>
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

      <!-- Customer Filter -->
      <div class="filter-group">
        <label for="customerSearch">Customer Filter</label>
        <div class="customer-filter">
          <input 
            type="text"
            placeholder="Search customer by name or code..."
            bind:value={searchCustomer}
            class="filter-input customer-search"
          />
          <select 
            bind:value={selectedCustomer}
            on:change={handleFilterChange}
            class="filter-select"
          >
            <option value="all">All Customers</option>
            {#each filteredCustomers as customer}
              <option value={customer.customer_code}>
                {customer.name || 'N/A'} ({customer.customer_code})
              </option>
            {/each}
          </select>
        </div>
      </div>

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
            <option value={branch.id}>{branch.name}</option>
          {/each}
        </select>
      </div>
    </div>

    {#if loadingProgress}
      <div class="loading-progress">
        <div class="progress-text">{loadingProgress}</div>
      </div>
    {/if}
  </div>

  <!-- Summary Cards -->
  <div class="summary-section">
    <h3>Report Summary</h3>
    <div class="summary-cards">
      <div class="summary-card transactions">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <div class="card-value">{totalTransactions.toLocaleString()}</div>
          <div class="card-label">Total Transactions</div>
        </div>
      </div>
      
      <div class="summary-card bill-value">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <div class="card-value">{formatCurrency(totalBillValue)}</div>
          <div class="card-label">Total Bill Value</div>
        </div>
      </div>
      
      <div class="summary-card points">
        <div class="card-icon">⭐</div>
        <div class="card-content">
          <div class="card-value">{totalPoints.toLocaleString()}</div>
          <div class="card-label">Total Points</div>
        </div>
      </div>
      
      <div class="summary-card redeemed">
        <div class="card-icon">🎯</div>
        <div class="card-content">
          <div class="card-value">{totalRedeemed.toLocaleString()}</div>
          <div class="card-label">Total Redeemed</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Transaction Details Table -->
  <div class="table-section">
    <div class="table-header">
      <h3>Transaction Details ({transactions.length.toLocaleString()} records)</h3>
      <div class="table-info">
        <span class="info-badge">All Time Data</span>
      </div>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Points Added</th>
            <th>Points Redeemed</th>
            <th>Branch</th>
            <th>Card Type</th>
          </tr>
        </thead>
        <tbody>
          {#each transactions.slice(0, 1000) as transaction}
            <tr>
              <td class="date-cell">{formatDate(transaction.bill_date)}</td>
              <td class="customer-cell">
                <div class="customer-info">
                  <div class="customer-code">
                    #{transaction.customer_code || 'N/A'}
                  </div>
                  {#if transaction.customer_mobile}
                    <div class="customer-mobile">{transaction.customer_mobile}</div>
                  {/if}
                </div>
              </td>
              <td class="amount-cell">{formatCurrency(parseFloat(transaction.amount) || 0)}</td>
              <td class="points-cell positive">+{(parseFloat(transaction.add_amt) || 0).toLocaleString()}</td>
              <td class="points-cell negative">-{(parseFloat(transaction.redeem) || 0).toLocaleString()}</td>
              <td class="branch-cell">{transaction.branches?.name || transaction.branches?.code || 'N/A'}</td>
              <td class="card-type-cell">
                <span class="card-type-badge">{transaction.card_type || 'Standard'}</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if transactions.length > 1000}
        <div class="table-footer">
          <p>Showing first 1,000 records. Total: {transactions.length.toLocaleString()} records</p>
          <p>Export to CSV to get all records</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .transaction-report {
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
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

  .customer-filter {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .customer-search {
    margin-bottom: 0.5rem;
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

  .summary-section {
    margin-bottom: 1.5rem;
  }

  .summary-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
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
    overflow: hidden;
  }

  .summary-card.transactions {
    border-left: 4px solid #3b82f6;
  }

  .summary-card.bill-value {
    border-left: 4px solid #10b981;
  }

  .summary-card.points {
    border-left: 4px solid #f59e0b;
  }

  .summary-card.redeemed {
    border-left: 4px solid #ef4444;
  }

  .card-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .card-content {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .card-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    word-break: break-all;
    line-height: 1.2;
    overflow-wrap: break-word;
    min-width: 0;
    flex: 1;
  }

  .card-label {
    font-size: 0.875rem;
    color: #6b7280;
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

  .date-cell {
    color: #6b7280;
    font-family: monospace;
  }

  .customer-cell {
    font-size: 0.875rem;
  }

  .customer-code {
    font-weight: 500;
    color: #374151;
  }

  .customer-mobile {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.125rem;
    font-family: monospace;
  }

  .amount-cell {
    font-weight: 600;
    color: #1f2937;
  }

  .points-cell {
    font-weight: 500;
  }

  .points-cell.positive {
    color: #059669;
  }

  .points-cell.negative {
    color: #dc2626;
  }

  .branch-cell {
    color: #059669;
    font-weight: 500;
  }

  .card-type-badge {
    background: #dbeafe;
    color: #1e40af;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
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
    .transaction-report {
      padding: 1rem;
    }

    .summary-cards {
      grid-template-columns: 1fr;
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
