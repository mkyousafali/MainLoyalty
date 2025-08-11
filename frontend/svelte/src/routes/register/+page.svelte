<!--
===============================================
🎯 CUSTOMER REGISTRATION PAGE
===============================================
Standalone registration page for new customers
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { loginCustomer } from '$lib/stores/auth';

  // Language support
  let currentLang = 'en' as 'en' | 'ar';

  // State management
  let currentStep = 1; // 1: Mobile Check, 2: Registration Form, 3: Success
  let mobileNumber = '';
  let isLoading = false;
  let error = '';
  let branches: any[] = [];
  let pageLoaded = false;
  let mobileInput: HTMLInputElement;
  
  // Registration form data
  let formData = {
    name: '',
    email: '',
    area: '',
    branch_id: '',
    password: '',
    confirmPassword: ''
  };

  // Captcha for security
  let captchaQuestion = '';
  let captchaAnswer = '';
  let userCaptchaAnswer = '';
  let captchaNumbers = { num1: 0, num2: 0 };
  let termsAccepted = false;

  onMount(() => {
    setTimeout(() => { pageLoaded = true; }, 100);
    setTimeout(() => { if (mobileInput) mobileInput.focus(); }, 600);
    loadBranches();
    generateCaptcha();
  });

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
        .order('name_en');

      if (error) throw error;
      branches = data || [];
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  }

  function formatMobileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    let value = target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    mobileNumber = value;
  }

  $: isValidMobile = mobileNumber.length === 10 && mobileNumber.startsWith('05');
  $: isValidCaptcha = userCaptchaAnswer === captchaAnswer;

  // Mobile number verification
  async function checkEligibility() {
    if (!isValidMobile) {
      error = 'Please enter a valid 10-digit Saudi mobile number starting with 05';
      return;
    }

    isLoading = true;
    error = '';

    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');

      // Check if number is in eligibility list
      const { data: eligibleNumber, error: eligibilityError } = await supabase
        .from('customer_numbers')
        .select('*')
        .eq('customer', cleanMobile)
        .eq('status', 'not_registered')
        .maybeSingle();

      if (eligibilityError && eligibilityError.code !== 'PGRST116') {
        console.error('Eligibility check error:', eligibilityError);
        error = 'Error checking eligibility. Please try again.';
        return;
      }

      if (!eligibleNumber) {
        error = 'This mobile number is not eligible for registration. Please contact support or visit a branch.';
        return;
      }

      // Check if already registered
      const { data: existingCustomer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('mobile', cleanMobile)
        .maybeSingle();

      if (customerError && customerError.code !== 'PGRST116') {
        console.error('Customer check error:', customerError);
        throw customerError;
      }

      if (existingCustomer) {
        error = 'This mobile number is already registered. Please use the login page instead.';
        return;
      }

      // Mobile is eligible, proceed to registration form
      mobileNumber = cleanMobile;
      currentStep = 2;

    } catch (err) {
      console.error('Eligibility check error:', err);
      error = 'An error occurred while checking eligibility. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  // Registration form submission
  async function submitRegistration() {
    // Validation
    if (!formData.name.trim()) {
      error = 'Please enter your full name';
      return;
    }

    if (!formData.area.trim()) {
      error = 'Please enter your area/place';
      return;
    }

    if (!formData.branch_id) {
      error = 'Please select your nearest branch';
      return;
    }

    if (formData.password.length < 6) {
      error = 'Password must be at least 6 characters long';
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (!termsAccepted) {
      error = 'You must accept the Terms & Conditions to proceed';
      return;
    }

    const userAnswer = String(userCaptchaAnswer || '').trim();
    if (userAnswer !== captchaAnswer) {
      error = 'Incorrect captcha answer. Please try again.';
      generateCaptcha();
      return;
    }

    isLoading = true;
    error = '';

    try {
      // Get default card type (Bronze)
      const { data: cardTypes, error: cardError } = await supabase
        .from('card_types')
        .select('id')
        .eq('name_en', 'Bronze')
        .maybeSingle();

      if (cardError) {
        console.error('Card type error:', cardError);
      }

      const defaultCardType = cardTypes?.id || null;

      // Insert customer record
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          customer_code: mobileNumber,
          mobile: mobileNumber,
          phone: mobileNumber,
          name: formData.name.trim(),
          full_name: formData.name.trim(),
          email: formData.email.trim() || null,
          area: formData.area.trim(),
          branch_id: formData.branch_id,
          card_type_id: defaultCardType,
          points: 0,
          total_spent: 0,
          status: 'active',
          card_status: 'registered',
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          registration_date: new Date().toISOString(),
          password_hash: btoa(formData.password) // Simple encoding for demo
        })
        .select()
        .single();

      if (insertError) {
        console.error('Customer insert error:', insertError);
        
        if (insertError.code === '23505') { // Unique constraint violation
          error = 'This mobile number is already registered. Please use the login page.';
        } else if (insertError.code === 'PGRST116') {
          error = 'Invalid data provided. Please check your information and try again.';
        } else {
          error = `Registration failed: ${insertError.message || 'Unknown error'}`;
        }
        return;
      }

      // Update customer_numbers status
      await supabase
        .from('customer_numbers')
        .update({ status: 'registered' })
        .eq('customer', mobileNumber);

      // Auto-login the user
      const userData = {
        mobile: mobileNumber,
        name: formData.name.trim(),
        email: formData.email.trim(),
        loginTime: new Date().toISOString()
      };

      loginCustomer(userData);
      
      currentStep = 3;
      
      // Redirect to dashboard after success
      setTimeout(() => {
        goto('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('duplicate key')) {
        error = 'This mobile number is already registered. Please try logging in instead.';
      } else {
        error = `Registration failed: ${err.message || 'Unknown error. Please try again.'}`;
      }
    } finally {
      isLoading = false;
    }
  }

  function goBack() {
    currentStep = 1;
    error = '';
    formData = {
      name: '',
      email: '',
      area: '',
      branch_id: '',
      password: '',
      confirmPassword: ''
    };
  }

  const translations = {
    en: {
      title: 'Customer Registration',
      subtitle: 'Create your loyalty account',
      mobileNumber: 'Mobile Number',
      mobilePlaceholder: '05XXXXXXXX',
      checkEligibility: 'Check Eligibility',
      loading: 'Checking...',
      registrationForm: 'Complete Your Registration',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      email: 'Email (Optional)',
      emailPlaceholder: 'Enter your email address',
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
      termsCheckbox: 'I have read and agree to the Terms & Conditions',
      success: 'Registration Successful!',
      successMessage: 'Your loyalty account has been created successfully.',
      goToDashboard: 'Go to Dashboard',
      backToCheck: '← Back to Check',
      alreadyHaveAccount: 'Already have an account?',
      loginHere: 'Login here'
    },
    ar: {
      title: 'تسجيل العميل',
      subtitle: 'إنشاء حساب الولاء الخاص بك',
      mobileNumber: 'رقم الجوال',
      mobilePlaceholder: '05XXXXXXXX',
      checkEligibility: 'تحقق من الأهلية',
      loading: 'جاري التحقق...',
      registrationForm: 'أكمل تسجيلك',
      fullName: 'الاسم الكامل',
      fullNamePlaceholder: 'أدخل اسمك الكامل',
      email: 'البريد الإلكتروني (اختياري)',
      emailPlaceholder: 'أدخل عنوان بريدك الإلكتروني',
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
      termsCheckbox: 'لقد قرأت ووافقت على الشروط والأحكام',
      success: 'تم التسجيل بنجاح!',
      successMessage: 'تم إنشاء حساب الولاء الخاص بك بنجاح.',
      goToDashboard: 'اذهب إلى لوحة التحكم',
      backToCheck: '← العودة للتحقق',
      alreadyHaveAccount: 'لديك حساب بالفعل؟',
      loginHere: 'سجل الدخول هنا'
    }
  };

  $: t = translations[currentLang];
</script>

<svelte:head>
  <title>Customer Registration - Urban Market Loyalty</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="{currentLang === 'ar' ? 'rtl' : 'ltr'}">
  <div class="w-full max-w-md relative">
    
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
        
        <h1 class="text-xl font-semibold text-gray-800 mb-1">🎯 {t.title}</h1>
        <p class="text-gray-500 text-sm">{t.subtitle}</p>
      </div>

      <!-- Progress Indicator -->
      <div class="flex items-center justify-center mb-6">
        <div class="flex items-center">
          <div class="flex items-center justify-center w-8 h-8 rounded-full {currentStep >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'} text-sm font-semibold">
            1
          </div>
          <div class="w-12 h-0.5 {currentStep >= 2 ? 'bg-orange-500' : 'bg-gray-200'}"></div>
          <div class="flex items-center justify-center w-8 h-8 rounded-full {currentStep >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'} text-sm font-semibold">
            2
          </div>
          <div class="w-12 h-0.5 {currentStep >= 3 ? 'bg-orange-500' : 'bg-gray-200'}"></div>
          <div class="flex items-center justify-center w-8 h-8 rounded-full {currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'} text-sm font-semibold">
            ✓
          </div>
        </div>
      </div>

      <!-- Step 1: Mobile Number Verification -->
      {#if currentStep === 1}
        <form on:submit|preventDefault={checkEligibility} class="space-y-4">
          <div>
            <label for="mobile-input" class="block text-sm font-medium text-gray-700 mb-2">{t.mobileNumber}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3">
                <span class="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded text-xs font-medium">SA +966</span>
              </div>
              <input
                id="mobile-input"
                bind:this={mobileInput}
                type="tel"
                placeholder={t.mobilePlaceholder}
                bind:value={mobileNumber}
                on:input={formatMobileInput}
                class="w-full pl-24 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-mono"
                maxlength="10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValidMobile || isLoading}
            class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {#if isLoading}
              <span class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.loading}
              </span>
            {:else}
              {t.checkEligibility}
            {/if}
          </button>

          <div class="text-center text-sm text-gray-600 mt-4">
            {t.alreadyHaveAccount}
            <a href="/login" class="text-orange-500 hover:text-orange-600 font-semibold ml-1">{t.loginHere}</a>
          </div>
        </form>
      {/if}

      <!-- Step 2: Registration Form -->
      {#if currentStep === 2}
        <div>
          <h2 class="text-lg font-semibold text-center text-gray-800 mb-6">{t.registrationForm}</h2>
          
          <form on:submit|preventDefault={submitRegistration} class="space-y-4">
            <div>
              <label for="fullname-input" class="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
              <input
                id="fullname-input"
                bind:value={formData.name}
                type="text"
                placeholder={t.fullNamePlaceholder}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label for="email-input" class="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
              <input
                id="email-input"
                bind:value={formData.email}
                type="email"
                placeholder={t.emailPlaceholder}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              />
            </div>

            <div>
              <label for="place-input" class="block text-sm font-medium text-gray-700 mb-1">{t.place}</label>
              <input
                id="place-input"
                bind:value={formData.area}
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
                bind:value={formData.branch_id}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                required
              >
                <option value="" class="text-gray-500">{t.selectBranch}</option>
                {#each branches as branch}
                  <option value={branch.id}>
                    {currentLang === 'ar' ? branch.name_ar : branch.name_en}
                  </option>
                {/each}
              </select>
            </div>

            <div>
              <label for="password-input" class="block text-sm font-medium text-gray-700 mb-1">{t.enterPassword}</label>
              <input
                id="password-input"
                bind:value={formData.password}
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
                bind:value={formData.confirmPassword}
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
              <label class="text-sm text-gray-600">
                {t.termsCheckbox}
              </label>
            </div>

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
                  Creating Account...
                </span>
              {:else}
                {t.createCard}
              {/if}
            </button>

            <button
              type="button"
              on:click={goBack}
              class="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors text-sm"
            >
              {t.backToCheck}
            </button>
          </form>
        </div>
      {/if}

      <!-- Step 3: Success -->
      {#if currentStep === 3}
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-800 mb-2">{t.success}</h2>
          <p class="text-gray-600 mb-6 text-sm">{t.successMessage}</p>
          <div class="space-y-3">
            <button
              on:click={() => goto('/dashboard')}
              class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              {t.goToDashboard}
            </button>
            <p class="text-xs text-gray-500">Redirecting automatically in 2 seconds...</p>
          </div>
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

    </div>
  </div>
</div>
