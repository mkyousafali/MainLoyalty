<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let activeCustomers = [];
  let isLoading = false;
  let error = null;

  onMount(() => {
    loadActiveCustomers();
  });

  async function loadActiveCustomers() {
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
          total_visits,
          last_visit_date,
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
        .eq('is_active', true)
        .order('last_visit_date', { ascending: false })
        .limit(15000); // Set high limit for active customers

      if (customerError) throw customerError;
      activeCustomers = data || [];
    } catch (err) {
      error = `Failed to load active customers: ${err.message}`;
      console.error('Error loading active customers:', err);
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

      // Load ALL active customers for export
      const { data: allActive, error } = await supabase
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
          total_visits,
          last_visit_date,
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
        .eq('is_active', true)
        .order('last_visit_date', { ascending: false })
        .limit(50000); // Very high limit

      if (error) throw error;

      if (!allActive || allActive.length === 0) {
        alert('No active customers to export');
        return;
      }

      const csvContent = [
        // Header row
        ['Customer Code', 'Full Name', 'Phone', 'Email', 'Card Number', 'Card Type', 'Points', 'Total Visits', 'Last Visit', 'Branch', 'Registration Date'].join(','),
        // Data rows
        ...allActive.map(customer => [
          customer.customer_code || '',
          customer.full_name || '',
          customer.phone || customer.mobile || '',
          customer.email || '',
          customer.card_number || '',
          customer.card_types?.name || '',
          customer.total_points || 0,
          customer.total_visits || 0,
          customer.last_visit_date ? new Date(customer.last_visit_date).toLocaleDateString() : '',
          customer.branches?.name_en || customer.branches?.name_ar || '',
          customer.created_at ? new Date(customer.created_at).toLocaleDateString() : ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `active-customers-complete-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log(`Exported ${allActive.length} active customer records`);
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

  function getActivityLevel(visits, lastVisit) {
    if (!lastVisit) return { level: 'No Activity', class: 'no-activity' };
    
    const daysSinceLastVisit = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastVisit <= 7) return { level: 'Very Active', class: 'very-active' };
    if (daysSinceLastVisit <= 30) return { level: 'Active', class: 'active' };
    if (daysSinceLastVisit <= 90) return { level: 'Moderate', class: 'moderate' };
    return { level: 'Low Activity', class: 'low-activity' };
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
          <h1>✅ Active Cards</h1>
          <p>Registered customers with active loyalty cards</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-success" on:click={exportToExcel} disabled={isLoading || activeCustomers.length === 0}>
          📊 Export to Excel
        </button>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading active customers...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <div class="error-message">⚠️ {error}</div>
    </div>
  {:else}
    <div class="content-section">
      <div class="section-header">
        <h3>Active Customers ({activeCustomers.length.toLocaleString()} records)</h3>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Card Details</th>
              <th>Activity</th>
              <th>Points</th>
              <th>Branch</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
            {#each activeCustomers as customer}
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
                <td>
                  <div class="activity-info">
                    <div class="activity-level">
                      <span class="activity-badge {getActivityLevel(customer.total_visits, customer.last_visit_date).class}">
                        {getActivityLevel(customer.total_visits, customer.last_visit_date).level}
                      </span>
                    </div>
                    <div class="activity-stats">
                      <div class="visits">{customer.total_visits || 0} visits</div>
                      <div class="last-visit">Last: {formatDate(customer.last_visit_date)}</div>
                    </div>
                  </div>
                </td>
                <td class="points">{(customer.total_points || 0).toLocaleString()}</td>
                <td>{customer.branches?.name_en || customer.branches?.name_ar || 'N/A'}</td>
                <td>{formatDate(customer.created_at)}</td>
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

  .customer-info, .contact-info, .card-info {
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

  .activity-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .activity-stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .visits, .last-visit {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .activity-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .activity-badge.very-active {
    background: #dcfce7;
    color: #166534;
  }

  .activity-badge.active {
    background: #d1fae5;
    color: #065f46;
  }

  .activity-badge.moderate {
    background: #fef3c7;
    color: #92400e;
  }

  .activity-badge.low-activity {
    background: #fee2e2;
    color: #991b1b;
  }

  .activity-badge.no-activity {
    background: #f3f4f6;
    color: #6b7280;
  }

  .points {
    font-weight: 600;
    color: #059669;
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
