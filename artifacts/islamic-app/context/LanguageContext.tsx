import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppLanguage = "ur" | "en" | "ar";

export interface Translations {
  appName: string;
  appSubtitle: string;
  home: string;
  quran: string;
  hadith: string;
  library: string;
  learn: string;
  settings: string;
  search: string;
  downloads: string;
  verticalMode: string;
  horizontalMode: string;
  all: string;
  sahih: string;
  hasan: string;
  daif: string;
  muttafaq: string;
  filterByGrade: string;
  copy: string;
  share: string;
  copied: string;
  shared: string;
  bookmarked: string;
  chapter: string;
  hadithNumber: string;
  narrator: string;
  reference: string;
  saveOffline: string;
  savedOffline: string;
  readQuran: string;
  prayerTimes: string;
  qibla: string;
  books: string;
  shamelaSearch: string;
  coreEssentials: string;
  allTools: string;
  next: string;
  previous: string;
  cardOf: string;
  fontSize: string;
}

export const TRANSLATIONS: Record<AppLanguage, Translations> = {
  ur: {
    appName: "المفتاح",
    appSubtitle: "منصۂ تحقیقِ علمی و معارفِ اسلامیہ",
    home: "مرکز (ہوم)",
    quran: "قرآن حکیم",
    hadith: "کتبِ حدیث",
    library: "اسلامی لائبریری",
    learn: "تعلیم و نصاب",
    settings: "ترتیبات",
    search: "تلاش کریں",
    downloads: "ڈاؤن لوڈز",
    verticalMode: "مکمل لسٹ (ورٹیکل)",
    horizontalMode: "ایک ایک کارڈ (افقی)",
    all: "تمام",
    sahih: "صحیح",
    hasan: "حسن",
    daif: "ضعیف",
    muttafaq: "متفق علیہ",
    filterByGrade: "صحتِ حدیث کا فلٹر",
    copy: "کاپی کریں",
    share: "شیئر کریں",
    copied: "حدیث و ترجمہ کاپی ہو گیا",
    shared: "حدیث شیئر کی گئی",
    bookmarked: "محفوظ کر لیا گیا",
    chapter: "باب",
    hadithNumber: "حدیث نمبر",
    narrator: "راوی",
    reference: "حوالہ",
    saveOffline: "آف لائن محفوظ کریں",
    savedOffline: "آف لائن محفوظ ہے",
    readQuran: "تلاوتِ قرآن",
    prayerTimes: "اوقاتِ نماز",
    qibla: "قبلہ رخ",
    books: "کتبِ معتمدہ",
    shamelaSearch: "البحث الشامل",
    coreEssentials: "بنیادی خدمات و معمولات",
    allTools: "تمام اسلامی ٹولز و خدمات",
    next: "اگلی",
    previous: "پچھلی",
    cardOf: "از",
    fontSize: "حجمِ خط",
  },
  en: {
    appName: "Al-Miftah",
    appSubtitle: "Islamic Research & Learning OS",
    home: "Home",
    quran: "Holy Quran",
    hadith: "Hadith Collections",
    library: "Islamic Library",
    learn: "Learning Paths",
    settings: "Settings",
    search: "Search",
    downloads: "Downloads",
    verticalMode: "Vertical Stream",
    horizontalMode: "Card-by-Card",
    all: "All",
    sahih: "Sahih",
    hasan: "Hasan",
    daif: "Da'if",
    muttafaq: "Muttafaq 'Alayh",
    filterByGrade: "Filter by Grade",
    copy: "Copy",
    share: "Share",
    copied: "Copied to clipboard",
    shared: "Shared successfully",
    bookmarked: "Bookmarked",
    chapter: "Chapter",
    hadithNumber: "Hadith #",
    narrator: "Narrator",
    reference: "Reference",
    saveOffline: "Save Offline",
    savedOffline: "Saved Offline",
    readQuran: "Read Quran",
    prayerTimes: "Prayer Times",
    qibla: "Qibla Direction",
    books: "Islamic Books",
    shamelaSearch: "Shamela Search",
    coreEssentials: "Core Essentials",
    allTools: "All Tools & Services",
    next: "Next",
    previous: "Previous",
    cardOf: "of",
    fontSize: "Font Size",
  },
  ar: {
    appName: "المفتاح",
    appSubtitle: "منصة البحث العلمي والمعارف الإسلامية",
    home: "الرئيسية",
    quran: "القرآن الكريم",
    hadith: "الحديث الشريف",
    library: "المكتبة الإسلامية",
    learn: "المسارات التعليمية",
    settings: "الإعدادات",
    search: "البحث",
    downloads: "التحميلات",
    verticalMode: "عرض متتابع (عمودي)",
    horizontalMode: "بطاقة ببطاقة (أفقي)",
    all: "الكل",
    sahih: "صحيح",
    hasan: "حسن",
    daif: "ضعيف",
    muttafaq: "متفق عليه",
    filterByGrade: "تصفية حسب الدرجة",
    copy: "نسخ",
    share: "مشاركة",
    copied: "تم النسخ إلى الحافظة",
    shared: "تمت المشاركة",
    bookmarked: "تم الحفظ في المفضلة",
    chapter: "الباب",
    hadithNumber: "رقم الحديث",
    narrator: "الراوي",
    reference: "المرجع",
    saveOffline: "حفظ للقراءة دون اتصال",
    savedOffline: "محفوظ دون اتصال",
    readQuran: "تلاوة القرآن",
    prayerTimes: "مواقيت الصلاة",
    qibla: "اتجاه القبلة",
    books: "أمهات الكتب",
    shamelaSearch: "البحث الشامل",
    coreEssentials: "الخدمات الأساسية",
    allTools: "كافة الأدوات والخدمات",
    next: "التالي",
    previous: "السابق",
    cardOf: "من",
    fontSize: "حجم الخط",
  },
};

const LANG_STORAGE_KEY = "@app_language_preference_v1";

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  t: Translations;
  isUrdu: boolean;
  isArabic: boolean;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "ur",
  setLanguage: async () => {},
  t: TRANSLATIONS.ur,
  isUrdu: true,
  isArabic: false,
  isRTL: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("ur");

  useEffect(() => {
    AsyncStorage.getItem(LANG_STORAGE_KEY).then(val => {
      if (val === "en" || val === "ar" || val === "ur") {
        setLanguageState(val);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {}
  }, []);

  const t = TRANSLATIONS[language] ?? TRANSLATIONS.ur;
  const isUrdu = language === "ur";
  const isArabic = language === "ar";
  const isRTL = language === "ur" || language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isUrdu, isArabic, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
