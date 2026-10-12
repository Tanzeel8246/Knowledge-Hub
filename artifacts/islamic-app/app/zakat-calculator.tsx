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
import { useColors } from "@/hooks/useColors";

const NISAB_GOLD_GRAMS = 85;
const NISAB_SILVER_GRAMS = 595;
const ZAKAT_RATE = 0.025;

interface AssetField {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
}

const ASSET_FIELDS: AssetField[] = [
  { id: "cash", label: "Cash & Bank Savings", sublabel: "Cash, current/savings accounts", icon: "dollar-sign", color: "#16A34A" },
  { id: "gold", label: "Gold Value", sublabel: "Market value of gold jewelry/coins", icon: "award", color: "#D97706" },
  { id: "silver", label: "Silver Value", sublabel: "Market value of silver items", icon: "circle", color: "#6B7280" },
  { id: "investments", label: "Investments", sublabel: "Stocks, mutual funds, crypto", icon: "trending-up", color: "#0891B2" },
  { id: "business", label: "Business Inventory", sublabel: "Goods, merchandise for trade", icon: "package", color: "#7C3AED" },
  { id: "rental", label: "Rental Income", sublabel: "Accumulated rental earnings", icon: "home", color: "#059669" },
  { id: "receivables", label: "Money Owed to You", sublabel: "Debts others owe you (confident)", icon: "user-check", color: "#0D9373" },
];

const LIABILITY_FIELDS: AssetField[] = [
  { id: "loans", label: "Loans & Debts", sublabel: "Money you owe others (immediate due)", icon: "credit-card", color: "#DC2626" },
  { id: "expenses", label: "Immediate Expenses", sublabel: "Bills due within this lunar year", icon: "file-text", color: "#EF4444" },
];

const CURRENCY_PRESETS: Record<string, { gold: string; silver: string; symbol: string }> = {
  USD: { gold: "85", silver: "1.10", symbol: "$" },
  PKR: { gold: "24500", silver: "310", symbol: "Rs" },
  SAR: { gold: "318", silver: "4.10", symbol: "SAR" },
  AED: { gold: "312", silver: "4.05", symbol: "AED" },
  GBP: { gold: "68", silver: "0.88", symbol: "£" },
};

