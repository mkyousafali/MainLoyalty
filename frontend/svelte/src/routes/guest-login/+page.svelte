<script lang="ts">
  import { goto } from '$app/navigation';
  import { language } from '$lib/stores/language';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let pageLoaded = false;
  let socialLinks = [];

  onMount(() => {
    setTimeout(() => { pageLoaded = true; }, 100);
    loadSocialLinks();
  });

  async function loadSocialLinks() {
    // Get the selected branch from sessionStorage
    const selectedBranchId = sessionStorage.getItem('guestSelectedBranch');
    
    if (!selectedBranchId) {
      console.log('No branch selected, using default links');
      socialLinks = getDefaultLinks();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('branch_id', selectedBranchId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, use branch-specific default links
          socialLinks = getBranchSpecificLinks(selectedBranchId);
        } else {
          throw error;
        }
      } else {
        socialLinks = data?.length > 0 ? data : getBranchSpecificLinks(selectedBranchId);
      }
    } catch (error) {
      console.error('Error loading social links:', error);
      // Fallback to branch-specific links
      socialLinks = getBranchSpecificLinks(selectedBranchId);
    }
  }

  function getBranchSpecificLinks(branchId) {
    const branchLinks = {
      '1': [ // Main Branch - Riyadh
        { id: 1, name: 'Facebook', url: 'https://facebook.com/urbanmarket.riyadh', icon: '📘' },
        { id: 2, name: 'Instagram', url: 'https://instagram.com/urbanmarket.riyadh', icon: '📷' },
        { id: 3, name: 'WhatsApp', url: 'https://wa.me/966567334726', icon: '💬' }
      ],
      '2': [ // Branch 2 - Jeddah
        { id: 4, name: 'Facebook', url: 'https://facebook.com/urbanmarket.jeddah', icon: '📘' },
        { id: 5, name: 'Instagram', url: 'https://instagram.com/urbanmarket.jeddah', icon: '📷' },
        { id: 6, name: 'Twitter', url: 'https://twitter.com/urbanmarket_jed', icon: '🐦' }
      ],
      '3': [ // Branch 3 - Dammam
        { id: 7, name: 'Facebook', url: 'https://facebook.com/urbanmarket.dammam', icon: '📘' },
        { id: 8, name: 'Instagram', url: 'https://instagram.com/urbanmarket.dammam', icon: '📷' },
        { id: 9, name: 'LinkedIn', url: 'https://linkedin.com/company/urbanmarket-dammam', icon: '💼' }
      ]
    };

    return branchLinks[branchId] || getDefaultLinks();
  }

  function getDefaultLinks() {
    return [
      { id: 1, name: 'Facebook', url: 'https://facebook.com/urbanmarket', icon: '📘' },
      { id: 2, name: 'Instagram', url: 'https://instagram.com/urbanmarket', icon: '📷' },
      { id: 3, name: 'WhatsApp', url: 'https://wa.me/966567334726', icon: '💬' }
    ];
  }

  function goToOffers() {
    goto('/my-offers');
  }

  const translations = {
    en: {
      title: 'Guest Access',
      subtitle: 'Welcome to Urban Market',
      description: 'Browse our exclusive offers without creating an account',
      myOffersButton: 'My Offers',
      myOffersDescription: 'View available offers and promotions',
      backToLogin: 'Back to Login',
      guestNote: 'Guest users can view offers but cannot earn loyalty points or redeem rewards.',
      featuresTitle: 'What you can do as a guest:',
      features: [
        'View current offers and promotions',
        'Check store locations',
        'View terms and conditions'
      ],
      limitationsTitle: 'To unlock full features:',
      limitations: [
        'Create an account to earn points',
        'Redeem exclusive rewards',
        'Track your purchase history',
        'Get personalized offers'
      ],
      howToRegisterTitle: 'How to Register for Full Access:',
      registrationSteps: [
        'Visit your nearest Urban Market branch',
        'Register for the loyalty program with staff',
        'Wait 24 hours for system activation',
        'Register in this app with your loyalty card number',
        'Enjoy real deals and exclusive rewards!'
      ],
      socialLinksTitle: 'Follow Us'
    },
    ar: {
      title: 'دخول ضيف',
      subtitle: 'مرحباً بك في أيربن ماركت',
      description: 'تصفح العروض الحصرية بدون إنشاء حساب',
      myOffersButton: 'عروضي',
      myOffersDescription: 'عرض العروض والترويجات المتاحة',
      backToLogin: 'العودة لتسجيل الدخول',
      guestNote: 'يمكن للضيوف عرض العروض ولكن لا يمكنهم كسب نقاط الولاء أو استبدال المكافآت.',
      featuresTitle: 'ما يمكنك فعله كضيف:',
      features: [
        'عرض العروض والترويجات الحالية',
        'التحقق من مواقع المتاجر',
        'عرض الشروط والأحكام'
      ],
      limitationsTitle: 'لفتح جميع الميزات:',
      limitations: [
        'إنشاء حساب لكسب النقاط',
        'استبدال المكافآت الحصرية',
        'تتبع تاريخ مشترياتك',
        'الحصول على عروض مخصصة'
      ],
      howToRegisterTitle: 'كيفية التسجيل للحصول على الوصول الكامل:',
      registrationSteps: [
        'قم بزيارة أقرب فرع لأيربن ماركت',
        'سجل في برنامج الولاء مع الموظفين',
        'انتظر 24 ساعة لتفعيل النظام',
        'سجل في هذا التطبيق برقم بطاقة الولاء الخاصة بك',
        'استمتع بالصفقات الحقيقية والمكافآت الحصرية!'
      ],
      socialLinksTitle: 'تابعنا'
    }
  };

  $: localTranslations = translations[$language];
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 relative overflow-hidden" dir="{$language === 'ar' ? 'rtl' : 'ltr'}">
  
  <!-- Animated Background Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full opacity-30 animate-pulse"></div>
    <div class="absolute top-32 right-16 w-12 h-12 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full opacity-40 animate-bounce delay-150"></div>
    <div class="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full opacity-20 animate-pulse delay-300"></div>
    <div class="absolute bottom-32 right-8 w-8 h-8 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-full opacity-30 animate-bounce delay-500"></div>
  </div>

  <!-- Main Content -->
  <div class="flex items-center justify-center min-h-screen p-4 relative z-10">
    <div class="w-full max-w-lg relative">
    
      <!-- Floating Background Card -->
      <div class="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 rounded-3xl blur-xl opacity-20 animate-pulse scale-105"></div>
      
      <!-- 3D Purple Border Effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-600 rounded-3xl blur-sm opacity-30 scale-[1.02]"></div>
      <div class="absolute inset-0 border-4 border-purple-300/60 rounded-3xl shadow-purple-200/50 shadow-2xl"></div>
      <div class="absolute inset-1 border-2 border-purple-200/40 rounded-3xl"></div>
      <div class="absolute inset-2 border border-purple-100/30 rounded-3xl"></div>
      
      <!-- Main Card -->
      <div class="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 transform transition-all duration-700 border-4 border-purple-400/20 shadow-purple-300/30" 
           style="box-shadow: 
             0 25px 50px -12px rgba(168, 85, 247, 0.25),
             0 0 0 1px rgba(168, 85, 247, 0.1),
             inset 0 1px 0 rgba(255, 255, 255, 0.1),
             inset 0 -1px 0 rgba(168, 85, 247, 0.1)"
           class:translate-y-0={pageLoaded} class:translate-y-8={!pageLoaded} class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded}>
        
        <!-- Logo and Header -->
        <div class="text-center mb-8">
          <div class="mb-6 relative">
            <div class="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-sm opacity-30 animate-pulse"></div>
            <div class="relative bg-white rounded-2xl p-4 shadow-lg">
              <img src="/logo.png" alt="Urban Market Logo" class="w-28 h-20 mx-auto object-contain drop-shadow-sm" />
            </div>
          </div>
          
          <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-800 to-pink-600 bg-clip-text text-transparent mb-2">{localTranslations.title}</h1>
          <h2 class="text-xl font-semibold text-gray-700 mb-3">{localTranslations.subtitle}</h2>
          <div class="h-px w-20 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mb-4"></div>
          <p class="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">{localTranslations.description}</p>
        </div>

        <!-- Main Action -->
        <div class="mb-8">
          <button
            on:click={goToOffers}
            class="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-5 px-8 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all duration-300 text-xl tracking-wide transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] relative overflow-hidden group mb-3"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span class="relative z-10 flex items-center justify-center gap-3">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
              </svg>
              {localTranslations.myOffersButton}
            </span>
          </button>
          <p class="text-center text-sm text-gray-500">{localTranslations.myOffersDescription}</p>
        </div>

        <!-- Guest Information -->
        <div class="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl">
          <div class="flex items-start gap-3 mb-3">
            <svg class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-amber-700 text-sm leading-relaxed">{localTranslations.guestNote}</p>
          </div>
        </div>

        <!-- Features & Limitations -->
        <div class="grid grid-cols-1 gap-6 mb-8">
          <!-- What you can do -->
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
            <h3 class="text-lg font-bold text-green-700 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              {localTranslations.featuresTitle}
            </h3>
            <ul class="space-y-2">
              {#each localTranslations.features as feature}
                <li class="flex items-start gap-2 text-sm text-green-700">
                  <div class="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{feature}</span>
                </li>
              {/each}
            </ul>
          </div>

          <!-- To unlock full features -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
            <h3 class="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
              </svg>
              {localTranslations.limitationsTitle}
            </h3>
            <ul class="space-y-2">
              {#each localTranslations.limitations as limitation}
                <li class="flex items-start gap-2 text-sm text-blue-700">
                  <div class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{limitation}</span>
                </li>
              {/each}
            </ul>
          </div>

          <!-- How to Register -->
          <div class="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-4">
            <h3 class="text-lg font-bold text-orange-700 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              {localTranslations.howToRegisterTitle}
            </h3>
            <ol class="space-y-2">
              {#each localTranslations.registrationSteps as step, index}
                <li class="flex items-start gap-3 text-sm text-orange-700">
                  <div class="w-6 h-6 bg-orange-400 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span>{step}</span>
                </li>
              {/each}
            </ol>
          </div>
        </div>

        <!-- Social Links -->
        {#if socialLinks.length > 0}
          <div class="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5">
            <h3 class="text-lg font-bold text-purple-700 mb-4 text-center flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              {localTranslations.socialLinksTitle}
            </h3>
            <div class="flex flex-wrap justify-center gap-3">
              {#each socialLinks as link}
                <a 
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 bg-white px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-purple-200 hover:border-purple-400 hover:bg-purple-50 group transform hover:scale-105"
                  title={link.name}
                >
                  {#if link.use_custom_icon && link.custom_icon_url}
                    <img src={link.custom_icon_url} alt={link.name} class="w-5 h-5 object-contain group-hover:scale-110 transition-transform duration-200" />
                  {:else}
                    <span class="text-xl group-hover:scale-110 transition-transform duration-200">{link.icon}</span>
                  {/if}
                  <span class="text-sm font-medium text-gray-700 group-hover:text-purple-700">{link.name}</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}

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
                  class="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 {$language === 'en' ? 'bg-purple-500 text-white shadow-md transform scale-105' : 'text-gray-600 hover:bg-gray-50'}"
                >
                  EN
                </button>
                <button
                  type="button"
                  on:click={() => $language = 'ar'}
                  class="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 {$language === 'ar' ? 'bg-purple-500 text-white shadow-md transform scale-105' : 'text-gray-600 hover:bg-gray-50'}"
                >
                  العربية
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Back Button -->
        <button
          on:click={() => goto('/login')}
          class="w-full text-gray-600 hover:text-purple-600 font-semibold py-4 transition-all duration-300 text-base bg-gray-50 hover:bg-gray-100 rounded-2xl border-2 border-gray-200 hover:border-purple-200 transform hover:scale-[1.01] flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          {localTranslations.backToLogin}
        </button>
      </div>
    </div>
  </div>
</div>
