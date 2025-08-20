<script lang="ts">
  import { goto } from '$app/navigation';
  import { loginCustomer } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { termsStore, formatTermsForLogin, type TermsData } from '$lib/stores/terms';
  import { getGlobalWhatsAppLink } from '$lib/stores/globalSettings';
  import { language, toggleLanguage } from '$lib/stores/language';

  let mobile = '';
  let error = '';
  let isLoading = false;
  let currentStep: 'mobile' | 'password' | 'register' | 'success' = 'mobile';
  let processStatus = '';
  let showProcessStatus = false;
  let pageLoaded = false;
  let mobileInput: HTMLInputElement;
  let showGreenTick = false;
  
  // Login fields
  let loginPassword = '';
  let customerData: any = null;

  // Registration fields (for unregistered customers)
  let regFullName = '';
  let regEmail = '';
  let regArea = '';
  let regBranchId = '';
  let regPassword = '';
  let termsAccepted = false;
  let branches: any[] = [];

  // Terms and conditions
  let currentTermsContent: any = null;
  let formattedTerms = '';

  // WhatsApp support and other features
  let whatsappSupportLink = 'https://wa.me/966500000000'; // Fallback
  let smileyClickCount = 0;

  // Terms modal
  let showTermsModal = false;

  // PWA Installation - Always visible
  let deferredPrompt: any = null;

  onMount(() => {
    setTimeout(() => { pageLoaded = true; }, 100);
    setTimeout(() => { if (mobileInput) mobileInput.focus(); }, 600);
    loadTermsContent();
    loadWhatsAppLink();
    initializePWA();
    loadBranches();
  });

  async function loadTermsContent() {
    // Load terms from the store (now from database)
    await termsStore.loadTerms();
    termsStore.subscribe(termsData => {
      currentTermsContent = termsData;
      // Format terms for the current language (default to English)
      const termsForLang = termsData[$language] || termsData.en;
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

  // PWA Installation Functions - Simplified Always Visible
  function initializePWA() {
    console.log('� Initializing PWA install functionality...');
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: any) => {
      console.log('🎯 beforeinstallprompt event fired');
      e.preventDefault();
      deferredPrompt = e;
    });

    // Reset after successful installation
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installed successfully');
      deferredPrompt = null;
    });

    // For development and testing - create mock prompt
    if (typeof window !== 'undefined') {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDev && !deferredPrompt) {
        setTimeout(() => {
          if (!deferredPrompt) {
            // Create a mock deferred prompt for testing
            deferredPrompt = {
              prompt: () => {
                console.log('📝 Mock PWA install prompt - In production, this would show the browser\'s native install dialog');
                alert('PWA Install Mock: In production, this would show the browser\'s native install prompt. Your PWA manifest is properly configured!');
                return Promise.resolve({ outcome: 'accepted' });
              }
            };
          }
        }, 2000);
      }
    }
  }

  async function installPWA() {
    console.log('🚀 PWA install button clicked');
    
    if (!deferredPrompt) {
      console.log('❌ No deferred prompt available - creating fallback');
      
      // Enhanced iOS detection for iPhone 13 and above
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIOSSafari = isIOS && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOSChrome = isIOS && /CriOS/.test(navigator.userAgent);
      const isIOSFirefox = isIOS && /FxiOS/.test(navigator.userAgent);
      const isIOSEdge = isIOS && /EdgiOS/.test(navigator.userAgent);
      
      // Enhanced iPhone 13+ detection
      const screenWidth = screen.width;
      const screenHeight = screen.height;
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Check iOS version
      const iOSVersion = navigator.userAgent.match(/OS (\d+)_/);
      const majorVersion = iOSVersion ? parseInt(iOSVersion[1], 10) : 0;
      const isModernIOS = majorVersion >= 15; // iPhone 13+ requires iOS 15+
      
      // Detect iPhone 13+ models by screen dimensions
      const isIPhone13Plus = isIOS && (
        (screenWidth === 390 && screenHeight === 844) ||  // iPhone 12/13 mini
        (screenWidth === 393 && screenHeight === 852) ||  // iPhone 14/15
        (screenWidth === 414 && screenHeight === 896) ||  // iPhone 11/XR/12/13/14 Plus
        (screenWidth === 428 && screenHeight === 926) ||  // iPhone 12/13/14/15 Pro Max
        (screenWidth >= 390 && isModernIOS)               // Modern iPhones with iOS 15+
      );
      
      console.log('📱 iPhone 13+ Detection:', {
        isIOS, isIOSSafari, isIOSChrome, screenWidth, screenHeight,
        majorVersion, isModernIOS, isIPhone13Plus, userAgent: navigator.userAgent
      });
      
      if (isIOS) {
        let message = '';
        
        if (isIOSSafari) {
          const deviceInfo = isIPhone13Plus ? 'iPhone 13+' : 'iPhone/iPad';
          message = $language === 'ar' ? 
            `📱 لتثبيت التطبيق على ${deviceInfo}:\n\n` +
            '1️⃣ اضغط على زر المشاركة (⬆️) في أسفل Safari\n' +
            '2️⃣ مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"\n' +
            '3️⃣ اضغط "إضافة" في الزاوية العلوية اليمنى\n' +
            '4️⃣ سيظهر أيقونة التطبيق على الشاشة الرئيسية\n\n' +
            '✨ افتح التطبيق من الشاشة الرئيسية للحصول على تجربة كاملة!' :
            
            `📱 To install the app on ${deviceInfo}:\n\n` +
            '1️⃣ Tap the Share button (⬆️) at the bottom of Safari\n' +
            '2️⃣ Scroll down and select "Add to Home Screen"\n' +
            '3️⃣ Tap "Add" in the top right corner\n' +
            '4️⃣ The app icon will appear on your home screen\n\n' +
            '✨ Open the app from your home screen for the full experience!';
        } else if (isIOSChrome) {
          message = $language === 'ar' ? 
            `📱 لتثبيت التطبيق من Chrome على ${isIPhone13Plus ? 'iPhone 13+' : 'iPhone'}:\n\n` +
            '1️⃣ اضغط على النقاط الثلاث (⋮) في الزاوية العلوية\n' +
            '2️⃣ اختر "إضافة إلى الشاشة الرئيسية"\n' +
            '3️⃣ اضغط "إضافة" للتأكيد\n\n' +
            '💡 نصيحة: افتح الرابط في Safari للحصول على أفضل تجربة تثبيت' :
            
            `📱 To install the app from Chrome on ${isIPhone13Plus ? 'iPhone 13+' : 'iPhone'}:\n\n` +
            '1️⃣ Tap the three dots (⋮) in the top corner\n' +
            '2️⃣ Select "Add to Home Screen"\n' +
            '3️⃣ Tap "Add" to confirm\n\n' +
            '💡 Tip: Open this link in Safari for the best installation experience';
        } else if (isIOSFirefox) {
          message = $language === 'ar' ? 
            '📱 لتثبيت التطبيق من Firefox على iPhone:\n\n' +
            '1️⃣ اضغط على زر المشاركة في شريط الأدوات\n' +
            '2️⃣ اختر "إضافة إلى الشاشة الرئيسية"\n' +
            '3️⃣ اضغط "إضافة"\n\n' +
            '💡 أو افتح الرابط في Safari للحصول على أفضل تجربة' :
            
            '📱 To install the app from Firefox on iPhone:\n\n' +
            '1️⃣ Tap the share button in the toolbar\n' +
            '2️⃣ Select "Add to Home Screen"\n' +
            '3️⃣ Tap "Add"\n\n' +
            '💡 Or open this link in Safari for the best experience';
        } else {
          // Generic iOS instructions
          message = $language === 'ar' ? 
            '📱 لتثبيت التطبيق على iPhone/iPad:\n\n' +
            '🌐 1. افتح هذا الرابط في Safari:\n' + window.location.href + '\n\n' +
            '⬆️ 2. اضغط على زر المشاركة\n' +
            '🏠 3. اختر "إضافة إلى الشاشة الرئيسية"\n' +
            '✅ 4. اضغط "إضافة"\n\n' +
            (isModernIOS ? '✨ متوافق مع iPhone 13 والأحدث!' : '⚠️ قد تحتاج تحديث iOS للحصول على أفضل تجربة') :
            
            '📱 To install the app on iPhone/iPad:\n\n' +
            '🌐 1. Open this link in Safari:\n' + window.location.href + '\n\n' +
            '⬆️ 2. Tap the Share button\n' +
            '🏠 3. Select "Add to Home Screen"\n' +
            '✅ 4. Tap "Add"\n\n' +
            (isModernIOS ? '✨ Compatible with iPhone 13 and newer!' : '⚠️ You may need to update iOS for the best experience');
        }
        
        alert(message);
      } else {
        // Enhanced instructions for other browsers
        const url = window.location.href;
        alert($language === 'ar' ? 
          '📱 لتثبيت التطبيق:\n\n' +
          '1️⃣ اضغط على قائمة المتصفح (⋮)\n' +
          '2️⃣ اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"\n' +
          '3️⃣ اتبع التعليمات\n\n' +
          '💾 أو احفظ هذا الرابط:\n' + url :
          
          '📱 To install the app:\n\n' +
          '1️⃣ Click browser menu (⋮)\n' +
          '2️⃣ Select "Install app" or "Add to Home Screen"\n' +
          '3️⃣ Follow the instructions\n\n' +
          '💾 Or bookmark this URL:\n' + url
        );
      }
      return;
    }

    try {
      console.log('� Showing browser PWA install prompt...');
      // Show the native browser install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's choice
      const { outcome } = await deferredPrompt.userChoice;
      console.log('� User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('🎉 PWA installation accepted');
      } else {
        console.log('❌ PWA installation dismissed by user');
      }
      
      // Clean up
      deferredPrompt = null;
    } catch (error) {
      console.error('❌ Error during PWA installation:', error);
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
    showGreenTick = false; // Reset tick when typing
  }

  $: isValidMobile = mobile.length === 10 && mobile.startsWith('05');

  // Update formatted terms when language changes
  $: if (currentTermsContent) {
    const termsForLang = currentTermsContent[$language] || currentTermsContent.en;
    formattedTerms = formatTermsForLogin(termsForLang, 10);
  }

  async function handleLogin() {
    if (!isValidMobile) {
      error = 'Please enter a valid 10-digit Saudi mobile number starting with 05';
      return;
    }

    error = '';
    isLoading = true;
    processStatus = 'Checking mobile number...';

    try {
      // Step 1: Check if mobile exists in customer_numbers table
      const { data: eligibilityData, error: eligibilityError } = await supabase
        .from('customer_numbers')
        .select('*')
        .eq('customer', mobile)
        .single();
      
      if (eligibilityError || !eligibilityData) {
        error = 'Mobile number not found in our system. Please contact support or visit a branch.';
        isLoading = false;
        return;
      }

      // Show green tick - mobile found in customer_numbers
      showGreenTick = true;
      processStatus = 'Mobile number verified! Checking account status...';

      // Step 2: Check if customer exists in customers table
      const { data: existingCustomer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_code', mobile)
        .single();
      
      if (!customerError && existingCustomer) {
        // Customer exists
        customerData = existingCustomer;
        
        if (existingCustomer.card_status === 'registered') {
          // Fully registered - auto login without password
          processStatus = 'Logging you in...';
          
          const userData = {
            mobile: mobile,
            name: existingCustomer.full_name,
            email: existingCustomer.email,
            loginTime: new Date().toISOString()
          };

          loginCustomer(userData);
          currentStep = 'success';
          
          // Redirect to dashboard
          setTimeout(() => {
            goto('/dashboard');
          }, 1500);
        } else {
          // Unregistered - show registration form to complete details
          // Pre-fill existing data if available
          regFullName = existingCustomer.full_name || existingCustomer.name || '';
          regEmail = existingCustomer.email || '';
          regArea = existingCustomer.area || '';
          regBranchId = existingCustomer.branch_id || '';
          
          currentStep = 'register';
          processStatus = 'Please complete your registration';
        }
      } else {
        // Customer doesn't exist - show registration form to create account
        currentStep = 'register';
        processStatus = 'Please create your account';
      }
      
    } catch (err) {
      console.error('Login check error:', err);
      error = 'An error occurred while checking your account. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function handlePasswordLogin() {
    if (!loginPassword) {
      error = 'Please enter your password';
      return;
    }

    isLoading = true;
    error = '';

    try {
      // Check both plain text and base64 encoded passwords
      const isCorrectPassword = 
        customerData.password === loginPassword ||  // Plain text comparison
        customerData.password === btoa(loginPassword);  // Base64 encoded comparison
        
      if (customerData && isCorrectPassword) {
        // Login successful
        const userData = {
          mobile: mobile,
          name: customerData.full_name,
          email: customerData.email,
          loginTime: new Date().toISOString()
        };

        loginCustomer(userData);
        currentStep = 'success';
        
        // Redirect to dashboard
        setTimeout(() => {
          goto('/dashboard');
        }, 1500);
      } else {
        error = 'Incorrect password. Please try again.';
      }
    } catch (err) {
      error = 'Login failed. Please check your credentials.';
    } finally {
      isLoading = false;
    }
  }

  async function submitRegistration() {
    // Validation
    if (!regFullName.trim()) {
      error = 'Please enter your full name';
      return;
    }

    if (!regArea.trim()) {
      error = 'Please enter your area/place';
      return;
    }

    if (!regBranchId) {
      error = 'Please select your nearest branch';
      return;
    }

    if (regPassword.length < 6) {
      error = 'Password must be at least 6 characters long';
      return;
    }

    if (!termsAccepted) {
      error = 'You must accept the Terms & Conditions to proceed';
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

      // Check if we're updating an existing unregistered customer or creating a new one
      if (customerData && customerData.card_status === 'unregistered') {
        // Update existing unregistered customer
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update({
            name: regFullName.trim(),
            full_name: regFullName.trim(),
            email: regEmail.trim() || null,
            area: regArea.trim(),
            branch_id: regBranchId,
            card_type_id: defaultCardType,
            card_status: 'registered',
            password: regPassword,
            registration_date: new Date().toISOString(),
            valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('customer_code', mobile)
          .select()
          .single();

        if (updateError) {
          console.error('Customer update error:', updateError);
          error = `Registration failed: ${updateError.message || 'Unknown error'}`;
          return;
        }
      } else {
        // Insert new customer record
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({
            customer_code: mobile,
            mobile: mobile,
            phone: mobile,
            name: regFullName.trim(),
            full_name: regFullName.trim(),
            email: regEmail.trim() || null,
            area: regArea.trim(),
            branch_id: regBranchId,
            card_type_id: defaultCardType,
            points: 0,
            total_spent: 0,
            status: 'active',
            card_status: 'registered',
            valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            registration_date: new Date().toISOString(),
            password: regPassword  // Store as plain text to match existing database format
          })
          .select()
          .single();

        if (insertError) {
          console.error('Customer insert error:', insertError);
          
          if (insertError.code === '23505') {
            error = 'This mobile number is already registered. Please use login instead.';
          } else if (insertError.code === 'PGRST116') {
            error = 'Invalid data provided. Please check your information and try again.';
          } else {
            error = `Registration failed: ${insertError.message || 'Unknown error'}`;
          }
          return;
        }
      }

      // Update customer_numbers status
      await supabase
        .from('customer_numbers')
        .update({ status: 'registered' })
        .eq('customer', mobile);

      // Auto-login the user
      const userData = {
        mobile: mobile,
        name: regFullName.trim(),
        email: regEmail.trim(),
        loginTime: new Date().toISOString()
      };

      loginCustomer(userData);
      
      currentStep = 'success';
      
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

  // Terms and conditions accordion
  let showTerms = false;
  let showContactInfo = false;

  const translations = {
    en: {
      title: 'Urban Market Loyalty',
      mobileNumber: 'Mobile Number',
      mobilePlaceholder: '05XXXXXXXX',
      loginButton: 'Login',
      loading: 'Checking...',
      enterPassword: 'Enter Password',
      enterPasswordPlaceholder: 'Enter your password',
      passwordLogin: 'Login to Dashboard',
      success: 'Success!',
      successMessage: 'Welcome to your loyalty account. You\'re now logged in persistently - no need to login again until you manually logout.',
      goToDashboard: 'Go to Dashboard',
      backToMobile: 'Back to Mobile',
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
      // Registration fields for unregistered users
      completeRegistration: 'Complete Your Registration',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      place: 'Place / Area',
      placePlaceholder: 'Enter your area or city',
      nearestBranch: 'Select Nearest Branch',
      selectBranch: 'Choose a branch...',
      password: 'Create Password',
      passwordPlaceholder: 'Enter your password (min 6 characters)',
      acceptTerms: 'I accept the Terms & Conditions',
      registerButton: 'Complete Registration',
      registering: 'Creating Account...'
    },
    ar: {
      title: 'برنامج ولاء ايربن ماركت',
      mobileNumber: 'رقم الجوال',
      mobilePlaceholder: '05XXXXXXXX',
      loginButton: 'تسجيل الدخول',
      loading: 'جاري التحقق...',
      enterPassword: 'أدخل كلمة المرور',
      enterPasswordPlaceholder: 'أدخل كلمة المرور',
      passwordLogin: 'تسجيل الدخول للوحة التحكم',
      success: 'نجح العملية!',
      successMessage: 'مرحباً بك في حساب الولاء الخاص بك. تم تسجيل دخولك بشكل دائم - لن تحتاج لتسجيل الدخول مرة أخرى حتى تقوم بتسجيل الخروج يدوياً.',
      goToDashboard: 'اذهب إلى لوحة التحكم',
      backToMobile: 'العودة للجوال',
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
      // Registration fields in Arabic for unregistered users
      completeRegistration: 'اكمل تسجيلك',
      fullName: 'الاسم الكامل',
      fullNamePlaceholder: 'أدخل اسمك الكامل',
      emailOptional: 'البريد الإلكتروني (اختياري)',
      emailPlaceholder: 'أدخل عنوان بريدك الإلكتروني',
      place: 'المكان / المنطقة',
      placePlaceholder: 'أدخل منطقتك أو مدينتك',
      nearestBranch: 'اختر أقرب فرع',
      selectBranch: 'اختر فرعاً...',
      password: 'إنشاء كلمة مرور',
      passwordPlaceholder: 'أدخل كلمة المرور (6 أحرف على الأقل)',
      acceptTerms: 'أوافق على الشروط والأحكام',
      registerButton: 'إكمال التسجيل',
      registering: 'جاري إنشاء الحساب...'
    }
  };

  // Use reactive statement to update current language display
  $: localTranslations = translations[$language];
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 relative overflow-hidden" dir="{$language === 'ar' ? 'rtl' : 'ltr'}">
  
  <!-- Animated Background Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full opacity-30 animate-pulse"></div>
    <div class="absolute top-32 right-16 w-12 h-12 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full opacity-40 animate-bounce delay-150"></div>
    <div class="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-r from-cyan-200 to-blue-200 rounded-full opacity-20 animate-pulse delay-300"></div>
    <div class="absolute bottom-32 right-8 w-8 h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full opacity-30 animate-bounce delay-500"></div>
  </div>

  <!-- Top Bar -->
  <div class="text-center py-6 sm:py-8 relative z-10">
    <div class="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
      <div class="relative inline-block transform hover:scale-105 transition-all duration-500">
        <div class="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
        <div class="relative bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-3xl shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
          <img src="/logo.png" alt="Urban Market Logo" class="h-12 sm:h-16 w-auto mx-auto drop-shadow-lg" />
        </div>
      </div>
      <div class="mt-6">
        <div class="inline-flex items-center gap-3 bg-gradient-to-r from-orange-100 via-orange-50 to-yellow-50 px-4 sm:px-6 py-3 rounded-full border border-orange-200/50 shadow-lg backdrop-blur-sm">
          <div class="relative">
            <div class="w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full animate-pulse"></div>
            <div class="absolute inset-0 w-3 h-3 bg-orange-300 rounded-full animate-ping opacity-75"></div>
          </div>
          <span class="text-sm font-semibold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent" class:text-right={$language === 'ar'}>
            {$language === 'ar' ? 'تسجيل دخول العملاء' : 'Customer Login'}
          </span>
        </div>
      </div>
      <!-- Enhanced Language Toggle -->
      <div class="mt-6">
        <button 
          on:click={toggleLanguage}
          class="group relative bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <span class="relative z-10 flex items-center gap-2">
            <svg class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
            </svg>
            {$language === 'ar' ? 'English' : 'العربية'}
          </span>
        </button>
      </div>
    </div>
  </div>

  <!-- Login Content -->
  <div class="flex items-center justify-center p-4 relative z-10">
    <div class="w-full max-w-sm relative">
    
    <!-- Floating Background Card -->
    <div class="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 animate-pulse scale-105"></div>
    
    <!-- Main Card -->
    <div class="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 transform transition-all duration-700 border border-white/30" class:translate-y-0={pageLoaded} class:translate-y-8={!pageLoaded} class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded}>
      
      <!-- Logo and Header -->
      <div class="text-center mb-8">
        <div class="mb-6 relative">
          <div class="absolute inset-0 bg-gradient-to-r from-orange-200 to-pink-200 rounded-2xl blur-sm opacity-30 animate-pulse"></div>
          <div class="relative bg-white rounded-2xl p-4 shadow-lg">
            <img src="/logo.png" alt="Urban Market Logo" class="w-28 h-20 mx-auto object-contain drop-shadow-sm" />
          </div>
        </div>
        
        <h1 class="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">{localTranslations.title}</h1>
        <div class="h-px w-16 bg-gradient-to-r from-orange-400 to-pink-400 mx-auto mb-3"></div>
        <p class="text-gray-500 text-sm leading-relaxed">{$language === 'en' ? 'Enter your mobile number to login' : 'أدخل رقم جوالك لتسجيل الدخول'}</p>
      </div>

      <!-- Step 1: Mobile Number Input -->
      {#if currentStep === 'mobile'}
        <form on:submit|preventDefault={handleLogin} class="space-y-6">
          <div class="space-y-2">
            <label for="mobile-input" class="block text-sm font-semibold text-gray-700 mb-3" class:text-right={$language === 'ar'} class:text-left={$language === 'en'}>
              <span class="flex items-center gap-2" class:flex-row-reverse={$language === 'ar'}>
                <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                {localTranslations.mobileNumber}
              </span>
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 flex items-center pl-4">
                <span class="text-gray-600 text-sm bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 shadow-sm">SA +966</span>
              </div>
              <input
                id="mobile-input"
                bind:this={mobileInput}
                type="tel"
                placeholder={localTranslations.mobilePlaceholder}
                bind:value={mobile}
                on:input={handleMobileInput}
                class="w-full pl-28 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 text-gray-900 font-mono text-lg transition-all duration-300 bg-gray-50 hover:bg-white group-hover:border-orange-300"
                maxlength="10"
              />
              {#if showGreenTick}
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 animate-bounce">
                  <div class="bg-green-500 rounded-full p-1 shadow-lg">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValidMobile || isLoading}
            class="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white py-4 px-6 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-base tracking-wide transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] relative overflow-hidden group"
          >
            {#if !isLoading}
              <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {/if}
            
            {#if isLoading}
              <span class="flex items-center justify-center relative z-10">
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                {processStatus || localTranslations.loading}
              </span>
            {:else}
              <span class="relative z-10 flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                {localTranslations.loginButton}
              </span>
            {/if}
          </button>
        </form>
        
        <!-- Support Section -->
        <div class="mt-6 p-4 bg-green-50 rounded-2xl border border-green-200">
          <div class="flex items-center gap-2 text-green-700 mb-3">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="font-medium text-xs">{localTranslations.needHelpLogin}</span>
          </div>
          
          <div class="flex justify-center mb-2">
            <a href={whatsappSupportLink} target="_blank" class="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-xs font-medium transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              {localTranslations.chatWhatsApp}
            </a>
          </div>
          
          <div class="flex justify-center">
            <button
              type="button"
              on:click={() => showTerms = !showTerms}
              class="text-green-600 hover:text-green-700 text-xs underline font-medium transition-colors"
            >
              {localTranslations.readTerms}
            </button>
          </div>
          
          <!-- Terms Accordion -->
          {#if showTerms}
            <div class="mt-3 p-3 bg-white border border-green-200 rounded-lg text-xs text-gray-700 max-h-32 overflow-y-auto">
              {#if currentTermsContent}
                <h4 class="font-semibold text-green-700 mb-2 text-xs">{currentTermsContent[$language]?.title || localTranslations.termsAndConditionsTitle}</h4>
                <div class="space-y-1">
                  {#each formattedTerms.slice(0, 5) as term}
                    <p class="leading-relaxed text-xs"><strong class="text-green-600">{term.title}:</strong> <span class="text-gray-600">{term.content}</span></p>
                  {/each}
                </div>
              {:else}
                <h4 class="font-semibold text-green-700 mb-2 text-xs">{localTranslations.termsAndConditionsTitle}</h4>
                <p class="text-center text-gray-500 text-xs">{localTranslations.loadingTerms}</p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Step 2: Password Input for Registered Users -->
      {#if currentStep === 'password'}
        <div class="space-y-6">
          <div class="text-center mb-6">
            <div class="flex items-center justify-center gap-2 text-green-600 mb-3 animate-bounce">
              <div class="bg-green-100 rounded-full p-2">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span class="text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Mobile verified!</span>
            </div>
            <h2 class="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{localTranslations.enterPassword}</h2>
          </div>
          
          <form on:submit|preventDefault={handlePasswordLogin} class="space-y-6">
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700 mb-3">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  {localTranslations.enterPassword}
                </span>
              </label>
              <div class="relative group">
                <input
                  bind:value={loginPassword}
                  type="password"
                  placeholder={localTranslations.enterPasswordPlaceholder}
                  class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 text-gray-900 text-lg transition-all duration-300 bg-gray-50 hover:bg-white group-hover:border-indigo-300"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !loginPassword}
              class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-base tracking-wide transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] relative overflow-hidden group"
            >
              {#if !isLoading}
                <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/if}
              
              {#if isLoading}
                <span class="flex items-center justify-center relative z-10">
                  <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  {localTranslations.loading}
                </span>
              {:else}
                <span class="relative z-10 flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                  </svg>
                  {localTranslations.passwordLogin}
                </span>
              {/if}
            </button>

            <button
              type="button"
              on:click={() => { currentStep = 'mobile'; showGreenTick = false; loginPassword = ''; }}
              class="w-full text-gray-600 hover:text-indigo-600 font-semibold py-3 transition-all duration-300 text-sm bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-indigo-200 transform hover:scale-[1.01]"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                {localTranslations.backToMobile}
              </span>
            </button>
          </form>
        </div>
      {/if}

      <!-- Step 3: Registration Form for Unregistered Users -->
      {#if currentStep === 'register'}
        <div class="space-y-6">
          <div class="text-center mb-6">
            <div class="flex items-center justify-center gap-2 text-green-600 mb-3 animate-bounce">
              <div class="bg-green-100 rounded-full p-2">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span class="text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Mobile verified!</span>
            </div>
            <h2 class="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{localTranslations.completeRegistration}</h2>
          </div>
          
          <form on:submit|preventDefault={submitRegistration} class="space-y-6">
            <!-- Full Name -->
            <div class="space-y-2">
              <label for="reg-fullname" class="block text-sm font-semibold text-gray-700 mb-3">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  {localTranslations.fullName}
                </span>
              </label>
              <div class="relative group">
                <input
                  id="reg-fullname"
                  bind:value={regFullName}
                  type="text"
                  placeholder={localTranslations.fullNamePlaceholder}
                  class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 text-gray-900 text-lg transition-all duration-300 bg-gray-50 hover:bg-white group-hover:border-blue-300"
                  required
                />
              </div>
            </div>

            <!-- Email -->
            <div class="space-y-2">
              <label for="reg-email" class="block text-sm font-semibold text-gray-700 mb-3">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                  </svg>
                  {localTranslations.email}
                </span>
              </label>
              <div class="relative group">
                <input
                  id="reg-email"
                  bind:value={regEmail}
                  type="email"
                  placeholder={localTranslations.emailPlaceholder}
                  class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-400 text-gray-900 text-lg transition-all duration-300 bg-gray-50 hover:bg-white group-hover:border-green-300"
                />
              </div>
            </div>

            <!-- Area -->
            <div class="space-y-2">
              <label for="reg-area" class="block text-sm font-semibold text-gray-700 mb-3">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  {localTranslations.place}
                </span>
              </label>
              <div class="relative group">
                <input
                  id="reg-area"
                  bind:value={regArea}
                  type="text"
                  placeholder={localTranslations.placePlaceholder}
                  class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 text-gray-900 text-lg transition-all duration-300 bg-gray-50 hover:bg-white group-hover:border-purple-300"
                  required
                />
              </div>
            </div>

            <!-- Branch Selection -->
            <div class="space-y-2">
              <label for="reg-branch" class="block text-sm font-semibold text-gray-700 mb-3">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  {localTranslations.nearestBranch}
                </span>
              </label>
              <div class="relative group">
                <select
                  id="reg-branch"
                  bind:value={regBranchId}
                  class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-cyan-100 focus:border-cyan-400 text-gray-900 text-lg transition-all duration-300 bg-gray-50 hover:bg-white group-hover:border-cyan-300 appearance-none"
                  required
                >
                  <option value="">{localTranslations.selectBranch}</option>
                  {#each branches as branch}
                    <option value={branch.id}>
                      {$language === 'ar' ? branch.name_ar : branch.name_en}
                    </option>
                  {/each}
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Password -->
            <div class="space-y-2">
              <label for="reg-password" class="block text-sm font-semibold text-gray-700 mb-3">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  {localTranslations.password}
                </span>
              </label>
              <div class="relative group">
                <input
                  id="reg-password"
                  bind:value={regPassword}
                  type="password"
                  placeholder={localTranslations.passwordPlaceholder}
                  class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-400 text-gray-900 text-lg transition-all duration-300 bg-gray-50 hover:bg-white group-hover:border-red-300"
                  required
                  minlength="6"
                />
              </div>
            </div>

            <!-- Terms Acceptance -->
            <div class="flex items-start space-x-3 bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-xl border border-orange-200">
              <input
                id="reg-terms"
                bind:checked={termsAccepted}
                type="checkbox"
                class="mt-1 h-5 w-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 transition-all duration-200"
                required
              />
              <label for="reg-terms" class="text-sm text-gray-700 flex-1 leading-relaxed font-medium">
                {localTranslations.acceptTerms}
              </label>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              disabled={isLoading || !termsAccepted || !regFullName.trim() || !regArea.trim() || !regBranchId || regPassword.length < 6}
              class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 px-6 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-base tracking-wide transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] relative overflow-hidden group"
            >
              {#if !isLoading}
                <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/if}
              
              {#if isLoading}
                <span class="flex items-center justify-center relative z-10">
                  <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  {localTranslations.registering}
                </span>
              {:else}
                <span class="relative z-10 flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                  </svg>
                  {localTranslations.registerButton}
                </span>
              {/if}
            </button>

            <!-- Back Button -->
            <button
              type="button"
              on:click={() => { currentStep = 'mobile'; showGreenTick = false; }}
              class="w-full text-gray-600 hover:text-emerald-600 font-semibold py-3 transition-all duration-300 text-sm bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-emerald-200 transform hover:scale-[1.01]"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                {localTranslations.backToMobile}
              </span>
            </button>
          </form>
        </div>
      {/if}

      <!-- Step 4: Success -->
      {#if currentStep === 'success'}
        <div class="text-center space-y-6">
          <div class="relative">
            <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 mb-6 animate-bounce">
              <div class="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                <svg class="h-7 w-7 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <!-- Celebratory particles -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="absolute animate-ping h-16 w-16 rounded-full bg-green-200 opacity-20"></div>
              <div class="absolute animate-pulse h-24 w-24 rounded-full bg-emerald-200 opacity-10"></div>
            </div>
          </div>
          
          <div class="space-y-3">
            <h2 class="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{localTranslations.success}</h2>
            <p class="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">{localTranslations.successMessage}</p>
          </div>
          
          <div class="pt-4">
            <button
              on:click={() => goto('/dashboard')}
              class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-8 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-green-200 transition-all duration-300 text-lg tracking-wide transform hover:scale-[1.05] hover:shadow-2xl active:scale-[0.98] relative overflow-hidden group"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span class="relative z-10 flex items-center justify-center gap-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                {localTranslations.goToDashboard}
              </span>
            </button>
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

    <!-- Always Visible PWA Install Button -->
    <div class="fixed top-4 right-4 z-50">
      <button
        on:click={installPWA}
        class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-3 focus:ring-orange-500/50 focus:ring-offset-2 active:scale-95 group"
        aria-label={$language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
        title={$language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
      >
        <div class="flex items-center">
          <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 2 0 002 2z"></path>
          </svg>
          <span class="ml-2 text-sm md:text-base font-semibold hidden sm:inline">
            {$language === 'ar' ? 'تثبيت' : 'Install'}
          </span>
        </div>
      </button>
    </div>

    <!-- Footer -->
    <div class="text-center mt-8 transform transition-all duration-500" class:translate-y-0={pageLoaded} class:translate-y-4={!pageLoaded} class:opacity-100={pageLoaded} class:opacity-0={!pageLoaded}>
      <!-- Card-style Links -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
        <!-- Terms & Conditions Card -->
        <a 
          href="/terms-conditions" 
          class="group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 border-2 border-blue-200 hover:border-blue-300 rounded-2xl p-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] block"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex flex-col items-center space-y-2">
            <div class="bg-blue-500 group-hover:bg-blue-600 rounded-full p-2 transition-colors duration-300">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="text-center">
              <h3 class="font-semibold text-blue-800 group-hover:text-blue-900 transition-colors text-sm">
                {$language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
              </h3>
              <p class="text-xs text-blue-600 group-hover:text-blue-700 mt-1">
                {$language === 'ar' ? 'اقرأ الشروط' : 'Read Terms'}
              </p>
            </div>
          </div>
        </a>

        <!-- Privacy Policy Card -->
        <a 
          href="/privacy-policy" 
          class="group bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200 border-2 border-purple-200 hover:border-purple-300 rounded-2xl p-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] block"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex flex-col items-center space-y-2">
            <div class="bg-purple-500 group-hover:bg-purple-600 rounded-full p-2 transition-colors duration-300">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <div class="text-center">
              <h3 class="font-semibold text-purple-800 group-hover:text-purple-900 transition-colors text-sm">
                {$language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </h3>
              <p class="text-xs text-purple-600 group-hover:text-purple-700 mt-1">
                {$language === 'ar' ? 'حماية البيانات' : 'Data Protection'}
              </p>
            </div>
          </div>
        </a>
      </div>
      
      <!-- Smiley Section -->
      <div class="flex justify-center items-center">
        <div class="bg-gradient-to-r from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 border-2 border-yellow-200 hover:border-orange-300 rounded-full p-3 transition-all duration-300 transform hover:scale-110 active:scale-95">
          <span 
            class="text-2xl cursor-pointer select-none transition-transform duration-200 hover:rotate-12"
            on:click={handleSmileyClick}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && handleSmileyClick()}
            title={$language === 'ar' ? 'مفاجأة! اضغط 10 مرات' : 'Surprise! Click 10 times'}
          >
            😊
          </span>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
