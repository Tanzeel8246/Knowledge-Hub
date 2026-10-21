import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";
import { shamelaStorage } from "@/lib/shamelaStorage";
import { FALLBACK_BOOKS, Book } from "@/constants/booksData";
import {
  FALLBACK_HADITH_COLLECTIONS,
  FALLBACK_HADITH_BOOKS,
  FALLBACK_HADITHS,
  HadithCollection,
  HadithBook,
  HadithItem,
} from "@/constants/hadithData";
import { fetchCollectionBooks, fetchHadithSection, fetchSurahTafsir } from "@/lib/openIslamicApi";

const OFFLINE_DIR = `${FileSystem.documentDirectory}offline/`;
export const INDEX_KEY = "offline_index_v2";
export const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export type DownloadItemType = "quran_surah" | "hadith_collection" | "islamic_book";
export type DownloadStatus = "idle" | "downloading" | "syncing" | "done" | "error";

export interface DownloadRecord {
  key: string;
  type: DownloadItemType;
  label: string;
  labelAr?: string;
  sizeBytes?: number;
  downloadedAt: number;
  lastSynced: number;
}

export function useOfflineDownload() {
  const [index, setIndex] = useState<Record<string, DownloadRecord>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [statuses, setStatuses] = useState<Record<string, DownloadStatus>>({});

  useEffect(() => { loadIndex(); }, []);

  async function loadIndex() {
    try {
      const raw = await AsyncStorage.getItem(INDEX_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setIndex(parsed);
          return;
        }
      }
      setIndex({});
    } catch {
      setIndex({});
    }
  }

  async function saveIndex(idx: Record<string, DownloadRecord>) {
    const safe = (idx && typeof idx === "object" && !Array.isArray(idx)) ? idx : {};
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(safe));
    setIndex(safe);
  }

  async function ensureDir() {
    const info = await FileSystem.getInfoAsync(OFFLINE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
    }
  }

  function setItemStatus(key: string, s: DownloadStatus) {
    setStatuses(p => ({ ...p, [key]: s }));
  }

  function setItemProgress(key: string, p: number) {
    setProgress(pr => ({ ...pr, [key]: p }));
  }

  const downloadSurah = useCallback(async (
    surahNumber: number,
    label: string,
    labelAr?: string,
    currentIndex?: Record<string, DownloadRecord>,
  ) => {
    const key = `quran_surah_${surahNumber}`;
    setItemStatus(key, "downloading");
    setItemProgress(key, 0);
    try {
      await ensureDir();
      let data: any = null;
      try {
        const res = await fetch(`${BASE_URL}/api/quran/surahs/${surahNumber}`);
        if (res.ok) data = await res.json();
      } catch {}

      if (!data) {
        // Fallback to open Quran API
        const publicRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,ur.jalandhry,en.sahih`);
        if (!publicRes.ok) throw new Error("fetch failed");
        const jsonCloud = await publicRes.json();
        const ar = jsonCloud.data[0];
        const ur = jsonCloud.data[1];
        const en = jsonCloud.data[2];
        data = {
          number: surahNumber,
          nameArabic: ar.name,
          nameTransliteration: ar.englishName,
          nameEnglish: ar.englishNameTranslation,
          revelationType: ar.revelationType,
          totalAyahs: ar.numberOfAyahs,
          ayahs: ar.ayahs.map((a: any, idx: number) => ({
            numberInSurah: a.numberInSurah,
            arabic: a.text,
            translationUr: ur.ayahs[idx]?.text ?? "",
            translationEn: en.ayahs[idx]?.text ?? "",
            juzNumber: a.juz,
            pageNumber: a.page,
          })),
        };
      }

      setItemProgress(key, 0.5);
      const json = JSON.stringify(data);
      setItemProgress(key, 0.8);
      const path = `${OFFLINE_DIR}${key}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      const info = await FileSystem.getInfoAsync(path) as any;
      setItemProgress(key, 1);
      setItemStatus(key, "done");
      const now = Date.now();
      const base = currentIndex ?? index;
      const newIdx = {
        ...base,
        [key]: { key, type: "quran_surah" as const, label, labelAr, sizeBytes: info.size ?? json.length, downloadedAt: base[key]?.downloadedAt ?? now, lastSynced: now },
      };
      await saveIndex(newIdx);
      return newIdx;
    } catch {
      setItemStatus(key, "error");
      return null;
    }
  }, [index]);

  const downloadHadithCollection = useCallback(async (
    collectionId: string,
    label: string,
    labelAr?: string,
  ) => {
    const key = `hadith_collection_${collectionId}`;
    setItemStatus(key, "downloading");
    setItemProgress(key, 0);
    try {
      await ensureDir();
      setItemProgress(key, 0.1);
      let data: any = null;

      try {
        const res = await fetch(`${BASE_URL}/api/hadith/collections/${collectionId}/download`);
        if (res.ok) data = await res.json();
      } catch {}

      if (!data || !data.collection) {
        // Option 1: Fetch authentic sections directly from Open Hadith CDN
        try {
          const cdnBooks = await fetchCollectionBooks(collectionId);
          if (cdnBooks.length > 0) {
            setItemProgress(key, 0.2);
            const batchHadiths: HadithItem[] = [];
            // Download top 8 core books with complete Arabic and Urdu text
            const booksToFetch = cdnBooks.slice(0, 8);
            for (let i = 0; i < booksToFetch.length; i++) {
              const b = booksToFetch[i];
              const sectionHadiths = await fetchHadithSection(collectionId, b.bookNumber);
              batchHadiths.push(...sectionHadiths);
              setItemProgress(key, 0.2 + (0.5 * (i + 1) / booksToFetch.length));
            }
            const fallbackCol = FALLBACK_HADITH_COLLECTIONS.find(c => c.id === collectionId);
            if (batchHadiths.length > 0) {
              data = {
                collection: fallbackCol ?? {
                  id: collectionId,
                  name: label,
                  nameArabic: labelAr,
                  author: "Classical Scholar",
                  totalHadiths: batchHadiths.length,
                  totalBooks: cdnBooks.length,
                },
                books: cdnBooks,
                hadiths: batchHadiths,
              };
            }
          }
        } catch {}

        if (!data || !data.collection) {
          // High-fidelity fallback from offline catalog
          const fallbackCol = FALLBACK_HADITH_COLLECTIONS.find(c => c.id === collectionId);
          const fallbackBooks = FALLBACK_HADITH_BOOKS[collectionId] ?? [];
          const fallbackHadithsMap = FALLBACK_HADITHS[collectionId] ?? {};
          const fallbackHadiths = Object.values(fallbackHadithsMap).flat();

          if (fallbackCol) {
            data = {
              collection: fallbackCol,
              books: fallbackBooks,
              hadiths: fallbackHadiths,
            };
          } else {
            throw new Error("Collection not found");
          }
        }
      }

      setItemProgress(key, 0.8);
      const json = JSON.stringify(data);
      setItemProgress(key, 0.9);
      const path = `${OFFLINE_DIR}${key}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      const info = (await FileSystem.getInfoAsync(path)) as any;

      // Index into Shamela local database engine
      await shamelaStorage.saveHadithCollection(data.collection, data.books ?? [], data.hadiths ?? []);

      setItemProgress(key, 1);
      setItemStatus(key, "done");
      const now = Date.now();
      const newIdx = {
        ...index,
        [key]: {
          key,
          type: "hadith_collection" as const,
          label,
          labelAr,
          sizeBytes: info.size ?? json.length,
          downloadedAt: index[key]?.downloadedAt ?? now,
          lastSynced: now,
        },
      };
      await saveIndex(newIdx);
    } catch {
      setItemStatus(key, "error");
    }
  }, [index]);

  const downloadBook = useCallback(async (
    bookId: string,
    label: string,
    labelAr?: string,
  ) => {
    const key = `islamic_book_${bookId}`;
    setItemStatus(key, "downloading");
    setItemProgress(key, 0);
    try {
      await ensureDir();
      setItemProgress(key, 0.1);
      let data: any = null;

      try {
        const res = await fetch(`${BASE_URL}/api/books/${bookId}/download`);
        if (res.ok) data = await res.json();
      } catch {}

      // Option 1: If downloading Tafsir al-Jalalayn, fetch live Tafsir data from AlQuran Cloud
      if (bookId === "tafsir-al-jalalayn" && (!data || !data.book)) {
        try {
          const fallbackBook = FALLBACK_BOOKS.find(b => b.id === bookId);
          if (fallbackBook) {
            const enrichedChapters = [...fallbackBook.chapters];
            for (let sNum = 1; sNum <= 4; sNum++) {
              const tafsirData = await fetchSurahTafsir(sNum, "ar.jalalayn");
              if (tafsirData && tafsirData.ayahs.length > 0) {
                const formatted = tafsirData.ayahs
                  .map(a => `**آية ${a.number}:** ${a.text}\n\n**تفسير الجلالين:**\n${a.tafsir}`)
                  .join("\n\n---\n\n");
                const chIdx = enrichedChapters.findIndex(c => c.chapterNumber === sNum);
                if (chIdx !== -1) {
                  enrichedChapters[chIdx] = {
                    ...enrichedChapters[chIdx],
                    content: formatted,
                  };
                }
              }
              setItemProgress(key, 0.1 + (0.15 * sNum));
            }
            data = {
              book: fallbackBook,
              chapters: enrichedChapters,
            };
          }
        } catch {}
      }

      if (!data || !data.book) {
        // High-fidelity fallback from offline catalog
        const fallbackBook = FALLBACK_BOOKS.find(b => b.id === bookId);
        if (fallbackBook) {
          data = {
            book: fallbackBook,
            chapters: fallbackBook.chapters,
          };
        } else {
          throw new Error("Book not found");
        }
      }

      setItemProgress(key, 0.5);
      const json = JSON.stringify(data);
      setItemProgress(key, 0.8);
      const path = `${OFFLINE_DIR}${key}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      const info = (await FileSystem.getInfoAsync(path)) as any;

      // Index into Shamela local database engine
      const fullBookObj: Book = {
        ...data.book,
        chapters: data.chapters ?? data.book.chapters ?? [],
      };
      await shamelaStorage.saveBook(fullBookObj);

      setItemProgress(key, 1);
      setItemStatus(key, "done");
      const now = Date.now();
      const newIdx = {
        ...index,
        [key]: {
          key,
          type: "islamic_book" as const,
          label,
          labelAr,
          sizeBytes: info.size ?? json.length,
          downloadedAt: index[key]?.downloadedAt ?? now,
          lastSynced: now,
        },
      };
      await saveIndex(newIdx);
    } catch {
      setItemStatus(key, "error");
    }
  }, [index]);

  const syncItem = useCallback(async (key: string) => {
    const safe = (index && typeof index === "object" && !Array.isArray(index)) ? index : {};
    const rec = safe[key];
    if (!rec) return;
    setItemStatus(key, "syncing");
    setItemProgress(key, 0);
    try {
      await ensureDir();
      let url = "";
      if (rec.type === "quran_surah") {
        const num = key.replace("quran_surah_", "");
        url = `${BASE_URL}/api/quran/surahs/${num}`;
      } else if (rec.type === "hadith_collection") {
        const id = key.replace("hadith_collection_", "");
        url = `${BASE_URL}/api/hadith/collections/${id}/download`;
      } else if (rec.type === "islamic_book") {
        const id = key.replace("islamic_book_", "");
        url = `${BASE_URL}/api/books/${id}/download`;
      }
      setItemProgress(key, 0.2);
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      setItemProgress(key, 0.6);
      const data = await res.json();
      const json = JSON.stringify(data);
      setItemProgress(key, 0.9);
      const path = `${OFFLINE_DIR}${key}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      const info = await FileSystem.getInfoAsync(path) as any;
      setItemProgress(key, 1);
      setItemStatus(key, "done");
      const now = Date.now();
      const newIdx = { ...safe, [key]: { ...rec, sizeBytes: info.size ?? json.length, lastSynced: now } };
      await saveIndex(newIdx);
    } catch {
      setItemStatus(key, "error");
    }
  }, [index]);

  const syncAllStale = useCallback(async (threshold = STALE_THRESHOLD_MS) => {
    const safe = (index && typeof index === "object" && !Array.isArray(index)) ? index : {};
    const staleKeys = Object.keys(safe).filter(key => {
      const rec = safe[key];
      const lastSynced = rec.lastSynced ?? rec.downloadedAt;
      return Date.now() - lastSynced > threshold;
    });
    for (const key of staleKeys) {
      await syncItem(key);
    }
    return staleKeys.length;
  }, [index, syncItem]);

  const deleteDownload = useCallback(async (key: string) => {
    try {
      await FileSystem.deleteAsync(`${OFFLINE_DIR}${key}.json`, { idempotent: true });
    } catch {}

    if (key.startsWith("islamic_book_")) {
      const bId = key.replace("islamic_book_", "");
      await shamelaStorage.deleteBook(bId);
    } else if (key.startsWith("hadith_collection_")) {
      const cId = key.replace("hadith_collection_", "");
      await shamelaStorage.deleteHadithCollection(cId);
    }

    const safe = (index && typeof index === "object" && !Array.isArray(index)) ? index : {};
    const newIdx = { ...safe };
    delete newIdx[key];
    await saveIndex(newIdx);
    setItemStatus(key, "idle");
    setItemProgress(key, 0);
  }, [index]);

  async function readOfflineFile<T>(key: string): Promise<T | null> {
    try {
      const path = `${OFFLINE_DIR}${key}.json`;
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return null;
      const raw = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  const safeIndex = (index && typeof index === "object" && !Array.isArray(index)) ? index : {};

  function isDownloaded(key: string) { return !!(safeIndex && key in safeIndex); }
  function isStale(key: string, threshold = STALE_THRESHOLD_MS) {
    const rec = safeIndex[key];
    if (!rec) return false;
    return Date.now() - (rec.lastSynced ?? rec.downloadedAt) > threshold;
  }
  function getStatus(key: string): DownloadStatus { return statuses[key] ?? (isDownloaded(key) ? "done" : "idle"); }
  function getProgress(key: string) { return progress[key] ?? 0; }
  function getSurahKey(n: number) { return `quran_surah_${n}`; }
  function getCollectionKey(id: string) { return `hadith_collection_${id}`; }
  function getBookKey(id: string) { return `islamic_book_${id}`; }
  function getSurahOffline<T>(n: number) { return readOfflineFile<T>(getSurahKey(n)); }

  async function getHadithCollectionOffline<T>(id: string): Promise<T | null> {
    const fileData = await readOfflineFile<T>(getCollectionKey(id));
    if (fileData) return fileData;

    const shamelaData = await shamelaStorage.getHadithCollection(id);
    if (shamelaData) return shamelaData as unknown as T;

    const fallbackCol = FALLBACK_HADITH_COLLECTIONS.find(c => c.id === id);
    if (fallbackCol) {
      const fallbackBooks = FALLBACK_HADITH_BOOKS[id] ?? [];
      const fallbackHadithsMap = FALLBACK_HADITHS[id] ?? {};
      const fallbackHadiths = Object.values(fallbackHadithsMap).flat();
      return {
        collection: fallbackCol,
        books: fallbackBooks,
        hadiths: fallbackHadiths,
      } as unknown as T;
    }
    return null;
  }

  async function getBookOffline<T>(id: string): Promise<T | null> {
    const fileData = await readOfflineFile<T>(getBookKey(id));
    if (fileData) return fileData;

    const shamelaBook = await shamelaStorage.getBook(id);
    if (shamelaBook) {
      return {
        book: shamelaBook,
        chapters: shamelaBook.chapters,
      } as unknown as T;
    }

    const fallbackBook = FALLBACK_BOOKS.find(b => b.id === id);
    if (fallbackBook) {
      return {
        book: fallbackBook,
        chapters: fallbackBook.chapters,
      } as unknown as T;
    }
    return null;
  }

  const staleCount = Object.keys(safeIndex).filter(k => isStale(k)).length;
  const totalBytes = Object.values(safeIndex).reduce((s, r) => s + (r?.sizeBytes ?? 0), 0);
  const downloadedCount = Object.keys(safeIndex).length;

  return {
    index: safeIndex,
    totalBytes,
    downloadedCount,
    staleCount,
    downloadSurah,
    downloadHadithCollection,
    downloadBook,
    syncItem,
    syncAllStale,
    deleteDownload,
    getSurahOffline,
    getHadithCollectionOffline,
    getBookOffline,
    isDownloaded,
    isStale,
    getStatus,
    getProgress,
    getSurahKey,
    getCollectionKey,
    getBookKey,
    reload: loadIndex,
  };
}
