import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Share,
} from "react-native";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface StoryItem {
  id: string;
  title: string;
  titleArabic?: string;
  category: string;
  summary: string;
  arabicVerse?: string;
  urduContent: string;
  englishContent?: string;
  moralLesson: string;
  ageGroup: string;
  icon: string;
}

const DEFAULT_STORIES: StoryItem[] = [
  {
    id: "story_adam",
    title: "حضرت آدم علیہ السلام کی تخلیق",
    titleArabic: "قصة خلق أبينا آدم عليه السلام",
    category: "prophet_story",
    summary: "اللہ تعالیٰ نے سب سے پہلے انسان اور پیغمبر حضرت آدم علیہ السلام کو مٹی سے پیدا کیا اور فرشتوں کو تعظیم کا حکم دیا۔",
    arabicVerse: "إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً (البقرة: 30)",
    urduContent: "اللہ تبارک و تعالیٰ نے جب دنیا کو بنایا تو فرشتوں کو بتایا کہ میں زمین پر ایک خلیفہ (انسان) بنانے والا ہوں۔ اللہ تعالیٰ نے مٹی سے حضرت آدم علیہ السلام کا پتلا بنایا اور اس میں اپنی قدرت سے روح پھونکی۔ تمام فرشتوں نے اللہ کے حکم پر حضرت آدم علیہ السلام کو سجدۂ تعظیم کیا، مگر ابلیس (شیطان) نے تکبر اور غرور کیا اور نافرمانی کی۔ اللہ تعالیٰ نے حضرت آدم علیہ السلام کو تمام چیزوں کے نام سکھائے اور جنت میں رکھا۔",
    englishContent: "Allah created Prophet Adam (AS), the first human and prophet, from clay and commanded the angels to prostrate in respect. All angels obeyed except Iblis, who showed pride. Allah taught Adam the names of all things.",
    moralLesson: "تکبر اور غرور سے ہمیشہ بچنا چاہیے، اور اللہ تعالیٰ کے ہر حکم کو خوشی سے ماننا چاہیے۔",
    ageGroup: "all",
    icon: "user",
  },
  {
    id: "story_nuh",
    title: "حضرت نوح علیہ السلام اور عظیم کشتی",
    titleArabic: "قصة سفينة نوح عليه السلام",
    category: "prophet_story",
    summary: "حضرت نوح علیہ السلام نے ساڑھے نو سو سال قوم کو توحید کی دعوت دی اور اللہ کے حکم سے پہاڑوں جیسی کشتی بنائی۔",
    arabicVerse: "وَاصْنَعِ الْفُلْكَ بِأَعْيُنِنَا وَوَحْيِنَا (هود: 37)",
    urduContent: "حضرت نوح علیہ السلام نے ساڑھے نو سو سال تک اپنی قوم کو ایک اللہ کی عبادت کی دعوت دی اور بتوں کی پوجا سے منع کیا۔ جب ظالموں نے انکار کیا تو اللہ تعالیٰ کے حکم سے حضرت نوح علیہ السلام نے ایک بہت بڑی کشتی تیار کی۔ کشتی میں ہر جانور کا جوڑا اور ایمان دار لوگ سوار ہوئے۔ پھر آسمان سے بارش اور زمین سے پانی کا طوفان امڈ آیا، جس سے نافرمان غرق ہو گئے اور کشتی میں موجود ایمان والے بچ گئے۔",
    englishContent: "Prophet Nuh (AS) called his people to worship Allah alone for 950 years. By Allah's divine instruction, he built a massive Ark, saving the believers and pairs of animals from the great flood.",
    moralLesson: "صبر، استقامت اور اللہ پر غیر متزلزل بھروسہ ہر مشکل طوفان سے انسان کو پار لگا دیتا ہے۔",
    ageGroup: "all",
    icon: "anchor",
  },
  {
    id: "story_ibrahim",
    title: "حضرت ابراہیمؑ اور نمرود کی آگ",
    titleArabic: "قصة الخليل إبراهيم عليه السلام ونار النمرود",
    category: "prophet_story",
    summary: "جب نمرود نے حضرت ابراہیم علیہ السلام کو دہکتی ہوئی آگ میں پھینکا تو اللہ کے حکم سے آگ گلزار بن گئی۔",
    arabicVerse: "قُلْنَا يَا نَارُ كُونِي بَرْدًا وَسَلَامًا عَلَىٰ إِبْرَاهِيمَ (الأنبياء: 69)",
    urduContent: "حضرت ابراہیم علیہ السلام نے اپنی قوم کے جھوٹے بتوں کو توڑ کر ثابت کیا کہ معبودِ برحق صرف اللہ ہے۔ ظالم بادشاہ نمرود نے آپ کو دہکتی ہوئی آگ میں ڈال دیا۔ لیکن حضرت ابراہیم علیہ السلام کا ایمان اتنا پختہ تھا کہ انہوں نے مدد کے لیے صرف اللہ کو پکارا: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ'۔ اللہ تعالیٰ نے آگ کو حکم دیا: 'اے آگ! ابراہیم پر ٹھنڈی اور سلامتی والی بن جا'۔ اور آگ خوبصورت باغ بن گئی۔",
    englishContent: "Prophet Ibrahim (AS) challenged the idolatry of his people. King Nimrod cast him into a blazing fire, but by Allah's command, the fire became cool and peaceful.",
    moralLesson: "اللہ تعالیٰ اپنے سچے بندوں کو کبھی تنہا نہیں چھوڑتا، اور توکل انسان کو ہر آزمائش میں سرخرو کرتا ہے۔",
    ageGroup: "all",
    icon: "shield",
  },
  {
    id: "story_pillars",
    title: "اسلام کے پانچ بنیادی ارکان",
    titleArabic: "أركان الإسلام الخمسة للأطفال",
    category: "islamic_pillar",
    summary: "اسلام ایک مضبوط عمارت کی طرح ہے جو پانچ بنیادی ستونوں پر قائم ہے۔",
    arabicVerse: "بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ (صحيح البخاري)",
    urduContent: "ہمارے پیارے نبی کریم ﷺ نے فرمایا کہ اسلام کی بنیاد پانچ چیزوں پر ہے:\n1. کلمۂ شہادت: اس بات کی گواہی دینا کہ اللہ کے سوا کوئی معبود نہیں اور محمد ﷺ اللہ کے رسول ہیں۔\n2. نماز قائم کرنا: روزانہ پانچ وقت وقت پر اللہ کے سامنے سجدہ ریز ہونا۔\n3. زکوٰۃ ادا کرنا: اپنے مال سے غریبوں اور مسکینوں کا حق ادا کرنا۔\n4. رمضان کے روزے رکھنا: پورا مہینہ صبح صادق سے مغرب تک اللہ کی رضا کے لیے بھوک پیاس برداشت کرنا۔\n5. بیت اللہ کا حج کرنا: استطاعت رکھنے والوں کا مکہ مکرمہ جا کر حج ادا کرنا۔",
    englishContent: "Islam is built on five pillars: Shahadah (Faith), Salah (Prayer), Zakat (Charity), Sawm (Fasting in Ramadan), and Hajj (Pilgrimage to Makkah).",
    moralLesson: "ان پانچ ارکان کی پابندی ہی ایک اچھے اور پکے مسلمان کی پہچان ہے۔",
    ageGroup: "all",
    icon: "layers",
  },
  {
    id: "story_manners",
    title: "کھانے پینے کے اسلامی مسنون آداب",
    titleArabic: "آداب الطعام والشراب النبوية",
    category: "moral_etiquette",
    summary: "رسول اللہ ﷺ کی وہ سنتیں جن پر عمل کرنے سے ہمارے کھانے میں برکت اور ثواب پیدا ہوتا ہے۔",
    arabicVerse: "سَمِّ اللَّهَ، وَكُلْ بِيَمِينِكَ، وَكُلْ مِمَّا يَلِیکَ (صحيح مسلم)",
    urduContent: "رسول اللہ ﷺ نے فرمایا کہ جب کھانا کھاؤ تو:\n1. کھانے سے پہلے ہاتھ اچھی طرح دھو لو۔\n2. شروع کرنے سے پہلے 'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ' پڑھو۔\n3. سیدھے (دائیں) ہاتھ سے اور اپنے سامنے سے کھاؤ۔\n4. کھانا بیٹھ کر اور ٹیک لگائے بغیر کھاؤ۔\n5. کھانے کے بعد انگلیاں اور برتن صاف کرو اور اللہ کا شکر ادا کرتے ہوئے دعا پڑھو: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ'۔",
    englishContent: "The Prophet (ﷺ) taught us to wash hands before eating, say Bismillah, eat with the right hand from what is directly before us, and thank Allah after finishing.",
    moralLesson: "ہر عمل میں پیارے نبی ﷺ کی سنت پر عمل کرنا زندگی کو خوبصورت اور بابرکت بناتا ہے۔",
    ageGroup: "all",
    icon: "heart",
  },
];

