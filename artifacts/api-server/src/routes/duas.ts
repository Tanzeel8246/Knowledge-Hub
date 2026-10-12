import { Router } from "express";
import { db, duasTable } from "@workspace/db";
import { eq, and, sql, desc, asc, like } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET all Duas with optional category or search
router.get("/duas", async (req, res) => {
  const { category, search, limit = "50", offset = "0" } = req.query;
  const conditions = [];

  if (category && typeof category === "string") {
    conditions.push(eq(duasTable.category, category));
  }
  if (search && typeof search === "string") {
    conditions.push(
      sql`(${duasTable.title} LIKE ${`%${search}%`} OR ${duasTable.translation} LIKE ${`%${search}%`} OR ${duasTable.arabic} LIKE ${`%${search}%`})`
    );
  }

  const query = db.select().from(duasTable);
  const duas = conditions.length > 0
    ? await query.where(and(...conditions)).limit(Number(limit)).offset(Number(offset)).orderBy(asc(duasTable.sortOrder))
    : await query.limit(Number(limit)).offset(Number(offset)).orderBy(asc(duasTable.sortOrder));

  res.json({ duas, total: duas.length });
});

// GET categories summary
router.get("/duas/categories", async (_req, res) => {
  const categories = await db.select({
    category: duasTable.category,
    count: sql<number>`count(*)`,
  }).from(duasTable).groupBy(duasTable.category);

  res.json({ categories });
});

// POST new Dua (Admin only)
router.post("/duas", requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  const { category, title, titleArabic, arabic, transliteration, translation, translationUr, reference, benefits } = req.body;
  if (!category || !title || !arabic || !translation || !reference) {
    res.status(400).json({ message: "category, title, arabic, translation, and reference are required" });
    return;
  }

  const insertResult = await db.insert(duasTable).values({
    category,
    title,
    titleArabic,
    arabic,
    transliteration,
    translation,
    translationUr,
    reference,
    benefits,
  });

  const [created] = await db.select().from(duasTable).where(eq(duasTable.id, insertResult[0].insertId as any)).limit(1);
  res.status(201).json(created || { message: "Dua created" });
});

export default router;
