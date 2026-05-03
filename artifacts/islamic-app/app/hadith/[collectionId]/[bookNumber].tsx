import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetHadiths, useCreateBookmark } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";

export default function HadithListScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { collectionId, bookNumber } = useLocalSearchParams<{ collectionId: string; bookNumber: string }>();
  const { data: hadithData, isLoading } = useGetHadiths(collectionId, Number(bookNumber), { page: 1, limit: 50 });
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();

  const s = makeStyles(colors);

  const handleBookmark = async (hadith: any) => {
    try {
      await createBookmark.mutateAsync({
        sourceType: "hadith",
        sourceId: hadith.id,
        label: `${collectionId} ${hadith.hadithNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/bookmarks"] });
      Alert.alert("Bookmarked", "Hadith saved to your workspace");
    } catch {
      Alert.alert("Error", "Could not bookmark this hadith");
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.foreground }]}>{collectionId} — Book {bookNumber}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={hadithData?.hadiths ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.cardHeader}>
                <Text style={[s.hadithNum, { color: colors.primary }]}>#{item.hadithNumber}</Text>
                <View style={s.cardActions}>
                  {item.grade && (
                    <View style={[s.gradeBadge, { backgroundColor: gradeColor(item.grade) + "25" }]}>
                      <Text style={[s.gradeText, { color: gradeColor(item.grade) }]}>{item.grade}</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => handleBookmark(item)}>
                    <Feather name="bookmark" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
              {item.arabic && (
                <Text style={[s.arabic, { color: colors.foreground }]}>{item.arabic}</Text>
              )}
              {item.english && (
                <Text style={[s.english, { color: colors.foreground }]}>{item.english}</Text>
              )}
              {item.narrator && (
                <Text style={[s.narrator, { color: colors.mutedForeground }]}>Narrated by {item.narrator}</Text>
              )}
              {item.reference && (
                <Text style={[s.reference, { color: colors.mutedForeground }]}>{item.reference}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No hadiths found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function gradeColor(grade: string): string {
  if (grade === "Sahih") return "#10B981";
  if (grade === "Hasan") return "#F59E0B";
  if (grade === "Daif") return "#EF4444";
  return "#6B7280";
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 14 },
    title: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1 },
    card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    hadithNum: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    cardActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    gradeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    gradeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    arabic: { fontSize: 18, lineHeight: 34, textAlign: "right", marginBottom: 12 },
    english: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", marginBottom: 10 },
    narrator: { fontSize: 12, fontFamily: "Inter_500Medium", fontStyle: "italic", marginBottom: 4 },
    reference: { fontSize: 11, fontFamily: "Inter_400Regular" },
    empty: { alignItems: "center", marginTop: 60 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  });
}
