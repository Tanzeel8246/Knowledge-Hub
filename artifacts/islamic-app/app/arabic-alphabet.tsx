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

interface ArabicLetter {
  id: number;
  letter: string;      // isolated form
  name: string;        // e.g. Alif
  nameAr: string;      // e.g. ألف
  transliteration: string;
  sound: string;       // English sound description
  forms: { label: string; form: string }[];
  example: { word: string; meaning: string; letter: string };
  tip: string;
  group: string;
}

const LETTERS: ArabicLetter[] = [
  { id: 1, letter: "ا", name: "Alif", nameAr: "أَلِف", transliteration: "a / ā", sound: "Like 'a' in 'father'", forms: [{ label: "Isolated", form: "ا" }, { label: "Initial", form: "ا" }, { label: "Medial", form: "ـا" }, { label: "Final", form: "ـا" }], example: { word: "أَلَم", meaning: "pain", letter: "ا" }, tip: "Alif is a long vowel carrier. It does not connect to the next letter.", group: "Long vowels" },
  { id: 2, letter: "ب", name: "Ba", nameAr: "بَاء", transliteration: "b", sound: "Like 'b' in 'book'", forms: [{ label: "Isolated", form: "ب" }, { label: "Initial", form: "بـ" }, { label: "Medial", form: "ـبـ" }, { label: "Final", form: "ـب" }], example: { word: "بَاب", meaning: "door", letter: "ب" }, tip: "One dot below. Part of the dotted group (ب ت ث).", group: "Group 1" },
  { id: 3, letter: "ت", name: "Ta", nameAr: "تَاء", transliteration: "t", sound: "Like 't' in 'top'", forms: [{ label: "Isolated", form: "ت" }, { label: "Initial", form: "تـ" }, { label: "Medial", form: "ـتـ" }, { label: "Final", form: "ـت" }], example: { word: "تَمْر", meaning: "dates (fruit)", letter: "ت" }, tip: "Two dots above. Same base shape as ب.", group: "Group 1" },
  { id: 4, letter: "ث", name: "Tha", nameAr: "ثَاء", transliteration: "th", sound: "Like 'th' in 'think'", forms: [{ label: "Isolated", form: "ث" }, { label: "Initial", form: "ثـ" }, { label: "Medial", form: "ـثـ" }, { label: "Final", form: "ـث" }], example: { word: "ثَلَاثَة", meaning: "three", letter: "ث" }, tip: "Three dots above. Place your tongue between your teeth.", group: "Group 1" },
  { id: 5, letter: "ج", name: "Jeem", nameAr: "جِيم", transliteration: "j", sound: "Like 'j' in 'jam'", forms: [{ label: "Isolated", form: "ج" }, { label: "Initial", form: "جـ" }, { label: "Medial", form: "ـجـ" }, { label: "Final", form: "ـج" }], example: { word: "جَمَال", meaning: "beauty", letter: "ج" }, tip: "One dot below the curved shape. Group with ح and خ.", group: "Group 2" },
  { id: 6, letter: "ح", name: "Ha", nameAr: "حَاء", transliteration: "ḥ", sound: "Breathy 'h' from the chest — pharyngeal", forms: [{ label: "Isolated", form: "ح" }, { label: "Initial", form: "حـ" }, { label: "Medial", form: "ـحـ" }, { label: "Final", form: "ـح" }], example: { word: "حَقّ", meaning: "truth/right", letter: "ح" }, tip: "No dots. This is a unique Arabic sound — breath from the throat.", group: "Group 2" },
  { id: 7, letter: "خ", name: "Kha", nameAr: "خَاء", transliteration: "kh", sound: "Like 'ch' in Scottish 'loch' or German 'Bach'", forms: [{ label: "Isolated", form: "خ" }, { label: "Initial", form: "خـ" }, { label: "Medial", form: "ـخـ" }, { label: "Final", form: "ـخ" }], example: { word: "خَيْر", meaning: "goodness", letter: "خ" }, tip: "One dot above. Guttural sound from back of throat.", group: "Group 2" },
  { id: 8, letter: "د", name: "Dal", nameAr: "دَال", transliteration: "d", sound: "Like 'd' in 'door'", forms: [{ label: "Isolated", form: "د" }, { label: "Initial", form: "د" }, { label: "Medial", form: "ـد" }, { label: "Final", form: "ـد" }], example: { word: "دُعَاء", meaning: "supplication", letter: "د" }, tip: "No dots. Does NOT connect to the next letter (non-connector).", group: "Group 3" },
  { id: 9, letter: "ذ", name: "Dhal", nameAr: "ذَال", transliteration: "dh", sound: "Like 'th' in 'this' or 'the'", forms: [{ label: "Isolated", form: "ذ" }, { label: "Initial", form: "ذ" }, { label: "Medial", form: "ـذ" }, { label: "Final", form: "ـذ" }], example: { word: "ذِكْر", meaning: "remembrance", letter: "ذ" }, tip: "One dot above. Voiced 'th' sound — tongue between teeth.", group: "Group 3" },
  { id: 10, letter: "ر", name: "Ra", nameAr: "رَاء", transliteration: "r", sound: "Rolled 'r' like Spanish 'pero'", forms: [{ label: "Isolated", form: "ر" }, { label: "Initial", form: "ر" }, { label: "Medial", form: "ـر" }, { label: "Final", form: "ـر" }], example: { word: "رَحْمَة", meaning: "mercy", letter: "ر" }, tip: "No dots. Non-connector. Trilled 'r' from the front of the mouth.", group: "Group 4" },
  { id: 11, letter: "ز", name: "Zayn", nameAr: "زَاي", transliteration: "z", sound: "Like 'z' in 'zebra'", forms: [{ label: "Isolated", form: "ز" }, { label: "Initial", form: "ز" }, { label: "Medial", form: "ـز" }, { label: "Final", form: "ـز" }], example: { word: "زَيْت", meaning: "olive oil", letter: "ز" }, tip: "One dot above. Same shape as Ra — non-connector.", group: "Group 4" },
  { id: 12, letter: "س", name: "Seen", nameAr: "سِين", transliteration: "s", sound: "Like 's' in 'sun'", forms: [{ label: "Isolated", form: "س" }, { label: "Initial", form: "سـ" }, { label: "Medial", form: "ـسـ" }, { label: "Final", form: "ـس" }], example: { word: "سَلَام", meaning: "peace", letter: "س" }, tip: "Three humps, no dots. Often simplified in print.", group: "Group 5" },
  { id: 13, letter: "ش", name: "Sheen", nameAr: "شِين", transliteration: "sh", sound: "Like 'sh' in 'shoe'", forms: [{ label: "Isolated", form: "ش" }, { label: "Initial", form: "شـ" }, { label: "Medial", form: "ـشـ" }, { label: "Final", form: "ـش" }], example: { word: "شَمْس", meaning: "sun", letter: "ش" }, tip: "Three dots above Seen's shape.", group: "Group 5" },
  { id: 14, letter: "ص", name: "Sad", nameAr: "صَاد", transliteration: "ṣ", sound: "Emphatic 's' — tongue pulled back", forms: [{ label: "Isolated", form: "ص" }, { label: "Initial", form: "صـ" }, { label: "Medial", form: "ـصـ" }, { label: "Final", form: "ـص" }], example: { word: "صَبْر", meaning: "patience", letter: "ص" }, tip: "Emphatic letter — affects surrounding vowels, making them sound deeper.", group: "Group 6" },
  { id: 15, letter: "ض", name: "Dad", nameAr: "ضَاد", transliteration: "ḍ", sound: "Emphatic 'd' — unique to Arabic", forms: [{ label: "Isolated", form: "ض" }, { label: "Initial", form: "ضـ" }, { label: "Medial", form: "ـضـ" }, { label: "Final", form: "ـض" }], example: { word: "ضَوء", meaning: "light", letter: "ض" }, tip: "Arabic is called 'Lughat ul-Dad' — the language of the Dad letter.", group: "Group 6" },
  { id: 16, letter: "ط", name: "Ta (emphatic)", nameAr: "طَاء", transliteration: "ṭ", sound: "Emphatic 't' — tongue pushed back", forms: [{ label: "Isolated", form: "ط" }, { label: "Initial", form: "طـ" }, { label: "Medial", form: "ـطـ" }, { label: "Final", form: "ـط" }], example: { word: "طَرِيق", meaning: "path/way", letter: "ط" }, tip: "Emphatic letter group: ص ض ط ظ — all affect vowel quality.", group: "Group 6" },
  { id: 17, letter: "ظ", name: "Dha (emphatic)", nameAr: "ظَاء", transliteration: "ẓ", sound: "Emphatic 'dh' — like 'th' in 'the' but back of tongue", forms: [{ label: "Isolated", form: "ظ" }, { label: "Initial", form: "ظـ" }, { label: "Medial", form: "ـظـ" }, { label: "Final", form: "ـظ" }], example: { word: "ظُلْم", meaning: "oppression", letter: "ظ" }, tip: "One dot above ط's shape. Often confused with ذ — they sound different.", group: "Group 6" },
  { id: 18, letter: "ع", name: "Ayn", nameAr: "عَيْن", transliteration: "'a / 'i / 'u", sound: "Voiced pharyngeal — constrict throat and vocalize", forms: [{ label: "Isolated", form: "ع" }, { label: "Initial", form: "عـ" }, { label: "Medial", form: "ـعـ" }, { label: "Final", form: "ـع" }], example: { word: "عِلْم", meaning: "knowledge", letter: "ع" }, tip: "One of the hardest letters for non-Arabs. Practice with a Quran teacher.", group: "Group 7" },
  { id: 19, letter: "غ", name: "Ghayn", nameAr: "غَيْن", transliteration: "gh", sound: "Like French 'r' in 'Paris' — gargling sound", forms: [{ label: "Isolated", form: "غ" }, { label: "Initial", form: "غـ" }, { label: "Medial", form: "ـغـ" }, { label: "Final", form: "ـغ" }], example: { word: "غَفَر", meaning: "forgave", letter: "غ" }, tip: "One dot above Ayn's shape. Voiced version of خ.", group: "Group 7" },
  { id: 20, letter: "ف", name: "Fa", nameAr: "فَاء", transliteration: "f", sound: "Like 'f' in 'fan'", forms: [{ label: "Isolated", form: "ف" }, { label: "Initial", form: "فـ" }, { label: "Medial", form: "ـفـ" }, { label: "Final", form: "ـف" }], example: { word: "فِكْر", meaning: "thought", letter: "ف" }, tip: "One dot above. Upper teeth on lower lip.", group: "Group 8" },
  { id: 21, letter: "ق", name: "Qaf", nameAr: "قَاف", transliteration: "q", sound: "Deep 'k' from back of throat — uvular stop", forms: [{ label: "Isolated", form: "ق" }, { label: "Initial", form: "قـ" }, { label: "Medial", form: "ـقـ" }, { label: "Final", form: "ـق" }], example: { word: "قُرْآن", meaning: "Quran", letter: "ق" }, tip: "Two dots above. Produced from the uvula — further back than ك.", group: "Group 8" },
  { id: 22, letter: "ك", name: "Kaf", nameAr: "كَاف", transliteration: "k", sound: "Like 'k' in 'king'", forms: [{ label: "Isolated", form: "ك" }, { label: "Initial", form: "كـ" }, { label: "Medial", form: "ـكـ" }, { label: "Final", form: "ـك" }], example: { word: "كِتَاب", meaning: "book", letter: "ك" }, tip: "A small diagonal stroke inside the letter when final/medial.", group: "Group 9" },
  { id: 23, letter: "ل", name: "Lam", nameAr: "لَام", transliteration: "l", sound: "Like 'l' in 'light'", forms: [{ label: "Isolated", form: "ل" }, { label: "Initial", form: "لـ" }, { label: "Medial", form: "ـلـ" }, { label: "Final", form: "ـل" }], example: { word: "لَيْل", meaning: "night", letter: "ل" }, tip: "Lam + Alif = لا (La) — a special ligature. Lam in Allah is 'heavy'.", group: "Group 9" },
  { id: 24, letter: "م", name: "Meem", nameAr: "مِيم", transliteration: "m", sound: "Like 'm' in 'moon'", forms: [{ label: "Isolated", form: "م" }, { label: "Initial", form: "مـ" }, { label: "Medial", form: "ـمـ" }, { label: "Final", form: "ـم" }], example: { word: "مَاء", meaning: "water", letter: "م" }, tip: "A circle with a small tail. One of the easiest letters.", group: "Group 10" },
  { id: 25, letter: "ن", name: "Noon", nameAr: "نُون", transliteration: "n", sound: "Like 'n' in 'noon'", forms: [{ label: "Isolated", form: "ن" }, { label: "Initial", form: "نـ" }, { label: "Medial", form: "ـنـ" }, { label: "Final", form: "ـن" }], example: { word: "نُور", meaning: "light", letter: "ن" }, tip: "One dot above. When followed by certain letters, its sound changes (Iqlab, Ikhfa, etc.).", group: "Group 10" },
  { id: 26, letter: "ه", name: "Ha", nameAr: "هَاء", transliteration: "h", sound: "Soft 'h' like in 'him'", forms: [{ label: "Isolated", form: "ه" }, { label: "Initial", form: "هـ" }, { label: "Medial", form: "ـهـ" }, { label: "Final", form: "ـه" }], example: { word: "هِدَايَة", meaning: "guidance", letter: "ه" }, tip: "Ha has different shapes in different positions. Often confused with ح.", group: "Group 11" },
  { id: 27, letter: "و", name: "Waw", nameAr: "وَاو", transliteration: "w / ū", sound: "Like 'w' in 'water' or 'oo' in 'moon'", forms: [{ label: "Isolated", form: "و" }, { label: "Initial", form: "و" }, { label: "Medial", form: "ـو" }, { label: "Final", form: "ـو" }], example: { word: "وَقْت", meaning: "time", letter: "و" }, tip: "Non-connector. Can be a consonant (w) or long vowel (ū).", group: "Long vowels" },
  { id: 28, letter: "ي", name: "Ya", nameAr: "يَاء", transliteration: "y / ī", sound: "Like 'y' in 'yes' or 'ee' in 'tree'", forms: [{ label: "Isolated", form: "ي" }, { label: "Initial", form: "يـ" }, { label: "Medial", form: "ـيـ" }, { label: "Final", form: "ـي" }], example: { word: "يَوْم", meaning: "day", letter: "ي" }, tip: "Two dots below when isolated/final. Can be consonant (y) or long vowel (ī).", group: "Long vowels" },
];

