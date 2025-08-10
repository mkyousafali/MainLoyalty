<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase, TABLES } from '$lib/supabase';

  // Component state
  let untilDate = '';
  let searchTerm = '';
  let selectedCustomers: number[] = [];
  let selectAll = false;
  let showConfirmDialog = false;
  let deleteType: 'date' | 'customers' | 'both' = 'date';
  let isDeleting = false;
  let confirmText = '';
  let isLoading = true;

  // Sample customers data (replace with actual API call)
  let customers: Array<{
    id: number;
    customer_code: string;
    full_name: string;
    email: string;
    phone: string;
    total_transactions: number;
    total_amount: number;
    created_at: string;
  }> = [];

  // Filtered customers based on search
  $: filteredCustomers = customers.filter(customer => 
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  // Check if clear button should be enabled
  $: canClearByDate = untilDate;
  $: canClearByCustomers = selectedCustomers.length > 0;
  $: canClear = canClearByDate || canClearByCustomers;

  // Handle select all checkbox
  function handleSelectAll() {
    if (selectAll) {
      selectedCustomers = filteredCustomers.map(c => c.id);
    } else {
      selectedCustomers = [];
    }
  }

  // Handle individual customer selection
  function handleCustomerSelect(customerId: number) {
    if (selectedCustomers.includes(customerId)) {
      selectedCustomers = selectedCustomers.filter(id => id !== customerId);
    } else {
      selectedCustomers = [...selectedCustomers, customerId];
    }
    
    // Update select all checkbox
    selectAll = selectedCustomers.length === filteredCustomers.length;
  }

  // Update select all when filtered customers change
  $: {
    if (filteredCustomers.length > 0) {
      selectAll = filteredCustomers.every(customer => selectedCustomers.includes(customer.id));
    }
  }

  // Open confirmation dialog
  function openConfirmDialog() {
    if (canClearByDate && canClearByCustomers) {
      deleteType = 'both';
    } else if (canClearByDate) {
      deleteType = 'date';
    } else {
      deleteType = 'customers';
    }
    showConfirmDialog = true;
  }

  // Close confirmation dialog
  function closeConfirmDialog() {
    showConfirmDialog = false;
  }

  // Perform the actual deletion
  async function performDeletion() {
    isDeleting = true;
    
    try {
      let deletedCount = 0;
      
      if (deleteType === 'date') {
        // Delete transactions until specified date
        const { data, error } = await supabase
          .from(TABLES.CUSTOMER_TRANSACTIONS)
          .delete()
          .lte('transaction_date', untilDate);
          
        if (error) throw error;
        deletedCount = data?.length || 0;
        
      } else if (deleteType === 'customers') {
        // Delete transactions for selected customers
        const customerMobiles = customers
          .filter(c => selectedCustomers.includes(c.id))
          .map(c => c.customer_code);
          
        const { data, error } = await supabase
          .from(TABLES.CUSTOMER_TRANSACTIONS)
          .delete()
          .in('customer_mobile', customerMobiles);
          
        if (error) throw error;
        deletedCount = data?.length || 0;
        
      } else { // both
        // Delete transactions for selected customers until specified date
        const customerMobiles = customers
          .filter(c => selectedCustomers.includes(c.id))
          .map(c => c.customer_code);
          
        const { data, error } = await supabase
          .from(TABLES.CUSTOMER_TRANSACTIONS)
          .delete()
          .in('customer_mobile', customerMobiles)
          .lte('transaction_date', untilDate);
          
        if (error) throw error;
        deletedCount = data?.length || 0;
      }
      
      // Reset form
      untilDate = '';
      selectedCustomers = [];
      selectAll = false;
      showConfirmDialog = false;
      
      // Reload customers data
      await loadCustomers();
      
      // Show success message
      alert(`Successfully cleared ${deletedCount} transactions!`);
      
    } catch (error) {
      console.error('Error clearing transactions:', error);
      alert('Error clearing transactions. Please try again.');
    } finally {
      isDeleting = false;
    }
  }

  // Load customers from database
  async function loadCustomers() {
    isLoading = true;
    try {
      // Get customers with their transaction counts and totals
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .select(`
          id,
          mobile,
          name,
          email,
          address,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading customers:', error);
        customers = [];
      } else {
        // Transform data to match expected format
        customers = (data || []).map(customer => ({
          id: customer.id,
          customer_code: customer.mobile,
          full_name: customer.name || `Customer ${customer.mobile}`,
          email: customer.email || '',
          phone: customer.mobile,
          total_transactions: 0, // TODO: Calculate from transactions
          total_amount: 0, // TODO: Calculate from transactions
          created_at: customer.created_at
        }));
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      customers = [];
    } finally {
      isLoading = false;
    }
  }

  // Set minimum date to prevent future dates
  const today = new Date().toISOString().split('T')[0];

  // Load data on mount
  onMount(async () => {
    await loadCustomers();
  });

  // Reload customers when search term changes
  $: if (searchTerm !== undefined) {
    loadCustomers();
  }
</script>

<div class="clear-transactions-page">
  <!-- Page Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="header-text">
        <h1>Clear Transactions</h1>
        <p class="header-description">
          Remove transaction data by date range and/or specific customers. This action cannot be undone.
        </p>
      </div>
      <div class="header-actions">
        <button 
          class="clear-button"
          class:enabled={canClear}
          disabled={!canClear}
          on:click={openConfirmDialog}
        >
          <span class="button-icon">🗑️</span>
          Clear Selected Data
        </button>
      </div>
    </div>
  </div>

  <!-- Warning Notice -->
  <div class="warning-notice">
    <div class="warning-icon">⚠️</div>
    <div class="warning-content">
      <h3>Important Warning</h3>
      <p>Clearing transactions will permanently delete the selected data and cannot be recovered. Please ensure you have proper backups before proceeding.</p>
    </div>
  </div>

  <!-- Main Content -->
  <div class="content-grid">
    <!-- Date Range Selection -->
    <div class="card date-selection-card">
      <div class="card-header">
        <h2>Clear by Date</h2>
        <p>Select date to clear all transactions up to and including the specified date</p>
      </div>
      <div class="card-content">
        <div class="date-inputs">
          <div class="input-group">
            <label for="untilDate">Clear transactions until date:</label>
            <input 
              type="date" 
              id="untilDate"
              bind:value={untilDate}
              max={today}
              class="date-input"
            />
          </div>
        </div>
        
        {#if canClearByDate}
          <div class="date-summary">
            <div class="summary-item">
              <span class="summary-label">Clear Until:</span>
              <span class="summary-value">{untilDate}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Action:</span>
              <span class="summary-value danger">All transactions up to this date will be deleted</span>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Customer Selection -->
    <div class="card customer-selection-card">
      <div class="card-header">
        <h2>Clear by Customers</h2>
        <p>Select specific customers to clear all their transaction data</p>
      </div>
      <div class="card-content">
        <!-- Search and Controls -->
        <div class="search-controls">
          <div class="search-box">
            <input 
              type="text" 
              placeholder="Search customers by name, code, email, or phone..."
              bind:value={searchTerm}
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
          <div class="selection-info">
            <span class="selected-count">{selectedCustomers.length} of {filteredCustomers.length} selected</span>
          </div>
        </div>

        <!-- Customer Table -->
        <div class="customer-table-container">
          {#if isLoading}
            <div class="loading-state">
              <div class="loading-spinner"></div>
              <p>Loading customers...</p>
            </div>
          {:else}
            <table class="customer-table">
              <thead>
                <tr>
                  <th class="select-column">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        bind:checked={selectAll}
                        on:change={handleSelectAll}
                        class="select-checkbox"
                      />
                      <span class="checkbox-custom"></span>
                    </label>
                  </th>
                  <th>Code</th>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Transactions</th>
                  <th>Total Amount</th>
                  <th>Registration</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredCustomers as customer (customer.id)}
                  <tr class="customer-row" class:selected={selectedCustomers.includes(customer.id)}>
                    <td class="select-column">
                      <label class="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={selectedCustomers.includes(customer.id)}
                          on:change={() => handleCustomerSelect(customer.id)}
                          class="select-checkbox"
                        />
                        <span class="checkbox-custom"></span>
                      </label>
                    </td>
                    <td class="customer-code">{customer.customer_code}</td>
                    <td class="customer-name">{customer.full_name}</td>
                    <td class="customer-email">{customer.email || 'N/A'}</td>
                    <td class="customer-phone">{customer.phone}</td>
                    <td class="transaction-count">{customer.total_transactions}</td>
                    <td class="total-amount">{customer.total_amount.toLocaleString()} SAR</td>
                    <td class="registration-date">{new Date(customer.created_at).toLocaleDateString()}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}

          {#if !isLoading && filteredCustomers.length === 0}
            <div class="no-results">
              <div class="no-results-icon">👥</div>
              <h3>No customers found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          {/if}
        </div>

        {#if selectedCustomers.length > 0}
          <div class="selection-summary">
            <h3>Selected Customers Summary</h3>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-label">Customers Selected:</span>
                <span class="stat-value">{selectedCustomers.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Transactions:</span>
                <span class="stat-value">
                  {filteredCustomers
                    .filter(c => selectedCustomers.includes(c.id))
                    .reduce((sum, c) => sum + c.total_transactions, 0)
                  }
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Amount:</span>
                <span class="stat-value">
                  {filteredCustomers
                    .filter(c => selectedCustomers.includes(c.id))
                    .reduce((sum, c) => sum + c.total_amount, 0)
                    .toLocaleString()
                  } SAR
                </span>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Confirmation Dialog -->
{#if showConfirmDialog}
  <div class="modal-overlay" on:click={closeConfirmDialog}>
    <div class="modal-content" on:click={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Confirm Transaction Deletion</h2>
        <button class="modal-close" on:click={closeConfirmDialog}>✕</button>
      </div>
      
      <div class="modal-body">
        <div class="confirmation-warning">
          <div class="warning-icon-large">⚠️</div>
          <h3>This action cannot be undone!</h3>
          <p>You are about to permanently delete transaction data. Please review the details below:</p>
        </div>

        <div class="deletion-summary">
          {#if deleteType === 'date' || deleteType === 'both'}
            <div class="summary-section">
              <h4>Date-Based Deletion</h4>
              <ul>
                <li><strong>Clear Until Date:</strong> {untilDate}</li>
                <li><strong>Scope:</strong> All transactions up to and including this date</li>
              </ul>
            </div>
          {/if}

          {#if deleteType === 'customers' || deleteType === 'both'}
            <div class="summary-section">
              <h4>Customer-Specific Deletion</h4>
              <ul>
                <li><strong>Selected Customers:</strong> {selectedCustomers.length}</li>
                <li><strong>Total Transactions:</strong>
                  {filteredCustomers
                    .filter(c => selectedCustomers.includes(c.id))
                    .reduce((sum, c) => sum + c.total_transactions, 0)
                  }
                </li>
                <li><strong>Total Amount:</strong>
                  {filteredCustomers
                    .filter(c => selectedCustomers.includes(c.id))
                    .reduce((sum, c) => sum + c.total_amount, 0)
                    .toLocaleString()
                  } SAR
                </li>
              </ul>
            </div>
          {/if}
        </div>

        <div class="confirmation-input">
          <p><strong>Type "DELETE" to confirm:</strong></p>
          <input 
            type="text" 
            placeholder="Type DELETE to confirm"
            bind:value={confirmText}
            class="confirm-input"
          />
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={closeConfirmDialog}>Cancel</button>
        <button 
          class="btn btn-danger" 
          disabled={confirmText !== 'DELETE' || isDeleting}
          on:click={performDeletion}
        >
          {#if isDeleting}
            <span class="loading-spinner"></span>
            Deleting...
          {:else}
            Permanently Delete
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .clear-transactions-page {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Page Header */
  .page-header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .header-text h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .header-description {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
  }

  .clear-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
  }

  .clear-button:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .clear-button.enabled:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }

  .button-icon {
    font-size: 1.1rem;
  }

  /* Warning Notice */
  .warning-notice {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
  }

  .warning-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .warning-content h3 {
    margin: 0 0 0.5rem 0;
    color: #92400e;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .warning-content p {
    margin: 0;
    color: #92400e;
    line-height: 1.5;
  }

  /* Content Grid */
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
  }

  @media (max-width: 1024px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Cards */
  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .card-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .card-header h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  .card-header p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .card-content {
    padding: 1.5rem;
  }

  /* Date Selection */
  .date-inputs {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-group label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .date-input {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
  }

  .date-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .date-summary {
    background: #f3f4f6;
    border-radius: 8px;
    padding: 1rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .summary-item:last-child {
    margin-bottom: 0;
  }

  .summary-label {
    font-weight: 500;
    color: #374151;
  }

  .summary-value {
    color: #1f2937;
  }

  .summary-value.danger {
    color: #ef4444;
    font-weight: 600;
  }

  /* Search Controls */
  .search-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .search-box {
    position: relative;
    flex: 1;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    font-size: 1rem;
  }

  .selected-count {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  /* Customer Table */
  .customer-table-container {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .loading-state .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .customer-table {
    width: 100%;
    border-collapse: collapse;
  }

  .customer-table th {
    background: #f9fafb;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .customer-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.875rem;
  }

  .customer-row:hover {
    background: #f9fafb;
  }

  .customer-row.selected {
    background: #eff6ff;
  }

  .select-column {
    width: 50px;
    text-align: center;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .select-checkbox {
    appearance: none;
    width: 1rem;
    height: 1rem;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .select-checkbox:checked {
    background: #3b82f6;
    border-color: #3b82f6;
  }

  .select-checkbox:checked::after {
    content: '✓';
    display: block;
    color: white;
    text-align: center;
    font-size: 0.75rem;
    line-height: 1;
  }

  .customer-code {
    font-weight: 600;
    color: #1f2937;
  }

  .customer-name {
    font-weight: 500;
    color: #1f2937;
  }

  .customer-email {
    color: #6b7280;
  }

  .customer-phone {
    color: #6b7280;
    font-family: monospace;
  }

  .transaction-count {
    font-weight: 600;
    color: #059669;
  }

  .total-amount {
    font-weight: 600;
    color: #dc2626;
  }

  .registration-date {
    color: #6b7280;
    font-size: 0.8rem;
  }

  /* No Results */
  .no-results {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .no-results-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .no-results h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .no-results p {
    margin: 0;
    font-size: 0.875rem;
  }

  /* Selection Summary */
  .selection-summary {
    background: #f0f9ff;
    border: 1px solid #0ea5e9;
    border-radius: 8px;
    padding: 1rem;
  }

  .selection-summary h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #0c4a6e;
  }

  .summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #0c4a6e;
    font-weight: 500;
  }

  .stat-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0369a1;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.2s ease;
  }

  .modal-close:hover {
    color: #374151;
    background: #f3f4f6;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .confirmation-warning {
    text-align: center;
    margin-bottom: 2rem;
  }

  .warning-icon-large {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .confirmation-warning h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #dc2626;
  }

  .confirmation-warning p {
    margin: 0;
    color: #6b7280;
    line-height: 1.5;
  }

  .deletion-summary {
    margin-bottom: 1.5rem;
  }

  .summary-section {
    margin-bottom: 1.5rem;
  }

  .summary-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .summary-section ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #6b7280;
  }

  .summary-section li {
    margin-bottom: 0.25rem;
  }

  .confirmation-input {
    margin-bottom: 1rem;
  }

  .confirmation-input p {
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    color: #1f2937;
  }

  .confirm-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #dc2626;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }

  .confirm-input:focus {
    outline: none;
    border-color: #b91c1c;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
  }

  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive */
    @media (max-width: 768px) {
      .clear-transactions-page {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .search-controls {
        flex-direction: column;
        align-items: stretch;
      }    .customer-table-container {
      overflow-x: auto;
    }

    .customer-table {
      min-width: 800px;
    }

    .summary-stats {
      grid-template-columns: 1fr;
    }
  }
</style>
