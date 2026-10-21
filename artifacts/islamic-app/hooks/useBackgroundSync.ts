import { useEffect, useRef, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { INDEX_KEY, STALE_THRESHOLD_MS, DownloadRecord } from "./useOfflineDownload";

const OFFLINE_DIR = `${FileSystem.documentDirectory}offline/`;
const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const LAST_SYNC_KEY = "bg_last_sync_v1";
const MIN_SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour between auto-syncs

export interface SyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  lastSyncCount: number;
  syncNow: () => Promise<void>;
}

export function useBackgroundSync(): SyncState {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [lastSyncCount, setLastSyncCount] = useState(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const syncing = useRef(false);

  useEffect(() => {
    loadLastSync();
    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, []);

  async function loadLastSync() {
    try {
      const raw = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (raw) setLastSyncAt(Number(raw));
    } catch {}
  }

  async function handleAppStateChange(nextState: AppStateStatus) {
    const prev = appState.current;
    appState.current = nextState;
    if ((prev === "background" || prev === "inactive") && nextState === "active") {
      await runSync(false);
    }
  }

  const runSync = useCallback(async (force: boolean) => {
    if (syncing.current) return;

    // Throttle auto-syncs — skip if synced recently
    if (!force) {
      try {
        const raw = await AsyncStorage.getItem(LAST_SYNC_KEY);
        if (raw && Date.now() - Number(raw) < MIN_SYNC_INTERVAL_MS) return;
      } catch {}
    }

    try {
      syncing.current = true;
      setIsSyncing(true);

      const raw = await AsyncStorage.getItem(INDEX_KEY);
      if (!raw) return;

      let index: Record<string, DownloadRecord> = {};
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          index = parsed;
        }
      } catch {}
      const staleKeys = Object.keys(index).filter(key => {
        const rec = index[key];
        const lastSynced = rec.lastSynced ?? rec.downloadedAt;
        return Date.now() - lastSynced > STALE_THRESHOLD_MS;
      });

      if (staleKeys.length === 0) {
        const now = Date.now();
        await AsyncStorage.setItem(LAST_SYNC_KEY, String(now));
        setLastSyncAt(now);
        setLastSyncCount(0);
        return;
      }

      let synced = 0;
      const updatedIndex = { ...index };

      for (const key of staleKeys) {
        const rec = updatedIndex[key];
        try {
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
          if (!url) continue;

          const res = await fetch(url);
          if (!res.ok) continue;

          const data = await res.json();
          const json = JSON.stringify(data);
          const path = `${OFFLINE_DIR}${key}.json`;

          const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
          }

          await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
          const info = await FileSystem.getInfoAsync(path) as any;

          updatedIndex[key] = {
            ...rec,
            sizeBytes: info.size ?? json.length,
            lastSynced: Date.now(),
          };
          synced++;
        } catch {
          // Keep going — one failure shouldn't stop others
        }
      }

      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(updatedIndex));
      const now = Date.now();
      await AsyncStorage.setItem(LAST_SYNC_KEY, String(now));
      setLastSyncAt(now);
      setLastSyncCount(synced);
    } catch {
      // Silent failure — background sync should never crash the app
    } finally {
      syncing.current = false;
      setIsSyncing(false);
    }
  }, []);

  const syncNow = useCallback(() => runSync(true), [runSync]);

  return { isSyncing, lastSyncAt, lastSyncCount, syncNow };
}

export function formatTimeAgo(ts: number | null): string {
  if (!ts) return "Never";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
