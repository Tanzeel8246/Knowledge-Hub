import { Router } from "express";
import { db } from "@workspace/db";
import { hadithCollectionsTable, hadithBooksTable, hadithsTable } from "@workspace/db";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import {
  GetHadithBooksParams, GetHadithsParams, GetHadithsQueryParams,
  GetHadithParams, SearchHadithQueryParams
} from "@workspace/api-zod";

const router = Router();

router.get("/hadith/collections", async (_req, res) => {
  const collections = await db.select().from(hadithCollectionsTable);
  res.json(collections);
});

router.get("/hadith/collections/:collectionId/books", async (req, res) => {
  const parsed = GetHadithBooksParams.safeParse({ collectionId: req.params.collectionId });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }
  const books = await db.select().from(hadithBooksTable)
    .where(eq(hadithBooksTable.collectionId, parsed.data.collectionId))
    .orderBy(hadithBooksTable.bookNumber);
  res.json(books);
});

router.get("/hadith/collections/:collectionId/books/:bookNumber/hadiths", async (req, res) => {
  const pathParsed = GetHadithsParams.safeParse({
    collectionId: req.params.collectionId,
    bookNumber: Number(req.params.bookNumber),
  });
  const queryParsed = GetHadithsQueryParams.safeParse(req.query);
  if (!pathParsed.success || !queryParsed.success) {
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }
  const { collectionId, bookNumber } = pathParsed.data;
  const { page = 1, limit = 20 } = queryParsed.data;
  const offset = (page - 1) * limit;
  const hadiths = await db.select().from(hadithsTable)
    .where(and(eq(hadithsTable.collectionId, collectionId), eq(hadithsTable.bookNumber, bookNumber)))
    .limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(hadithsTable)
    .where(and(eq(hadithsTable.collectionId, collectionId), eq(hadithsTable.bookNumber, bookNumber)));
  const total = Number(count);
  res.json({ hadiths, total, page, totalPages: Math.ceil(total / limit) });
});

router.get("/hadith/search", async (req, res) => {
  const parsed = SearchHadithQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query parameters" });
    return;
  }
  const { q, collectionId, grade, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const searchTerm = `%${q}%`;

  const conditions = [or(ilike(hadithsTable.english, searchTerm), ilike(hadithsTable.arabic, searchTerm))];
  if (collectionId) conditions.push(eq(hadithsTable.collectionId, collectionId));
  if (grade && grade !== "all") conditions.push(ilike(hadithsTable.grade!, `%${grade}%`));

  const whereClause = and(...conditions);
  const results = await db.select().from(hadithsTable).where(whereClause).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(hadithsTable).where(whereClause);
  const total = Number(count);
  res.json({ results, total, page, totalPages: Math.ceil(total / limit) });
});

router.get("/hadith/:id", async (req, res) => {
  const parsed = GetHadithParams.safeParse({ id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid ID" });
    return;
  }
  const [hadith] = await db.select().from(hadithsTable).where(eq(hadithsTable.id, parsed.data.id)).limit(1);
  if (!hadith) {
    res.status(404).json({ message: "Hadith not found" });
    return;
  }
  res.json(hadith);
});

export default router;
