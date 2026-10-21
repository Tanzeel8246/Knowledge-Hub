import { Book } from "@/constants/books/types";
import ilaAlSunanRaw from "./ila_al_sunan.json";
import tahawiRaw from "./sharh_maani_al_athar.json";
import { tafsirBooks } from "@/constants/books/tafsirBooks";
import { fiqhBooks } from "@/constants/books/fiqhBooks";
import { hadithBooks } from "@/constants/books/hadithBooks";
import { seerahBooks } from "@/constants/books/seerahBooks";
import { aqeedahBooks } from "@/constants/books/aqeedahBooks";
import { ethicsBooks } from "@/constants/books/ethicsBooks";
import { duasBooks } from "@/constants/books/duasBooks";

export const SHAMELA_RAW_BOOKS: Book[] = [
  (ilaAlSunanRaw as unknown as Book),
  (tahawiRaw as unknown as Book),
  ...tafsirBooks,
  ...fiqhBooks.filter(b => b.id !== "ila-al-sunan"), // replace with full 22-volume version
  ...hadithBooks,
  ...seerahBooks,
  ...aqeedahBooks,
  ...ethicsBooks,
  ...duasBooks,
];

/**
 * Returns a specific Maktaba Shamela book by ID
 */
export function getShamelaBookById(id: string): Book | undefined {
  return SHAMELA_RAW_BOOKS.find(b => b.id === id);
}

/**
 * Returns all Maktaba Shamela books
 */
export function getAllShamelaBooks(): Book[] {
  return SHAMELA_RAW_BOOKS;
}
