<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { uploadManager } from '$lib/uploadManager';
  import * as XLSX from 'xlsx';

  let branches: any[] = [];
  let selectedBranch = '';
  let isLoading = false;
  let error = '';
  let success = '';
  let uploadProgress = 0;
  let showProcessStatus = false;
  let currentProcessingRow = 0;
  let processingMessage = '';

  // Queue upload status
  // Always use queue mode (uploadManager) - legacy mode removed
  let uploadJobId = '';
  let queueProgress = { processed: 0, total: 0, failed: 0 };

  // Last upload status tracking
  let lastUploadStatus: any = null;
  let recentUploads: any[] = [];
  let showLastUploadStatus = false;

  // Manual entry
  let manualTransaction = {
    bill_no: '',
    bill_date: '',
    bill_amount: '',
    customer: '',
    add_amt: '',
    redeem: ''
  };

  // Excel upload
  let fileInput: HTMLInputElement;
  let selectedFile: File | null = null;
  let previewData: any[] = [];
  let showPreview = false;

  // Upload statistics
  let uploadStats = {
    total: 0,
    successful: 0,
    errors: 0,
    invalidCustomers: 0
  };

  let uploadErrors: any[] = [];

  onMount(() => {
    loadBranches();
    loadLastUploadStatus();
    loadRecentUploads();
    
    // Debug: Test upload manager
    console.log('Upload Manager:', uploadManager);
    console.log('Active uploads store:', uploadManager.activeUploadsStore);
    console.log('Completed uploads store:', uploadManager.completedUploadsStore);
  });

  // Load last upload status from upload manager
  async function loadLastUploadStatus() {
    try {
      // Get active uploads
      uploadManager.activeUploadsStore.subscribe(uploads => {
        const uploadArray = Array.from(uploads.values());
        if (uploadArray.length > 0) {
          // Convert UploadProgress to UploadJob format for display
          const activeUpload = uploadArray[0];
          lastUploadStatus = {
            id: activeUpload.jobId,
            fileName: activeUpload.fileName,
            status: activeUpload.status,
            progress: activeUpload.progress,
            created_at: new Date().toISOString(),
            error_msg: activeUpload.error
          };
          showLastUploadStatus = true;
          console.log('Active upload found:', lastUploadStatus);
        }
      });

      // Get completed uploads
      uploadManager.completedUploadsStore.subscribe(uploads => {
        if (uploads.length > 0 && !lastUploadStatus) {
          lastUploadStatus = uploads[0]; // Most recent completed upload
          showLastUploadStatus = true;
          console.log('Completed upload found:', lastUploadStatus);
        }
      });
    } catch (err) {
      console.error('Failed to load last upload status:', err);
    }
  }

  // Load recent uploads for display
  async function loadRecentUploads() {
    try {
      // Subscribe to both active and completed uploads
      uploadManager.activeUploadsStore.subscribe(activeMap => {
        uploadManager.completedUploadsStore.subscribe(completed => {
          const activeArray = Array.from(activeMap.values()).map(upload => ({
            id: upload.jobId,
            fileName: upload.fileName,
            status: upload.status,
            progress: upload.progress,
            created_at: new Date().toISOString(),
            error_msg: upload.error
          }));
          
          recentUploads = [
            ...activeArray,
            ...completed.slice(0, 5) // Show last 5 completed uploads
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          console.log('Recent uploads updated:', recentUploads);
        });
      });
    } catch (err) {
      console.error('Failed to load recent uploads:', err);
    }
  }

  function testUploadStatus() {
    console.log('🧪 Testing upload status display...');
    
    // Create a mock upload status
    const mockStatus = {
      id: 'test-upload-' + Date.now(),
      fileName: 'test-transactions.xlsx', 
      status: 'uploading',
      progress: 45,
      processed: 45,
      total: 100,
      success_count: 42,
      error_count: 3,
      created_at: new Date().toISOString(),
      errors: [
        { row: 23, error: 'Invalid mobile number: 123' },
        { row: 67, error: 'Missing customer data' },
        { row: 89, error: 'Invalid bill amount' }
      ]
    };
    
    // Simulate status updates
    lastUploadStatus = mockStatus;
    showLastUploadStatus = true;
    
    console.log('Mock status created:', mockStatus);
    console.log('showLastUploadStatus set to:', showLastUploadStatus);
    
    // Also add to recent uploads
    recentUploads = [mockStatus, ...recentUploads.slice(0, 4)];
    console.log('recentUploads updated:', recentUploads);
  }

  // Handle global refresh from parent layout
  function handleRefresh() {
    loadBranches();
    clearAll();
  }

  async function loadBranches() {
    try {
      const { data, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .order('name_en');

      if (branchError) throw branchError;
      branches = data || [];
    } catch (err: any) {
      error = `Failed to load branches: ${err.message}`;
    }
  }

  function validateMobile(mobile: string): boolean {
    // Remove any spaces and clean the number
    const cleanMobile = mobile.replace(/\s/g, '');
    
    // Accept both formats:
    // 1. 5xxxxxxxx (9 digits starting with 5)
    // 2. 05xxxxxxxx (10 digits starting with 05) 
    return /^5\d{8}$/.test(cleanMobile) || /^05\d{8}$/.test(cleanMobile);
  }

  async function validateCustomer(mobile: string, branchId: string): Promise<any> {
    console.log(`🔍 Validating customer: ${mobile} for branch: ${branchId}`);
    console.log(`📝 Mobile type: ${typeof mobile}, Branch type: ${typeof branchId}`);
    console.log(`📝 Mobile length: ${mobile.length}, Branch length: ${branchId.length}`);
    
    // ✅ NORMALIZE for lookups: Try both formats during database lookup
    let lookupMobile = mobile;
    let altLookupMobile = null;
    
    if (mobile.startsWith('05') && mobile.length === 10) {
      // If we have 05xxxxxxxx, also try 5xxxxxxxx
      altLookupMobile = mobile.substring(1);
    } else if (mobile.length === 9 && mobile.startsWith('5')) {
      // If we have 5xxxxxxxx, also try 05xxxxxxxx  
      altLookupMobile = '0' + mobile;
    }
    
    // First try to find customer by mobile number (registered customers) - using simpler query
    console.log(`🔄 Attempting customer lookup by mobile: ${lookupMobile}`);
    
    let { data: customer, error } = await supabase
      .from('customers')
      .select('id, name, points, branch_id, customer_code, mobile')
      .eq('mobile', lookupMobile)
      .single();

    console.log('🔄 Customer lookup result:', { customer, error });
    console.log('📊 Error details:', error);

    // If first lookup failed and we have an alternative format, try that
    if ((!customer || error) && altLookupMobile) {
      console.log(`🔄 Trying alternative mobile format: ${altLookupMobile}`);
      const altResult = await supabase
        .from('customers')
        .select('id, name, points, branch_id, customer_code, mobile')
        .eq('mobile', altLookupMobile)
        .single();
      
      if (!altResult.error && altResult.data) {
        customer = altResult.data;
        error = altResult.error;
      }
    }

    if (!error && customer) {
      console.log('✅ Found existing customer:', customer);
      return customer;
    }

    // Also try by customer_code if mobile lookup failed
    if (error && error.code === 'PGRST116') {
      console.log(`🔄 Trying customer lookup by customer_code: ${lookupMobile}`);
      
      let { data: customerByCode, error: codeError } = await supabase
        .from('customers')
        .select('id, name, points, branch_id, customer_code, mobile')
        .eq('customer_code', lookupMobile)
        .single();

      // If first lookup failed and we have an alternative format, try that
      if ((!customerByCode || codeError) && altLookupMobile) {
        console.log(`🔄 Trying alternative customer_code format: ${altLookupMobile}`);
        const altCodeResult = await supabase
          .from('customers')
          .select('id, name, points, branch_id, customer_code, mobile')
          .eq('customer_code', altLookupMobile)
          .single();
        
        if (!altCodeResult.error && altCodeResult.data) {
          customerByCode = altCodeResult.data;
          codeError = altCodeResult.error;
        }
      }

      console.log('🔄 Customer code lookup result:', { customerByCode, codeError });

      if (!codeError && customerByCode) {
        console.log('✅ Found existing customer by code:', customerByCode);
        return customerByCode;
      }
    }

    // If customer not found, check if they're eligible (in customer_numbers table)
    console.log('🔍 Checking eligibility in customer_numbers table...');
    console.log(`🔄 Attempting eligibility check with query: customer.eq.${lookupMobile}`);
    
    let { data: eligibleCustomer, error: eligibilityError } = await supabase
      .from('customer_numbers')
      .select('customer, status, branch_id')
      .eq('customer', lookupMobile)
      .single();

    // If first lookup failed and we have an alternative format, try that
    if ((!eligibleCustomer || eligibilityError) && altLookupMobile) {
      console.log(`🔄 Trying alternative customer_numbers format: ${altLookupMobile}`);
      const altEligibleResult = await supabase
        .from('customer_numbers')
        .select('customer, status, branch_id')
        .eq('customer', altLookupMobile)
        .single();
      
      if (!altEligibleResult.error && altEligibleResult.data) {
        eligibleCustomer = altEligibleResult.data;
        eligibilityError = altEligibleResult.error;
      }
    }

    console.log('🔄 Eligibility check result:', { eligibleCustomer, eligibilityError });
    console.log('📊 Eligibility error details:', eligibilityError);

    if (!eligibilityError && eligibleCustomer) {
      if (eligibleCustomer.status === 'registered') {
        console.log('⚠️ Customer marked as registered but not found in customers table');
        throw new Error('Customer marked as registered but not found in customers table');
      }

      console.log('✅ Found eligible unregistered customer');
      // Return existing eligible customer
      return {
        id: null,
        name: `Unregistered Customer ${mobile}`,
        points: 0,
        branch_id: eligibleCustomer.branch_id,
        customer_code: mobile,
        mobile: mobile,
        isUnregistered: true
      };
    }

    // 🚀 AUTO-ADD: Customer not found anywhere - automatically add them as eligible
    console.log(`📝 Auto-adding new customer ${mobile} to eligible list for branch ${branchId}`);
    console.log(`📝 Insert data:`, {
      customer: mobile,
      status: 'not_registered',
      branch_id: branchId,
      uploaded_at: new Date().toISOString()
    });
    
    const { error: insertError } = await supabase
      .from('customer_numbers')
      .insert({
        customer: mobile,
        status: 'not_registered',
        branch_id: branchId,
        uploaded_at: new Date().toISOString()
      });

    console.log('🔄 Auto-add result:', { insertError });
    console.log('📊 Insert error details:', insertError);

    if (insertError) {
      console.error('❌ Failed to auto-add customer:', insertError);
      throw new Error(`Failed to add customer ${mobile} to eligible list: ${insertError.message}`);
    }

    console.log('✅ Successfully auto-added customer to eligible list');
    // Return the newly added customer as unregistered
    return {
      id: null,
      name: `New Customer ${mobile}`,
      points: 0,
      branch_id: branchId,
      customer_code: mobile,
      mobile: mobile,
      isUnregistered: true,
      isNewlyAdded: true
    };
  }

  async function addManualTransaction() {
    if (!selectedBranch) {
      error = 'Please select a branch first';
      return;
    }

    if (!validateMobile(manualTransaction.customer)) {
      error = 'Please enter a valid 10-digit Saudi mobile number starting with 5';
      return;
    }

    if (!manualTransaction.bill_no.trim()) {
      error = 'Please enter bill number';
      return;
    }

    if (!manualTransaction.bill_date) {
      error = 'Please enter bill date';
      return;
    }

    if (!manualTransaction.bill_amount || parseFloat(manualTransaction.bill_amount) <= 0) {
      error = 'Please enter a valid bill amount';
      return;
    }

    try {
      isLoading = true;
      error = '';

      // Validate customer exists
      const customer = await validateCustomer(manualTransaction.customer, selectedBranch);

      const addAmt = parseFloat(manualTransaction.add_amt) || 0;
      const redeemAmt = parseFloat(manualTransaction.redeem) || 0;
      const currentPoints = customer.points || 0;
      const balanceAfter = currentPoints + addAmt - redeemAmt;

      // Insert transaction using the correct table structure
      const { error: insertError } = await supabase
        .from('customer_transactions')
        .insert({
          bill_no: manualTransaction.bill_no.trim(),
          bill_date: manualTransaction.bill_date,
          bill_amount: parseFloat(manualTransaction.bill_amount),
          customer_id: customer.isUnregistered ? null : customer.id,
          customer_code: manualTransaction.customer,
          customer_mobile: manualTransaction.customer,
          branch_id: selectedBranch,
          transaction_type: 'purchase',
          amount: parseFloat(manualTransaction.bill_amount),
          points_earned: addAmt,
          points_used: redeemAmt,
          add_amt: addAmt,
          redeem: redeemAmt,
          balance_after: balanceAfter,
          status: 'completed',
          transaction_date: new Date().toISOString(),
          processed_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Update customer points and total spent
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          points: balanceAfter,
          total_spent: customer.total_spent + parseFloat(manualTransaction.bill_amount)
        })
        .eq('id', customer.id);

      if (updateError) throw updateError;

      // Log the upload
      await logUpload('manual_entry', 1, 1, 0, []);

      success = 'Transaction added successfully!';
      
      // Reset form
      manualTransaction = {
        bill_no: '',
        bill_date: '',
        bill_amount: '',
        customer: '',
        add_amt: '',
        redeem: ''
      };

    } catch (err: any) {
      error = `Failed to add transaction: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    selectedFile = file;
    previewExcelFile(file);
  }

  async function previewExcelFile(file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and take first 5 rows for preview
      previewData = jsonData.slice(1, 6).map((row: any, index) => {
        let customer = row[3]?.toString().trim() || '';
        
        // ✅ PRESERVE ORIGINAL FORMAT - Store the customer number as-is from Excel
        // Only normalize for validation, but keep original for database storage
        let originalCustomer = customer;
        
        // Ensure it has the proper format (add leading 0 if missing)
        if (customer.length === 9 && customer.startsWith('5')) {
          originalCustomer = '0' + customer;
        } else if (customer.startsWith('05') && customer.length === 10) {
          originalCustomer = customer; // Already has proper format
        }
        
        return {
          rowNumber: index + 2,
          bill_no: row[0]?.toString().trim() || '',
          bill_date: row[1]?.toString().trim() || '',
          bill_amount: row[2]?.toString().trim() || '',
          customer: originalCustomer, // Store with leading 0
          add_amt: row[4]?.toString().trim() || '',
          redeem: row[5]?.toString().trim() || '',
          status: 'Checking...' // Will be updated by validatePreviewData
        };
      });

      // Validate preview data asynchronously
      await validatePreviewData();

      showPreview = true;
      error = '';
    } catch (err: any) {
      error = `Failed to preview file: ${err.message}`;
    }
  }

  async function validatePreviewData() {
    if (!selectedBranch || !previewData.length) return;
    
    console.log(`🔍 Starting preview validation with selectedBranch: "${selectedBranch}"`);
    console.log(`📋 Preview data length: ${previewData.length}`);

    for (let i = 0; i < previewData.length; i++) {
      const row = previewData[i];
      console.log(`🔄 Processing preview row ${i + 1}:`, row);
      
      try {
        if (!validateMobile(row.customer)) {
          console.log(`❌ Mobile validation failed for: ${row.customer}`);
          previewData[i].status = '✗ Invalid Mobile';
          continue;
        }
        
        console.log(`✅ Mobile validation passed for: ${row.customer}`);
        console.log(`🔍 About to validate customer: ${row.customer} for branch: "${selectedBranch}"`);
        
        const customerRecord = await validateCustomer(row.customer, selectedBranch);
        console.log(`✅ Customer validation successful:`, customerRecord);
        
        if (customerRecord.isNewlyAdded) {
          previewData[i].status = '✨ Auto-Added New Customer';
        } else if (customerRecord.isUnregistered) {
          previewData[i].status = '⏳ Eligible (Not Registered)';
        } else {
          previewData[i].status = '✅ Registered Customer';
        }
      } catch (err: any) {
        console.error(`❌ Customer validation failed for ${row.customer}:`, err);
        previewData[i].status = '✗ Not Eligible';
      }
    }
    
    // Trigger reactivity
    previewData = [...previewData];
  }

  async function uploadExcelFile() {
    if (!selectedFile || !selectedBranch) {
      error = 'Please select both a file and a branch';
      return;
    }

    // Always use the queue system (uploadManager)
    await uploadViaQueue();
  }

  // NEW: Queue-based upload for background processing
  async function uploadViaQueue() {
    try {
      isLoading = true;
      error = '';
      success = '';
      processingMessage = 'Reading Excel file...';

      const arrayBuffer = await selectedFile!.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row
      const transactionRows = jsonData.slice(1).filter((row: any) => row.length > 0);
      processingMessage = `Processing ${transactionRows.length} transactions directly...`;

      // Transform Excel data to transaction records and process them directly
      let processedCount = 0;
      let failedCount = 0;
      const errors: any[] = [];

      for (let i = 0; i < transactionRows.length; i++) {
        const row = transactionRows[i];
        try {
          // Extract data from Excel row
          const billNo = row[0]?.toString().trim() || `AUTO-${Date.now()}-${i}`;
          const billDate = row[1]?.toString().trim() || new Date().toISOString().split('T')[0];
          const billAmount = parseFloat(row[2]?.toString().trim() || '0');
          let customerMobile = row[3]?.toString().trim() || '';
          const addAmt = parseFloat(row[4]?.toString().trim() || '0');
          const redeem = parseFloat(row[5]?.toString().trim() || '0');

          // Normalize mobile number - ensure 10 digits starting with 0
          customerMobile = customerMobile.replace(/\D/g, '');
          if (customerMobile.length === 9 && customerMobile.startsWith('5')) {
            customerMobile = '0' + customerMobile;
          }
          if (customerMobile.length !== 10 || !customerMobile.startsWith('0')) {
            throw new Error(`Invalid mobile number format: ${row[3]} -> ${customerMobile}`);
          }

          console.log(`Processing row ${i + 1}: ${billNo}, ${customerMobile}, Amount: ${billAmount}, Add: ${addAmt}, Redeem: ${redeem}`);

          // Find or create customer
          let customer = null;
          const { data: existingCustomers, error: customerLookupError } = await supabase
            .from('customers')
            .select('id, customer_code, mobile, branch_id, total_points')
            .eq('mobile', customerMobile)
            .limit(1);

          if (customerLookupError) {
            throw new Error(`Customer lookup failed: ${customerLookupError.message}`);
          }

          if (existingCustomers && existingCustomers.length > 0) {
            customer = existingCustomers[0];
            console.log(`Found existing customer: ${customer.id}`);
          } else {
            // Create new customer
            const { data: defaultCardType } = await supabase
              .from('card_types')
              .select('id')
              .eq('name', 'bronze')
              .single();

            const newCustomerData = {
              customer_code: customerMobile,
              mobile: customerMobile,
              branch_id: selectedBranch,
              card_type_id: defaultCardType?.id,
              status: 'active',
              card_status: 'unregistered',
              points: 0,
              total_points: 0,
              created_at: new Date().toISOString()
            };

            const { data: newCustomer, error: customerError } = await supabase
              .from('customers')
              .insert([newCustomerData])
              .select('id, customer_code, mobile, branch_id, total_points')
              .single();

            if (customerError) {
              throw new Error(`Failed to create customer: ${customerError.message}`);
            }
            customer = newCustomer;
            console.log(`Created new customer: ${customer.id}`);
          }

          // Convert decimal values to integers as expected by database
          const pointsEarnedInt = Math.round(addAmt);
          const pointsRedeemedInt = Math.round(redeem);
          const addAmtInt = Math.round(addAmt);
          const redeemInt = Math.round(redeem);

          // Create transaction with INTEGER values
          const transactionData = {
            bill_no: billNo,
            bill_date: billDate,
            bill_amount: billAmount,
            customer_id: customer.id,
            customer_mobile: customerMobile,
            customer_code: customerMobile,
            branch_id: selectedBranch,
            transaction_type: 'upload',
            amount: billAmount,
            points_earned: pointsEarnedInt,
            points_redeemed: pointsRedeemedInt,
            add_amt: addAmtInt,
            redeem: redeemInt,
            notes: `Excel Upload - Bill #${billNo}`,
            transaction_date: new Date().toISOString(),
            status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          console.log(`Inserting transaction:`, transactionData);

          const { error: transactionError } = await supabase
            .from('customer_transactions')
            .insert([transactionData]);

          if (transactionError) {
            throw new Error(`Transaction insert failed: ${transactionError.message}`);
          }

          // Update customer total points
          const newTotalPoints = (customer.total_points || 0) + addAmtInt - redeemInt;
          const { error: updateError } = await supabase
            .from('customers')
            .update({ 
              total_points: Math.max(0, newTotalPoints),
              points: Math.max(0, newTotalPoints),
              updated_at: new Date().toISOString()
            })
            .eq('id', customer.id);

          if (updateError) {
            console.warn(`Failed to update customer points: ${updateError.message}`);
          }

          processedCount++;
          processingMessage = `Processed ${processedCount}/${transactionRows.length} transactions...`;

        } catch (err: any) {
          failedCount++;
          const errorMsg = `Row ${i + 1}: ${err.message}`;
          errors.push({ row: i + 1, error: errorMsg });
          console.error(errorMsg);
        }

        // Update progress (simple progress tracking)
        uploadProgress = ((i + 1) / transactionRows.length) * 100;
      }

      // Final results
      uploadStats.total = transactionRows.length;
      uploadStats.successful = processedCount;
      uploadStats.errors = failedCount;
      uploadErrors = errors;

      if (processedCount > 0) {
        success = `Upload completed! Successfully processed ${processedCount} out of ${transactionRows.length} transactions.`;
        if (failedCount > 0) {
          success += ` ${failedCount} transactions failed - see error details below.`;
        }
        
        // Log the upload
        await logUpload(selectedFile!.name, transactionRows.length, processedCount, failedCount, errors);
      } else {
        error = `Upload failed! No transactions were processed successfully.`;
      }

      processingMessage = 'Upload completed!';

    } catch (err: any) {
      error = `Upload failed: ${err.message}`;
      console.error('Upload error:', err);
    } finally {
      isLoading = false;
    }
  }

  // Monitor queue progress
  async function startProgressMonitoring() {
    if (!uploadJobId) return;

    const interval = setInterval(async () => {
      const status = await uploadManager.getUploadStatus(uploadJobId);
      if (status) {
        queueProgress = status.progress;
        uploadProgress = uploadManager.getProgressPercentage(status);
        
        if (status.status === 'processing') {
          processingMessage = `Processing: ${status.progress.processed}/${status.progress.total} transactions`;
          showProcessStatus = true;
        } else if (status.status === 'completed') {
          showProcessStatus = false;
          success = `Upload completed! ${status.progress.processed} transactions processed, ${status.progress.failed} failed.`;
          clearInterval(interval);
        } else if (status.status === 'failed') {
          showProcessStatus = false;
          error = `Upload failed: ${status.error_msg || 'Unknown error'}`;
          clearInterval(interval);
        }
      }
    }, 2000);

    // Stop monitoring after 30 minutes
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  }

  // LEGACY: Direct upload (for backward compatibility)
  async function uploadDirectly() {
    if (!selectedFile || !selectedBranch) {
      error = 'Please select both a file and a branch';
      return;
    }

    try {
      isLoading = true;
      showProcessStatus = true;
      error = '';
      uploadProgress = 0;
      currentProcessingRow = 0;
      processingMessage = 'Reading Excel file...';
      uploadStats = { total: 0, successful: 0, errors: 0, invalidCustomers: 0 };
      uploadErrors = [];

      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row
      const transactionRows = jsonData.slice(1).filter((row: any) => row.length > 0);
      uploadStats.total = transactionRows.length;
      processingMessage = `Processing ${transactionRows.length} transactions...`;

      for (let i = 0; i < transactionRows.length; i++) {
        const row: any = transactionRows[i];
        const rowNumber = i + 2;
        currentProcessingRow = rowNumber;
        processingMessage = `Processing row ${rowNumber} of ${transactionRows.length + 1}...`;

        // Update progress every 10 rows or on last row for better performance
        if (i % 10 === 0 || i === transactionRows.length - 1) {
          uploadProgress = Math.round(((i + 1) / transactionRows.length) * 100);
          // Allow UI to update
          await new Promise(resolve => setTimeout(resolve, 1));
        }

        try {
          const billNo = row[0]?.toString().trim() || '';
          const billDate = row[1]?.toString().trim() || '';
          const billAmount = parseFloat(row[2]?.toString().trim() || '0');
          let customer = row[3]?.toString().trim() || '';
          const addAmt = parseFloat(row[4]?.toString().trim() || '0');
          const redeemAmt = parseFloat(row[5]?.toString().trim() || '0');

          // ✅ PRESERVE ORIGINAL FORMAT - Store the customer number as-is from Excel
          // Ensure it has the proper format (add leading 0 if missing)
          let originalCustomer = customer;
          if (customer.length === 9 && customer.startsWith('5')) {
            originalCustomer = '0' + customer; // Add leading 0 if missing
          } else if (customer.startsWith('05') && customer.length === 10) {
            originalCustomer = customer; // Already has proper format
          }
          
          // Use original format for database storage
          customer = originalCustomer;

          // Validate required fields
          if (!billNo) {
            uploadErrors.push({
              row: rowNumber,
              customer,
              error: 'Missing bill number'
            });
            uploadStats.errors++;
            continue;
          }

          if (!billDate) {
            uploadErrors.push({
              row: rowNumber,
              customer,
              error: 'Missing bill date'
            });
            uploadStats.errors++;
            continue;
          }

          if (!billAmount || billAmount <= 0) {
            uploadErrors.push({
              row: rowNumber,
              customer,
              error: 'Invalid bill amount'
            });
            uploadStats.errors++;
            continue;
          }

          if (!validateMobile(customer)) {
            uploadErrors.push({
              row: rowNumber,
              customer,
              error: 'Invalid mobile number format'
            });
            uploadStats.errors++;
            continue;
          }

          // Validate customer exists
          let customerRecord;
          try {
            customerRecord = await validateCustomer(customer, selectedBranch);
          } catch (err: any) {
            uploadErrors.push({
              row: rowNumber,
              customer,
              error: err.message
            });
            uploadStats.invalidCustomers++;
            continue;
          }

          const currentPoints = customerRecord.points || 0;
          const balanceAfter = currentPoints + addAmt - redeemAmt;

          // Insert transaction using the correct customer_transactions table structure
          const transactionData = {
            bill_no: billNo,
            bill_date: billDate,
            bill_amount: billAmount,
            customer_id: customerRecord.isUnregistered ? null : customerRecord.id,
            customer_code: customer,
            customer_mobile: customer,
            branch_id: selectedBranch,
            transaction_type: 'purchase',
            amount: billAmount,
            points_earned: addAmt,
            points_used: redeemAmt,
            add_amt: addAmt,
            redeem: redeemAmt,
            balance_after: balanceAfter,
            status: 'completed',
            transaction_date: new Date().toISOString(),
            processed_at: new Date().toISOString()
          };

          console.log(`🔄 Processing row ${rowNumber}:`, {
            customer,
            billAmount,
            addAmt,
            redeemAmt,
            selectedBranch,
            customerRecord: { isUnregistered: customerRecord.isUnregistered, id: customerRecord.id }
          });

          const { data: insertResult, error: insertError } = await supabase
            .from('customer_transactions')
            .insert(transactionData)
            .select('id');

          if (insertError) {
            console.error('❌ Insert Error Details:', {
              error: insertError,
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              transactionData
            });
            
            uploadErrors.push({
              row: rowNumber,
              customer,
              error: `Database Error: ${insertError.message}${insertError.code ? ` (Code: ${insertError.code})` : ''}${insertError.details ? ` - ${insertError.details}` : ''}`
            });
            uploadStats.errors++;
            continue;
          }

          console.log(`✅ Row ${rowNumber} inserted successfully:`, insertResult);

          // Update customer points only if they're registered (not unregistered)
          if (!customerRecord.isUnregistered && customerRecord.id) {
            await supabase
              .from('customers')
              .update({
                points: balanceAfter,
                total_spent: (customerRecord.total_spent || 0) + billAmount
              })
              .eq('id', customerRecord.id);
          }

          uploadStats.successful++;

        } catch (err: any) {
          uploadErrors.push({
            row: rowNumber,
            customer: row[3]?.toString() || '',
            error: err.message
          });
          uploadStats.errors++;
        }
      }

      // Final progress update
      uploadProgress = 100;
      processingMessage = 'Upload completed!';

      // Log the upload
      await logUpload(
        selectedFile.name,
        uploadStats.total,
        uploadStats.successful,
        uploadStats.errors + uploadStats.invalidCustomers,
        uploadErrors
      );

      if (uploadStats.successful > 0) {
        success = `Upload completed! ${uploadStats.successful} transactions processed successfully.`;
      }

      if (uploadStats.errors > 0 || uploadStats.invalidCustomers > 0) {
        error = `${uploadStats.errors + uploadStats.invalidCustomers} records had errors. Check the error list below.`;
      }

    } catch (err: any) {
      error = `Upload failed: ${err.message}`;
    } finally {
      isLoading = false;
      showProcessStatus = false;
    }
  }

  async function logUpload(fileName: string, total: number, successful: number, errors: number, errorDetails: any[]) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      
      // Try to log upload, but don't fail if table doesn't exist
      const { error: logError } = await supabase
        .from('transaction_upload_logs')
        .insert({
          uploaded_by: currentUser.id || null,
          branch_id: selectedBranch,
          file_name: fileName,
          record_count: total,
          success_count: successful,
          error_count: errors,
          errors: errorDetails,
          uploaded_at: new Date().toISOString()
        });
      
      if (logError) {
        console.warn('Failed to log upload (table may not exist):', logError);
        // Continue without failing - logging is optional
      }
    } catch (err) {
      console.warn('Failed to log upload:', err);
      // Continue without failing - logging is optional
    }
  }

  function downloadTemplate() {
    const template = [
      ['Bill No', 'Bill Date (YYYY-MM-DD)', 'Bill Amount', 'Customer Mobile', 'Points to Add', 'Points to Redeem'],
      ['545439', '2025-07-27', '27.9', '0500014006', '0.28', '0'],
      ['555741', '2025-08-04', '284.86', '0500014006', '2.85', '0'],
      ['479569', '2025-05-30', '21.24', '0500019376', '0.11', '0'],
      ['493515', '2025-06-11', '153.02', '0500019376', '1.53', '0'],
      ['497543', '2025-06-15', '94.39', '0500019376', '0.94', '0'],
      ['', '', '', '', '', ''],
      ['INSTRUCTIONS:', '', '', '', '', ''],
      ['• Bill No: Unique invoice/receipt number', '', '', '', '', ''],
      ['• Bill Date: Format YYYY-MM-DD (e.g. 2025-08-07)', '', '', '', '', ''],
      ['• Bill Amount: Total purchase amount in ﷼', '', '', '', '', ''],
      ['• Customer Mobile: Saudi mobile number (5xxxxxxxx or 05xxxxxxxx)', '', '', '', '', ''],
      ['• Points to Add: Points earned from this transaction', '', '', '', '', ''],
      ['• Points to Redeem: Points used in this transaction', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['NOTES:', '', '', '', '', ''],
      ['• Mobile numbers starting with 05 will be auto-normalized to 5', '', '', '', '', ''],
      ['• Unknown customers will be automatically added to the system', '', '', '', '', ''],
      ['• All fields are required except Points to Redeem (can be 0)', '', '', '', '', '']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(template);
    
    // Set column widths
    ws['!cols'] = [
      { width: 15 }, // Bill No
      { width: 15 }, // Bill Date
      { width: 12 }, // Bill Amount
      { width: 15 }, // Customer Mobile
      { width: 12 }, // Points to Add
      { width: 12 }  // Points to Redeem
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Transaction Template');
    XLSX.writeFile(wb, 'urban_market_transactions_template.xlsx');
  }

  function clearAll() {
    selectedFile = null;
    previewData = [];
    showPreview = false;
    uploadStats = { total: 0, successful: 0, errors: 0, invalidCustomers: 0 };
    uploadErrors = [];
    error = '';
    success = '';
    uploadProgress = 0;
    if (fileInput) fileInput.value = '';
  }
</script>

  <div class="max-w-6xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Upload Transactions</h1>
      <p class="text-gray-600">Add customer transactions manually or upload from Excel file with automatic points calculation.</p>
    </div>

    <!-- Last Upload Status -->
    {#if showLastUploadStatus && lastUploadStatus}
      <div class="bg-white rounded-lg shadow p-6 mb-6 border-l-4 {lastUploadStatus.status === 'completed' ? 'border-green-500' : lastUploadStatus.status === 'failed' ? 'border-red-500' : lastUploadStatus.status === 'processing' ? 'border-blue-500' : 'border-yellow-500'}">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <span class="text-2xl">{uploadManager.getStatusIcon(lastUploadStatus.status)}</span>
            Last Upload Status
          </h2>
          <a 
            href="/admin/upload-status" 
            class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All Uploads →
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p class="text-sm text-gray-600">File Name</p>
            <p class="font-medium">{lastUploadStatus.fileName}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Status</p>
            <p class="font-medium {uploadManager.getStatusColor(lastUploadStatus.status)}">
              {lastUploadStatus.status.toUpperCase()}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Progress</p>
            <p class="font-medium">
              {lastUploadStatus.progress.processed} / {lastUploadStatus.progress.total}
              {#if lastUploadStatus.progress.failed > 0}
                <span class="text-red-600">({lastUploadStatus.progress.failed} failed)</span>
              {/if}
            </p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-3">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{uploadManager.getProgressPercentage(lastUploadStatus)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="h-2 rounded-full transition-all duration-300 {lastUploadStatus.status === 'processing' ? 'bg-blue-500' : lastUploadStatus.status === 'completed' ? 'bg-green-500' : lastUploadStatus.status === 'failed' ? 'bg-red-500' : lastUploadStatus.status === 'paused' ? 'bg-orange-500' : 'bg-yellow-500'}"
              style="width: {uploadManager.getProgressPercentage(lastUploadStatus)}%"
            ></div>
          </div>
        </div>

        <!-- Control Buttons -->
        {#if lastUploadStatus.status === 'processing'}
          <div class="flex gap-2 mb-3">
            <button
              on:click={() => uploadManager.pauseUpload(lastUploadStatus.id)}
              class="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
            >
              ⏸️ Pause
            </button>
            <button
              on:click={() => uploadManager.cancelUpload(lastUploadStatus.id)}
              class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              🚫 Cancel
            </button>
          </div>
        {/if}

        {#if lastUploadStatus.status === 'paused'}
          <div class="flex gap-2 mb-3">
            <button
              on:click={() => uploadManager.resumeUpload(lastUploadStatus.id)}
              class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
            >
              ▶️ Resume
            </button>
            <button
              on:click={() => uploadManager.cancelUpload(lastUploadStatus.id)}
              class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              🚫 Cancel
            </button>
          </div>
        {/if}

        <!-- Time Information -->
        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>Started: {new Date(lastUploadStatus.created_at).toLocaleString()}</span>
          {#if lastUploadStatus.started_at}
            <span>Processing: {new Date(lastUploadStatus.started_at).toLocaleString()}</span>
          {/if}
          {#if lastUploadStatus.completed_at}
            <span>Completed: {new Date(lastUploadStatus.completed_at).toLocaleString()}</span>
          {/if}
        </div>

        {#if lastUploadStatus.error_msg}
          <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-700">{lastUploadStatus.error_msg}</p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Job Management Actions -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Job Management</h2>
          <p class="text-sm text-gray-600">Monitor and manage all upload operations</p>
        </div>
        <div class="flex gap-3">
          <a 
            href="/admin/upload-jobs" 
            class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200"
          >
            📋 View All Job Details
          </a>
          <a 
            href="/admin/upload-status" 
            class="text-blue-600 hover:text-blue-700 font-medium px-4 py-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all duration-200"
          >
            Upload Dashboard →
          </a>
        </div>
      </div>
    </div>

    <!-- Recent Uploads Summary -->
    {#if recentUploads.length > 0}
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Recent Uploads</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-700">File</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700">Progress</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700">Time</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each recentUploads.slice(0, 5) as upload}
                <tr class="hover:bg-gray-50">
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{uploadManager.getStatusIcon(upload.status)}</span>
                      <span class="font-medium">{upload.fileName}</span>
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <span class="px-2 py-1 text-xs rounded-full {upload.status === 'completed' ? 'bg-green-100 text-green-800' : upload.status === 'failed' ? 'bg-red-100 text-red-800' : upload.status === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">
                      {upload.status.toUpperCase()}
                    </span>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          class="h-1.5 rounded-full {upload.status === 'completed' ? 'bg-green-500' : upload.status === 'failed' ? 'bg-red-500' : upload.status === 'processing' ? 'bg-blue-500' : 'bg-yellow-500'}"
                          style="width: {uploadManager.getProgressPercentage(upload)}%"
                        ></div>
                      </div>
                      <span class="text-xs">{upload.progress.processed}/{upload.progress.total}</span>
                    </div>
                  </td>
                  <td class="px-3 py-2 text-gray-600">
                    {new Date(upload.created_at).toLocaleString()}
                  </td>
                  <td class="px-3 py-2">
                    {#if upload.status === 'processing'}
                      <div class="flex gap-1">
                        <button
                          on:click={() => uploadManager.pauseUpload(upload.id)}
                          class="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                          title="Pause Upload"
                        >
                          ⏸️
                        </button>
                        <button
                          on:click={() => uploadManager.cancelUpload(upload.id)}
                          class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          title="Cancel Upload"
                        >
                          🚫
                        </button>
                      </div>
                    {:else if upload.status === 'paused'}
                      <div class="flex gap-1">
                        <button
                          on:click={() => uploadManager.resumeUpload(upload.id)}
                          class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          title="Resume Upload"
                        >
                          ▶️
                        </button>
                        <button
                          on:click={() => uploadManager.cancelUpload(upload.id)}
                          class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          title="Cancel Upload"
                        >
                          🚫
                        </button>
                      </div>
                    {:else}
                      <span class="text-gray-400 text-xs">-</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}    <!-- Branch Selection -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Select Branch</h2>
      <select
        bind:value={selectedBranch}
        class="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      >
        <option value="">Choose a branch...</option>
        {#each branches as branch}
          <option value={branch.id}>{branch.name_en}</option>
        {/each}
      </select>
    </div>

    <!-- Manual Entry Section -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Manual Transaction Entry</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
          <input
            type="text"
            bind:value={manualTransaction.bill_no}
            placeholder="INV001"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Bill Date</label>
          <input
            type="date"
            bind:value={manualTransaction.bill_date}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Bill Amount (﷼)</label>
          <input
            type="number"
            step="0.01"
            bind:value={manualTransaction.bill_amount}
            placeholder="100.50"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Customer Mobile</label>
          <input
            type="text"
            bind:value={manualTransaction.customer}
            placeholder="5xxxxxxxx"
            maxlength="10"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Points to Add</label>
          <input
            type="number"
            bind:value={manualTransaction.add_amt}
            placeholder="10"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Points to Redeem</label>
          <input
            type="number"
            bind:value={manualTransaction.redeem}
            placeholder="0"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        on:click={addManualTransaction}
        disabled={isLoading || !selectedBranch}
        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Adding...' : 'Add Transaction'}
      </button>
    </div>

    <!-- Excel Upload Section -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Excel File Upload</h2>
        <button
          on:click={downloadTemplate}
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
        >
          <span>📥</span>
          Download Template
        </button>
      </div>

      <!-- Upload Mode Toggle removed - now always uses queue system -->
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Choose Excel File</label>
        <input
          type="file"
          bind:this={fileInput}
          on:change={handleFileSelect}
          accept=".xlsx,.xls"
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p class="text-sm text-gray-500 mt-1">
          Columns: Bill No, Bill Date (YYYY-MM-DD), Bill Amount, Customer Mobile, Points to Add, Points to Redeem
        </p>
      </div>

      {#if showPreview}
        <div class="mb-4">
          <h3 class="font-medium mb-2">File Preview (First 5 rows)</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200 rounded-lg text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Row</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Bill No</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Date</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Amount</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Customer</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Add</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Redeem</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {#each previewData as row}
                  <tr class="border-t">
                    <td class="px-3 py-2 text-xs">{row.rowNumber}</td>
                    <td class="px-3 py-2 text-xs">{row.bill_no}</td>
                    <td class="px-3 py-2 text-xs">{row.bill_date}</td>
                    <td class="px-3 py-2 text-xs">{row.bill_amount}</td>
                    <td class="px-3 py-2 text-xs font-mono">{row.customer}</td>
                    <td class="px-3 py-2 text-xs">{row.add_amt}</td>
                    <td class="px-3 py-2 text-xs">{row.redeem}</td>
                    <td class="px-3 py-2 text-xs">
                      <span class="text-sm" 
                            class:text-green-600={row.status.includes('✅')}
                            class:text-yellow-600={row.status.includes('⏳')}
                            class:text-purple-600={row.status.includes('✨')}
                            class:text-red-600={row.status.includes('✗')}
                            class:text-blue-600={row.status.includes('Checking')}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <div class="flex gap-4">
        <button
          on:click={uploadExcelFile}
          disabled={isLoading || !selectedFile || !selectedBranch}
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Uploading...' : 'Upload Excel File'}
        </button>
        
        <button
          on:click={clearAll}
          class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
        >
          Clear All
        </button>
      </div>

      <!-- Enhanced Progress Bar - REMOVED -->
      <!-- Upload Progress display removed per user request -->
    </div>

    <!-- Upload Statistics -->
    {#if uploadStats.total > 0}
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Upload Statistics</h2>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{uploadStats.total}</div>
            <div class="text-sm text-gray-600">Total Records</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{uploadStats.successful}</div>
            <div class="text-sm text-gray-600">Successful</div>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg">
            <div class="text-2xl font-bold text-yellow-600">{uploadStats.invalidCustomers}</div>
            <div class="text-sm text-gray-600">Invalid Customers</div>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <div class="text-2xl font-bold text-red-600">{uploadStats.errors}</div>
            <div class="text-sm text-gray-600">Other Errors</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Error Details -->
    {#if uploadErrors.length > 0}
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4 text-red-600">Upload Errors</h2>
        
        <div class="overflow-x-auto">
          <table class="min-w-full border border-gray-200 rounded-lg">
            <thead class="bg-red-50">
              <tr>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Row</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Customer</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Error</th>
              </tr>
            </thead>
            <tbody>
              {#each uploadErrors as error}
                <tr class="border-t">
                  <td class="px-4 py-2 text-sm">{error.row}</td>
                  <td class="px-4 py-2 text-sm font-mono">{error.customer}</td>
                  <td class="px-4 py-2 text-sm text-red-600">{error.error}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Messages -->
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {success}
      </div>
    {/if}
  </div>
