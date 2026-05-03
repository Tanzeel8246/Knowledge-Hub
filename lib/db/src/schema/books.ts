import { pgTable, text, integer, uuid, boolean, index, timestamp } from "drizzle-orm/pg-core";

export const bookCategoriesTable = pgTable("book_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  nameArabic: text("name_arabic"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const booksTable = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  titleArabic: text("title_arabic"),
  author: text("author").notNull(),
  authorArabic: text("author_arabic"),
  categoryId: uuid("category_id").notNull().references(() => bookCategoriesTable.id),
  language: text("language").notNull().default("en"),
  description: text("description"),
  coverUrl: text("cover_url"),
  totalChapters: integer("total_chapters").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
  publishedYear: integer("published_year"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("books_category_idx").on(table.categoryId),
]);

export const bookChaptersTable = pgTable("book_chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").notNull().references(() => booksTable.id, { onDelete: "cascade" }),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  titleArabic: text("title_arabic"),
  content: text("content").notNull(),
  contentArabic: text("content_arabic"),
}, (table) => [
  index("chapters_book_idx").on(table.bookId),
]);

export type BookCategory = typeof bookCategoriesTable.$inferSelect;
export type Book = typeof booksTable.$inferSelect;
export type BookChapter = typeof bookChaptersTable.$inferSelect;
