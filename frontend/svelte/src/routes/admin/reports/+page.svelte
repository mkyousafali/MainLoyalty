<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // Report sections
  const reportSections = [
    {
      id: 'transaction-report',
      title: 'Transaction Report',
      description: 'Comprehensive analysis of all transactions with filtering options',
      icon: '💰',
      href: '/admin/reports/transaction-report',
      features: ['Date Filters', 'Customer Filters', 'Total Calculations', 'Export Data']
    },
    {
      id: 'customer-usage',
      title: 'Customer Usage Report',
      description: 'Analyze customer engagement and usage patterns',
      icon: '👥',
      href: '/admin/reports/customer-usage', 
      features: ['Usage Analytics', 'Customer Behavior', 'Activity Trends', 'Engagement Metrics']
    },
    {
      id: 'registrations',
      title: 'Registrations Report',
      description: 'Track customer registration trends and patterns',
      icon: '📝',
      href: '/admin/reports/registrations',
      features: ['Registration Trends', 'Time Analysis', 'Growth Metrics', 'Demographic Data']
    }
  ];

  function navigateToReport(href: string) {
    goto(href);
  }
</script>

<svelte:head>
  <title>Reports Dashboard - Admin Panel</title>
</svelte:head>

<div class="reports-dashboard">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <h1>📈 Reports Dashboard</h1>
      <p>Access comprehensive reports and analytics for your loyalty program</p>
    </div>
    <div class="header-stats">
      <div class="stat-card">
        <span class="stat-icon">📊</span>
        <div class="stat-content">
          <span class="stat-value">3</span>
          <span class="stat-label">Report Types</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⚡</span>
        <div class="stat-content">
          <span class="stat-value">Real-time</span>
          <span class="stat-label">Data Updates</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Report Cards -->
  <div class="reports-grid">
    {#each reportSections as report}
      <div class="report-card">
        <div class="card-header">
          <div class="report-icon">{report.icon}</div>
          <div class="report-info">
            <h3>{report.title}</h3>
            <p>{report.description}</p>
          </div>
        </div>
        
        <div class="card-features">
          <h4>Key Features:</h4>
          <ul>
            {#each report.features as feature}
              <li>✓ {feature}</li>
            {/each}
          </ul>
        </div>
        
        <div class="card-actions">
          <button 
            class="btn-primary"
            on:click={() => navigateToReport(report.href)}
          >
            View Report
          </button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Quick Actions -->
  <div class="quick-actions">
    <h2>Quick Actions</h2>
    <div class="actions-grid">
      <button class="action-btn" on:click={() => navigateToReport('/admin/reports/transaction-report')}>
        <span class="action-icon">🚀</span>
        <span class="action-text">Generate Transaction Report</span>
      </button>
      <button class="action-btn" on:click={() => navigateToReport('/admin/reports/customer-usage')}>
        <span class="action-icon">📈</span>
        <span class="action-text">View Customer Analytics</span>
      </button>
      <button class="action-btn" on:click={() => navigateToReport('/admin/reports/registrations')}>
        <span class="action-icon">👤</span>
        <span class="action-text">Check Registration Trends</span>
      </button>
    </div>
  </div>
</div>

<style>
  .reports-dashboard {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .header-content h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .header-content p {
    color: #6b7280;
    font-size: 1.1rem;
    margin: 0;
  }

  .header-stats {
    display: flex;
    gap: 1rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: white;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .report-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .report-card:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .report-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
  }

  .report-info h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .report-info p {
    color: #6b7280;
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
  }

  .card-features {
    margin-bottom: 1.5rem;
  }

  .card-features h4 {
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.75rem 0;
  }

  .card-features ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .card-features li {
    color: #4b5563;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    padding-left: 0;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .quick-actions {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 2rem;
  }

  .quick-actions h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1.5rem 0;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .action-btn:hover {
    border-color: #3b82f6;
    background: #eff6ff;
    transform: translateY(-1px);
  }

  .action-icon {
    font-size: 1.5rem;
  }

  .action-text {
    font-weight: 500;
    color: #374151;
  }

  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      gap: 1rem;
    }

    .header-stats {
      width: 100%;
      justify-content: space-between;
    }

    .reports-grid {
      grid-template-columns: 1fr;
    }

    .actions-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
