import { Router } from "express";
import { db, ayahsTable, surahsTable } from "@workspace/db";
import { eq, sql, and, like } from "drizzle-orm";

const router = Router();

// ================= 1. QURANIC ROOT WORDS & MORPHOLOGY DATABASE =================
interface QuranRoot {
  root: string;
  transliteration: string;
  meaning: string;
  meaningUrdu: string;
  totalOccurrences: number;
  grammarForms: {
    form: string;
    type: "verb" | "noun" | "participle";
    meaning: string;
    examplesCount: number;
  }[];
  sampleAyahs: {
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
    arabic: string;
    translationEn: string;
  }[];
}

const QURANIC_ROOTS: Record<string, QuranRoot> = {
  "علم": {
    root: "ع-ل-م",
    transliteration: "‘A-L-M",
    meaning: "To know, to possess knowledge, to teach, signs, world",
    meaningUrdu: "جاننا، علم حاصل کرنا، سکھانا، نشانی، جہان",
    totalOccurrences: 854,
    grammarForms: [
      { form: "عَلِمَ (Alima)", type: "verb", meaning: "He knew", examplesCount: 382 },
      { form: "عَلَّمَ (Allama)", type: "verb", meaning: "He taught", examplesCount: 42 },
      { form: "عِلْم (Ilm)", type: "noun", meaning: "Knowledge", examplesCount: 105 },
      { form: "عَالِم (Alim)", type: "participle", meaning: "Knower, All-Knowing", examplesCount: 161 },
      { form: "عَالَمِين (Alameen)", type: "noun", meaning: "Worlds / Mankind", examplesCount: 73 },
    ],
    sampleAyahs: [
      { surahNumber: 96, ayahNumber: 5, surahName: "Al-Alaq", arabic: "عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ", translationEn: "Taught man that which he knew not." },
      { surahNumber: 20, ayahNumber: 114, surahName: "Ta-Ha", arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا", translationEn: "And say: My Lord, increase me in knowledge." },
      { surahNumber: 1, ayahNumber: 2, surahName: "Al-Fatihah", arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translationEn: "Praise be to Allah, Lord of the worlds." },
    ],
  },
  "حمد": {
    root: "ح-م-د",
    transliteration: "H-M-D",
    meaning: "To praise, commend, extol with love and veneration",
    meaningUrdu: "تعریف کرنا، شکر ادا کرنا، مدح و ستائش",
    totalOccurrences: 68,
    grammarForms: [
      { form: "حَمْد (Hamd)", type: "noun", meaning: "All Praise", examplesCount: 43 },
      { form: "حَمِيد (Hameed)", type: "participle", meaning: "Praiseworthy", examplesCount: 17 },
      { form: "مَحْمُود (Mahmood)", type: "participle", meaning: "Praised / Commendable", examplesCount: 2 },
      { form: "مُحَمَّد (Muhammad)", type: "noun", meaning: "The Praised One ﷺ", examplesCount: 4 },
      { form: "أَحْمَد (Ahmad)", type: "noun", meaning: "Most Praiseworthy", examplesCount: 1 },
    ],
    sampleAyahs: [
      { surahNumber: 1, ayahNumber: 2, surahName: "Al-Fatihah", arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translationEn: "All praise is due to Allah, Lord of the worlds." },
      { surahNumber: 17, ayahNumber: 79, surahName: "Al-Isra", arabic: "عَسَىٰ أَن يَبْعَثَكَ رَبُّكَ مَقَامًا مَّحْمُودًا", translationEn: "It may be that your Lord will raise you to a praised station." },
      { surahNumber: 48, ayahNumber: 29, surahName: "Al-Fath", arabic: "مُّحَمَّدٌ رَّسُولُ اللَّهِ", translationEn: "Muhammad is the Messenger of Allah." },
    ],
  },
  "صبر": {
    root: "ص-ب-ر",
    transliteration: "S-B-R",
    meaning: "Patience, steadfastness, perseverance, restraint",
    meaningUrdu: "صبر، استقامت، ثابت قدمی، نفس کو روکنا",
    totalOccurrences: 103,
    grammarForms: [
      { form: "صَبَرَ (Sabara)", type: "verb", meaning: "He was patient", examplesCount: 49 },
      { form: "صَبْر (Sabr)", type: "noun", meaning: "Patience", examplesCount: 16 },
      { form: "صَابِرِين (Sabireen)", type: "participle", meaning: "The patient ones", examplesCount: 38 },
    ],
    sampleAyahs: [
      { surahNumber: 2, ayahNumber: 153, surahName: "Al-Baqarah", arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", translationEn: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient." },
      { surahNumber: 3, ayahNumber: 200, surahName: "Al-Imran", arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا", translationEn: "O you who have believed, persevere and endure and remain stationed." },
    ],
  },
  "رحم": {
    root: "ر-ح-م",
    transliteration: "R-H-M",
    meaning: "Mercy, compassion, womb, tenderness",
    meaningUrdu: "رحمت، ترس کھانا، مہربانی، قرابت داری",
    totalOccurrences: 339,
    grammarForms: [
      { form: "رَحْمَة (Rahmah)", type: "noun", meaning: "Mercy", examplesCount: 114 },
      { form: "الرَّحْمَٰن (Ar-Rahman)", type: "noun", meaning: "The Entirely Merciful", examplesCount: 57 },
      { form: "الرَّحِيم (Ar-Raheem)", type: "noun", meaning: "The Especially Merciful", examplesCount: 115 },
      { form: "أَرْحَام (Arham)", type: "noun", meaning: "Wombs / Kinship", examplesCount: 12 },
    ],
    sampleAyahs: [
      { surahNumber: 1, ayahNumber: 1, surahName: "Al-Fatihah", arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", translationEn: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
      { surahNumber: 21, ayahNumber: 107, surahName: "Al-Anbiya", arabic: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ", translationEn: "And We have not sent you, [O Muhammad], except as a mercy to the worlds." },
    ],
  },
  "كتب": {
    root: "ك-ت-ب",
    transliteration: "K-T-B",
    meaning: "To write, ordain, prescribe, book, decree",
    meaningUrdu: "لکھنا، فرض کرنا، فیصلہ کرنا، کتاب",
    totalOccurrences: 319,
    grammarForms: [
      { form: "كَتَبَ (Kataba)", type: "verb", meaning: "He wrote / ordained", examplesCount: 56 },
      { form: "كِتَاب (Kitab)", type: "noun", meaning: "Book / Scripture", examplesCount: 230 },
      { form: "كَاتِب (Katib)", type: "participle", meaning: "Scribe / Writer", examplesCount: 5 },
    ],
    sampleAyahs: [
      { surahNumber: 2, ayahNumber: 183, surahName: "Al-Baqarah", arabic: "كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ", translationEn: "Decreed upon you is fasting as it was decreed upon those before you." },
      { surahNumber: 2, ayahNumber: 2, surahName: "Al-Baqarah", arabic: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ", translationEn: "This is the Book about which there is no doubt." },
    ],
  },
};

// GET: All available root words
router.get("/research/roots", (_req, res) => {
  const list = Object.keys(QURANIC_ROOTS).map(k => ({
    key: k,
    root: QURANIC_ROOTS[k].root,
    transliteration: QURANIC_ROOTS[k].transliteration,
    meaning: QURANIC_ROOTS[k].meaning,
    meaningUrdu: QURANIC_ROOTS[k].meaningUrdu,
    totalOccurrences: QURANIC_ROOTS[k].totalOccurrences,
  }));
  res.json({ roots: list });
});

// GET: Single root word detail
router.get("/research/roots/:rootKey", (req, res) => {
  const rootData = QURANIC_ROOTS[req.params.rootKey];
  if (!rootData) {
    res.status(404).json({ message: "Root word not found in database" });
    return;
  }
  res.json(rootData);
});

// ================= 2. COMPARATIVE TAFSIR ENGINE =================
router.get("/research/tafsir/:surahNumber/:ayahNumber", async (req, res) => {
  const surahNumber = Number(req.params.surahNumber);
  const ayahNumber = Number(req.params.ayahNumber);

  const [ayah] = await db.select().from(ayahsTable)
    .where(and(eq(ayahsTable.surahNumber, surahNumber), eq(ayahsTable.numberInSurah, ayahNumber)))
    .limit(1);

  if (!ayah) {
    res.status(404).json({ message: "Ayah not found" });
    return;
  }

  const [surah] = await db.select().from(surahsTable).where(eq(surahsTable.number, surahNumber)).limit(1);

  // Curated multi-tafsir comparative insights
  const tafsirData = {
    surahNumber,
    ayahNumber,
    surahName: surah?.nameEnglish || `Surah ${surahNumber}`,
    surahArabic: surah?.nameArabic || "",
    arabic: ayah.arabic,
    translationEn: ayah.translationEn,
    translationUr: ayah.translationUr || "ترجمہ دستیاب نہیں",
    tafsirs: [
      {
        id: "ibn_kathir",
        name: "تفسير ابن كثير (Tafsir Ibn Kathir)",
        scholar: "الإمام الحافظ ابن كثير الدمشقي (المتوفى: 774هـ)",
        methodology: "تفسير القرآن بالقرآن وبالسنة النبوية وآثار الصحابة والتابعين",
        summaryEn: ayah.tafsirEn || "Comprehensive hadith-based explanation linking Quranic ayahs with authentic prophetic traditions and historical occasions of revelation.",
        summaryUr: ayah.tafsirUr || "قرآن کی تشریح قرآن، سنت نبوی اور اقوال صحابہ کی روشنی میں۔ اس آیت کی مفصل تفسیری روایت اور نزول کا تاریخی پس منظر۔",
      },
      {
        id: "maariful_quran",
        name: "معارف القرآن (Ma'ariful Quran)",
        scholar: "مفتی اعظم پاکستان مفتی محمد شفیع عثمانیؒ (المتوفى: 1396هـ)",
        methodology: "فقہی، اخلاقی، سماجی اور عصری مسائل کا قرآنی حل مع احکام الشریعہ",
        summaryEn: "Detailed guidance synthesizing classical commentaries (Ruh al-Ma'ani, Qurtubi) with practical modern applications, legal rulings (Fiqh), and moral wisdom.",
        summaryUr: "قرآنی آیات سے فقہی مسائل، احکام و حکمت اور اصلاحِ باطن کا استنباط۔ دورِ حاضر کے فکری و اخلاقی مسائل کی قرآنی روشنی میں تسلی بخش وضاحت۔",
      },
      {
        id: "jalalayn",
        name: "تفسير الجلالين (Tafsir al-Jalalayn)",
        scholar: "جلال الدين المحلي وجلال الدين السيوطي (رحمهما الله)",
        methodology: "إيضاح موجز لمعاني الألفاظ القرآنية والإعراب وسبب النزول",
        summaryEn: "Concise linguistic clarification of vocabulary, syntactical role (I'rab), and context of revelation in lucid classical Arabic.",
        summaryUr: "مختصر اور جامع لفظی تشریح، اعراب اور اسبابِ نزول کا خلاصہ جس سے آیت کا براہ راست نحوی مفہوم فوراً واضح ہو جاتا ہے۔",
      },
    ],
  };

  res.json(tafsirData);
});

// ================= 3. HADITH NARRATORS (علم رجال الحدیث) =================
interface NarratorBio {
  name: string;
  nameArabic: string;
  kunyah: string;
  tabaqah: string; // Companions, Senior Tabi'un, etc.
  deathYearHijri: number;
  totalHadiths: number;
  verdict: string; // ثقة ثبت، صحابي جليل، etc.
  biography: string;
  prominentStudents: string[];
}

const NARRATORS: Record<string, NarratorBio> = {
  "abu_hurairah": {
    name: "Abu Hurairah",
    nameArabic: "أبو هريرة عبد الرحمن بن صخر الدوسي ؓ",
    kunyah: "أبو هريرة",
    tabaqah: "صحابي جليل (Companions)",
    deathYearHijri: 59,
    totalHadiths: 5374,
    verdict: "صحابي عدل جليل، أحفظ الصحابة لحديث رسول الله ﷺ",
    biography: "The most prolific narrator of Prophetic traditions. Embraced Islam in year 7 AH and constantly accompanied the Prophet ﷺ with immense memory blessed by a special dua of the Messenger ﷺ.",
    prominentStudents: ["Sa'id ibn al-Musayyib", "Ibn Sirin", "Hammam ibn Munabbih", "Ata ibn Abi Rabah"],
  },
  "aisha": {
    name: "Aisha bint Abi Bakr",
    nameArabic: "أم المؤمنين عائشة بنت أبي بكر الصديق رضي الله عنهما",
    kunyah: "أم عبد الله",
    tabaqah: "أم المؤمنين وفقیہۃ الصحابة",
    deathYearHijri: 58,
    totalHadiths: 2210,
    verdict: "أفقه نساء الأمة وأعلم الناس بالفرائض والسنن",
    biography: "Mother of the Believers, renowned for her sharp intellect, mastery of Shariah, jurisprudence, and deep understanding of the private and public Sunnah of the Prophet ﷺ.",
    prominentStudents: ["Urwah ibn al-Zubayr", "Al-Qasim ibn Muhammad", "Masruq", "Amrah bint Abd al-Rahman"],
  },
  "ibn_umar": {
    name: "Abdullah ibn Umar",
    nameArabic: "عبد الله بن عمر بن الخطاب رضي الله عنهما",
    kunyah: "أبو عبد الرحمن",
    tabaqah: "صحابي جليل، أحد العبادلة الأربعة",
    deathYearHijri: 73,
    totalHadiths: 2630,
    verdict: "شديد الاتباع لآثار النبي ﷺ، فقيه ورع",
    biography: "Eldest son of Umar ibn al-Khattab (RA). Exemplary in following every minor Sunnah of the Prophet ﷺ with profound scrupulousness and wisdom.",
    prominentStudents: ["Nafi' Mawla Ibn Umar", "Salim ibn Abdullah", "Mujahid ibn Jabr", "Al-Zuhri"],
  },
  "anas": {
    name: "Anas ibn Malik",
    nameArabic: "أنس بن مالك الأنصاري الخزرجي ؓ",
    kunyah: "أبو حمزة",
    tabaqah: "خادم رسول الله ﷺ وصاحبه",
    deathYearHijri: 93,
    totalHadiths: 2286,
    verdict: "صحابي جليل، خادم المصطفى ﷺ عشر سنين",
    biography: "Served the Prophet ﷺ diligently for ten years from the Hijrah until the Prophet's passing. Blessed with longevity and extensive knowledge.",
    prominentStudents: ["Qatadah", "Al-Hasan al-Basri", "Thabit al-Bunani", "Muhammad ibn Sirin"],
  },
};

// GET: Hadith Narrators list
router.get("/research/narrators", (_req, res) => {
  const list = Object.keys(NARRATORS).map(k => ({
    key: k,
    ...NARRATORS[k],
  }));
  res.json({ narrators: list });
});

export default router;
