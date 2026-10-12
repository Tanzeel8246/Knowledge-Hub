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
import { useBackgroundSync, formatTimeAgo } from "@/hooks/useBackgroundSync";
import { useGetSurahs, useGetBooks } from "@workspace/api-client-react";

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
  { id: "muwatta", label: "Muwatta Imam Malik", labelAr: "موطأ الإمام مالك (رواية يحيى)" },
  { id: "muwatta-muhammad", label: "Muwatta Imam Muhammad (Hanafi)", labelAr: "موطأ الإمام محمد بن الحسن الشيباني" },
  { id: "tahawi", label: "Sharh Ma'ani al-Athar (Tahawi)", labelAr: "شرح معاني الآثار للطحاوي" },
  { id: "darimi", label: "Sunan al-Darimi", labelAr: "سنن الدارمي" },
  { id: "musnad-ahmad", label: "Musnad Ahmad ibn Hanbal", labelAr: "مسند الإمام أحمد بن حنبل" },
  { id: "musannaf-ibn-abi-shaybah", label: "Musannaf Ibn Abi Shaybah", labelAr: "المصنف لابن أبي شيبة" },
  { id: "musannaf-abdur-razzaq", label: "Musannaf Abd al-Razzaq", labelAr: "المصنف لعبد الرزاق الصنعاني" },
  { id: "mustadrak-hakim", label: "Al-Mustadrak lil-Hakim", labelAr: "المستدرك على الصحيحين للحاكم" },
  { id: "sunan-bayhaqi", label: "Al-Sunan al-Kubra lil-Bayhaqi", labelAr: "السنن الكبرى للبيهقي" },
  { id: "kitab-al-athar-abu-yusuf", label: "Kitab al-Athar (Abu Yusuf)", labelAr: "كتاب الآثار للإمام أبي يوسف" },
  { id: "kitab-al-athar-shaybani", label: "Kitab al-Athar (Shaybani)", labelAr: "كتاب الآثار لمحمد بن الحسن الشيباني" },
  { id: "mushkil-al-athar", label: "Sharh Mushkil al-Athar", labelAr: "شرح مشكل الآثار للطحاوي" },
  { id: "tabarani-kabir", label: "Al-Mu'jam al-Kabir (Tabarani)", labelAr: "المعجم الكبير للطبراني" },
  { id: "musnad-abi-yala", label: "Musnad Abi Ya'la", labelAr: "مسند أبي يعلى الموصلي" },
  { id: "musnad-al-bazzar", label: "Musnad al-Bazzar", labelAr: "مسند البزار (البحر الزخار)" },
  { id: "sunan-saeed-ibn-mansur", label: "Sunan Sa'id ibn Mansur", labelAr: "سنن سعيد بن منصور" },
];

const STALE_DAYS = 7;

