<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let registeredCustomers = [];
  let isLoading = false;
  let error = null;

  onMount(() => {
    loadRegisteredCustomers();
  });

  async function loadRegisteredCustomers() {
    try {
      isLoading = true;
      error = null;

      const { data, error: customerError } = await supabase
        .from('customers')
        .select(`
          id,
          customer_code,
          full_name,
          phone,
          mobile,
          email,
          card_number,
          card_status,
          points,
          total_points,
          is_active,
          created_at,
          branches:branch_id (
            name_en,
            name_ar,
            code
          ),
          card_types:card_type_id (
            name
          )
        `)
        .eq('card_status', 'registered')
        .order('created_at', { ascending: false })
        .limit(15000); // Set high limit for registered customers

      if (customerError) throw customerError;
      registeredCustomers = data || [];
    } catch (err) {
      error = `Failed to load registered customers: ${err.message}`;
      console.error('Error loading registered customers:', err);
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

      // Load ALL registered customers for export
      const { data: allRegistered, error } = await supabase
        .from('customers')
        .select(`
          id,
          customer_code,
          full_name,
          phone,
          mobile,
          email,
          card_number,
          card_status,
          points,
          total_points,
          is_active,
          created_at,
          branches:branch_id (
            name_en,
            name_ar,
            code
          ),
          card_types:card_type_id (
            name
          )
        `)
        .eq('card_status', 'registered')
        .order('created_at', { ascending: false })
        .limit(50000); // Very high limit

      if (error) throw error;

      if (!allRegistered || allRegistered.length === 0) {
        alert('No registered customers to export');
        return;
      }

      const csvContent = [
        // Header row
        ['Customer Code', 'Full Name', 'Phone', 'Email', 'Card Number', 'Card Type', 'Points', 'Branch', 'Status', 'Registration Date'].join(','),
        // Data rows
        ...allRegistered.map(customer => [
          customer.customer_code || '',
          customer.full_name || '',
          customer.phone || customer.mobile || '',
          customer.email || '',
          customer.card_number || '',
          customer.card_types?.name || '',
          customer.total_points || 0,
          customer.branches?.name_en || customer.branches?.name_ar || '',
          customer.is_active ? 'Active' : 'Inactive',
          customer.created_at ? new Date(customer.created_at).toLocaleDateString() : ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registered-customers-complete-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log(`Exported ${allRegistered.length} registered customer records`);
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
          <h1>💳 Registered Cards</h1>
          <p>Customers who have registered their loyalty cards</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-success" on:click={exportToExcel} disabled={isLoading || registeredCustomers.length === 0}>
          📊 Export to Excel
        </button>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading registered customers...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <div class="error-message">⚠️ {error}</div>
    </div>
  {:else}
    <div class="content-section">
      <div class="section-header">
        <h3>Registered Customers ({registeredCustomers.length.toLocaleString()} records)</h3>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Card Details</th>
              <th>Points</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
            {#each registeredCustomers as customer}
              <tr>
                <td>
                  <div class="customer-info">
                    <div class="customer-code">#{customer.customer_code}</div>
                    {#if customer.full_name}
                      <div class="customer-name">{customer.full_name}</div>
                    {/if}
                  </div>
                </td>
                <td>
                  <div class="contact-info">
                    {#if customer.phone || customer.mobile}
                      <div class="phone">📱 {customer.phone || customer.mobile}</div>
                    {/if}
                    {#if customer.email}
                      <div class="email">✉️ {customer.email}</div>
                    {/if}
                  </div>
                </td>
                <td>
                  <div class="card-info">
                    <div class="card-number">💳 {customer.card_number || 'N/A'}</div>
                    <div class="card-type">{customer.card_types?.name || 'Standard'}</div>
                  </div>
                </td>
                <td class="points">{(customer.total_points || 0).toLocaleString()}</td>
                <td>{customer.branches?.name_en || customer.branches?.name_ar || 'N/A'}</td>
                <td>
                  <span class="status-badge {customer.is_active ? 'active' : 'inactive'}">
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</td>
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
    max-width: 1400px;
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
    vertical-align: top;
  }

  .data-table th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
  }

  .customer-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .customer-code {
    font-family: monospace;
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }

  .customer-name {
    color: #4b5563;
    font-size: 0.875rem;
  }

  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .phone, .email {
    font-size: 0.875rem;
    color: #4b5563;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
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

  .points {
    font-weight: 600;
    color: #059669;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.active {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.inactive {
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
