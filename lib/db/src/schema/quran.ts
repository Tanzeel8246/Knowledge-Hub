import { pgTable, text, integer, index, boolean } from "drizzle-orm/pg-core";

export const surahsTable = pgTable("surahs", {
  number: integer("number").primaryKey(),
  nameArabic: text("name_arabic").notNull(),
  nameTransliteration: text("name_transliteration").notNull(),
  nameEnglish: text("name_english").notNull(),
  totalAyahs: integer("total_ayahs").notNull(),
  revelationType: text("revelation_type", { enum: ["Meccan", "Medinan"] }).notNull(),
  juzStart: integer("juz_start").notNull(),
});

export const ayahsTable = pgTable("ayahs", {
  number: integer("number").primaryKey(),
  surahNumber: integer("surah_number").notNull().references(() => surahsTable.number),
  numberInSurah: integer("number_in_surah").notNull(),
  arabic: text("arabic").notNull(),
  translationEn: text("translation_en").notNull(),
  translationUr: text("translation_ur"),
  tafsirEn: text("tafsir_en"),
  tafsirUr: text("tafsir_ur"),
  tafsirAr: text("tafsir_ar"),
  juzNumber: integer("juz_number").notNull(),
  pageNumber: integer("page_number").notNull(),
  searchVectorEn: text("search_vector_en"),
}, (table) => [
  index("ayahs_surah_idx").on(table.surahNumber),
  index("ayahs_juz_idx").on(table.juzNumber),
]);

export type Surah = typeof surahsTable.$inferSelect;
export type Ayah = typeof ayahsTable.$inferSelect;
