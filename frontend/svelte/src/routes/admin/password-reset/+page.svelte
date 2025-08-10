<script lang="ts">
  let currentLang: 'en' | 'ar' = 'en';
  let selectedUsers: any[] = [];
  let bulkAction = '';

  // Sample user data for password reset
  let users = [
    { id: 1, name: 'Ahmed Hassan', email: 'ahmed@company.com', role: 'Admin', status: 'Active', branch: 'Main Branch' },
    { id: 2, name: 'Sarah Ali', email: 'sarah@company.com', role: 'Manager', status: 'Active', branch: 'Branch 2' },
    { id: 3, name: 'Omar Mohammed', email: 'omar@company.com', role: 'Employee', status: 'Blocked', branch: 'Branch 3' },
    { id: 4, name: 'Fatima Ibrahim', email: 'fatima@company.com', role: 'Employee', status: 'Active', branch: 'Main Branch' }
  ];

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
      active: 'Active',
      blocked: 'Blocked',
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
      active: 'نشط',
      blocked: 'محظور',
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

  function handleBulkAction() {
    if (bulkAction && selectedUsers.length > 0) {
      const action = bulkAction;
      const count = selectedUsers.length;
      
      if (confirm(`${action} for ${count} selected users?`)) {
        // Implement bulk action logic here
        console.log(`Performing ${action} on users:`, selectedUsers);
        selectedUsers = [];
        bulkAction = '';
      }
    }
  }

  function resetSinglePassword(userId: number) {
    if (confirm('Reset password for this user?')) {
      console.log('Resetting password for user:', userId);
    }
  }

  function getStatusColor(status: string) {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  function getRoleColor(role: string) {
    const colors: Record<string, string> = {
      'Admin': 'bg-purple-100 text-purple-800',
      'Manager': 'bg-blue-100 text-blue-800',
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
  </div>

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
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
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
