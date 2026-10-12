import { useState, useEffect, useCallback } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const PREF_KEY = "prayer_notification_prefs_v1";

export const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

export interface PrayerNotifPrefs {
  enabled: Record<PrayerKey, boolean>;
  minutesBefore: number;
  muezzin: string; // makkah, madinah, alaqsa, cairo, istanbul
  playAudioAzan: boolean;
}

const DEFAULT_PREFS: PrayerNotifPrefs = {
  enabled: {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  },
  minutesBefore: 10,
  muezzin: "makkah",
  playAudioAzan: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("prayer-alerts", {
    name: "Prayer Times & Adhan Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#0D9373",
    sound: "default",
  }).catch(() => {});
}

export function usePrayerNotifications() {
  const [prefs, setPrefs] = useState<PrayerNotifPrefs>(DEFAULT_PREFS);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrefs();
    checkPermission();
  }, []);

  async function loadPrefs() {
    try {
      const raw = await AsyncStorage.getItem(PREF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrefs({ ...DEFAULT_PREFS, ...parsed, enabled: { ...DEFAULT_PREFS.enabled, ...parsed.enabled } });
      }
    } catch {}
    setLoading(false);
  }

  async function savePrefs(p: PrayerNotifPrefs) {
    await AsyncStorage.setItem(PREF_KEY, JSON.stringify(p));
    setPrefs(p);
  }

  async function checkPermission() {
    if (Platform.OS === "web") return;
    const result = await Notifications.getPermissionsAsync() as any;
    setPermissionGranted(result.granted === true || result.status === "granted");
  }

  async function requestPermission(): Promise<boolean> {
    if (Platform.OS === "web") return false;
    const result = await Notifications.requestPermissionsAsync() as any;
    const granted = result.granted === true || result.status === "granted";
    setPermissionGranted(granted);
    return granted;
  }

  const togglePrayer = useCallback(async (key: PrayerKey): Promise<boolean> => {
    const wasEnabled = prefs.enabled[key];
    if (!wasEnabled && !permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    const updated: PrayerNotifPrefs = {
      ...prefs,
      enabled: { ...prefs.enabled, [key]: !wasEnabled },
    };
    await savePrefs(updated);
    return true;
  }, [prefs, permissionGranted]);

  const scheduleNotifications = useCallback(async (
    prayerTimes: Record<string, Date>,
    overridePrefs?: PrayerNotifPrefs,
  ) => {
    if (Platform.OS === "web") return;
    const p = overridePrefs ?? prefs;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const prayerLabels: Record<string, { name: string; arabic: string }> = {
      fajr: { name: "Fajr", arabic: "الفجر" },
      dhuhr: { name: "Dhuhr", arabic: "الظهر" },
      asr: { name: "Asr", arabic: "العصر" },
      maghrib: { name: "Maghrib", arabic: "المغرب" },
      isha: { name: "Isha", arabic: "العشاء" },
    };

    const now = new Date();
    for (const key of PRAYER_KEYS) {
      if (!p.enabled[key]) continue;
      const prayerTime = prayerTimes[key];
      if (!prayerTime) continue;

      const triggerTime = new Date(prayerTime.getTime() - p.minutesBefore * 60 * 1000);
      if (triggerTime <= now) continue;

      const label = prayerLabels[key];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🕌 ${label.name} Prayer — ${label.arabic}`,
          body: `${label.name} prayer begins in ${p.minutesBefore} minutes. Time to prepare for Salah.`,
          sound: true,
          channelId: "prayer-alerts",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTime,
        },
      });
    }
  }, [prefs]);

  const cancelAll = useCallback(async () => {
    if (Platform.OS === "web") return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  const setMuezzin = useCallback(async (muezzinId: string) => {
    const updated: PrayerNotifPrefs = { ...prefs, muezzin: muezzinId };
    await savePrefs(updated);
  }, [prefs]);

  const togglePlayAudioAzan = useCallback(async () => {
    const updated: PrayerNotifPrefs = { ...prefs, playAudioAzan: !prefs.playAudioAzan };
    await savePrefs(updated);
  }, [prefs]);

  const enabledCount = PRAYER_KEYS.filter(k => prefs.enabled[k]).length;

  return {
    prefs,
    permissionGranted,
    loading,
    enabledCount,
    togglePrayer,
    setMuezzin,
    togglePlayAudioAzan,
    scheduleNotifications,
    cancelAll,
    requestPermission,
  };
}
