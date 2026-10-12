import { mysqlTable, text, varchar, int, boolean, timestamp, index } from "drizzle-orm/mysql-core";
import crypto from "crypto";

export const duasTable = mysqlTable("duas", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category", { length: 64 }).notNull(), // morning, evening, prayer, food, travel, distress, protection, forgiveness, sickness, hajj, etc.
  title: varchar("title", { length: 255 }).notNull(),
  titleArabic: varchar("title_arabic", { length: 255 }),
  arabic: text("arabic").notNull(),
  transliteration: text("transliteration"),
  translation: text("translation").notNull(),
  translationUr: text("translation_ur"),
  reference: varchar("reference", { length: 255 }).notNull(),
  audioUrl: text("audio_url"),
  benefits: text("benefits"),
  sortOrder: int("sort_order").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("duas_category_idx").on(table.category),
]);

export type Dua = typeof duasTable.$inferSelect;