const QUIZ_QUESTIONS: Record<string, { question: string; options: string[]; answerIndex: number }> = {
  story_adam: {
    question: "اللہ تعالیٰ نے فرشتوں کے سامنے سب سے پہلے کس کو تمام چیزوں کے نام سکھائے؟",
    options: ["حضرت آدمؑ کو", "فرشتوں کو", "ابلیس کو"],
    answerIndex: 0,
  },
  story_nuh: {
    question: "حضرت نوح علیہ السلام نے اپنی قوم کو کتنے سال تک توحید کی دعوت دی؟",
    options: ["100 سال", "500 سال", "950 سال"],
    answerIndex: 2,
  },
  story_ibrahim: {
    question: "حضرت ابراہیمؑ نے نمرود کی آگ میں ڈالے جانے کے وقت کیا پڑھا؟",
    options: ["حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", "سُبْحَانَ اللَّهِ", "لا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ"],
    answerIndex: 0,
  },
  story_pillars: {
    question: "اسلام کے کتنے بنیادی ارکان ہیں؟",
    options: ["3 ارکان", "5 ارکان", "7 ارکان"],
    answerIndex: 1,
  },
  story_manners: {
    question: "کھانا شروع کرنے سے پہلے کون سا عمل سنت ہے؟",
    options: ["ہاتھ دھونا اور بسم اللہ پڑھنا", "پانی پینا", "کھڑے ہونا"],
    answerIndex: 0,
  },
};