const GROUPS = [...new Set(LETTERS.map(l => l.group))];

const HARAKAT = [
  { symbol: "بَ", name: "Fathah", transliteration: "a", sound: "Short 'a' as in 'cat'" },
  { symbol: "بِ", name: "Kasrah", transliteration: "i", sound: "Short 'i' as in 'sit'" },
  { symbol: "بُ", name: "Dammah", transliteration: "u", sound: "Short 'u' as in 'put'" },
  { symbol: "بْ", name: "Sukoon", transliteration: "(no vowel)", sound: "Consonant with no following vowel" },
  { symbol: "بّ", name: "Shaddah", transliteration: "(double)", sound: "Doubles the consonant" },
  { symbol: "بً", name: "Tanwin Fath", transliteration: "an", sound: "'an' sound — indefinite article" },
  { symbol: "بٍ", name: "Tanwin Kasr", transliteration: "in", sound: "'in' sound — indefinite article" },
  { symbol: "بٌ", name: "Tanwin Damm", transliteration: "un", sound: "'un' sound — indefinite article" },
];

type TabType = "letters" | "harakat" | "groups";

export default function ArabicAlphabetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedLetter, setSelectedLetter] = useState<ArabicLetter | null>(null);
  const [tab, setTab] = useState<TabType>("letters");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [learned, setLearned] = useState<Set<number>>(new Set());

  const filtered = selectedGroup === "all" ? LETTERS : LETTERS.filter(l => l.group === selectedGroup);

  const toggleLearned = (id: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLearned(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const s = makeStyles(colors);

  if (selectedLetter) {
    const isLearned = learned.has(selectedLetter.id);
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedLetter(null)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>{selectedLetter.name}</Text>
            <Text style={[s.titleAr, { color: colors.gold }]}>{selectedLetter.nameAr}</Text>
          </View>
          <TouchableOpacity
            style={[s.learnedBtn, { backgroundColor: isLearned ? "#16A34A20" : colors.card, borderColor: isLearned ? "#16A34A" : colors.border }]}
            onPress={() => toggleLearned(selectedLetter.id)}
          >
            <Feather name={isLearned ? "check-circle" : "circle"} size={18} color={isLearned ? "#16A34A" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={[s.detailContent, { paddingBottom: insets.bottom + 40 }]}>
          {/* Big letter display */}
          <View style={[s.bigLetterCard, { backgroundColor: colors.navy }]}>
            <Text style={s.bigLetter}>{selectedLetter.letter}</Text>
            <Text style={[s.bigLetterName, { color: "#FFFFFF80" }]}>{selectedLetter.transliteration}</Text>
            <Text style={[s.bigLetterSound, { color: colors.gold }]}>{selectedLetter.sound}</Text>
          </View>

          {/* 4 forms */}
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>LETTER FORMS</Text>
          <View style={s.formsRow}>
            {selectedLetter.forms.map(f => (
              <View key={f.label} style={[s.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.formLetter, { color: colors.foreground }]}>{f.form}</Text>
                <Text style={[s.formLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* Example word */}
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>EXAMPLE WORD</Text>
          <View style={[s.exCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.exWord, { color: colors.foreground }]}>{selectedLetter.example.word}</Text>
            <Text style={[s.exMeaning, { color: colors.mutedForeground }]}>{selectedLetter.example.meaning}</Text>
          </View>

          {/* Tip */}
          <View style={[s.tipCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Feather name="info" size={15} color={colors.primary} />
            <Text style={[s.tipText, { color: colors.foreground }]}>{selectedLetter.tip}</Text>
          </View>

          <TouchableOpacity
            style={[s.markBtn, { backgroundColor: isLearned ? "#16A34A" : colors.primary }]}
            onPress={() => { toggleLearned(selectedLetter.id); setSelectedLetter(null); }}
          >
            <Feather name={isLearned ? "x-circle" : "check-circle"} size={18} color="#FFF" />
            <Text style={s.markBtnText}>{isLearned ? "Mark as Not Learned" : "Mark as Learned"}</Text>
          </TouchableOpacity>
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
          <Text style={[s.title, { color: colors.foreground }]}>Arabic Alphabet</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>الحروف العربية</Text>
        </View>
        <Text style={[s.progressText, { color: colors.primary }]}>{learned.size}/28</Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressBarOuter}>
        <View style={[s.progressBarBg, { backgroundColor: colors.border }]}>
          <View style={[s.progressBarFill, { width: `${(learned.size / 28) * 100}%` as any, backgroundColor: "#16A34A" }]} />
        </View>
        <Text style={[s.progressLabel, { color: colors.mutedForeground }]}>
          {learned.size === 28 ? "🎉 All 28 letters learned!" : `${28 - learned.size} letters remaining`}
        </Text>
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
        {(["letters", "harakat", "groups"] as TabType[]).map(t => (
          <TouchableOpacity key={t} style={[s.tab, { borderBottomColor: tab === t ? colors.primary : "transparent" }]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
              {t === "letters" ? "Alphabet" : t === "harakat" ? "Vowels" : "Groups"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {tab === "letters" && (
          <>
            {/* Group filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.groupScroll} contentContainerStyle={s.groupContent}>
              {["all", ...GROUPS].map(g => (
                <TouchableOpacity key={g} style={[s.groupChip, { backgroundColor: selectedGroup === g ? colors.primary : colors.card, borderColor: selectedGroup === g ? colors.primary : colors.border }]} onPress={() => setSelectedGroup(g)}>
                  <Text style={[s.groupChipText, { color: selectedGroup === g ? "#FFF" : colors.mutedForeground }]}>{g === "all" ? "All" : g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Letter grid */}
            <View style={s.letterGrid}>
              {filtered.map(letter => {
                const isLearned = learned.has(letter.id);
                return (
                  <TouchableOpacity
                    key={letter.id}
                    style={[s.letterCell, {
                      backgroundColor: isLearned ? "#16A34A15" : colors.card,
                      borderColor: isLearned ? "#16A34A50" : colors.border,
                      borderWidth: isLearned ? 1.5 : 1,
                    }]}
                    onPress={() => setSelectedLetter(letter)}
                  >
                    {isLearned && (
                      <View style={s.learnedDot}>
                        <Feather name="check" size={9} color="#16A34A" />
                      </View>
                    )}
                    <Text style={[s.cellLetter, { color: isLearned ? "#16A34A" : colors.foreground }]}>{letter.letter}</Text>
                    <Text style={[s.cellName, { color: colors.mutedForeground }]}>{letter.name}</Text>
                    <Text style={[s.cellTranslit, { color: colors.primary }]}>/{letter.transliteration}/</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {tab === "harakat" && (
          <>
            <View style={[s.harakatIntro, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.harakatIntroText, { color: colors.foreground }]}>
                Harakat (حَرَكَات) are diacritical marks that indicate the short vowel sounds. They are essential for correct Quran recitation.
              </Text>
            </View>
            {HARAKAT.map(h => (
              <View key={h.name} style={[s.harakatRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.harakatSymbolBox, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[s.harakatSymbol, { color: colors.foreground }]}>{h.symbol}</Text>
                </View>
                <View style={s.harakatBody}>
                  <Text style={[s.harakatName, { color: colors.foreground }]}>{h.name}</Text>
                  <Text style={[s.harakatTranslit, { color: colors.primary }]}>/{h.transliteration}/</Text>
                  <Text style={[s.harakatSound, { color: colors.mutedForeground }]}>{h.sound}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === "groups" && (
          <>
            {GROUPS.map(group => {
              const groupLetters = LETTERS.filter(l => l.group === group);
              const learnedCount = groupLetters.filter(l => learned.has(l.id)).length;
              return (
                <TouchableOpacity key={group} style={[s.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { setSelectedGroup(group); setTab("letters"); }}>
                  <View style={s.groupCardTop}>
                    <Text style={[s.groupCardName, { color: colors.foreground }]}>{group}</Text>
                    <Text style={[s.groupCardCount, { color: colors.primary }]}>{learnedCount}/{groupLetters.length}</Text>
                  </View>
                  <View style={[s.groupCardBar, { backgroundColor: colors.border }]}>
                    <View style={[s.groupCardFill, { width: `${(learnedCount / groupLetters.length) * 100}%` as any, backgroundColor: learnedCount === groupLetters.length ? "#16A34A" : colors.primary }]} />
                  </View>
                  <View style={s.groupLetterRow}>
                    {groupLetters.map(l => (
                      <Text key={l.id} style={[s.groupLetterPreview, { color: learned.has(l.id) ? "#16A34A" : colors.mutedForeground }]}>{l.letter}</Text>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
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
    learnedBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
    progressText: { fontSize: 14, fontFamily: "Inter_700Bold" },

    progressBarOuter: { paddingHorizontal: 16, paddingVertical: 10 },
    progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
    progressBarFill: { height: 6, borderRadius: 3 },
    progressLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },

    tabBar: { flexDirection: "row", borderBottomWidth: 1 },
    tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2 },
    tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

    content: { paddingHorizontal: 16, paddingTop: 12 },

    groupScroll: { maxHeight: 44, marginBottom: 12 },
    groupContent: { gap: 8, alignItems: "center" },
    groupChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    groupChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

    letterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    letterCell: { width: "22%", aspectRatio: 0.85, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, padding: 8, position: "relative" },
    learnedDot: { position: "absolute", top: 5, right: 5 },
    cellLetter: { fontSize: 28, lineHeight: 36 },
    cellName: { fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 2 },
    cellTranslit: { fontSize: 9, fontFamily: "Inter_400Regular" },

    harakatIntro: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
    harakatIntroText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    harakatRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10, gap: 14 },
    harakatSymbolBox: { width: 56, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    harakatSymbol: { fontSize: 28 },
    harakatBody: { flex: 1 },
    harakatName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
    harakatTranslit: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
    harakatSound: { fontSize: 12, fontFamily: "Inter_400Regular" },

    groupCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
    groupCardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    groupCardName: { fontSize: 15, fontFamily: "Inter_700Bold" },
    groupCardCount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    groupCardBar: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 10 },
    groupCardFill: { height: 6, borderRadius: 3 },
    groupLetterRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    groupLetterPreview: { fontSize: 24 },

    // Detail
    detailContent: { paddingHorizontal: 16, paddingTop: 16 },
    bigLetterCard: { borderRadius: 18, padding: 28, alignItems: "center", marginBottom: 16 },
    bigLetter: { fontSize: 90, color: "#FFF", lineHeight: 110 },
    bigLetterName: { fontSize: 18, fontFamily: "Inter_400Regular", marginTop: 4 },
    bigLetterSound: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 6 },
    secLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, marginTop: 6 },
    formsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    formCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center" },
    formLetter: { fontSize: 24, lineHeight: 34 },
    formLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 4 },
    exCard: { borderRadius: 12, borderWidth: 1, padding: 16, alignItems: "center", marginBottom: 16 },
    exWord: { fontSize: 32, lineHeight: 48 },
    exMeaning: { fontSize: 14, fontFamily: "Inter_400Regular" },
    tipCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
    tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    markBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, padding: 16 },
    markBtnText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  });
}
