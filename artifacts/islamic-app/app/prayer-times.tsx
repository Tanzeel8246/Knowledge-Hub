import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
  Switch,
  Share,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useColors } from "@/hooks/useColors";
import { usePrayerNotifications, PRAYER_KEYS, PrayerKey } from "@/hooks/usePrayerNotifications";
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, SunnahTimes } from "adhan";
import { Audio } from "expo-av";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrayerEntry {
  key: string;
  name: string;
  arabic: string;
  icon: string;
  time: Date;
}

interface CityResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

const PRAYER_META: Record<string, { name: string; urdu: string; arabic: string; icon: string; category?: "fard" | "nafl" | "sunnah"; notifKey?: PrayerKey }> = {
  sehri:      { name: "Sehri Ends", urdu: "سحر ختم", arabic: "نهاية السحور", icon: "moon", category: "sunnah" },
  fajr:       { name: "Fajr Adhan", urdu: "اذان فجر", arabic: "الفجر", icon: "sunrise", category: "fard", notifKey: "fajr" },
  sunrise:    { name: "Sunrise", urdu: "طلوع آفتاب", arabic: "الشروق", icon: "sun" },
  ishraq:     { name: "Ishraq", urdu: "اشراق", arabic: "الإشراق", icon: "sun", category: "nafl" },
  zawal:      { name: "Zawal / Nisf an-Nahar", urdu: "زوال آفتاب", arabic: "زوال الشمس", icon: "clock-outline" },
  dhuhr:      { name: "Dhuhr", urdu: "ظہر", arabic: "الظهر", icon: "sun", category: "fard", notifKey: "dhuhr" },
  asr_shafi:  { name: "Asr (Shafi/Jumhoor)", urdu: "عصر شافعی", arabic: "العصر (شافعي)", icon: "sunset", category: "fard" },
  asr_hanafi: { name: "Asr (Hanafi/Mithlayn)", urdu: "عصر حنفی", arabic: "العصر (حنفي)", icon: "sunset", category: "fard", notifKey: "asr" },
  maghrib:    { name: "Maghrib / Sunset", urdu: "غروب آفتاب / مغرب", arabic: "المغرب", icon: "sunset", category: "fard", notifKey: "maghrib" },
  isha:       { name: "Isha", urdu: "عشاء", arabic: "العشاء", icon: "moon", category: "fard", notifKey: "isha" },
};

const METHODS = [
  { id: "MuslimWorldLeague",     label: "Muslim World League"                       },
  { id: "Egyptian",             label: "Egyptian Authority"                         },
  { id: "Karachi",              label: "Univ. of Islamic Sciences, Karachi"         },
  { id: "UmmAlQura",            label: "Umm Al-Qura, Makkah"                       },
  { id: "Dubai",                label: "Dubai"                                      },
  { id: "MoonsightingCommittee",label: "Moonsighting Committee"                     },
  { id: "NorthAmerica",         label: "Islamic Society of North America"           },
  { id: "Kuwait",               label: "Kuwait"                                     },
  { id: "Qatar",                label: "Qatar"                                      },
  { id: "Singapore",            label: "Singapore"                                  },
  { id: "Turkey",               label: "Turkey"                                     },
  { id: "Tehran",               label: "Institute of Geophysics, Tehran"            },
];

