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
import { useColors } from "@/hooks/useColors";

interface TajweedRule {
  id: string;
  name: string;
  nameAr: string;
  category: "noon-tanwin" | "meem" | "madd" | "qalqalah" | "waqf" | "general";
  color: string;
  definition: string;
  condition: string;
  examples: { arabic: string; highlight: string; translation: string }[];
  tip?: string;
}

const RULES: TajweedRule[] = [
  // Noon Sakinah & Tanwin
  {
    id: "izhar", name: "Izhar Halqi", nameAr: "إِظْهَار حَلْقِي", category: "noon-tanwin", color: "#16A34A",
    definition: "Clear pronunciation of Noon Sakinah (نْ) or Tanwin when followed by any of the 6 throat letters (حروف الحلق).",
    condition: "Noon Sakinah or Tanwin followed by: ء ه ع ح غ خ",
    examples: [
      { arabic: "مِن اللَّه", highlight: "نْ ا", translation: "from Allah" },
      { arabic: "عَلِيمٌ حَكِيم", highlight: "نٌ ح", translation: "All-Knowing, All-Wise" },
    ],
    tip: "The Noon is pronounced clearly with no nasalization. Think of it like pronouncing 'n' clearly before saying 'h'.",
  },
  {
    id: "idgham-ghunnah", name: "Idgham with Ghunnah", nameAr: "إِدْغَام بِغُنَّة", category: "noon-tanwin", color: "#7C3AED",
    definition: "Merging the Noon Sakinah or Tanwin into the following letter WITH nasalization (ghunnah), making a 2-count nasal hum.",
    condition: "Noon Sakinah or Tanwin followed by: ي ن م و",
    examples: [
      { arabic: "مِن نِّعْمَة", highlight: "نْ نِ", translation: "from a blessing" },
      { arabic: "هُدًى لِّلْمُتَّقِين", highlight: "ىً لِ", translation: "guidance for the righteous" },
    ],
    tip: "Exception: No Idgham if Noon Sakinah and the following letter are in the SAME word (e.g., دُنْيَا، بُنْيَان، صِنْوَان، قِنْوَان).",
  },
  {
    id: "idgham-bila", name: "Idgham without Ghunnah", nameAr: "إِدْغَام بِلَا غُنَّة", category: "noon-tanwin", color: "#0891B2",
    definition: "Merging the Noon Sakinah or Tanwin into the following letter WITHOUT nasalization — a complete, clean merge.",
    condition: "Noon Sakinah or Tanwin followed by: ل ر",
    examples: [
      { arabic: "مِن رَّبِّكَ", highlight: "نْ رَ", translation: "from your Lord" },
      { arabic: "غَفُورٌ رَّحِيم", highlight: "رٌ رَ", translation: "Oft-Forgiving, Most Merciful" },
    ],
    tip: "The Noon completely disappears into ل or ر with no nasal sound at all.",
  },
  {
    id: "iqlab", name: "Iqlab", nameAr: "إِقْلَاب", category: "noon-tanwin", color: "#DC2626",
    definition: "Changing the Noon Sakinah or Tanwin into a Meem sound WITH ghunnah when followed by the letter ب.",
    condition: "Noon Sakinah or Tanwin followed by: ب only",
    examples: [
      { arabic: "مِن بَعْد", highlight: "نْ بَ", translation: "after" },
      { arabic: "سَمِيعٌ بَصِير", highlight: "عٌ بَ", translation: "All-Hearing, All-Seeing" },
    ],
    tip: "Think: نْ + ب → م̃ + ب (a nasal 'm' before 'b'). Some Masahif mark this with a small م above the Noon.",
  },
  {
    id: "ikhfa", name: "Ikhfa Haqiqi", nameAr: "إِخْفَاء حَقِيقِي", category: "noon-tanwin", color: "#D97706",
    definition: "Hiding the Noon Sakinah or Tanwin — producing a nasalized sound between clear Izhar and complete Idgham — for 2 counts.",
    condition: "Noon Sakinah or Tanwin followed by any of the remaining 15 letters: ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك",
    examples: [
      { arabic: "مِن قَبْل", highlight: "نْ قَ", translation: "before" },
      { arabic: "عَلِيمٌ خَبِير", highlight: "مٌ خَ", translation: "All-Knowing, All-Aware" },
    ],
    tip: "The tongue doesn't fully touch the roof of the mouth. The sound is 'hidden' with a nasal hum.",
  },

  // Meem Sakinah
  {
    id: "ikhfa-shafawi", name: "Ikhfa Shafawi", nameAr: "إِخْفَاء شَفَوِي", category: "meem", color: "#D97706",
    definition: "Hiding the Meem Sakinah (مْ) when followed by ب — the lips lightly touch with nasalization for 2 counts.",
    condition: "Meem Sakinah (مْ) followed by: ب",
    examples: [
      { arabic: "تَرْمِيهِم بِحِجَارَة", highlight: "مْ بِ", translation: "throwing at them stones" },
    ],
    tip: "The lips don't fully close — they are near-touching with a nasal hum. Different from Iqlab which involves Noon.",
  },
  {
    id: "idgham-shafawi", name: "Idgham Shafawi", nameAr: "إِدْغَام شَفَوِي", category: "meem", color: "#7C3AED",
    definition: "Merging Meem Sakinah into a following Meem WITH ghunnah for 2 counts.",
    condition: "Meem Sakinah (مْ) followed by: م",
    examples: [
      { arabic: "لَهُم مَّا", highlight: "مْ مَ", translation: "for them what" },
    ],
    tip: "The two Meems become one elongated Meem with nasalization.",
  },
  {
    id: "izhar-shafawi", name: "Izhar Shafawi", nameAr: "إِظْهَار شَفَوِي", category: "meem", color: "#16A34A",
    definition: "Clear pronunciation of Meem Sakinah when followed by any letter other than ب and م.",
    condition: "Meem Sakinah followed by any letter except ب and م",
    examples: [
      { arabic: "أَنتُم فِيهَا", highlight: "مْ فِ", translation: "you are in it" },
    ],
    tip: "Be especially careful when followed by و and ف — avoid merging the Meem into them.",
  },

  // Madd (Elongation)
  {
    id: "madd-tabii", name: "Madd Tabii (Natural)", nameAr: "مَدّ طَبِيعِي", category: "madd", color: "#059669",
    definition: "The basic elongation of 2 counts. Every Alif, Waw, or Ya' that is NOT followed by Hamza or Sukoon.",
    condition: "ا after Fathah | و after Dammah | ي after Kasrah — with no Hamza or Sukoon following",
    examples: [
      { arabic: "كِتَاب", highlight: "تَا", translation: "book — 2 counts on ا" },
      { arabic: "يَقُول", highlight: "قُو", translation: "he says — 2 counts on و" },
    ],
    tip: "2 counts = approximately the length of one 'alif'. This is the foundation of all Madd.",
  },
  {
    id: "madd-muttasil", name: "Madd Wajib Muttasil", nameAr: "مَدّ وَاجِب مُتَّصِل", category: "madd", color: "#DC2626",
    definition: "Obligatory elongation when a Madd letter is followed by Hamza within the SAME word. Elongated 4–5 counts.",
    condition: "Madd letter (ا و ي) + Hamzah in same word",
    examples: [
      { arabic: "جَاءَ", highlight: "ا ءَ", translation: "he came — 4-5 counts" },
      { arabic: "سُوءٌ", highlight: "و ءٌ", translation: "evil — 4-5 counts" },
    ],
    tip: "Wajib means obligatory — extending here is not optional. Marked with a special symbol in Masahif.",
  },
  {
    id: "madd-munfasil", name: "Madd Jaiz Munfasil", nameAr: "مَدّ جَائِز مُنْفَصِل", category: "madd", color: "#7C3AED",
    definition: "Permissible elongation when the Madd letter is in one word and the Hamza is in the NEXT word. 2, 4, or 5 counts.",
    condition: "Madd letter at end of word + Hamza at beginning of next word",
    examples: [
      { arabic: "بِمَا أُنزِلَ", highlight: "مَا أُ", translation: "in what was revealed" },
      { arabic: "قُوا أَنفُسَكُم", highlight: "وا أَ", translation: "protect yourselves" },
    ],
    tip: "Jaiz means permissible — you may read 2, 4, or 5 counts. Most popular in Hafs 'an 'Asim: 4 counts.",
  },
  {
    id: "madd-arid", name: "Madd 'Arid lis-Sukoon", nameAr: "مَدّ عَارِض لِلسُّكُون", category: "madd", color: "#0891B2",
    definition: "Elongation that occurs when you stop (waqf) on a word ending in a letter preceded by a Madd letter. 2, 4, or 6 counts.",
    condition: "Stopping (waqf) on a word where the last letter has a Madd letter before it",
    examples: [
      { arabic: "نَسْتَعِين ◌", highlight: "عِي نْ", translation: "we seek help (at waqf)" },
      { arabic: "الرَّحِيم ◌", highlight: "حِي مْ", translation: "Most Merciful (at waqf)" },
    ],
    tip: "Only applies when stopping. When continuing, it returns to 2 counts (Madd Tabii). Most reciters use 2 or 4 counts.",
  },

  // Qalqalah
  {
    id: "qalqalah", name: "Qalqalah", nameAr: "قَلْقَلَة", category: "qalqalah", color: "#6366F1",
    definition: "An echoing, bouncing sound produced when one of the 5 Qalqalah letters appears with Sukoon.",
    condition: "Any of the 5 letters: ق ط ب ج د — when carrying a Sukoon (either always, or at Waqf)",
    examples: [
      { arabic: "يَقْطِنُون", highlight: "قْ طِ", translation: "Qalqalah on both قْ and طِ at waqf" },
      { arabic: "أَحَد ◌", highlight: "دْ", translation: "One — strong Qalqalah at Waqf" },
    ],
    tip: "Qalqalah at Waqf (stopping) is stronger than within a word. The 5 letters: قُطُب جَد (mnemonic).",
  },

  // General
  {
    id: "ghunnah", name: "Ghunnah (Nasalization)", nameAr: "غُنَّة", category: "general", color: "#D97706",
    definition: "A nasal sound produced from the nose. Ghunnah is an essential characteristic of Meem (م) and Noon (ن) — it always exists in them.",
    condition: "Heavy Ghunnah (2 counts) occurs with: Shaddah on Noon or Meem | Idgham with Ghunnah | Ikhfa | Iqlab | Ikhfa Shafawi | Idgham Shafawi",
    examples: [
      { arabic: "إِنَّ", highlight: "نَّ", translation: "Indeed — 2-count Ghunnah on Shadda Noon" },
      { arabic: "ثُمَّ", highlight: "مَّ", translation: "Then — 2-count Ghunnah on Shadda Meem" },
    ],
    tip: "Ghunnah is purely from the nose. Test it by pinching your nose — if the sound changes, you're doing it right.",
  },
  {
    id: "tafkhim-tarqiq", name: "Tafkhim & Tarqiq", nameAr: "تَفْخِيم وَ تَرْقِيق", category: "general", color: "#78716C",
    definition: "Tafkhim (heavy/full) and Tarqiq (light/thin) refer to the weight of letter pronunciation based on mouth fullness.",
    condition: "Heavy letters (always full): خ ص ض غ ط ق ظ. Conditional heavy: ر ل (in لفظ الجلالة). All others: light.",
    examples: [
      { arabic: "الله", highlight: "لله", translation: "Allah — Lam is heavy here (preceded by Fathah or Dammah)" },
      { arabic: "بِاللَّهِ", highlight: "للَّ", translation: "by Allah — Lam is light (preceded by Kasrah)" },
    ],
    tip: "The 7 always-heavy letters: خ ص ض غ ط ق ظ — memorize as 'خُصَّ ضَغْطٍ قِظْ'",
  },
  {
    id: "waqf", name: "Waqf (Stopping Rules)", nameAr: "وَقْف", category: "waqf", color: "#059669",
    definition: "Rules for stopping during Quran recitation. There are mandatory, preferred, permissible, and prohibited stops.",
    condition: "م = Mandatory stop | ط = Absolute stop | ج = Permissible stop | ز = Better to continue | ص = Permissible | لا = Do not stop",
    examples: [
      { arabic: "م — Waqf Lazim", highlight: "م", translation: "Must stop here — meaning changes if you continue" },
      { arabic: "لا — La Waqf", highlight: "لا", translation: "Do not stop here — continuing is required for meaning" },
    ],
    tip: "When stopping: apply Waqf rules by adding Sukoon to the last letter. When starting again: begin from a word that preserves meaning.",
  },
];

