import { Book, Chapter, BookCategory } from "./books/types";
import { SHAMELA_RAW_BOOKS } from "@/data/shamela/shamela_master_index";

export type { Book, Chapter, BookCategory };

export const FALLBACK_CATEGORIES: BookCategory[] = [
  { id: "tafsir", name: "Tafsir (تفسير القرآن)", nameArabic: "تفسير القرآن" },
  { id: "hadith", name: "Hadith (الحديث الشريف)", nameArabic: "الحديث الشريف" },
  { id: "fiqh", name: "Fiqh & Usul (الفقه وأصوله)", nameArabic: "الفقه وأصوله" },
  { id: "seerah", name: "Seerah (السيرة النبوية)", nameArabic: "السيرة النبوية" },
  { id: "aqeedah", name: "Aqeedah (العقيدة الإسلامية)", nameArabic: "العقيدة" },
  { id: "ethics", name: "Ethics & Tazkiyah (التزكية والأخلاق)", nameArabic: "التزكية" },
  { id: "duas", name: "Duas & Adhkar (الأدعية والأذكار)", nameArabic: "الأدعية" },
];

export const FALLBACK_BOOKS: Book[] = SHAMELA_RAW_BOOKS;
