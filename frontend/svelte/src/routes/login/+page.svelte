<script lang="ts">
  import { goto } from '$app/navigation';
  import { loginCustomer } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { termsStore, formatTermsForLogin, type TermsData } from '$lib/stores/terms';
  import { getGlobalWhatsAppLink } from '$lib/stores/globalSettings';

  let currentLang: 'en' | 'ar' = 'en';
  let mobile = '';
  let error = '';
  let isLoading = false;
  let currentStep: 'check' | 'register' | 'login' | 'success' = 'check';
  let processStatus = '';
  let showProcessStatus = false;
  let pageLoaded = false;
  let mobileInput: HTMLInputElement;
  
  // Registration form fields
  let fullName = '';
  let place = '';
  let selectedBranch = '';
  let password = '';
  let confirmPassword = '';
  let customerData: any = null;
  let termsAccepted = false;

  // Login form fields
  let loginPassword = '';

  // Captcha variables
  let captchaQuestion = '';
  let captchaAnswer = '';
  let userCaptchaAnswer = '';
  let captchaNumbers = { num1: 0, num2: 0 };

  let branches: Array<{id: number, name: string, nameAr: string}> = [];

  onMount(() => {
    setTimeout(() => { pageLoaded = true; }, 100);
    setTimeout(() => { if (mobileInput) mobileInput.focus(); }, 600);
    loadBranches();
    generateCaptcha();
    loadTermsContent();
    loadWhatsAppLink();
  });

  async function loadTermsContent() {
    // Load terms from the store (now from database)
    await termsStore.loadTerms();
    termsStore.subscribe(termsData => {
      currentTermsContent = termsData;
      // Format terms for the current language (default to English)
      const termsForLang = termsData[currentLang] || termsData.en;
      formattedTerms = formatTermsForLogin(termsForLang, 10);
    });
  }

  async function loadWhatsAppLink() {
    try {
      whatsappSupportLink = await getGlobalWhatsAppLink();
      console.log('✅ WhatsApp support link loaded:', whatsappSupportLink);
    } catch (error) {
      console.warn('⚠️ Failed to load WhatsApp link, using fallback:', error);
      // Keep the fallback value already set
    }
  }

  function handleSmileyClick() {
    smileyClickCount++;
    console.log(`😊 Smiley clicked ${smileyClickCount} times`);
    
    // Visual feedback for progress
    if (smileyClickCount === 5) {
      console.log('🤔 Halfway there...');
    } else if (smileyClickCount === 8) {
      console.log('😏 Almost there...');
    } else if (smileyClickCount === 9) {
      console.log('😈 One more click...');
    }
    
    if (smileyClickCount >= 10) {
      console.log('🎉 Easter egg activated! Redirecting to admin login...');
      smileyClickCount = 0; // Reset counter
      goto('/admin-login');
    }
    
    // Reset counter after 5 seconds of inactivity
    setTimeout(() => {
      if (smileyClickCount < 10) {
        smileyClickCount = Math.max(0, smileyClickCount - 1);
      }
    }, 5000);
  }

  function generateCaptcha() {
    captchaNumbers.num1 = Math.floor(Math.random() * 10) + 1;
    captchaNumbers.num2 = Math.floor(Math.random() * 10) + 1;
    captchaAnswer = (captchaNumbers.num1 + captchaNumbers.num2).toString();
    captchaQuestion = `${captchaNumbers.num1} + ${captchaNumbers.num2} = ?`;
    userCaptchaAnswer = '';
  }

  async function loadBranches() {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name_en, name_ar')
        .order('id', { ascending: true });

      if (error) throw error;

      branches = data.map(branch => ({
        id: branch.id,
        name: branch.name_en,
        nameAr: branch.name_ar
      }));
    } catch (err) {
      console.error('❌ Failed to load branches:', err);
    }
  }

  function formatMobileInput(value: string) {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 10);
  }

  function handleMobileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const formatted = formatMobileInput(target.value);
    mobile = formatted;
    target.value = formatted;
  }

  $: isValidMobile = mobile.length === 10 && mobile.startsWith('05');

  // Update formatted terms when language changes
  $: if (currentTermsContent) {
    const termsForLang = currentTermsContent[currentLang] || currentTermsContent.en;
    formattedTerms = formatTermsForLogin(termsForLang, 10);
  }

  // Validate captcha
  $: isValidCaptcha = userCaptchaAnswer === captchaAnswer;

  async function checkEligibility() {
    error = '';
    isLoading = true;
    processStatus = 'Validating mobile number...';

    if (!isValidMobile) {
      error = 'Please enter a valid 10-digit Saudi mobile number';
      isLoading = false;
      return;
    }

    try {
      // Step 1: Check eligibility in customer_numbers
      processStatus = 'Searching customer database...';
      
      const { data: eligibilityData, error: eligibilityError } = await supabase
        .from('customer_numbers')
        .select('*')
        .eq('customer', mobile)
        .single();
      
      if (eligibilityError || !eligibilityData) {
        currentStep = 'check';
        error = 'Not found. Please contact support or visit a branch.';
        isLoading = false;
        return;
      }
      
      // Step 2: Check if already registered
      processStatus = 'Verifying account status...';
      
      const { data: existingCustomer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_code', mobile)
        .single();
      
      if (!customerError && existingCustomer) {
        if (existingCustomer.card_status === 'registered' && existingCustomer.full_name) {
          // Already fully registered
          currentStep = 'login';
          customerData = existingCustomer;
          processStatus = 'Welcome back! Redirecting to dashboard...';
        } else {
          // Unregistered customer from upload, allow registration
          currentStep = 'register';
          customerData = existingCustomer;
        }
      } else {
        // New customer, proceed to registration
        currentStep = 'register';
        customerData = null;
      }
      
    } catch (err) {
      console.error('Eligibility check error:', err);
      error = 'An error occurred while checking eligibility. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function loginExistingCustomer() {
    if (!loginPassword) {
      error = 'Please enter your password';
      return;
    }

    isLoading = true;
    error = '';

    try {
      if (customerData && customerData.password === loginPassword) {
        // Login successful
        const userData = {
          mobile: mobile,
          name: customerData.full_name,
          email: customerData.email,
          loginTime: new Date().toISOString()
        };

        loginCustomer(userData);
        goto('/dashboard');
      } else {
        error = 'Incorrect password. Please try again.';
      }
    } catch (err) {
      error = 'Login failed. Please check your credentials.';
    } finally {
      isLoading = false;
    }
  }

  async function completeRegistration() {
    error = '';
    isLoading = true;
    showProcessStatus = true;

    // Validations
    if (!termsAccepted) {
      error = 'You must accept the Terms & Conditions to proceed';
      isLoading = false;
      showProcessStatus = false;
      return;
    }

    if (!fullName || !String(fullName).trim()) {
      error = 'Please enter your full name';
      isLoading = false;
      showProcessStatus = false;
      return;
    }

    if (!place || !String(place).trim()) {
      error = 'Please enter your place/area';
      isLoading = false;
      showProcessStatus = false;
      return;
    }

    if (!selectedBranch) {
      error = 'Please select your nearest branch';
      isLoading = false;
      showProcessStatus = false;
      return;
    }

    if (!password || password.length < 6) {
      error = 'Password must be at least 6 characters';
      isLoading = false;
      showProcessStatus = false;
      return;
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      isLoading = false;
      showProcessStatus = false;
      return;
    }

    const userAnswer = String(userCaptchaAnswer || '').trim();
    if (userAnswer !== captchaAnswer) {
      error = 'Incorrect captcha answer. Please try again.';
      generateCaptcha();
      isLoading = false;
      showProcessStatus = false;
      return;
    }

    try {
      const registrationTimeout = setTimeout(() => {
        throw new Error('Registration timeout - operation took too long');
      }, 15000);
      
      processStatus = 'Creating your account...';
      
      const currentYear = new Date().getFullYear();
      const expiryDate = new Date(currentYear, 11, 31, 23, 59, 59);

      processStatus = 'Saving your details...';

      const customerRecord = {
        customer_code: mobile,
        mobile: mobile,
        phone: mobile,
        card_number: mobile,
        name: String(fullName || '').trim(),
        full_name: String(fullName || '').trim(),
        email: String(place || '').trim(),
        password: password,
        branch_id: parseInt(selectedBranch),
        card_type: 'bronze',
        card_status: 'registered',
        status: 'active',
        points: 0,
        total_points: 0,
        valid_until: expiryDate.toISOString().split('T')[0],
        joined_at: new Date().toISOString(),
        registration_date: new Date().toISOString()
      };

      console.log('📝 Preparing customer record:', customerRecord);

      // BULLETPROOF REGISTRATION LOGIC
      console.log('🎯 BULLETPROOF REGISTRATION: Always check for existing customer first');
      
      // Always check if customer already exists (from transaction uploads)
      const { data: existingCustomers, error: checkError } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_code', mobile);
      
      console.log('🔍 Pre-registration check:', { 
        existingCustomers, 
        checkError, 
        count: existingCustomers?.length || 0 
      });
      
      let shouldUpdate = false;
      let existingCustomer = null;
      let data, insertError;
      
      if (existingCustomers && existingCustomers.length > 0) {
        existingCustomer = existingCustomers[0];
        console.log('📋 Found existing customer:', {
          id: existingCustomer.id,
          card_status: existingCustomer.card_status,
          full_name: existingCustomer.full_name
        });
        
        // Check if we should UPDATE instead of INSERT
        if (existingCustomer.card_status === 'unregistered' || 
            !existingCustomer.full_name || 
            String(existingCustomer.full_name || '').trim() === '') {
          shouldUpdate = true;
          console.log('✅ Will UPDATE existing unregistered customer');
        } else {
          console.log('⚠️ Customer already registered, this should not happen');
        }
      } else {
        console.log('✅ No existing customer found, will INSERT new customer');
      }
      
      // Execute UPDATE or INSERT based on findings
      if (shouldUpdate && existingCustomer) {
        console.log('🔄 UPDATING existing customer:', existingCustomer.id);
        
        const updateResult = await supabase
          .from('customers')
          .update({
            full_name: String(fullName || '').trim(),
            name: String(fullName || '').trim(),
            email: String(place || '').trim(),
            password: password,
            branch_id: parseInt(selectedBranch),
            card_status: 'registered',
            status: 'active',
            registration_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            valid_until: expiryDate.toISOString().split('T')[0]
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();
          
        data = updateResult.data;
        insertError = updateResult.error;
        
        console.log('📊 UPDATE result:', { data, insertError });
        
      } else {
        console.log('🚀 INSERTING new customer');
        
        const insertResult = await supabase
          .from('customers')
          .insert(customerRecord)
          .select()
          .single();

        data = insertResult.data;
        insertError = insertResult.error;
        
        console.log('📊 INSERT result:', { data, insertError });
      }

      clearTimeout(registrationTimeout);

      if (insertError) {
        console.error('❌ Database operation failed:', insertError);
        throw new Error(`Registration failed: ${insertError.message}`);
      }

      console.log('✅ Customer record created successfully:', data);

      // Update customer_numbers table status to 'registered'
      processStatus = 'Activating your loyalty card...';
      const { error: updateError } = await supabase
        .from('customer_numbers')
        .update({
          status: 'registered',
          uploaded_at: new Date().toISOString()
        })
        .eq('customer', mobile);

      if (updateError) {
        console.warn('Failed to update customer_numbers status:', updateError);
      }
      
      processStatus = 'Finalizing registration...';
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Registration success
      const userData = {
        mobile: mobile,
        name: String(fullName || '').trim(),
        email: String(place || '').trim(),
        loginTime: new Date().toISOString()
      };

      loginCustomer(userData);
      
      currentStep = 'success';
      showProcessStatus = false;
      
      setTimeout(() => {
        goto('/dashboard');
      }, 1500);
      
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      
      if (err.message?.includes('duplicate key')) {
        error = 'This mobile number is already registered. Please try logging in instead.';
      } else {
        error = `Registration failed: ${err.message || 'Unknown error. Please try again.'}`;
      }
      
      showProcessStatus = false;
    } finally {
      isLoading = false;
    }
  }

  // Terms and conditions accordion
  let showTerms = false;
  let showContactInfo = false;
  
  // Dynamic terms content from admin
  let currentTermsContent: TermsData | null = null;
  let formattedTerms: Array<{title: string, content: string}> = [];
  
  // Dynamic WhatsApp support link
  let whatsappSupportLink = 'https://wa.me/966112345678'; // fallback
  
  // Easter egg: admin access via smiley clicks
  let smileyClickCount = 0;

  const translations = {
    en: {
      title: 'Urban Market Loyalty',
      mobileNumber: 'Mobile Number',
      mobilePlaceholder: '05XXXXXXXX',
      checkEligibility: 'Check Eligibility',
      loading: 'Checking...',
      registrationForm: 'Complete Your Registration',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      place: 'Place / Area',
      placePlaceholder: 'Enter your area or city',
      nearestBranch: 'Select Nearest Branch',
      selectBranch: 'Choose your preferred branch',
      createCard: 'Create My Card',
      enterPassword: 'Enter Password',
      confirmPassword: 'Confirm Password',
      passwordPlaceholder: 'Enter a secure password (min 6 characters)',
      confirmPasswordPlaceholder: 'Re-enter your password',
      securityVerification: 'Security Verification',
      solveMath: 'Solve this math problem:',
      captchaPlaceholder: 'Enter your answer',
      refreshCaptcha: '🔄 New Question',
      termsCheckbox: 'I have read and agree to the',
      termsAndConditions: 'Terms & Conditions',
      welcomeBack: 'Welcome Back!',
      enterYourPassword: 'Enter your password to continue',
      loginButton: 'Login to Dashboard',
      success: 'Registration Successful!',
      successMessage: 'Your loyalty card has been created successfully.',
      goToDashboard: 'Go to Dashboard',
      backToCheck: 'Back to Check',
      contactUs: 'Contact Us',
      needHelp: 'Need help? Contact our support team',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      chatWhatsApp: 'Chat on WhatsApp',
      readTerms: 'Read Terms',
      needHelpLogin: 'Need help with login?',
      termsAndConditionsTitle: 'Terms and Conditions',
      loadingTerms: 'Loading terms...',
      enterPasswordPlaceholder: 'Enter your password'
    },
    ar: {
      title: 'برنامج ولاء ايربن ماركت',
      mobileNumber: 'رقم الجوال',
      mobilePlaceholder: '05XXXXXXXX',
      checkEligibility: 'تحقق من الأهلية',
      loading: 'جاري التحقق...',
      registrationForm: 'أكمل تسجيلك',
      fullName: 'الاسم الكامل',
      fullNamePlaceholder: 'أدخل اسمك الكامل',
      place: 'المكان / المنطقة',
      placePlaceholder: 'أدخل منطقتك أو مدينتك',
      nearestBranch: 'اختر أقرب فرع',
      selectBranch: 'اختر الفرع المفضل لديك',
      createCard: 'إنشاء بطاقتي',
      enterPassword: 'أدخل كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة مرور آمنة (6 أحرف على الأقل)',
      confirmPasswordPlaceholder: 'أعد إدخال كلمة المرور',
      securityVerification: 'التحقق الأمني',
      solveMath: 'حل هذه المسألة الرياضية:',
      captchaPlaceholder: 'أدخل إجابتك',
      refreshCaptcha: '🔄 سؤال جديد',
      termsCheckbox: 'لقد قرأت ووافقت على',
      termsAndConditions: 'الشروط والأحكام',
      welcomeBack: 'مرحباً بعودتك!',
      enterYourPassword: 'أدخل كلمة المرور للمتابعة',
      loginButton: 'تسجيل الدخول للوحة التحكم',
      success: 'تم التسجيل بنجاح!',
      successMessage: 'تم إنشاء بطاقة الولاء الخاصة بك بنجاح.',
      goToDashboard: 'اذهب إلى لوحة التحكم',
      backToCheck: 'العودة للتحقق',
      contactUs: 'اتصل بنا',
      needHelp: 'تحتاج مساعدة؟ اتصل بفريق الدعم',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني',
      address: 'العنوان',
      chatWhatsApp: 'محادثة واتساب',
      readTerms: 'اقرأ الشروط',
      needHelpLogin: 'تحتاج مساعدة في تسجيل الدخول؟',
      termsAndConditionsTitle: 'الشروط والأحكام',
      loadingTerms: 'جارٍ تحميل الشروط...',
      enterPasswordPlaceholder: 'أدخل كلمة المرور'
    }
  };

  $: t = translations[currentLang];
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50 flex items-center justify-center p-4" dir="{currentLang === 'ar' ? 'rtl' : 'ltr'}">
  <div class="w-full max-w-md">
    
    <!-- Main Card -->
    <div class="bg-white rounded-3xl shadow-2xl p-8 transform transition-all duration-700 delay-200" class:translate-y-0={pageLoaded} class:translate-y-4={!pageLoaded} class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded}>
      
      <!-- Language Toggle - Top Right Corner -->
      <div class="flex justify-end mb-6">
        <div class="flex bg-gray-100 rounded-full p-1 shadow-sm">
          <button
            type="button"
            on:click={() => currentLang = 'en'}
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 {currentLang === 'en' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'}"
          >
            EN
          </button>
          <button
            type="button"
            on:click={() => currentLang = 'ar'}
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 {currentLang === 'ar' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'}"
          >
            ع
          </button>
        </div>
      </div>

      <!-- Logo and Header -->
      <div class="text-center mb-10">
        <!-- Original Arabic Logo -->
        <div class="mb-6">
          <img src="/logo.png" alt="Urban Market Logo" class="mx-auto h-24 w-auto mb-6" />
        </div>
        
        <h1 class="text-3xl font-bold text-gray-800 mb-3 tracking-tight">{t.title}</h1>
      </div>

      <!-- Step 1: Check Eligibility -->
      {#if currentStep === 'check'}
        <form on:submit|preventDefault={checkEligibility} class="space-y-8">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-4">{t.mobileNumber}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-4">
                <span class="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-full">SA +966</span>
              </div>
              <input
                bind:this={mobileInput}
                type="tel"
                placeholder={t.mobilePlaceholder}
                bind:value={mobile}
                on:input={handleMobileInput}
                class="w-full pl-24 pr-4 py-5 border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all duration-200 text-lg shadow-sm"
                maxlength="10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValidMobile || isLoading}
            class="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-5 px-6 rounded-3xl font-semibold focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            {#if isLoading}
              <span class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {processStatus || t.loading}
              </span>
            {:else}
              {t.checkEligibility} →
            {/if}
          </button>
        </form>
        
        <!-- Support Section - Enhanced with icons -->
        <div class="mt-10 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl border border-green-100 transform transition-all duration-500 delay-700" class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded} class:translate-y-2={!pageLoaded}>
          <div class="flex items-center gap-3 text-green-700 mb-4">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="font-semibold text-base">{t.needHelpLogin}</span>
          </div>
          
          <a href={whatsappSupportLink} target="_blank" class="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-5 rounded-2xl font-semibold text-center mb-3 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">
            <div class="flex items-center justify-center gap-3">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              <span>{t.chatWhatsApp}</span>
            </div>
          </a>
          
          <button
            type="button"
            on:click={() => showTerms = !showTerms}
            class="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-5 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <div class="flex items-center justify-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>{t.readTerms}</span>
            </div>
          </button>
          
          <!-- Terms Accordion -->
          {#if showTerms}
            <div class="mt-5 p-5 border-2 border-green-200 rounded-3xl text-sm text-gray-700 max-h-64 overflow-y-auto bg-white shadow-inner">
              {#if currentTermsContent}
                <h4 class="font-bold text-green-800 mb-4 text-center text-base">{currentTermsContent[currentLang]?.title || t.termsAndConditionsTitle}</h4>
                <div class="space-y-3">
                  {#each formattedTerms as term}
                    <p class="leading-relaxed"><strong class="text-green-700">{term.title}:</strong> {term.content}</p>
                  {/each}
                </div>
              {:else}
                <!-- Loading state -->
                <h4 class="font-bold text-green-800 mb-4 text-center text-base">{t.termsAndConditionsTitle}</h4>
                <p class="text-center text-gray-500">{t.loadingTerms}</p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Step 2: Registration Form -->
      {#if currentStep === 'register'}
        <div>
          <h2 class="text-3xl font-bold text-center text-gray-800 mb-8">{t.registrationForm}</h2>
          
          <form on:submit|preventDefault={completeRegistration} class="space-y-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">{t.fullName}</label>
              <input
                bind:value={fullName}
                type="text"
                placeholder={t.fullNamePlaceholder}
                class="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all duration-200 shadow-sm"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">{t.place}</label>
              <input
                bind:value={place}
                type="text"
                placeholder={t.placePlaceholder}
                class="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all duration-200 shadow-sm"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">{t.nearestBranch}</label>
              <select
                bind:value={selectedBranch}
                class="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all duration-200 shadow-sm"
                required
              >
                <option value="">{t.selectBranch}</option>
                {#each branches as branch}
                  <option value={branch.id}>
                    {currentLang === 'ar' ? branch.nameAr : branch.name}
                  </option>
                {/each}
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">{t.enterPassword}</label>
              <input
                bind:value={password}
                type="password"
                placeholder={t.passwordPlaceholder}
                class="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all duration-200 shadow-sm"
                minlength="6"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">{t.confirmPassword}</label>
              <input
                bind:value={confirmPassword}
                type="password"
                placeholder={t.confirmPasswordPlaceholder}
                class="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all duration-200 shadow-sm"
                required
              />
            </div>

            <!-- Captcha -->
            <div class="p-6 rounded-2xl bg-black/5 backdrop-blur-sm border border-white/20">
              <label class="block text-sm font-medium text-gray-800 mb-4 flex items-center gap-2">
                <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                {t.securityVerification}
              </label>
              <div class="flex items-center gap-4">
                <div class="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-mono text-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-200">
                  {captchaQuestion}
                </div>
                <span class="text-gray-400 text-xl font-light">=</span>
                <input
                  bind:value={userCaptchaAnswer}
                  type="number"
                  placeholder="?"
                  class="w-20 h-12 text-center border-0 border-b-2 border-gray-300 bg-transparent focus:border-cyan-500 focus:outline-none transition-all duration-200 text-lg font-mono"
                  required
                />
                <button
                  type="button"
                  on:click={generateCaptcha}
                  class="ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-cyan-100 text-gray-600 hover:text-cyan-600 transition-all duration-200 group"
                  title="Generate new question"
                >
                  <svg class="w-4 h-4 transform group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="space-y-4">
              <div class="flex items-start space-x-4">
                <input
                  bind:checked={termsAccepted}
                  type="checkbox"
                  class="mt-1 h-5 w-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500 transition-all duration-200"
                  required
                />
                <label class="text-sm text-gray-700 leading-relaxed">
                  {t.termsCheckbox} 
                  <button
                    type="button"
                    on:click={() => showTerms = !showTerms}
                    class="text-orange-500 font-semibold underline ml-1 hover:text-orange-600 transition-colors duration-200"
                  >
                    {t.termsAndConditions}
                  </button>
                </label>
              </div>

              <!-- Terms Accordion -->
              {#if showTerms}
                <div class="mt-4 p-5 border-2 border-green-200 rounded-3xl text-sm text-gray-700 max-h-48 overflow-y-auto bg-white shadow-inner">
                  {#if currentTermsContent}
                    <h4 class="font-bold text-green-800 mb-4 text-base">{currentTermsContent[currentLang]?.title || t.termsAndConditionsTitle}</h4>
                    <div class="space-y-3">
                      {#each formattedTerms.slice(0, 8) as term}
                        <p class="leading-relaxed"><strong class="text-green-700">{term.title}:</strong> {term.content}</p>
                      {/each}
                    </div>
                  {:else}
                    <h4 class="font-bold text-green-800 mb-4 text-base">{t.termsAndConditionsTitle}</h4>
                    <p class="text-center text-gray-500">{t.loadingTerms}</p>
                  {/if}
                </div>
              {/if}
            </div>

            <button
              type="submit"
              disabled={!termsAccepted || isLoading || !isValidCaptcha}
              class="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-5 px-6 rounded-3xl font-semibold focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg mt-8"
            >
              {#if isLoading}
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {processStatus}
                </span>
              {:else}
                {t.createCard}
              {/if}
            </button>

            <button
              type="button"
              on:click={() => currentStep = 'check'}
              class="w-full mt-4 text-gray-500 hover:text-gray-700 font-semibold py-3 transition-all duration-200 hover:bg-gray-50 rounded-2xl"
            >
              ← {t.backToCheck}
            </button>
          </form>
        </div>
      {/if}

      <!-- Step 3: Login for Existing Customers -->
      {#if currentStep === 'login'}
        <div>
          <h2 class="text-3xl font-bold text-center text-gray-800 mb-6">{t.welcomeBack}</h2>
          <p class="text-center text-gray-400 mb-8 font-light">{t.enterYourPassword}</p>
          
          <form on:submit|preventDefault={loginExistingCustomer} class="space-y-8">
            <div>
              <input
                bind:value={loginPassword}
                type="password"
                placeholder={t.enterPasswordPlaceholder}
                class="w-full px-5 py-5 border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all duration-200 text-lg shadow-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              class="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-5 px-6 rounded-3xl font-semibold focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {t.loginButton}
            </button>

            <button
              type="button"
              on:click={() => currentStep = 'check'}
              class="w-full text-gray-500 hover:text-gray-700 font-semibold py-3 transition-all duration-200 hover:bg-gray-50 rounded-2xl"
            >
              ← {t.backToCheck}
            </button>
          </form>
        </div>
      {/if}

      <!-- Step 4: Success -->
      {#if currentStep === 'success'}
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 mb-6">
            <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-800 mb-4">{t.success}</h2>
          <p class="text-gray-500 mb-8 font-light leading-relaxed">{t.successMessage}</p>
          <button
            on:click={() => goto('/dashboard')}
            class="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-5 px-8 rounded-3xl font-semibold focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            {t.goToDashboard}
          </button>
        </div>
      {/if}

      <!-- Error Display -->
      {#if error}
        <div class="mt-6 p-5 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-2xl shadow-sm">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <p class="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      {/if}

      <!-- Progress Status -->
      {#if showProcessStatus && processStatus}
        <div class="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl shadow-sm">
          <div class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-orange-700 text-sm font-semibold text-center">{processStatus}</p>
          </div>
        </div>
      {/if}

    </div>

    <!-- Footer -->
    <div class="text-center mt-8 transform transition-all duration-500 delay-300" class:translate-y-0={pageLoaded} class:translate-y-4={!pageLoaded} class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded}>
      <div class="flex justify-center items-center gap-1">
        <span 
          class="text-3xl cursor-pointer hover:scale-125 transition-transform duration-300 select-none {smileyClickCount >= 5 ? 'animate-pulse' : ''} {smileyClickCount >= 8 ? 'text-orange-500' : ''}"
          on:click={handleSmileyClick}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && handleSmileyClick()}
          title={smileyClickCount > 0 ? `${smileyClickCount}/10 clicks` : '😊'}
        >
          {#if smileyClickCount >= 9}
            😈
          {:else if smileyClickCount >= 7}
            😏
          {:else if smileyClickCount >= 5}
            🤔
          {:else}
            😊
          {/if}
        </span>
      </div>
    </div>
  </div>
</div>