const CATEGORIES = [
  { id: "noon-tanwin", label: "Noon & Tanwin", nameAr: "نون ساكنة وتنوين", color: "#7C3AED" },
  { id: "meem", label: "Meem Sakinah", nameAr: "ميم ساكنة", color: "#D97706" },
  { id: "madd", label: "Madd (Elongation)", nameAr: "المد", color: "#059669" },
  { id: "qalqalah", label: "Qalqalah", nameAr: "قلقلة", color: "#6366F1" },
  { id: "general", label: "General Rules", nameAr: "قواعد عامة", color: "#78716C" },
  { id: "waqf", label: "Waqf", nameAr: "الوقف", color: "#059669" },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"] | "all";

export default function TajweedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [catFilter, setCatFilter] = useState<CategoryId>("all");
  const [selectedRule, setSelectedRule] = useState<TajweedRule | null>(null);

  const filtered = catFilter === "all" ? RULES : RULES.filter(r => r.category === catFilter);

  const s = makeStyles(colors);

  if (selectedRule) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedRule(null)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>{selectedRule.name}</Text>
            <Text style={[s.titleAr, { color: colors.gold }]}>{selectedRule.nameAr}</Text>
          </View>
          <View style={[s.colorDot, { backgroundColor: selectedRule.color }]} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.detailContent, { paddingBottom: insets.bottom + 40 }]}>
          {/* Hero */}
          <View style={[s.ruleHero, { backgroundColor: selectedRule.color + "15", borderColor: selectedRule.color + "40" }]}>
            <Text style={[s.ruleHeroName, { color: selectedRule.color }]}>{selectedRule.nameAr}</Text>
            <Text style={[s.ruleHeroEn, { color: colors.foreground }]}>{selectedRule.name}</Text>
          </View>

          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>DEFINITION</Text>
          <View style={[s.defCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.defText, { color: colors.foreground }]}>{selectedRule.definition}</Text>
          </View>

          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>WHEN IT OCCURS</Text>
          <View style={[s.condCard, { backgroundColor: selectedRule.color + "10", borderColor: selectedRule.color + "30" }]}>
            <Text style={[s.condText, { color: colors.foreground }]}>{selectedRule.condition}</Text>
          </View>

          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>EXAMPLES</Text>
          {selectedRule.examples.map((ex, i) => (
            <View key={i} style={[s.exCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.exArabic, { color: colors.foreground }]}>{ex.arabic}</Text>
              <View style={[s.exHighlight, { backgroundColor: selectedRule.color + "20" }]}>
                <Text style={[s.exHighlightText, { color: selectedRule.color }]}>{ex.highlight}</Text>
              </View>
              <Text style={[s.exTranslation, { color: colors.mutedForeground }]}>{ex.translation}</Text>
            </View>
          ))}

          {selectedRule.tip && (
            <>
              <Text style={[s.secLabel, { color: colors.mutedForeground }]}>LEARNING TIP</Text>
              <View style={[s.tipCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Feather name="zap" size={15} color={colors.primary} />
                <Text style={[s.tipText, { color: colors.foreground }]}>{selectedRule.tip}</Text>
              </View>
            </>
          )}
        </ScrollView>
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
          <Text style={[s.title, { color: colors.foreground }]}>Tajweed Rules</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>أَحْكَام التَّجْوِيد</Text>
        </View>
        <View style={[s.numBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[s.numText, { color: colors.primary }]}>{filtered.length}</Text>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterContent}>
        <TouchableOpacity style={[s.filterChip, { backgroundColor: catFilter === "all" ? colors.primary : colors.card, borderColor: catFilter === "all" ? colors.primary : colors.border }]} onPress={() => setCatFilter("all")}>
          <Text style={[s.filterChipText, { color: catFilter === "all" ? "#FFF" : colors.mutedForeground }]}>All Rules</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={[s.filterChip, { backgroundColor: catFilter === cat.id ? cat.color : colors.card, borderColor: catFilter === cat.id ? cat.color : colors.border }]} onPress={() => setCatFilter(cat.id)}>
            <Text style={[s.filterChipText, { color: catFilter === cat.id ? "#FFF" : colors.mutedForeground }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Intro banner */}
      <View style={[s.introBanner, { backgroundColor: colors.navy }]}>
        <Text style={s.introBannerText}>Tajweed (تجويد) means to recite the Quran with proper pronunciation, rhythm, and rules as taught by the Prophet ﷺ.</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 40 }]}>
        {filtered.map(rule => (
          <TouchableOpacity key={rule.id} style={[s.ruleCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: rule.color, borderLeftWidth: 4 }]} onPress={() => setSelectedRule(rule)} activeOpacity={0.8}>
            <View style={s.ruleCardBody}>
              <View style={s.ruleCardTop}>
                <Text style={[s.ruleCardName, { color: colors.foreground }]}>{rule.name}</Text>
                <Text style={[s.ruleCardAr, { color: rule.color }]}>{rule.nameAr}</Text>
              </View>
              <Text style={[s.ruleCardDef, { color: colors.mutedForeground }]} numberOfLines={2}>{rule.definition}</Text>
              <View style={[s.ruleCardCat, { backgroundColor: rule.color + "15" }]}>
                <Text style={[s.ruleCardCatText, { color: rule.color }]}>{CATEGORIES.find(c => c.id === rule.category)?.label ?? rule.category}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.border} />
          </TouchableOpacity>
        ))}
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
    numBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    numText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    colorDot: { width: 20, height: 20, borderRadius: 10 },

    filterScroll: { maxHeight: 48 },
    filterContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: "center" },
    filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    filterChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

    introBanner: { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 12 },
    introBannerText: { color: "#FFFFFFC0", fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

    listContent: { paddingHorizontal: 16, paddingTop: 4 },
    ruleCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 10 },
    ruleCardBody: { flex: 1 },
    ruleCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    ruleCardName: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
    ruleCardAr: { fontSize: 15 },
    ruleCardDef: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 8 },
    ruleCardCat: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
    ruleCardCatText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

    // Detail
    detailContent: { paddingHorizontal: 16, paddingTop: 16 },
    ruleHero: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", marginBottom: 16 },
    ruleHeroName: { fontSize: 32, lineHeight: 48, marginBottom: 6 },
    ruleHeroEn: { fontSize: 18, fontFamily: "Inter_700Bold" },
    secLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, marginTop: 6 },
    defCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
    defText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 24 },
    condCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
    condText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 22 },
    exCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 10, alignItems: "flex-end" },
    exArabic: { fontSize: 22, lineHeight: 36, textAlign: "right", marginBottom: 8 },
    exHighlight: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
    exHighlightText: { fontSize: 16, fontFamily: "Inter_700Bold" },
    exTranslation: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic", alignSelf: "flex-start" },
    tipCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
    tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  });
}
