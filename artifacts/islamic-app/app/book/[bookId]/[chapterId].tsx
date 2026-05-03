import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetBookChapter, useCreateBookmark } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";

export default function ChapterReaderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookId, chapterId } = useLocalSearchParams<{ bookId: string; chapterId: string }>();
  const { data: chapter, isLoading } = useGetBookChapter(bookId, chapterId);
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();
  const [fontSize, setFontSize] = useState(16);

  const s = makeStyles(colors);

  const handleBookmark = async () => {
    try {
      await createBookmark.mutateAsync({
        sourceType: "book",
        sourceId: chapterId,
        label: chapter?.title ?? "Book Chapter",
      });
      queryClient.invalidateQueries({ queryKey: ["/bookmarks"] });
      Alert.alert("Bookmarked", "Chapter saved to your workspace");
    } catch {
      Alert.alert("Error", "Could not bookmark this chapter");
    }
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

  // Render content with bold headings (lines starting with **)
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <Text key={i} style={[s.contentHeading, { color: colors.foreground, fontSize: fontSize + 1 }]}>
            {line.replace(/\*\*/g, "")}
          </Text>
        );
      }
      if (line.trim() === "") return <View key={i} style={{ height: 8 }} />;
      return (
        <Text key={i} style={[s.contentPara, { color: colors.foreground, fontSize }]}>
          {line}
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

        <View style={[s.divider, { backgroundColor: colors.border }]} />

        <View style={s.contentBody}>
          {chapter.content ? renderContent(chapter.content) : (
            <Text style={[s.contentPara, { color: colors.mutedForeground }]}>
              No content available for this chapter yet.
            </Text>
          )}
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
    chapterArabic: { fontSize: 20, marginBottom: 16, textAlign: "right" },
    divider: { height: 1, marginBottom: 24, marginTop: 8 },
    contentBody: { gap: 2 },
    contentHeading: { fontFamily: "Inter_700Bold", lineHeight: 28, marginTop: 16, marginBottom: 6 },
    contentPara: { fontFamily: "Inter_400Regular", lineHeight: 28 },
  });
}
