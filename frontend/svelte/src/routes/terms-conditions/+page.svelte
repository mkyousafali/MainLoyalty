<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { language } from '$lib/stores/language';
  
  let currentLang: 'en' | 'ar' = 'en';
  let pageLoaded = false;
  let isLoading = true;
  let termsData = null;
  let error = null;

  onMount(async () => {
    // Subscribe to language changes
    language.subscribe(lang => {
      currentLang = lang;
    });

    // Load terms from database
    await loadTermsFromDatabase();
    
    // Page load animation
    setTimeout(() => {
      pageLoaded = true;
    }, 100);
  });

  async function loadTermsFromDatabase() {
    try {
      console.log('Loading terms from database...');
      
      const { data, error: fetchError } = await supabase
        .from('terms_conditions')
        .select('*')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      console.log('Terms query result:', { data, error: fetchError });

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        termsData = data;
        console.log('Terms data loaded:', data);
      } else {
        console.log('No terms data found');
      }
    } catch (err) {
      console.error('Error loading terms:', err);
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function handleLanguageToggle() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    // Update the language store
    language.set(currentLang);
  }

  function printPage() {
    window.print();
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/login';
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'Not Available';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Not Available';
      }
      
      return currentLang === 'ar' 
        ? date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not Available';
    }
  }

  function parseTermsContent(content) {
    if (!content) return [];
    
    const sections = [];
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      
      // Handle the specific structure you showed
      if (parsed.sections) {
        const sectionKeys = Object.keys(parsed.sections);
        
        for (const key of sectionKeys) {
          const section = parsed.sections[key];
          if (section.title && section.content) {
            // Skip contact/support sections
            const titleLower = section.title.toLowerCase();
            if (titleLower.includes('contact') || titleLower.includes('support') || 
                titleLower.includes('اتصال') || titleLower.includes('دعم')) {
              continue;
            }
            
            sections.push({
              title: section.title,
              content: [{
                type: 'text',
                content: section.content
              }]
            });
          }
        }
        
        // If we successfully parsed sections, return them
        if (sections.length > 0) {
          return sections;
        }
      }
      
      // Handle other JSON formats
      if (parsed.title) {
        const titleLower = parsed.title.toLowerCase();
        if (!(titleLower.includes('contact') || titleLower.includes('support') || 
              titleLower.includes('اتصال') || titleLower.includes('دعم'))) {
          sections.push({
            title: parsed.title,
            content: [{
              type: 'text',
              content: parsed.subtitle || ''
            }]
          });
        }
      }
      
    } catch (e) {
      console.log('Content is not valid JSON, parsing as plain text');
    }
    
    // If JSON parsing failed or didn't work, parse as plain text
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    let currentSection = null;
    
    for (const line of lines) {
      // Check for numbered section headers (1. INTRODUCTION, 2. ELIGIBILITY, etc.)
      const sectionMatch = line.match(/^(\d+)\.\s*([A-Z\u0600-\u06FF\s&-]+)$/i);
      if (sectionMatch) {
        // Save previous section (if it's not a contact/support section)
        if (currentSection) {
          const titleLower = currentSection.title.toLowerCase();
          if (!(titleLower.includes('contact') || titleLower.includes('support') || 
                titleLower.includes('information and support') || titleLower.includes('اتصال') || 
                titleLower.includes('دعم') || titleLower.includes('معلومات الاتصال'))) {
            sections.push(currentSection);
          }
        }
        
        // Start new section
        const sectionTitle = sectionMatch[2].trim();
        const titleLower = sectionTitle.toLowerCase();
        
        // Skip contact/support sections entirely
        if (titleLower.includes('contact') || titleLower.includes('support') || 
            titleLower.includes('information and support') || titleLower.includes('اتصال') || 
            titleLower.includes('دعم') || titleLower.includes('معلومات الاتصال')) {
          currentSection = null;
          continue;
        }
        
        currentSection = {
          number: sectionMatch[1],
          title: sectionTitle,
          content: []
        };
        continue;
      }
      
      // Skip processing if we're in a contact/support section
      if (currentSection === null) {
        continue;
      }
      
      // Check for main title (like "URBAN MARKET LOYALTY PROGRAM - TERMS & CONDITIONS")
      if (line.match(/^[A-Z\u0600-\u06FF\s&-]+$/i) && line.length > 10 && !currentSection && sections.length === 0) {
        const titleLower = line.toLowerCase();
        if (!(titleLower.includes('contact') || titleLower.includes('support') || 
              titleLower.includes('اتصال') || titleLower.includes('دعم'))) {
          currentSection = {
            title: line,
            content: []
          };
        }
        continue;
      }
      
      // Add content to current section
      if (currentSection) {
        // Handle bullet points
        if (line.startsWith('-') || line.startsWith('•')) {
          const existingList = currentSection.content.find(c => c.type === 'list');
          if (existingList) {
            existingList.items.push(line.replace(/^[-•]\s*/, ''));
          } else {
            currentSection.content.push({
              type: 'list',
              items: [line.replace(/^[-•]\s*/, '')]
            });
          }
        }
        // Skip contact information parsing entirely
        else if (line.includes('Email:') || line.includes('WhatsApp:') || line.includes('Phone:') || 
                 line.includes('البريد الإلكتروني:') || line.includes('واتساب:') || line.includes('الهاتف:') ||
                 line.includes('support@') || line.includes('Customer service') || line.includes('خدمة العملاء') ||
                 line.includes('legal@') || line.includes('legal department') || line.includes('legal inquiries') ||
                 line.includes('For legal inquiries') || line.includes('contact our legal department')) {
          // Skip contact information entirely
          continue;
        }
        // Regular text
        else if (line.length > 0) {
          currentSection.content.push({
            type: 'text',
            content: line
          });
        }
      } else {
        // No current section, create a general one (if not contact related)
        const lineLower = line.toLowerCase();
        if (!(lineLower.includes('contact') || lineLower.includes('support') || 
              lineLower.includes('اتصال') || lineLower.includes('دعم') || 
              lineLower.includes('email') || lineLower.includes('whatsapp') || 
              lineLower.includes('phone') || lineLower.includes('customer service') ||
              lineLower.includes('legal@') || lineLower.includes('legal department') || 
              lineLower.includes('legal inquiries') || lineLower.includes('urbanmarket.sa') ||
              lineLower.includes('© 2024') || lineLower.includes('all rights reserved'))) {
          currentSection = {
            title: currentLang === 'ar' ? 'معلومات عامة' : 'General Information',
            content: [{
              type: 'text',
              content: line
            }]
          };
        }
      }
    }
    
    // Add the last section (if it's not a contact/support section)
    if (currentSection) {
      const titleLower = currentSection.title.toLowerCase();
      if (!(titleLower.includes('contact') || titleLower.includes('support') || 
            titleLower.includes('information and support') || titleLower.includes('اتصال') || 
            titleLower.includes('دعم') || titleLower.includes('معلومات الاتصال'))) {
        sections.push(currentSection);
      }
    }
    
    // If we still have no proper sections but have content, create a fallback
    if (sections.length === 0 && content.length > 0) {
      sections.push({
        title: currentLang === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions',
        content: [{
          type: 'text',
          content: content
        }]
      });
    }
    
    return sections;
  }

  // Language content - fallback data
  const fallbackTranslations = {
    en: {
      title: 'Terms and Conditions',
      subtitle: 'Urban Market Loyalty Program',
      lastUpdated: 'Last Updated',
      effectiveDate: 'Effective Date',
      loading: 'Loading...',
      error: 'Error loading terms',
      noData: 'Terms and Conditions not found',
      printButton: 'Print',
      backButton: 'Back',
      version: 'Version'
    },
    ar: {
      title: 'الشروط والأحكام',
      subtitle: 'برنامج ولاء ايربن ماركت',
      lastUpdated: 'آخر تحديث',
      effectiveDate: 'تاريخ السريان',
      loading: 'جاري التحميل...',
      error: 'خطأ في تحميل الشروط',
      noData: 'الشروط والأحكام غير موجودة',
      printButton: 'طباعة',
      backButton: 'رجوع',
      version: 'الإصدار'
    }
  };
