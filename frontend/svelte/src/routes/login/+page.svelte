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
      refreshCaptcha: '↻ New Question',
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
      refreshCaptcha: '↻ سؤال جديد',
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

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden" dir="{currentLang === 'ar' ? 'rtl' : 'ltr'}">
  <!-- Animated Background -->
  <div class="absolute inset-0">
    <!-- Animated grid -->
    <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-600/20 to-orange-500/10"></div>
    <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, rgba(14, 165, 233, 0.3) 1px, transparent 0); background-size: 40px 40px;"></div>
    
    <!-- Floating particles -->
    <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-70"></div>
    <div class="absolute top-3/4 right-1/4 w-1 h-1 bg-orange-400 rounded-full animate-ping opacity-50"></div>
    <div class="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce opacity-60"></div>
    <div class="absolute top-1/3 right-1/3 w-1 h-1 bg-green-400 rounded-full animate-pulse opacity-40"></div>
  </div>
  
  <div class="w-full max-w-md relative z-10">
    
    <!-- Main Card with Glassmorphism -->
    <div class="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 transform transition-all duration-700 delay-200 relative overflow-hidden" class:translate-y-0={pageLoaded} class:translate-y-4={!pageLoaded} class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded}>
      
      <!-- Neon glow effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-transparent to-orange-400/20 rounded-3xl blur-xl opacity-50"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-purple-400/10 to-transparent rounded-3xl"></div>
      
      <!-- Language Toggle - Futuristic Design -->
      <div class="flex justify-end mb-6 relative z-10">
        <div class="flex bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-full p-1 shadow-xl">
          <button
            type="button"
            on:click={() => currentLang = 'en'}
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 relative {currentLang === 'en' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/50' : 'text-cyan-300 hover:text-white hover:bg-white/10'}"
          >
            {#if currentLang === 'en'}
              <div class="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 blur opacity-50"></div>
            {/if}
            <span class="relative">EN</span>
          </button>
          <button
            type="button"
            on:click={() => currentLang = 'ar'}
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 relative {currentLang === 'ar' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/50' : 'text-cyan-300 hover:text-white hover:bg-white/10'}"
          >
            {#if currentLang === 'ar'}
              <div class="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 blur opacity-50"></div>
            {/if}
            <span class="relative">ع</span>
          </button>
        </div>
      </div>

      <!-- Logo and Header - Futuristic -->
      <div class="text-center mb-10 relative z-10">
        <!-- Logo with Neon Effect -->
        <div class="mb-6 relative">
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-400/50 to-orange-400/50 rounded-full blur-lg opacity-60"></div>
          <img src="/logo.png" alt="Urban Market Logo" class="mx-auto h-24 w-auto mb-6 relative z-10 drop-shadow-2xl" style="filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.5));" />
        </div>
        
        <h1 class="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-white to-orange-300 bg-clip-text text-transparent mb-3 tracking-tight relative">
          <div class="absolute inset-0 blur-sm bg-gradient-to-r from-cyan-300 via-white to-orange-300 bg-clip-text text-transparent opacity-50">{t.title}</div>
          <span class="relative">{t.title}</span>
        </h1>
      </div>

      <!-- Step 1: Check Eligibility - Futuristic -->
      {#if currentStep === 'check'}
        <form on:submit|preventDefault={checkEligibility} class="space-y-8 relative z-10">
          <div>
            <label for="mobile-input" class="block text-sm font-semibold text-cyan-300 mb-4 tracking-wide">{t.mobileNumber}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-4">
                <span class="text-cyan-400 text-sm bg-black/40 backdrop-blur-sm border border-cyan-500/30 px-3 py-1.5 rounded-full font-mono">SA +966</span>
              </div>
              <input
                id="mobile-input"
                bind:this={mobileInput}
                type="tel"
                placeholder={t.mobilePlaceholder}
                bind:value={mobile}
                on:input={handleMobileInput}
                class="w-full pl-28 pr-4 py-5 bg-black/20 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/25 focus:outline-none transition-all duration-300 text-lg text-white placeholder-gray-400 font-mono"
                style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);"
                maxlength="10"
              />
              <!-- Input glow effect -->
              <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/10 to-orange-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValidMobile || isLoading}
            class="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 hover:from-cyan-400 hover:via-purple-400 hover:to-orange-400 text-white py-5 px-6 rounded-2xl font-semibold focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl relative overflow-hidden"
          >
            <!-- Button glow effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-400/50 via-purple-400/50 to-orange-400/50 blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <span class="relative z-10">
              {#if isLoading}
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {processStatus || t.loading}
                </span>
              {:else}
                <span class="flex items-center justify-center gap-2">
                  <span>{t.checkEligibility}</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </span>
              {/if}
            </span>
          </button>
        </form>
        
        <!-- Support Section - Futuristic -->
        <div class="mt-10 p-6 bg-black/30 backdrop-blur-md border border-green-500/30 rounded-3xl transform transition-all duration-500 delay-700 relative overflow-hidden" class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded} class:translate-y-2={!pageLoaded}>
          <!-- Animated background -->
          <div class="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl"></div>
          
          <div class="flex items-center gap-3 text-green-300 mb-4 relative z-10">
            <div class="relative">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30"></div>
            </div>
            <span class="font-semibold text-base tracking-wide">{t.needHelpLogin}</span>
          </div>
          
          <a href={whatsappSupportLink} target="_blank" class="block w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 hover:from-green-500 hover:via-emerald-500 hover:to-green-400 text-white py-4 px-5 rounded-2xl font-semibold text-center mb-3 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl relative overflow-hidden">
            <!-- Button glow -->
            <div class="absolute inset-0 bg-gradient-to-r from-green-400/50 via-emerald-400/50 to-green-400/50 blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div class="flex items-center justify-center gap-3 relative z-10">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              <span>{t.chatWhatsApp}</span>
            </div>
          </a>
          
          <button
            type="button"
            on:click={() => showTerms = !showTerms}
            class="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 hover:from-green-500 hover:via-emerald-500 hover:to-green-400 text-white py-4 px-5 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl relative overflow-hidden"
          >
            <!-- Button glow -->
            <div class="absolute inset-0 bg-gradient-to-r from-green-400/50 via-emerald-400/50 to-green-400/50 blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div class="flex items-center justify-center gap-3 relative z-10">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>{t.readTerms}</span>
            </div>
          </button>
          
          <!-- Terms Accordion - Futuristic -->
          {#if showTerms}
            <div class="mt-5 p-5 bg-black/40 backdrop-blur-md border-2 border-green-500/30 rounded-3xl text-sm text-green-100 max-h-64 overflow-y-auto shadow-2xl relative">
              <div class="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent rounded-3xl"></div>
              <div class="relative z-10">
                {#if currentTermsContent}
                  <h4 class="font-bold text-green-300 mb-4 text-center text-base tracking-wide">{currentTermsContent[currentLang]?.title || t.termsAndConditionsTitle}</h4>
                  <div class="space-y-3">
                    {#each formattedTerms as term}
                      <p class="leading-relaxed"><strong class="text-green-400">{term.title}:</strong> <span class="text-gray-300">{term.content}</span></p>
                    {/each}
                  </div>
                {:else}
                  <h4 class="font-bold text-green-300 mb-4 text-center text-base tracking-wide">{t.termsAndConditionsTitle}</h4>
                  <p class="text-center text-gray-400">{t.loadingTerms}</p>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Step 2: Registration Form - Futuristic -->
      {#if currentStep === 'register'}
        <div class="relative z-10">
          <h2 class="text-3xl font-bold text-center bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent mb-8 tracking-wide">{t.registrationForm}</h2>
          
          <form on:submit|preventDefault={completeRegistration} class="space-y-6">
            <div>
              <label for="fullname-input" class="block text-sm font-semibold text-cyan-300 mb-3 tracking-wide">{t.fullName}</label>
              <input
                id="fullname-input"
                bind:value={fullName}
                type="text"
                placeholder={t.fullNamePlaceholder}
                class="w-full px-5 py-4 bg-black/20 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/25 focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
                style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);"
                required
              />
            </div>

            <div>
              <label for="place-input" class="block text-sm font-semibold text-cyan-300 mb-3 tracking-wide">{t.place}</label>
              <input
                id="place-input"
                bind:value={place}
                type="text"
                placeholder={t.placePlaceholder}
                class="w-full px-5 py-4 bg-black/20 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/25 focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
                style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);"
                required
              />
            </div>

            <div>
              <label for="branch-select" class="block text-sm font-semibold text-cyan-300 mb-3 tracking-wide">{t.nearestBranch}</label>
              <select
                id="branch-select"
                bind:value={selectedBranch}
                class="w-full px-5 py-4 bg-black/20 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/25 focus:outline-none transition-all duration-300 text-white"
                style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);"
                required
              >
                <option value="" class="bg-gray-800 text-gray-300">{t.selectBranch}</option>
                {#each branches as branch}
                  <option value={branch.id} class="bg-gray-800 text-white">
                    {currentLang === 'ar' ? branch.nameAr : branch.name}
                  </option>
                {/each}
              </select>
            </div>

            <div>
              <label for="password-input" class="block text-sm font-semibold text-cyan-300 mb-3 tracking-wide">{t.enterPassword}</label>
              <input
                id="password-input"
                bind:value={password}
                type="password"
                placeholder={t.passwordPlaceholder}
                class="w-full px-5 py-4 bg-black/20 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/25 focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
                style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);"
                minlength="6"
                required
              />
            </div>

            <div>
              <label for="confirm-password-input" class="block text-sm font-semibold text-cyan-300 mb-3 tracking-wide">{t.confirmPassword}</label>
              <input
                id="confirm-password-input"
                bind:value={confirmPassword}
                type="password"
                placeholder={t.confirmPasswordPlaceholder}
                class="w-full px-5 py-4 bg-black/20 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/25 focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
                style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);"
                required
              />
            </div>

            <!-- Captcha - Futuristic -->
            <div class="p-6 rounded-2xl bg-black/30 backdrop-blur-md border border-cyan-500/30 relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5"></div>
              <label for="captcha-input" class="block text-sm font-medium text-cyan-300 mb-4 flex items-center gap-2 relative z-10">
                <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                <span class="tracking-wide">{t.securityVerification}</span>
              </label>
              <div class="flex items-center gap-4 relative z-10">
                <div class="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-xl font-mono text-lg font-bold shadow-xl relative overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-purple-400/30 blur-lg"></div>
                  <span class="relative">{captchaQuestion}</span>
                </div>
                <span class="text-cyan-300 text-xl font-light">=</span>
                <input
                  id="captcha-input"
                  bind:value={userCaptchaAnswer}
                  type="number"
                  placeholder="?"
                  class="w-20 h-12 text-center bg-black/30 border-0 border-b-2 border-cyan-500/30 focus:border-cyan-400 focus:outline-none transition-all duration-300 text-lg font-mono text-white"
                  required
                />
                <button
                  type="button"
                  on:click={generateCaptcha}
                  class="ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-all duration-300 group backdrop-blur-sm border border-cyan-500/20"
                  aria-label="Generate new captcha question"
                  title="Generate new question"
                >
                  <svg class="w-4 h-4 transform group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Terms and Conditions - Futuristic -->
            <div class="space-y-4">
              <div class="flex items-start space-x-4">
                <input
                  bind:checked={termsAccepted}
                  type="checkbox"
                  class="mt-1 h-5 w-5 text-cyan-400 bg-black/20 border-2 border-cyan-500/30 rounded focus:ring-cyan-500/50 focus:ring-2 transition-all duration-200"
                  required
                />
                <label class="text-sm text-cyan-200 leading-relaxed">
                  {t.termsCheckbox} 
                  <button
                    type="button"
                    on:click={() => showTerms = !showTerms}
                    class="text-orange-400 font-semibold underline ml-1 hover:text-orange-300 transition-colors duration-200"
                  >
                    {t.termsAndConditions}
                  </button>
                </label>
              </div>

              <!-- Terms Accordion - Futuristic -->
              {#if showTerms}
                <div class="mt-4 p-5 bg-black/40 backdrop-blur-md border-2 border-cyan-500/30 rounded-3xl text-sm text-cyan-100 max-h-48 overflow-y-auto shadow-2xl relative">
                  <div class="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-3xl"></div>
                  <div class="relative z-10">
                    {#if currentTermsContent}
                      <h4 class="font-bold text-cyan-300 mb-4 text-base tracking-wide">{currentTermsContent[currentLang]?.title || t.termsAndConditionsTitle}</h4>
                      <div class="space-y-3">
                        {#each formattedTerms.slice(0, 8) as term}
                          <p class="leading-relaxed"><strong class="text-cyan-400">{term.title}:</strong> <span class="text-gray-300">{term.content}</span></p>
                        {/each}
                      </div>
                    {:else}
                      <h4 class="font-bold text-cyan-300 mb-4 text-base tracking-wide">{t.termsAndConditionsTitle}</h4>
                      <p class="text-center text-gray-400">{t.loadingTerms}</p>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>

            <button
              type="submit"
              disabled={!termsAccepted || isLoading || !isValidCaptcha}
              class="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-500 hover:from-green-500 hover:via-emerald-500 hover:to-teal-400 text-white py-5 px-6 rounded-2xl font-semibold focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl mt-8 relative overflow-hidden"
            >
              <!-- Button glow -->
              <div class="absolute inset-0 bg-gradient-to-r from-green-400/50 via-emerald-400/50 to-teal-400/50 blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span class="relative z-10">
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
              </span>
            </button>

            <button
              type="button"
              on:click={() => currentStep = 'check'}
              class="w-full mt-4 text-cyan-300 hover:text-white font-semibold py-3 transition-all duration-300 hover:bg-white/10 rounded-2xl backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/40"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                <span>{t.backToCheck}</span>
              </span>
            </button>
          </form>
        </div>
      {/if}

      <!-- Step 3: Login for Existing Customers - Futuristic -->
      {#if currentStep === 'login'}
        <div class="relative z-10">
          <h2 class="text-3xl font-bold text-center bg-gradient-to-r from-cyan-300 via-white to-orange-300 bg-clip-text text-transparent mb-6 tracking-wide">{t.welcomeBack}</h2>
          <p class="text-center text-cyan-200 mb-8 font-light tracking-wide">{t.enterYourPassword}</p>
          
          <form on:submit|preventDefault={loginExistingCustomer} class="space-y-8">
            <div>
              <input
                bind:value={loginPassword}
                type="password"
                placeholder={t.enterPasswordPlaceholder}
                class="w-full px-5 py-5 bg-black/20 backdrop-blur-sm border-2 border-orange-500/30 rounded-2xl focus:border-orange-400 focus:shadow-lg focus:shadow-orange-500/25 focus:outline-none transition-all duration-300 text-lg text-white placeholder-gray-400"
                style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              class="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-400 hover:via-red-400 hover:to-pink-400 text-white py-5 px-6 rounded-2xl font-semibold focus:outline-none focus:ring-4 focus:ring-orange-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl relative overflow-hidden"
            >
              <!-- Button glow -->
              <div class="absolute inset-0 bg-gradient-to-r from-orange-400/50 via-red-400/50 to-pink-400/50 blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span class="relative z-10">{t.loginButton}</span>
            </button>

            <button
              type="button"
              on:click={() => currentStep = 'check'}
              class="w-full text-cyan-300 hover:text-white font-semibold py-3 transition-all duration-300 hover:bg-white/10 rounded-2xl backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/40"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                <span>{t.backToCheck}</span>
              </span>
            </button>
          </form>
        </div>
      {/if}

      <!-- Step 4: Success - Futuristic -->
      {#if currentStep === 'success'}
        <div class="text-center relative z-10">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-400/30 mb-6 relative">
            <!-- Success glow -->
            <div class="absolute inset-0 bg-gradient-to-r from-green-400/50 to-emerald-400/50 rounded-full blur-lg animate-pulse"></div>
            <svg class="h-8 w-8 text-green-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold bg-gradient-to-r from-green-300 via-white to-emerald-300 bg-clip-text text-transparent mb-4 tracking-wide">{t.success}</h2>
          <p class="text-cyan-200 mb-8 font-light leading-relaxed tracking-wide">{t.successMessage}</p>
          <button
            on:click={() => goto('/dashboard')}
            class="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-500 hover:from-green-500 hover:via-emerald-500 hover:to-teal-400 text-white py-5 px-8 rounded-2xl font-semibold focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl relative overflow-hidden"
          >
            <!-- Button glow -->
            <div class="absolute inset-0 bg-gradient-to-r from-green-400/50 via-emerald-400/50 to-teal-400/50 blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <span class="relative z-10">{t.goToDashboard}</span>
          </button>
        </div>
      {/if}

      <!-- Error Display - Futuristic -->
      {#if error}
        <div class="mt-6 p-5 bg-red-900/30 backdrop-blur-md border border-red-500/30 rounded-2xl shadow-xl relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10"></div>
          <div class="flex items-center relative z-10">
            <div class="relative mr-3">
              <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
              <div class="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-30"></div>
            </div>
            <p class="text-red-200 text-sm font-medium tracking-wide">{error}</p>
          </div>
        </div>
      {/if}

      <!-- Progress Status - Futuristic -->
      {#if showProcessStatus && processStatus}
        <div class="mt-6 p-4 bg-orange-900/30 backdrop-blur-md border border-orange-500/30 rounded-2xl shadow-xl relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10"></div>
          <div class="flex items-center justify-center relative z-10">
            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-orange-200 text-sm font-semibold text-center tracking-wide">{processStatus}</p>
          </div>
        </div>
      {/if}

    </div>

    <!-- Footer -->
    <div class="text-center mt-8 transform transition-all duration-500 delay-300" class:translate-y-0={pageLoaded} class:translate-y-4={!pageLoaded} class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded}>
      <div class="flex justify-center items-center gap-1">
        <span 
          class="text-2xl cursor-pointer hover:scale-125 transition-transform duration-300 select-none {smileyClickCount >= 5 ? 'animate-pulse' : ''} {smileyClickCount >= 8 ? 'text-orange-500' : ''}"
          on:click={handleSmileyClick}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && handleSmileyClick()}
          title={smileyClickCount > 0 ? `${smileyClickCount}/10 clicks` : 'Click me'}
        >
          {#if smileyClickCount >= 9}
            :D
          {:else if smileyClickCount >= 7}
            ;)
          {:else if smileyClickCount >= 5}
            :?
          {:else}
            :)
          {/if}
        </span>
      </div>
    </div>
  </div>
</div>
