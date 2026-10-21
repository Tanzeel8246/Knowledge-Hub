import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetHadithCollections } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { FALLBACK_HADITH_COLLECTIONS } from "@/constants/hadithData";

export default function HadithScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: collections, isLoading } = useGetHadithCollections();

  const displayCollections: any[] = ((collections as any[]) && (collections as any[]).length > 0) ? (collections as any[]) : (FALLBACK_HADITH_COLLECTIONS as any[]);
  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.foreground }]}>Hadith Library</Text>
          <Text style={[s.subtitle, { color: colors.gold }]}>كتب الحديث (22 کتبِ معتمدہ)</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.push("/research-search" as any)}
            style={{ padding: 8, borderRadius: 10, backgroundColor: colors.gold + "20" }}
            accessibilityLabel="Hadith Search"
          >
            <Feather name="search" size={20} color={colors.gold} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/downloads" as any)}
            style={{ padding: 8, borderRadius: 10, backgroundColor: colors.primary + "20" }}
            accessibilityLabel="Offline Downloads"
          >
            <Feather name="download" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && displayCollections.length === 0 && false ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayCollections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/hadith/${item.id}` as any)}
            >
              <View style={[s.iconBadge, { backgroundColor: colors.gold + "20" }]}>
                <Feather name="book" size={22} color={colors.gold} />
              </View>
              <View style={s.info}>
                <Text style={[s.name, { color: colors.foreground }]}>{item.name}</Text>
                {item.nameArabic && (
                  <Text style={[s.arabic, { color: colors.gold }]}>{item.nameArabic}</Text>
                )}
                <Text style={[s.meta, { color: colors.mutedForeground }]}>
                  by {item.author} · {item.totalHadiths?.toLocaleString()} hadiths
                </Text>
                {item.description && (
                  <Text style={[s.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{item.description}</Text>
                )}
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="book" size={40} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No collections yet</Text>
              <Text style={[s.emptyHint, { color: colors.mutedForeground }]}>Content will appear after seeding</Text>
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
    subtitle: { fontSize: 15, marginBottom: 8, fontFamily: "NotoNastaliqUrdu_700Bold", lineHeight: 28 },
    card: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, gap: 14 },
    iconBadge: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    info: { flex: 1 },
    name: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    arabic: { fontSize: 16, marginBottom: 2, fontFamily: "Amiri_700Bold", lineHeight: 28 },
    meta: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
    desc: { fontSize: 12, fontFamily: "Inter_400Regular" },
    empty: { alignItems: "center", marginTop: 60, gap: 10 },
    emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  });
}
