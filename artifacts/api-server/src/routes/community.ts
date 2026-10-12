import { Router } from "express";
import { db, mosquesTable, kidsStoriesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// Muezzin presets with audio URLs
export const MUEZZIN_PRESETS = [
  {
    id: "makkah",
    name: "Makkah Mukarramah (مسجد الحرام مکہ)",
    muezzin: "Sheikh Ali Ahmad Mulla (مؤذن الحرم المكي)",
    location: "Makkah al-Mukarramah, Saudi Arabia",
    audioUrl: "https://cdn.aladhan.com/audio/adhans/makkah.mp3",
    durationSec: 215,
  },
  {
    id: "madinah",
    name: "Madinah Munawwarah (مسجد نبوی شریف مدینہ)",
    muezzin: "Sheikh Essam Bukhari (مؤذن المسجد النبوي)",
    location: "Al-Madinah al-Munawwarah, Saudi Arabia",
    audioUrl: "https://cdn.aladhan.com/audio/adhans/madina.mp3",
    durationSec: 198,
  },
  {
    id: "alaqsa",
    name: "Masjid al-Aqsa (مسجد اقصیٰ قدس شریف)",
    muezzin: "Qari Naji Qazzaz (مؤذن المسجد الأقصى)",
    location: "Al-Quds, Palestine",
    audioUrl: "https://cdn.aladhan.com/audio/adhans/quds.mp3",
    durationSec: 195,
  },
  {
    id: "cairo",
    name: "Al-Azhar / Cairo (جامع الأزهر قاہرہ)",
    muezzin: "Sheikh Mustafa Ismail (الشيخ مصطفى إسماعيل)",
    location: "Cairo, Egypt",
    audioUrl: "https://cdn.aladhan.com/audio/adhans/cairo.mp3",
    durationSec: 230,
  },
  {
    id: "istanbul",
    name: "Sultanahmet / Istanbul (جامع سلطان احمد استنبول)",
    muezzin: "Ustad Hafiz Osman (إسطنبول)",
    location: "Istanbul, Turkey",
    audioUrl: "https://cdn.aladhan.com/audio/adhans/istanbul.mp3",
    durationSec: 210,
  },
];

// Default Mosques
const DEFAULT_MOSQUES = [
  {
    id: "mosque_faisal",
    name: "Faisal Mosque (فیصل مسجد)",
    arabicName: "مسجد الملك فيصل",
    city: "Islamabad",
    country: "Pakistan",
    address: "Shah Faisal Ave, E-8, Islamabad, 44000",
    latitude: "33.7297",
    longitude: "73.0372",
    contactNumber: "+92 51 9265100",
    capacity: 300000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
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
    id: "mosque_badshahi",
    name: "Badshahi Mosque (بادشاہی مسجد)",
    arabicName: "مسجد بادشاهي",
    city: "Lahore",
    country: "Pakistan",
    address: "Walled City, Lahore, Punjab 54000",
    latitude: "31.5881",
    longitude: "74.3094",
    contactNumber: "+92 42 99204071",
    capacity: 100000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
    fajrJamaat: "05:20",
    dhuhrJamaat: "13:30",
    asrJamaat: "17:15",
    maghribJamaat: "18:50",
    ishaJamaat: "20:30",
    jummahJamaat: "14:00",
    imamName: "Maulana Abdul Khabir Azad",
    verified: true,
  },
  {
    id: "mosque_tooba",
    name: "Masjid e Tooba (مسجدِ طوبٰی)",
    arabicName: "مسجد طوبى",
    city: "Karachi",
    country: "Pakistan",
    address: "DHA Phase 2, Karachi, Sindh 75500",
    latitude: "24.8465",
    longitude: "67.0601",
    contactNumber: "+92 21 35889700",
    capacity: 5000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
    fajrJamaat: "05:30",
    dhuhrJamaat: "13:45",
    asrJamaat: "17:15",
    maghribJamaat: "18:55",
    ishaJamaat: "20:45",
    jummahJamaat: "14:15",
    imamName: "Mufti Muhammad Asif",
    verified: true,
  },
  {
    id: "mosque_haram",
    name: "Masjid al-Haram (مسجد الحرام مکہ مکرمہ)",
    arabicName: "المسجد الحرام",
    city: "Makkah",
    country: "Saudi Arabia",
    address: "Al Haram, Makkah 24231",
    latitude: "21.4225",
    longitude: "39.8262",
    contactNumber: "+966 12 573 9999",
    capacity: 2500000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
    fajrJamaat: "05:10",
    dhuhrJamaat: "12:30",
    asrJamaat: "15:45",
    maghribJamaat: "18:35",
    ishaJamaat: "20:05",
    jummahJamaat: "12:45",
    imamName: "Sheikh Abdul Rahman Al-Sudais",
    verified: true,
  },
  {
    id: "mosque_nabawi",
    name: "Al-Masjid an-Nabawi (مسجد نبوی شریف مدینہ)",
    arabicName: "المسجد النبوي الشريف",
    city: "Madinah",
    country: "Saudi Arabia",
    address: "Al Haram, Madinah 42311",
    latitude: "24.4672",
    longitude: "39.6108",
    contactNumber: "+966 14 826 0000",
    capacity: 1000000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
    fajrJamaat: "05:15",
    dhuhrJamaat: "12:30",
    asrJamaat: "15:50",
    maghribJamaat: "18:38",
    ishaJamaat: "20:08",
    jummahJamaat: "12:50",
    imamName: "Sheikh Ali Al-Hudhaify",
    verified: true,
  },
];

// Default Kids Stories
const DEFAULT_KIDS_STORIES = [
  {
    id: "story_adam",
    title: "حضرت آدم علیہ السلام کی تخلیق (Story of Prophet Adam AS)",
    titleArabic: "قصة خلق أبينا آدم عليه السلام",
    category: "prophet_story",
    summary: "اللہ تعالیٰ نے سب سے پہلے انسان اور پیغمبر حضرت آدم علیہ السلام کو مٹی سے پیدا کیا اور فرشتوں کو تعظیم کا حکم دیا۔",
    arabicVerse: "إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً (البقرة: 30)",
    urduContent: "اللہ تبارک و تعالیٰ نے جب دنیا کو بنایا تو فرشتوں کو بتایا کہ میں زمین پر ایک خلیفہ (انسان) بنانے والا ہوں۔ اللہ تعالیٰ نے مٹی سے حضرت آدم علیہ السلام کا پتلا بنایا اور اس میں اپنی قدرت سے روح پھونکی۔ تمام فرشتوں نے اللہ کے حکم پر حضرت آدم علیہ السلام کو سجدۂ تعظیم کیا، مگر ابلیس (شیطان) نے تکبر اور غرور کیا اور نافرمانی کی۔ اللہ تعالیٰ نے حضرت آدم علیہ السلام کو تمام چیزوں کے نام سکھائے اور جنت میں رکھا۔",
    englishContent: "Allah created Prophet Adam (AS), the first human and prophet, from clay and commanded the angels to prostrate in respect. All angels obeyed except Iblis, who showed pride. Allah taught Adam the names of all things.",
    moralLesson: "تکبر اور غرور سے ہمیشہ بچنا چاہیے، اور اللہ تعالیٰ کے ہر حکم کو خوشی سے ماننا چاہیے۔",
    ageGroup: "all",
    icon: "user",
    orderIndex: 1,
  },
  {
    id: "story_nuh",
    title: "حضرت نوح علیہ السلام اور عظیم کشتی (Prophet Nuh AS & The Ark)",
    titleArabic: "قصة سفينة نوح عليه السلام",
    category: "prophet_story",
    summary: "حضرت نوح علیہ السلام نے ساڑھے نو سو سال قوم کو توحید کی دعوت دی اور اللہ کے حکم سے پہاڑوں جیسی کشتی بنائی۔",
    arabicVerse: "وَاصْنَعِ الْفُلْكَ بِأَعْيُنِنَا وَوَحْيِنَا (هود: 37)",
    urduContent: "حضرت نوح علیہ السلام نے ساڑھے نو سو سال تک اپنی قوم کو ایک اللہ کی عبادت کی دعوت دی اور بتوں کی پوجا سے منع کیا۔ جب ظالموں نے انکار کیا تو اللہ تعالیٰ کے حکم سے حضرت نوح علیہ السلام نے ایک بہت بڑی کشتی تیار کی۔ کشتی میں ہر جانور کا جوڑا اور ایمان دار لوگ سوار ہوئے۔ پھر آسمان سے بارش اور زمین سے پانی کا طوفان امڈ آیا، جس سے نافرمان غرق ہو گئے اور کشتی میں موجود ایمان والے بچ گئے۔",
    englishContent: "Prophet Nuh (AS) called his people to worship Allah alone for 950 years. By Allah's divine instruction, he built a massive Ark, saving the believers and pairs of animals from the great flood.",
    moralLesson: "صبر، استقامت اور اللہ پر غیر متزلزل بھروسہ ہر مشکل طوفان سے انسان کو پار لگا دیتا ہے۔",
    ageGroup: "all",
    icon: "anchor",
    orderIndex: 2,
  },
  {
    id: "story_ibrahim",
    title: "حضرت ابراہیمؑ اور نمرود کی آگ (Prophet Ibrahim AS)",
    titleArabic: "قصة الخليل إبراهيم عليه السلام ونار النمرود",
    category: "prophet_story",
    summary: "جب نمرود نے حضرت ابراہیم علیہ السلام کو دہکتی ہوئی آگ میں پھینکا تو اللہ کے حکم سے آگ گلزار بن گئی۔",
    arabicVerse: "قُلْنَا يَا نَارُ كُونِي بَرْدًا وَسَلَامًا عَلَىٰ إِبْرَاهِيمَ (الأنبياء: 69)",
    urduContent: "حضرت ابراہیم علیہ السلام نے اپنی قوم کے جھوٹے بتوں کو توڑ کر ثابت کیا کہ معبودِ برحق صرف اللہ ہے۔ ظالم بادشاہ نمرود نے آپ کو دہکتی ہوئی آگ میں ڈال دیا۔ لیکن حضرت ابراہیم علیہ السلام کا ایمان اتنا پختہ تھا کہ انہوں نے مدد کے لیے صرف اللہ کو پکارا: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ'۔ اللہ تعالیٰ نے آگ کو حکم دیا: 'اے آگ! ابراہیم پر ٹھنڈی اور سلامتی والی بن جا'۔ اور آگ خوبصورت باغ بن گئی۔",
    englishContent: "Prophet Ibrahim (AS) challenged the idolatry of his people. King Nimrod cast him into a blazing fire, but by Allah's command, the fire became cool and peaceful.",
    moralLesson: "اللہ تعالیٰ اپنے سچے بندوں کو کبھی تنہا نہیں چھوڑتا، اور توکل انسان کو ہر آزمائش میں سرخرو کرتا ہے۔",
    ageGroup: "all",
    icon: "shield",
    orderIndex: 3,
  },
  {
    id: "story_pillars",
    title: "اسلام کے پانچ بنیادی ارکان (Five Pillars of Islam)",
    titleArabic: "أركان الإسلام الخمسة للأطفال",
    category: "islamic_pillar",
    summary: "اسلام ایک مضبوط عمارت کی طرح ہے جو پانچ بنیادی ستونوں پر قائم ہے۔",
    arabicVerse: "بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ (صحيح البخاري)",
    urduContent: "ہمارے پیارے نبی کریم ﷺ نے فرمایا کہ اسلام کی بنیاد پانچ چیزوں پر ہے:\n1. کلمۂ شہادت: اس بات کی گواہی دینا کہ اللہ کے سوا کوئی معبود نہیں اور محمد ﷺ اللہ کے رسول ہیں۔\n2. نماز قائم کرنا: روزانہ پانچ وقت وقت پر اللہ کے سامنے سجدہ ریز ہونا۔\n3. زکوٰۃ ادا کرنا: اپنے مال سے غریبوں اور مسکینوں کا حق ادا کرنا۔\n4. رمضان کے روزے رکھنا: پورا مہینہ صبح صادق سے مغرب تک اللہ کی رضا کے لیے بھوک پیاس برداشت کرنا۔\n5. بیت اللہ کا حج کرنا: استطاعت رکھنے والوں کا مکہ مکرمہ جا کر حج ادا کرنا۔",
    englishContent: "Islam is built on five pillars: Shahadah (Faith), Salah (Prayer), Zakat (Charity), Sawm (Fasting in Ramadan), and Hajj (Pilgrimage to Makkah).",
    moralLesson: "ان پانچ ارکان کی پابندی ہی ایک اچھے اور پکے مسلمان کی پہچان ہے۔",
    ageGroup: "all",
    icon: "layers",
    orderIndex: 4,
  },
  {
    id: "story_manners",
    title: "کھانے پینے کے اسلامی مسنون آداب (Sunnah Manners of Eating)",
    titleArabic: "آداب الطعام والشراب النبوية",
    category: "moral_etiquette",
    summary: "رسول اللہ ﷺ کی وہ سنتیں جن پر عمل کرنے سے ہمارے کھانے میں برکت اور ثواب پیدا ہوتا ہے۔",
    arabicVerse: "سَمِّ اللَّهَ، وَكُلْ بِيَمِينِكَ، وَكُلْ مِمَّا يَلِيكَ (صحيح مسلم)",
    urduContent: "رسول اللہ ﷺ نے فرمایا کہ جب کھانا کھاؤ تو:\n1. کھانے سے پہلے ہاتھ اچھی طرح دھو لو۔\n2. شروع کرنے سے پہلے 'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ' پڑھو۔\n3. سیدھے (دائیں) ہاتھ سے اور اپنے سامنے سے کھاؤ۔\n4. کھانا بیٹھ کر اور ٹیک لگائے بغیر کھاؤ۔\n5. کھانے کے بعد انگلیاں اور برتن صاف کرو اور اللہ کا شکر ادا کرتے ہوئے دعا پڑھو: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ'۔",
    englishContent: "The Prophet (ﷺ) taught us to wash hands before eating, say Bismillah, eat with the right hand from what is directly before us, and thank Allah after finishing.",
    moralLesson: "ہر عمل میں پیارے نبی ﷺ کی سنت پر عمل کرنا زندگی کو خوبصورت اور بابرکت بناتا ہے۔",
    ageGroup: "4-7",
    icon: "heart",
    orderIndex: 5,
  },
];

// ================= 1. MUEZZIN PRESETS & AZAN AUDIO =================
router.get("/community/muezzins", (_req, res) => {
  res.json({
    success: true,
    muezzins: MUEZZIN_PRESETS,
  });
});

// ================= 2. MOSQUES & JAMAAT TIMES =================
router.get("/community/mosques", async (req, res) => {
  try {
    const { city, search } = req.query;

    let mosques = await db.select().from(mosquesTable);

    // If table is empty, auto seed default mosques
    if (mosques.length === 0) {
      await db.insert(mosquesTable).values(DEFAULT_MOSQUES).onConflictDoNothing();
      mosques = await db.select().from(mosquesTable);
    }

    let filtered = mosques;
    if (city) {
      filtered = filtered.filter(m => m.city.toLowerCase() === String(city).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.arabicName && m.arabicName.toLowerCase().includes(q)) ||
        m.address.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      total: filtered.length,
      mosques: filtered,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch mosques" });
  }
});

router.post("/community/mosques", requireAuth, async (req, res) => {
  try {
    const body = req.body;
    if (!body.name || !body.city || !body.latitude || !body.longitude) {
      return res.status(400).json({ error: "Missing required fields: name, city, latitude, longitude" });
    }

    const [created] = await db.insert(mosquesTable).values({
      name: body.name,
      arabicName: body.arabicName || null,
      city: body.city,
      country: body.country || "Pakistan",
      address: body.address || "",
      latitude: String(body.latitude),
      longitude: String(body.longitude),
      contactNumber: body.contactNumber || null,
      capacity: Number(body.capacity) || 500,
      hasWuduArea: Boolean(body.hasWuduArea ?? true),
      hasLadiesArea: Boolean(body.hasLadiesArea ?? false),
      hasWheelchairAccess: Boolean(body.hasWheelchairAccess ?? true),
      fajrJamaat: body.fajrJamaat || "05:30",
      dhuhrJamaat: body.dhuhrJamaat || "13:30",
      asrJamaat: body.asrJamaat || "17:00",
      maghribJamaat: body.maghribJamaat || "18:45",
      ishaJamaat: body.ishaJamaat || "20:30",
      jummahJamaat: body.jummahJamaat || "13:45",
      imamName: body.imamName || null,
      verified: Boolean(body.verified ?? true),
    }).$returningId();

    res.json({ success: true, message: "Mosque added successfully", id: created?.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add mosque" });
  }
});

// Update Mosque (e.g., Jama'at timings update)
router.put("/community/mosques/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    await db.update(mosquesTable)
      .set({
        name: body.name,
        arabicName: body.arabicName,
        city: body.city,
        address: body.address,
        latitude: body.latitude ? String(body.latitude) : undefined,
        longitude: body.longitude ? String(body.longitude) : undefined,
        fajrJamaat: body.fajrJamaat,
        dhuhrJamaat: body.dhuhrJamaat,
        asrJamaat: body.asrJamaat,
        maghribJamaat: body.maghribJamaat,
        ishaJamaat: body.ishaJamaat,
        jummahJamaat: body.jummahJamaat,
        imamName: body.imamName,
        hasLadiesArea: body.hasLadiesArea,
        hasWuduArea: body.hasWuduArea,
        hasWheelchairAccess: body.hasWheelchairAccess,
        updatedAt: new Date(),
      })
      .where(eq(mosquesTable.id, id));

    res.json({ success: true, message: "Mosque timings and details updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update mosque" });
  }
});

// ================= 3. KIDS ISLAMIC CORNER =================
router.get("/community/kids", async (req, res) => {
  try {
    const { category, ageGroup } = req.query;

    let stories = await db.select().from(kidsStoriesTable).orderBy(kidsStoriesTable.orderIndex);

    // If empty, auto-seed default stories
    if (stories.length === 0) {
      await db.insert(kidsStoriesTable).values(DEFAULT_KIDS_STORIES).onConflictDoNothing();
      stories = await db.select().from(kidsStoriesTable).orderBy(kidsStoriesTable.orderIndex);
    }

    let filtered = stories;
    if (category) {
      filtered = filtered.filter(s => s.category === category);
    }
    if (ageGroup && ageGroup !== "all") {
      filtered = filtered.filter(s => s.ageGroup === ageGroup || s.ageGroup === "all");
    }

    res.json({
      success: true,
      total: filtered.length,
      stories: filtered,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch kids stories" });
  }
});

router.post("/community/kids", requireAuth, async (req, res) => {
  try {
    const body = req.body;
    if (!body.title || !body.category || !body.summary || !body.urduContent || !body.moralLesson) {
      return res.status(400).json({ error: "Missing required fields for kids story" });
    }

    const [created] = await db.insert(kidsStoriesTable).values({
      title: body.title,
      titleArabic: body.titleArabic || null,
      category: body.category,
      summary: body.summary,
      arabicVerse: body.arabicVerse || null,
      urduContent: body.urduContent,
      englishContent: body.englishContent || null,
      moralLesson: body.moralLesson,
      ageGroup: body.ageGroup || "all",
      icon: body.icon || "book-open",
      orderIndex: Number(body.orderIndex) || 0,
    }).$returningId();

    res.json({ success: true, message: "Story added successfully", id: created?.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add story" });
  }
});

export default router;
