import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";

const OFFLINE_DIR = `${FileSystem.documentDirectory}offline/`;
const INDEX_KEY = "offline_index_v2";
const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export type DownloadItemType = "quran_surah" | "hadith_collection";
export type DownloadStatus = "idle" | "downloading" | "done" | "error";

export interface DownloadRecord {
  key: string;
  type: DownloadItemType;
  label: string;
  labelAr?: string;
  sizeBytes?: number;
  downloadedAt: number;
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
      setItemProgress(key, 0.1);
      const res = await fetch(`${BASE_URL}/api/quran/surahs/${surahNumber}`);
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
      const base = currentIndex ?? index;
      const newIdx = { ...base, [key]: { key, type: "quran_surah" as const, label, labelAr, sizeBytes: info.size ?? json.length, downloadedAt: Date.now() } };
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
      const newIdx = { ...index, [key]: { key, type: "hadith_collection" as const, label, labelAr, sizeBytes: info.size ?? json.length, downloadedAt: Date.now() } };
      await saveIndex(newIdx);
    } catch {
      setItemStatus(key, "error");
    }
  }, [index]);

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
  function getStatus(key: string): DownloadStatus { return statuses[key] ?? (isDownloaded(key) ? "done" : "idle"); }
  function getProgress(key: string) { return progress[key] ?? 0; }
  function getSurahKey(n: number) { return `quran_surah_${n}`; }
  function getCollectionKey(id: string) { return `hadith_collection_${id}`; }
  function getSurahOffline<T>(n: number) { return readOfflineFile<T>(getSurahKey(n)); }
  function getHadithCollectionOffline<T>(id: string) { return readOfflineFile<T>(getCollectionKey(id)); }

  const totalBytes = Object.values(index).reduce((s, r) => s + (r.sizeBytes ?? 0), 0);
  const downloadedCount = Object.keys(index).length;

  return {
    index,
    totalBytes,
    downloadedCount,
    downloadSurah,
    downloadHadithCollection,
    deleteDownload,
    getSurahOffline,
    getHadithCollectionOffline,
    isDownloaded,
    getStatus,
    getProgress,
    getSurahKey,
    getCollectionKey,
    reload: loadIndex,
  };
}
