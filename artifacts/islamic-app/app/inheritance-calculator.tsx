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
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface HeirShare {
  heir: string;
  heirUrdu: string;
  heirArabic: string;
  count: number;
  fractionLabel: string;
  sharePercentage: number;
  amount: number;
  eachAmount: number;
  quranicEvidence: string;
}

export default function InheritanceCalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [totalEstate, setTotalEstate] = useState("1000000");
  const [currency, setCurrency] = useState("PKR");
  const [deceasedGender, setDeceasedGender] = useState<"male" | "female">("male");
  const [wivesCount, setWivesCount] = useState(1);
  const [hasHusband, setHasHusband] = useState(false);
  const [sonsCount, setSonsCount] = useState(2);
  const [daughtersCount, setDaughtersCount] = useState(1);
  const [hasFather, setHasFather] = useState(true);
  const [hasMother, setHasMother] = useState(true);

  // Local Shariah calculation for instant offline response
  const calculation = useMemo(() => {
    const estate = parseFloat(totalEstate) || 0;
    if (estate <= 0) return null;

    const shares: HeirShare[] = [];
    let allocatedFraction = 0;
    const hasChildren = sonsCount > 0 || daughtersCount > 0;

    // 1. Spouses
    if (deceasedGender === "male" && wivesCount > 0) {
      const fraction = hasChildren ? 1 / 8 : 1 / 4;
      allocatedFraction += fraction;
      shares.push({
        heir: wivesCount === 1 ? "Wife" : "Wives",
        heirUrdu: wivesCount === 1 ? "زوجہ (بیوہ)" : `زوجات (${wivesCount} بیوائیں)`,
        heirArabic: wivesCount === 1 ? "الزوجة" : "الزوجات",
        count: wivesCount,
        fractionLabel: hasChildren ? "1/8 (ثمن)" : "1/4 (ربع)",
        sharePercentage: fraction * 100,
        amount: estate * fraction,
        eachAmount: (estate * fraction) / wivesCount,
        quranicEvidence: "النساء: 12 (فَإِن كَانَ لَكُمْ وَلَدٌ فَلَهُنَّ الثُّمُنُ)",
      });
    } else if (deceasedGender === "female" && hasHusband) {
      const fraction = hasChildren ? 1 / 4 : 1 / 2;
      allocatedFraction += fraction;
      shares.push({
        heir: "Husband",
        heirUrdu: "شوہر (زوج)",
        heirArabic: "الزوج",
        count: 1,
        fractionLabel: hasChildren ? "1/4 (ربع)" : "1/2 (نصف)",
        sharePercentage: fraction * 100,
        amount: estate * fraction,
        eachAmount: estate * fraction,
        quranicEvidence: "النساء: 12 (فَإِن كَانَ لَهُنَّ وَلَدٌ فَلَكُمُ الرُّبُعُ)",
      });
    }

    // 2. Mother
    if (hasMother) {
      const fraction = hasChildren ? 1 / 6 : 1 / 3;
      allocatedFraction += fraction;
      shares.push({
        heir: "Mother",
        heirUrdu: "والدہ (ماں)",
        heirArabic: "الأم",
        count: 1,
        fractionLabel: hasChildren ? "1/6 (سدس)" : "1/3 (ثلث)",
        sharePercentage: fraction * 100,
        amount: estate * fraction,
        eachAmount: estate * fraction,
        quranicEvidence: "النساء: 11 (وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ)",
      });
    }

    // 3. Father
    if (hasFather) {
      if (sonsCount > 0) {
        const fraction = 1 / 6;
        allocatedFraction += fraction;
        shares.push({
          heir: "Father",
          heirUrdu: "والد (باپ)",
          heirArabic: "الأب",
          count: 1,
          fractionLabel: "1/6 (سدس فرضا)",
          sharePercentage: fraction * 100,
          amount: estate * fraction,
          eachAmount: estate * fraction,
          quranicEvidence: "النساء: 11 (وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ)",
        });
      } else if (daughtersCount > 0 && sonsCount === 0) {
        const fraction = 1 / 6;
        allocatedFraction += fraction;
        shares.push({
          heir: "Father",
          heirUrdu: "والد (باپ)",
          heirArabic: "الأب",
          count: 1,
          fractionLabel: "1/6 فرضا + الباقی عصبۃ",
          sharePercentage: fraction * 100,
          amount: estate * fraction,
          eachAmount: estate * fraction,
          quranicEvidence: "النساء: 11 مع إجماع الصحابة",
        });
      }
    }

    // 4. Daughters alone without Sons
    if (sonsCount === 0 && daughtersCount > 0) {
      const fraction = daughtersCount === 1 ? 1 / 2 : 2 / 3;
      allocatedFraction += fraction;
      shares.push({
        heir: daughtersCount === 1 ? "Daughter" : "Daughters",
        heirUrdu: daughtersCount === 1 ? "اکلوتی بیٹی" : `${daughtersCount} بیٹیاں`,
        heirArabic: daughtersCount === 1 ? "البنت" : "البنات",
        count: daughtersCount,
        fractionLabel: daughtersCount === 1 ? "1/2 (نصف)" : "2/3 (ثلثان)",
        sharePercentage: fraction * 100,
        amount: estate * fraction,
        eachAmount: (estate * fraction) / daughtersCount,
        quranicEvidence: "النساء: 11 (فَإِن كَانَتْ وَاحِدَةً فَلَهَا النِّصْفُ)",
      });
    }

    // 5. Residuary ('Asabah)
    const remainderFraction = Math.max(0, 1 - allocatedFraction);
    if (sonsCount > 0) {
      const sonShares = sonsCount * 2;
      const daughterShares = daughtersCount * 1;
      const totalUnits = sonShares + daughterShares;

      const sonPortion = remainderFraction * (sonShares / totalUnits);
      const daughterPortion = remainderFraction * (daughterShares / totalUnits);

      shares.push({
        heir: sonsCount === 1 ? "Son" : "Sons",
        heirUrdu: sonsCount === 1 ? "بیٹا (عصبۃ)" : `${sonsCount} بیٹے (عصبۃ)`,
        heirArabic: sonsCount === 1 ? "الابن" : "الأبناء",
        count: sonsCount,
        fractionLabel: "عصبۃ بالغیر (2 حصے فی لڑکا)",
        sharePercentage: sonPortion * 100,
        amount: estate * sonPortion,
        eachAmount: (estate * sonPortion) / sonsCount,
        quranicEvidence: "النساء: 11 (لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ)",
      });

      if (daughtersCount > 0) {
        shares.push({
          heir: daughtersCount === 1 ? "Daughter" : "Daughters",
          heirUrdu: daughtersCount === 1 ? "بیٹی (مع بھائی عصبۃ)" : `${daughtersCount} بیٹیاں (مع بھائی عصبۃ)`,
          heirArabic: daughtersCount === 1 ? "البنت" : "البنات",
          count: daughtersCount,
          fractionLabel: "عصبۃ بالغیر (1 حصہ فی لڑکی)",
          sharePercentage: daughterPortion * 100,
          amount: estate * daughterPortion,
          eachAmount: (estate * daughterPortion) / daughtersCount,
          quranicEvidence: "النساء: 11 (لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ)",
        });
      }
    } else if (hasFather && sonsCount === 0) {
      const fatherExisting = shares.find(s => s.heir === "Father");
      if (fatherExisting) {
        fatherExisting.amount += estate * remainderFraction;
        fatherExisting.eachAmount = fatherExisting.amount;
        fatherExisting.sharePercentage += remainderFraction * 100;
      } else {
        shares.push({
          heir: "Father",
          heirUrdu: "والد (عصبہ محض)",
          heirArabic: "الأب",
          count: 1,
          fractionLabel: "عصبہ محض (تمام باقی ماندہ)",
          sharePercentage: remainderFraction * 100,
          amount: estate * remainderFraction,
          eachAmount: estate * remainderFraction,
          quranicEvidence: "الحديث: (أَلْحِقُوا الفَرائِضَ بأَهْلِها...)",
        });
      }
    }

    return shares;
  }, [totalEstate, deceasedGender, wivesCount, hasHusband, sonsCount, daughtersCount, hasFather, hasMother]);

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>علم المواریث</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Islamic Inheritance Calculator</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Ayat Banner */}
        <View style={[s.banner, { backgroundColor: colors.navy }]}>
          <Text style={s.bannerArabic}>لِّلرِّجَالِ نَصِيبٌ مِّمَّا تَرَكَ الْوَالِدَانِ وَالْأَقْرَبُونَ</Text>
          <Text style={[s.bannerSub, { color: colors.gold }]}>For men is a share of what parents and close relatives leave — An-Nisa 4:7</Text>
        </View>

        {/* Estate & Currency */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>ترکہ کی مالیت اور کرنسی</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { color: colors.mutedForeground }]}>کل قابل تقسیم ترکہ (Net Estate)</Text>
              <TextInput
                style={[s.input, { color: colors.foreground, borderColor: colors.border }]}
                keyboardType="numeric"
                value={totalEstate}
                onChangeText={setTotalEstate}
                placeholder="1000000"
              />
            </View>
            <View style={{ width: 100 }}>
              <Text style={[s.label, { color: colors.mutedForeground }]}>کرنسی</Text>
              <View style={s.currencyPicker}>
                {["PKR", "USD", "SAR", "AED"].map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCurrency(c)}
                    style={[s.currBtn, { backgroundColor: currency === c ? colors.primary : colors.muted }]}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "700", color: currency === c ? "#FFF" : colors.mutedForeground }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Deceased Gender */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>میت کی تفصیلات</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 12 }]}>
          <Text style={[s.label, { color: colors.mutedForeground, marginBottom: 8 }]}>میت کی جنس (Deceased was):</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setDeceasedGender("male")}
              style={[s.genderBtn, { backgroundColor: deceasedGender === "male" ? colors.primary : colors.muted }]}
            >
              <Text style={{ fontWeight: "700", color: deceasedGender === "male" ? "#FFF" : colors.foreground }}>مرحوم شوہر / باپ (مرد)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDeceasedGender("female")}
              style={[s.genderBtn, { backgroundColor: deceasedGender === "female" ? colors.primary : colors.muted }]}
            >
              <Text style={{ fontWeight: "700", color: deceasedGender === "female" ? "#FFF" : colors.foreground }}>مرحومہ بیوی / ماں (عورت)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Heirs Input */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>زندہ ورثاء کا انتخاب</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 14, gap: 14 }]}>
          {deceasedGender === "male" ? (
            <View style={s.counterRow}>
              <Text style={[s.counterLabel, { color: colors.foreground }]}>بیواؤں کی تعداد (Wives):</Text>
              <View style={s.counterControls}>
                <TouchableOpacity onPress={() => setWivesCount(Math.max(0, wivesCount - 1))} style={s.countBtn}>
                  <Text style={s.countBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={[s.countVal, { color: colors.foreground }]}>{wivesCount}</Text>
                <TouchableOpacity onPress={() => setWivesCount(Math.min(4, wivesCount + 1))} style={s.countBtn}>
                  <Text style={s.countBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setHasHusband(!hasHusband)}
              style={s.toggleRow}
            >
              <Text style={[s.counterLabel, { color: colors.foreground }]}>شوہر حیات ہے؟ (Husband alive)</Text>
              <View style={[s.checkbox, { backgroundColor: hasHusband ? colors.primary : "transparent", borderColor: colors.border }]}>
                {hasHusband && <Feather name="check" size={14} color="#FFF" />}
              </View>
            </TouchableOpacity>
          )}

          <View style={s.counterRow}>
            <Text style={[s.counterLabel, { color: colors.foreground }]}>بیٹوں کی تعداد (Sons):</Text>
            <View style={s.counterControls}>
              <TouchableOpacity onPress={() => setSonsCount(Math.max(0, sonsCount - 1))} style={s.countBtn}>
                <Text style={s.countBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={[s.countVal, { color: colors.foreground }]}>{sonsCount}</Text>
              <TouchableOpacity onPress={() => setSonsCount(sonsCount + 1)} style={s.countBtn}>
                <Text style={s.countBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.counterRow}>
            <Text style={[s.counterLabel, { color: colors.foreground }]}>بیٹیوں کی تعداد (Daughters):</Text>
            <View style={s.counterControls}>
              <TouchableOpacity onPress={() => setDaughtersCount(Math.max(0, daughtersCount - 1))} style={s.countBtn}>
                <Text style={s.countBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={[s.countVal, { color: colors.foreground }]}>{daughtersCount}</Text>
              <TouchableOpacity onPress={() => setDaughtersCount(daughtersCount + 1)} style={s.countBtn}>
                <Text style={s.countBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            <TouchableOpacity onPress={() => setHasFather(!hasFather)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[s.checkbox, { backgroundColor: hasFather ? colors.primary : "transparent", borderColor: colors.border }]}>
                {hasFather && <Feather name="check" size={14} color="#FFF" />}
              </View>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>والد حیات ہیں</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setHasMother(!hasMother)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[s.checkbox, { backgroundColor: hasMother ? colors.primary : "transparent", borderColor: colors.border }]}>
                {hasMother && <Feather name="check" size={14} color="#FFF" />}
              </View>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>والدہ حیات ہیں</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>شرعی حصص کی تقسیم (SHARIAH SHARES)</Text>
        {!calculation || calculation.length === 0 ? (
          <View style={[s.card, { padding: 20, alignItems: "center", borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={{ color: colors.mutedForeground }}>براہ کرم ترکہ کی رقم اور ورثاء کا درست اندراج فرمائیں</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {calculation.map((share, idx) => (
              <View key={idx} style={[s.shareCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View>
                    <Text style={[s.shareTitle, { color: colors.foreground }]}>{share.heirUrdu}</Text>
                    <Text style={[s.shareSub, { color: colors.mutedForeground }]}>{share.heirArabic} ({share.heir})</Text>
                  </View>
                  <View style={[s.fractionBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[s.fractionText, { color: colors.primary }]}>{share.fractionLabel}</Text>
                  </View>
                </View>

                <View style={[s.shareStats, { borderTopColor: colors.border }]}>
                  <View>
                    <Text style={[s.statLabel, { color: colors.mutedForeground }]}>حصہ فیصد</Text>
                    <Text style={[s.statVal, { color: colors.foreground }]}>{share.sharePercentage.toFixed(2)}%</Text>
                  </View>
                  {share.count > 1 && (
                    <View>
                      <Text style={[s.statLabel, { color: colors.mutedForeground }]}>فی کس رقم ({currency})</Text>
                      <Text style={[s.statVal, { color: colors.foreground }]}>{Math.round(share.eachAmount).toLocaleString()}</Text>
                    </View>
                  )}
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s.statLabel, { color: colors.mutedForeground }]}>کل رقم ({currency})</Text>
                    <Text style={[s.statValBold, { color: colors.primary }]}>{Math.round(share.amount).toLocaleString()}</Text>
                  </View>
                </View>

                <View style={[s.evidenceBox, { backgroundColor: colors.navy + "0A" }]}>
                  <Text style={[s.evidenceText, { color: colors.mutedForeground }]}>
                    <Text style={{ fontWeight: "700" }}>دلیل: </Text>{share.quranicEvidence}
                  </Text>
                </View>
              </View>
            ))}

            <View style={[s.disclaimer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[s.disclaimerText, { color: colors.mutedForeground }]}>
                نوٹ: یہ حساب بنیادی فرائض اور عام حالات کی شرعی تقسیم کے مطابق ہے۔ وصیت (تہائی تک)، قرض، اور تدفین کے اخراجات ترکہ سے پہلے ادا کیے جائیں گے۔ پیچیدہ عائلی صورتحال میں کسی مستند دار الافتاء سے رجوع فرمائیں۔
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    headerCenter: { alignItems: "center" },
    headerTitle: { fontSize: 17, fontWeight: "700" },
    headerSub: { fontSize: 11 },
    content: { padding: 16 },

    banner: { borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 16 },
    bannerArabic: { fontSize: 16, color: "#FFF", fontWeight: "700", textAlign: "center", marginBottom: 4 },
    bannerSub: { fontSize: 11, textAlign: "center" },

    sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginTop: 4 },
    card: { borderRadius: 12, borderWidth: 1, marginBottom: 14, overflow: "hidden" },
    row: { flexDirection: "row", gap: 12, padding: 14 },
    label: { fontSize: 12, marginBottom: 6, fontWeight: "500" },
    input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, fontWeight: "700" },
    currencyPicker: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
    currBtn: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },

    genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
    counterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    counterLabel: { fontSize: 13, fontWeight: "600" },
    counterControls: { flexDirection: "row", alignItems: "center", gap: 10 },
    countBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    countBtnText: { fontSize: 18, fontWeight: "700", color: colors.foreground },
    countVal: { fontSize: 15, fontWeight: "700", minWidth: 20, textAlign: "center" },

    toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },

    shareCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
    shareTitle: { fontSize: 15, fontWeight: "700" },
    shareSub: { fontSize: 11 },
    fractionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    fractionText: { fontSize: 12, fontWeight: "700" },
    shareStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 1 },
    statLabel: { fontSize: 10 },
    statVal: { fontSize: 13, fontWeight: "600" },
    statValBold: { fontSize: 16, fontWeight: "700" },
    evidenceBox: { padding: 8, borderRadius: 6 },
    evidenceText: { fontSize: 11, lineHeight: 16 },

    disclaimer: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 10 },
    disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
  });
}
