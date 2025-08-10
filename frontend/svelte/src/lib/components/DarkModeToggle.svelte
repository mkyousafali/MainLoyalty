<script lang="ts">
  import { darkMode } from '$lib/stores/darkMode';
  import { onMount } from 'svelte';

  onMount(() => {
    darkMode.init();
  });

  function toggle() {
    darkMode.toggle();
  }
</script>

<button
  class="dark-mode-toggle"
  on:click={toggle}
  aria-label="{$darkMode ? 'Switch to light mode' : 'Switch to dark mode'}"
  title="{$darkMode ? 'Switch to light mode' : 'Switch to dark mode'}"
>
  <div class="toggle-track {$darkMode ? 'dark' : 'light'}">
    <div class="toggle-thumb">
      <div class="toggle-icon">
        {#if $darkMode}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>
          </svg>
        {:else}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z"/>
          </svg>
        {/if}
      </div>
    </div>
  </div>
  <span class="toggle-label">
    {$darkMode ? 'Dark' : 'Light'}
  </span>
</button>

<style>
  .dark-mode-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 2rem;
    padding: 0.5rem 1rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .dark-mode-toggle:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  .toggle-track {
    position: relative;
    width: 3rem;
    height: 1.5rem;
    border-radius: 0.75rem;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .toggle-track.dark {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .toggle-track.light {
    background: rgba(251, 191, 36, 0.3);
    border-color: rgba(251, 191, 36, 0.5);
  }

  .toggle-thumb {
    position: absolute;
    top: 0.125rem;
    left: 0.125rem;
    width: 1.25rem;
    height: 1.25rem;
    background: white;
    border-radius: 50%;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .toggle-track.dark .toggle-thumb {
    transform: translateX(1.5rem);
    background: #1e293b;
  }

  .toggle-icon {
    color: #64748b;
    transition: color 0.2s ease;
  }

  .toggle-track.dark .toggle-icon {
    color: #60a5fa;
  }

  .toggle-track.light .toggle-icon {
    color: #f59e0b;
  }

  .toggle-label {
    font-weight: 500;
    white-space: nowrap;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .toggle-label {
      display: none;
    }
    
    .dark-mode-toggle {
      padding: 0.5rem;
      gap: 0;
    }
  }
</style>
