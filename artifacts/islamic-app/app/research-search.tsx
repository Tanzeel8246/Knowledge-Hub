import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useDebounce } from "@/hooks/useDebounce";
import { shamelaStorage, SearchSnippet } from "@/lib/shamelaStorage";
import { FALLBACK_CATEGORIES } from "@/constants/booksData";

const RESEARCH_KEYWORDS = [
  { label: "نماز / الصلاة", query: "الصلاة" },
  { label: "وضوء / الطهارة", query: "الوضوء" },
  { label: "اخلاص و نیت", query: "النية" },
  { label: "توبہ و استغفار", query: "التوبة" },
  { label: "زکوٰۃ و صدقات", query: "الزكاة" },
  { label: "حرمتِ سود (ربا)", query: "الربا" },
  { label: "صبر و استقامت", query: "الصبر" },
  { label: "تقویٰ و اخلاق", query: "التقوى" },
];

export default function ResearchSearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedScope, setSelectedScope] = useState<"all" | "books" | "hadith">("all");
  const [results, setResults] = useState<SearchSnippet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const debouncedQuery = useDebounce(query, 250);

  const performSearch = useCallback(async (q: string, cat: string | null, scope: "all" | "books" | "hadith") => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await shamelaStorage.searchAcrossLibrary(q, {
        category: cat ?? undefined,
        scope,
        maxResults: 60,
      });
      setResults(searchResults);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery, selectedCategory, selectedScope);
  }, [debouncedQuery, selectedCategory, selectedScope, performSearch]);

  const handleSelectKeyword = (keywordQuery: string) => {
    setQuery(keywordQuery);
    Keyboard.dismiss();
  };

  const handleItemPress = (item: SearchSnippet) => {
    if (item.type === "book") {
      if (item.sectionId) {
        router.push(`/book/${item.sourceId}/${item.sectionId}` as any);
      } else {
        router.push(`/book/${item.sourceId}` as any);
      }
    } else {
      const bNum = item.sectionId ? Number(item.sectionId) : 1;
      router.push(`/hadith/${item.sourceId}/${bNum}?targetHadith=${item.sectionNumber}` as any);
    }
  };

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Shamela Research Search</Text>
          <Text style={[s.subtitle, { color: colors.gold }]}>البحث الشامل في المكتبة الإسلامية</Text>
        </View>
      </View>

      {/* Search Input Box */}
      <View style={[s.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          ref={inputRef}
          style={[s.input, { color: colors.foreground }]}
          placeholder="تفسیر، حدیث، فقہ یا سیرت میں تلاش کریں..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoFocus={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} style={s.clearBtn}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Scope Toggles: All | Classical Books | Hadith Collections */}
      <View style={s.scopeRow}>
        <TouchableOpacity
          onPress={() => setSelectedScope("all")}
          style={[
            s.scopeChip,
            {
              backgroundColor: selectedScope === "all" ? colors.primary : colors.card,
              borderColor: selectedScope === "all" ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[s.scopeChipText, { color: selectedScope === "all" ? "#FFF" : colors.mutedForeground }]}>
            All Library (تمام ذخیرہ)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedScope("books")}
          style={[
            s.scopeChip,
            {
              backgroundColor: selectedScope === "books" ? colors.primary : colors.card,
              borderColor: selectedScope === "books" ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[s.scopeChipText, { color: selectedScope === "books" ? "#FFF" : colors.mutedForeground }]}>
            Books (40+ کتب)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedScope("hadith")}
          style={[
            s.scopeChip,
            {
              backgroundColor: selectedScope === "hadith" ? colors.primary : colors.card,
              borderColor: selectedScope === "hadith" ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[s.scopeChipText, { color: selectedScope === "hadith" ? "#FFF" : colors.mutedForeground }]}>
            Hadith (22 کتب حدیث)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Research Topic Pills */}
      <View style={s.keywordRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={RESEARCH_KEYWORDS}
          keyExtractor={item => item.query}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectKeyword(item.query)}
              style={[
                s.keywordChip,
                {
                  backgroundColor: query === item.query ? colors.gold + "30" : colors.card,
                  borderColor: query === item.query ? colors.gold : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  s.keywordText,
                  { color: query === item.query ? colors.gold : colors.foreground },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results Header or Loading indicator */}
      {isSearching && (
        <View style={s.loadingContainer}>
          <ActivityIndicator color={colors.gold} size="small" />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Searching Maktaba Database...</Text>
        </View>
      )}

      {/* Search Results List */}
      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item.type}_${item.sourceId}_${item.sectionId}_${idx}`}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 40,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          query.trim().length >= 2 && !isSearching ? (
            <View style={s.resultsMeta}>
              <Text style={[s.resultsCount, { color: colors.mutedForeground }]}>
                {results.length} results found for "{query}"
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
          >
            <View style={s.cardTop}>
              <View
                style={[
                  s.typeBadge,
                  {
                    backgroundColor:
                      item.type === "hadith" ? colors.primary + "20" : colors.gold + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    s.typeBadgeText,
                    { color: item.type === "hadith" ? colors.primary : colors.gold },
                  ]}
                >
                  {item.type === "hadith" ? "HADITH" : "BOOK"}
                </Text>
              </View>

              <Text style={[s.sourceTitle, { color: colors.foreground }]} numberOfLines={1}>
                {item.sourceTitle}
              </Text>
            </View>

            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.primary }]}>{item.sectionTitle}</Text>
              {item.sourceTitleArabic && (
                <Text style={[s.arabicSource, { color: colors.gold }]}>{item.sourceTitleArabic}</Text>
              )}
            </View>

            <Text style={[s.snippetText, { color: colors.foreground }]} numberOfLines={3}>
              {item.textSnippet}
            </Text>

            <View style={s.cardFooter}>
              <View style={s.jumpAction}>
                <Text style={[s.jumpText, { color: colors.primary }]}>Read Full Section</Text>
                <Feather name="arrow-right" size={14} color={colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isSearching && query.trim().length >= 2 ? (
            <View style={s.emptyContainer}>
              <MaterialCommunityIcons name="book-search-outline" size={48} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No Matching Results</Text>
              <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
                Try searching with Arabic roots, Urdu keywords, or another spelling.
              </Text>
            </View>
          ) : !isSearching && query.trim().length === 0 ? (
            <View style={s.emptyContainer}>
              <MaterialCommunityIcons name="bookshelf" size={54} color={colors.gold} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>
                Maktaba Shamela / Islam360 Search
              </Text>
              <Text style={[s.emptyDesc, { color: colors.mutedForeground }]}>
                Instant offline full-text search across all 42 classical books and 22 Hadith collections.
                Select any topic above or enter an Arabic or Urdu term.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      gap: 12,
    },
    backBtn: { padding: 4 },
    headerCenter: { flex: 1 },
    title: { fontSize: 20, fontFamily: "Inter_700Bold" },
    subtitle: { fontSize: 13, marginTop: 1 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      gap: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      textAlign: "right",
    },
    clearBtn: { padding: 4 },
    scopeRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    scopeChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 18,
      borderWidth: 1,
    },
    scopeChipText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
    },
    keywordRow: {
      paddingBottom: 10,
    },
    keywordChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    keywordText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      gap: 8,
    },
    loadingText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    resultsMeta: {
      paddingBottom: 8,
    },
    resultsCount: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    resultCard: {
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    typeBadgeText: {
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.5,
    },
    sourceTitle: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      flex: 1,
    },
    arabicSource: {
      fontSize: 13,
      textAlign: "right",
    },
    snippetText: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: "Inter_400Regular",
      marginBottom: 10,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    jumpAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    jumpText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 40,
      paddingHorizontal: 24,
      gap: 10,
    },
    emptyTitle: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
    },
    emptyDesc: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
  });
}
