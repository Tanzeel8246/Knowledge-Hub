import { db } from "@workspace/db";
import {
  usersTable, surahsTable, ayahsTable,
  hadithCollectionsTable, hadithBooksTable, hadithsTable,
  bookCategoriesTable, booksTable, bookChaptersTable,
  learningPathsTable, lessonsTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

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
  if (existingCats.length === 0) {
    logger.info("Seeding books...");
    const [aqeedah, fiqh, tafsir, seerah, ethics, hadithCat] = await db.insert(bookCategoriesTable).values([
      { name: "Aqeedah (Theology)", nameArabic: "العقيدة", sortOrder: 1 },
      { name: "Fiqh (Islamic Law)", nameArabic: "الفقه", sortOrder: 2 },
      { name: "Tafsir (Quranic Commentary)", nameArabic: "التفسير", sortOrder: 3 },
      { name: "Seerah (Biography of the Prophet)", nameArabic: "السيرة النبوية", sortOrder: 4 },
      { name: "Islamic Ethics & Spirituality", nameArabic: "الأخلاق والتزكية", sortOrder: 5 },
      { name: "Hadith Sciences", nameArabic: "علوم الحديث", sortOrder: 6 },
    ]).returning();

    const [book1, book2, book3, book4] = await db.insert(booksTable).values([
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
      {
        title: "Al-Aqeedah al-Wasitiyyah",
        titleArabic: "العقيدة الواسطية",
        author: "Ibn Taymiyyah",
        authorArabic: "ابن تيمية",
        categoryId: aqeedah.id,
        language: "ar",
        description: "A concise but comprehensive treatise on Islamic creed (aqeedah) written by Ibn Taymiyyah.",
        totalChapters: 12,
        isPublic: true,
        publishedYear: 1300,
      },
    ]).returning();

    await db.insert(bookChaptersTable).values([
      { bookId: book1.id, chapterNumber: 1, title: "The Excellence of Tawheed", titleArabic: "باب فضل التوحيد", content: "Allah the Almighty said: 'It is those who believe and confuse not their belief with wrong — for them is security and they are the rightly guided.' (6:82)\n\nTawheed (monotheism) is the foundation of Islam. It means affirming that Allah alone is worthy of worship, that He alone is the Creator and Sustainer, and affirming all His beautiful names and attributes.\n\nThe Prophet (PBUH) said: 'Whoever dies knowing that there is no god except Allah will enter Paradise.' (Sahih Muslim)" },
      { bookId: book1.id, chapterNumber: 2, title: "On What Allah Has Rights Over His Slaves", titleArabic: "باب ما لله من الحق على العباد", content: "Mu'adh ibn Jabal (RA) narrated: 'I was riding behind the Prophet (PBUH) on a donkey. He said, \"O Mu'adh, do you know what Allah's right upon His servants is and what the servants' right upon Allah is?\" I replied: \"Allah and His Messenger know better.\" He said, \"Allah's right upon His servants is that they worship Him and associate no partners with Him. The servants' right upon Allah is that He does not punish whoever does not associate partners with Him.\"' (Al-Bukhari and Muslim)" },
      { bookId: book2.id, chapterNumber: 1, title: "Background and Lineage", content: "Muhammad ibn Abdullah ibn Abd al-Muttalib ibn Hashim... His lineage traces through the noblest Arab tribe to Ishmael (AS), son of Abraham (AS).\n\nThe Prophet (PBUH) was born on Monday, the 12th of Rabi al-Awwal, in the Year of the Elephant (approximately 570 CE) in the city of Makkah. His father, Abdullah, had died before his birth. His mother, Aminah bint Wahb, passed away when he was six years old. He was then raised by his grandfather Abd al-Muttalib, and after his grandfather's death, by his uncle Abu Talib." },
      { bookId: book3.id, chapterNumber: 1, title: "Sincerity and Intention", titleArabic: "باب الإخلاص وإحضار النية", content: "Allah the Almighty says: 'And they were not commanded except to worship Allah, being sincere to Him in religion.' (98:5)\n\nThe Prophet (PBUH) said: 'Actions are by their intentions, and for everyone is what they intended. Whoever migrated for the sake of Allah and His Messenger, then his migration was for Allah and His Messenger. Whoever migrated to obtain some worldly benefit or to marry a woman, then his migration was for that which he migrated.' (Al-Bukhari and Muslim)" },
      { bookId: book4.id, chapterNumber: 1, title: "Introduction to Aqeedah", titleArabic: "مقدمة في العقيدة", content: "Praise be to Allah who sent His Messenger with guidance and the religion of truth, to make it victorious over all religions, even if the polytheists detest it.\n\nIslamic aqeedah is built upon six articles of faith:\n1. Belief in Allah (His existence, oneness, names and attributes)\n2. Belief in the Angels\n3. Belief in the Revealed Books\n4. Belief in the Prophets and Messengers\n5. Belief in the Last Day\n6. Belief in Divine Decree (Qadar)" },
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

    if (tafsirCat && aqeedahCat && fiqhCat && seerahCat && ethicsCat && hadithCatRec) {
      const newBooks = await db.insert(booksTable).values([
        // Tafseer Books
        {
          title: "Tafsir Ibn Kathir (Abridged)",
          titleArabic: "تفسير ابن كثير",
          author: "Imam Ibn Kathir",
          authorArabic: "الإمام ابن كثير",
          categoryId: tafsirCat.id,
          language: "en",
          description: "One of the most widely read and respected works of Quranic exegesis, authored by the great 14th-century Islamic scholar. Relies heavily on authentic hadiths and the words of the Companions.",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1370,
        },
        {
          title: "Tafsir al-Jalalayn",
          titleArabic: "تفسير الجلالين",
          author: "Jalal ad-Din al-Suyuti & Jalal ad-Din al-Mahalli",
          authorArabic: "جلال الدين السيوطي والمحلي",
          categoryId: tafsirCat.id,
          language: "ar",
          description: "A concise and highly authoritative tafsir of the entire Quran, written by two scholars both named Jalal ad-Din. One of the most widely studied works in Islamic education.",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1505,
        },
        {
          title: "Fi Zilal al-Quran (In the Shade of the Quran)",
          titleArabic: "في ظلال القرآن",
          author: "Sayyid Qutb",
          authorArabic: "سيد قطب",
          categoryId: tafsirCat.id,
          language: "ar",
          description: "A comprehensive modern tafsir emphasizing the Quran's guidance for contemporary life and society. Written partially while the author was in prison.",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1966,
        },
        {
          title: "Ma'ariful Quran",
          titleArabic: "معارف القرآن",
          author: "Mufti Muhammad Shafi Usmani",
          authorArabic: "مفتي محمد شفيع العثماني",
          categoryId: tafsirCat.id,
          language: "ur",
          description: "A comprehensive Urdu tafsir (commentary) of the Quran, widely read in South Asia. It covers fiqh rulings, linguistic analysis, and spiritual guidance.",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1969,
        },
        {
          title: "Tafhimul Quran",
          titleArabic: "تفهيم القرآن",
          author: "Sayyid Abul Ala Maududi",
          authorArabic: "سيد أبو الأعلى المودودي",
          categoryId: tafsirCat.id,
          language: "ur",
          description: "A detailed Urdu commentary on the Quran focusing on its message, literary aspects, and application to modern life. A landmark work of 20th-century Islamic literature.",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1972,
        },
        {
          title: "Tafsir al-Tabari (Jami al-Bayan)",
          titleArabic: "جامع البيان في تأويل القرآن",
          author: "Imam Ibn Jarir al-Tabari",
          authorArabic: "الإمام ابن جرير الطبري",
          categoryId: tafsirCat.id,
          language: "ar",
          description: "The oldest and most exhaustive classical tafsir, compiling reports from the Companions and Successors. Considered the foundational work of Quranic exegesis.",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 923,
        },
        // Hadith Books
        {
          title: "Muwatta Imam Malik",
          titleArabic: "الموطأ",
          author: "Imam Malik ibn Anas",
          authorArabic: "الإمام مالك بن أنس",
          categoryId: hadithCatRec.id,
          language: "ar",
          description: "The earliest surviving written collection of hadith, compiled by the founder of the Maliki school of jurisprudence. Considered highly authentic.",
          totalChapters: 61,
          isPublic: true,
          publishedYear: 795,
        },
        {
          title: "Bulugh al-Maram (Attainment of the Objective)",
          titleArabic: "بلوغ المرام من أدلة الأحكام",
          author: "Ibn Hajar al-Asqalani",
          authorArabic: "ابن حجر العسقلاني",
          categoryId: hadithCatRec.id,
          language: "en",
          description: "A collection of 1,358 hadiths related to Islamic jurisprudence, widely used in fiqh study. Each hadith includes a grading and source reference.",
          totalChapters: 16,
          isPublic: true,
          publishedYear: 1430,
        },
        {
          title: "Al-Arba'een al-Nawawiyyah (40 Hadith Nawawi)",
          titleArabic: "الأربعون النووية",
          author: "Imam an-Nawawi",
          authorArabic: "الإمام النووي",
          categoryId: hadithCatRec.id,
          language: "en",
          description: "A foundational collection of 42 hadiths covering the core principles and pillars of Islam. Perhaps the most memorized collection of hadith worldwide.",
          totalChapters: 5,
          isPublic: true,
          publishedYear: 1283,
        },
        {
          title: "Al-Adab al-Mufrad",
          titleArabic: "الأدب المفرد",
          author: "Imam al-Bukhari",
          authorArabic: "الإمام البخاري",
          categoryId: hadithCatRec.id,
          language: "en",
          description: "A collection of 1,322 hadiths focusing on Islamic manners, character, and social conduct — compiled by the author of Sahih al-Bukhari.",
          totalChapters: 42,
          isPublic: true,
          publishedYear: 870,
        },
        {
          title: "Mishkat al-Masabih",
          titleArabic: "مشكاة المصابيح",
          author: "Al-Khatib at-Tabrizi",
          authorArabic: "الخطيب التبريزي",
          categoryId: hadithCatRec.id,
          language: "en",
          description: "An expanded collection of over 5,000 hadiths drawn from major canonical collections, arranged by topic and widely used in Islamic seminaries.",
          totalChapters: 30,
          isPublic: true,
          publishedYear: 1340,
        },
        {
          title: "Sunan al-Darimi",
          titleArabic: "سنن الدارمي",
          author: "Imam al-Darimi",
          authorArabic: "الإمام الدارمي",
          categoryId: hadithCatRec.id,
          language: "ar",
          description: "One of the major hadith collections containing approximately 3,500 hadiths, covering Islamic law, Quran sciences, and prophetic traditions.",
          totalChapters: 24,
          isPublic: true,
          publishedYear: 869,
        },
        // Fiqh Books
        {
          title: "Fiqh al-Sunnah",
          titleArabic: "فقه السنة",
          author: "Sayyid Sabiq",
          authorArabic: "سيد سابق",
          categoryId: fiqhCat.id,
          language: "en",
          description: "A comprehensive guide to Islamic jurisprudence based directly on the Quran and Sunnah, covering worship, transactions, family law, and more.",
          totalChapters: 14,
          isPublic: true,
          publishedYear: 1945,
        },
        {
          title: "Reliance of the Traveller (Umdat as-Salik)",
          titleArabic: "عمدة السالك وعدة الناسك",
          author: "Ahmad ibn Naqib al-Misri",
          authorArabic: "أحمد بن النقيب المصري",
          categoryId: fiqhCat.id,
          language: "en",
          description: "A classic Shafi'i manual of Islamic jurisprudence, covering ritual worship, commercial dealings, marriage, and ethics.",
          totalChapters: 25,
          isPublic: true,
          publishedYear: 1368,
        },
        // Ethics & Spirituality
        {
          title: "Ihya Ulum al-Din (Revival of the Religious Sciences)",
          titleArabic: "إحياء علوم الدين",
          author: "Imam al-Ghazali",
          authorArabic: "الإمام الغزالي",
          categoryId: ethicsCat.id,
          language: "ar",
          description: "Considered one of the greatest works of Islamic literature, covering the external acts of worship and the internal purification of the soul.",
          totalChapters: 40,
          isPublic: true,
          publishedYear: 1107,
        },
        {
          title: "The Beginning of Guidance (Bidayat al-Hidayah)",
          titleArabic: "بداية الهداية",
          author: "Imam al-Ghazali",
          authorArabic: "الإمام الغزالي",
          categoryId: ethicsCat.id,
          language: "en",
          description: "A concise guide to the path of spiritual development, written by Imam al-Ghazali as a practical introduction to Islamic ethics and spirituality.",
          totalChapters: 10,
          isPublic: true,
          publishedYear: 1095,
        },
        // Seerah
        {
          title: "Muhammad: His Life Based on the Earliest Sources",
          titleArabic: "سيرة النبي الكريم",
          author: "Martin Lings (Abu Bakr Siraj ad-Din)",
          categoryId: seerahCat.id,
          language: "en",
          description: "A beautifully written biography of the Prophet Muhammad (PBUH) based on authentic 8th and 9th century Arabic sources.",
          totalChapters: 87,
          isPublic: true,
          publishedYear: 1983,
        },
        {
          title: "Seerah Ibn Hisham",
          titleArabic: "السيرة النبوية لابن هشام",
          author: "Ibn Hisham",
          authorArabic: "ابن هشام",
          categoryId: seerahCat.id,
          language: "ar",
          description: "The earliest and most authoritative biography of Prophet Muhammad (PBUH), based on the original work of Ibn Ishaq. The primary reference for all later biographies.",
          totalChapters: 45,
          isPublic: true,
          publishedYear: 833,
        },
      ]).returning();

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

  // Also seed more hadith collections if missing
  const allCollections = await db.select().from(hadithCollectionsTable);
  if (allCollections.length < 8) {
    logger.info("Seeding extended hadith collections...");
    await db.insert(hadithCollectionsTable).values([
      { id: "muwatta", name: "Muwatta Imam Malik", nameArabic: "الموطأ", author: "Imam Malik ibn Anas", totalHadiths: 1720, description: "The earliest surviving major collection of hadith, compiled by the founder of the Maliki school. Considered highly authentic by scholars." },
      { id: "darimi", name: "Sunan al-Darimi", nameArabic: "سنن الدارمي", author: "Imam al-Darimi", totalHadiths: 3500, description: "A major hadith collection arranged by legal topics, compiled by Abd Allah ibn Abd al-Rahman al-Darimi." },
    ]).onConflictDoNothing();

    await db.insert(hadithBooksTable).values([
      { collectionId: "muwatta", bookNumber: 1, nameArabic: "كتاب الطهارة", nameEnglish: "Book of Purification", totalHadiths: 131 },
      { collectionId: "muwatta", bookNumber: 2, nameArabic: "كتاب الصلاة", nameEnglish: "Book of Prayer", totalHadiths: 90 },
      { collectionId: "muwatta", bookNumber: 3, nameArabic: "كتاب الزكاة", nameEnglish: "Book of Zakat", totalHadiths: 41 },
      { collectionId: "darimi", bookNumber: 1, nameArabic: "كتاب المقدمة", nameEnglish: "Introduction", totalHadiths: 65 },
      { collectionId: "darimi", bookNumber: 2, nameArabic: "كتاب الطهارة", nameEnglish: "Book of Purification", totalHadiths: 101 },
    ]).onConflictDoNothing();

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
        collectionId: "darimi", bookNumber: 1, hadithNumber: 1,
        arabic: "الْعِلْمُ إِمَامُ الْعَمَلِ وَالْعَمَلُ تَابِعُهُ",
        english: "Knowledge is the leader of action, and action follows it.",
        narrator: "Reported from scholars",
        grade: "Mawquf",
        reference: "Sunan al-Darimi 1:1",
      },
    ]).onConflictDoNothing();
  }

  // Learning Paths
  const existingPaths = await db.select().from(learningPathsTable).limit(1);
  if (existingPaths.length === 0) {
    logger.info("Seeding learning paths...");
    const paths = await db.insert(learningPathsTable).values([
      { title: "Foundations of Islamic Faith", description: "A comprehensive introduction to the core beliefs of Islam — the six pillars of Iman, the five pillars of Islam, and the fundamentals of Aqeedah.", level: "beginner", topic: "Aqeedah", totalLessons: 8, estimatedHours: "12" },
      { title: "Quran Recitation & Tajweed", description: "Master the rules of Tajweed for proper Quran recitation. Learn makharij al-huroof, sifat, and apply them in practice.", level: "beginner", topic: "Quran", totalLessons: 10, estimatedHours: "15" },
      { title: "Fiqh of Prayer (Salah)", description: "A detailed study of the Islamic prayer — its conditions, pillars, obligations, and recommended acts.", level: "intermediate", topic: "Fiqh", totalLessons: 12, estimatedHours: "18" },
      { title: "Introduction to Hadith Sciences", description: "Learn the terminology and methodology of hadith criticism. Understand isnad, matn, and hadith classification.", level: "intermediate", topic: "Hadith", totalLessons: 10, estimatedHours: "20" },
      { title: "Seerah: Life of the Prophet", description: "A chronological study of the life of Prophet Muhammad (PBUH), from birth through the completion of the Islamic mission.", level: "beginner", topic: "Seerah", totalLessons: 15, estimatedHours: "25" },
    ]).returning();

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

  // Surahs
  const existingSurahs = await db.select().from(surahsTable).limit(1);
  if (existingSurahs.length === 0) {
    logger.info("Seeding surahs and ayahs...");
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
      { number: 36, nameArabic: "يس", nameTransliteration: "Ya-Sin", nameEnglish: "Ya Sin", totalAyahs: 83, revelationType: "Meccan", juzStart: 22 },
      { number: 55, nameArabic: "الرحمن", nameTransliteration: "Ar-Rahman", nameEnglish: "The Most Gracious", totalAyahs: 78, revelationType: "Medinan", juzStart: 27 },
      { number: 67, nameArabic: "الملك", nameTransliteration: "Al-Mulk", nameEnglish: "The Sovereignty", totalAyahs: 30, revelationType: "Meccan", juzStart: 29 },
      { number: 78, nameArabic: "النبأ", nameTransliteration: "An-Naba", nameEnglish: "The Announcement", totalAyahs: 40, revelationType: "Meccan", juzStart: 30 },
      { number: 112, nameArabic: "الإخلاص", nameTransliteration: "Al-Ikhlas", nameEnglish: "The Sincerity", totalAyahs: 4, revelationType: "Meccan", juzStart: 30 },
      { number: 113, nameArabic: "الفلق", nameTransliteration: "Al-Falaq", nameEnglish: "The Daybreak", totalAyahs: 5, revelationType: "Meccan", juzStart: 30 },
      { number: 114, nameArabic: "الناس", nameTransliteration: "An-Nas", nameEnglish: "Mankind", totalAyahs: 6, revelationType: "Meccan", juzStart: 30 },
    ]).onConflictDoNothing();

    await db.insert(ayahsTable).values([
      { number: 1, surahNumber: 1, numberInSurah: 1, arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", translationEn: "In the name of Allah, the Entirely Merciful, the Especially Merciful.", translationUr: "اللہ کے نام سے جو نہایت مہربان رحم کرنے والا ہے۔", juzNumber: 1, pageNumber: 1 },
      { number: 2, surahNumber: 1, numberInSurah: 2, arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translationEn: "[All] praise is [due] to Allah, Lord of the worlds -", translationUr: "سب تعریف اللہ کے لیے ہے جو تمام جہانوں کا رب ہے۔", juzNumber: 1, pageNumber: 1 },
      { number: 3, surahNumber: 1, numberInSurah: 3, arabic: "الرَّحْمَٰنِ الرَّحِيمِ", translationEn: "The Entirely Merciful, the Especially Merciful,", translationUr: "جو بے انتہا مہربان اور نہایت رحم والا ہے۔", juzNumber: 1, pageNumber: 1 },
      { number: 4, surahNumber: 1, numberInSurah: 4, arabic: "مَالِكِ يَوْمِ الدِّينِ", translationEn: "Sovereign of the Day of Recompense.", translationUr: "جزا کے دن کا مالک ہے۔", juzNumber: 1, pageNumber: 1 },
      { number: 5, surahNumber: 1, numberInSurah: 5, arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", translationEn: "It is You we worship and You we ask for help.", translationUr: "ہم صرف تیری ہی عبادت کرتے ہیں اور صرف تجھ ہی سے مدد مانگتے ہیں۔", juzNumber: 1, pageNumber: 1 },
      { number: 6, surahNumber: 1, numberInSurah: 6, arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", translationEn: "Guide us to the straight path -", translationUr: "ہمیں سیدھی راہ دکھا۔", juzNumber: 1, pageNumber: 1 },
      { number: 7, surahNumber: 1, numberInSurah: 7, arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", translationEn: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.", translationUr: "ان لوگوں کی راہ جن پر تو نے انعام کیا، نہ کہ ان پر غضب ہوا اور نہ گمراہوں کی۔", juzNumber: 1, pageNumber: 1 },
      { number: 8, surahNumber: 2, numberInSurah: 1, arabic: "الٓمٓ", translationEn: "Alif, Lam, Meem.", juzNumber: 1, pageNumber: 2 },
      { number: 9, surahNumber: 2, numberInSurah: 2, arabic: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ", translationEn: "This is the Book about which there is no doubt, a guidance for those conscious of Allah -", translationUr: "یہ وہ کتاب ہے جس میں کوئی شک نہیں، پرہیزگاروں کے لیے ہدایت ہے۔", juzNumber: 1, pageNumber: 2 },
      { number: 10, surahNumber: 2, numberInSurah: 3, arabic: "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ", translationEn: "Who believe in the unseen, establish prayer, and spend out of what We have provided for them,", juzNumber: 1, pageNumber: 2 },
      { number: 11, surahNumber: 2, numberInSurah: 4, arabic: "وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ", translationEn: "And who believe in what has been revealed to you, and what was revealed before you, and of the Hereafter they are certain [in faith].", juzNumber: 1, pageNumber: 2 },
      { number: 12, surahNumber: 2, numberInSurah: 255, arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ", translationEn: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.", translationUr: "اللہ! اس کے سوا کوئی معبود نہیں، وہ ہمیشہ زندہ، سب کو قائم رکھنے والا ہے۔ اسے نہ اونگھ آتی ہے اور نہ نیند۔", juzNumber: 3, pageNumber: 42 },
    ]).onConflictDoNothing();
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

  logger.info("Seed check complete.");
}
