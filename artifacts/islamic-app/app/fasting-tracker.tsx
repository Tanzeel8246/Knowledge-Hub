import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "fasting_tracker_v1";

interface FastRecord {
  date: string; // YYYY-MM-DD
  type: FastType;
  note?: string;
}

type FastType = "monday" | "thursday" | "white-day" | "ayyub" | "ashura" | "arafah" | "shawwal" | "dhul-hijjah" | "custom";

interface VoluntaryFast {
  id: FastType;
  name: string;
  arabic: string;
  description: string;
  hadith: string;
  color: string;
  when: string;
  reward: string;
}

const FAST_TYPES: VoluntaryFast[] = [
  {
    id: "monday",
    name: "Monday Fast",
    arabic: "صِيَام الِاثْنَيْن",
    description: "Fasting every Monday. The Prophet ﷺ was asked about fasting on Mondays and said it was the day he was born and the day revelation came to him.",
    hadith: "I was born on Monday and revelation came to me on Monday. (Muslim)",
    color: "#16A34A",
    when: "Every Monday",
    reward: "Deeds are presented to Allah on Mondays and Thursdays — the Prophet ﷺ loved to be fasting when his deeds were presented.",
  },
  {
    id: "thursday",
    name: "Thursday Fast",
    arabic: "صِيَام الْخَمِيس",
    description: "Fasting every Thursday. Often combined with Monday fasting.",
    hadith: "Deeds are presented to Allah on Mondays and Thursdays, and I like my deeds to be presented while I am fasting. (Tirmidhi — Hasan)",
    color: "#0891B2",
    when: "Every Thursday",
    reward: "Deeds presented to Allah while fasting.",
  },
  {
    id: "white-day",
    name: "Ayyam al-Bid",
    arabic: "أَيَّام الْبِيض",
    description: "Fasting on the 13th, 14th, and 15th of every Islamic month — when the moon is full and the nights are white (albida). Like fasting the whole year.",
    hadith: "The Messenger ﷺ used to command us to fast the white days: the 13th, 14th, and 15th. He said it is like fasting the whole year. (An-Nasa'i — Sahih)",
    color: "#D97706",
    when: "13th, 14th, 15th of every Hijri month",
    reward: "Each good deed is multiplied 10x — 3 days × 10 = 30 days = one month. 12 months × 3 days = entire year.",
  },
  {
    id: "ayyub",
    name: "Fast of Dawud (AS)",
    arabic: "صِيَام دَاوُود",
    description: "Fasting every other day — alternating between fasting and not fasting. The Prophet ﷺ said this is the most beloved fast to Allah.",
    hadith: "The most beloved fasting to Allah was the fasting of Dawud (AS) — he would fast one day and not the next. (Bukhari & Muslim)",
    color: "#7C3AED",
    when: "Every other day (alternate days)",
    reward: "The most beloved voluntary fast in the sight of Allah.",
  },
  {
    id: "ashura",
    name: "Day of Ashura",
    arabic: "يَوْم عَاشُورَاء",
    description: "Fasting on the 10th of Muharram (Ashura). When the Prophet ﷺ came to Madinah and saw Jews fasting, they said Musa (AS) was saved from Pharaoh on this day. The Prophet ﷺ said Muslims have more right to Musa (AS) and fasted.",
    hadith: "Fasting the Day of Ashura, I hope Allah will expiate the sins of the previous year. (Muslim)",
    color: "#DC2626",
    when: "10th of Muharram (+ 9th is Sunnah)",
    reward: "Expiation of the past year's minor sins.",
  },
  {
    id: "arafah",
    name: "Day of Arafah",
    arabic: "يَوْم عَرَفَة",
    description: "Fasting on the 9th of Dhul Hijjah — the Day of Arafah. One of the greatest days of the year. Only for those NOT performing Hajj.",
    hadith: "Fasting the Day of Arafah, I hope Allah will expiate the sins of the previous year and the coming year. (Muslim)",
    color: "#059669",
    when: "9th of Dhul Hijjah (for non-Hajj pilgrims)",
    reward: "Expiation of sins of the previous AND coming year — the greatest reward for a single voluntary fast.",
  },
  {
    id: "shawwal",
    name: "Six Days of Shawwal",
    arabic: "سِتَّة مِن شَوَّال",
    description: "Fasting 6 days in the month of Shawwal (after Ramadan). Combined with Ramadan, it is like fasting the whole year.",
    hadith: "Whoever fasts Ramadan and then follows it with six days of Shawwal — it is as if he fasted the whole year. (Muslim)",
    color: "#6366F1",
    when: "Any 6 days in Shawwal (not Eid al-Fitr)",
    reward: "Combined with Ramadan = reward of fasting the entire year.",
  },
  {
    id: "dhul-hijjah",
    name: "First 9 Days of Dhul Hijjah",
    arabic: "أَوَّل عَشَرَة ذِي الْحِجَّة",
    description: "Fasting the first 9 days of Dhul Hijjah — the best days of the year according to many hadiths. Ends with Arafah on the 9th.",
    hadith: "There are no days on which righteous deeds are more beloved to Allah than these days (first 10 of Dhul Hijjah). (Bukhari)",
    color: "#D97706",
    when: "1st–9th of Dhul Hijjah",
    reward: "Greatest days for good deeds, including fasting.",
  },
  {
    id: "custom",
    name: "Other Fast",
    arabic: "صِيَام آخَر",
    description: "Any other voluntary fast you wish to record.",
    hadith: "The Prophet ﷺ said: 'Fast and break fast, pray qiyam and sleep, for your body has a right over you.' (Bukhari)",
    color: "#78716C",
    when: "As desired",
    reward: "Every fast is an act of worship rewarded by Allah.",
  },
];

