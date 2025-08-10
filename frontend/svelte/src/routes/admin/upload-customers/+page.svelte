<!--
===============================================
🎯 UPLOAD CUSTOMERS - FULL REGISTRATION SUPPORT
===============================================
Admin uploads Excel file with complete customer data.
Supports both eligibility upload and full registration.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import AdminLayout from '$lib/AdminLayout.svelte';
  import * as XLSX from 'xlsx';

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let uploadFile: File | null = null;
  let uploading = false;
  let uploadResult: any = null;
  let uploadHistory: any[] = [];
  let showHistory = false;
  let uploadMode: 'eligibility' | 'full' = 'eligibility';

  // Upload stats
  let totalRecords = 0;
  let successCount = 0;
  let errorCount = 0;
  let errors: any[] = [];
  let currentRecord = 0;
  let uploadProgress = 0;
  let progressMessage = '';

  // File input reference
  let fileInput: HTMLInputElement;

  // ==========================================
  // PROGRESS TRACKING
  // ==========================================
  
  function updateProgress(current: number, total: number, message: string) {
    currentRecord = current;
    totalRecords = total;
    uploadProgress = total > 0 ? Math.round((current / total) * 100) : 0;
    progressMessage = message;
  }

  // ==========================================
  // FILE HANDLING
  // ==========================================
  
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      
      if (!validTypes.includes(file.type)) {
        alert('Please upload an Excel (.xlsx, .xls) or CSV file');
        return;
      }
      
      uploadFile = file;
      uploadResult = null;
      // Reset progress
      uploadProgress = 0;
      currentRecord = 0;
      progressMessage = '';
    }
  }

  async function processUpload() {
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }

    uploading = true;
    uploadResult = null;
    totalRecords = 0;
    successCount = 0;
    errorCount = 0;
    errors = [];
    uploadProgress = 0;
    currentRecord = 0;

    try {
      updateProgress(0, 0, 'Reading file...');
      
      let customerData: any[] = [];

      // Process different file types
      if (uploadFile.type === 'text/csv') {
        customerData = await parseCsvData(uploadFile);
      } else {
        customerData = await parseExcelData(uploadFile);
      }

      totalRecords = customerData.length;
      updateProgress(0, totalRecords, 'Validating data...');

      if (uploadMode === 'eligibility') {
        await processEligibilityUpload(customerData);
      } else {
        await processFullRegistrationUpload(customerData);
      }

      // Log the upload
      await logUpload();

      uploadResult = {
        success: true,
        message: `Upload completed! ${successCount} records processed successfully.`,
        stats: {
          total: totalRecords,
          success: successCount,
          errors: errorCount
        }
      };

      // Clear file input
      uploadFile = null;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      uploadResult = {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
        stats: null
      };
    } finally {
      uploading = false;
      uploadProgress = 100;
      progressMessage = 'Upload completed';
    }
  }

  // ==========================================
  // ELIGIBILITY UPLOAD (Mobile Numbers Only)
  // ==========================================

  async function processEligibilityUpload(customerData: any[]) {
    updateProgress(0, totalRecords, 'Processing eligibility numbers...');
    
    const validNumbers: string[] = [];
    const invalidNumbers: any[] = [];

    customerData.forEach((item, index) => {
      const number = String(item.mobile || item.customer_number || item.phone || '').replace(/\D/g, '');
      
      if (number.length === 10 && /^\d{10}$/.test(number)) {
        validNumbers.push(number);
      } else {
        invalidNumbers.push({
          row: index + 1,
          value: item.mobile || item.customer_number || item.phone || '',
          error: 'Invalid mobile number format (must be 10 digits)'
        });
      }
      
      updateProgress(index + 1, totalRecords, `Validating record ${index + 1}...`);
    });

    // Insert valid numbers into customer_numbers table
    if (validNumbers.length > 0) {
      updateProgress(totalRecords, totalRecords, 'Saving to database...');
      
      const { data, error } = await supabase
        .from('customer_numbers')
        .upsert(
          validNumbers.map(number => ({
            customer: number,
            status: 'not_registered',
            uploaded_at: new Date().toISOString()
          })),
          { 
            onConflict: 'customer',
            ignoreDuplicates: true 
          }
        );

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      successCount = validNumbers.length;
    }

    errorCount = invalidNumbers.length;
    errors = invalidNumbers;
  }

  // ==========================================
  // FULL REGISTRATION UPLOAD
  // ==========================================

  async function processFullRegistrationUpload(customerData: any[]) {
    updateProgress(0, totalRecords, 'Processing customer registrations...');
    
    const validCustomers: any[] = [];
    const invalidCustomers: any[] = [];

    // Load existing branches for validation
    const { data: branches } = await supabase.from('branches').select('id');
    const branchIds = new Set(branches?.map(b => b.id) || []);

    // Validate each customer record
    customerData.forEach((item, index) => {
      const errors = validateCustomerRecord(item, branchIds);
      
      if (errors.length === 0) {
        validCustomers.push({
          card_number: String(item.mobile || item.customer_code || '').replace(/\D/g, ''),
          customer_code: String(item.mobile || item.customer_code || '').replace(/\D/g, ''),
          full_name: String(item.full_name || item.name || '').trim(),
          mobile: String(item.mobile || item.phone || '').replace(/\D/g, ''),
          phone: String(item.mobile || item.phone || '').replace(/\D/g, ''),
          email: item.email ? String(item.email).trim() : null,
          address: String(item.address || item.place || '').trim(),
          place: String(item.address || item.place || '').trim(),
          nearest_branch_id: parseInt(item.branch_id || '1'),
          card_type_id: null, // Let admin assign later
          valid_until: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59).toISOString(),
          is_active: true,
          registration_date: new Date().toISOString()
        });
      } else {
        invalidCustomers.push({
          row: index + 1,
          data: item,
          errors: errors
        });
      }
      
      updateProgress(index + 1, totalRecords, `Validating customer ${index + 1}...`);
    });

    // Insert valid customers in batches
    if (validCustomers.length > 0) {
      const batchSize = 50;
      let processed = 0;
      
      for (let i = 0; i < validCustomers.length; i += batchSize) {
        const batch = validCustomers.slice(i, i + batchSize);
        
        updateProgress(processed, totalRecords, `Saving customers ${processed + 1}-${Math.min(processed + batchSize, validCustomers.length)}...`);
        
        const { error } = await supabase
          .from('customers')
          .upsert(batch, {
            onConflict: 'customer_code',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }
        
        processed += batch.length;
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      successCount = validCustomers.length;
    }

    errorCount = invalidCustomers.length;
    errors = invalidCustomers.map(item => ({
      row: item.row,
      value: JSON.stringify(item.data),
      error: item.errors.join(', ')
    }));
  }

  function validateCustomerRecord(item: any, branchIds: Set<number>): string[] {
    const errors: string[] = [];
    
    // Validate mobile number
    const mobile = String(item.mobile || item.phone || '').replace(/\D/g, '');
    if (!mobile || mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
      errors.push('Invalid mobile number (must be 10 digits)');
    }
    
    // Validate full name
    const fullName = String(item.full_name || item.name || '').trim();
    if (!fullName || fullName.length < 2) {
      errors.push('Invalid full name (required, minimum 2 characters)');
    }
    
    // Validate branch ID
    const branchId = parseInt(item.branch_id || '1');
    if (!branchIds.has(branchId)) {
      errors.push(`Invalid branch ID: ${item.branch_id}`);
    }
    
    // Validate email if provided
    if (item.email && item.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(item.email.trim())) {
        errors.push('Invalid email format');
      }
    }
    
    return errors;
  }

  // ==========================================
  // FILE PARSING FUNCTIONS
  // ==========================================
  
  async function parseCsvData(file: File): Promise<any[]> {
    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) return [];
    
    // Check if first line looks like headers
    const firstLine = lines[0];
    const hasHeaders = firstLine.toLowerCase().includes('mobile') || 
                     firstLine.toLowerCase().includes('name') ||
                     firstLine.toLowerCase().includes('phone');
    
    const dataLines = hasHeaders ? lines.slice(1) : lines;
    const headers = hasHeaders ? 
      firstLine.split(',').map(h => h.trim().toLowerCase()) : 
      (uploadMode === 'eligibility' ? ['mobile'] : ['mobile', 'full_name', 'address', 'branch_id']);
    
    return dataLines.map(line => {
      const values = line.split(',').map(v => v.trim());
      const record: any = {};
      
      headers.forEach((header, index) => {
        if (values[index]) {
          record[header] = values[index];
        }
      });
      
      return record;
    });
  }

  async function parseExcelData(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            resolve([]);
            return;
          }
          
          // Check if first row contains headers
          const firstRow = jsonData[0] as any[];
          const hasHeaders = firstRow.some((cell: any) => 
            String(cell).toLowerCase().includes('mobile') ||
            String(cell).toLowerCase().includes('name') ||
            String(cell).toLowerCase().includes('phone')
          );
          
          const headers = hasHeaders ? 
            firstRow.map((cell: any) => String(cell).trim().toLowerCase()) :
            (uploadMode === 'eligibility' ? ['mobile'] : ['mobile', 'full_name', 'address', 'branch_id']);
          
          const dataRows = hasHeaders ? jsonData.slice(1) : jsonData;
          
          const records = (dataRows as any[][]).map((row: any[]) => {
            const record: any = {};
            headers.forEach((header, index) => {
              if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
                record[header] = String(row[index]).trim();
              }
            });
            return record;
          }).filter(record => Object.keys(record).length > 0);
          
          resolve(records);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Legacy functions for backward compatibility
  function parseCsvNumbers(text: string): string[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const numbers: string[] = [];
    
    lines.forEach(line => {
      // Handle CSV with commas or direct numbers
      if (line.includes(',')) {
        const firstColumn = line.split(',')[0].trim();
        if (firstColumn) numbers.push(firstColumn);
      } else {
        if (line) numbers.push(line);
      }
    });
    
    return numbers;
  }

  async function parseExcelNumbers(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const numbers: string[] = [];
          
          jsonData.forEach((row: any) => {
            if (Array.isArray(row) && row.length > 0) {
              const firstCell = String(row[0]).trim();
              if (firstCell) numbers.push(firstCell);
            }
          });
          
          resolve(numbers);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // ==========================================
  // LOGGING AND HISTORY
  // ==========================================
  
  async function logUpload() {
    try {
      const { error } = await supabase
        .from('customer_upload_logs')
        .insert({
          file_name: uploadFile?.name,
          upload_mode: uploadMode,
          record_count: totalRecords,
          success_count: successCount,
          error_count: errorCount,
          errors: errors.length > 0 ? errors : null
        });

      if (error) {
        console.error('Failed to log upload:', error);
      }
    } catch (err) {
      console.error('Upload logging error:', err);
    }
  }

  // Legacy function for backward compatibility
  async function logEligibilityUpload() {
    return logUpload();
  }

  async function loadUploadHistory() {
    try {
      const { data, error } = await supabase
        .from('customer_upload_logs')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      uploadHistory = data || [];
    } catch (error) {
      console.error('Failed to load upload history:', error);
    }
  }

  // ==========================================
  // LIFECYCLE
  // ==========================================
  
  onMount(() => {
    loadUploadHistory();
  });

  // Handle global refresh
  function handleRefresh() {
    loadUploadHistory();
    uploadFile = null;
    uploadResult = null;
    if (fileInput) fileInput.value = '';
  }

  // ==========================================
  // EXCEL TEMPLATE DOWNLOAD
  // ==========================================
  
  function downloadExcelTemplate() {
    let templateData: any[][];
    let filename: string;
    
    if (uploadMode === 'eligibility') {
      // Eligibility template (mobile numbers only)
      templateData = [
        ['mobile'], // Header row
        ['5012345678'],       // Sample row 1
        ['5023456789'],       // Sample row 2
        ['5034567890'],       // Sample row 3
        ['5045678901'],       // Sample row 4
        ['5056789012']        // Sample row 5
      ];
      filename = 'customer_eligibility_template';
    } else {
      // Full registration template
      templateData = [
        ['mobile', 'full_name', 'address', 'branch_id', 'email'], // Header row
        ['5012345678', 'Ahmed Al-Rashid', 'Riyadh, Al-Malaz District', '1', 'ahmed@example.com'],
        ['5023456789', 'Fatima Al-Zahra', 'Jeddah, Al-Balad', '2', 'fatima@example.com'],
        ['5034567890', 'Mohammed Al-Hassan', 'Dammam, Al-Khobar', '3', 'mohammed@example.com'],
        ['5045678901', 'Aisha Al-Qahtani', 'Mecca, Al-Aziziyah', '4', 'aisha@example.com'],
        ['5056789012', 'Omar Al-Sudairi', 'Medina, Al-Haram', '5', 'omar@example.com']
      ];
      filename = 'customer_registration_template';
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths for better visibility
    if (uploadMode === 'eligibility') {
      worksheet['!cols'] = [{ width: 15 }];
    } else {
      worksheet['!cols'] = [
        { width: 15 }, // mobile
        { width: 20 }, // full_name
        { width: 25 }, // address
        { width: 12 }, // branch_id
        { width: 25 }  // email
      ];
    }

    // Style the header row
    const headerRange = uploadMode === 'eligibility' ? 'A1' : 'A1:E1';
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "3B82F6" } },
          alignment: { horizontal: "center" }
        };
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, uploadMode === 'eligibility' ? 'Customer_Eligibility' : 'Customer_Registration');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${filename}_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, fullFilename);
  }
