import { Router } from "express";
import { db, muhasabahLogsTable, awradLibraryTable } from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// Default Awrad Seed Data if DB empty
const DEFAULT_AWRAD = [
  {
    id: "hizb_bahr",
    title: "حزب البحر (Hizb al-Bahr)",
    titleArabic: "حزب البحر لسيدي أبي الحسن الشاذلي قدس سره",
    category: "hizb_al_bahr",
    author: "الإمام العارف بالله أبو الحسن الشاذليؒ (المتوفى: 656هـ)",
    arabicText: "يَا عَلِيُّ يَا عَظِيمُ يَا حَلِيمُ يَا عَلِيمُ، أَنْتَ رَبِّي، وَعِلْمُكَ حَسْبِي، فَنِعْمَ الرَّبُّ رَبِّي، وَنِعْمَ الْحَسْبُ حَسْبِي، تَنْصُرُ مَن تَشَاءُ وَأَنْتَ الْعَزِيزُ الرَّحِيمُ. نَسْأَلُكَ الْعِصْمَةَ فِي الْحَرَكَاتِ وَالسَّكَنَاتِ، وَالْكَلِمَاتِ وَالإِرَادَاتِ، وَالْخَطَرَاتِ مِنَ الشُّكُوكِ وَالظُّنُونِ، وَالأَوْهَامِ السَّاتِرَةِ لِلْقُلُوبِ عَنْ مُطَالَعَةِ الْغُيُوبِ.",
    translationUr: "اے سب سے بلند! اے بڑی عظمت والے! اے بردبار! اے سب کچھ جاننے والے! آپ ہی میرے رب ہیں اور آپ کا علم ہی میرے لیے کافی ہے۔ تو کتنا اچھا رب میرا رب ہے اور کتنی اچھی کفایت میری کفایت ہے۔ آپ جس کی چاہتے ہیں نصرت فرماتے ہیں اور آپ ہی زبردست اور نہایت رحم کرنے والے ہیں۔ ہم آپ سے اپنی تمام حرکات و سکنات، اقوال و ارادات، اور ان شکوک و اوہام سے عصمت و حفاظت مانگتے ہیں جو دلوں پر غیب کے معائنے سے پردہ ڈال دیتے ہیں۔",
    translationEn: "O Most High! O Magnificent! O Forbearing! O All-Knowing! You are my Lord and Your knowledge is sufficient for me. How excellent a Lord is my Lord, and how excellent a Sustainer is my Sustainer! You grant victory to whom You will, and You are the Exalted in Might, the Merciful.",
    benefits: "دفع بلیات، حفاظت از دشمنان، سکونِ قلب اور روحانی تقرب کے لیے مجرب ورد۔",
  },
  {
    id: "dalail_khayrat",
    title: "دلائل الخیرات — درود شریف (Dala'il al-Khayrat)",
    titleArabic: "دلائل الخيرات وشوارق الأنوار في ذكر الصلاة على النبي المختار",
    category: "dalail_al_khayrat",
    author: "الإمام سيدي محمد بن سليمان الجزوليؒ (المتوفى: 870هـ)",
    arabicText: "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ، صَلَاةً تَرْضَاكَ وَتَرْضَاهُ، وَتَرْضَى بِهَا عَنَّا يَا رَبَّ الْعَالَمِينَ. اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ بَحْرِ أَنْوَارِكَ، وَمَعْدِنِ أَسْرَارِكَ، وَلِسَانِ حُجَّتِكَ، وَعَرُوسِ مَمْلَكَتِكَ، وَإِمَامِ حَضْرَتِكَ، وَطِرَازِ مُلْكِكَ، وَخَزَائِنِ رَحْمَتِكَ، وَطَرِيقِ شَرِيعَتِكَ، الْمُتَلَذِّذِ بِتَوْحِيدِكَ، إِنْسَانِ عَيْنِ الْوُجُودِ، وَالسَّبَبِ فِي كُلِّ مَوْجُودٍ.",
    translationUr: "اے اللہ! ہمارے آقا و مولیٰ حضرت محمد ﷺ اور ان کی آل پر ایسی رحمت نازل فرما جو آپ کو بھی پسند ہو اور آپ کے حبیب ﷺ کو بھی پسند ہو، اور جس کے وسیلے سے آپ ہم سے راضی ہو جائیں اے رب العالمین! اے اللہ! رحمت بھیج ہمارے سردار محمد ﷺ پر جو آپ کے انوار کا سمندر، آپ کے اسرار کا خزانہ، آپ کی حجت کی زبان اور آپ کی بارگاہ کے امام ہیں۔",
    translationEn: "O Allah, send blessings upon our Master Muhammad and upon the family of our Master Muhammad, a blessing which pleases You, pleases him, and by which You are pleased with us, O Lord of the Worlds.",
    benefits: "عشقِ رسول ﷺ کے حصول اور باطنی و قلبی انوار کی کشائش کا بے نظیر ذریعہ۔",
  },
  {
    id: "qasida_burdah",
    title: "قصیدہ بردہ شریف (Qasida Burdah)",
    titleArabic: "الكواكب الدرية في مدح خير البرية لسيدي البوصيريؒ",
    category: "qasida_burdah",
    author: "الإمام شرف الدين البوصيريؒ (المتوفى: 696هـ)",
    arabicText: "مَوْلَايَ صَلِّ وَسَلِّمْ دَائِمًا أَبَدًا\nعَلَى حَبِيبِكَ خَيْرِ الْخَلْقِ كُلِّهِمِ\n\nهُوَ الْحَبِيبُ الَّذِي تُرْجَى شَفَاعَتُهُ\nلِكُلِّ هَوْلٍ مِنَ الأَهْوَالِ مُقْتَحَمِ\n\nمُحَمَّدٌ سَيِّدُ الْكَوْنَيْنِ وَالثَّقَلَيْنِ\nوَالْفَرِيقَيْنِ مِنْ عُرْبٍ وَمِنْ عَجَمِ",
    translationUr: "اے میرے مولا! ہمیشہ ہمیشہ صلوٰۃ و سلام بھیجیے اپنے حبیب ﷺ پر جو تمام مخلوقات میں سب سے بہترین ہیں۔ وہ ایسے محبوب ہیں جن کی شفاعت کی امید کی جاتی ہے، ہر اس ہولناک گھڑی میں جو اچانک ٹوٹ پڑے۔ محمد ﷺ دونوں جہانوں، دونوں بھاری گروہوں (انسان و جنات) اور دونوں فریقوں (عرب و عجم) کے سردار ہیں۔",
    translationEn: "My Master, send peace and blessings constantly and eternally upon Your Beloved, the best of all creation. He is the Beloved whose intercession is ardently hoped for in every terrifying affliction that descends.",
    benefits: "بیماریوں سے شفا، حضور ﷺ کے فیضانِ نظر اور قلبی تسکین کے لیے صدیوں سے متوارث۔",
  },
];

