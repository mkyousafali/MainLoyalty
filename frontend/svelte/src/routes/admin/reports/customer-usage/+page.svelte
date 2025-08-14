<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../../../../lib/supabase';

  let isLoading = false;
  let error: string | null = null;

  onMount(() => {
    // Implementation coming soon
  });
</script>

<svelte:head>
  <title>Customer Usage Report - Admin Panel</title>
</svelte:head>

<div class="customer-usage-report">
  <!-- Top Bar -->
  <div class="report-header">
    <div class="header-left">
      <h1>👥 Customer Usage Report</h1>
      <p>Analyze customer engagement and usage patterns</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary" on:click={() => window.history.back()}>
        ← Back to Reports
      </button>
    </div>
  </div>

  <!-- Coming Soon Section -->
  <div class="coming-soon">
    <div class="coming-soon-content">
      <div class="coming-soon-icon">🚧</div>
      <h2>Coming Soon</h2>
      <p>Customer Usage Report is currently under development.</p>
      <p>This report will include:</p>
      <ul>
        <li>Customer engagement metrics</li>
        <li>Usage pattern analysis</li>
        <li>Activity trend tracking</li>
        <li>Customer behavior insights</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .customer-usage-report {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
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
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }

  .coming-soon {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .coming-soon-content {
    text-align: center;
    max-width: 500px;
    padding: 2rem;
  }

  .coming-soon-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .coming-soon-content h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }

  .coming-soon-content p {
    color: #6b7280;
    margin-bottom: 1rem;
  }

  .coming-soon-content ul {
    text-align: left;
    color: #6b7280;
    margin: 1rem 0;
  }

  .coming-soon-content li {
    margin-bottom: 0.5rem;
  }
</style>
