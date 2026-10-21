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
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetBooks, useGetBookCategories } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

import { FALLBACK_BOOKS, FALLBACK_CATEGORIES, Book } from "@/constants/booksData";

export default function BooksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [language, setLanguage] = useState<"" | "en" | "ar" | "ur">("");

  const { data: apiBooksData, isLoading: apiLoading } = useGetBooks({
    category: selectedCategory ?? undefined,
    language: language || undefined,
    limit: 50,
  });
  const { data: apiCategories } = useGetBookCategories();
  const categories = (apiCategories && apiCategories.length > 0) ? apiCategories : FALLBACK_CATEGORIES;

  const allBooks = (apiBooksData?.books && apiBooksData.books.length > 0)
    ? apiBooksData.books
    : FALLBACK_BOOKS;

  const filteredBooks = allBooks.filter((b: any) => {
    const matchLang = !language || b.language === language;
    const matchCat = !selectedCategory || b.category === selectedCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      (b.titleArabic && b.titleArabic.includes(q)) ||
      b.author.toLowerCase().includes(q) ||
      (b.authorArabic && b.authorArabic.includes(q)) ||
      (b.description && b.description.toLowerCase().includes(q));
    return matchLang && matchCat && matchSearch;
  });

  const isLoading = apiLoading && (!allBooks || allBooks.length === 0);

  const s = makeStyles(colors);

  const langOptions: { label: string; value: "" | "en" | "ar" | "ur" }[] = [
    { label: "تمام زبانیں", value: "" },
    { label: "اردو (Urdu)", value: "ur" },
    { label: "العربية (Arabic)", value: "ar" },
    { label: "English", value: "en" },
  ];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Islamic Library</Text>
          <Text style={[s.subtitle, { color: colors.gold }]}>المكتبة الإسلامية</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/research-search" as any)}
          style={{ padding: 8, borderRadius: 10, backgroundColor: colors.gold + "20" }}
          accessibilityLabel="Shamela Search"
        >
          <Feather name="search" size={20} color={colors.gold} />
        </TouchableOpacity>
      </View>

      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginTop: 12 }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Search books or authors..."
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

      <View style={s.langRow}>
        {langOptions.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setLanguage(opt.value)}
            style={[s.langChip, {
              backgroundColor: language === opt.value ? colors.primary : colors.card,
              borderColor: language === opt.value ? colors.primary : colors.border,
            }]}
          >
            <Text style={[s.langChipText, { color: language === opt.value ? colors.primaryForeground : colors.mutedForeground }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {categories && categories.length > 0 && (
        <View style={s.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryScroll}>
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              style={[s.catChip, {
                backgroundColor: selectedCategory === null ? colors.gold + "25" : colors.card,
                borderColor: selectedCategory === null ? colors.gold : colors.border,
              }]}
            >
              <Text style={[s.catChipText, { color: selectedCategory === null ? colors.gold : colors.foreground }]}>
                تمام (All)
              </Text>
            </TouchableOpacity>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
                  style={[s.catChip, {
                    backgroundColor: isSelected ? colors.primary + "20" : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[s.catChipText, { color: isSelected ? colors.primary : colors.foreground }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/book/${item.id}` as any)}
            >
              <View style={[s.accent, { backgroundColor: colors.gold }]} />
              <View style={s.bookInfo}>
                <View style={s.bookTop}>
                  <View style={[s.langBadge, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[s.langBadgeText, { color: colors.primary }]}>{item.language.toUpperCase()}</Text>
                  </View>
                  {(item as any).isPublic === false && (
                    <View style={[s.langBadge, { backgroundColor: colors.muted }]}>
                      <Text style={[s.langBadgeText, { color: colors.mutedForeground }]}>Private</Text>
                    </View>
                  )}
                </View>
                <Text style={[s.bookTitle, { color: colors.foreground }]}>{item.title}</Text>
                {item.titleArabic && <Text style={[s.bookArabic, { color: colors.gold }]}>{item.titleArabic}</Text>}
                <Text style={[s.bookAuthor, { color: colors.mutedForeground }]}>by {item.author}</Text>
                {item.description && <Text style={[s.bookDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{item.description}</Text>}
                <View style={s.bookMeta}>
                  <Feather name="layers" size={12} color={colors.mutedForeground} />
                  <Text style={[s.bookMetaText, { color: colors.mutedForeground }]}>{item.totalChapters} chapters</Text>
                  {item.publishedYear && (
                    <>
                      <Text style={[s.bookMetaDot, { color: colors.mutedForeground }]}>·</Text>
                      <Text style={[s.bookMetaText, { color: colors.mutedForeground }]}>{item.publishedYear}</Text>
                    </>
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="book-open" size={40} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No books found</Text>
              {search ? <Text style={[s.emptyHint, { color: colors.mutedForeground }]}>Try a different search term</Text> : null}
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
    header: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
    backBtn: { paddingBottom: 2 },
    headerCenter: { flex: 1 },
    title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 1 },
    subtitle: { fontSize: 14 },
    searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, gap: 8, marginBottom: 8 },
    searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
    langRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
    langChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    langChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
    categoryContainer: { height: 44, marginBottom: 10 },
    categoryScroll: { paddingHorizontal: 16, alignItems: "center", gap: 8 },
    catChip: {
      height: 34,
      paddingHorizontal: 14,
      borderRadius: 17,
      borderWidth: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    catChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    bookCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
    accent: { width: 4, alignSelf: "stretch" },
    bookInfo: { flex: 1, padding: 14 },
    bookTop: { flexDirection: "row", gap: 6, marginBottom: 6 },
    langBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    langBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    bookTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    bookArabic: { fontSize: 14, marginBottom: 2 },
    bookAuthor: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
    bookDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 6 },
    bookMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
    bookMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
    bookMetaDot: { fontSize: 11 },
    empty: { alignItems: "center", marginTop: 60, gap: 10 },
    emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  });
}
