import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useColors } from "@/hooks/useColors";
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, SunnahTimes } from "adhan";

const PRAYER_NAMES: Record<string, { name: string; arabic: string; icon: string }> = {
  fajr: { name: "Fajr", arabic: "الفجر", icon: "sunrise" },
  sunrise: { name: "Sunrise", arabic: "الشروق", icon: "sun" },
  dhuhr: { name: "Dhuhr", arabic: "الظهر", icon: "sun" },
  asr: { name: "Asr", arabic: "العصر", icon: "sunset" },
  maghrib: { name: "Maghrib", arabic: "المغرب", icon: "sunset" },
  isha: { name: "Isha", arabic: "العشاء", icon: "moon" },
};

const METHODS = [
  { id: "MuslimWorldLeague", label: "Muslim World League" },
  { id: "Egyptian", label: "Egyptian Authority" },
  { id: "Karachi", label: "University of Islamic Sciences, Karachi" },
  { id: "UmmAlQura", label: "Umm Al-Qura, Makkah" },
  { id: "Dubai", label: "Dubai" },
  { id: "MoonsightingCommittee", label: "Moonsighting Committee" },
  { id: "NorthAmerica", label: "Islamic Society of North America" },
  { id: "Kuwait", label: "Kuwait" },
  { id: "Qatar", label: "Qatar" },
  { id: "Singapore", label: "Singapore" },
  { id: "Turkey", label: "Turkey" },
  { id: "Tehran", label: "Institute of Geophysics, Tehran" },
];

