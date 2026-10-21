import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Book, Chapter } from "@/constants/booksData";
import { HadithCollection, HadithBook, HadithItem } from "@/constants/hadithData";
import { FALLBACK_BOOKS } from "@/constants/booksData";
import { FALLBACK_HADITH_COLLECTIONS, FALLBACK_HADITH_BOOKS, FALLBACK_HADITHS } from "@/constants/hadithData";

const SHAMELA_DIR = `${FileSystem.documentDirectory}shamela_db/`;
const SHAMELA_INDEX_KEY = "shamela_master_index_v2";

export interface ShamelaRecord {
  id: string;
  type: "book" | "hadith_collection";
  title: string;
  titleArabic?: string;
  category?: string;
  author: string;
  itemCount: number; // chapters or hadiths
  sizeBytes: number;
  downloadedAt: number;
  lastUpdated: number;
}

export interface SearchSnippet {
  type: "book" | "hadith";
  sourceId: string; // bookId or collectionId
  sourceTitle: string;
  sourceTitleArabic?: string;
  sectionId?: string; // chapterId or bookNumber
  sectionNumber: number;
  sectionTitle: string;
  textSnippet: string;
  matchedWord: string;
  score: number;
}

// ============================================================================
// TEXT NORMALIZATION UTILS (Arabic & Urdu)
// ============================================================================

/** Strips Arabic tashkeel, standardizes alif, yaa, taa marbuta */
export function normalizeArabicText(text: string): string {
  if (!text) return "";
  return text
    // Remove Arabic diacritics / harakat (fathah, dhammah, kasrah, sukoon, shaddah, tanween)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Normalize alifs
    .replace(/[إأآٱ]/g, "ا")
    // Normalize taa marbuta
    .replace(/ة/g, "ه")
    // Normalize yaa & alif maqsurah
    .replace(/[ىي]/g, "ي")
    .toLowerCase()
    .trim();
}

/** Standardizes Urdu letters and removes unnecessary punctuation */
export function normalizeUrduText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ے/g, "ی")
    .replace(/ۂ/g, "ہ")
    .toLowerCase()
    .trim();
}

