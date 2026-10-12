import { db } from "@workspace/db";
import {
  usersTable, surahsTable, ayahsTable,
  hadithCollectionsTable, hadithBooksTable, hadithsTable,
  bookCategoriesTable, booksTable, bookChaptersTable,
  learningPathsTable, lessonsTable,
  duasTable, fiqhTopicsTable, awradLibraryTable, mosquesTable, kidsStoriesTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { sql, eq } from "drizzle-orm";
import { logger } from "./logger";

interface AlquranAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}
interface AlquranSurah {
  number: number;
  ayahs: AlquranAyah[];
}
interface AlquranResponse {
  data: { surahs: AlquranSurah[] };
}

export async function seedQuranAyahsFromAPI(): Promise<void> {
  logger.info("Fetching Quran text from api.alquran.cloud...");
  const [arabicRes, englishRes] = await Promise.all([
    fetch("https://api.alquran.cloud/v1/quran/quran-uthmani"),
    fetch("https://api.alquran.cloud/v1/quran/en.sahih"),
  ]);
  if (!arabicRes.ok || !englishRes.ok) {
    throw new Error(`alquran.cloud fetch failed: arabic=${arabicRes.status} english=${englishRes.status}`);
  }
  const arabicData = (await arabicRes.json()) as AlquranResponse;
  const englishData = (await englishRes.json()) as AlquranResponse;

  const engMap = new Map<number, Map<number, string>>();
  for (const s of englishData.data.surahs) {
    const m = new Map<number, string>();
    for (const a of s.ayahs) m.set(a.numberInSurah, a.text);
    engMap.set(s.number, m);
  }

  const ayahsToInsert: {
    number: number; surahNumber: number; numberInSurah: number;
    arabic: string; translationEn: string; juzNumber: number; pageNumber: number;
  }[] = [];

  for (const surah of arabicData.data.surahs) {
    const engSurah = engMap.get(surah.number);
    for (const a of surah.ayahs) {
      ayahsToInsert.push({
        number: a.number,
        surahNumber: surah.number,
        numberInSurah: a.numberInSurah,
        arabic: a.text,
        translationEn: engSurah?.get(a.numberInSurah) ?? "",
        juzNumber: a.juz,
        pageNumber: a.page,
      });
    }
  }

  const BATCH = 500;
  for (let i = 0; i < ayahsToInsert.length; i += BATCH) {
    await db.insert(ayahsTable).values(ayahsToInsert.slice(i, i + BATCH)).onDuplicateKeyUpdate({ set: { number: ayahsTable.number } });
    logger.info(`Ayahs seeded: ${Math.min(i + BATCH, ayahsToInsert.length)}/${ayahsToInsert.length}`);
  }
  logger.info(`Quran seeding complete — ${ayahsToInsert.length} ayahs stored.`);
}

interface FawazahmedHadith {
  hadithnumber: number;
  text: string;
  grades: Array<{ grade: string; graded_by?: string }>;
  reference?: { book?: number; hadith?: number };
}
interface FawazahmedResponse {
  metadata: { name?: string; sections?: Record<string, string>; section_details?: Record<string, unknown> };
  hadiths: FawazahmedHadith[];
}

const SAHIH_SITTA: Array<{ id: string; engKey: string; araKey: string; minExpected: number }> = [
  { id: "bukhari",  engKey: "eng-bukhari",  araKey: "ara-bukhari",  minExpected: 7000 },
  { id: "muslim",   engKey: "eng-muslim",   araKey: "ara-muslim",   minExpected: 7000 },
  { id: "abudawud", engKey: "eng-abudawud", araKey: "ara-abudawud", minExpected: 5000 },
  { id: "tirmidhi", engKey: "eng-tirmidhi", araKey: "ara-tirmidhi", minExpected: 3500 },
  { id: "nasai",    engKey: "eng-nasai",    araKey: "ara-nasai",    minExpected: 5000 },
  { id: "ibnmajah", engKey: "eng-ibnmajah", araKey: "ara-ibnmajah", minExpected: 4000 },
];

export async function seedHadithsFromAPI(): Promise<void> {
  logger.info("Starting Sahih Sitta (6 collections) seeding from fawazahmed0 CDN...");
  const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

  for (const col of SAHIH_SITTA) {
    const [{ cnt }] = await db
      .select({ cnt: sql<number>`cast(count(*) as integer)` })
      .from(hadithsTable)
      .where(eq(hadithsTable.collectionId, col.id));

    if (cnt >= col.minExpected) {
      logger.info(`${col.id}: already fully seeded (${cnt} hadiths), skipping.`);
      continue;
    }

    logger.info(`${col.id}: current=${cnt}, fetching English + Arabic from CDN...`);

    // Delete any partial data to avoid duplicates
    await db.delete(hadithsTable).where(eq(hadithsTable.collectionId, col.id));
    await db.delete(hadithBooksTable).where(eq(hadithBooksTable.collectionId, col.id));

    const [engRes, araRes] = await Promise.all([
      fetch(`${CDN}/${col.engKey}.min.json`),
      fetch(`${CDN}/${col.araKey}.min.json`),
    ]);

    if (!engRes.ok || !araRes.ok) {
      logger.error(`Failed to fetch ${col.id}: eng=${engRes.status} ara=${araRes.status}`);
      continue;
    }

    const engData = (await engRes.json()) as FawazahmedResponse;
    const araData = (await araRes.json()) as FawazahmedResponse;

    // Arabic text lookup by hadithnumber
    const araMap = new Map<number, string>();
    for (const h of araData.hadiths) araMap.set(h.hadithnumber, h.text);

    // Section names from metadata
    const sections = engData.metadata?.sections ?? {};

    // Collect unique books and their hadith counts
    const bookMap = new Map<number, { name: string; count: number }>();
    for (const h of engData.hadiths) {
      const bk = Math.floor(h.reference?.book ?? 1);
      if (!bookMap.has(bk)) bookMap.set(bk, { name: sections[String(bk)] ?? `Book ${bk}`, count: 0 });
      bookMap.get(bk)!.count++;
    }

    // Insert books
    const bookRows = Array.from(bookMap.entries()).map(([bookNumber, info]) => ({
      collectionId: col.id,
      bookNumber,
      nameEnglish: info.name,
      nameArabic: info.name,
      totalHadiths: info.count,
    }));
    if (bookRows.length > 0) {
      for (let i = 0; i < bookRows.length; i += 100) {
        await db.insert(hadithBooksTable).values(bookRows.slice(i, i + 100));
      }
      logger.info(`${col.id}: inserted ${bookRows.length} books.`);
    }

    // Insert hadiths in batches of 200
    const colName = engData.metadata?.name ?? col.id;
    const hadithRows: (typeof hadithsTable.$inferInsert)[] = engData.hadiths.map(h => ({
      collectionId: col.id,
      bookNumber: Math.floor(h.reference?.book ?? 1),
      hadithNumber: Math.floor(h.hadithnumber),
      arabic: araMap.get(h.hadithnumber) ?? "",
      english: h.text,
      grade: h.grades?.[0]?.grade ?? undefined,
      reference: `${colName} ${h.hadithnumber}`,
    }));

    const BATCH = 200;
    for (let i = 0; i < hadithRows.length; i += BATCH) {
      await db.insert(hadithsTable).values(hadithRows.slice(i, i + BATCH));
      if ((i % 2000 === 0 && i > 0) || i + BATCH >= hadithRows.length) {
        logger.info(`${col.id}: ${Math.min(i + BATCH, hadithRows.length)}/${hadithRows.length} hadiths`);
      }
    }

    logger.info(`${col.id}: seeding complete (${hadithRows.length} hadiths).`);
  }

  logger.info("Sahih Sitta — all 6 collections seeded successfully.");
}

