import React, { useState } from "react";
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
import { useGetSurahs } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

export default function QuranScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { data: surahs, isLoading } = useGetSurahs();

  const filtered = surahs?.filter(s =>
    s.nameEnglish.toLowerCase().includes(search.toLowerCase()) ||
    s.nameTransliteration.toLowerCase().includes(search.toLowerCase()) ||
    s.nameArabic.includes(search) ||
    String(s.number).includes(search)
  ) ?? [];

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
        <Text style={[s.title, { color: colors.foreground }]}>The Holy Quran</Text>
        <Text style={[s.subtitle, { color: colors.gold }]}>القرآن الكريم</Text>
        <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[s.searchInput, { color: colors.foreground }]}
            placeholder="Search surahs..."
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
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.number)}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.surahItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/quran/${item.number}` as any)}
            >
              <View style={[s.numberBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[s.number, { color: colors.primary }]}>{item.number}</Text>
              </View>
              <View style={s.info}>
                <Text style={[s.name, { color: colors.foreground }]}>{item.nameTransliteration}</Text>
                <Text style={[s.meta, { color: colors.mutedForeground }]}>{item.nameEnglish} · {item.totalAyahs} ayahs · {item.revelationType}</Text>
              </View>
              <Text style={[s.arabic, { color: colors.gold }]}>{item.nameArabic}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No surahs found</Text>
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
    header: { paddingHorizontal: 20, paddingBottom: 16 },
    title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 2 },
    subtitle: { fontSize: 16, marginBottom: 16 },
    searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, gap: 10 },
    searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
    surahItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, gap: 14 },
    numberBadge: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    number: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    info: { flex: 1 },
    name: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
    arabic: { fontSize: 20 },
    empty: { alignItems: "center", marginTop: 40 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  });
}
