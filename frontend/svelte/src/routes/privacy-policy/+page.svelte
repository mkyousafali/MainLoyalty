<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { language } from '$lib/stores/language';
  import { goto } from '$app/navigation';

  let privacyPolicy = null;
  let isLoading = true;
  let currentLang = 'en';

  // Language content
  const t = {
    en: {
      title: 'Privacy Policy',
      loading: 'Loading...',
      backToLogin: 'Back to Login',
      backToDashboard: 'Back to Dashboard',
      print: 'Print',
      lastUpdated: 'Last updated:',
      version: 'Version',
      errorLoading: 'Error loading privacy policy',
      noPolicy: 'Privacy policy not found'
    },
    ar: {
      title: 'سياسة الخصوصية',
      loading: 'جاري التحميل...',
      backToLogin: 'العودة لتسجيل الدخول',
      backToDashboard: 'العودة للوحة الرئيسية',
      print: 'طباعة',
      lastUpdated: 'آخر تحديث:',
      version: 'الإصدار',
      errorLoading: 'خطأ في تحميل سياسة الخصوصية',
      noPolicy: 'سياسة الخصوصية غير موجودة'
    }
  };

  onMount(async () => {
    // Subscribe to language changes
    language.subscribe(lang => {
      currentLang = lang;
    });

    await loadPrivacyPolicy();
  });

  async function loadPrivacyPolicy() {
    try {
      const { data, error } = await supabase
        .from('privacy_policy')
        .select('*')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      privacyPolicy = data;
    } catch (error) {
      console.error('Error loading privacy policy:', error);
    } finally {
      isLoading = false;
    }
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      goto('/login');
    }
  }

  function printPolicy() {
    window.print();
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return currentLang === 'ar' 
      ? date.toLocaleDateString('ar-SA')
      : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
  }
</script>

<svelte:head>
  <title>{currentLang === 'ar' ? 'سياسة الخصوصية - Urban Loyalty' : 'Privacy Policy - Urban Loyalty'}</title>
  <meta name="description" content={currentLang === 'ar' ? 'سياسة الخصوصية لتطبيق Urban Loyalty' : 'Privacy Policy for Urban Loyalty App'} />
</svelte:head>

<div class="min-h-screen bg-gray-50" class:rtl={currentLang === 'ar'}>
  <!-- Header -->
  <header class="bg-white shadow-sm print:shadow-none">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4 print:py-2">
        <div class="flex items-center space-x-4" class:space-x-reverse={currentLang === 'ar'}>
          <button
            on:click={goBack}
            class="flex items-center text-blue-600 hover:text-blue-800 transition-colors print:hidden"
            class:flex-row-reverse={currentLang === 'ar'}
          >
            <svg class="w-5 h-5 {currentLang === 'ar' ? 'ml-1 rotate-180' : 'mr-1'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t[currentLang].backToLogin}
          </button>
        </div>

        <div class="flex items-center space-x-4 print:hidden" class:space-x-reverse={currentLang === 'ar'}>
          <!-- Language Toggle -->
          <div class="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              on:click={() => language.set('en')}
              class="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 {currentLang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
            >
              EN
            </button>
            <button
              on:click={() => language.set('ar')}
              class="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 {currentLang === 'ar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
            >
              ع
            </button>
          </div>

          <!-- Print Button -->
          <button
            on:click={printPolicy}
            class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg class="w-4 h-4 {currentLang === 'ar' ? 'ml-2' : 'mr-2'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t[currentLang].print}
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-4">
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">{t[currentLang].loading}</span>
      </div>
    {:else if privacyPolicy}
      <!-- Privacy Policy Content -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-0">
        <div class="p-8 print:p-4">
          <!-- Title -->
          <div class="text-center mb-8 print:mb-4">
            <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 print:text-2xl">
              {currentLang === 'ar' ? privacyPolicy.title_ar : privacyPolicy.title_en}
            </h1>
            
            <!-- Policy Info -->
            <div class="text-sm text-gray-500 space-y-1">
              <p>{t[currentLang].version} {privacyPolicy.version}</p>
              <p>{t[currentLang].lastUpdated} {formatDate(privacyPolicy.last_updated)}</p>
            </div>
          </div>

          <!-- Policy Content -->
          <div 
            class="prose prose-gray max-w-none text-gray-700 leading-relaxed print:text-sm"
            class:text-right={currentLang === 'ar'}
            class:prose-rtl={currentLang === 'ar'}
          >
            <div class="whitespace-pre-line">
              {currentLang === 'ar' ? privacyPolicy.content_ar : privacyPolicy.content_en}
            </div>
          </div>

          <!-- Footer Info (Print Only) -->
          <div class="hidden print:block mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
            <p>Urban Loyalty - Privacy Policy</p>
            <p>{t[currentLang].version} {privacyPolicy.version} • {formatDate(privacyPolicy.last_updated)}</p>
          </div>
        </div>
      </div>
    {:else}
      <!-- No Policy Found -->
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">{t[currentLang].noPolicy}</h2>
        <p class="text-gray-600 mb-6">{t[currentLang].errorLoading}</p>
        <button
          on:click={goBack}
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t[currentLang].backToLogin}
        </button>
      </div>
    {/if}
  </main>
</div>

<style>
  /* Print styles */
  @media print {
    .print\\:hidden {
      display: none !important;
    }
    
    .print\\:shadow-none {
      box-shadow: none !important;
    }
    
    .print\\:border-0 {
      border: 0 !important;
    }
    
    .print\\:py-2 {
      padding-top: 0.5rem !important;
      padding-bottom: 0.5rem !important;
    }
    
    .print\\:py-4 {
      padding-top: 1rem !important;
      padding-bottom: 1rem !important;
    }
    
    .print\\:p-4 {
      padding: 1rem !important;
    }
    
    .print\\:text-2xl {
      font-size: 1.5rem !important;
      line-height: 2rem !important;
    }
    
    .print\\:text-sm {
      font-size: 0.875rem !important;
      line-height: 1.25rem !important;
    }
    
    .print\\:mb-4 {
      margin-bottom: 1rem !important;
    }
    
    .print\\:block {
      display: block !important;
    }
  }

  /* RTL Support */
  .rtl {
    direction: rtl;
  }

  .prose-rtl {
    text-align: right;
  }

  /* Smooth scrolling for anchor links */
  html {
    scroll-behavior: smooth;
  }

  /* Enhanced prose styles */
  .prose {
    max-width: none;
  }

  .prose ul {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  .prose li {
    margin: 0.5rem 0;
  }

  /* RTL specific adjustments */
  .rtl .prose ul {
    padding-right: 1.5rem;
    padding-left: 0;
  }
</style>
