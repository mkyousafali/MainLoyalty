<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { language, t } from '$lib/stores/language.js';
  
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
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_offer.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              {#if offer.image_url}
                <img 
                  src={offer.image_url} 
                  alt={offer.title}
                  class="w-full h-full object-cover {expired ? 'opacity-50' : ''}"
                  loading="lazy"
                />
              {:else}
                <!-- Fallback gradient -->
                <div class="w-full h-full flex items-center justify-center {expired ? 'opacity-50' : ''}">
                  <div class="text-center text-white">
                    <span class="text-6xl mb-2 block">🎯</span>
                    <p class="text-sm opacity-90">Exclusive Offer</p>
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
