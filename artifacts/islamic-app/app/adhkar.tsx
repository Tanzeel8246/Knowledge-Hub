import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

import { MORNING_ADHKAR_DATA, EVENING_ADHKAR_DATA, DhikrItem } from "@/constants/adhkarData";

type AdhkarType = "morning" | "evening";

export default function AdhkarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<AdhkarType>("morning");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const currentAdhkar = type === "morning" ? MORNING_ADHKAR_DATA : EVENING_ADHKAR_DATA;
  const completedCount = currentAdhkar.filter(d => (counts[d.id] ?? 0) >= d.count).length;
  const allDone = completedCount === currentAdhkar.length;

  const tap = useCallback((dhikr: DhikrItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCounts(prev => {
      const curr = prev[dhikr.id] ?? 0;
      if (curr >= dhikr.count) return prev;
      return { ...prev, [dhikr.id]: curr + 1 };
    });
  }, []);

  const reset = () => {
    const cleared: Record<string, number> = {};
    currentAdhkar.forEach(d => { cleared[d.id] = 0; });
    setCounts(cleared);
  };

  const s = makeStyles(colors);

  const hour = new Date().getHours();
  const suggestedType: AdhkarType = hour >= 4 && hour < 12 ? "morning" : "evening";

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Adhkar (مسنون اذکار)</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>الأذكار الصباحية والمسائية</Text>
        </View>
        <TouchableOpacity onPress={reset} style={[s.resetBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="refresh-ccw" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Type Selector */}
      <View style={[s.typeSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(["morning", "evening"] as AdhkarType[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.typeBtn, { backgroundColor: type === t ? colors.primary : "transparent" }]}
            onPress={() => { setType(t); reset(); }}
          >
            <Text style={[s.typeBtnText, { color: type === t ? "#FFF" : colors.mutedForeground }]}>
              {t === "morning" ? "🌅 صبح کے اذکار (Morning)" : "🌙 شام کے اذکار (Evening)"}
            </Text>
            {t === suggestedType && (
              <View style={[s.nowBadge, { backgroundColor: type === t ? "#FFFFFF30" : colors.primary + "20" }]}>
                <Text style={[s.nowText, { color: type === t ? "#FFF" : colors.primary }]}>وقت ہے</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress */}
      <View style={[s.progressRow, { backgroundColor: allDone ? "#16A34A15" : colors.card, borderColor: allDone ? "#16A34A40" : colors.border }]}>
        <View>
          <Text style={[s.progressTitle, { color: allDone ? "#16A34A" : colors.foreground }]}>
            {allDone ? "ماشاء اللہ! اذکار مکمل ہو گئے 🎉" : `${completedCount} / ${currentAdhkar.length} مکمل ہوئے`}
          </Text>
          <Text style={[s.progressSub, { color: colors.mutedForeground }]}>
            {type === "morning" ? "صبح کا وقت برکت اور حفاظت کا ذریعہ ہے" : "شام اور رات کا وقت اللہ کی پناہ کا ذریعہ ہے"}
          </Text>
        </View>
        <View style={s.progressCircle}>
          <Text style={[s.progressPct, { color: allDone ? "#16A34A" : colors.primary }]}>
            {Math.round((completedCount / currentAdhkar.length) * 100)}%
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {currentAdhkar.map(dhikr => {
          const curr = counts[dhikr.id] ?? 0;
          const done = curr >= dhikr.count;
          const pct = Math.min(curr / dhikr.count, 1);
          const isExpanded = expanded === dhikr.id;

          return (
            <View key={dhikr.id} style={[s.card, {
              backgroundColor: done ? "#16A34A10" : colors.card,
              borderColor: done ? "#16A34A40" : colors.border,
              borderWidth: done ? 1.5 : 1,
            }]}>
              {/* Arabic + tap zone */}
              <TouchableOpacity onPress={() => tap(dhikr)} style={s.tapZone} activeOpacity={0.8}>
                <Text style={[s.arabic, { color: done ? "#16A34A" : colors.foreground }]}>{dhikr.arabic}</Text>
                {dhikr.count > 1 && (
                  <View style={s.countRow}>
                    <View style={[s.progressBar, { backgroundColor: colors.border }]}>
                      <View style={[s.progressFill, { width: `${pct * 100}%` as any, backgroundColor: done ? "#16A34A" : colors.primary }]} />
                    </View>
                    <Text style={[s.countText, { color: done ? "#16A34A" : colors.primary }]}>{curr}/{dhikr.count}</Text>
                  </View>
                )}
                {dhikr.count === 1 && done && (
                  <View style={[s.doneBadge, { backgroundColor: "#16A34A20" }]}>
                    <Feather name="check" size={14} color="#16A34A" />
                    <Text style={s.doneText}>مکمل</Text>
                  </View>
                )}
                {dhikr.count === 1 && !done && (
                  <View style={[s.tapBadge, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[s.tapText, { color: colors.primary }]}>مکمل کرنے کے لیے ٹیپ کریں</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Urdu translation always visible */}
              <View style={[s.urduBox, { borderTopColor: colors.border }]}>
                <Text style={[s.urduTranslation, { color: colors.foreground }]}>
                  {dhikr.translationUr}
                </Text>
              </View>

              {/* Expand/collapse for English & Virtues */}
              <TouchableOpacity style={[s.expandRow, { borderTopColor: colors.border }]} onPress={() => setExpanded(isExpanded ? null : dhikr.id)}>
                <Text style={[s.transliteration, { color: colors.mutedForeground }]} numberOfLines={isExpanded ? undefined : 1}>
                  {dhikr.transliteration}
                </Text>
                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
              </TouchableOpacity>

              {isExpanded && (
                <View style={[s.expandedBody, { borderTopColor: colors.border }]}>
                  <Text style={[s.translation, { color: colors.mutedForeground }]}>{dhikr.translationEn}</Text>
                  <View style={[s.virtueLine, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                    <Feather name="star" size={12} color={colors.primary} />
                    <Text style={[s.virtueText, { color: colors.primary }]}>{dhikr.virtueUr}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 20, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 13 },
    resetBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },

    typeSelector: { flexDirection: "row", marginHorizontal: 16, borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 12 },
    typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, paddingVertical: 10 },
    typeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    nowBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    nowText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

    progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 },
    progressTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
    progressSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
    progressCircle: {},
    progressPct: { fontSize: 22, fontFamily: "Inter_700Bold" },

    content: { paddingHorizontal: 16, paddingTop: 4 },
    card: { borderRadius: 14, marginBottom: 12, overflow: "hidden" },
    tapZone: { padding: 16 },
    arabic: { fontSize: 20, lineHeight: 36, textAlign: "right", marginBottom: 10, fontFamily: "Inter_400Regular" },
    countRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
    progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: 6, borderRadius: 3 },
    countText: { fontSize: 13, fontFamily: "Inter_700Bold", width: 50, textAlign: "right" },
    doneBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-end" },
    doneText: { color: "#16A34A", fontFamily: "Inter_600SemiBold", fontSize: 12 },
    tapBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-end" },
    tapText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

    urduBox: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
    urduTranslation: { fontSize: 14, lineHeight: 24, textAlign: "right", fontFamily: "Inter_500Medium" },

    expandRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, gap: 8 },
    transliteration: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },

    expandedBody: { paddingHorizontal: 16, paddingBottom: 14, borderTopWidth: 1, paddingTop: 12 },
    translation: { fontSize: 13, lineHeight: 20, fontFamily: "Inter_400Regular", marginBottom: 10 },
    virtueLine: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
    virtueText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  });
}