const FAST_TYPE_MAP = Object.fromEntries(FAST_TYPES.map(f => [f.id, f])) as Record<FastType, VoluntaryFast>;

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FastingTrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<FastRecord[]>([]);
  const [selectedType, setSelectedType] = useState<FastType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const weekDates = useMemo(() => getWeekDates(), []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) setRecords(JSON.parse(data));
    });
  }, []);

  const save = (newRecords: FastRecord[]) => {
    setRecords(newRecords);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  };

  const toggleFast = (date: string, type: FastType) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const exists = records.find(r => r.date === date && r.type === type);
    if (exists) {
      save(records.filter(r => !(r.date === date && r.type === type)));
    } else {
      save([...records, { date, type }]);
    }
  };

  const hasFast = (date: string, type: FastType) => records.some(r => r.date === date && r.type === type);
  const totalFasts = records.length;
  const thisMonthFasts = records.filter(r => r.date.startsWith(new Date().toISOString().slice(0, 7))).length;

  const recentByType = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => { map[r.type] = (map[r.type] || 0) + 1; });
    return map;
  }, [records]);

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Fasting Tracker</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>تَتَبُّع الصِّيَام</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Stats row */}
        <View style={s.statsRow}>
          {[
            { label: "Total Fasts", value: totalFasts, color: colors.primary },
            { label: "This Month", value: thisMonthFasts, color: "#16A34A" },
            { label: "Types Used", value: Object.keys(recentByType).length, color: "#D97706" },
          ].map(stat => (
            <View key={stat.label} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.statNum, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* This Week */}
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>This Week</Text>
        <View style={[s.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {weekDates.map((date, i) => {
            const dateStr = formatDate(date);
            const dayFasts = records.filter(r => r.date === dateStr);
            const isToday = dateStr === formatDate(new Date());
            const isFuture = date > new Date();
            return (
              <View key={i} style={[s.dayCol, isToday && { backgroundColor: colors.primary + "10", borderRadius: 10 }]}>
                <Text style={[s.dayName, { color: isToday ? colors.primary : colors.mutedForeground }]}>{DAY_NAMES[i]}</Text>
                <Text style={[s.dayNum, { color: isToday ? colors.primary : colors.foreground }]}>{date.getDate()}</Text>
                <View style={[s.dayDot, { backgroundColor: dayFasts.length > 0 ? "#16A34A" : colors.border }]}>
                  {dayFasts.length > 0 && <Text style={s.dayDotCount}>{dayFasts.length}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick Log for Today */}
        <View style={s.sectionHeaderRow}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Log Today's Fast</Text>
          <Text style={[s.todayLabel, { color: colors.primary }]}>{new Date().toLocaleDateString("en-US", { weekday: "long" })}</Text>
        </View>
        <View style={s.fastTypeGrid}>
          {FAST_TYPES.map(ft => {
            const isFasted = hasFast(formatDate(new Date()), ft.id);
            return (
              <TouchableOpacity
                key={ft.id}
                style={[s.fastTypeCard, { backgroundColor: isFasted ? ft.color + "20" : colors.card, borderColor: isFasted ? ft.color : colors.border, borderWidth: isFasted ? 1.5 : 1 }]}
                onPress={() => toggleFast(formatDate(new Date()), ft.id)}
                activeOpacity={0.8}
              >
                <View style={[s.fastTypeCheck, { backgroundColor: isFasted ? ft.color : colors.border }]}>
                  {isFasted && <Feather name="check" size={12} color="#FFF" />}
                </View>
                <Text style={[s.fastTypeName, { color: isFasted ? ft.color : colors.foreground }]}>{ft.name}</Text>
                <Text style={[s.fastTypeWhen, { color: colors.mutedForeground }]} numberOfLines={1}>{ft.when}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Voluntary Fasts Guide */}
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Voluntary Fast Guide</Text>
        {FAST_TYPES.filter(ft => ft.id !== "custom").map(ft => (
          <View key={ft.id} style={[s.guideCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: ft.color, borderLeftWidth: 4 }]}>
            <View style={s.guideTop}>
              <View style={s.guideTitles}>
                <Text style={[s.guideName, { color: colors.foreground }]}>{ft.name}</Text>
                <Text style={[s.guideAr, { color: ft.color }]}>{ft.arabic}</Text>
              </View>
              <View style={[s.guideTotal, { backgroundColor: ft.color + "15" }]}>
                <Text style={[s.guideTotalNum, { color: ft.color }]}>{recentByType[ft.id] || 0}</Text>
                <Text style={[s.guideTotalLabel, { color: colors.mutedForeground }]}>logged</Text>
              </View>
            </View>
            <Text style={[s.guideWhen, { color: colors.primary }]}>📅 {ft.when}</Text>
            <Text style={[s.guideReward, { color: colors.mutedForeground }]}>🌟 {ft.reward}</Text>
            <View style={[s.guideHadith, { backgroundColor: colors.gold + "08" }]}>
              <Text style={[s.guideHadithText, { color: colors.mutedForeground }]}>"{ft.hadith}"</Text>
            </View>
          </View>
        ))}

        {/* Recent Log */}
        {records.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Recent Fasts</Text>
            {[...records].reverse().slice(0, 15).map((r, i) => {
              const ft = FAST_TYPE_MAP[r.type];
              const d = new Date(r.date);
              return (
                <View key={i} style={[s.recentRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.recentDot, { backgroundColor: ft.color }]} />
                  <View style={s.recentBody}>
                    <Text style={[s.recentName, { color: colors.foreground }]}>{ft.name}</Text>
                    <Text style={[s.recentDate, { color: colors.mutedForeground }]}>{DAY_NAMES[d.getDay()]}, {MONTHS[d.getMonth()]} {d.getDate()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    save(records.filter((_, j) => [...records].reverse().indexOf(r) !== records.length - 1 - i));
                  }}>
                    <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 18, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 12 },

    content: { paddingHorizontal: 16, paddingTop: 16 },

    statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center" },
    statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "center" },

    sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 10 },
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    todayLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

    weekCard: { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", marginBottom: 20 },
    dayCol: { flex: 1, alignItems: "center", paddingVertical: 6 },
    dayName: { fontSize: 10, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
    dayNum: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 6 },
    dayDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    dayDotCount: { fontSize: 10, color: "#FFF", fontFamily: "Inter_700Bold" },

    fastTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
    fastTypeCard: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 8 },
    fastTypeCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 2 },
    fastTypeName: { flex: 1, fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
    fastTypeWhen: { fontSize: 10, fontFamily: "Inter_400Regular" },

    guideCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
    guideTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 },
    guideTitles: { flex: 1 },
    guideName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
    guideAr: { fontSize: 14 },
    guideTotal: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignItems: "center" },
    guideTotalNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
    guideTotalLabel: { fontSize: 9, fontFamily: "Inter_400Regular" },
    guideWhen: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
    guideReward: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
    guideHadith: { borderRadius: 8, padding: 10 },
    guideHadithText: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic", lineHeight: 18 },

    recentRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10 },
    recentDot: { width: 10, height: 10, borderRadius: 5 },
    recentBody: { flex: 1 },
    recentName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    recentDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  });
}
