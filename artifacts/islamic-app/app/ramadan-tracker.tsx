import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

const RAMADAN_KEY = "@ramadan_tracker";

// Gregorian to Hijri
function gregorianToHijri(gYear: number, gMonth: number, gDay: number) {
  let jd = Math.floor((14 - gMonth) / 12);
  let y = gYear + 4800 - jd;
  let m = gMonth + 12 * jd - 3;
  let jdn = gDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  let l = jdn - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

// Estimate Ramadan 1 start in Gregorian for a given Hijri year
// Using approximate formula: Hijri year → Gregorian
function hijriToApproxGregorian(hYear: number, hMonth: number, hDay: number): Date {
  // Approximate conversion
  const gYear = Math.round((hYear - 1) * (365.25 / 354.37) + 622);
  const jd = Math.floor((11 * hYear + 3) / 30) + 354 * hYear + 30 * hMonth - Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385;
  const l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  const ll = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (ll + 1)) / 1461001);
  const li = ll - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * li) / 2447);
  const day = li - Math.floor((2447 * j) / 80);
  const lj = Math.floor(j / 11);
  const month = j + 2 - 12 * lj;
  const year = 100 * (n - 49) + i + lj;
  return new Date(year, month - 1, day);
}

interface FastingDay {
  day: number; // 1-30
  status: "fasted" | "missed" | "partial" | "exempt";
  suhoor: boolean;
  iftar: boolean;
  note: string;
  quranPages: number;
}

interface RamadanData {
  hijriYear: number;
  days: Record<number, Partial<FastingDay>>;
  goals: {
    quranKhatm: boolean;
    suhoorEveryDay: boolean;
    nightPrayers: boolean;
    charity: boolean;
    customGoal: string;
  };
}

const STATUS_CONFIG = {
  fasted: { label: "Fasted", color: "#16A34A", emoji: "✅" },
  missed: { label: "Missed", color: "#DC2626", emoji: "❌" },
  partial: { label: "Partial", color: "#F59E0B", emoji: "🕐" },
  exempt: { label: "Exempt", color: "#6366F1", emoji: "🌙" },
};

