<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let unregisteredActiveCustomers = [];
  let isLoading = false;
  let error = null;

  onMount(() => {
    loadUnregisteredActiveCustomers();
  });

  async function loadUnregisteredActiveCustomers() {
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
          is_active,
          branches:branch_id (
            name_en,
            name_ar,
            code
          ),
          card_types:card_type_id (
            name
          )
        `)
        .eq('card_status', 'unregistered')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50000); // High limit to override Supabase default 1000 limit

      if (customerError) throw customerError;
      unregisteredActiveCustomers = data || [];
    } catch (err) {
      error = `Failed to load unregistered active customers: ${err.message}`;
      console.error('Error loading unregistered active customers:', err);
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

      // Load ALL unregistered active customers for export
      const { data: allUnregistered, error } = await supabase
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
          is_active,
          branches:branch_id (
            name_en,
            name_ar,
            code
          ),
          card_types:card_type_id (
            name
          )
        `)
        .eq('card_status', 'unregistered')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        // No limit - export all unregistered active customers

      if (error) throw error;

      if (!allUnregistered || allUnregistered.length === 0) {
        alert('No unregistered active customers to export');
        return;
      }

      const csvContent = [
        // Header row
        ['Customer Code', 'Full Name', 'Phone', 'Email', 'Card Number', 'Card Type', 'Points', 'Total Visits', 'Last Visit', 'Branch', 'Created Date', 'Status'].join(','),
        // Data rows
        ...allUnregistered.map(customer => [
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
          customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '',
          'Unregistered'
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unregistered-active-customers-complete-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log(`Exported ${allUnregistered.length} unregistered active customer records`);
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

  function getDaysSinceCreated(dateString) {
    if (!dateString) return 'N/A';
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days ago`;
  }

  function getRegistrationUrgency(dateString) {
    if (!dateString) return { level: 'Unknown', class: 'unknown' };
    
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 7) return { level: 'New', class: 'new' };
    if (days <= 30) return { level: 'Recent', class: 'recent' };
    if (days <= 90) return { level: 'Pending', class: 'pending' };
    return { level: 'Overdue', class: 'overdue' };
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
          <h1>👤 Active Non-Registered Customers</h1>
          <p>Active customers in system but card registration status is unregistered</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-success" on:click={exportToExcel} disabled={isLoading || unregisteredActiveCustomers.length === 0}>
          📊 Export to Excel
        </button>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading unregistered active customers...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <div class="error-message">⚠️ {error}</div>
    </div>
  {:else}
    <div class="content-section">
      <div class="section-header">
        <h3>Unregistered Active Customers ({unregisteredActiveCustomers.length.toLocaleString()} records)</h3>
        <p class="section-description">These customers exist in the system and are active, but their card registration status is still "unregistered". They may need follow-up for card registration completion.</p>
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
              <th>Registration Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {#each unregisteredActiveCustomers as customer}
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
                    <div class="card-number">💳 {customer.card_number || 'No Card'}</div>
                    <div class="card-type">{customer.card_types?.name || 'Standard'}</div>
                  </div>
                </td>
                <td>
                  <div class="activity-info">
                    <div class="visits">{customer.total_visits || 0} visits</div>
                    <div class="last-visit">Last: {formatDate(customer.last_visit_date)}</div>
                  </div>
                </td>
                <td class="points">{(customer.total_points || 0).toLocaleString()}</td>
                <td>{customer.branches?.name_en || customer.branches?.name_ar || 'N/A'}</td>
                <td>
                  <div class="registration-status">
                    <span class="status-badge unregistered">
                      Unregistered
                    </span>
                    <div class="urgency">
                      <span class="urgency-badge {getRegistrationUrgency(customer.created_at).class}">
                        {getRegistrationUrgency(customer.created_at).level}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="date-info">
                    <div class="date">{formatDate(customer.created_at)}</div>
                    <div class="days-ago">{getDaysSinceCreated(customer.created_at)}</div>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if unregisteredActiveCustomers.length > 0}
        <div class="table-footer">
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-value">{unregisteredActiveCustomers.filter(c => getRegistrationUrgency(c.created_at).class === 'new').length}</span>
              <span class="stat-label">New (≤7 days)</span>
            </div>
            <div class="stat">
              <span class="stat-value">{unregisteredActiveCustomers.filter(c => getRegistrationUrgency(c.created_at).class === 'recent').length}</span>
              <span class="stat-label">Recent (8-30 days)</span>
            </div>
            <div class="stat">
              <span class="stat-value">{unregisteredActiveCustomers.filter(c => getRegistrationUrgency(c.created_at).class === 'pending').length}</span>
              <span class="stat-label">Pending (31-90 days)</span>
            </div>
            <div class="stat">
              <span class="stat-value">{unregisteredActiveCustomers.filter(c => getRegistrationUrgency(c.created_at).class === 'overdue').length}</span>
              <span class="stat-label">Overdue (>90 days)</span>
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
    max-width: 1600px;
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
    vertical-align: top;
  }

  .data-table th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
  }

  .customer-info, .contact-info, .card-info, .activity-info {
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

  .visits, .last-visit {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .points {
    font-weight: 600;
    color: #059669;
  }

  .registration-status {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .status-badge, .urgency-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.unregistered {
    background: #fef3c7;
    color: #92400e;
  }

  .urgency-badge.new {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .urgency-badge.recent {
    background: #d1fae5;
    color: #065f46;
  }

  .urgency-badge.pending {
    background: #fef3c7;
    color: #92400e;
  }

  .urgency-badge.overdue {
    background: #fee2e2;
    color: #991b1b;
  }

  .date-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
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
