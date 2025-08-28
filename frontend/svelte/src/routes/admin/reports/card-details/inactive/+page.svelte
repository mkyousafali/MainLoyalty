<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let inactiveCustomers = [];
  let isLoading = false;
  let error = null;

  onMount(() => {
    loadInactiveCustomers();
  });

  async function loadInactiveCustomers() {
    try {
      isLoading = true;
      error = null;

      // Get all customers from customer_numbers
      const { data: customerNumbers, error: numbersError } = await supabase
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
        .limit(50000);

      if (numbersError) throw numbersError;

      // Get all customer codes from customers table (regardless of registration status)
      const { data: existingCustomers, error: existingError } = await supabase
        .from('customers')
        .select('customer_code')
        .limit(50000);

      if (existingError) throw existingError;

      const existingCodes = new Set((existingCustomers || []).map(c => c.customer_code));

      // Filter customers who are in customer_numbers but NOT in customers table at all
      inactiveCustomers = (customerNumbers || []).filter(customer => 
        !existingCodes.has(customer.customer)
      );

    } catch (err) {
      error = `Failed to load inactive customers: ${err.message}`;
      console.error('Error loading inactive customers:', err);
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

      // Load ALL customers from customer_numbers who are not in customers table
      const { data: allNumbers, error: numbersError } = await supabase
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
        .limit(50000);

      if (numbersError) throw numbersError;

      // Get all existing customers
      const { data: existingCustomers, error: existingError } = await supabase
        .from('customers')
        .select('customer_code')
        .limit(50000);

      if (existingError) throw existingError;

      const existingCodes = new Set((existingCustomers || []).map(c => c.customer_code));

      // Filter inactive customers
      const allInactive = (allNumbers || []).filter(customer => 
        !existingCodes.has(customer.customer)
      );

      if (!allInactive || allInactive.length === 0) {
        alert('No inactive customers to export');
        return;
      }

      const csvContent = [
        // Header row
        ['Customer Code', 'Status', 'Branch', 'Upload Date', 'Days Since Upload'].join(','),
        // Data rows
        ...allInactive.map(customer => [
          customer.customer || '',
          customer.status || 'not_registered',
          customer.branches?.name_en || customer.branches?.name_ar || 'N/A',
          customer.uploaded_at ? new Date(customer.uploaded_at).toLocaleDateString() : '',
          customer.uploaded_at ? Math.floor((Date.now() - new Date(customer.uploaded_at).getTime()) / (1000 * 60 * 60 * 24)) : ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inactive-customers-complete-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log(`Exported ${allInactive.length} inactive customer records`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      // Reset button text
      const exportButton = document.querySelector('button');
      if (exportButton) exportButton.textContent = '📊 Export to Excel';
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  function getDaysSinceUpload(dateString) {
    if (!dateString) return 'N/A';
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }

  function getUrgencyLevel(dateString) {
    if (!dateString) return { level: 'Unknown', class: 'unknown' };
    
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 30) return { level: 'Recent', class: 'recent' };
    if (days <= 90) return { level: 'Moderate', class: 'moderate' };
    if (days <= 180) return { level: 'Old', class: 'old' };
    return { level: 'Very Old', class: 'very-old' };
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
          <h1>❌ Inactive Customers</h1>
          <p>Customers in numbers database but not created in system</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-success" on:click={exportToExcel} disabled={isLoading || inactiveCustomers.length === 0}>
          📊 Export to Excel
        </button>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading inactive customers...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <div class="error-message">⚠️ {error}</div>
    </div>
  {:else}
    <div class="content-section">
      <div class="section-header">
        <h3>Inactive Customers ({inactiveCustomers.length.toLocaleString()} records)</h3>
        <p class="section-description">These customers exist in the customer_numbers table but have not been created in the customers table yet.</p>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer Code</th>
              <th>Status</th>
              <th>Branch</th>
              <th>Upload Date</th>
              <th>Days Since Upload</th>
              <th>Action Needed</th>
            </tr>
          </thead>
          <tbody>
            {#each inactiveCustomers as customer}
              <tr>
                <td class="customer-code">#{customer.customer}</td>
                <td>
                  <span class="status-badge not-registered">Not in System</span>
                </td>
                <td>{customer.branches?.name_en || customer.branches?.name_ar || 'N/A'}</td>
                <td>{formatDate(customer.uploaded_at)}</td>
                <td class="days-since">{getDaysSinceUpload(customer.uploaded_at)}</td>
                <td>
                  <span class="urgency-badge {getUrgencyLevel(customer.uploaded_at).class}">
                    {getUrgencyLevel(customer.uploaded_at).level}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      {#if inactiveCustomers.length > 0}
        <div class="table-footer">
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-value">{inactiveCustomers.filter(c => getUrgencyLevel(c.uploaded_at).class === 'recent').length}</span>
              <span class="stat-label">Recent (≤30 days)</span>
            </div>
            <div class="stat">
              <span class="stat-value">{inactiveCustomers.filter(c => getUrgencyLevel(c.uploaded_at).class === 'moderate').length}</span>
              <span class="stat-label">Moderate (31-90 days)</span>
            </div>
            <div class="stat">
              <span class="stat-value">{inactiveCustomers.filter(c => getUrgencyLevel(c.uploaded_at).class === 'old').length}</span>
              <span class="stat-label">Old (91-180 days)</span>
            </div>
            <div class="stat">
              <span class="stat-value">{inactiveCustomers.filter(c => getUrgencyLevel(c.uploaded_at).class === 'very-old').length}</span>
              <span class="stat-label">Very Old (>180 days)</span>
            </div>
          </div>
        </div>
      {/if}
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
    margin: 0 0 0.5rem 0;
    color: #1f2937;
  }

  .section-description {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
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

  .days-since {
    font-weight: 500;
    color: #6b7280;
  }

  .status-badge, .urgency-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.not-registered {
    background: #fee2e2;
    color: #991b1b;
  }

  .urgency-badge.recent {
    background: #d1fae5;
    color: #065f46;
  }

  .urgency-badge.moderate {
    background: #fef3c7;
    color: #92400e;
  }

  .urgency-badge.old {
    background: #fed7aa;
    color: #c2410c;
  }

  .urgency-badge.very-old {
    background: #fee2e2;
    color: #991b1b;
  }

  .urgency-badge.unknown {
    background: #f3f4f6;
    color: #6b7280;
  }

  .customer-info, .contact-info, .card-info, .activity-info, .date-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .customer-name {
    color: #4b5563;
    font-size: 0.875rem;
  }

  .phone, .email {
    font-size: 0.875rem;
    color: #4b5563;
  }

  .card-number {
    font-family: monospace;
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }

  .card-type {
    color: #4b5563;
    font-size: 0.875rem;
  }

  .visits, .last-visit {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .points {
    font-weight: 600;
    color: #059669;
  }

  .status-badge.inactive {
    background: #fee2e2;
    color: #991b1b;
  }

  .date {
    font-size: 0.875rem;
    color: #1f2937;
  }

  .days-ago {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .table-footer {
    padding: 1.5rem;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }

  .summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .stat {
    text-align: center;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
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
