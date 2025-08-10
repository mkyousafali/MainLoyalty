<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  // All available routes for search
  const allRoutes = [
    { path: '/admin', label: 'Dashboard', icon: '🏠', description: 'Main overview panel', category: 'General' },
    { path: '/admin/upload-customers', label: 'Upload Customers', icon: '📥', description: 'Import customer data', category: 'Customer Management' },
    { path: '/admin/upload-transactions', label: 'Upload Transactions', icon: '📊', description: 'Import transaction data', category: 'Customer Management' },
    { path: '/admin/customer-management', label: 'Customer Management', icon: '👤', description: 'Manage customer profiles', category: 'Customer Management' },
    { path: '/admin/assign-card-type', label: 'Assign Card Type', icon: '🏷️', description: 'Assign card types to customers', category: 'Virtual Card System' },
    { path: '/admin/extend-validity', label: 'Extend Validity', icon: '⏰', description: 'Extend card validity periods', category: 'Virtual Card System' },
    { path: '/admin/manage-card-types', label: 'Manage Card Types', icon: '💳', description: 'Configure card type settings', category: 'Virtual Card System' },
    { path: '/admin/support-settings', label: 'Support Settings', icon: '⚙️', description: 'Configure support options', category: 'Support & Communication' },
    { path: '/admin/notification-center', label: 'Notification Center', icon: '🔔', description: 'Manage notifications', category: 'Support & Communication' },
    { path: '/admin/manage-branches', label: 'Manage Branches', icon: '🏢', description: 'Branch management', category: 'Support & Communication' },
    { path: '/admin/analytics-reports', label: 'Analytics Reports', icon: '📊', description: 'View system analytics', category: 'Analytics & Reports' },
    { path: '/admin/export-data', label: 'Export Data', icon: '📤', description: 'Export system data', category: 'Analytics & Reports' }
  ];

  let searchTerm = '';
  let filteredRoutes = allRoutes;
  let selectedIndex = 0;
  let searchInput: HTMLInputElement;

  // Simple fuzzy search implementation
  function fuzzySearch(items: typeof allRoutes, query: string) {
    if (!query.trim()) return items;
    
    const lowerQuery = query.toLowerCase();
    return items
      .map(item => {
        const labelScore = item.label.toLowerCase().includes(lowerQuery) ? 10 : 0;
        const descScore = item.description.toLowerCase().includes(lowerQuery) ? 5 : 0;
        const categoryScore = item.category.toLowerCase().includes(lowerQuery) ? 3 : 0;
        
        // Simple fuzzy matching for characters
        const labelChars = item.label.toLowerCase().split('');
        const queryChars = lowerQuery.split('');
        let fuzzyScore = 0;
        let queryIndex = 0;
        
        for (let i = 0; i < labelChars.length && queryIndex < queryChars.length; i++) {
          if (labelChars[i] === queryChars[queryIndex]) {
            fuzzyScore += 1;
            queryIndex++;
          }
        }
        
        if (queryIndex === queryChars.length) fuzzyScore += 5;
        
        return {
          ...item,
          score: labelScore + descScore + categoryScore + fuzzyScore
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function handleSearch() {
    filteredRoutes = fuzzySearch(allRoutes, searchTerm);
    selectedIndex = 0;
  }

  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredRoutes.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredRoutes[selectedIndex]) {
          selectRoute(filteredRoutes[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
    }
  }

  function selectRoute(route: typeof allRoutes[0]) {
    goto(route.path, { keepFocus: true });
    close();
  }

  function close() {
    isOpen = false;
    searchTerm = '';
    selectedIndex = 0;
    filteredRoutes = allRoutes;
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  // Global keyboard shortcut listener
  function handleGlobalKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      isOpen = true;
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleGlobalKeydown);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    };
  });

  // Focus search input when opened
  $: if (isOpen && searchInput) {
    setTimeout(() => searchInput?.focus(), 100);
  }

  // Handle search term changes
  $: searchTerm, handleSearch();
</script>

{#if isOpen}
  <div 
    class="command-palette-overlay"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="command-palette-title"
  >
    <div class="command-palette">
      <div class="command-palette-header">
        <div class="search-container">
          <div class="search-icon">🔍</div>
          <input
            bind:this={searchInput}
            bind:value={searchTerm}
            type="text"
            placeholder="Search for pages, features..."
            class="search-input"
            aria-label="Command palette search"
          />
          <div class="keyboard-hint">
            <kbd>↑</kbd><kbd>↓</kbd> to navigate, <kbd>↵</kbd> to select, <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>

      <div class="command-palette-results">
        {#if filteredRoutes.length > 0}
          {#each filteredRoutes as route, index}
            <button
              class="result-item {index === selectedIndex ? 'selected' : ''}"
              on:click={() => selectRoute(route)}
              on:mouseenter={() => selectedIndex = index}
            >
              <div class="result-icon">{route.icon}</div>
              <div class="result-content">
                <div class="result-label">{route.label}</div>
                <div class="result-description">{route.description}</div>
                <div class="result-category">{route.category}</div>
              </div>
              <div class="result-path">{route.path}</div>
            </button>
          {/each}
        {:else}
          <div class="no-results">
            <div class="no-results-icon">🔍</div>
            <div class="no-results-text">No results found for "{searchTerm}"</div>
            <div class="no-results-hint">Try a different search term</div>
          </div>
        {/if}
      </div>

      <div class="command-palette-footer">
        <div class="footer-hint">
          Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to open command palette
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .command-palette-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    animation: fadeIn 0.2s ease;
  }

  .command-palette {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 640px;
    max-height: 70vh;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideIn 0.3s ease;
  }

  :global(.dark) .command-palette {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .command-palette-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  :global(.dark) .command-palette-header {
    border-bottom-color: #334155;
  }

  .search-container {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.25rem;
    opacity: 0.6;
  }

  .search-input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.75rem;
    font-size: 1.125rem;
    background: #f8fafc;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: white;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  :global(.dark) .search-input {
    background: #0f172a;
    border-color: #334155;
    color: white;
  }

  :global(.dark) .search-input:focus {
    background: #1e293b;
    border-color: #6366f1;
  }

  .keyboard-hint {
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  :global(.dark) .keyboard-hint {
    color: #94a3b8;
  }

  .command-palette-results {
    max-height: 400px;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .result-item {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 1rem;
    border: none;
    background: transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    gap: 1rem;
  }

  .result-item:hover,
  .result-item.selected {
    background: #f1f5f9;
    transform: translateX(4px);
  }

  :global(.dark) .result-item:hover,
  :global(.dark) .result-item.selected {
    background: #334155;
  }

  .result-icon {
    font-size: 1.5rem;
    min-width: 2rem;
    text-align: center;
  }

  .result-content {
    flex: 1;
    min-width: 0;
  }

  .result-label {
    font-weight: 600;
    font-size: 1rem;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  :global(.dark) .result-label {
    color: #f1f5f9;
  }

  .result-description {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.25rem;
  }

  :global(.dark) .result-description {
    color: #94a3b8;
  }

  .result-category {
    font-size: 0.75rem;
    color: #3b82f6;
    font-weight: 500;
    background: rgba(59, 130, 246, 0.1);
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    display: inline-block;
  }

  :global(.dark) .result-category {
    color: #60a5fa;
    background: rgba(96, 165, 250, 0.1);
  }

  .result-path {
    font-size: 0.75rem;
    color: #94a3b8;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.dark) .result-path {
    color: #64748b;
    background: #0f172a;
  }

  .no-results {
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
  }

  :global(.dark) .no-results {
    color: #94a3b8;
  }

  .no-results-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.6;
  }

  .no-results-text {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .no-results-hint {
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .command-palette-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  :global(.dark) .command-palette-footer {
    border-top-color: #334155;
    background: #0f172a;
  }

  .footer-hint {
    font-size: 0.75rem;
    color: #64748b;
    text-align: center;
  }

  :global(.dark) .footer-hint {
    color: #94a3b8;
  }

  kbd {
    background: #e2e8f0;
    border: 1px solid #cbd5e1;
    border-radius: 0.25rem;
    padding: 0.125rem 0.375rem;
    font-size: 0.75rem;
    font-family: inherit;
    color: #475569;
  }

  :global(.dark) kbd {
    background: #334155;
    border-color: #475569;
    color: #cbd5e1;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Responsive */
  @media (max-width: 640px) {
    .command-palette-overlay {
      padding: 1rem;
      padding-top: 5vh;
    }

    .command-palette {
      max-height: 85vh;
    }

    .command-palette-header {
      padding: 1rem;
    }

    .result-item {
      padding: 0.75rem;
    }

    .result-path {
      display: none;
    }
  }
</style>
