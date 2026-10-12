import { Router } from "express";
import { db, fiqhTopicsTable, inheritanceCalculationsTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// ================= ISLAMIC INHERITANCE ENGINE (علم الفرائض) =================
interface InheritanceInput {
  totalEstate: number;
  currency?: string;
  deceasedGender: "male" | "female";
  wivesCount?: number; // for male deceased (max 4)
  hasHusband?: boolean; // for female deceased
  sonsCount?: number;
  daughtersCount?: number;
  hasFather?: boolean;
  hasMother?: boolean;
}

interface HeirShare {
  heir: string;
  heirUrdu: string;
  heirArabic: string;
  count: number;
  fractionLabel: string;
  sharePercentage: number;
  amount: number;
  eachAmount: number;
  quranicEvidence: string;
}

export function calculateInheritance(input: InheritanceInput) {
  const {
    totalEstate,
    currency = "USD",
    deceasedGender,
    wivesCount = 0,
    hasHusband = false,
    sonsCount = 0,
    daughtersCount = 0,
    hasFather = false,
    hasMother = false,
  } = input;

  const hasChildren = sonsCount > 0 || daughtersCount > 0;
  const shares: HeirShare[] = [];
  let allocatedFraction = 0;

  // 1. Spousal Share
  if (deceasedGender === "male" && wivesCount > 0) {
    const fraction = hasChildren ? 1 / 8 : 1 / 4;
    allocatedFraction += fraction;
    shares.push({
      heir: wivesCount === 1 ? "Wife" : "Wives",
      heirUrdu: wivesCount === 1 ? "زوجہ (بیوہ)" : `زوجات (${wivesCount} بیوائیں)`,
      heirArabic: wivesCount === 1 ? "الزوجة" : "الزوجات",
      count: wivesCount,
      fractionLabel: hasChildren ? "1/8 (ثمن)" : "1/4 (ربع)",
      sharePercentage: fraction * 100,
      amount: totalEstate * fraction,
      eachAmount: (totalEstate * fraction) / wivesCount,
      quranicEvidence: "النساء: 12 (وَلَهُنَّ الرُّبُعُ مِمَّا تَرَكْتُمْ إِن لَّمْ يَكُن لَّكُمْ وَلَدٌ ۚ فَإِن كَانَ لَكُمْ وَلَدٌ فَلَهُنَّ الثُّمُنُ)",
    });
  } else if (deceasedGender === "female" && hasHusband) {
    const fraction = hasChildren ? 1 / 4 : 1 / 2;
    allocatedFraction += fraction;
    shares.push({
      heir: "Husband",
      heirUrdu: "شوہر (زوج)",
      heirArabic: "الزوج",
      count: 1,
      fractionLabel: hasChildren ? "1/4 (ربع)" : "1/2 (نصف)",
      sharePercentage: fraction * 100,
      amount: totalEstate * fraction,
      eachAmount: totalEstate * fraction,
      quranicEvidence: "النساء: 12 (وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَاجُكُمْ إِن لَّمْ يَكُن لَّهُنَّ وَلَدٌ ۚ فَإِن كَانَ لَهُنَّ وَلَدٌ فَلَكُمُ الرُّبُعُ)",
    });
  }

  // 2. Mother's Share
  if (hasMother) {
    const fraction = hasChildren ? 1 / 6 : 1 / 3;
    allocatedFraction += fraction;
    shares.push({
      heir: "Mother",
      heirUrdu: "والدہ (ماں)",
      heirArabic: "الأم",
      count: 1,
      fractionLabel: hasChildren ? "1/6 (سدس)" : "1/3 (ثلث)",
      sharePercentage: fraction * 100,
      amount: totalEstate * fraction,
      eachAmount: totalEstate * fraction,
      quranicEvidence: "النساء: 11 (وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ مِمَّا تَرَكَ إِن كَانَ لَهُ وَلَدٌ ۚ فَإِن لَّمْ يَكُن لَّهُ وَلَدٌ وَوَرِثَهُ أَبَوَاهُ فَلِأُمِّهِ الثُّلُثُ)",
    });
  }

  // 3. Father's Share
  if (hasFather) {
    if (sonsCount > 0) {
      // Father gets fixed 1/6
      const fraction = 1 / 6;
      allocatedFraction += fraction;
      shares.push({
        heir: "Father",
        heirUrdu: "والد (باپ)",
        heirArabic: "الأب",
        count: 1,
        fractionLabel: "1/6 (سدس فرضا)",
        sharePercentage: fraction * 100,
        amount: totalEstate * fraction,
        eachAmount: totalEstate * fraction,
        quranicEvidence: "النساء: 11 (وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ)",
      });
    } else if (daughtersCount > 0 && sonsCount === 0) {
      // Father gets 1/6 fixed + Asabah remainder after daughters
      const fixedFraction = 1 / 6;
      allocatedFraction += fixedFraction;
      shares.push({
        heir: "Father",
        heirUrdu: "والد (باپ)",
        heirArabic: "الأب",
        count: 1,
        fractionLabel: "1/6 فرضا + الباقی عصبۃ",
        sharePercentage: fixedFraction * 100,
        amount: totalEstate * fixedFraction,
        eachAmount: totalEstate * fixedFraction,
        quranicEvidence: "النساء: 11 مع إجماع الصحابة",
      });
    }
  }

  // 4. Daughters alone without Sons
  if (sonsCount === 0 && daughtersCount > 0) {
    const fraction = daughtersCount === 1 ? 1 / 2 : 2 / 3;
    allocatedFraction += fraction;
    shares.push({
      heir: daughtersCount === 1 ? "Daughter" : "Daughters",
      heirUrdu: daughtersCount === 1 ? "اکلوتی بیٹی" : `${daughtersCount} بیٹیاں`,
      heirArabic: daughtersCount === 1 ? "البنت" : "البنات",
      count: daughtersCount,
      fractionLabel: daughtersCount === 1 ? "1/2 (نصف)" : "2/3 (ثلثان)",
      sharePercentage: fraction * 100,
      amount: totalEstate * fraction,
      eachAmount: (totalEstate * fraction) / daughtersCount,
      quranicEvidence: "النساء: 11 (فَإِن كُنَّ نِسَاءً فَوْقَ اثْنَتَيْنِ فَلَهُنَّ ثُلُثَا مَا تَرَكَ ۖ وَإِن كَانَتْ وَاحِدَةً فَلَهَا النِّصْفُ)",
    });
  }

  // 5. Residuary ('Asabah) Distribution
  let remainderFraction = Math.max(0, 1 - allocatedFraction);

  if (sonsCount > 0) {
    // Sons and Daughters inherit remainder with 2:1 ratio
    const sonShares = sonsCount * 2;
    const daughterShares = daughtersCount * 1;
    const totalUnits = sonShares + daughterShares;

    const sonPortion = remainderFraction * (sonShares / totalUnits);
    const daughterPortion = remainderFraction * (daughterShares / totalUnits);

    shares.push({
      heir: sonsCount === 1 ? "Son" : "Sons",
      heirUrdu: sonsCount === 1 ? "بیٹا (عصبۃ)" : `${sonsCount} بیٹے (عصبۃ)`,
      heirArabic: sonsCount === 1 ? "الابن" : "الأبناء",
      count: sonsCount,
      fractionLabel: "عصبۃ بالغیر (2 حصے فی لڑکا)",
      sharePercentage: sonPortion * 100,
      amount: totalEstate * sonPortion,
      eachAmount: (totalEstate * sonPortion) / sonsCount,
      quranicEvidence: "النساء: 11 (يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ ۖ لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ)",
    });

    if (daughtersCount > 0) {
      shares.push({
        heir: daughtersCount === 1 ? "Daughter" : "Daughters",
        heirUrdu: daughtersCount === 1 ? "بیٹی (مع بھائی عصبۃ)" : `${daughtersCount} بیٹیاں (مع بھائی عصبۃ)`,
        heirArabic: daughtersCount === 1 ? "البنت" : "البنات",
        count: daughtersCount,
        fractionLabel: "عصبۃ بالغیر (1 حصہ فی لڑکی)",
        sharePercentage: daughterPortion * 100,
        amount: totalEstate * daughterPortion,
        eachAmount: (totalEstate * daughterPortion) / daughtersCount,
        quranicEvidence: "النساء: 11 (لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ)",
      });
    }
  } else if (hasFather && sonsCount === 0) {
    // Father takes remainder as pure Asabah or extra Asabah
    const fatherExisting = shares.find(s => s.heir === "Father");
    if (fatherExisting) {
      fatherExisting.amount += totalEstate * remainderFraction;
      fatherExisting.eachAmount = fatherExisting.amount;
      fatherExisting.sharePercentage += remainderFraction * 100;
    } else {
      shares.push({
        heir: "Father",
        heirUrdu: "والد (عصبہ محض)",
        heirArabic: "الأب",
        count: 1,
        fractionLabel: "عصبہ محض (تمام باقی ماندہ)",
        sharePercentage: remainderFraction * 100,
        amount: totalEstate * remainderFraction,
        eachAmount: totalEstate * remainderFraction,
        quranicEvidence: "الحديث: (أَلْحِقُوا الفَرائِضَ بأَهْلِها، فَمَا بَقِيَ فَهو لأوْلَى رَجُلٍ ذَكَرٍ - البخاري 6732)",
      });
    }
  }

  return {
    totalEstate,
    currency,
    shares,
    distributedTotal: shares.reduce((acc, s) => acc + s.amount, 0),
  };
}

// POST: Run Islamic Inheritance Calculation
router.post("/fiqh/calculate-inheritance", async (req, res) => {
  try {
    const { totalEstate } = req.body;
    if (!totalEstate || isNaN(Number(totalEstate)) || Number(totalEstate) <= 0) {
      res.status(400).json({ message: "Valid totalEstate is required" });
      return;
    }

    const result = calculateInheritance({
      ...req.body,
      totalEstate: Number(totalEstate),
    });

    // Optionally persist record in database if user is logged in
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        await db.insert(inheritanceCalculationsTable).values({
          deceasedGender: req.body.deceasedGender || "male",
          totalEstate: String(totalEstate),
          currency: req.body.currency || "USD",
          sharesJson: JSON.stringify(result.shares),
          notes: req.body.notes || "Inheritance distribution calculated",
        });
      } catch {}
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: "Calculation failed", error: err.message });
  }
});

