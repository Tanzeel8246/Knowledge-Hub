import { Router } from "express";
import { db } from "@workspace/db";
import { booksTable, bookCategoriesTable, bookChaptersTable } from "@workspace/db";
import { eq, ilike, or, sql, and } from "drizzle-orm";
import { GetBookParams, GetBookChaptersParams, GetBookChapterParams, GetBooksQueryParams, SearchBooksQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/books/categories", async (_req, res) => {
  const categories = await db.select({
    id: bookCategoriesTable.id,
    name: bookCategoriesTable.name,
    nameArabic: bookCategoriesTable.nameArabic,
    bookCount: sql<number>`count(${booksTable.id})`,
  }).from(bookCategoriesTable)
    .leftJoin(booksTable, eq(booksTable.categoryId, bookCategoriesTable.id))
    .groupBy(bookCategoriesTable.id, bookCategoriesTable.name, bookCategoriesTable.nameArabic)
    .orderBy(bookCategoriesTable.sortOrder);
  res.json(categories);
});

router.get("/books/search", async (req, res) => {
  const parsed = SearchBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query" });
    return;
  }
  const { q, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const searchTerm = `%${q}%`;
  const where = or(ilike(booksTable.title, searchTerm), ilike(booksTable.author, searchTerm));
  const results = await db.select().from(booksTable).where(where).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(booksTable).where(where);
  const total = Number(count);
  res.json({ results, total, page, totalPages: Math.ceil(total / limit) });
});

router.get("/books/:bookId/chapters", async (req, res) => {
  const parsed = GetBookChaptersParams.safeParse({ bookId: req.params.bookId });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid book ID" });
    return;
  }
  const chapters = await db.select({
    id: bookChaptersTable.id,
    bookId: bookChaptersTable.bookId,
    chapterNumber: bookChaptersTable.chapterNumber,
    title: bookChaptersTable.title,
    titleArabic: bookChaptersTable.titleArabic,
  }).from(bookChaptersTable)
    .where(eq(bookChaptersTable.bookId, parsed.data.bookId))
    .orderBy(bookChaptersTable.chapterNumber);
  res.json(chapters);
});

router.get("/books/:bookId/chapters/:chapterId", async (req, res) => {
  const parsed = GetBookChapterParams.safeParse({ bookId: req.params.bookId, chapterId: req.params.chapterId });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }
  const [chapter] = await db.select().from(bookChaptersTable)
    .where(and(eq(bookChaptersTable.id, parsed.data.chapterId), eq(bookChaptersTable.bookId, parsed.data.bookId)))
    .limit(1);
  if (!chapter) {
    res.status(404).json({ message: "Chapter not found" });
    return;
  }
  res.json(chapter);
});

router.get("/books/:bookId/download", async (req, res) => {
  const parsed = GetBookParams.safeParse({ bookId: req.params.bookId });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid book ID" });
    return;
  }
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, parsed.data.bookId)).limit(1);
  if (!book) {
    res.status(404).json({ message: "Book not found" });
    return;
  }
  const chapters = await db.select().from(bookChaptersTable)
    .where(eq(bookChaptersTable.bookId, book.id))
    .orderBy(bookChaptersTable.chapterNumber);
  res.json({ book, chapters });
});

router.get("/books/:bookId", async (req, res) => {
  const parsed = GetBookParams.safeParse({ bookId: req.params.bookId });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid book ID" });
    return;
  }
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, parsed.data.bookId)).limit(1);
  if (!book) {
    res.status(404).json({ message: "Book not found" });
    return;
  }
  const chapters = await db.select({
    id: bookChaptersTable.id,
    bookId: bookChaptersTable.bookId,
    chapterNumber: bookChaptersTable.chapterNumber,
    title: bookChaptersTable.title,
    titleArabic: bookChaptersTable.titleArabic,
  }).from(bookChaptersTable).where(eq(bookChaptersTable.bookId, book.id)).orderBy(bookChaptersTable.chapterNumber);
  res.json({ ...book, chapters });
});

router.get("/books", async (req, res) => {
  const parsed = GetBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query" });
    return;
  }
  const { category, language, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const conditions = [];
  if (category) conditions.push(eq(booksTable.categoryId, category));
  if (language) conditions.push(eq(booksTable.language, language));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const books = await db.select().from(booksTable).where(whereClause).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(booksTable).where(whereClause);
  const total = Number(count);
  res.json({ books, total, page, totalPages: Math.ceil(total / limit) });
});

export default router;
