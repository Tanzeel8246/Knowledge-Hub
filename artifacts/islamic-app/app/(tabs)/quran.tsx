import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetSurahs } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const LAST_READ_KEY = "quran_last_read_v1";

interface LastRead {
  surahNumber: number;
  surahName: string;
  surahNameAr: string;
  timestamp: number;
}

const REVELATION_COLORS: Record<string, string> = {
  Meccan: "#D97706",
  Medinan: "#0891B2",
};

export default function QuranScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "Meccan" | "Medinan">("all");
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const { data: surahs, isLoading } = useGetSurahs();

  useEffect(() => {
    AsyncStorage.getItem(LAST_READ_KEY).then(val => {
      if (val) setLastRead(JSON.parse(val));
    });
  }, []);

  const filtered = (surahs ?? []).filter(s => {
    const matchSearch =
      s.nameEnglish.toLowerCase().includes(search.toLowerCase()) ||
      s.nameTransliteration.toLowerCase().includes(search.toLowerCase()) ||
      s.nameArabic.includes(search) ||
      String(s.number).includes(search);
    const matchFilter = filter === "all" || s.revelationType === filter;
    return matchSearch && matchFilter;
  });

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
        <View style={s.headerTop}>
          <View>
            <Text style={[s.title, { color: colors.foreground }]}>القرآن الكريم</Text>
            <Text style={[s.subtitle, { color: colors.mutedForeground }]}>The Holy Quran · 114 Surahs</Text>
          </View>
          <View style={s.headerBtns}>
            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/quran-juz" as any)}
            >
              <Feather name="layers" size={16} color={colors.primary} />
              <Text style={[s.iconBtnText, { color: colors.primary }]}>Juz</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: colors.navy, borderColor: "transparent" }]}
              onPress={() => router.push("/qaris" as any)}
            >
              <Feather name="mic" size={16} color={colors.gold} />
              <Text style={[s.iconBtnText, { color: colors.gold }]}>Reciters</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Last Read */}
        {lastRead && (
          <TouchableOpacity
            style={[s.lastRead, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}
            onPress={() => router.push(`/quran/${lastRead.surahNumber}` as any)}
            activeOpacity={0.8}
          >
            <View style={[s.lastReadIcon, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="book-open" size={16} color={colors.primary} />
            </View>
            <View style={s.lastReadBody}>
              <Text style={[s.lastReadLabel, { color: colors.primary }]}>Continue Reading</Text>
              <Text style={[s.lastReadName, { color: colors.foreground }]}>
                {lastRead.surahNameAr}  ·  {lastRead.surahName}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Search */}
        <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[s.searchInput, { color: colors.foreground }]}
            placeholder="Search surahs by name, number…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <View style={s.filterRow}>
          {(["all", "Meccan", "Medinan"] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[
                s.filterChip,
                {
                  backgroundColor: filter === f
                    ? (f === "all" ? colors.primary : REVELATION_COLORS[f] ?? colors.primary)
                    : colors.card,
                  borderColor: filter === f
                    ? (f === "all" ? colors.primary : REVELATION_COLORS[f] ?? colors.primary)
                    : colors.border,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterChipText, { color: filter === f ? "#FFF" : colors.mutedForeground }]}>
                {f === "all" ? "All" : f}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          <Text style={[s.countLabel, { color: colors.mutedForeground }]}>{filtered.length} surahs</Text>
        </View>
      </View>

      {/* ── Surah List ── */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.number)}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const revColor = REVELATION_COLORS[item.revelationType] ?? colors.primary;
            return (
              <TouchableOpacity
                style={[s.surahItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/quran/${item.number}` as any)}
                activeOpacity={0.8}
              >
                <View style={[s.numberBadge, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[s.number, { color: colors.primary }]}>{item.number}</Text>
                </View>
                <View style={s.info}>
                  <Text style={[s.name, { color: colors.foreground }]}>{item.nameTransliteration}</Text>
                  <View style={s.metaRow}>
                    <Text style={[s.meta, { color: colors.mutedForeground }]}>{item.nameEnglish}</Text>
                    <Text style={[s.metaDot, { color: colors.border }]}>·</Text>
                    <Text style={[s.meta, { color: colors.mutedForeground }]}>{item.totalAyahs} ayahs</Text>
                    <Text style={[s.metaDot, { color: colors.border }]}>·</Text>
                    <View style={[s.revChip, { backgroundColor: revColor + "15" }]}>
                      <Text style={[s.revChipText, { color: revColor }]}>{item.revelationType}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.right}>
                  <Text style={[s.arabic, { color: colors.gold }]}>{item.nameArabic}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="search" size={32} color={colors.border} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No surahs found</Text>
              <Text style={[s.emptyHint, { color: colors.mutedForeground }]}>Try a different search term</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingBottom: 10 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    title: { fontSize: 28, lineHeight: 40, marginBottom: 2 },
    subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
    headerBtns: { flexDirection: "row", gap: 8, marginTop: 4 },
    iconBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
    iconBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

    lastRead: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, gap: 10 },
    lastReadIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    lastReadBody: { flex: 1 },
    lastReadLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    lastReadName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

    searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, gap: 10, marginBottom: 10 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },

    filterRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    filterChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    countLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },

    surahItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, gap: 12 },
    numberBadge: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    number: { fontSize: 15, fontFamily: "Inter_700Bold" },
    info: { flex: 1 },
    name: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    meta: { fontSize: 11, fontFamily: "Inter_400Regular" },
    metaDot: { fontSize: 11 },
    revChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    revChipText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
    right: { alignItems: "flex-end" },
    arabic: { fontSize: 22, lineHeight: 32 },

    empty: { alignItems: "center", marginTop: 60, gap: 8 },
    emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginTop: 8 },
    emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  });
}
