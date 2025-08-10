<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { termsStore, type TermsData, getTermsLastUpdated } from '$lib/stores/terms';
  
  let isLoading = false;
  let saveMessage = '';
  let currentLang: 'en' | 'ar' = 'en';
  let lastUpdated = '';

  // Terms and Conditions content - editable
  let termsContent: TermsData = {
    en: {
      title: 'Terms and Conditions',
      subtitle: 'Urban Market Loyalty Program',
      sections: {
        section1: {
          title: '1. Introduction and Acceptance',
          content: `Welcome to the Urban Market Loyalty Program ("Program"). These Terms and Conditions ("Terms") constitute a legally binding agreement between you ("Customer", "User", "You") and Urban Market Establishment ("Establishment", "We", "Us", "Our"). By participating in the Program, registering for a loyalty card, or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms.

This Program is governed by the laws of the Kingdom of Saudi Arabia and complies with international standards for consumer protection and data privacy, including GDPR principles where applicable.`
        },
        section2: {
          title: '2. Eligibility and Registration',
          content: `2.1 Eligibility: The Program is available to individuals who are:
• At least 18 years of age
• Legal residents of Saudi Arabia or GCC countries
• Capable of entering into legally binding contracts under Saudi law

2.2 Registration Requirements:
• Valid mobile phone number
• Accurate personal information
• Consent to these Terms and our Privacy Policy
• Compliance with all applicable laws

2.3 Account Responsibility: You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.`
        },
        section3: {
          title: '3. Program Benefits and Points System',
          content: `3.1 Points Earning: Points are earned based on qualifying purchases at participating Urban Market locations. The earning rate may vary by product category and promotional periods.

3.2 Points Redemption: Points can be redeemed for rewards, discounts, or special offers as specified in the Program guidelines.

3.3 Points Validity: Points are valid until the end of the calendar year in which they were earned, unless extended through qualifying activity.

3.4 Non-Transferability: Points and benefits are non-transferable, non-refundable, and have no cash value except where required by law.`
        },
        section4: {
          title: '4. Data Protection and Privacy',
          content: `4.1 Data Collection: We collect and process personal data in accordance with Saudi Arabia's Personal Data Protection Law (PDPL) and international best practices.

4.2 Data Usage: Your data is used to:
• Administer the loyalty program
• Provide personalized offers and communications
• Improve our services and customer experience
• Comply with legal obligations

4.3 Data Security: We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.

4.4 Your Rights: You have the right to access, correct, delete, or restrict the processing of your personal data, subject to applicable laws.`
        },
        section5: {
          title: '5. User Obligations and Prohibited Activities',
          content: `5.1 Permitted Use: The Program is for personal, non-commercial use only.

5.2 Prohibited Activities:
• Fraudulent activities or misrepresentation
• Abuse or gaming of the points system
• Violation of any applicable laws or regulations
• Unauthorized access to others' accounts
• Commercial resale of points or benefits

5.3 Compliance: Users must comply with all applicable laws, including but not limited to Saudi commercial law, consumer protection regulations, and anti-money laundering requirements.`
        }
      }
    },
    ar: {
      title: 'الشروط والأحكام',
      subtitle: 'برنامج ولاء ايربين ماركت',
      sections: {
        section1: {
          title: '1. المقدمة والقبول',
          content: `مرحباً بكم في برنامج ولاء ايربين ماركت ("البرنامج"). تشكل هذه الشروط والأحكام ("الشروط") اتفاقية ملزمة قانونياً بينكم ("العميل"، "المستخدم"، "أنتم") ومؤسسة ايربين ماركت ("المؤسسة"، "نحن"، "لنا"). من خلال المشاركة في البرنامج أو التسجيل للحصول على بطاقة ولاء أو استخدام خدماتنا، فإنكم تقرون بأنكم قد قرأتم وفهمتم ووافقتم على الالتزام بهذه الشروط.

يخضع هذا البرنامج لقوانين المملكة العربية السعودية ويتوافق مع المعايير الدولية لحماية المستهلك وخصوصية البيانات، بما في ذلك مبادئ اللائحة العامة لحماية البيانات حيثما ينطبق ذلك.`
        },
        section2: {
          title: '2. الأهلية والتسجيل',
          content: `2.1 الأهلية: البرنامج متاح للأفراد الذين:
• عمرهم 18 سنة على الأقل
• مقيمون قانونيون في المملكة العربية السعودية أو دول مجلس التعاون الخليجي
• قادرون على الدخول في عقود ملزمة قانونياً بموجب القانون السعودي

2.2 متطلبات التسجيل:
• رقم هاتف محمول صالح
• معلومات شخصية دقيقة
• الموافقة على هذه الشروط وسياسة الخصوصية
• الامتثال لجميع القوانين المعمول بها

2.3 مسؤولية الحساب: أنتم مسؤولون عن المحافظة على سرية معلومات حسابكم وعن جميع الأنشطة التي تحدث تحت حسابكم.`
        },
        section3: {
          title: '3. مزايا البرنامج ونظام النقاط',
          content: `3.1 كسب النقاط: يتم كسب النقاط بناءً على المشتريات المؤهلة في مواقع ايربين ماركت المشاركة. قد يختلف معدل الكسب حسب فئة المنتج والفترات الترويجية.

3.2 استبدال النقاط: يمكن استبدال النقاط للحصول على مكافآت أو خصومات أو عروض خاصة كما هو محدد في إرشادات البرنامج.

3.3 صلاحية النقاط: النقاط صالحة حتى نهاية السنة الميلادية التي تم كسبها فيها، ما لم يتم تمديدها من خلال نشاط مؤهل.

3.4 عدم القابلية للنقل: النقاط والمزايا غير قابلة للنقل أو الاسترداد وليس لها قيمة نقدية إلا حيث يتطلب القانون ذلك.`
        },
        section4: {
          title: '4. حماية البيانات والخصوصية',
          content: `4.1 جمع البيانات: نحن نجمع ونعالج البيانات الشخصية وفقاً لقانون حماية البيانات الشخصية في المملكة العربية السعودية والممارسات الدولية الأفضل.

4.2 استخدام البيانات: تُستخدم بياناتكم لـ:
• إدارة برنامج الولاء
• تقديم عروض واتصالات مخصصة
• تحسين خدماتنا وتجربة العملاء
• الامتثال للالتزامات القانونية

4.3 أمان البيانات: نحن ننفذ تدابير تقنية وتنظيمية مناسبة لحماية بياناتكم الشخصية من الوصول غير المصرح به أو التغيير أو الكشف أو التدمير.

4.4 حقوقكم: لديكم الحق في الوصول إلى بياناتكم الشخصية أو تصحيحها أو حذفها أو تقييد معالجتها، وفقاً للقوانين المعمول بها.`
        },
        section5: {
          title: '5. التزامات المستخدم والأنشطة المحظورة',
          content: `5.1 الاستخدام المسموح: البرنامج للاستخدام الشخصي وغير التجاري فقط.

5.2 الأنشطة المحظورة:
• الأنشطة الاحتيالية أو التضليل
• إساءة استخدام أو التلاعب بنظام النقاط
• انتهاك أي قوانين أو لوائح معمول بها
• الوصول غير المصرح به لحسابات الآخرين
• البيع التجاري للنقاط أو المزايا

5.3 الامتثال: يجب على المستخدمين الامتثال لجميع القوانين المعمول بها، بما في ذلك على سبيل المثال لا الحصر القانون التجاري السعودي ولوائح حماية المستهلك ومتطلبات مكافحة غسل الأموال.`
        }
      }
    }
  };

  onMount(() => {
    // Load existing terms if available
    loadExistingTerms();
  });

  function loadExistingTerms() {
    // Load terms using the shared store
    termsStore.loadTerms();
    termsStore.subscribe(termsData => {
      termsContent = termsData;
    });
    
    // Get last updated timestamp from database
    getTermsLastUpdated().then(timestamp => {
      if (timestamp) {
        lastUpdated = timestamp;
      }
    }).catch(error => {
      console.warn('Failed to get last updated timestamp:', error);
    });
  }

  async function saveTerms() {
    isLoading = true;
    saveMessage = '';

    try {
      // Save using the shared store (now saves to database)
      const success = await termsStore.saveTerms(termsContent);
      
      if (!success) {
        throw new Error('Failed to save terms to database');
      }
      
      const timestamp = new Date().toISOString();
      lastUpdated = timestamp;
      
      // Create notification for customers
      const notification = {
        id: Date.now(),
        type: 'terms_update',
        title: 'Terms & Conditions Updated',
        message: `Terms and Conditions have been updated on ${new Date(timestamp).toLocaleDateString()}`,
        timestamp: timestamp,
        isRead: false,
        priority: 'medium'
      };
      
      // Add to notifications
      const existingNotifications = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
      existingNotifications.unshift(notification);
      localStorage.setItem('customerNotifications', JSON.stringify(existingNotifications));
      
      saveMessage = 'Terms & Conditions saved successfully to database! All customers will see the updated terms.';
      
      // Auto-hide message after 5 seconds
      setTimeout(() => {
        saveMessage = '';
      }, 5000);
      
    } catch (error) {
      console.error('Failed to save terms:', error);
      saveMessage = 'Error saving Terms & Conditions to database. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function previewTerms() {
    // Save current edits to sessionStorage for preview
    const previewData = {
      termsContent,
      lastUpdated: new Date().toISOString()
    };
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('termsPreviewData', JSON.stringify(previewData));
      // Open preview page with preview parameter
      window.open('/terms-conditions?preview=true', '_blank');
    }
  }

  function handleLanguageToggle() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
  }
