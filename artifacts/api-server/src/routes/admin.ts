import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, booksTable, bookCategoriesTable, bookChaptersTable,
  learningPathsTable, lessonsTable, notesTable, bookmarksTable, enrollmentsTable,
  surahsTable, ayahsTable, hadithCollectionsTable, hadithBooksTable, hadithsTable,
} from "@workspace/db";
import { eq, sql, gte } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { hashPassword } from "../lib/auth";
import { AdminCreateBookBody, AdminUpdateBookBody, AdminCreateLearningPathBody, AdminUpdateLearningPathBody, GetAdminUsersQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [[{ totalUsers }], [{ totalBooks }], [{ totalPaths }], [{ totalNotes }], [{ totalBookmarks }], [{ newUsers }], [{ totalEnrollments }], [{ activeToday }]] = await Promise.all([
    db.select({ totalUsers: sql<number>`count(*)` }).from(usersTable),
    db.select({ totalBooks: sql<number>`count(*)` }).from(booksTable),
    db.select({ totalPaths: sql<number>`count(*)` }).from(learningPathsTable),
    db.select({ totalNotes: sql<number>`count(*)` }).from(notesTable),
    db.select({ totalBookmarks: sql<number>`count(*)` }).from(bookmarksTable),
    db.select({ newUsers: sql<number>`count(*)` }).from(usersTable).where(gte(usersTable.createdAt, sevenDaysAgo)),
    db.select({ totalEnrollments: sql<number>`count(*)` }).from(enrollmentsTable),
    db.select({ activeToday: sql<number>`count(distinct ${usersTable.id})` }).from(usersTable).where(gte(usersTable.lastActiveAt, today)),
  ]);

  res.json({
    totalUsers: Number(totalUsers),
    activeUsersToday: Number(activeToday),
    totalBooks: Number(totalBooks),
    totalLearningPaths: Number(totalPaths),
    totalNotes: Number(totalNotes),
    totalBookmarks: Number(totalBookmarks),
    newUsersThisWeek: Number(newUsers),
    totalEnrollments: Number(totalEnrollments),
  });
});

router.get("/admin/users", requireAdmin, async (req, res) => {
  const parsed = GetAdminUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query" });
    return;
  }
  const { page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    language: usersTable.language,
    theme: usersTable.theme,
    avatarUrl: usersTable.avatarUrl,
    createdAt: usersTable.createdAt,
  }).from(usersTable).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const total = Number(count);
  res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
});

router.post("/admin/books", requireAdmin, async (req, res) => {
  const parsed = AdminCreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const insertResult = await db.insert(booksTable).values(parsed.data);
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, insertResult[0].insertId)).limit(1);
  res.status(201).json({ ...book, chapters: [] });
});

router.patch("/admin/books/:bookId", requireAdmin, async (req, res) => {
  const parsed = AdminUpdateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  await db.update(booksTable).set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(booksTable.id, req.params.bookId));
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, req.params.bookId)).limit(1);
  if (!book) {
    res.status(404).json({ message: "Book not found" });
    return;
  }
  res.json({ ...book, chapters: [] });
});

router.delete("/admin/books/:bookId", requireAdmin, async (req, res) => {
  await db.delete(booksTable).where(eq(booksTable.id, req.params.bookId));
  res.json({ message: "Book deleted" });
});

router.post("/admin/learning-paths", requireAdmin, async (req, res) => {
  const parsed = AdminCreateLearningPathBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const insertResult = await db.insert(learningPathsTable).values({ ...parsed.data, estimatedHours: String(parsed.data.estimatedHours) });
  const [path] = await db.select().from(learningPathsTable).where(eq(learningPathsTable.id, insertResult[0].insertId)).limit(1);
  res.status(201).json({ ...path, lessons: [] });
});

router.patch("/admin/learning-paths/:pathId", requireAdmin, async (req, res) => {
  const parsed = AdminUpdateLearningPathBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const updateData: Record<string, any> = { ...parsed.data };
  if (parsed.data.estimatedHours !== undefined) updateData.estimatedHours = String(parsed.data.estimatedHours);
  await db.update(learningPathsTable).set(updateData)
    .where(eq(learningPathsTable.id, req.params.pathId));
  const [path] = await db.select().from(learningPathsTable).where(eq(learningPathsTable.id, req.params.pathId)).limit(1);
  if (!path) {
    res.status(404).json({ message: "Learning path not found" });
    return;
  }
  res.json({ ...path, lessons: [] });
});

