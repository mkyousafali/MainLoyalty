<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { language } from '$lib/stores/language';

  let socialLinks = [];
  let branches = [];
  let selectedBranchId = '';
  let loading = true;
  let loadingBranches = true;
  let saving = false;
  let showAddForm = false;
  
  // Form data for adding/editing links
  let formData = {
    id: null,
    branch_id: '',
    name: '',
    url: '',
    icon: '',
    custom_icon_url: '',
    use_custom_icon: false,
    is_active: true,
    sort_order: 0
  };

  let uploadingIcon = false;
  let iconFile = null;
  let iconPreview = null;

  // Available social media platforms with their icons
  const availablePlatforms = [
    { name: 'Facebook', icon: '📘', placeholder: 'https://facebook.com/yourpage' },
    { name: 'Instagram', icon: '📷', placeholder: 'https://instagram.com/youraccount' },
    { name: 'Twitter', icon: '🐦', placeholder: 'https://twitter.com/youraccount' },
    { name: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/company/yourcompany' },
    { name: 'YouTube', icon: '📺', placeholder: 'https://youtube.com/channel/yourchannel' },
    { name: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@youraccount' },
    { name: 'WhatsApp', icon: '💬', placeholder: 'https://wa.me/966500000000' },
    { name: 'Telegram', icon: '📱', placeholder: 'https://t.me/yourchannel' },
    { name: 'Snapchat', icon: '👻', placeholder: 'https://snapchat.com/add/youraccount' },
    { name: 'Website', icon: '🌐', placeholder: 'https://yourwebsite.com' },
    { name: 'Custom', icon: '🔗', placeholder: 'https://example.com' }
  ];

  let editingId = null;

  onMount(() => {
    loadBranches();
    loadSocialLinks();
  });

  async function loadBranches() {
    try {
      loadingBranches = true;
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, name_en, name_ar')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      branches = data || [];
    } catch (error) {
      console.error('Error loading branches:', error);
      branches = [];
    } finally {
      loadingBranches = false;
    }
  }

  async function loadSocialLinks() {
    if (!selectedBranchId) {
      socialLinks = [];
      loading = false;
      return;
    }

    try {
      loading = true;
      
      // Load real social links from database
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('branch_id', selectedBranchId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      socialLinks = data || [];
      
    } catch (error) {
      console.error('Error loading social links:', error);
      socialLinks = [];
    } finally {
      loading = false;
    }
  }

  function getSampleLinks(branchId) {
    const branchSpecificLinks = {
      '1': [ // Main Branch - Riyadh
        { id: 1, branch_id: '1', name: 'Facebook', url: 'https://facebook.com/urbanmarket.riyadh', icon: '📘', is_active: true, sort_order: 1 },
        { id: 2, branch_id: '1', name: 'Instagram', url: 'https://instagram.com/urbanmarket.riyadh', icon: '📷', is_active: true, sort_order: 2 },
        { id: 3, branch_id: '1', name: 'WhatsApp', url: 'https://wa.me/966567334726', icon: '💬', is_active: true, sort_order: 3 }
      ],
      '2': [ // Branch 2 - Jeddah
        { id: 4, branch_id: '2', name: 'Facebook', url: 'https://facebook.com/urbanmarket.jeddah', icon: '📘', is_active: true, sort_order: 1 },
        { id: 5, branch_id: '2', name: 'Instagram', url: 'https://instagram.com/urbanmarket.jeddah', icon: '📷', is_active: true, sort_order: 2 },
        { id: 6, branch_id: '2', name: 'Twitter', url: 'https://twitter.com/urbanmarket_jed', icon: '🐦', is_active: true, sort_order: 3 }
      ],
      '3': [ // Branch 3 - Dammam
        { id: 7, branch_id: '3', name: 'Facebook', url: 'https://facebook.com/urbanmarket.dammam', icon: '📘', is_active: true, sort_order: 1 },
        { id: 8, branch_id: '3', name: 'Instagram', url: 'https://instagram.com/urbanmarket.dammam', icon: '📷', is_active: true, sort_order: 2 },
        { id: 9, branch_id: '3', name: 'LinkedIn', url: 'https://linkedin.com/company/urbanmarket-dammam', icon: '💼', is_active: true, sort_order: 3 }
      ]
    };

    return branchSpecificLinks[branchId] || [];
  }

  function resetForm() {
    formData = {
      id: null,
      branch_id: selectedBranchId,
      name: '',
      url: '',
      icon: '',
      custom_icon_url: '',
      use_custom_icon: false,
      is_active: true,
      sort_order: socialLinks.length + 1
    };
    editingId = null;
    iconFile = null;
    iconPreview = null;
  }

  function addLink() {
    resetForm();
    showAddForm = true;
  }

  function editLink(link) {
    formData = { ...link };
    editingId = link.id;
    showAddForm = true;
  }

  function selectPlatform(platform) {
    formData.name = platform.name;
    formData.icon = platform.icon;
    formData.use_custom_icon = false;
    formData.custom_icon_url = '';
    iconFile = null;
    iconPreview = null;
    if (!formData.url) {
      formData.url = platform.placeholder;
    }
  }

  async function handleIconUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'image/png') {
      alert(localTranslations.invalidFileType);
      event.target.value = '';
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert(localTranslations.fileTooLarge);
      event.target.value = '';
      return;
    }

    // Create image to check dimensions
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = function() {
      if (img.width > 500 || img.height > 500) {
        alert(localTranslations.dimensionsTooLarge);
        event.target.value = '';
        return;
      }

      // Create preview
      canvas.width = Math.min(img.width, 64);
      canvas.height = Math.min(img.height, 64);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      iconPreview = canvas.toDataURL();
      
      iconFile = file;
      formData.use_custom_icon = true;
      formData.icon = ''; // Clear emoji icon when using custom
    };

    img.src = URL.createObjectURL(file);
  }

  function removeCustomIcon() {
    iconFile = null;
    iconPreview = null;
    formData.use_custom_icon = false;
    formData.custom_icon_url = '';
    document.querySelector('#icon-upload').value = '';
  }

  async function saveLink() {
    try {
      saving = true;
      
      if (!formData.name || !formData.url) {
        alert('Please fill in all required fields');
        return;
      }

      if (formData.use_custom_icon && !iconFile && !formData.custom_icon_url) {
        alert('Please select an icon or upload a custom image');
        return;
      }

      let linkData = { ...formData };

      // Handle custom icon upload to Supabase storage
      if (iconFile) {
        try {
          uploadingIcon = true;
          
          // Generate unique filename
          const fileExt = iconFile.name.split('.').pop();
          const fileName = `${selectedBranchId}-${Date.now()}.${fileExt}`;
          const filePath = `social-icons/${fileName}`;

          // Upload to Supabase storage bucket
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('social-icons')
            .upload(filePath, iconFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('social-icons')
            .getPublicUrl(filePath);

          linkData.custom_icon_url = urlData.publicUrl;
          
        } catch (uploadError) {
          console.error('Error uploading icon:', uploadError);
          alert('Failed to upload icon. Please try again.');
          return;
        } finally {
          uploadingIcon = false;
        }
      }

      // Remove temporary fields
      delete linkData.id;

      if (editingId) {
        // Update existing link in database
        const { error } = await supabase
          .from('social_links')
          .update(linkData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Add new link to database
        linkData.branch_id = selectedBranchId;
        linkData.sort_order = socialLinks.length + 1;
        
        const { error } = await supabase
          .from('social_links')
          .insert([linkData]);

        if (error) throw error;
      }

      // Reload data from database
      await loadSocialLinks();
      showAddForm = false;
      resetForm();
      
    } catch (error) {
      console.error('Error saving link:', error);
      alert('Failed to save link. Please try again.');
    } finally {
      saving = false;
    }
  }

  async function deleteLink(id) {
    if (confirm('Are you sure you want to delete this link?')) {
      try {
        const { error } = await supabase
          .from('social_links')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Reload data from database
        await loadSocialLinks();
      } catch (error) {
        console.error('Error deleting link:', error);
        alert('Failed to delete link. Please try again.');
      }
    }
  }

  async function toggleActive(id) {
    try {
      const link = socialLinks.find(l => l.id === id);
      if (!link) return;

      const { error } = await supabase
        .from('social_links')
        .update({ is_active: !link.is_active })
        .eq('id', id);

      if (error) throw error;
      
      // Reload data from database
      await loadSocialLinks();
    } catch (error) {
      console.error('Error updating link status:', error);
      alert('Failed to update link status. Please try again.');
    }
  }

  async function moveUp(index) {
    if (index > 0) {
      const currentLink = socialLinks[index];
      const aboveLink = socialLinks[index - 1];
      
      try {
        // Update sort orders in database
        await supabase.from('social_links').update({ sort_order: aboveLink.sort_order }).eq('id', currentLink.id);
        await supabase.from('social_links').update({ sort_order: currentLink.sort_order }).eq('id', aboveLink.id);
        
        // Reload data from database
        await loadSocialLinks();
      } catch (error) {
        console.error('Error moving link up:', error);
        alert('Failed to move link. Please try again.');
      }
    }
  }

  async function moveDown(index) {
    if (index < socialLinks.length - 1) {
      const currentLink = socialLinks[index];
      const belowLink = socialLinks[index + 1];
      
      try {
        // Update sort orders in database
        await supabase.from('social_links').update({ sort_order: belowLink.sort_order }).eq('id', currentLink.id);
        await supabase.from('social_links').update({ sort_order: currentLink.sort_order }).eq('id', belowLink.id);
        
        // Reload data from database
        await loadSocialLinks();
      } catch (error) {
        console.error('Error moving link down:', error);
        alert('Failed to move link. Please try again.');
      }
    }
  }

  const translations = {
    en: {
      title: 'Manage Social Links',
      subtitle: 'Add and manage social media links for the guest login page',
      addLink: 'Add New Link',
      editLink: 'Edit Link',
      platformName: 'Platform Name',
      url: 'URL',
      icon: 'Icon',
      active: 'Active',
      inactive: 'Inactive',
      actions: 'Actions',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      moveUp: 'Move Up',
      moveDown: 'Move Down',
      selectPlatform: 'Select Platform',
      customPlatform: 'Custom Platform',
      previewTitle: 'Preview on Guest Page',
      noLinks: 'No social links configured',
      loading: 'Loading social links...',
      selectBranch: 'Select Branch',
      chooseBranch: 'Choose a branch to manage its social links...',
      branchRequired: 'Please select a branch to view and manage social links',
      useEmoji: 'Use Emoji',
      uploadCustomIcon: 'Upload Custom Icon',
      iconRequirements: 'PNG only, max 500x500 pixels, max 2MB',
      iconPreview: 'Preview',
      removeIcon: 'Remove',
      invalidFileType: 'Only PNG files are allowed. Please select a PNG image.',
      fileTooLarge: 'File size must be less than 2MB.',
      dimensionsTooLarge: 'Image dimensions must be maximum 500x500 pixels.'
    },
    ar: {
      title: 'إدارة الروابط الاجتماعية',
      subtitle: 'إضافة وإدارة روابط وسائل التواصل الاجتماعي لصفحة دخول الضيوف',
      addLink: 'إضافة رابط جديد',
      editLink: 'تعديل الرابط',
      platformName: 'اسم المنصة',
      url: 'الرابط',
      icon: 'الأيقونة',
      active: 'نشط',
      inactive: 'غير نشط',
      actions: 'الإجراءات',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      moveUp: 'نقل لأعلى',
      moveDown: 'نقل لأسفل',
      selectPlatform: 'اختر المنصة',
      customPlatform: 'منصة مخصصة',
      previewTitle: 'معاينة على صفحة الضيوف',
      noLinks: 'لم يتم تكوين روابط اجتماعية',
      loading: 'جاري تحميل الروابط الاجتماعية...',
      selectBranch: 'اختر الفرع',
      chooseBranch: 'اختر فرعاً لإدارة روابطه الاجتماعية...',
      branchRequired: 'يرجى اختيار فرع لعرض وإدارة الروابط الاجتماعية',
      useEmoji: 'استخدم إيموجي',
      uploadCustomIcon: 'رفع أيقونة مخصصة',
      iconRequirements: 'PNG فقط، الحد الأقصى 500x500 بكسل، 2 ميجا بايت كحد أقصى',
      iconPreview: 'معاينة',
      removeIcon: 'إزالة',
      invalidFileType: 'يُسمح بملفات PNG فقط. يرجى اختيار صورة PNG.',
      fileTooLarge: 'يجب أن يكون حجم الملف أقل من 2 ميجا بايت.',
      dimensionsTooLarge: 'يجب أن تكون أبعاد الصورة بحد أقصى 500x500 بكسل.'
    }
  };

  $: localTranslations = translations[$language];
  
  // Watch for branch selection changes
  $: if (selectedBranchId) {
    loadSocialLinks();
  }
</script>

<div class="p-6 bg-gray-50 min-h-screen" dir="{$language === 'ar' ? 'rtl' : 'ltr'}">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
        <span class="text-white text-xl">🔗</span>
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">{localTranslations.title}</h1>
        <p class="text-gray-600">{localTranslations.subtitle}</p>
      </div>
    </div>
  </div>

  <!-- Branch Selection -->
  <div class="mb-6">
    <label for="branch-select" class="block text-sm font-medium text-gray-700 mb-2">
      {localTranslations.selectBranch}
    </label>
    
    {#if loadingBranches}
      <div class="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-500">
        <div class="flex items-center gap-2">
          <svg class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading branches...
        </div>
      </div>
    {:else}
      <select
        id="branch-select"
        bind:value={selectedBranchId}
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="">{localTranslations.chooseBranch}</option>
        {#each branches as branch}
          <option value={branch.id}>
            {$language === 'ar' ? (branch.name_ar || branch.name_en || branch.name) : (branch.name_en || branch.name)}
          </option>
        {/each}
      </select>
    {/if}
  </div>

  <!-- Add Button -->
  <div class="mb-6">
    <button
      on:click={addLink}
      disabled={!selectedBranchId}
      class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
      {localTranslations.addLink}
    </button>
  </div>

  {#if !selectedBranchId}
    <!-- Branch Selection Required -->
    <div class="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">{localTranslations.selectBranch}</h3>
        <p class="text-gray-600">{localTranslations.branchRequired}</p>
      </div>
    </div>
  {:else if loading}
    <!-- Loading State -->
    <div class="bg-white rounded-xl p-8 shadow-sm">
      <div class="flex items-center justify-center">
        <div class="flex items-center gap-3 text-gray-600">
          <svg class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{localTranslations.loading}</span>
        </div>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Social Links Management -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-800">Social Links</h2>
        </div>
        
        <div class="p-6">
          {#if socialLinks.length > 0}
            <div class="space-y-4">
              {#each socialLinks as link, index}
                <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div class="flex items-center gap-4">
                    {#if link.use_custom_icon && link.custom_icon_url}
                      <img src={link.custom_icon_url} alt={link.name} class="w-8 h-8 object-contain rounded" />
                    {:else}
                      <span class="text-2xl">{link.icon}</span>
                    {/if}
                    <div>
                      <div class="font-medium text-gray-900">{link.name}</div>
                      <div class="text-sm text-gray-500 truncate max-w-48">{link.url}</div>
                    </div>
                    <span class="text-xs px-2 py-1 rounded-full {link.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                      {link.is_active ? localTranslations.active : localTranslations.inactive}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <!-- Toggle Active -->
                    <button
                      on:click={() => toggleActive(link.id)}
                      class="p-2 hover:bg-gray-100 rounded-lg"
                      title="Toggle Active"
                    >
                      <svg class="w-4 h-4 {link.is_active ? 'text-green-600' : 'text-gray-400'}" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                      </svg>
                    </button>
                    
                    <!-- Move Up -->
                    <button
                      on:click={() => moveUp(index)}
                      disabled={index === 0}
                      class="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title={localTranslations.moveUp}
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
                      </svg>
                    </button>
                    
                    <!-- Move Down -->
                    <button
                      on:click={() => moveDown(index)}
                      disabled={index === socialLinks.length - 1}
                      class="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title={localTranslations.moveDown}
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"></path>
                      </svg>
                    </button>
                    
                    <!-- Edit -->
                    <button
                      on:click={() => editLink(link)}
                      class="p-2 hover:bg-gray-100 rounded-lg text-blue-600"
                      title={localTranslations.edit}
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    
                    <!-- Delete -->
                    <button
                      on:click={() => deleteLink(link.id)}
                      class="p-2 hover:bg-red-100 rounded-lg text-red-600"
                      title={localTranslations.delete}
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">{localTranslations.noLinks}</h3>
            </div>
          {/if}
        </div>
      </div>

      <!-- Preview -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-800">{localTranslations.previewTitle}</h2>
        </div>
        
        <div class="p-6">
          <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Social Links</h3>
            {#if socialLinks.filter(link => link.is_active).length > 0}
              <div class="flex flex-wrap gap-3">
                {#each socialLinks.filter(link => link.is_active) as link}
                  <a 
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-purple-300"
                  >
                    {#if link.use_custom_icon && link.custom_icon_url}
                      <img src={link.custom_icon_url} alt={link.name} class="w-5 h-5 object-contain" />
                    {:else}
                      <span class="text-xl">{link.icon}</span>
                    {/if}
                    <span class="text-sm font-medium text-gray-700">{link.name}</span>
                  </a>
                {/each}
              </div>
            {:else}
              <p class="text-gray-500">No active social links to display</p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Add/Edit Modal -->
{#if showAddForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl max-w-md w-full p-6">
      <h3 class="text-lg font-semibold mb-4">
        {editingId ? localTranslations.editLink : localTranslations.addLink}
      </h3>
      
      <!-- Platform Selection -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {localTranslations.selectPlatform}
        </label>
        <div class="grid grid-cols-4 gap-2 mb-4">
          {#each availablePlatforms as platform}
            <button
              type="button"
              on:click={() => selectPlatform(platform)}
              class="flex flex-col items-center p-2 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors {formData.name === platform.name ? 'border-blue-500 bg-blue-50' : ''}"
            >
              <span class="text-xl">{platform.icon}</span>
              <span class="text-xs font-medium text-gray-600 mt-1">{platform.name}</span>
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Form Fields -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {localTranslations.platformName}
          </label>
          <input
            type="text"
            bind:value={formData.name}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Facebook"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {localTranslations.url}
          </label>
          <input
            type="url"
            bind:value={formData.url}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {localTranslations.icon}
          </label>
          
          <div class="space-y-4">
            <!-- Emoji Icon Option -->
            <div class="flex items-center gap-3">
              <input
                type="radio"
                id="use_emoji"
                bind:group={formData.use_custom_icon}
                value={false}
                class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label for="use_emoji" class="text-sm font-medium text-gray-700">{localTranslations.useEmoji}</label>
              <input
                type="text"
                bind:value={formData.icon}
                disabled={formData.use_custom_icon}
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed flex-1"
                placeholder="📘"
                maxlength="2"
              />
            </div>

            <!-- Custom Icon Upload Option -->
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <input
                  type="radio"
                  id="use_custom"
                  bind:group={formData.use_custom_icon}
                  value={true}
                  class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label for="use_custom" class="text-sm font-medium text-gray-700">{localTranslations.uploadCustomIcon}</label>
              </div>
              
              {#if formData.use_custom_icon}
                <div class="ml-7 space-y-3">
                  <!-- File Upload -->
                  <div>
                    <input
                      type="file"
                      id="icon-upload"
                      accept="image/png"
                      on:change={handleIconUpload}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      {localTranslations.iconRequirements}
                    </p>
                  </div>
                  
                  <!-- Preview -->
                  {#if iconPreview}
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img src={iconPreview} alt="Icon preview" class="w-8 h-8 object-contain" />
                      <span class="text-sm text-gray-700">{localTranslations.iconPreview}</span>
                      <button
                        type="button"
                        on:click={removeCustomIcon}
                        class="ml-auto text-red-600 hover:text-red-800 text-sm"
                      >
                        {localTranslations.removeIcon}
                      </button>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            bind:checked={formData.is_active}
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label for="is_active" class="text-sm font-medium text-gray-700">
            {localTranslations.active}
          </label>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex justify-end gap-3 mt-6">
        <button
          type="button"
          on:click={() => { showAddForm = false; resetForm(); }}
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          disabled={saving}
        >
          {localTranslations.cancel}
        </button>
        <button
          type="button"
          on:click={saveLink}
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? 'Saving...' : localTranslations.save}
        </button>
      </div>
    </div>
  </div>
{/if}