// ================= 1. MUHASABAH (محاسبۂ نفس) =================
router.get("/spiritual/muhasabah", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);

  const [log] = await db.select().from(muhasabahLogsTable)
    .where(and(eq(muhasabahLogsTable.userId, user.id), eq(muhasabahLogsTable.date, date)))
    .limit(1);

  res.json({
    date,
    log: log || {
      truthfulness: true,
      guardedTongue: true,
      loweredGaze: true,
      controlledAnger: true,
      humility: true,
      thankfulness: true,
      recitedQuran: true,
      soughtForgiveness: true,
      daroodCount: 100,
      spiritualScore: 85,
      notes: "",
    },
  });
});

router.post("/spiritual/muhasabah", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const {
    date,
    truthfulness,
    guardedTongue,
    loweredGaze,
    controlledAnger,
    humility,
    thankfulness,
    recitedQuran,
    soughtForgiveness,
    daroodCount,
    notes,
  } = req.body;

  const logDate = date || new Date().toISOString().slice(0, 10);

  // Compute spiritual score (out of 100)
  const checks = [truthfulness, guardedTongue, loweredGaze, controlledAnger, humility, thankfulness, recitedQuran, soughtForgiveness];
  const positiveCount = checks.filter(Boolean).length;
  const baseScore = Math.round((positiveCount / checks.length) * 80);
  const daroodBonus = Math.min(20, Math.round((Number(daroodCount || 0) / 100) * 20));
  const spiritualScore = Math.min(100, baseScore + daroodBonus);

  const [existing] = await db.select().from(muhasabahLogsTable)
    .where(and(eq(muhasabahLogsTable.userId, user.id), eq(muhasabahLogsTable.date, logDate)))
    .limit(1);

  if (existing) {
    await db.update(muhasabahLogsTable)
      .set({
        truthfulness: truthfulness ?? existing.truthfulness,
        guardedTongue: guardedTongue ?? existing.guardedTongue,
        loweredGaze: loweredGaze ?? existing.loweredGaze,
        controlledAnger: controlledAnger ?? existing.controlledAnger,
        humility: humility ?? existing.humility,
        thankfulness: thankfulness ?? existing.thankfulness,
        recitedQuran: recitedQuran ?? existing.recitedQuran,
        soughtForgiveness: soughtForgiveness ?? existing.soughtForgiveness,
        daroodCount: daroodCount !== undefined ? Number(daroodCount) : existing.daroodCount,
        spiritualScore,
        notes: notes ?? existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(muhasabahLogsTable.id, existing.id));
  } else {
    await db.insert(muhasabahLogsTable).values({
      userId: user.id,
      date: logDate,
      truthfulness: truthfulness ?? true,
      guardedTongue: guardedTongue ?? true,
      loweredGaze: loweredGaze ?? true,
      controlledAnger: controlledAnger ?? true,
      humility: humility ?? true,
      thankfulness: thankfulness ?? true,
      recitedQuran: recitedQuran ?? true,
      soughtForgiveness: soughtForgiveness ?? true,
      daroodCount: Number(daroodCount || 100),
      spiritualScore,
      notes: notes || "",
    });
  }

  const [saved] = await db.select().from(muhasabahLogsTable)
    .where(and(eq(muhasabahLogsTable.userId, user.id), eq(muhasabahLogsTable.date, logDate)))
    .limit(1);

  res.json({ success: true, log: saved });
});

