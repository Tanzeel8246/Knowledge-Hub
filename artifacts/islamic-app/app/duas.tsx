import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useColors } from "@/hooks/useColors";

import { DUAS_COLLECTION, DuaItem } from "@/constants/duasData";

const CATEGORIES = [
  { id: "all", label: "تمام دعائیں (All)", color: "#0D9373" },
  { id: "quranic", label: "قرآنی دعائیں (ربنا)", color: "#D97706" },
  { id: "morning", label: "صبح کے وقت (Morning)", color: "#F59E0B" },
  { id: "evening", label: "شام و رات (Evening)", color: "#6366F1" },
  { id: "prayer", label: "نماز و مسجد (Prayer)", color: "#0D9373" },
  { id: "distress", label: "پریشانی و غم (Distress)", color: "#8B5CF6" },
  { id: "family", label: "اہل و عیال (Family)", color: "#EC4899" },
  { id: "food", label: "کھانا پینا (Food)", color: "#EF4444" },
  { id: "travel", label: "سفر و سواری (Travel)", color: "#0891B2" },
  { id: "forgiveness", label: "توبہ و استغفار (Forgiveness)", color: "#10B981" },
];

export default function DuasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [duaList, setDuaList] = useState<DuaItem[]>(DUAS_COLLECTION);

  React.useEffect(() => {
    (async () => {
      try {
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const url = domain ? `https://${domain}/api/duas?limit=100` : `/api/duas?limit=100`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.duas && Array.isArray(data.duas) && data.duas.length > 0) {
          const existingIds = new Set(data.duas.map((d: any) => d.id));
          const combined = [...data.duas, ...DUAS_COLLECTION.filter(d => !existingIds.has(d.id))];
          setDuaList(combined);
        }
      } catch {}
    })();
  }, []);

  const filtered = useMemo(() => {
    return duaList.filter(d => {
      const matchesCat = activeCategory === "all" || d.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.translationUr.toLowerCase().includes(q) ||
        (d.translationEn && d.translationEn.toLowerCase().includes(q)) ||
        (d.transliteration && d.transliteration.toLowerCase().includes(q)) ||
        d.arabic.includes(q);
      return matchesCat && matchesSearch;
    });
  }, [duaList, activeCategory, search]);

  const copyDua = async (dua: DuaItem) => {
    const text = `${dua.arabic}\n\nاردو ترجمہ:\n${dua.translationUr}\n\nEnglish:\n${dua.translationEn}\n\nحوالہ: ${dua.reference}`;
    await Clipboard.setStringAsync(text);
    Alert.alert("محفوظ کر لیا گیا!", `"${dua.title}" کاپی ہو گئی`);
  };

  const s = makeStyles(colors);
  const catColor = (id: string) => CATEGORIES.find(c => c.id === id)?.color ?? colors.primary;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Duas Collection</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>مجموعة الأدعية</Text>
        </View>
        <Text style={[s.count, { color: colors.mutedForeground }]}>{filtered.length}</Text>
      </View>

      {/* Search */}
      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginBottom: 8 }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Search duas..."
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

      {/* Category Pills - horizontal scroll using FlatList */}
      <View style={{ height: 44, marginBottom: 8 }}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={c => c.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.catPill, {
                backgroundColor: activeCategory === item.id ? item.color : colors.card,
                borderColor: activeCategory === item.id ? item.color : colors.border,
              }]}
              onPress={() => setActiveCategory(item.id)}
            >
              <Text style={[s.catPillText, { color: activeCategory === item.id ? "#FFF" : colors.foreground }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Duas List */}
      <FlatList
        data={filtered}
        keyExtractor={d => d.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 60 }}
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          const color = catColor(item.category);
          const isBookmarked = bookmarked.has(item.id);

          return (
            <TouchableOpacity
              style={[s.duaCard, {
                backgroundColor: colors.card,
                borderColor: expanded ? color + "60" : colors.border,
                borderWidth: expanded ? 1.5 : 1,
              }]}
              onPress={() => setExpandedId(expanded ? null : item.id)}
              activeOpacity={0.9}
            >
              {/* Card Header */}
              <View style={s.cardHeader}>
                <View style={[s.catDot, { backgroundColor: color }]} />
                <View style={s.cardTitles}>
                  <Text style={[s.duaTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[s.duaTitleAr, { color: color }]}>{item.titleArabic}</Text>
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity
                    onPress={() => {
                      const nb = new Set(bookmarked);
                      if (isBookmarked) nb.delete(item.id); else nb.add(item.id);
                      setBookmarked(nb);
                    }}
                  >
                    <Feather name={isBookmarked ? "bookmark" : "bookmark"} size={16} color={isBookmarked ? color : colors.mutedForeground} />
                  </TouchableOpacity>
                  <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                </View>
              </View>

              {/* Arabic preview (always visible) */}
              <Text style={[s.duaArabicPreview, { color: colors.foreground }]} numberOfLines={expanded ? undefined : 3}>
                {item.arabic}
              </Text>

              {/* Urdu Translation (Always visible for user comfort) */}
              <View style={[s.urduBox, { borderTopColor: colors.border }]}>
                <Text style={[s.urduText, { color: colors.foreground }]}>
                  {item.translationUr}
                </Text>
              </View>

              {/* Expanded content (Transliteration, English translation, Reference, Copy) */}
              {expanded && (
                <View style={s.expandedContent}>
                  <View style={[s.divider, { backgroundColor: colors.border }]} />
                  <Text style={[s.transliteration, { color: color }]}>{item.transliteration}</Text>
                  <Text style={[s.translation, { color: colors.mutedForeground }]}>{item.translationEn}</Text>
                  <View style={s.expandedFooter}>
                    <View style={[s.refBadge, { backgroundColor: color + "15" }]}>
                      <Feather name="book-open" size={11} color={color} />
                      <Text style={[s.refText, { color: color }]}>{item.reference}</Text>
                    </View>
                    <TouchableOpacity style={[s.copyBtn, { backgroundColor: color + "15", borderColor: color }]} onPress={() => copyDua(item)}>
                      <Feather name="copy" size={13} color={color} />
                      <Text style={[s.copyText, { color: color }]}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Feather name="heart" size={36} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No duas found</Text>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 22, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 13 },
    count: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, gap: 10, marginBottom: 8 },
    searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
    catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
    catPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    duaCard: { borderRadius: 14, padding: 14, marginBottom: 10 },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    catDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    cardTitles: { flex: 1 },
    duaTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    duaTitleAr: { fontSize: 12, marginTop: 1 },
    cardActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    duaArabicPreview: { fontSize: 18, lineHeight: 32, textAlign: "right", fontFamily: "Inter_400Regular" },
    urduBox: { paddingTop: 10, marginTop: 10, borderTopWidth: 1 },
    urduText: { fontSize: 14, lineHeight: 24, textAlign: "right", fontFamily: "Inter_500Medium" },
    expandedContent: { marginTop: 10 },
    divider: { height: 1, marginBottom: 12 },
    transliteration: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontStyle: "italic", marginBottom: 8, lineHeight: 22 },
    translation: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 12 },
    expandedFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    refBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    refText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    copyBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    copyText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    empty: { alignItems: "center", marginTop: 60, gap: 12 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  });
}
