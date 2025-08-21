<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  interface OtherApp {
    id: string;
    name: string;
    url: string;
    description: string;
    icon_path?: string;        // Optional for backward compatibility
    icon_filename?: string;    // Optional for backward compatibility  
    icon_url?: string;         // Keep for backward compatibility
    category: string;
    is_active: boolean;
    sort_order: number;
  }

  let apps: OtherApp[] = [];
  let loading = true;

  onMount(async () => {
    await loadApps();
  });

  async function loadApps() {
    try {
      const { data, error } = await supabase
        .from('other_apps')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error loading apps:', error);
        return;
      }

      apps = data || [];
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      loading = false;
    }
  }

  function openApp(app: OtherApp) {
    // Open directly in new tab instead of iframe viewer
    window.open(app.url, '_blank');
    
    // Track app session for analytics
    trackAppSession(app.id);
  }

  async function trackAppSession(appId: string) {
    try {
      // Track app usage for analytics
      const { error } = await supabase
        .from('user_app_sessions')
        .insert({
          app_id: appId,
          session_started_at: new Date().toISOString(),
          session_data: { opened_in_new_tab: true }
        });

      if (error) {
        console.warn('Session tracking error:', error);
      }
    } catch (error) {
      console.warn('Session tracking failed:', error);
    }
  }
</script>

<svelte:head>
  <title>Other Apps - Admin Panel</title>
</svelte:head>

<div class="other-apps-page">
  <!-- Apps Grid View -->
  <div class="page-header">
    <h1 class="page-title">🌐 Other Apps</h1>
    <p class="page-description">Access external applications and tools</p>
  </div>

  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading apps...</p>
    </div>
  {:else if apps.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📱</div>
      <h2>No Apps Available</h2>
      <p>No external apps have been configured yet.</p>
      <a href="/admin/manage-other-apps" class="primary-btn">
        <span>🔧</span>
        Add Your First App
      </a>
    </div>
  {:else}
    <div class="apps-grid">
      {#each apps as app}
        <button 
          class="app-card"
          on:click={() => openApp(app)}
          title="Click to open {app.name} in new tab"
        >
          <div class="app-icon">
            {#if app.icon_path}
              <img src="https://your-supabase-project.supabase.co/storage/v1/object/public/app-icons/{app.icon_path}" alt="{app.name} icon" />
            {:else if app.icon_url}
              <img src={app.icon_url} alt="{app.name} icon" />
            {:else}
              <span class="default-icon">🌐</span>
            {/if}
          </div>
          
          <div class="app-info">
            <h3 class="app-name">{app.name}</h3>
            {#if app.description}
              <p class="app-description">{app.description}</p>
            {/if}
            <span class="app-category">{app.category}</span>
          </div>

          <div class="external-link-indicator">
            <span>🔗</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .other-apps-page {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  .page-description {
    font-size: 1.1rem;
    color: #64748b;
    margin: 0;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4rem;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-state h2 {
    font-size: 1.5rem;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    margin-bottom: 2rem;
  }

  .primary-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }

  .apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 1rem 0;
  }

  .app-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    width: 100%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .app-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  .app-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .app-icon img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .default-icon {
    font-size: 1.5rem;
  }

  .app-info {
    flex: 1;
    text-align: left;
  }

  .external-link-indicator {
    opacity: 0.7;
    font-size: 1.2rem;
    transition: all 0.2s ease;
  }

  .app-card:hover .external-link-indicator {
    opacity: 1;
    transform: translateX(2px);
  }

  .app-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.25rem 0;
  }

  .app-description {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
  }

  .app-category {
    font-size: 0.75rem;
    color: #3b82f6;
    background: #dbeafe;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    text-transform: capitalize;
  }

  .app-action {
    color: #3b82f6;
    font-size: 1.25rem;
  }

  /* App Viewer Styles */
  .app-viewer {
    position: fixed;
    top: 0;
    left: 300px; /* Account for sidebar */
    right: 0;
    bottom: 0;
    background: white;
    z-index: 60;
    display: flex;
    flex-direction: column;
  }

  .app-viewer-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    min-height: 60px;
  }

  .app-viewer-controls {
    display: flex;
    gap: 0.5rem;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .app-viewer-info {
    flex: 1;
    min-width: 0;
  }

  .viewer-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .viewer-url {
    font-size: 0.75rem;
    color: #64748b;
    font-family: monospace;
  }

  .app-viewer-actions {
    display: flex;
    gap: 0.5rem;
  }

  .external-link-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .external-link-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .app-viewer-content {
    flex: 1;
    position: relative;
  }

  .app-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: white;
  }

  /* Error fallback styles */
  .iframe-error-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  }

  .error-content {
    text-align: center;
    max-width: 400px;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .error-message {
    color: #6b7280;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .error-technical {
    margin-bottom: 2rem;
    text-align: left;
  }

  .error-technical details {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem;
  }

  .error-technical summary {
    cursor: pointer;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .error-technical summary:hover {
    color: #1f2937;
  }

  .error-technical p {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .secondary-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #f3f4f6;
    color: #374151;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
    border: 1px solid #d1d5db;
  }

  .secondary-btn:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .apps-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .app-viewer {
      left: 0;
    }

    .app-card {
      padding: 1rem;
    }

    .page-title {
      font-size: 2rem;
    }
  }
</style>
