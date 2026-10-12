import { mysqlTable, text, int, index, boolean } from "drizzle-orm/mysql-core";

export const surahsTable = mysqlTable("surahs", {
  number: int("number").primaryKey(),
  nameArabic: text("name_arabic").notNull(),
  nameTransliteration: text("name_transliteration").notNull(),
  nameEnglish: text("name_english").notNull(),
  totalAyahs: int("total_ayahs").notNull(),
  revelationType: text("revelation_type", { enum: ["Meccan", "Medinan"] }).notNull(),
  juzStart: int("juz_start").notNull(),
});

export const ayahsTable = mysqlTable("ayahs", {
  number: int("number").primaryKey(),
  surahNumber: int("surah_number").notNull().references(() => surahsTable.number),
  numberInSurah: int("number_in_surah").notNull(),
  arabic: text("arabic").notNull(),
  translationEn: text("translation_en").notNull(),
  translationUr: text("translation_ur"),
  tafsirEn: text("tafsir_en"),
  tafsirUr: text("tafsir_ur"),
  tafsirAr: text("tafsir_ar"),
  juzNumber: int("juz_number").notNull(),
  pageNumber: int("page_number").notNull(),
  searchVectorEn: text("search_vector_en"),
}, (table) => [
  index("ayahs_surah_idx").on(table.surahNumber),
  index("ayahs_juz_idx").on(table.juzNumber),
]);

export type Surah = typeof surahsTable.$inferSelect;
export type Ayah = typeof ayahsTable.$inferSelect;
