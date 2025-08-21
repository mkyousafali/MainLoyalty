<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { browser } from '$app/environment';
  import { language } from '$lib/stores/language.js';
  
  let username = '';
  let password = '';
  let isLoading = false;
  let error = '';
  
  const translations = {
    en: {
      title: 'Checkout Staff Login',
      subtitle: 'Access cashier interface for prize redemption',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      loading: 'Logging in...',
      backToCustomer: 'Back to Customer Login',
      securityNote: 'Secure area. All access attempts are logged.',
      usernamePlaceholder: 'Enter your staff username',
      passwordPlaceholder: 'Enter your password',
      invalidCredentials: 'Invalid username or password',
      systemError: 'System error. Please try again.',
      accessDenied: 'Access denied. Contact administrator.'
    },
    ar: {
      title: 'دخول موظف الصندوق',
      subtitle: 'الوصول لواجهة الصندوق لاستبدال الجوائز',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      login: 'دخول',
      loading: 'جاري تسجيل الدخول...',
      backToCustomer: 'العودة لدخول العملاء',
      securityNote: 'منطقة آمنة. يتم تسجيل جميع محاولات الوصول.',
      usernamePlaceholder: 'أدخل اسم المستخدم',
      passwordPlaceholder: 'أدخل كلمة المرور',
      invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
      systemError: 'خطأ في النظام. حاول مرة أخرى.',
      accessDenied: 'تم رفض الوصول. اتصل بالمدير.'
    }
  };
  
  $: t = translations[$language];
  
  onMount(() => {
    // Clear any existing sessions to force login
    localStorage.removeItem('checkoutStaffSession');
    localStorage.removeItem('checkoutStaffUser');
    localStorage.removeItem('checkoutStaffSessionId');
  });
  
  async function handleLogin(event: Event) {
    event.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      error = t.invalidCredentials;
      return;
    }
    
    try {
      isLoading = true;
      error = '';
      
      console.log('🔄 Attempting checkout staff login:', username);
      
      // Call the authentication function
      const { data, error: authError } = await supabase
        .rpc('authenticate_checkout_staff', {
          p_username: username.trim(),
          p_password: password.trim()
        });
      
      if (authError) {
        console.error('❌ Authentication error:', authError);
        error = t.systemError;
        return;
      }
      
      if (!data || !data.success) {
        console.log('❌ Authentication failed:', data);
        error = t.invalidCredentials;
        return;
      }
      
      console.log('✅ Checkout staff authentication successful:', data);
      
      // Store staff session
      localStorage.setItem('checkoutStaffSession', 'active');
      localStorage.setItem('checkoutStaffUser', JSON.stringify(data.staff));
      localStorage.setItem('checkoutStaffSessionId', data.session_id);
      
      console.log('🚀 Redirecting to checkout staff dashboard');
      
      // Redirect to staff dashboard
      goto('/checkout-staff/dashboard');
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      error = t.systemError;
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>{t.title} - MainLoyalty</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="{$language === 'ar' ? 'rtl' : 'ltr'}">
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">{t.title}</h1>
        <p class="text-gray-600 mt-2">{t.subtitle}</p>
      </div>
      
      <!-- Login Form -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        {#if error}
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-600 text-sm">{error}</p>
          </div>
        {/if}
        
        <form on:submit={handleLogin} class="space-y-6">
          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-semibold text-gray-700 mb-2">
              {t.username}
            </label>
            <input
              id="username"
              type="text"
              bind:value={username}
              placeholder={t.usernamePlaceholder}
              disabled={isLoading}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              class:text-right={$language === 'ar'}
              required
            />
          </div>
          
          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
              {t.password}
            </label>
            <input
              id="password"
              type="password"
              bind:value={password}
              placeholder={t.passwordPlaceholder}
              disabled={isLoading}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              class:text-right={$language === 'ar'}
              required
            />
          </div>
          
          <!-- Login Button -->
          <button
            type="submit"
            disabled={isLoading}
            class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {#if isLoading}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t.loading}
            {:else}
              {t.login}
            {/if}
          </button>
        </form>
        
        <!-- Security Notice -->
        <div class="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div class="flex items-center">
            <svg class="w-4 h-4 text-gray-400 {$language === 'ar' ? 'ml-2' : 'mr-2'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p class="text-xs text-gray-600">{t.securityNote}</p>
          </div>
        </div>
        
        <!-- Back Button -->
        <div class="mt-6 text-center">
          <button 
            on:click={() => goto('/login')}
            class="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
          >
            ← {t.backToCustomer}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom styles for Arabic RTL support */
  [dir="rtl"] input {
    text-align: right;
  }
  
  [dir="rtl"] .flex {
    flex-direction: row-reverse;
  }
</style>
