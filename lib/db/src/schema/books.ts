import { mysqlTable, text, varchar, int, boolean, index, timestamp } from "drizzle-orm/mysql-core";
import crypto from "crypto";

export const bookCategoriesTable = mysqlTable("book_categories", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  nameArabic: varchar("name_arabic", { length: 255 }),
  sortOrder: int("sort_order").notNull().default(0),
});

export const booksTable = mysqlTable("books", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  titleArabic: varchar("title_arabic", { length: 255 }),
  author: varchar("author", { length: 255 }).notNull(),
  authorArabic: varchar("author_arabic", { length: 255 }),
  categoryId: varchar("category_id", { length: 36 }).notNull().references(() => bookCategoriesTable.id),
  language: varchar("language", { length: 16 }).notNull().default("en"),
  description: text("description"),
  coverUrl: text("cover_url"),
  totalChapters: int("total_chapters").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
  publishedYear: int("published_year"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("books_category_idx").on(table.categoryId),
]);

export const bookChaptersTable = mysqlTable("book_chapters", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookId: varchar("book_id", { length: 36 }).notNull().references(() => booksTable.id, { onDelete: "cascade" }),
  chapterNumber: int("chapter_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  titleArabic: varchar("title_arabic", { length: 255 }),
  content: text("content").notNull(),
  contentArabic: text("content_arabic"),
}, (table) => [
  index("chapters_book_idx").on(table.bookId),
]);

export type BookCategory = typeof bookCategoriesTable.$inferSelect;
export type Book = typeof booksTable.$inferSelect;
export type BookChapter = typeof bookChaptersTable.$inferSelect;
