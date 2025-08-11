<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import * as XLSX from 'xlsx';

  let coupons: any[] = [];
  let isLoading = false;
  let error = '';
  let success = '';

  // Create/Edit modal
  let showModal = false;
  let editingCoupon: any = null;
  let formData = {
    code: '',
    title: '',
    title_en: '',
    title_ar: '',
    description: '',
    description_en: '',
    description_ar: '',
    discount_type: 'fixed',
    discount_value: '',
    minimum_purchase: '',
    maximum_discount: '',
    usage_limit: '',
    usage_limit_per_customer: 1,
    valid_from: '',
    valid_until: '',
    expires_at: '',
    redemption_window_seconds: 300,
    status: 'active'
  };

  // Usage tracking
  let selectedCouponUsage: any[] = [];
  let showUsageModal = false;

  // Bulk upload variables
  let showBulkUploadModal = false;
  let uploadMode = 'coupons'; // 'coupons' or 'assignments'
  let uploadFile: File | null = null;
  let isUploading = false;
  let uploadProgress = 0;
  let uploadStatus = '';
  let uploadResults: any = null;
  let uploadHistory: any[] = [];
  let showUploadHistory = false;

  const couponTypes = [
    { value: 'fixed', label: 'Fixed Amount Off', description: 'e.g., 50 ﷼ off' },
    { value: 'percentage', label: 'Percentage Off', description: 'e.g., 20% off' },
    { value: 'points', label: 'Points Award', description: 'e.g., 100 bonus points' }
  ];

  // Load upload history on mount
  onMount(() => {
    loadCoupons();
    loadUploadHistory();
  });

  function handleRefresh() {
    loadCoupons();
  }

  async function loadCoupons() {
    try {
      isLoading = true;
      
      const { data, error: loadError } = await supabase
        .from('coupons')
        .select(`
          *,
          customer_coupons(count)
        `)
        .order('created_at', { ascending: false });

      if (loadError) throw loadError;

      coupons = (data || []).map(coupon => ({
        ...coupon,
        usage_count: coupon.customer_coupons ? coupon.customer_coupons.length : 0,
        is_expired: coupon.expires_at && new Date(coupon.expires_at) < new Date()
      }));
    } catch (err: any) {
      error = `Failed to load coupons: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingCoupon = null;
    formData = {
      code: generateCouponCode(),
      title: '',
      title_en: '',
      title_ar: '',
      description: '',
      description_en: '',
      description_ar: '',
      discount_type: 'fixed',
      discount_value: '',
      minimum_purchase: '',
      maximum_discount: '',
      usage_limit: '',
      usage_limit_per_customer: 1,
      valid_from: '',
      valid_until: '',
      expires_at: '',
      redemption_window_seconds: 300,
      status: 'active'
    };
    showModal = true;
  }

  function openEditModal(coupon: any) {
    editingCoupon = coupon;
    formData = {
      code: coupon.code,
      title: coupon.title || '',
      title_en: coupon.title_en || '',
      title_ar: coupon.title_ar || '',
      description: coupon.description || '',
      description_en: coupon.description_en || '',
      description_ar: coupon.description_ar || '',
      discount_type: coupon.discount_type || 'fixed',
      discount_value: coupon.discount_value || '',
      minimum_purchase: coupon.minimum_purchase || '',
      maximum_discount: coupon.maximum_discount || '',
      usage_limit: coupon.usage_limit || '',
      usage_limit_per_customer: coupon.usage_limit_per_customer || 1,
      valid_from: coupon.valid_from || '',
      valid_until: coupon.valid_until || '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      redemption_window_seconds: coupon.redemption_window_seconds || 300,
      status: coupon.status || 'active'
    };
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingCoupon = null;
    error = '';
    success = '';
  }

  function generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async function saveCoupon() {
    try {
      isLoading = true;

      const payload = {
        code: formData.code.toUpperCase().trim(),
        title: formData.title.trim(),
        title_en: formData.title_en.trim() || formData.title.trim(),
        title_ar: formData.title_ar.trim(),
        description: formData.description.trim(),
        description_en: formData.description_en.trim() || formData.description.trim(),
        description_ar: formData.description_ar.trim(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value.toString()) || 0,
        minimum_purchase: formData.minimum_purchase ? parseFloat(formData.minimum_purchase.toString()) : 0,
        maximum_discount: formData.maximum_discount ? parseFloat(formData.maximum_discount.toString()) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit.toString()) : null,
        usage_limit_per_customer: parseInt(formData.usage_limit_per_customer.toString()) || 1,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        redemption_window_seconds: parseInt(formData.redemption_window_seconds.toString()) || 300,
        status: formData.status
      };

      if (editingCoupon) {
        // Update existing coupon
        const { error: updateError } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingCoupon.id);

        if (updateError) throw updateError;
        success = 'Coupon updated successfully!';
      } else {
        // Create new coupon
        const { error: insertError } = await supabase
          .from('coupons')
          .insert(payload);

        if (insertError) throw insertError;
        success = 'Coupon created successfully!';
      }

      closeModal();
      loadCoupons();
    } catch (err: any) {
      error = `Failed to save coupon: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function toggleCouponStatus(coupon: any) {
    try {
      const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
      
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ status: newStatus })
        .eq('id', coupon.id);

      if (updateError) throw updateError;

      success = `Coupon ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`;
      loadCoupons();
    } catch (err: any) {
      error = `Failed to update coupon status: ${err.message}`;
    }
  }

  async function deleteCoupon(coupon: any) {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"? This action cannot be undone.`)) {
      return;
    }

    try {
      isLoading = true;

      const { error: deleteError } = await supabase
        .from('coupons')
        .update({ status: 'deleted' })
        .eq('id', coupon.id);

      if (deleteError) throw deleteError;

      success = 'Coupon deleted successfully!';
      loadCoupons();
    } catch (err: any) {
      error = `Failed to delete coupon: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function viewCouponUsage(coupon: any) {
    try {
      isLoading = true;
      
      const { data, error: usageError } = await supabase
        .from('customer_coupons')
        .select(`
          *,
          customers(full_name, customer_code)
        `)
        .eq('coupon_code', coupon.code)
        .order('assigned_at', { ascending: false });

      if (usageError) throw usageError;

      selectedCouponUsage = data || [];
      showUsageModal = true;
    } catch (err: any) {
      error = `Failed to load coupon usage: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function getTypeLabel(type: string): string {
    return couponTypes.find(t => t.value === type)?.label || type;
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'fixed':
        return '💰';
      case 'percentage':
        return '📊';
      case 'points':
        return '⭐';
      default:
        return '🎫';
    }
  }

  function formatExpiryDate(date: string): string {
    if (!date) return 'No expiry';
    const expiry = new Date(date);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  }

  // Bulk Upload Functions
  function openBulkUploadModal() {
    showBulkUploadModal = true;
    uploadFile = null;
    uploadResults = null;
    uploadProgress = 0;
    uploadStatus = '';
    error = '';
    success = '';
  }

  function closeBulkUploadModal() {
    showBulkUploadModal = false;
    uploadFile = null;
    uploadResults = null;
    uploadProgress = 0;
    uploadStatus = '';
    isUploading = false;
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      uploadFile = target.files[0];
      uploadResults = null;
      uploadProgress = 0;
      uploadStatus = '';
    }
  }

  async function processBulkUpload() {
    if (!uploadFile) {
      error = 'Please select a file to upload';
      return;
    }

    try {
      isUploading = true;
      uploadProgress = 0;
      uploadStatus = 'Reading file...';

      const fileBuffer = await uploadFile.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        throw new Error('The uploaded file is empty');
      }

      uploadProgress = 10;
      uploadStatus = `Processing ${data.length} records...`;

      let results;
      if (uploadMode === 'coupons') {
        results = await processCouponCreation(data);
      } else {
        results = await processCouponAssignments(data);
      }

      uploadResults = results;
      uploadProgress = 100;
      uploadStatus = 'Upload completed successfully!';

      // Save upload history
      const historyEntry = {
        id: Date.now(),
        type: uploadMode,
        filename: uploadFile.name,
        timestamp: new Date().toISOString(),
        totalRecords: data.length,
        successCount: results.successCount,
        errorCount: results.errorCount,
        results: results
      };

      uploadHistory = [historyEntry, ...uploadHistory.slice(0, 9)]; // Keep last 10 uploads
      localStorage.setItem('couponUploadHistory', JSON.stringify(uploadHistory));

      if (results.successCount > 0) {
        loadCoupons(); // Refresh the coupon list
        success = `Successfully processed ${results.successCount} out of ${data.length} records`;
      }

      if (results.errorCount > 0) {
        error = `${results.errorCount} records failed to process. Check the results for details.`;
      }

    } catch (err: any) {
      error = `Upload failed: ${err.message}`;
      uploadProgress = 0;
      uploadStatus = '';
    } finally {
      isUploading = false;
    }
  }

  async function processCouponCreation(data: any[]): Promise<any> {
    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [] as any[],
      success: [] as any[]
    };

    const batchSize = 10;
    const totalBatches = Math.ceil(data.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, data.length);
      const batch = data.slice(startIndex, endIndex);

      uploadProgress = 10 + (batchIndex / totalBatches) * 80;
      uploadStatus = `Processing batch ${batchIndex + 1} of ${totalBatches}...`;

      for (const row of batch) {
        const rowIndex = startIndex + batch.indexOf(row) + 1;
        
        try {
          // Validate required fields
          if (!row.code) {
            throw new Error('Coupon code is required');
          }
          if (!row.title) {
            throw new Error('Title is required');
          }
          if (!row.discount_value) {
            throw new Error('Discount value is required');
          }
          if (!row.discount_type) {
            throw new Error('Discount type is required');
          }

          // Validate discount type
          const validDiscountTypes = ['fixed', 'percentage', 'points'];
          if (!validDiscountTypes.includes(row.discount_type?.toLowerCase())) {
            throw new Error(`Invalid discount type. Must be one of: ${validDiscountTypes.join(', ')}`);
          }

          // Prepare coupon data
          const couponData = {
            code: row.code.toString().toUpperCase().trim(),
            title: row.title.toString().trim(),
            title_en: row.title_en?.toString().trim() || row.title.toString().trim(),
            title_ar: row.title_ar?.toString().trim() || '',
            description: row.description?.toString().trim() || '',
            description_en: row.description_en?.toString().trim() || row.description?.toString().trim() || '',
            description_ar: row.description_ar?.toString().trim() || '',
            discount_type: row.discount_type.toString().toLowerCase().trim(),
            discount_value: parseFloat(row.discount_value.toString()),
            minimum_purchase: row.minimum_purchase ? parseFloat(row.minimum_purchase.toString()) : 0,
            maximum_discount: row.maximum_discount ? parseFloat(row.maximum_discount.toString()) : null,
            usage_limit: row.usage_limit ? parseInt(row.usage_limit.toString()) : null,
            usage_limit_per_customer: row.usage_limit_per_customer ? parseInt(row.usage_limit_per_customer.toString()) : 1,
            valid_from: row.valid_from ? row.valid_from.toString() : null,
            valid_until: row.valid_until ? row.valid_until.toString() : null,
            expires_at: row.expires_at ? row.expires_at.toString() : null,
            redemption_window_seconds: row.redemption_window_seconds ? parseInt(row.redemption_window_seconds.toString()) : 300,
            status: row.status?.toString().toLowerCase().trim() || 'active'
          };

          // Validate status
          const validStatuses = ['active', 'inactive', 'expired', 'deleted'];
          if (!validStatuses.includes(couponData.status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
          }

          // Insert coupon
          const { error: insertError } = await supabase
            .from('coupons')
            .insert(couponData);

          if (insertError) {
            if (insertError.code === '23505') { // Unique constraint violation
              throw new Error(`Coupon code '${couponData.code}' already exists`);
            }
            throw new Error(insertError.message);
          }

          results.successCount++;
          results.success.push({
            row: rowIndex,
            code: couponData.code,
            title: couponData.title
          });

        } catch (err: any) {
          results.errorCount++;
          results.errors.push({
            row: rowIndex,
            code: row.code || 'N/A',
            error: err.message,
            data: row
          });
        }
      }

      // Small delay between batches to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  async function processCouponAssignments(data: any[]): Promise<any> {
    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [] as any[],
      success: [] as any[]
    };

    const batchSize = 10;
    const totalBatches = Math.ceil(data.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, data.length);
      const batch = data.slice(startIndex, endIndex);

      uploadProgress = 10 + (batchIndex / totalBatches) * 80;
      uploadStatus = `Processing batch ${batchIndex + 1} of ${totalBatches}...`;

      for (const row of batch) {
        const rowIndex = startIndex + batch.indexOf(row) + 1;
        
        try {
          // Validate required fields
          if (!row.customer_number && !row.customer_email) {
            throw new Error('Customer number or email is required');
          }
          if (!row.coupon_code) {
            throw new Error('Coupon code is required');
          }

          // Find customer
          let customerQuery = supabase.from('customers').select('id, customer, name');
          
          if (row.customer_number) {
            customerQuery = customerQuery.eq('customer', row.customer_number.toString().trim());
          } else {
            customerQuery = customerQuery.eq('email', row.customer_email.toString().trim());
          }

          const { data: customerData, error: customerError } = await customerQuery.single();

          if (customerError || !customerData) {
            throw new Error(`Customer not found: ${row.customer_number || row.customer_email}`);
          }

          // Find coupon
          const { data: couponData, error: couponError } = await supabase
            .from('coupons')
            .select('id, code, title, discount_type, discount_value, expires_at')
            .eq('code', row.coupon_code.toString().toUpperCase().trim())
            .eq('status', 'active')
            .single();

          if (couponError || !couponData) {
            throw new Error(`Coupon not found or inactive: ${row.coupon_code}`);
          }

          // Check if already assigned
          const { data: existingAssignment } = await supabase
            .from('customer_coupons')
            .select('id')
            .eq('customer_id', customerData.id)
            .eq('coupon_id', couponData.id)
            .eq('status', 'assigned')
            .single();

          if (existingAssignment) {
            throw new Error(`Coupon already assigned to this customer`);
          }

          // Prepare assignment data
          const assignmentData = {
            customer_id: customerData.id,
            coupon_id: couponData.id,
            coupon_code: couponData.code,
            expires_at: row.expires_at ? row.expires_at.toString() : couponData.expires_at,
            status: 'assigned'
          };

          // Insert assignment
          const { error: insertError } = await supabase
            .from('customer_coupons')
            .insert(assignmentData);

          if (insertError) {
            throw new Error(insertError.message);
          }

          results.successCount++;
          results.success.push({
            row: rowIndex,
            customer: customerData.customer,
            customer_name: customerData.name,
            coupon_code: couponData.code,
            coupon_title: couponData.title
          });

        } catch (err: any) {
          results.errorCount++;
          results.errors.push({
            row: rowIndex,
            customer: row.customer_number || row.customer_email || 'N/A',
            coupon_code: row.coupon_code || 'N/A',
            error: err.message,
            data: row
          });
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  function generateSampleFile(type: 'coupons' | 'assignments') {
    let sampleData;
    let filename;

    if (type === 'coupons') {
      sampleData = [
        {
          code: 'WELCOME20',
          title: 'Welcome Discount',
          title_en: 'Welcome Discount',
          title_ar: 'خصم الترحيب',
          description: '20% off on first purchase',
          description_en: '20% off on first purchase',
          description_ar: 'خصم 20% على الشراء الأول',
          discount_type: 'percentage',
          discount_value: 20,
          minimum_purchase: 100,
          maximum_discount: 50,
          usage_limit: 1000,
          usage_limit_per_customer: 1,
          valid_from: '2024-01-01',
          valid_until: '2024-12-31',
          expires_at: '2024-12-31 23:59:59',
          redemption_window_seconds: 300,
          status: 'active'
        },
        {
          code: 'SAVE50',
          title: 'Fixed Amount Discount',
          title_en: 'Fixed Amount Discount',
          title_ar: 'خصم مبلغ ثابت',
          description: '50 ﷼ off',
          description_en: '50 ﷼ off',
          description_ar: 'خصم 50 ريال',
          discount_type: 'fixed',
          discount_value: 50,
          minimum_purchase: 200,
          maximum_discount: '',
          usage_limit: 500,
          usage_limit_per_customer: 2,
          valid_from: '2024-01-01',
          valid_until: '2024-06-30',
          expires_at: '2024-06-30 23:59:59',
          redemption_window_seconds: 600,
          status: 'active'
        },
        {
          code: 'POINTS100',
          title: 'Bonus Points',
          title_en: 'Bonus Points',
          title_ar: 'نقاط إضافية',
          description: 'Get 100 bonus points',
          description_en: 'Get 100 bonus points',
          description_ar: 'احصل على 100 نقطة إضافية',
          discount_type: 'points',
          discount_value: 100,
          minimum_purchase: 0,
          maximum_discount: '',
          usage_limit: '',
          usage_limit_per_customer: 1,
          valid_from: '',
          valid_until: '',
          expires_at: '',
          redemption_window_seconds: 300,
          status: 'active'
        }
      ];
      filename = 'sample_coupon_creation.xlsx';
    } else {
      sampleData = [
        {
          customer_number: 'CUST001',
          customer_email: '',
          coupon_code: 'WELCOME20',
          expires_at: '2024-12-31 23:59:59'
        },
        {
          customer_number: 'CUST002',
          customer_email: '',
          coupon_code: 'SAVE50',
          expires_at: '2024-06-30 23:59:59'
        },
        {
          customer_number: '',
          customer_email: 'customer@example.com',
          coupon_code: 'POINTS100',
          expires_at: ''
        }
      ];
      filename = 'sample_coupon_assignments.xlsx';
    }

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Data');
    XLSX.writeFile(workbook, filename);
  }

  function loadUploadHistory() {
    const saved = localStorage.getItem('couponUploadHistory');
    if (saved) {
      uploadHistory = JSON.parse(saved);
    }
  }

  function clearUploadHistory() {
    uploadHistory = [];
    localStorage.removeItem('couponUploadHistory');
    showUploadHistory = false;
  }

  // Load upload history on mount
  onMount(() => {
    loadCoupons();
    loadUploadHistory();
  });
</script>

<div class="max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Coupon Management</h1>
          <p class="text-gray-600">Create and manage discount coupons for your loyalty program.</p>
        </div>
        <div class="flex space-x-3">
          <button
            on:click={openBulkUploadModal}
            class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            📊 Bulk Upload
          </button>
          <button
            on:click={openCreateModal}
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create Coupon
          </button>
        </div>
      </div>
    </div>

    <!-- Coupons Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each coupons.filter(c => c.status !== 'deleted') as coupon}
        <div class="bg-white rounded-lg shadow p-6 border-l-4 
                    {coupon.status === 'active' && !coupon.is_expired ? 'border-green-400' : 
                     coupon.is_expired ? 'border-red-400' : 'border-gray-400'}">
          
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center">
              <span class="text-2xl mr-2">{getTypeIcon(coupon.discount_type)}</span>
              <div>
                <h3 class="text-lg font-bold text-gray-900 font-mono">{coupon.code}</h3>
                <p class="text-sm text-gray-600">{getTypeLabel(coupon.discount_type)}</p>
                <p class="text-xs text-gray-500">{coupon.title}</p>
              </div>
            </div>
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                         {coupon.status === 'active' && !coupon.is_expired ? 'bg-green-100 text-green-800' : 
                           coupon.is_expired ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
              {coupon.is_expired ? 'Expired' : coupon.status}
            </span>
          </div>

          <div class="space-y-3 mb-4">
            <div class="flex justify-between">
              <span class="text-sm font-medium text-gray-500">Value:</span>
              <span class="text-sm font-bold">
                {#if coupon.discount_type === 'percentage'}
                  {coupon.discount_value}%
                {:else if coupon.discount_type === 'fixed'}
                  {coupon.discount_value} ﷼
                {:else if coupon.discount_type === 'points'}
                  {coupon.discount_value} points
                {:else}
                  {coupon.discount_value}
                {/if}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-sm font-medium text-gray-500">Used:</span>
              <span class="text-sm font-bold">{coupon.usage_count || 0} times</span>
            </div>

            <div class="flex justify-between">
              <span class="text-sm font-medium text-gray-500">Expiry:</span>
              <span class="text-sm font-bold 
                           {coupon.is_expired ? 'text-red-600' : 'text-gray-900'}">
                {formatExpiryDate(coupon.expires_at)}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-sm font-medium text-gray-500">Redemption Window:</span>
              <span class="text-sm font-bold">{Math.floor(coupon.redemption_window_seconds / 60)} min</span>
            </div>
          </div>

          <div class="flex justify-between items-center pt-4 border-t">
            <div class="flex space-x-2">
              <button
                on:click={() => openEditModal(coupon)}
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                on:click={() => viewCouponUsage(coupon)}
                class="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Usage
              </button>
            </div>
            <div class="flex space-x-2">
              <button
                on:click={() => toggleCouponStatus(coupon)}
                class="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
              >
                {coupon.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                on:click={() => deleteCoupon(coupon)}
                class="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      {/each}

      {#if coupons.filter(c => c.status !== 'deleted').length === 0 && !isLoading}
        <div class="col-span-full text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">🎫</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Coupons</h3>
          <p class="text-gray-500 mb-4">Create your first coupon to get started.</p>
          <button
            on:click={openCreateModal}
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create Coupon
          </button>
        </div>
      {/if}
    </div>

    <!-- Loading State -->
    {#if isLoading}
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-2">Loading coupons...</p>
      </div>
    {/if}

    <!-- Create/Edit Modal -->
    {#if showModal}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
            </h3>
            
            <form on:submit|preventDefault={saveCoupon} class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                <div class="flex">
                  <input
                    type="text"
                    bind:value={formData.code}
                    required
                    class="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    placeholder="SAVE20"
                    maxlength="20"
                  />
                  <button
                    type="button"
                    on:click={() => formData.code = generateCouponCode()}
                    class="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 text-sm"
                  >
                    🎲
                  </button>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  bind:value={formData.title}
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Summer Sale"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  bind:value={formData.description}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Special discount for loyal customers"
                  rows="2"
                ></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                <select
                  bind:value={formData.discount_type}
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {#each couponTypes as type}
                    <option value={type.value}>{type.label}</option>
                  {/each}
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  {couponTypes.find(t => t.value === formData.discount_type)?.description}
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                <input
                  type="number"
                  step="0.01"
                  bind:value={formData.discount_value}
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.discount_type === 'percentage' ? '20' : formData.discount_type === 'fixed' ? '50' : '100'}
                />
                <p class="text-xs text-gray-500 mt-1">
                  {#if formData.discount_type === 'percentage'}
                    Enter percentage without % symbol (e.g., 20 for 20%)
                  {:else if formData.discount_type === 'fixed'}
                    Enter amount without currency (e.g., 50 for 50 ﷼)
                  {:else}
                    Enter points amount (e.g., 100 for 100 points)
                  {/if}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Minimum Purchase</label>
                  <input
                    type="number"
                    step="0.01"
                    bind:value={formData.minimum_purchase}
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Maximum Discount</label>
                  <input
                    type="number"
                    step="0.01"
                    bind:value={formData.maximum_discount}
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    bind:value={formData.usage_limit}
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Per Customer Limit</label>
                  <input
                    type="number"
                    bind:value={formData.usage_limit_per_customer}
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    bind:value={formData.valid_from}
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    bind:value={formData.valid_until}
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date & Time</label>
                <input
                  type="datetime-local"
                  bind:value={formData.expires_at}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p class="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Redemption Window (seconds)</label>
                <input
                  type="number"
                  bind:value={formData.redemption_window_seconds}
                  min="60"
                  max="3600"
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p class="text-xs text-gray-500 mt-1">How long customers have to use the coupon after receiving it</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  bind:value={formData.status}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  bind:value={formData.expires_at}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p class="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Redemption Window (minutes)</label>
                <input
                  type="number"
                  bind:value={formData.redemption_window_seconds}
                  min="60"
                  max="3600"
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p class="text-xs text-gray-500 mt-1">How long customers have to use the coupon after receiving it</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  bind:value={formData.status}
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div class="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  on:click={closeModal}
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    {/if}

    <!-- Usage Modal -->
    {#if showUsageModal}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">Coupon Usage History</h3>
              <button
                on:click={() => showUsageModal = false}
                class="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {#if selectedCouponUsage.length === 0}
              <div class="text-center py-8 text-gray-500">
                No usage history found for this coupon.
              </div>
            {:else}
              <div class="max-h-96 overflow-y-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {#each selectedCouponUsage as usage}
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm font-medium text-gray-900">{usage.customers?.full_name || 'Unknown'}</div>
                          <div class="text-sm text-gray-500 font-mono">{usage.customers?.customer_code || 'N/A'}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(usage.assigned_at).toLocaleString()}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                       {usage.status === 'used' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                            {usage.status === 'used' ? 'Used' : usage.status === 'assigned' ? 'Assigned' : usage.status}
                          </span>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Bulk Upload Modal -->
    {#if showBulkUploadModal}
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-bold text-gray-900">Bulk Coupon Upload</h3>
              <button
                on:click={closeBulkUploadModal}
                class="text-gray-400 hover:text-gray-600"
                disabled={isUploading}
              >
                ✕
              </button>
            </div>

            <!-- Upload Mode Selection -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-3">Upload Type</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="relative">
                  <input
                    type="radio"
                    bind:group={uploadMode}
                    value="coupons"
                    disabled={isUploading}
                    class="sr-only"
                  />
                  <div class="p-4 border-2 rounded-lg cursor-pointer transition-all
                              {uploadMode === 'coupons' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'}">
                    <div class="flex items-center">
                      <div class="text-2xl mr-3">🎫</div>
                      <div>
                        <h4 class="font-semibold text-gray-900">Create Coupons</h4>
                        <p class="text-sm text-gray-600">Upload multiple coupons to create them in bulk</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label class="relative">
                  <input
                    type="radio"
                    bind:group={uploadMode}
                    value="assignments"
                    disabled={isUploading}
                    class="sr-only"
                  />
                  <div class="p-4 border-2 rounded-lg cursor-pointer transition-all
                              {uploadMode === 'assignments' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'}">
                    <div class="flex items-center">
                      <div class="text-2xl mr-3">👥</div>
                      <div>
                        <h4 class="font-semibold text-gray-900">Assign Coupons</h4>
                        <p class="text-sm text-gray-600">Assign existing coupons to specific customers</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Sample Files Section -->
            <div class="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 class="font-semibold text-blue-900 mb-2">📋 Sample Files</h4>
              <p class="text-sm text-blue-800 mb-3">
                Download sample Excel files to see the required format:
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  on:click={() => generateSampleFile('coupons')}
                  class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  disabled={isUploading}
                >
                  📊 Coupon Creation Sample
                </button>
                <button
                  type="button"
                  on:click={() => generateSampleFile('assignments')}
                  class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  disabled={isUploading}
                >
                  👥 Coupon Assignment Sample
                </button>
                <button
                  type="button"
                  on:click={() => showUploadHistory = !showUploadHistory}
                  class="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  disabled={isUploading}
                >
                  📝 Upload History
                </button>
              </div>
            </div>

            <!-- File Upload Section -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File (.xlsx)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                on:change={handleFileSelect}
                disabled={isUploading}
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {#if uploadFile}
                <p class="text-sm text-green-600 mt-2">
                  ✓ Selected: {uploadFile.name}
                </p>
              {/if}
            </div>

            <!-- Upload Progress -->
            {#if isUploading}
              <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-gray-700">Upload Progress</span>
                  <span class="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style="width: {uploadProgress}%"
                  ></div>
                </div>
                {#if uploadStatus}
                  <p class="text-sm text-gray-600 mt-2">{uploadStatus}</p>
                {/if}
              </div>
            {/if}

            <!-- Upload Results -->
            {#if uploadResults}
              <div class="mb-6 p-4 border rounded-lg">
                <h4 class="font-semibold text-gray-900 mb-3">Upload Results</h4>
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="text-center p-3 bg-green-50 rounded">
                    <div class="text-2xl font-bold text-green-600">{uploadResults.successCount}</div>
                    <div class="text-sm text-green-700">Successful</div>
                  </div>
                  <div class="text-center p-3 bg-red-50 rounded">
                    <div class="text-2xl font-bold text-red-600">{uploadResults.errorCount}</div>
                    <div class="text-sm text-red-700">Failed</div>
                  </div>
                </div>

                {#if uploadResults.errors.length > 0}
                  <div class="mb-4">
                    <h5 class="font-medium text-red-700 mb-2">Errors ({uploadResults.errors.length})</h5>
                    <div class="max-h-40 overflow-y-auto">
                      {#each uploadResults.errors.slice(0, 10) as error}
                        <div class="text-sm p-2 bg-red-50 border-l-4 border-red-400 mb-2">
                          <div class="font-medium">Row {error.row}: {error.code || error.customer || 'N/A'}</div>
                          <div class="text-red-600">{error.error}</div>
                        </div>
                      {/each}
                      {#if uploadResults.errors.length > 10}
                        <div class="text-sm text-gray-500 text-center py-2">
                          ... and {uploadResults.errors.length - 10} more errors
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}

                {#if uploadResults.success.length > 0}
                  <div>
                    <h5 class="font-medium text-green-700 mb-2">Successful ({uploadResults.success.length})</h5>
                    <div class="max-h-40 overflow-y-auto">
                      {#each uploadResults.success.slice(0, 10) as success}
                        <div class="text-sm p-2 bg-green-50 border-l-4 border-green-400 mb-2">
                          {#if uploadMode === 'coupons'}
                            <div class="font-medium">Row {success.row}: {success.code}</div>
                            <div class="text-green-600">{success.title}</div>
                          {:else}
                            <div class="font-medium">Row {success.row}: {success.customer}</div>
                            <div class="text-green-600">{success.customer_name} → {success.coupon_code}</div>
                          {/if}
                        </div>
                      {/each}
                      {#if uploadResults.success.length > 10}
                        <div class="text-sm text-gray-500 text-center py-2">
                          ... and {uploadResults.success.length - 10} more successful records
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Upload History -->
            {#if showUploadHistory}
              <div class="mb-6 p-4 border rounded-lg">
                <div class="flex justify-between items-center mb-3">
                  <h4 class="font-semibold text-gray-900">Upload History</h4>
                  {#if uploadHistory.length > 0}
                    <button
                      on:click={clearUploadHistory}
                      class="text-red-600 text-sm hover:text-red-800"
                    >
                      Clear History
                    </button>
                  {/if}
                </div>
                
                {#if uploadHistory.length === 0}
                  <p class="text-gray-500 text-center py-4">No upload history available</p>
                {:else}
                  <div class="max-h-60 overflow-y-auto">
                    {#each uploadHistory as history}
                      <div class="border-b pb-3 mb-3 last:border-b-0">
                        <div class="flex justify-between items-start">
                          <div>
                            <div class="font-medium text-gray-900">
                              {history.type === 'coupons' ? '🎫 Coupon Creation' : '👥 Coupon Assignment'}
                            </div>
                            <div class="text-sm text-gray-600">{history.filename}</div>
                          </div>
                          <div class="text-right">
                            <div class="text-sm font-medium">
                              {history.successCount}/{history.totalRecords} successful
                            </div>
                            <div class="text-xs text-gray-500">
                              {new Date(history.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                on:click={closeBulkUploadModal}
                disabled={isUploading}
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:bg-gray-200"
              >
                {isUploading ? 'Uploading...' : 'Close'}
              </button>
              <button
                type="button"
                on:click={processBulkUpload}
                disabled={!uploadFile || isUploading}
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isUploading ? 'Processing...' : `Upload ${uploadMode === 'coupons' ? 'Coupons' : 'Assignments'}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Messages -->
    {#if error}
      <div class="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
        {success}
      </div>
    {/if}
  </div>
