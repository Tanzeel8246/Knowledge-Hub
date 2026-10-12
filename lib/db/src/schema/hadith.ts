import { mysqlTable, text, varchar, int, index } from "drizzle-orm/mysql-core";
import crypto from "crypto";

export const hadithCollectionsTable = mysqlTable("hadith_collections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameArabic: varchar("name_arabic", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  totalHadiths: int("total_hadiths").notNull().default(0),
  description: text("description"),
});

export const hadithBooksTable = mysqlTable("hadith_books", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  collectionId: varchar("collection_id", { length: 64 }).notNull().references(() => hadithCollectionsTable.id),
  bookNumber: int("book_number").notNull(),
  nameArabic: varchar("name_arabic", { length: 255 }).notNull(),
  nameEnglish: varchar("name_english", { length: 255 }).notNull(),
  totalHadiths: int("total_hadiths").notNull().default(0),
}, (table) => [
  index("hadith_books_collection_idx").on(table.collectionId),
]);

export const hadithsTable = mysqlTable("hadiths", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  collectionId: varchar("collection_id", { length: 64 }).notNull().references(() => hadithCollectionsTable.id),
  bookNumber: int("book_number").notNull(),
  hadithNumber: int("hadith_number").notNull(),
  arabic: text("arabic").notNull(),
  english: text("english").notNull(),
  urdu: text("urdu"),
  narrator: varchar("narrator", { length: 255 }),
  grade: varchar("grade", { length: 64 }),
  reference: varchar("reference", { length: 255 }).notNull(),
}, (table) => [
  index("hadiths_collection_book_idx").on(table.collectionId, table.bookNumber),
]);

export type HadithCollection = typeof hadithCollectionsTable.$inferSelect;
export type HadithBook = typeof hadithBooksTable.$inferSelect;
export type Hadith = typeof hadithsTable.$inferSelect;
