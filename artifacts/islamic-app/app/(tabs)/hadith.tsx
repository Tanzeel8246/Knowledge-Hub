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

export default function HadithScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: collections, isLoading } = useGetHadithCollections();

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
        <Text style={[s.title, { color: colors.foreground }]}>Hadith Library</Text>
        <Text style={[s.subtitle, { color: colors.gold }]}>كتب الحديث</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={collections ?? []}
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
    subtitle: { fontSize: 16, marginBottom: 8 },
    card: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, gap: 14 },
    iconBadge: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    info: { flex: 1 },
    name: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    arabic: { fontSize: 14, marginBottom: 2 },
    meta: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
    desc: { fontSize: 12, fontFamily: "Inter_400Regular" },
    empty: { alignItems: "center", marginTop: 60, gap: 10 },
    emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  });
}