</script>

<!-- ==========================================
     ENHANCED UPLOAD PAGE WITH PROGRESS
     ========================================== -->
<div class="page-header">
  <div class="header-content">
    <div class="header-left">
      <h1 class="page-title">📤 Customer Bulk Upload</h1>
      <p class="page-description">
        Upload Excel/CSV files for customer eligibility or full registration.
        Support for progress tracking and comprehensive error reporting.
      </p>
    </div>
    <div class="header-actions">
      <button 
        class="btn btn-success"
        on:click={downloadExcelTemplate}
        title="Download Excel template with proper format"
      >
        <span class="btn-icon">📥</span>
        Download {uploadMode === 'eligibility' ? 'Eligibility' : 'Registration'} Template
      </button>
      <button 
        class="btn btn-secondary"
        on:click={() => showHistory = !showHistory}
      >
        <span class="btn-icon">📋</span>
        {showHistory ? 'Hide History' : 'View History'}
      </button>
    </div>
  </div>
</div>

<!-- ==========================================
     UPLOAD MODE SELECTION
     ========================================== -->
<div class="mode-selection">
  <div class="mode-card">
    <h3 class="mode-title">
      <span class="title-icon">⚙️</span>
      Upload Mode
    </h3>
    <div class="mode-options">
      <label class="mode-option" class:active={uploadMode === 'eligibility'}>
        <input 
          type="radio" 
          bind:group={uploadMode} 
          value="eligibility"
          disabled={uploading}
        />
        <div class="option-content">
          <div class="option-header">
            <span class="option-icon">📱</span>
            <span class="option-title">Eligibility Upload</span>
          </div>
          <p class="option-description">
            Upload mobile numbers only for customer eligibility. 
            Numbers will be available for future registration.
          </p>
          <div class="option-features">
            <span class="feature">✓ Mobile numbers only</span>
            <span class="feature">✓ Fast processing</span>
            <span class="feature">✓ Eligibility tracking</span>
          </div>
        </div>
      </label>
      
      <label class="mode-option" class:active={uploadMode === 'full'}>
        <input 
          type="radio" 
          bind:group={uploadMode} 
          value="full"
          disabled={uploading}
        />
        <div class="option-content">
          <div class="option-header">
            <span class="option-icon">👥</span>
            <span class="option-title">Full Registration</span>
          </div>
          <p class="option-description">
            Upload complete customer data for immediate registration.
            Includes validation and automatic account creation.
          </p>
          <div class="option-features">
            <span class="feature">✓ Complete customer data</span>
            <span class="feature">✓ Automatic registration</span>
            <span class="feature">✓ Data validation</span>
          </div>
        </div>
      </label>
    </div>
  </div>
