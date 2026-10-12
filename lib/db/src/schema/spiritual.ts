import { mysqlTable, text, varchar, int, timestamp, boolean, index } from "drizzle-orm/mysql-core";
import crypto from "crypto";
import { usersTable } from "./users";

export const muhasabahLogsTable = mysqlTable("muhasabah_logs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  truthfulness: boolean("truthfulness").notNull().default(true),
  guardedTongue: boolean("guarded_tongue").notNull().default(true),
  loweredGaze: boolean("lowered_gaze").notNull().default(true),
  controlledAnger: boolean("controlled_anger").notNull().default(true),
  humility: boolean("humility").notNull().default(true),
  thankfulness: boolean("thankfulness").notNull().default(true),
  recitedQuran: boolean("recited_quran").notNull().default(true),
  soughtForgiveness: boolean("sought_forgiveness").notNull().default(true),
  daroodCount: int("darood_count").notNull().default(100),
  spiritualScore: int("spiritual_score").notNull().default(80),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("muhasabah_user_date_idx").on(table.userId, table.date),
]);

export const awradLibraryTable = mysqlTable("awrad_library", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  titleArabic: varchar("title_arabic", { length: 255 }),
  category: varchar("category", { length: 64 }).notNull(), // dalail_al_khayrat, hizb_al_bahr, qasida_burdah, munajat, darood
  author: varchar("author", { length: 255 }).notNull(),
  arabicText: text("arabic_text").notNull(),
  translationUr: text("translation_ur"),
  translationEn: text("translation_en"),
  benefits: text("benefits"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("awrad_category_idx").on(table.category),
]);

export type MuhasabahLog = typeof muhasabahLogsTable.$inferSelect;
export type AwradItem = typeof awradLibraryTable.$inferSelect;
