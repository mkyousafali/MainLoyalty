<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { language } from '$lib/stores/language';

  let offers = [];
  let loading = true;
  let showPostWizard = false;

  // Post wizard states
  let wizardStep = 1;
  let wizardData = {
    branch_id: '',
    thumbnail_file: null,
    pdf_file: null,
    start_date: '',
    expiry_date: '',
    offer_name: '',
    thumbnail_preview: null,
    pdf_preview: null
  };

  let branches = [];
  let uploading = false;
  let previewOffer = null;

  // Supabase Storage configuration (much simpler than Google Drive!)
  const STORAGE_BUCKET = 'offer-files'; // We'll create this bucket in Supabase
  
  let uploadProgress = {
    thumbnail: 0,
    pdf: 0
  };
  let uploadingFiles = {
    thumbnail: false,
    pdf: false
  };

  // Update mode variables
  let isUpdating = false;
  let updatingOfferId = null;

  const { t } = language;

  onMount(() => {
    loadOffers();
    loadBranches();
  });

  async function loadOffers() {
    try {
      const { data, error } = await supabase
        .from('offer_advertisements')
        .select(`
          *,
          branches(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      offers = data || [];
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      loading = false;
    }
  }

  async function loadBranches() {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');

      if (error) throw error;
      branches = data || [];
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  }

  // Supabase Storage upload functions (much simpler!)
  async function uploadToSupabaseStorage(file, folder, onProgress) {
    try {
      console.log(`🚀 Starting Supabase upload of ${file.name} to ${folder}`);
      console.log(`📄 File details:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        constructor: file.constructor.name
      });
      
      // Skip auth check for now - let storage policies handle it
      console.log(`⏭️ Skipping auth check - relying on storage policies`);
      
      // Validate file type
      if (!file.type) {
        throw new Error('File type is missing. Please select a valid file.');
      }

      // Additional file validation
      if (!(file instanceof File)) {
        console.error('❌ Not a valid File object:', typeof file, file);
        throw new Error('Invalid file object. Please try selecting the file again.');
      }
      
      // Generate unique filename with proper extension
      const timestamp = Date.now();
      const extension = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${folder}/offer_${timestamp}.${extension}`;
      
      console.log(`📁 Uploading to: ${STORAGE_BUCKET}/${fileName}`);

      // Check bucket existence - try multiple approaches
      console.log(`🪣 Checking bucket ${STORAGE_BUCKET}...`);
      
      try {
        // Method 1: List buckets
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
          console.warn('⚠️ listBuckets failed:', bucketError);
          console.log('📋 Attempting direct upload anyway...');
        } else {
          console.log('📦 Available buckets:', buckets.map(b => b.id));
          const targetBucket = buckets.find(b => b.id === STORAGE_BUCKET);
          if (targetBucket) {
            console.log('✅ Target bucket found:', targetBucket);
          } else if (buckets.length === 0) {
            console.warn('⚠️ No buckets returned from API, but Storage appears enabled in dashboard');
            console.log('📋 Proceeding with direct upload attempt...');
          }
        }
      } catch (error) {
        console.warn('⚠️ Bucket check failed, proceeding anyway:', error);
      }

      // Start progress simulation
      const progressInterval = setInterval(() => {
        const currentProgress = uploadProgress[folder === 'thumbnails' ? 'thumbnail' : 'pdf'];
        if (currentProgress < 90) {
          const increment = Math.random() * 15 + 5;
          const newProgress = Math.min(currentProgress + increment, 90);
          onProgress(Math.round(newProgress));
        }
      }, 200);

      // Ensure we're uploading the actual file with correct content type
      const uploadOptions = {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type, // Explicitly set the content type
        duplex: 'half' // Important for file uploads
      };

      console.log(`📤 Upload options:`, uploadOptions);
      console.log(`📋 About to upload file:`, {
        fileName,
        fileType: file.type,
        fileSize: file.size,
        bucket: STORAGE_BUCKET
      });

      // Convert file to ArrayBuffer to ensure binary upload
      console.log(`🔄 Converting file to ArrayBuffer...`);
      const arrayBuffer = await file.arrayBuffer();
      console.log(`🧹 ArrayBuffer created:`, {
        size: arrayBuffer.byteLength,
        originalFileType: file.type,
        originalFileName: file.name
      });

      // Try direct fetch to bypass Supabase client issues
      console.log(`🌐 Using direct fetch approach to bypass client...`);
      const supabaseUrl = 'https://sfydwpimwnxocrgpiour.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmeWR3cGltd254b2NyZ3Bpb3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzI5MTYsImV4cCI6MjA2OTYwODkxNn0.GQmHZT5waxLrfcn6JQ40ImVJ1obTdqxdLFv0edZaanE';
      
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${fileName}`;
      console.log(`📡 Upload URL:`, uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': file.type,
          'Cache-Control': 'max-age=3600'
        },
        body: arrayBuffer
      });

      console.log(`📡 Direct fetch response:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Direct fetch error response:`, errorText);
        throw new Error(`Direct fetch failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Direct fetch success:`, data);

      // Simulate the Supabase response format
      const uploadResult = { data, error: null };

      clearInterval(progressInterval);

      // Since we're using direct fetch, errors are thrown above
      // No need to check uploadResult.error here

      console.log('✅ File uploaded to Supabase:', data.path);

      // Complete progress
      onProgress(100);

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      console.log('🔗 Public URL generated:', publicUrlData.publicUrl);

      return publicUrlData.publicUrl;
      
    } catch (error) {
      console.error('❌ Error uploading to Supabase Storage:', error);
      throw error;
    }
  }

  async function uploadThumbnail(file) {
    uploadingFiles.thumbnail = true;
    uploadProgress.thumbnail = 0;
    
    try {
      const url = await uploadToSupabaseStorage(
        file, 
        'thumbnails',
        (progress) => { uploadProgress.thumbnail = progress; }
      );
      return url;
    } finally {
      uploadingFiles.thumbnail = false;
    }
  }

  async function uploadPDF(file) {
    uploadingFiles.pdf = true;
    uploadProgress.pdf = 0;
    
    try {
      const url = await uploadToSupabaseStorage(
        file, 
        'pdfs',
        (progress) => { uploadProgress.pdf = progress; }
      );
      return url;
    } finally {
      uploadingFiles.pdf = false;
    }
  }

  function startPostWizard() {
    showPostWizard = true;
    wizardStep = 1;
    resetWizardData();
  }

  function resetWizardData() {
    wizardData = {
      branch_id: '',
      thumbnail_file: null,
      pdf_file: null,
      start_date: '',
      expiry_date: '',
      offer_name: '',
      thumbnail_preview: null,
      pdf_preview: null,
      thumbnail_url: '',
      pdf_url: ''
    };
    
    // Reset upload progress
    uploadProgress = {
      thumbnail: 0,
      pdf: 0
    };
    uploadingFiles = {
      thumbnail: false,
      pdf: false
    };

    // Reset update mode
    isUpdating = false;
    updatingOfferId = null;
  }

  async function nextStep() {
    // Handle file uploads when moving from file selection steps
    if (wizardStep === 2 && wizardData.thumbnail_file) {
      // Upload thumbnail to Google Drive
      try {
        showMessage($language === 'ar' ? 'جاري رفع الصورة المصغرة...' : 'Uploading thumbnail...', 'info');
        wizardData.thumbnail_url = await uploadThumbnail(wizardData.thumbnail_file);
        console.log('✅ Thumbnail upload completed successfully');
        showMessage($language === 'ar' ? 'تم رفع الصورة المصغرة بنجاح' : 'Thumbnail uploaded successfully!', 'success');
      } catch (error) {
        console.error('❌ Thumbnail upload failed:', error);
        showMessage($language === 'ar' ? 'فشل في رفع الصورة المصغرة' : 'Failed to upload thumbnail', 'error');
        return; // Don't proceed to next step if upload fails
      }
    } else if (wizardStep === 3 && wizardData.pdf_file) {
      // Upload PDF to Google Drive
      try {
        showMessage($language === 'ar' ? 'جاري رفع ملف PDF...' : 'Uploading PDF...', 'info');
        wizardData.pdf_url = await uploadPDF(wizardData.pdf_file);
        console.log('✅ PDF upload completed successfully');
        showMessage($language === 'ar' ? 'تم رفع ملف PDF بنجاح' : 'PDF uploaded successfully!', 'success');
      } catch (error) {
        console.error('❌ PDF upload failed:', error);
        showMessage($language === 'ar' ? 'فشل في رفع ملف PDF' : 'Failed to upload PDF', 'error');
        return; // Don't proceed to next step if upload fails
      }
    }

    if (wizardStep < 6) {
      wizardStep++;
    } else if (wizardStep === 6) {
      generatePreview();
    }
  }

  function prevStep() {
    if (wizardStep > 1) {
      wizardStep--;
    }
  }

  function handleFileUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`📎 File selected:`, {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified)
    });

    // Validate file type based on upload type
    if (type === 'thumbnail') {
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedImageTypes.includes(file.type)) {
        showMessage(`Invalid image file type: ${file.type}. Please select a JPEG, PNG, WebP, or GIF file.`, 'error');
        return;
      }
      
      wizardData.thumbnail_file = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        wizardData.thumbnail_preview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else if (type === 'pdf') {
      if (file.type !== 'application/pdf') {
        showMessage(`Invalid PDF file type: ${file.type}. Please select a PDF file.`, 'error');
        return;
      }
      
      wizardData.pdf_file = file;
      wizardData.pdf_preview = file.name;
    }
  }

  function generatePreview() {
    const branch = branches.find(b => b.id === wizardData.branch_id);
    previewOffer = {
      ...wizardData,
      branch_name: branch?.name || 'Unknown Branch'
    };
    wizardStep = 7; // Preview step
  }

  async function postOffer() {
    if (!previewOffer) return;
    
    uploading = true;
    try {
      // Use the URLs that were uploaded during the wizard steps
      const thumbnailUrl = wizardData.thumbnail_url || '';
      const pdfUrl = wizardData.pdf_url || '';

      const offerData = {
        branch_id: wizardData.branch_id,
        offer_name: wizardData.offer_name,
        start_date: wizardData.start_date,
        expiry_date: wizardData.expiry_date,
        thumbnail_url: thumbnailUrl,
        pdf_url: pdfUrl,
        status: 'active'
      };

      let result;
      if (isUpdating && updatingOfferId) {
        // Update existing offer
        result = await supabase
          .from('offer_advertisements')
          .update(offerData)
          .eq('id', updatingOfferId)
          .select();
      } else {
        // Insert new offer
        result = await supabase
          .from('offer_advertisements')
          .insert(offerData)
          .select();
      }

      if (result.error) throw result.error;

      showMessage(
        isUpdating 
          ? ($language === 'ar' ? 'تم تحديث العرض بنجاح!' : 'Offer updated successfully!') 
          : ($language === 'ar' ? 'تم نشر العرض بنجاح!' : 'Offer posted successfully!'), 
        'success'
      );
      
      showPostWizard = false;
      resetWizardData();
      previewOffer = null;
      
      // Reset update mode
      isUpdating = false;
      updatingOfferId = null;
      
      loadOffers();
    } catch (error) {
      console.error('Error posting offer:', error);
      showMessage('Failed to post offer', 'error');
    } finally {
      uploading = false;
    }
  }

  function shareOffer(offer) {
    if (navigator.share) {
      navigator.share({
        title: offer.offer_name,
        text: `Check out this offer: ${offer.offer_name}`,
        url: window.location.origin + `/offers/${offer.id}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/offers/${offer.id}`);
      showMessage('Offer link copied to clipboard', 'success');
    }
  }

  async function deleteOffer(offerId) {
    if (!confirm($language === 'ar' ? 'هل أنت متأكد من حذف هذا العرض؟' : 'Are you sure you want to delete this offer?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('offer_advertisements')
        .delete()
        .eq('id', offerId);

      if (error) throw error;

      // Remove from local state
      offers = offers.filter(offer => offer.id !== offerId);
      
      showMessage($language === 'ar' ? 'تم حذف العرض بنجاح' : 'Offer deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting offer:', error);
      showMessage($language === 'ar' ? 'فشل في حذف العرض' : 'Failed to delete offer', 'error');
    }
  }

  function updateOffer(offer) {
    // Pre-fill wizard with existing offer data
    wizardData = {
      branch_id: offer.branch_id,
      thumbnail_file: null,
      pdf_file: null,
      start_date: offer.start_date,
      expiry_date: offer.expiry_date,
      offer_name: offer.offer_name,
      thumbnail_preview: offer.thumbnail_url,
      pdf_preview: offer.pdf_url ? 'Current PDF' : null,
      thumbnail_url: offer.thumbnail_url,
      pdf_url: offer.pdf_url
    };

    // Set update mode
    isUpdating = true;
    updatingOfferId = offer.id;
    
    // Start wizard
    showPostWizard = true;
    wizardStep = 1;
  }

  function viewOffer(offer) {
    // Navigate to customer view or open PDF viewer
    if (offer.pdf_url) {
      window.open(offer.pdf_url, '_blank');
    } else {
      showMessage($language === 'ar' ? 'لا يوجد ملف PDF متاح' : 'No PDF available', 'error');
    }
  }

  function showMessage(message, type) {
    // Enhanced toast notification with better styling
    const toast = document.createElement('div');
    
    let bgColor, borderColor, textColor;
    switch (type) {
      case 'success':
        bgColor = 'bg-green-600';
        borderColor = 'border-green-400';
        textColor = 'text-white';
        break;
      case 'error':
        bgColor = 'bg-red-600';
        borderColor = 'border-red-400';
        textColor = 'text-white';
        break;
      case 'info':
        bgColor = 'bg-blue-600';
        borderColor = 'border-blue-400';
        textColor = 'text-white';
        break;
      default:
        bgColor = 'bg-gray-600';
        borderColor = 'border-gray-400';
        textColor = 'text-white';
    }
    
    toast.className = `fixed top-4 right-4 p-4 rounded-lg z-50 border-2 ${bgColor} ${borderColor} ${textColor} shadow-lg transition-all duration-300 transform translate-x-0`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Add animation
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
  <!-- Header -->
  <div class="border-b border-gray-700/50 bg-[#0F1115]/80 backdrop-blur-sm">
    <div class="px-6 py-4">
      <h1 class="text-2xl font-bold text-[#E6E6E6] flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-r from-[#39FF14] to-[#00C853] flex items-center justify-center">
          📢
        </div>
        {$language === 'ar' ? 'مدير إعلانات العروض' : 'Offer Advertisement Manager'}
      </h1>
      <div class="h-1 w-full bg-gradient-to-r from-[#39FF14] to-[#FF6A00] rounded-full opacity-30 mt-3"></div>
    </div>
  </div>

  <div class="p-6 space-y-8">
    <!-- Dashboard Section -->
    <section class="bg-[#0F1115] rounded-2xl border border-gray-700/30 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-[#E6E6E6]">
          {$language === 'ar' ? 'لوحة التحكم المباشرة' : 'Live Dashboard'}
        </h2>
        <button
          on:click={startPostWizard}
          class="px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#00C853] text-black font-semibold rounded-xl hover:shadow-[0_0_20px_#39FF14] transition-all duration-300 hover:scale-105"
        >
          {$language === 'ar' ? '+ إنشاء عرض جديد' : '+ Post New Offer'}
        </button>
      </div>

      {#if loading}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each Array(6) as _}
            <div class="bg-gray-800/50 rounded-xl p-4 animate-pulse">
              <div class="w-full h-32 bg-gray-700 rounded-lg mb-4"></div>
              <div class="h-4 bg-gray-700 rounded mb-2"></div>
              <div class="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          {/each}
        </div>
      {:else if offers.length === 0}
        <div class="text-center py-16">
          <div class="text-6xl mb-4">📭</div>
          <h3 class="text-xl text-[#E6E6E6] mb-2">
            {$language === 'ar' ? 'لا توجد عروض حتى الآن' : 'No offers yet'}
          </h3>
          <p class="text-[#8A8F98] mb-6">
            {$language === 'ar' ? 'ابدأ بإنشاء أول عرض لك' : 'Start by creating your first offer'}
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {#each offers as offer}
            <div class="bg-gray-800/50 rounded-xl border border-[#39FF14]/20 p-4 hover:border-[#39FF14]/50 hover:shadow-[0_0_20px_rgba(57,255,20,0.1)] transition-all duration-300 hover:-translate-y-1">
              <!-- Thumbnail -->
              <div class="w-full h-32 bg-gray-700 rounded-lg mb-4 overflow-hidden">
                {#if offer.thumbnail_url}
                  <img src={offer.thumbnail_url} alt={offer.offer_name} class="w-full h-full object-cover">
                {:else}
                  <div class="w-full h-full flex items-center justify-center text-4xl">🎯</div>
                {/if}
              </div>

              <!-- Content -->
              <h3 class="font-semibold text-[#E6E6E6] mb-2 truncate">{offer.offer_name}</h3>
              <p class="text-[#8A8F98] text-sm mb-3">{offer.branches?.name || 'All Branches'}</p>
              
              <!-- Dates -->
              <div class="flex items-center gap-2 mb-4">
                <span class="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-xs rounded-full">
                  {new Date(offer.start_date).toLocaleDateString()}
                </span>
                <span class="text-[#8A8F98] text-xs">→</span>
                <span class="px-2 py-1 bg-[#FF6A00]/20 text-[#FF6A00] text-xs rounded-full">
                  {new Date(offer.expiry_date).toLocaleDateString()}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  on:click={() => updateOffer(offer)}
                  class="flex-1 px-3 py-2 bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30 rounded-lg hover:bg-[#39FF14]/30 transition-all duration-200 text-sm"
                >
                  {$language === 'ar' ? 'تعديل' : 'Edit'}
                </button>
                <button
                  on:click={() => deleteOffer(offer.id)}
                  class="flex-1 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-200 text-sm"
                >
                  {$language === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
              
              <!-- Secondary Actions -->
              <div class="flex gap-2 mt-2">
                <button
                  on:click={() => shareOffer(offer)}
                  class="flex-1 px-3 py-2 border border-[#FF6A00] text-[#FF6A00] rounded-lg hover:bg-[#FF6A00]/10 transition-all duration-200 text-sm"
                >
                  {$language === 'ar' ? 'مشاركة' : 'Share'}
                </button>
                <button 
                  on:click={() => viewOffer(offer)}
                  class="flex-1 px-3 py-2 border border-[#8A8F98] text-[#8A8F98] rounded-lg hover:bg-[#8A8F98]/10 transition-all duration-200 text-sm"
                >
                  {$language === 'ar' ? 'عرض' : 'View'}
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Supabase Storage Status Section -->
    <section class="bg-[#0F1115] rounded-2xl border border-gray-700/30 p-6">
      <h2 class="text-xl font-semibold text-[#E6E6E6] mb-6">
        {$language === 'ar' ? 'حالة التخزين في Supabase' : 'Supabase Storage Status'}
      </h2>
      
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Storage Overview -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 bg-[#39FF14] rounded-full animate-pulse"></div>
            <h3 class="text-[#E6E6E6] font-semibold">
              {$language === 'ar' ? 'التخزين نشط' : 'Storage Active'}
            </h3>
          </div>
          
          <div class="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-gray-300">
                {$language === 'ar' ? 'البكت' : 'Bucket'}:
              </span>
              <code class="text-[#39FF14] bg-gray-900 px-2 py-1 rounded text-sm">offer-files</code>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-gray-300">
                {$language === 'ar' ? 'الصور المصغرة' : 'Thumbnails'}:
              </span>
              <code class="text-[#FF6A00] bg-gray-900 px-2 py-1 rounded text-sm">thumbnails/</code>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-gray-300">
                {$language === 'ar' ? 'ملفات PDF' : 'PDF Files'}:
              </span>
              <code class="text-[#FF6A00] bg-gray-900 px-2 py-1 rounded text-sm">pdfs/</code>
            </div>
          </div>
        </div>

        <!-- Storage Features -->
        <div class="space-y-4">
          <h3 class="text-[#E6E6E6] font-semibold">
            {$language === 'ar' ? 'ميزات التخزين' : 'Storage Features'}
          </h3>
          
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 bg-[#39FF14] rounded-full"></div>
              <span class="text-gray-300 text-sm">
                {$language === 'ar' ? 'رفع مباشر مع شريط التقدم' : 'Direct upload with progress bar'}
              </span>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 bg-[#39FF14] rounded-full"></div>
              <span class="text-gray-300 text-sm">
                {$language === 'ar' ? 'تنظيم تلقائي للملفات' : 'Automatic file organization'}
              </span>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 bg-[#39FF14] rounded-full"></div>
              <span class="text-gray-300 text-sm">
                {$language === 'ar' ? 'روابط CDN سريعة' : 'Fast CDN URLs'}
              </span>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 bg-[#39FF14] rounded-full"></div>
              <span class="text-gray-300 text-sm">
                {$language === 'ar' ? 'أمان متكامل' : 'Integrated security'}
              </span>
            </div>
          </div>
          
          <button
            on:click={() => window.open('https://supabase.com/dashboard/project/' + 'your-project-id' + '/storage/buckets/offer-files', '_blank')}
            class="w-full mt-4 px-4 py-3 bg-gradient-to-r from-[#39FF14] to-[#00C853] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#39FF14]/25 transition-all duration-300"
          >
            {$language === 'ar' ? 'إدارة التخزين' : 'Manage Storage'}
          </button>
        </div>
      </div>
    </section>
  </div>
</div>

<!-- Post Offer Wizard Modal -->
{#if showPostWizard}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-[#0F1115] rounded-2xl border border-gray-700/50 max-w-2xl w-full max-h-[90vh] overflow-auto">
      <!-- Modal Header -->
      <div class="p-6 border-b border-gray-700/50">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-[#E6E6E6]">
            {isUpdating 
              ? ($language === 'ar' ? 'معالج تحديث العرض' : 'Update Offer Wizard') 
              : ($language === 'ar' ? 'معالج إنشاء العرض' : 'Post Offer Wizard')
            }
          </h2>
          <button
            on:click={() => showPostWizard = false}
            class="text-[#8A8F98] hover:text-[#E6E6E6] transition-colors"
          >
            ✕
          </button>
        </div>
        
        <!-- Progress Steps -->
        <div class="mt-4 flex items-center justify-center space-x-2">
          {#each Array(7) as _, i}
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                {i + 1 <= wizardStep ? 'bg-[#39FF14] text-black' : 'bg-gray-700 text-[#8A8F98]'}
              ">
                {i + 1}
              </div>
              {#if i < 6}
                <div class="w-8 h-0.5 {i + 1 < wizardStep ? 'bg-[#39FF14]' : 'bg-gray-700'}"></div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Modal Content -->
      <div class="p-6">
        {#if wizardStep === 1}
          <!-- Step 1: Select Branch -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-[#E6E6E6]">
              {$language === 'ar' ? 'اختر الفرع' : 'Select Branch'}
            </h3>
            <select
              bind:value={wizardData.branch_id}
              class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-[#E6E6E6] focus:border-[#39FF14] focus:outline-none"
            >
              <option value="">{$language === 'ar' ? 'اختر فرع' : 'Choose a branch'}</option>
              {#each branches as branch}
                <option value={branch.id}>{branch.name}</option>
              {/each}
            </select>
          </div>
        {:else if wizardStep === 2}
          <!-- Step 2: Upload Thumbnail -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-[#E6E6E6]">
              {$language === 'ar' ? 'رفع الصورة المصغرة' : 'Upload Thumbnail'}
            </h3>
            <div class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              {#if wizardData.thumbnail_preview}
                <img src={wizardData.thumbnail_preview} alt="Preview" class="w-32 h-20 object-cover rounded-lg mx-auto mb-4">
              {/if}
              
              {#if uploadingFiles.thumbnail}
                <!-- Upload Progress -->
                <div class="space-y-4">
                  <div class="text-4xl mb-2">⏳</div>
                  <p class="text-[#39FF14] font-medium">
                    {$language === 'ar' ? 'جاري رفع الصورة المصغرة...' : 'Uploading thumbnail...'}
                  </p>
                  <div class="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      class="bg-gradient-to-r from-[#39FF14] to-[#FF6A00] h-3 rounded-full transition-all duration-300"
                      style="width: {uploadProgress.thumbnail}%"
                    ></div>
                  </div>
                  <p class="text-[#8A8F98] text-sm">{Math.round(uploadProgress.thumbnail)}%</p>
                </div>
              {:else}
                <input
                  type="file"
                  accept="image/*"
                  on:change={(e) => handleFileUpload(e, 'thumbnail')}
                  class="hidden"
                  id="thumbnail-upload"
                >
                <label for="thumbnail-upload" class="cursor-pointer">
                  <div class="text-4xl mb-2">📷</div>
                  <p class="text-[#E6E6E6] font-medium">
                    {$language === 'ar' ? 'انقر لرفع الصورة' : 'Click to upload image'}
                  </p>
                  <p class="text-[#8A8F98] text-sm">
                    {$language === 'ar' ? 'PNG, JPG, WEBP حتى 5MB' : 'PNG, JPG, WEBP up to 5MB'}
                  </p>
                </label>
              {/if}
            </div>
          </div>
        {:else if wizardStep === 3}
          <!-- Step 3: Upload PDF -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-[#E6E6E6]">
              {$language === 'ar' ? 'رفع ملف PDF' : 'Upload PDF'}
            </h3>
            <div class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              {#if wizardData.pdf_preview}
                <div class="bg-gray-700 rounded-lg p-4 mb-4 inline-block">
                  <div class="text-2xl mb-2">📄</div>
                  <p class="text-[#E6E6E6] text-sm">{wizardData.pdf_preview}</p>
                </div>
              {/if}
              
              {#if uploadingFiles.pdf}
                <!-- Upload Progress -->
                <div class="space-y-4">
                  <div class="text-4xl mb-2">⏳</div>
                  <p class="text-[#39FF14] font-medium">
                    {$language === 'ar' ? 'جاري رفع ملف PDF...' : 'Uploading PDF...'}
                  </p>
                  <div class="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      class="bg-gradient-to-r from-[#FF6A00] to-[#39FF14] h-3 rounded-full transition-all duration-300"
                      style="width: {uploadProgress.pdf}%"
                    ></div>
                  </div>
                  <p class="text-[#8A8F98] text-sm">{Math.round(uploadProgress.pdf)}%</p>
                </div>
              {:else}
                <input
                  type="file"
                  accept=".pdf"
                  on:change={(e) => handleFileUpload(e, 'pdf')}
                  class="hidden"
                  id="pdf-upload"
                >
                <label for="pdf-upload" class="cursor-pointer">
                  <div class="text-4xl mb-2">📄</div>
                  <p class="text-[#E6E6E6] font-medium">
                    {$language === 'ar' ? 'انقر لرفع ملف PDF' : 'Click to upload PDF'}
                  </p>
                  <p class="text-[#8A8F98] text-sm">
                    {$language === 'ar' ? 'PDF حتى 10MB' : 'PDF up to 10MB'}
                  </p>
                </label>
              {/if}
            </div>
          </div>
        {:else if wizardStep === 4}
          <!-- Step 4: Set Start Date -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-[#E6E6E6]">
              {$language === 'ar' ? 'تاريخ البدء' : 'Start Date'}
            </h3>
            <input
              type="date"
              bind:value={wizardData.start_date}
              class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-[#E6E6E6] focus:border-[#39FF14] focus:outline-none"
            >
          </div>
        {:else if wizardStep === 5}
          <!-- Step 5: Set Expiry Date -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-[#E6E6E6]">
              {$language === 'ar' ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}
            </h3>
            <input
              type="date"
              bind:value={wizardData.expiry_date}
              min={wizardData.start_date}
              class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-[#E6E6E6] focus:border-[#39FF14] focus:outline-none"
            >
          </div>
        {:else if wizardStep === 6}
          <!-- Step 6: Enter Offer Name -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-[#E6E6E6]">
              {$language === 'ar' ? 'اسم العرض' : 'Offer Name'}
            </h3>
            <input
              type="text"
              bind:value={wizardData.offer_name}
              placeholder={$language === 'ar' ? 'أدخل اسم العرض...' : 'Enter offer name...'}
              class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-[#E6E6E6] focus:border-[#39FF14] focus:outline-none"
            >
          </div>
        {:else if wizardStep === 7}
          <!-- Step 7: Preview -->
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-[#E6E6E6]">
              {$language === 'ar' ? 'معاينة العرض' : 'Offer Preview'}
            </h3>
            
            {#if previewOffer}
              <div class="bg-gray-800/50 rounded-xl border border-[#39FF14]/30 p-6 max-w-sm mx-auto">
                <!-- Preview Thumbnail -->
                <div class="w-full h-32 bg-gray-700 rounded-lg mb-4 overflow-hidden">
                  {#if previewOffer.thumbnail_preview}
                    <img src={previewOffer.thumbnail_preview} alt={previewOffer.offer_name} class="w-full h-full object-cover">
                  {:else}
                    <div class="w-full h-full flex items-center justify-center text-4xl">🎯</div>
                  {/if}
                </div>

                <!-- Preview Content -->
                <h3 class="font-semibold text-[#E6E6E6] mb-2">{previewOffer.offer_name}</h3>
                <p class="text-[#8A8F98] text-sm mb-3">{previewOffer.branch_name}</p>
                
                <!-- Preview Dates -->
                <div class="flex items-center gap-2 mb-4">
                  <span class="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-xs rounded-full">
                    {new Date(previewOffer.start_date).toLocaleDateString()}
                  </span>
                  <span class="text-[#8A8F98] text-xs">→</span>
                  <span class="px-2 py-1 bg-[#FF6A00]/20 text-[#FF6A00] text-xs rounded-full">
                    {new Date(previewOffer.expiry_date).toLocaleDateString()}
                  </span>
                </div>

                <!-- Preview Actions -->
                <div class="flex gap-2">
                  <button class="flex-1 px-3 py-2 border border-[#FF6A00] text-[#FF6A00] rounded-lg">
                    {$language === 'ar' ? 'مشاركة' : 'Share'}
                  </button>
                  <button class="flex-1 px-3 py-2 bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30 rounded-lg">
                    {$language === 'ar' ? 'عرض' : 'View'}
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="p-6 border-t border-gray-700/50 flex justify-between">
        <button
          on:click={prevStep}
          disabled={wizardStep === 1}
          class="px-6 py-3 border border-gray-600 text-[#E6E6E6] rounded-lg hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {$language === 'ar' ? 'السابق' : 'Previous'}
        </button>

        {#if wizardStep === 7}
          <button
            on:click={postOffer}
            disabled={uploading}
            class="px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#00C853] text-black font-semibold rounded-lg hover:shadow-[0_0_20px_#39FF14] transition-all duration-300 disabled:opacity-50"
          >
            {uploading 
              ? (isUpdating 
                  ? ($language === 'ar' ? 'جاري التحديث...' : 'Updating...') 
                  : ($language === 'ar' ? 'جاري النشر...' : 'Posting...')
                ) 
              : (isUpdating 
                  ? ($language === 'ar' ? 'تحديث العرض' : 'Update Offer') 
                  : ($language === 'ar' ? 'نشر العرض' : 'Post Offer')
                )
            }
          </button>
        {:else}
          <button
            on:click={nextStep}
            disabled={
              (wizardStep === 1 && !wizardData.branch_id) ||
              (wizardStep === 2 && (!wizardData.thumbnail_file || uploadingFiles.thumbnail)) ||
              (wizardStep === 3 && (!wizardData.pdf_file || uploadingFiles.pdf)) ||
              (wizardStep === 4 && !wizardData.start_date) ||
              (wizardStep === 5 && !wizardData.expiry_date) ||
              (wizardStep === 6 && !wizardData.offer_name)
            }
            class="px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#00C853] text-black font-semibold rounded-lg hover:shadow-[0_0_20px_#39FF14] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if (wizardStep === 2 && uploadingFiles.thumbnail) || (wizardStep === 3 && uploadingFiles.pdf)}
              {$language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
            {:else}
              {wizardStep === 6 ? ($language === 'ar' ? 'معاينة' : 'Preview') : ($language === 'ar' ? 'التالي' : 'Next')}
            {/if}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    font-family: 'Inter', 'IBM Plex Sans Arabic', sans-serif;
  }
  
  /* Custom scrollbar for modal */
  div::-webkit-scrollbar {
    width: 6px;
  }
  
  div::-webkit-scrollbar-track {
    background: #1a1a1a;
    border-radius: 3px;
  }
  
  div::-webkit-scrollbar-thumb {
    background: #39FF14;
    border-radius: 3px;
  }
  
  div::-webkit-scrollbar-thumb:hover {
    background: #00C853;
  }
</style>
