import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { useColors } from "@/hooks/useColors";
import { RECITERS, getAudioUrl, type Reciter } from "@/constants/reciters";

export default function QarisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const playSample = async (reciter: Reciter) => {
    try {
      if (playing === reciter.id) {
        await soundRef.current?.pauseAsync();
        setPlaying(null);
        return;
      }
      setLoading(reciter.id);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlaying(null);
      const url = getAudioUrl(reciter.folder, 1, 1);
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setPlaying(reciter.id);
      setLoading(null);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(null);
        }
      });
    } catch {
      setLoading(null);
      setPlaying(null);
    }
  };

  const s = makeStyles(colors);
  const STYLES_COLORS: Record<string, string> = {
    Murattal: colors.primary,
    Mujawwad: colors.gold,
    Muallim: colors.teal ?? "#0D9373",
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={[s.title, { color: colors.foreground }]}>Reciters Library</Text>
          <Text style={[s.subtitle, { color: colors.gold }]}>مكتبة القراء</Text>
        </View>
      </View>

      <FlatList
        data={RECITERS}
        keyExtractor={r => r.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isPlaying = playing === item.id;
          const isLoading = loading === item.id;
          const styleColor = STYLES_COLORS[item.style] ?? colors.primary;

          return (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.cardLeft}>
                <View style={[s.avatar, { backgroundColor: colors.navy }]}>
                  <Feather name="mic" size={22} color={colors.gold} />
                </View>
              </View>
              <View style={s.cardInfo}>
                <View style={s.nameRow}>
                  <Text style={[s.name, { color: colors.foreground }]}>{item.name}</Text>
                  <View style={[s.styleBadge, { backgroundColor: styleColor + "20" }]}>
                    <Text style={[s.styleText, { color: styleColor }]}>{item.style}</Text>
                  </View>
                </View>
                <Text style={[s.arabicName, { color: colors.gold }]}>{item.nameArabic}</Text>
                <Text style={[s.country, { color: colors.mutedForeground }]}>
                  <Feather name="map-pin" size={11} color={colors.mutedForeground} /> {item.country}
                </Text>
                <Text style={[s.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              <TouchableOpacity
                style={[s.playBtn, { backgroundColor: isPlaying ? colors.primary : colors.primary + "15", borderColor: colors.primary }]}
                onPress={() => playSample(item)}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Feather
                    name={isPlaying ? "pause" : "play"}
                    size={18}
                    color={isPlaying ? "#FFF" : colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          );
        }}
        ListHeaderComponent={
          <View style={[s.infoBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[s.infoText, { color: colors.primary }]}>
              Tap ▶ to listen to a sample of Al-Fatiha. Select your preferred reciter in the Quran reader.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
    backBtn: { paddingBottom: 2 },
    headerText: { flex: 1 },
    title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 1 },
    subtitle: { fontSize: 14 },
    infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
    infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
    card: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
    cardLeft: {},
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    cardInfo: { flex: 1 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 },
    name: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
    styleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    styleText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    arabicName: { fontSize: 13, marginBottom: 2 },
    country: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
    desc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
    playBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 1.5, flexShrink: 0 },
  });
}
