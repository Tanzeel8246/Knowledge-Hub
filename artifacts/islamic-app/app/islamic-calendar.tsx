import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

// Gregorian to Hijri conversion (Kuwaiti algorithm)
function gregorianToHijri(gYear: number, gMonth: number, gDay: number): { year: number; month: number; day: number } {
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

function getDaysInHijriMonth(hYear: number, hMonth: number): number {
  return hMonth % 2 !== 0 || (hMonth === 12 && isHijriLeapYear(hYear)) ? 30 : 29;
}

function isHijriLeapYear(hYear: number): boolean {
  return ((hYear * 11) + 14) % 30 < 11;
}

function hijriToGregorian(hYear: number, hMonth: number, hDay: number): Date {
  const N = hDay + Math.ceil(29.5001 * (hMonth - 1)) + (hYear - 1) * 354 + Math.floor((3 + 11 * hYear) / 30) + 1948440 - 385;
  let J = N;
  if (N > 2299160) {
    const alpha = Math.floor((N - 1867216.25) / 36524.25);
    J = N + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = J + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  return new Date(year, month - 1, day);
}

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
];

const HIJRI_MONTHS_AR = [
  "مُحَرَّم", "صَفَر", "رَبِيع الأَوَّل", "رَبِيع الثَّانِي",
  "جُمَادَى الأُولَى", "جُمَادَى الثَّانِيَة", "رَجَب", "شَعْبَان",
  "رَمَضَان", "شَوَّال", "ذُو القَعْدَة", "ذُو الحِجَّة",
];

const GREG_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface IslamicEvent {
  hijriMonth: number;
  hijriDay: number;
  name: string;
  nameAr: string;
  color: string;
  importance: "high" | "medium" | "low";
}

const ISLAMIC_EVENTS: IslamicEvent[] = [
  { hijriMonth: 1, hijriDay: 1, name: "Islamic New Year", nameAr: "رأس السنة الهجرية", color: "#0D9373", importance: "high" },
  { hijriMonth: 1, hijriDay: 10, name: "Day of Ashura", nameAr: "يوم عاشوراء", color: "#7C3AED", importance: "high" },
  { hijriMonth: 3, hijriDay: 12, name: "Mawlid al-Nabi ﷺ", nameAr: "المولد النبوي الشريف", color: "#D97706", importance: "high" },
  { hijriMonth: 7, hijriDay: 27, name: "Isra & Mi'raj", nameAr: "الإسراء والمعراج", color: "#0891B2", importance: "high" },
  { hijriMonth: 8, hijriDay: 15, name: "Shab-e-Barat (Sha'ban 15)", nameAr: "ليلة البراءة", color: "#6366F1", importance: "medium" },
  { hijriMonth: 9, hijriDay: 1, name: "Ramadan Begins", nameAr: "بداية رمضان المبارك", color: "#0D9373", importance: "high" },
  { hijriMonth: 9, hijriDay: 17, name: "Battle of Badr", nameAr: "غزوة بدر الكبرى", color: "#DC2626", importance: "medium" },
  { hijriMonth: 9, hijriDay: 27, name: "Laylat al-Qadr (likely)", nameAr: "ليلة القدر", color: "#D97706", importance: "high" },
  { hijriMonth: 10, hijriDay: 1, name: "Eid al-Fitr", nameAr: "عيد الفطر المبارك", color: "#0D9373", importance: "high" },
  { hijriMonth: 12, hijriDay: 8, name: "Day of Tarwiyah", nameAr: "يوم التروية", color: "#059669", importance: "medium" },
  { hijriMonth: 12, hijriDay: 9, name: "Day of Arafah", nameAr: "يوم عرفة", color: "#0D9373", importance: "high" },
  { hijriMonth: 12, hijriDay: 10, name: "Eid al-Adha", nameAr: "عيد الأضحى المبارك", color: "#0D9373", importance: "high" },
  { hijriMonth: 12, hijriDay: 11, name: "Days of Tashreeq (1)", nameAr: "أيام التشريق", color: "#059669", importance: "low" },
  { hijriMonth: 12, hijriDay: 12, name: "Days of Tashreeq (2)", nameAr: "أيام التشريق", color: "#059669", importance: "low" },
  { hijriMonth: 12, hijriDay: 13, name: "Days of Tashreeq (3)", nameAr: "أيام التشريق", color: "#059669", importance: "low" },
];

export default function IslamicCalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const today = new Date();
  const todayHijri = gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [hYear, setHYear] = useState(todayHijri.year);
  const [hMonth, setHMonth] = useState(todayHijri.month);

  const daysInMonth = getDaysInHijriMonth(hYear, hMonth);

  // Find which Gregorian day the 1st of this Hijri month falls on
  const firstDayGreg = hijriToGregorian(hYear, hMonth, 1);
  const startWeekday = firstDayGreg.getDay(); // 0=Sun

  // Events in this month
  const monthEvents = ISLAMIC_EVENTS.filter(e => e.hijriMonth === hMonth);

  // Upcoming events across all months (sorted)
  const upcomingEvents = useMemo(() => {
    const result: { event: IslamicEvent; hYear: number; gregDate: Date }[] = [];
    for (let offset = 0; offset <= 12; offset++) {
      const m = ((hMonth - 1 + offset) % 12) + 1;
      const y = hYear + Math.floor((hMonth - 1 + offset) / 12);
      ISLAMIC_EVENTS
        .filter(e => e.hijriMonth === m)
        .forEach(e => {
          const gd = hijriToGregorian(y, m, e.hijriDay);
          result.push({ event: e, hYear: y, gregDate: gd });
        });
    }
    return result
      .filter(r => r.gregDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
      .sort((a, b) => a.gregDate.getTime() - b.gregDate.getTime())
      .slice(0, 8);
  }, [hMonth, hYear]);

  const prevMonth = () => {
    if (hMonth === 1) { setHMonth(12); setHYear(y => y - 1); }
    else setHMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (hMonth === 12) { setHMonth(1); setHYear(y => y + 1); }
    else setHMonth(m => m + 1);
  };
  const goToday = () => { setHYear(todayHijri.year); setHMonth(todayHijri.month); };

  const s = makeStyles(colors);

  const dayHasEvent = (d: number) => monthEvents.some(e => e.hijriDay === d);
  const dayEventColor = (d: number) => {
    const ev = monthEvents.find(e => e.hijriDay === d);
    return ev?.color;
  };
  const isToday = (d: number) => hYear === todayHijri.year && hMonth === todayHijri.month && d === todayHijri.day;

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Islamic Calendar</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>التقويم الهجري</Text>
        </View>
        <TouchableOpacity style={[s.todayBtn, { backgroundColor: colors.primary + "20" }]} onPress={goToday}>
          <Text style={[s.todayBtnText, { color: colors.primary }]}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Hijri Date Banner */}
      <View style={[s.todayBanner, { backgroundColor: colors.navy }]}>
        <View style={s.todayRow}>
          <View>
            <Text style={s.todayHijri}>{todayHijri.day} {HIJRI_MONTHS[todayHijri.month - 1]} {todayHijri.year} AH</Text>
            <Text style={[s.todayHijriAr, { color: colors.gold }]}>{todayHijri.day} {HIJRI_MONTHS_AR[todayHijri.month - 1]}</Text>
          </View>
          <View style={s.todaySeparator} />
          <View>
            <Text style={s.todayGreg}>{today.toLocaleDateString("en-US", { weekday: "long" })}</Text>
            <Text style={s.todayGreg}>{today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</Text>
          </View>
        </View>
      </View>

      {/* Month Navigation */}
      <View style={s.monthNav}>
        <TouchableOpacity style={[s.navArrow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={prevMonth}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.monthTitle}>
          <Text style={[s.monthName, { color: colors.foreground }]}>{HIJRI_MONTHS[hMonth - 1]}</Text>
          <Text style={[s.monthNameAr, { color: colors.gold }]}>{HIJRI_MONTHS_AR[hMonth - 1]} {hYear} AH</Text>
        </View>
        <TouchableOpacity style={[s.navArrow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={nextMonth}>
          <Feather name="chevron-right" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={s.weekRow}>
        {WEEKDAYS.map(d => (
          <View key={d} style={s.weekCell}>
            <Text style={[s.weekDay, { color: d === "Fri" ? colors.primary : colors.mutedForeground }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={s.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={s.dayCell} />;
          const today_ = isToday(day);
          const evColor = dayEventColor(day);
          const hasEv = dayHasEvent(day);
          return (
            <View key={`d-${day}`} style={[s.dayCell, today_ && { backgroundColor: colors.primary, borderRadius: 12 }]}>
              <Text style={[s.dayNum, {
                color: today_ ? "#FFF" : day % 7 === 6 ? colors.gold : colors.foreground,
                fontFamily: today_ ? "Inter_700Bold" : "Inter_400Regular",
              }]}>{day}</Text>
              {hasEv && <View style={[s.eventDot, { backgroundColor: today_ ? "#FFF" : (evColor ?? colors.gold) }]} />}
            </View>
          );
        })}
      </View>

      {/* This Month Events */}
      {monthEvents.length > 0 && (
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Events this month</Text>
          {monthEvents.map((ev, i) => (
            <View key={i} style={[s.eventCard, { backgroundColor: colors.card, borderColor: ev.color + "40", borderLeftColor: ev.color }]}>
              <View style={s.eventCardLeft}>
                <View style={[s.eventDateCircle, { backgroundColor: ev.color + "20" }]}>
                  <Text style={[s.eventDateDay, { color: ev.color }]}>{ev.hijriDay}</Text>
                  <Text style={[s.eventDateSuffix, { color: ev.color }]}>{HIJRI_MONTHS[ev.hijriMonth - 1].substring(0, 3)}</Text>
                </View>
              </View>
              <View style={s.eventCardBody}>
                <Text style={[s.eventName, { color: colors.foreground }]}>{ev.name}</Text>
                <Text style={[s.eventNameAr, { color: ev.color }]}>{ev.nameAr}</Text>
              </View>
              {ev.importance === "high" && (
                <View style={[s.importanceBadge, { backgroundColor: ev.color + "20" }]}>
                  <Feather name="star" size={10} color={ev.color} />
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Upcoming Events */}
      <View style={[s.section, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Upcoming Events</Text>
        {upcomingEvents.map((ev, i) => {
          const daysUntil = Math.round((ev.gregDate.getTime() - today.getTime()) / 86400000);
          return (
            <View key={i} style={[s.upcomingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.upcomingDot, { backgroundColor: ev.event.color }]} />
              <View style={s.upcomingBody}>
                <Text style={[s.upcomingName, { color: colors.foreground }]}>{ev.event.name}</Text>
                <Text style={[s.upcomingDate, { color: colors.mutedForeground }]}>
                  {ev.event.hijriDay} {HIJRI_MONTHS[ev.event.hijriMonth - 1]} {ev.hYear} AH · {ev.gregDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </Text>
              </View>
              <View style={[s.daysTag, { backgroundColor: ev.event.color + "20" }]}>
                <Text style={[s.daysTagText, { color: ev.event.color }]}>
                  {daysUntil === 0 ? "Today" : `${daysUntil}d`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 20, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 13 },
    todayBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    todayBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    todayBanner: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
    todayRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    todayHijri: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 3 },
    todayHijriAr: { fontSize: 14 },
    todaySeparator: { width: 1, height: 40, backgroundColor: "#FFFFFF30" },
    todayGreg: { fontSize: 13, color: "#FFFFFF80", fontFamily: "Inter_400Regular" },
    monthNav: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
    navArrow: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
    monthTitle: { flex: 1, alignItems: "center" },
    monthName: { fontSize: 18, fontFamily: "Inter_700Bold" },
    monthNameAr: { fontSize: 13 },
    weekRow: { flexDirection: "row", paddingHorizontal: 12, marginBottom: 4 },
    weekCell: { flex: 1, alignItems: "center", paddingVertical: 6 },
    weekDay: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, marginBottom: 8 },
    dayCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 2 },
    dayNum: { fontSize: 14 },
    eventDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 1 },
    section: { paddingHorizontal: 16, marginBottom: 8 },
    sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
    eventCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 12, marginBottom: 8 },
    eventCardLeft: { marginRight: 12 },
    eventDateCircle: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    eventDateDay: { fontSize: 18, fontFamily: "Inter_700Bold", lineHeight: 20 },
    eventDateSuffix: { fontSize: 9, fontFamily: "Inter_400Regular" },
    eventCardBody: { flex: 1 },
    eventName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    eventNameAr: { fontSize: 13 },
    importanceBadge: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    upcomingCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
    upcomingDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    upcomingBody: { flex: 1 },
    upcomingName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    upcomingDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
    daysTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    daysTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  });
}
