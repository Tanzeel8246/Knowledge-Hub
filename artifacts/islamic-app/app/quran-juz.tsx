import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface JuzInfo {
  juz: number;
  nameAr: string;
  nameTranslit: string;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  startSurahName: string;
  endSurahName: string;
  totalAyahs: number;
}

const JUZ_DATA: JuzInfo[] = [
  { juz: 1,  nameAr: "الم",           nameTranslit: "Alif Lam Mim",    startSurah: 1,  startAyah: 1,  endSurah: 2,   endAyah: 141, startSurahName: "Al-Fatihah",  endSurahName: "Al-Baqarah",  totalAyahs: 148 },
  { juz: 2,  nameAr: "سَيَقُولُ",     nameTranslit: "Sayaqool",         startSurah: 2,  startAyah: 142,endSurah: 2,   endAyah: 252, startSurahName: "Al-Baqarah", endSurahName: "Al-Baqarah",  totalAyahs: 111 },
  { juz: 3,  nameAr: "تِلْكَ الرُّسُلُ", nameTranslit: "Tilka-r-rusul", startSurah: 2,  startAyah: 253,endSurah: 3,   endAyah: 92,  startSurahName: "Al-Baqarah", endSurahName: "Ali Imran",   totalAyahs: 126 },
  { juz: 4,  nameAr: "لَن تَنَالُوا", nameTranslit: "Lan tanaloo",     startSurah: 3,  startAyah: 93, endSurah: 4,   endAyah: 23,  startSurahName: "Ali Imran",  endSurahName: "An-Nisa",     totalAyahs: 117 },
  { juz: 5,  nameAr: "وَالْمُحْصَنَات", nameTranslit: "Wal-muhsanat",  startSurah: 4,  startAyah: 24, endSurah: 4,   endAyah: 147, startSurahName: "An-Nisa",    endSurahName: "An-Nisa",     totalAyahs: 124 },
  { juz: 6,  nameAr: "لَا يُحِبُّ اللَّه", nameTranslit: "La yuhibbu-l-lah", startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81, startSurahName: "An-Nisa",  endSurahName: "Al-Maidah",   totalAyahs: 110 },
  { juz: 7,  nameAr: "وَإِذَا سَمِعُوا", nameTranslit: "Wa idha samioo", startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110, startSurahName: "Al-Maidah",  endSurahName: "Al-An'am",    totalAyahs: 149 },
  { juz: 8,  nameAr: "وَلَوْ أَنَّنَا", nameTranslit: "Wa law annana", startSurah: 6,  startAyah: 111,endSurah: 7,   endAyah: 87,  startSurahName: "Al-An'am",   endSurahName: "Al-A'raf",    totalAyahs: 142 },
  { juz: 9,  nameAr: "قَالَ الْمَلَأُ", nameTranslit: "Qalal malao",   startSurah: 7,  startAyah: 88, endSurah: 8,   endAyah: 40,  startSurahName: "Al-A'raf",   endSurahName: "Al-Anfal",    totalAyahs: 159 },
  { juz: 10, nameAr: "وَاعْلَمُوا",    nameTranslit: "Wa'lamu",         startSurah: 8,  startAyah: 41, endSurah: 9,   endAyah: 92,  startSurahName: "Al-Anfal",   endSurahName: "At-Tawbah",   totalAyahs: 129 },
  { juz: 11, nameAr: "يَعْتَذِرُونَ", nameTranslit: "Ya'tathiroon",    startSurah: 9,  startAyah: 93, endSurah: 11,  endAyah: 5,   startSurahName: "At-Tawbah",  endSurahName: "Hud",         totalAyahs: 151 },
  { juz: 12, nameAr: "وَمَا مِنْ دَابَّة", nameTranslit: "Wa ma min daabbah", startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52, startSurahName: "Hud",     endSurahName: "Yusuf",       totalAyahs: 170 },
  { juz: 13, nameAr: "وَمَا أُبَرِّئُ", nameTranslit: "Wa ma ubarri'u", startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52, startSurahName: "Yusuf",      endSurahName: "Ibrahim",     totalAyahs: 154 },
  { juz: 14, nameAr: "رُبَمَا",         nameTranslit: "Rubama",          startSurah: 15, startAyah: 1,  endSurah: 16,  endAyah: 128, startSurahName: "Al-Hijr",    endSurahName: "An-Nahl",     totalAyahs: 227 },
  { juz: 15, nameAr: "سُبْحَانَ الَّذِي", nameTranslit: "Subhana-l-lathi", startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74, startSurahName: "Al-Isra",   endSurahName: "Al-Kahf",     totalAyahs: 185 },
  { juz: 16, nameAr: "قَالَ أَلَمْ",   nameTranslit: "Qala alam",       startSurah: 18, startAyah: 75, endSurah: 20,  endAyah: 135, startSurahName: "Al-Kahf",    endSurahName: "Ta-Ha",       totalAyahs: 196 },
  { juz: 17, nameAr: "اقْتَرَبَ لِلنَّاس", nameTranslit: "Iqtaraba lin-nas", startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78, startSurahName: "Al-Anbiya", endSurahName: "Al-Hajj",    totalAyahs: 156 },
  { juz: 18, nameAr: "قَدْ أَفْلَحَ",  nameTranslit: "Qad aflaha",      startSurah: 23, startAyah: 1,  endSurah: 25,  endAyah: 20,  startSurahName: "Al-Mu'minoon", endSurahName: "Al-Furqan", totalAyahs: 171 },
  { juz: 19, nameAr: "وَقَالَ الَّذِينَ", nameTranslit: "Wa qala-l-lathina", startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55, startSurahName: "Al-Furqan", endSurahName: "An-Naml",  totalAyahs: 171 },
  { juz: 20, nameAr: "أَمَّنْ خَلَقَ", nameTranslit: "Amman khalaqa",  startSurah: 27, startAyah: 56, endSurah: 29,  endAyah: 45,  startSurahName: "An-Naml",    endSurahName: "Al-Ankabut", totalAyahs: 170 },
  { juz: 21, nameAr: "اتْلُ مَا أُوحِيَ", nameTranslit: "Utlu ma oohiya", startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30, startSurahName: "Al-Ankabut", endSurahName: "Al-Ahzab",  totalAyahs: 185 },
  { juz: 22, nameAr: "وَمَنْ يَقْنُت",  nameTranslit: "Wa man yaqnut",   startSurah: 33, startAyah: 31, endSurah: 36,  endAyah: 27,  startSurahName: "Al-Ahzab",   endSurahName: "Ya-Seen",    totalAyahs: 177 },
  { juz: 23, nameAr: "وَمَا لِيَ",      nameTranslit: "Wa ma liya",      startSurah: 36, startAyah: 28, endSurah: 39,  endAyah: 31,  startSurahName: "Ya-Seen",    endSurahName: "Az-Zumar",   totalAyahs: 176 },
  { juz: 24, nameAr: "فَمَنْ أَظْلَمُ", nameTranslit: "Faman azlamu",   startSurah: 39, startAyah: 32, endSurah: 41,  endAyah: 46,  startSurahName: "Az-Zumar",   endSurahName: "Fussilat",   totalAyahs: 176 },
  { juz: 25, nameAr: "إِلَيْهِ يُرَدُّ", nameTranslit: "Ilayhi yuraddu", startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37, startSurahName: "Fussilat",   endSurahName: "Al-Jathiyah", totalAyahs: 193 },
  { juz: 26, nameAr: "حَم",             nameTranslit: "Ha Mim",          startSurah: 46, startAyah: 1,  endSurah: 51,  endAyah: 30,  startSurahName: "Al-Ahqaf",   endSurahName: "Adh-Dhariyat", totalAyahs: 195 },
  { juz: 27, nameAr: "قَالَ فَمَا خَطْبُكُم", nameTranslit: "Qala fama khatbukum", startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29, startSurahName: "Adh-Dhariyat", endSurahName: "Al-Hadid", totalAyahs: 176 },
  { juz: 28, nameAr: "قَدْ سَمِعَ",    nameTranslit: "Qad sami'a",     startSurah: 58, startAyah: 1,  endSurah: 66,  endAyah: 12,  startSurahName: "Al-Mujadila", endSurahName: "At-Tahrim",  totalAyahs: 137 },
  { juz: 29, nameAr: "تَبَارَكَ",      nameTranslit: "Tabarak",         startSurah: 67, startAyah: 1,  endSurah: 77,  endAyah: 50,  startSurahName: "Al-Mulk",    endSurahName: "Al-Mursalat", totalAyahs: 431 },
  { juz: 30, nameAr: "عَمَّ",           nameTranslit: "Amma",            startSurah: 78, startAyah: 1,  endSurah: 114, endAyah: 6,   startSurahName: "An-Naba",    endSurahName: "An-Nas",     totalAyahs: 564 },
];

