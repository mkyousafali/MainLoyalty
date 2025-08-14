<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../../../../lib/supabase';

  // State variables
  let isLoading = false;
  let error: string | null = null;
  let registrations: any[] = [];
  let loadingProgress = '';
  
  // Filter states
  let dateFilter = 'all-time';
  let startDate = '';
  let endDate = '';
  let selectedBranch = 'all';
  let branches: any[] = [];

  // Summary stats
  let totalRegistrations = 0;
  let monthlyGrowth = 0;
  let weeklyGrowth = 0;
  let avgRegistrationsPerDay = 0;
  let topBranch = '';

  // Chart data for trends
  let registrationTrends: any[] = [];

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
    loadBranches();
    loadRegistrationsReport();
  });

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

  async function loadRegistrationsReport() {
    try {
      isLoading = true;
      error = null;

      // Fetch ALL registrations with proper pagination
      let allRegistrations: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        loadingProgress = `Loading batch ${Math.floor(from / batchSize) + 1}... (${allRegistrations.length} records so far)`;
        
        // Build the query
        let query = supabase
          .from('customers')
          .select(`
            *,
            branches:branch_id (
              id,
              name,
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

        // Apply date filters
        if (dateFilter !== 'all-time') {
          const dateRange = getDateRange(dateFilter);
          if (dateRange.start) {
            query = query.gte('created_at', dateRange.start);
          }
          if (dateRange.end) {
            query = query.lte('created_at', dateRange.end);
          }
        }

        // Custom date range
        if (dateFilter === 'custom' && startDate && endDate) {
          query = query.gte('created_at', startDate).lte('created_at', endDate);
        }

        // Execute query with pagination
        const { data, error: registrationError } = await query
          .range(from, from + batchSize - 1)
          .order('created_at', { ascending: false });

        if (registrationError) throw registrationError;

        const batchData = data || [];
        allRegistrations = [...allRegistrations, ...batchData];

        // Check if we have more data
        hasMore = batchData.length === batchSize;
        from += batchSize;

        // Safety check to prevent infinite loop
        if (from > 100000) {
          console.warn('Reached safety limit of 100,000 records');
          break;
        }
      }

      registrations = allRegistrations;
      calculateSummaryStats();
      calculateTrends();

      console.log(`Loaded ${registrations.length} total registrations`);

    } catch (err: any) {
      error = `Failed to load registrations report: ${err.message}`;
      console.error('Error loading registrations:', err);
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

  function calculateSummaryStats() {
    totalRegistrations = registrations.length;
    
    // Calculate monthly growth (comparing last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const lastMonth = registrations.filter(r => new Date(r.created_at) >= thirtyDaysAgo).length;
    const previousMonth = registrations.filter(r => 
      new Date(r.created_at) >= sixtyDaysAgo && new Date(r.created_at) < thirtyDaysAgo
    ).length;
    
    monthlyGrowth = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth * 100) : 0;
    
    // Calculate weekly growth
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const lastWeek = registrations.filter(r => new Date(r.created_at) >= sevenDaysAgo).length;
    const previousWeek = registrations.filter(r => 
      new Date(r.created_at) >= fourteenDaysAgo && new Date(r.created_at) < sevenDaysAgo
    ).length;
    
    weeklyGrowth = previousWeek > 0 ? ((lastWeek - previousWeek) / previousWeek * 100) : 0;
    
    // Calculate average registrations per day (last 30 days)
    avgRegistrationsPerDay = lastMonth / 30;
    
    // Find top branch
    const branchCounts: { [key: string]: number } = {};
    registrations.forEach(r => {
      const branchName = r.branches?.name || 'Unknown';
      branchCounts[branchName] = (branchCounts[branchName] || 0) + 1;
    });
    
    topBranch = Object.entries(branchCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
  }

  function calculateTrends() {
    // Group registrations by date for trend chart
    const dateGroups: { [key: string]: number } = {};
    
    registrations.forEach(r => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });
    
    registrationTrends = Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
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

  function exportToCSV() {
    const csvContent = 
      "Registration Date,Customer Code,Name,Mobile,Email,Branch,Card Type,Status\n" +
      registrations.map(r => 
        `"${r.created_at || ''}","${r.customer_code || ''}","${r.name || ''}","${r.mobile || ''}","${r.email || ''}","${r.branches?.name || ''}","${r.card_types?.name || ''}","${r.status || ''}"`
      ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Registrations Report - Admin Panel</title>
</svelte:head>

<div class="registrations-report">
  <!-- Top Bar -->
  <div class="report-header">
    <div class="header-left">
      <h1>📝 Registrations Report</h1>
      <p>Track customer registration trends and patterns</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary" on:click={() => window.history.back()}>
        ← Back to Reports
      </button>
      <button class="btn btn-primary" on:click={exportToCSV} disabled={isLoading || registrations.length === 0}>
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
    <h3>📊 Report Filters</h3>
    <div class="filters-grid">
      <div class="filter-group">
        <label for="date-filter">Date Range</label>
        <select id="date-filter" bind:value={dateFilter} on:change={loadRegistrationsReport}>
          {#each dateFilterOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      {#if dateFilter === 'custom'}
        <div class="filter-group">
          <label for="start-date">Start Date</label>
          <input type="date" id="start-date" bind:value={startDate} on:change={loadRegistrationsReport} />
        </div>
        <div class="filter-group">
          <label for="end-date">End Date</label>
          <input type="date" id="end-date" bind:value={endDate} on:change={loadRegistrationsReport} />
        </div>
      {/if}

      <div class="filter-group">
        <label for="branch-filter">Branch</label>
        <select id="branch-filter" bind:value={selectedBranch} on:change={loadRegistrationsReport}>
          <option value="all">All Branches</option>
          {#each branches as branch}
            <option value={branch.id}>{branch.name}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <button class="btn btn-primary" on:click={loadRegistrationsReport} disabled={isLoading}>
          {isLoading ? '⏳' : '🔍'} Load Report
        </button>
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
    <h3>📈 Registration Summary</h3>
    <div class="summary-cards">
      <div class="summary-card registrations">
        <div class="card-icon">👥</div>
        <div class="card-content">
          <div class="card-value">{totalRegistrations.toLocaleString()}</div>
          <div class="card-label">Total Registrations</div>
        </div>
      </div>
      
      <div class="summary-card growth">
        <div class="card-icon">📈</div>
        <div class="card-content">
          <div class="card-value">{monthlyGrowth.toFixed(1)}%</div>
          <div class="card-label">Monthly Growth</div>
        </div>
      </div>
      
      <div class="summary-card weekly">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <div class="card-value">{weeklyGrowth.toFixed(1)}%</div>
          <div class="card-label">Weekly Growth</div>
        </div>
      </div>
      
      <div class="summary-card average">
        <div class="card-icon">📅</div>
        <div class="card-content">
          <div class="card-value">{avgRegistrationsPerDay.toFixed(1)}</div>
          <div class="card-label">Avg/Day (30d)</div>
        </div>
      </div>
      
      <div class="summary-card branch">
        <div class="card-icon">🏢</div>
        <div class="card-content">
          <div class="card-value" title={topBranch}>{topBranch.length > 15 ? topBranch.substring(0, 15) + '...' : topBranch}</div>
          <div class="card-label">Top Branch</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Registration Details Table -->
  <div class="table-section">
    <div class="table-header">
      <h3>Registration Details ({registrations.length.toLocaleString()} records)</h3>
      <div class="table-info">
        <span class="info-badge">📅 All Time Data</span>
      </div>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Registration Date</th>
            <th>Customer</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>Branch</th>
            <th>Card Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each registrations.slice(0, 1000) as registration}
            <tr>
              <td class="date-cell">{formatDate(registration.created_at)}</td>
              <td class="customer-cell">
                <div class="customer-info">
                  <div class="customer-code">#{registration.customer_code}</div>
                  {#if registration.name}
                    <div class="customer-name">{registration.name}</div>
                  {/if}
                </div>
              </td>
              <td class="mobile-cell">{registration.mobile || 'N/A'}</td>
              <td class="email-cell">{registration.email || 'N/A'}</td>
              <td class="branch-cell">{registration.branches?.name || 'N/A'}</td>
              <td class="card-type-cell">
                <span class="card-type-badge">{registration.card_types?.name || 'Standard'}</span>
              </td>
              <td class="status-cell">
                <span class="status-badge status-{registration.status}">
                  {registration.status || 'active'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if registrations.length > 1000}
        <div class="table-footer">
          <p>Showing first 1,000 records. Total: {registrations.length.toLocaleString()} records</p>
          <p>Export to CSV to get all records</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .registrations-report {
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

  .filter-group select,
  .filter-group input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  .filter-group select:focus,
  .filter-group input:focus {
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

  .summary-card.registrations {
    border-left: 4px solid #3b82f6;
  }

  .summary-card.growth {
    border-left: 4px solid #10b981;
  }

  .summary-card.weekly {
    border-left: 4px solid #f59e0b;
  }

  .summary-card.average {
    border-left: 4px solid #8b5cf6;
  }

  .summary-card.branch {
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

  .customer-name {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.125rem;
  }

  .mobile-cell {
    font-family: monospace;
    color: #6b7280;
  }

  .email-cell {
    color: #6b7280;
    font-size: 0.8rem;
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

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .status-active {
    background: #dcfce7;
    color: #166534;
  }

  .status-inactive {
    background: #fef3c7;
    color: #92400e;
  }

  .status-blocked {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-suspended {
    background: #fde68a;
    color: #78350f;
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
    .registrations-report {
      padding: 1rem;
    }

    .summary-cards {
      grid-template-columns: 1fr;
    }

    .filters-grid {
      grid-template-columns: 1fr;
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
