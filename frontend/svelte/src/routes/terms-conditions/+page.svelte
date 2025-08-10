<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  let currentLang: 'en' | 'ar' = 'en';
  let pageLoaded = false;
  let isPreviewMode = false;
  let previewData: any = null;

  onMount(() => {
    // Check if this is preview mode
    const urlParams = new URLSearchParams(window.location.search);
    isPreviewMode = urlParams.get('preview') === 'true';
    
    if (isPreviewMode) {
      // Load preview data from sessionStorage
      const savedPreviewData = sessionStorage.getItem('termsPreviewData');
      if (savedPreviewData) {
        previewData = JSON.parse(savedPreviewData);
      }
    }
    
    // Page load animation
    setTimeout(() => {
      pageLoaded = true;
    }, 100);
  });

  function handleLanguageToggle() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
  }

  function printPage() {
    window.print();
  }

  function goBack() {
    window.close();
  }

  const translations = {
    en: {
      title: 'Terms and Conditions',
      subtitle: 'Urban Market Loyalty Program',
      lastUpdated: 'Last Updated: August 1, 2025',
      printButton: 'Print',
      backButton: 'Close',
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
      },
      section6: {
        title: '6. Limitation of Liability and Disclaimers',
        content: `6.1 Service Availability: While we strive to provide continuous service, the Program may be temporarily unavailable due to maintenance, technical issues, or circumstances beyond our control.

6.2 Limitation of Liability: To the maximum extent permitted by Saudi law, our liability is limited to the value of unredeemed points in your account at the time of any incident.

6.3 Disclaimers: The Program is provided "as is" without warranties of any kind, except those that cannot be excluded under applicable law.

6.4 Force Majeure: We are not liable for delays or failures in performance due to circumstances beyond our reasonable control.`
      },
      section7: {
        title: '7. Modification and Termination',
        content: `7.1 Program Changes: We reserve the right to modify the Program terms, benefits, or structure with 30 days' notice to participants.

7.2 Account Termination: We may terminate accounts for violation of these Terms, fraudulent activity, or other just cause, in accordance with Saudi consumer protection laws.

7.3 Voluntary Withdrawal: You may withdraw from the Program at any time by contacting customer service.

7.4 Effect of Termination: Upon termination, all accrued points and benefits will be forfeited, except where prohibited by law.`
      },
      section8: {
        title: '8. Dispute Resolution and Governing Law',
        content: `8.1 Governing Law: These Terms are governed by the laws of the Kingdom of Saudi Arabia.

8.2 Dispute Resolution: Any disputes arising from these Terms or the Program shall be resolved through:
• First: Direct negotiation with our customer service team
• Second: Mediation through the Saudi Center for Commercial Arbitration
• Final: Binding arbitration in Riyadh, Saudi Arabia

8.3 Consumer Rights: Nothing in these Terms shall limit your rights under Saudi consumer protection laws.

8.4 Jurisdiction: The courts of Riyadh, Saudi Arabia shall have exclusive jurisdiction over any legal proceedings.`
      },
      section9: {
        title: '9. Contact Information and Customer Service',
        content: `For questions about these Terms or the Program, please contact us:

Urban Market Customer Service
📧 Email: support@urbanmarket.sa
📱 WhatsApp: +966 50 000 0000
📞 Phone: +966 11 123 4567
🏢 Address: King Fahd Road, Riyadh, Saudi Arabia

Customer service is available Sunday through Thursday, 9:00 AM to 6:00 PM Saudi time.`
      },
      section10: {
        title: '10. Additional Provisions',
        content: `10.1 Severability: If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.

10.2 Entire Agreement: These Terms, together with our Privacy Policy, constitute the entire agreement between you and Urban Market regarding the Program.

10.3 Language: These Terms are prepared in Arabic and English. In case of any conflict, the Arabic version shall prevail as required by Saudi law.

10.4 Electronic Communications: You consent to receive communications from us electronically, including program updates and promotional materials.`
      }
    },
    ar: {
      title: 'الشروط والأحكام',
      subtitle: 'برنامج ولاء ايربين ماركت',
      lastUpdated: 'آخر تحديث: 1 أغسطس 2025',
      printButton: 'طباعة',
      backButton: 'إغلاق',
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
      },
      section6: {
        title: '6. تحديد المسؤولية وإخلاء المسؤولية',
        content: `6.1 توفر الخدمة: بينما نسعى لتقديم خدمة مستمرة، قد يكون البرنامج غير متاح مؤقتاً بسبب الصيانة أو المشاكل التقنية أو الظروف الخارجة عن سيطرتنا.

6.2 تحديد المسؤولية: إلى أقصى حد يسمح به القانون السعودي، تقتصر مسؤوليتنا على قيمة النقاط غير المستبدلة في حسابكم وقت وقوع أي حادث.

6.3 إخلاء المسؤولية: يُقدم البرنامج "كما هو" دون ضمانات من أي نوع، باستثناء تلك التي لا يمكن استبعادها بموجب القانون المعمول به.

6.4 القوة القاهرة: نحن غير مسؤولين عن التأخير أو الفشل في الأداء بسبب ظروف خارجة عن سيطرتنا المعقولة.`
      },
      section7: {
        title: '7. التعديل والإنهاء',
        content: `7.1 تغييرات البرنامج: نحتفظ بالحق في تعديل شروط البرنامج أو مزاياه أو هيكله مع إشعار مسبق لمدة 30 يوماً للمشاركين.

7.2 إنهاء الحساب: يجوز لنا إنهاء الحسابات لانتهاك هذه الشروط أو النشاط الاحتيالي أو أي سبب عادل آخر، وفقاً لقوانين حماية المستهلك السعودية.

7.3 الانسحاب الطوعي: يمكنكم الانسحاب من البرنامج في أي وقت عن طريق الاتصال بخدمة العملاء.

7.4 أثر الإنهاء: عند الإنهاء، سيتم فقدان جميع النقاط والمزايا المتراكمة، إلا حيث يحظر القانون ذلك.`
      },
      section8: {
        title: '8. تسوية النزاعات والقانون الحاكم',
        content: `8.1 القانون الحاكم: تخضع هذه الشروط لقوانين المملكة العربية السعودية.

8.2 تسوية النزاعات: أي نزاعات تنشأ من هذه الشروط أو البرنامج سيتم حلها من خلال:
• أولاً: التفاوض المباشر مع فريق خدمة العملاء لدينا
• ثانياً: الوساطة من خلال المركز السعودي للتحكيم التجاري
• أخيراً: التحكيم الملزم في الرياض، المملكة العربية السعودية

8.3 حقوق المستهلك: لا شيء في هذه الشروط يحد من حقوقكم بموجب قوانين حماية المستهلك السعودية.

8.4 الاختصاص القضائي: تختص محاكم الرياض، المملكة العربية السعودية بأي إجراءات قانونية.`
      },
      section9: {
        title: '9. معلومات الاتصال وخدمة العملاء',
        content: `للاستفسارات حول هذه الشروط أو البرنامج، يرجى الاتصال بنا:

خدمة عملاء ايربين ماركت
📧 البريد الإلكتروني: support@urbanmarket.sa
📱 واتساب: +966 50 000 0000
📞 الهاتف: +966 11 123 4567
🏢 العنوان: طريق الملك فهد، الرياض، المملكة العربية السعودية

خدمة العملاء متاحة من الأحد إلى الخميس، من الساعة 9:00 صباحاً إلى 6:00 مساءً بالتوقيت السعودي.`
      },
      section10: {
        title: '10. أحكام إضافية',
        content: `10.1 القابلية للفصل: إذا تبين أن أي حكم من هذه الشروط غير قابل للتنفيذ، فإن الأحكام المتبقية تبقى سارية المفعول بالكامل.

10.2 الاتفاقية الكاملة: تشكل هذه الشروط، مع سياسة الخصوصية، الاتفاقية الكاملة بينكم وبين ايربين ماركت فيما يتعلق بالبرنامج.

10.3 اللغة: تم إعداد هذه الشروط باللغتين العربية والإنجليزية. في حالة وجود أي تعارض، تسود النسخة العربية كما يتطلب القانون السعودي.

10.4 الاتصالات الإلكترونية: توافقون على تلقي الاتصالات منا إلكترونياً، بما في ذلك تحديثات البرنامج والمواد الترويجية.`
      }
    }
  } as const;

  $: t = isPreviewMode && previewData?.termsContent ? previewData.termsContent[currentLang] : translations[currentLang];
