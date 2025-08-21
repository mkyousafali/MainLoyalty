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
    created_at: string;
  }

  let apps: OtherApp[] = [];
  let loading = true;
  let saving = false;  // Add saving state
  let showAddForm = false;
  let editingApp: OtherApp | null = null;
  let iconFile: File | null = null;
  let iconPreview: string = '';
  let uploadingIcon = false;

  // Form data
  let formData = {
    name: '',
    url: '',
    description: '',
    icon_path: '', // Changed from icon_url to icon_path
    icon_filename: '',
    category: 'general',
    is_active: true,
    sort_order: 0
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'communication', label: 'Communication' },
    { value: 'design', label: 'Design' },
    { value: 'finance', label: 'Finance' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'development', label: 'Development' },
    { value: 'analytics', label: 'Analytics' }
  ];

  onMount(async () => {
    await loadApps();
  });

  async function loadApps() {
    try {
      console.log('Loading apps from other_apps table...');
      const { data, error } = await supabase
        .from('other_apps')
        .select('*')
        .order('sort_order');

      if (error) {
        console.error('Supabase error:', error);
        
        // Check if table doesn't exist
        if (error.message.includes('relation "other_apps" does not exist')) {
          console.error('Database table "other_apps" does not exist. Please run the SQL schema first.');
          alert('Database Error: The "other_apps" table does not exist. Please run the create_other_apps_schema.sql script in your Supabase SQL Editor first.');
          return;
        }
        
        alert('Error loading apps: ' + error.message);
        return;
      }

      console.log('Apps loaded successfully:', data);
      apps = data || [];
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      loading = false;
    }
  }

  function resetForm() {
    formData = {
      name: '',
      url: '',
      description: '',
      icon_path: '',
      icon_filename: '',
      category: 'general',
      is_active: true,
      sort_order: apps.length
    };
    editingApp = null;
    showAddForm = false;
    iconFile = null;
    iconPreview = '';
  }

  function startAddNew() {
    formData = {
      name: '',
      url: '',
      description: '',
      icon_path: '',
      icon_filename: '',
      category: 'general',
      is_active: true,
      sort_order: apps.length
    };
    editingApp = null;
    showAddForm = true;
    iconFile = null;
    iconPreview = '';
  }

  function startEdit(app: OtherApp) {
    editingApp = app;
    formData = {
      name: app.name,
      url: app.url,
      description: app.description || '',
      icon_path: app.icon_path || '',
      icon_filename: app.icon_filename || '',
      category: app.category,
      is_active: app.is_active,
      sort_order: app.sort_order
    };
    showAddForm = true;
    iconFile = null;
    // Set icon preview if there's an existing icon
    if (app.icon_path) {
      iconPreview = `${supabase.supabaseUrl}/storage/v1/object/public/app-icons/${app.icon_path}`;
    } else if (app.icon_url) {
      iconPreview = app.icon_url; // Fallback to old icon_url
    } else {
      iconPreview = '';
    }
  }

  async function handleIconUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      iconFile = null;
      iconPreview = '';
      return;
    }

    // Validate file type (PNG only)
    if (file.type !== 'image/png') {
      alert('Please select a PNG file only.');
      input.value = '';
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      input.value = '';
      return;
    }

    iconFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      iconPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function uploadIcon(): Promise<string | null> {
    if (!iconFile) return null;

    try {
      uploadingIcon = true;
      const fileExt = 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading icon:', fileName);

      const { data, error } = await supabase.storage
        .from('app-icons')
        .upload(fileName, iconFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Icon upload error:', error);
        throw error;
      }

      console.log('Icon uploaded successfully:', data.path);
      return data.path;
    } catch (error) {
      console.error('Error uploading icon:', error);
      alert('Failed to upload icon. Please try again.');
      return null;
    } finally {
      uploadingIcon = false;
    }
  }

  async function saveApp() {
    console.log('=== SAVE APP FUNCTION CALLED ===');
    console.log('Form data:', formData);
    console.log('Editing app:', editingApp);
    console.log('Icon file:', iconFile);
    
    // Prevent multiple submissions
    if (saving) {
      console.log('Already saving, ignoring...');
      return;
    }
    
    if (!formData.name.trim() || !formData.url.trim()) {
      console.log('Validation failed - missing required fields');
      alert('Please fill in the required fields (Name and URL)');
      return;
    }

    // Add https:// if no protocol is specified
    if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
      formData.url = 'https://' + formData.url;
      console.log('Added https:// to URL:', formData.url);
    }

    saving = true;  // Set saving state
    console.log('Starting database operation...');
    
    try {
      // Handle icon upload if a new file is selected
      let iconPath = formData.icon_path;
      let iconFilename = formData.icon_filename;
      
      if (iconFile) {
        console.log('Uploading new icon...');
        const uploadedPath = await uploadIcon();
        if (uploadedPath) {
          iconPath = uploadedPath;
          iconFilename = iconFile.name;
          console.log('Icon uploaded successfully:', { iconPath, iconFilename });
        } else {
          console.log('Icon upload failed, continuing without icon...');
          iconPath = '';
          iconFilename = '';
        }
      }

      if (editingApp) {
        // Update existing app
        console.log('=== UPDATING EXISTING APP ===');
        console.log('Updating app with ID:', editingApp.id);
        
        const updateData = {
          name: formData.name.trim(),
          url: formData.url.trim(),
          description: formData.description.trim() || null,
          icon_path: iconPath || null,
          icon_filename: iconFilename || null,
          category: formData.category,
          is_active: formData.is_active,
          sort_order: formData.sort_order
        };
        
        console.log('Update data:', updateData);
        
        const { data, error } = await supabase
          .from('other_apps')
          .update(updateData)
          .eq('id', editingApp.id)
          .select(); // Add select to return the updated data

        if (error) {
          console.error('=== UPDATE ERROR ===', error);
          alert('Error updating app: ' + error.message);
          return;
        }
        
        console.log('=== UPDATE SUCCESS ===', data);
      } else {
        // Create new app
        console.log('=== CREATING NEW APP ===');
        
        const insertData = {
          name: formData.name.trim(),
          url: formData.url.trim(),
          description: formData.description.trim() || null,
          icon_path: iconPath || null,
          icon_filename: iconFilename || null,
          category: formData.category,
          is_active: formData.is_active,
          sort_order: formData.sort_order
        };
        
        console.log('Insert data:', insertData);
        
        const { data, error } = await supabase
          .from('other_apps')
          .insert(insertData)
          .select(); // Add select to return the inserted data

        if (error) {
          console.error('=== INSERT ERROR ===', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          alert('Error creating app: ' + error.message);
          return;
        }
        
        console.log('=== INSERT SUCCESS ===', data);
      }

      console.log('=== RELOADING APPS ===');
      await loadApps();
      
      console.log('=== RESETTING FORM ===');
      resetForm();
      
      console.log('=== SAVE OPERATION COMPLETE ===');
    } catch (error) {
      console.error('=== UNEXPECTED ERROR ===', error);
      alert('Unexpected error saving app: ' + error);
    } finally {
      saving = false;  // Reset saving state
    }
  }

  async function deleteApp(app: OtherApp) {
    if (!confirm(`Are you sure you want to delete "${app.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('other_apps')
        .delete()
        .eq('id', app.id);

      if (error) {
        console.error('Error deleting app:', error);
        alert('Error deleting app: ' + error.message);
        return;
      }

      await loadApps();
    } catch (error) {
      console.error('Error deleting app:', error);
      alert('Error deleting app');
    }
  }

  async function toggleAppStatus(app: OtherApp) {
    try {
      const { error } = await supabase
        .from('other_apps')
        .update({ is_active: !app.is_active })
        .eq('id', app.id);

      if (error) {
        console.error('Error updating app status:', error);
        return;
      }

      await loadApps();
    } catch (error) {
      console.error('Error updating app status:', error);
    }
  }

  async function testDatabaseConnection() {
    try {
      console.log('Testing database connection...');
      
      // Test direct connection to other_apps table
      const { data, error } = await supabase
        .from('other_apps')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('Error accessing other_apps table:', error);
        
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          alert('❌ Database Error: The "other_apps" table does not exist.\n\n' +
                'Please run the create_other_apps_schema.sql script in your Supabase SQL Editor first.\n\n' +
                'Steps:\n1. Copy content from create_other_apps_schema.sql\n2. Go to Supabase Dashboard → SQL Editor\n3. Paste and execute the schema');
        } else {
          alert('❌ Database connection failed: ' + error.message);
        }
        return;
      }

      console.log('other_apps table accessible, count:', data);
      alert('✅ Database connection successful! other_apps table exists and is accessible.');
      
    } catch (error) {
      console.error('Database test failed:', error);
      alert('❌ Database test failed: ' + error);
    }
  }
</script>

<svelte:head>
  <title>Manage Other Apps - Admin Panel</title>
</svelte:head>

<div class="manage-apps-page">
  <!-- Database Status Check -->
  <div class="debug-panel">
    <details class="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
      <summary class="cursor-pointer font-medium text-yellow-800">🔍 Debug Info (Click to expand)</summary>
      <div class="mt-2 space-y-2 text-sm">
        <div><strong>Supabase URL:</strong> https://sfydwpimwnxocrgpiour.supabase.co</div>
        <div><strong>Loading State:</strong> {loading ? 'Loading...' : 'Complete'}</div>
        <div><strong>Apps Count:</strong> {apps.length}</div>
        <div class="text-red-600"><strong>⚠️ Issue:</strong> The "other_apps" table doesn't exist yet</div>
        <div class="bg-blue-50 p-3 rounded mt-3">
          <strong class="text-blue-800">To Fix:</strong>
          <ol class="text-blue-700 text-xs mt-1 ml-4 list-decimal">
            <li>Go to your Supabase Dashboard</li>
            <li>Navigate to SQL Editor</li>
            <li>Copy and paste the content from create_other_apps_schema.sql</li>
            <li>Execute the script</li>
            <li>Refresh this page</li>
          </ol>
        </div>
        <button 
          class="bg-blue-500 text-white px-3 py-1 rounded text-xs mt-2"
          on:click={testDatabaseConnection}
        >
          Test Database Connection
        </button>
      </div>
    </details>
  </div>

  <div class="page-header">
    <div class="header-content">
      <h1 class="page-title">🔧 Manage Other Apps</h1>
      <p class="page-description">Add and configure external applications</p>
    </div>
    
    <button 
      class="add-app-btn"
      on:click={startAddNew}
    >
      <span>➕</span>
      Add New App
    </button>
  </div>

  {#if showAddForm}
    <!-- Add/Edit Form -->
    <div class="form-container">
      <div class="form-header">
        <h2 class="form-title">
          {editingApp ? '✏️ Edit App' : '➕ Add New App'}
        </h2>
        <button class="close-form-btn" on:click={resetForm}>
          <span>❌</span>
        </button>
      </div>

      <form on:submit|preventDefault={saveApp} class="app-form">
        <div class="form-grid">
          <!-- Name -->
          <div class="form-field">
            <label for="name" class="form-label">App Name *</label>
            <input
              id="name"
              type="text"
              bind:value={formData.name}
              class="form-input"
              placeholder="e.g., Google Drive"
              required
            />
          </div>

          <!-- URL -->
          <div class="form-field">
            <label for="url" class="form-label">App URL *</label>
            <input
              id="url"
              type="url"
              bind:value={formData.url}
              class="form-input"
              placeholder="e.g., https://drive.google.com"
              required
            />
          </div>

          <!-- Description -->
          <div class="form-field full-width">
            <label for="description" class="form-label">Description</label>
            <textarea
              id="description"
              bind:value={formData.description}
              class="form-textarea"
              placeholder="Brief description of the app..."
              rows="3"
            ></textarea>
          </div>

          <!-- Icon Upload -->
          <div class="form-field">
            <label for="icon_file" class="form-label">App Icon (PNG only)</label>
            <div class="icon-upload-container">
              <input
                id="icon_file"
                type="file"
                accept=".png,image/png"
                on:change={handleIconUpload}
                class="form-input-file"
              />
              <div class="icon-upload-info">
                <span>📁 Choose PNG file (max 2MB)</span>
                {#if iconFile}
                  <span class="selected-file">✅ {iconFile.name}</span>
                {/if}
              </div>
              {#if iconPreview}
                <div class="icon-preview">
                  <img src={iconPreview} alt="Icon preview" class="preview-image" />
                  <span class="preview-label">Preview</span>
                </div>
              {/if}
              {#if uploadingIcon}
                <div class="uploading-indicator">
                  <span class="loading-spinner">⏳</span> Uploading icon...
                </div>
              {/if}
            </div>
          </div>

          <!-- Category -->
          <div class="form-field">
            <label for="category" class="form-label">Category</label>
            <select
              id="category"
              bind:value={formData.category}
              class="form-select"
            >
              {#each categories as category}
                <option value={category.value}>{category.label}</option>
              {/each}
            </select>
          </div>

          <!-- Sort Order -->
          <div class="form-field">
            <label for="sort_order" class="form-label">Sort Order</label>
            <input
              id="sort_order"
              type="number"
              bind:value={formData.sort_order}
              class="form-input"
              min="0"
            />
          </div>

          <!-- Active Status -->
          <div class="form-field">
            <label class="form-checkbox-label">
              <input
                type="checkbox"
                bind:checked={formData.is_active}
                class="form-checkbox"
              />
              <span class="checkbox-text">Active</span>
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="secondary-btn" on:click={resetForm}>
            Cancel
          </button>
          <button type="submit" class="primary-btn" disabled={saving}>
            <span>{saving ? '⏳' : (editingApp ? '💾' : '➕')}</span>
            {saving ? 'Saving...' : (editingApp ? 'Update App' : 'Add App')}
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Apps List -->
  <div class="apps-list">
    {#if loading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading apps...</p>
      </div>
    {:else if apps.length === 0}
      <div class="empty-state">
        <div class="empty-icon">📱</div>
        <h3>No Apps Configured</h3>
        <p>Add your first external app to get started.</p>
      </div>
    {:else}
      <div class="apps-table">
        <div class="table-header">
          <div class="header-cell">App</div>
          <div class="header-cell">URL</div>
          <div class="header-cell">Category</div>
          <div class="header-cell">Status</div>
          <div class="header-cell">Actions</div>
        </div>

        {#each apps as app}
          <div class="table-row {!app.is_active ? 'inactive' : ''}">
            <div class="cell app-cell">
              <div class="app-info">
                {#if app.icon_path}
                  <img src="{supabase.supabaseUrl}/storage/v1/object/public/app-icons/{app.icon_path}" alt="{app.name} icon" class="app-icon" />
                {:else if app.icon_url}
                  <img src={app.icon_url} alt="{app.name} icon" class="app-icon" />
                {:else}
                  <div class="default-app-icon">🌐</div>
                {/if}
                <div class="app-details">
                  <div class="app-name">{app.name}</div>
                  {#if app.description}
                    <div class="app-description">{app.description}</div>
                  {/if}
                </div>
              </div>
            </div>

            <div class="cell url-cell">
              <a href={app.url} target="_blank" class="app-url" title="Open in new tab">
                {app.url}
                <span class="external-icon">🔗</span>
              </a>
            </div>

            <div class="cell category-cell">
              <span class="category-badge">{app.category}</span>
            </div>

            <div class="cell status-cell">
              <button 
                class="status-toggle {app.is_active ? 'active' : 'inactive'}"
                on:click={() => toggleAppStatus(app)}
                title="Toggle active status"
              >
                {app.is_active ? '✅ Active' : '❌ Inactive'}
              </button>
            </div>

            <div class="cell actions-cell">
              <div class="action-buttons">
                <button 
                  class="action-btn edit-btn"
                  on:click={() => startEdit(app)}
                  title="Edit app"
                >
                  <span>✏️</span>
                </button>
                
                <button 
                  class="action-btn delete-btn"
                  on:click={() => deleteApp(app)}
                  title="Delete app"
                >
                  <span>🗑️</span>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .manage-apps-page {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .header-content h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  .header-content p {
    font-size: 1.1rem;
    color: #64748b;
    margin: 0;
  }

  .add-app-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    white-space: nowrap;
  }

  .add-app-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  /* Form Styles */
  .form-container {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 2rem;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .form-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }

  .close-form-btn {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .close-form-btn:hover {
    background: #e2e8f0;
  }

  .app-form {
    padding: 1.5rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-field.full-width {
    grid-column: 1 / -1;
  }

  .form-label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .form-input,
  .form-textarea,
  .form-select {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .form-input:focus,
  .form-textarea:focus,
  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .form-checkbox {
    width: 1rem;
    height: 1rem;
  }

  .checkbox-text {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  /* Icon Upload Styles */
  .icon-upload-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-input-file {
    display: block;
    width: 100%;
    padding: 0.5rem;
    border: 2px dashed #d1d5db;
    border-radius: 6px;
    background: #f9fafb;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .form-input-file:hover {
    border-color: #8b5cf6;
    background: #f3f4f6;
  }

  .form-input-file:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  .icon-upload-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .selected-file {
    color: #059669;
    font-weight: 500;
  }

  .icon-preview {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f3f4f6;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .preview-image {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 4px;
    background: white;
    border: 1px solid #e5e7eb;
  }

  .preview-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .uploading-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #eff6ff;
    border: 1px solid #dbeafe;
    border-radius: 4px;
    color: #1d4ed8;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .loading-spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .primary-btn,
  .secondary-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .primary-btn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }

  .primary-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .primary-btn:disabled:hover {
    transform: none;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .secondary-btn {
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }

  .secondary-btn:hover {
    background: #f1f5f9;
    color: #475569;
  }

  /* Apps Table */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem;
    gap: 1rem;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #64748b;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .apps-table {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  .table-header {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .header-cell {
    padding: 1rem;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .table-row {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.2s ease;
  }

  .table-row:hover {
    background: #f8fafc;
  }

  .table-row.inactive {
    opacity: 0.6;
  }

  .cell {
    padding: 1rem;
    display: flex;
    align-items: center;
  }

  .app-cell .app-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .app-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    object-fit: contain;
  }

  .default-app-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    border-radius: 6px;
    font-size: 1rem;
  }

  .app-name {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .app-description {
    font-size: 0.75rem;
    color: #64748b;
    line-height: 1.4;
  }

  .app-url {
    color: #3b82f6;
    text-decoration: none;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-url:hover {
    text-decoration: underline;
  }

  .external-icon {
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .category-badge {
    background: #dbeafe;
    color: #1e40af;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .status-toggle {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .status-toggle.active {
    background: #dcfce7;
    color: #15803d;
  }

  .status-toggle.inactive {
    background: #fee2e2;
    color: #dc2626;
  }

  .status-toggle:hover {
    opacity: 0.8;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .edit-btn:hover {
    background: #fef3c7;
    border-color: #fbbf24;
  }

  .delete-btn:hover {
    background: #fee2e2;
    border-color: #ef4444;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .apps-table,
    .table-header,
    .table-row {
      display: block;
    }

    .table-header {
      display: none;
    }

    .table-row {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 1rem;
      padding: 1rem;
    }

    .cell {
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .cell:last-child {
      border-bottom: none;
    }
  }
</style>
