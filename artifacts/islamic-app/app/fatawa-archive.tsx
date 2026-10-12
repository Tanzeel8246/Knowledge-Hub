import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface FatwaItem {
  id: string;
  questionUrdu: string;
  category: "taharah" | "salah" | "zakat" | "sawm" | "muamalat" | "modern";
  categoryLabel: string;
  answerUrdu: string;
  ruling: "فرض" | "واجب" | "سنت" | "مستحب" | "مکروہ" | "حرام" | "جائز";
  sourceDarulIfta: string;
  mufti: string;
  references: string;
}

const FATAWA_DATABASE: FatwaItem[] = [
  {
    id: "f1",
    questionUrdu: "اگر وضو کے دوران جرابوں (Socks) پر مسح کرنا ہو تو شرعی حکم کیا ہے؟",
    category: "taharah",
    categoryLabel: "طہارت و وضو",
    ruling: "جائز",
    answerUrdu: "چمڑے کے موزوں (خفین) پر مسح بالاتفاق جائز ہے۔ عام سوتی یا اونی جرابوں پر مسح کرنا احناف کے نزدیک جائز نہیں ہے۔ البتہ اگر جرابیں اتنی موٹی اور مضبوط ہوں کہ پانی نہ چھانے اور بغیر باندھے پنڈلی پر کھڑی رہیں (جیسے خاص فقہی شرائط والی جرابیں) تو مسح درست ہے۔ عام پتلی جرابوں پر پاؤں دھونا ہی فرض ہے۔",
    sourceDarulIfta: "دار العلوم دیوبند / جامعہ بنوری ٹاؤن",
    mufti: "مفتی محمد شفیع عثمانیؒ / فتاویٰ عثمانی",
    references: "رد المحتار (شامی) ۱/ ۲۶۹، الفتاویٰ الہندیۃ ۱/ ۳۲",
  },
  {
    id: "f2",
    questionUrdu: "جماعت کی نماز میں امام کے پیچھے سورۃ الفاتحہ پڑھنے کا حنفی مسلک میں کیا حکم ہے؟",
    category: "salah",
    categoryLabel: "نماز و جماعت",
    ruling: "مکروہ",
    answerUrdu: "احناف کے نزدیک مقتدی کے لیے امام کے پیچھے قرات (فاتحہ یا سورت) کرنا مکروہ تحریمی ہے، خواہ نماز سری (ظہر، عصر) ہو یا جہری (فجر، مغرب، عشاء)۔ مقتدی کا وظیفہ خاموش رہنا اور امام کی قرات سننا ہے۔ حدیث پاک میں ارشاد ہے: 'جس کا امام ہو تو امام کی قرات ہی اس کی قرات ہے'۔",
    sourceDarulIfta: "دار العلوم دیوبند",
    mufti: "مفتی عزیز الرحمن عثمانیؒ (فتاویٰ دار العلوم ۱/ ۱۲۴)",
    references: "سنن ابن ماجہ (۸۵۰)، اعلاء السنن ۲/ ۶۸",
  },
  {
    id: "f3",
    questionUrdu: "ڈیجیٹل کرنسی (کرپٹو کرنسی / بٹ کوائن) کی خرید و فروخت کا شرعی حکم کیا ہے؟",
    category: "modern",
    categoryLabel: "جدید فقہی مسائل",
    ruling: "حرام",
    answerUrdu: "جمہور علمائے دیوبند اور دار الافتاء کے متفقہ فیصلے کے مطابق ڈیجیٹل و کرپٹو کرنسیز فی الوقت صرف فرضی ڈیجیٹل کوڈز ہیں جن کے پیچھے کوئی حقیقی مال یا حکومتی ضمانت نہیں ہے، اور ان میں شدید قمار (جوا) اور غرر (دھوکہ) پایا جاتا ہے؛ لہٰذا اس کی تجارت یا سرمایہ کاری سے احتراز لازم ہے۔",
    sourceDarulIfta: "جامعہ علوم اسلامیہ علامہ بنوری ٹاؤن کراچی",
    mufti: "دار الافتاء بنوری ٹاؤن (فتویٰ نمبر: ۱۴۴۲۱۰۰۲۱۴۶۴)",
    references: "بحوث فی قضایا فقہیۃ معاصرۃ، فتاویٰ بینات",
  },
  {
    id: "f4",
    questionUrdu: "پراویڈنٹ فنڈ (PF) پر ملنے والے اضافی منافع کا کیا حکم ہے؟",
    category: "muamalat",
    categoryLabel: "معاملات و معاشیات",
    ruling: "جائز",
    answerUrdu: "اگر جی پی فنڈ (GP Fund) لازمی اور جبری طور پر تنخواہ سے کاٹا جاتا ہو تو ریٹائرمنٹ پر ملنے والا کل اضافی فنڈ ملازم کے لیے حلال ہے کیونکہ حکومت یا ادارہ اپنی ملکیت سے تبرع و انعام کے طور پر دیتا ہے۔ البتہ اگر اختیاری کٹوتی ہو تو اضافی رقم سود کے مشابہ ہونے کی بنا پر ثواب کی نیت کے بغیر صدقہ کرنا احوط ہے۔",
    sourceDarulIfta: "دار العلوم کراچی",
    mufti: "مفتی تقی عثمانی مدظلہ (فتاویٰ عثمانی ۳/ ۲۴۸)",
    references: "احکام الاوراق النقدیۃ، تکملہ فتح الملہم ۱/ ۵۸۰",
  },
  {
    id: "f5",
    questionUrdu: "کیا سحری کا وقت ختم ہونے کے بعد نیت کیے بغیر روزہ ہو جاتا ہے؟",
    category: "sawm",
    categoryLabel: "روزہ و اعتکاف",
    ruling: "جائز",
    answerUrdu: "رمضان المبارک کے فرض روزے میں اگر رات کو یا سحری کے وقت نیت نہ کی ہو تو نصف النہار شرعی (زوال سے تقریباً ڈیڑھ گھنٹہ قبل) تک نیت کرنے سے بھی روزہ صحیح ادا ہو جاتا ہے، بشرطیکہ صبح صادق کے بعد کھانے پینے یا جماع سے احتراز کیا ہو۔ البتہ قضا اور کفارے کے روزے میں رات سے نیت کرنا لازمی ہے۔",
    sourceDarulIfta: "دار العلوم دیوبند",
    mufti: "فتاویٰ رحیمیہ ۷/ ۲۵۲",
    references: "در مختار مع الشامی ۲/ ۳۷۷، الہدایۃ ۱/ ۱۱۷",
  },
  {
    id: "f6",
    questionUrdu: "زیورات پر زکوٰۃ کا وجوب: کیا زیرِ استعمال سونے پر بھی زکوٰۃ واجب ہے؟",
    category: "zakat",
    categoryLabel: "زکوٰۃ و صدقات",
    ruling: "فرض",
    answerUrdu: "احناف کے نزدیک سونے اور چاندی کے زیورات پر مطلقاً زکوٰۃ فرض ہے، خواہ وہ پہننے کے استعمال میں ہوں یا الماری میں بطور بچت رکھے ہوں۔ اگر سونے کا وزن ساڑھے سات تولے یا دیگر اموال ملا کر ساڑھے باون تولے چاندی کی قیمت بنتی ہو تو سال پورا ہونے پر ڈھائی فیصد زکوٰۃ ادا کرنا فرض ہے۔",
    sourceDarulIfta: "جامعہ دار العلوم کراچی / دار العلوم دیوبند",
    mufti: "مفتی محمد شفیعؒ / امداد الفتاویٰ",
    references: "سنن ابی داود (۱۵۶۳)، اعلاء السنن ۹/ ۴۵",
  },
];

