<script>
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { language } from '$lib/stores/language';

  let offers = [];
  let filteredOffers = [];
  let loading = true;
  let searchQuery = '';
  let activeFilter = 'all';
  let selectedBranch = '';
  let branches = [];
  let showPdfViewer = false;
  let selectedPdfUrl = '';
  let selectedOffer = null;

  const { t } = language;

  const filters = [
    { id: 'all', label: 'All', labelAr: 'الكل' },
    { id: 'active', label: 'Active', labelAr: 'نشط' },
    { id: 'expiring', label: 'Expiring Soon', labelAr: 'ينتهي قريباً' },
    { id: 'branch', label: 'Branch', labelAr: 'الفرع' }
  ];

  onMount(() => {
    loadOffers();
    loadBranches();
    startFireworks();
  });

  onDestroy(() => {
    stopFireworks();
  });

  async function loadOffers() {
    try {
      loading = true;
      const { data, error } = await supabase
        .from('offer_advertisements')
        .select(`
          *,
          branches(id, name_en, name_ar)
        `)
        .eq('status', 'active')
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;

      offers = data || [];
      filterOffers();
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      loading = false;
    }
  }

  async function loadBranches() {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name_en, name_ar')
        .order('name_en');

      if (error) throw error;
      branches = data || [];
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  }

  function filterOffers() {
    let filtered = [...offers];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(offer =>
        offer.offer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.branches?.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.branches?.name_ar?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'active': {
        const now = new Date();
        filtered = filtered.filter(offer => new Date(offer.expiry_date) > now);
        break;
      }
      case 'expiring': {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        filtered = filtered.filter(offer => {
          const expiryDate = new Date(offer.expiry_date);
          return expiryDate <= threeDaysFromNow && expiryDate > new Date();
        });
        break;
      }
      case 'branch': {
        if (selectedBranch) {
          filtered = filtered.filter(offer => offer.branch_id === selectedBranch);
        }
        break;
      }
    }

    filteredOffers = filtered;
  }

  function handleFilterChange(filterId) {
    activeFilter = filterId;
    if (filterId !== 'branch') {
      selectedBranch = '';
    }
    filterOffers();
  }

  function handleBranchChange() {
    filterOffers();
  }

  function shareOffer(offer) {
    if (navigator.share) {
      navigator.share({
        title: offer.offer_name,
        text: `${$language === 'ar' ? 'تحقق من هذا العرض' : 'Check out this offer'}: ${offer.offer_name}`,
        url: `${window.location.origin}/offers/${offer.id}`
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      const shareUrl = `${window.location.origin}/offers/${offer.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast($language === 'ar' ? 'تم نسخ رابط العرض' : 'Offer link copied to clipboard', 'success');
      }).catch(() => {
        showToast($language === 'ar' ? 'فشل في نسخ الرابط' : 'Failed to copy link', 'error');
      });
    }
  }

  function viewOffer(offer) {
    selectedOffer = offer;
    selectedPdfUrl = offer.pdf_url;
    showPdfViewer = true;
  }

  function closePdfViewer() {
    showPdfViewer = false;
    selectedPdfUrl = '';
    selectedOffer = null;
  }

  function getDaysUntilExpiry(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  function shareAllOffers() {
    const shareText = $language === 'ar'
      ? `تحقق من العروض الحصرية في أيربن ماركت! ${filteredOffers.length} عرض متاح الآن.`
      : `Check out exclusive offers at Urban Market! ${filteredOffers.length} offers available now.`;

    if (navigator.share) {
      navigator.share({
        title: $language === 'ar' ? 'عروض أيربن ماركت' : 'Urban Market Offers',
        text: shareText,
        url: `${window.location.origin}/my-offers`
      });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.origin}/my-offers`);
      showToast($language === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard', 'success');
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-[60] px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-300 transform translate-x-0 ${
      type === 'success' ? 'bg-[#1DB954] text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-black border border-[#39FF14] text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // --- Fireworks (lightweight, UI-only) ---
  let fwTimer = null;
  function startFireworks() {
    const root = document.getElementById('fw-root');
    if (!root) return;

    // Create bursts periodically
    fwTimer = setInterval(() => {
      for (let i = 0; i < 3; i++) spawnFirework(root);
    }, 2000);

    // First burst immediately
    for (let i = 0; i < 5; i++) spawnFirework(root);
  }

  function stopFireworks() {
    if (fwTimer) clearInterval(fwTimer);
  }

  function spawnFirework(root) {
    const fw = document.createElement('div');
    fw.className = 'fw-burst';
    const x = Math.random() * 100;
    const y = Math.random() * 40 + 5; // upper area
    fw.style.left = x + '%';
    fw.style.top = y + '%';
    root.appendChild(fw);

    // auto-remove after animation
    setTimeout(() => {
      if (fw && fw.parentNode) fw.parentNode.removeChild(fw);
    }, 1800);
  }

  // Reactive: keep filters up to date
  $: {
    searchQuery;
    filterOffers();
  }
</script>

<svelte:head>
  <title>{$language === 'ar' ? 'عروضي - أيربن ماركت' : 'My Offers - Urban Market'}</title>
</svelte:head>

<!-- Decorative moving ribbons background -->
<div class="fixed inset-0 -z-10 overflow-hidden">
  <div class="absolute -top-24 -left-24 w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-white via-[#FFEDD5] to-[#FFF7ED] animate-slowfloat"></div>
  <div class="absolute -bottom-32 -right-24 w-[42rem] h-[42rem] rounded-full bg-gradient-to-br from-[#ECFFED] via-white to-[#DBFFDF] animate-slowfloat2"></div>
</div>

<div class="min-h-screen" dir={$language === 'ar' ? 'rtl' : 'ltr'}>
  <!-- Top Bar -->
  <div class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <img
            src="/logo.png"
            alt="Urban Market"
            class="h-9 w-9 mr-3 rounded shadow-[0_0_0_2px_#FF6A00] hover:shadow-[0_0_0_3px_#39FF14] transition-all duration-300"
          >
          <h1 class="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#FF6A00] via-[#FF8A00] to-[#39FF14]">
            {$language === 'ar' ? 'عروضي' : 'My Offers'}
          </h1>
        </div>

        <!-- Right Section -->
        <div class="flex items-center gap-3">
          <!-- Share All Button (only when > 1) -->
          {#if filteredOffers.length > 1}
            <button
              on:click={shareAllOffers}
              class="px-4 py-2 rounded-xl text-white font-medium bg-gradient-to-r from-[#FF6A00] to-[#39FF14] shadow-md hover:shadow-[0_0_20px_rgba(57,255,20,0.35)] transition-all duration-300 hover:-translate-y-0.5"
            >
              {$language === 'ar' ? 'مشاركة الكل' : 'Share All'}
            </button>
          {/if}
        </div>
      </div>

      <!-- Neon divider -->
      <div class="h-[3px] bg-gradient-to-r from-[#FF6A00] via-[#FF8A00] to-[#39FF14] animate-sheen"></div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
    <!-- Fireworks root (non-interactive) -->
    <div id="fw-root" class="pointer-events-none absolute inset-0"></div>

    <!-- Search & Filters -->
    <div class="mb-8 space-y-4">
      <!-- Search Bar -->
      <div class="relative">
        <div class="absolute inset-y-0 {$language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none">
          <div class="h-5 w-5 text-gray-400">🔍</div>
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder={$language === 'ar' ? 'البحث في العروض...' : 'Search offers...'}
          class="block w-full {$language === 'ar' ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#39FF14]/30 focus:border-[#39FF14] shadow-sm"
        >
      </div>

      <!-- Filter Chips -->
      <div class="flex flex-wrap gap-2 items-center">
        {#each filters as filter}
          <button
            on:click={() => handleFilterChange(filter.id)}
            class="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 {
              activeFilter === filter.id
                ? 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.35)]'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-[#39FF14]/60 hover:text-black'
            }"
          >
            {$language === 'ar' ? filter.labelAr : filter.label}
          </button>
        {/each}

        <!-- Branch Selector -->
        {#if activeFilter === 'branch'}
          <select
            bind:value={selectedBranch}
            on:change={handleBranchChange}
            class="px-4 py-2 rounded-full text-sm bg-white border border-gray-300 text-gray-800 focus:border-[#39FF14] focus:ring-2 focus:ring-[#39FF14]/30"
          >
            <option value="">{ $language === 'ar' ? 'جميع الفروع' : 'All Branches' }</option>
            {#each branches as branch}
              <option value={branch.id}>
                {$language === 'ar' 
                  ? (branch.name_ar || branch.name_en) 
                  : (branch.name_en || branch.name_ar)}
              </option>
            {/each}
          </select>
        {/if}
      </div>
    </div>

    <!-- Offers Grid -->
    {#if loading}
      <!-- Loading Skeletons -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each Array(8) as _}
          <div class="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse">
            <div class="rounded-xl mb-4" style="aspect-ratio:210/297; background: linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%);"></div>
            <div class="h-4 bg-gray-200 rounded mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div class="flex gap-2">
              <div class="h-8 bg-gray-200 rounded flex-1"></div>
              <div class="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if filteredOffers.length === 0}
      <!-- Empty State -->
      <div class="text-center py-16">
        <div class="text-8xl mb-6">🎁</div>
        <h2 class="text-2xl font-extrabold text-gray-900 mb-3">
          {$language === 'ar' ? 'لا توجد عروض حتى الآن' : 'No offers yet'}
        </h2>
        <p class="text-gray-500 text-lg mb-8 max-w-md mx-auto">
          {$language === 'ar' ? 'عُد لاحقاً للحصول على أحدث العروض والخصومات المثيرة!' : 'Check back soon for exciting offers and deals!'}
        </p>
        <a
          href="/dashboard"
          class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#00C853] text-black font-semibold rounded-xl shadow hover:shadow-[0_0_25px_rgba(57,255,20,0.35)] transition-all duration-300"
        >
          {$language === 'ar' ? 'تصفّح الفروع' : 'Browse Branches'}
        </a>
      </div>
    {:else}
      <!-- Offers Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each filteredOffers as offer}
          {@const daysLeft = getDaysUntilExpiry(offer.expiry_date)}
          {@const isExpiringSoon = daysLeft <= 3}

          <div class="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-[#39FF14] transition-all duration-300 hover:shadow-[0_10px_40px_rgba(57,255,20,0.15)] hover:-translate-y-1">
            {#if isExpiringSoon}
              <div class="absolute top-3 {$language === 'ar' ? 'left-3' : 'right-3'} z-10">
                <div class="px-2 py-1 bg-[#FF6A00] text-white text-xs font-semibold rounded-full animate-pulse shadow">
                  {$language === 'ar' ? `${daysLeft} أيام متبقية` : `${daysLeft} days left`}
                </div>
              </div>
            {/if}

            <!-- A4 Image Area (full image, no crop) -->
            <div class="relative bg-white">
              <div style="aspect-ratio: 210/297;" class="w-full overflow-hidden">
                {#if offer.thumbnail_url}
                  <img
                    src={offer.thumbnail_url}
                    alt={offer.offer_name}
                    class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  >
                {:else}
                  <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div class="text-5xl">🎯</div>
                  </div>
                {/if}
              </div>
              <!-- Neon edge on hover -->
              <div class="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="absolute inset-2 rounded-xl border-2 border-[#39FF14] animate-pulse"></div>
              </div>
            </div>

            <!-- Content -->
            <div class="p-4">
              <!-- Title & Branch -->
              <div class="mb-3">
                <h3 class="font-bold text-gray-900 text-lg mb-1 truncate group-hover:text-[#FF6A00] transition-colors">
                  {offer.offer_name}
                </h3>
                <p class="text-gray-500 text-sm truncate">
                  {$language === 'ar' 
                    ? (offer.branches?.name_ar || offer.branches?.name_en || 'جميع الفروع') 
                    : (offer.branches?.name_en || offer.branches?.name_ar || 'All Branches')}
                </p>
              </div>

              <!-- Dates -->
              <div class="flex items-center gap-2 mb-4 text-xs">
                <span class="px-2 py-1 bg-[#39FF14]/20 text-[#0b7d18] rounded-full font-semibold">
                  {$language === 'ar' ? 'ساري' : 'Valid'}
                </span>
                <span class="text-gray-600">
                  {new Date(offer.start_date).toLocaleDateString($language === 'ar' ? 'ar-SA' : 'en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <span class="text-gray-500">–</span>
                <span class="text-gray-600">
                  {new Date(offer.expiry_date).toLocaleDateString($language === 'ar' ? 'ar-SA' : 'en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  on:click={() => viewOffer(offer)}
                  class="flex-1 px-4 py-2 bg-gradient-to-r from-[#39FF14]/20 to-[#00C853]/20 text-[#0b7d18] border border-[#39FF14]/40 rounded-lg font-semibold hover:bg-gradient-to-r hover:from-[#39FF14] hover:to-[#00C853] hover:text-black transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
                >
                  {$language === 'ar' ? 'عرض العرض' : 'View Offer'}
                </button>
                <button
                  on:click={() => shareOffer(offer)}
                  class="px-4 py-2 border border-[#FF6A00] text-[#FF6A00] rounded-lg font-semibold hover:bg-[#FF6A00]/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50"
                  title={$language === 'ar' ? 'مشاركة' : 'Share'}
                >
                  <span class="text-lg {$language === 'ar' ? 'rtl-flip' : ''}">📤</span>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- PDF Viewer Modal -->
{#if showPdfViewer && selectedPdfUrl && selectedOffer}
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" on:click={closePdfViewer}>
    <div class="bg-white rounded-2xl border-2 border-[#39FF14] shadow-[0_0_30px_rgba(57,255,20,0.25)] w-full max-w-4xl h-[80vh] flex flex-col" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">{selectedOffer.offer_name}</h3>
          <p class="text-gray-500 text-sm">
            {$language === 'ar' 
              ? (selectedOffer.branches?.name_ar || selectedOffer.branches?.name_en || 'جميع الفروع') 
              : (selectedOffer.branches?.name_en || selectedOffer.branches?.name_ar || 'All Branches')}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Download Button -->
          <a
            href={selectedPdfUrl}
            download={`${selectedOffer.offer_name}.pdf`}
            class="px-4 py-2 border border-[#FF6A00] text-[#FF6A00] rounded-lg hover:bg-[#FF6A00]/10 transition-all duration-200 flex items-center gap-2"
          >
            <span class="text-sm">📥</span>
            <span class="hidden sm:inline text-sm font-medium">
              {$language === 'ar' ? 'تحميل' : 'Download'}
            </span>
          </a>

          <!-- Close Button -->
          <button
            on:click={closePdfViewer}
            class="text-gray-500 hover:text-gray-800 transition-colors p-2"
            aria-label={$language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <span class="text-xl">✕</span>
          </button>
        </div>
      </div>

      <!-- PDF Content -->
      <div class="flex-1 p-4">
        <iframe
          src={selectedPdfUrl}
          class="w-full h-full rounded-lg border border-gray-200"
          title={selectedOffer.offer_name}
        ></iframe>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Global font stack with Arabic support */
  :global(body) {
    font-family: 'Inter', 'IBM Plex Sans Arabic', system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans Arabic', sans-serif;
    background: #ffffff;
  }

  /* Smooth motion preference */
  @media (prefers-reduced-motion: no-preference) {
    * { scroll-behavior: smooth; }
  }

  /* Accessibility focus */
  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 2px solid #39FF14;
    outline-offset: 2px;
  }

  /* RTL icon flip helper */
  [dir="rtl"] .rtl-flip { transform: scaleX(-1); }

  /* Gentle floating background blobs */
  .animate-slowfloat {
    animation: slowfloat 18s ease-in-out infinite;
  }
  .animate-slowfloat2 {
    animation: slowfloat2 22s ease-in-out infinite;
  }
  @keyframes slowfloat {
    0%,100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(20px,10px) scale(1.05); }
  }
  @keyframes slowfloat2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(-20px,-15px) scale(1.06); }
  }

  /* Animated divider sheen */
  .animate-sheen {
    position: relative;
    overflow: hidden;
  }
  .animate-sheen::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
    transform: translateX(-100%);
    animation: sheen 3.5s infinite;
  }
  @keyframes sheen {
    0%   { transform: translateX(-100%); }
    60%  { transform: translateX(100%); }
    100% { transform: translateX(100%); }
  }

  /* Loading shimmer (for the skeleton card wrapper) */
  .animate-pulse {
    background-size: 400% 100%;
    animation: shimmer 1.6s ease-in-out infinite;
  }
  @keyframes shimmer {
    0% { background-position: -468px 0; }
    100% { background-position: 468px 0; }
  }

  /* ------- Fireworks ------- */
  #fw-root { overflow: hidden; }
  .fw-burst {
    position: absolute;
    width: 6px; height: 6px;
    border-radius: 9999px;
    background: radial-gradient(circle, #FF6A00 0%, #FF8A00 60%, transparent 70%);
    box-shadow:
      0 0 10px rgba(255,106,0,0.8),
      0 0 20px rgba(255,138,0,0.6);
    animation: fw-pop 1.2s ease-out forwards;
  }
  .fw-burst::before, .fw-burst::after {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 9999px;
    box-shadow:
      0 -14px 0 0 #39FF14,
      0 14px 0 0 #FF6A00,
      14px 0 0 0 #39FF14,
      -14px 0 0 0 #FF6A00,
      10px 10px 0 0 #39FF14,
      -10px -10px 0 0 #FF6A00,
      10px -10px 0 0 #39FF14,
      -10px 10px 0 0 #FF6A00;
    animation: fw-rays 1.2s ease-out forwards;
  }
  .fw-burst::after {
    filter: blur(1.5px);
    opacity: .85;
  }
  @keyframes fw-pop {
    0% { transform: scale(0.2); opacity: 0.9; }
    60% { transform: scale(1.4); opacity: 1; }
    100% { transform: scale(0.9); opacity: 0; }
  }
  @keyframes fw-rays {
    0% { transform: scale(0.2); opacity: 0.9; }
    70% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1.3); opacity: 0; }
  }
</style>
