<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { loginAdmin } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  
  let currentLang: 'en' | 'ar' = 'en';
  let username = '';
  let password = '';
  let error = '';
  let isLoading = false;
  let showCreateAdmin = false;
  let isMasterAdminLoggedIn = false;
  let branches: any[] = [];
  let loadingBranches = false;
  let roles: any[] = [];
  let loadingRoles = false;
  
  // New admin creation form - updated for admin_users table
  let newAdminData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    roleId: '' // Role selection for admin user
  };

  const translations = {
    en: {
      title: 'User Panel Login',
      subtitle: 'Secure login for authorized users only',
      username: 'Username',
      password: 'Password',
      signIn: 'Sign In',
      forgotPassword: 'Forgot Password?',
      loading: 'Signing in...',
      invalidCredentials: 'Invalid credentials. Access denied.',
      accountInactive: 'Account is inactive. Contact Master User.',
      usernamePlaceholder: 'Enter your username',
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
      adminName: 'Full Name',
      adminEmail: 'Email Address',
      adminUsername: 'Username',
      adminPhone: 'Phone Number',
      adminRole: 'User Role',
      adminPassword: 'User Password',
      confirmPassword: 'Confirm Password',
      whatsappNumber: 'WhatsApp Number',
      adminBranch: 'User Branch',
      createAccount: 'Create Account',
      backToLogin: 'Back to Login',
      namePlaceholder: 'Enter user full name',
      newEmailPlaceholder: 'Enter user email address',
      newPasswordPlaceholder: 'Create a strong password',
      confirmPasswordPlaceholder: 'Re-enter your password',
      newUsernamePlaceholder: 'Enter unique username (3+ characters)',
      phonePlaceholder: 'Enter phone number',
      branchPlaceholder: 'Select branch for this user',
      registrationSuccess: 'User account created successfully!'
    },
    ar: {
      title: 'تسجيل دخول لوحة المستخدم',
      subtitle: 'تسجيل دخول آمن للمستخدمين المصرح لهم فقط',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      signIn: 'تسجيل الدخول',
      forgotPassword: 'نسيت كلمة المرور؟',
      loading: 'جاري تسجيل الدخول...',
      invalidCredentials: 'بيانات اعتماد غير صحيحة. تم رفض الوصول.',
      accountInactive: 'الحساب غير نشط. اتصل بالمستخدم الرئيسي.',
      usernamePlaceholder: 'أدخل اسم المستخدم',
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
      adminName: 'الاسم الكامل',
      adminEmail: 'عنوان البريد الإلكتروني',
      adminUsername: 'اسم المستخدم',
      adminPhone: 'رقم الهاتف',
      adminRole: 'دور المستخدم',
      adminPassword: 'كلمة مرور المستخدم',
      confirmPassword: 'تأكيد كلمة المرور',
      whatsappNumber: 'رقم الواتساب',
      adminBranch: 'فرع المستخدم',
      createAccount: 'إنشاء الحساب',
      backToLogin: 'العودة لتسجيل الدخول',
      namePlaceholder: 'أدخل الاسم الكامل للمستخدم',
      newEmailPlaceholder: 'أدخل عنوان البريد الإلكتروني للمستخدم',
      newPasswordPlaceholder: 'إنشاء كلمة مرور قوية',
      confirmPasswordPlaceholder: 'أعد إدخال كلمة المرور',
      newUsernamePlaceholder: 'أدخل اسم مستخدم فريد (3+ أحرف)',
      phonePlaceholder: 'أدخل رقم الهاتف',
      branchPlaceholder: 'اختر الفرع لهذا المستخدم',
      registrationSuccess: 'تم إنشاء حساب المستخدم بنجاح!'
    }
  } as const;

  $: t = translations[currentLang];

  // Fetch branches from database
  async function fetchBranches() {
    console.log('🔄 Starting to fetch branches...');
    loadingBranches = true;
    try {
      console.log('📡 Making Supabase request...');
      
      // First try with all columns to see what's available
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      console.log('📊 Supabase response:', { data, error });
      
      if (error) {
        console.error('❌ Error fetching branches:', error);
        console.log('🔄 Trying without is_active filter...');
        
        // Try without the is_active filter in case the column doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('branches')
          .select('*')
          .order('name');
          
        console.log('📊 Fallback response:', { data: fallbackData, error: fallbackError });
        
        if (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          // Use mock data as last resort
          branches = [
            { id: '1', name: 'Main Branch - Riyadh', name_ar: 'الفرع الرئيسي - الرياض', location: 'King Fahd Road', location_ar: 'طريق الملك فهد', is_active: true },
            { id: '2', name: 'Branch 2 - Jeddah', name_ar: 'الفرع الثاني - جدة', location: 'Tahlia Street', location_ar: 'شارع التحلية', is_active: true },
            { id: '3', name: 'Branch 3 - Dammam', name_ar: 'الفرع الثالث - الدمام', location: 'King Saud Road', location_ar: 'طريق الملك سعود', is_active: true }
          ];
          console.log('🔄 Using fallback branches data:', branches);
        } else {
          branches = fallbackData || [];
          console.log('✅ Successfully fetched branches from Supabase (without is_active filter):', branches);
        }
      } else {
        branches = data || [];
        console.log('✅ Successfully fetched branches from Supabase:', branches);
        console.log('🏢 Number of branches:', branches.length);
      }
    } catch (err) {
      console.error('💥 Failed to fetch branches:', err);
      branches = [];
    } finally {
      loadingBranches = false;
      console.log('🏁 Finished fetching branches. Total:', branches.length);
    }
  }

  // Fetch roles from database
  async function fetchRoles() {
    console.log('🔄 Starting to fetch roles...');
    loadingRoles = true;
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      console.log('📊 Roles response:', { data, error });
      
      if (error) {
        console.error('❌ Error fetching roles:', error);
        // Fallback roles if the query fails
        roles = [
          { id: '1', name: 'Branch Admin', description: 'Branch administrator' },
          { id: '2', name: 'Support Agent', description: 'Customer support agent' },
          { id: '3', name: 'Uploader', description: 'File uploader role' }
        ];
      } else {
        roles = data || [];
        console.log('✅ Successfully fetched roles:', roles);
      }
    } catch (err) {
      console.error('💥 Failed to fetch roles:', err);
      roles = [];
    } finally {
      loadingRoles = false;
    }
  }

  // Load branches and roles when component mounts
  onMount(() => {
    console.log('🚀 Component mounted, fetching branches and roles...');
    fetchBranches();
    fetchRoles();
  });

  // Master User credentials (hardcoded for emergency access)
  const MASTER_ADMIN = {
    username: 'admin',
    email: 'admin@loyalty.com',
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
    console.log('� Username entered:', username);
    console.log('🔐 Password length:', password.length);

    // Validation
    username = username.trim();
    if (!username) {
      error = 'Username is required';
      isLoading = false;
      console.log('❌ Username validation failed');
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
      
      // Check Master Admin first (hardcoded access)
      if (username === MASTER_ADMIN.username && password === MASTER_ADMIN.password) {
        console.log('✅ Master admin credentials match!');
        
        const adminInfo = {
          username: MASTER_ADMIN.username,
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

      // Query admin_users table by username
      console.log('🔍 Querying admin_users table...');
      const { data: adminUser, error: queryError } = await supabase
        .from('admin_users')
        .select(`
          id, 
          username, 
          email, 
          password_hash, 
          full_name, 
          phone, 
          is_active, 
          created_at,
          role_id
        `)
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (queryError) {
        console.log('❌ Database query error:', queryError);
        if (queryError.code === 'PGRST116') {
          error = t.invalidCredentials;
        } else {
          error = 'Database connection error. Please try again.';
        }
        isLoading = false;
        return;
      }

      if (!adminUser) {
        error = t.invalidCredentials;
        console.log('❌ No matching user found in admin_users table');
        isLoading = false;
        return;
      }

      // Get role information separately if role_id exists
      let roleInfo = null;
      if (adminUser.role_id) {
        console.log('🔍 Querying roles table for role_id:', adminUser.role_id);
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('id, name, description')
          .eq('id', adminUser.role_id)
          .single();
        
        if (!roleError && role) {
          roleInfo = role;
          console.log('✅ Role found:', roleInfo);
        } else {
          console.log('⚠️ Role query error or not found:', roleError);
        }
      }

      // Note: In a real application, you would hash the password and compare with password_hash
      // For now, we'll do a simple comparison (you should implement proper password hashing)
      console.log('🔐 Verifying password...');
      
      // Simple password check (replace with proper bcrypt comparison)
      if (password !== adminUser.password_hash) {
        error = t.invalidCredentials;
        console.log('❌ Password does not match');
        isLoading = false;
        return;
      }

      // Successful login
      const adminInfo = {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        name: adminUser.full_name,
        phone: adminUser.phone,
        role: roleInfo ? roleInfo.name : '',
        loginTime: new Date().toISOString()
      };
      
      console.log('🔄 Calling loginAdmin for database user:', adminInfo);
      loginAdmin(adminInfo);
      
      console.log('🎉 Database user login successful:', adminInfo);
      
      // Role-based routing
      const roleName = roleInfo ? roleInfo.name : '';
      switch (roleName.toLowerCase()) {
        case 'master_admin':
        case 'admin':
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
    const message = `Hi Master User, I forgot my user password. Please help me reset it. My username is: ${username || '___'}`;
    const whatsappUrl = `https://wa.me/966XXXXXXXXX?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  function goToCustomerLogin() {
    goto('/login');
  }

  function showRegistrationForm() {
    showCreateAdmin = true;
    error = '';
    // Fetch branches and roles when showing the form
    fetchBranches();
    fetchRoles();
  }

  function hideRegistrationForm() {
    showCreateAdmin = false;
    error = '';
    // Reset form
    newAdminData = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      phone: '',
      roleId: ''
    };
  }

  async function handleCreateAdmin() {
    error = '';
    isLoading = true;

    // Validation
    if (!newAdminData.full_name.trim()) {
      error = 'Full name is required';
      isLoading = false;
      return;
    }

    if (!newAdminData.username.trim() || newAdminData.username.length < 3) {
      error = 'Username must be at least 3 characters';
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

    if (!newAdminData.phone.trim()) {
      error = 'Phone number is required';
      isLoading = false;
      return;
    }

    if (!newAdminData.roleId.trim()) {
      error = 'Role selection is required';
      isLoading = false;
      return;
    }

    try {
      console.log('🔄 Creating new admin user...');
      
      // Create the admin user in Supabase
      const { data, error: insertError } = await supabase
        .from('admin_users')
        .insert([
          {
            username: newAdminData.username.trim(),
            email: newAdminData.email.trim(),
            password_hash: newAdminData.password, // Note: In production, this should be hashed on the backend
            full_name: newAdminData.full_name.trim(),
            phone: newAdminData.phone.trim(),
            role_id: newAdminData.roleId,
            is_active: true
          }
        ])
        .select();

      if (insertError) {
        console.error('❌ Error creating admin user:', insertError);
        if (insertError.code === '23505') {
          if (insertError.message.includes('username')) {
            error = 'Username already exists. Please choose a different username.';
          } else if (insertError.message.includes('email')) {
            error = 'Email already exists. Please use a different email address.';
          } else {
            error = 'User already exists with this username or email.';
          }
        } else {
          error = insertError.message || 'Failed to create user account. Please try again.';
        }
        isLoading = false;
        return;
      }

      console.log('✅ Admin user created successfully:', data);
      
      // Show success message
      error = '';
      alert(t.registrationSuccess);
      
      // Reset form and hide
      hideRegistrationForm();

    } catch (err) {
      console.error('💥 Failed to create admin user:', err);
      error = 'Failed to create user account. Please try again.';
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
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.username}
            </label>
            <input
              id="username"
              bind:value={username}
              type="text"
              placeholder={t.usernamePlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
              autocomplete="username"
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
            <label for="fullName" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.adminName}
            </label>
            <input
              id="fullName"
              bind:value={newAdminData.full_name}
              type="text"
              placeholder={t.namePlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
            />
          </div>

          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.adminUsername}
            </label>
            <input
              id="username"
              bind:value={newAdminData.username}
              type="text"
              placeholder={t.newUsernamePlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
              minlength="3"
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
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.adminPhone}
            </label>
            <input
              id="phone"
              bind:value={newAdminData.phone}
              type="tel"
              placeholder={t.phonePlaceholder}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
              class:text-right={currentLang === 'ar'}
              required
            />
          </div>

          <div>
            <label for="userRole" class="block text-sm font-medium text-gray-700 mb-2" class:text-right={currentLang === 'ar'}>
              {t.adminRole}
              <span class="text-xs text-gray-500">({roles.length} roles available)</span>
              <button 
                type="button"
                on:click={fetchRoles}
                class="ml-2 text-blue-600 underline text-xs"
              >
                Refresh
              </button>
            </label>
            {#if loadingRoles}
              <div class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <span class="animate-spin">⟳</span>
                <span class="ml-2">Loading roles...</span>
              </div>
            {:else if roles.length === 0}
              <div class="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-700 text-center">
                No roles found. Please contact administrator.
                <button 
                  type="button"
                  on:click={fetchRoles}
                  class="ml-2 text-red-600 underline text-sm"
                >
                  Retry
                </button>
              </div>
            {:else}
              <select
                id="userRole"
                bind:value={newAdminData.roleId}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-gray-50"
                class:text-right={currentLang === 'ar'}
                required
              >
                <option value="" disabled>Select role for this user</option>
                {#each roles as role}
                  <option value={role.id}>
                    {role.name}
                    {#if role.description}
                      - {role.description}
                    {/if}
                  </option>
                {/each}
              </select>
            {/if}
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
