import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";

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
      if (raw) setIndex(JSON.parse(raw));
    } catch {}
  }

  async function saveIndex(idx: Record<string, DownloadRecord>) {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(idx));
    setIndex(idx);
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
      setItemProgress(key, 0.05);
      const res = await fetch(`${BASE_URL}/api/hadith/collections/${collectionId}/download`);
      if (!res.ok) throw new Error("fetch failed");
      setItemProgress(key, 0.4);
      const data = await res.json();
      const json = JSON.stringify(data);
      setItemProgress(key, 0.8);
      const path = `${OFFLINE_DIR}${key}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      const info = await FileSystem.getInfoAsync(path) as any;
      setItemProgress(key, 1);
      setItemStatus(key, "done");
      const now = Date.now();
      const newIdx = {
        ...index,
        [key]: { key, type: "hadith_collection" as const, label, labelAr, sizeBytes: info.size ?? json.length, downloadedAt: index[key]?.downloadedAt ?? now, lastSynced: now },
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
      const res = await fetch(`${BASE_URL}/api/books/${bookId}/download`);
      if (!res.ok) throw new Error("fetch failed");
      setItemProgress(key, 0.5);
      const data = await res.json();
      const json = JSON.stringify(data);
      setItemProgress(key, 0.8);
      const path = `${OFFLINE_DIR}${key}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      const info = await FileSystem.getInfoAsync(path) as any;
      setItemProgress(key, 1);
      setItemStatus(key, "done");
      const now = Date.now();
      const newIdx = {
        ...index,
        [key]: { key, type: "islamic_book" as const, label, labelAr, sizeBytes: info.size ?? json.length, downloadedAt: index[key]?.downloadedAt ?? now, lastSynced: now },
      };
      await saveIndex(newIdx);
    } catch {
      setItemStatus(key, "error");
    }
  }, [index]);

  const syncItem = useCallback(async (key: string) => {
    const rec = index[key];
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
      const newIdx = { ...index, [key]: { ...rec, sizeBytes: info.size ?? json.length, lastSynced: now } };
      await saveIndex(newIdx);
    } catch {
      setItemStatus(key, "error");
    }
  }, [index]);

  const syncAllStale = useCallback(async (threshold = STALE_THRESHOLD_MS) => {
    const staleKeys = Object.keys(index).filter(key => {
      const rec = index[key];
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
    const newIdx = { ...index };
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

  function isDownloaded(key: string) { return key in index; }
  function isStale(key: string, threshold = STALE_THRESHOLD_MS) {
    const rec = index[key];
    if (!rec) return false;
    return Date.now() - (rec.lastSynced ?? rec.downloadedAt) > threshold;
  }
  function getStatus(key: string): DownloadStatus { return statuses[key] ?? (isDownloaded(key) ? "done" : "idle"); }
  function getProgress(key: string) { return progress[key] ?? 0; }
  function getSurahKey(n: number) { return `quran_surah_${n}`; }
  function getCollectionKey(id: string) { return `hadith_collection_${id}`; }
  function getBookKey(id: string) { return `islamic_book_${id}`; }
  function getSurahOffline<T>(n: number) { return readOfflineFile<T>(getSurahKey(n)); }
  function getHadithCollectionOffline<T>(id: string) { return readOfflineFile<T>(getCollectionKey(id)); }
  function getBookOffline<T>(id: string) { return readOfflineFile<T>(getBookKey(id)); }

  const staleCount = Object.keys(index).filter(k => isStale(k)).length;
  const totalBytes = Object.values(index).reduce((s, r) => s + (r.sizeBytes ?? 0), 0);
  const downloadedCount = Object.keys(index).length;

  return {
    index,
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