</div>

<!-- ==========================================
     UPLOAD SECTION
     ========================================== -->
<div class="upload-section">
  <div class="upload-card">
    <div class="upload-header">
      <h3 class="card-title">
        <span class="title-icon">📁</span>
        {uploadMode === 'eligibility' ? 'Upload Eligibility File' : 'Upload Registration File'}
      </h3>
    </div>

    <div class="upload-content">
      <!-- Instructions -->
      <div class="upload-instructions">
        <h4>📝 {uploadMode === 'eligibility' ? 'Eligibility' : 'Registration'} Upload Instructions:</h4>
        
        {#if uploadMode === 'eligibility'}
          <div class="instruction-item">
            <span class="instruction-icon">📋</span>
            <span class="instruction-text">
              Upload a file containing <strong>mobile numbers only</strong> (one per row)
            </span>
          </div>
          <div class="instruction-item">
            <span class="instruction-icon">📱</span>
            <span class="instruction-text">
              Mobile numbers must be 10 digits starting with 5 (e.g., 5012345678)
            </span>
          </div>
          <div class="instruction-item">
            <span class="instruction-icon">✅</span>
            <span class="instruction-text">
              Numbers will be stored for future customer registration eligibility
            </span>
          </div>
        {:else}
          <div class="instruction-item">
            <span class="instruction-icon">👥</span>
            <span class="instruction-text">
              Required columns: <strong>mobile, full_name, address, branch_id</strong>
            </span>
          </div>
          <div class="instruction-item">
            <span class="instruction-icon">📧</span>
            <span class="instruction-text">
              Optional column: <strong>email</strong> (if provided, must be valid format)
            </span>
          </div>
          <div class="instruction-item">
            <span class="instruction-icon">✅</span>
            <span class="instruction-text">
              Customers will be automatically registered and activated
            </span>
          </div>
        {/if}
        
        <div class="instruction-item">
          <span class="instruction-icon">📄</span>
          <span class="instruction-text">
            Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
          </span>
        </div>
        
        <div class="sample-files">
          <h5>📥 Sample Files:</h5>
          <div class="sample-links">
            <a 
              href="/sample_customer_{uploadMode === 'eligibility' ? 'eligibility' : 'registration'}.csv" 
              download 
              class="sample-link"
            >
              <span class="sample-icon">📄</span>
              Download Sample CSV
            </a>
            <button 
              class="sample-link"
              on:click={downloadExcelTemplate}
            >
              <span class="sample-icon">📊</span>
              Generate Excel Template
            </button>
          </div>
        </div>
      </div>

      <!-- File Input -->
      <div class="file-input-container">
        <input
          bind:this={fileInput}
          type="file"
          accept=".xlsx,.xls,.csv"
          on:change={handleFileSelect}
          class="file-input"
          id="fileInput"
          disabled={uploading}
        />
        <label for="fileInput" class="file-input-label" class:disabled={uploading}>
          <span class="upload-icon">📎</span>
          <span class="upload-text">
            {uploadFile ? uploadFile.name : `Choose ${uploadMode === 'eligibility' ? 'eligibility' : 'registration'} file`}
          </span>
        </label>
      </div>

      <!-- File Info -->
      {#if uploadFile}
        <div class="file-info">
          <div class="file-details">
            <span class="file-name">📄 {uploadFile.name}</span>
            <span class="file-size">{(uploadFile.size / 1024).toFixed(1)} KB</span>
            <span class="file-mode">Mode: {uploadMode === 'eligibility' ? 'Eligibility' : 'Full Registration'}</span>
          </div>
        </div>
      {/if}

      <!-- Progress Bar -->
      {#if uploading}
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-title">Upload Progress</span>
            <span class="progress-percentage">{uploadProgress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {uploadProgress}%"></div>
          </div>
          <div class="progress-details">
            <span class="progress-message">{progressMessage}</span>
            <span class="progress-count">{currentRecord} / {totalRecords} records</span>
          </div>
        </div>
      {/if}

      <!-- Upload Button -->
      <button
        class="btn btn-primary upload-btn"
        on:click={processUpload}
        disabled={!uploadFile || uploading}
        class:loading={uploading}
      >
        {#if uploading}
          <span class="loading-spinner"></span>
          <span>Processing {uploadMode === 'eligibility' ? 'Eligibility' : 'Registration'}...</span>
        {:else}
          <span class="btn-icon">⬆️</span>
          <span>Upload {uploadMode === 'eligibility' ? 'Eligibility Numbers' : 'Customer Registrations'}</span>
        {/if}
      </button>

      <!-- Instructions -->
      <div class="upload-instructions">
        <h4>📝 File Format Instructions:</h4>
        <ul>
          <li>Excel (.xlsx, .xls) or CSV (.csv) files accepted</li>
          <li>Each row should contain one mobile number</li>
          <li>Mobile numbers must be exactly 10 digits</li>
          <li>No headers required - just the numbers</li>
          <li>Duplicate numbers will be ignored</li>
          <li>Numbers will be available for customer registration</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<!-- ==========================================
     UPLOAD RESULT
     ========================================== -->
{#if uploadResult}
  <div class="result-section">
    <div class="result-card {uploadResult.success ? 'success' : 'error'}">
      <div class="result-header">
        <span class="result-icon">
          {uploadResult.success ? '✅' : '❌'}
        </span>
        <h3 class="result-title">Upload Result</h3>
      </div>
      
      <p class="result-message">{uploadResult.message}</p>
      
      {#if uploadResult.stats}
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">Total Records:</span>
            <span class="stat-value">{uploadResult.stats.total}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Successfully Added:</span>
            <span class="stat-value success">{uploadResult.stats.success}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Errors:</span>
            <span class="stat-value error">{uploadResult.stats.errors}</span>
          </div>
        </div>
      {/if}

      {#if errors.length > 0}
        <details class="error-details">
          <summary>View Error Details ({errors.length} errors)</summary>
          <div class="error-list">
            {#each errors as error}
              <div class="error-item">
                <span class="error-row">Row {error.row}:</span>
                <span class="error-value">"{error.value}"</span>
                <span class="error-msg">- {error.error}</span>
              </div>
            {/each}
          </div>
        </details>
      {/if}
    </div>
  </div>
{/if}

<!-- ==========================================
     UPLOAD HISTORY
     ========================================== -->
{#if showHistory}
  <div class="history-section">
    <div class="history-card">
      <div class="history-header">
        <h3 class="card-title">
          <span class="title-icon">📚</span>
          Recent Upload History
        </h3>
      </div>

      {#if uploadHistory.length > 0}
        <div class="history-list">
          {#each uploadHistory as log}
            <div class="history-item">
              <div class="history-main">
                <span class="history-file">📄 {log.file_name || 'Unknown file'}</span>
                <span class="history-date">
                  {new Date(log.uploaded_at).toLocaleString()}
                </span>
              </div>
              <div class="history-mode">
                <span class="mode-badge" class:eligibility={log.upload_mode === 'eligibility'} class:full={log.upload_mode === 'full'}>
                  {log.upload_mode === 'eligibility' ? '📱 Eligibility' : '👥 Full Registration'}
                </span>
              </div>
              <div class="history-stats">
                <span class="history-stat success">
                  ✅ {log.success_count} processed
                </span>
                <span class="history-stat total">
                  📊 {log.record_count} total
                </span>
                {#if log.error_count > 0}
                  <span class="history-stat error">
                    ❌ {log.error_count} errors
                  </span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <p class="empty-text">No upload history found</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* ==========================================
     MODE SELECTION
     ========================================== */
  .mode-selection {
    margin-bottom: 2rem;
  }

  .mode-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }

  .mode-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
  }

  .mode-options {
    padding: 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .mode-option {
    cursor: pointer;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s ease;
    background: #f9fafb;
    position: relative;
  }

  .mode-option:hover {
    border-color: #8b5cf6;
    background: #faf5ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  }

  .mode-option.active {
    border-color: #8b5cf6;
    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
  }

  .mode-option input[type="radio"] {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .option-content {
    position: relative;
  }

  .option-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .option-icon {
    font-size: 1.5rem;
  }

  .option-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
  }

  .option-description {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .option-features {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .feature {
    font-size: 0.8rem;
    color: #059669;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .mode-options {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  /* ==========================================
     PROGRESS BAR
     ========================================== */
  .progress-section {
    margin-bottom: 2rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 2px solid #0ea5e9;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .progress-title {
    font-weight: 600;
    color: #0c4a6e;
    font-size: 1rem;
  }

  .progress-percentage {
    font-weight: 700;
    color: #0ea5e9;
    font-size: 1.1rem;
  }

  .progress-bar {
    width: 100%;
    height: 12px;
    background: #e0f2fe;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 1rem;
    border: 1px solid #0ea5e9;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%);
    border-radius: 6px;
    transition: width 0.3s ease;
    position: relative;
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }

  .progress-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }

  .progress-message {
    color: #0c4a6e;
    font-weight: 500;
  }

  .progress-count {
    color: #0ea5e9;
    font-weight: 600;
  }

  /* File input disabled state */
  .file-input-label.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f3f4f6;
  }

  .file-input-label.disabled:hover {
    border-color: #d1d5db;
    background: #f3f4f6;
  }

  /* Enhanced file info */
  .file-mode {
    color: #8b5cf6;
    font-weight: 600;
    font-size: 0.875rem;
  }
  .page-header {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .header-left {
    flex: 1;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .page-description {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  @media (max-width: 640px) {
    .header-actions {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .header-actions .btn {
      justify-content: center;
    }
  }

  /* ==========================================
     UPLOAD SECTION
     ========================================== */
  .upload-section {
    margin-bottom: 2rem;
  }

  .upload-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }

  .upload-header {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    padding: 1.5rem 2rem;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .title-icon {
    font-size: 1.25rem;
  }

  .upload-content {
    padding: 2rem;
  }

  /* File Input */
  .file-input-container {
    margin-bottom: 1.5rem;
  }

  .file-input {
    display: none;
  }

  .file-input-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #f9fafb;
  }

  .file-input-label:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
  }

  .upload-icon {
    font-size: 1.5rem;
    color: #6b7280;
  }

  .upload-text {
    color: #374151;
    font-weight: 500;
  }

  /* File Info */
  .file-info {
    background: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .file-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .file-name {
    font-weight: 500;
    color: #1e40af;
  }

  .file-size {
    color: #6b7280;
    font-size: 0.875rem;
  }

  /* Upload Button */
  .upload-btn {
    width: 100%;
    margin-bottom: 2rem;
  }

  /* Instructions */
  .upload-instructions {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border: 1px solid #f59e0b;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .upload-instructions h4 {
    color: #92400e;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }

  .upload-instructions h5 {
    color: #92400e;
    font-size: 0.9rem;
    font-weight: 600;
    margin: 1.5rem 0 0.75rem 0;
  }

  .instruction-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .instruction-item:last-child {
    margin-bottom: 0;
  }

  .instruction-icon {
    font-size: 1.1rem;
    margin-top: 0.1rem;
  }

  .instruction-text {
    color: #92400e;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .instruction-text strong {
    color: #78350f;
    font-weight: 600;
  }

  .sample-files {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #f59e0b;
  }

  .sample-links {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .sample-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #f59e0b;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
  }

  .sample-link:hover {
    background: #d97706;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  }

  .sample-icon {
    font-size: 1rem;
  }

  /* ==========================================
     RESULT SECTION
     ========================================== */
  .result-section {
    margin-bottom: 2rem;
  }

  .result-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    padding: 2rem;
  }

  .result-card.success {
    border-color: #22c55e;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  }

  .result-card.error {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .result-icon {
    font-size: 1.5rem;
  }

  .result-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: #1f2937;
  }

  .result-message {
    font-size: 1rem;
    margin: 0 0 1.5rem 0;
    color: #374151;
  }

  .result-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .stat-label {
    font-weight: 500;
    color: #6b7280;
  }

  .stat-value {
    font-weight: 600;
    font-size: 1.1rem;
  }

  .stat-value.success {
    color: #16a34a;
  }

  .stat-value.error {
    color: #dc2626;
  }

  /* Error Details */
  .error-details {
    margin-top: 1.5rem;
  }

  .error-details summary {
    cursor: pointer;
    font-weight: 500;
    color: #dc2626;
    margin-bottom: 1rem;
  }

  .error-list {
    background: white;
    border: 1px solid #fee2e2;
    border-radius: 6px;
    max-height: 200px;
    overflow-y: auto;
  }

  .error-item {
    padding: 0.75rem;
    border-bottom: 1px solid #fee2e2;
    font-size: 0.875rem;
  }

  .error-item:last-child {
    border-bottom: none;
  }

  .error-row {
    font-weight: 600;
    color: #dc2626;
  }

  .error-value {
    color: #374151;
    font-family: monospace;
  }

  .error-msg {
    color: #6b7280;
  }

  /* ==========================================
     HISTORY SECTION
     ========================================== */
  .history-section {
    margin-bottom: 2rem;
  }

  .history-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }

  .history-header {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    padding: 1.5rem 2rem;
  }

  .history-list {
    padding: 1.5rem 2rem;
  }

  .history-item {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 1rem;
    background: #f9fafb;
  }

  .history-item:last-child {
    margin-bottom: 0;
  }

  .history-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .history-mode {
    margin-bottom: 0.5rem;
  }

  .mode-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .mode-badge.eligibility {
    background: #dbeafe;
    color: #1e40af;
  }

  .mode-badge.full {
    background: #dcfce7;
    color: #166534;
  }

  .history-file {
    font-weight: 500;
    color: #374151;
  }

  .history-date {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .history-stats {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .history-stat {
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
  }

  .history-stat.success {
    color: #16a34a;
    background: #dcfce7;
  }

  .history-stat.total {
    color: #2563eb;
    background: #dbeafe;
  }

  .history-stat.error {
    color: #dc2626;
    background: #fee2e2;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
  }

  .empty-text {
    color: #6b7280;
    font-size: 1rem;
    margin: 0;
  }

  /* ==========================================
     BUTTONS
     ========================================== */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    font-size: 0.875rem;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .btn-secondary {
    background: #f8fafc;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover {
    background: #f1f5f9;
    border-color: #9ca3af;
  }

  .btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .btn-icon {
    font-size: 1rem;
  }

  /* Loading States */
  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ==========================================
     RESPONSIVE DESIGN
     ========================================== */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .header-actions {
      width: 100%;
    }

    .upload-content {
      padding: 1.5rem;
    }

    .file-input-label {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
    }

    .file-details {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }

    .result-stats {
      grid-template-columns: 1fr;
    }

    .history-main {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .history-stats {
      gap: 0.5rem;
    }
  }
</style>