export default function RamadanTrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<RamadanData | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  const today = useMemo(() => new Date(), []);
  const hijri = useMemo(() => gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate()), [today]);

  // Determine if we're in Ramadan
  const isRamadan = hijri.month === 9;
  const currentHijriYear = hijri.year;

  // Calculate next/current Ramadan start
  const ramadanYear = isRamadan ? currentHijriYear : (hijri.month > 9 ? currentHijriYear + 1 : currentHijriYear);
  const ramadanStart = useMemo(() => hijriToApproxGregorian(ramadanYear, 9, 1), [ramadanYear]);
  const ramadanEnd = useMemo(() => hijriToApproxGregorian(ramadanYear, 9, 30), [ramadanYear]);

  // Days until Ramadan
  const daysUntil = useMemo(() => {
    if (isRamadan) return 0;
    const diff = ramadanStart.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [isRamadan, ramadanStart, today]);

  // Current Ramadan day
  const currentRamadanDay = useMemo(() => {
    if (!isRamadan) return null;
    return hijri.day;
  }, [isRamadan, hijri.day]);

  useEffect(() => {
    AsyncStorage.getItem(RAMADAN_KEY).then(raw => {
      if (raw) {
        try {
          const parsed: RamadanData = JSON.parse(raw);
          setData(parsed);
        } catch {}
      }
      if (!raw) {
        const initial: RamadanData = {
          hijriYear: currentHijriYear,
          days: {},
          goals: { quranKhatm: false, suhoorEveryDay: false, nightPrayers: false, charity: false, customGoal: "" },
        };
        setData(initial);
      }
    });
  }, [currentHijriYear]);

  const saveData = (updated: RamadanData) => {
    setData(updated);
    AsyncStorage.setItem(RAMADAN_KEY, JSON.stringify(updated));
  };

  const updateDay = (day: number, update: Partial<FastingDay>) => {
    if (!data) return;
    const updated: RamadanData = {
      ...data,
      days: { ...data.days, [day]: { ...(data.days[day] ?? { day, suhoor: false, iftar: false, note: "", quranPages: 0 }), ...update } },
    };
    saveData(updated);
  };

  const toggleGoal = (goal: keyof RamadanData["goals"]) => {
    if (!data || goal === "customGoal") return;
    const updated = { ...data, goals: { ...data.goals, [goal]: !data.goals[goal] } };
    saveData(updated);
  };

  const stats = useMemo(() => {
    if (!data) return { fasted: 0, missed: 0, partial: 0, exempt: 0, totalPages: 0, suhoorDays: 0, streak: 0 };
    const days = Object.values(data.days);
    const fasted = days.filter(d => d.status === "fasted").length;
    const missed = days.filter(d => d.status === "missed").length;
    const partial = days.filter(d => d.status === "partial").length;
    const exempt = days.filter(d => d.status === "exempt").length;
    const totalPages = days.reduce((a, d) => a + (d.quranPages ?? 0), 0);
    const suhoorDays = days.filter(d => d.suhoor).length;
    // Current streak
    let streak = 0;
    for (let i = 30; i >= 1; i--) {
      const d = data.days[i];
      if (d?.status === "fasted" || d?.status === "partial") streak++;
      else if (d?.status === "missed") break;
    }
    return { fasted, missed, partial, exempt, totalPages, suhoorDays, streak };
  }, [data]);

  const s = makeStyles(colors);

  // Day detail panel
  if (selectedDay !== null && data) {
    const dayData = data.days[selectedDay] ?? { day: selectedDay, status: undefined, suhoor: false, iftar: false, note: "", quranPages: 0 };

    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => { setSelectedDay(null); setNoteText(""); }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.foreground }]}>Ramadan Day {selectedDay}</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>{selectedDay} رمضان</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {/* Status */}
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>FASTING STATUS</Text>
          <View style={s.statusGrid}>
            {(Object.entries(STATUS_CONFIG) as [FastingDay["status"], typeof STATUS_CONFIG[FastingDay["status"]]][]).map(([key, cfg]) => (
              <TouchableOpacity
                key={key}
                style={[s.statusBtn, {
                  backgroundColor: dayData.status === key ? cfg.color + "20" : colors.card,
                  borderColor: dayData.status === key ? cfg.color : colors.border,
                  borderWidth: dayData.status === key ? 2 : 1,
                }]}
                onPress={() => updateDay(selectedDay, { status: key })}
              >
                <Text style={s.statusEmoji}>{cfg.emoji}</Text>
                <Text style={[s.statusLabel, { color: dayData.status === key ? cfg.color : colors.foreground }]}>{cfg.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Suhoor / Iftar */}
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>SUHOOR & IFTAR</Text>
          <View style={[s.siRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={[s.siBtn, { borderColor: colors.border, backgroundColor: dayData.suhoor ? "#16A34A20" : "transparent" }]} onPress={() => updateDay(selectedDay, { suhoor: !dayData.suhoor })}>
              <Text style={s.siEmoji}>🌙</Text>
              <Text style={[s.siBtnText, { color: dayData.suhoor ? "#16A34A" : colors.mutedForeground }]}>Suhoor</Text>
              {dayData.suhoor && <Feather name="check" size={14} color="#16A34A" />}
            </TouchableOpacity>
            <View style={[s.siDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[s.siBtn, { borderColor: colors.border, backgroundColor: dayData.iftar ? "#F59E0B20" : "transparent" }]} onPress={() => updateDay(selectedDay, { iftar: !dayData.iftar })}>
              <Text style={s.siEmoji}>🌅</Text>
              <Text style={[s.siBtnText, { color: dayData.iftar ? "#F59E0B" : colors.mutedForeground }]}>Iftar</Text>
              {dayData.iftar && <Feather name="check" size={14} color="#F59E0B" />}
            </TouchableOpacity>
          </View>

          {/* Quran pages */}
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>QURAN PAGES READ TODAY</Text>
          <View style={[s.pagesRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={[s.pageBtn, { borderColor: colors.border }]} onPress={() => updateDay(selectedDay, { quranPages: Math.max(0, (dayData.quranPages ?? 0) - 1) })}>
              <Feather name="minus" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.pageCount, { color: colors.foreground }]}>{dayData.quranPages ?? 0} pages</Text>
            <TouchableOpacity style={[s.pageBtn, { borderColor: colors.border }]} onPress={() => updateDay(selectedDay, { quranPages: Math.min(604, (dayData.quranPages ?? 0) + 1) })}>
              <Feather name="plus" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.pagePreset, { backgroundColor: colors.primary + "20" }]} onPress={() => updateDay(selectedDay, { quranPages: (dayData.quranPages ?? 0) + 20 })}>
              <Text style={[s.pagePresetText, { color: colors.primary }]}>+20</Text>
            </TouchableOpacity>
          </View>

          {/* Note */}
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>PERSONAL NOTE</Text>
          <TextInput
            style={[s.noteInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Reflections, duas, gratitude…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            defaultValue={dayData.note ?? ""}
            onChangeText={text => updateDay(selectedDay, { note: text })}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.foreground }]}>Ramadan Tracker</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>متابعة رمضان</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Hero — Countdown or In Ramadan */}
        {!isRamadan ? (
          <View style={[s.countdownCard, { backgroundColor: colors.navy }]}>
            <Text style={s.countdownEmoji}>🌙</Text>
            <Text style={s.countdownNum}>{daysUntil}</Text>
            <Text style={s.countdownLabel}>Days Until Ramadan</Text>
            <Text style={[s.countdownSub, { color: "#FFFFFF80" }]}>
              {ramadanYear} AH · {ramadanStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </Text>
            <Text style={[s.countdownTip, { color: colors.gold }]}>
              رَمَضَان مُبَارَك — Begin preparing your heart
            </Text>
          </View>
        ) : (
          <View style={[s.countdownCard, { backgroundColor: colors.navy }]}>
            <Text style={s.countdownEmoji}>🌙</Text>
            <Text style={s.countdownNum}>Day {currentRamadanDay}</Text>
            <Text style={s.countdownLabel}>of Ramadan {ramadanYear} AH</Text>
            <Text style={[s.countdownSub, { color: "#FFFFFF80" }]}>
              {30 - (currentRamadanDay ?? 0)} days remaining
            </Text>
            <Text style={[s.countdownTip, { color: colors.gold }]}>رَمَضَان كَرِيم</Text>
          </View>
        )}

        {/* Stats */}
        <View style={s.statsGrid}>
          <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: "#16A34A" }]}>{stats.fasted}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Fasted</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: "#DC2626" }]}>{stats.missed}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Missed</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: colors.primary }]}>{stats.totalPages}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Quran Pages</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.statNum, { color: "#F59E0B" }]}>{stats.suhoorDays}</Text>
            <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Suhoor Days</Text>
          </View>
        </View>

        {/* Fasting Log Grid */}
        <Text style={[s.secLabel, { color: colors.mutedForeground }]}>FASTING LOG — TAP TO UPDATE</Text>
        <View style={s.dayGrid}>
          {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
            const dayData = data?.days[day];
            const status = dayData?.status;
            const cfg = status ? STATUS_CONFIG[status] : null;
            const isToday = isRamadan && day === currentRamadanDay;
            const isFuture = !isRamadan ? true : (currentRamadanDay !== null && day > currentRamadanDay);

            return (
              <TouchableOpacity
                key={day}
                style={[s.dayCell, {
                  backgroundColor: cfg ? cfg.color + "20" : (isToday ? colors.primary + "15" : colors.card),
                  borderColor: isToday ? colors.primary : (cfg ? cfg.color + "60" : colors.border),
                  borderWidth: isToday ? 2 : 1,
                  opacity: isFuture && !isRamadan ? 0.5 : 1,
                }]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[s.dayNum, { color: isToday ? colors.primary : (cfg ? cfg.color : colors.mutedForeground) }]}>{day}</Text>
                {status ? <Text style={s.dayEmoji}>{cfg?.emoji}</Text> : <Text style={[s.dayDot, { color: colors.border }]}>·</Text>}
                {dayData?.suhoor && <Text style={s.dayMini}>🌙</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Goals */}
        <Text style={[s.secLabel, { color: colors.mutedForeground }]}>RAMADAN GOALS</Text>
        <View style={[s.goalsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {([
            ["quranKhatm", "Complete Quran Khatm (1 khatm)", "📖"],
            ["suhoorEveryDay", "Suhoor every day", "🌙"],
            ["nightPrayers", "Pray Tarawih / Night prayers", "🕌"],
            ["charity", "Give Sadaqah daily", "💝"],
          ] as [keyof RamadanData["goals"], string, string][]).map(([key, label, emoji]) => (
            <TouchableOpacity key={key} style={[s.goalRow, { borderBottomColor: colors.border }]} onPress={() => toggleGoal(key)}>
              <Text style={s.goalEmoji}>{emoji}</Text>
              <Text style={[s.goalLabel, { color: colors.foreground }]}>{label}</Text>
              <View style={[s.goalCheck, {
                backgroundColor: data?.goals[key] ? "#16A34A" : "transparent",
                borderColor: data?.goals[key] ? "#16A34A" : colors.border,
              }]}>
                {data?.goals[key] && <Feather name="check" size={12} color="#FFF" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dua Banner */}
        <View style={[s.duaBanner, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[s.duaAr, { color: colors.foreground }]}>اللَّهُمَّ بَلِّغْنَا رَمَضَان</Text>
          <Text style={[s.duaTrans, { color: colors.mutedForeground }]}>O Allah, allow us to reach Ramadan</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
    title: { fontSize: 18, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 12, fontFamily: "Inter_400Regular" },
    content: { paddingHorizontal: 16, paddingTop: 16 },

    countdownCard: { borderRadius: 18, padding: 24, alignItems: "center", marginBottom: 16 },
    countdownEmoji: { fontSize: 40, marginBottom: 8 },
    countdownNum: { fontSize: 52, fontFamily: "Inter_700Bold", color: "#FFF", lineHeight: 60 },
    countdownLabel: { fontSize: 16, color: "#FFFFFF80", fontFamily: "Inter_400Regular", marginBottom: 6 },
    countdownSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10 },
    countdownTip: { fontSize: 16, fontFamily: "Inter_400Regular" },

    statsGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
    statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center" },
    statNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "center" },

    secLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, marginTop: 6 },
    dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    dayCell: { width: "13.5%", aspectRatio: 1, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
    dayNum: { fontSize: 11, fontFamily: "Inter_700Bold" },
    dayEmoji: { fontSize: 10 },
    dayDot: { fontSize: 16 },
    dayMini: { fontSize: 8 },

    goalsCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
    goalRow: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, gap: 12 },
    goalEmoji: { fontSize: 20 },
    goalLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
    goalCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },

    duaBanner: { borderRadius: 14, borderWidth: 1, padding: 18, alignItems: "center", marginBottom: 8 },
    duaAr: { fontSize: 20, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 8, lineHeight: 32 },
    duaTrans: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", fontStyle: "italic" },

    // Day detail
    statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
    statusBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, flex: 1, minWidth: "45%" },
    statusEmoji: { fontSize: 18 },
    statusLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

    siRow: { flexDirection: "row", borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
    siBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
    siEmoji: { fontSize: 18 },
    siBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    siDivider: { width: 1 },

    pagesRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
    pageBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    pageCount: { flex: 1, textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold" },
    pagePreset: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    pagePresetText: { fontSize: 14, fontFamily: "Inter_700Bold" },

    noteInput: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 100, textAlignVertical: "top" },
  });
}
