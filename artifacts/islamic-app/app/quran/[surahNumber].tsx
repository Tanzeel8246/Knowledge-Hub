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
  Share,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import * as Clipboard from "expo-clipboard";
import { useGetSurah, useCreateBookmark } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";
import { RECITERS, getAudioUrl, DEFAULT_RECITER, type Reciter } from "@/constants/reciters";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_READ_KEY = "quran_last_read_v1";
const FONT_SIZE_KEY = "quran_font_size_v1";

type RepeatMode = "none" | "ayah" | "surah";
type DisplayMode = "translation" | "transliteration" | "both" | "arabic-only";

interface AyahItem {
  numberInSurah: number;
  arabic: string;
  translationEn?: string | null;
  translationUr?: string | null;
  tafsirEn?: string | null;
  juzNumber?: number | null;
  pageNumber?: number | null;
}

export default function SurahReaderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { surahNumber } = useLocalSearchParams<{ surahNumber: string }>();
  const surahNum = Number(surahNumber);
  const { data: surah, isLoading } = useGetSurah(surahNum);
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();

  // Display settings
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTafsir, setShowTafsir] = useState(false);
  const [arabicFontSize, setArabicFontSize] = useState(24);
  const [translationFontSize, setTranslationFontSize] = useState(14);
  const [showUrdu, setShowUrdu] = useState(true);

  // Audio
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(DEFAULT_RECITER);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAyahIndex, setPlayingAyahIndex] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");

  // Modals
  const [showQariModal, setShowQariModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAyahMenu, setShowAyahMenu] = useState<AyahItem | null>(null);

  const [downloading, setDownloading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const s = makeStyles(colors, arabicFontSize, translationFontSize);

  // Load saved font size
  useEffect(() => {
    AsyncStorage.getItem(FONT_SIZE_KEY).then(val => {
      if (val) {
        const { arabic, translation } = JSON.parse(val);
        setArabicFontSize(arabic ?? 24);
        setTranslationFontSize(translation ?? 14);
      }
    });
  }, []);

  // Save font size on change
  useEffect(() => {
    AsyncStorage.setItem(FONT_SIZE_KEY, JSON.stringify({ arabic: arabicFontSize, translation: translationFontSize }));
  }, [arabicFontSize, translationFontSize]);

  // Save last read position
  useEffect(() => {
    if (surah) {
      AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify({
        surahNumber: surahNum,
        surahName: surah.nameTransliteration,
        surahNameAr: surah.nameArabic,
        timestamp: Date.now(),
      }));
    }
  }, [surah, surahNum]);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    return () => { soundRef.current?.unloadAsync(); };
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

      const url = getAudioUrl(selectedReciter.folder, surahNum, ayah.numberInSurah);
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingAyahIndex(index);
      setIsPlaying(true);
      setIsLoadingAudio(false);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          if (repeatMode === "ayah") {
            playAyah(index);
          } else {
            const nextIndex = index + 1;
            if (nextIndex < (surah.ayahs?.length ?? 0)) {
              playAyah(nextIndex);
              flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true, viewOffset: 80 });
            } else if (repeatMode === "surah") {
              playAyah(0);
              flatListRef.current?.scrollToIndex({ index: 0, animated: true });
            } else {
              setIsPlaying(false);
              setPlayingAyahIndex(null);
            }
          }
        }
      });
    } catch {
      setIsLoadingAudio(false);
      setIsPlaying(false);
    }
  }, [surah, surahNum, selectedReciter, repeatMode]);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) { playAyah(playingAyahIndex ?? 0); return; }
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
    if (playingAyahIndex !== null && playingAyahIndex > 0) playAyah(playingAyahIndex - 1);
  }, [playingAyahIndex, playAyah]);

  const nextAyah = useCallback(() => {
    if (playingAyahIndex !== null && surah?.ayahs && playingAyahIndex < surah.ayahs.length - 1)
      playAyah(playingAyahIndex + 1);
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
    const surahPadded = String(surahNum).padStart(3, "0");
    const url = `https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/${surahPadded}.mp3`;
    setDownloading(true);
    await Linking.openURL(url);
    setDownloading(false);
  }, [surahNum]);

  const handleBookmark = async (ayah: AyahItem) => {
    try {
      await createBookmark.mutateAsync({
        data: { sourceType: "quran", sourceId: `${surahNum}:${ayah.numberInSurah}`, label: `${surah?.nameTransliteration ?? ""} ${ayah.numberInSurah}` },
      });
      queryClient.invalidateQueries({ queryKey: ["/bookmarks"] });
      Alert.alert("✅ Bookmarked", `${surah?.nameTransliteration} — Ayah ${ayah.numberInSurah} saved`);
    } catch {
      Alert.alert("Error", "Could not bookmark this ayah");
    }
  };

  const handleCopyAyah = async (ayah: AyahItem) => {
    const text = `${ayah.arabic}\n\n${ayah.translationEn ?? ""}\n— ${surah?.nameTransliteration} [${surahNum}:${ayah.numberInSurah}]`;
    await Clipboard.setStringAsync(text);
    setShowAyahMenu(null);
    Alert.alert("Copied", "Ayah copied to clipboard");
  };

  const handleShareAyah = async (ayah: AyahItem) => {
    const text = `${ayah.arabic}\n\n"${ayah.translationEn ?? ""}"\n\n— ${surah?.nameTransliteration} [${surahNum}:${ayah.numberInSurah}] (Quran)`;
    setShowAyahMenu(null);
    await Share.share({ message: text });
  };

  const cycleFontSize = (direction: "up" | "down") => {
    setArabicFontSize(prev => Math.max(16, Math.min(36, prev + (direction === "up" ? 2 : -2))));
    setTranslationFontSize(prev => Math.max(11, Math.min(20, prev + (direction === "up" ? 1 : -1))));
  };

  const cycleRepeat = () => {
    setRepeatMode(m => m === "none" ? "ayah" : m === "ayah" ? "surah" : "none");
  };

  const goToSurah = (num: number) => {
    if (num < 1 || num > 114) return;
    stopAudio();
    router.replace(`/quran/${num}` as any);
  };

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_400Regular" }]}>Loading surah…</Text>
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
  const repeatIcon = repeatMode === "none" ? "repeat-off" : repeatMode === "ayah" ? "repeat-once" : "repeat";
  const repeatColor = repeatMode === "none" ? "#FFFFFF40" : colors.gold;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { stopAudio(); router.back(); }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>{surah.nameTransliteration}</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>{surah.totalAyahs} ayahs · {surah.revelationType}</Text>
        </View>
        <View style={s.headerActions}>
          {/* Surah nav arrows */}
          <TouchableOpacity onPress={() => goToSurah(surahNum - 1)} disabled={surahNum <= 1} style={s.navBtn}>
            <Feather name="chevron-left" size={18} color={surahNum <= 1 ? colors.border : colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => goToSurah(surahNum + 1)} disabled={surahNum >= 114} style={s.navBtn}>
            <Feather name="chevron-right" size={18} color={surahNum >= 114 ? colors.border : colors.foreground} />
          </TouchableOpacity>
          {/* Settings */}
          <TouchableOpacity onPress={() => setShowSettingsModal(true)}>
            <Feather name="settings" size={20} color={colors.foreground} />
          </TouchableOpacity>
          {/* Reciter */}
          <TouchableOpacity onPress={() => setShowQariModal(true)} style={[s.qariBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
            <Feather name="mic" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Ayah List ── */}
      <FlatList
        ref={flatListRef}
        data={surah.ayahs as AyahItem[]}
        keyExtractor={item => String(item.numberInSurah)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: showPlayer ? insets.bottom + 130 : insets.bottom + 40 }}
        onScrollToIndexFailed={() => {}}
        ListHeaderComponent={
          <View style={[s.bismillah, { backgroundColor: colors.navy }]}>
            {surah.number !== 1 && surah.number !== 9 && (
              <Text style={s.bismillahText}>بِسۡمِ اللّٰهِ الرَّحۡمٰنِ الرَّحِيۡمِ</Text>
            )}
            <Text style={[s.surahTitle, { color: colors.gold }]}>{surah.nameArabic}</Text>
            <Text style={[s.surahSubtitle, { color: "#FFFFFF90" }]}>{surah.nameEnglish}</Text>
            <View style={s.surahMeta}>
              <View style={s.surahMetaItem}>
                <Feather name="map-pin" size={12} color="#FFFFFF70" />
                <Text style={s.surahMetaText}>{surah.revelationType}</Text>
              </View>
              <View style={s.surahMetaDivider} />
              <View style={s.surahMetaItem}>
                <Feather name="hash" size={12} color="#FFFFFF70" />
                <Text style={s.surahMetaText}>{surah.totalAyahs} Ayahs</Text>
              </View>
              <View style={s.surahMetaDivider} />
              <View style={s.surahMetaItem}>
                <Text style={s.surahMetaText}>Surah {surahNum} of 114</Text>
              </View>
            </View>
            <View style={s.headerBtns}>
              <TouchableOpacity style={[s.startBtn, { backgroundColor: colors.primary }]} onPress={() => playAyah(0)}>
                <Feather name="play" size={16} color="#FFF" />
                <Text style={s.startBtnText}>Play Surah</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.downloadBtn, { borderColor: "#FFFFFF40" }]} onPress={handleDownload}>
                {downloading ? <ActivityIndicator size="small" color="#FFF" /> : <Feather name="download" size={16} color="#FFF" />}
                <Text style={s.downloadBtnText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const isCurrentlyPlaying = playingAyahIndex === index;
          const juzInfo = item.juzNumber ? `Juz ${item.juzNumber}` : null;
          const pageInfo = item.pageNumber ? `Page ${item.pageNumber}` : null;

          return (
            <View
              style={[
                s.ayah,
                { borderBottomColor: colors.border },
                isCurrentlyPlaying && { backgroundColor: colors.primary + "08" },
              ]}
            >
              {/* Ayah header row */}
              <View style={s.ayahHeader}>
                <TouchableOpacity
                  style={[s.ayahNumber, { backgroundColor: isCurrentlyPlaying ? colors.primary : colors.primary + "20" }]}
                  onPress={() => playAyah(index)}
                >
                  {isCurrentlyPlaying && isPlaying ? (
                    <MaterialCommunityIcons name="volume-high" size={14} color="#FFF" />
                  ) : (
                    <Text style={[s.ayahNumberText, { color: isCurrentlyPlaying ? "#FFF" : colors.primary }]}>
                      {item.numberInSurah}
                    </Text>
                  )}
                </TouchableOpacity>

                {(juzInfo || pageInfo) && (
                  <View style={s.ayahMeta}>
                    {juzInfo && <Text style={[s.ayahMetaText, { color: colors.mutedForeground }]}>{juzInfo}</Text>}
                    {pageInfo && <Text style={[s.ayahMetaText, { color: colors.mutedForeground }]}>{pageInfo}</Text>}
                  </View>
                )}

                <View style={s.ayahActions}>
                  <TouchableOpacity onPress={() => setShowAyahMenu(item)}>
                    <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleBookmark(item)}>
                    <Feather name="bookmark" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Arabic text */}
              <Text style={[s.arabic, { color: colors.foreground, fontSize: arabicFontSize, lineHeight: arabicFontSize * 1.9 }]}>
                {item.arabic}
              </Text>

              {/* Translations */}
              {showTranslation && item.translationEn && (
                <Text style={[s.translation, { color: colors.mutedForeground, fontSize: translationFontSize, lineHeight: translationFontSize * 1.6 }]}>
                  {item.translationEn}
                </Text>
              )}
              {showTranslation && showUrdu && item.translationUr && (
                <Text style={[s.urdu, { color: colors.mutedForeground, fontSize: translationFontSize, lineHeight: translationFontSize * 1.8 }]}>
                  {item.translationUr}
                </Text>
              )}

              {/* Tafsir */}
              {showTafsir && (item as any).tafsirEn && (
                <View style={[s.tafsirBox, { backgroundColor: colors.gold + "10", borderColor: colors.gold + "30" }]}>
                  <Text style={[s.tafsirLabel, { color: colors.gold }]}>📖 Tafsir (Ibn Kathir)</Text>
                  <Text style={[s.tafsirText, { color: colors.foreground }]}>{(item as any).tafsirEn}</Text>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* ── Floating Audio Player ── */}
      {showPlayer && (
        <View style={[s.player, { backgroundColor: colors.navy, paddingBottom: insets.bottom + 8 }]}>
          <View style={s.playerInfo}>
            <Feather name="mic" size={14} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={s.playerReciter} numberOfLines={1}>{selectedReciter.name.split(" ").slice(0, 2).join(" ")}</Text>
              <Text style={s.playerAyah}>
                {currentAyahNum ? `Ayah ${currentAyahNum} / ${surah.totalAyahs}` : "Loading…"}
              </Text>
            </View>
          </View>
          <View style={s.playerControls}>
            <TouchableOpacity onPress={cycleRepeat}>
              <MaterialCommunityIcons name={repeatIcon} size={18} color={repeatColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={prevAyah} style={s.controlBtn} disabled={playingAyahIndex === 0 || playingAyahIndex === null}>
              <Feather name="skip-back" size={20} color={playingAyahIndex === 0 || playingAyahIndex === null ? "#FFFFFF30" : "#FFF"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={[s.playPauseBtn, { backgroundColor: colors.primary }]}>
              {isLoadingAudio ? <ActivityIndicator color="#FFF" size="small" /> : <Feather name={isPlaying ? "pause" : "play"} size={20} color="#FFF" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={nextAyah} style={s.controlBtn} disabled={playingAyahIndex === null || playingAyahIndex >= (surah.ayahs?.length ?? 0) - 1}>
              <Feather name="skip-forward" size={20} color={playingAyahIndex === null || playingAyahIndex >= (surah.ayahs?.length ?? 0) - 1 ? "#FFFFFF30" : "#FFF"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={stopAudio} style={s.controlBtn}>
              <Feather name="square" size={18} color="#FFFFFF70" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Ayah Context Menu Modal ── */}
      <Modal visible={!!showAyahMenu} transparent animationType="fade" onRequestClose={() => setShowAyahMenu(null)}>
        <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setShowAyahMenu(null)}>
          <View style={[s.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.menuTitle, { color: colors.foreground }]}>
              {surah.nameTransliteration} — Ayah {showAyahMenu?.numberInSurah}
            </Text>
            {[
              { icon: "play", label: "Play this Ayah", action: () => { const idx = surah.ayahs?.findIndex(a => a.numberInSurah === showAyahMenu?.numberInSurah) ?? 0; setShowAyahMenu(null); playAyah(idx); } },
              { icon: "bookmark", label: "Bookmark", action: () => { if (showAyahMenu) { setShowAyahMenu(null); handleBookmark(showAyahMenu); } } },
              { icon: "copy", label: "Copy Ayah + Translation", action: () => showAyahMenu && handleCopyAyah(showAyahMenu) },
              { icon: "share-2", label: "Share Ayah", action: () => showAyahMenu && handleShareAyah(showAyahMenu) },
            ].map(item => (
              <TouchableOpacity key={item.label} style={[s.menuItem, { borderTopColor: colors.border }]} onPress={item.action}>
                <Feather name={item.icon as any} size={17} color={colors.primary} />
                <Text style={[s.menuItemText, { color: colors.foreground }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Settings Modal ── */}
      <Modal visible={showSettingsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSettingsModal(false)}>
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Reader Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
            {/* Font size */}
            <View style={[s.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View>
                <Text style={[s.settingLabel, { color: colors.foreground }]}>Arabic Font Size</Text>
                <Text style={[s.settingHint, { color: colors.mutedForeground }]}>Current: {arabicFontSize}px</Text>
              </View>
              <View style={s.fontSizeControls}>
                <TouchableOpacity style={[s.fontBtn, { backgroundColor: colors.primary + "20" }]} onPress={() => cycleFontSize("down")}>
                  <Feather name="minus" size={16} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[s.fontSizeNum, { color: colors.foreground }]}>{arabicFontSize}</Text>
                <TouchableOpacity style={[s.fontBtn, { backgroundColor: colors.primary + "20" }]} onPress={() => cycleFontSize("up")}>
                  <Feather name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Arabic preview */}
            <View style={[s.previewBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[{ color: colors.foreground, textAlign: "right", fontSize: arabicFontSize, lineHeight: arabicFontSize * 1.9 }]}>
                بِسۡمِ اللّٰهِ الرَّحۡمٰنِ الرَّحِيۡمِ
              </Text>
              <Text style={[{ color: colors.mutedForeground, fontSize: translationFontSize, marginTop: 6 }]}>
                In the name of Allah, the Most Gracious, the Most Merciful.
              </Text>
            </View>

            {/* Toggles */}
            {[
              { label: "Show Translation (English)", value: showTranslation, toggle: () => setShowTranslation(v => !v) },
              { label: "Show Urdu Translation", value: showUrdu, toggle: () => setShowUrdu(v => !v) },
              { label: "Show Tafsir (Ibn Kathir)", value: showTafsir, toggle: () => setShowTafsir(v => !v) },
            ].map(item => (
              <TouchableOpacity key={item.label} style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={item.toggle}>
                <Text style={[s.toggleLabel, { color: colors.foreground }]}>{item.label}</Text>
                <View style={[s.toggleSwitch, { backgroundColor: item.value ? colors.primary : colors.border }]}>
                  <View style={[s.toggleKnob, { transform: [{ translateX: item.value ? 18 : 2 }] }]} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Qari Modal ── */}
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
                style={[s.reciterRow, { backgroundColor: selectedReciter.id === r.id ? colors.primary + "15" : colors.card, borderColor: selectedReciter.id === r.id ? colors.primary : colors.border }]}
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
                {selectedReciter.id === r.id && <Feather name="check-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: any, arabicFontSize: number, translationFontSize: number) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 10 },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    headerSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    navBtn: { padding: 2 },
    qariBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },

    bismillah: { padding: 28, alignItems: "center" },
    bismillahText: { fontSize: 20, color: "#FFF", marginBottom: 14, textAlign: "center", lineHeight: 36 },
    surahTitle: { fontSize: 34, marginBottom: 6, lineHeight: 50 },
    surahSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 12 },
    surahMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
    surahMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    surahMetaText: { fontSize: 11, color: "#FFFFFF80", fontFamily: "Inter_400Regular" },
    surahMetaDivider: { width: 1, height: 12, backgroundColor: "#FFFFFF30" },
    headerBtns: { flexDirection: "row", gap: 10 },
    startBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
    startBtnText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14 },
    downloadBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1 },
    downloadBtnText: { color: "#FFF", fontFamily: "Inter_400Regular", fontSize: 13 },

    ayah: { paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1 },
    ayahHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 8 },
    ayahNumber: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    ayahNumberText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    ayahMeta: { flex: 1, flexDirection: "row", gap: 10 },
    ayahMetaText: { fontSize: 10, fontFamily: "Inter_400Regular" },
    ayahActions: { flexDirection: "row", alignItems: "center", gap: 14 },

    arabic: { textAlign: "right", marginBottom: 12, fontFamily: "Inter_400Regular" },
    translation: { fontFamily: "Inter_400Regular", marginBottom: 6, color: "#666" },
    urdu: { textAlign: "right", fontFamily: "Inter_400Regular", fontStyle: "italic", marginBottom: 6 },

    tafsirBox: { borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 8 },
    tafsirLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
    tafsirText: { fontSize: 13, lineHeight: 20, fontFamily: "Inter_400Regular" },

    player: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, gap: 10 },
    playerInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    playerReciter: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 13 },
    playerAyah: { color: "#FFFFFF90", fontFamily: "Inter_400Regular", fontSize: 11 },
    playerControls: { flexDirection: "row", alignItems: "center", gap: 10 },
    controlBtn: { padding: 4 },
    playPauseBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },

    menuOverlay: { flex: 1, backgroundColor: "#00000070", justifyContent: "center", alignItems: "center", padding: 30 },
    menuCard: { width: "100%", borderRadius: 18, borderWidth: 1, overflow: "hidden" },
    menuTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", padding: 16, paddingBottom: 12 },
    menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1 },
    menuItemText: { fontSize: 15, fontFamily: "Inter_400Regular" },

    modal: { flex: 1 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },

    settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 1, padding: 16 },
    settingLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    settingHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
    fontSizeControls: { flexDirection: "row", alignItems: "center", gap: 12 },
    fontBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    fontSizeNum: { fontSize: 17, fontFamily: "Inter_700Bold", minWidth: 28, textAlign: "center" },
    previewBox: { borderRadius: 14, borderWidth: 1, padding: 16 },

    toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 1, padding: 16 },
    toggleLabel: { fontSize: 15, fontFamily: "Inter_400Regular", flex: 1 },
    toggleSwitch: { width: 42, height: 24, borderRadius: 12, justifyContent: "center" },
    toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFF" },

    reciterRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 8, marginTop: 4, borderWidth: 1, gap: 12 },
    reciterAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    reciterInfo: { flex: 1 },
    reciterName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    reciterArabic: { fontSize: 13, marginBottom: 2 },
    reciterMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  });
}
