import { pgTable, text, integer, uuid, index } from "drizzle-orm/pg-core";

export const hadithCollectionsTable = pgTable("hadith_collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameArabic: text("name_arabic").notNull(),
  author: text("author").notNull(),
  totalHadiths: integer("total_hadiths").notNull().default(0),
  description: text("description"),
});

export const hadithBooksTable = pgTable("hadith_books", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionId: text("collection_id").notNull().references(() => hadithCollectionsTable.id),
  bookNumber: integer("book_number").notNull(),
  nameArabic: text("name_arabic").notNull(),
  nameEnglish: text("name_english").notNull(),
  totalHadiths: integer("total_hadiths").notNull().default(0),
}, (table) => [
  index("hadith_books_collection_idx").on(table.collectionId),
]);

export const hadithsTable = pgTable("hadiths", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionId: text("collection_id").notNull().references(() => hadithCollectionsTable.id),
  bookNumber: integer("book_number").notNull(),
  hadithNumber: integer("hadith_number").notNull(),
  arabic: text("arabic").notNull(),
  english: text("english").notNull(),
  urdu: text("urdu"),
  narrator: text("narrator"),
  grade: text("grade"),
  reference: text("reference").notNull(),
}, (table) => [
  index("hadiths_collection_book_idx").on(table.collectionId, table.bookNumber),
]);

export type HadithCollection = typeof hadithCollectionsTable.$inferSelect;
export type HadithBook = typeof hadithBooksTable.$inferSelect;
export type Hadith = typeof hadithsTable.$inferSelect;
