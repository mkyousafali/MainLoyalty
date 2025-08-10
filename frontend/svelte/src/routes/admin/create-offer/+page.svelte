<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  // Form data
  let title = '';
  let description = '';
  let selectedBranchId = '';
  let discountPercentage = 0;
  let discountAmount = 0;
  let minimumPurchase = 0;
  let validFrom = '';
  let validUntil = '';
  let termsConditions = '';
  let maxRedemptions = 0;
  let isActive = true;

  // File handling
  let imageFile: File | null = null;
  let pdfFile: File | null = null;
  let imagePreview = '';
  let pdfPreview = '';

  // State
  let branches: any[] = [];
  let loading = false;
  let creating = false;
  let message = '';
  let messageType: 'success' | 'error' = 'success';

  onMount(async () => {
    console.log('Create Offer page mounted');
    setDefaultDates();
    await loadBranches();
  });

  function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];
    
    validFrom = today;
    validUntil = nextMonthStr;
  }

  async function loadBranches() {
    try {
      loading = true;
      console.log('Loading branches...');
      
      // Check if the branches table exists
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .limit(50);
      
      if (error) {
        console.error('Error loading branches:', error);
        throw new Error(`Branches table error: ${error.message}`);
      } else {
        console.log('Branches loaded:', data?.length || 0);
        branches = (data || []).map(branch => ({
          id: branch.id,
          name: branch.name || branch.branch_name || branch.title || `Branch ${branch.id}`
        }));
      }
    } catch (error: any) {
      console.error('Error loading branches:', error);
      showMessage(`Failed to load branches: ${error.message}`, 'error');
      // Don't fail the whole page - just continue without branches
      branches = [];
    } finally {
      loading = false;
    }
  }

  function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file (PNG, JPG, JPEG)', 'error');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('Image file size must be less than 5MB', 'error');
        return;
      }
      
      imageFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  function handlePdfUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (file.type !== 'application/pdf') {
        showMessage('Please select a valid PDF file', 'error');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showMessage('PDF file size must be less than 10MB', 'error');
        return;
      }
      
      pdfFile = file;
      pdfPreview = file.name;
    }
  }

  function removeImage() {
    imageFile = null;
    imagePreview = '';
  }

  function removePdf() {
    pdfFile = null;
    pdfPreview = '';
  }

  async function uploadFile(file: File, bucket: string, fileName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: true
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Error uploading ${bucket}:`, error);
      return null;
    }
  }

  async function createOffer() {
    console.log('Create offer called');
    
    // Validation with better visual feedback
    if (!title?.trim()) {
      showMessage('Please enter an offer title', 'error');
      document.getElementById('title')?.focus();
      return;
    }
    
    if (!validUntil) {
      showMessage('Please select a valid until date', 'error');
      document.getElementById('validUntil')?.focus();
      return;
    }

    // Check if valid until is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (validUntil < today) {
      showMessage('Valid until date cannot be in the past', 'error');
      document.getElementById('validUntil')?.focus();
      return;
    }

    try {
      creating = true;
      console.log('Starting offer creation...');
      
      let imageUrl = '';
      let pdfUrl = '';

      // Upload image if selected
      if (imageFile) {
        console.log('Uploading image file:', imageFile.name);
        const fileName = `offer-${Date.now()}.${imageFile.name.split('.').pop()}`;
        imageUrl = await uploadFile(imageFile, 'offer-images', fileName) || '';
        console.log('Image uploaded, URL:', imageUrl);
      }

      // Upload PDF if selected
      if (pdfFile) {
        console.log('Uploading PDF file:', pdfFile.name);
        const fileName = `offer-${Date.now()}.pdf`;
        pdfUrl = await uploadFile(pdfFile, 'offer-pdfs', fileName) || '';
        console.log('PDF uploaded, URL:', pdfUrl);
      }

      // Prepare data for database
      const offerData = {
        title: title.trim(),
        description: description?.trim() || null,
        branch_id: selectedBranchId || null,
        discount_percentage: Number(discountPercentage) || 0,
        discount_amount: Number(discountAmount) || 0,
        minimum_purchase: Number(minimumPurchase) || 0,
        valid_from: validFrom || new Date().toISOString().split('T')[0],
        valid_until: validUntil,
        image_url: imageUrl || null,
        pdf_url: pdfUrl || null,
        terms_conditions: termsConditions?.trim() || null,
        max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
        is_active: Boolean(isActive),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting offer data:', offerData);

      // Create offer in database
      const { data, error } = await supabase
        .from('offers')
        .insert(offerData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Offer created successfully:', data);
      showMessage('Offer created successfully! 🎉', 'success');
      
      // Redirect to offers management after success
      setTimeout(() => {
        goto('/admin/offers-management');
      }, 1500);

    } catch (error) {
      console.error('Error creating offer:', error);
      showMessage(`Failed to create offer: ${error.message}`, 'error');
    } finally {
      creating = false;
    }
  }

  function showMessage(text: string, type: 'success' | 'error') {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 5000);
  }
</script>

<svelte:head>
  <title>Create New Offer - Admin Panel</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-4 mb-4">
        <button
          on:click={() => goto('/admin/offers-management')}
          class="text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to Offers
        </button>
      </div>
      <h1 class="text-3xl font-bold text-gray-900">Create New Offer</h1>
      <p class="text-gray-600 mt-2">Create a new promotional offer for your customers</p>
    </div>

    {#if loading}
      <div class="bg-white rounded-xl shadow-sm p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-4">Loading branches...</p>
      </div>
    {:else}
      <form on:submit|preventDefault={createOffer} class="space-y-6">
        <!-- Basic Information Section -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span class="text-blue-600 mr-2">📝</span>
            Basic Information
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                Offer Title *
              </label>
              <input
                type="text"
                id="title"
                bind:value={title}
                required
                placeholder="e.g., Summer Sale - 25% Off"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label for="branch" class="block text-sm font-medium text-gray-700 mb-2">
                Target Branch
              </label>
              <select
                id="branch"
                bind:value={selectedBranchId}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Branches</option>
                {#each branches as branch}
                  <option value={branch.id}>{branch.name}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="mt-6">
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              bind:value={description}
              rows="3"
              placeholder="Describe the offer details..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            ></textarea>
          </div>
        </div>

        <!-- Discount Settings Section -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span class="text-green-600 mr-2">💰</span>
            Discount Settings
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label for="discountPercentage" class="block text-sm font-medium text-gray-700 mb-2">
                Discount Percentage
              </label>
              <div class="relative">
                <input
                  type="number"
                  id="discountPercentage"
                  bind:value={discountPercentage}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="25"
                  class="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span class="absolute right-3 top-3 text-gray-500">%</span>
              </div>
            </div>

            <div>
              <label for="discountAmount" class="block text-sm font-medium text-gray-700 mb-2">
                Fixed Discount Amount
              </label>
              <div class="relative">
                <input
                  type="number"
                  id="discountAmount"
                  bind:value={discountAmount}
                  min="0"
                  step="0.01"
                  placeholder="50"
                  class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span class="absolute right-3 top-3 text-gray-500">SAR</span>
              </div>
            </div>

            <div>
              <label for="minimumPurchase" class="block text-sm font-medium text-gray-700 mb-2">
                Minimum Purchase
              </label>
              <div class="relative">
                <input
                  type="number"
                  id="minimumPurchase"
                  bind:value={minimumPurchase}
                  min="0"
                  step="0.01"
                  placeholder="100"
                  class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span class="absolute right-3 top-3 text-gray-500">SAR</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Validity Period Section -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span class="text-purple-600 mr-2">📅</span>
            Validity Period
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="validFrom" class="block text-sm font-medium text-gray-700 mb-2">
                Valid From
              </label>
              <input
                type="date"
                id="validFrom"
                bind:value={validFrom}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label for="validUntil" class="block text-sm font-medium text-gray-700 mb-2">
                Valid Until *
              </label>
              <input
                type="date"
                id="validUntil"
                bind:value={validUntil}
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <!-- File Uploads Section -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span class="text-orange-600 mr-2">📎</span>
            Visual Content
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Image Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Offer Image (PNG, JPG - Max 5MB)
              </label>
              
              {#if imagePreview}
                <div class="relative mb-3">
                  <img src={imagePreview} alt="Offer preview" class="w-full h-48 object-cover rounded-lg border" />
                  <button
                    type="button"
                    on:click={removeImage}
                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              {:else}
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <div class="text-gray-400 mb-2 text-4xl">📷</div>
                  <p class="text-sm text-gray-600 mb-4">Upload an image for your offer</p>
                </div>
              {/if}

              <input
                type="file"
                accept="image/*"
                on:change={handleImageUpload}
                class="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <!-- PDF Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Offer Details PDF (Max 10MB)
              </label>
              
              {#if pdfPreview}
                <div class="border rounded-lg p-4 bg-gray-50 mb-3">
                  <div class="flex items-center space-x-3">
                    <span class="text-red-600 text-2xl">📄</span>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900">{pdfPreview}</p>
                      <p class="text-xs text-gray-500">PDF Document</p>
                    </div>
                    <button
                      type="button"
                      on:click={removePdf}
                      class="text-red-500 hover:text-red-700 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              {:else}
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <div class="text-gray-400 mb-2 text-4xl">📄</div>
                  <p class="text-sm text-gray-600 mb-4">Upload a PDF with offer details</p>
                </div>
              {/if}

              <input
                type="file"
                accept=".pdf"
                on:change={handlePdfUpload}
                class="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-between pt-6">
          <button
            type="button"
            on:click={() => goto('/admin/offers-management')}
            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={creating}
            class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
          >
            {#if creating}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Offer...</span>
            {:else}
              <span>Create Offer</span>
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>

  <!-- Success/Error Messages -->
  {#if message}
    <div class="fixed top-4 right-4 z-50 max-w-sm">
      <div class="rounded-lg p-4 shadow-lg {messageType === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white">
        {message}
      </div>
    </div>
  {/if}
</div>
