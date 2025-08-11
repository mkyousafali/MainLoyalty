<script lang="ts">
  import { goto } from '$app/navigation';
  import { loginCustomer } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { termsStore, formatTermsForLogin, type TermsData } from '$lib/stores/terms';
  import { getGlobalWhatsAppLink } from '$lib/stores/globalSettings';

  let currentLang = 'en' as 'en' | 'ar';
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

  // PWA Installation
  let showPWAInstall = false;
  let deferredPrompt: any = null;
  let isFirstTimeUser = false;

  onMount(() => {
    setTimeout(() => { pageLoaded = true; }, 100);
    setTimeout(() => { if (mobileInput) mobileInput.focus(); }, 600);
    loadBranches();
    generateCaptcha();
    loadTermsContent();
    loadWhatsAppLink();
    checkPWAInstallability();
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

  // PWA Installation Functions
  function checkPWAInstallability() {
    console.log('🔧 Checking PWA installability...');
    
    // Don't show if already dismissed in this session
    if (sessionStorage.getItem('pwaInstallDismissed')) {
      console.log('⏸️ PWA install dismissed in this session');
      return;
    }

    // Check if user is first time (no auth token or previous visits)
    isFirstTimeUser = !localStorage.getItem('hasVisitedBefore');
    console.log('👤 First time user:', isFirstTimeUser);
    
    // Mark as visited
    if (isFirstTimeUser) {
      localStorage.setItem('hasVisitedBefore', 'true');
    }

    // Check if PWA is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone;
    
    console.log('📱 PWA Status:', { isStandalone, isIOS, isInStandaloneMode });
    
    // Don't show install button if already installed
    if (isStandalone || (isIOS && isInStandaloneMode)) {
      console.log('✅ PWA already installed');
      showPWAInstall = false;
      return;
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: any) => {
      console.log('🎯 beforeinstallprompt event fired');
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button for first-time users or after 5 seconds for returning users
      const delay = isFirstTimeUser ? 2000 : 5000;
      console.log(`⏰ Showing PWA install button in ${delay}ms`);
      
      setTimeout(() => { 
        showPWAInstall = true;
        console.log('💫 PWA install button shown');
      }, delay);
    });

    // Hide button after successful installation
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installed successfully');
      showPWAInstall = false;
      deferredPrompt = null;
    });

    // For development and testing - show button even without beforeinstallprompt
    if (typeof window !== 'undefined') {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDev && !window.matchMedia('(display-mode: standalone)').matches) {
        console.log('🔧 Development mode: Forcing PWA install button visibility for testing');
        const delay = isFirstTimeUser ? 3000 : 6000;
        
        setTimeout(() => {
          if (!deferredPrompt && currentStep === 'check') {
            console.log('� Showing PWA install button for development testing');
            showPWAInstall = true;
            // Create a mock deferred prompt for testing
            deferredPrompt = {
              prompt: () => {
                console.log('📝 Mock PWA install prompt - In production, this would show the browser\'s native install dialog');
                alert('PWA Install Mock: In production, this would show the browser\'s native install prompt. Your PWA manifest is properly configured!');
                return Promise.resolve({ outcome: 'accepted' });
              }
            };
          }
        }, delay);
      }
    }
  }

  async function installPWA() {
    console.log('🚀 PWA install button clicked');
    
    if (!deferredPrompt) {
      console.log('❌ No deferred prompt available');
      console.log('💡 Real PWA install only works with HTTPS and when browser supports it');
      console.log('🔧 For testing: deploy to production or use HTTPS tunneling (ngrok, cloudflare tunnel, etc.)');
      return;
    }

    try {
      console.log('📋 Showing real browser PWA install prompt...');
      // Show the native browser install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's choice
      const { outcome } = await deferredPrompt.userChoice;
      console.log('👤 User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('🎉 PWA installation accepted');
      } else {
        console.log('❌ PWA installation dismissed by user');
      }
      
      // Clean up
      deferredPrompt = null;
      showPWAInstall = false;
    } catch (error) {
      console.error('❌ Error during PWA installation:', error);
      // Still hide the button even if there was an error
      showPWAInstall = false;
    }
  }

  function dismissPWAInstall() {
    console.log('⏸️ PWA install dismissed by user');
    showPWAInstall = false;
    // Don't show again for this session
    sessionStorage.setItem('pwaInstallDismissed', 'true');
    console.log('💾 PWA install dismissal saved to session');
  }

  // Debug function for testing real PWA functionality
  function forcePWAInstallButton() {
    console.log('🔧 Checking for real PWA install availability...');
    sessionStorage.removeItem('pwaInstallDismissed');
    
    // Only show if we have a real deferred prompt or can detect PWA support
    if (deferredPrompt) {
      showPWAInstall = true;
      console.log('✅ Real PWA install available - showing button');
    } else {
      console.log('❌ No real PWA install prompt available');
      console.log('💡 This means the browser hasn\'t fired the beforeinstallprompt event yet');
      console.log('🔧 To test real PWA install:');
      console.log('   1. Deploy to production with HTTPS');
      console.log('   2. Use ngrok or similar to serve over HTTPS');
      console.log('   3. Enable PWA testing flags in Chrome (chrome://flags)');
      
      // Show a console message instead of a mock alert
      alert('No real PWA install available. Check console for details on how to test real PWA functionality.');
    }
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

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="{currentLang === 'ar' ? 'rtl' : 'ltr'}">
  <div class="w-full max-w-sm relative">
    
    <!-- Language Toggle -->
    <div class="absolute top-0 right-0 z-10">
      <button
        type="button"
        on:click={() => currentLang = currentLang === 'en' ? 'ar' : 'en'}
        class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl rounded-full px-4 py-2 text-sm font-semibold border border-orange-400 hover:border-orange-500 transition-all duration-300 flex items-center transform hover:scale-105 active:scale-95"
      >
        <span class="tracking-wide">{currentLang === 'en' ? 'العربية' : 'English'}</span>
      </button>
    </div>
    
    <!-- Main Card -->
    <div class="bg-white rounded-3xl shadow-lg p-6 transform transition-all duration-500" class:translate-y-0={pageLoaded} class:translate-y-4={!pageLoaded} class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded}>
      
      <!-- Logo and Header -->
      <div class="text-center mb-6">
        <div class="mb-4">
          <img src="/logo.png" alt="Urban Market Logo" class="w-32 h-24 mx-auto object-contain" />
        </div>
        
        <h1 class="text-xl font-semibold text-gray-800 mb-1">{t.title}</h1>
        <p class="text-gray-500 text-sm">{currentLang === 'en' ? 'Check your eligibility and register' : 'تحقق من أهليتك وسجل'}</p>
      </div>

      <!-- Step 1: Check Eligibility -->
      {#if currentStep === 'check'}
        <form on:submit|preventDefault={checkEligibility} class="space-y-4">
          <div>
            <label for="mobile-input" class="block text-sm font-medium text-gray-700 mb-2 text-left">{t.mobileNumber}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3">
                <span class="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded text-xs font-medium">SA +966</span>
              </div>
              <input
                id="mobile-input"
                bind:this={mobileInput}
                type="tel"
                placeholder={t.mobilePlaceholder}
                bind:value={mobile}
                on:input={handleMobileInput}
                class="w-full pl-24 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-mono"
                maxlength="10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValidMobile || isLoading}
            class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm tracking-wide"
          >
            {#if isLoading}
              <span class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {processStatus || t.loading}
              </span>
            {:else}
              {t.checkEligibility}
            {/if}
          </button>
        </form>
        
        <!-- Support Section -->
        <div class="mt-6 p-4 bg-green-50 rounded-2xl border border-green-200">
          <div class="flex items-center gap-2 text-green-700 mb-3">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="font-medium text-xs">{t.needHelpLogin}</span>
          </div>
          
          <div class="flex justify-center mb-2">
            <a href={whatsappSupportLink} target="_blank" class="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-xs font-medium transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              {t.chatWhatsApp}
            </a>
          </div>
          
          <div class="flex justify-center">
            <button
              type="button"
              on:click={() => showTerms = !showTerms}
              class="text-green-600 hover:text-green-700 text-xs underline font-medium transition-colors"
            >
              {t.readTerms}
            </button>
          </div>
          
          <!-- Terms Accordion -->
          {#if showTerms}
            <div class="mt-3 p-3 bg-white border border-green-200 rounded-lg text-xs text-gray-700 max-h-32 overflow-y-auto">
              {#if currentTermsContent}
                <h4 class="font-semibold text-green-700 mb-2 text-xs">{currentTermsContent[currentLang]?.title || t.termsAndConditionsTitle}</h4>
                <div class="space-y-1">
                  {#each formattedTerms.slice(0, 5) as term}
                    <p class="leading-relaxed text-xs"><strong class="text-green-600">{term.title}:</strong> <span class="text-gray-600">{term.content}</span></p>
                  {/each}
                </div>
              {:else}
                <h4 class="font-semibold text-green-700 mb-2 text-xs">{t.termsAndConditionsTitle}</h4>
                <p class="text-center text-gray-500 text-xs">{t.loadingTerms}</p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Step 2: Registration Form -->
      {#if currentStep === 'register'}
        <div>
          <h2 class="text-xl font-semibold text-center text-gray-800 mb-6">{t.registrationForm}</h2>
          
          <form on:submit|preventDefault={completeRegistration} class="space-y-4">
            <div>
              <label for="fullname-input" class="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
              <input
                id="fullname-input"
                bind:value={fullName}
                type="text"
                placeholder={t.fullNamePlaceholder}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label for="place-input" class="block text-sm font-medium text-gray-700 mb-1">{t.place}</label>
              <input
                id="place-input"
                bind:value={place}
                type="text"
                placeholder={t.placePlaceholder}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label for="branch-select" class="block text-sm font-medium text-gray-700 mb-1">{t.nearestBranch}</label>
              <select
                id="branch-select"
                bind:value={selectedBranch}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                required
              >
                <option value="" class="text-gray-500">{t.selectBranch}</option>
                {#each branches as branch}
                  <option value={branch.id}>
                    {currentLang === 'ar' ? branch.nameAr : branch.name}
                  </option>
                {/each}
              </select>
            </div>

            <div>
              <label for="password-input" class="block text-sm font-medium text-gray-700 mb-1">{t.enterPassword}</label>
              <input
                id="password-input"
                bind:value={password}
                type="password"
                placeholder={t.passwordPlaceholder}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                minlength="6"
                required
              />
            </div>

            <div>
              <label for="confirm-password-input" class="block text-sm font-medium text-gray-700 mb-1">{t.confirmPassword}</label>
              <input
                id="confirm-password-input"
                bind:value={confirmPassword}
                type="password"
                placeholder={t.confirmPasswordPlaceholder}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                required
              />
            </div>

            <!-- Captcha -->
            <div class="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <label for="captcha-input" class="block text-sm font-medium text-gray-700 mb-2">{t.securityVerification}</label>
              <div class="flex items-center gap-3">
                <div class="bg-orange-500 text-white px-3 py-2 rounded font-mono text-sm">
                  {captchaQuestion}
                </div>
                <span class="text-gray-500">=</span>
                <input
                  id="captcha-input"
                  bind:value={userCaptchaAnswer}
                  type="number"
                  placeholder="?"
                  class="w-16 h-8 text-center border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  required
                />
                <button
                  type="button"
                  on:click={generateCaptcha}
                  class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs"
                  title="Generate new question"
                >
                  ↻
                </button>
              </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="flex items-start space-x-2">
              <input
                bind:checked={termsAccepted}
                type="checkbox"
                class="mt-1 h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                required
              />
              <label class="text-xs text-gray-600">
                {t.termsCheckbox} 
                <button
                  type="button"
                  on:click={() => showTerms = !showTerms}
                  class="text-orange-500 font-medium underline ml-1 hover:text-orange-600"
                >
                  {t.termsAndConditions}
                </button>
              </label>
            </div>

            <!-- Terms Accordion -->
            {#if showTerms}
              <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 max-h-32 overflow-y-auto">
                {#if currentTermsContent}
                  <h4 class="font-semibold text-gray-800 mb-2">{currentTermsContent[currentLang]?.title || t.termsAndConditionsTitle}</h4>
                  <div class="space-y-1">
                    {#each formattedTerms.slice(0, 5) as term}
                      <p class="leading-relaxed"><strong>{term.title}:</strong> {term.content}</p>
                    {/each}
                  </div>
                {:else}
                  <h4 class="font-semibold text-gray-800 mb-2">{t.termsAndConditionsTitle}</h4>
                  <p class="text-center text-gray-500">{t.loadingTerms}</p>
                {/if}
              </div>
            {/if}

            <button
              type="submit"
              disabled={!termsAccepted || isLoading || !isValidCaptcha}
              class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {#if isLoading}
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              class="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors text-sm"
            >
              ← {t.backToCheck}
            </button>
          </form>
        </div>
      {/if}

      <!-- Step 3: Login for Existing Customers -->
      {#if currentStep === 'login'}
        <div>
          <h2 class="text-xl font-semibold text-center text-gray-800 mb-4">{t.welcomeBack}</h2>
          <p class="text-center text-gray-600 mb-6 text-sm">{t.enterYourPassword}</p>
          
          <form on:submit|preventDefault={loginExistingCustomer} class="space-y-4">
            <div>
              <input
                bind:value={loginPassword}
                type="password"
                placeholder={t.enterPasswordPlaceholder}
                class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.loginButton}
            </button>

            <button
              type="button"
              on:click={() => currentStep = 'check'}
              class="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors text-sm"
            >
              ← {t.backToCheck}
            </button>
          </form>
        </div>
      {/if}

      <!-- Step 4: Success -->
      {#if currentStep === 'success'}
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-800 mb-2">{t.success}</h2>
          <p class="text-gray-600 mb-6 text-sm">{t.successMessage}</p>
          <button
            on:click={() => goto('/dashboard')}
            class="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            {t.goToDashboard}
          </button>
        </div>
      {/if}

      <!-- Error Display -->
      {#if error}
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <svg class="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <p class="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      {/if}

      <!-- Progress Status -->
      {#if showProcessStatus && processStatus}
        <div class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-orange-700 text-sm font-medium">{processStatus}</p>
          </div>
        </div>
      {/if}

    </div>

    <!-- PWA Install Button -->
    {#if showPWAInstall}
      <div class="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
        <div class="bg-white border border-orange-200 rounded-xl shadow-xl p-4 mx-auto max-w-sm backdrop-blur-sm bg-white/95">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center mb-3">
                <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 text-sm">
                    {currentLang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
                  </h3>
                  <p class="text-xs text-gray-600">
                    {currentLang === 'ar' ? 'للحصول على تجربة أفضل وأسرع' : 'For better & faster experience'}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  on:click={installPWA}
                  id="pwa-install-button"
                  class="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-3 focus:ring-orange-500/50 focus:ring-offset-2 active:scale-[0.98]"
                >
                >
                  {currentLang === 'ar' ? 'تثبيت' : 'Install'}
                </button>
                
                <button
                  on:click={dismissPWAInstall}
                  class="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors focus:outline-none"
                >
                  {currentLang === 'ar' ? 'لاحقاً' : 'Later'}
                </button>
              </div>
            </div>
            
            <button
              on:click={dismissPWAInstall}
              class="ml-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={currentLang === 'ar' ? 'إغلاق' : 'Close'}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Footer -->
    <div class="text-center mt-6 transform transition-all duration-500" class:translate-y-0={pageLoaded} class:translate-y-4={!pageLoaded} class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded}>
      <div class="flex justify-center items-center space-x-4">
        <span 
          class="text-xl cursor-pointer hover:scale-110 transition-transform duration-300 select-none"
          on:click={handleSmileyClick}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && handleSmileyClick()}
        >
          😊
        </span>
        
        <!-- Debug PWA Button (disabled - real PWA functionality only) -->
        <!-- {#if typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')}
          <button
            on:click={forcePWAInstallButton}
            class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title="Test PWA Install (Development Only)"
          >
            📱 Test PWA
          </button>
        {/if} -->
      </div>
    </div>
  </div>
</div>