</script>

<svelte:head>
  <title>{fallbackTranslations[currentLang].title} - Urban Loyalty</title>
  <meta name="description" content="Terms and Conditions for Urban Market Loyalty Program" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" class:rtl={currentLang === 'ar'}>
  <!-- Header -->
  <div class="bg-white shadow-sm sticky top-0 z-10 print:static">
    <div class="max-w-6xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <img 
            src="/logo.png" 
            alt="Urban Market Logo" 
            class="h-12 w-auto object-contain"
            on:error={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <!-- Fallback logo -->
          <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg items-center justify-center text-white text-xl" style="display: none;">
            🏪
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">
              {fallbackTranslations[currentLang].title}
            </h1>
            <p class="text-sm text-gray-600">{fallbackTranslations[currentLang].subtitle}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4 print:hidden">
          <!-- Language Toggle -->
          <button 
            on:click={handleLanguageToggle}
            class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors"
          >
            <span class="text-lg">🌐</span>
            <span class="text-sm font-medium">
              {currentLang === 'ar' ? 'English' : 'عربي'}
            </span>
          </button>
          
          <!-- Print Button -->
          <button 
            on:click={printPage}
            class="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 transition-colors"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM5 14H4v-3h1v3zm1 0v2h8v-2H6z" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm">{fallbackTranslations[currentLang].printButton}</span>
          </button>
          
          <!-- Back Button -->
          <button 
            on:click={goBack}
            class="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-4 py-2 transition-colors"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M15 19l-7-7 7-7" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm">{fallbackTranslations[currentLang].backButton}</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="bg-white rounded-xl shadow-lg p-12 text-center">
        <div class="animate-pulse space-y-4">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <div class="space-y-2">
            <h3 class="text-lg font-medium text-gray-900">{fallbackTranslations[currentLang].loading}</h3>
            <p class="text-gray-500">
              {currentLang === 'ar' ? 'جاري تحميل الشروط والأحكام...' : 'Loading terms and conditions...'}
            </p>
          </div>
          <!-- Loading skeleton -->
          <div class="mt-8 space-y-3">
            <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
            <div class="h-4 bg-gray-200 rounded animate-pulse w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>

  <!-- Error State -->
  {:else if error}
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="bg-white rounded-xl shadow-lg p-12 text-center border-l-4 border-red-500">
        <div class="text-red-500 mb-6">
          <svg class="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">{fallbackTranslations[currentLang].error}</h2>
        <div class="bg-red-50 rounded-lg p-4 mb-6">
          <p class="text-red-700 font-medium mb-2">
            {currentLang === 'ar' ? 'تفاصيل الخطأ:' : 'Error Details:'}
          </p>
          <p class="text-red-600 text-sm">{error}</p>
        </div>
        <div class="space-y-3">
          <button
            on:click={() => window.location.reload()}
            class="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-4"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {currentLang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
          <button
            on:click={goBack}
            class="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {fallbackTranslations[currentLang].backButton}
          </button>
        </div>
      </div>
    </div>

  <!-- No Data State -->
  {:else if !termsData}
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="bg-white rounded-xl shadow-lg p-12 text-center border-l-4 border-yellow-500">
        <div class="text-yellow-500 mb-6">
          <svg class="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">{fallbackTranslations[currentLang].noData}</h2>
        <div class="bg-yellow-50 rounded-lg p-4 mb-6">
          <p class="text-yellow-800">
            {currentLang === 'ar' 
              ? 'لم يتم العثور على الشروط والأحكام في قاعدة البيانات. يرجى الاتصال بالدعم الفني.'
              : 'Terms and conditions not found in the database. Please contact technical support.'
            }
          </p>
        </div>
        <div class="space-y-3">
          <button
            on:click={() => loadTermsFromDatabase()}
            class="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors mr-4"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {currentLang === 'ar' ? 'إعادة التحميل' : 'Reload'}
          </button>
          <button
            on:click={goBack}
            class="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {fallbackTranslations[currentLang].backButton}
          </button>
        </div>
      </div>
    </div>

  <!-- Content with Data -->
  {:else}
    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 py-8" class:opacity-0={!pageLoaded} class:animate-fade-in={pageLoaded}>
      <!-- Document Header -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div class="text-center mb-6">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">
            {fallbackTranslations[currentLang].title}
          </h2>
          <h3 class="text-xl text-gray-600 mb-4">{fallbackTranslations[currentLang].subtitle}</h3>
          <div class="text-sm text-gray-500 bg-gray-50 inline-block px-4 py-2 rounded-full space-y-1">
            <p>{fallbackTranslations[currentLang].version} {termsData.version || 1}</p>
            <p>{fallbackTranslations[currentLang].effectiveDate}: {formatDate(termsData.effective_date || termsData.created_at || new Date().toISOString())}</p>
          </div>
        </div>
      </div>

      <!-- Terms Content -->
      <div class="space-y-6">
        {#each parseTermsContent(currentLang === 'ar' ? termsData.content_ar : termsData.content_en) as section, index}
          <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
            <!-- Section Header -->
            {#if section.title}
              <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4">
                <h2 class="text-xl font-bold flex items-center gap-3" class:text-right={currentLang === 'ar'} class:flex-row-reverse={currentLang === 'ar'}>
                  <span class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
              </div>
            {/if}
            
            <!-- Section Content -->
            <div class="px-6 py-5">
              {#if section.content}
                <div class="prose prose-lg max-w-none" class:text-right={currentLang === 'ar'}>
                  {#each section.content as paragraph}
                    {#if paragraph.type === 'text'}
                      <p class="text-gray-700 leading-relaxed mb-4 text-base">{paragraph.content}</p>
                    {:else if paragraph.type === 'list'}
                      <ul class="list-disc list-inside space-y-2 mb-4 {currentLang === 'ar' ? 'mr-4' : 'ml-4'}">
                        {#each paragraph.items as item}
                          <li class="text-gray-700 leading-relaxed text-base">{item}</li>
                        {/each}
                      </ul>
                    {:else if paragraph.type === 'contact'}
                      <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-gray-900 mb-3" class:text-right={currentLang === 'ar'}>
                          {currentLang === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
                        </h4>
                        <div class="space-y-2">
                          {#each paragraph.contacts as contact}
                            <div class="flex items-center gap-3" class:flex-row-reverse={currentLang === 'ar'}>
                              <span class="text-blue-500">{contact.icon}</span>
                              <span class="font-medium text-gray-700">{contact.label}:</span>
                              <span class="text-gray-600">{contact.value}</span>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/each}

        <!-- Document Footer Card -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div class="text-center space-y-4">
            <div class="flex items-center justify-center gap-3 text-gray-600">
              <span class="text-2xl">📋</span>
              <div>
                <h3 class="font-semibold text-gray-900">
                  {currentLang === 'ar' ? 'وثيقة رسمية' : 'Official Document'}
                </h3>
                <p class="text-sm">
                  {currentLang === 'ar' ? 'الشروط والأحكام الحالية' : 'Current Terms & Conditions'}
                </p>
              </div>
            </div>
            
            <div class="border-t border-gray-200 pt-4">
              <p class="text-sm text-gray-600">
                {currentLang === 'ar' ? 'هذه الوثيقة محمية بحقوق الطبع والنشر' : 'This document is protected by copyright'}
              </p>
            </div>

            <!-- Print Info (Visible in Print) -->
            <div class="hidden print:block mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <p>Urban Market Loyalty Program - Terms & Conditions</p>
              <p>{fallbackTranslations[currentLang].version} {termsData.version} • {formatDate(termsData.effective_date || termsData.created_at)}</p>
              <p>Printed on: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .rtl {
    direction: rtl;
    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .rtl .prose {
    text-align: right;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }

  /* Print styles */
  @media print {
    .sticky {
      position: static !important;
    }
    
    .print\\:hidden {
      display: none !important;
    }
    
    .print\\:static {
      position: static !important;
    }
    
    button {
      display: none !important;
    }
    
    .shadow-lg {
      box-shadow: none !important;
    }
    
    .bg-gradient-to-br {
      background: white !important;
    }
    
    .print\\:block {
      display: block !important;
    }
    
    .print\\:text-sm {
      font-size: 0.875rem !important;
      line-height: 1.25rem !important;
    }
    
    section {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    h3 {
      page-break-after: avoid;
    }
  }

  /* Smooth scrolling for anchor links */
  html {
    scroll-behavior: smooth;
  }

  /* Enhanced readability */
  .prose {
    max-width: none;
    line-height: 1.8;
  }

  .prose p {
    margin-bottom: 1rem;
    line-height: 1.8;
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

  .rtl a {
    text-align: right;
  }

  .prose-rtl {
    text-align: right;
  }

  /* Formatted content styling */
  .formatted-content h3 {
    color: #1f2937;
    border-left: 4px solid #3b82f6;
    padding-left: 1rem;
  }

  .rtl .formatted-content h3 {
    border-left: none;
    border-right: 4px solid #3b82f6;
    padding-left: 0;
    padding-right: 1rem;
  }

  .formatted-content p {
    text-align: justify;
  }

  .rtl .formatted-content p {
    text-align: right;
  }

  /* Enhanced visual hierarchy */
  .prose-lg {
    font-size: 1.125rem;
    line-height: 1.7;
  }

  .prose-lg h3 {
    font-size: 1.25rem;
    line-height: 1.6;
  }
</style>
