import React, { useState } from "react";
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
import { useGetSurah, useCreateBookmark } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";

export default function SurahReaderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { surahNumber } = useLocalSearchParams<{ surahNumber: string }>();
  const { data: surah, isLoading } = useGetSurah(Number(surahNumber));
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();
  const [showTranslation, setShowTranslation] = useState(true);

  const s = makeStyles(colors);

  const handleBookmark = async (ayah: any) => {
    try {
      await createBookmark.mutateAsync({
        sourceType: "quran",
        sourceId: `${surahNumber}:${ayah.numberInSurah}`,
        label: `${surah?.nameTransliteration ?? ""} ${ayah.numberInSurah}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/bookmarks"] });
      Alert.alert("Bookmarked", `Ayah ${ayah.numberInSurah} has been saved`);
    } catch {
      Alert.alert("Error", "Could not bookmark this ayah");
    }
  };

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}> 
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!surah) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}> 
        <Text style={{ color: colors.mutedForeground }}>Surah not found</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}> 
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), backgroundColor: colors.background, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>{surah.nameTransliteration}</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>{surah.totalAyahs} ayahs · {surah.revelationType}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowTranslation(!showTranslation)}>
          <Feather name={showTranslation ? "eye" : "eye-off"} size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={surah.ayahs}
        keyExtractor={item => String(item.numberInSurah)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        ListHeaderComponent={
          <View style={[s.bismillah, { backgroundColor: colors.navy }]}> 
            {surah.number !== 1 && surah.number !== 9 && (
              <Text style={s.bismillahText}>بِسۡمِ اللّٰهِ الرَّحۡمٰنِ الرَّحِيۡمِ</Text>
            )}
            <Text style={[s.surahTitle, { color: colors.gold }]}>{surah.nameArabic}</Text>
            <Text style={[s.surahSubtitle, { color: "#FFFFFF90" }]}>{surah.nameEnglish}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.ayah, { borderBottomColor: colors.border }]}> 
            <View style={s.ayahHeader}>
              <View style={[s.ayahNumber, { backgroundColor: colors.primary + "20" }]}> 
                <Text style={[s.ayahNumberText, { color: colors.primary }]}>{item.numberInSurah}</Text>
              </View>
              <TouchableOpacity onPress={() => handleBookmark(item)}>
                <Feather name="bookmark" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[s.arabic, { color: colors.foreground }]}>{item.arabic}</Text>
            {showTranslation && item.translationEn && (
              <Text style={[s.translation, { color: colors.mutedForeground }]}>{item.translationEn}</Text>
            )}
            {showTranslation && item.translationUr && (
              <Text style={[s.urdu, { color: colors.mutedForeground }]}>{item.translationUr}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    headerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
    bismillah: { padding: 28, alignItems: "center", marginBottom: 4 },
    bismillahText: { fontSize: 20, color: "#FFFFFF", marginBottom: 12, textAlign: "center" },
    surahTitle: { fontSize: 32, marginBottom: 6 },
    surahSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
    ayah: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    ayahHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    ayahNumber: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    ayahNumberText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    arabic: { fontSize: 24, lineHeight: 44, textAlign: "right", marginBottom: 12, fontFamily: "Inter_400Regular" },
    translation: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", marginBottom: 6 },
    urdu: { fontSize: 14, lineHeight: 24, textAlign: "right", fontFamily: "Inter_400Regular", fontStyle: "italic" },
  });
}