</script>

<svelte:head>
  <title>{t.title} - {t.subtitle}</title>
  <meta name="description" content="Terms and Conditions for Urban Market Loyalty Program" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" class:rtl={currentLang === 'ar'}>
  <!-- Header -->
  <div class="bg-white shadow-sm sticky top-0 z-10">
    <div class="max-w-6xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <img 
            src="/logo.png" 
            alt="Establishment Logo" 
            class="h-12 w-auto object-contain"
            on:error={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <!-- Fallback logo -->
          <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg items-center justify-center text-white text-xl" style="display: none;">
            🏪
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">{t.title}</h1>
            <p class="text-sm text-gray-600">{t.subtitle}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Language Toggle -->
          <button 
            on:click={handleLanguageToggle}
            class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors"
          >
            <span class="text-lg">🌐</span>
            <span class="text-sm font-medium">
              {currentLang === 'ar' ? 'English' : 'عربي'}
            </span>
          </button>
          
          <!-- Print Button -->
          <button 
            on:click={printPage}
            class="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 transition-colors"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM5 14H4v-3h1v3zm1 0v2h8v-2H6z" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm">{t.printButton}</span>
          </button>
          
          <!-- Close Button -->
          <button 
            on:click={goBack}
            class="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-4 py-2 transition-colors"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm">{t.backButton}</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Preview Mode Banner -->
  {#if isPreviewMode}
    <div class="bg-yellow-100 border-l-4 border-yellow-500 px-4 py-3">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              <strong>Preview Mode:</strong> You are viewing the Terms & Conditions with your recent edits. This is not the live version visible to customers.
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Content -->
  <div class="max-w-4xl mx-auto px-4 py-8" class:opacity-0={!pageLoaded} class:animate-fade-in={pageLoaded}>
    <!-- Document Header -->
    <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
      <div class="text-center mb-6">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">{t.title}</h2>
        <h3 class="text-xl text-gray-600 mb-4">{t.subtitle}</h3>
        <p class="text-sm text-gray-500 bg-gray-50 inline-block px-4 py-2 rounded-full">
          {t.lastUpdated}
        </p>
      </div>
      
      <!-- Quick Navigation -->
      <div class="border-t pt-6">
        <h4 class="text-lg font-semibold text-gray-800 mb-4" class:text-right={currentLang === 'ar'}>
          {currentLang === 'ar' ? 'فهرس المحتويات' : 'Table of Contents'}
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <a href="#section1" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            {t.section1.title}
          </a>
          <a href="#section2" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            {t.section2.title}
          </a>
          <a href="#section3" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            {t.section3.title}
          </a>
          <a href="#section4" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            {t.section4.title}
          </a>
          <a href="#section5" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            {t.section5.title}
          </a>
          <a href="#section6" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            {t.section6.title}
          </a>
          <a href="#section7" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            {t.section7.title}
          </a>
          <a href="#section8" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            {t.section8.title}
          </a>
          <a href="#section9" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            {t.section9.title}
          </a>
          <a href="#section10" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            {t.section10.title}
          </a>
        </div>
      </div>
    </div>

    <!-- Terms Sections -->
    <div class="space-y-8">
      <!-- Section 1 -->
      <section id="section1" class="bg-white rounded-xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2" class:text-right={currentLang === 'ar'}>
          {t.section1.title}
        </h3>
        <div class="prose prose-gray max-w-none" class:text-right={currentLang === 'ar'}>
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">{t.section1.content}</p>
        </div>
      </section>

      <!-- Section 2 -->
      <section id="section2" class="bg-white rounded-xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2" class:text-right={currentLang === 'ar'}>
          {t.section2.title}
        </h3>
        <div class="prose prose-gray max-w-none" class:text-right={currentLang === 'ar'}>
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">{t.section2.content}</p>
        </div>
      </section>

      <!-- Section 3 -->
      <section id="section3" class="bg-white rounded-xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2" class:text-right={currentLang === 'ar'}>
          {t.section3.title}
        </h3>
        <div class="prose prose-gray max-w-none" class:text-right={currentLang === 'ar'}>
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">{t.section3.content}</p>
        </div>
      </section>

      <!-- Section 4 -->
      <section id="section4" class="bg-white rounded-xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2" class:text-right={currentLang === 'ar'}>
          {t.section4.title}
        </h3>
        <div class="prose prose-gray max-w-none" class:text-right={currentLang === 'ar'}>
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">{t.section4.content}</p>
        </div>
      </section>

      <!-- Section 5 -->
      <section id="section5" class="bg-white rounded-xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2" class:text-right={currentLang === 'ar'}>
          {t.section5.title}
        </h3>
        <div class="prose prose-gray max-w-none" class:text-right={currentLang === 'ar'}>
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">{t.section5.content}</p>
        </div>
      </section>

      <!-- Section 6 -->
      <section id="section6" class="bg-white rounded-xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2" class:text-right={currentLang === 'ar'}>
          {t.section6.title}
        </h3>
        <div class="prose prose-gray max-w-none" class:text-right={currentLang === 'ar'}>
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">{t.section6.content}</p>
        </div>
      </section>

      <!-- Section 7 -->
      <section id="section7" class="bg-white rounded-xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2" class:text-right={currentLang === 'ar'}>
          {t.section7.title}
        </h3>
        <div class="prose prose-gray max-w-none" class:text-right={currentLang === 'ar'}>
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">{t.section7.content}</p>
        </div>
      </section>

      <!-- Section 8 -->
      <section id="section8" class="bg-white rounded-xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2" class:text-right={currentLang === 'ar'}>
          {t.section8.title}
        </h3>
        <div class="prose prose-gray max-w-none" class:text-right={currentLang === 'ar'}>
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">{t.section8.content}</p>
        </div>
      </section>

      <!-- Section 9 -->
      <section id="section9" class="bg-white rounded-xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2" class:text-right={currentLang === 'ar'}>
          {t.section9.title}
        </h3>
        <div class="prose prose-gray max-w-none" class:text-right={currentLang === 'ar'}>
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">{t.section9.content}</p>
        </div>
      </section>

      <!-- Section 10 -->
      <section id="section10" class="bg-white rounded-xl shadow-lg p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2" class:text-right={currentLang === 'ar'}>
          {t.section10.title}
        </h3>
        <div class="prose prose-gray max-w-none" class:text-right={currentLang === 'ar'}>
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">{t.section10.content}</p>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <div class="mt-12 text-center text-sm text-gray-500 space-y-2">
      <div class="bg-white rounded-xl shadow-lg p-6">
        <p class="font-medium text-gray-700 mb-2">
          {currentLang === 'ar' ? 'هذه الوثيقة محمية بحقوق الطبع والنشر' : 'This document is protected by copyright'}
        </p>
        <p>© 2024 Urban Market Establishment. {currentLang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
        <p class="mt-2">
          {currentLang === 'ar' 
            ? 'للاستفسارات القانونية، يرجى الاتصال بالقسم القانوني على: legal@urbanmarket.sa'
            : 'For legal inquiries, please contact our legal department at: legal@urbanmarket.sa'
          }
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  .rtl {
    direction: rtl;
    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .rtl .prose {
    text-align: right;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }

  /* Print styles */
  @media print {
    .sticky {
      position: static !important;
    }
    
    button {
      display: none !important;
    }
    
    .shadow-lg {
      box-shadow: none !important;
    }
    
    .bg-gradient-to-br {
      background: white !important;
    }
    
    section {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    h3 {
      page-break-after: avoid;
    }
  }

  /* Smooth scrolling for anchor links */
  html {
    scroll-behavior: smooth;
  }

  /* Enhanced readability */
  .prose p {
    line-height: 1.8;
    margin-bottom: 1rem;
  }

  .prose ul {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  .prose li {
    margin: 0.5rem 0;
  }

  /* RTL specific adjustments */
  .rtl .prose ul {
    padding-right: 1.5rem;
    padding-left: 0;
  }

  .rtl a {
    text-align: right;
  }
</style>
