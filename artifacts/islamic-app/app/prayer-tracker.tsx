import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const PRAYERS = [
  { id: "fajr", name: "Fajr", nameAr: "الفجر", time: "Pre-dawn", icon: "🌙", color: "#6366F1" },
  { id: "dhuhr", name: "Dhuhr", nameAr: "الظهر", time: "Midday", icon: "☀️", color: "#D97706" },
  { id: "asr", name: "Asr", nameAr: "العصر", time: "Afternoon", icon: "🌤", color: "#0891B2" },
  { id: "maghrib", name: "Maghrib", nameAr: "المغرب", time: "Sunset", icon: "🌅", color: "#DC2626" },
  { id: "isha", name: "Isha", nameAr: "العشاء", time: "Night", icon: "🌃", color: "#7C3AED" },
] as const;

type PrayerId = (typeof PRAYERS)[number]["id"];

interface DayRecord {
  date: string;
  completed: Record<PrayerId, boolean>;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

const STORAGE_KEY = "@prayer_tracker";

async function loadRecords(): Promise<DayRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveRecords(records: DayRecord[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

function calculateStreak(records: DayRecord[]): number {
  if (!records.length) return 0;
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const rec = sorted.find(r => r.date === key);
    if (rec && Object.values(rec.completed).every(Boolean)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export default function PrayerTrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [viewDate, setViewDate] = useState(todayKey());

  useEffect(() => {
    loadRecords().then(r => {
      // Ensure today exists
      const today = todayKey();
      if (!r.find(rec => rec.date === today)) {
        const newRec = { date: today, completed: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false } };
        const updated = [newRec, ...r].slice(0, 60);
        setRecords(updated);
        saveRecords(updated);
      } else {
        setRecords(r);
      }
    });
  }, []);

  const currentRecord = records.find(r => r.date === viewDate);
  const completed = currentRecord?.completed ?? { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
  const completedCount = Object.values(completed).filter(Boolean).length;
  const isToday = viewDate === todayKey();

  const togglePrayer = useCallback(async (id: PrayerId) => {
    if (!isToday) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRecords(prev => {
      const rec = prev.find(r => r.date === viewDate);
      if (!rec) return prev;
      const updated = prev.map(r =>
        r.date === viewDate
          ? { ...r, completed: { ...r.completed, [id]: !r.completed[id] } }
          : r
      );
      saveRecords(updated);
      return updated;
    });
  }, [isToday, viewDate]);

  const goDay = (offset: number) => {
    const [y, m, d] = viewDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    setViewDate(key);
    // Create record for past days if needed
    setRecords(prev => {
      if (!prev.find(r => r.date === key)) {
        const newRec = { date: key, completed: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false } };
        const updated = [...prev, newRec].slice(0, 60);
        saveRecords(updated);
        return updated;
      }
      return prev;
    });
  };

  const streak = calculateStreak(records);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const rec = records.find(r => r.date === key);
    const count = rec ? Object.values(rec.completed).filter(Boolean).length : 0;
    return { key, day: d.toLocaleDateString("en-US", { weekday: "narrow" }), count };
  });

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Prayer Tracker</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>متابعة الصلوات</Text>
        </View>
        <View style={[s.streakBadge, { backgroundColor: colors.gold + "20" }]}>
          <Text style={s.streakFire}>🔥</Text>
          <Text style={[s.streakNum, { color: colors.gold }]}>{streak}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Date Navigator */}
        <View style={s.dateNav}>
          <TouchableOpacity style={[s.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => goDay(-1)}>
            <Feather name="chevron-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.dateCenter}>
            <Text style={[s.dateText, { color: colors.foreground }]}>{formatDate(viewDate)}</Text>
            {isToday && <View style={[s.todayPill, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[s.todayText, { color: colors.primary }]}>Today</Text>
            </View>}
          </View>
          <TouchableOpacity
            style={[s.navBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: isToday ? 0.4 : 1 }]}
            onPress={() => !isToday && goDay(1)}
            disabled={isToday}
          >
            <Feather name="chevron-right" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Progress Ring */}
        <View style={[s.progressCard, { backgroundColor: colors.navy }]}>
          <View style={s.progressRow}>
            <View style={s.progressLeft}>
              <Text style={s.progressNum}>{completedCount}</Text>
              <Text style={[s.progressOf, { color: "#FFFFFF60" }]}>of 5 prayers</Text>
            </View>
            <View style={s.progressDots}>
              {PRAYERS.map(p => (
                <View key={p.id} style={[s.progressDot, { backgroundColor: completed[p.id] ? p.color : "#FFFFFF20" }]} />
              ))}
            </View>
            <View style={s.progressRight}>
              <Text style={[s.progressPct, { color: colors.gold }]}>{Math.round((completedCount / 5) * 100)}%</Text>
              <Text style={[s.progressLabel, { color: "#FFFFFF60" }]}>
                {completedCount === 5 ? "All Complete! 🎉" : completedCount === 0 ? "Not started" : "In Progress"}
              </Text>
            </View>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${(completedCount / 5) * 100}%` as any, backgroundColor: completedCount === 5 ? "#22C55E" : colors.gold }]} />
          </View>
        </View>

        {/* Prayer Cards */}
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>
          {isToday ? "Tap to mark as completed" : "Prayer record"}
        </Text>
        {PRAYERS.map(prayer => {
          const done = completed[prayer.id];
          return (
            <TouchableOpacity
              key={prayer.id}
              style={[s.prayerCard, {
                backgroundColor: done ? prayer.color + "15" : colors.card,
                borderColor: done ? prayer.color + "50" : colors.border,
                borderWidth: done ? 1.5 : 1,
              }]}
              onPress={() => togglePrayer(prayer.id)}
              activeOpacity={isToday ? 0.8 : 1}
            >
              <Text style={s.prayerEmoji}>{prayer.icon}</Text>
              <View style={s.prayerInfo}>
                <Text style={[s.prayerName, { color: done ? prayer.color : colors.foreground }]}>{prayer.name}</Text>
                <Text style={[s.prayerAr, { color: prayer.color }]}>{prayer.nameAr}</Text>
                <Text style={[s.prayerTime, { color: colors.mutedForeground }]}>{prayer.time}</Text>
              </View>
              <View style={[s.checkCircle, {
                backgroundColor: done ? prayer.color : "transparent",
                borderColor: done ? prayer.color : colors.border,
              }]}>
                {done && <Feather name="check" size={16} color="#FFF" />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Weekly Overview */}
        <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Last 7 Days</Text>
        <View style={[s.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {last7.map(day => (
            <TouchableOpacity key={day.key} onPress={() => setViewDate(day.key)} style={s.weekDay}>
              <Text style={[s.weekDayName, { color: day.key === viewDate ? colors.primary : colors.mutedForeground }]}>{day.day}</Text>
              <View style={s.weekBar}>
                {[0, 1, 2, 3, 4].map(i => (
                  <View key={i} style={[s.weekDot, { backgroundColor: i < day.count ? colors.primary : colors.border }]} />
                ))}
              </View>
              <Text style={[s.weekCount, { color: day.count === 5 ? "#22C55E" : colors.mutedForeground }]}>{day.count}/5</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Motivational Hadith */}
        <View style={[s.hadithCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[s.hadithText, { color: colors.foreground }]}>
            "The first matter that the slave will be brought to account for on the Day of Judgment is the prayer."
          </Text>
          <Text style={[s.hadithRef, { color: colors.primary }]}>Ahmad 4/65 | Hasan</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 20, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 13 },
    streakBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    streakFire: { fontSize: 14 },
    streakNum: { fontSize: 15, fontFamily: "Inter_700Bold" },

    content: { paddingHorizontal: 16, paddingTop: 4 },
    dateNav: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
    navBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
    dateCenter: { flex: 1, alignItems: "center", gap: 4 },
    dateText: { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
    todayPill: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8 },
    todayText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

    progressCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
    progressRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    progressLeft: { alignItems: "center" },
    progressNum: { fontSize: 48, fontFamily: "Inter_700Bold", color: "#FFF", lineHeight: 52 },
    progressOf: { fontSize: 12, fontFamily: "Inter_400Regular" },
    progressDots: { flex: 1, flexDirection: "row", justifyContent: "center", gap: 8 },
    progressDot: { width: 12, height: 12, borderRadius: 6 },
    progressRight: { alignItems: "center" },
    progressPct: { fontSize: 24, fontFamily: "Inter_700Bold" },
    progressLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
    progressBar: { height: 6, backgroundColor: "#FFFFFF15", borderRadius: 3, overflow: "hidden" },
    progressFill: { height: 6, borderRadius: 3 },

    sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
    prayerCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, marginBottom: 10, gap: 14 },
    prayerEmoji: { fontSize: 26 },
    prayerInfo: { flex: 1 },
    prayerName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    prayerAr: { fontSize: 14, marginTop: 1 },
    prayerTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    checkCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center" },

    weekCard: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16, justifyContent: "space-between" },
    weekDay: { alignItems: "center", gap: 6 },
    weekDayName: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    weekBar: { gap: 3 },
    weekDot: { width: 8, height: 8, borderRadius: 4 },
    weekCount: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

    hadithCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 4 },
    hadithText: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", fontStyle: "italic", marginBottom: 8 },
    hadithRef: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  });
}
