import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useGetHadiths, useCreateBookmark } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";
import { FALLBACK_HADITHS, HadithItem } from "@/constants/hadithData";
import { useOfflineDownload } from "@/hooks/useOfflineDownload";
import { fetchHadithSection } from "@/lib/openIslamicApi";
import { shamelaStorage } from "@/lib/shamelaStorage";
import { useLanguage } from "@/context/LanguageContext";

type ViewMode = "vertical" | "horizontal";
type GradeFilter = "all" | "sahih" | "hasan" | "daif" | "muttafaq";

/**
 * Strips intermediate transmission chains (Isnad) and starts directly
 * with the Sahabi (Companion) while preserving the Sahabi's name.
 */
export function cleanHadithIsnad(
  rawText: string | undefined,
  lang: "arabic" | "urdu" | "english",
  narrator?: string,
  showIsnad: boolean = true
): string {
  if (!rawText) return "";
  if (showIsnad) return rawText;

  if (lang === "urdu") {
    // Pattern 1: Sahabi name + Razi Allahu Anhu + se riwayat hai ke / ne farmaya ke
    const sahabiRegex = /(?:حضرت|سیدنا|سیدتنا|ام المؤمنین|ابو|ابن)\s+[^،,.\n]{1,35}\s*رضی اللہ\s*عنہ[ما]*\s*(?:سے\s*روایت\s*ہے\s*کہ|سے\s*مروی\s*ہے\s*کہ|نے\s*فرمایا\s*کہ|بیان\s*کرتے\s*ہیں\s*کہ|فرماتے\s*ہیں|کہتے\s*ہیں)/u;
    const match = rawText.match(sahabiRegex);
    if (match && match.index !== undefined && match.index > 5) {
      return rawText.slice(match.index).trim();
    }
    // Pattern 2: "...سے روایت ہے کہ رسول اللہ ﷺ نے فرمایا..."
    const riwayatRegex = /(?:سے\s*روایت\s*ہے\s*کہ|سے\s*مروی\s*ہے\s*کہ)\s*/u;
    const rMatch = rawText.match(riwayatRegex);
    if (rMatch && rMatch.index !== undefined && rMatch.index > 10) {
      const sahabiLabel = narrator ? `حضرت ${narrator} رضی اللہ عنہ ` : "";
      return sahabiLabel + rawText.slice(rMatch.index).trim();
    }
    // Pattern 3: "رسول اللہ ﷺ نے فرمایا"
    const rasoolRegex = /(?:رسول اللہ\s*(?:ﷺ|صلی اللہ علیہ وسلم)\s*نے\s*فرمایا)/u;
    const pMatch = rawText.match(rasoolRegex);
    if (pMatch && pMatch.index !== undefined && pMatch.index > 15) {
      const sahabiLabel = narrator ? `حضرت ${narrator} رضی اللہ عنہ سے روایت ہے کہ ` : "";
      return sahabiLabel + rawText.slice(pMatch.index).trim();
    }
  } else if (lang === "arabic") {
    // Look for: عَنْ [صحابي] رَضِيَ اللَّهُ عَنْهُ
    const arSahabiRegex = /(عَنْ\s+[^،,.\n]{2,35}\s*رَضِيَ\s*اللَّهُ\s*عَنْهُ[مَا]*[\s\S]*)/u;
    const match = rawText.match(arSahabiRegex);
    if (match && match.index !== undefined && match.index > 5) {
      return match[1].trim();
    }
    // Look for: أَنَّ رَسُولَ اللَّهِ or قَالَ رَسُولُ اللَّهِ
    const arRasoolRegex = /(أَنَّ\s+رَسُولَ\s+اللَّهِ[\s\S]*|قَالَ\s+رَسُولُ\s+اللَّهِ[\s\S]*)/u;
    const rMatch = rawText.match(arRasoolRegex);
    if (rMatch && rMatch.index !== undefined && rMatch.index > 10) {
      return (narrator ? `عَنْ ${narrator}: ` : "") + rMatch[1].trim();
    }
  } else if (lang === "english") {
    const enRegex = /(Narrated\s+[A-Za-z\s.'-]+:\s*[\s\S]*|On the authority of\s+[A-Za-z\s.'-]+:\s*[\s\S]*)/i;
    const match = rawText.match(enRegex);
    if (match && match.index !== undefined && match.index > 5) {
      return match[1].trim();
    }
  }

  return rawText;
}

