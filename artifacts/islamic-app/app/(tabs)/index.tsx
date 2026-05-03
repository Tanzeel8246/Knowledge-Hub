import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetSurahs, useGetProgressDashboard } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: surahs } = useGetSurahs();
  const { data: progress } = useGetProgressDashboard();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const s = makeStyles(colors);

  const quickActions = [
    { icon: "book-open-variant", label: "Read Quran", route: "/quran", color: colors.teal },
    { icon: "script-text-outline", label: "Hadith", route: "/hadith", color: colors.gold },
    { icon: "library", label: "Books", route: "/books", color: colors.primary },
    { icon: "school-outline", label: "Learn", route: "/learn", color: "#8B5CF6" },
  ];

  const lastSurah = surahs?.[0];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 100 }]}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { color: colors.mutedForeground }]}>{greeting()}</Text>
            <Text style={[s.name, { color: colors.foreground }]}>{user?.name ?? "Student"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")} style={[s.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[s.avatarText, { color: colors.primaryForeground }]}>
              {(user?.name ?? "?")[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bismillah Banner */}
        <View style={[s.bismillah, { backgroundColor: colors.navy }]}>
          <Text style={s.bismillahArabic}>بِسۡمِ اللّٰهِ الرَّحۡمٰنِ الرَّحِيۡمِ</Text>
          <Text style={[s.bismillahTranslation, { color: colors.gold }]}>In the name of Allah, the Most Gracious, the Most Merciful</Text>
        </View>

        {/* Stats */}
        {progress && (
          <View style={s.statsRow}>
            <StatCard label="Streak" value={`${progress.readingStreak}d`} icon="zap" color={colors.gold} colors={colors} />
            <StatCard label="Minutes" value={`${progress.totalReadingMinutes}`} icon="clock" color={colors.teal} colors={colors} />
            <StatCard label="Lessons" value={`${progress.completedLessons}`} icon="check-circle" color="#8B5CF6" colors={colors} />
          </View>
        )}

        {/* Quick Actions */}
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Explore</Text>
        <View style={s.quickActions}>
          {quickActions.map(a => (
            <TouchableOpacity key={a.label} style={[s.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(a.route as any)}>
              <View style={[s.quickIcon, { backgroundColor: a.color + "20" }]}>
                <MaterialCommunityIcons name={a.icon as any} size={26} color={a.color} />
              </View>
              <Text style={[s.quickLabel, { color: colors.foreground }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        {progress?.recentActivity && progress.recentActivity.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
            {progress.recentActivity.slice(0, 5).map((act, i) => (
              <View key={act.id ?? i} style={[s.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.activityDot, { backgroundColor: colors.primary }]} />
                <Text style={[s.activityText, { color: colors.foreground }]}>{act.description}</Text>
                <Text style={[s.activityTime, { color: colors.mutedForeground }]}>
                  {new Date(act.timestamp).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Al-Fatiha Quick Access */}
        {lastSurah && (
          <>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Today's Reading</Text>
            <TouchableOpacity style={[s.surahCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(`/quran/1`)}>
              <View>
                <Text style={[s.surahNumber, { color: colors.primary }]}>Surah 1</Text>
                <Text style={[s.surahName, { color: colors.foreground }]}>Al-Fatihah</Text>
                <Text style={[s.surahSub, { color: colors.mutedForeground }]}>The Opening · 7 Ayahs · Meccan</Text>
              </View>
              <Text style={[s.surahArabic, { color: colors.gold }]}>الفاتحة</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color, colors }: any) {
  const s = makeStyles(colors);
  return (
    <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={18} color={color} />
      <Text style={[s.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
    name: { fontSize: 22, fontFamily: "Inter_700Bold" },
    avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
    bismillah: { borderRadius: 16, padding: 20, marginBottom: 20, alignItems: "center" },
    bismillahArabic: { fontSize: 22, color: "#FFFFFF", marginBottom: 8, textAlign: "center" },
    bismillahTranslation: { fontSize: 12, textAlign: "center", fontFamily: "Inter_400Regular", fontStyle: "italic" },
    statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
    statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: "center", gap: 6, borderWidth: 1 },
    statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
    sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
    quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
    quickAction: { width: "47%", borderRadius: 14, padding: 16, alignItems: "center", gap: 10, borderWidth: 1 },
    quickIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    quickLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    activityItem: { flexDirection: "row", alignItems: "center", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, gap: 10 },
    activityDot: { width: 8, height: 8, borderRadius: 4 },
    activityText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
    activityTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
    surahCard: { borderRadius: 14, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, marginBottom: 20 },
    surahNumber: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 2 },
    surahName: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    surahSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    surahArabic: { fontSize: 28, fontFamily: "Inter_400Regular" },
  });
}