export default function DownloadsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: surahs } = useGetSurahs();
  const { data: booksData } = useGetBooks({ limit: 100 });
  const {
    index, totalBytes, downloadSurah, downloadHadithCollection, downloadBook,
    deleteDownload, isDownloaded, isStale, getStatus, getProgress,
    getSurahKey, getCollectionKey, getBookKey, staleCount, reload,
  } = useOfflineDownload();
  const { isSyncing, lastSyncAt, lastSyncCount, syncNow } = useBackgroundSync();

  const [downloadingAll, setDownloadingAll] = useState(false);
  const [tab, setTab] = useState<"quran" | "hadith" | "books">("quran");

  useEffect(() => { reload(); }, []);

  // Reload index after background sync completes
  useEffect(() => { if (!isSyncing) reload(); }, [isSyncing]);

  const s = makeStyles(colors);

  const downloadedSurahs = (surahs ?? []).filter(s => isDownloaded(getSurahKey(s.number)));
  const downloadedCollections = HADITH_COLLECTIONS.filter(c => isDownloaded(getCollectionKey(c.id)));
  const quranCount = downloadedSurahs.length;
  const hadithCount = downloadedCollections.length;

  const handleSyncNow = async () => {
    if (staleCount === 0) {
      Alert.alert("Up to Date", "All downloaded content is fresh (synced within 7 days).");
      return;
    }
    Alert.alert(
      "Sync Stale Content",
      `${staleCount} item${staleCount > 1 ? "s are" : " is"} older than ${STALE_DAYS} days. Re-download now?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sync Now", onPress: syncNow },
      ]
    );
  };

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
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Offline Downloads</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Read without internet</Text>
        </View>
        {/* Sync button */}
        <TouchableOpacity
          style={[s.syncBtn, { borderColor: isSyncing ? colors.primary + "60" : staleCount > 0 ? "#F59E0B40" : colors.border }]}
          onPress={handleSyncNow}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather
              name="refresh-cw"
              size={16}
              color={staleCount > 0 ? "#F59E0B" : colors.mutedForeground}
            />
          )}
          {staleCount > 0 && !isSyncing && (
            <View style={s.staleBadge}>
              <Text style={s.staleBadgeText}>{staleCount}</Text>
            </View>
          )}
        </TouchableOpacity>
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
        {/* Sync status banner */}
        {(isSyncing || lastSyncAt) && (
          <View style={[s.syncBanner, { backgroundColor: isSyncing ? colors.primary + "12" : colors.card, borderColor: isSyncing ? colors.primary + "30" : colors.border }]}>
            {isSyncing ? (
              <>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[s.syncBannerText, { color: colors.primary }]}>
                  Syncing offline content in background…
                </Text>
              </>
            ) : (
              <>
                <Feather name="check-circle" size={14} color="#16A34A" />
                <Text style={[s.syncBannerText, { color: colors.mutedForeground }]}>
                  Last synced {formatTimeAgo(lastSyncAt)}
                  {lastSyncCount > 0 ? ` · ${lastSyncCount} item${lastSyncCount > 1 ? "s" : ""} refreshed` : " · All up to date"}
                </Text>
              </>
            )}
          </View>
        )}

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
          <View style={[s.statDivider, { backgroundColor: "#FFFFFF20" }]} />
          <View style={s.statItem}>
            <Feather name="refresh-cw" size={18} color={staleCount > 0 ? "#F59E0B" : "#34D399"} />
            <Text style={s.statNum}>{staleCount > 0 ? staleCount : "✓"}</Text>
            <Text style={s.statLabel}>{staleCount > 0 ? "Stale" : "Fresh"}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
          {(["quran", "hadith", "books"] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tab, tab === t && { borderBottomColor: colors.primary }]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
                {t === "quran" ? "Quran" : t === "hadith" ? "Hadith" : "Books & Tafsir"}
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

            {/* Surah list */}
            {(surahs ?? []).map(surah => {
              const key = getSurahKey(surah.number);
              const status = getStatus(key);
              const prog = getProgress(key);
              const done = status === "done";
              const downloading = status === "downloading" || status === "syncing";
              const stale = done && isStale(key);
              const rec = index[key];

              return (
                <View
                  key={surah.number}
                  style={[s.surahRow, { backgroundColor: colors.card, borderColor: stale ? "#F59E0B30" : colors.border }]}
                >
                  <View style={[s.surahNum, { backgroundColor: done ? (stale ? "#F59E0B20" : "#16A34A20") : colors.primary + "15" }]}>
                    <Text style={[s.surahNumText, { color: done ? (stale ? "#F59E0B" : "#16A34A") : colors.primary }]}>{surah.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.surahName, { color: colors.foreground }]}>{surah.nameTransliteration}</Text>
                    <Text style={[s.surahMeta, { color: colors.mutedForeground }]}>
                      {surah.nameEnglish} · {surah.totalAyahs} ayahs
                    </Text>
                    {done && rec && (
                      <Text style={[s.syncedAt, { color: stale ? "#F59E0B" : colors.mutedForeground }]}>
                        {stale ? "⚠ " : ""}Synced {formatTimeAgo(rec.lastSynced ?? rec.downloadedAt)}
                      </Text>
                    )}
                    {downloading && (
                      <View style={[s.progressBar, { backgroundColor: colors.border }]}>
                        <View style={[s.progressFill, { width: `${Math.round(prog * 100)}%` as any, backgroundColor: colors.primary }]} />
                      </View>
                    )}
                  </View>
                  <Text style={[s.surahAr, { color: colors.gold }]}>{surah.nameArabic}</Text>
                  {done ? (
                    <TouchableOpacity onPress={() => handleDeleteSurah(surah.number, surah.nameTransliteration)}>
                      <Feather name="check-circle" size={20} color={stale ? "#F59E0B" : "#16A34A"} />
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
              Download any collection for offline browsing. Sahih Sitta, Muwatta'ayn, and Sharh Ma'ani al-Athar (Tahawi).
            </Text>
            {HADITH_COLLECTIONS.map(col => {
              const key = getCollectionKey(col.id);
              const status = getStatus(key);
              const prog = getProgress(key);
              const done = status === "done";
              const downloading = status === "downloading" || status === "syncing";
              const stale = done && isStale(key);
              const rec = index[key];

              return (
                <View
                  key={col.id}
                  style={[s.colCard, { backgroundColor: colors.card, borderColor: stale ? "#F59E0B40" : done ? "#16A34A40" : colors.border }]}
                >
                  <View style={s.colTop}>
                    <View style={[s.colIcon, { backgroundColor: done ? (stale ? "#F59E0B20" : "#16A34A20") : colors.primary + "15" }]}>
                      <MaterialCommunityIcons
                        name="script-text-outline"
                        size={22}
                        color={done ? (stale ? "#F59E0B" : "#16A34A") : colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.colLabel, { color: colors.foreground }]}>{col.label}</Text>
                      <Text style={[s.colAr, { color: colors.gold }]}>{col.labelAr}</Text>
                      {rec && (
                        <Text style={[s.colMeta, { color: stale ? "#F59E0B" : colors.mutedForeground }]}>
                          {formatBytes(rec.sizeBytes ?? 0)}
                          {stale ? " · ⚠ Needs refresh" : ` · Synced ${formatTimeAgo(rec.lastSynced ?? rec.downloadedAt)}`}
                        </Text>
                      )}
                    </View>
                    {done ? (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {stale && (
                          <TouchableOpacity
                            style={[s.colBtn, { backgroundColor: "#F59E0B20", borderRadius: 20 }]}
                            onPress={() => syncNow()}
                          >
                            <Feather name="refresh-cw" size={14} color="#F59E0B" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDeleteCollection(col.id, col.label)} style={s.colBtn}>
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
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
                  {done && !stale && (
                    <View style={[s.offlineBadge, { backgroundColor: "#16A34A20" }]}>
                      <Feather name="wifi-off" size={12} color="#16A34A" />
                      <Text style={[s.offlineBadgeText, { color: "#16A34A" }]}>Available Offline</Text>
                    </View>
                  )}
                  {done && stale && (
                    <View style={[s.offlineBadge, { backgroundColor: "#F59E0B20" }]}>
                      <Feather name="alert-circle" size={12} color="#F59E0B" />
                      <Text style={[s.offlineBadgeText, { color: "#F59E0B" }]}>Stale — tap refresh to update</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {tab === "books" && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Text style={[s.sectionNote, { color: colors.mutedForeground }]}>
              Download complete classical commentaries (Tafsir Tabari, Ibn Kathir, Qurtubi, Razi, Jalalayn) and fiqh/hadith manuals for offline study.
            </Text>
            {(booksData?.books ?? []).map(b => {
              const key = getBookKey(b.id);
              const status = getStatus(key);
              const prog = getProgress(key);
              const done = status === "done";
              const downloading = status === "downloading" || status === "syncing";
              const stale = done && isStale(key);
              const rec = index[key];

              return (
                <View
                  key={b.id}
                  style={[s.colCard, { backgroundColor: colors.card, borderColor: stale ? "#F59E0B40" : done ? "#16A34A40" : colors.border }]}
                >
                  <View style={s.colTop}>
                    <View style={[s.colIcon, { backgroundColor: done ? (stale ? "#F59E0B20" : "#16A34A20") : colors.gold + "15" }]}>
                      <Feather
                        name="book-open"
                        size={20}
                        color={done ? (stale ? "#F59E0B" : "#16A34A") : colors.gold}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.colLabel, { color: colors.foreground }]}>{b.title}</Text>
                      {b.titleArabic && <Text style={[s.colAr, { color: colors.gold }]}>{b.titleArabic}</Text>}
                      <Text style={[s.colMeta, { color: colors.mutedForeground }]}>by {b.author} · {b.totalChapters} chapters</Text>
                      {rec && (
                        <Text style={[s.colMeta, { color: stale ? "#F59E0B" : colors.mutedForeground }]}>
                          {formatBytes(rec.sizeBytes ?? 0)}
                          {stale ? " · ⚠ Needs refresh" : ` · Synced ${formatTimeAgo(rec.lastSynced ?? rec.downloadedAt)}`}
                        </Text>
                      )}
                    </View>
                    {done ? (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity onPress={() => deleteDownload(key)} style={s.colBtn}>
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ) : downloading ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <TouchableOpacity
                        style={[s.colBtn, { backgroundColor: colors.gold, borderRadius: 20 }]}
                        onPress={() => downloadBook(b.id, b.title, b.titleArabic ?? undefined)}
                      >
                        <Feather name="download" size={16} color="#000" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {downloading && (
                    <View style={[s.progressBar, { backgroundColor: colors.border, marginTop: 10 }]}>
                      <View style={[s.progressFill, { width: `${Math.round(prog * 100)}%` as any, backgroundColor: colors.gold }]} />
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
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 18, fontFamily: "Inter_700Bold" },
    subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
    syncBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    staleBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#F59E0B", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
    staleBadgeText: { color: "#FFF", fontSize: 9, fontFamily: "Inter_700Bold" },

    syncBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 10 },
    syncBannerText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },

    statsCard: { margin: 16, borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
    statItem: { alignItems: "center", gap: 4 },
    statNum: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
    statLabel: { color: "#FFFFFF70", fontSize: 10, fontFamily: "Inter_400Regular" },
    statDivider: { width: 1, height: 36 },

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
    syncedAt: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
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