export default function FatawaArchiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>("f1");

  const categories = [
    { id: "all", label: "تمام فتاویٰ" },
    { id: "salah", label: "نماز و امامت" },
    { id: "taharah", label: "طہارت و وضو" },
    { id: "zakat", label: "زکوٰۃ و صدقات" },
    { id: "sawm", label: "روزہ و اعتکاف" },
    { id: "muamalat", label: "معاملات و تجارت" },
    { id: "modern", label: "جدید فقہی مسائل" },
  ];

  const filtered = useMemo(() => {
    return FATAWA_DATABASE.filter((f) => {
      const matchCat = selectedCat === "all" || f.category === selectedCat;
      const matchSearch =
        f.questionUrdu.includes(search) ||
        f.answerUrdu.includes(search) ||
        f.sourceDarulIfta.includes(search);
      return matchCat && matchSearch;
    });
  }, [search, selectedCat]);

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), backgroundColor: colors.navy }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>مجموعۂ فتاویٰ احناف</Text>
          <Text style={s.headerSub}>Hanafi Fatawa & Legal Rulings Archive</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Search Input */}
      <View style={[s.searchBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          placeholder="مسئلہ، سوال یا فتویٰ تلاش کریں..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          style={[s.searchInput, { color: colors.foreground }]}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={[s.catBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setSelectedCat(c.id)}
              style={[
                s.catChip,
                {
                  backgroundColor: selectedCat === c.id ? colors.primary : colors.background,
                  borderColor: selectedCat === c.id ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[s.catChipText, { color: selectedCat === c.id ? "#FFF" : colors.mutedForeground }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Fatawa List */}
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={[s.countBadge, { color: colors.mutedForeground }]}>
          دستیاب مصدقہ فتاویٰ: {filtered.length} مسائل
        </Text>

        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <View key={item.id} style={[s.fatwaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Question Row */}
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                style={s.cardHeader}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <View style={[s.rulingBadge, { backgroundColor: item.ruling === "حرام" || item.ruling === "مکروہ" ? "#EF444420" : "#22C55E20" }]}>
                      <Text style={[s.rulingText, { color: item.ruling === "حرام" || item.ruling === "مکروہ" ? "#EF4444" : "#22C55E" }]}>
                        {item.ruling}
                      </Text>
                    </View>
                    <Text style={[s.catLabel, { color: colors.primary }]}>{item.categoryLabel}</Text>
                  </View>
                  <Text style={[s.questionText, { color: colors.foreground }]}>{item.questionUrdu}</Text>
                </View>
                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={colors.mutedForeground} />
              </TouchableOpacity>

              {/* Answer Body */}
              {isExpanded && (
                <View style={[s.cardBody, { borderTopColor: colors.border }]}>
                  <Text style={[s.answerTitle, { color: colors.primary }]}>الجواب وباللہ التوفیق:</Text>
                  <Text style={[s.answerText, { color: colors.foreground }]}>{item.answerUrdu}</Text>

                  {/* References & Authority */}
                  <View style={[s.metaBox, { backgroundColor: colors.muted + "25", borderColor: colors.border }]}>
                    <View style={s.metaRow}>
                      <Feather name="shield" size={13} color={colors.gold} />
                      <Text style={[s.metaLabel, { color: colors.mutedForeground }]}>مرجع و دار الافتاء:</Text>
                      <Text style={[s.metaVal, { color: colors.foreground }]}>{item.sourceDarulIfta}</Text>
                    </View>
                    <View style={s.metaRow}>
                      <Feather name="user-check" size={13} color={colors.primary} />
                      <Text style={[s.metaLabel, { color: colors.mutedForeground }]}>مفتی / مصنف:</Text>
                      <Text style={[s.metaVal, { color: colors.foreground }]}>{item.mufti}</Text>
                    </View>
                    <View style={s.metaRow}>
                      <Feather name="book-open" size={13} color="#0891B2" />
                      <Text style={[s.metaLabel, { color: colors.mutedForeground }]}>حوالہ کتب فقہ:</Text>
                      <Text style={[s.metaVal, { color: colors.foreground }]}>{item.references}</Text>
                    </View>
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
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14 },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    headerCenter: { alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
    headerSub: { fontSize: 11, color: "#FFFFFF80" },
    searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, height: 44, borderBottomWidth: 1, gap: 8 },
    searchInput: { flex: 1, fontSize: 13, textAlign: "right" },
    catBar: { borderBottomWidth: 1, paddingVertical: 8 },
    catScroll: { paddingHorizontal: 14, gap: 8 },
    catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    catChipText: { fontSize: 12, fontWeight: "600" },
    content: { padding: 14, gap: 12 },
    countBadge: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
    fatwaCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
    cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
    rulingBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    rulingText: { fontSize: 11, fontWeight: "700" },
    catLabel: { fontSize: 11, fontWeight: "600" },
    questionText: { fontSize: 14, fontWeight: "700", lineHeight: 22, textAlign: "right" },
    cardBody: { padding: 14, borderTopWidth: 1, gap: 10 },
    answerTitle: { fontSize: 13, fontWeight: "700", textAlign: "right" },
    answerText: { fontSize: 13, lineHeight: 22, textAlign: "right" },
    metaBox: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 6, marginTop: 4 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    metaLabel: { fontSize: 11, fontWeight: "600" },
    metaVal: { fontSize: 11, fontWeight: "700" },
  });
}
