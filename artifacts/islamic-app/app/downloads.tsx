import React, { useState, useEffect, useCallback } from "react";
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
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useOfflineDownload } from "@/hooks/useOfflineDownload";
import { useGetSurahs, useGetHadithCollections } from "@workspace/api-client-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const HADITH_COLLECTIONS = [
  { id: "bukhari", label: "Sahih al-Bukhari", labelAr: "صحيح البخاري" },
  { id: "muslim", label: "Sahih Muslim", labelAr: "صحيح مسلم" },
  { id: "abudawud", label: "Sunan Abu Dawud", labelAr: "سنن أبي داود" },
  { id: "tirmidhi", label: "Jami' al-Tirmidhi", labelAr: "جامع الترمذي" },
  { id: "nasai", label: "Sunan al-Nasa'i", labelAr: "سنن النسائي" },
  { id: "ibnmajah", label: "Sunan Ibn Majah", labelAr: "سنن ابن ماجه" },
];

export default function DownloadsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: surahs } = useGetSurahs();
  const {
    index, totalBytes, downloadSurah, downloadHadithCollection,
    deleteDownload, isDownloaded, getStatus, getProgress, getSurahKey, getCollectionKey,
    reload,
  } = useOfflineDownload();

  const [downloadingAll, setDownloadingAll] = useState(false);
  const [tab, setTab] = useState<"quran" | "hadith">("quran");

  useEffect(() => { reload(); }, []);

  const s = makeStyles(colors);

  const downloadedSurahs = (surahs ?? []).filter(s => isDownloaded(getSurahKey(s.number)));
  const downloadedCollections = HADITH_COLLECTIONS.filter(c => isDownloaded(getCollectionKey(c.id)));
  const quranCount = downloadedSurahs.length;
  const hadithCount = downloadedCollections.length;

  const handleDownloadAllQuran = async () => {
    if (!surahs) return;
    const pending = surahs.filter(s => !isDownloaded(getSurahKey(s.number)));
    if (pending.length === 0) {
      Alert.alert("Already Downloaded", "All 114 surahs are available offline.");
      return;
    }
    Alert.alert(
      "Download Entire Quran",
      `Download ${pending.length} remaining surahs for offline reading? This may take a minute.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download", onPress: async () => {
            setDownloadingAll(true);
            let currentIndex = { ...index };
            for (const surah of pending) {
              const result = await downloadSurah(surah.number, surah.nameTransliteration, surah.nameArabic, currentIndex);
              if (result) currentIndex = result;
            }
            setDownloadingAll(false);
          }
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All Downloads",
      "This will remove all offline content. You'll need internet to read again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All", style: "destructive", onPress: async () => {
            const keys = Object.keys(index);
            for (const key of keys) await deleteDownload(key);
          }
        },
      ]
    );
  };

  const handleDeleteSurah = (surahNumber: number, name: string) => {
    Alert.alert("Delete Download", `Remove offline copy of ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDownload(getSurahKey(surahNumber)) },
    ]);
  };

  const handleDeleteCollection = (id: string, label: string) => {
    Alert.alert("Delete Download", `Remove offline copy of ${label}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDownload(getCollectionKey(id)) },
    ]);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Offline Downloads</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Read without internet</Text>
        </View>
        {Object.keys(index).length > 0 && (
          <TouchableOpacity onPress={handleDeleteAll}>
            <Feather name="trash-2" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
      >
        {/* Storage Stats */}
        <View style={[s.statsCard, { backgroundColor: colors.navy }]}>
          <View style={s.statItem}>
            <MaterialCommunityIcons name="book-open-variant" size={22} color={colors.gold} />
            <Text style={s.statNum}>{quranCount}</Text>
            <Text style={s.statLabel}>Surahs</Text>
          </View>
          <View style={[s.statDivider, { backgroundColor: "#FFFFFF20" }]} />
          <View style={s.statItem}>
            <MaterialCommunityIcons name="script-text-outline" size={22} color="#60A5FA" />
            <Text style={s.statNum}>{hadithCount}</Text>
            <Text style={s.statLabel}>Collections</Text>
          </View>
          <View style={[s.statDivider, { backgroundColor: "#FFFFFF20" }]} />
          <View style={s.statItem}>
            <MaterialCommunityIcons name="harddisk" size={22} color="#34D399" />
            <Text style={s.statNum}>{formatBytes(totalBytes)}</Text>
            <Text style={s.statLabel}>Stored</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
          {(["quran", "hadith"] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tab, tab === t && { borderBottomColor: colors.primary }]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
                {t === "quran" ? "Quran" : "Hadith"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "quran" && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {/* Download All button */}
            <TouchableOpacity
              style={[s.downloadAllBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}
              onPress={handleDownloadAllQuran}
              disabled={downloadingAll}
            >
              {downloadingAll ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <MaterialCommunityIcons name="book-open-variant" size={18} color={colors.primary} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[s.downloadAllLabel, { color: colors.primary }]}>Download Entire Quran</Text>
                <Text style={[s.downloadAllSub, { color: colors.mutedForeground }]}>
                  {quranCount}/114 surahs downloaded
                </Text>
              </View>
              <View style={[s.progressPill, { backgroundColor: colors.primary + "25" }]}>
                <Text style={[s.progressPillText, { color: colors.primary }]}>
                  {Math.round((quranCount / 114) * 100)}%
                </Text>
              </View>
            </TouchableOpacity>

            {/* Surah grid */}
            {(surahs ?? []).map(surah => {
              const key = getSurahKey(surah.number);
              const status = getStatus(key);
              const prog = getProgress(key);
              const done = status === "done";
              const downloading = status === "downloading";

              return (
                <View
                  key={surah.number}
                  style={[s.surahRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[s.surahNum, { backgroundColor: done ? "#16A34A20" : colors.primary + "15" }]}>
                    <Text style={[s.surahNumText, { color: done ? "#16A34A" : colors.primary }]}>{surah.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.surahName, { color: colors.foreground }]}>{surah.nameTransliteration}</Text>
                    <Text style={[s.surahMeta, { color: colors.mutedForeground }]}>
                      {surah.nameEnglish} · {surah.totalAyahs} ayahs
                    </Text>
                    {downloading && (
                      <View style={[s.progressBar, { backgroundColor: colors.border }]}>
                        <View style={[s.progressFill, { width: `${Math.round(prog * 100)}%` as any, backgroundColor: colors.primary }]} />
                      </View>
                    )}
                  </View>
                  <Text style={[s.surahAr, { color: colors.gold }]}>{surah.nameArabic}</Text>
                  {done ? (
                    <TouchableOpacity onPress={() => handleDeleteSurah(surah.number, surah.nameTransliteration)}>
                      <Feather name="check-circle" size={20} color="#16A34A" />
                    </TouchableOpacity>
                  ) : downloading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <TouchableOpacity onPress={() => downloadSurah(surah.number, surah.nameTransliteration, surah.nameArabic)}>
                      <Feather name="download" size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {tab === "hadith" && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Text style={[s.sectionNote, { color: colors.mutedForeground }]}>
              Download any collection for offline browsing. Sahih Sitta (6 canonical books) — 34,000+ hadiths with full Arabic & English.
            </Text>
            {HADITH_COLLECTIONS.map(col => {
              const key = getCollectionKey(col.id);
              const status = getStatus(key);
              const prog = getProgress(key);
              const done = status === "done";
              const downloading = status === "downloading";
              const rec = index[key];

              return (
                <View
                  key={col.id}
                  style={[s.colCard, { backgroundColor: colors.card, borderColor: done ? "#16A34A40" : colors.border }]}
                >
                  <View style={s.colTop}>
                    <View style={[s.colIcon, { backgroundColor: done ? "#16A34A20" : colors.primary + "15" }]}>
                      <MaterialCommunityIcons
                        name="script-text-outline"
                        size={22}
                        color={done ? "#16A34A" : colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.colLabel, { color: colors.foreground }]}>{col.label}</Text>
                      <Text style={[s.colAr, { color: colors.gold }]}>{col.labelAr}</Text>
                      {rec && (
                        <Text style={[s.colMeta, { color: colors.mutedForeground }]}>
                          {formatBytes(rec.sizeBytes ?? 0)} · {new Date(rec.downloadedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    {done ? (
                      <TouchableOpacity onPress={() => handleDeleteCollection(col.id, col.label)} style={s.colBtn}>
                        <Feather name="trash-2" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    ) : downloading ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <TouchableOpacity
                        style={[s.colBtn, { backgroundColor: colors.primary, borderRadius: 20 }]}
                        onPress={() => downloadHadithCollection(col.id, col.label, col.labelAr)}
                      >
                        <Feather name="download" size={16} color="#FFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {downloading && (
                    <View style={[s.progressBar, { backgroundColor: colors.border, marginTop: 10 }]}>
                      <View style={[s.progressFill, { width: `${Math.round(prog * 100)}%` as any, backgroundColor: colors.primary }]} />
                    </View>
                  )}
                  {done && (
                    <View style={[s.offlineBadge, { backgroundColor: "#16A34A20" }]}>
                      <Feather name="wifi-off" size={12} color="#16A34A" />
                      <Text style={[s.offlineBadgeText, { color: "#16A34A" }]}>Available Offline</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 14 },
    headerCenter: { flex: 1 },
    title: { fontSize: 18, fontFamily: "Inter_700Bold" },
    subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },

    statsCard: { margin: 16, borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
    statItem: { alignItems: "center", gap: 4 },
    statNum: { color: "#FFF", fontSize: 18, fontFamily: "Inter_700Bold" },
    statLabel: { color: "#FFFFFF70", fontSize: 11, fontFamily: "Inter_400Regular" },
    statDivider: { width: 1, height: 40 },

    tabRow: { flexDirection: "row", borderBottomWidth: 1 },
    tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
    tabText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

    downloadAllBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
    downloadAllLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    downloadAllSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
    progressPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    progressPillText: { fontSize: 12, fontFamily: "Inter_700Bold" },

    surahRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 10, marginBottom: 6, borderWidth: 1, gap: 10 },
    surahNum: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    surahNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    surahName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    surahMeta: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
    surahAr: { fontSize: 16, lineHeight: 24 },

    progressBar: { height: 3, borderRadius: 2, marginTop: 4, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 2 },

    sectionNote: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 16 },
    colCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
    colTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    colIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    colLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    colAr: { fontSize: 14, marginTop: 2 },
    colMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3 },
    colBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    offlineBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, borderRadius: 8, padding: 8, alignSelf: "flex-start" },
    offlineBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  });
}
