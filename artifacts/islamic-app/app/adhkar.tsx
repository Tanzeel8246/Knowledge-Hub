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

interface Dhikr {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;
  virtue: string;
}

const MORNING_ADHKAR: Dhikr[] = [
  {
    id: "m1",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ",
    transliteration: "Asbahna wa asbahal-mulku lillah, walhamdu lillah",
    translation: "We have reached the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah.",
    count: 1,
    virtue: "Beginning the day with Allah's praise",
  },
  {
    id: "m2",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namootu wa ilaykan-nushoor",
    translation: "O Allah, by You we enter the morning, by You we enter the evening, by You we live and by You we die, and to You is the resurrection.",
    count: 1,
    virtue: "Complete reliance upon Allah",
  },
  {
    id: "m3",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    transliteration: "Subhanallahi wa bihamdihi",
    translation: "Glory be to Allah and His is the praise.",
    count: 100,
    virtue: "Sins are forgiven even if they are as much as the foam of the sea (Bukhari)",
  },
  {
    id: "m4",
    arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ — اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
    transliteration: "A'udhu billahi minash-shaytan-ir-rajeem — Allahu la ilaha illa huwal hayyul qayyoom",
    translation: "Ayat al-Kursi: Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence…",
    count: 1,
    virtue: "Whoever recites this in the morning will be protected until evening (Nasa'i)",
  },
  {
    id: "m5",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillahilladhi la yadurru ma'asmihi shay'un fil-ardi wala fis-sama'i wahuwa as-Samee'ul-'Aleem",
    translation: "In the Name of Allah, with Whose Name nothing on earth or in heaven can cause harm, and He is the All-Hearing, All-Knowing.",
    count: 3,
    virtue: "Nothing will harm him (Abu Dawud — Sahih)",
  },
  {
    id: "m6",
    arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا",
    transliteration: "Raditu billahi rabba, wa bil-islami deenan, wa bi-Muhammadin nabiyyan",
    translation: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet.",
    count: 3,
    virtue: "It is his right upon Allah to please him on the Day of Judgment (Abu Dawud)",
  },
  {
    id: "m7",
    arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
    transliteration: "Ya Hayyu Ya Qayyoomu bi rahmatika astagheethu, aslih li sha'ni kullahu wa la takilni ila nafsi tarfata 'ayn",
    translation: "O Ever-Living, O Self-Subsisting — by Your mercy I seek help. Rectify all my affairs and do not leave me to myself, even for the blink of an eye.",
    count: 1,
    virtue: "Reported by al-Hakim as Sahih",
  },
  {
    id: "m8",
    arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullaha wa atubu ilayh",
    translation: "I seek the forgiveness of Allah and repent to Him.",
    count: 100,
    virtue: "The Prophet ﷺ sought forgiveness 100 times a day (Muslim)",
  },
];

const EVENING_ADHKAR: Dhikr[] = [
  {
    id: "e1",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ",
    transliteration: "Amsayna wa amsal-mulku lillah, walhamdu lillah",
    translation: "We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah.",
    count: 1,
    virtue: "Beginning the evening with Allah's praise",
  },
  {
    id: "e2",
    arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
    transliteration: "Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namootu wa ilaykal-maseer",
    translation: "O Allah, by You we enter the evening, by You we enter the morning, by You we live and by You we die, and to You is the final return.",
    count: 1,
    virtue: "Complete reliance upon Allah in the evening",
  },
  {
    id: "e3",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    transliteration: "Subhanallahi wa bihamdihi",
    translation: "Glory be to Allah and His is the praise.",
    count: 100,
    virtue: "Sins are forgiven even if they are as the foam of the sea (Bukhari)",
  },
  {
    id: "e4",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ",
    transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduka",
    translation: "O Allah, You are my Lord, there is no god but You. You created me and I am Your servant.",
    count: 1,
    virtue: "Sayyid al-Istighfar — the master supplication for forgiveness (Bukhari)",
  },
  {
    id: "e5",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bikalimatillahit-tammati min sharri ma khalaq",
    translation: "I seek refuge in the perfect words of Allah from the evil of that which He created.",
    count: 3,
    virtue: "No harm will befall him that evening (Muslim)",
  },
  {
    id: "e6",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amootu wa ahya",
    translation: "In Your name, O Allah, I die and I live.",
    count: 1,
    virtue: "Recited before sleeping (Bukhari)",
  },
  {
    id: "e7",
    arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي",
    transliteration: "Allahumma 'afini fi badani, Allahumma 'afini fi sam'i, Allahumma 'afini fi basari",
    translation: "O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight.",
    count: 3,
    virtue: "Narrated by Abu Dawud — Sahih",
  },
  {
    id: "e8",
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullaha al-'Azeema alladhi la ilaha illa huwal Hayyul Qayyoomu wa atubu ilayh",
    translation: "I seek forgiveness from Allah, the Magnificent, besides Whom there is none worthy of worship except He, the Ever-Living, the Self-Sustaining, and I repent to Him.",
    count: 3,
    virtue: "Sins are forgiven even if they were like the foam of the sea (Abu Dawud)",
  },
];

