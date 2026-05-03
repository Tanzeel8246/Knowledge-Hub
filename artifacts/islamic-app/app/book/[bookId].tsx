import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetBook, useGetBookChapters, useCreateBookmark } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";

export default function BookDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { data: book, isLoading: bookLoading } = useGetBook(bookId);
  const { data: chapters, isLoading: chaptersLoading } = useGetBookChapters(bookId);
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();

  const s = makeStyles(colors);

  const isLoading = bookLoading || chaptersLoading;

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.mutedForeground }}>Book not found</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={chapters ?? []}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        ListHeaderComponent={
          <View>
            {/* Hero */}
            <View style={[s.hero, { backgroundColor: colors.navy, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <Feather name="arrow-left" size={22} color="#FFF" />
              </TouchableOpacity>

              <View style={[s.langBadge, { backgroundColor: colors.gold + "25" }]}>
                <Text style={[s.langBadgeText, { color: colors.gold }]}>{book.language.toUpperCase()}</Text>
              </View>

              <Text style={s.heroTitle}>{book.title}</Text>
              {book.titleArabic && (
                <Text style={[s.heroArabic, { color: colors.gold }]}>{book.titleArabic}</Text>
              )}
              <Text style={s.heroAuthor}>by {book.author}</Text>

              {book.description && (
                <Text style={s.heroDesc} numberOfLines={3}>{book.description}</Text>
              )}

              <View style={s.heroMeta}>
                <View style={s.heroMetaItem}>
                  <Feather name="layers" size={14} color="#FFFFFF90" />
                  <Text style={s.heroMetaText}>{book.totalChapters} chapters</Text>
                </View>
                {book.publishedYear && (
                  <View style={s.heroMetaItem}>
                    <Feather name="calendar" size={14} color="#FFFFFF90" />
                    <Text style={s.heroMetaText}>{book.publishedYear}</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={[s.chaptersTitle, { color: colors.foreground }]}>
              Chapters ({chapters?.length ?? 0})
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[s.chapterItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/book/${bookId}/${item.id}` as any)}
          >
            <View style={[s.chapterNum, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[s.chapterNumText, { color: colors.primary }]}>{item.chapterNumber}</Text>
            </View>
            <View style={s.chapterInfo}>
              <Text style={[s.chapterTitle, { color: colors.foreground }]}>{item.title}</Text>
              {item.titleArabic && (
                <Text style={[s.chapterArabic, { color: colors.gold }]}>{item.titleArabic}</Text>
              )}
              {item.content && (
                <Text style={[s.chapterPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {item.content}
                </Text>
              )}
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Feather name="book-open" size={32} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No chapters available</Text>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    hero: { paddingHorizontal: 20, paddingBottom: 24 },
    backBtn: { marginBottom: 16 },
    langBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
    langBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 4 },
    heroArabic: { fontSize: 18, marginBottom: 6 },
    heroAuthor: { fontSize: 13, color: "#FFFFFF90", fontFamily: "Inter_400Regular", marginBottom: 10 },
    heroDesc: { fontSize: 13, lineHeight: 20, color: "#FFFFFF80", fontFamily: "Inter_400Regular", marginBottom: 14 },
    heroMeta: { flexDirection: "row", gap: 20 },
    heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    heroMetaText: { fontSize: 13, color: "#FFFFFF90", fontFamily: "Inter_400Regular" },
    chaptersTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
    chapterItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, gap: 14 },
    chapterNum: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    chapterNumText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    chapterInfo: { flex: 1 },
    chapterTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    chapterArabic: { fontSize: 13, marginBottom: 2 },
    chapterPreview: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
    empty: { alignItems: "center", marginTop: 40, gap: 10 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  });
}
