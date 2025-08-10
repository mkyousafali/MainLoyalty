<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  // Get offer ID from URL params
  $: offerId = $page.params.id;

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
  let currentImageUrl = '';
  let currentPdfUrl = '';

  // State
  let branches: Array<{branch_id: string, branch_name: string}> = [];
  let loading = false;
  let saving = false;
  let message = '';
  let messageType: 'success' | 'error' = 'success';

  onMount(async () => {
    if (offerId) {
      await Promise.all([loadBranches(), loadOfferData()]);
    } else {
      goto('/admin/offers-management');
    }
  });

  async function loadBranches() {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      
      if (error) throw error;
      
      branches = (data || []).map(branch => {
        const branchName = branch.branch_name || branch.name || branch.title || `Branch ${branch.id?.slice(0,8)}`;
        return {
          branch_id: branch.id,
          branch_name: branchName
        };
      });
    } catch (error) {
      console.error('Error loading branches:', error);
      showMessage('Failed to load branches', 'error');
    }
  }

  async function loadOfferData() {
    try {
      loading = true;
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (error) throw error;

      if (data) {
        // Populate form with existing data
        title = data.title || '';
        description = data.description || '';
        selectedBranchId = data.branch_id || '';
        discountPercentage = data.discount_percentage || 0;
        discountAmount = data.discount_amount || 0;
        minimumPurchase = data.minimum_purchase || 0;
        validFrom = data.valid_from || '';
        validUntil = data.valid_until || '';
        termsConditions = data.terms_conditions || '';
        maxRedemptions = data.max_redemptions || 0;
        isActive = data.is_active ?? true;
        currentImageUrl = data.image_url || '';
        currentPdfUrl = data.pdf_url || '';
        
        // Set previews for existing files
        if (currentImageUrl) imagePreview = currentImageUrl;
        if (currentPdfUrl) pdfPreview = currentPdfUrl;
      }
    } catch (error) {
      console.error('Error loading offer:', error);
      showMessage('Failed to load offer data', 'error');
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
    currentImageUrl = '';
  }

  function removePdf() {
    pdfFile = null;
    pdfPreview = '';
    currentPdfUrl = '';
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

  async function updateOffer() {
    if (!title || !validUntil) {
      showMessage('Title and Valid Until date are required', 'error');
      return;
    }

    try {
      saving = true;
      let imageUrl = currentImageUrl;
      let pdfUrl = currentPdfUrl;

      // Upload new image if selected
      if (imageFile) {
        const fileName = `offer-${offerId}-${Date.now()}.${imageFile.name.split('.').pop()}`;
        imageUrl = await uploadFile(imageFile, 'offer-images', fileName);
      }

      // Upload new PDF if selected
      if (pdfFile) {
        const fileName = `offer-${offerId}-${Date.now()}.pdf`;
        pdfUrl = await uploadFile(pdfFile, 'offer-pdfs', fileName);
      }

      // Update offer in database
      const { error } = await supabase
        .from('offers')
        .update({
          title,
          description,
          branch_id: selectedBranchId || null,
          discount_percentage: discountPercentage,
          discount_amount: discountAmount,
          minimum_purchase: minimumPurchase,
          valid_from: validFrom,
          valid_until: validUntil,
          image_url: imageUrl,
          pdf_url: pdfUrl,
          terms_conditions: termsConditions,
          max_redemptions: maxRedemptions || null,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId);

      if (error) throw error;

      showMessage('Offer updated successfully!', 'success');
      
      // Redirect back to offers management after a short delay
      setTimeout(() => {
        goto('/admin/offers-management');
      }, 1500);

    } catch (error) {
      console.error('Error updating offer:', error);
      showMessage('Failed to update offer. Please try again.', 'error');
    } finally {
      saving = false;
    }
  }

  function showMessage(text: string, type: 'success' | 'error') {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 5000);
  }

  function setDefaultDate() {
    if (!validFrom) {
      validFrom = new Date().toISOString().split('T')[0];
    }
    if (!validUntil) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      validUntil = nextMonth.toISOString().split('T')[0];
    }
  }

  onMount(() => {
    setDefaultDate();
  });
</script>

<svelte:head>
  <title>Edit Offer - Admin Panel</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-4">
        <button 
          on:click={() => goto('/admin/offers-management')}
          class="text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Offers Management
        </button>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mt-4">Edit Offer</h1>
      <p class="text-gray-600 mt-2">Update the offer details and settings</p>
    </div>

    {#if loading}
      <div class="bg-white rounded-xl shadow-sm p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-4">Loading offer data...</p>
      </div>
    {:else}
      <!-- Form -->
      <form on:submit|preventDefault={updateOffer} class="space-y-8">
        <!-- Basic Information -->
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
                  <option value={branch.branch_id}>{branch.branch_name}</option>
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

        <!-- Discount Settings -->
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

        <!-- Validity Period -->
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

        <!-- File Uploads -->
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
                <div class="relative">
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
                  <div class="text-gray-400 mb-2">📷</div>
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
                <div class="border rounded-lg p-4 bg-gray-50">
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
                  <div class="text-gray-400 mb-2">📄</div>
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

        <!-- Additional Settings -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span class="text-gray-600 mr-2">⚙️</span>
            Additional Settings
          </h2>

          <div class="space-y-6">
            <div>
              <label for="maxRedemptions" class="block text-sm font-medium text-gray-700 mb-2">
                Maximum Redemptions (Optional)
              </label>
              <input
                type="number"
                id="maxRedemptions"
                bind:value={maxRedemptions}
                min="0"
                placeholder="Leave empty for unlimited"
                class="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label for="termsConditions" class="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                id="termsConditions"
                bind:value={termsConditions}
                rows="4"
                placeholder="Enter terms and conditions for this offer..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>

            <div class="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                bind:checked={isActive}
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label for="isActive" class="ml-2 text-sm font-medium text-gray-700">
                Offer is active and visible to customers
              </label>
            </div>
          </div>
        </div>

        <!-- Actions -->
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
            disabled={saving}
            class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
          >
            {#if saving}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Updating...</span>
            {:else}
              <span>Update Offer</span>
            {/if}
          </button>
        </div>
      </form>
    {/if}

    <!-- Success/Error Messages -->
    {#if message}
      <div class="fixed top-4 right-4 z-50 max-w-sm">
        <div class="rounded-lg p-4 shadow-lg {messageType === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white">
          {message}
        </div>
      </div>
    {/if}
  </div>
</div>