const JUZ_COLORS = [
  "#16A34A","#0891B2","#7C3AED","#D97706","#DC2626",
  "#059669","#2563EB","#9333EA","#EA580C","#0D9488",
  "#16A34A","#0891B2","#7C3AED","#D97706","#DC2626",
  "#059669","#2563EB","#9333EA","#EA580C","#0D9488",
  "#16A34A","#0891B2","#7C3AED","#D97706","#DC2626",
  "#059669","#2563EB","#9333EA","#EA580C","#0D9488",
];

export default function QuranJuzScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<"grid" | "list">("grid");
  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Browse by Juz</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>تَصَفُّح بِالأَجْزَاء</Text>
        </View>
        <TouchableOpacity onPress={() => setView(v => v === "grid" ? "list" : "grid")}>
          <Feather name={view === "grid" ? "list" : "grid"} size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Summary banner */}
      <View style={[s.banner, { backgroundColor: colors.navy }]}>
        <View style={s.bannerItem}>
          <Text style={s.bannerNum}>30</Text>
          <Text style={s.bannerLabel}>Ajza</Text>
        </View>
        <View style={[s.bannerDiv, { backgroundColor: "#FFFFFF20" }]} />
        <View style={s.bannerItem}>
          <Text style={s.bannerNum}>114</Text>
          <Text style={s.bannerLabel}>Surahs</Text>
        </View>
        <View style={[s.bannerDiv, { backgroundColor: "#FFFFFF20" }]} />
        <View style={s.bannerItem}>
          <Text style={s.bannerNum}>6,236</Text>
          <Text style={s.bannerLabel}>Ayahs</Text>
        </View>
        <View style={[s.bannerDiv, { backgroundColor: "#FFFFFF20" }]} />
        <View style={s.bannerItem}>
          <Text style={s.bannerNum}>604</Text>
          <Text style={s.bannerLabel}>Pages</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        view === "grid" ? s.grid : s.list,
        { paddingBottom: insets.bottom + 40, paddingHorizontal: 16, paddingTop: 12 }
      ]}>
        {JUZ_DATA.map(juz => {
          const color = JUZ_COLORS[(juz.juz - 1) % JUZ_COLORS.length];
          if (view === "grid") {
            return (
              <TouchableOpacity
                key={juz.juz}
                style={[s.gridCard, { backgroundColor: color + "15", borderColor: color + "40" }]}
                onPress={() => router.push(`/quran/${juz.startSurah}` as any)}
                activeOpacity={0.8}
              >
                <View style={[s.juzBadge, { backgroundColor: color }]}>
                  <Text style={s.juzBadgeNum}>{juz.juz}</Text>
                </View>
                <Text style={[s.gridJuzAr, { color }]}>{juz.nameAr}</Text>
                <Text style={[s.gridJuzTranslit, { color: colors.mutedForeground }]}>{juz.nameTranslit}</Text>
                <Text style={[s.gridFrom, { color: colors.foreground }]}>{juz.startSurahName}</Text>
                <Text style={[s.gridAyahs, { color: colors.mutedForeground }]}>{juz.totalAyahs} ayahs</Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={juz.juz}
              style={[s.listCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: color, borderLeftWidth: 4 }]}
              onPress={() => router.push(`/quran/${juz.startSurah}` as any)}
              activeOpacity={0.8}
            >
              <View style={[s.listJuzCircle, { backgroundColor: color }]}>
                <Text style={s.listJuzNum}>{juz.juz}</Text>
              </View>
              <View style={s.listBody}>
                <View style={s.listTop}>
                  <Text style={[s.listJuzAr, { color }]}>{juz.nameAr}</Text>
                  <Text style={[s.listTranslit, { color: colors.foreground }]}>{juz.nameTranslit}</Text>
                </View>
                <Text style={[s.listRange, { color: colors.mutedForeground }]}>
                  {juz.startSurahName} {juz.startAyah} → {juz.endSurahName} {juz.endAyah}
                </Text>
                <Text style={[s.listAyahs, { color: colors.mutedForeground }]}>{juz.totalAyahs} ayahs</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.border} />
            </TouchableOpacity>
          );
        })}
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

    banner: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 14 },
    bannerItem: { flex: 1, alignItems: "center" },
    bannerNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 2 },
    bannerLabel: { fontSize: 10, color: "#FFFFFF80", fontFamily: "Inter_400Regular" },
    bannerDiv: { width: 1, height: 32 },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    gridCard: { width: "31%", borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
    juzBadge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    juzBadgeNum: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold" },
    gridJuzAr: { fontSize: 16, lineHeight: 26 },
    gridJuzTranslit: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center" },
    gridFrom: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" },
    gridAyahs: { fontSize: 9, fontFamily: "Inter_400Regular" },

    list: {},
    listCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, gap: 12 },
    listJuzCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    listJuzNum: { color: "#FFF", fontSize: 15, fontFamily: "Inter_700Bold" },
    listBody: { flex: 1 },
    listTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 3 },
    listJuzAr: { fontSize: 16, lineHeight: 24 },
    listTranslit: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    listRange: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
    listAyahs: { fontSize: 10, fontFamily: "Inter_400Regular" },
  });
}
