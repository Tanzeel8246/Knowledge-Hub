import { Router } from "express";
import { db } from "@workspace/db";
import { surahsTable, ayahsTable } from "@workspace/db";
import { eq, ilike, or, sql } from "drizzle-orm";
import { GetSurahParams, GetAyahParams, SearchQuranQueryParams, GetJuzParams } from "@workspace/api-zod";

const router = Router();

router.get("/quran/surahs", async (_req, res) => {
  const surahs = await db.select().from(surahsTable).orderBy(surahsTable.number);
  res.json(surahs);
});

router.get("/quran/surahs/:surahNumber", async (req, res) => {
  const parsed = GetSurahParams.safeParse({ surahNumber: Number(req.params.surahNumber) });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid surah number" });
    return;
  }
  const { surahNumber } = parsed.data;
  const [surah] = await db.select().from(surahsTable).where(eq(surahsTable.number, surahNumber)).limit(1);
  if (!surah) {
    res.status(404).json({ message: "Surah not found" });
    return;
  }
  const ayahs = await db.select().from(ayahsTable).where(eq(ayahsTable.surahNumber, surahNumber)).orderBy(ayahsTable.numberInSurah);
  res.json({ ...surah, ayahs });
});

router.get("/quran/ayahs/:surahNumber/:ayahNumber", async (req, res) => {
  const parsed = GetAyahParams.safeParse({
    surahNumber: Number(req.params.surahNumber),
    ayahNumber: Number(req.params.ayahNumber),
  });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }
  const { surahNumber, ayahNumber } = parsed.data;
  const [ayah] = await db.select().from(ayahsTable)
    .where(sql`${ayahsTable.surahNumber} = ${surahNumber} AND ${ayahsTable.numberInSurah} = ${ayahNumber}`)
    .limit(1);
  if (!ayah) {
    res.status(404).json({ message: "Ayah not found" });
    return;
  }
  res.json(ayah);
});

router.get("/quran/search", async (req, res) => {
  const parsed = SearchQuranQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query parameters" });
    return;
  }
  const { q, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const searchTerm = `%${q}%`;
  const results = await db.select().from(ayahsTable)
    .where(or(ilike(ayahsTable.translationEn, searchTerm), ilike(ayahsTable.arabic, searchTerm)))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(ayahsTable)
    .where(or(ilike(ayahsTable.translationEn, searchTerm), ilike(ayahsTable.arabic, searchTerm)));
  const total = Number(count);
  res.json({ results, total, page, totalPages: Math.ceil(total / limit) });
});

router.get("/quran/juz/:juzNumber", async (req, res) => {
  const parsed = GetJuzParams.safeParse({ juzNumber: Number(req.params.juzNumber) });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid juz number" });
    return;
  }
  const ayahs = await db.select().from(ayahsTable).where(eq(ayahsTable.juzNumber, parsed.data.juzNumber)).orderBy(ayahsTable.number);
  res.json(ayahs);
});

export default router;
