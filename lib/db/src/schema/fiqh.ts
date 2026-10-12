import { mysqlTable, text, varchar, int, timestamp, mysqlEnum, boolean, index } from "drizzle-orm/mysql-core";
import crypto from "crypto";

export const fiqhTopicsTable = mysqlTable("fiqh_topics", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: mysqlEnum("category", ["taharah", "salah", "sawm", "zakat", "hajj", "nikah", "muamalat", "inheritance"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  titleArabic: varchar("title_arabic", { length: 255 }),
  summary: text("summary").notNull(),
  hanafiView: text("hanafi_view").notNull(),
  shafiiView: text("shafii_view").notNull(),
  malikiView: text("maliki_view").notNull(),
  hanbaliView: text("hanbali_view").notNull(),
  dalil: text("dalil"), // Primary Quran/Sunnah evidence
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("fiqh_category_idx").on(table.category),
]);

export const inheritanceCalculationsTable = mysqlTable("inheritance_calculations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  deceasedGender: mysqlEnum("deceased_gender", ["male", "female"]).notNull(),
  totalEstate: text("total_estate").notNull(), // Amount in chosen currency
  currency: varchar("currency", { length: 16 }).notNull().default("USD"),
  sharesJson: text("shares_json").notNull(), // Detailed breakdown of each heir
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FiqhTopic = typeof fiqhTopicsTable.$inferSelect;
export type InheritanceCalculation = typeof inheritanceCalculationsTable.$inferSelect;
