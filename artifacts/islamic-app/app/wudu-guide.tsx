import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface WuduStep {
  id: number;
  title: string;
  arabic?: string;
  transliteration?: string;
  description: string;
  count?: number;
  isSunnah?: boolean;
  tip?: string;
}

interface NajasahItem {
  name: string;
  description: string;
}

interface WuduBreaker {
  text: string;
  note?: string;
}

const WUDU_STEPS: WuduStep[] = [
  { id: 1, title: "Make Intention (Niyyah)", arabic: "نِيَّة", description: "Make the intention in your heart to perform Wudu for the sake of Allah. The intention does not need to be spoken aloud.", tip: "Niyyah is a condition (shart) of Wudu — Wudu without intention is invalid according to the majority of scholars." },
  { id: 2, title: "Say Bismillah", arabic: "بِسْمِ اللَّهِ", transliteration: "Bismillah", description: "Say 'Bismillah' before starting Wudu. It is Sunnah and some scholars consider it obligatory.", tip: "The Prophet ﷺ said: 'There is no Wudu for one who does not mention Allah's name.' (Abu Dawud)" },
  { id: 3, title: "Wash Both Hands", description: "Wash both hands up to and including the wrists, three times. Start with the right hand.", count: 3, isSunnah: true, tip: "Run your fingers through each other (khilal) to ensure water reaches between the fingers." },
  { id: 4, title: "Rinse the Mouth (Madmadah)", arabic: "مَضْمَضَة", description: "Take water into the mouth and swirl it around, then spit it out. Repeat three times.", count: 3, tip: "The Prophet ﷺ used a miswak before rinsing — this is highly recommended." },
  { id: 5, title: "Sniff Water into Nose (Istinshaq)", arabic: "اسْتِنْشَاق", description: "Sniff water into the nostrils using the right hand, then blow it out with the left hand. Repeat three times.", count: 3, tip: "Perform this gently while fasting to avoid water reaching the throat." },
  { id: 6, title: "Wash the Face", arabic: "غَسْل الْوَجْه", description: "Wash the entire face three times — from the hairline to the chin, and from ear to ear. Ensure no part of the face remains dry.", count: 3, tip: "Men with beards should run wet fingers through the beard (khilal al-lihyah) to reach the skin underneath." },
  { id: 7, title: "Wash Both Arms to Elbows", arabic: "غَسْل الْيَدَيْن", description: "Wash the right arm from the fingertips to and including the elbow three times. Then wash the left arm the same way.", count: 3, tip: "Right arm before left is Sunnah. Ensure the elbow is fully included." },
  { id: 8, title: "Wipe the Head (Mash)", arabic: "مَسْح الرَّأْس", description: "Wet both hands and wipe the entire head from the front hairline to the back of the neck, then bring your hands back to the front. Do this once.", count: 1, tip: "This is one of the Fara'id (obligatory acts) of Wudu. Wiping the ears is Sunnah — use thumbs for outer ears and index fingers for inner ears." },
  { id: 9, title: "Wipe Both Ears", arabic: "مَسْح الْأُذُنَيْن", description: "Insert wet index fingers into the ear canals and use wet thumbs to wipe the outside of the ears. Do this once with the same water used for the head.", count: 1, isSunnah: true },
  { id: 10, title: "Wash Both Feet to Ankles", arabic: "غَسْل الْقَدَمَيْن", description: "Wash the right foot including the ankle three times, running fingers between the toes (starting from the little toe). Then wash the left foot the same way.", count: 3, tip: "The Prophet ﷺ said: 'Woe to the heels from the Fire!' — ensure heels are fully washed." },
  { id: 11, title: "Say the Shahada Dua", arabic: "دُعَاء بَعْد الْوُضُوء", transliteration: "Ashhadu an la ilaha illallah wahdahu la sharika lah, wa-ashhadu anna Muhammadan abduhu wa-rasuluh", description: "After completing Wudu, recite: أَشْهَدُ أَن لَّا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ", isSunnah: true, tip: "The Prophet ﷺ said: 'Whoever performs Wudu well and then says [this], all 8 gates of Paradise will be opened for them.' (Muslim)" },
];

const FARA_ID = ["Intention (Niyyah)", "Washing the face", "Washing both arms to elbows", "Wiping the head (Mash)", "Washing both feet to ankles", "Order (Tartib)", "Continuity (Muwalat)"];

const SUNNAN = ["Saying Bismillah", "Washing both hands at start", "Rinsing the mouth", "Sniffing water into nose", "Wiping both ears", "Doing each act 3 times", "Starting with right side", "Wiping the whole head", "Using miswak", "Reciting the dua after Wudu"];