export async function seedIslamicContent() {
  logger.info("Checking if seed data is needed...");

  // Hadith Collections
  const existingCollections = await db.select().from(hadithCollectionsTable).limit(1);
  if (existingCollections.length === 0) {
    logger.info("Seeding hadith collections...");
    await db.insert(hadithCollectionsTable).values([
      { id: "bukhari", name: "Sahih al-Bukhari", nameArabic: "صحيح البخاري", author: "Imam al-Bukhari", totalHadiths: 7563, description: "The most authentic book of hadith, compiled by Imam Muhammad ibn Ismail al-Bukhari." },
      { id: "muslim", name: "Sahih Muslim", nameArabic: "صحيح مسلم", author: "Imam Muslim", totalHadiths: 7500, description: "The second most authentic collection of hadith, compiled by Imam Muslim ibn al-Hajjaj." },
      { id: "abudawud", name: "Sunan Abu Dawud", nameArabic: "سنن أبي داود", author: "Abu Dawud al-Sijistani", totalHadiths: 5274, description: "One of the six major hadith collections (Kutub al-Sittah)." },
      { id: "tirmidhi", name: "Jami at-Tirmidhi", nameArabic: "جامع الترمذي", author: "Imam al-Tirmidhi", totalHadiths: 3956, description: "A comprehensive collection of hadith compiled by Imam Tirmidhi." },
      { id: "nasai", name: "Sunan an-Nasa'i", nameArabic: "سنن النسائي", author: "Imam an-Nasa'i", totalHadiths: 5761, description: "One of the six canonical hadith collections." },
      { id: "ibnmajah", name: "Sunan Ibn Majah", nameArabic: "سنن ابن ماجه", author: "Ibn Majah", totalHadiths: 4341, description: "The sixth of the six canonical hadith collections." },
    ]).onConflictDoNothing();

    await db.insert(hadithBooksTable).values([
      { collectionId: "bukhari", bookNumber: 1, nameArabic: "كتاب الوحي", nameEnglish: "Book of Revelation", totalHadiths: 7 },
      { collectionId: "bukhari", bookNumber: 2, nameArabic: "كتاب الإيمان", nameEnglish: "Book of Belief", totalHadiths: 45 },
      { collectionId: "bukhari", bookNumber: 3, nameArabic: "كتاب العلم", nameEnglish: "Book of Knowledge", totalHadiths: 76 },
      { collectionId: "bukhari", bookNumber: 4, nameArabic: "كتاب الوضوء", nameEnglish: "Book of Ablutions (Wudu)", totalHadiths: 113 },
      { collectionId: "bukhari", bookNumber: 5, nameArabic: "كتاب الغسل", nameEnglish: "Book of Bathing (Ghusl)", totalHadiths: 45 },
      { collectionId: "muslim", bookNumber: 1, nameArabic: "كتاب الإيمان", nameEnglish: "Book of Faith", totalHadiths: 432 },
      { collectionId: "muslim", bookNumber: 2, nameArabic: "كتاب الطهارة", nameEnglish: "Book of Purification", totalHadiths: 100 },
      { collectionId: "abudawud", bookNumber: 1, nameArabic: "كتاب الطهارة", nameEnglish: "Book of Purification", totalHadiths: 390 },
      { collectionId: "tirmidhi", bookNumber: 1, nameArabic: "كتاب الطهارة", nameEnglish: "Book of Purification", totalHadiths: 148 },
    ]).onConflictDoNothing();

    await db.insert(hadithsTable).values([
      {
        collectionId: "bukhari", bookNumber: 1, hadithNumber: 1,
        arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ",
        english: "Actions are judged by intentions, and every person will be rewarded according to what they intended. Whoever migrated for the sake of Allah and His Messenger, then his migration was for Allah and His Messenger.",
        narrator: "Umar ibn al-Khattab (RA)",
        grade: "Sahih",
        reference: "Sahih al-Bukhari 1",
      },
      {
        collectionId: "bukhari", bookNumber: 2, hadithNumber: 8,
        arabic: "بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَالْحَجِّ، وَصَوْمِ رَمَضَانَ",
        english: "Islam has been built upon five things: testifying that there is no god but Allah and that Muhammad is the Messenger of Allah, establishing the prayer, paying the zakat, fasting in Ramadan, and making the pilgrimage to the House.",
        narrator: "Ibn Umar (RA)",
        grade: "Sahih",
        reference: "Sahih al-Bukhari 8",
      },
      {
        collectionId: "bukhari", bookNumber: 2, hadithNumber: 11,
        arabic: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
        english: "None of you will have faith until he loves for his brother what he loves for himself.",
        narrator: "Anas ibn Malik (RA)",
        grade: "Sahih",
        reference: "Sahih al-Bukhari 13",
      },
      {
        collectionId: "bukhari", bookNumber: 3, hadithNumber: 1,
        arabic: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
        english: "Seeking knowledge is an obligation upon every Muslim.",
        narrator: "Anas ibn Malik (RA)",
        grade: "Sahih",
        reference: "Sunan Ibn Majah 224",
      },
      {
        collectionId: "muslim", bookNumber: 1, hadithNumber: 1,
        arabic: "الإِيمَانُ أَنْ تُؤْمِنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الآخِرِ وَتُؤْمِنَ بِالْقَدَرِ خَيْرِهِ وَشَرِّهِ",
        english: "Faith is to believe in Allah, His angels, His books, His messengers, the Last Day, and to believe in divine decree, both its good and its evil.",
        narrator: "Umar ibn al-Khattab (RA)",
        grade: "Sahih",
        reference: "Sahih Muslim 8a",
      },
      {
        collectionId: "muslim", bookNumber: 1, hadithNumber: 2,
        arabic: "الإِسْلاَمُ أَنْ تَشْهَدَ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ وَتُقِيمَ الصَّلاَةَ وَتُؤْتِيَ الزَّكَاةَ وَتَصُومَ رَمَضَانَ وَتَحُجَّ الْبَيْتَ",
        english: "Islam is to testify that there is no god but Allah and that Muhammad is the Messenger of Allah, to establish the prayer, to give zakat, to fast in Ramadan, and to make pilgrimage to the House.",
        narrator: "Umar ibn al-Khattab (RA)",
        grade: "Sahih",
        reference: "Sahih Muslim 8b",
      },
    ]).onConflictDoNothing();
  }

  // Book Categories & Books
  const existingCats = await db.select().from(bookCategoriesTable).limit(1);
    // Ensure Asma al-Rijal and authentic categories exist
    await db.insert(bookCategoriesTable).values([
      { name: "Aqeedah (Theology)", nameArabic: "العقيدة", sortOrder: 1 },
      { name: "Fiqh (Islamic Law)", nameArabic: "الفقه", sortOrder: 2 },
      { name: "Tafsir (Quranic Commentary)", nameArabic: "التفسير", sortOrder: 3 },
      { name: "Seerah (Biography of the Prophet)", nameArabic: "السيرة النبوية", sortOrder: 4 },
      { name: "Islamic Ethics & Spirituality", nameArabic: "الأخلاق والتزكية", sortOrder: 5 },
      { name: "Hadith Sciences", nameArabic: "علوم الحديث", sortOrder: 6 },
      { name: "Asma al-Rijal (Biographical Evaluation)", nameArabic: "أسماء الرجال وعلم الجرح والتعديل", sortOrder: 7 },
    ]).onConflictDoNothing();
    const cats = await db.select().from(bookCategoriesTable).orderBy(bookCategoriesTable.sortOrder);
    const [aqeedah, fiqh, tafsir, seerah, ethics, hadithCat, asmaRijal] = cats;

    await db.insert(booksTable).values([
      {
        title: "Al-Aqeedah al-Tahawiyyah",
        titleArabic: "العقيدة الطحاوية",
        author: "Imam Abu Ja'far al-Tahawi",
        authorArabic: "الإمام أبو جعفر الطحاويؒ",
        categoryId: aqeedah.id,
        language: "ar",
        description: "The definitive consensus statement of orthodox Sunni creed (Ahl al-Sunnah wal-Jama'ah) according to the formulation of Imam Abu Hanifah, Abu Yusuf, and Muhammad al-Shaybani.",
        totalChapters: 10,
        isPublic: true,
        publishedYear: 933,
      },
      {
        title: "Seerat-ul-Mustafa ﷺ",
        titleArabic: "سیرت المصطفیٰ ﷺ",
        author: "Maulana Muhammad Idris Kandhlawi",
        authorArabic: "مولانا محمد ادریس کاندھلویؒ",
        categoryId: seerah.id,
        language: "ur",
        description: "The masterwork and definitive Urdu Seerah of Prophet Muhammad ﷺ authored by the eminent Hadith scholar of Darul Uloom Deoband, rooted purely in authentic narrations and refutation of modern deviations.",
        totalChapters: 30,
        isPublic: true,
        publishedYear: 1960,
      },
      {
        title: "Riyad as-Salihin",
        titleArabic: "رياض الصالحين",
        author: "Imam an-Nawawi",
        authorArabic: "الإمام النووي",
        categoryId: hadithCat.id,
        language: "ar",
        description: "Gardens of the Righteous — a comprehensive collection of authentic hadiths covering all aspects of Islamic life and character.",
        totalChapters: 372,
        isPublic: true,
        publishedYear: 1275,
      },
      {
        title: "Al-Fiqh al-Akbar",
        titleArabic: "الفقه الأكبر",
        author: "Imam Abu Hanifah",
        authorArabic: "الإمام الأعظم أبو حنيفة النعمانؒ",
        categoryId: aqeedah.id,
        language: "ar",
        description: "The foundational text on Islamic theology and belief directly ascribed to Imam al-A'zam Abu Hanifah Nu'man ibn Thabit.",
        totalChapters: 10,
        isPublic: true,
        publishedYear: 767,
      },
    ]).onConflictDoNothing();
    const bks = await db.select().from(booksTable).limit(4);
    const [book1, book2, book3, book4] = bks;

    await db.insert(bookChaptersTable).values([
      { bookId: book1.id, chapterNumber: 1, title: "Foundations of Creed", titleArabic: "بيان عقيدة أهل السنة والجماعة", content: "نقول في توحيد الله معتقدين بتوفيق الله: إن الله واحد لا شريك له، ولا شيء مثله، ولا شيء يعجزه، ولا إله غيره. قديم بلا ابتداء، دائم بلا انتهاء، لا يفنى ولا يبيد، ولا يكون إلا ما يريد.\n\nWe say concerning the divine oneness of Allah, believing by Allah's granting of success: Indeed Allah is One, having no partner, nothing is like unto Him, nothing overcomes Him, and there is no deity besides Him." },
      { bookId: book1.id, chapterNumber: 2, title: "Prophethood of Muhammad ﷺ", titleArabic: "نبوة سيدنا محمد ﷺ", content: "وأن محمدا عبده المصطفى، ونبيه المجتبى، ورسوله المرتضى، وأنه خاتم الأنبياء، وإمام الأتقياء، وسيد المرسلين، وحبيب رب العالمين، وكل دعوى النبوة بعده فغي وهوى.\n\nAnd indeed Muhammad ﷺ is His chosen servant, His selected Prophet, His approved Messenger, and the Seal of the Prophets (Khatam an-Nabiyyin)." },
      { bookId: book2.id, chapterNumber: 1, title: "نسب مبارک اور ولادت باسعادت", titleArabic: "النسب الشريف والميلاد الميمون", content: "حضور اقدس سید المرسلین، خاتم النبیین، جناب محمد رسول اللہ ﷺ کا نسب عالی تمام روئے زمین کے انسانوں میں سب سے زیادہ اشرف، اکرم اور طاہر ہے۔ آپ ﷺ بنو ہاشم میں مکہ مکرمہ کے مقدس شہر میں عام الفیل میں ربیع الاول کے مبارک مہینے میں دوشنبہ کے روز اس دار فانی میں تشریف لائے۔\n\nمولانا ادریس کاندھلویؒ نے مستند روایات اور احادیث صحیحہ کی روشنی میں واضح فرمایا کہ آپ ﷺ کے نور نبوت سے شام کے محلات روشن ہو گئے۔" },
      { bookId: book3.id, chapterNumber: 1, title: "Sincerity and Intention", titleArabic: "باب الإخلاص وإحضار النية", content: "Allah the Almighty says: 'And they were not commanded except to worship Allah, being sincere to Him in religion.' (98:5)\n\nThe Prophet (PBUH) said: 'Actions are by their intentions, and for everyone is what they intended. Whoever migrated for the sake of Allah and His Messenger, then his migration was for Allah and His Messenger.' (Al-Bukhari and Muslim)" },
      { bookId: book4.id, chapterNumber: 1, title: "أصول الإيمان والتوحيد", titleArabic: "باب أصول الإيمان", content: "أصل التوحيد وما يصح الاعتقاد عليه يجب أن يقول: آمنت بالله وملائكته وكتبه ورسله والبعث بعد الموت والقدر خيره وشره من الله تعالى والحساب والميزان والجنة والنار، والكل حق.\n\nThe foundation of Tawheed and authentic belief requires affirming belief in Allah, His Angels, His Books, His Messengers, Resurrection after death, and Divine Decree." },
    ]).onConflictDoNothing();
  }

  // Extended Books: Tafseer, Hadith, Fiqh etc. (added after initial seed)
  const allBooks = await db.select().from(booksTable);
  if (allBooks.length < 15) {
    logger.info("Seeding extended Islamic library...");
    const allCats = await db.select().from(bookCategoriesTable);
    const tafsirCat = allCats.find(c => c.name.includes("Tafsir"));
    const aqeedahCat = allCats.find(c => c.name.includes("Aqeedah"));
    const fiqhCat = allCats.find(c => c.name.includes("Fiqh"));
    const seerahCat = allCats.find(c => c.name.includes("Seerah"));
    const ethicsCat = allCats.find(c => c.name.includes("Ethics"));
    const hadithCatRec = allCats.find(c => c.name.includes("Hadith"));

    const asmaRijalCat = allCats.find(c => c.name.includes("Asma") || c.name.includes("الرجال")) ?? hadithCatRec;

    if (tafsirCat && aqeedahCat && fiqhCat && seerahCat && ethicsCat && hadithCatRec) {
      // First, purge any historically seeded non-compliant books
      const unwantedTitles = [
        "Tafhimul Quran",
        "Fi Zilal al-Quran (In the Shade of the Quran)",
        "Tafsir al-Baydawi (Anwar al-Tanzil)",
        "Tafsir as-Sa'di (Taysir al-Karim al-Rahman)",
        "The Sealed Nectar (Ar-Raheeq Al-Makhtum)",
        "Kitab al-Tawheed",
        "Al-Aqeedah al-Wasitiyyah",
      ];
      for (const unwanted of unwantedTitles) {
        await db.delete(booksTable).where(eq(booksTable.title, unwanted));
      }

      const newBooks = await db.insert(booksTable).values([
        // Authentic Deobandi & Classical Tafseer Books
        {
          title: "Ma'ariful Quran (Maulana Idris Kandhlawi)",
          titleArabic: "معارف القرآن لمولانا إدريس کاندھلوي",
          author: "Maulana Muhammad Idris Kandhlawi",
          authorArabic: "مولانا محمد ادريس کاندھلویؒ (شیخ الحدیث دار العلوم دیوبند)",
          categoryId: tafsirCat.id,
          language: "ur",
          description: "جامع اور وقیع تفسیرِ قرآن، جس میں علم کلام، دلائلِ حنفیہ، تصوف اور عقائدِ اہل سنت و جماعت کا شاندار اور مفصل بیان موجود ہے۔",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1968,
        },
        {
          title: "Anwar al-Bayan fi Kashf Asrar al-Quran",
          titleArabic: "أنوار البيان في كشف أسرار القرآن",
          author: "Maulana Ashiq Ilahi Bulandshahri",
          authorArabic: "مولانا محمد عاشق الٰہی بلند شہریؒ",
          categoryId: tafsirCat.id,
          language: "ur",
          description: "علمائے دیوبند کی معروف و مستند اردو تفسیر جو فہمِ قرآن، اصلاحِ احوال، اور فقہی و اخلاقی مسائل کی آسان اور محقق تفہیم پر مشتمل ہے۔",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1985,
        },
        {
          title: "Bayan al-Quran",
          titleArabic: "بيان القرآن لحكيم الأمة",
          author: "Hakim al-Ummat Maulana Ashraf Ali Thanwi",
          authorArabic: "حکیم الامت مولانا اشرف علی تھانویؒ",
          categoryId: tafsirCat.id,
          language: "ur",
          description: "حکیم الامت کی شاہکار تفسیر، جس میں قرآنی ربط، دقائقِ معانی، اور باطنی و ظاہری اصلاحات کا بحرِ زخار موجزن ہے۔",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1908,
        },
        {
          title: "Ahkam al-Quran (Zafar Ahmad Usmani & Idris Kandhlawi)",
          titleArabic: "أحكام القرآن للتهانوي وأعلام ديوبند",
          author: "Allama Zafar Ahmad Usmani & Maulana Idris Kandhlawi",
          authorArabic: "العلامة ظفر أحمد العثماني ومولانا إدريس الكاندھلويؒ",
          categoryId: tafsirCat.id,
          language: "ar",
          description: "قرآن حکیم کی آیاتِ احکام سے فقہ حنفی کے متقن و مدلل استنباط کا عظیم الشان عربی انسائیکلوپیڈیا۔",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1935,
        },
        {
          title: "Tafsir Ibn Kathir",
          titleArabic: "تفسير القرآن العظيم (ابن كثير)",
          author: "Imam Imad al-Din Ibn Kathir",
          authorArabic: "الحافظ عماد الدين ابن كثيرؒ",
          categoryId: tafsirCat.id,
          language: "ar",
          description: "تفسیر بالماثور کا سب سے مستند اور معتبر مرجع، جس میں احادیثِ نبویہ اور آثارِ صحابہ سے آیات کی مفصل شرح کی گئی ہے۔",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1370,
        },
        {
          title: "Tafsir al-Qurtubi (Al-Jami' li-Ahkam al-Quran)",
          titleArabic: "الجامع لأحكام القرآن للقرطبي",
          author: "Imam Abu Abdillah al-Qurtubi",
          authorArabic: "الإمام أبو عبد الله القرطبيؒ",
          categoryId: tafsirCat.id,
          language: "ar",
          description: "احکامِ قرآن، فقہی تقابل اور لغوی استنباط کا جامع اور مستند ترین کلاسیکی مرجع۔",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1273,
        },
        {
          title: "Tafsir al-Tabari (Jami al-Bayan)",
          titleArabic: "جامع البيان عن تأويل آي القرآن للطبري",
          author: "Imam Ibn Jarir al-Tabari",
          authorArabic: "الإمام ابن جرير الطبريؒ",
          categoryId: tafsirCat.id,
          language: "ar",
          description: "ام التفاسیر — صحابہ و تابعین کے مرویات و اسانید کا سب سے قدیم اور عظیم ذخیرہ۔",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 923,
        },

        // Authentic Classical & Deobandi Seerah Books
        {
          title: "Nashr-ut-Teeb fi Dhikr al-Nabi al-Habeeb ﷺ",
          titleArabic: "نشر الطيب في ذكر النبي الحبيب ﷺ",
          author: "Hakim al-Ummat Maulana Ashraf Ali Thanwi",
          authorArabic: "حکیم الامت مولانا اشرف علی تھانویؒ",
          categoryId: seerahCat.id,
          language: "ur",
          description: "حضور اقدس ﷺ کے میلادِ پاک، شمائل، خصائص، اور معجزات پر علمائے دیوبند کا معتمد اور پرنور تذکرہ۔",
          totalChapters: 35,
          isPublic: true,
          publishedYear: 1912,
        },
        {
          title: "Al-Khasa'is al-Kubra",
          titleArabic: "الخصائص الكبرى للسيوطي",
          author: "Imam Jalal al-Din al-Suyuti",
          authorArabic: "الإمام جلال الدين السيوطيؒ",
          categoryId: seerahCat.id,
          language: "ar",
          description: "سرورِ کائنات ﷺ کے معجزات، اختصاصات اور خصائصِ مبارکہ پر مستند احادیث کا عظیم الشان عربی ذخیرہ۔",
          totalChapters: 40,
          isPublic: true,
          publishedYear: 1505,
        },
        {
          title: "Seerah Ibn Hisham",
          titleArabic: "السيرة النبوية لابن هشام",
          author: "Abu Muhammad Abd al-Malik Ibn Hisham",
          authorArabic: "عبد الملك بن هشامؒ",
          categoryId: seerahCat.id,
          language: "ar",
          description: "تاریخِ اسلام میں سیرتِ طیبہ کا سب سے قدیم، اصلی اور معتمد ترین کلاسیکی مرجع۔",
          totalChapters: 45,
          isPublic: true,
          publishedYear: 833,
        },

        // Asma al-Rijal (علم الجرح والتعدیل وأصول الحدیث)
        {
          title: "Nasb al-Rayah li-Ahadith al-Hidayah",
          titleArabic: "نصب الراية لأحاديث الهداية للزيلعي",
          author: "Hafiz Jamal al-Din al-Zayla'i",
          authorArabic: "الحافظ جمال الدين الزيلعي الحنفيؒ",
          categoryId: asmaRijalCat.id,
          language: "ar",
          description: "تخریجِ احادیث، تحقیقِ اسناد اور ائمہ رجال کی آراء کا شاہکار انسائیکلوپیڈیا، جس پر جملہ محدثین و محققین کا اعتماد ہے۔",
          totalChapters: 25,
          isPublic: true,
          publishedYear: 1360,
        },
        {
          title: "Tahdhib al-Tahdhib",
          titleArabic: "تهذيب التهذيب لابن حجر العسقلاني",
          author: "Hafiz Ibn Hajar al-Asqalani",
          authorArabic: "الحافظ ابن حجر العسقلانيؒ",
          categoryId: asmaRijalCat.id,
          language: "ar",
          description: "کتبِ ستہ کے رواۃ، محدثین، جرح و تعدیل اور ثقاہت و عدالت کا سب سے مفصل اور جامع ترین مرجع۔",
          totalChapters: 12,
          isPublic: true,
          publishedYear: 1448,
        },
        {
          title: "Athar al-Sunan (Allama Shawq Nimwi)",
          titleArabic: "آثار السنن للعلامة النيموي الحنفي",
          author: "Allama Zahir Ahsan Shawq Nimwi",
          authorArabic: "العلامة ظهير أحسن شوق نيمويؒ",
          categoryId: asmaRijalCat.id,
          language: "ar",
          description: "فقہ حنفی کے احادیث و آثار کی اسنادی تحقیق، جرح و تعدیل اور درایتی صحت کا معتمد ترین متن و حاشیہ۔",
          totalChapters: 15,
          isPublic: true,
          publishedYear: 1898,
        },

        // Hadith & Fiqh
        {
          title: "Bulugh al-Maram min Adillat al-Ahkam",
          titleArabic: "بلوغ المرام من أدلة الأحكام",
          author: "Hafiz Ibn Hajar al-Asqalani",
          authorArabic: "الحافظ ابن حجر العسقلانيؒ",
          categoryId: hadithCatRec.id,
          language: "ar",
          description: "فقہی احکام اور عبادات و معاملات سے متعلق احادیث کا متقن اور مستند مجموعہ مع تخریج و حکم۔",
          totalChapters: 16,
          isPublic: true,
          publishedYear: 1430,
        },
        {
          title: "Mishkat al-Masabih",
          titleArabic: "مشكاة المصابيح للتبريزي",
          author: "Al-Khatib at-Tabrizi",
          authorArabic: "الخطيب التبريزيؒ",
          categoryId: hadithCatRec.id,
          language: "ar",
          description: "مدارسِ اسلامیہ اور درسِ نظامی کا منتخب و مقبول ترین جامع احادیث کا نصاب۔",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1340,
        },
        {
          title: "Al-Arba'een al-Nawawiyyah (40 Hadith)",
          titleArabic: "الأربعون النووية",
          author: "Imam Yahya ibn Sharaf an-Nawawi",
          authorArabic: "الإمام النوويؒ",
          categoryId: hadithCatRec.id,
          language: "ar",
          description: "دینِ اسلام کے کلی قواعد و اصول پر مشتمل چھیالیس بنیادی اور جامع احادیثِ نبویہ۔",
          totalChapters: 5,
          isPublic: true,
          publishedYear: 1283,
        },
        {
          title: "Ihya Ulum al-Din",
          titleArabic: "إحياء علوم الدين للغزالي",
          author: "Hujjat al-Islam Imam al-Ghazali",
          authorArabic: "حجة الإسلام الإمام أبو حامد الغزاليؒ",
          categoryId: ethicsCat.id,
          language: "ar",
          description: "تزکیہ نفس، باطنی اصلاح اور معرفتِ الٰہی پر دنیائے اسلام کا بے مثل شاہکار۔",
          totalChapters: 40,
          isPublic: true,
          publishedYear: 1107,
        },
      ]);

      // Add sample chapters for key new books
      if (newBooks.length > 0) {
        const tafirIbnKathir = newBooks.find(b => b.title.includes("Ibn Kathir"));
        const arbaeen = newBooks.find(b => b.title.includes("Arba"));
        const ihya = newBooks.find(b => b.title.includes("Ihya"));
        const bulugh = newBooks.find(b => b.title.includes("Bulugh"));

        const chaptersToInsert = [];

        if (tafirIbnKathir) {
          chaptersToInsert.push(
            { bookId: tafirIbnKathir.id, chapterNumber: 1, title: "Surah Al-Fatihah", titleArabic: "تفسير سورة الفاتحة", content: "Al-Fatihah consists of seven verses. It is called Al-Fatihah (The Opening) because it opens the Book of Allah.\n\nIbn Abi Hatim narrated that the Prophet (PBUH) said: 'Al-Fatihah is the greatest surah in the Quran.'\n\nAllah divides the prayer between Himself and His servant in two halves:\n- 'All praise is for Allah, Lord of the worlds' — this is for Allah\n- 'The Especially Merciful' — this is for Allah\n- 'Sovereign of the Day of Recompense' — this is for Allah\n- 'It is You we worship and You we ask for help' — this is shared\n- 'Guide us to the straight path' — this is for the servant\n\nAl-Fatihah includes all the meanings of the Quran: the oneness of Allah, promises of reward, warnings, legal rulings, and stories of the prophets." },
            { bookId: tafirIbnKathir.id, chapterNumber: 2, title: "Surah Al-Baqarah: Introduction", titleArabic: "تفسير مطلع سورة البقرة", content: "Al-Baqarah is the longest surah in the Quran with 286 verses. It is Medinan. It contains Ayat al-Kursi (2:255) — the greatest verse in the Quran — as well as the last two verses of Surah al-Baqarah which are a special gift to this Ummah.\n\nThe Prophet (PBUH) said: 'Do not make your houses like graves. Verily, the shaytan flees from a house in which Surah al-Baqarah is recited.' (Muslim)\n\nThe name Al-Baqarah (The Cow) refers to the story of the Israelites who were commanded to slaughter a cow (2:67–73).\n\nMajor themes: Guidance for believers; stories of Bani Israel; laws of fasting, Hajj, marriage, divorce, business; direction of prayer (qiblah) changed to Makkah; the beginning of jihad rulings." },
          );
        }

        if (arbaeen) {
          chaptersToInsert.push(
            { bookId: arbaeen.id, chapterNumber: 1, title: "Hadiths 1-10: Foundations of Intention and Religion", content: "**Hadith 1 — Actions by Intentions**\nNarrated by Umar ibn al-Khattab (RA): The Messenger of Allah (PBUH) said: 'Actions are judged by their intentions, and for every person is what they intended. Whoever emigrated for the sake of Allah and His Messenger, then his emigration was for Allah and His Messenger. Whoever emigrated to gain some worldly benefit or to marry a woman, then his emigration was for whatever he emigrated for.' [Bukhari & Muslim]\n\nThis hadith is foundational — scholars have said it is one-third of all Islamic knowledge.\n\n**Hadith 2 — Islam, Iman, and Ihsan**\nNarrated by Umar (RA): Jibreel asked the Prophet (PBUH) about Islam, Iman, and Ihsan. The Prophet said: 'Islam is to testify that there is no deity worthy of worship but Allah and that Muhammad is the Messenger of Allah, to establish the prayers, to pay the zakat, to fast in Ramadan, and to make the pilgrimage if you are able.' Iman is to believe in Allah, His angels, His books, His messengers, the Last Day, and divine decree. Ihsan is to worship Allah as if you see Him, for even if you do not see Him, He surely sees you.' [Muslim]\n\n**Hadith 5 — Innovations are Rejected**\nNarrated by Aisha (RA): The Messenger of Allah (PBUH) said: 'Whoever innovates something in this matter of ours [Islam] that is not part of it will have it rejected.' [Bukhari & Muslim]" },
            { bookId: arbaeen.id, chapterNumber: 2, title: "Hadiths 11-20: Rights of People and Ethics", content: "**Hadith 12 — Leaving What Does Not Concern You**\nThe Prophet (PBUH) said: 'Part of the perfection of someone's Islam is his leaving alone what does not concern him.' [Tirmidhi — Hasan]\n\nThis is a comprehensive principle: avoid wasting time and energy on matters that have no benefit for you in this life or the next.\n\n**Hadith 13 — Love for Your Brother What You Love for Yourself**\n'None of you will have faith until he loves for his brother what he loves for himself.' [Bukhari & Muslim]\n\n**Hadith 15 — Whoever Believes in Allah Should Speak Good or Remain Silent**\n'Whoever believes in Allah and the Last Day should speak good or remain silent. Whoever believes in Allah and the Last Day should be generous to his neighbor. Whoever believes in Allah and the Last Day should honor his guest.' [Bukhari & Muslim]\n\n**Hadith 18 — Fear Allah Wherever You Are**\nMu'adh ibn Jabal (RA) reported that the Prophet (PBUH) said: 'Fear Allah wherever you are, follow up a bad deed with a good one and it will wipe it out, and treat people with good manners.' [Tirmidhi — Hasan]" },
          );
        }

        if (ihya) {
          chaptersToInsert.push(
            { bookId: ihya.id, chapterNumber: 1, title: "The Book of Knowledge (Kitab al-Ilm)", titleArabic: "كتاب العلم", content: "Praise be to Allah who has singled out the scholars for distinction and made them the inheritors of the prophets. He has set them apart from all other people and made them witnesses over mankind.\n\nKnowledge ('ilm) is divided into:\n1. **Fard 'Ayn** — Obligatory on every individual Muslim: knowing the articles of faith, the pillars of Islam, how to purify oneself and pray\n2. **Fard Kifayah** — Obligatory on the community collectively: medicine, mathematics, jurisprudence, and other sciences needed for society\n\nThe Messenger of Allah (PBUH) said: 'Seeking knowledge is an obligation upon every Muslim.' And: 'Whoever travels a path in search of knowledge, Allah will make easy for him a path to Paradise.'\n\nThe virtues of knowledge are innumerable. The scholar ('alim) is better than the worshipper ('abid) as the moon is better than all the stars. The ink of the scholar is weighed against the blood of the martyr on the Day of Resurrection." },
            { bookId: ihya.id, chapterNumber: 2, title: "The Book of the Foundations of Belief (Qawa'id al-Aqaid)", titleArabic: "كتاب قواعد العقائد", content: "The foundation of faith is the knowledge of the Creator — His existence, oneness, power, will, knowledge, and all His divine attributes.\n\nAllah is One, without partner. He is Pre-eternal (Qadim), without beginning. He is Ever-Lasting (Baqi), without end. He is not a body, not a substance, not a form. He is not limited by directions or places. Nothing resembles Him, and He resembles nothing.\n\nThe heart must be purified of all qualities that lead it astray: showing-off (riya), arrogance (kibr), envy (hasad), covetousness (hirs). These diseases of the heart prevent the light of faith from shining within.\n\nIslamic spirituality (tasawwuf) is the science of purifying the heart. The Prophet (PBUH) came to teach three things: recitation of the Quran, purification of the soul (tazkiyah), and wisdom (hikmah)." },
          );
        }

        if (bulugh) {
          chaptersToInsert.push(
            { bookId: bulugh.id, chapterNumber: 1, title: "Book of Purification (Kitab al-Taharah)", titleArabic: "كتاب الطهارة", content: "**Hadith 1**: Abu Hurayrah (RA) reported that the Messenger of Allah (PBUH) said: 'The key to prayer is purification (taharah), its beginning is takbir (saying Allahu Akbar), and its ending is taslim (saying as-salamu alaykum).' [Reported by the five — Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah, Ahmad — graded Sahih by Ibn Hibban]\n\n**Hadith 2**: Abu Hurayrah (RA) reported that the Messenger of Allah (PBUH) said: 'Were it not that I fear burdening my community, I would have commanded them to use the siwak (toothstick) for every prayer.' [Agreed upon (Bukhari & Muslim)]\n\n**Hadith 3**: Abu Malik al-Ashari (RA) reported that the Messenger of Allah (PBUH) said: 'Purity (taharah) is half of faith. Alhamdulillah fills the scale. SubhanAllah and Alhamdulillah together fill — or one of them fills — what is between the heavens and the earth. Prayer (salah) is a light. Charity (sadaqah) is a proof. Patience (sabr) is an illumination. The Quran is a proof for or against you. Every person goes out in the morning and trades his soul — either freeing it or destroying it.' [Muslim]" },
            { bookId: bulugh.id, chapterNumber: 2, title: "Book of Prayer (Kitab as-Salah)", titleArabic: "كتاب الصلاة", content: "**Hadith 168**: Ibn Umar (RA) narrated that the Prophet (PBUH) said: 'Prayer is obligatory five times each day and night.' [Abu Dawud and Nasa'i — Sahih]\n\n**Hadith 178**: Jabir (RA) reported that the Prophet (PBUH) said: 'Between a man and disbelief and polytheism is the abandonment of prayer.' [Muslim]\n\n**Hadith 183**: Ibn Mas'ud (RA) asked the Prophet (PBUH): 'Which deed is most beloved to Allah?' He said: 'Prayer at its proper time.' He was then asked: 'Then what?' He said: 'Honoring one's parents.' Then again: 'Then what?' He said: 'Jihad in the path of Allah.' [Agreed upon]\n\n**Hadith 195**: Abu Hurayrah (RA) reported that the Messenger of Allah (PBUH) said: 'Do you think that if there was a river at the door of one of you in which he bathed five times a day, would any filth remain on him?' They said: 'No filth would remain.' He said: 'That is the likeness of the five daily prayers with which Allah wipes away sins.' [Agreed upon]" },
          );
        }

        if (chaptersToInsert.length > 0) {
          await db.insert(bookChaptersTable).values(chaptersToInsert).onConflictDoNothing();
        }
      }
    }
  }

  // Also seed more hadith collections if missing (including Hanafi dalail collections)
  const allCollections = await db.select().from(hadithCollectionsTable);
  if (allCollections.length < 22) {
    logger.info("Seeding extended 22+ hadith collections (Hanafi Daleel, Classical Sunan & Masanid)...");
    await db.insert(hadithCollectionsTable).values([
      // Existing Muwatta'ayn and Tahawi
      { id: "muwatta", name: "Muwatta Imam Malik (Yahya)", nameArabic: "موطأ الإمام مالك (رواية يحيى الليثي)", author: "Imam Malik ibn Anas", totalHadiths: 1720, description: "The earliest surviving major collection of hadith, compiled by the founder of the Maliki school. Considered highly authentic by scholars." },
      { id: "muwatta-muhammad", name: "Muwatta Imam Muhammad (Hanafi)", nameArabic: "موطأ الإمام محمد بن الحسن الشيباني", author: "Imam Muhammad al-Shaybani", totalHadiths: 1005, description: "Muwatta narrated by the leading student of Imam Abu Hanifah, containing authoritative legal commentary, Hanafi jurisprudence, and comparison with Ahl al-Madinah." },
      { id: "tahawi", name: "Sharh Ma'ani al-Athar", nameArabic: "شرح معاني الآثار للإمام الطحاوي", author: "Imam Abu Ja'far al-Tahawi", totalHadiths: 7300, description: "The monumental encyclopedic hadith compendium establishing the evidential foundation (Dala'il) of the Hanafi school of jurisprudence through rigorous isnad and dirayah analysis." },
      { id: "darimi", name: "Sunan al-Darimi", nameArabic: "سنن الدارمي", author: "Imam al-Darimi", totalHadiths: 3500, description: "A major hadith collection arranged by legal topics, compiled by Abd Allah ibn Abd al-Rahman al-Darimi." },

      // Additional 12 Classical & Hanafi-Foundational Hadith Collections
      { id: "musnad-ahmad", name: "Musnad Ahmad ibn Hanbal", nameArabic: "مسند الإمام أحمد بن حنبل", author: "Imam Ahmad ibn Hanbal", totalHadiths: 27647, description: "The largest and most comprehensive classical Musnad, collecting over 27,000 narrations arranged by Companion chains." },
      { id: "musannaf-ibn-abi-shaybah", name: "Al-Musannaf li-Ibn Abi Shaybah", nameArabic: "المصنف لابن أبي شيبة", author: "Imam Ibn Abi Shaybah", totalHadiths: 37943, description: "The preeminent classical encyclopedic compendium of Marfu hadiths, Mawquf reports of Companions, and Maqtu verdicts of Tabi'in, central to Hanafi jurisprudence." },
      { id: "musannaf-abdur-razzaq", name: "Al-Musannaf li-Abd al-Razzaq", nameArabic: "المصنف لعبد الرزاق الصنعاني", author: "Imam Abd al-Razzaq al-San'ani", totalHadiths: 21033, description: "One of the earliest comprehensive Hadith compilations, containing essential fiqh narrations from Ibn Jurayj, Ma'mar, and early authorities." },
      { id: "mustadrak-hakim", name: "Al-Mustadrak 'ala al-Sahihayn", nameArabic: "المستدرك على الصحيحين للحاكم", author: "Al-Hakim al-Nishapuri", totalHadiths: 9045, description: "A major hadith collection documenting narrations meeting the criteria of Bukhari and Muslim that were not included in their primary works." },
      { id: "sunan-bayhaqi", name: "Al-Sunan al-Kubra lil-Bayhaqi", nameArabic: "السنن الكبرى للبيهقي", author: "Imam Abu Bakr al-Bayhaqi", totalHadiths: 21812, description: "The definitive compendium of legal hadith evidences arranged according to chapters of jurisprudence." },
      { id: "kitab-al-athar-abu-yusuf", name: "Kitab al-Athar li-Abi Yusuf", nameArabic: "كتاب الآثار للإمام أبي يوسف", author: "Imam Qadi Abu Yusuf", totalHadiths: 1090, description: "The direct hadith transmissions of Imam Abu Hanifah recorded by his greatest student, Chief Justice Abu Yusuf." },
      { id: "kitab-al-athar-shaybani", name: "Kitab al-Athar lil-Shaybani", nameArabic: "كتاب الآثار لمحمد بن الحسن الشيباني", author: "Imam Muhammad al-Shaybani", totalHadiths: 970, description: "The primary source of Hanafi hadith traditions directly related by Imam Muhammad from Imam al-A'zam Abu Hanifah." },
      { id: "mushkil-al-athar", name: "Sharh Mushkil al-Athar", nameArabic: "شرح مشكل الآثار للطحاوي", author: "Imam Abu Ja'far al-Tahawi", totalHadiths: 6000, description: "Tahawi's deep analytical reconciliation of apparent discrepancies and difficult texts in hadith literature." },
      { id: "tabarani-kabir", name: "Al-Mu'jam al-Kabir lil-Tabarani", nameArabic: "المعجم الكبير للطبراني", author: "Imam Al-Tabarani", totalHadiths: 25000, description: "The monumental biographical hadith compendium of Tabarani arranged alphabetically by the Sahabah." },
      { id: "musnad-abi-yala", name: "Musnad Abi Ya'la al-Mawsili", nameArabic: "مسند أبي يعلى الموصلي", author: "Imam Abu Ya'la al-Mawsili", totalHadiths: 7555, description: "A highly esteemed classical Musnad renowned for high chains of narration and fiqh traditions." },
      { id: "musnad-al-bazzar", name: "Musnad al-Bazzar (Al-Bahr al-Zakhkhar)", nameArabic: "مسند البزار (البحر الزخار)", author: "Imam Abu Bakr al-Bazzar", totalHadiths: 10000, description: "Distinguished Musnad famous for detailed 'Ilal (critical hadith defects) evaluations alongside narrations." },
      { id: "sunan-saeed-ibn-mansur", name: "Sunan Sa'id ibn Mansur", nameArabic: "سنن سعيد بن منصور", author: "Imam Sa'id ibn Mansur al-Khurdsani", totalHadiths: 3000, description: "A pivotal early 3rd-century hadith and tafsir collection preserving foundational legal traditions." },
    ]).onDuplicateKeyUpdate({ set: { id: sql`id` } });

    await db.insert(hadithBooksTable).values([
      { collectionId: "muwatta", bookNumber: 1, nameArabic: "كتاب الطهارة", nameEnglish: "Book of Purification", totalHadiths: 131 },
      { collectionId: "muwatta", bookNumber: 2, nameArabic: "كتاب الصلاة", nameEnglish: "Book of Prayer", totalHadiths: 90 },
      { collectionId: "muwatta", bookNumber: 3, nameArabic: "كتاب الزكاة", nameEnglish: "Book of Zakat", totalHadiths: 41 },
      { collectionId: "muwatta-muhammad", bookNumber: 1, nameArabic: "كتاب مواقيت الصلاة", nameEnglish: "Timings of Prayer", totalHadiths: 45 },
      { collectionId: "muwatta-muhammad", bookNumber: 2, nameArabic: "كتاب الوضوء والغسل", nameEnglish: "Purification & Wudu", totalHadiths: 60 },
      { collectionId: "tahawi", bookNumber: 1, nameArabic: "كتاب الطهارة وتطهير المياه", nameEnglish: "Purification & Waters", totalHadiths: 250 },
      { collectionId: "tahawi", bookNumber: 2, nameArabic: "كتاب الصلاة وأحكام الركوع والسجود", nameEnglish: "Prayer, Ruku & Sujud Rulings", totalHadiths: 420 },
      { collectionId: "darimi", bookNumber: 1, nameArabic: "كتاب المقدمة", nameEnglish: "Introduction", totalHadiths: 65 },
      { collectionId: "darimi", bookNumber: 2, nameArabic: "كتاب الطهارة", nameEnglish: "Book of Purification", totalHadiths: 101 },
      { collectionId: "musnad-ahmad", bookNumber: 1, nameArabic: "مسند العشرة المبشرين بالجنة", nameEnglish: "Musnad of the Ten Promised Paradise", totalHadiths: 300 },
      { collectionId: "musannaf-ibn-abi-shaybah", bookNumber: 1, nameArabic: "كتاب الطهارة وأحكام المياه", nameEnglish: "Purification and Water Rulings", totalHadiths: 450 },
      { collectionId: "musannaf-abdur-razzaq", bookNumber: 1, nameArabic: "كتاب الصلاة والإمامة", nameEnglish: "Prayer & Imamah", totalHadiths: 380 },
      { collectionId: "mustadrak-hakim", bookNumber: 1, nameArabic: "كتاب الإيمان ومعرفة التوحيد", nameEnglish: "Faith & Monotheism", totalHadiths: 210 },
      { collectionId: "sunan-bayhaqi", bookNumber: 1, nameArabic: "كتاب الطهارة وسنن الوضوء", nameEnglish: "Purification & Ablution Sunan", totalHadiths: 320 },
      { collectionId: "kitab-al-athar-abu-yusuf", bookNumber: 1, nameArabic: "أبواب الطهارة والصلاة", nameEnglish: "Chapters of Taharah & Salah", totalHadiths: 150 },
      { collectionId: "kitab-al-athar-shaybani", bookNumber: 1, nameArabic: "أبواب الصلاة وآثار الصحابة", nameEnglish: "Chapters of Salah & Companions", totalHadiths: 140 },
      { collectionId: "mushkil-al-athar", bookNumber: 1, nameArabic: "باب ما روي في أحكام النية", nameEnglish: "Narrations on Intentions", totalHadiths: 90 },
      { collectionId: "tabarani-kabir", bookNumber: 1, nameArabic: "مسند عبد الله بن مسعود رضي الله عنه", nameEnglish: "Musnad Abdullah ibn Mas'ud", totalHadiths: 250 },
      { collectionId: "musnad-abi-yala", bookNumber: 1, nameArabic: "مسند علي بن أبي طالب رضي الله عنه", nameEnglish: "Musnad Ali ibn Abi Talib", totalHadiths: 180 },
      { collectionId: "musnad-al-bazzar", bookNumber: 1, nameArabic: "مسند أبي بكر الصديق رضي الله عنه", nameEnglish: "Musnad Abu Bakr al-Siddiq", totalHadiths: 120 },
      { collectionId: "sunan-saeed-ibn-mansur", bookNumber: 1, nameArabic: "كتاب التفسير وفضائل القرآن", nameEnglish: "Tafsir & Virtues of Quran", totalHadiths: 160 },
    ]).onDuplicateKeyUpdate({ set: { bookNumber: sql`book_number` } });

    await db.insert(hadithsTable).values([
      {
        collectionId: "muwatta", bookNumber: 1, hadithNumber: 1,
        arabic: "إِنَّ الطَّهُورَ شَطْرُ الإِيمَانِ",
        english: "Cleanliness is half of faith. Alhamdulillah fills the scale...",
        narrator: "Abu Malik al-Ash'ari (RA)",
        grade: "Sahih",
        reference: "Muwatta Malik 1:1",
      },
      {
        collectionId: "muwatta", bookNumber: 2, hadithNumber: 1,
        arabic: "الصَّلاةُ عِمَادُ الدِّينِ مَنْ أَقَامَهَا فَقَدْ أَقَامَ الدِّينَ وَمَنْ هَدَمَهَا فَقَدْ هَدَمَ الدِّينَ",
        english: "Prayer is the pillar of the religion. Whoever establishes it has established the religion, and whoever destroys it has destroyed the religion.",
        narrator: "Transmitted from the Prophet (PBUH)",
        grade: "Hasan",
        reference: "Muwatta Malik 2:1",
      },
      {
        collectionId: "muwatta-muhammad", bookNumber: 1, hadithNumber: 1,
        arabic: "أَخْبَرَنَا مَالِكٌ، حَدَّثَنَا ابْنُ شِهَابٍ، عَنْ عَطَاءِ بْنِ يَزِيدَ، عَنْ أَبِي أَيُّوبَ الأَنْصَارِيِّ أَنَّ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ قَالَ: إِذَا أَتَيْتُمُ الْغَائِطَ فَلَا تَسْتَقْبِلُوا الْقِبْلَةَ وَلَا تَسْتَدْبِرُوهَا",
        english: "When you go to relieve yourselves, do not face the Qiblah nor turn your backs to it.",
        urdu: "جب تم رفع حاجت کے لیے جاؤ تو قبلہ کی طرف رخ نہ کرو اور نہ اس کی طرف پشت کرو۔ (موطأ امام محمد - قولِ امام ابو حنیفہ)",
        narrator: "Abu Ayyub al-Ansari (RA) / Imam Muhammad / Imam Abu Hanifah",
        grade: "Sahih",
        reference: "Muwatta Imam Muhammad 1:1",
      },
      {
        collectionId: "tahawi", bookNumber: 2, hadithNumber: 1,
        arabic: "حَدَّثَنَا مُحَمَّدُ بْنُ خُزَيْمَةَ، ثنا مُسْلِمُ بْنُ إِبْرَاهِيمَ، ثنا شُعْبَةُ، عَنْ أَبِي إِسْحَاقَ، عَنِ الأَسْوَدِ، عَنْ عَبْدِ اللَّهِ بْنِ مَسْعُودٍ رَضِيَ اللَّهُ عَنْهُ قَالَ: صَلَّيْتُ مَعَ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ وَأَبِي بَكْرٍ وَعُمَرَ فَلَمْ يَرْفَعُوا أَيْدِيَهُمْ إِلَّا فِي افْتِتَاحِ الصَّلَاةِ",
        english: "Abdullah ibn Mas'ud (RA) said: I prayed with the Messenger of Allah (PBUH), Abu Bakr, and Umar, and they did not raise their hands except at the opening takbir of prayer.",
        urdu: "حضرت عبد اللہ بن مسعود رضی اللہ عنہ نے فرمایا: میں نے رسول اللہ ﷺ، ابوبکر اور عمر رضی اللہ عنہما کے ساتھ نماز پڑھی، تو انہوں نے صرف نماز کے آغاز میں ہاتھ اٹھائے اور بعد میں ہاتھ نہیں اٹھائے۔ (شرح معانی الآثار للطحاوی - اصل دلیل احناف)",
        narrator: "Abdullah ibn Mas'ud (RA) -> Al-Aswad -> Abu Ishaq -> Shu'bah",
        grade: "Sahih (Dala'il al-Hanafiyyah)",
        reference: "Sharh Ma'ani al-Athar 2:1 (Tahawi 1328)",
      },
      {
        collectionId: "darimi", bookNumber: 1, hadithNumber: 1,
        arabic: "الْعِلْمُ إِمَامُ الْعَمَلِ وَالْعَمَلُ تَابِعُهُ",
        english: "Knowledge is the leader of action, and action follows it.",
        narrator: "Reported from scholars",
        grade: "Mawquf",
        reference: "Sunan al-Darimi 1:1",
      },
    ]).onDuplicateKeyUpdate({ set: { id: sql`id` } });
  }

  // Learning Paths
  const existingPaths = await db.select().from(learningPathsTable).limit(1);
  if (existingPaths.length === 0) {
    logger.info("Seeding learning paths...");
    await db.insert(learningPathsTable).values([
      { title: "Foundations of Islamic Faith", description: "A comprehensive introduction to the core beliefs of Islam — the six pillars of Iman, the five pillars of Islam, and the fundamentals of Aqeedah.", level: "beginner", topic: "Aqeedah", totalLessons: 8, estimatedHours: "12" },
      { title: "Quran Recitation & Tajweed", description: "Master the rules of Tajweed for proper Quran recitation. Learn makharij al-huroof, sifat, and apply them in practice.", level: "beginner", topic: "Quran", totalLessons: 10, estimatedHours: "15" },
      { title: "Fiqh of Prayer (Salah)", description: "A detailed study of the Islamic prayer — its conditions, pillars, obligations, and recommended acts.", level: "intermediate", topic: "Fiqh", totalLessons: 12, estimatedHours: "18" },
      { title: "Introduction to Hadith Sciences", description: "Learn the terminology and methodology of hadith criticism. Understand isnad, matn, and hadith classification.", level: "intermediate", topic: "Hadith", totalLessons: 10, estimatedHours: "20" },
      { title: "Seerah: Life of the Prophet", description: "A chronological study of the life of Prophet Muhammad (PBUH), from birth through the completion of the Islamic mission.", level: "beginner", topic: "Seerah", totalLessons: 15, estimatedHours: "25" },
    ]);
    const paths = await db.select().from(learningPathsTable).limit(5);

    await db.insert(lessonsTable).values([
      {
        pathId: paths[0].id, lessonNumber: 1, title: "The Meaning of Iman",
        content: "Iman (faith) in Islam has three components: belief in the heart (Tasdiq bil-Qalb), utterance on the tongue (Iqrar bil-Lisan), and action by the limbs (Amal bil-Jawarih).\n\nThe Prophet (PBUH) defined Iman in the famous Hadith of Jibreel: 'Iman is to believe in Allah, His angels, His books, His messengers, the Last Day, and to believe in divine decree — both its good and its evil.'\n\nThe Six Pillars of Iman:\n1. Belief in Allah (Tawheed) — He is One, with no partners or equals\n2. Belief in the Angels — created from light, obey Allah completely\n3. Belief in the Revealed Books — including the Torah, Psalms, Gospel, and Quran\n4. Belief in the Prophets — from Adam (AS) to Muhammad (PBUH)\n5. Belief in the Last Day — resurrection, judgment, paradise and hellfire\n6. Belief in Divine Decree (Qadar) — Allah's knowledge and will encompasses all things",
        estimatedMinutes: 45,
        references: JSON.stringify([
          { type: "hadith", sourceId: "muslim-1", label: "Hadith of Jibreel (Sahih Muslim 8)" },
          { type: "quran", sourceId: "2:285", label: "Al-Baqarah 2:285", text: "The Messenger has believed in what was revealed to him from his Lord, and so have the believers. All of them have believed in Allah and His angels and His books and His messengers." }
        ]),
      },
      {
        pathId: paths[0].id, lessonNumber: 2, title: "Tawheed: The Oneness of Allah",
        content: "Tawheed (توحيد) literally means 'making something one' or 'asserting the oneness' of something. In Islamic theology, it means affirming the absolute oneness of Allah in all respects.\n\nScholars have categorized Tawheed into three types:\n\n**1. Tawheed ar-Rububiyyah (Oneness of Lordship)**\nAffirming that Allah alone is the Lord, Creator, Sustainer, and Controller of all things. No one shares in His dominion or control.\n\n**2. Tawheed al-Uluhiyyah (Oneness of Worship)**\nDirecting all acts of worship exclusively to Allah. This is the core message of all prophets and messengers.\n\n**3. Tawheed al-Asma was-Sifat (Oneness of Names and Attributes)**\nAffirming all of Allah's perfect names and attributes as He has affirmed them for Himself, without distortion, denial, or comparison to creation.\n\nThe opposite of Tawheed is Shirk (associating partners with Allah), which is the gravest sin in Islam. Allah says: 'Verily, Allah does not forgive that partners are associated with Him, but He forgives whatever is less than that for whom He wills.' (4:48)",
        estimatedMinutes: 60,
        references: JSON.stringify([
          { type: "quran", sourceId: "112:1-4", label: "Surah Al-Ikhlas", text: "Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent." },
          { type: "quran", sourceId: "4:48", label: "An-Nisa 4:48" }
        ]),
      },
      {
        pathId: paths[0].id, lessonNumber: 3, title: "The Five Pillars of Islam",
        content: "The Five Pillars are the foundational acts of worship in Islam. They are:\n\n**1. Shahada (Declaration of Faith)**\n'Ash-hadu an la ilaha illallah wa ash-hadu anna Muhammadan rasulullah'\n'I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.'\n\n**2. Salah (Prayer)**\nFive daily prayers: Fajr, Dhuhr, Asr, Maghrib, and Isha. Each prayer is a direct conversation with Allah.\n\n**3. Zakah (Charity)**\nAn obligatory charity of 2.5% on savings held for one lunar year, distributed to the poor and needy.\n\n**4. Sawm (Fasting)**\nFasting during the month of Ramadan from dawn to sunset, abstaining from food, drink, and marital relations.\n\n**5. Hajj (Pilgrimage)**\nAn obligatory pilgrimage to Makkah once in a lifetime for those physically and financially capable.",
        estimatedMinutes: 50,
        references: JSON.stringify([
          { type: "hadith", sourceId: "bukhari-8", label: "Hadith of the Five Pillars (Sahih al-Bukhari 8)" }
        ]),
      },
      {
        pathId: paths[1].id, lessonNumber: 1, title: "Introduction to Tajweed",
        content: "Tajweed (تجويد) comes from the root word 'Jawwada' meaning 'to make well' or 'to improve'. In the context of Quran recitation, it refers to the set of rules governing the correct pronunciation of the letters and words of the Quran.\n\n**The Ruling on Tajweed**\nScholars unanimously agree that applying the rules of Tajweed is a religious obligation (fard 'ayn) upon every Muslim who recites the Quran. Allah says: 'And recite the Quran with measured recitation (tarteel).' (73:4)\n\n**Why Tajweed Matters**\n- Preserves the Quran as it was revealed\n- Prevents changes in meaning due to mispronunciation\n- Fulfills Allah's command to recite correctly\n- Shows reverence for the words of Allah\n\n**The Four Qualities of a Good Recitation**\n1. Tarteel — slow, deliberate recitation\n2. Hadr — rapid recitation while maintaining rules\n3. Tadweer — moderate speed\n4. Tahqeeq — very slow, careful recitation for learning",
        estimatedMinutes: 30,
        references: JSON.stringify([
          { type: "quran", sourceId: "73:4", label: "Al-Muzzammil 73:4", text: "And recite the Quran with measured recitation (tarteel)." }
        ]),
      },
    ]).onConflictDoNothing();
  }

  // Surahs — seed all 114
  const [{ surahCount }] = await db.select({ surahCount: sql<number>`cast(count(*) as integer)` }).from(surahsTable);
  if (surahCount < 114) {
    logger.info(`Seeding all 114 surah metadata (currently ${surahCount})...`);
    await db.insert(surahsTable).values([
      { number: 1, nameArabic: "الفاتحة", nameTransliteration: "Al-Fatihah", nameEnglish: "The Opening", totalAyahs: 7, revelationType: "Meccan", juzStart: 1 },
      { number: 2, nameArabic: "البقرة", nameTransliteration: "Al-Baqarah", nameEnglish: "The Cow", totalAyahs: 286, revelationType: "Medinan", juzStart: 1 },
      { number: 3, nameArabic: "آل عمران", nameTransliteration: "Ali 'Imran", nameEnglish: "Family of Imran", totalAyahs: 200, revelationType: "Medinan", juzStart: 3 },
      { number: 4, nameArabic: "النساء", nameTransliteration: "An-Nisa", nameEnglish: "The Women", totalAyahs: 176, revelationType: "Medinan", juzStart: 4 },
      { number: 5, nameArabic: "المائدة", nameTransliteration: "Al-Ma'idah", nameEnglish: "The Table Spread", totalAyahs: 120, revelationType: "Medinan", juzStart: 6 },
      { number: 6, nameArabic: "الأنعام", nameTransliteration: "Al-An'am", nameEnglish: "The Cattle", totalAyahs: 165, revelationType: "Meccan", juzStart: 7 },
      { number: 7, nameArabic: "الأعراف", nameTransliteration: "Al-A'raf", nameEnglish: "The Heights", totalAyahs: 206, revelationType: "Meccan", juzStart: 8 },
      { number: 8, nameArabic: "الأنفال", nameTransliteration: "Al-Anfal", nameEnglish: "The Spoils of War", totalAyahs: 75, revelationType: "Medinan", juzStart: 9 },
      { number: 9, nameArabic: "التوبة", nameTransliteration: "At-Tawbah", nameEnglish: "The Repentance", totalAyahs: 129, revelationType: "Medinan", juzStart: 10 },
      { number: 10, nameArabic: "يونس", nameTransliteration: "Yunus", nameEnglish: "Jonah", totalAyahs: 109, revelationType: "Meccan", juzStart: 11 },
      { number: 11, nameArabic: "هود", nameTransliteration: "Hud", nameEnglish: "Hud", totalAyahs: 123, revelationType: "Meccan", juzStart: 11 },
      { number: 12, nameArabic: "يوسف", nameTransliteration: "Yusuf", nameEnglish: "Joseph", totalAyahs: 111, revelationType: "Meccan", juzStart: 12 },
      { number: 13, nameArabic: "الرعد", nameTransliteration: "Ar-Ra'd", nameEnglish: "The Thunder", totalAyahs: 43, revelationType: "Medinan", juzStart: 13 },
      { number: 14, nameArabic: "إبراهيم", nameTransliteration: "Ibrahim", nameEnglish: "Abraham", totalAyahs: 52, revelationType: "Meccan", juzStart: 13 },
      { number: 15, nameArabic: "الحجر", nameTransliteration: "Al-Hijr", nameEnglish: "The Rocky Tract", totalAyahs: 99, revelationType: "Meccan", juzStart: 14 },
      { number: 16, nameArabic: "النحل", nameTransliteration: "An-Nahl", nameEnglish: "The Bee", totalAyahs: 128, revelationType: "Meccan", juzStart: 14 },
      { number: 17, nameArabic: "الإسراء", nameTransliteration: "Al-Isra", nameEnglish: "The Night Journey", totalAyahs: 111, revelationType: "Meccan", juzStart: 15 },
      { number: 18, nameArabic: "الكهف", nameTransliteration: "Al-Kahf", nameEnglish: "The Cave", totalAyahs: 110, revelationType: "Meccan", juzStart: 15 },
      { number: 19, nameArabic: "مريم", nameTransliteration: "Maryam", nameEnglish: "Mary", totalAyahs: 98, revelationType: "Meccan", juzStart: 16 },
      { number: 20, nameArabic: "طه", nameTransliteration: "Ta-Ha", nameEnglish: "Ta-Ha", totalAyahs: 135, revelationType: "Meccan", juzStart: 16 },
      { number: 21, nameArabic: "الأنبياء", nameTransliteration: "Al-Anbiya", nameEnglish: "The Prophets", totalAyahs: 112, revelationType: "Meccan", juzStart: 17 },
      { number: 22, nameArabic: "الحج", nameTransliteration: "Al-Hajj", nameEnglish: "The Pilgrimage", totalAyahs: 78, revelationType: "Medinan", juzStart: 17 },
      { number: 23, nameArabic: "المؤمنون", nameTransliteration: "Al-Mu'minun", nameEnglish: "The Believers", totalAyahs: 118, revelationType: "Meccan", juzStart: 18 },
      { number: 24, nameArabic: "النور", nameTransliteration: "An-Nur", nameEnglish: "The Light", totalAyahs: 64, revelationType: "Medinan", juzStart: 18 },
      { number: 25, nameArabic: "الفرقان", nameTransliteration: "Al-Furqan", nameEnglish: "The Criterion", totalAyahs: 77, revelationType: "Meccan", juzStart: 18 },
      { number: 26, nameArabic: "الشعراء", nameTransliteration: "Ash-Shu'ara", nameEnglish: "The Poets", totalAyahs: 227, revelationType: "Meccan", juzStart: 19 },
      { number: 27, nameArabic: "النمل", nameTransliteration: "An-Naml", nameEnglish: "The Ant", totalAyahs: 93, revelationType: "Meccan", juzStart: 19 },
      { number: 28, nameArabic: "القصص", nameTransliteration: "Al-Qasas", nameEnglish: "The Stories", totalAyahs: 88, revelationType: "Meccan", juzStart: 20 },
      { number: 29, nameArabic: "العنكبوت", nameTransliteration: "Al-'Ankabut", nameEnglish: "The Spider", totalAyahs: 69, revelationType: "Meccan", juzStart: 20 },
      { number: 30, nameArabic: "الروم", nameTransliteration: "Ar-Rum", nameEnglish: "The Romans", totalAyahs: 60, revelationType: "Meccan", juzStart: 21 },
      { number: 31, nameArabic: "لقمان", nameTransliteration: "Luqman", nameEnglish: "Luqman", totalAyahs: 34, revelationType: "Meccan", juzStart: 21 },
      { number: 32, nameArabic: "السجدة", nameTransliteration: "As-Sajdah", nameEnglish: "The Prostration", totalAyahs: 30, revelationType: "Meccan", juzStart: 21 },
      { number: 33, nameArabic: "الأحزاب", nameTransliteration: "Al-Ahzab", nameEnglish: "The Combined Forces", totalAyahs: 73, revelationType: "Medinan", juzStart: 21 },
      { number: 34, nameArabic: "سبأ", nameTransliteration: "Saba", nameEnglish: "Sheba", totalAyahs: 54, revelationType: "Meccan", juzStart: 22 },
      { number: 35, nameArabic: "فاطر", nameTransliteration: "Fatir", nameEnglish: "Originator", totalAyahs: 45, revelationType: "Meccan", juzStart: 22 },
      { number: 36, nameArabic: "يس", nameTransliteration: "Ya-Sin", nameEnglish: "Ya Sin", totalAyahs: 83, revelationType: "Meccan", juzStart: 22 },
      { number: 37, nameArabic: "الصافات", nameTransliteration: "As-Saffat", nameEnglish: "Those Ranged in Ranks", totalAyahs: 182, revelationType: "Meccan", juzStart: 23 },
      { number: 38, nameArabic: "ص", nameTransliteration: "Sad", nameEnglish: "The Letter Sad", totalAyahs: 88, revelationType: "Meccan", juzStart: 23 },
      { number: 39, nameArabic: "الزمر", nameTransliteration: "Az-Zumar", nameEnglish: "The Troops", totalAyahs: 75, revelationType: "Meccan", juzStart: 23 },
      { number: 40, nameArabic: "غافر", nameTransliteration: "Ghafir", nameEnglish: "The Forgiver", totalAyahs: 85, revelationType: "Meccan", juzStart: 24 },
      { number: 41, nameArabic: "فصلت", nameTransliteration: "Fussilat", nameEnglish: "Explained in Detail", totalAyahs: 54, revelationType: "Meccan", juzStart: 24 },
      { number: 42, nameArabic: "الشورى", nameTransliteration: "Ash-Shuraa", nameEnglish: "The Consultation", totalAyahs: 53, revelationType: "Meccan", juzStart: 25 },
      { number: 43, nameArabic: "الزخرف", nameTransliteration: "Az-Zukhruf", nameEnglish: "The Ornaments of Gold", totalAyahs: 89, revelationType: "Meccan", juzStart: 25 },
      { number: 44, nameArabic: "الدخان", nameTransliteration: "Ad-Dukhan", nameEnglish: "The Smoke", totalAyahs: 59, revelationType: "Meccan", juzStart: 25 },
      { number: 45, nameArabic: "الجاثية", nameTransliteration: "Al-Jathiyah", nameEnglish: "The Crouching", totalAyahs: 37, revelationType: "Meccan", juzStart: 25 },
      { number: 46, nameArabic: "الأحقاف", nameTransliteration: "Al-Ahqaf", nameEnglish: "The Wind-Curved Sandhills", totalAyahs: 35, revelationType: "Meccan", juzStart: 26 },
      { number: 47, nameArabic: "محمد", nameTransliteration: "Muhammad", nameEnglish: "Muhammad", totalAyahs: 38, revelationType: "Medinan", juzStart: 26 },
      { number: 48, nameArabic: "الفتح", nameTransliteration: "Al-Fath", nameEnglish: "The Victory", totalAyahs: 29, revelationType: "Medinan", juzStart: 26 },
      { number: 49, nameArabic: "الحجرات", nameTransliteration: "Al-Hujurat", nameEnglish: "The Rooms", totalAyahs: 18, revelationType: "Medinan", juzStart: 26 },
      { number: 50, nameArabic: "ق", nameTransliteration: "Qaf", nameEnglish: "The Letter Qaf", totalAyahs: 45, revelationType: "Meccan", juzStart: 26 },
      { number: 51, nameArabic: "الذاريات", nameTransliteration: "Adh-Dhariyat", nameEnglish: "The Winnowing Winds", totalAyahs: 60, revelationType: "Meccan", juzStart: 26 },
      { number: 52, nameArabic: "الطور", nameTransliteration: "At-Tur", nameEnglish: "The Mount", totalAyahs: 49, revelationType: "Meccan", juzStart: 27 },
      { number: 53, nameArabic: "النجم", nameTransliteration: "An-Najm", nameEnglish: "The Star", totalAyahs: 62, revelationType: "Meccan", juzStart: 27 },
      { number: 54, nameArabic: "القمر", nameTransliteration: "Al-Qamar", nameEnglish: "The Moon", totalAyahs: 55, revelationType: "Meccan", juzStart: 27 },
      { number: 55, nameArabic: "الرحمن", nameTransliteration: "Ar-Rahman", nameEnglish: "The Beneficent", totalAyahs: 78, revelationType: "Medinan", juzStart: 27 },
      { number: 56, nameArabic: "الواقعة", nameTransliteration: "Al-Waqi'ah", nameEnglish: "The Inevitable", totalAyahs: 96, revelationType: "Meccan", juzStart: 27 },
      { number: 57, nameArabic: "الحديد", nameTransliteration: "Al-Hadid", nameEnglish: "The Iron", totalAyahs: 29, revelationType: "Medinan", juzStart: 27 },
      { number: 58, nameArabic: "المجادلة", nameTransliteration: "Al-Mujadila", nameEnglish: "The Pleading Woman", totalAyahs: 22, revelationType: "Medinan", juzStart: 28 },
      { number: 59, nameArabic: "الحشر", nameTransliteration: "Al-Hashr", nameEnglish: "The Exile", totalAyahs: 24, revelationType: "Medinan", juzStart: 28 },
      { number: 60, nameArabic: "الممتحنة", nameTransliteration: "Al-Mumtahanah", nameEnglish: "She That Is to Be Examined", totalAyahs: 13, revelationType: "Medinan", juzStart: 28 },
      { number: 61, nameArabic: "الصف", nameTransliteration: "As-Saf", nameEnglish: "The Ranks", totalAyahs: 14, revelationType: "Medinan", juzStart: 28 },
      { number: 62, nameArabic: "الجمعة", nameTransliteration: "Al-Jumu'ah", nameEnglish: "Friday", totalAyahs: 11, revelationType: "Medinan", juzStart: 28 },
      { number: 63, nameArabic: "المنافقون", nameTransliteration: "Al-Munafiqun", nameEnglish: "The Hypocrites", totalAyahs: 11, revelationType: "Medinan", juzStart: 28 },
      { number: 64, nameArabic: "التغابن", nameTransliteration: "At-Taghabun", nameEnglish: "Mutual Disillusion", totalAyahs: 18, revelationType: "Medinan", juzStart: 28 },
      { number: 65, nameArabic: "الطلاق", nameTransliteration: "At-Talaq", nameEnglish: "Divorce", totalAyahs: 12, revelationType: "Medinan", juzStart: 28 },
      { number: 66, nameArabic: "التحريم", nameTransliteration: "At-Tahrim", nameEnglish: "The Prohibition", totalAyahs: 12, revelationType: "Medinan", juzStart: 28 },
      { number: 67, nameArabic: "الملك", nameTransliteration: "Al-Mulk", nameEnglish: "The Sovereignty", totalAyahs: 30, revelationType: "Meccan", juzStart: 29 },
      { number: 68, nameArabic: "القلم", nameTransliteration: "Al-Qalam", nameEnglish: "The Pen", totalAyahs: 52, revelationType: "Meccan", juzStart: 29 },
      { number: 69, nameArabic: "الحاقة", nameTransliteration: "Al-Haqqah", nameEnglish: "The Reality", totalAyahs: 52, revelationType: "Meccan", juzStart: 29 },
      { number: 70, nameArabic: "المعارج", nameTransliteration: "Al-Ma'arij", nameEnglish: "The Ascending Stairways", totalAyahs: 44, revelationType: "Meccan", juzStart: 29 },
      { number: 71, nameArabic: "نوح", nameTransliteration: "Nuh", nameEnglish: "Noah", totalAyahs: 28, revelationType: "Meccan", juzStart: 29 },
      { number: 72, nameArabic: "الجن", nameTransliteration: "Al-Jinn", nameEnglish: "The Jinn", totalAyahs: 28, revelationType: "Meccan", juzStart: 29 },
      { number: 73, nameArabic: "المزمل", nameTransliteration: "Al-Muzzammil", nameEnglish: "The Enshrouded One", totalAyahs: 20, revelationType: "Meccan", juzStart: 29 },
      { number: 74, nameArabic: "المدثر", nameTransliteration: "Al-Muddaththir", nameEnglish: "The Cloaked One", totalAyahs: 56, revelationType: "Meccan", juzStart: 29 },
      { number: 75, nameArabic: "القيامة", nameTransliteration: "Al-Qiyamah", nameEnglish: "The Resurrection", totalAyahs: 40, revelationType: "Meccan", juzStart: 29 },
      { number: 76, nameArabic: "الإنسان", nameTransliteration: "Al-Insan", nameEnglish: "Man", totalAyahs: 31, revelationType: "Medinan", juzStart: 29 },
      { number: 77, nameArabic: "المرسلات", nameTransliteration: "Al-Mursalat", nameEnglish: "The Emissaries", totalAyahs: 50, revelationType: "Meccan", juzStart: 29 },
      { number: 78, nameArabic: "النبأ", nameTransliteration: "An-Naba", nameEnglish: "The Announcement", totalAyahs: 40, revelationType: "Meccan", juzStart: 30 },
      { number: 79, nameArabic: "النازعات", nameTransliteration: "An-Nazi'at", nameEnglish: "Those Who Drag Forth", totalAyahs: 46, revelationType: "Meccan", juzStart: 30 },
      { number: 80, nameArabic: "عبس", nameTransliteration: "Abasa", nameEnglish: "He Frowned", totalAyahs: 42, revelationType: "Meccan", juzStart: 30 },
      { number: 81, nameArabic: "التكوير", nameTransliteration: "At-Takwir", nameEnglish: "The Overthrowing", totalAyahs: 29, revelationType: "Meccan", juzStart: 30 },
      { number: 82, nameArabic: "الإنفطار", nameTransliteration: "Al-Infitar", nameEnglish: "The Cleaving", totalAyahs: 19, revelationType: "Meccan", juzStart: 30 },
      { number: 83, nameArabic: "المطففين", nameTransliteration: "Al-Mutaffifin", nameEnglish: "The Defrauding", totalAyahs: 36, revelationType: "Meccan", juzStart: 30 },
      { number: 84, nameArabic: "الإنشقاق", nameTransliteration: "Al-Inshiqaq", nameEnglish: "The Sundering", totalAyahs: 25, revelationType: "Meccan", juzStart: 30 },
      { number: 85, nameArabic: "البروج", nameTransliteration: "Al-Buruj", nameEnglish: "The Mansions of the Stars", totalAyahs: 22, revelationType: "Meccan", juzStart: 30 },
      { number: 86, nameArabic: "الطارق", nameTransliteration: "At-Tariq", nameEnglish: "The Nightcomer", totalAyahs: 17, revelationType: "Meccan", juzStart: 30 },
      { number: 87, nameArabic: "الأعلى", nameTransliteration: "Al-A'la", nameEnglish: "The Most High", totalAyahs: 19, revelationType: "Meccan", juzStart: 30 },
      { number: 88, nameArabic: "الغاشية", nameTransliteration: "Al-Ghashiyah", nameEnglish: "The Overwhelming", totalAyahs: 26, revelationType: "Meccan", juzStart: 30 },
      { number: 89, nameArabic: "الفجر", nameTransliteration: "Al-Fajr", nameEnglish: "The Dawn", totalAyahs: 30, revelationType: "Meccan", juzStart: 30 },
      { number: 90, nameArabic: "البلد", nameTransliteration: "Al-Balad", nameEnglish: "The City", totalAyahs: 20, revelationType: "Meccan", juzStart: 30 },
      { number: 91, nameArabic: "الشمس", nameTransliteration: "Ash-Shams", nameEnglish: "The Sun", totalAyahs: 15, revelationType: "Meccan", juzStart: 30 },
      { number: 92, nameArabic: "الليل", nameTransliteration: "Al-Layl", nameEnglish: "The Night", totalAyahs: 21, revelationType: "Meccan", juzStart: 30 },
      { number: 93, nameArabic: "الضحى", nameTransliteration: "Ad-Duha", nameEnglish: "The Morning Hours", totalAyahs: 11, revelationType: "Meccan", juzStart: 30 },
      { number: 94, nameArabic: "الشرح", nameTransliteration: "Ash-Sharh", nameEnglish: "The Relief", totalAyahs: 8, revelationType: "Meccan", juzStart: 30 },
      { number: 95, nameArabic: "التين", nameTransliteration: "At-Tin", nameEnglish: "The Fig", totalAyahs: 8, revelationType: "Meccan", juzStart: 30 },
      { number: 96, nameArabic: "العلق", nameTransliteration: "Al-Alaq", nameEnglish: "The Clot", totalAyahs: 19, revelationType: "Meccan", juzStart: 30 },
      { number: 97, nameArabic: "القدر", nameTransliteration: "Al-Qadr", nameEnglish: "The Power", totalAyahs: 5, revelationType: "Meccan", juzStart: 30 },
      { number: 98, nameArabic: "البينة", nameTransliteration: "Al-Bayyinah", nameEnglish: "The Clear Proof", totalAyahs: 8, revelationType: "Medinan", juzStart: 30 },
      { number: 99, nameArabic: "الزلزلة", nameTransliteration: "Az-Zalzalah", nameEnglish: "The Earthquake", totalAyahs: 8, revelationType: "Medinan", juzStart: 30 },
      { number: 100, nameArabic: "العاديات", nameTransliteration: "Al-Adiyat", nameEnglish: "The Chargers", totalAyahs: 11, revelationType: "Meccan", juzStart: 30 },
      { number: 101, nameArabic: "القارعة", nameTransliteration: "Al-Qari'ah", nameEnglish: "The Calamity", totalAyahs: 11, revelationType: "Meccan", juzStart: 30 },
      { number: 102, nameArabic: "التكاثر", nameTransliteration: "At-Takathur", nameEnglish: "The Rivalry in World Increase", totalAyahs: 8, revelationType: "Meccan", juzStart: 30 },
      { number: 103, nameArabic: "العصر", nameTransliteration: "Al-Asr", nameEnglish: "The Declining Day", totalAyahs: 3, revelationType: "Meccan", juzStart: 30 },
      { number: 104, nameArabic: "الهمزة", nameTransliteration: "Al-Humazah", nameEnglish: "The Traducer", totalAyahs: 9, revelationType: "Meccan", juzStart: 30 },
      { number: 105, nameArabic: "الفيل", nameTransliteration: "Al-Fil", nameEnglish: "The Elephant", totalAyahs: 5, revelationType: "Meccan", juzStart: 30 },
      { number: 106, nameArabic: "قريش", nameTransliteration: "Quraysh", nameEnglish: "Quraysh", totalAyahs: 4, revelationType: "Meccan", juzStart: 30 },
      { number: 107, nameArabic: "الماعون", nameTransliteration: "Al-Ma'un", nameEnglish: "The Small Kindnesses", totalAyahs: 7, revelationType: "Meccan", juzStart: 30 },
      { number: 108, nameArabic: "الكوثر", nameTransliteration: "Al-Kawthar", nameEnglish: "The Abundance", totalAyahs: 3, revelationType: "Meccan", juzStart: 30 },
      { number: 109, nameArabic: "الكافرون", nameTransliteration: "Al-Kafirun", nameEnglish: "The Disbelievers", totalAyahs: 6, revelationType: "Meccan", juzStart: 30 },
      { number: 110, nameArabic: "النصر", nameTransliteration: "An-Nasr", nameEnglish: "The Divine Support", totalAyahs: 3, revelationType: "Medinan", juzStart: 30 },
      { number: 111, nameArabic: "المسد", nameTransliteration: "Al-Masad", nameEnglish: "The Palm Fibre", totalAyahs: 5, revelationType: "Meccan", juzStart: 30 },
      { number: 112, nameArabic: "الإخلاص", nameTransliteration: "Al-Ikhlas", nameEnglish: "The Sincerity", totalAyahs: 4, revelationType: "Meccan", juzStart: 30 },
      { number: 113, nameArabic: "الفلق", nameTransliteration: "Al-Falaq", nameEnglish: "The Daybreak", totalAyahs: 5, revelationType: "Meccan", juzStart: 30 },
      { number: 114, nameArabic: "الناس", nameTransliteration: "An-Nas", nameEnglish: "Mankind", totalAyahs: 6, revelationType: "Meccan", juzStart: 30 },
    ]).onConflictDoNothing();
    logger.info("All 114 surah metadata seeded.");
  }

  // Ayahs — fetch from alquran.cloud if DB has fewer than 6000
  const [{ ayahCount }] = await db.select({ ayahCount: sql<number>`cast(count(*) as integer)` }).from(ayahsTable);
  if (ayahCount < 6000) {
    logger.info(`Ayahs in DB: ${ayahCount}. Starting background Quran text seeding from alquran.cloud...`);
    seedQuranAyahsFromAPI().catch(e => logger.error({ err: e }, "Quran ayah background seeding failed"));
  } else {
    logger.info(`Quran ayahs already seeded: ${ayahCount}`);
  }

  // Sahih Sitta — fetch from fawazahmed0 CDN if fewer than 10000 total hadiths
  const [{ hadithCount }] = await db.select({ hadithCount: sql<number>`cast(count(*) as integer)` }).from(hadithsTable);
  if (hadithCount < 10000) {
    logger.info(`Hadiths in DB: ${hadithCount}. Starting Sahih Sitta background seeding...`);
    seedHadithsFromAPI().catch(e => logger.error({ err: e }, "Hadith background seeding failed"));
  } else {
    logger.info(`Hadiths already seeded: ${hadithCount}`);
  }

  // Admin user
  const existingAdmin = await db.select().from(usersTable).limit(1);
  if (existingAdmin.length === 0) {
    logger.info("Creating default admin user...");
    const passwordHash = await bcrypt.hash("admin123456", 12);
    await db.insert(usersTable).values({
      name: "Admin",
      email: "admin@islamicresearch.app",
      passwordHash,
      role: "admin",
      language: "en",
      theme: "dark",
    });
    logger.info("Default admin created: admin@islamicresearch.app / admin123456");
  }

  // Duas (Hisnul Muslim)
  const existingDuas = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(duasTable);
  if (existingDuas[0]?.count === 0) {
    logger.info("Seeding initial Duas (Hisnul Muslim)...");
    await db.insert(duasTable).values([
      {
        category: "morning",
        title: "Morning Remembrance (صبح کے اذکار)",
        titleArabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        transliteration: "Asbahna wa-asbahal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadeer.",
        translation: "We have entered the morning and the kingdom belongs to Allah, and all praise is due to Allah. None has the right to be worshipped except Allah alone, without partner.",
        translationUr: "ہم نے صبح کی اور تمام بادشاہی اللہ کی ہو گئی، اور تمام تعریفیں اللہ ہی کے لیے ہیں۔ اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں، اسی کی بادشاہی ہے اور اسی کے لیے تعریف ہے، اور وہ ہر چیز پر قادر ہے۔",
        reference: "Sahih Muslim 2723",
        benefits: "صبح و شام حفاظت اور توحید کے اقرار کے لیے مسنون دعا۔",
        sortOrder: 1,
      },
      {
        category: "evening",
        title: "Evening Remembrance (شام کے اذکار)",
        titleArabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",
        arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ",
        transliteration: "Amsayna wa-amsal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah.",
        translation: "We have reached the evening and the kingdom belongs to Allah. All praise is for Allah.",
        translationUr: "ہم نے شام کی اور تمام بادشاہی اللہ کے لیے ہو گئی، اور تمام تعریفیں اللہ ہی کے لیے ہیں۔",
        reference: "Sahih Muslim 2723",
        benefits: "شام کے وقت حفاظتِ الٰہی کی پناہ لینا۔",
        sortOrder: 2,
      },
      {
        category: "prayer",
        title: "Dua After Prayer (نماز کے بعد کی دعا)",
        titleArabic: "اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ",
        arabic: "اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ، تَبَارَكْتَ يَا ذَا الْجَلاَلِ وَالإِكْرَامِ",
        transliteration: "Allahumma antas-salamu wa minkas-salam, tabarakta ya dhal-jalali wal-ikram.",
        translation: "O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honor.",
        translationUr: "اے اللہ! تو سلامتی والا ہے اور تجھی سے سلامتی حاصل ہوتی ہے، تو بڑی برکت والا ہے اے عظمت اور بزرگی والے!",
        reference: "Sahih Muslim 592",
        benefits: "ہر فرض نماز کے سلام پھیرنے کے بعد پڑھنا مسنون ہے۔",
        sortOrder: 3,
      },
    ]).onConflictDoNothing();
  }

  // Fiqh Topics
  const existingFiqh = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(fiqhTopicsTable);
  if (existingFiqh[0]?.count === 0) {
    logger.info("Seeding comparative Fiqh topics...");
    await db.insert(fiqhTopicsTable).values([
      {
        category: "salah",
        title: "رفع الیدین نماز میں (Raf al-Yadayn in Salah)",
        titleArabic: "حكم رفع اليدين عند الركوع والرفع منه",
        summary: "تکبیر تحریمہ کے علاوہ رکوع میں جاتے اور رکوع سے اٹھتے وقت ہاتھ اٹھانے کا فقہی حکم۔",
        hanafiView: "صرف تکبیرِ تحریمہ کے وقت ہاتھ اٹھانا مسنون ہے۔ رکوع جاتے اور اٹھتے وقت رفع الیدین منسوخ یا غیر اولیٰ ہے۔ (دلائل: حدیث ابن مسعودؓ، مصنف ابن ابی شیبہ)",
        shafiiView: "تکبیر تحریمہ، رکوع جاتے وقت، اور رکوع سے سر اٹھاتے وقت رفع الیدین سنتِ مؤکدہ ہے۔ (دلائل: حدیث ابن عمرؓ، صحیح بخاری و مسلم)",
        malikiView: "جمہور مالکیہ کے نزدیک صرف تکبیر تحریمہ میں ہاتھ اٹھانا اولیٰ ہے، مدینہ کے عمل کی بنا پر۔",
        hanbaliView: "تکبیر تحریمہ، رکوع، اور رکوع سے اٹھتے وقت رفع الیدین مستحب ہے۔",
        dalil: "حدیث ابن عمر رضی اللہ عنہ (بخاری 735) و حدیث عبد اللہ بن مسعود رضی اللہ عنہ (ترمذی 257)",
        isPublished: true,
        sortOrder: 1,
      },
      {
        category: "zakat",
        title: "سونے چاندی اور نقدی کا نصاب (Nisab of Gold & Silver)",
        titleArabic: "نصاب الذهب والفضة والأوراق النقدية",
        summary: "زکوٰۃ فرض ہونے کے لیے نصاب کی مقدار اور چاندی بمقابلہ سونے کی قیمت کا معیار۔",
        hanafiView: "سونے کا نصاب ساڑھے سات تولے (87.48 گرام) اور چاندی کا ساڑھے باون تولے (612.36 گرام) ہے۔ موجودہ نقدی میں غریبوں کی مصلحت کے تحت چاندی کے نصاب کا اعتبار کیا جاتا ہے۔",
        shafiiView: "سونے اور چاندی کے نصاب علیحدہ ہیں، دونوں کو باہم نہیں ملایا جاتا الا یہ کہ دونوں اپنی اپنی حد کو پہنچیں۔",
        malikiView: "اگر نقد رقم سونے کے نصاب تک پہنچے تب بھی زکوٰۃ لازم ہے، مروجہ کرنسی کی بنیاد پر چاندی یا سونے میں سے جو فقراء کے حق میں بہتر ہو۔",
        hanbaliView: "نقد روپیہ چاندی اور سونے کے قائم مقام ہے اور دونوں میں سے جو کم قیمت ہو اس کا نصاب مانا جاتا ہے۔",
        dalil: "سنن ابی داؤد (1573) اور صحیح بخاری (1454)",
        isPublished: true,
        sortOrder: 2,
      },
    ]).onConflictDoNothing();
  }

  // Mosques
  const existingMosques = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(mosquesTable);
  if (existingMosques[0]?.count === 0) {
    logger.info("Seeding central Mosques...");
    await db.insert(mosquesTable).values([
      {
        name: "Faisal Mosque (فیصل مسجد)",
        arabicName: "مسجد الملك فيصل",
        city: "Islamabad",
        country: "Pakistan",
        address: "Shah Faisal Ave, E-8, Islamabad",
        latitude: "33.7297",
        longitude: "73.0372",
        capacity: 300000,
        fajrJamaat: "05:15",
        dhuhrJamaat: "13:30",
        asrJamaat: "17:00",
        maghribJamaat: "18:45",
        ishaJamaat: "20:30",
        jummahJamaat: "13:45",
        imamName: "Dr. Zia ur Rehman",
        verified: true,
      },
      {
        name: "Badshahi Mosque (بادشاہی مسجد)",
        arabicName: "مسجد بادشاهي",
        city: "Lahore",
        country: "Pakistan",
        address: "Walled City, Lahore, Punjab",
        latitude: "31.5881",
        longitude: "74.3094",
        capacity: 100000,
        fajrJamaat: "05:20",
        dhuhrJamaat: "13:30",
        asrJamaat: "17:15",
        maghribJamaat: "18:50",
        ishaJamaat: "20:30",
        jummahJamaat: "14:00",
        imamName: "Maulana Abdul Khabir Azad",
        verified: true,
      },
    ]).onConflictDoNothing();
  }

  logger.info("Seed check complete.");
}