// GET: Comparative Fiqh Topics
router.get("/fiqh/topics", async (req, res) => {
  const { category } = req.query;
  const query = db.select().from(fiqhTopicsTable);
  const topics = category && typeof category === "string"
    ? await query.where(eq(fiqhTopicsTable.category, category as any)).orderBy(asc(fiqhTopicsTable.sortOrder))
    : await query.orderBy(asc(fiqhTopicsTable.sortOrder));

  res.json({ topics, total: topics.length });
});

// POST: Add new Comparative Fiqh Topic (Admin only)
router.post("/fiqh/topics", requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  const { category, title, titleArabic, summary, hanafiView, shafiiView, malikiView, hanbaliView, dalil } = req.body;
  if (!category || !title || !summary || !hanafiView || !shafiiView) {
    res.status(400).json({ message: "category, title, summary, hanafiView, and shafiiView are required" });
    return;
  }

  const insertResult = await db.insert(fiqhTopicsTable).values({
    category,
    title,
    titleArabic,
    summary,
    hanafiView,
    shafiiView,
    malikiView: malikiView || "يتوافق مع الجمهور",
    hanbaliView: hanbaliView || "موافق للمعتمد في المذهب",
    dalil,
  });

  res.status(201).json({ success: true, message: "Fiqh topic added" });
});

export default router;
