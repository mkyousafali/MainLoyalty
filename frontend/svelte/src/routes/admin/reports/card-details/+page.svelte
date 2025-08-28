<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../../../../lib/supabase';

  // State variables
  let isLoading = false;
  let error: string | null = null;
  let cardDetails: any[] = [];
  let branches: any[] = [];
  let cardTypes: any[] = [];
  let loadingProgress = '';
  
  // Filter states
  let dateFilter = 'this-month';
  let startDate = '';
  let endDate = '';
  let selectedBranch = 'all';
  let selectedCardType = 'all';
  let searchCustomer = '';
  let sortBy = 'created_at';
  let sortOrder = 'desc';

  // Summary stats
  let totalCards = 0;
  let activeCards = 0;
  let inactiveCards = 0;
  let totalCustomers = 0;
  let topBranch = '';

  // Date filter options
  const dateFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this-week', label: 'This Week' },
    { value: 'last-week', label: 'Last Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'this-quarter', label: 'This Quarter' },
    { value: 'this-year', label: 'This Year' },
    { value: 'all-time', label: 'All Time' },
    { value: 'custom', label: 'Custom Date Range' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Card Creation Date' },
    { value: 'customer_code', label: 'Customer Code' },
    { value: 'full_name', label: 'Customer Name' },
    { value: 'total_points', label: 'Total Points' },
    { value: 'last_transaction', label: 'Last Transaction' }
  ];

  // Filtered card details
  $: filteredCardDetails = cardDetails.filter(card => {
    if (searchCustomer) {
      const searchTerm = searchCustomer.toLowerCase();
      return (
        card.customer_code?.toString().includes(searchTerm) ||
        card.full_name?.toLowerCase().includes(searchTerm) ||
        card.phone?.includes(searchTerm) ||
        card.email?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  onMount(() => {
    loadBranches();
    loadCardTypes();
    loadCardDetailsReport();
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

  async function loadCardTypes() {
    try {
      const { data, error: cardTypeError } = await supabase
        .from('card_types')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (cardTypeError) throw cardTypeError;
      cardTypes = data || [];
    } catch (err: any) {
      console.error('Error loading card types:', err);
    }
  }

  async function loadTotalCustomersFromNumbers() {
    try {
      const { count, error } = await supabase
        .from('customer_numbers')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (err: any) {
      console.error('Error loading total customers from customer_numbers:', err);
      return 0;
    }
  }

  async function loadCardDetailsReport() {
    try {
      isLoading = true;
      error = null;
      loadingProgress = 'Loading customer card details...';

      // Build the main query to get customers with their card information
      let query = supabase
        .from('customers')
        .select(`
          id,
          customer_code,
          full_name,
          phone,
          email,
          mobile,
          card_number,
          card_unique_code,
          card_status,
          card_issued_date,
          card_expiry_date,
          points,
          total_points,
          points_earned_total,
          points_redeemed_total,
          total_spent,
          total_visits,
          last_visit_date,
          status,
          is_active,
          created_at,
          registration_date,
          joined_at,
          branch_id,
          card_type_id,
          branches:branch_id (
            id,
            name_en,
            name_ar,
            code
          ),
          card_types:card_type_id (
            id,
            name
          )
        `);

      // Apply branch filter
      if (selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
      }

      // Apply card type filter
      if (selectedCardType !== 'all') {
        query = query.eq('card_type_id', selectedCardType);
      }

      // Only show registered customers (card_status = 'registered')
      query = query.eq('card_status', 'registered');

      // Apply date filters
      if (dateFilter !== 'all-time') {
        const dateRange = getDateRange(dateFilter);
        if (dateRange.start) {
          query = query.gte('created_at', dateRange.start + 'T00:00:00.000Z');
        }
        if (dateRange.end) {
          query = query.lte('created_at', dateRange.end + 'T23:59:59.999Z');
        }
      }

      // Custom date range
      if (dateFilter === 'custom' && startDate && endDate) {
        query = query.gte('created_at', startDate + 'T00:00:00.000Z')
                   .lte('created_at', endDate + 'T23:59:59.999Z');
      }

      loadingProgress = 'Processing card data...';

      // Execute query
      const { data: customerData, error: customerError } = await query
        .order('created_at', { ascending: sortOrder === 'asc' })
        .limit(5000); // Reasonable limit

      if (customerError) throw customerError;

      loadingProgress = 'Loading transaction data...';

      // Get last transaction date for each customer
      const customerIds = customerData?.map(c => c.id) || [];
      let lastTransactions: { [key: number]: string } = {};

      if (customerIds.length > 0) {
        const { data: transactionData, error: transError } = await supabase
          .from('customer_transactions')
          .select('customer_id, bill_date')
          .in('customer_id', customerIds)
          .order('bill_date', { ascending: false });

        if (!transError && transactionData) {
          // Get the latest transaction for each customer
          transactionData.forEach(t => {
            if (!lastTransactions[t.customer_id]) {
              lastTransactions[t.customer_id] = t.bill_date;
            }
          });
        }
      }

      // Process the data and add last transaction info
      cardDetails = (customerData || []).map(customer => {
        return {
          ...customer,
          card_type_name: customer.card_types?.name || 'Standard',
          branch_name: customer.branches?.name_en || customer.branches?.name_ar || 'N/A',
          last_transaction: lastTransactions[customer.id] || null,
          display_card_status: customer.card_status === 'registered' ? 'Registered' : 
                              customer.card_status === 'unregistered' ? 'Unregistered' :
                              customer.card_status === 'blocked' ? 'Blocked' : 
                              customer.card_status === 'expired' ? 'Expired' : customer.card_status
        };
      });

      // Sort the results
      cardDetails.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        // Handle different data types
        if (sortBy === 'created_at' || sortBy === 'last_transaction') {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        } else if (typeof aVal === 'string') {
          aVal = aVal?.toLowerCase() || '';
          bVal = bVal?.toLowerCase() || '';
        }
        
        if (sortOrder === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });

      await calculateSummaryStats();

      console.log(`Loaded ${cardDetails.length} customer card records`);

    } catch (err: any) {
      error = `Failed to load card details report: ${err.message}`;
      console.error('Error loading card details:', err);
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

  async function calculateSummaryStats() {
    // Get total customers from customer_numbers table
    totalCustomers = await loadTotalCustomersFromNumbers();
    
    // Calculate statistics from registered customers (cardDetails)
    totalCards = cardDetails.length; // Number of registered customers with cards
    
    // Get count of Active Non-Registered customers directly without fetching all data
    console.log('Counting active non-registered customers...');
    const { count: unregisteredCount, error: unregError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('card_status', 'unregistered')
      .eq('is_active', true);
    
    if (!unregError) {
      activeCards = unregisteredCount || 0;
      console.log(`Active Non-Registered count: ${activeCards}`);
    } else {
      console.error('Error counting unregistered active customers:', unregError);
      activeCards = 0;
    }
    
    // Get count of Inactive customers (in customer_numbers but not in customers table at all)
    console.log('Counting inactive customers (in numbers but not in customers)...');
    
    // Get total count from customer_numbers table
    const { count: totalInNumbers, error: numbersError } = await supabase
      .from('customer_numbers')
      .select('*', { count: 'exact', head: true });
    
    // Get total count from customers table
    const { count: totalInCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (!numbersError && !customersError) {
      // Inactive customers = total in customer_numbers minus total in customers table
      inactiveCards = (totalInNumbers || 0) - (totalInCustomers || 0);
      console.log(`Total in customer_numbers: ${totalInNumbers}`);
      console.log(`Total in customers table: ${totalInCustomers}`);
      console.log(`Inactive customers count: ${inactiveCards}`);
    } else {
      console.error('Error counting:', { numbersError, customersError });
      inactiveCards = 0;
    }
    
    // Find top branch among registered customers
    const branchCounts: { [key: string]: number } = {};
    cardDetails.forEach(card => {
      const branchName = card.branch_name || 'Unknown';
      branchCounts[branchName] = (branchCounts[branchName] || 0) + 1;
    });
    
    topBranch = Object.entries(branchCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
  }

  // Navigation functions for summary cards
  function handleTotalCustomersClick() {
    // Navigate to all customers from customer_numbers table
    window.location.href = '/admin/reports/card-details/all-customers';
  }

  function handleRegisteredCardsClick() {
    // Navigate to registered customers only
    window.location.href = '/admin/reports/card-details/registered';
  }

  function handleActiveCardsClick() {
    // Navigate to active customers with unregistered status
    window.location.href = '/admin/reports/card-details/unregistered-active';
  }

  function handleInactiveCardsClick() {
    // Navigate to inactive customers (in numbers but not registered)
    window.location.href = '/admin/reports/card-details/inactive';
  }

  function handleTopBranchClick() {
    // Navigate to customers from top branch
    window.location.href = `/admin/reports/card-details/branch/${encodeURIComponent(topBranch)}`;
  }

  function handleFilterChange() {
    loadCardDetailsReport();
  }

  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatDateTime(dateString: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function exportToExcel() {
    try {
      // Create Excel-compatible CSV content with proper formatting
      const headers = [
        'Customer Code',
        'Customer Name',
        'Phone',
        'Email',
        'Branch',
        'Card Number',
        'Card Type',
        'Card Issue Date',
        'Card Expiry Date',
        'Card Status',
        'Total Points',
        'Registration Date',
        'Last Transaction',
        'Customer Status',
        'Total Cards'
      ];

      const csvContent = headers.join(',') + '\n' +
        filteredCardDetails.map(card => [
          `"${card.customer_code || ''}"`,
          `"${card.full_name || ''}"`,
          `"${card.phone || ''}"`,
          `"${card.email || ''}"`,
          `"${card.branches?.name_en || card.branches?.name_ar || ''}"`,
          `"${card.card_number || ''}"`,
          `"${card.card_type_name || ''}"`,
          `"${formatDate(card.card_issue_date)}"`,
          `"${formatDate(card.card_expiry_date)}"`,
          `"${card.card_status || ''}"`,
          `"${card.total_points || 0}"`,
          `"${formatDate(card.created_at)}"`,
          `"${formatDate(card.last_transaction)}"`,
          `"${card.is_active ? 'Active' : 'Inactive'}"`,
          `"${card.total_cards || 0}"`
        ].join(',')).join('\n');

      // Create and download the file
      const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `card_details_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }
</script>

<svelte:head>
  <title>Card Details Report - Admin Panel</title>
</svelte:head>

<div class="card-details-report">
  <!-- Header -->
  <div class="report-header">
    <div class="header-left">
      <h1>💳 Card Details Report</h1>
      <p>Detailed information about customer cards and their status</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary" on:click={() => window.history.back()}>
        ← Back to Reports
      </button>
      <button class="btn btn-success" on:click={exportToExcel} disabled={isLoading || filteredCardDetails.length === 0}>
        📊 Export to Excel
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
        <label for="branchFilter">Branch</label>
        <select 
          id="branchFilter"
          bind:value={selectedBranch} 
          on:change={handleFilterChange}
          class="filter-select"
        >
          <option value="all">All Branches</option>
          {#each branches as branch}
            <option value={branch.id}>{branch.name_en || branch.name_ar || branch.code}</option>
          {/each}
        </select>
      </div>

      <!-- Card Type Filter -->
      <div class="filter-group">
        <label for="cardTypeFilter">Card Type</label>
        <select 
          id="cardTypeFilter"
          bind:value={selectedCardType} 
          on:change={handleFilterChange}
          class="filter-select"
        >
          <option value="all">All Card Types</option>
          {#each cardTypes as cardType}
            <option value={cardType.id}>{cardType.name}</option>
          {/each}
        </select>
      </div>

      <!-- Customer Search -->
      <div class="filter-group">
        <label for="customerSearch">Search Customer</label>
        <input 
          id="customerSearch"
          type="text"
          placeholder="Name, Code, Phone, Email..."
          bind:value={searchCustomer}
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
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
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
    <h3>Card Summary Overview</h3>
    <div class="summary-cards">
      <div class="summary-card total-customers clickable" on:click={handleTotalCustomersClick} role="button" tabindex="0">
        <div class="card-icon">👥</div>
        <div class="card-content">
          <div class="card-value">{totalCustomers.toLocaleString()}</div>
          <div class="card-label">Total Customers</div>
          <div class="card-sublabel">From Customer Numbers</div>
        </div>
      </div>
      
      <div class="summary-card total-cards clickable" on:click={handleRegisteredCardsClick} role="button" tabindex="0">
        <div class="card-icon">💳</div>
        <div class="card-content">
          <div class="card-value">{totalCards.toLocaleString()}</div>
          <div class="card-label">Registered Cards</div>
          <div class="card-sublabel">With Registered Status</div>
        </div>
      </div>
      
      <div class="summary-card active-cards clickable" on:click={handleActiveCardsClick} role="button" tabindex="0">
        <div class="card-icon">👤</div>
        <div class="card-content">
          <div class="card-value">{activeCards.toLocaleString()}</div>
          <div class="card-label">Active Non-Registered</div>
          <div class="card-sublabel">In System, Not Registered</div>
        </div>
      </div>
      
      <div class="summary-card inactive-cards clickable" on:click={handleInactiveCardsClick} role="button" tabindex="0">
        <div class="card-icon">❌</div>
        <div class="card-content">
          <div class="card-value">{inactiveCards.toLocaleString()}</div>
          <div class="card-label">Inactive Customers</div>
          <div class="card-sublabel">In Numbers, Not in System</div>
        </div>
      </div>
      
      <div class="summary-card top-branch clickable" on:click={handleTopBranchClick} role="button" tabindex="0">
        <div class="card-icon">🏢</div>
        <div class="card-content">
          <div class="card-value" title={topBranch}>{topBranch.length > 12 ? topBranch.substring(0, 12) + '...' : topBranch}</div>
          <div class="card-label">Top Branch</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Card Details Table -->
  <div class="table-section">
    <div class="table-header">
      <h3>Card Details ({filteredCardDetails.length.toLocaleString()} records)</h3>
      <div class="table-info">
        <span class="info-badge">Filtered Results</span>
        {#if searchCustomer}
          <span class="info-badge search">Search: "{searchCustomer}"</span>
        {/if}
      </div>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Contact</th>
            <th>Branch</th>
            <th>Card Details</th>
            <th>Card Status</th>
            <th>Points</th>
            <th>Registration</th>
            <th>Last Transaction</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredCardDetails.slice(0, 200) as card}
            <tr>
              <td class="customer-cell">
                <div class="customer-info">
                  <div class="customer-code">#{card.customer_code || 'N/A'}</div>
                  {#if card.full_name}
                    <div class="customer-name">{card.full_name}</div>
                  {/if}
                </div>
              </td>
              <td class="contact-cell">
                <div class="contact-info">
                  {#if card.phone || card.mobile}
                    <div class="phone">📱 {card.phone || card.mobile}</div>
                  {/if}
                  {#if card.email}
                    <div class="email">✉️ {card.email}</div>
                  {/if}
                </div>
              </td>
              <td class="branch-cell">{card.branch_name}</td>
              <td class="card-details-cell">
                <div class="card-info">
                  <div class="card-number">💳 {card.card_number || 'N/A'}</div>
                  <div class="card-type">{card.card_type_name}</div>
                  {#if card.card_expiry_date}
                    <div class="card-expiry">Exp: {formatDate(card.card_expiry_date)}</div>
                  {/if}
                </div>
              </td>
              <td class="card-status-cell">
                <span class="card-status-badge {card.card_status?.toLowerCase()}">
                  {card.display_card_status}
                </span>
              </td>
              <td class="points-cell">{(card.total_points || 0).toLocaleString()}</td>
              <td class="date-cell">{formatDate(card.created_at)}</td>
              <td class="date-cell">{formatDate(card.last_transaction)}</td>
              <td class="status-cell">
                <span class="status-badge {card.is_active ? 'active' : 'inactive'}">
                  {card.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if filteredCardDetails.length > 200}
        <div class="table-footer">
          <p>Showing first 200 records. Total: {filteredCardDetails.length.toLocaleString()} records</p>
          <p>Export to Excel to get all filtered records</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .card-details-report {
    padding: 2rem;
    max-width: 1600px;
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

  .btn-success {
    background: #10b981;
    color: white;
  }

  .btn-success:hover {
    background: #059669;
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
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    transition: all 0.2s ease;
  }

  .summary-card.clickable {
    cursor: pointer;
  }

  .summary-card.clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }

  .summary-card.clickable:active {
    transform: translateY(0);
  }

  .summary-card.total-customers {
    border-left: 4px solid #3b82f6;
  }

  .summary-card.total-cards {
    border-left: 4px solid #8b5cf6;
  }

  .summary-card.active-cards {
    border-left: 4px solid #10b981;
  }

  .summary-card.inactive-cards {
    border-left: 4px solid #ef4444;
  }

  .summary-card.top-branch {
    border-left: 4px solid #06b6d4;
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

  .card-sublabel {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.125rem;
    font-style: italic;
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

  .info-badge.search {
    background: #f0fdf4;
    color: #166534;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1200px;
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
    white-space: nowrap;
  }

  td {
    font-size: 0.875rem;
    vertical-align: top;
  }

  .customer-cell {
    min-width: 140px;
  }

  .customer-code {
    font-weight: 500;
    color: #374151;
  }

  .customer-name {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .contact-cell {
    min-width: 160px;
  }

  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .phone, .email {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .branch-cell {
    color: #059669;
    font-weight: 500;
    min-width: 120px;
  }

  .card-details-cell {
    min-width: 160px;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .card-number {
    font-family: monospace;
    font-weight: 500;
    color: #374151;
    font-size: 0.75rem;
  }

  .card-type {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .card-expiry {
    font-size: 0.7rem;
    color: #9ca3af;
  }

  .card-status-cell {
    min-width: 100px;
  }

  .card-status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  .card-status-badge.active {
    background: #dcfce7;
    color: #166534;
  }

  .card-status-badge.inactive {
    background: #fee2e2;
    color: #991b1b;
  }

  .multiple-cards {
    font-size: 0.7rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .points-cell {
    text-align: right;
    font-family: monospace;
    font-weight: 500;
    color: #f59e0b;
    min-width: 80px;
  }

  .date-cell {
    color: #6b7280;
    font-size: 0.75rem;
    min-width: 90px;
  }

  .status-cell {
    min-width: 80px;
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  .status-badge.active {
    background: #dcfce7;
    color: #166534;
  }

  .status-badge.inactive {
    background: #fef3c7;
    color: #92400e;
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
    .card-details-report {
      padding: 1rem;
    }

    .summary-cards {
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
      width: 100%;
    }

    .table-container {
      font-size: 0.75rem;
    }

    th, td {
      padding: 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .summary-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