export default function HadithListScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isUrdu, isArabic } = useLanguage();
  const { collectionId, bookNumber, targetHadith } = useLocalSearchParams<{
    collectionId: string;
    bookNumber: string;
    targetHadith?: string;
  }>();
  const bNum = Number(bookNumber) || 1;
  const colId = collectionId ?? "bukhari";

  const { data: hadithData, isLoading: apiLoading } = useGetHadiths(colId, bNum, { page: 1, limit: 100 });
  const { getHadithCollectionOffline } = useOfflineDownload();

  const [offlineHadiths, setOfflineHadiths] = useState<HadithItem[]>([]);
  const [cdnHadiths, setCdnHadiths] = useState<HadithItem[]>([]);
  const [cdnLoading, setCdnLoading] = useState(false);

  // View mode: vertical (stream) vs horizontal (one-by-one card)
  const [viewMode, setViewMode] = useState<ViewMode>("vertical");
  // Grade filter
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  // Active index for horizontal mode
  const [activeIndex, setActiveIndex] = useState(0);
  // Isnad Visibility toggle
  const [showIsnad, setShowIsnad] = useState<boolean>(true);
  // Highlight targeted hadith
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const horizontalFlatListRef = useRef<FlatList>(null);
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    let isMounted = true;
    if (colId && bNum) {
      // 1. Check local offline storage first
      getHadithCollectionOffline<{ collection: any; books: any[]; hadiths: HadithItem[] }>(colId).then(data => {
        if (!isMounted) return;
        if (data?.hadiths) {
          const filtered = data.hadiths.filter((h: any) => h.bookNumber === bNum);
          if (filtered.length > 0) {
            setOfflineHadiths(filtered);
            if (filtered.length >= 25) return;
          }
        }

        // 2. Fetch complete authentic section from Open Hadith CDN
        setCdnLoading(true);
        fetchHadithSection(colId, bNum)
          .then(items => {
            if (!isMounted) return;
            if (items && items.length > 0) {
              setCdnHadiths(items);
              shamelaStorage.appendHadithsToCollection(colId, items).catch(() => {});
            }
          })
          .finally(() => {
            if (isMounted) setCdnLoading(false);
          });
      });
    }
    return () => { isMounted = false; };
  }, [colId, bNum]);

  const fallbackList = FALLBACK_HADITHS[colId]?.[bNum] ?? [];
  const rawHadiths: HadithItem[] = offlineHadiths.length > 0
    ? offlineHadiths
    : cdnHadiths.length > 0
    ? cdnHadiths
    : ((hadithData?.hadiths as any[]) && (hadithData?.hadiths as any[]).length > 0)
    ? (hadithData?.hadiths as any[])
    : fallbackList;

  // Grade matching logic
  const normalizeGrade = (g?: string | null): GradeFilter => {
    if (!g) return "all";
    const lower = g.toLowerCase();
    if (lower.includes("sahih") || lower.includes("صحيح")) return "sahih";
    if (lower.includes("hasan") || lower.includes("حسن")) return "hasan";
    if (lower.includes("da'if") || lower.includes("daif") || lower.includes("ضعيف")) return "daif";
    if (lower.includes("muttafaq") || lower.includes("متفق")) return "muttafaq";
    return "all";
  };

  const filteredHadiths = useMemo(() => {
    if (gradeFilter === "all") return rawHadiths;
    return rawHadiths.filter(item => {
      const g = normalizeGrade(item.grade);
      return g === gradeFilter;
    });
  }, [rawHadiths, gradeFilter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const res = { all: rawHadiths.length, sahih: 0, hasan: 0, daif: 0, muttafaq: 0 };
    for (const h of rawHadiths) {
      const g = normalizeGrade(h.grade);
      if (g === "sahih") res.sahih++;
      else if (g === "hasan") res.hasan++;
      else if (g === "daif") res.daif++;
      else if (g === "muttafaq") res.muttafaq++;
    }
    return res;
  }, [rawHadiths]);

  const isLoading = rawHadiths.length === 0 && (apiLoading || cdnLoading);
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();

  const handleBookmark = async (hadith: HadithItem) => {
    try {
      await createBookmark.mutateAsync({
        data: {
          sourceType: "hadith" as any,
          sourceId: hadith.id,
          label: `${colId} #${hadith.hadithNumber}`,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/bookmarks"] });
      Alert.alert("✅ " + t.bookmarked, `${colId} #${hadith.hadithNumber}`);
    } catch {
      Alert.alert("Error", "Could not bookmark this hadith");
    }
  };

  // Auto-scroll and highlight if targetHadith was requested from search
  useEffect(() => {
    if (targetHadith && filteredHadiths.length > 0) {
      const targetIdx = filteredHadiths.findIndex(
        h => String(h.hadithNumber) === String(targetHadith) || h.id === targetHadith
      );
      if (targetIdx !== -1) {
        setHighlightId(filteredHadiths[targetIdx].id);
        const timer = setTimeout(() => {
          if (viewMode === "horizontal") {
            goToCard(targetIdx);
          } else {
            flatListRef.current?.scrollToIndex({
              index: targetIdx,
              animated: true,
              viewPosition: 0.1,
            });
          }
        }, 300);

        const fadeTimer = setTimeout(() => {
          setHighlightId(null);
        }, 6000);

        return () => {
          clearTimeout(timer);
          clearTimeout(fadeTimer);
        };
      }
    }
  }, [targetHadith, filteredHadiths.length, viewMode]);

  const handleCopyHadith = async (hadith: HadithItem) => {
    const arText = cleanHadithIsnad(hadith.arabic, "arabic", hadith.narrator, showIsnad);
    const urText = cleanHadithIsnad(hadith.urdu, "urdu", hadith.narrator, showIsnad);
    const enText = cleanHadithIsnad(hadith.english, "english", hadith.narrator, showIsnad);

    const parts = [
      `【${colId.toUpperCase()} — Hadith #${hadith.hadithNumber}】`,
      hadith.grade ? `[Grade: ${hadith.grade}]` : "",
      !showIsnad ? `[سند مخفی · راوی صحابی: ${hadith.narrator || "صحابی رسول ﷺ"}]` : "",
      arText ? `\n${arText}` : "",
      urText ? `\nاردو ترجمہ:\n${urText}` : "",
      enText ? `\nEnglish Translation:\n${enText}` : "",
      hadith.narrator ? `\n— Narrated by: ${hadith.narrator}` : "",
      hadith.reference ? `\n— Reference: ${hadith.reference}` : "",
      `\n(منقول از: المفتاح - Al-Miftah Islamic Research)`,
    ].filter(Boolean);

    await Clipboard.setStringAsync(parts.join("\n"));
    Alert.alert("📋 " + t.copy, t.copied);
  };

  const handleShareHadith = async (hadith: HadithItem) => {
    const arText = cleanHadithIsnad(hadith.arabic, "arabic", hadith.narrator, showIsnad);
    const urText = cleanHadithIsnad(hadith.urdu, "urdu", hadith.narrator, showIsnad);
    const enText = cleanHadithIsnad(hadith.english, "english", hadith.narrator, showIsnad);

    const parts = [
      `【${colId.toUpperCase()} — Hadith #${hadith.hadithNumber}】`,
      hadith.grade ? `[Grade: ${hadith.grade}]` : "",
      !showIsnad ? `[سند مخفی · راوی صحابی: ${hadith.narrator || "صحابی رسول ﷺ"}]` : "",
      arText ? `\n${arText}` : "",
      urText ? `\nاردو ترجمہ:\n${urText}` : "",
      enText ? `\nEnglish:\n${enText}` : "",
      hadith.narrator ? `\n— Narrated by: ${hadith.narrator}` : "",
      hadith.reference ? `\n— Reference: ${hadith.reference}` : "",
      `\n— Al-Miftah (المفتاح)`,
    ].filter(Boolean);

    await Share.share({ message: parts.join("\n") });
  };

  const goToCard = (index: number) => {
    if (index >= 0 && index < filteredHadiths.length) {
      setActiveIndex(index);
      horizontalFlatListRef.current?.scrollToIndex({ index, animated: true });
    }
  };

  const s = makeStyles(colors);

  const filterTabs: { id: GradeFilter; label: string; count: number }[] = [
    { id: "all", label: t.all, count: counts.all },
    { id: "sahih", label: t.sahih, count: counts.sahih },
    { id: "hasan", label: t.hasan, count: counts.hasan },
    { id: "daif", label: t.daif, count: counts.daif },
    { id: "muttafaq", label: t.muttafaq, count: counts.muttafaq },
  ];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* ── Top Header ── */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 14), borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]} numberOfLines={1}>
            {colId.toUpperCase()} · {t.chapter} {bNum}
          </Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            {filteredHadiths.length} {t.hadith}
          </Text>
        </View>

        {/* View Mode Toggle Button */}
        <View style={[s.modeToggleContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[s.modeBtn, viewMode === "vertical" && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode("vertical")}
          >
            <Feather name="list" size={16} color={viewMode === "vertical" ? "#FFF" : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modeBtn, viewMode === "horizontal" && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode("horizontal")}
          >
            <MaterialCommunityIcons name="view-carousel-outline" size={18} color={viewMode === "horizontal" ? "#FFF" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter Pills & Isnad Bar ── */}
      <View style={[s.filterBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8, alignItems: "center" }}>
          {/* Isnad (سند) Visibility Toggle Chip */}
          <TouchableOpacity
            style={[
              s.isnadPill,
              {
                backgroundColor: showIsnad ? colors.primary + "18" : colors.gold + "18",
                borderColor: showIsnad ? colors.primary : colors.gold,
              },
            ]}
            onPress={() => setShowIsnad(prev => !prev)}
          >
            <MaterialCommunityIcons
              name={showIsnad ? "format-list-checks" : "card-text-outline"}
              size={15}
              color={showIsnad ? colors.primary : colors.gold}
            />
            <Text style={[s.isnadPillText, { color: showIsnad ? colors.primary : colors.gold }]}>
              {showIsnad ? (isUrdu ? "سند سمیت" : "With Isnad") : (isUrdu ? "بغیر سند (راوی محفوظ)" : "Without Isnad")}
            </Text>
          </TouchableOpacity>

          <View style={[s.filterDivider, { backgroundColor: colors.border }]} />

          {filterTabs.map(tab => {
            const isSelected = gradeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  s.filterPill,
                  { borderColor: isSelected ? colors.primary : colors.border },
                  isSelected && { backgroundColor: colors.primary + "18" },
                ]}
                onPress={() => {
                  setGradeFilter(tab.id);
                  setActiveIndex(0);
                }}
              >
                <Text style={[s.filterPillText, { color: isSelected ? colors.primary : colors.mutedForeground }]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[s.countBadge, { backgroundColor: isSelected ? colors.primary : colors.border }]}>
                    <Text style={[s.countBadgeText, { color: isSelected ? "#FFF" : colors.foreground }]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={s.centerBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Loading hadiths…</Text>
        </View>
      ) : filteredHadiths.length === 0 ? (
        <View style={s.centerBox}>
          <MaterialCommunityIcons name="book-search-outline" size={48} color={colors.mutedForeground} />
          <Text style={[s.emptyText, { color: colors.foreground, marginTop: 12 }]}>No hadiths found</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
            Try selecting "All" from the filter bar above
          </Text>
        </View>
      ) : viewMode === "vertical" ? (
        /* ── Mode 1: Vertical Stream ── */
        <FlatList
          ref={flatListRef}
          data={filteredHadiths}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: insets.bottom + 60 }}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={info => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 120);
          }}
          renderItem={({ item, index }) => (
            <HadithCard
              item={item}
              index={index}
              total={filteredHadiths.length}
              colors={colors}
              onBookmark={() => handleBookmark(item)}
              onCopy={() => handleCopyHadith(item)}
              onShare={() => handleShareHadith(item)}
              t={t}
              showIsnad={showIsnad}
              isHighlighted={item.id === highlightId || String(item.hadithNumber) === String(targetHadith)}
            />
          )}
        />
      ) : (
        /* ── Mode 2: Horizontal Card-by-Card (Fluid Swiping & Buttons) ── */
        <View style={{ flex: 1 }}>
          <FlatList
            ref={horizontalFlatListRef}
            data={filteredHadiths}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={screenWidth}
            snapToAlignment="center"
            decelerationRate="fast"
            disableIntervalMomentum={true}
            nestedScrollEnabled={true}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onMomentumScrollEnd={ev => {
              const newIndex = Math.round(ev.nativeEvent.contentOffset.x / screenWidth);
              if (newIndex >= 0 && newIndex < filteredHadiths.length) {
                setActiveIndex(newIndex);
              }
            }}
            onScrollToIndexFailed={info => {
              setTimeout(() => {
                horizontalFlatListRef.current?.scrollToIndex({ index: info.index, animated: false });
              }, 120);
            }}
            renderItem={({ item, index }) => (
              <View style={{ width: screenWidth, paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 80 }}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ paddingBottom: 24 }}
                >
                  <HadithCard
                    item={item}
                    index={index}
                    total={filteredHadiths.length}
                    colors={colors}
                    onBookmark={() => handleBookmark(item)}
                    onCopy={() => handleCopyHadith(item)}
                    onShare={() => handleShareHadith(item)}
                    t={t}
                    isFullCard
                    showIsnad={showIsnad}
                    isHighlighted={item.id === highlightId || String(item.hadithNumber) === String(targetHadith)}
                  />
                </ScrollView>
              </View>
            )}
          />

          {/* Bottom Card Navigation Bar for Horizontal Mode */}
          <View style={[s.horizontalNav, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={[s.navButton, activeIndex <= 0 && { opacity: 0.3 }]}
              onPress={() => goToCard(activeIndex - 1)}
              disabled={activeIndex <= 0}
            >
              <Feather name="chevron-left" size={20} color={colors.foreground} />
              <Text style={[s.navButtonText, { color: colors.foreground }]}>{t.previous}</Text>
            </TouchableOpacity>

            <View style={s.counterBadge}>
              <Text style={[s.counterText, { color: colors.primary }]}>
                {activeIndex + 1} {t.cardOf} {filteredHadiths.length}
              </Text>
            </View>

            <TouchableOpacity
              style={[s.navButton, activeIndex >= filteredHadiths.length - 1 && { opacity: 0.3 }]}
              onPress={() => goToCard(activeIndex + 1)}
              disabled={activeIndex >= filteredHadiths.length - 1}
            >
              <Text style={[s.navButtonText, { color: colors.foreground }]}>{t.next}</Text>
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function HadithCard({
  item,
  index,
  total,
  colors,
  onBookmark,
  onCopy,
  onShare,
  t,
  isFullCard,
  showIsnad = true,
  isHighlighted = false,
}: {
  item: HadithItem;
  index: number;
  total: number;
  colors: any;
  onBookmark: () => void;
  onCopy: () => void;
  onShare: () => void;
  t: any;
  isFullCard?: boolean;
  showIsnad?: boolean;
  isHighlighted?: boolean;
}) {
  const gColor = gradeColor(item.grade);

  const cleanArabic = cleanHadithIsnad(item.arabic, "arabic", item.narrator, showIsnad);
  const cleanUrdu = cleanHadithIsnad(item.urdu, "urdu", item.narrator, showIsnad);
  const cleanEnglish = cleanHadithIsnad(item.english, "english", item.narrator, showIsnad);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isHighlighted ? colors.gold + "12" : colors.card,
          borderColor: isHighlighted ? colors.gold : colors.border,
          borderWidth: isHighlighted ? 2 : 1,
        },
        isFullCard && styles.fullCard,
      ]}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.hadithNumBadge, { backgroundColor: isHighlighted ? colors.gold + "28" : colors.primary + "18" }]}>
            <Text style={[styles.hadithNum, { color: isHighlighted ? colors.gold : colors.primary }]}>
              #{item.hadithNumber}
            </Text>
          </View>
          <Text style={[styles.cardIndex, { color: colors.mutedForeground }]}>
            {index + 1} / {total}
          </Text>
          {isHighlighted && (
            <View style={[styles.targetBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold }]}>
              <Text style={[styles.targetBadgeText, { color: colors.gold }]}>مطلوبہ حدیث</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          {item.grade && (
            <View style={[styles.gradeBadge, { backgroundColor: gColor + "18", borderColor: gColor + "40" }]}>
              <Text style={[styles.gradeText, { color: gColor }]}>{item.grade}</Text>
            </View>
          )}

          {/* 1-Tap Copy Button */}
          <TouchableOpacity onPress={onCopy} style={[styles.actionIconBtn, { backgroundColor: colors.card }]}>
            <Feather name="copy" size={17} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* 1-Tap Share Button */}
          <TouchableOpacity onPress={onShare} style={[styles.actionIconBtn, { backgroundColor: colors.card }]}>
            <Feather name="share-2" size={17} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Bookmark Button */}
          <TouchableOpacity onPress={onBookmark} style={[styles.actionIconBtn, { backgroundColor: colors.card }]}>
            <Feather name="bookmark" size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Without Isnad Info Tag */}
      {!showIsnad && (
        <View style={[styles.isnadNotice, { backgroundColor: colors.gold + "10", borderColor: colors.gold + "30" }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={13} color={colors.gold} />
          <Text style={[styles.isnadNoticeText, { color: colors.gold }]}>
            سند مخفی ہے · آغاز راوی صحابی رسول ﷺ: {item.narrator || "صحابیِ رسول"}
          </Text>
        </View>
      )}

      {/* Arabic Text */}
      {cleanArabic ? (
        <Text style={[styles.arabic, { color: colors.foreground }]}>{cleanArabic}</Text>
      ) : null}

      {/* Urdu Translation */}
      {cleanUrdu ? (
        <View style={[styles.transBox, { backgroundColor: colors.gold + "08", borderRightColor: colors.gold }]}>
          <Text style={[styles.transLabel, { color: colors.gold }]}>اردو ترجمہ:</Text>
          <Text style={[styles.urdu, { color: colors.foreground }]}>{cleanUrdu}</Text>
        </View>
      ) : null}

      {/* English Translation */}
      {cleanEnglish ? (
        <View style={[styles.transBox, { backgroundColor: colors.primary + "06", borderLeftColor: colors.primary }]}>
          <Text style={[styles.transLabelEn, { color: colors.primary }]}>English Translation:</Text>
          <Text style={[styles.english, { color: colors.mutedForeground }]}>{cleanEnglish}</Text>
        </View>
      ) : null}

      {/* Meta Footer */}
      {(item.narrator || item.reference) && (
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          {item.narrator && (
            <Text style={[styles.narrator, { color: colors.mutedForeground }]}>
              <Text style={{ fontWeight: "600" }}>{t.narrator}: </Text>{item.narrator}
            </Text>
          )}
          {item.reference && (
            <Text style={[styles.reference, { color: colors.mutedForeground }]}>
              <Text style={{ fontWeight: "600" }}>{t.reference}: </Text>{item.reference}
            </Text>
          )}
        </View>
      )}

      {/* Quick Action Bar at Card Bottom */}
      <View style={[styles.bottomActionBar, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.bottomActionBtn} onPress={onCopy}>
          <Feather name="copy" size={14} color={colors.primary} />
          <Text style={[styles.bottomActionText, { color: colors.primary }]}>{t.copy}</Text>
        </TouchableOpacity>
        <View style={[styles.bottomDivider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.bottomActionBtn} onPress={onShare}>
          <Feather name="share-2" size={14} color={colors.primary} />
          <Text style={[styles.bottomActionText, { color: colors.primary }]}>{t.share}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function gradeColor(grade?: string | null): string {
  if (!grade) return "#6B7280";
  const g = grade.toLowerCase();
  if (g.includes("sahih") || g.includes("صحيح")) return "#10B981";
  if (g.includes("hasan") || g.includes("حسن")) return "#F59E0B";
  if (g.includes("da'if") || g.includes("daif") || g.includes("ضعيف")) return "#EF4444";
  if (g.includes("muttafaq") || g.includes("متفق")) return "#8B5CF6";
  return "#0284C7";
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1 },
  fullCard: { minHeight: 460 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  hadithNumBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  hadithNum: { fontSize: 13, fontFamily: "Inter_700Bold" },
  cardIndex: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionIconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  gradeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  gradeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  arabic: { fontSize: 20, lineHeight: 42, textAlign: "right", marginBottom: 14, fontFamily: "Amiri_400Regular" },
  transBox: { padding: 12, borderRadius: 10, marginBottom: 12 },
  transLabel: { fontSize: 12, fontFamily: "NotoNastaliqUrdu_700Bold", textAlign: "right", marginBottom: 4 },
  transLabelEn: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  urdu: { fontSize: 15, lineHeight: 32, fontFamily: "NotoNastaliqUrdu_400Regular", textAlign: "right" },
  english: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
  cardFooter: { paddingTop: 10, marginTop: 4, borderTopWidth: 1, gap: 4 },
  targetBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  targetBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  isnadNotice: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  isnadNoticeText: { fontSize: 11, fontFamily: "NotoNastaliqUrdu_400Regular" },
  narrator: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  reference: { fontSize: 11, fontFamily: "Inter_400Regular" },
  bottomActionBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingTop: 12, marginTop: 12, borderTopWidth: 1 },
  bottomActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  bottomActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  bottomDivider: { width: 1, height: 16 },
});

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
    backBtn: { padding: 4 },
    headerCenter: { flex: 1 },
    title: { fontSize: 16, fontFamily: "Inter_700Bold" },
    subtitle: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
    modeToggleContainer: { flexDirection: "row", borderRadius: 10, borderWidth: 1, overflow: "hidden", padding: 2 },
    modeBtn: { width: 34, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },

    filterBar: { paddingVertical: 10, borderBottomWidth: 1 },
    isnadPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    isnadPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    filterDivider: { width: 1, height: 20, marginHorizontal: 2 },
    filterPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    filterPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    countBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
    countBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },

    centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
    loadingText: { marginTop: 12, fontSize: 13, fontFamily: "Inter_400Regular" },
    emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },

    horizontalNav: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
    navButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 12 },
    navButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    counterBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.primary + "18" },
    counterText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  });
}
