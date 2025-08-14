<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
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
  let showEditRole = false;
  let showUserRoleAssignment = false;
  let isLoading = false;
  let error = '';
  let success = '';
  
  // Form states
  let newRoleName = '';
  let newRoleDescription = '';
  let editRoleName = '';
  let editRoleDescription = '';
  let selectedPermissions: string[] = [];
  let editSelectedPermissions: string[] = [];
  let userRolePermissions: string[] = [];
  
  // Real data from Supabase
  let users: any[] = [];
  let roles: any[] = [];
  let permissions: any[] = [];

  // Available functions built from real permissions
  $: availableFunctions = permissions.map(perm => ({
    id: perm.id,
    name: perm.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    category: perm.module,
    description: perm.description
  }));

  // Categories for organizing functions (from database modules)
  $: categories = [...new Set(permissions.map(p => p.module))].sort();

  // Category display names (handle both old static and new dynamic categories)
  const categoryDisplayNames: Record<string, string> = {
    'customer_management': 'Customer Management',
    'user_management': 'User Management', 
    'content_management': 'Content Management',
    'system_settings': 'System Settings',
    'financial': 'Financial',
    'notifications': 'Notifications',
    'transaction_management': 'Transaction Management',
    'card_management': 'Card Management',
    'rewards_coupons': 'Rewards & Coupons',
    'data_management': 'Data Management',
    'admin_tools': 'Admin Tools'
  };

  function getCategoryDisplayName(category: string): string {
    return categoryDisplayNames[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Filtered roles by search (from real database data)
  $: filteredRoles = roles.filter(role =>
    role.is_active && (
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
    loadRealData();
    
    // For now, allow all admin users to access this page
    // Later you can uncomment this to restrict to master admin only
    // if (!$isMasterAdmin) {
    //   goto('/admin');
    // }
  });

  async function loadRealData() {
    try {
      isLoading = true;
      
      // Load admin users (replace mock users)
      const { data: adminUsers, error: usersError } = await supabase
        .from('admin_users')
        .select(`
          id,
          full_name,
          email,
          username,
          is_active,
          role_id,
          roles!inner(
            id,
            name,
            description
          )
        `)
        .eq('is_active', true);

      if (usersError) throw usersError;

      // Load all roles with their permissions
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select(`
          *,
          role_permissions(
            permission_id,
            permissions(
              id,
              name,
              description,
              module
            )
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (rolesError) throw rolesError;

      // Load all permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*');

      if (permissionsError) throw permissionsError;

      // Update the data
      users = adminUsers?.map(user => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        username: user.username,
        currentRole: user.roles?.name || 'No Role',
        role_id: user.role_id,
        is_active: user.is_active
      })) || [];

      // Transform roles to include permissions
      roles = rolesData?.map(role => ({
        ...role,
        permissions: role.role_permissions?.map(rp => rp.permissions) || []
      })) || [];

      permissions = permissionsData || [];

      success = 'Data loaded successfully from database!';
      
    } catch (err: any) {
      error = `Failed to load data: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function createRoleInDatabase() {
    if (!newRoleName.trim() || !newRoleDescription.trim()) {
      error = 'Please fill in all required fields';
      return;
    }

    try {
      isLoading = true;

      // Create role in database
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .insert({
          name: newRoleName,
          description: newRoleDescription,
          is_active: true
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Create role permissions
      if (selectedPermissions.length > 0) {
        const permissionEntries = selectedPermissions.map(permId => ({
          role_id: roleData.id,
          permission_id: permId
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(permissionEntries);

        if (permError) throw permError;
      }

      success = 'Role created successfully!';
      closeCreateRole();
      loadRealData(); // Refresh data
      
    } catch (err: any) {
      error = `Failed to create role: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function updateUserRole(userId: string, newRoleId: string) {
    try {
      isLoading = true;

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ role_id: newRoleId })
        .eq('id', userId);

      if (updateError) throw updateError;

      success = 'User role updated successfully!';
      loadRealData(); // Refresh data
      
    } catch (err: any) {
      error = `Failed to update user role: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

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

  function openEditRole() {
    if (!selectedRole) return;
    
    showEditRole = true;
    editRoleName = selectedRole.name;
    editRoleDescription = selectedRole.description || '';
    
    // Get current permissions for this role
    editSelectedPermissions = selectedRole.permissions?.map(p => p.id) || [];
  }

  function closeEditRole() {
    showEditRole = false;
    editRoleName = '';
    editRoleDescription = '';
    editSelectedPermissions = [];
  }

  async function updateRoleInDatabase() {
    if (!selectedRole || !editRoleName.trim() || !editRoleDescription.trim()) {
      error = 'Please fill in all required fields';
      return;
    }

    try {
      isLoading = true;

      // Update role in database
      const { error: roleError } = await supabase
        .from('roles')
        .update({
          name: editRoleName,
          description: editRoleDescription
        })
        .eq('id', selectedRole.id);

      if (roleError) throw roleError;

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', selectedRole.id);

      if (deleteError) throw deleteError;

      // Add new permissions
      if (editSelectedPermissions.length > 0) {
        const permissionEntries = editSelectedPermissions.map(permId => ({
          role_id: selectedRole.id,
          permission_id: permId
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(permissionEntries);

        if (permError) throw permError;
      }

      success = 'Role updated successfully!';
      closeEditRole();
      loadRealData(); // Refresh data
      
    } catch (err: any) {
      error = `Failed to update role: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function deleteRoleFromDatabase() {
    if (!selectedRole) return;

    if (!confirm(`Are you sure you want to delete the role "${selectedRole.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      isLoading = true;

      // Delete role permissions first
      const { error: permError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', selectedRole.id);

      if (permError) throw permError;

      // Delete role
      const { error: roleError } = await supabase
        .from('roles')
        .delete()
        .eq('id', selectedRole.id);

      if (roleError) throw roleError;

      success = 'Role deleted successfully!';
      selectedRole = null; // Clear selection
      loadRealData(); // Refresh data
      
    } catch (err: any) {
      error = `Failed to delete role: ${err.message}`;
    } finally {
      isLoading = false;
    }
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

  function togglePermission(permissionId: string, isUserAssignment = false, isEdit = false) {
    if (isEdit) {
      if (editSelectedPermissions.includes(permissionId)) {
        editSelectedPermissions = editSelectedPermissions.filter(id => id !== permissionId);
      } else {
        editSelectedPermissions = [...editSelectedPermissions, permissionId];
      }
    } else if (isUserAssignment) {
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

  function toggleCategoryPermissions(category: string, isUserAssignment = false, isEdit = false) {
    const categoryFunctions = functionsByCategory[category];
    const categoryIds = categoryFunctions.map(func => func.id);
    
    let currentPermissions;
    if (isEdit) {
      currentPermissions = editSelectedPermissions;
    } else if (isUserAssignment) {
      currentPermissions = userRolePermissions;
    } else {
      currentPermissions = selectedPermissions;
    }
    
    const allCategorySelected = categoryIds.every(id => currentPermissions.includes(id));
    
    if (allCategorySelected) {
      // Remove all category permissions
      if (isEdit) {
        editSelectedPermissions = editSelectedPermissions.filter(id => !categoryIds.includes(id));
      } else if (isUserAssignment) {
        userRolePermissions = userRolePermissions.filter(id => !categoryIds.includes(id));
      } else {
        selectedPermissions = selectedPermissions.filter(id => !categoryIds.includes(id));
      }
    } else {
      // Add all category permissions
      if (isEdit) {
        editSelectedPermissions = [...new Set([...editSelectedPermissions, ...categoryIds])];
      } else if (isUserAssignment) {
        userRolePermissions = [...new Set([...userRolePermissions, ...categoryIds])];
      } else {
        selectedPermissions = [...new Set([...selectedPermissions, ...categoryIds])];
      }
    }
  }

  async function handleCreateRole() {
    await createRoleInDatabase();
  }

  async function handleSaveUserRole() {
    if (!selectedUser || !selectedUser.id) {
      error = 'Please select a user';
      return;
    }

    // Find the role ID for the permissions selected
    // For now, we'll create a custom role or update to existing role
    try {
      // You might want to create a custom role or assign to existing role
      // For this example, let's just update the user's current role
      const selectedRoleId = roles.find(r => r.name === 'Manager')?.id; // Default to Manager
      
      if (selectedRoleId) {
        await updateUserRole(selectedUser.id, selectedRoleId);
        closeUserRoleAssignment();
      } else {
        error = 'Unable to find appropriate role to assign';
      }
    } catch (err: any) {
      error = `Error updating user role: ${err.message}`;
    }
  }

  function selectAllPermissions(isUserAssignment = false, isEdit = false) {
    const allIds = availableFunctions.map(func => func.id);
    if (isEdit) {
      editSelectedPermissions = allIds;
    } else if (isUserAssignment) {
      userRolePermissions = allIds;
    } else {
      selectedPermissions = allIds;
    }
  }

  function deselectAllPermissions(isUserAssignment = false, isEdit = false) {
    if (isEdit) {
      editSelectedPermissions = [];
    } else if (isUserAssignment) {
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
  <!-- Loading State -->
  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Loading data...</p>
      </div>
    </div>
  {/if}

  <!-- Error/Success Messages -->
  {#if error}
    <div class="alert alert-error">
      <span class="alert-icon">❌</span>
      <span>{error}</span>
      <button class="close-btn" on:click={() => error = ''}>✕</button>
    </div>
  {/if}
  
  {#if success}
    <div class="alert alert-success">
      <span class="alert-icon">✅</span>
      <span>{success}</span>
      <button class="close-btn" on:click={() => success = ''}>✕</button>
    </div>
  {/if}

  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <h1>Manage User Roles</h1>
      <p>Configure user roles and permissions for customer management, transactions, rewards, and system administration</p>
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
            <p class="role-description">{role.description || 'No description available'}</p>
            <div class="role-stats">
              <span class="permission-count">
                {role.permissions?.length || 0} functions
              </span>
              <span class="status-badge {role.is_active ? 'active' : 'inactive'}">
                {role.is_active ? 'Active' : 'Inactive'}
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
                {selectedRole.permissions?.length || 0} of {availableFunctions.length} functions enabled
              </span>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary" on:click={openEditRole}>
                ✏️ Edit Role
              </button>
              <button class="btn btn-danger" on:click={deleteRoleFromDatabase}>
                🗑️ Delete Role
              </button>
            </div>
          </div>

          <div class="details-content">
            <div class="detail-section">
              <h3>Description</h3>
              <p>{selectedRole.description || 'No description available'}</p>
            </div>

            <div class="detail-section">
              <h3>Functions by Category</h3>
              {#each categories as category}
                {@const categoryFunctions = functionsByCategory[category]}
                {@const rolePermissionIds = selectedRole.permissions?.map(p => p.id) || []}
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
              
              {#if !selectedRole.permissions || selectedRole.permissions.length === 0}
                <div class="no-permissions">
                  <span class="no-permissions-icon">🚫</span>
                  <p>This role has no permissions assigned.</p>
                  <button class="btn btn-secondary btn-small" on:click={openEditRole}>
                    Add Permissions
                  </button>
                </div>
              {/if}
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
              <br>
              Available functions: Customer Management, Card Management, Rewards & Coupons, User Management, System Settings, and more.
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

  <!-- Edit Role Modal -->
  {#if showEditRole}
    <div 
      class="modal-overlay" 
      on:click={closeEditRole} 
      on:keydown={(e) => e.key === 'Escape' && closeEditRole()}
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
          <h2>Edit Role: {selectedRole?.name}</h2>
          <button class="close-btn" on:click={closeEditRole} aria-label="Close modal">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="editRoleName">Role Name *</label>
            <input 
              id="editRoleName"
              type="text" 
              bind:value={editRoleName} 
              placeholder="Enter role name"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="editRoleDescription">Description *</label>
            <textarea 
              id="editRoleDescription"
              bind:value={editRoleDescription} 
              placeholder="Enter role description"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <div class="permissions-header">
              <span class="permissions-label">Functions & Permissions</span>
              <div class="bulk-actions">
                <button type="button" class="btn-link" on:click={() => selectAllPermissions(false, true)}>
                  Select All
                </button>
                <button type="button" class="btn-link" on:click={() => deselectAllPermissions(false, true)}>
                  Deselect All
                </button>
              </div>
            </div>
            
            <div class="permissions-container">
              {#each categories as category}
                {@const categoryFunctions = functionsByCategory[category]}
                {@const selectedInCategory = categoryFunctions.filter(func => editSelectedPermissions.includes(func.id)).length}
                
                <div class="category-group">
                  <div class="category-header">
                    <label class="category-toggle">
                      <input 
                        type="checkbox"
                        checked={selectedInCategory === categoryFunctions.length && categoryFunctions.length > 0}
                        indeterminate={selectedInCategory > 0 && selectedInCategory < categoryFunctions.length}
                        on:change={() => toggleCategoryPermissions(category, false, true)}
                      />
                      <span class="category-title">
                        {getCategoryDisplayName(category)} 
                        <span class="category-count">({selectedInCategory}/{categoryFunctions.length})</span>
                      </span>
                    </label>
                  </div>
                  
                  <div class="permissions-grid">
                    {#each categoryFunctions as func}
                      <label class="permission-item">
                        <input 
                          type="checkbox" 
                          checked={editSelectedPermissions.includes(func.id)}
                          on:change={() => togglePermission(func.id, false, true)}
                        />
                        <div class="permission-content">
                          <span class="permission-name">{func.name}</span>
                          <span class="permission-desc">{func.description}</span>
                        </div>
                      </label>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" on:click={closeEditRole}>Cancel</button>
          <button class="btn btn-primary" on:click={updateRoleInDatabase}>
            Update Role ({editSelectedPermissions.length} functions)
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
    position: relative;
  }

  /* Loading Overlay */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .loading-content {
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    text-align: center;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Alert Messages */
  .alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
  }

  .alert-success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .alert-error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  .alert .close-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    margin-left: auto;
    padding: 0;
    color: inherit;
    opacity: 0.7;
  }

  .alert .close-btn:hover {
    opacity: 1;
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

  .no-permissions {
    padding: 3rem 2rem;
    text-align: center;
    color: #6b7280;
    background: #f9fafb;
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
  }

  .no-permissions-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.7;
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