interface PrayerEntry {
  key: string;
  name: string;
  arabic: string;
  icon: string;
  time: Date;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Now";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getIslamicDate(): string {
  try {
    return new Date().toLocaleDateString("en-US-u-ca-islamic", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function PrayerTimesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; city?: string } | null>(null);
  const [prayers, setPrayers] = useState<PrayerEntry[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerEntry | null>(null);
  const [countdown, setCountdown] = useState("");
  const [method, setMethod] = useState("MuslimWorldLeague");
  const [showMethods, setShowMethods] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const calculatePrayers = useCallback((lat: number, lng: number, methodId: string) => {
    const coords = new Coordinates(lat, lng);
    const params = (CalculationMethod as any)[methodId]?.() ?? CalculationMethod.MuslimWorldLeague();
    params.madhab = Madhab.Shafi;
    const date = new Date();
    const pt = new PrayerTimes(coords, date, params);
    const sunnahTimes = new SunnahTimes(pt);

    const list: PrayerEntry[] = [
      { key: "fajr", time: pt.fajr, ...PRAYER_NAMES.fajr },
      { key: "sunrise", time: pt.sunrise, ...PRAYER_NAMES.sunrise },
      { key: "dhuhr", time: pt.dhuhr, ...PRAYER_NAMES.dhuhr },
      { key: "asr", time: pt.asr, ...PRAYER_NAMES.asr },
      { key: "maghrib", time: pt.maghrib, ...PRAYER_NAMES.maghrib },
      { key: "isha", time: pt.isha, ...PRAYER_NAMES.isha },
    ];
    setPrayers(list);
    return list;
  }, []);

  const updateNextPrayer = useCallback((prayerList: PrayerEntry[]) => {
    const now = new Date();
    const next = prayerList.find(p => p.time > now) ?? prayerList[0];
    setNextPrayer(next);
    const diff = next.time.getTime() - now.getTime();
    setCountdown(formatCountdown(diff < 0 ? 0 : diff));
  }, []);

  const loadLocation = useCallback(async (chosenMethod?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (Platform.OS !== "web") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Location permission denied. Using default (Makkah).");
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geocode] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        const city = geocode?.city ?? geocode?.region ?? "Your Location";
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setLocation({ lat, lng, city });
        const list = calculatePrayers(lat, lng, chosenMethod ?? method);
        updateNextPrayer(list);
      } else {
        // Default to Makkah on web
        const lat = 21.3891;
        const lng = 39.8579;
        setLocation({ lat, lng, city: "Makkah al-Mukarramah" });
        const list = calculatePrayers(lat, lng, chosenMethod ?? method);
        updateNextPrayer(list);
      }
    } catch (e: any) {
      const lat = 21.3891;
      const lng = 39.8579;
      setLocation({ lat, lng, city: "Makkah al-Mukarramah (default)" });
      const list = calculatePrayers(lat, lng, chosenMethod ?? method);
      updateNextPrayer(list);
    } finally {
      setLoading(false);
    }
  }, [calculatePrayers, updateNextPrayer, method]);

  useEffect(() => { loadLocation(); }, []);

  useEffect(() => {
    if (prayers.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      updateNextPrayer(prayers);
    }, 1000);
    return () => clearInterval(interval);
  }, [prayers, updateNextPrayer]);

  const s = makeStyles(colors);
  const islamicDate = getIslamicDate();
  const gregorianDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), backgroundColor: colors.navy }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Prayer Times</Text>
          <Text style={s.headerSubtitle}>مواقيت الصلاة</Text>
        </View>
        <TouchableOpacity onPress={() => loadLocation()}>
          <Feather name="refresh-cw" size={20} color="#FFFFFF90" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Date Card */}
        <View style={[s.dateCard, { backgroundColor: colors.navy }]}>
          <Text style={s.islamicDate}>{islamicDate}</Text>
          <Text style={s.gregorianDate}>{gregorianDate}</Text>
          {location && (
            <View style={s.locationRow}>
              <Feather name="map-pin" size={12} color="#FFFFFF70" />
              <Text style={s.locationText}>{location.city}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={{ padding: 60, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_400Regular" }]}>
              Getting prayer times...
            </Text>
          </View>
        ) : (
          <>
            {/* Next Prayer Highlight */}
            {nextPrayer && (
              <View style={[s.nextCard, { backgroundColor: colors.primary }]}>
                <View>
                  <Text style={s.nextLabel}>Next Prayer</Text>
                  <Text style={s.nextName}>{nextPrayer.name}</Text>
                  <Text style={s.nextArabic}>{nextPrayer.arabic}</Text>
                </View>
                <View style={s.nextRight}>
                  <Text style={s.nextTime}>{formatTime(nextPrayer.time)}</Text>
                  <View style={[s.countdownBadge, { backgroundColor: "#FFFFFF25" }]}>
                    <Text style={s.countdownText}>{countdown}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Prayer List */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              {prayers.map(prayer => {
                const isNext = nextPrayer?.key === prayer.key;
                const isPast = prayer.time < currentTime;
                return (
                  <View
                    key={prayer.key}
                    style={[s.prayerRow, {
                      backgroundColor: isNext ? colors.primary + "12" : colors.card,
                      borderColor: isNext ? colors.primary : colors.border,
                    }]}
                  >
                    <View style={[s.prayerIcon, {
                      backgroundColor: isNext ? colors.primary : colors.primary + "15"
                    }]}>
                      <Feather name={prayer.icon as any} size={16} color={isNext ? "#FFF" : colors.primary} />
                    </View>
                    <View style={s.prayerInfo}>
                      <Text style={[s.prayerName, { color: isNext ? colors.primary : colors.foreground }]}>
                        {prayer.name}
                      </Text>
                      <Text style={[s.prayerArabic, { color: colors.gold }]}>{prayer.arabic}</Text>
                    </View>
                    <View style={s.prayerRight}>
                      <Text style={[s.prayerTime, {
                        color: isPast ? colors.mutedForeground : (isNext ? colors.primary : colors.foreground),
                        opacity: isPast ? 0.5 : 1,
                      }]}>
                        {formatTime(prayer.time)}
                      </Text>
                      {isNext && <View style={[s.nextDot, { backgroundColor: colors.primary }]} />}
                      {isPast && prayer.key !== "sunrise" && <Feather name="check" size={14} color={colors.mutedForeground} />}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Calculation Method */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Calculation Method</Text>
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
                      onPress={() => {
                        setMethod(m.id);
                        setShowMethods(false);
                        if (location) {
                          const list = calculatePrayers(location.lat, location.lng, m.id);
                          updateNextPrayer(list);
                        }
                      }}
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

            {/* Sunnah Times */}
            <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Dhikr & Sunnah Reminders</Text>
              {[
                { label: "After Fajr — Morning Adhkar", arabic: "أذكار الصباح", desc: "Read morning supplications after Fajr prayer" },
                { label: "After Asr — Evening Adhkar", arabic: "أذكار المساء", desc: "Read evening supplications after Asr prayer" },
                { label: "Qiyam al-Layl", arabic: "قيام الليل", desc: "Last third of the night — a blessed time for dua" },
              ].map((item, i) => (
                <View key={i} style={[s.sunnahCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.sunnahIcon, { backgroundColor: colors.gold + "20" }]}>
                    <Feather name="moon" size={16} color={colors.gold} />
                  </View>
                  <View style={s.sunnahInfo}>
                    <Text style={[s.sunnahLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[s.sunnahArabic, { color: colors.gold }]}>{item.arabic}</Text>
                    <Text style={[s.sunnahDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFF" },
    headerSubtitle: { fontSize: 13, color: "#FFFFFF90" },
    dateCard: { paddingHorizontal: 20, paddingBottom: 24, alignItems: "center", gap: 4 },
    islamicDate: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#D4A017" },
    gregorianDate: { fontSize: 13, color: "#FFFFFF80", fontFamily: "Inter_400Regular" },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    locationText: { fontSize: 12, color: "#FFFFFF70", fontFamily: "Inter_400Regular" },
    nextCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
    nextLabel: { fontSize: 12, color: "#FFFFFF90", fontFamily: "Inter_400Regular", marginBottom: 4 },
    nextName: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFF" },
    nextArabic: { fontSize: 15, color: "#FFFFFF80" },
    nextRight: { alignItems: "flex-end", gap: 8 },
    nextTime: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#FFF" },
    countdownBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    countdownText: { fontSize: 13, color: "#FFF", fontFamily: "Inter_600SemiBold" },
    prayerRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, gap: 14 },
    prayerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    prayerInfo: { flex: 1 },
    prayerName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    prayerArabic: { fontSize: 13 },
    prayerRight: { alignItems: "flex-end", gap: 4 },
    prayerTime: { fontSize: 16, fontFamily: "Inter_700Bold" },
    nextDot: { width: 8, height: 8, borderRadius: 4 },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
    methodBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, padding: 14, borderWidth: 1 },
    methodBtnLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    methodBtnText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
    methodList: { borderRadius: 12, borderWidth: 1, marginTop: 8, overflow: "hidden" },
    methodOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
    methodOptionText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    sunnahCard: { flexDirection: "row", borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 8, gap: 12 },
    sunnahIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    sunnahInfo: { flex: 1 },
    sunnahLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    sunnahArabic: { fontSize: 12, marginBottom: 2 },
    sunnahDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  });
}