/** Prepares a text for tokenized search indexing */
export function extractSearchTokens(text: string): string[] {
  const norm = normalizeArabicText(normalizeUrduText(text));
  // Split on spaces and common punctuation
  return norm
    .split(/[\s,.;:!?«»()[\]{}—\-\n\r\t/\\"]+/)
    .map(t => t.trim())
    .filter(t => t.length > 1);
}

// ============================================================================
// SHAMELA STORAGE ENGINE
// ============================================================================

class ShamelaStorageEngine {
  private memoryIndex: Record<string, ShamelaRecord> = {};
  private memoryBookCache: Map<string, Book> = new Map();
  private memoryHadithCache: Map<string, {
    collection: HadithCollection;
    books: HadithBook[];
    hadiths: HadithItem[];
  }> = new Map();
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const dirInfo = await FileSystem.getInfoAsync(SHAMELA_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(SHAMELA_DIR, { intermediates: true });
      }

      const storedIndex = await AsyncStorage.getItem(SHAMELA_INDEX_KEY);
      if (storedIndex) {
        this.memoryIndex = JSON.parse(storedIndex);
      }
      this.initialized = true;
    } catch (e) {
      this.memoryIndex = {};
      this.initialized = true;
    }
  }

  private async persistIndex(): Promise<void> {
    try {
      await AsyncStorage.setItem(SHAMELA_INDEX_KEY, JSON.stringify(this.memoryIndex));
    } catch {}
  }

  // --------------------------------------------------------------------------
  // BOOKS METHODS
  // --------------------------------------------------------------------------

  async saveBook(book: Book): Promise<ShamelaRecord> {
    await this.init();
    this.memoryBookCache.set(book.id, book);
    const filePath = `${SHAMELA_DIR}book_${book.id}.json`;
    const jsonStr = JSON.stringify(book);

    await FileSystem.writeAsStringAsync(filePath, jsonStr, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const fileInfo = (await FileSystem.getInfoAsync(filePath)) as any;
    const now = Date.now();

    const record: ShamelaRecord = {
      id: book.id,
      type: "book",
      title: book.title,
      titleArabic: book.titleArabic,
      category: book.category,
      author: book.author,
      itemCount: book.chapters?.length ?? book.totalChapters,
      sizeBytes: fileInfo.size ?? jsonStr.length,
      downloadedAt: this.memoryIndex[book.id]?.downloadedAt ?? now,
      lastUpdated: now,
    };

    this.memoryIndex[book.id] = record;
    await this.persistIndex();
    return record;
  }

  async getBook(bookId: string): Promise<Book | null> {
    if (this.memoryBookCache.has(bookId)) {
      return this.memoryBookCache.get(bookId)!;
    }
    await this.init();
    try {
      const filePath = `${SHAMELA_DIR}book_${bookId}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        // Fallback to static catalog if pre-bundled
        const found = FALLBACK_BOOKS.find(b => b.id === bookId);
        if (found) this.memoryBookCache.set(bookId, found);
        return found ?? null;
      }

      const raw = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(raw) as Book;
      if (parsed) this.memoryBookCache.set(bookId, parsed);
      return parsed;
    } catch {
      const fb = FALLBACK_BOOKS.find(b => b.id === bookId) ?? null;
      if (fb) this.memoryBookCache.set(bookId, fb);
      return fb;
    }
  }

  async deleteBook(bookId: string): Promise<void> {
    await this.init();
    this.memoryBookCache.delete(bookId);
    try {
      const filePath = `${SHAMELA_DIR}book_${bookId}.json`;
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    } catch {}

    delete this.memoryIndex[bookId];
    await this.persistIndex();
  }

  isBookDownloaded(bookId: string): boolean {
    return !!this.memoryIndex[bookId] && this.memoryIndex[bookId].type === "book";
  }

  // --------------------------------------------------------------------------
  // HADITH COLLECTIONS METHODS
  // --------------------------------------------------------------------------

  async saveHadithCollection(
    collection: HadithCollection,
    books: HadithBook[],
    hadiths: HadithItem[]
  ): Promise<ShamelaRecord> {
    await this.init();
    const payload = { collection, books, hadiths };
    this.memoryHadithCache.set(collection.id, payload);
    const filePath = `${SHAMELA_DIR}hadith_${collection.id}.json`;
    const jsonStr = JSON.stringify(payload);

    await FileSystem.writeAsStringAsync(filePath, jsonStr, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const fileInfo = (await FileSystem.getInfoAsync(filePath)) as any;
    const now = Date.now();

    const record: ShamelaRecord = {
      id: collection.id,
      type: "hadith_collection",
      title: collection.name,
      titleArabic: collection.nameArabic,
      author: collection.author,
      itemCount: hadiths.length > 0 ? hadiths.length : collection.totalHadiths,
      sizeBytes: fileInfo.size ?? jsonStr.length,
      downloadedAt: this.memoryIndex[collection.id]?.downloadedAt ?? now,
      lastUpdated: now,
    };

    this.memoryIndex[collection.id] = record;
    await this.persistIndex();
    return record;
  }

  async getHadithCollection(collectionId: string): Promise<{
    collection: HadithCollection;
    books: HadithBook[];
    hadiths: HadithItem[];
  } | null> {
    if (this.memoryHadithCache.has(collectionId)) {
      return this.memoryHadithCache.get(collectionId)!;
    }
    await this.init();
    try {
      const filePath = `${SHAMELA_DIR}hadith_${collectionId}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        const fallbackCol = FALLBACK_HADITH_COLLECTIONS.find(c => c.id === collectionId);
        if (!fallbackCol) return null;
        const b = FALLBACK_HADITH_BOOKS[collectionId] ?? [];
        const hObj = FALLBACK_HADITHS[collectionId] ?? {};
        const hList: HadithItem[] = Object.values(hObj).flat();
        const res = {
          collection: fallbackCol,
          books: b,
          hadiths: hList,
        };
        this.memoryHadithCache.set(collectionId, res);
        return res;
      }

      const raw = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(raw);
      if (parsed) this.memoryHadithCache.set(collectionId, parsed);
      return parsed;
    } catch {
      const fallbackCol = FALLBACK_HADITH_COLLECTIONS.find(c => c.id === collectionId);
      if (!fallbackCol) return null;
      const b = FALLBACK_HADITH_BOOKS[collectionId] ?? [];
      const hObj = FALLBACK_HADITHS[collectionId] ?? {};
      const hList: HadithItem[] = Object.values(hObj).flat();
      const res = {
        collection: fallbackCol,
        books: b,
        hadiths: hList,
      };
      this.memoryHadithCache.set(collectionId, res);
      return res;
    }
  }

  async appendHadithsToCollection(
    collectionId: string,
    newHadiths: HadithItem[],
    newBooks?: HadithBook[]
  ): Promise<void> {
    await this.init();
    let existing = await this.getHadithCollection(collectionId);
    if (!existing) {
      const fallbackCol = FALLBACK_HADITH_COLLECTIONS.find(c => c.id === collectionId);
      if (!fallbackCol) return;
      existing = {
        collection: fallbackCol,
        books: newBooks ?? [],
        hadiths: [],
      };
    }
    // Merge books
    if (newBooks && newBooks.length > 0) {
      const bMap = new Map<number, HadithBook>();
      for (const b of existing.books) bMap.set(b.bookNumber, b);
      for (const b of newBooks) bMap.set(b.bookNumber, b);
      existing.books = Array.from(bMap.values()).sort((a, b) => a.bookNumber - b.bookNumber);
    }
    // Merge hadiths by unique key bookNumber_hadithNumber
    const hMap = new Map<string, HadithItem>();
    for (const h of existing.hadiths) hMap.set(`${h.bookNumber}_${h.hadithNumber}`, h);
    for (const h of newHadiths) hMap.set(`${h.bookNumber}_${h.hadithNumber}`, h);
    existing.hadiths = Array.from(hMap.values()).sort((a, b) => {
      if (a.bookNumber !== b.bookNumber) return a.bookNumber - b.bookNumber;
      return a.hadithNumber - b.hadithNumber;
    });
    await this.saveHadithCollection(existing.collection, existing.books, existing.hadiths);
  }

  async deleteHadithCollection(collectionId: string): Promise<void> {
    await this.init();
    this.memoryHadithCache.delete(collectionId);
    try {
      const filePath = `${SHAMELA_DIR}hadith_${collectionId}.json`;
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    } catch {}

    delete this.memoryIndex[collectionId];
    await this.persistIndex();
  }

  isHadithCollectionDownloaded(collectionId: string): boolean {
    return !!this.memoryIndex[collectionId] && this.memoryIndex[collectionId].type === "hadith_collection";
  }

  // --------------------------------------------------------------------------
  // MAKTABA SHAMELA CROSS-DATABASE SEARCH ENGINE
  // --------------------------------------------------------------------------

  /**
   * High-speed, offline full-text search across all downloaded or available books and hadiths.
   * Matches keywords in Arabic, Urdu, and English with snippet generation and ranking.
   */
  async searchAcrossLibrary(
    query: string,
    options?: {
      category?: string;
      bookId?: string;
      collectionId?: string;
      scope?: "all" | "books" | "hadith";
      maxResults?: number;
    }
  ): Promise<SearchSnippet[]> {
    await this.init();
    const cleanQuery = query.trim();
    if (!cleanQuery || cleanQuery.length < 2) return [];

    const normQuery = normalizeArabicText(normalizeUrduText(cleanQuery));
    const results: SearchSnippet[] = [];
    const maxResults = options?.maxResults ?? 50;
    const scope = options?.scope ?? "all";

    // 1. Search in Books (Classical Library)
    if (scope === "all" || scope === "books") {
      const booksToSearch: Book[] = [];

      // Check downloaded books first
      const downloadedBookIds = Object.keys(this.memoryIndex).filter(
        k => this.memoryIndex[k].type === "book"
      );

      for (const bId of downloadedBookIds) {
        if (options?.bookId && bId !== options.bookId) continue;
        const b = await this.getBook(bId);
        if (b && (!options?.category || b.category === options.category)) {
          booksToSearch.push(b);
        }
      }

      // Also include FALLBACK_BOOKS if not already added
      for (const fb of FALLBACK_BOOKS) {
        if (options?.bookId && fb.id !== options.bookId) continue;
        if (options?.category && fb.category !== options.category) continue;
        if (!booksToSearch.some(b => b.id === fb.id)) {
          booksToSearch.push(fb);
        }
      }

      for (const book of booksToSearch) {
        if (results.length >= maxResults) break;

        for (const chapter of book.chapters ?? []) {
          if (results.length >= maxResults) break;

          const titleNorm = normalizeArabicText(normalizeUrduText(chapter.title + " " + (chapter.titleArabic ?? "")));
          const content = chapter.content ?? "";
          const contentNorm = normalizeArabicText(normalizeUrduText(content));

          let matchIdx = contentNorm.indexOf(normQuery);
          let score = 0;

          if (titleNorm.includes(normQuery)) {
            score += 10;
          }

          if (matchIdx !== -1) {
            score += 5;

            // Generate contextual window snippet
            const start = Math.max(0, matchIdx - 45);
            const end = Math.min(content.length, matchIdx + normQuery.length + 75);
            const rawSnippet = content.slice(start, end).replace(/\n/g, " ").trim();
            const prefix = start > 0 ? "... " : "";
            const suffix = end < content.length ? " ..." : "";

            results.push({
              type: "book",
              sourceId: book.id,
              sourceTitle: book.title,
              sourceTitleArabic: book.titleArabic,
              sectionId: chapter.id,
              sectionNumber: chapter.chapterNumber,
              sectionTitle: chapter.title,
              textSnippet: `${prefix}${rawSnippet}${suffix}`,
              matchedWord: cleanQuery,
              score,
            });
          } else if (score > 0) {
            // Matched title only
            const startPreview = content.slice(0, 100).replace(/\n/g, " ").trim();
            results.push({
              type: "book",
              sourceId: book.id,
              sourceTitle: book.title,
              sourceTitleArabic: book.titleArabic,
              sectionId: chapter.id,
              sectionNumber: chapter.chapterNumber,
              sectionTitle: chapter.title,
              textSnippet: `${startPreview}...`,
              matchedWord: cleanQuery,
              score,
            });
          }
        }
      }
    }

    // 2. Search in Hadith Collections
    if (scope === "all" || scope === "hadith") {
      const colIds = Array.from(new Set([
        ...Object.keys(this.memoryIndex).filter(k => this.memoryIndex[k].type === "hadith_collection"),
        ...FALLBACK_HADITH_COLLECTIONS.map(c => c.id),
      ]));

      for (const cId of colIds) {
        if (results.length >= maxResults) break;
        if (options?.collectionId && cId !== options.collectionId) continue;

        const hadithData = await this.getHadithCollection(cId);
        if (!hadithData || !hadithData.hadiths) continue;

        for (const h of hadithData.hadiths) {
          if (results.length >= maxResults) break;

          const arNorm = normalizeArabicText(h.arabic ?? "");
          const urNorm = normalizeUrduText(h.urdu ?? "");
          const enNorm = (h.english ?? "").toLowerCase();

          const arMatch = arNorm.indexOf(normQuery);
          const urMatch = urNorm.indexOf(normQuery);
          const enMatch = enNorm.indexOf(normQuery);

          if (arMatch !== -1 || urMatch !== -1 || enMatch !== -1) {
            let snippet = "";
            if (urMatch !== -1 && h.urdu) {
              const start = Math.max(0, urMatch - 40);
              const end = Math.min(h.urdu.length, urMatch + normQuery.length + 70);
              snippet = (start > 0 ? "..." : "") + h.urdu.slice(start, end).replace(/\n/g, " ") + "...";
            } else if (arMatch !== -1 && h.arabic) {
              const start = Math.max(0, arMatch - 40);
              const end = Math.min(h.arabic.length, arMatch + normQuery.length + 70);
              snippet = (start > 0 ? "..." : "") + h.arabic.slice(start, end).replace(/\n/g, " ") + "...";
            } else if (h.english) {
              const start = Math.max(0, enMatch - 40);
              const end = Math.min(h.english.length, enMatch + normQuery.length + 70);
              snippet = (start > 0 ? "..." : "") + h.english.slice(start, end).replace(/\n/g, " ") + "...";
            }

            results.push({
              type: "hadith",
              sourceId: h.collectionId,
              sourceTitle: hadithData.collection.name,
              sourceTitleArabic: hadithData.collection.nameArabic,
              sectionId: String(h.bookNumber),
              sectionNumber: h.hadithNumber,
              sectionTitle: `Hadith #${h.hadithNumber} (${h.narrator ?? "المتن"})`,
              textSnippet: snippet,
              matchedWord: cleanQuery,
              score: 5,
            });
          }
        }
      }
    }

    // Sort descending by relevance score
    return results.sort((a, b) => b.score - a.score);
  }

  // --------------------------------------------------------------------------
  // STATS & DIAGNOSTICS
  // --------------------------------------------------------------------------

  getAllRecords(): ShamelaRecord[] {
    return Object.values(this.memoryIndex);
  }

  async getStorageStats(): Promise<{
    totalItems: number;
    totalBooks: number;
    totalHadiths: number;
    totalBytes: number;
    storagePath: string;
  }> {
    await this.init();
    const records = Object.values(this.memoryIndex);
    let totalBytes = 0;
    let totalBooks = 0;
    let totalHadiths = 0;

    for (const r of records) {
      totalBytes += r.sizeBytes;
      if (r.type === "book") totalBooks++;
      if (r.type === "hadith_collection") totalHadiths++;
    }

    return {
      totalItems: records.length,
      totalBooks,
      totalHadiths,
      totalBytes,
      storagePath: SHAMELA_DIR,
    };
  }

  // --------------------------------------------------------------------------
  // SQLITE DATABASE EXPORT & SCHEMA HELPERS
  // --------------------------------------------------------------------------

  generateSQLiteSchema(): string {
    return [
      "-- ===================================================================",
      "-- MAKTABA SHAMELA & ISLAMIC RESEARCH DATABASE SCHEMA (SQLITE / FTS5)",
      "-- ===================================================================",
      "PRAGMA foreign_keys = ON;",
      "PRAGMA journal_mode = WAL;",
      "",
      "CREATE TABLE IF NOT EXISTS shamela_books (",
      "  id TEXT PRIMARY KEY,",
      "  shamela_id INTEGER,",
      "  title TEXT NOT NULL,",
      "  title_arabic TEXT,",
      "  author TEXT NOT NULL,",
      "  author_arabic TEXT,",
      "  category TEXT,",
      "  language TEXT,",
      "  description TEXT,",
      "  total_chapters INTEGER",
      ");",
      "",
      "CREATE TABLE IF NOT EXISTS shamela_chapters (",
      "  id TEXT PRIMARY KEY,",
      "  book_id TEXT NOT NULL,",
      "  chapter_number INTEGER NOT NULL,",
      "  title TEXT NOT NULL,",
      "  title_arabic TEXT,",
      "  content TEXT NOT NULL,",
      "  content_arabic TEXT,",
      "  FOREIGN KEY (book_id) REFERENCES shamela_books(id) ON DELETE CASCADE",
      ");",
      "",
      "CREATE TABLE IF NOT EXISTS shamela_hadith_collections (",
      "  id TEXT PRIMARY KEY,",
      "  name TEXT NOT NULL,",
      "  name_arabic TEXT,",
      "  author TEXT NOT NULL,",
      "  total_hadiths INTEGER,",
      "  total_books INTEGER,",
      "  description TEXT",
      ");",
      "",
      "CREATE TABLE IF NOT EXISTS shamela_hadiths (",
      "  id TEXT PRIMARY KEY,",
      "  collection_id TEXT NOT NULL,",
      "  book_number INTEGER NOT NULL,",
      "  hadith_number INTEGER NOT NULL,",
      "  arabic TEXT NOT NULL,",
      "  english TEXT,",
      "  urdu TEXT,",
      "  narrator TEXT,",
      "  grade TEXT,",
      "  reference TEXT,",
      "  FOREIGN KEY (collection_id) REFERENCES shamela_hadith_collections(id) ON DELETE CASCADE",
      ");",
      "",
      "-- Full Text Search Index using FTS5 with diacritics removal",
      "CREATE VIRTUAL TABLE IF NOT EXISTS shamela_search_fts USING fts5(",
      "  content_type UNINDEXED,",
      "  source_id UNINDEXED,",
      "  item_id UNINDEXED,",
      "  title,",
      "  arabic_text,",
      "  urdu_text,",
      "  tokenize = 'unicode61 remove_diacritics 2'",
      ");",
      "",
      "CREATE INDEX IF NOT EXISTS idx_chapters_book ON shamela_chapters(book_id, chapter_number);",
      "CREATE INDEX IF NOT EXISTS idx_hadiths_collection ON shamela_hadiths(collection_id, book_number, hadith_number);",
    ].join("\n");
  }

  async exportLibraryToSQLiteSQL(): Promise<string> {
    await this.init();
    const lines: string[] = [
      this.generateSQLiteSchema(),
      "",
      "BEGIN TRANSACTION;",
    ];

    const escapeSQL = (val: any) => {
      if (val === undefined || val === null) return "NULL";
      return `'${String(val).replace(/'/g, "''")}'`;
    };

    // 1. Export Books
    for (const b of FALLBACK_BOOKS) {
      lines.push(
        `INSERT OR REPLACE INTO shamela_books (id, shamela_id, title, title_arabic, author, author_arabic, category, language, description, total_chapters) VALUES (${escapeSQL(b.id)}, ${escapeSQL((b as any).shamelaId ?? null)}, ${escapeSQL(b.title)}, ${escapeSQL(b.titleArabic)}, ${escapeSQL(b.author)}, ${escapeSQL(b.authorArabic)}, ${escapeSQL(b.category)}, ${escapeSQL(b.language)}, ${escapeSQL(b.description)}, ${escapeSQL(b.chapters?.length ?? b.totalChapters)});`
      );

      for (const ch of b.chapters ?? []) {
        lines.push(
          `INSERT OR REPLACE INTO shamela_chapters (id, book_id, chapter_number, title, title_arabic, content, content_arabic) VALUES (${escapeSQL(ch.id)}, ${escapeSQL(b.id)}, ${ch.chapterNumber}, ${escapeSQL(ch.title)}, ${escapeSQL(ch.titleArabic)}, ${escapeSQL(ch.content)}, ${escapeSQL(ch.contentArabic)});`
        );
        lines.push(
          `INSERT INTO shamela_search_fts (content_type, source_id, item_id, title, arabic_text, urdu_text) VALUES ('book', ${escapeSQL(b.id)}, ${escapeSQL(ch.id)}, ${escapeSQL(ch.title)}, ${escapeSQL(ch.contentArabic ?? ch.content)}, ${escapeSQL(ch.content)});`
        );
      }
    }

    // 2. Export Hadith Collections
    for (const c of FALLBACK_HADITH_COLLECTIONS) {
      lines.push(
        `INSERT OR REPLACE INTO shamela_hadith_collections (id, name, name_arabic, author, total_hadiths, total_books, description) VALUES (${escapeSQL(c.id)}, ${escapeSQL(c.name)}, ${escapeSQL(c.nameArabic)}, ${escapeSQL(c.author)}, ${c.totalHadiths}, ${c.totalBooks ?? 0}, ${escapeSQL(c.description)});`
      );

      const hadithObj = FALLBACK_HADITHS[c.id] ?? {};
      for (const [, hList] of Object.entries(hadithObj)) {
        for (const h of hList) {
          lines.push(
            `INSERT OR REPLACE INTO shamela_hadiths (id, collection_id, book_number, hadith_number, arabic, english, urdu, narrator, grade, reference) VALUES (${escapeSQL(h.id)}, ${escapeSQL(h.collectionId)}, ${h.bookNumber}, ${h.hadithNumber}, ${escapeSQL(h.arabic)}, ${escapeSQL(h.english)}, ${escapeSQL(h.urdu)}, ${escapeSQL(h.narrator)}, ${escapeSQL(h.grade)}, ${escapeSQL(h.reference)});`
          );
          lines.push(
            `INSERT INTO shamela_search_fts (content_type, source_id, item_id, title, arabic_text, urdu_text) VALUES ('hadith', ${escapeSQL(c.id)}, ${escapeSQL(h.id)}, ${escapeSQL(c.name + ' ' + h.hadithNumber)}, ${escapeSQL(h.arabic)}, ${escapeSQL(h.urdu)});`
          );
        }
      }
    }

    lines.push("COMMIT;");
    return lines.join("\n");
  }

  async exportLibraryToJSON(): Promise<string> {
    await this.init();
    const data = {
      meta: {
        exportedAt: new Date().toISOString(),
        version: "3.2.0",
        format: "maktaba_shamela_unified_dataset",
        totalBooks: FALLBACK_BOOKS.length,
        totalCollections: FALLBACK_HADITH_COLLECTIONS.length,
      },
      books: FALLBACK_BOOKS,
      hadithCollections: FALLBACK_HADITH_COLLECTIONS.map(c => ({
        ...c,
        books: FALLBACK_HADITH_BOOKS[c.id] ?? [],
        hadiths: Object.values(FALLBACK_HADITHS[c.id] ?? {}).flat(),
      })),
    };
    return JSON.stringify(data, null, 2);
  }
}

export const shamelaStorage = new ShamelaStorageEngine();
