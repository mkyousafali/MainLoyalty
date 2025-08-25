<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { language, t } from '$lib/stores/language.js';
  import { appSettings } from '$lib/stores/appSettings';
  import { goto } from '$app/navigation';
  
  interface Offer {
    offer_id: number;
    title: string;
    description: string;
    branch_id: number | null;
    branch_name?: string;
    discount_percentage: number | null;
    valid_until: string;
    image_url: string;
    pdf_url: string | null;
    is_active: boolean;
    created_at: string;
  }
  
  let offers: Offer[] = [];
  let allBranches: {branch_id: number, branch_name: string}[] = [];
  let loading = true;
  let error = '';

  let searchTerm = '';
  let selectedBranch = 'all';

  onMount(async () => {
    // Check if My Offers page is enabled
    if (!$appSettings.myOffersEnabled) {
      console.log('My Offers page is disabled by admin');
      goto('/dashboard');
      return;
    }
    
    await Promise.all([loadOffers(), loadBranches()]);
  });

  async function loadBranches() {
    try {
      console.log('Loading branches from database...');
      
      // First try to get all columns to see what's available
      const { data: sampleData, error: sampleError } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      if (sampleError) {
        console.error('Error getting branches sample:', sampleError);
        throw sampleError;
      }
      
      console.log('Available branches columns:', sampleData?.[0] ? Object.keys(sampleData[0]) : 'No data');
      
      // Now get all branches with flexible column selection
      const { data, error: fetchError } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (fetchError) {
        console.error('Supabase error loading branches:', fetchError);
        throw fetchError;
      }
      
      // Map to the expected format, handling different possible column names
      const mappedData = (data || []).map(branch => {
        const branchName = branch.branch_name || branch.name || branch.title || `Branch ${branch.id?.slice(0,8)}`;
        return {
          branch_id: branch.id,
          branch_name: branchName
        };
      });
      
      console.log('Branches loaded successfully:', mappedData);
      allBranches = mappedData;
    } catch (err) {
      console.error('Error loading branches:', err);
      console.error('Error details:', err);
    }
  }

  async function loadOffers() {
    try {
      loading = true;
      error = '';
      
      // Use the correct column names matching your table structure
      // REMOVED the expired filter to show all offers including expired ones
      const { data, error: fetchError } = await supabase
        .from('offers')
        .select(`
          id,
          title,
          description,
          branch_id,
          discount_percentage,
          valid_until,
          image_url,
          pdf_url,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error loading offers:', fetchError);
        throw fetchError;
      }
      
      // Map the data to include branch names
      const offersWithBranches = await Promise.all(
        (data || []).map(async (offer) => {
          let branch_name = 'All Branches';
          
          if (offer.branch_id) {
            const { data: branchData } = await supabase
              .from('branches')
              .select('*')
              .eq('id', offer.branch_id)
              .single();
            
            if (branchData) {
              branch_name = branchData.branch_name || branchData.name || branchData.title || 'Unknown Branch';
            }
          }
          
          return {
            ...offer,
            offer_id: offer.id, // Map id to offer_id for consistency
            branch_name
          };
        })
      );
      
      offers = offersWithBranches;
      console.log('Loaded offers:', offers);
      
      // Debug: Log image and PDF URLs for each offer
      offers.forEach((offer, index) => {
        console.log(`Offer ${index + 1} (${offer.title}):`);
        console.log('  - Image URL:', offer.image_url);
        console.log('  - PDF URL:', offer.pdf_url);
        if (offer.image_url) {
          console.log('  - Processed Image URL:', getImageUrl(offer.image_url));
        }
      });

    } catch (err) {
      console.error('Error loading offers:', err);
      error = 'Failed to load offers. Please try again.';
    } finally {
      loading = false;
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  function getDaysUntilExpiry(validUntil: string) {
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  function isExpired(validUntil: string) {
    const today = new Date();
    const expiryDate = new Date(validUntil);
    return expiryDate < today;
  }

  function getUrgencyClass(daysLeft: number) {
    if (daysLeft <= 0) return 'expired';
    if (daysLeft <= 3) return 'urgent';
    if (daysLeft <= 7) return 'warning';
    return 'normal';
  }

  function downloadPdf(pdfUrl: string, title: string) {
    if (!pdfUrl) return;
    
    console.log('Attempting to download PDF:', pdfUrl);
    
    try {
      let finalUrl = pdfUrl;
      
      // Check if the PDF URL contains raw PDF data
      if (pdfUrl.startsWith('%PDF')) {
        console.log('Detected raw PDF data, converting to blob...');
        try {
          // Find the end of the PDF
          const endIndex = pdfUrl.indexOf('%%EOF');
          if (endIndex === -1) {
            throw new Error('Invalid PDF data - no %%EOF found');
          }
          
          const pdfData = pdfUrl.substring(0, endIndex + 5);
          console.log('PDF data length:', pdfData.length);
          
          // Convert to blob
          const blob = new Blob([pdfData], { type: 'application/pdf' });
          finalUrl = URL.createObjectURL(blob);
          console.log('Created blob URL:', finalUrl);
        } catch (blobError) {
          console.error('Error creating blob from PDF data:', blobError);
          alert($language === 'ar' ? 'خطأ في معالجة بيانات PDF' : 'Error processing PDF data');
          return;
        }
      }
      // For complete URLs (which they are), use directly with cache busting
      else if (pdfUrl.startsWith('http')) {
        console.log('Using direct PDF URL:', pdfUrl);
        const separator = pdfUrl.includes('?') ? '&' : '?';
        finalUrl = `${pdfUrl}${separator}_download=${Date.now()}`;
      }
      
      // Create a proper download link
      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_offer.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Download initiated successfully');
      
      // Clean up blob URL if we created one
      if (finalUrl.startsWith('blob:')) {
        setTimeout(() => {
          URL.revokeObjectURL(finalUrl);
          console.log('Blob URL cleaned up');
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      alert($language === 'ar' ? 'خطأ في تحميل PDF. يرجى المحاولة مرة أخرى.' : 'Error downloading PDF. Please try again.');
    }
  }

  // Helper function to get proper image URL
  // Enhanced function to get image URL using Supabase client methods
  function getImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      console.log('No image URL provided');
      return '';
    }
    
    console.log('Processing image URL:', imageUrl);
    
    // If it's a Supabase storage URL, extract the path and use Supabase client
    if (imageUrl.includes('supabase.co/storage/v1/object/public/')) {
      try {
        // Extract the bucket and file path from the URL
        const urlParts = imageUrl.split('/storage/v1/object/public/');
        if (urlParts.length === 2) {
          const pathParts = urlParts[1].split('/');
          const bucketName = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          
          console.log('Extracting Supabase storage info:', { bucketName, filePath });
          
          // Use Supabase client to get the public URL (this should handle CORS properly)
          const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
          console.log('Using Supabase client URL:', data.publicUrl);
          
          // Add cache busting to ensure fresh load
          const separator = data.publicUrl.includes('?') ? '&' : '?';
          return `${data.publicUrl}${separator}_t=${Date.now()}`;
        }
      } catch (error) {
        console.error('Error processing Supabase URL:', error);
        // Fall back to direct URL
      }
    }
    
    // For other URLs or fallback, return as is with cache busting
    if (imageUrl.startsWith('http')) {
      console.log('Using direct URL:', imageUrl);
      const separator = imageUrl.includes('?') ? '&' : '?';
      return `${imageUrl}${separator}_t=${Date.now()}`;
    }
    
    return imageUrl;
  }

  // Keep the blob loading function as fallback (though we might not need it now)
  async function loadImageAsBlob(imageUrl: string): Promise<string | null> {
    try {
      console.log('🔄 Loading image as blob:', imageUrl);
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        console.error('❌ Failed to fetch image:', response.status, response.statusText);
        return null;
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      console.log('✅ Image blob created successfully:', blobUrl);
      return blobUrl;
    } catch (error) {
      console.error('❌ Error loading image as blob:', error);
      return null;
    }
  }

  // Get unique branches for filter - use allBranches from database
  $: branches = allBranches.map(b => b.branch_name);

  // Filter offers
  $: filteredOffers = offers.filter(offer => {
    const matchesSearch = !searchTerm || 
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.branch_name && offer.branch_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBranch = selectedBranch === 'all' || 
      (selectedBranch === 'all_branches' && !offer.branch_id) ||
      offer.branch_name === selectedBranch;
    
    return matchesSearch && matchesBranch;
  });
</script>

<svelte:head>
  <title>{$t.storeOffers} - Store Deals</title>
</svelte:head>

{#if !$appSettings.myOffersEnabled}
  <!-- Page Disabled Message -->
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
    <div class="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
      <div class="text-6xl mb-4">🚫</div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Page Temporarily Unavailable</h2>
      <p class="text-gray-600 mb-6">The My Offers page is currently disabled. Please check back later.</p>
      <button 
        on:click={() => goto('/dashboard')}
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Return to Dashboard
      </button>
    </div>
  </div>
{:else}
<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" class:rtl={$language === 'ar'}>
  <!-- Header -->
  <header class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 p-2 shadow-lg">
          <span class="text-4xl">🎯</span>
        </div>
        <h1 class="text-5xl font-bold mb-4 tracking-tight">{$t.storeOffers}</h1>
        <p class="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
          {$t.discoverDeals}
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="max-w-4xl mx-auto mt-8">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="relative flex-1">
            <input
              type="text"
              bind:value={searchTerm}
              placeholder={$t.searchOffers}
              class="w-full px-6 py-4 text-lg rounded-2xl bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/25 transition-all"
            />
            <svg class="absolute {$language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>

          <!-- Branch Filter -->
          <select
            bind:value={selectedBranch}
            class="px-6 py-4 text-lg rounded-2xl bg-white/20 backdrop-blur-sm text-white border border-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/25 transition-all"
          >
            <option value="all" class="text-gray-800">{$t.allOffers}</option>
            <option value="all_branches" class="text-gray-800">🌐 {$t.allBranches}</option>
            {#each branches as branch}
              <option value={branch} class="text-gray-800">🏪 {branch}</option>
            {/each}
          </select>
        </div>

        <!-- Stats -->
        <div class="flex justify-center items-center gap-8 mt-6 text-center">
          <div class="text-white/90">
            <div class="text-3xl font-bold">{filteredOffers.length}</div>
            <div class="text-sm">{$t.availableOffers}</div>
          </div>
          <div class="w-px h-8 bg-white/30"></div>
          <div class="text-white/90">
            <div class="text-3xl font-bold">{allBranches.length + 1}</div>
            <div class="text-sm">{$t.locations}</div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
    {#if loading}
      <!-- Loading State -->
      <div class="flex flex-col items-center justify-center py-16">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p class="text-gray-600 text-lg">{$t.loadingOffers}</p>
      </div>

    {:else if error}
      <!-- Error State -->
      <div class="text-center py-16">
        <div class="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">{$t.unableToLoad}</h3>
        <p class="text-gray-600 mb-6">{error}</p>
        <button
          on:click={loadOffers}
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {$t.tryAgain}
        </button>
      </div>

    {:else if filteredOffers.length === 0}
      <!-- Empty State -->
      <div class="text-center py-16">
        <div class="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h3 class="text-2xl font-semibold text-gray-900 mb-2">{$t.noOffersFound}</h3>
        <p class="text-gray-600 mb-6">{$t.adjustFilters}</p>
        <button
          on:click={() => { searchTerm = ''; selectedBranch = 'all'; }}
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {$t.clearFilters}
        </button>
      </div>

    {:else}
      <!-- Offers Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each filteredOffers as offer, index}
          {@const daysLeft = getDaysUntilExpiry(offer.valid_until)}
          {@const urgency = getUrgencyClass(daysLeft)}
          {@const expired = isExpired(offer.valid_until)}
          
          <div 
            class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] relative
            {expired ? 'expired-offer' : ''}"
            style="animation-delay: {index * 100}ms"
          >
            <!-- Expired Overlay -->
            {#if expired}
              <div class="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                <div class="bg-red-600 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg transform rotate-[-15deg] border-4 border-white">
                  ❌ {$t.expired}
                </div>
              </div>
              <!-- Red crossed line -->
              <div class="absolute inset-0 z-10 flex items-center justify-center">
                <div class="w-full h-1 bg-red-600 transform rotate-12 shadow-lg"></div>
              </div>
              <div class="absolute inset-0 z-10 flex items-center justify-center">
                <div class="w-full h-1 bg-red-600 transform -rotate-12 shadow-lg"></div>
              </div>
            {/if}

            <!-- Offer Image -->
            <div class="relative h-64 bg-gradient-to-br from-blue-400 to-purple-600 {expired ? 'blur-sm grayscale' : ''}">
              {#if offer.image_url && getImageUrl(offer.image_url)}
                <img 
                  src={getImageUrl(offer.image_url)} 
                  alt={offer.title}
                  class="w-full h-full object-cover {expired ? 'opacity-50' : ''}"
                  loading="lazy"
                  on:error={async (e) => {
                    console.error('❌ Failed to load image with Supabase client:', offer.image_url, 'Processed URL:', getImageUrl(offer.image_url));
                    
                    // Let's do comprehensive debugging to understand what's happening
                    try {
                      console.log('🔍 Starting comprehensive image debugging...');
                      
                      // Get the processed URL like the img tag would use
                      const processedUrl = getImageUrl(offer.image_url);
                      console.log('🔍 Using processed URL:', processedUrl);
                      
                      // Test 1: Basic fetch
                      const response = await fetch(processedUrl);
                      console.log('🔍 Basic fetch result:', {
                        status: response.status,
                        statusText: response.statusText,
                        contentType: response.headers.get('content-type'),
                        contentLength: response.headers.get('content-length'),
                        url: response.url
                      });
                      
                      // Test 2: If it's JSON/form data (error), let's see what the error is
                      const responseText = await response.text();
                      if (response.headers.get('content-type')?.includes('application/json') || 
                          response.headers.get('content-type')?.includes('multipart/form-data') ||
                          responseText.includes('WebKitFormBoundary')) {
                        console.log('🚨 Form Data Response (not image):', responseText.substring(0, 500));
                        
                        // Extract the original filename from the form data
                        const filenameMatch = responseText.match(/filename="([^"]+)"/);
                        const originalFilename = filenameMatch ? filenameMatch[1] : null;
                        console.log('📝 Extracted original filename:', originalFilename);
                        
                        // The issue is we're getting form upload data instead of the image
                        // Try different URL patterns
                        const urlsToTry = [
                          // Try with the original filename if we found it
                          originalFilename ? `https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/offer-images/${originalFilename}` : null,
                          // Original stored URL as-is
                          offer.image_url.startsWith('http') ? offer.image_url : `https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/offer-images/${offer.image_url}`,
                          // Try without the "offer-" prefix
                          `https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/offer-images/${offer.image_url.replace('offer-', '')}`,
                          // Try different file extensions
                          `https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/public/offer-images/${offer.image_url.replace('.png', '.jpg')}`,
                          // Try the authenticated URL
                          `https://sfydwpimwnxocrgpiour.supabase.co/storage/v1/object/authenticated/offer-images/${offer.image_url}`
                        ].filter(Boolean); // Remove null values
                        
                        for (let i = 0; i < urlsToTry.length; i++) {
                          const testUrl = urlsToTry[i];
                          console.log(`🔄 Trying URL ${i + 1}:`, testUrl);
                          
                          try {
                            const testResponse = await fetch(testUrl);
                            console.log(`🔄 URL ${i + 1} result:`, {
                              status: testResponse.status,
                              contentType: testResponse.headers.get('content-type')
                            });
                            
                            if (testResponse.ok && testResponse.headers.get('content-type')?.includes('image')) {
                              console.log(`✅ Success with URL ${i + 1}! Using it...`);
                              e.target.src = testUrl;
                              return;
                            }
                          } catch (testError) {
                            console.log(`❌ URL ${i + 1} failed:`, testError.message);
                          }
                        }
                        
                      } else if (response.ok) {
                        // It might be an image, let's try to use the response text as blob
                        console.log('🔍 Response looks like image data, trying as blob...');
                        const newResponse = await fetch(processedUrl); // Get fresh response for blob
                        const blob = await newResponse.blob();
                        console.log('🔍 Blob info:', {
                          size: blob.size,
                          type: blob.type
                        });
                        
                        // Try loading as blob URL
                        const blobUrl = URL.createObjectURL(blob);
                        console.log('🔄 Attempting to load as blob URL:', blobUrl);
                        e.target.src = blobUrl;
                        return;
                      } else {
                        console.error('❌ Fetch failed with status:', response.status);
                      }
                    } catch (fetchError) {
                      console.error('❌ Fetch error:', fetchError);
                    }
                    
                    // Only hide if everything fails
                    e.target.style.display = 'none';
                    e.target.nextElementSibling?.style.removeProperty('display');
                  }}
                  on:load={() => {
                    console.log('✅ Image loaded successfully with Supabase client:', getImageUrl(offer.image_url));
                  }}
                />
                <!-- Fallback for broken images (initially hidden) -->
                <div class="w-full h-full flex items-center justify-center {expired ? 'opacity-50' : ''}" style="display: none;">
                  <div class="text-center text-white">
                    <span class="text-6xl mb-2 block">📷</span>
                    <p class="text-sm opacity-90">Image Not Available</p>
                    <!-- Debug info -->
                    <p class="text-xs opacity-70 mt-2 break-all">Original: {offer.image_url?.substring(0, 50)}...</p>
                  </div>
                </div>
              {:else}
                <!-- Fallback gradient -->
                <div class="w-full h-full flex items-center justify-center {expired ? 'opacity-50' : ''}">
                  <div class="text-center text-white">
                    <span class="text-6xl mb-2 block">🎯</span>
                    <p class="text-sm opacity-90">Exclusive Offer</p>
                    {#if !offer.image_url}
                      <p class="text-xs opacity-70 mt-2">No image URL provided</p>
                    {/if}
                  </div>
                </div>
              {/if}
              
              <!-- Urgency Badge -->
              <div class="absolute top-4 {$language === 'ar' ? 'left-4' : 'right-4'}">
                {#if expired}
                  <span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white border-2 border-white shadow-lg">
                    {$t.expired}
                  </span>
                {:else}
                  <span class="px-3 py-1 rounded-full text-xs font-semibold
                    {urgency === 'urgent' ? 'bg-red-500 text-white' : 
                     urgency === 'warning' ? 'bg-yellow-500 text-white' : 
                     'bg-green-500 text-white'}
                  ">
                    {daysLeft} {$t.daysLeft}
                  </span>
                {/if}
              </div>

              <!-- Branch Badge -->
              {#if offer.branch_name}
                <div class="absolute top-4 {$language === 'ar' ? 'right-4' : 'left-4'}">
                  <span class="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
                    🏪 {offer.branch_name}
                  </span>
                </div>
              {:else}
                <div class="absolute top-4 {$language === 'ar' ? 'right-4' : 'left-4'}">
                  <span class="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
                    🌐 {$t.allBranches}
                  </span>
                </div>
              {/if}
            </div>

            <!-- Offer Content -->
            <div class="p-6 {expired ? 'opacity-60' : ''}">
              <!-- Title and Description -->
              <div class="mb-4">
                <h3 class="text-xl font-bold text-gray-900 mb-2 {expired ? 'line-through text-gray-500' : ''}">{offer.title}</h3>
                <p class="text-gray-600 text-sm leading-relaxed line-clamp-3 {expired ? 'text-gray-400' : ''}">{offer.description}</p>
              </div>

              <!-- Discount Badge -->
              {#if offer.discount_percentage}
                <div class="mb-4">
                  <div class="inline-flex items-center px-4 py-2 {expired ? 'bg-gray-400 text-gray-600' : 'bg-gradient-to-r from-green-500 to-green-600 text-white'} rounded-full font-bold">
                    <span class="text-2xl {$language === 'ar' ? 'ml-2' : 'mr-2'}">{expired ? '❌' : '💰'}</span>
                    {offer.discount_percentage}% {expired ? $t.wasOff : 'OFF'}
                  </div>
                </div>
              {/if}

              <!-- Validity Info -->
              <div class="mb-6 p-3 {expired ? 'bg-red-50 border border-red-200' : 'bg-gray-50'} rounded-lg">
                <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-500">{expired ? $t.expiredOn : $t.validUntil}:</span>
                  <span class="font-medium {expired ? 'text-red-600' : 'text-gray-900'}">{formatDate(offer.valid_until)}</span>
                </div>
                {#if expired}
                  <div class="mt-2 text-xs text-red-600 font-medium">
                    {$t.thisOfferExpired}
                  </div>
                {/if}
              </div>

              <!-- Action Buttons -->
              <div class="space-y-3">
                {#if expired}
                  <!-- Expired state buttons -->
                  <div class="w-full bg-gray-200 text-gray-500 py-3 px-6 rounded-lg text-center font-medium cursor-not-allowed">
                    ❌ {$t.offerExpired}
                  </div>
                  <div class="w-full bg-gray-100 text-gray-400 py-3 px-6 rounded-lg text-center font-medium cursor-not-allowed">
                    📄 {$t.noLongerAvailable}
                  </div>
                {:else}
                  <!-- Active offer buttons -->
                  {#if offer.pdf_url}
                    <button
                      on:click={() => downloadPdf(offer.pdf_url, offer.title)}
                      class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      {$t.downloadFullOfferDetails}
                    </button>
                    
                    <!-- Debug info (remove in production) -->
                    {#if offer.pdf_url && offer.pdf_url.startsWith('%PDF')}
                      <div class="text-xs text-red-500 p-2 bg-red-50 rounded">
                        ⚠️ PDF contains raw data instead of file URL. Please contact admin to fix this offer.
                      </div>
                    {/if}
                  {:else}
                    <div class="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg text-center font-medium">
                      📄 {$t.noAdditionalDetails}
                    </div>
                  {/if}
                  
                  <!-- Share Button -->
                  <button
                    on:click={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: offer.title,
                          text: offer.description,
                          url: window.location.href
                        });
                      } else {
                        navigator.clipboard.writeText(`${offer.title} - ${window.location.href}`);
                        alert($t.offerLinkCopied);
                      }
                    }}
                    class="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                    </svg>
                    {$t.shareOffer}
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>

  <!-- Instructions Footer -->
  <footer class="bg-gray-50 border-t mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        <div class="space-y-3">
          <div class="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">{$t.visualOffers}</h3>
          <p class="text-sm text-gray-600">{$t.visualOffersDesc}</p>
        </div>
        
        <div class="space-y-3">
          <div class="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">{$t.pdfDownloads}</h3>
          <p class="text-sm text-gray-600">{$t.pdfDownloadsDesc}</p>
        </div>
        
        <div class="space-y-3">
          <div class="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">{$t.branchSpecific}</h3>
          <p class="text-sm text-gray-600">{$t.branchSpecificDesc}</p>
        </div>
      </div>
    </div>
  </footer>
</div>
{/if}

<style>
  /* Animation for cards */
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* RTL Support */
  .rtl {
    direction: rtl;
  }

  .rtl input,
  .rtl select {
    text-align: right;
  }

  /* Expired offer styling */
  .expired-offer {
    border: 2px solid #dc2626 !important;
    box-shadow: 0 0 20px rgba(220, 38, 38, 0.3) !important;
  }

  .expired-offer:hover {
    transform: scale(1) !important; /* Disable hover scale for expired offers */
    cursor: not-allowed;
  }

  /* Line clamp utility for text truncation */
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Smooth animations */
  * {
    transition: all 0.2s ease;
  }

  /* Backdrop blur support */
  input[type="text"]::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  select option {
    background: #1f2937;
    color: white;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
  }

  /* Focus styles for accessibility */
  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
