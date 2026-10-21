/**
 * arabicSearch.ts
 *
 * Diacritic-tolerant, morphological normalization engine for Arabic & Urdu text.
 * Allows searching with or without Tashkeel (harakat), tanween, tatweel, and letter variations.
 */

// Regular expression to strip all Arabic diacritical marks (Tashkeel)
// Ranges: U+064B to U+065F (Fathatan, Dammatan, Kasratan, Fatha, Damma, Kasra, Shadda, Sukun)
// Plus Quranic annotation signs (U+0610-U+061A, U+06D6-U+06ED)
const TASHKEEL_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;

// Tatweel (Kashida)
const TATWEEL_REGEX = /\u0640/g;

/**
 * Normalizes an Arabic or Urdu string for search indexing and matching:
 * 1. Strips all diacritics / vowels (tashkeel, harakat).
 * 2. Unifies all Alef forms (أ, إ, آ, ٱ, ا -> ا).
 * 3. Unifies Teh Marbuta and Heh (ة -> ه).
 * 4. Unifies Alef Maqsura and Yeh (ى, ئ -> ي).
 * 5. Removes tatweel / kashida (_).
 * 6. Trims and collapses multiple whitespace characters.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return "";

  return text
    // Strip Tashkeel & Quranic marks
    .replace(TASHKEEL_REGEX, "")
    // Strip Tatweel
    .replace(TATWEEL_REGEX, "")
    // Normalize Alefs
    .replace(/[أإآٱ]/g, "ا")
    // Normalize Teh Marbuta to Heh
    .replace(/ة/g, "ه")
    // Normalize Alef Maqsura to Yeh
    .replace(/[ىئ]/g, "ي")
    // Normalize Persian/Urdu Kaf and Yeh
    .replace(/ك/g, "ک")
    .replace(/ي/g, "ی")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Checks if a target Arabic/Urdu text contains a search query,
 * ignoring all diacritics and letter variants.
 */
export function matchesArabicQuery(targetText: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!targetText) return false;

  const normalizedTarget = normalizeArabicText(targetText);
  const normalizedQuery = normalizeArabicText(query);

  return normalizedTarget.includes(normalizedQuery);
}

/**
 * Splits text into tokens and returns matches for highlighting
 */
export function findMatchRanges(text: string, query: string): { start: number; end: number }[] {
  if (!text || !query.trim()) return [];

  const normQuery = normalizeArabicText(query);
  if (!normQuery) return [];

  const results: { start: number; end: number }[] = [];
  const words = text.split(/\s+/);
  let currentIndex = 0;

  for (const word of words) {
    const wordStartIndex = text.indexOf(word, currentIndex);
    if (wordStartIndex !== -1) {
      if (normalizeArabicText(word).includes(normQuery)) {
        results.push({
          start: wordStartIndex,
          end: wordStartIndex + word.length,
        });
      }
      currentIndex = wordStartIndex + word.length;
    }
  }

  return results;
}