export default function KidsCornerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [stories, setStories] = useState<StoryItem[]>(DEFAULT_STORIES);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeStory, setActiveStory] = useState<StoryItem | null>(DEFAULT_STORIES[0]);
  const [stars, setStars] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/community/kids");
        if (res.ok) {
          const data = await res.json();
          if (data.stories && data.stories.length > 0) {
            setStories(data.stories);
            setActiveStory(data.stories[0]);
          }
        }
      } catch {}
      finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelectStory = (story: StoryItem) => {
    setActiveStory(story);
    setSelectedQuizAnswer(null);
    setQuizAnswered(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAnswerQuiz = (index: number) => {
    if (quizAnswered || !activeStory) return;
    setSelectedQuizAnswer(index);
    setQuizAnswered(true);

    const quiz = QUIZ_QUESTIONS[activeStory.id];
    if (quiz && index === quiz.answerIndex) {
      setStars((prev) => prev + 1);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  };

  const categories = [
    { id: "all", label: "تمام اسباق (All)", icon: "star" },
    { id: "prophet_story", label: "قصص الانبیاء", icon: "book-open" },
    { id: "islamic_pillar", label: "ارکانِ اسلام", icon: "layers" },
    { id: "moral_etiquette", label: "مسنون آداب", icon: "heart" },
  ];

  const filtered = stories.filter(
    (s) => selectedCategory === "all" || s.category === selectedCategory
  );

  const currentQuiz = activeStory ? QUIZ_QUESTIONS[activeStory.id] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), backgroundColor: colors.navy }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Kids Islamic Corner</Text>
          <Text style={styles.headerSubtitle}>مکتبِ اطفال و قصص الانبیاء</Text>
        </View>
        <View style={styles.starBadge}>
          <Text style={styles.starIcon}>⭐</Text>
          <Text style={styles.starCount}>{stars}</Text>
        </View>
      </View>

      {/* Category Pills */}
      <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((c) => {
            const active = selectedCategory === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCategory(c.id)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: active ? colors.gold : colors.background,
                    borderColor: active ? colors.gold : colors.border,
                  },
                ]}
              >
                <Feather name={c.icon as any} size={13} color={active ? "#000" : colors.mutedForeground} />
                <Text style={[styles.categoryText, { color: active ? "#000" : colors.mutedForeground }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Story Selector Carousel */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>کہانی منتخب کریں (Choose a Story):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
          {filtered.map((s) => {
            const isSelected = activeStory?.id === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => handleSelectStory(s)}
                style={[
                  styles.storyCard,
                  {
                    backgroundColor: isSelected ? colors.primary + "18" : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.storyIconWrap,
                    { backgroundColor: isSelected ? colors.primary : colors.background },
                  ]}
                >
                  <Feather name="book" size={18} color={isSelected ? "#FFF" : colors.primary} />
                </View>
                <Text
                  numberOfLines={2}
                  style={[styles.storyCardTitle, { color: isSelected ? colors.primary : colors.foreground }]}
                >
                  {s.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Story Reader */}
        {activeStory && (
          <View style={[styles.readerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.readerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.readerTitle, { color: colors.foreground }]}>{activeStory.title}</Text>
                {activeStory.titleArabic && (
                  <Text style={[styles.readerArabicTitle, { color: colors.gold }]}>
                    {activeStory.titleArabic}
                  </Text>
                )}
              </View>
              <View style={[styles.ageBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.ageBadgeText, { color: colors.primary }]}>بچوں کے لیے</Text>
              </View>
            </View>

            {/* Arabic Highlight */}
            {activeStory.arabicVerse && (
              <View style={[styles.verseBox, { backgroundColor: colors.background, borderColor: colors.gold + "40" }]}>
                <Text style={[styles.verseText, { color: colors.gold }]}>{activeStory.arabicVerse}</Text>
              </View>
            )}

            {/* Urdu Story Content */}
            <Text style={[styles.storyText, { color: colors.foreground }]}>
              {activeStory.urduContent}
            </Text>

            {/* Moral Takeaway */}
            <View style={[styles.moralBox, { backgroundColor: "#10B98115", borderColor: "#10B98140" }]}>
              <View style={styles.moralHeader}>
                <Feather name="award" size={16} color="#10B981" />
                <Text style={styles.moralTitle}>سبق آموز نتیجہ (Moral of the Story):</Text>
              </View>
              <Text style={styles.moralText}>{activeStory.moralLesson}</Text>
            </View>

            {/* Quiz / Learning Challenge */}
            {currentQuiz && (
              <View style={[styles.quizBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.quizHeader}>
                  <Text style={styles.quizIcon}>🎯</Text>
                  <Text style={[styles.quizTitle, { color: colors.foreground }]}>سیکھنے کا جائزہ (Mini Quiz):</Text>
                </View>
                <Text style={[styles.quizQuestion, { color: colors.foreground }]}>
                  {currentQuiz.question}
                </Text>

                <View style={styles.quizOptions}>
                  {currentQuiz.options.map((opt, idx) => {
                    const isSelected = selectedQuizAnswer === idx;
                    const isCorrect = idx === currentQuiz.answerIndex;
                    let btnBg = colors.card;
                    let btnBorder = colors.border;
                    let textColor = colors.foreground;

                    if (quizAnswered) {
                      if (isCorrect) {
                        btnBg = "#10B98125";
                        btnBorder = "#10B981";
                        textColor = "#10B981";
                      } else if (isSelected && !isCorrect) {
                        btnBg = "#EF444425";
                        btnBorder = "#EF4444";
                        textColor = "#EF4444";
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        disabled={quizAnswered}
                        onPress={() => handleAnswerQuiz(idx)}
                        style={[
                          styles.quizOptionBtn,
                          { backgroundColor: btnBg, borderColor: btnBorder },
                        ]}
                      >
                        <Text style={[styles.quizOptionText, { color: textColor }]}>
                          {opt}
                        </Text>
                        {quizAnswered && isCorrect && (
                          <Feather name="check-circle" size={16} color="#10B981" />
                        )}
                        {quizAnswered && isSelected && !isCorrect && (
                          <Feather name="x-circle" size={16} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {quizAnswered && (
                  <View style={styles.quizFeedback}>
                    {selectedQuizAnswer === currentQuiz.answerIndex ? (
                      <Text style={[styles.feedbackText, { color: "#10B981" }]}>
                        ماشاء اللہ! بالکل درست جواب ⭐ آپ کو 1 ستارہ ملا!
                      </Text>
                    ) : (
                      <Text style={[styles.feedbackText, { color: "#EF4444" }]}>
                        دوبارہ کوشش کریں! کہانی کو دوبارہ غور سے پڑھیں۔
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  headerSubtitle: { fontSize: 12, color: "#FFFFFF90", marginTop: 2 },
  starBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF20",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  starIcon: { fontSize: 14 },
  starCount: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  filterBar: {
    padding: 12,
    borderBottomWidth: 1,
  },
  categoryScroll: { gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: { fontSize: 12, fontWeight: "600" },
  scrollContent: { padding: 16, gap: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  storiesScroll: { gap: 10, paddingVertical: 4 },
  storyCard: {
    width: 140,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  storyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  storyCardTitle: { fontSize: 12, fontWeight: "600", textAlign: "center", lineHeight: 16 },
  readerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  readerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  readerTitle: { fontSize: 17, fontWeight: "700" },
  readerArabicTitle: { fontSize: 13, marginTop: 4, fontFamily: Platform.OS === "ios" ? "Geeza Pro" : "sans-serif" },
  ageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ageBadgeText: { fontSize: 11, fontWeight: "700" },
  verseBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  verseText: { fontSize: 15, textAlign: "center", lineHeight: 24, fontFamily: Platform.OS === "ios" ? "Geeza Pro" : "sans-serif" },
  storyText: { fontSize: 14, lineHeight: 24 },
  moralBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  moralHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  moralTitle: { color: "#10B981", fontSize: 13, fontWeight: "700" },
  moralText: { color: "#10B981", fontSize: 13, lineHeight: 20 },
  quizBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  quizHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  quizIcon: { fontSize: 16 },
  quizTitle: { fontSize: 13, fontWeight: "700" },
  quizQuestion: { fontSize: 13, fontWeight: "600", lineHeight: 20 },
  quizOptions: { gap: 8 },
  quizOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  quizOptionText: { fontSize: 13, fontWeight: "500", flex: 1 },
  quizFeedback: { marginTop: 4, alignItems: "center" },
  feedbackText: { fontSize: 12, fontWeight: "700" },
});
