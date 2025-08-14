<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  
  let currentLang: 'en' | 'ar' = 'en';
  let selectedUsers: number[] = [];
  let bulkAction = '';
  let users: any[] = [];
  let loading = true;
  let error = '';

  // Load real admin users from database
  async function loadAdminUsers() {
    try {
      loading = true;
      error = '';
      
      const { data, error: fetchError } = await supabase
        .from('admin_users')
        .select(`
          id,
          full_name,
          email,
          username,
          is_active,
          created_at,
          last_login,
          role_id,
          roles (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching admin users:', fetchError);
        error = 'Failed to load users';
        return;
      }
      
      users = data.map(user => ({
        id: user.id,
        name: user.full_name || user.username || 'Unknown',
        email: user.email,
        role: Array.isArray(user.roles) ? user.roles[0]?.name || 'No Role' : user.roles?.name || 'No Role',
        status: user.is_active ? 'Active' : 'Blocked',
        branch: 'Main Branch', // Add branch logic later if needed
        lastLogin: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'
      }));
      
      console.log('Loaded admin users:', users);
    } catch (err) {
      console.error('Error loading admin users:', err);
      error = 'Failed to load users';
    } finally {
      loading = false;
    }
  }

  // Reset single user password
  async function resetSinglePassword(userId: number) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Reset password for ${user.name}?`)) {
      try {
        // Generate new temporary password
        const tempPassword = generateTempPassword();
        
        // In a real implementation, you'd update the password in the database
        // For now, we'll just show the temporary password
        alert(`New temporary password for ${user.name}: ${tempPassword}\n\nPlease share this with the user securely.`);
        
        console.log('Password reset for user:', userId, 'Temp password:', tempPassword);
      } catch (err) {
        console.error('Error resetting password:', err);
        alert('Failed to reset password. Please try again.');
      }
    }
  }

  // Generate temporary password
  function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Toggle user active status
  async function toggleUserStatus(userId: number) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newStatus = user.status === 'Active' ? false : true;
    const statusText = newStatus ? 'activate' : 'block';
    
    if (confirm(`Are you sure you want to ${statusText} ${user.name}?`)) {
      try {
        const { error } = await supabase
          .from('admin_users')
          .update({ is_active: newStatus })
          .eq('id', userId);
        
        if (error) {
          console.error('Error updating user status:', error);
          alert('Failed to update user status');
          return;
        }
        
        // Update local state
        user.status = newStatus ? 'Active' : 'Blocked';
        users = [...users];
        
        console.log('User status updated:', userId, 'New status:', newStatus);
      } catch (err) {
        console.error('Error updating user status:', err);
        alert('Failed to update user status');
      }
    }
  }

  // Bulk operations
  async function handleBulkAction() {
    if (bulkAction && selectedUsers.length > 0) {
      const action = bulkAction;
      const count = selectedUsers.length;
      
      if (confirm(`${action} for ${count} selected users?`)) {
        try {
          if (action === 'reset') {
            // Generate temp passwords for selected users
            const passwords = selectedUsers.map(userId => {
              const user = users.find(u => u.id === userId);
              const tempPassword = generateTempPassword();
              return { userId, userName: user?.name, tempPassword };
            });
            
            let message = 'Temporary passwords generated:\n\n';
            passwords.forEach(({ userName, tempPassword }) => {
              message += `${userName}: ${tempPassword}\n`;
            });
            
            alert(message + '\nPlease share these passwords securely with the users.');
            
          } else if (action === 'block' || action === 'activate') {
            const newStatus = action === 'activate';
            
            const { error } = await supabase
              .from('admin_users')
              .update({ is_active: newStatus })
              .in('id', selectedUsers);
            
            if (error) {
              console.error('Error bulk updating users:', error);
              alert('Failed to update users');
              return;
            }
            
            // Update local state
            users = users.map(user => 
              selectedUsers.includes(user.id) 
                ? { ...user, status: newStatus ? 'Active' : 'Blocked' }
                : user
            );
          }
          
          console.log(`Bulk ${action} completed for users:`, selectedUsers);
        } catch (err) {
          console.error('Error in bulk action:', err);
          alert('Failed to complete bulk action');
        }
        
        selectedUsers = [];
        bulkAction = '';
      }
    }
  }

  onMount(() => {
    loadAdminUsers();
  });

  const translations = {
    en: {
      passwordReset: 'Password Reset & User Control',
      backToAdmin: 'Back to Admin',
      selectUsers: 'Select users to reset passwords',
      bulkActions: 'Bulk Actions',
      resetSelected: 'Reset Selected Passwords',
      blockSelected: 'Block Selected Users',
      activateSelected: 'Activate Selected Users',
      selectAll: 'Select All',
      clearSelection: 'Clear Selection',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      branch: 'Branch',
      lastPasswordReset: 'Last Password Reset',
      action: 'Action',
      resetPassword: 'Reset Password',
      blockUser: 'Block User',
      activateUser: 'Activate User',
      active: 'Active',
      blocked: 'Blocked',
      loading: 'Loading users...',
      retry: 'Retry',
      admin: 'Admin',
      manager: 'Manager',
      employee: 'Employee',
      confirmBulkReset: 'Confirm Bulk Password Reset',
      bulkResetWarning: 'Are you sure you want to reset passwords for selected users?',
      usersSelected: 'users selected',
      proceed: 'Proceed',
      cancel: 'Cancel'
    },
    ar: {
      passwordReset: 'إعادة تعيين كلمات المرور وتحكم المستخدمين',
      backToAdmin: 'العودة للإدارة',
      selectUsers: 'اختر المستخدمين لإعادة تعيين كلمات المرور',
      bulkActions: 'الإجراءات المجمعة',
      resetSelected: 'إعادة تعيين كلمات المرور المحددة',
      blockSelected: 'حظر المستخدمين المحددين',
      activateSelected: 'تفعيل المستخدمين المحددين',
      selectAll: 'تحديد الكل',
      clearSelection: 'مسح التحديد',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      role: 'الدور',
      status: 'الحالة',
      branch: 'الفرع',
      lastPasswordReset: 'آخر إعادة تعيين كلمة مرور',
      action: 'الإجراء',
      resetPassword: 'إعادة تعيين كلمة المرور',
      blockUser: 'حظر المستخدم',
      activateUser: 'تفعيل المستخدم',
      active: 'نشط',
      blocked: 'محظور',
      loading: 'جاري تحميل المستخدمين...',
      retry: 'إعادة المحاولة',
      admin: 'مدير',
      manager: 'مشرف',
      employee: 'موظف',
      confirmBulkReset: 'تأكيد إعادة تعيين كلمات المرور المجمعة',
      bulkResetWarning: 'هل أنت متأكد من إعادة تعيين كلمات المرور للمستخدمين المحددين؟',
      usersSelected: 'مستخدم محدد',
      proceed: 'متابعة',
      cancel: 'إلغاء'
    }
  } as const;

  $: t = translations[currentLang];

  function goToAdmin() {
    window.location.href = '/admin';
  }

  function handleLanguageToggle() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
  }

  function toggleUserSelection(userId: number) {
    if (selectedUsers.includes(userId)) {
      selectedUsers = selectedUsers.filter(id => id !== userId);
    } else {
      selectedUsers = [...selectedUsers, userId];
    }
  }

  function selectAllUsers() {
    selectedUsers = users.map(user => user.id);
  }

  function clearSelection() {
    selectedUsers = [];
  }

  function getStatusColor(status: string) {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  function getRoleColor(role: string) {
    const colors: Record<string, string> = {
      'Super Admin': 'bg-purple-100 text-purple-800',
      'Admin': 'bg-blue-100 text-blue-800',
      'Manager': 'bg-indigo-100 text-indigo-800',
      'Staff': 'bg-gray-100 text-gray-800',
      'Employee': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors['Employee'];
  }
</script>

<div class="min-h-screen bg-[#f6f8fb] p-6" class:rtl={currentLang === 'ar'}>
  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2" class:text-right={currentLang === 'ar'}>{t.passwordReset}</h1>
      <p class="text-gray-600" class:text-right={currentLang === 'ar'}>{t.selectUsers}</p>
    </div>
    
    <!-- Language Toggle -->
    <button
      on:click={handleLanguageToggle}
      class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
    >
      {currentLang === 'en' ? 'عربي' : 'English'}
    </button>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span class="text-gray-600">{t.loading}</span>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-2">
        <span class="text-red-500 text-xl">❌</span>
        <span class="text-red-800 font-medium">{error}</span>
      </div>
      <button 
        on:click={loadAdminUsers}
        class="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
      >
        {t.retry}
      </button>
    </div>
  {:else}
    <!-- Bulk Actions -->
    {#if selectedUsers.length > 0}
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-center justify-between" class:flex-row-reverse={currentLang === 'ar'}>
          <div class="flex items-center gap-4" class:flex-row-reverse={currentLang === 'ar'}>
            <span class="text-blue-800 font-semibold">{selectedUsers.length} {t.usersSelected}</span>
            <select bind:value={bulkAction} class="px-3 py-2 border border-blue-300 rounded-lg bg-white">
              <option value="">{t.bulkActions}</option>
              <option value="reset">{t.resetSelected}</option>
              <option value="block">{t.blockSelected}</option>
              <option value="activate">{t.activateSelected}</option>
            </select>
            <button on:click={handleBulkAction} disabled={!bulkAction} class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
            {t.proceed}
          </button>
        </div>
        <button on:click={clearSelection} class="text-blue-600 hover:text-blue-800 underline">
          {t.clearSelection}
        </button>
      </div>
    </div>
  {/if}

  <!-- Selection Controls -->
  <div class="bg-white rounded-lg shadow p-4 mb-6">
    <div class="flex gap-4" class:flex-row-reverse={currentLang === 'ar'}>
      <button on:click={selectAllUsers} class="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition">
        {t.selectAll}
      </button>
      <button on:click={clearSelection} class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
        {t.clearSelection}
      </button>
    </div>
  </div>

  <!-- Users Table -->
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input type="checkbox" 
                     checked={selectedUsers.length === users.length} 
                     on:change={selectedUsers.length === users.length ? clearSelection : selectAllUsers}
                     class="rounded border-gray-300">
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.name}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.email}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.role}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.status}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.branch}</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" class:text-right={currentLang === 'ar'}>{t.action}</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each users as user}
            <tr class="hover:bg-gray-50" class:bg-blue-50={selectedUsers.includes(user.id)}>
              <td class="px-6 py-4 whitespace-nowrap">
                <input type="checkbox" 
                       checked={selectedUsers.includes(user.id)}
                       on:change={() => toggleUserSelection(user.id)}
                       class="rounded border-gray-300">
              </td>
              <td class="px-6 py-4 whitespace-nowrap" class:text-right={currentLang === 'ar'}>
                <div class="text-sm font-medium text-gray-900">{user.name}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap" class:text-right={currentLang === 'ar'}>
                <div class="text-sm text-gray-500">{user.email}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap" class:text-right={currentLang === 'ar'}>
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getRoleColor(user.role)}">
                  {user.role}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap" class:text-right={currentLang === 'ar'}>
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(user.status)}">
                  {user.status === 'Active' ? t.active : t.blocked}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" class:text-right={currentLang === 'ar'}>
                {user.branch}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button on:click={() => resetSinglePassword(user.id)} class="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition flex items-center gap-2">
                  <span>🔑</span>
                  <span>{t.resetPassword}</span>
                </button>
                <button on:click={() => toggleUserStatus(user.id)} class="ml-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition flex items-center gap-2">
                  <span>{user.status === 'Active' ? '🚫' : '✅'}</span>
                  <span>{user.status === 'Active' ? 'Block' : 'Activate'}</span>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  {/if}
</div>

<style>
  .rtl {
    direction: rtl;
    font-family: 'Cairo', sans-serif;
  }
  
  .rtl .flex {
    gap: 0.75rem;
  }
  
  .rtl button {
    text-align: center;
  }
  
  .rtl table {
    text-align: right;
  }
</style>