export const MUEZZINS = [
  { id: "makkah", name: "Makkah Mukarramah", arabic: "المسجد الحرام بمكة", muezzin: "Sheikh Ali Mulla", audioUrl: "https://cdn.aladhan.com/audio/adhans/makkah.mp3" },
  { id: "madinah", name: "Madinah Munawwarah", arabic: "المسجد النبوي الشريف", muezzin: "Sheikh Essam Bukhari", audioUrl: "https://cdn.aladhan.com/audio/adhans/madina.mp3" },
  { id: "alaqsa", name: "Masjid al-Aqsa", arabic: "المسجد الأقصى المبارك", muezzin: "Qari Naji Qazzaz", audioUrl: "https://cdn.aladhan.com/audio/adhans/quds.mp3" },
  { id: "cairo", name: "Al-Azhar Cairo", arabic: "جامع الأزهر بالقاهرة", muezzin: "Sheikh Mustafa Ismail", audioUrl: "https://cdn.aladhan.com/audio/adhans/cairo.mp3" },
  { id: "istanbul", name: "Istanbul Turkey", arabic: "جامع السلطان أحمد", muezzin: "Ustad Hafiz Osman", audioUrl: "https://cdn.aladhan.com/audio/adhans/istanbul.mp3" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt12(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtShort(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Now";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function getIslamicDate(): string {
  try {
    return new Date().toLocaleDateString("en-US-u-ca-islamic", { year: "numeric", month: "long", day: "numeric" });
  } catch { return ""; }
}

interface DailyTimetableRow {
  date: Date;
  dateStr: string;
  islamicDateStr: string;
  sehri: Date;
  fajr: Date;
  sunrise: Date;
  ishraq: Date;
  zawal: Date;
  dhuhr: Date;
  asr_shafi: Date;
  asr_hanafi: Date;
  maghrib: Date;
  isha: Date;
}

function buildPrayerList(lat: number, lng: number, methodId: string, date?: Date): PrayerEntry[] {
  const coords = new Coordinates(lat, lng);
  const d = date ?? new Date();

  // Hanafi params for Asr (Mithlayn)
  const paramsHanafi = (CalculationMethod as any)[methodId]?.() ?? CalculationMethod.Karachi();
  paramsHanafi.madhab = Madhab.Hanafi;
  const ptHanafi = new PrayerTimes(coords, d, paramsHanafi);

  // Shafi params for Asr (Mithl-e-Awwal)
  const paramsShafi = (CalculationMethod as any)[methodId]?.() ?? CalculationMethod.Karachi();
  paramsShafi.madhab = Madhab.Shafi;
  const ptShafi = new PrayerTimes(coords, d, paramsShafi);

  // Exact astronomical calculations:
  // 1. وقت سحر: اذان فجر سے 1 منٹ پہلے (احتیاطی اختتام سحر)
  const sehriTime = new Date(ptHanafi.fajr.getTime() - 1 * 60 * 1000);

  // 2. اذان فجر: سحر کے 2 منٹ بعد (یعنی اصلی فجر سے 1 منٹ بعد یا اذان فجر وقت)
  const fajrAdhanTime = new Date(sehriTime.getTime() + 2 * 60 * 1000);

  // 3. طلوع آفتاب
  const sunriseTime = ptHanafi.sunrise;

  // 4. اشراق: طلوع آفتاب کے 15 منٹ بعد
  const ishraqTime = new Date(sunriseTime.getTime() + 15 * 60 * 1000);

  // 5. زوال / نصف النہار شرعی: ظہر کے وقت سے 5 منٹ قبل (مکروہ وقت استواء الشمس)
  const zawalTime = new Date(ptHanafi.dhuhr.getTime() - 5 * 60 * 1000);

  // 6. ظہر
  const dhuhrTime = ptHanafi.dhuhr;

  // 7. عصر شافعی
  const asrShafiTime = ptShafi.asr;

  // 8. عصر حنفی
  const asrHanafiTime = ptHanafi.asr;

  // 9. غروب آفتاب / مغرب
  const maghribTime = ptHanafi.maghrib;

  // 10. عشاء
  const ishaTime = ptHanafi.isha;

  return [
    { key: "sehri",      time: sehriTime,      ...PRAYER_META.sehri      },
    { key: "fajr",       time: fajrAdhanTime,  ...PRAYER_META.fajr       },
    { key: "sunrise",    time: sunriseTime,    ...PRAYER_META.sunrise    },
    { key: "ishraq",     time: ishraqTime,     ...PRAYER_META.ishraq     },
    { key: "zawal",      time: zawalTime,      ...PRAYER_META.zawal      },
    { key: "dhuhr",      time: dhuhrTime,      ...PRAYER_META.dhuhr      },
    { key: "asr_shafi",  time: asrShafiTime,   ...PRAYER_META.asr_shafi  },
    { key: "asr_hanafi", time: asrHanafiTime,  ...PRAYER_META.asr_hanafi },
    { key: "maghrib",    time: maghribTime,    ...PRAYER_META.maghrib    },
    { key: "isha",       time: ishaTime,       ...PRAYER_META.isha       },
  ];
}

function buildMultiDayTable(lat: number, lng: number, methodId: string, daysCount: number = 7): DailyTimetableRow[] {
  const today = new Date();
  return Array.from({ length: daysCount }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const list = buildPrayerList(lat, lng, methodId, d);
    const byKey: Record<string, Date> = {};
    list.forEach(p => { byKey[p.key] = p.time; });

    let islamicStr = "";
    try {
      islamicStr = d.toLocaleDateString("en-US-u-ca-islamic", { day: "numeric", month: "short" });
    } catch {}

    return {
      date: d,
      dateStr: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }),
      islamicDateStr: islamicStr,
      sehri: byKey.sehri,
      fajr: byKey.fajr,
      sunrise: byKey.sunrise,
      ishraq: byKey.ishraq,
      zawal: byKey.zawal,
      dhuhr: byKey.dhuhr,
      asr_shafi: byKey.asr_shafi,
      asr_hanafi: byKey.asr_hanafi,
      maghrib: byKey.maghrib,
      isha: byKey.isha,
    };
  });
}

const OFFLINE_CITIES: CityResult[] = [
  { id: 1, name: "Karachi", country: "Pakistan", admin1: "Sindh", latitude: 24.8607, longitude: 67.0011 },
  { id: 2, name: "Lahore", country: "Pakistan", admin1: "Punjab", latitude: 31.5204, longitude: 74.3587 },
  { id: 3, name: "Islamabad", country: "Pakistan", admin1: "Federal Capital", latitude: 33.6844, longitude: 73.0479 },
  { id: 4, name: "Rawalpindi", country: "Pakistan", admin1: "Punjab", latitude: 33.5651, longitude: 73.0169 },
  { id: 5, name: "Faisalabad", country: "Pakistan", admin1: "Punjab", latitude: 31.4504, longitude: 73.1350 },
  { id: 6, name: "Multan", country: "Pakistan", admin1: "Punjab", latitude: 30.1575, longitude: 71.5249 },
  { id: 7, name: "Peshawar", country: "Pakistan", admin1: "KPK", latitude: 34.0151, longitude: 71.5249 },
  { id: 8, name: "Quetta", country: "Pakistan", admin1: "Balochistan", latitude: 30.1798, longitude: 66.9750 },
  { id: 9, name: "Gujranwala", country: "Pakistan", admin1: "Punjab", latitude: 32.1877, longitude: 74.1945 },
  { id: 10, name: "Sialkot", country: "Pakistan", admin1: "Punjab", latitude: 32.4945, longitude: 74.5229 },
  { id: 11, name: "Hyderabad", country: "Pakistan", admin1: "Sindh", latitude: 25.3960, longitude: 68.3578 },
  { id: 12, name: "Bahawalpur", country: "Pakistan", admin1: "Punjab", latitude: 29.3544, longitude: 71.6911 },
  { id: 13, name: "Makkah", country: "Saudi Arabia", admin1: "Makkah Province", latitude: 21.4225, longitude: 39.8262 },
  { id: 14, name: "Madinah", country: "Saudi Arabia", admin1: "Al Madinah", latitude: 24.4672, longitude: 39.6108 },
  { id: 15, name: "Deoband", country: "India", admin1: "Uttar Pradesh", latitude: 29.6958, longitude: 77.6766 },
  { id: 16, name: "Delhi", country: "India", admin1: "Delhi", latitude: 28.7041, longitude: 77.1025 },
  { id: 17, name: "Dhaka", country: "Bangladesh", admin1: "Dhaka Division", latitude: 23.8103, longitude: 90.4125 },
  { id: 18, name: "Kabul", country: "Afghanistan", admin1: "Kabul", latitude: 34.5553, longitude: 69.2075 },
  { id: 19, name: "Istanbul", country: "Turkey", admin1: "Istanbul", latitude: 41.0082, longitude: 28.9784 },
  { id: 20, name: "London", country: "United Kingdom", admin1: "England", latitude: 51.5074, longitude: -0.1278 },
];