export default function ZakatCalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [currency, setCurrency] = useState("USD");
  const [goldPricePerGram, setGoldPricePerGram] = useState("85");
  const [silverPricePerGram, setSilverPricePerGram] = useState("1.10");

  const [assets, setAssets] = useState<Record<string, string>>({
    cash: "", gold: "", silver: "", investments: "", business: "", rental: "", receivables: "",
  });
  const [liabilities, setLiabilities] = useState<Record<string, string>>({
    loans: "", expenses: "",
  });

  const [nisabBasis, setNisabBasis] = useState<"gold" | "silver">("silver");

  const handleSelectCurrency = (cur: string) => {
    setCurrency(cur);
    if (CURRENCY_PRESETS[cur]) {
      setGoldPricePerGram(CURRENCY_PRESETS[cur].gold);
      setSilverPricePerGram(CURRENCY_PRESETS[cur].silver);
    }
  };

  const goldPrice = parseFloat(goldPricePerGram) || 0;
  const silverPrice = parseFloat(silverPricePerGram) || 0;

  const nisabThreshold = useMemo(() => {
    return nisabBasis === "gold"
      ? NISAB_GOLD_GRAMS * goldPrice
      : NISAB_SILVER_GRAMS * silverPrice;
  }, [nisabBasis, goldPrice, silverPrice]);

  const totalAssets = useMemo(() => {
    return Object.values(assets).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }, [assets]);

  const totalLiabilities = useMemo(() => {
    return Object.values(liabilities).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }, [liabilities]);

  const netWorth = Math.max(0, totalAssets - totalLiabilities);
  const zakatDue = netWorth >= nisabThreshold ? netWorth * ZAKAT_RATE : 0;
  const isZakatDue = netWorth >= nisabThreshold;

  const s = makeStyles(colors);

  const AssetInput = ({ field, value, onChangeFn }: { field: AssetField; value: string; onChangeFn: (id: string, v: string) => void }) => (
    <View style={[s.inputRow, { borderBottomColor: colors.border }]}>
      <View style={[s.inputIcon, { backgroundColor: field.color + "15" }]}>
        <Feather name={field.icon as any} size={16} color={field.color} />
      </View>
      <View style={s.inputLabels}>
        <Text style={[s.inputLabel, { color: colors.foreground }]}>{field.label}</Text>
        <Text style={[s.inputSublabel, { color: colors.mutedForeground }]}>{field.sublabel}</Text>
      </View>
      <View style={[s.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <TextInput
          style={[s.inputField, { color: colors.foreground }]}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={v => onChangeFn(field.id, v)}
        />
      </View>
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Zakat Calculator</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>حاسبة الزكاة</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Info Banner */}
        <View style={[s.infoBanner, { backgroundColor: colors.navy }]}>
          <Text style={s.infoArabic}>وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ</Text>
          <Text style={[s.infoTrans, { color: colors.gold }]}>Establish prayer and give Zakat — Al-Baqarah 2:43</Text>
        </View>

        {/* Currency & Nisab Settings */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>SELECT CURRENCY & NISAB</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {Object.keys(CURRENCY_PRESETS).map((cur) => (
            <TouchableOpacity
              key={cur}
              onPress={() => handleSelectCurrency(cur)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: currency === cur ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: currency === cur ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: currency === cur ? "#FFF" : colors.mutedForeground }}>
                {cur} ({CURRENCY_PRESETS[cur].symbol})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.nisabRow}>
            <TouchableOpacity
              style={[s.nisabBtn, { backgroundColor: nisabBasis === "gold" ? colors.gold + "20" : "transparent", borderColor: nisabBasis === "gold" ? colors.gold : colors.border }]}
              onPress={() => setNisabBasis("gold")}
            >
              <Feather name="award" size={14} color={nisabBasis === "gold" ? colors.gold : colors.mutedForeground} />
              <Text style={[s.nisabBtnText, { color: nisabBasis === "gold" ? colors.gold : colors.mutedForeground }]}>Gold (85g)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.nisabBtn, { backgroundColor: nisabBasis === "silver" ? "#6B7280" + "20" : "transparent", borderColor: nisabBasis === "silver" ? "#6B7280" : colors.border }]}
              onPress={() => setNisabBasis("silver")}
            >
              <Feather name="circle" size={14} color={nisabBasis === "silver" ? "#6B7280" : colors.mutedForeground} />
              <Text style={[s.nisabBtnText, { color: nisabBasis === "silver" ? "#6B7280" : colors.mutedForeground }]}>Silver (595g)</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.priceRow, { borderTopColor: colors.border }]}>
            <View style={s.priceField}>
              <Text style={[s.priceLabel, { color: colors.mutedForeground }]}>Gold/gram ({currency})</Text>
              <TextInput
                style={[s.priceInput, { color: colors.foreground, borderColor: colors.border }]}
                keyboardType="decimal-pad"
                value={goldPricePerGram}
                onChangeText={setGoldPricePerGram}
              />
            </View>
            <View style={s.priceField}>
              <Text style={[s.priceLabel, { color: colors.mutedForeground }]}>Silver/gram ({currency})</Text>
              <TextInput
                style={[s.priceInput, { color: colors.foreground, borderColor: colors.border }]}
                keyboardType="decimal-pad"
                value={silverPricePerGram}
                onChangeText={setSilverPricePerGram}
              />
            </View>
          </View>

          <View style={[s.nisabResult, { backgroundColor: colors.primary + "10" }]}>
            <Text style={[s.nisabResultLabel, { color: colors.mutedForeground }]}>Nisab Threshold ({nisabBasis})</Text>
            <Text style={[s.nisabResultValue, { color: colors.primary }]}>
              {currency} {nisabThreshold.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.navy + "0A" }}>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 16 }}>
              <Text style={{ fontWeight: "700" }}>فقہی رہنمائی (Fiqh Note): </Text>
              فقہ حنفی میں احتیاط اور غرباء کے زیادہ نفع کے لیے چاندی کا نصاب ترجیح رکھتا ہے، جبکہ شوافع و حنابلہ میں سونے کا نصاب یا مخصوص جنس کے لحاظ سے استدلال کیا جاتا ہے۔
            </Text>
          </View>
        </View>

        {/* Assets */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>YOUR ASSETS ({currency})</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ASSET_FIELDS.map(f => (
            <AssetInput
              key={f.id}
              field={f}
              value={assets[f.id]}
              onChangeFn={(id, v) => setAssets(prev => ({ ...prev, [id]: v }))}
            />
          ))}
        </View>

        {/* Liabilities */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>DEDUCTIBLE LIABILITIES ({currency})</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {LIABILITY_FIELDS.map(f => (
            <AssetInput
              key={f.id}
              field={f}
              value={liabilities[f.id]}
              onChangeFn={(id, v) => setLiabilities(prev => ({ ...prev, [id]: v }))}
            />
          ))}
        </View>

        {/* Result Summary */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>CALCULATION SUMMARY</Text>
        <View style={[s.summaryCard, { backgroundColor: isZakatDue ? colors.primary + "08" : colors.card, borderColor: isZakatDue ? colors.primary : colors.border }]}>
          {[
            { label: "Total Assets", value: totalAssets, color: "#16A34A" },
            { label: "Total Liabilities", value: -totalLiabilities, color: "#DC2626" },
            { label: "Net Zakatable Wealth", value: netWorth, color: colors.foreground, bold: true },
            { label: "Nisab Threshold", value: nisabThreshold, color: colors.mutedForeground },
          ].map((row, i) => (
            <View key={i} style={[s.summaryRow, i > 0 && { borderTopColor: colors.border, borderTopWidth: 1 }]}>
              <Text style={[s.summaryLabel, { color: row.bold ? colors.foreground : colors.mutedForeground, fontFamily: row.bold ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                {row.label}
              </Text>
              <Text style={[s.summaryValue, { color: row.color }]}>
                {row.value < 0 ? "-" : ""}{currency} {Math.abs(row.value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </View>

        {/* Zakat Due */}
        <View style={[s.zakatBox, {
          backgroundColor: isZakatDue ? "#16A34A" : colors.muted,
          borderColor: isZakatDue ? "#16A34A" : colors.border,
        }]}>
          {isZakatDue ? (
            <>
              <Text style={s.zakatBoxTitle}>Zakat Due (2.5%)</Text>
              <Text style={s.zakatBoxAmount}>
                {currency} {zakatDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={s.zakatBoxSub}>Your wealth exceeds the Nisab threshold. Zakat is obligatory.</Text>
            </>
          ) : (
            <>
              <Text style={[s.zakatBoxTitle, { color: colors.mutedForeground }]}>No Zakat Due</Text>
              <Text style={[s.zakatBoxAmount, { color: colors.foreground, fontSize: 18 }]}>
                {currency} {(nisabThreshold - netWorth).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} below Nisab
              </Text>
              <Text style={[s.zakatBoxSub, { color: colors.mutedForeground }]}>
                Your net wealth is below the Nisab threshold. Zakat is not yet obligatory.
              </Text>
            </>
          )}
        </View>

        {/* Disclaimer */}
        <View style={[s.disclaimer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[s.disclaimerText, { color: colors.mutedForeground }]}>
            This calculator is a guide. Consult a qualified Islamic scholar for your specific situation. Zakat is due after one full lunar year (Hawl) of possessing Nisab.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
    headerCenter: { flex: 1, alignItems: "center" },
    title: { fontSize: 20, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 13 },
    content: { paddingHorizontal: 16, paddingTop: 16 },

    infoBanner: { borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 20 },
    infoArabic: { fontSize: 18, color: "#FFF", textAlign: "center", marginBottom: 6 },
    infoTrans: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic", textAlign: "center" },

    sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8, marginTop: 4 },
    card: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },

    nisabRow: { flexDirection: "row", gap: 10, padding: 14 },
    nisabBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, justifyContent: "center" },
    nisabBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    priceRow: { flexDirection: "row", gap: 10, padding: 14, borderTopWidth: 1 },
    priceField: { flex: 1, gap: 6 },
    priceLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
    priceInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, fontFamily: "Inter_600SemiBold" },
    nisabResult: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
    nisabResultLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
    nisabResultValue: { fontSize: 16, fontFamily: "Inter_700Bold" },

    inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
    inputIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    inputLabels: { flex: 1 },
    inputLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
    inputSublabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
    inputBox: { borderWidth: 1, borderRadius: 8, width: 90, paddingHorizontal: 10, paddingVertical: 7 },
    inputField: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right" },

    summaryCard: { borderRadius: 14, borderWidth: 1.5, overflow: "hidden", marginBottom: 16 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
    summaryLabel: { fontSize: 14 },
    summaryValue: { fontSize: 15, fontFamily: "Inter_700Bold" },

    zakatBox: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16, borderWidth: 2 },
    zakatBoxTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF", marginBottom: 8 },
    zakatBoxAmount: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 8 },
    zakatBoxSub: { fontSize: 13, color: "#FFFFFFBB", textAlign: "center", fontFamily: "Inter_400Regular" },

    disclaimer: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", gap: 10, alignItems: "flex-start" },
    disclaimerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  });
}