router.get("/spiritual/muhasabah/history", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const history = await db.select().from(muhasabahLogsTable)
    .where(eq(muhasabahLogsTable.userId, user.id))
    .orderBy(desc(muhasabahLogsTable.date))
    .limit(30);

  res.json({ history });
});

// ================= 2. AWRAD & LITANIES LIBRARY =================
router.get("/spiritual/awrad", async (req, res) => {
  const { category } = req.query;
  const dbAwrad = category
    ? await db.select().from(awradLibraryTable).where(eq(awradLibraryTable.category, category as string))
    : await db.select().from(awradLibraryTable);

  if (dbAwrad.length === 0) {
    // Return curated presets if DB empty
    const filtered = category
      ? DEFAULT_AWRAD.filter(a => a.category === category)
      : DEFAULT_AWRAD;
    res.json({ awrad: filtered });
    return;
  }

  res.json({ awrad: dbAwrad });
});

// POST: Add new Awrad item (Admin only)
router.post("/spiritual/awrad", requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  const { title, titleArabic, category, author, arabicText, translationUr, translationEn, benefits } = req.body;
  if (!title || !category || !author || !arabicText) {
    res.status(400).json({ message: "title, category, author, and arabicText are required" });
    return;
  }

  await db.insert(awradLibraryTable).values({
    title,
    titleArabic,
    category,
    author,
    arabicText,
    translationUr,
    translationEn,
    benefits,
  });

  res.status(201).json({ success: true, message: "Awrad item added" });
});

export default router;
