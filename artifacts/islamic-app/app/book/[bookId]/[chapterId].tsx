import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetBookChapter, useCreateBookmark } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";
import { useOfflineDownload } from "@/hooks/useOfflineDownload";
import { FALLBACK_BOOKS } from "@/constants/booksData";
import { fetchSurahTafsir } from "@/lib/openIslamicApi";
import { useLanguage } from "@/context/LanguageContext";

export default function ChapterReaderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookId, chapterId } = useLocalSearchParams<{ bookId: string; chapterId: string }>();
  const { data: apiChapter, isLoading: apiLoading } = useGetBookChapter(bookId, chapterId);
  const [offlineChapter, setOfflineChapter] = useState<any>(null);
  const [liveChapter, setLiveChapter] = useState<any>(null);
  const { getBookOffline } = useOfflineDownload();
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();
  const [fontSize, setFontSize] = useState(16);

  const fallbackBook = FALLBACK_BOOKS.find(b => b.id === bookId);
  const fallbackChapter = fallbackBook?.chapters.find(c => c.id === chapterId);

  useEffect(() => {
    let isMounted = true;
    if (bookId && chapterId) {
      getBookOffline<{ book: any; chapters: any[] }>(bookId).then(data => {
        if (!isMounted) return;
        if (data?.chapters) {
          const found = data.chapters.find((c: any) => c.id === chapterId);
          if (found) {
            setOfflineChapter(found);
            return;
          }
        }

        // Check if Tafsir can be fetched live
        if (bookId === "tafsir-al-jalalayn" && fallbackChapter?.chapterNumber) {
          fetchSurahTafsir(fallbackChapter.chapterNumber, "ar.jalalayn").then(tafsirData => {
            if (!isMounted) return;
            if (tafsirData && tafsirData.ayahs.length > 0) {
              const formatted = tafsirData.ayahs
                .map(a => `**آية ${a.number}:** ${a.text}\n\n**تفسير الجلالين:**\n${a.tafsir}`)
                .join("\n\n---\n\n");
              setLiveChapter({
                ...fallbackChapter,
                content: formatted,
              });
            }
          });
        }
      });
    }
    return () => { isMounted = false; };
  }, [bookId, chapterId]);

  const chapter = offlineChapter ?? liveChapter ?? fallbackChapter ?? apiChapter;
  const isLoading = !chapter && (!offlineChapter && apiLoading);
  const s = makeStyles(colors);
  const { t } = useLanguage();

  const handleBookmark = async () => {
    try {
      await createBookmark.mutateAsync({
        data: { sourceType: "book", sourceId: chapterId, label: chapter?.title ?? "Book Chapter" },
      });
      queryClient.invalidateQueries({ queryKey: ["/bookmarks"] });
      Alert.alert("✅ " + t.bookmarked, chapter?.title ?? "Chapter saved");
    } catch {
      Alert.alert("Error", "Could not bookmark this chapter");
    }
  };

  const handleCopyChapter = async () => {
    if (!chapter) return;
    const cleanContent = chapter.content?.replace(/\*\*/g, "") ?? "";
    const text = `【${fallbackBook?.title ?? bookId}】\n${chapter.title}\n${chapter.titleArabic ? chapter.titleArabic + "\n" : ""}\n${cleanContent}\n\n(منقول از: المفتاح - Al-Miftah)`;
    await Clipboard.setStringAsync(text);
    Alert.alert("📋 " + t.copy, t.copied);
  };

  const handleShareChapter = async () => {
    if (!chapter) return;
    const cleanContent = chapter.content?.replace(/\*\*/g, "") ?? "";
    const text = `【${fallbackBook?.title ?? bookId}】\n${chapter.title}\n\n${cleanContent.slice(0, 3000)}\n\n— المفتاح (Al-Miftah)`;
    await Share.share({ message: text });
  };

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.mutedForeground }}>Chapter not found</Text>
      </View>
    );
  }

  // Render content with rich markdown support, clean bold tags, and quotes
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.trim() === "") return <View key={i} style={{ height: 8 }} />;

      const isHeading = line.startsWith("**") && (line.endsWith("**") || line.includes(":**"));
      const isArabicQuote = (line.includes("«") && line.includes("»")) || line.startsWith("﴿");

      const parts = line.split(/(\*\*.*?\*\*)/g);

      return (
        <Text
          key={i}
          style={[
            s.contentPara,
            {
              color: isArabicQuote ? colors.gold : colors.foreground,
              fontSize: isHeading ? fontSize + 1.5 : fontSize,
              lineHeight: isHeading ? (fontSize + 1.5) * 1.6 : fontSize * 1.75,
              fontFamily: isHeading ? "Inter_700Bold" : "Inter_400Regular",
              marginTop: isHeading ? 12 : 2,
              marginBottom: isHeading ? 4 : 2,
              textAlign: isArabicQuote ? "right" : "left",
            },
          ]}
        >
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <Text key={pIdx} style={{ fontFamily: "Inter_700Bold", color: isHeading ? colors.primary : colors.foreground }}>
                  {part.slice(2, -2)}
                </Text>
              );
            }
            return <Text key={pIdx}>{part}</Text>;
          })}
        </Text>
      );
    });
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerChapterNum, { color: colors.mutedForeground }]}>Chapter {chapter.chapterNumber}</Text>
          <Text style={[s.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{chapter.title}</Text>
        </View>
        <View style={s.headerActions}>
          {/* Copy */}
          <TouchableOpacity onPress={handleCopyChapter} style={s.fontBtn}>
            <Feather name="copy" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          {/* Share */}
          <TouchableOpacity onPress={handleShareChapter} style={s.fontBtn}>
            <Feather name="share-2" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          {/* Font size controls */}
          <TouchableOpacity onPress={() => setFontSize(f => Math.max(12, f - 1))} style={s.fontBtn}>
            <Text style={[s.fontBtnText, { color: colors.mutedForeground }]}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFontSize(f => Math.min(22, f + 1))} style={s.fontBtn}>
            <Text style={[s.fontBtnText, { color: colors.mutedForeground }]}>A+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBookmark}>
            <Feather name="bookmark" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 60 }]}
      >
        <Text style={[s.chapterTitle, { color: colors.foreground }]}>{chapter.title}</Text>
        {chapter.titleArabic && (
          <Text style={[s.chapterArabic, { color: colors.gold }]}>{chapter.titleArabic}</Text>
        )}

        {/* Quick action pill row */}
        <View style={{ flexDirection: "row", gap: 10, marginVertical: 12 }}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
            onPress={handleCopyChapter}
          >
            <Feather name="copy" size={14} color={colors.primary} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>{t.copy}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
            onPress={handleShareChapter}
          >
            <Feather name="share-2" size={14} color={colors.primary} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>{t.share}</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.divider, { backgroundColor: colors.border }]} />

        <View style={s.contentBody}>
          {chapter.content ? renderContent(chapter.content) : (
            <Text style={[s.contentPara, { color: colors.mutedForeground }]}>
              No content available for this chapter yet.
            </Text>
          )}
        </View>

        {/* Bottom share card */}
        <View style={{ marginTop: 32, padding: 16, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{t.appName} — {fallbackBook?.title ?? "Islamic Library"}</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
              onPress={handleCopyChapter}
            >
              <Feather name="copy" size={14} color="#FFF" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFF" }}>{t.copy}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
              onPress={handleShareChapter}
            >
              <Feather name="share-2" size={14} color={colors.foreground} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>{t.share}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
    headerCenter: { flex: 1 },
    headerChapterNum: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
    headerTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
    fontBtn: { padding: 4 },
    fontBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    content: { paddingHorizontal: 22, paddingTop: 24 },
    chapterTitle: { fontSize: 24, fontFamily: "Inter_700Bold", lineHeight: 34, marginBottom: 6 },
    chapterArabic: { fontSize: 22, marginBottom: 16, textAlign: "right", fontFamily: "Amiri_700Bold", lineHeight: 42 },
    divider: { height: 1, marginBottom: 24, marginTop: 8 },
    contentBody: { gap: 2 },
    contentHeading: { fontFamily: "Inter_700Bold", lineHeight: 28, marginTop: 16, marginBottom: 6 },
    contentPara: { fontFamily: "Inter_400Regular", lineHeight: 28 },
  });
}
