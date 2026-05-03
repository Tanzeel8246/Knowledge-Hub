import React, { useState, useCallback, useRef } from "react";
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
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearchQuran } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useDebounce } from "@/hooks/useDebounce";
import type { QuranSearchResults } from "@workspace/api-client-react";

const POPULAR_SEARCHES = [
  "patience", "mercy", "prayer", "paradise", "forgiveness",
  "knowledge", "charity", "trust", "gratitude", "guidance",
];

export default function QuranSearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const inputRef = useRef<TextInput>(null);

  const debouncedQuery = useDebounce(submitted, 300);
  const { data: results, isLoading, error } = useSearchQuran(
    { q: debouncedQuery || "a" },
    { query: { enabled: debouncedQuery.length >= 2, queryKey: [] } } as any
  );

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setSubmitted(q);
    Keyboard.dismiss();
  }, []);

  const handleSubmit = useCallback(() => {
    setSubmitted(query);
    Keyboard.dismiss();
  }, [query]);

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[s.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            style={[s.searchInput, { color: colors.foreground }]}
            placeholder="Search Quran in Arabic or English..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setSubmitted(""); }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={handleSubmit} style={[s.searchBtn, { backgroundColor: colors.primary }]}>
          <Text style={s.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!submitted && (
        <View style={s.popularSection}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Popular Searches</Text>
          <View style={s.pills}>
            {POPULAR_SEARCHES.map(term => (
              <TouchableOpacity
                key={term}
                style={[s.pill, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleSearch(term)}
              >
                <Feather name="trending-up" size={12} color={colors.mutedForeground} />
                <Text style={[s.pillText, { color: colors.foreground }]}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Search Tips</Text>
          {[
            { icon: "type", tip: "Search in English: 'mercy', 'patience', 'guidance'" },
            { icon: "feather", tip: "Search in Arabic: 'رحمة', 'صبر', 'هدى'" },
            { icon: "hash", tip: "Search by surah: 'Al-Baqarah', 'Al-Fatiha'" },
          ].map((t, i) => (
            <View key={i} style={[s.tipRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={t.icon as any} size={16} color={colors.primary} />
              <Text style={[s.tipText, { color: colors.mutedForeground }]}>{t.tip}</Text>
            </View>
          ))}
        </View>
      )}

      {submitted && isLoading && (
        <View style={s.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Searching...</Text>
        </View>
      )}

      {submitted && !isLoading && results && (
        <FlatList
          data={results?.results ?? []}
          keyExtractor={item => `${item.surahNumber}-${item.numberInSurah}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          ListHeaderComponent={
            <View style={s.resultsHeader}>
              <Text style={[s.resultsCount, { color: colors.foreground }]}>
                {results?.total ?? 0} results for "{submitted}"
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/quran/${item.surahNumber}` as any)}
            >
              <View style={s.resultHeader}>
                <View style={[s.surahBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[s.surahBadgeText, { color: colors.primary }]}>
                    {item.surahNumber}:{item.numberInSurah}
                  </Text>
                </View>
                <View style={s.surahInfo}>
                  <Text style={[s.surahName, { color: colors.foreground }]}>Surah {item.surahNumber}</Text>
                  <Text style={[s.surahSub, { color: colors.mutedForeground }]}>Ayah {item.numberInSurah} · Juz {item.juzNumber}</Text>
                </View>
              </View>
              <Text style={[s.ayahArabic, { color: colors.foreground }]}>{item.arabic}</Text>
              {item.translationEn && (
                <Text style={[s.ayahTranslation, { color: colors.mutedForeground }]} numberOfLines={3}>{item.translationEn}</Text>
              )}
              <View style={s.resultFooter}>
                <Feather name="arrow-right" size={14} color={colors.primary} />
                <Text style={[s.openText, { color: colors.primary }]}>Open Surah</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="search" size={36} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No results found</Text>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                Try a different search term or check the spelling
              </Text>
            </View>
          }
        />
      )}

      {submitted && error && (
        <View style={s.loading}>
          <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Could not search. Please try again.</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
    searchBox: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, gap: 8 },
    searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
    searchBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    searchBtnText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14 },
    popularSection: { padding: 16 },
    sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
    pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    pillText: { fontSize: 13, fontFamily: "Inter_400Regular" },
    tipRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 8 },
    tipText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
    loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    loadingText: { fontSize: 15, fontFamily: "Inter_400Regular" },
    resultsHeader: { marginBottom: 12 },
    resultsCount: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    resultCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
    resultHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    surahBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    surahBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    surahInfo: { flex: 1 },
    surahName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    surahSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
    surahArabicName: { fontSize: 18 },
    ayahArabic: { fontSize: 20, lineHeight: 36, textAlign: "right", marginBottom: 8, fontFamily: "Inter_400Regular" },
    ayahTranslation: { fontSize: 13, lineHeight: 20, fontFamily: "Inter_400Regular", marginBottom: 8 },
    resultFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
    openText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    empty: { alignItems: "center", gap: 10, marginTop: 40 },
    emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  });
}
