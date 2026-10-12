import { mysqlTable, text, varchar, int, timestamp, boolean, index } from "drizzle-orm/mysql-core";
import crypto from "crypto";

export const mosquesTable = mysqlTable("mosques", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  arabicName: varchar("arabic_name", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull().default("Pakistan"),
  address: text("address").notNull(),
  latitude: varchar("latitude", { length: 30 }).notNull(),
  longitude: varchar("longitude", { length: 30 }).notNull(),
  contactNumber: varchar("50", { length: 50 }),
  capacity: int("capacity").default(500),
  hasWuduArea: boolean("has_wudu_area").notNull().default(true),
  hasLadiesArea: boolean("has_ladies_area").notNull().default(false),
  hasWheelchairAccess: boolean("has_wheelchair_access").notNull().default(true),
  fajrJamaat: varchar("fajr_jamaat", { length: 10 }).notNull().default("05:30"),
  dhuhrJamaat: varchar("dhuhr_jamaat", { length: 10 }).notNull().default("13:30"),
  asrJamaat: varchar("asr_jamaat", { length: 10 }).notNull().default("17:00"),
  maghribJamaat: varchar("maghrib_jamaat", { length: 10 }).notNull().default("18:45"),
  ishaJamaat: varchar("isha_jamaat", { length: 10 }).notNull().default("20:30"),
  jummahJamaat: varchar("jummah_jamaat", { length: 10 }).notNull().default("13:45"),
  imamName: varchar("imam_name", { length: 150 }),
  verified: boolean("verified").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("mosque_city_idx").on(table.city),
]);

export const kidsStoriesTable = mysqlTable("kids_stories", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  titleArabic: varchar("title_arabic", { length: 255 }),
  category: varchar("category", { length: 64 }).notNull(), // prophet_story, islamic_pillar, moral_etiquette, companions
  summary: text("summary").notNull(),
  arabicVerse: text("arabic_verse"),
  urduContent: text("urdu_content").notNull(),
  englishContent: text("english_content"),
  moralLesson: text("moral_lesson").notNull(),
  ageGroup: varchar("age_group", { length: 20 }).notNull().default("all"), // 4-7, 8-12, all
  icon: varchar("icon", { length: 50 }).notNull().default("book-open"),
  orderIndex: int("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("kids_story_category_idx").on(table.category),
]);
