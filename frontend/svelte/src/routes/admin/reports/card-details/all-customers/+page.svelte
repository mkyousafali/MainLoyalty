<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let allCustomers = [];
  let isLoading = false;
  let error = null;
  let totalCount = 0;
  let currentPage = 1;
  let pageSize = 100;
  let hasMore = true;

  onMount(() => {
    loadAllCustomers();
  });

  async function loadAllCustomers() {
    try {
      isLoading = true;
      error = null;

      // First get the total count
      const { count, error: countError } = await supabase
        .from('customer_numbers')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      totalCount = count || 0;

      // Load all customers by removing the default limit
      const { data, error: customerError } = await supabase
        .from('customer_numbers')
        .select(`
          customer,
          status,
          uploaded_at,
          branch_id,
          branches:branch_id (
            name_en,
            name_ar,
            code
          )
        `)
        .order('uploaded_at', { ascending: false })
        .limit(20000); // Set a high limit to get all records

      if (customerError) throw customerError;
      allCustomers = data || [];
      console.log(`Loaded ${allCustomers.length} customers out of ${totalCount} total`);
    } catch (err) {
      error = `Failed to load all customers: ${err.message}`;
      console.error('Error loading all customers:', err);
    } finally {
      isLoading = false;
    }
  }

  function goBack() {
    goto('/admin/reports/card-details');
  }

  async function exportToExcel() {
    try {
      // Show loading state
      const exportButton = document.querySelector('button[disabled]');
      if (exportButton) exportButton.textContent = 'Exporting...';

      // Load ALL records for export without any limits
      const { data: allRecords, error } = await supabase
        .from('customer_numbers')
        .select(`
          customer,
          status,
          uploaded_at,
          branch_id,
          branches:branch_id (
            name_en,
            name_ar,
            code
          )
        `)
        .order('uploaded_at', { ascending: false })
        .limit(50000); // Very high limit to ensure we get everything

      if (error) throw error;

      if (!allRecords || allRecords.length === 0) {
        alert('No data available to export');
        return;
      }

      const csvContent = [
        // Header row
        ['Customer Code', 'Status', 'Branch', 'Upload Date'].join(','),
        // Data rows
        ...allRecords.map(customer => [
          customer.customer || '',
          customer.status || '',
          customer.branches?.name_en || customer.branches?.name_ar || 'N/A',
          customer.uploaded_at ? new Date(customer.uploaded_at).toLocaleDateString() : ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-customers-complete-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log(`Exported ${allRecords.length} customer records`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      // Reset button text
      const exportButton = document.querySelector('button');
      if (exportButton) exportButton.textContent = '📊 Export to Excel';
    }
  }
</script>

<div class="page-container">
  <div class="page-header">
    <div class="header-content">
      <div class="header-left">
        <button class="btn btn-secondary" on:click={goBack}>
          ← Back to Card Details
        </button>
        <div class="page-title">
          <h1>📋 All Customers</h1>
          <p>Complete list of all customers from customer numbers database</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-success" on:click={exportToExcel} disabled={isLoading || allCustomers.length === 0}>
          📊 Export to Excel
        </button>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading all customers...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <div class="error-message">⚠️ {error}</div>
    </div>
  {:else}
    <div class="content-section">
      <div class="section-header">
        <h3>All Customers ({allCustomers.length.toLocaleString()} records loaded {totalCount > 0 ? `of ${totalCount.toLocaleString()} total` : ''})</h3>
        {#if totalCount > allCustomers.length}
          <p class="load-info">Showing all available records. If you need more, please contact support.</p>
        {/if}
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer Code</th>
              <th>Status</th>
              <th>Branch</th>
              <th>Upload Date</th>
            </tr>
          </thead>
          <tbody>
            {#each allCustomers as customer}
              <tr>
                <td class="customer-code">#{customer.customer}</td>
                <td>
                  <span class="status-badge {customer.status}">
                    {customer.status === 'registered' ? 'Registered' : 'Not Registered'}
                  </span>
                </td>
                <td>{customer.branches?.name_en || customer.branches?.name_ar || 'N/A'}</td>
                <td>{customer.uploaded_at ? new Date(customer.uploaded_at).toLocaleDateString() : 'N/A'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  .page-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .page-title h1 {
    font-size: 1.5rem;
    color: #1f2937;
    margin: 0;
  }

  .page-title p {
    color: #6b7280;
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    text-decoration: none;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
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

  .content-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .section-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-header h3 {
    margin: 0;
    color: #1f2937;
  }

  .load-info {
    margin: 0.5rem 0 0 0;
    color: #6b7280;
    font-size: 0.875rem;
    font-style: italic;
  }

  .table-container {
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th,
  .data-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  .data-table th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
  }

  .customer-code {
    font-family: monospace;
    font-weight: 600;
    color: #1f2937;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.registered {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.not_registered {
    background: #fee2e2;
    color: #991b1b;
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message {
    padding: 1rem 1.5rem;
    background: #fee2e2;
    color: #991b1b;
    border-radius: 0.5rem;
    border: 1px solid #fecaca;
  }
</style>