type AdhkarType = "morning" | "evening";

export default function AdhkarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<AdhkarType>("morning");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const currentAdhkar = type === "morning" ? MORNING_ADHKAR : EVENING_ADHKAR;
  const completedCount = currentAdhkar.filter(d => (counts[d.id] ?? 0) >= d.count).length;
  const allDone = completedCount === currentAdhkar.length;

  const tap = useCallback((dhikr: Dhikr) => {
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
          <Text style={[s.title, { color: colors.foreground }]}>Adhkar</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>الأذكار</Text>
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
              {t === "morning" ? "🌅 Morning" : "🌙 Evening"}
            </Text>
            {t === suggestedType && (
              <View style={[s.nowBadge, { backgroundColor: type === t ? "#FFFFFF30" : colors.primary + "20" }]}>
                <Text style={[s.nowText, { color: type === t ? "#FFF" : colors.primary }]}>Now</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress */}
      <View style={[s.progressRow, { backgroundColor: allDone ? "#16A34A15" : colors.card, borderColor: allDone ? "#16A34A40" : colors.border }]}>
        <View>
          <Text style={[s.progressTitle, { color: allDone ? "#16A34A" : colors.foreground }]}>
            {allDone ? "Adhkar Complete! 🎉" : `${completedCount} of ${currentAdhkar.length} complete`}
          </Text>
          <Text style={[s.progressSub, { color: colors.mutedForeground }]}>
            {type === "morning" ? "صباح الخير — Good Morning" : "مساء الخير — Good Evening"}
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
                    <Text style={s.doneText}>Complete</Text>
                  </View>
                )}
                {dhikr.count === 1 && !done && (
                  <View style={[s.tapBadge, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[s.tapText, { color: colors.primary }]}>Tap to mark done</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Expand/collapse */}
              <TouchableOpacity style={[s.expandRow, { borderTopColor: colors.border }]} onPress={() => setExpanded(isExpanded ? null : dhikr.id)}>
                <Text style={[s.transliteration, { color: colors.mutedForeground }]} numberOfLines={isExpanded ? undefined : 1}>
                  {dhikr.transliteration}
                </Text>
                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
              </TouchableOpacity>

              {isExpanded && (
                <View style={[s.expandedBody, { borderTopColor: colors.border }]}>
                  <Text style={[s.translation, { color: colors.foreground }]}>{dhikr.translation}</Text>
                  <View style={[s.virtueLine, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                    <Feather name="star" size={12} color={colors.primary} />
                    <Text style={[s.virtueText, { color: colors.primary }]}>{dhikr.virtue}</Text>
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

    expandRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, gap: 8 },
    transliteration: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },

    expandedBody: { paddingHorizontal: 16, paddingBottom: 14, borderTopWidth: 1, paddingTop: 12 },
    translation: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", marginBottom: 10 },
    virtueLine: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
    virtueText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  });
}