</script>

<svelte:head>
  <title>Terms & Conditions Management - Admin Panel</title>
</svelte:head>

<div class="terms-management">
  <!-- Header -->
  <div class="header">
    <div class="header-content">
      <div class="header-left">
        <h1>Terms & Conditions Management</h1>
        <p class="header-subtitle">Edit and manage the Terms & Conditions for the loyalty program</p>
      </div>
      
      <div class="header-actions">
        <!-- Language Toggle -->
        <button 
          class="language-toggle"
          on:click={handleLanguageToggle}
          title="Switch Language"
        >
          <span class="icon">🌐</span>
          <span>{currentLang === 'en' ? 'العربية' : 'English'}</span>
        </button>
        
        <!-- Preview Button -->
        <button 
          class="preview-button"
          on:click={previewTerms}
          title="Preview Terms"
        >
          <span class="icon">👁️</span>
          <span>Preview</span>
        </button>
        
        <!-- Save Button -->
        <button 
          class="save-button"
          on:click={saveTerms}
          disabled={isLoading}
          title="Save Changes"
        >
          {#if isLoading}
            <span class="loading-spinner">⏳</span>
            <span>Saving...</span>
          {:else}
            <span class="icon">💾</span>
            <span>Save Changes</span>
          {/if}
        </button>
      </div>
    </div>
    
    {#if lastUpdated}
      <div class="last-updated">
        <span class="icon">🕒</span>
        <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
      </div>
    {/if}
  </div>

  <!-- Save Message -->
  {#if saveMessage}
    <div class="save-message {saveMessage.includes('Error') ? 'error' : 'success'}">
      <span class="icon">{saveMessage.includes('Error') ? '⚠️' : '✅'}</span>
      <span>{saveMessage}</span>
    </div>
  {/if}

  <!-- Content Editor -->
  <div class="content-editor" class:rtl={currentLang === 'ar'}>
    <div class="editor-header">
      <h2>{termsContent[currentLang].title}</h2>
      <input 
        type="text" 
        class="title-input"
        bind:value={termsContent[currentLang].title}
        placeholder="Document Title"
      />
      
      <input 
        type="text" 
        class="subtitle-input"
        bind:value={termsContent[currentLang].subtitle}
        placeholder="Document Subtitle"
      />
    </div>

    <!-- Sections Editor -->
    <div class="sections-editor">
      {#each Object.entries(termsContent[currentLang].sections) as [sectionKey, section]}
        <div class="section-editor">
          <div class="section-header">
            <input 
              type="text" 
              class="section-title-input"
              bind:value={section.title}
              placeholder="Section Title"
            />
          </div>
          
          <div class="section-content">
            <textarea 
              class="content-textarea"
              bind:value={section.content}
              placeholder="Section Content"
              rows="15"
            ></textarea>
          </div>
        </div>
      {/each}
    </div>

    <!-- Add New Section -->
    <div class="add-section">
      <button 
        class="add-section-button"
        on:click={() => {
          const newKey = `section${Object.keys(termsContent[currentLang].sections).length + 1}`;
          const sections = termsContent[currentLang].sections as any;
          sections[newKey] = {
            title: `${Object.keys(termsContent[currentLang].sections).length + 1}. New Section`,
            content: 'Enter section content here...'
          };
          termsContent = termsContent; // Trigger reactivity
        }}
      >
        <span class="icon">➕</span>
        <span>Add New Section</span>
      </button>
    </div>
  </div>

  <!-- Footer Info -->
  <div class="footer-info">
    <div class="info-card">
      <h3>💡 Tips for Editing</h3>
      <ul>
        <li>Use bullet points (•) for lists</li>
        <li>Ensure both English and Arabic versions are updated</li>
        <li>Preview changes before saving</li>
        <li>Save regularly to avoid losing changes</li>
      </ul>
    </div>
    
    <div class="info-card">
      <h3>📢 Customer Notifications</h3>
      <p>When you save changes, customers will automatically receive a notification about the Terms & Conditions update.</p>
    </div>
  </div>
</div>

<style>
  .terms-management {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0;
  }

  /* Header */
  .header {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .header-left h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .header-subtitle {
    color: #6b7280;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .language-toggle, .preview-button, .save-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .language-toggle {
    background: #f3f4f6;
    color: #374151;
  }

  .language-toggle:hover {
    background: #e5e7eb;
  }

  .preview-button {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .preview-button:hover {
    background: #bfdbfe;
  }

  .save-button {
    background: #10b981;
    color: white;
  }

  .save-button:hover:not(:disabled) {
    background: #059669;
  }

  .save-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading-spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .last-updated {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  /* Save Message */
  .save-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    font-weight: 500;
  }

  .save-message.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .save-message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  /* Content Editor */
  .content-editor {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .content-editor.rtl {
    direction: rtl;
    text-align: right;
  }

  .editor-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .title-input, .subtitle-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    transition: border-color 0.2s ease;
  }

  .title-input {
    font-size: 1.5rem;
  }

  .title-input:focus, .subtitle-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  /* Sections Editor */
  .sections-editor {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .section-editor {
    border: 2px solid #f3f4f6;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    transition: border-color 0.2s ease;
  }

  .section-editor:hover {
    border-color: #e5e7eb;
  }

  .section-title-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .section-title-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .content-textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.6;
    resize: vertical;
    min-height: 200px;
  }

  .content-textarea:focus {
    outline: none;
    border-color: #3b82f6;
  }

  /* Add Section */
  .add-section {
    text-align: center;
    padding: 2rem;
  }

  .add-section-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    color: #475569;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-section-button:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  /* Footer Info */
  .footer-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .info-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .info-card h3 {
    margin: 0 0 1rem 0;
    color: #1f2937;
  }

  .info-card ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #6b7280;
  }

  .info-card li {
    margin-bottom: 0.5rem;
  }

  .info-card p {
    margin: 0;
    color: #6b7280;
    line-height: 1.6;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .header-actions {
      width: 100%;
      justify-content: stretch;
    }

    .header-actions button {
      flex: 1;
    }

    .footer-info {
      grid-template-columns: 1fr;
    }
  }
</style>
