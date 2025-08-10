<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    availableRoles,
    availablePermissions,
    isMasterAdmin,
    loadPermissionsData,
    createRole,
    updateRole,
    deleteRole
  } from '$lib/stores/permissions';
  import type { UserRole, Permission } from '$lib/types';

  // Reactive stores
  $: allRoles = $availableRoles;
  $: allPermissions = $availablePermissions;

  // Component state
  let selectedRole: UserRole | null = null;
  let selectedUser: any = null;
  let searchTerm = '';
  let showCreateRole = false;
  let showUserRoleAssignment = false;
  
  // Form states
  let newRoleName = '';
  let newRoleDescription = '';
  let selectedPermissions: string[] = [];
  let userRolePermissions: string[] = [];
  
  // Mock users data (replace with actual user store)
  let users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', currentRole: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', currentRole: 'Manager' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', currentRole: 'Staff' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', currentRole: 'Viewer' },
    { id: '5', name: 'Mike Wilson', email: 'mike@example.com', currentRole: 'Operator' },
    { id: '6', name: 'Sarah Davis', email: 'sarah@example.com', currentRole: 'Support' },
  ];

  // Complete user functions based on your admin panel
  let availableFunctions = [
    { id: 'upload-customers', name: 'Upload Customers', category: 'customer_management', description: 'Upload and import customer data' },
    { id: 'upload-transactions', name: 'Upload Transactions', category: 'financial', description: 'Upload and import transaction data' },
    { id: 'customer-management', name: 'Customer Management', category: 'customer_management', description: 'Manage customer profiles and information' },
    { id: 'assign-card-type', name: 'Assign Card Type', category: 'customer_management', description: 'Assign card types to customers' },
    { id: 'extend-validity', name: 'Extend Validity', category: 'customer_management', description: 'Extend card validity periods' },
    { id: 'assign-coupons', name: 'Assign Coupons', category: 'content_management', description: 'Assign coupons to customers' },
    { id: 'manage-card-types', name: 'Manage Card Types', category: 'system_settings', description: 'Create and manage card types' },
    { id: 'manage-branches', name: 'Manage Branches', category: 'system_settings', description: 'Manage branch locations and settings' },
    { id: 'user-management', name: 'User Management', category: 'user_management', description: 'Manage system users and access' },
    { id: 'manage-user-roles', name: 'Manage User Roles', category: 'user_management', description: 'Configure user roles and permissions' },
    { id: 'support-settings', name: 'Support Settings', category: 'system_settings', description: 'Configure customer support settings' },
    { id: 'terms-conditions', name: 'Terms & Conditions', category: 'content_management', description: 'Manage terms and conditions content' },
    { id: 'notification-center', name: 'Notification Center', category: 'notifications', description: 'Manage system notifications' },
    { id: 'export-data', name: 'Export Data', category: 'analytics', description: 'Export system data and reports' },
    { id: 'analytics-reports', name: 'Analytics Reports', category: 'analytics', description: 'View analytics and business reports' },
    { id: 'user-reports', name: 'User Reports', category: 'analytics', description: 'Generate user activity reports' },
    { id: 'password-reset', name: 'Password Reset', category: 'user_management', description: 'Manage password reset functionality' }
  ];

  // Categories for organizing functions
  let categories = [
    'customer_management',
    'user_management', 
    'content_management',
    'system_settings',
    'analytics',
    'financial',
    'notifications'
  ];

  // Category display names
  const categoryDisplayNames: Record<string, string> = {
    'customer_management': 'Customer Management',
    'user_management': 'User Management',
    'content_management': 'Content Management',
    'system_settings': 'System Settings',
    'analytics': 'Analytics & Reports',
    'financial': 'Financial',
    'notifications': 'Notifications'
  };

  function getCategoryDisplayName(category: string): string {
    return categoryDisplayNames[category] || category;
  }

  // Filtered roles by search (excluding master admin)
  $: filteredRoles = allRoles.filter(role =>
    !role.isMasterAdmin && (
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Group functions by category
  $: functionsByCategory = categories.reduce((acc, category) => {
    acc[category] = availableFunctions.filter(func => func.category === category);
    return acc;
  }, {} as Record<string, typeof availableFunctions>);

  // Check access on mount
  onMount(() => {
    // Load permissions data first
    loadPermissionsData();
    
    // For now, allow all admin users to access this page
    // Later you can uncomment this to restrict to master admin only
    // if (!$isMasterAdmin) {
    //   goto('/admin');
    // }
  });

  function selectRole(role: UserRole) {
    selectedRole = role;
  }

  function openCreateRole() {
    showCreateRole = true;
    newRoleName = '';
    newRoleDescription = '';
    selectedPermissions = [];
  }

  function closeCreateRole() {
    showCreateRole = false;
  }

  function openUserRoleAssignment() {
    showUserRoleAssignment = true;
    selectedUser = null;
    userRolePermissions = [];
  }

  function closeUserRoleAssignment() {
    showUserRoleAssignment = false;
    selectedUser = null;
  }

  function selectUser(user: any) {
    selectedUser = user;
    // Load current permissions for the user
    const userRole = allRoles.find(role => role.name === user.currentRole);
    if (userRole) {
      userRolePermissions = userRole.permissions.map(p => p.id);
    } else {
      userRolePermissions = [];
    }
  }

  function togglePermission(permissionId: string, isUserAssignment = false) {
    if (isUserAssignment) {
      if (userRolePermissions.includes(permissionId)) {
        userRolePermissions = userRolePermissions.filter(id => id !== permissionId);
      } else {
        userRolePermissions = [...userRolePermissions, permissionId];
      }
    } else {
      if (selectedPermissions.includes(permissionId)) {
        selectedPermissions = selectedPermissions.filter(id => id !== permissionId);
      } else {
        selectedPermissions = [...selectedPermissions, permissionId];
      }
    }
  }

  function toggleCategoryPermissions(category: string, isUserAssignment = false) {
    const categoryFunctions = functionsByCategory[category];
    const categoryIds = categoryFunctions.map(func => func.id);
    
    const currentPermissions = isUserAssignment ? userRolePermissions : selectedPermissions;
    const allCategorySelected = categoryIds.every(id => currentPermissions.includes(id));
    
    if (allCategorySelected) {
      // Remove all category permissions
      if (isUserAssignment) {
        userRolePermissions = userRolePermissions.filter(id => !categoryIds.includes(id));
      } else {
        selectedPermissions = selectedPermissions.filter(id => !categoryIds.includes(id));
      }
    } else {
      // Add all category permissions
      if (isUserAssignment) {
        userRolePermissions = [...new Set([...userRolePermissions, ...categoryIds])];
      } else {
        selectedPermissions = [...new Set([...selectedPermissions, ...categoryIds])];
      }
    }
  }

  async function handleCreateRole() {
    if (!newRoleName.trim() || !newRoleDescription.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const permissions = availableFunctions.filter(func => 
      selectedPermissions.includes(func.id)
    ).map(func => ({
      id: func.id,
      name: func.name,
      description: func.description,
      category: func.category as any, // Type assertion for category
      resource: func.name,
      action: 'access',
      isRequired: false
    }));

    const newRole = {
      id: Date.now().toString(),
      name: newRoleName,
      description: newRoleDescription,
      permissions,
      isActive: true,
      isMasterAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await createRole(newRole);
      closeCreateRole();
      alert('Role created successfully!');
    } catch (error) {
      alert('Error creating role: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async function handleSaveUserRole() {
    if (!selectedUser) {
      alert('Please select a user');
      return;
    }

    const permissions = availableFunctions.filter(func => 
      userRolePermissions.includes(func.id)
    ).map(func => ({
      id: func.id,
      name: func.name,
      description: func.description,
      category: func.category,
      resource: func.name,
      action: 'access',
      isRequired: false
    }));

    try {
      // Update local user data (replace with actual API call)
      users = users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, currentRole: 'Custom Role' }
          : user
      );
      
      closeUserRoleAssignment();
      alert('User role updated successfully!');
    } catch (error) {
      alert('Error updating user role: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  function selectAllPermissions(isUserAssignment = false) {
    const allIds = availableFunctions.map(func => func.id);
    if (isUserAssignment) {
      userRolePermissions = allIds;
    } else {
      selectedPermissions = allIds;
    }
  }

  function deselectAllPermissions(isUserAssignment = false) {
    if (isUserAssignment) {
      userRolePermissions = [];
    } else {
      selectedPermissions = [];
    }
  }
</script>

<svelte:head>
  <title>Manage User Roles - Admin Panel</title>
</svelte:head>

<div class="user-roles-container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <h1>Manage User Roles</h1>
      <p>Configure user roles and permissions for complete admin panel access</p>
      <div class="stats-row">
        <span class="stat-item">
          <strong>{availableFunctions.length}</strong> Total Functions
        </span>
        <span class="stat-item">
          <strong>{filteredRoles.length}</strong> Manageable Roles
        </span>
        <span class="stat-item">
          <strong>{users.length}</strong> Users
        </span>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn btn-primary" on:click={openCreateRole}>
        ➕ Create New Role
      </button>
      <button class="btn btn-secondary" on:click={openUserRoleAssignment}>
        👤 Assign User Roles
      </button>
      <button class="btn btn-outline">
        📤 Export Roles
      </button>
    </div>
  </div>

  <!-- Access Control Warning -->
  {#if false}
    <!-- Temporarily disabled for testing -->
    <div class="access-warning">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div>
          <h3>Access Restricted</h3>
          <p>Only Master Administrators can manage user roles and permissions.</p>
          <p>Please contact your system administrator for access.</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <div class="content-grid">
    <!-- Roles List -->
    <div class="roles-panel">
      <div class="panel-header">
        <h2>Manageable Roles ({filteredRoles.length})</h2>
        <div class="search-box">
          <input
            type="text"
            placeholder="Search roles..."
            bind:value={searchTerm}
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>
      </div>

      <div class="roles-list">
        {#each filteredRoles as role (role.id)}
          <div 
            class="role-card {selectedRole?.id === role.id ? 'selected' : ''}"
            on:click={() => selectRole(role)}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && selectRole(role)}
          >
            <div class="role-header">
              <h3>{role.name}</h3>
            </div>
            <p class="role-description">{role.description}</p>
            <div class="role-stats">
              <span class="permission-count">
                {role.permissions.length} functions
              </span>
              <span class="status-badge {role.isActive ? 'active' : 'inactive'}">
                {role.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div class="role-actions">
              <button class="action-btn edit-btn" title="Edit Role">
                ✏️
              </button>
              <button class="action-btn delete-btn" title="Delete Role">
                🗑️
              </button>
              <button class="action-btn duplicate-btn" title="Duplicate Role">
                📋
              </button>
            </div>
          </div>
        {/each}
        
        {#if filteredRoles.length === 0}
          <div class="empty-state">
            <span class="empty-icon">📝</span>
            <h3>No roles found</h3>
            <p>Create your first role to get started</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Role Details -->
    <div class="details-panel">
      {#if selectedRole}
        <div class="role-details">
          <div class="details-header">
            <div>
              <h2>{selectedRole.name}</h2>
              <span class="permission-summary">
                {selectedRole.permissions.length} of {availableFunctions.length} functions enabled
              </span>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary">
                ✏️ Edit Role
              </button>
              <button class="btn btn-danger">
                🗑️ Delete Role
              </button>
            </div>
          </div>

          <div class="details-content">
            <div class="detail-section">
              <h3>Description</h3>
              <p>{selectedRole.description}</p>
            </div>

            <div class="detail-section">
              <h3>Functions by Category</h3>
              {#each categories as category}
                {@const categoryFunctions = functionsByCategory[category]}
                {@const rolePermissionIds = selectedRole.permissions.map(p => p.id)}
                {@const categoryPermissions = categoryFunctions.filter(func => rolePermissionIds.includes(func.id))}
                
                {#if categoryPermissions.length > 0}
                  <div class="category-section">
                    <h4 class="category-title">
                      {getCategoryDisplayName(category)} 
                      <span class="category-count">({categoryPermissions.length}/{categoryFunctions.length})</span>
                    </h4>
                    <div class="permissions-grid-small">
                      {#each categoryPermissions as permission}
                        <div class="permission-tag">
                          <span class="permission-name">{permission.name}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>

            <div class="detail-section">
              <h3>Role Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="status-badge {selectedRole.isActive ? 'active' : 'inactive'}">
                    {selectedRole.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Created:</span>
                  <span>{new Date(selectedRole.createdAt).toLocaleDateString()}</span>
                </div>
                {#if selectedRole.updatedAt}
                  <div class="info-item">
                    <span class="info-label">Last Updated:</span>
                    <span>{new Date(selectedRole.updatedAt).toLocaleDateString()}</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="no-selection">
          <div class="no-selection-content">
            <span class="no-selection-icon">👥</span>
            <h3>Select a role to view details</h3>
            <p>Choose a role from the list to view its functions and settings.</p>
            <p class="help-text">
              Master Administrator role has access to all {availableFunctions.length} functions automatically.
            </p>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Create Role Modal -->
  {#if showCreateRole}
    <div 
      class="modal-overlay" 
      on:click={closeCreateRole} 
      on:keydown={(e) => e.key === 'Escape' && closeCreateRole()}
      role="dialog" 
      aria-modal="true"
      tabindex="-1"
    >
      <div 
        class="modal-content modal-large" 
        on:click={(e) => e.stopPropagation()}
        role="document"
      >
        <div class="modal-header">
          <h2>Create New Role</h2>
          <button class="close-btn" on:click={closeCreateRole} aria-label="Close modal">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="roleName">Role Name *</label>
            <input 
              id="roleName"
              type="text" 
              bind:value={newRoleName} 
              placeholder="Enter role name"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="roleDescription">Description *</label>
            <textarea 
              id="roleDescription"
              bind:value={newRoleDescription} 
              placeholder="Enter role description"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <div class="permissions-header">
              <span class="permissions-label">Functions & Permissions</span>
              <div class="bulk-actions">
                <button type="button" class="btn-link" on:click={() => selectAllPermissions()}>
                  Select All
                </button>
                <button type="button" class="btn-link" on:click={() => deselectAllPermissions()}>
                  Deselect All
                </button>
              </div>
            </div>
            
            <div class="permissions-container">
              {#each categories as category}
                {@const categoryFunctions = functionsByCategory[category]}
                {@const selectedInCategory = categoryFunctions.filter(func => selectedPermissions.includes(func.id)).length}
                
                <div class="category-group">
                  <div class="category-header">
                    <label class="category-toggle">
                      <input 
                        type="checkbox"
                        checked={selectedInCategory === categoryFunctions.length}
                        indeterminate={selectedInCategory > 0 && selectedInCategory < categoryFunctions.length}
                        on:change={() => toggleCategoryPermissions(category)}
                      />
                      <span class="category-title">
                        {getCategoryDisplayName(category)} ({selectedInCategory}/{categoryFunctions.length})
                      </span>
                    </label>
                  </div>
                  
                  <div class="category-permissions">
                    {#each categoryFunctions as func}
                      <div class="permission-checkbox">
                        <label class="checkbox-label">
                          <input 
                            type="checkbox" 
                            checked={selectedPermissions.includes(func.id)}
                            on:change={() => togglePermission(func.id)}
                          />
                          <span class="checkbox-custom"></span>
                          <div class="permission-info">
                            <span class="permission-title">{func.name}</span>
                            <span class="permission-desc">{func.description}</span>
                          </div>
                        </label>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" on:click={closeCreateRole}>Cancel</button>
          <button class="btn btn-primary" on:click={handleCreateRole}>
            Create Role ({selectedPermissions.length} functions)
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- User Role Assignment Modal -->
  {#if showUserRoleAssignment}
    <div 
      class="modal-overlay" 
      on:click={closeUserRoleAssignment} 
      on:keydown={(e) => e.key === 'Escape' && closeUserRoleAssignment()}
      role="dialog" 
      aria-modal="true"
      tabindex="-1"
    >
      <div 
        class="modal-content modal-large" 
        on:click={(e) => e.stopPropagation()}
        role="document"
      >
        <div class="modal-header">
          <h2>Assign User Roles</h2>
          <button class="close-btn" on:click={closeUserRoleAssignment} aria-label="Close modal">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="user-selection">
            <label for="userSelect">Select User</label>
            <select 
              id="userSelect"
              class="form-select" 
              on:change={(e) => {
                const target = e.target as HTMLSelectElement;
                const userId = target.value;
                const user = users.find(u => u.id === userId);
                if (user) selectUser(user);
              }}
            >
              <option value="">Choose a user...</option>
              {#each users as user}
                <option value={user.id}>{user.name} ({user.email}) - Current: {user.currentRole}</option>
              {/each}
            </select>
          </div>

          {#if selectedUser}
            <div class="user-permissions">
              <div class="user-info-header">
                <h3>Functions for {selectedUser.name}</h3>
                <div class="bulk-actions">
                  <button type="button" class="btn-link" on:click={() => selectAllPermissions(true)}>
                    Enable All
                  </button>
                  <button type="button" class="btn-link" on:click={() => deselectAllPermissions(true)}>
                    Disable All
                  </button>
                </div>
              </div>
              <p class="user-info">Current Role: <span class="current-role">{selectedUser.currentRole}</span></p>
              
              <div class="functions-by-category">
                {#each categories as category}
                  {@const categoryFunctions = functionsByCategory[category]}
                  {@const enabledInCategory = categoryFunctions.filter(func => userRolePermissions.includes(func.id)).length}
                  
                  <div class="category-section">
                    <div class="category-header">
                      <label class="category-toggle">
                        <input 
                          type="checkbox"
                          checked={enabledInCategory === categoryFunctions.length}
                          indeterminate={enabledInCategory > 0 && enabledInCategory < categoryFunctions.length}
                          on:change={() => toggleCategoryPermissions(category, true)}
                        />
                        <span class="category-title">
                          {getCategoryDisplayName(category)} ({enabledInCategory}/{categoryFunctions.length})
                        </span>
                      </label>
                    </div>
                    
                    <div class="functions-table">
                      {#each categoryFunctions as func}
                        <div class="function-row">
                          <div class="function-info">
                            <span class="func-name">{func.name}</span>
                            <span class="func-desc">{func.description}</span>
                          </div>
                          <div class="function-toggle">
                            <label class="toggle-switch">
                              <input 
                                type="checkbox" 
                                checked={userRolePermissions.includes(func.id)}
                                on:change={() => togglePermission(func.id, true)}
                              />
                              <span class="toggle-slider"></span>
                            </label>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" on:click={closeUserRoleAssignment}>Cancel</button>
          {#if selectedUser}
            <button class="btn btn-success" on:click={handleSaveUserRole}>
              💾 Save User Permissions ({userRolePermissions.length} functions)
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .user-roles-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-content h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .header-content p {
    color: #6b7280;
    margin: 0 0 1rem 0;
  }

  .stats-row {
    display: flex;
    gap: 2rem;
  }

  .stat-item {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .stat-item strong {
    color: #3b82f6;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    flex-shrink: 0;
  }

  .permission-summary {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .search-input {
    width: 100%;
    max-width: 400px;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .access-warning {
    background: #fef3cd;
    border: 1px solid #f6d55c;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 2rem;
  }

  .warning-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .warning-icon {
    font-size: 1.5rem;
  }

  .warning-content h3 {
    margin: 0 0 0.25rem 0;
    color: #92400e;
  }

  .warning-content p {
    margin: 0 0 0.5rem 0;
    color: #b45309;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
    min-height: 600px;
  }

  .content-grid.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .roles-panel, .details-panel {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .panel-header {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .panel-header h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  .search-box {
    position: relative;
  }

  .search-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
  }

  .roles-list {
    max-height: 600px;
    overflow-y: auto;
  }

  .role-card {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    transition: background-color 0.2s;
    position: relative;
  }

  .role-card:hover {
    background: #f9fafb;
  }

  .role-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s;
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .role-card:hover .role-actions {
    opacity: 1;
  }

  .action-btn {
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    background: white;
    color: #6b7280;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }

  .role-card.selected {
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
  }

  .role-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .role-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .role-description {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0 0 0.75rem 0;
  }

  .role-stats {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .permission-count {
    background: #f3f4f6;
    color: #374151;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
  }

  .status-badge {
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
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

  .empty-state {
    padding: 3rem 2rem;
    text-align: center;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: #374151;
  }

  .empty-state p {
    margin: 0;
  }

  .role-details, .no-selection {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .details-header {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .details-header h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  .details-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .detail-section {
    margin-bottom: 2rem;
  }

  .detail-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .category-section {
    margin-bottom: 1.5rem;
  }

  .category-title {
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .category-count {
    font-weight: 400;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .permissions-grid-small {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .permission-tag {
    background: #f3f4f6;
    color: #374151;
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  .permission-name {
    font-weight: 500;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    font-weight: 500;
    color: #374151;
  }

  .no-selection {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .no-selection-content {
    text-align: center;
  }

  .no-selection-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    display: block;
  }

  .no-selection-content h3 {
    margin: 0 0 0.5rem 0;
    color: #374151;
  }

  .no-selection-content p {
    color: #6b7280;
    margin: 0 0 0.5rem 0;
  }

  .help-text {
    font-size: 0.875rem;
    font-style: italic;
  }

  /* Modal Styles */
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
  }

  .modal-content {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-large {
    max-width: 1000px;
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.25rem;
  }

  .close-btn:hover {
    color: #374151;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  /* Form Styles */
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .permissions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .permissions-label {
    font-weight: 500;
    color: #374151;
  }

  .bulk-actions {
    display: flex;
    gap: 1rem;
  }

  .btn-link {
    background: none;
    border: none;
    color: #3b82f6;
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .btn-link:hover {
    color: #2563eb;
  }

  .form-input, .form-textarea, .form-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
  }

  .form-input:focus, .form-textarea:focus, .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Button Styles */
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
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

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover {
    background: #b91c1c;
  }

  .btn-outline {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-outline:hover {
    background: #f9fafb;
  }

  /* Permissions Container */
  .permissions-container {
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .category-group {
    border-bottom: 1px solid #e5e7eb;
  }

  .category-group:last-child {
    border-bottom: none;
  }

  .category-header {
    background: #f9fafb;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .category-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-weight: 600;
    color: #374151;
  }

  .category-toggle input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }

  .category-permissions {
    padding: 1rem;
  }

  .permission-checkbox {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
    margin-bottom: 0.5rem;
    border-radius: 0.375rem;
  }

  .permission-checkbox:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .permission-checkbox:hover {
    background: #f9fafb;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    display: none;
  }

  .checkbox-custom {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 0.25rem;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
    background: #3b82f6;
    border-color: #3b82f6;
  }

  .checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
    content: '✓';
    color: white;
    font-size: 0.875rem;
    font-weight: bold;
  }

  .permission-info {
    flex: 1;
  }

  .permission-title {
    display: block;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .permission-desc {
    display: block;
    font-size: 0.875rem;
    color: #6b7280;
  }

  /* User Selection */
  .user-selection {
    margin-bottom: 2rem;
  }

  .user-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .user-info-header h3 {
    margin: 0;
    color: #1f2937;
  }

  .user-info {
    margin-bottom: 1.5rem;
    color: #6b7280;
  }

  .current-role {
    color: #3b82f6;
    font-weight: 500;
  }

  /* Functions by Category */
  .functions-by-category {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .functions-table {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    overflow: hidden;
  }

  .function-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .function-row:last-child {
    border-bottom: none;
  }

  .function-row:hover {
    background: #f9fafb;
  }

  .function-info {
    flex: 1;
  }

  .func-name {
    font-weight: 500;
    color: #1f2937;
    display: block;
    margin-bottom: 0.25rem;
  }

  .func-desc {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .function-toggle {
    flex-shrink: 0;
  }

  /* Toggle Switch */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 24px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  .toggle-switch input:checked + .toggle-slider {
    background-color: #3b82f6;
  }

  .toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }

  @media (max-width: 768px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
    
    .page-header {
      flex-direction: column;
      gap: 1rem;
    }

    .header-actions {
      flex-direction: column;
    }

    .stats-row {
      flex-direction: column;
      gap: 0.5rem;
    }

    .function-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .function-toggle {
      align-self: flex-end;
    }

    .permissions-container {
      max-height: 400px;
    }
  }
</style>
