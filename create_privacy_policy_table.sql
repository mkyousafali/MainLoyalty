-- Create privacy_policy table for managing privacy policy content
-- This table will store bilingual privacy policy content that can be edited by admins

CREATE TABLE IF NOT EXISTS public.privacy_policy (
    id BIGSERIAL PRIMARY KEY,
    title_en TEXT NOT NULL DEFAULT 'Privacy Policy',
    title_ar TEXT NOT NULL DEFAULT 'سياسة الخصوصية',
    content_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.privacy_policy ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active privacy policy
CREATE POLICY "Allow authenticated users to read active privacy policy" ON public.privacy_policy
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Allow authenticated users to manage privacy policy (can be restricted later with proper role system)
CREATE POLICY "Allow authenticated users to manage privacy policy" ON public.privacy_policy
    FOR ALL TO authenticated
    USING (true);

-- Insert initial privacy policy content (English and Arabic)
INSERT INTO public.privacy_policy (
    title_en,
    title_ar,
    content_en,
    content_ar,
    version,
    is_active
) VALUES (
    'Privacy Policy',
    'سياسة الخصوصية',
    'Privacy Policy

Please read with understanding before using our services.

This Privacy Policy explains how we collect, use, store, and protect your personal data when you use the Main Loyalty App, in line with the Personal Data Protection Law (PDPL) of the Kingdom of Saudi Arabia.

1. Who we are and how to contact us

We are أسواق علي حسن بن محمد سهلي للتجارة, registered in the Kingdom of Saudi Arabia with commercial registration number 5900124639.

We operate the Main Loyalty App for our supermarket brand Urban Market, which we fully own under our commercial registration.

As the operator of Main Loyalty, we are responsible for determining how and for what purposes your personal data is processed (the "data controller" under the Saudi Personal Data Protection Law - PDPL).

Our official website is www.urbanksa.com.

2. What categories of personal data do we process?

When you use the Main Loyalty App, we process personal data that you actively provide when registering or interacting with the app, as well as certain information collected automatically from your device. Broadly, we process the following categories of personal data:

Account data – name, mobile number, email address, password, and loyalty card number (if applicable).

Loyalty program data – points balance, rewards earned, redemption history, offers used, purchase patterns, and preferred branches.

Device and technical information – device ID, IP address, login sessions, and app interactions (e.g., rewards viewed, features used).

Customer support data – information you provide when contacting support, including messages and attachments.

Data storage – all personal data is stored securely in cloud storage. For operational and reporting purposes, authorized admin users of the app may download the data locally (e.g., customer lists, rewards activity, transaction reports).

3. What do we do with your personal data?

We process your personal data in order to operate and improve the Main Loyalty App. Specifically, we use your data for the following purposes:

Account creation and management.

Calculating and updating loyalty points and rewards.

Tracking redemption history and offers used.

Analyzing purchase patterns to provide relevant offers.

Responding to inquiries and customer support.

Protecting against fraud and misuse of points.

Improving app performance and user experience.

Sending marketing communications and promotions (if you consent).

4. Who will receive your data and under what circumstances?

We respect your privacy and only share your personal data when it is necessary for operating the Main Loyalty App or as required by law. Your data may be shared in the following cases:

Internal staff and admin users – authorized employees of أسواق علي حسن بن محمد سهلي للتجارة for service and reporting purposes.

Technology and cloud service providers – trusted third parties who host and secure our app (data processors acting under our instructions).

Legal and regulatory authorities – when required to comply with applicable laws or lawful requests.

Business changes – in case of a merger, acquisition, or restructuring, data may be transferred to the new entity under the same protections.

We do not sell or rent your personal data to third parties.

5. How do we store and secure your data?

Cloud storage – data is stored securely in trusted cloud infrastructure throughout the year.

Local downloads for admin users – at the end of each year, all points data and transaction data are downloaded locally by authorized admin users and then cleared from the cloud.

Customer deletion requests – customers may request deletion of their account via customer care. Account and cloud data will be removed, but points and transaction history remain in local archives for audit and compliance.

Data protection measures – encryption, access controls, secure backups, and monitoring are applied to protect your data.

6. Your rights as a customer

As a user of the Main Loyalty App, you have the following rights under PDPL:

Right to access – request details of the personal data we hold about you.

Right to correction – request correction of inaccurate or incomplete data.

Right to deletion (erasure) – request deletion of your account; account and cloud data will be deleted, but local archives of points and transactions remain.

Right to object to marketing – opt-out of promotional messages anytime.

Right to data portability – request a copy of your data, limited to the last 7 days of loyalty history only.

Right to complain – file a complaint with the competent Saudi data protection authority.

We aim to respond to all valid requests within the timelines required by law.

7. How long do we keep your data?

Account data – retained while your account is active.

Points and transaction data – stored in the cloud during the year, then downloaded locally and cleared from the cloud at year-end.

Customer support data – retained as long as necessary to resolve the inquiry or meet legal obligations.

Marketing preferences – retained until you opt-out or delete your account.

We follow a data minimization principle: unnecessary data is deleted or anonymized.

8. Changes to this Privacy Policy

We may update this Privacy Policy from time to time.

When significant updates are made, we will notify you through the Main Loyalty App (e.g., in-app notice or alert) or via WhatsApp.

We encourage you to review this Privacy Policy regularly.

Last updated: August 2025

9. Marketing and Notifications

We may send you promotional messages via the Main Loyalty App or WhatsApp about offers and rewards related to Urban Market.

Based on your purchase patterns and rewards history, you may receive personalized offers.

You may opt-out anytime via app settings or customer care.

10. Legal obligations and authority requests

We may process or share certain personal data in order to:

Comply with laws and regulations in the Kingdom of Saudi Arabia.

Respond to lawful requests from regulators, courts, or government authorities.

Protect our rights and interests in cases of fraud, disputes, or misuse of the Main Loyalty App.

Any such disclosures will be limited to what is legally required.',
    'سياسة الخصوصية

يرجى القراءة بتفهم قبل استخدام خدماتنا.

تشرح سياسة الخصوصية هذه كيفية جمعنا واستخدامنا وتخزيننا وحماية بياناتك الشخصية عند استخدام تطبيق الولاء الرئيسي، بما يتماشى مع نظام حماية البيانات الشخصية (PDPL) في المملكة العربية السعودية.

1. من نحن وكيفية الاتصال بنا

نحن أسواق علي حسن بن محمد سهلي للتجارة، مسجلة في المملكة العربية السعودية برقم السجل التجاري 5900124639.

نحن نشغل تطبيق الولاء الرئيسي لعلامة السوبر ماركت الخاصة بنا Urban Market، والتي نملكها بالكامل تحت سجلنا التجاري.

بصفتنا مشغل الولاء الرئيسي، فإننا مسؤولون عن تحديد كيفية وأغراض معالجة بياناتك الشخصية ("مراقب البيانات" بموجب نظام حماية البيانات الشخصية السعودي - PDPL).

موقعنا الرسمي هو www.urbanksa.com.

2. ما هي فئات البيانات الشخصية التي نعالجها؟

عندما تستخدم تطبيق الولاء الرئيسي، نقوم بمعالجة البيانات الشخصية التي تقدمها بنشاط عند التسجيل أو التفاعل مع التطبيق، بالإضافة إلى معلومات معينة يتم جمعها تلقائياً من جهازك. بشكل عام، نقوم بمعالجة الفئات التالية من البيانات الشخصية:

بيانات الحساب – الاسم، رقم الجوال، عنوان البريد الإلكتروني، كلمة المرور، ورقم بطاقة الولاء (إن وجد).

بيانات برنامج الولاء – رصيد النقاط، المكافآت المكتسبة، تاريخ الاسترداد، العروض المستخدمة، أنماط الشراء، والفروع المفضلة.

معلومات الجهاز والتقنية – معرف الجهاز، عنوان IP، جلسات تسجيل الدخول، وتفاعلات التطبيق (مثل المكافآت المعروضة، الميزات المستخدمة).

بيانات دعم العملاء – المعلومات التي تقدمها عند الاتصال بالدعم، بما في ذلك الرسائل والمرفقات.

تخزين البيانات – جميع البيانات الشخصية مخزنة بشكل آمن في التخزين السحابي. لأغراض التشغيل والتقارير، قد يقوم مستخدمو الإدارة المخولون في التطبيق بتنزيل البيانات محلياً (مثل قوائم العملاء، نشاط المكافآت، تقارير المعاملات).

3. ماذا نفعل ببياناتك الشخصية؟

نعالج بياناتك الشخصية من أجل تشغيل وتحسين تطبيق الولاء الرئيسي. على وجه التحديد، نستخدم بياناتك للأغراض التالية:

إنشاء الحساب وإدارته.

حساب وتحديث نقاط الولاء والمكافآت.

تتبع تاريخ الاسترداد والعروض المستخدمة.

تحليل أنماط الشراء لتقديم عروض ذات صلة.

الرد على الاستفسارات ودعم العملاء.

الحماية من الاحتيال وسوء استخدام النقاط.

تحسين أداء التطبيق وتجربة المستخدم.

إرسال اتصالات تسويقية وعروض ترويجية (إذا وافقت).

4. من سيتلقى بياناتك وفي أي ظروف؟

نحترم خصوصيتك ونشارك بياناتك الشخصية فقط عندما يكون ذلك ضرورياً لتشغيل تطبيق الولاء الرئيسي أو كما يتطلب القانون. قد تتم مشاركة بياناتك في الحالات التالية:

الموظفون الداخليون ومستخدمو الإدارة – الموظفون المخولون في أسواق علي حسن بن محمد سهلي للتجارة لأغراض الخدمة والتقارير.

موفرو التكنولوجيا والخدمات السحابية – أطراف ثالثة موثوقة تستضيف وتؤمن تطبيقنا (معالجات البيانات التي تعمل تحت تعليماتنا).

السلطات القانونية والتنظيمية – عند الحاجة للامتثال للقوانين المعمول بها أو الطلبات القانونية.

التغييرات التجارية – في حالة الاندماج أو الاستحواذ أو إعادة الهيكلة، قد يتم نقل البيانات إلى الكيان الجديد تحت نفس الحماية.

نحن لا نبيع أو نؤجر بياناتك الشخصية لأطراف ثالثة.

5. كيف نخزن ونؤمن بياناتك؟

التخزين السحابي – البيانات مخزنة بشكل آمن في بنية تحتية سحابية موثوقة طوال السنة.

التنزيلات المحلية لمستخدمي الإدارة – في نهاية كل سنة، يتم تنزيل جميع بيانات النقاط وبيانات المعاملات محلياً من قبل مستخدمي الإدارة المخولين ثم مسحها من السحابة.

طلبات حذف العملاء – يمكن للعملاء طلب حذف حسابهم عبر خدمة العملاء. سيتم إزالة بيانات الحساب والسحابة، لكن تاريخ النقاط والمعاملات يبقى في الأرشيف المحلي للتدقيق والامتثال.

تدابير حماية البيانات – يتم تطبيق التشفير وضوابط الوصول والنسخ الاحتياطية الآمنة والمراقبة لحماية بياناتك.

6. حقوقك كعميل

بصفتك مستخدماً لتطبيق الولاء الرئيسي، لديك الحقوق التالية بموجب PDPL:

الحق في الوصول – طلب تفاصيل البيانات الشخصية التي نحتفظ بها عنك.

الحق في التصحيح – طلب تصحيح البيانات غير الدقيقة أو غير المكتملة.

الحق في الحذف (المحو) – طلب حذف حسابك؛ سيتم حذف بيانات الحساب والسحابة، لكن الأرشيف المحلي للنقاط والمعاملات يبقى.

الحق في الاعتراض على التسويق – إلغاء الاشتراك في الرسائل الترويجية في أي وقت.

الحق في قابلية نقل البيانات – طلب نسخة من بياناتك، مقتصرة على آخر 7 أيام من تاريخ الولاء فقط.

الحق في الشكوى – تقديم شكوى لدى سلطة حماية البيانات السعودية المختصة.

نهدف للرد على جميع الطلبات الصالحة ضمن الأطر الزمنية المطلوبة قانونياً.

7. كم من الوقت نحتفظ ببياناتك؟

بيانات الحساب – محتفظ بها أثناء كون حسابك نشطاً.

بيانات النقاط والمعاملات – مخزنة في السحابة خلال السنة، ثم يتم تنزيلها محلياً ومسحها من السحابة في نهاية السنة.

بيانات دعم العملاء – محتفظ بها طالما كان ذلك ضرورياً لحل الاستفسار أو الوفاء بالالتزامات القانونية.

تفضيلات التسويق – محتفظ بها حتى تلغي الاشتراك أو تحذف حسابك.

نتبع مبدأ تقليل البيانات: البيانات غير الضرورية يتم حذفها أو إخفاء هويتها.

8. التغييرات على سياسة الخصوصية هذه

قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر.

عند إجراء تحديثات مهمة، سنخطرك من خلال تطبيق الولاء الرئيسي (مثل إشعار داخل التطبيق أو تنبيه) أو عبر WhatsApp.

نشجعك على مراجعة سياسة الخصوصية هذه بانتظام.

آخر تحديث: أغسطس 2025

9. التسويق والإشعارات

قد نرسل لك رسائل ترويجية عبر تطبيق الولاء الرئيسي أو WhatsApp حول العروض والمكافآت المتعلقة بـ Urban Market.

بناءً على أنماط الشراء الخاصة بك وتاريخ المكافآت، قد تتلقى عروضاً مخصصة.

يمكنك إلغاء الاشتراك في أي وقت عبر إعدادات التطبيق أو خدمة العملاء.

10. الالتزامات القانونية وطلبات السلطات

قد نعالج أو نشارك بيانات شخصية معينة من أجل:

الامتثال للقوانين واللوائح في المملكة العربية السعودية.

الاستجابة للطلبات القانونية من المنظمين والمحاكم أو السلطات الحكومية.

حماية حقوقنا ومصالحنا في حالات الاحتيال أو النزاعات أو سوء استخدام تطبيق الولاء الرئيسي.

أي إفصاحات من هذا القبيل ستكون محدودة بما هو مطلوب قانونياً.',
    1,
    true
);

-- Add indexes for better performance
CREATE INDEX idx_privacy_policy_active ON public.privacy_policy(is_active);
CREATE INDEX idx_privacy_policy_version ON public.privacy_policy(version);

-- Add trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_privacy_policy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_privacy_policy_timestamp
    BEFORE UPDATE ON public.privacy_policy
    FOR EACH ROW
    EXECUTE FUNCTION update_privacy_policy_timestamp();
