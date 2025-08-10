<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  // Mock admin data - replace with actual store/API data
  export let adminUser = {
    name: 'John Doe',
    role: 'Master Admin',
    avatar: '👨‍💼',
    currentBranch: 'Main Branch'
  };

  export let branches = [
    { id: 1, name: 'Main Branch', location: 'Downtown' },
    { id: 2, name: 'Mall Branch', location: 'Shopping Center' },
    { id: 3, name: 'Airport Branch', location: 'Terminal 1' }
  ];

  let showBranchMenu = false;

  function handleSwitchBranch(branch: typeof branches[0]) {
    adminUser.currentBranch = branch.name;
    showBranchMenu = false;
    dispatch('branchChanged', branch);
  }

  function handleLogout() {
    dispatch('logout');
  }

  function toggleBranchMenu() {
    showBranchMenu = !showBranchMenu;
  }
</script>

<div class="mini-profile-panel">
  <!-- Admin Info -->
  <div class="admin-info">
    <div class="admin-avatar">
      {adminUser.avatar}
    </div>
    <div class="admin-details">
      <div class="admin-name">{adminUser.name}</div>
      <div class="admin-role">
        <span class="role-badge">{adminUser.role}</span>
      </div>
    </div>
  </div>

  <!-- Current Branch -->
  <div class="current-branch">
    <div class="branch-info">
      <span class="branch-icon">🏢</span>
      <span class="branch-name">{adminUser.currentBranch}</span>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="quick-actions">
    <div class="branch-switcher">
      <button 
        class="action-button branch-button"
        on:click={toggleBranchMenu}
        aria-expanded={showBranchMenu}
      >
        <span class="button-icon">🔄</span>
        <span class="button-text">Switch Branch</span>
        <span class="dropdown-arrow {showBranchMenu ? 'rotated' : ''}">▼</span>
      </button>
      
      {#if showBranchMenu}
        <div class="branch-menu">
          {#each branches as branch}
            <button
              class="branch-option {branch.name === adminUser.currentBranch ? 'current' : ''}"
              on:click={() => handleSwitchBranch(branch)}
            >
              <div class="branch-option-main">
                <span class="branch-option-name">{branch.name}</span>
                <span class="branch-option-location">{branch.location}</span>
              </div>
              {#if branch.name === adminUser.currentBranch}
                <span class="current-indicator">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <button 
      class="action-button logout-button"
      on:click={handleLogout}
    >
      <span class="button-icon">🚪</span>
      <span class="button-text">Logout</span>
    </button>
  </div>
</div>

<style>
  .mini-profile-panel {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem 1rem 0 0;
    padding: 1.5rem;
    margin: 0 -2rem -2rem -2rem;
    color: white;
  }

  .admin-info {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  .admin-avatar {
    width: 3rem;
    height: 3rem;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .admin-details {
    flex: 1;
    min-width: 0;
  }

  .admin-name {
    font-weight: 700;
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
    color: white;
  }

  .admin-role {
    display: flex;
    align-items: center;
  }

  .role-badge {
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .current-branch {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .branch-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .branch-icon {
    font-size: 1rem;
  }

  .branch-name {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }

  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .branch-switcher {
    position: relative;
  }

  .action-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .action-button:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  .branch-button {
    justify-content: space-between;
  }

  .logout-button:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .button-icon {
    font-size: 1rem;
  }

  .button-text {
    flex: 1;
    text-align: left;
  }

  .dropdown-arrow {
    font-size: 0.75rem;
    transition: transform 0.2s ease;
    opacity: 0.7;
  }

  .dropdown-arrow.rotated {
    transform: rotate(180deg);
  }

  .branch-menu {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.2s ease;
    z-index: 10;
  }

  .branch-option {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    transition: background 0.15s ease;
    text-align: left;
  }

  .branch-option:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .branch-option.current {
    background: rgba(59, 130, 246, 0.2);
    border-left: 3px solid #3b82f6;
  }

  .branch-option-main {
    flex: 1;
  }

  .branch-option-name {
    display: block;
    font-weight: 500;
    margin-bottom: 0.125rem;
  }

  .branch-option-location {
    display: block;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .current-indicator {
    color: #3b82f6;
    font-weight: bold;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive */
  @media (max-width: 640px) {
    .mini-profile-panel {
      padding: 1rem;
      margin: 0 -1rem -1rem -1rem;
    }

    .admin-info {
      margin-bottom: 0.75rem;
    }

    .admin-avatar {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1.25rem;
    }

    .admin-name {
      font-size: 1rem;
    }

    .button-text {
      display: none;
    }

    .action-button {
      justify-content: center;
      padding: 0.75rem;
    }

    .branch-button .button-text,
    .branch-button .dropdown-arrow {
      display: none;
    }
  }
</style>
