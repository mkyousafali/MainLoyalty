<script lang="ts">
  import { goto } from '$app/navigation';
  import { loginAdmin } from '$lib/stores/auth';
  
  let currentLang: 'en' | 'ar' = 'en';
  let email = '';
  let password = '';
  let error = '';
  let isLoading = false;
  let showCreateAdmin = false;
  let isMasterAdminLoggedIn = false;
  
  // New admin creation form
  let newAdminData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nationalId: '',
    whatsappNumber: '',
    role: 'branch_admin',
    branch: ''
  };

  const translations = {
    en: {
      title: 'User Panel Login',
      subtitle: 'Secure login for authorized users only',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign In',
      forgotPassword: 'Forgot Password?',
      loading: 'Signing in...',
      invalidCredentials: 'Invalid credentials. Access denied.',
      accountInactive: 'Account is inactive. Contact Master User.',
      emailPlaceholder: 'Enter your user email',
      passwordPlaceholder: 'Enter your password',
      accessDenied: 'Access denied. Unauthorized user.',
      masterAdminAccess: 'Master User Access',
      branchAdminAccess: 'Branch User Access',
      supportAgentAccess: 'Support Agent Access',
      uploaderAccess: 'Uploader Access',
      securityNotice: 'This is a secure area. All access attempts are logged.',
      customerLogin: 'Customer Login',
      backToCustomer: 'Back to Customer Login',
      createAdminAccount: 'Create User Account',
      onlyMasterAdmin: 'Only Master User can create accounts',
      newAdminRegistration: 'New User Registration',
      adminName: 'User Name',
      adminEmail: 'User Email',
      adminPassword: 'User Password',
      confirmPassword: 'Confirm Password',
      nationalId: 'National ID / Resident ID',
      whatsappNumber: 'WhatsApp Number',
      adminRole: 'User Role',
      adminBranch: 'User Branch (if applicable)',
      createAccount: 'Create Account',
      backToLogin: 'Back to Login',
      namePlaceholder: 'Enter user full name',
      newEmailPlaceholder: 'Enter user email address',
      newPasswordPlaceholder: 'Create a strong password',
      confirmPasswordPlaceholder: 'Re-enter your password',
      nationalIdPlaceholder: 'Enter National ID or Resident ID',
      whatsappPlaceholder: 'Enter WhatsApp number (e.g., +966XXXXXXXXX)',
      branchPlaceholder: 'Enter branch name (for branch users)',
      registrationSuccess: 'User account created successfully!',
      masterAdminRole: 'Master User',
      branchAdminRole: 'Branch User',
      supportAgentRole: 'Support Agent',
      uploaderRole: 'Uploader'
    },
    ar: {
      title: 'تسجيل دخول لوحة المستخدم',
      subtitle: 'تسجيل دخول آمن للمستخدمين المصرح لهم فقط',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      signIn: 'تسجيل الدخول',
      forgotPassword: 'نسيت كلمة المرور؟',
      loading: 'جاري تسجيل الدخول...',
      invalidCredentials: 'بيانات اعتماد غير صحيحة. تم رفض الوصول.',
      accountInactive: 'الحساب غير نشط. اتصل بالمستخدم الرئيسي.',
      emailPlaceholder: 'أدخل بريد المستخدم الإلكتروني',
      passwordPlaceholder: 'أدخل كلمة المرور',
      accessDenied: 'تم رفض الوصول. مستخدم غير مصرح.',
      masterAdminAccess: 'وصول المستخدم الرئيسي',
      branchAdminAccess: 'وصول مستخدم الفرع',
      supportAgentAccess: 'وصول وكيل الدعم',
      uploaderAccess: 'وصول المحمل',
      securityNotice: 'هذه منطقة آمنة. يتم تسجيل جميع محاولات الوصول.',
      customerLogin: 'دخول العملاء',
      backToCustomer: 'العودة لدخول العملاء',
      createAdminAccount: 'إنشاء حساب مستخدم',
      onlyMasterAdmin: 'فقط المستخدم الرئيسي يمكنه إنشاء الحسابات',
      newAdminRegistration: 'تسجيل مستخدم جديد',
      adminName: 'اسم المستخدم',
      adminEmail: 'بريد المستخدم الإلكتروني',
      adminPassword: 'كلمة مرور المستخدم',
      confirmPassword: 'تأكيد كلمة المرور',
      nationalId: 'الهوية الوطنية / هوية المقيم',
      whatsappNumber: 'رقم الواتساب',
      adminRole: 'دور المستخدم',
      adminBranch: 'فرع المستخدم (إن وجد)',
      createAccount: 'إنشاء الحساب',
      backToLogin: 'العودة لتسجيل الدخول',
      namePlaceholder: 'أدخل الاسم الكامل للمستخدم',
      newEmailPlaceholder: 'أدخل عنوان البريد الإلكتروني للمستخدم',
      newPasswordPlaceholder: 'إنشاء كلمة مرور قوية',
      confirmPasswordPlaceholder: 'أعد إدخال كلمة المرور',
      nationalIdPlaceholder: 'أدخل الهوية الوطنية أو هوية المقيم',
      whatsappPlaceholder: 'أدخل رقم الواتساب (مثال: +966XXXXXXXXX)',
      branchPlaceholder: 'أدخل اسم الفرع (لمستخدمي الفروع)',
      registrationSuccess: 'تم إنشاء حساب المستخدم بنجاح!',
      masterAdminRole: 'مستخدم رئيسي',
      branchAdminRole: 'مستخدم فرع',
      supportAgentRole: 'وكيل دعم',
      uploaderRole: 'محمل'
    }
  } as const;

  $: t = translations[currentLang];

  // Master User credentials (hardcoded for emergency access)
  const MASTER_ADMIN = {
    email: 'admin',
    password: 'admin',
    role: 'master_admin'
  };

  // Mock user database - replace with actual API call
  const adminUsers = [
    {
      id: 1,
      email: 'branch1@urbanmarket.com',
      password: 'branch123',
      role: 'branch_admin',
      branch: 'Main Branch - Riyadh',
      isActive: true,
      name: 'Ahmed Hassan'
    },
    {
      id: 2,
      email: 'support@urbanmarket.com',
      password: 'support123',
      role: 'support_agent',
      isActive: true,
      name: 'Sarah Ali'
    },
    {
      id: 3,
      email: 'uploader@urbanmarket.com',
      password: 'upload123',
      role: 'uploader',
      isActive: true,
      name: 'Omar Mohammed'
    },
    {
      id: 4,
      email: 'inactive@urbanmarket.com',
      password: 'test123',
      role: 'branch_admin',
      isActive: false,
      name: 'Inactive User'
    }
  ];

  function handleLanguageToggle() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
  }

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === 'yousuf' || email === 'admin' || email === 'mk.yousafali@gmail.com';
  }

  async function handleLogin() {
    error = '';
    isLoading = true;
    
    console.log('🔍 Login attempt started');
    console.log('📧 Email entered:', email);
    console.log('🔐 Password length:', password.length);
    console.log('⚙️ Master admin config:', MASTER_ADMIN);

    // Validation
    email = email.trim();
    if (!email) {
      error = 'Email is required';
      isLoading = false;
      console.log('❌ Email validation failed');
      return;
    }

    if (!password) {
      error = 'Password is required';
      isLoading = false;
      console.log('❌ Password validation failed');
      return;
    }

    try {
      console.log('🔍 Checking master admin credentials...');
      console.log('📧 Email match:', email === MASTER_ADMIN.email);
      console.log('🔐 Password match:', password === MASTER_ADMIN.password);
      
      // Check Master Admin first (hardcoded access)
      if (email === MASTER_ADMIN.email && password === MASTER_ADMIN.password) {
        console.log('✅ Master admin credentials match!');
        
        const adminInfo = {
          email: MASTER_ADMIN.email,
          role: MASTER_ADMIN.role,
          name: 'Master User',
          loginTime: new Date().toISOString()
        };
        
        console.log('🔄 Calling loginAdmin with:', adminInfo);
        loginAdmin(adminInfo);
        
        console.log('🎉 Master User login successful:', adminInfo);
        console.log('🚀 Redirecting to /admin');
        
        // Redirect to main user dashboard
        goto('/admin');
        return;
      }

      // Check regular admin users
      console.log('🔍 Checking regular admin users...');
      const user = adminUsers.find(u => u.email === email && u.password === password);

      if (!user) {
        error = t.invalidCredentials;
        console.log('❌ Failed login attempt:', { email, timestamp: new Date().toISOString() });
        console.log('❌ No matching user found in admin database');
        isLoading = false;
        return;
      }

      if (!user.isActive) {
        error = t.accountInactive;
        console.log('❌ User account is inactive:', user);
        isLoading = false;
        return;
      }

      // Successful login
      const adminInfo = {
        email: user.email,
        role: user.role,
        name: user.name,
        branch: user.branch || '',
        loginTime: new Date().toISOString()
      };
      
      console.log('🔄 Calling loginAdmin for regular user:', adminInfo);
      loginAdmin(adminInfo);
      
      console.log('🎉 Regular user login successful:', adminInfo);
      
      // Role-based routing
      switch (user.role) {
        case 'master_admin':
          goto('/admin');
          break;
        case 'branch_admin':
          goto('/admin/branch-panel');
          break;
        case 'support_agent':
          goto('/admin/tickets');
          break;
        case 'uploader':
          goto('/admin/upload-customers');
          break;
        default:
          goto('/admin');
      }

    } catch (err) {
      error = 'Connection error. Please try again.';
      console.error('❌ Login error:', err);
      console.error('❌ Full error details:', JSON.stringify(err, null, 2));
    } finally {
      isLoading = false;
      console.log('🏁 Login process completed');
    }
  }

  function getPermissionsByRole(role: string): string[] {
    const permissions: Record<string, string[]> = {
      'master_admin': ['all'],
      'branch_admin': ['branch_data', 'customers', 'transactions', 'reports'],
      'support_agent': ['view_customers', 'support_tickets', 'notifications'],
      'uploader': ['upload_files', 'bulk_import']
    };
    return permissions[role] || [];
  }

  function handleForgotPassword() {
    const message = `Hi Master User, I forgot my user password. Please help me reset it. My registered email is: ${email || '___'}`;
    const whatsappUrl = `https://wa.me/966XXXXXXXXX?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  function goToCustomerLogin() {
    goto('/login');
  }

  function showRegistrationForm() {
    showCreateAdmin = true;
    error = '';
  }

  function hideRegistrationForm() {
    showCreateAdmin = false;
    error = '';
    // Reset form
    newAdminData = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      nationalId: '',
      whatsappNumber: '',
      role: 'branch_admin',
      branch: ''
    };
  }

  async function handleCreateAdmin() {
    error = '';
    isLoading = true;

    // Validation
    if (!newAdminData.name.trim()) {
      error = 'User name is required';
      isLoading = false;
      return;
    }

    if (!newAdminData.email.trim() || !validateEmail(newAdminData.email)) {
      error = 'Valid email is required';
      isLoading = false;
      return;
    }

    if (!newAdminData.password || newAdminData.password.length < 6) {
      error = 'Password must be at least 6 characters';
      isLoading = false;
      return;
    }

    if (newAdminData.password !== newAdminData.confirmPassword) {
      error = 'Passwords do not match';
      isLoading = false;
      return;
    }

    if (!newAdminData.nationalId.trim()) {
      error = 'National ID or Resident ID is required';
      isLoading = false;
      return;
    }

    if (!newAdminData.whatsappNumber.trim()) {
      error = 'WhatsApp number is required';
      isLoading = false;
      return;
    }

    // Validate WhatsApp number format
    const whatsappRegex = /^\+?[1-9]\d{1,14}$/;
    if (!whatsappRegex.test(newAdminData.whatsappNumber)) {
      error = 'Please enter a valid WhatsApp number (e.g., +966XXXXXXXXX)';
      isLoading = false;
      return;
    }

    if (newAdminData.role === 'branch_admin' && !newAdminData.branch.trim()) {
      error = 'Branch name is required for branch users';
      isLoading = false;
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new user
      const newAdmin = {
        id: adminUsers.length + 1,
        name: newAdminData.name.trim(),
        email: newAdminData.email.trim(),
        password: newAdminData.password,
        nationalId: newAdminData.nationalId.trim(),
        whatsappNumber: newAdminData.whatsappNumber.trim(),
        role: newAdminData.role,
        branch: newAdminData.branch.trim() || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'Master User'
      };

      // Add to mock database (in real app, this would be an API call)
      adminUsers.push(newAdmin);
      
      console.log('New user created:', newAdmin);
      
      // Show success message
      error = '';
      alert(t.registrationSuccess);
      
      // Reset form and hide
      hideRegistrationForm();

    } catch (err) {
      error = 'Failed to create user account. Please try again.';
      console.error('Registration error:', err);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center p-4" class:rtl={currentLang === 'ar'}>
  <div class="max-w-md w-full space-y-8">
    <!-- Language Toggle -->
    <div class="flex justify-end">
      <button 
        on:click={handleLanguageToggle}
        class="bg-white bg-opacity-10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm hover:bg-opacity-20 transition-all"
      >
        {currentLang === 'ar' ? 'English' : 'عربي'}
      </button>
    </div>

    <!-- Admin Login Card -->
    <div class="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
      {#if !showCreateAdmin}
        <!-- Login Form -->
        <!-- Header -->
        <div class="text-center" class:text-right={currentLang === 'ar'}>
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-gradient-to-r from-gray-800 to-blue-800 rounded-full flex items-center justify-center">
              <span class="text-white text-2xl">🔐</span>
            </div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p class="text-gray-600 mt-2 text-sm">{t.subtitle}</p>
        </div>

        <!-- Security Notice -->
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3">
          <div class="flex">
            <div class="flex-shrink-0">
              <span class="text-yellow-400">⚠️</span>
            </div>
            <div class="ml-3" class:ml-0={currentLang === 'ar'} class:mr-3={currentLang === 'ar'}>
              <p class="text-sm text-yellow-700" class:text-right={currentLang === 'ar'}>
                {t.securityNotice}
              </p>
            </div>
          </div>
        </div>

        <!-- Login Form -->
        <form on:submit|preventDefault={handleLogin} class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.email}
            </label>
            <input
              id="email"
              bind:value={email}
              type="text"
              placeholder={t.emailPlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
              autocomplete="email"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.password}
            </label>
            <input
              id="password"
              bind:value={password}
              type="password"
              placeholder={t.passwordPlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
              autocomplete="current-password"
            />
          </div>

          {#if error}
            <div class="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200" class:text-right={currentLang === 'ar'}>
              🚫 {error}
            </div>
          {/if}

          <button
            type="submit"
            disabled={isLoading}
            class="w-full bg-gradient-to-r from-gray-800 to-blue-800 text-white py-3 px-4 rounded-lg font-semibold hover:from-gray-900 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {#if isLoading}
              <span class="flex items-center justify-center gap-2">
                <span class="animate-spin">⟳</span>
                {t.loading}
              </span>
            {:else}
              {t.signIn}
            {/if}
          </button>
        </form>

        <!-- Forgot Password -->
        <div class="text-center">
          <button 
            on:click={handleForgotPassword} 
            class="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            {t.forgotPassword}
          </button>
        </div>

        <!-- Create Admin Account Button -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          on:click={showRegistrationForm}
          class="w-full flex items-center justify-center gap-2 py-2 px-4 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-green-700 hover:text-green-800"
        >
          <span>➕</span>
          <span class="text-sm">{t.createAdminAccount}</span>
        </button>

        <p class="text-xs text-center text-gray-500">{t.onlyMasterAdmin}</p>

        <!-- Role Information -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>User Roles:</h3>
          <div class="space-y-1 text-xs text-gray-600" class:text-right={currentLang === 'ar'}>
            <div class="flex items-center gap-2" class:flex-row-reverse={currentLang === 'ar'}>
              <span class="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>{t.masterAdminAccess} - Full Control</span>
            </div>
            <div class="flex items-center gap-2" class:flex-row-reverse={currentLang === 'ar'}>
              <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>{t.branchAdminAccess} - Branch Data</span>
            </div>
            <div class="flex items-center gap-2" class:flex-row-reverse={currentLang === 'ar'}>
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{t.supportAgentAccess} - Customer Support</span>
            </div>
            <div class="flex items-center gap-2" class:flex-row-reverse={currentLang === 'ar'}>
              <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>{t.uploaderAccess} - File Uploads</span>
            </div>
          </div>
        </div>

        <!-- Customer Login Link -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          on:click={goToCustomerLogin}
          class="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span>👤</span>
          <span class="text-sm">{t.customerLogin}</span>
        </button>

      {:else}
        <!-- Registration Form -->
        <!-- Header -->
        <div class="text-center" class:text-right={currentLang === 'ar'}>
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <span class="text-white text-2xl">👥</span>
            </div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">{t.newAdminRegistration}</h1>
          <p class="text-gray-600 mt-2 text-sm">{t.onlyMasterAdmin}</p>
        </div>

        <!-- Registration Form -->
        <form on:submit|preventDefault={handleCreateAdmin} class="space-y-4">
          <div>
            <label for="userName" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.adminName}
            </label>
            <input
              id="userName"
              bind:value={newAdminData.name}
              type="text"
              placeholder={t.namePlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
            />
          </div>

          <div>
            <label for="userEmail" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.adminEmail}
            </label>
            <input
              id="userEmail"
              bind:value={newAdminData.email}
              type="email"
              placeholder={t.newEmailPlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
            />
          </div>

          <div>
            <label for="userPassword" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.adminPassword}
            </label>
            <input
              id="userPassword"
              bind:value={newAdminData.password}
              type="password"
              placeholder={t.newPasswordPlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
              minlength="6"
            />
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.confirmPassword}
            </label>
            <input
              id="confirmPassword"
              bind:value={newAdminData.confirmPassword}
              type="password"
              placeholder={t.confirmPasswordPlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
              minlength="6"
            />
          </div>

          <div>
            <label for="nationalId" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.nationalId}
            </label>
            <input
              id="nationalId"
              bind:value={newAdminData.nationalId}
              type="text"
              placeholder={t.nationalIdPlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
            />
          </div>

          <div>
            <label for="whatsappNumber" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.whatsappNumber}
            </label>
            <input
              id="whatsappNumber"
              bind:value={newAdminData.whatsappNumber}
              type="tel"
              placeholder={t.whatsappPlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
            />
          </div>

          <div>
            <label for="userRole" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.adminRole}
            </label>
            <select
              id="userRole"
              bind:value={newAdminData.role}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
            >
              <option value="branch_admin">{t.branchAdminRole}</option>
              <option value="support_agent">{t.supportAgentRole}</option>
              <option value="uploader">{t.uploaderRole}</option>
            </select>
          </div>

          <div>
            <label for="userBranch" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.adminBranch}
            </label>
            <input
              id="userBranch"
              bind:value={newAdminData.branch}
              type="text"
              placeholder={t.branchPlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required={newAdminData.role === 'branch_admin'}
            />
          </div>

          {#if error}
            <div class="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200" class:text-right={currentLang === 'ar'}>
              🚫 {error}
            </div>
          {/if}

          <div class="flex gap-3">
            <button
              type="button"
              on:click={hideRegistrationForm}
              class="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              {t.backToLogin}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {#if isLoading}
                <span class="flex items-center justify-center gap-2">
                  <span class="animate-spin">⟳</span>
                  Creating...
                </span>
              {:else}
                {t.createAccount}
              {/if}
            </button>
          </div>
        </form>
      {/if}
    </div>

    <!-- Footer -->
    <div class="text-center text-sm text-white opacity-75">
      <p>© 2024 Urban Market User Panel</p>
      <p class="text-xs mt-1">Secure User Access Only</p>
    </div>
  </div>
</div>

<style>
  .rtl {
    direction: rtl;
    font-family: 'Cairo', sans-serif;
  }
  
  .rtl input {
    text-align: right;
  }

  .rtl .flex-row-reverse {
    flex-direction: row-reverse;
  }

  /* Loading animation */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
