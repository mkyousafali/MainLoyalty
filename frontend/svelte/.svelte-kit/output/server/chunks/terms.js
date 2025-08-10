import { w as writable } from "./index2.js";
import { b as browser } from "./index3.js";
import { s as supabase } from "./supabase.js";
const defaultTermsContent = {
  en: {
    title: "Terms and Conditions",
    subtitle: "Urban Market Loyalty Program",
    sections: {
      section1: {
        title: "1. Account Usage",
        content: "Your loyalty account is personal and non-transferable. Only the registered customer can use the account."
      },
      section2: {
        title: "2. Points Earning",
        content: "Earn 1 point for every 1 ﷼ spent at Urban Market stores. Points are awarded after successful payment."
      },
      section3: {
        title: "3. Points Redemption",
        content: "Points can be redeemed in fixed amounts only: 50, 100, 150, or 200 points. Custom redemption amounts are not allowed."
      },
      section4: {
        title: "4. Point Validity",
        content: "Points expire after 12 months of account inactivity. Active usage resets the expiration timer."
      },
      section5: {
        title: "5. Card Types",
        content: "Silver (0-999 points), Gold (1000-4999 points), Platinum (5000+ points). Card benefits increase with tier level."
      },
      section6: {
        title: "6. Privacy Policy",
        content: "We protect your personal information according to Saudi data protection laws and regulations."
      },
      section7: {
        title: "7. Program Changes",
        content: "Urban Market reserves the right to modify these terms and conditions with 30 days advance notice."
      },
      section8: {
        title: "8. Fraud Prevention",
        content: "Any fraudulent activity, misuse, or violation of terms will result in immediate account termination."
      },
      section9: {
        title: "9. Store Usage",
        content: "Points can only be used for discounts on future purchases at participating Urban Market stores."
      },
      section10: {
        title: "10. Support",
        content: "For assistance, contact customer support via WhatsApp or visit any Urban Market branch."
      }
    }
  },
  ar: {
    title: "الشروط والأحكام",
    subtitle: "برنامج ولاء ايربين ماركت",
    sections: {
      section1: {
        title: "1. استخدام الحساب",
        content: "حساب الولاء الخاص بك شخصي وغير قابل للنقل. يمكن للعميل المسجل فقط استخدام الحساب."
      },
      section2: {
        title: "2. كسب النقاط",
        content: "احصل على نقطة واحدة مقابل كل ريال سعودي تنفقه في متاجر ايربن ماركت. يتم منح النقاط بعد الدفع بنجاح."
      },
      section3: {
        title: "3. استبدال النقاط",
        content: "يمكن استبدال النقاط بمبالغ ثابتة فقط: 50، 100، 150، أو 200 نقطة. لا يُسمح بمبالغ الاستبدال المخصصة."
      },
      section4: {
        title: "4. صلاحية النقاط",
        content: "تنتهي صلاحية النقاط بعد 12 شهرًا من عدم النشاط في الحساب. الاستخدام النشط يعيد تعيين مؤقت انتهاء الصلاحية."
      },
      section5: {
        title: "5. أنواع البطاقات",
        content: "فضية (0-999 نقطة)، ذهبية (1000-4999 نقطة)، بلاتينية (5000+ نقطة). تزيد مزايا البطاقة مع مستوى المستوى."
      },
      section6: {
        title: "6. سياسة الخصوصية",
        content: "نحمي معلوماتك الشخصية وفقًا لقوانين حماية البيانات السعودية واللوائح."
      },
      section7: {
        title: "7. تغييرات البرنامج",
        content: "يحتفظ ايربن ماركت بالحق في تعديل هذه الشروط والأحكام مع إشعار مسبق لمدة 30 يومًا."
      },
      section8: {
        title: "8. منع الاحتيال",
        content: "أي نشاط احتيالي أو سوء استخدام أو انتهاك للشروط سيؤدي إلى إنهاء الحساب فورًا."
      },
      section9: {
        title: "9. استخدام المتجر",
        content: "يمكن استخدام النقاط فقط للحصول على خصومات على المشتريات المستقبلية في متاجر ايربن ماركت المشاركة."
      },
      section10: {
        title: "10. الدعم",
        content: "للمساعدة، اتصل بدعم العملاء عبر واتساب أو قم بزيارة أي فرع من فروع ايربن ماركت."
      }
    }
  }
};
function createTermsStore() {
  const { subscribe, set, update } = writable(defaultTermsContent);
  return {
    subscribe,
    // Load terms from Supabase database
    loadTerms: async () => {
      try {
        console.log("🔄 Loading terms from database...");
        const { data, error } = await supabase.from("terms_conditions").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(1).single();
        if (error) {
          console.warn("⚠️ No active terms found in database, using defaults:", error.message);
          set(defaultTermsContent);
          return;
        }
        if (data && data.content_en && data.content_ar) {
          console.log("✅ Terms loaded from database");
          const termsData = {
            en: JSON.parse(data.content_en),
            ar: JSON.parse(data.content_ar)
          };
          set(termsData);
        } else {
          console.warn("⚠️ Invalid terms data structure, using defaults");
          set(defaultTermsContent);
        }
      } catch (error) {
        console.error("❌ Failed to load terms from database:", error);
        set(defaultTermsContent);
      }
    },
    // Save terms to Supabase database
    saveTerms: async (termsData) => {
      try {
        console.log("💾 Saving terms to database...");
        const { error: deactivateError } = await supabase.from("terms_conditions").update({ is_active: false }).eq("is_active", true);
        if (deactivateError) {
          console.warn("⚠️ Failed to deactivate existing terms:", deactivateError.message);
        }
        const { data, error } = await supabase.from("terms_conditions").insert({
          version: `v${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "_")}`,
          content_en: JSON.stringify(termsData.en),
          content_ar: JSON.stringify(termsData.ar),
          effective_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          is_active: true
        }).select().single();
        if (error) {
          throw new Error(`Database save failed: ${error.message}`);
        }
        console.log("✅ Terms saved to database successfully");
        set(termsData);
        if (browser) ;
        return true;
      } catch (error) {
        console.error("❌ Failed to save terms to database:", error);
        return false;
      }
    },
    // Get terms for a specific language
    getTermsForLanguage: (language, currentTerms) => {
      return currentTerms[language] || defaultTermsContent[language];
    },
    // Update terms content
    updateTerms: (termsData) => {
      set(termsData);
    },
    // Reset to default terms
    resetToDefault: () => {
      set(defaultTermsContent);
    }
  };
}
createTermsStore();