const BREAKERS: WuduBreaker[] = [
  { text: "Anything that exits from the private parts (urine, stool, gas, etc.)", note: "This is the most common Wudu-breaker." },
  { text: "Deep sleep that removes one's awareness", note: "Light dozing while sitting upright may not break Wudu." },
  { text: "Loss of reason (intoxication, fainting, insanity)", note: "These invalidate Wudu even if brief." },
  { text: "Touching the private parts directly (without barrier) — Shafi'i & Hanbali view", note: "Hanafi view: touching private parts does not break Wudu." },
  { text: "Eating camel meat — Hanbali view only", note: "Other madhabs do not consider this a Wudu-breaker." },
  { text: "Bleeding profusely — Hanafi view only", note: "Shafi'i & Maliki: bleeding does not break Wudu." },
];

const GHUSL_SITUATIONS = [
  "After sexual intercourse",
  "After ejaculation (wet dream or otherwise)",
  "After menstrual cycle ends",
  "After postnatal bleeding (nifas) ends",
  "Upon accepting Islam (according to most scholars)",
  "Before Jumu'ah (Friday prayer) — Sunnah, not obligatory",
];

type TabType = "steps" | "rules" | "breakers" | "ghusl";

export default function WuduGuideScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabType>("steps");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const toggleStep = (id: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const resetWudu = () => {
    setChecked(new Set());
    setCurrentStep(0);
    setIsGuidedMode(false);
  };

  const s = makeStyles(colors);

  // Guided mode
  if (isGuidedMode) {
    const step = WUDU_STEPS[currentStep];
    const isLast = currentStep === WUDU_STEPS.length - 1;
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setIsGuidedMode(false)}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>Guided Wudu</Text>
          </View>
          <Text style={[s.stepCounter, { color: colors.primary }]}>{currentStep + 1}/{WUDU_STEPS.length}</Text>
        </View>

        {/* Progress bar */}
        <View style={[s.guidedProgress, { backgroundColor: colors.border }]}>
          <View style={[s.guidedProgressFill, { width: `${((currentStep + 1) / WUDU_STEPS.length) * 100}%` as any, backgroundColor: colors.primary }]} />
        </View>

        <ScrollView contentContainerStyle={[s.guidedContent, { paddingBottom: insets.bottom + 120 }]}>
          <View style={[s.guidedHero, { backgroundColor: colors.navy }]}>
            <View style={[s.guidedNumBadge, { backgroundColor: "#FFFFFF20" }]}>
              <Text style={s.guidedNum}>{currentStep + 1}</Text>
            </View>
            {step.isSunnah && (
              <View style={[s.sunnahBadge, { backgroundColor: "#D9770615" }]}>
                <Text style={[s.sunnahText, { color: "#D97706" }]}>Sunnah</Text>
              </View>
            )}
            <Text style={s.guidedTitle}>{step.title}</Text>
            {step.arabic && <Text style={[s.guidedArabic, { color: colors.gold }]}>{step.arabic}</Text>}
            {step.count && <Text style={[s.guidedCount, { color: "#FFFFFF70" }]}>× {step.count} times</Text>}
          </View>

          <View style={[s.guidedDescCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.guidedDesc, { color: colors.foreground }]}>{step.description}</Text>
          </View>

          {step.tip && (
            <View style={[s.tipCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Feather name="info" size={15} color={colors.primary} />
              <Text style={[s.tipText, { color: colors.foreground }]}>{step.tip}</Text>
            </View>
          )}

          {step.transliteration && (
            <View style={[s.translitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.translitLabel, { color: colors.mutedForeground }]}>TRANSLITERATION</Text>
              <Text style={[s.translitText, { color: colors.primary }]}>{step.transliteration}</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={[s.guidedButtons, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          {currentStep > 0 && (
            <TouchableOpacity style={[s.prevBtn, { borderColor: colors.border }]} onPress={() => setCurrentStep(p => p - 1)}>
              <Feather name="arrow-left" size={18} color={colors.foreground} />
              <Text style={[s.prevBtnText, { color: colors.foreground }]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: isLast ? "#16A34A" : colors.primary, flex: currentStep > 0 ? 1 : undefined, width: currentStep === 0 ? "100%" : undefined }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (isLast) { resetWudu(); } else { setCurrentStep(p => p + 1); }
            }}
          >
            <Text style={s.nextBtnText}>{isLast ? "✓ Complete Wudu" : "Next Step"}</Text>
            {!isLast && <Feather name="arrow-right" size={18} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Wudu Guide</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>دَلِيل الْوُضُوء</Text>
        </View>
        <TouchableOpacity style={[s.guidedBtn, { backgroundColor: colors.primary }]} onPress={() => { setCurrentStep(0); setIsGuidedMode(true); }}>
          <Feather name="play" size={14} color="#FFF" />
          <Text style={s.guidedBtnText}>Guide</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
        {(["steps", "rules", "breakers", "ghusl"] as TabType[]).map(t => (
          <TouchableOpacity key={t} style={[s.tab, { borderBottomColor: tab === t ? colors.primary : "transparent" }]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
              {t === "steps" ? "Steps" : t === "rules" ? "Fara'id" : t === "breakers" ? "Breakers" : "Ghusl"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {tab === "steps" && (
          <>
            {/* Progress */}
            <View style={[s.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.progressLabel, { color: colors.foreground }]}>{checked.size}/{WUDU_STEPS.length} steps completed</Text>
              <View style={[s.progressBarBg, { backgroundColor: colors.border }]}>
                <View style={[s.progressBarFill, { width: `${(checked.size / WUDU_STEPS.length) * 100}%` as any, backgroundColor: checked.size === WUDU_STEPS.length ? "#16A34A" : colors.primary }]} />
              </View>
              {checked.size > 0 && (
                <TouchableOpacity onPress={resetWudu}>
                  <Text style={[s.resetText, { color: colors.mutedForeground }]}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>

            {WUDU_STEPS.map(step => {
              const isDone = checked.has(step.id);
              return (
                <TouchableOpacity key={step.id} style={[s.stepCard, { backgroundColor: isDone ? "#16A34A08" : colors.card, borderColor: isDone ? "#16A34A50" : colors.border }]} onPress={() => toggleStep(step.id)} activeOpacity={0.8}>
                  <View style={[s.stepCheck, { backgroundColor: isDone ? "#16A34A" : colors.border }]}>
                    {isDone ? <Feather name="check" size={14} color="#FFF" /> : <Text style={[s.stepNum, { color: colors.mutedForeground }]}>{step.id}</Text>}
                  </View>
                  <View style={s.stepBody}>
                    <View style={s.stepTop}>
                      <Text style={[s.stepTitle, { color: isDone ? "#16A34A" : colors.foreground }]}>{step.title}</Text>
                      <View style={s.stepBadges}>
                        {step.isSunnah && <View style={[s.sunnahChip, { backgroundColor: "#D9770615" }]}><Text style={[s.sunnahChipText, { color: "#D97706" }]}>Sunnah</Text></View>}
                        {step.count && <View style={[s.countChip, { backgroundColor: colors.primary + "15" }]}><Text style={[s.countChipText, { color: colors.primary }]}>×{step.count}</Text></View>}
                      </View>
                    </View>
                    {step.arabic && <Text style={[s.stepArabic, { color: colors.gold }]}>{step.arabic}</Text>}
                    <Text style={[s.stepDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{step.description}</Text>
                    {step.tip && <Text style={[s.stepTip, { color: colors.primary }]} numberOfLines={1}>💡 {step.tip}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {tab === "rules" && (
          <>
            <View style={[s.sectionHeader, { backgroundColor: "#16A34A15", borderColor: "#16A34A40" }]}>
              <Text style={[s.sectionHeaderText, { color: "#16A34A" }]}>🟢 Obligatory Acts (Fara'id)</Text>
              <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>Missing any of these invalidates Wudu</Text>
            </View>
            {FARA_ID.map((f, i) => (
              <View key={i} style={[s.ruleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.ruleNum, { backgroundColor: "#16A34A20" }]}><Text style={[s.ruleNumText, { color: "#16A34A" }]}>{i + 1}</Text></View>
                <Text style={[s.ruleText, { color: colors.foreground }]}>{f}</Text>
              </View>
            ))}

            <View style={[s.sectionHeader, { backgroundColor: "#D9770615", borderColor: "#D9770640", marginTop: 8 }]}>
              <Text style={[s.sectionHeaderText, { color: "#D97706" }]}>🟡 Recommended Acts (Sunnan)</Text>
              <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>These increase the reward but are not obligatory</Text>
            </View>
            {SUNNAN.map((s2, i) => (
              <View key={i} style={[s.ruleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.ruleNum, { backgroundColor: "#D9770620" }]}><Text style={[s.ruleNumText, { color: "#D97706" }]}>{i + 1}</Text></View>
                <Text style={[s.ruleText, { color: colors.foreground }]}>{s2}</Text>
              </View>
            ))}
          </>
        )}

        {tab === "breakers" && (
          <>
            <View style={[s.sectionHeader, { backgroundColor: "#DC262615", borderColor: "#DC262640" }]}>
              <Text style={[s.sectionHeaderText, { color: "#DC2626" }]}>🔴 Nullifiers of Wudu</Text>
              <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>These require you to renew your Wudu</Text>
            </View>
            {BREAKERS.map((b, i) => (
              <View key={i} style={[s.breakerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.breakerTop}>
                  <View style={[s.breakerNum, { backgroundColor: "#DC262615" }]}><Text style={[s.breakerNumText, { color: "#DC2626" }]}>{i + 1}</Text></View>
                  <Text style={[s.breakerText, { color: colors.foreground }]}>{b.text}</Text>
                </View>
                {b.note && (
                  <View style={[s.breakerNote, { backgroundColor: colors.primary + "08" }]}>
                    <Feather name="info" size={12} color={colors.primary} />
                    <Text style={[s.breakerNoteText, { color: colors.mutedForeground }]}>{b.note}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {tab === "ghusl" && (
          <>
            <View style={[s.sectionHeader, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
              <Text style={[s.sectionHeaderText, { color: colors.primary }]}>🚿 When Ghusl is Required</Text>
              <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>Full ritual bath (Ghusl) is required in these situations</Text>
            </View>
            {GHUSL_SITUATIONS.map((g, i) => (
              <View key={i} style={[s.ruleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.ruleNum, { backgroundColor: colors.primary + "20" }]}><Text style={[s.ruleNumText, { color: colors.primary }]}>{i + 1}</Text></View>
                <Text style={[s.ruleText, { color: colors.foreground }]}>{g}</Text>
              </View>
            ))}

            <View style={[s.sectionHeader, { backgroundColor: "#16A34A15", borderColor: "#16A34A40", marginTop: 12 }]}>
              <Text style={[s.sectionHeaderText, { color: "#16A34A" }]}>Steps of Ghusl (Fard minimum)</Text>
            </View>
            {["Make intention (Niyyah)", "Remove any physical impurity from the body", "Pour water over the entire body ensuring every part is reached — including inside ears, under nails, and roots of hair", "Ensure water reaches all body parts with no dry spots"].map((g, i) => (
              <View key={i} style={[s.ruleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.ruleNum, { backgroundColor: "#16A34A20" }]}><Text style={[s.ruleNumText, { color: "#16A34A" }]}>{i + 1}</Text></View>
                <Text style={[s.ruleText, { color: colors.foreground }]}>{g}</Text>
              </View>
            ))}

            <View style={[s.tipCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30", marginTop: 8 }]}>
              <Feather name="info" size={15} color={colors.primary} />
              <Text style={[s.tipText, { color: colors.foreground }]}>The complete Sunnah Ghusl includes: begin with Bismillah, wash hands, remove impurity, perform Wudu, then pour water 3 times over the entire body starting with the right side.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 18, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 12 },
    stepCounter: { fontSize: 14, fontFamily: "Inter_700Bold" },
    guidedBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
    guidedBtnText: { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },

    tabBar: { flexDirection: "row", borderBottomWidth: 1 },
    tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2 },
    tabText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

    content: { paddingHorizontal: 16, paddingTop: 12 },

    progressCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14, gap: 8 },
    progressLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
    progressBarFill: { height: 6, borderRadius: 3 },
    resetText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },

    stepCard: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12, alignItems: "flex-start" },
    stepCheck: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
    stepNum: { fontSize: 12, fontFamily: "Inter_700Bold" },
    stepBody: { flex: 1 },
    stepTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 4 },
    stepTitle: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
    stepBadges: { flexDirection: "row", gap: 6 },
    sunnahChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    sunnahChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    countChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    countChipText: { fontSize: 10, fontFamily: "Inter_700Bold" },
    stepArabic: { fontSize: 14, marginBottom: 4 },
    stepDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 4 },
    stepTip: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },

    sectionHeader: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
    sectionHeaderText: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
    sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
    ruleRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10 },
    ruleNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    ruleNumText: { fontSize: 12, fontFamily: "Inter_700Bold" },
    ruleText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

    breakerCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 10 },
    breakerTop: { flexDirection: "row", alignItems: "flex-start", padding: 12, gap: 10 },
    breakerNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    breakerNumText: { fontSize: 12, fontFamily: "Inter_700Bold" },
    breakerText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    breakerNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
    breakerNoteText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },

    tipCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
    tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    translitCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 8 },
    translitLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 4 },
    translitText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", lineHeight: 20 },

    // Guided mode
    guidedProgress: { height: 4 },
    guidedProgressFill: { height: 4 },
    guidedContent: { paddingHorizontal: 16, paddingTop: 20 },
    guidedHero: { borderRadius: 18, padding: 24, alignItems: "center", marginBottom: 16 },
    guidedNumBadge: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
    guidedNum: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFF" },
    sunnahBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 8 },
    sunnahText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    guidedTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF", textAlign: "center", marginBottom: 8 },
    guidedArabic: { fontSize: 24, lineHeight: 36, marginBottom: 8 },
    guidedCount: { fontSize: 14, fontFamily: "Inter_400Regular" },
    guidedDescCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
    guidedDesc: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 26 },
    guidedButtons: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, gap: 10, borderTopWidth: 1 },
    prevBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
    prevBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20 },
    nextBtnText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  });
}