router.post("/admin/content/seed", requireAdmin, async (_req, res) => {
  await seedIslamicContent();
  res.json({ message: "Islamic content seeded successfully" });
});

async function seedIslamicContent() {
  // Seed Hadith Collections
  const existingCollections = await db.select().from(hadithCollectionsTable).limit(1);
  if (existingCollections.length === 0) {
    await db.insert(hadithCollectionsTable).values([
      { id: "bukhari", name: "Sahih al-Bukhari", nameArabic: "صحيح البخاري", author: "Imam al-Bukhari", totalHadiths: 7563, description: "The most authentic book of hadith" },
      { id: "muslim", name: "Sahih Muslim", nameArabic: "صحيح مسلم", author: "Imam Muslim", totalHadiths: 7500, description: "Second most authentic collection" },
      { id: "abudawud", name: "Sunan Abu Dawud", nameArabic: "سنن أبي داود", author: "Abu Dawud", totalHadiths: 5274 },
      { id: "tirmidhi", name: "Jami at-Tirmidhi", nameArabic: "جامع الترمذي", author: "Imam Tirmidhi", totalHadiths: 3956 },
      { id: "nasai", name: "Sunan an-Nasa'i", nameArabic: "سنن النسائي", author: "Imam an-Nasa'i", totalHadiths: 5761 },
      { id: "ibnmajah", name: "Sunan Ibn Majah", nameArabic: "سنن ابن ماجه", author: "Ibn Majah", totalHadiths: 4341 },
    ]).onDuplicateKeyUpdate({ set: { id: sql`id` } });

    await db.insert(hadithBooksTable).values([
      { collectionId: "bukhari", bookNumber: 1, nameArabic: "كتاب الوحي", nameEnglish: "Book of Revelation", totalHadiths: 7 },
      { collectionId: "bukhari", bookNumber: 2, nameArabic: "كتاب الإيمان", nameEnglish: "Book of Belief", totalHadiths: 45 },
      { collectionId: "bukhari", bookNumber: 3, nameArabic: "كتاب العلم", nameEnglish: "Book of Knowledge", totalHadiths: 76 },
      { collectionId: "muslim", bookNumber: 1, nameArabic: "كتاب الإيمان", nameEnglish: "Book of Faith", totalHadiths: 432 },
    ]);

    await db.insert(hadithsTable).values([
      {
        collectionId: "bukhari", bookNumber: 1, hadithNumber: 1,
        arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
        english: "Actions are judged by intentions, and every person will be rewarded according to what they intended.",
        narrator: "Umar ibn al-Khattab (RA)",
        grade: "Sahih",
        reference: "Sahih al-Bukhari 1",
      },
      {
        collectionId: "bukhari", bookNumber: 2, hadithNumber: 8,
        arabic: "بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ",
        english: "Islam has been built upon five things: testifying that there is no god but Allah and that Muhammad is the Messenger of Allah, establishing the prayer, paying the zakat, fasting in Ramadan, and making the pilgrimage to the House.",
        narrator: "Ibn Umar (RA)",
        grade: "Sahih",
        reference: "Sahih al-Bukhari 8",
      },
      {
        collectionId: "muslim", bookNumber: 1, hadithNumber: 1,
        arabic: "الإِيمَانُ أَنْ تُؤْمِنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ",
        english: "Faith is to believe in Allah, His angels, His books, His messengers, and the Last Day, and to believe in divine destiny, both the good and the evil thereof.",
        narrator: "Umar ibn al-Khattab (RA)",
        grade: "Sahih",
        reference: "Sahih Muslim 8",
      },
    ]);
  }

  // Seed Book Categories
  const existingCats = await db.select().from(bookCategoriesTable).limit(1);
  if (existingCats.length === 0) {
    await db.insert(bookCategoriesTable).values([
      { name: "Aqeedah (Theology)", nameArabic: "العقيدة", sortOrder: 1 },
      { name: "Fiqh (Islamic Law)", nameArabic: "الفقه", sortOrder: 2 },
      { name: "Tafsir (Quranic Commentary)", nameArabic: "التفسير", sortOrder: 3 },
      { name: "Seerah (Biography of the Prophet)", nameArabic: "السيرة النبوية", sortOrder: 4 },
      { name: "Islamic Ethics & Spirituality", nameArabic: "الأخلاق والتزكية", sortOrder: 5 },
      { name: "Hadith Sciences", nameArabic: "علوم الحديث", sortOrder: 6 },
    ]);
    const cats = await db.select().from(bookCategoriesTable).orderBy(bookCategoriesTable.sortOrder);
    const [aqeedah, fiqh, tafsir, seerah, ethics, hadithCat] = cats;

    await db.insert(booksTable).values([
      {
        title: "Kitab al-Tawheed",
        titleArabic: "كتاب التوحيد",
        author: "Muhammad ibn Abd al-Wahhab",
        authorArabic: "محمد بن عبد الوهاب",
        categoryId: aqeedah.id,
        language: "ar",
        description: "A foundational text on Islamic monotheism, explaining the oneness of Allah and the worship that is due to Him alone.",
        totalChapters: 66,
        isPublic: true,
        publishedYear: 1740,
      },
      {
        title: "The Sealed Nectar (Ar-Raheeq Al-Makhtum)",
        titleArabic: "الرحيق المختوم",
        author: "Safi-ur-Rahman al-Mubarakpuri",
        categoryId: seerah.id,
        language: "en",
        description: "Award-winning biography of Prophet Muhammad (PBUH), covering his life from birth to the completion of his mission.",
        totalChapters: 35,
        isPublic: true,
        publishedYear: 1979,
      },
      {
        title: "Riyad as-Salihin",
        titleArabic: "رياض الصالحين",
        author: "Imam an-Nawawi",
        authorArabic: "الإمام النووي",
        categoryId: hadithCat.id,
        language: "ar",
        description: "Gardens of the Righteous — a comprehensive collection of hadith covering all aspects of Islamic life.",
        totalChapters: 372,
        isPublic: true,
        publishedYear: 1275,
      },
    ]);
    const bks = await db.select().from(booksTable).limit(3);
    const [book1, book2, book3] = bks;

    await db.insert(bookChaptersTable).values([
      { bookId: book1.id, chapterNumber: 1, title: "The Excellence of Tawheed and What it Removes of Sin", titleArabic: "باب فضل التوحيد وما يكفر من الذنوب", content: "Allah the Almighty said: 'It is those who believe and confuse not their belief with wrong (worshipping others besides Allah) — for them is security and they are the rightly guided.' (6:82)\n\nThis verse indicates that whoever believes in Allah and does not mix their faith with shirk (polytheism) will achieve security and guidance. The Prophet (PBUH) clarified this verse when his companions asked about it, explaining that 'wrong' here means shirk." },
      { bookId: book2.id, chapterNumber: 1, title: "Background and Lineage", content: "Muhammad ibn Abdullah ibn Abd al-Muttalib ibn Hashim ibn Abd Manaf ibn Qusayy ibn Kilab...\n\nThe Prophet's lineage traces back to the most noble Arab tribes, connecting through Adnan to Ishmael (AS), the son of Abraham (AS). His family belonged to the clan of Banu Hashim, the most respected family of the Quraysh tribe in Makkah." },
      { bookId: book3.id, chapterNumber: 1, title: "Sincerity and Intention", titleArabic: "باب الإخلاص وإحضار النية", content: "The excellence of sincerity in all actions. Allah the Almighty says: 'And they were not commanded except to worship Allah, being sincere to Him in religion.' (98:5)\n\nThe Prophet (PBUH) said: 'Actions are by their intentions, and for everyone is what they intended.'" },
    ]);
  }

  // Seed Learning Paths
  const existingPaths = await db.select().from(learningPathsTable).limit(1);
  if (existingPaths.length === 0) {
    await db.insert(learningPathsTable).values([
      {
        title: "Foundations of Islamic Faith",
        description: "A comprehensive introduction to the core beliefs of Islam — the six pillars of Iman, the five pillars of Islam, and the fundamentals of Aqeedah.",
        level: "beginner",
        topic: "Aqeedah",
        totalLessons: 8,
        estimatedHours: "12",
      },
      {
        title: "Quran Recitation & Tajweed",
        description: "Master the rules of Tajweed for proper Quran recitation. Learn makharij al-huroof, sifat, and apply them in recitation practice.",
        level: "beginner",
        topic: "Quran",
        totalLessons: 10,
        estimatedHours: "15",
      },
      {
        title: "Fiqh of Prayer (Salah)",
        description: "A detailed study of the Islamic prayer — its conditions, pillars, obligations, and recommended acts. Based on classical fiqh sources.",
        level: "intermediate",
        topic: "Fiqh",
        totalLessons: 12,
        estimatedHours: "18",
      },
      {
        title: "Introduction to Hadith Sciences",
        description: "Learn the terminology and methodology of hadith criticism. Understand isnad, matn, and the classification of hadiths.",
        level: "intermediate",
        topic: "Hadith",
        totalLessons: 10,
        estimatedHours: "20",
      },
      {
        title: "Seerah: Life of the Prophet",
        description: "A chronological study of the life of Prophet Muhammad (PBUH), from birth through the completion of the Islamic mission.",
        level: "beginner",
        topic: "Seerah",
        totalLessons: 15,
        estimatedHours: "25",
      },
    ]);
    const paths = await db.select().from(learningPathsTable).limit(5);

    await db.insert(lessonsTable).values([
      {
        pathId: paths[0].id, lessonNumber: 1, title: "The Meaning of Iman",
        content: "Iman (faith) in Islam consists of belief in the heart, utterance on the tongue, and action by the limbs. The Prophet (PBUH) defined Iman as: 'Iman is to believe in Allah, His angels, His books, His messengers, the Last Day, and to believe in divine decree — both its good and its evil.'\n\nThe six pillars of Iman:\n1. Belief in Allah (Tawheed)\n2. Belief in the Angels\n3. Belief in the Revealed Books\n4. Belief in the Prophets and Messengers\n5. Belief in the Last Day\n6. Belief in Divine Decree (Qadar)",
        estimatedMinutes: 45,
        references: JSON.stringify([{ type: "hadith", sourceId: "muslim-1", label: "Hadith of Jibreel", text: "Iman is to believe in Allah..." }]),
      },
      {
        pathId: paths[0].id, lessonNumber: 2, title: "Tawheed: The Oneness of Allah",
        content: "Tawheed is the foundation of the Islamic faith. It means affirming the oneness of Allah in His Lordship (Rububiyyah), Divinity (Uluhiyyah), and Names and Attributes (Asma wa Sifat).\n\nTawheed ar-Rububiyyah: Affirming that Allah alone is the Lord, Creator, and Sustainer.\nTawheed al-Uluhiyyah: Directing all acts of worship exclusively to Allah.\nTawheed al-Asma was-Sifat: Affirming all of Allah's names and attributes without distortion or denial.",
        estimatedMinutes: 60,
        references: JSON.stringify([{ type: "quran", sourceId: "112:1-4", label: "Surah Al-Ikhlas" }]),
      },
      {
        pathId: paths[1].id, lessonNumber: 1, title: "Introduction to Tajweed",
        content: "Tajweed (تجويد) means 'to make well, improve, or to do well'. In the context of Quran recitation, it refers to the set of rules governing the way the words of the Quran should be pronounced.\n\nThe ruling on Tajweed: Scholars are agreed that applying the rules of tajweed is a religious obligation (fard) upon every Muslim who recites the Quran.\n\nAllah says: 'And recite the Quran with measured recitation.' (73:4)",
        estimatedMinutes: 30,
        references: JSON.stringify([{ type: "quran", sourceId: "73:4", label: "Al-Muzzammil 4" }]),
      },
    ]);
  }

  // Seed Surahs (first 10)
  const existingSurahs = await db.select().from(surahsTable).limit(1);
  if (existingSurahs.length === 0) {
    await db.insert(surahsTable).values([
      { number: 1, nameArabic: "الفاتحة", nameTransliteration: "Al-Fatihah", nameEnglish: "The Opening", totalAyahs: 7, revelationType: "Meccan", juzStart: 1 },
      { number: 2, nameArabic: "البقرة", nameTransliteration: "Al-Baqarah", nameEnglish: "The Cow", totalAyahs: 286, revelationType: "Medinan", juzStart: 1 },
      { number: 3, nameArabic: "آل عمران", nameTransliteration: "Ali 'Imran", nameEnglish: "Family of Imran", totalAyahs: 200, revelationType: "Medinan", juzStart: 3 },
      { number: 4, nameArabic: "النساء", nameTransliteration: "An-Nisa", nameEnglish: "The Women", totalAyahs: 176, revelationType: "Medinan", juzStart: 4 },
      { number: 5, nameArabic: "المائدة", nameTransliteration: "Al-Ma'idah", nameEnglish: "The Table Spread", totalAyahs: 120, revelationType: "Medinan", juzStart: 6 },
      { number: 112, nameArabic: "الإخلاص", nameTransliteration: "Al-Ikhlas", nameEnglish: "The Sincerity", totalAyahs: 4, revelationType: "Meccan", juzStart: 30 },
      { number: 113, nameArabic: "الفلق", nameTransliteration: "Al-Falaq", nameEnglish: "The Daybreak", totalAyahs: 5, revelationType: "Meccan", juzStart: 30 },
      { number: 114, nameArabic: "الناس", nameTransliteration: "An-Nas", nameEnglish: "Mankind", totalAyahs: 6, revelationType: "Meccan", juzStart: 30 },
    ]);

    await db.insert(ayahsTable).values([
      { number: 1, surahNumber: 1, numberInSurah: 1, arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", translationEn: "In the name of Allah, the Entirely Merciful, the Especially Merciful.", translationUr: "اللہ کے نام سے جو نہایت مہربان رحم کرنے والا ہے۔", juzNumber: 1, pageNumber: 1 },
      { number: 2, surahNumber: 1, numberInSurah: 2, arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translationEn: "[All] praise is [due] to Allah, Lord of the worlds -", translationUr: "سب تعریف اللہ کے لیے ہے جو تمام جہانوں کا رب ہے۔", juzNumber: 1, pageNumber: 1 },
      { number: 3, surahNumber: 1, numberInSurah: 3, arabic: "الرَّحْمَٰنِ الرَّحِيمِ", translationEn: "The Entirely Merciful, the Especially Merciful,", translationUr: "جو بے انتہا مہربان اور نہایت رحم والا ہے۔", juzNumber: 1, pageNumber: 1 },
      { number: 4, surahNumber: 1, numberInSurah: 4, arabic: "مَالِكِ يَوْمِ الدِّينِ", translationEn: "Sovereign of the Day of Recompense.", translationUr: "جزا کے دن کا مالک ہے۔", juzNumber: 1, pageNumber: 1 },
      { number: 5, surahNumber: 1, numberInSurah: 5, arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", translationEn: "It is You we worship and You we ask for help.", translationUr: "ہم صرف تیری ہی عبادت کرتے ہیں اور صرف تجھ ہی سے مدد مانگتے ہیں۔", juzNumber: 1, pageNumber: 1 },
      { number: 6, surahNumber: 1, numberInSurah: 6, arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", translationEn: "Guide us to the straight path -", translationUr: "ہمیں سیدھی راہ دکھا۔", juzNumber: 1, pageNumber: 1 },
      { number: 7, surahNumber: 1, numberInSurah: 7, arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", translationEn: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.", translationUr: "ان لوگوں کی راہ جن پر تو نے انعام کیا، نہ کہ ان کی جن پر غضب ہوا اور نہ گمراہوں کی۔", juzNumber: 1, pageNumber: 1 },
      { number: 8, surahNumber: 2, numberInSurah: 1, arabic: "الٓمٓ", translationEn: "Alif, Lam, Meem.", juzNumber: 1, pageNumber: 2 },
      { number: 9, surahNumber: 2, numberInSurah: 2, arabic: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ", translationEn: "This is the Book about which there is no doubt, a guidance for those conscious of Allah -", translationUr: "یہ وہ کتاب ہے جس میں کوئی شک نہیں، پرہیزگاروں کے لیے ہدایت ہے۔", juzNumber: 1, pageNumber: 2 },
      { number: 10, surahNumber: 2, numberInSurah: 3, arabic: "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ", translationEn: "Who believe in the unseen, establish prayer, and spend out of what We have provided for them,", juzNumber: 1, pageNumber: 2 },
    ]).onDuplicateKeyUpdate({ set: { number: sql`number` } });
  }

  // Create a default admin user
  const existingAdmin = await db.select().from(usersTable).limit(1);
  if (existingAdmin.length === 0) {
    const passwordHash = await hashPassword("admin123456");
    await db.insert(usersTable).values({
      name: "Admin",
      email: "admin@islamicresearch.app",
      passwordHash,
      role: "admin",
      language: "en",
      theme: "dark",
    });
  }
}

export default router;