async function searchCities(query: string): Promise<CityResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  // Offline match first
  const offlineMatches = OFFLINE_CITIES.filter(
    c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q) || (c.admin1 && c.admin1.toLowerCase().includes(q))
  );

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const onlineResults: CityResult[] = data.results ?? [];
      // Combine unique
      const ids = new Set(onlineResults.map(r => r.name.toLowerCase()));
      const filteredOffline = offlineMatches.filter(o => !ids.has(o.name.toLowerCase()));
      return [...onlineResults, ...filteredOffline];
    }
  } catch {}

  return offlineMatches;
}

import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_LOCATION_STORAGE_KEY = "@user_last_saved_location_v2";

export default function PrayerTimesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const notif = usePrayerNotifications();

  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number; city: string; isAutoGps?: boolean } | null>(null);
  const [prayers, setPrayers] = useState<PrayerEntry[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerEntry | null>(null);
  const [countdown, setCountdown] = useState("");
  const [method, setMethod] = useState("Karachi");
  const [showMethods, setShowMethods] = useState(false);
  const [tab, setTab] = useState<"today" | "week" | "settings">("today");
  const [currentTime, setCurrentTime] = useState(new Date());

  // City search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setCityResults] = useState<CityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playingMuezzin, setPlayingMuezzin] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handlePlayPreview = async (m: typeof MUEZZINS[0]) => {
    try {
      if (playingMuezzin === m.id) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setPlayingMuezzin(null);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setPlayingMuezzin(m.id);
      const { sound } = await Audio.Sound.createAsync(
        { uri: m.audioUrl },
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingMuezzin(null);
          soundRef.current = null;
        }
      });
    } catch {
      setPlayingMuezzin(null);
      Alert.alert("Azan Audio", "Could not play audio right now. Please check your internet connection.");
    }
  };

  // Multi-Day Timetable state
  const [timetableDays, setTimetableDays] = useState<7 | 15 | 30>(7);
  const [multiDayData, setMultiDayData] = useState<DailyTimetableRow[]>([]);

  const updateNextPrayer = useCallback((list: PrayerEntry[]) => {
    const now = new Date();
    // Exclude sunrise, zawal, ishraq, and sehri from primary fard next countdown or choose next fard
    const fardKeys = ["fajr", "dhuhr", "asr_hanafi", "maghrib", "isha"];
    const nextFard = list.find(p => fardKeys.includes(p.key) && p.time > now) ?? list.find(p => p.time > now) ?? list[0];
    setNextPrayer(nextFard);
    const diff = nextFard.time.getTime() - now.getTime();
    setCountdown(formatCountdown(diff < 0 ? 0 : diff));
  }, []);

  const applyLocation = useCallback((lat: number, lng: number, city: string, chosenMethod?: string, isAutoGps: boolean = false) => {
    const m = chosenMethod ?? method;
    const list = buildPrayerList(lat, lng, m);
    setPrayers(list);
    updateNextPrayer(list);
    const locObj = { lat, lng, city, isAutoGps };
    setLocation(locObj);
    AsyncStorage.setItem(LAST_LOCATION_STORAGE_KEY, JSON.stringify(locObj)).catch(() => {});

    const multi = buildMultiDayTable(lat, lng, m, timetableDays);
    setMultiDayData(multi);

    // Schedule notifications for fard prayers
    const timesMap: Record<string, Date> = {};
    list.forEach(p => {
      if (p.key === "fajr") timesMap["fajr"] = p.time;
      if (p.key === "dhuhr") timesMap["dhuhr"] = p.time;
      if (p.key === "asr_hanafi") timesMap["asr"] = p.time;
      if (p.key === "maghrib") timesMap["maghrib"] = p.time;
      if (p.key === "isha") timesMap["isha"] = p.time;
    });
    notif.scheduleNotifications(timesMap);
  }, [method, updateNextPrayer, timetableDays, notif.scheduleNotifications]);

  const handleDaysChange = (days: 7 | 15 | 30) => {
    setTimetableDays(days);
    if (location) {
      const multi = buildMultiDayTable(location.lat, location.lng, method, days);
      setMultiDayData(multi);
    }
  };

  const handleExportText = async () => {
    if (!location || multiDayData.length === 0) return;
    const cityName = location.city;
    let exportText = `═══════════════════════════════════════════════\n`;
    exportText += `🕌 دائمی نقشہ اوقاتِ صلوٰۃ و سحر و افطار\n`;
    exportText += `📍 مقام: ${cityName}\n`;
    exportText += `📅 دورانیہ: ${timetableDays} یومیہ جدول\n`;
    exportText += `⚖️ فقہی ضابطہ: حنفی و شافعی (مستند فلکیاتی حساب)\n`;
    exportText += `═══════════════════════════════════════════════\n\n`;

    multiDayData.forEach((row, idx) => {
      exportText += `【${idx + 1}】 ${row.dateStr} (${row.islamicDateStr || "ہجری"})\n`;
      exportText += `• وقت سحر (اختتام): ${fmtShort(row.sehri)}\n`;
      exportText += `• اذان فجر: ${fmtShort(row.fajr)}\n`;
      exportText += `• طلوع آفتاب: ${fmtShort(row.sunrise)}\n`;
      exportText += `• اشراق (15 منٹ بعد): ${fmtShort(row.ishraq)}\n`;
      exportText += `• زوال (نصف النہار): ${fmtShort(row.zawal)}\n`;
      exportText += `• ظہر: ${fmtShort(row.dhuhr)}\n`;
      exportText += `• عصر شافعی: ${fmtShort(row.asr_shafi)}\n`;
      exportText += `• عصر حنفی: ${fmtShort(row.asr_hanafi)}\n`;
      exportText += `• غروب / مغرب: ${fmtShort(row.maghrib)}\n`;
      exportText += `• عشاء: ${fmtShort(row.isha)}\n`;
      exportText += `───────────────────────────────────────────────\n`;
    });

    exportText += `\nمحفوظ شدہ بذریعہ اسلامی ریسرچ و لرننگ OS`;

    try {
      if (Platform.OS === "web") {
        await Clipboard.setStringAsync(exportText);
        Alert.alert("کامیابی", "مکمل نقشہ اوقات صلوٰۃ کلپ بورڈ پر کاپی کر دیا گیا ہے!");
      } else {
        await Share.share({
          title: `نقشہ اوقات صلوٰۃ - ${cityName}`,
          message: exportText,
        });
      }
    } catch {
      await Clipboard.setStringAsync(exportText);
      Alert.alert("کاپی ہو گیا", "مکمل جدول کلپ بورڈ پر محفوظ ہو گیا ہے۔");
    }
  };

  const loadAutoLocation = useCallback(async (chosenMethod?: string) => {
    setLoading(true);
    let resolved = false;

    // 1. First try native device GPS
    try {
      if (Platform.OS !== "web") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          const cityParts = [geo?.district || geo?.subregion || geo?.city, geo?.region, geo?.country].filter(Boolean);
          const city = cityParts.join(", ") || "Current GPS Location";
          applyLocation(loc.coords.latitude, loc.coords.longitude, city, chosenMethod, true);
          resolved = true;
        }
      }
    } catch {
      // GPS permission denied or hardware timeout
    }

    // 2. If GPS not resolved, try IP-based geolocation fallback
    if (!resolved) {
      try {
        const ipRes = await fetch("https://ipapi.co/json/");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            const cityName = [ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(", ");
            applyLocation(parseFloat(ipData.latitude), parseFloat(ipData.longitude), cityName || "Detected Location", chosenMethod, true);
            resolved = true;
          }
        }
      } catch {
        // Network offline
      }
    }

    // 3. If still not resolved, check cached saved location
    if (!resolved) {
      try {
        const saved = await AsyncStorage.getItem(LAST_LOCATION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lng) {
            applyLocation(parsed.lat, parsed.lng, parsed.city, chosenMethod, parsed.isAutoGps);
            resolved = true;
          }
        }
      } catch {}
    }

    // 4. Ultimate offline default (Karachi / Pakistan default)
    if (!resolved) {
      applyLocation(24.8607, 67.0011, "Karachi, Pakistan (Default)", chosenMethod, false);
    }

    setLoading(false);
  }, [applyLocation]);

  useEffect(() => {
    // Check saved cache first for instant display without flash
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LAST_LOCATION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lng) {
            applyLocation(parsed.lat, parsed.lng, parsed.city, undefined, parsed.isAutoGps);
            setLoading(false);
          }
        }
      } catch {}
      // Then trigger fresh location update
      loadAutoLocation();
    })();
  }, []);

  // Countdown ticker
  useEffect(() => {
    if (prayers.length === 0) return;
    const id = setInterval(() => {
      setCurrentTime(new Date());
      updateNextPrayer(prayers);
    }, 1000);
    return () => clearInterval(id);
  }, [prayers, updateNextPrayer]);

  // City search debounce
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 2) { setCityResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchCities(q);
      setCityResults(results);
      setSearching(false);
    }, 400);
  };

  const handleSelectCity = (city: CityResult) => {
    const label = [city.name, city.admin1, city.country].filter(Boolean).join(", ");
    setShowSearch(false);
    setSearchQuery("");
    setCityResults([]);
    setLoading(true);
    applyLocation(city.latitude, city.longitude, label);
    setLoading(false);
  };

  const handleToggleNotif = async (key: PrayerKey) => {
    const ok = await notif.togglePrayer(key);
    if (!ok) Alert.alert("Permission Required", "Please allow notifications in your device settings to receive prayer alerts.");
    // Re-schedule with updated prefs
    if (location) {
      const timesMap: Record<string, Date> = {};
      prayers.forEach(p => { timesMap[p.key] = p.time; });
      await notif.scheduleNotifications(timesMap);
    }
  };

  const handleMethodChange = (id: string) => {
    setMethod(id);
    setShowMethods(false);
    if (location) applyLocation(location.lat, location.lng, location.city, id);
  };

  const s = makeStyles(colors);
  const islamicDate = getIslamicDate();
  const gregorianDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), backgroundColor: colors.navy }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Prayer Times</Text>
          <Text style={s.headerSubtitle}>مواقيت الصلاة</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSearch(v => !v)} style={s.headerBtn}>
          <Feather name="search" size={20} color="#FFFFFF90" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => loadAutoLocation()} style={s.headerBtn}>
          <Feather name="navigation" size={20} color="#FFFFFF90" />
        </TouchableOpacity>
      </View>

      {/* ── City Search Overlay ─────────────────────────────────────────── */}
      {showSearch && (
        <View style={[s.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[s.searchInput, { color: colors.foreground }]}
              placeholder="Search city worldwide…"
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setCityResults([]); }}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          {searching && <ActivityIndicator size="small" color={colors.primary} style={{ margin: 12 }} />}
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={i => String(i.id)}
              style={{ maxHeight: 260 }}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.cityResult, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectCity(item)}
                >
                  <MaterialCommunityIcons name="city-variant-outline" size={16} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cityName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[s.cityMeta, { color: colors.mutedForeground }]}>
                      {[item.admin1, item.country].filter(Boolean).join(", ")}
                    </Text>
                  </View>
                  <Text style={[s.cityCoord, { color: colors.mutedForeground }]}>
                    {item.latitude.toFixed(1)}°, {item.longitude.toFixed(1)}°
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <Text style={[s.noResults, { color: colors.mutedForeground }]}>No cities found</Text>
          )}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

        {/* ── Date + Location Banner ──────────────────────────────────────── */}
        <View style={[s.dateCard, { backgroundColor: colors.navy }]}>
          <Text style={s.islamicDate}>{islamicDate}</Text>
          <Text style={s.gregorianDate}>{gregorianDate}</Text>
          {location && (
            <TouchableOpacity style={s.locationRow} onPress={() => setShowSearch(true)}>
              <Feather name={location.isAutoGps ? "navigation" : "map-pin"} size={12} color={location.isAutoGps ? colors.gold : "#FFFFFF70"} />
              <Text style={s.locationText} numberOfLines={1}>{location.city}</Text>
              {location.isAutoGps && (
                <View style={{ backgroundColor: colors.gold + "30", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginLeft: 4 }}>
                  <Text style={{ fontSize: 9, color: colors.gold, fontWeight: "700" }}>GPS/Live</Text>
                </View>
              )}
              <Feather name="chevron-down" size={11} color="#FFFFFF50" />
            </TouchableOpacity>
          )}
          {notif.enabledCount > 0 && (
            <View style={s.notifBadge}>
              <Feather name="bell" size={11} color={colors.gold} />
              <Text style={[s.notifBadgeText, { color: colors.gold }]}>
                {notif.enabledCount} prayer{notif.enabledCount > 1 ? "s" : ""} — notifications on
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={{ padding: 60, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Getting prayer times…</Text>
          </View>
        ) : (
          <>
            {/* ── Next Prayer Card ──────────────────────────────────────── */}
            {nextPrayer && tab === "today" && (
              <View style={[s.nextCard, { backgroundColor: colors.primary }]}>
                <View>
                  <Text style={s.nextLabel}>Next Prayer</Text>
                  <Text style={s.nextName}>{nextPrayer.name}</Text>
                  <Text style={s.nextArabic}>{nextPrayer.arabic}</Text>
                </View>
                <View style={s.nextRight}>
                  <Text style={s.nextTime}>{fmt12(nextPrayer.time)}</Text>
                  <View style={[s.countdownBadge, { backgroundColor: "#FFFFFF25" }]}>
                    <Text style={s.countdownText}>{countdown}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── Tabs ────────────────────────────────────────────────────── */}
            <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
              {([
                { key: "today", label: "روزانہ کارڈز (Today)" },
                { key: "week", label: "تاریخ وار نقشہ (Timetable)" },
                { key: "settings", label: "نوٹیفکیشنز (Alerts)" },
              ] as const).map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.tab, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
                  onPress={() => setTab(t.key)}
                >
                  <Text style={[s.tabText, { color: tab === t.key ? colors.primary : colors.mutedForeground, fontWeight: tab === t.key ? "700" : "500" }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── TODAY TAB (10 INDIVIDUAL CARDS) ───────────────────────── */}
            {tab === "today" && (
              <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <Text style={[s.sectionNote, { color: colors.mutedForeground, marginBottom: 10 }]}>
                  آج کا مکمل فلکیاتی و شرعی جدول: سحر، فجر، اشراق، زوال، ظہر، عصرین (شافعی و حنفی)، غروب و عشاء
                </Text>
                {prayers.map(prayer => {
                  const isNext = nextPrayer?.key === prayer.key;
                  const isPast = prayer.time < currentTime;
                  const meta = PRAYER_META[prayer.key];
                  const notifKey = meta?.notifKey;
                  const notifOn = notifKey ? notif.prefs.enabled[notifKey] : false;

                  const getBadge = () => {
                    if (prayer.key === "sehri") return { label: "سنت / احتیاط", color: "#F59E0B" };
                    if (prayer.key === "ishraq") return { label: "نفل", color: "#10B981" };
                    if (prayer.key === "zawal") return { label: "مکروہ وقت", color: "#EF4444" };
                    if (prayer.key === "asr_shafi") return { label: "شافعی / جمہور", color: "#8B5CF6" };
                    if (prayer.key === "asr_hanafi") return { label: "حنفی (مثلین)", color: "#3B82F6" };
                    if (prayer.key === "sunrise" || prayer.key === "maghrib") return { label: "طلوع / غروب", color: "#D97706" };
                    return { label: "فرض", color: colors.primary };
                  };

                  const badge = getBadge();

                  return (
                    <View
                      key={prayer.key}
                      style={[s.prayerRow, {
                        backgroundColor: isNext ? colors.primary + "15" : colors.card,
                        borderColor: isNext ? colors.primary : colors.border,
                        borderWidth: isNext ? 2 : 1,
                      }]}
                    >
                      <View style={[s.prayerIcon, { backgroundColor: isNext ? colors.primary : colors.primary + "15" }]}>
                        <Feather name={prayer.icon as any} size={18} color={isNext ? "#FFF" : colors.primary} />
                      </View>
                      <View style={s.prayerInfo}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={[s.prayerName, { color: isNext ? colors.primary : colors.foreground, fontWeight: "700" }]}>
                            {meta?.urdu || prayer.name}
                          </Text>
                          <View style={{ backgroundColor: badge.color + "20", paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                            <Text style={{ fontSize: 10, color: badge.color, fontWeight: "700" }}>{badge.label}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>
                          {prayer.name} · {prayer.arabic}
                        </Text>
                      </View>
                      <View style={s.prayerRight}>
                        <Text style={[s.prayerTime, {
                          color: isPast ? colors.mutedForeground : (isNext ? colors.primary : colors.foreground),
                          opacity: isPast && !isNext ? 0.6 : 1,
                          fontSize: 17,
                        }]}>
                          {fmt12(prayer.time)}
                        </Text>
                        <View style={s.prayerActions}>
                          {isNext && <View style={[s.nextDot, { backgroundColor: colors.primary }]} />}
                          {isPast && !isNext && prayer.key !== "sunrise" && (
                            <Feather name="check" size={13} color={colors.mutedForeground} />
                          )}
                          {notifKey && (
                            <TouchableOpacity onPress={() => handleToggleNotif(notifKey)} style={s.bellBtn}>
                              <Feather
                                name={notifOn ? "bell" : "bell-off"}
                                size={15}
                                color={notifOn ? colors.gold : colors.mutedForeground}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Calculation Method */}
                <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>Calculation Method</Text>
                <TouchableOpacity
                  style={[s.methodBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setShowMethods(!showMethods)}
                >
                  <View style={s.methodBtnLeft}>
                    <Feather name="settings" size={16} color={colors.primary} />
                    <Text style={[s.methodBtnText, { color: colors.foreground }]}>
                      {METHODS.find(m => m.id === method)?.label ?? method}
                    </Text>
                  </View>
                  <Feather name={showMethods ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
                {showMethods && (
                  <View style={[s.methodList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {METHODS.map(m => (
                      <TouchableOpacity
                        key={m.id}
                        style={[s.methodOption, method === m.id && { backgroundColor: colors.primary + "12" }]}
                        onPress={() => handleMethodChange(m.id)}
                      >
                        <Text style={[s.methodOptionText, { color: method === m.id ? colors.primary : colors.foreground }]}>
                          {m.label}
                        </Text>
                        {method === m.id && <Feather name="check" size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── MULTI-DAY TIMETABLE & EXPORT TAB ───────────────────────── */}
            {tab === "week" && (
              <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                {/* Header Controls: Days selector & Export Button */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <View style={{ flexDirection: "row", backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 3 }}>
                    {([7, 15, 30] as const).map(d => (
                      <TouchableOpacity
                        key={d}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: timetableDays === d ? colors.primary : "transparent",
                        }}
                        onPress={() => handleDaysChange(d)}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "600", color: timetableDays === d ? "#FFF" : colors.mutedForeground }}>
                          {d} یوم ({d} Days)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.primary,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      gap: 6,
                    }}
                    onPress={handleExportText}
                  >
                    <Feather name="share-2" size={15} color="#FFF" />
                    <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "700" }}>ایکسپورٹ / شیئر</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[s.sectionNote, { color: colors.mutedForeground, marginBottom: 8 }]}>
                  {location?.city ?? "آپ کے مقام"} کا {timetableDays} یومیہ جدولِ اوقات (سحر، فجر، اشراق، زوال، ظہر، عصر شافعی، عصر حنفی، غروب، عشاء)
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                  <View>
                    {/* Table Header */}
                    <View style={[s.tableHeader, { backgroundColor: colors.navy }]}>
                      <View style={[s.tableDay, { width: 95 }]}><Text style={s.tableHeaderText}>تاریخ / دن</Text></View>
                      <View style={[s.tableCell, { width: 70 }]}><Text style={s.tableHeaderText}>وقتِ سحر</Text><Text style={s.tableHeaderAr}>ختم سحر</Text></View>
                      <View style={[s.tableCell, { width: 70 }]}><Text style={s.tableHeaderText}>اذان فجر</Text><Text style={s.tableHeaderAr}>الفجر</Text></View>
                      <View style={[s.tableCell, { width: 70 }]}><Text style={s.tableHeaderText}>طلوع آفتاب</Text><Text style={s.tableHeaderAr}>الشروق</Text></View>
                      <View style={[s.tableCell, { width: 70 }]}><Text style={s.tableHeaderText}>اشراق</Text><Text style={s.tableHeaderAr}>+15 منٹ</Text></View>
                      <View style={[s.tableCell, { width: 70 }]}><Text style={s.tableHeaderText}>نصف النہار</Text><Text style={s.tableHeaderAr}>زوال</Text></View>
                      <View style={[s.tableCell, { width: 70 }]}><Text style={s.tableHeaderText}>ظہر</Text><Text style={s.tableHeaderAr}>الظهر</Text></View>
                      <View style={[s.tableCell, { width: 75 }]}><Text style={s.tableHeaderText}>عصر شافعی</Text><Text style={s.tableHeaderAr}>مثل اول</Text></View>
                      <View style={[s.tableCell, { width: 75 }]}><Text style={s.tableHeaderText}>عصر حنفی</Text><Text style={s.tableHeaderAr}>مثلین</Text></View>
                      <View style={[s.tableCell, { width: 75 }]}><Text style={s.tableHeaderText}>غروب/مغرب</Text><Text style={s.tableHeaderAr}>المغرب</Text></View>
                      <View style={[s.tableCell, { width: 70 }]}><Text style={s.tableHeaderText}>عشاء</Text><Text style={s.tableHeaderAr}>العشاء</Text></View>
                    </View>

                    {/* Table Rows */}
                    {multiDayData.map((row, i) => {
                      const isToday = i === 0;
                      const isFriday = row.date.getDay() === 5;
                      return (
                        <View
                          key={i}
                          style={[s.tableRow, {
                            backgroundColor: isToday ? colors.primary + "15" : (i % 2 === 0 ? colors.card : colors.background),
                            borderLeftColor: isToday ? colors.primary : (isFriday ? colors.gold : "transparent"),
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          }]}
                        >
                          <View style={[s.tableDay, { width: 95 }]}>
                            <Text style={[s.tableDayName, {
                              color: isToday ? colors.primary : (isFriday ? colors.gold : colors.foreground),
                              fontFamily: isToday ? "Inter_700Bold" : "Inter_600SemiBold",
                              fontSize: 12,
                            }]}>
                              {isToday ? "آج (Today)" : DAY_NAMES[row.date.getDay()]}
                            </Text>
                            <Text style={[s.tableDayNum, { color: colors.mutedForeground, fontSize: 10 }]}>
                              {row.date.getDate()}/{row.date.getMonth() + 1} · {row.islamicDateStr}
                            </Text>
                            {isFriday && <Text style={[s.jumuahTag, { color: colors.gold, fontSize: 9 }]}>جمعۃ المبارک</Text>}
                          </View>

                          <View style={[s.tableCell, { width: 70 }]}><Text style={[s.tableCellText, { color: colors.foreground, fontSize: 12 }]}>{fmtShort(row.sehri)}</Text></View>
                          <View style={[s.tableCell, { width: 70 }]}><Text style={[s.tableCellText, { color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 12 }]}>{fmtShort(row.fajr)}</Text></View>
                          <View style={[s.tableCell, { width: 70 }]}><Text style={[s.tableCellText, { color: colors.mutedForeground, fontSize: 12 }]}>{fmtShort(row.sunrise)}</Text></View>
                          <View style={[s.tableCell, { width: 70 }]}><Text style={[s.tableCellText, { color: "#10B981", fontSize: 12 }]}>{fmtShort(row.ishraq)}</Text></View>
                          <View style={[s.tableCell, { width: 70 }]}><Text style={[s.tableCellText, { color: "#EF4444", fontSize: 12 }]}>{fmtShort(row.zawal)}</Text></View>
                          <View style={[s.tableCell, { width: 70 }]}><Text style={[s.tableCellText, { color: colors.foreground, fontSize: 12 }]}>{fmtShort(row.dhuhr)}</Text></View>
                          <View style={[s.tableCell, { width: 75 }]}><Text style={[s.tableCellText, { color: "#8B5CF6", fontSize: 12 }]}>{fmtShort(row.asr_shafi)}</Text></View>
                          <View style={[s.tableCell, { width: 75 }]}><Text style={[s.tableCellText, { color: "#3B82F6", fontFamily: "Inter_600SemiBold", fontSize: 12 }]}>{fmtShort(row.asr_hanafi)}</Text></View>
                          <View style={[s.tableCell, { width: 75 }]}><Text style={[s.tableCellText, { color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 12 }]}>{fmtShort(row.maghrib)}</Text></View>
                          <View style={[s.tableCell, { width: 70 }]}><Text style={[s.tableCellText, { color: colors.foreground, fontSize: 12 }]}>{fmtShort(row.isha)}</Text></View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>

                <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={[s.sectionNote, { color: colors.mutedForeground, fontSize: 11 }]}>
                    * اوقات 24 گھنٹے فارمیٹ میں ہیں · فقہ حنفی و شافعی مطابقت
                  </Text>
                  <TouchableOpacity onPress={handleExportText} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Feather name="copy" size={13} color={colors.primary} />
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>کلپ بورڈ کاپی</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── NOTIFICATIONS TAB ────────────────────────────────────────── */}
            {tab === "settings" && (
              <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                {/* Permission banner */}
                {!notif.permissionGranted && Platform.OS !== "web" && (
                  <TouchableOpacity
                    style={[s.permBanner, { backgroundColor: "#F59E0B15", borderColor: "#F59E0B40" }]}
                    onPress={notif.requestPermission}
                  >
                    <Feather name="bell-off" size={18} color="#F59E0B" />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.permTitle, { color: "#F59E0B" }]}>Enable Notifications</Text>
                      <Text style={[s.permSub, { color: colors.mutedForeground }]}>
                        Tap to allow notifications for prayer time alerts
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#F59E0B" />
                  </TouchableOpacity>
                )}

                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Prayer Alerts</Text>
                <Text style={[s.sectionNote, { color: colors.mutedForeground, marginBottom: 16 }]}>
                  Get notified {notif.prefs.minutesBefore} minutes before each prayer. Tap the bell to toggle.
                </Text>

                {PRAYER_KEYS.map(key => {
                  const meta = PRAYER_META[key];
                  const on = notif.prefs.enabled[key];
                  const nextTime = prayers.find(p => p.key === key)?.time;

                  return (
                    <View key={key} style={[s.notifRow, { backgroundColor: colors.card, borderColor: on ? colors.gold + "50" : colors.border }]}>
                      <View style={[s.notifIcon, { backgroundColor: on ? colors.gold + "20" : colors.primary + "12" }]}>
                        <Feather name={meta.icon as any} size={18} color={on ? colors.gold : colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.notifPrayer, { color: colors.foreground }]}>{meta.name}</Text>
                        <Text style={[s.notifArabic, { color: colors.gold }]}>{meta.arabic}</Text>
                        {nextTime && (
                          <Text style={[s.notifTime, { color: colors.mutedForeground }]}>
                            Today: {fmt12(nextTime)}
                            {on && ` · Alert at ${fmt12(new Date(nextTime.getTime() - notif.prefs.minutesBefore * 60000))}`}
                          </Text>
                        )}
                      </View>
                      <Switch
                        value={on}
                        onValueChange={() => handleToggleNotif(key)}
                        trackColor={{ false: colors.border, true: colors.gold + "90" }}
                        thumbColor={on ? colors.gold : colors.mutedForeground}
                      />
                    </View>
                  );
                })}

                {/* Quick enable all */}
                <View style={s.notifBtnsRow}>
                  <TouchableOpacity
                    style={[s.notifActionBtn, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "40" }]}
                    onPress={async () => {
                      if (!notif.permissionGranted) {
                        const granted = await notif.requestPermission();
                        if (!granted) return;
                      }
                      for (const k of PRAYER_KEYS) {
                        if (!notif.prefs.enabled[k]) await notif.togglePrayer(k);
                      }
                      const timesMap: Record<string, Date> = {};
                      prayers.forEach(p => { timesMap[p.key] = p.time; });
                      await notif.scheduleNotifications(timesMap);
                    }}
                  >
                    <Feather name="bell" size={15} color={colors.gold} />
                    <Text style={[s.notifActionText, { color: colors.gold }]}>Enable All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.notifActionBtn, { backgroundColor: colors.border, borderColor: colors.border }]}
                    onPress={async () => {
                      for (const k of PRAYER_KEYS) {
                        if (notif.prefs.enabled[k]) await notif.togglePrayer(k);
                      }
                      await notif.cancelAll();
                    }}
                  >
                    <Feather name="bell-off" size={15} color={colors.mutedForeground} />
                    <Text style={[s.notifActionText, { color: colors.mutedForeground }]}>Disable All</Text>
                  </TouchableOpacity>
                </View>

                {/* Muezzin & Azan Audio Selection */}
                <View style={{ marginTop: 24, marginBottom: 8 }}>
                  <Text style={[s.sectionTitle, { color: colors.foreground }]}>صوتِ اذان و مؤذن (Azan Voice & Muezzin)</Text>
                  <Text style={[s.sectionNote, { color: colors.mutedForeground, marginBottom: 12 }]}>
                    نماز کے وقت کے لیے حرمینی مؤذن کا انتخاب کریں اور آواز سنیں۔
                  </Text>
                  {MUEZZINS.map(m => {
                    const isSelected = (notif.prefs.muezzin || "makkah") === m.id;
                    const isPlaying = playingMuezzin === m.id;

                    return (
                      <View
                        key={m.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: isSelected ? colors.primary + "15" : colors.card,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 8,
                          gap: 12,
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: isPlaying ? colors.gold : (isSelected ? colors.primary : colors.border),
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onPress={() => handlePlayPreview(m)}
                        >
                          <Feather name={isPlaying ? "square" : "play"} size={16} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => notif.setMuezzin(m.id)}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={{ fontSize: 14, fontWeight: "600", color: isSelected ? colors.primary : colors.foreground }}>
                              {m.name}
                            </Text>
                            {isSelected && (
                              <View style={{ backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ fontSize: 10, color: "#FFF", fontWeight: "700" }}>منتخب</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                            {m.muezzin} · {m.arabic}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => notif.setMuezzin(m.id)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            borderWidth: 2,
                            borderColor: isSelected ? colors.primary : colors.mutedForeground,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isSelected && (
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* Info */}
                <View style={[s.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
                  <Text style={[s.infoText, { color: colors.mutedForeground }]}>
                    Notifications are scheduled for today's prayers only. They automatically refresh each time you open the app.
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 18, gap: 10 },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitle: { fontSize: 19, fontFamily: "Inter_700Bold", color: "#FFF" },
    headerSubtitle: { fontSize: 13, color: "#FFFFFF90" },
    headerBtn: { padding: 4 },

    // Search
    searchBox: { marginHorizontal: 16, marginTop: 8, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
    searchRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, margin: 10 },
    searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
    cityResult: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
    cityName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    cityMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
    cityCoord: { fontSize: 11, fontFamily: "Inter_400Regular" },
    noResults: { padding: 16, textAlign: "center", fontFamily: "Inter_400Regular" },

    // Date card
    dateCard: { paddingHorizontal: 20, paddingBottom: 22, alignItems: "center", gap: 4 },
    islamicDate: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#D4A017" },
    gregorianDate: { fontSize: 13, color: "#FFFFFF80", fontFamily: "Inter_400Regular" },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, maxWidth: 280 },
    locationText: { fontSize: 12, color: "#FFFFFF70", fontFamily: "Inter_400Regular", flex: 1, textAlign: "center" },
    notifBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
    notifBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    loadingText: { fontFamily: "Inter_400Regular", marginTop: 12 },

    // Next card
    nextCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
    nextLabel: { fontSize: 12, color: "#FFFFFF90", fontFamily: "Inter_400Regular", marginBottom: 4 },
    nextName: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFF" },
    nextArabic: { fontSize: 15, color: "#FFFFFF80" },
    nextRight: { alignItems: "flex-end", gap: 8 },
    nextTime: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#FFF" },
    countdownBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    countdownText: { fontSize: 13, color: "#FFF", fontFamily: "Inter_600SemiBold" },

    // Tabs
    tabRow: { flexDirection: "row", borderBottomWidth: 1, marginTop: 14 },
    tab: { flex: 1, alignItems: "center", paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: "transparent" },
    tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

    // Prayer rows
    prayerRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 13, marginBottom: 8, borderWidth: 1.5, gap: 12 },
    prayerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    prayerInfo: { flex: 1 },
    prayerName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    prayerArabic: { fontSize: 13 },
    prayerRight: { alignItems: "flex-end", gap: 4 },
    prayerTime: { fontSize: 16, fontFamily: "Inter_700Bold" },
    prayerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
    nextDot: { width: 8, height: 8, borderRadius: 4 },
    bellBtn: { padding: 2 },

    // Method
    sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
    sectionNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 8 },
    methodBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, padding: 14, borderWidth: 1 },
    methodBtnLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    methodBtnText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
    methodList: { borderRadius: 12, borderWidth: 1, marginTop: 8, overflow: "hidden" },
    methodOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
    methodOptionText: { fontSize: 14, fontFamily: "Inter_400Regular" },

    // Weekly table
    tableHeader: { flexDirection: "row", paddingVertical: 10 },
    tableHeaderText: { color: "#FFF", fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
    tableHeaderAr: { color: "#FFFFFF80", fontSize: 11, textAlign: "center" },
    tableRow: { flexDirection: "row", paddingVertical: 10, borderLeftWidth: 3 },
    tableDay: { width: 70, paddingLeft: 10, justifyContent: "center" },
    tableCell: { width: 68, alignItems: "center", justifyContent: "center" },
    tableDayName: { fontSize: 13, marginBottom: 2 },
    tableDayNum: { fontSize: 11, fontFamily: "Inter_400Regular" },
    jumuahTag: { fontSize: 9, fontFamily: "Inter_600SemiBold", marginTop: 2 },
    tableCellText: { fontSize: 13 },

    // Notification settings
    permBanner: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
    permTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    permSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    notifRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
    notifIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    notifPrayer: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    notifArabic: { fontSize: 13, marginTop: 1 },
    notifTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3 },
    notifBtnsRow: { flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 16 },
    notifActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, borderWidth: 1, paddingVertical: 11 },
    notifActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    infoBox: { flexDirection: "row", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 4 },
    infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  });
}
