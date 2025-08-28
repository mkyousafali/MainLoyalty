<script lang="ts">
  import { goto } from '$app/navigation';
  import { language } from '$lib/stores/language';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let pageLoaded = false;
  let branches: any[] = [];
  let selectedBranchId = '';
  let loading = true;

  onMount(() => {
    setTimeout(() => { pageLoaded = true; }, 100);
    loadBranches();
  });

  async function loadBranches() {
    try {
      loading = true;
      console.log('🔄 Loading branches from database...');
      
      // First try with basic columns that we know exist
      const { data, error } = await supabase
        .from('branches')
        .select('id, name_en, name_ar')
        .order('name_en');

      if (error) {
        console.error('❌ Error loading branches:', error);
        // Try with all columns to see what's available
        console.log('🔄 Trying with all columns...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('branches')
          .select('*')
          .order('name_en');
          
        if (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          throw fallbackError;
        } else {
          console.log('✅ Branches loaded with all columns:', fallbackData);
          branches = fallbackData || [];
        }
      } else {
        console.log('✅ Branches loaded successfully:', data);
        branches = data || [];
      }
      
      console.log('📋 Total branches found:', branches.length);
    } catch (error) {
      console.error('❌ Failed to load branches:', error);
      // Use fallback branches for testing
      branches = [
        { id: '1', name_en: 'Main Branch - Riyadh', name_ar: 'الفرع الرئيسي - الرياض' },
        { id: '2', name_en: 'Branch 2 - Jeddah', name_ar: 'الفرع الثاني - جدة' },
        { id: '3', name_en: 'Branch 3 - Dammam', name_ar: 'الفرع الثالث - الدمام' }
      ];
      console.log('🔄 Using fallback branches data:', branches);
    } finally {
      loading = false;
    }
  }

  function proceedToGuestLogin() {
    if (!selectedBranchId) {
      return;
    }
    
    // Store selected branch in sessionStorage for guest access
    sessionStorage.setItem('guestSelectedBranch', selectedBranchId);
    goto('/guest-login');
  }

  function goBackToLogin() {
    goto('/login');
  }

  const translations = {
    en: {
      title: 'Select Your Branch',
      subtitle: 'Choose your nearest Urban Market branch',
      description: 'Please select the branch you usually visit to get personalized offers',
      selectBranch: 'Select Branch',
      chooseBranch: 'Choose your preferred branch...',
      proceedButton: 'Proceed as Guest',
      backToLogin: 'Back to Login',
      loading: 'Loading branches...',
      branchRequired: 'Please select a branch to continue'
    },
    ar: {
      title: 'اختر فرعك',
      subtitle: 'اختر أقرب فرع لأيربن ماركت',
      description: 'يرجى اختيار الفرع الذي تزوره عادة للحصول على عروض مخصصة',
      selectBranch: 'اختر الفرع',
      chooseBranch: 'اختر الفرع المفضل لديك...',
      proceedButton: 'المتابعة كضيف',
      backToLogin: 'العودة لتسجيل الدخول',
      loading: 'جاري تحميل الفروع...',
      branchRequired: 'يرجى اختيار فرع للمتابعة'
    }
  };

  $: localTranslations = translations[$language];
  $: isValidSelection = selectedBranchId !== '';
</script>

<div class="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 relative overflow-hidden" dir="{$language === 'ar' ? 'rtl' : 'ltr'}">
  
  <!-- Animated Background Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-teal-200 to-cyan-200 rounded-full opacity-30 animate-pulse"></div>
    <div class="absolute top-32 right-16 w-12 h-12 bg-gradient-to-r from-blue-200 to-teal-200 rounded-full opacity-40 animate-bounce delay-150"></div>
    <div class="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-r from-cyan-200 to-blue-200 rounded-full opacity-20 animate-pulse delay-300"></div>
    <div class="absolute bottom-32 right-8 w-8 h-8 bg-gradient-to-r from-teal-200 to-cyan-200 rounded-full opacity-30 animate-bounce delay-500"></div>
  </div>

  <!-- Main Content -->
  <div class="flex items-center justify-center min-h-screen p-4 relative z-10">
    <div class="w-full max-w-md relative">
    
      <!-- Floating Background Card -->
      <div class="absolute inset-0 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 rounded-3xl blur-xl opacity-20 animate-pulse scale-105"></div>
      
      <!-- 3D Teal Border Effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600 rounded-3xl blur-sm opacity-30 scale-[1.02]"></div>
      <div class="absolute inset-0 border-4 border-teal-300/60 rounded-3xl shadow-teal-200/50 shadow-2xl"></div>
      <div class="absolute inset-1 border-2 border-teal-200/40 rounded-3xl"></div>
      <div class="absolute inset-2 border border-teal-100/30 rounded-3xl"></div>
      
      <!-- Main Card -->
      <div class="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 transform transition-all duration-700 border-4 border-teal-400/20 shadow-teal-300/30" 
           style="box-shadow: 
             0 25px 50px -12px rgba(20, 184, 166, 0.25),
             0 0 0 1px rgba(20, 184, 166, 0.1),
             inset 0 1px 0 rgba(255, 255, 255, 0.1),
             inset 0 -1px 0 rgba(20, 184, 166, 0.1)"
           class:translate-y-0={pageLoaded} class:translate-y-8={!pageLoaded} class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded}>
        
        <!-- Logo and Header -->
        <div class="text-center mb-8">
          <div class="mb-6 relative">
            <div class="absolute inset-0 bg-gradient-to-r from-teal-200 to-cyan-200 rounded-2xl blur-sm opacity-30 animate-pulse"></div>
            <div class="relative bg-white rounded-2xl p-4 shadow-lg">
              <img src="/logo.png" alt="Urban Market Logo" class="w-28 h-20 mx-auto object-contain drop-shadow-sm" />
            </div>
          </div>
          
          <h1 class="text-3xl font-bold bg-gradient-to-r from-teal-800 to-cyan-600 bg-clip-text text-transparent mb-2">{localTranslations.title}</h1>
          <h2 class="text-xl font-semibold text-gray-700 mb-3">{localTranslations.subtitle}</h2>
          <div class="h-px w-20 bg-gradient-to-r from-teal-400 to-cyan-400 mx-auto mb-4"></div>
          <p class="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">{localTranslations.description}</p>
        </div>

        {#if loading}
          <!-- Loading State -->
          <div class="text-center py-8">
            <div class="inline-flex items-center gap-3 text-teal-600">
              <svg class="animate-spin w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="font-medium">{localTranslations.loading}</span>
            </div>
          </div>
        {:else}
          <!-- Branch Selection -->
          <div class="mb-8">
            <label for="branch-select" class="block text-sm font-semibold text-gray-700 mb-4">
              <span class="flex items-center gap-2" class:flex-row-reverse={$language === 'ar'}>
                <svg class="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                {localTranslations.selectBranch}
              </span>
            </label>
            
            <div class="relative">
              <select
                id="branch-select"
                bind:value={selectedBranchId}
                class="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 text-gray-900 text-lg transition-all duration-300 bg-gray-50 hover:bg-white appearance-none cursor-pointer"
                required
              >
                <option value="">{localTranslations.chooseBranch}</option>
                {#each branches as branch}
                  <option value={branch.id}>
                    {$language === 'ar' ? (branch.name_ar || branch.name_en) : branch.name_en}
                  </option>
                {/each}
              </select>
              
              <!-- Custom Dropdown Arrow -->
              <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Language Switch -->
          <div class="flex justify-center mb-6">
            <div class="bg-gradient-to-r from-gray-50 to-slate-100 border-2 border-gray-200 rounded-2xl p-3 shadow-sm">
              <div class="flex items-center justify-center gap-3">
                <span class="text-sm font-semibold text-gray-700">
                  {$language === 'ar' ? 'اللغة:' : 'Language:'}
                </span>
                <div class="flex items-center bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                  <button
                    type="button"
                    on:click={() => $language = 'en'}
                    class="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 {$language === 'en' ? 'bg-teal-500 text-white shadow-md transform scale-105' : 'text-gray-600 hover:bg-gray-50'}"
                  >
                    English
                  </button>
                  <button
                    type="button"
                    on:click={() => $language = 'ar'}
                    class="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 {$language === 'ar' ? 'bg-teal-500 text-white shadow-md transform scale-105' : 'text-gray-600 hover:bg-gray-50'}"
                  >
                    العربية
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-4">
            <!-- Proceed Button -->
            <button
              on:click={proceedToGuestLogin}
              disabled={!isValidSelection}
              class="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white py-4 px-8 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-lg tracking-wide transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] relative overflow-hidden group"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span class="relative z-10 flex items-center justify-center gap-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
                {localTranslations.proceedButton}
              </span>
            </button>

            <!-- Back Button -->
            <button
              on:click={goBackToLogin}
              class="w-full text-gray-600 hover:text-teal-600 font-semibold py-4 transition-all duration-300 text-base bg-gray-50 hover:bg-gray-100 rounded-2xl border-2 border-gray-200 hover:border-teal-200 transform hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              {localTranslations.backToLogin}
            </button>
          </div>
        {/if}

        <!-- Branch Selection Hint -->
        {#if !isValidSelection && !loading}
          <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div class="flex items-center">
              <svg class="w-4 h-4 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
              <p class="text-amber-700 text-sm">{localTranslations.branchRequired}</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
