import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useColors } from "@/hooks/useColors";

interface Dua {
  id: string;
  title: string;
  titleArabic: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  category: string;
}

const DUAS: Dua[] = [
  // Morning
  { id: "m1", category: "morning", title: "Waking Up", titleArabic: "عند الاستيقاظ", arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", transliteration: "Alhamdu lillahi alladhi ahyana ba'da ma amatana wa ilayhin-nushur", translation: "All praise is for Allah who gave us life after having given us death, and unto Him is the resurrection.", reference: "Al-Bukhari 6312" },
  { id: "m2", category: "morning", title: "Morning Supplication", titleArabic: "دعاء الصباح", arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", transliteration: "Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan-nushur", translation: "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the final return.", reference: "Al-Tirmidhi 3391" },
  { id: "m3", category: "morning", title: "Sayyidul Istighfar", titleArabic: "سيد الاستغفار", arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ", transliteration: "Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana abduka, wa ana 'ala ahdika wa wa'dika mastata'tu", translation: "O Allah, You are my Lord, there is no deity except You. You created me and I am Your slave. I am upon Your covenant and Your promise as best I can.", reference: "Al-Bukhari 6306" },
  // Evening
  { id: "e1", category: "evening", title: "Evening Supplication", titleArabic: "دعاء المساء", arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ", transliteration: "Allahumma bika amsayna wa bika asbahna wa bika nahya wa bika namutu wa ilaykal-masir", translation: "O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final destination.", reference: "Al-Tirmidhi 3391" },
  { id: "e2", category: "evening", title: "Protection at Night", titleArabic: "دعاء النوم", arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", transliteration: "Bismika allahumma amutu wa ahya", translation: "In Your name, O Allah, I die and I live.", reference: "Al-Bukhari 6324" },
  { id: "e3", category: "evening", title: "Ayat al-Kursi (protection)", titleArabic: "آية الكرسي", arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ", transliteration: "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum. La ta'khudhuhu sinatun wa la nawm.", translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.", reference: "Quran 2:255" },
  // Prayer
  { id: "p1", category: "prayer", title: "Before Prayer (Entering Mosque)", titleArabic: "دعاء دخول المسجد", arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", transliteration: "Allahumma iftah li abwaba rahmatik", translation: "O Allah, open for me the doors of Your mercy.", reference: "Muslim 713" },
  { id: "p2", category: "prayer", title: "After Tashahhud (before Tasleem)", titleArabic: "دعاء قبل التسليم", arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ وَمِنْ عَذَابِ النَّارِ وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ", transliteration: "Allahumma inni a'udhu bika min adhabil-qabri wa min adhabi jahannam wa min fitnatil-mahya wal-mamat wa min sharri fitnatil-masihid-dajjal", translation: "O Allah, I seek refuge in You from the punishment of the grave, the punishment of Hellfire, the trials of life and death, and from the evil of the trial of Al-Masih Ad-Dajjal.", reference: "Al-Bukhari 1377" },
  { id: "p3", category: "prayer", title: "After Prayer (Tasbeeh)", titleArabic: "التسبيح بعد الصلاة", arabic: "سُبْحَانَ اللَّهِ (33) الْحَمْدُ لِلَّهِ (33) اللَّهُ أَكْبَرُ (33)", transliteration: "SubhanAllah (33x) Alhamdulillah (33x) Allahu Akbar (33x)", translation: "Glory be to Allah (33x), All Praise to Allah (33x), Allah is Greatest (33x)", reference: "Muslim 597" },
  // Food & Drink
  { id: "f1", category: "food", title: "Before Eating", titleArabic: "قبل الأكل", arabic: "بِسْمِ اللَّهِ", transliteration: "Bismillah", translation: "In the name of Allah.", reference: "Al-Tirmidhi 1858" },
  { id: "f2", category: "food", title: "After Eating", titleArabic: "بعد الأكل", arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", transliteration: "Alhamdu lillahi alladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah", translation: "All praise is for Allah who fed me this and provided it for me without any might or power from myself.", reference: "Al-Tirmidhi 3458" },
  { id: "f3", category: "food", title: "Drinking Water", titleArabic: "شرب الماء", arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdu lillah", translation: "All praise is for Allah.", reference: "Ibn Majah 3290" },
  // Travel
  { id: "t1", category: "travel", title: "Dua for Travel", titleArabic: "دعاء السفر", arabic: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى", transliteration: "Allahumma inna nas'aluka fi safarina hadhal-birra wat-taqwa wa minal-'amali ma tarda", translation: "O Allah, we ask You in this journey of ours for righteousness, piety, and deeds that You are pleased with.", reference: "Muslim 1342" },
  { id: "t2", category: "travel", title: "Riding a Vehicle", titleArabic: "ركوب السيارة", arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ", transliteration: "Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin wa inna ila rabbina lamunqalibun", translation: "Glory be to Him who has subjected this to us, and we could never have it by our own efforts, and verily to our Lord we shall return.", reference: "Quran 43:13-14" },
  // Distress
  { id: "d1", category: "distress", title: "Dua of Prophet Yunus (AS)", titleArabic: "دعاء يونس عليه السلام", arabic: "لَا إِلَهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ", transliteration: "La ilaha illa anta subhanaka inni kuntu minadh-dhalimin", translation: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.", reference: "Quran 21:87" },
  { id: "d2", category: "distress", title: "Dua for Anxiety", titleArabic: "دعاء عند الهم", arabic: "اللَّهُمَّ إِنِّي عَبْدُكَ ابْنُ عَبْدِكَ ابْنُ أَمَتِكَ نَاصِيَتِي بِيَدِكَ مَاضٍ فِيَّ حُكْمُكَ عَدْلٌ فِيَّ قَضَاؤُكَ", transliteration: "Allahumma inni 'abduka ibnu 'abdika ibnu amatika, nasiyati bi yadika, madhin fiyya hukmuka, 'adlun fiyya qada'uk", translation: "O Allah, I am Your slave, son of Your slave, son of Your maidservant. My forelock is in Your hand, Your decree is certain on me, Your judgment regarding me is just.", reference: "Ahmad 3704" },
  { id: "d3", category: "distress", title: "Dua for Difficulty", titleArabic: "دعاء الكرب", arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ", transliteration: "La ilaha illallahul-'Adhimul-Halim, la ilaha illallahu Rabbul-'Arshil-'Adhim", translation: "There is no deity except Allah, the Magnificent, the Forbearing. There is no deity except Allah, Lord of the Magnificent Throne.", reference: "Al-Bukhari 6346" },
  // Protection
  { id: "pr1", category: "protection", title: "Seeking Refuge from Shaytan", titleArabic: "الاستعاذة من الشيطان", arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", transliteration: "A'udhu billahi minash-shaytanir-rajim", translation: "I seek refuge in Allah from the accursed Shaytan.", reference: "Quran 16:98" },
  { id: "pr2", category: "protection", title: "Surah Al-Falaq", titleArabic: "سورة الفلق", arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ مِن شَرِّ مَا خَلَقَ", transliteration: "Qul a'udhu bi rabbil-falaq. Min sharri ma khalaq.", translation: "Say: I seek refuge in the Lord of the daybreak, from the evil of what He has created.", reference: "Quran 113:1-2" },
  // Forgiveness
  { id: "fg1", category: "forgiveness", title: "Seeking Forgiveness", titleArabic: "الاستغفار", arabic: "أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ", transliteration: "Astaghfirullaha alladhi la ilaha illa Huwal-Hayyul-Qayyumu wa atubu ilayh", translation: "I seek the forgiveness of Allah, besides Whom there is none worthy of worship, the Ever-Living, the Eternal, and I turn to Him in repentance.", reference: "Abu Dawud 1517" },
  { id: "fg2", category: "forgiveness", title: "Complete Forgiveness Dua", titleArabic: "دعاء التوبة", arabic: "اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَعَافِنِي وَارْزُقْنِي", transliteration: "Allahummaghfir li, warhamni, wahdini, wa'afini, warzuqni", translation: "O Allah, forgive me, have mercy on me, guide me, protect me, and grant me sustenance.", reference: "Muslim 2697" },
];

const CATEGORIES = [
  { id: "all", label: "All", color: "#6B7280" },
  { id: "morning", label: "Morning", color: "#F59E0B" },
  { id: "evening", label: "Evening", color: "#6366F1" },
  { id: "prayer", label: "Prayer", color: "#0D9373" },
  { id: "food", label: "Food", color: "#EF4444" },
  { id: "travel", label: "Travel", color: "#0891B2" },
  { id: "distress", label: "Distress", color: "#8B5CF6" },
  { id: "protection", label: "Protection", color: "#DC2626" },
  { id: "forgiveness", label: "Forgiveness", color: "#D97706" },
];

export default function DuasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [duaList, setDuaList] = useState<Dua[]>(DUAS);

  React.useEffect(() => {
    (async () => {
      try {
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const url = domain ? `https://${domain}/api/duas?limit=100` : `/api/duas?limit=100`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.duas && Array.isArray(data.duas) && data.duas.length > 0) {
          // Merge avoiding ID collisions
          const existingIds = new Set(data.duas.map((d: any) => d.id));
          const combined = [...data.duas, ...DUAS.filter(d => !existingIds.has(d.id))];
          setDuaList(combined);
        }
      } catch {}
    })();
  }, []);

  const filtered = useMemo(() => {
    return duaList.filter(d => {
      const matchesCat = activeCategory === "all" || d.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch = !q || d.title.toLowerCase().includes(q) || d.translation.toLowerCase().includes(q) || (d.transliteration && d.transliteration.toLowerCase().includes(q)) || d.arabic.includes(q);
      return matchesCat && matchesSearch;
    });
  }, [duaList, activeCategory, search]);

  const copyDua = async (dua: Dua) => {
    const text = `${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}\n\nRef: ${dua.reference}`;
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", `"${dua.title}" copied to clipboard`);
  };

  const s = makeStyles(colors);
  const catColor = (id: string) => CATEGORIES.find(c => c.id === id)?.color ?? colors.primary;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Duas Collection</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>مجموعة الأدعية</Text>
        </View>
        <Text style={[s.count, { color: colors.mutedForeground }]}>{filtered.length}</Text>
      </View>

      {/* Search */}
      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginBottom: 8 }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Search duas..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills - horizontal scroll using FlatList */}
      <View style={{ height: 44, marginBottom: 8 }}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={c => c.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.catPill, {
                backgroundColor: activeCategory === item.id ? item.color : colors.card,
                borderColor: activeCategory === item.id ? item.color : colors.border,
              }]}
              onPress={() => setActiveCategory(item.id)}
            >
              <Text style={[s.catPillText, { color: activeCategory === item.id ? "#FFF" : colors.foreground }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Duas List */}
      <FlatList
        data={filtered}
        keyExtractor={d => d.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 60 }}
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          const color = catColor(item.category);
          const isBookmarked = bookmarked.has(item.id);

          return (
            <TouchableOpacity
              style={[s.duaCard, {
                backgroundColor: colors.card,
                borderColor: expanded ? color + "60" : colors.border,
                borderWidth: expanded ? 1.5 : 1,
              }]}
              onPress={() => setExpandedId(expanded ? null : item.id)}
              activeOpacity={0.9}
            >
              {/* Card Header */}
              <View style={s.cardHeader}>
                <View style={[s.catDot, { backgroundColor: color }]} />
                <View style={s.cardTitles}>
                  <Text style={[s.duaTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[s.duaTitleAr, { color: color }]}>{item.titleArabic}</Text>
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity
                    onPress={() => {
                      const nb = new Set(bookmarked);
                      if (isBookmarked) nb.delete(item.id); else nb.add(item.id);
                      setBookmarked(nb);
                    }}
                  >
                    <Feather name={isBookmarked ? "bookmark" : "bookmark"} size={16} color={isBookmarked ? color : colors.mutedForeground} />
                  </TouchableOpacity>
                  <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                </View>
              </View>

              {/* Arabic preview (always visible) */}
              <Text style={[s.duaArabicPreview, { color: colors.foreground }]} numberOfLines={expanded ? undefined : 2}>
                {item.arabic}
              </Text>

              {/* Expanded content */}
              {expanded && (
                <View style={s.expandedContent}>
                  <View style={[s.divider, { backgroundColor: colors.border }]} />
                  <Text style={[s.transliteration, { color: color }]}>{item.transliteration}</Text>
                  <Text style={[s.translation, { color: colors.mutedForeground }]}>{item.translation}</Text>
                  <View style={s.expandedFooter}>
                    <View style={[s.refBadge, { backgroundColor: color + "15" }]}>
                      <Feather name="book-open" size={11} color={color} />
                      <Text style={[s.refText, { color: color }]}>{item.reference}</Text>
                    </View>
                    <TouchableOpacity style={[s.copyBtn, { backgroundColor: color + "15", borderColor: color }]} onPress={() => copyDua(item)}>
                      <Feather name="copy" size={13} color={color} />
                      <Text style={[s.copyText, { color: color }]}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Feather name="heart" size={36} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No duas found</Text>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 22, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 13 },
    count: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, gap: 10, marginBottom: 8 },
    searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
    catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
    catPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    duaCard: { borderRadius: 14, padding: 14, marginBottom: 10 },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    catDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    cardTitles: { flex: 1 },
    duaTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    duaTitleAr: { fontSize: 12, marginTop: 1 },
    cardActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    duaArabicPreview: { fontSize: 18, lineHeight: 32, textAlign: "right", fontFamily: "Inter_400Regular" },
    expandedContent: { marginTop: 10 },
    divider: { height: 1, marginBottom: 12 },
    transliteration: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontStyle: "italic", marginBottom: 8, lineHeight: 22 },
    translation: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 12 },
    expandedFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    refBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    refText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    copyBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    copyText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    empty: { alignItems: "center", marginTop: 60, gap: 12 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  });
}
