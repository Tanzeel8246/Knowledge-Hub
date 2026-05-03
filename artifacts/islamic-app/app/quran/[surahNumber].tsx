import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { useGetSurah, useCreateBookmark } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";
import { RECITERS, getAudioUrl, DEFAULT_RECITER, type Reciter } from "@/constants/reciters";

export default function SurahReaderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { surahNumber } = useLocalSearchParams<{ surahNumber: string }>();
  const { data: surah, isLoading } = useGetSurah(Number(surahNumber));
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();

  const [showTranslation, setShowTranslation] = useState(true);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(DEFAULT_RECITER);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAyahIndex, setPlayingAyahIndex] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showQariModal, setShowQariModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const s = makeStyles(colors);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const playAyah = useCallback(async (index: number) => {
    if (!surah?.ayahs) return;
    const ayah = surah.ayahs[index];
    if (!ayah) return;

    try {
      setIsLoadingAudio(true);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const url = getAudioUrl(selectedReciter.folder, Number(surahNumber), ayah.numberInSurah);
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setPlayingAyahIndex(index);
      setIsPlaying(true);
      setIsLoadingAudio(false);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          const nextIndex = index + 1;
          if (nextIndex < (surah.ayahs?.length ?? 0)) {
            playAyah(nextIndex);
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true, viewOffset: 80 });
          } else {
            setIsPlaying(false);
            setPlayingAyahIndex(null);
          }
        }
      });
    } catch {
      setIsLoadingAudio(false);
      setIsPlaying(false);
    }
  }, [surah, surahNumber, selectedReciter]);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) {
      playAyah(playingAyahIndex ?? 0);
      return;
    }
    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [isPlaying, playAyah, playingAyahIndex]);

  const stopAudio = useCallback(async () => {
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    setIsPlaying(false);
    setPlayingAyahIndex(null);
  }, []);

  const prevAyah = useCallback(() => {
    if (playingAyahIndex !== null && playingAyahIndex > 0) {
      playAyah(playingAyahIndex - 1);
    }
  }, [playingAyahIndex, playAyah]);

  const nextAyah = useCallback(() => {
    if (playingAyahIndex !== null && surah?.ayahs && playingAyahIndex < surah.ayahs.length - 1) {
      playAyah(playingAyahIndex + 1);
    }
  }, [playingAyahIndex, surah, playAyah]);

  const handleReciterChange = useCallback(async (reciter: Reciter) => {
    setShowQariModal(false);
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    setIsPlaying(false);
    setPlayingAyahIndex(null);
    setSelectedReciter(reciter);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!surah) return;
    const surahPadded = String(surahNumber).padStart(3, "0");
    const url = `https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/${surahPadded}.mp3`;
    if (Platform.OS === "web") {
      await Linking.openURL(url);
      return;
    }
    try {
      setDownloading(true);
      await Linking.openURL(url);
      setDownloading(false);
    } catch {
      setDownloading(false);
    }
  }, [surah, surahNumber, selectedReciter]);

  const handleBookmark = async (ayah: any) => {
    try {
      await createBookmark.mutateAsync({
        data: { sourceType: "quran", sourceId: `${surahNumber}:${ayah.numberInSurah}`, label: `${surah?.nameTransliteration ?? ""} ${ayah.numberInSurah}` },
      });
      queryClient.invalidateQueries({ queryKey: ["/bookmarks"] });
      Alert.alert("Bookmarked", `Ayah ${ayah.numberInSurah} saved`);
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

  const showPlayer = playingAyahIndex !== null || isPlaying || isLoadingAudio;
  const currentAyahNum = playingAyahIndex !== null ? surah.ayahs?.[playingAyahIndex]?.numberInSurah : null;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { stopAudio(); router.back(); }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>{surah.nameTransliteration}</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>{surah.totalAyahs} ayahs · {surah.revelationType}</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={() => setShowQariModal(true)} style={[s.qariBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
            <Feather name="mic" size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowTranslation(!showTranslation)}>
            <Feather name={showTranslation ? "eye" : "eye-off"} size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDownload}>
            {downloading ? <ActivityIndicator size="small" color={colors.primary} /> : <Feather name="download" size={20} color={colors.foreground} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Ayahs list */}
      <FlatList
        ref={flatListRef}
        data={surah.ayahs}
        keyExtractor={item => String(item.numberInSurah)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: showPlayer ? insets.bottom + 120 : insets.bottom + 40 }}
        onScrollToIndexFailed={() => {}}
        ListHeaderComponent={
          <View style={[s.bismillah, { backgroundColor: colors.navy }]}>
            {surah.number !== 1 && surah.number !== 9 && (
              <Text style={s.bismillahText}>بِسۡمِ اللّٰهِ الرَّحۡمٰنِ الرَّحِيۡمِ</Text>
            )}
            <Text style={[s.surahTitle, { color: colors.gold }]}>{surah.nameArabic}</Text>
            <Text style={[s.surahSubtitle, { color: "#FFFFFF90" }]}>{surah.nameEnglish}</Text>
            <TouchableOpacity
              style={[s.startBtn, { backgroundColor: colors.primary }]}
              onPress={() => playAyah(0)}
            >
              <Feather name="play" size={16} color="#FFF" />
              <Text style={s.startBtnText}>Play Surah</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => {
          const isCurrentlyPlaying = playingAyahIndex === index;
          return (
            <TouchableOpacity
              style={[
                s.ayah,
                { borderBottomColor: colors.border },
                isCurrentlyPlaying && { backgroundColor: colors.primary + "10" },
              ]}
              onPress={() => playAyah(index)}
              activeOpacity={0.8}
            >
              <View style={s.ayahHeader}>
                <View style={[s.ayahNumber, {
                  backgroundColor: isCurrentlyPlaying ? colors.primary : colors.primary + "20"
                }]}>
                  <Text style={[s.ayahNumberText, {
                    color: isCurrentlyPlaying ? "#FFF" : colors.primary
                  }]}>{item.numberInSurah}</Text>
                </View>
                <View style={s.ayahActions}>
                  {isCurrentlyPlaying && isPlaying && (
                    <View style={s.playingDot}>
                      <Feather name="volume-2" size={14} color={colors.primary} />
                    </View>
                  )}
                  <TouchableOpacity onPress={() => handleBookmark(item)}>
                    <Feather name="bookmark" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[s.arabic, { color: colors.foreground }]}>{item.arabic}</Text>
              {showTranslation && item.translationEn && (
                <Text style={[s.translation, { color: colors.mutedForeground }]}>{item.translationEn}</Text>
              )}
              {showTranslation && item.translationUr && (
                <Text style={[s.urdu, { color: colors.mutedForeground }]}>{item.translationUr}</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Floating Audio Player */}
      {showPlayer && (
        <View style={[s.player, {
          backgroundColor: colors.navy,
          paddingBottom: insets.bottom + 8,
        }]}>
          <View style={s.playerInfo}>
            <Feather name="mic" size={14} color={colors.gold} />
            <View>
              <Text style={s.playerReciter} numberOfLines={1}>{selectedReciter.name.split(" ").slice(0, 2).join(" ")}</Text>
              <Text style={s.playerAyah}>
                {currentAyahNum ? `Ayah ${currentAyahNum} of ${surah.totalAyahs}` : "Ready"}
              </Text>
            </View>
          </View>
          <View style={s.playerControls}>
            <TouchableOpacity onPress={prevAyah} style={s.controlBtn} disabled={playingAyahIndex === 0 || playingAyahIndex === null}>
              <Feather name="skip-back" size={20} color={playingAyahIndex === 0 || playingAyahIndex === null ? "#FFFFFF40" : "#FFFFFF"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={[s.playPauseBtn, { backgroundColor: colors.primary }]}>
              {isLoadingAudio ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Feather name={isPlaying ? "pause" : "play"} size={20} color="#FFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={nextAyah} style={s.controlBtn} disabled={playingAyahIndex === null || playingAyahIndex >= (surah.ayahs?.length ?? 0) - 1}>
              <Feather name="skip-forward" size={20} color={playingAyahIndex === null || playingAyahIndex >= (surah.ayahs?.length ?? 0) - 1 ? "#FFFFFF40" : "#FFFFFF"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={stopAudio} style={s.controlBtn}>
              <Feather name="square" size={18} color="#FFFFFF90" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Qari Selection Modal */}
      <Modal visible={showQariModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowQariModal(false)}>
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Select Reciter</Text>
            <TouchableOpacity onPress={() => setShowQariModal(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {RECITERS.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[s.reciterRow, {
                  backgroundColor: selectedReciter.id === r.id ? colors.primary + "15" : colors.card,
                  borderColor: selectedReciter.id === r.id ? colors.primary : colors.border,
                }]}
                onPress={() => handleReciterChange(r)}
              >
                <View style={[s.reciterAvatar, { backgroundColor: colors.navy }]}>
                  <Feather name="mic" size={16} color={colors.gold} />
                </View>
                <View style={s.reciterInfo}>
                  <Text style={[s.reciterName, { color: colors.foreground }]}>{r.name}</Text>
                  <Text style={[s.reciterArabic, { color: colors.gold }]}>{r.nameArabic}</Text>
                  <Text style={[s.reciterMeta, { color: colors.mutedForeground }]}>{r.country} · {r.style}</Text>
                </View>
                {selectedReciter.id === r.id && (
                  <Feather name="check-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
    headerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
    qariBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
    bismillah: { padding: 28, alignItems: "center", marginBottom: 4 },
    bismillahText: { fontSize: 20, color: "#FFFFFF", marginBottom: 12, textAlign: "center" },
    surahTitle: { fontSize: 32, marginBottom: 6 },
    surahSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 16 },
    startBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
    startBtnText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14 },
    ayah: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    ayahHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    ayahNumber: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    ayahNumberText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    ayahActions: { flexDirection: "row", alignItems: "center", gap: 12 },
    playingDot: {},
    arabic: { fontSize: 24, lineHeight: 44, textAlign: "right", marginBottom: 12, fontFamily: "Inter_400Regular" },
    translation: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", marginBottom: 6 },
    urdu: { fontSize: 14, lineHeight: 24, textAlign: "right", fontFamily: "Inter_400Regular", fontStyle: "italic" },
    player: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, gap: 12 },
    playerInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    playerReciter: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 13 },
    playerAyah: { color: "#FFFFFF90", fontFamily: "Inter_400Regular", fontSize: 11 },
    playerControls: { flexDirection: "row", alignItems: "center", gap: 12 },
    controlBtn: { padding: 4 },
    playPauseBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    modal: { flex: 1 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
    reciterRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 8, marginTop: 4, borderWidth: 1, gap: 12 },
    reciterAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    reciterInfo: { flex: 1 },
    reciterName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    reciterArabic: { fontSize: 13, marginBottom: 2 },
    reciterMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  });
}
