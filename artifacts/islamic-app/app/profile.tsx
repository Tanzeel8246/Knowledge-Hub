import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useGetUserStats } from "@workspace/api-client-react";

interface MenuItem {
  icon: string;
  label: string;
  value?: string;
  route?: string;
  color?: string;
  isMCIcon?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data: stats } = useGetUserStats();

  const s = makeStyles(colors);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
        await logout();
        router.replace("/auth/login");
      }},
    ]);
  };

  const statItems = [
    { icon: "zap", label: "Reading Streak", value: `${stats?.readingStreak ?? 0} days`, color: colors.gold },
    { icon: "clock", label: "Total Study Time", value: `${stats?.totalReadingMinutes ?? 0} min`, color: colors.teal },
    { icon: "award", label: "Lessons Completed", value: String(stats?.completedLessons ?? 0), color: "#8B5CF6" },
    { icon: "file-text", label: "Notes Created", value: String(stats?.totalNotes ?? 0), color: "#0891B2" },
    { icon: "bookmark", label: "Bookmarks", value: String(stats?.totalBookmarks ?? 0), color: "#DC2626" },
  ];

  const islamicToolsMenu: MenuSection = {
    title: "Islamic Tools",
    items: [
      { icon: "mosque", label: "Prayer Times", route: "/prayer-times", color: "#0891B2", isMCIcon: true },
      { icon: "counter", label: "Tasbih Counter", route: "/tasbih", color: "#16A34A", isMCIcon: true },
      { icon: "compass", label: "Qibla Direction", route: "/qibla", color: "#7C3AED", isMCIcon: true },
      { icon: "heart", label: "Duas Collection", route: "/duas", color: "#DC2626", isMCIcon: true },
      { icon: "star-crescent", label: "99 Names of Allah", route: "/names-of-allah", color: "#D97706", isMCIcon: true },
      { icon: "calendar-month", label: "Islamic Calendar", route: "/islamic-calendar", color: "#059669", isMCIcon: true },
      { icon: "calculator", label: "Zakat Calculator", route: "/zakat-calculator", color: "#D97706", isMCIcon: true },
      { icon: "check-square", label: "Prayer Tracker", route: "/prayer-tracker", color: "#16A34A", isMCIcon: false },
      { icon: "help-circle", label: "Islamic Quiz", route: "/islamic-quiz", color: "#8B5CF6", isMCIcon: false },
      { icon: "weather-sunny", label: "Adhkar (Morning/Evening)", route: "/adhkar", color: "#F59E0B", isMCIcon: true },
      { icon: "book-open-variant", label: "Hifz Tracker", route: "/hifz-tracker", color: "#7C3AED", isMCIcon: true },
      { icon: "moon-waning-crescent", label: "Ramadan Tracker", route: "/ramadan-tracker", color: "#1E3A5F", isMCIcon: true },
      { icon: "hands-pray", label: "Salah Guide", route: "/salah-guide", color: "#059669", isMCIcon: true },
      { icon: "timeline-text-outline", label: "Islamic History", route: "/islamic-history", color: "#78716C", isMCIcon: true },
      { icon: "alphabetical", label: "Arabic Alphabet", route: "/arabic-alphabet", color: "#0891B2", isMCIcon: true },
      { icon: "account-group", label: "Prophets of Islam", route: "/prophets", color: "#059669", isMCIcon: true },
      { icon: "water", label: "Wudu Guide", route: "/wudu-guide", color: "#0891B2", isMCIcon: true },
      { icon: "music-note", label: "Tajweed Rules", route: "/tajweed", color: "#7C3AED", isMCIcon: true },
      { icon: "book-open-page-variant", label: "Seerah", route: "/seerah", color: "#D97706", isMCIcon: true },
      { icon: "account-heart", label: "Islamic Names", route: "/islamic-names", color: "#DC2626", isMCIcon: true },
      { icon: "book-alphabet", label: "Islamic Glossary", route: "/glossary", color: "#7C3AED", isMCIcon: true },
      { icon: "food-off", label: "Fasting Tracker", route: "/fasting-tracker", color: "#0891B2", isMCIcon: true },
    ],
  };

  const appMenu: MenuSection = {
    title: "App",
    items: [
      { icon: "book-open", label: "Read Quran", route: "/quran", color: colors.primary },
      { icon: "search", label: "Search Quran", route: "/quran-search", color: "#0891B2" },
      { icon: "book", label: "Islamic Library", route: "/books", color: colors.primary },
      { icon: "play-circle", label: "Learning Paths", route: "/learn", color: "#8B5CF6" },
      { icon: "folder", label: "Workspace", route: "/(tabs)/workspace", color: "#6366F1" },
      { icon: "settings", label: "Settings", route: "/settings", color: colors.mutedForeground },
    ],
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.foreground }]}>Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Avatar Section */}
        <View style={[s.avatarSection, { backgroundColor: colors.navy }]}>
          <View style={[s.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[s.avatarText, { color: colors.primaryForeground }]}>
              {(user?.name ?? "?")[0].toUpperCase()}
            </Text>
          </View>
          <Text style={s.avatarName}>{user?.name}</Text>
          <Text style={[s.avatarEmail, { color: "#FFFFFF80" }]}>{user?.email}</Text>
          <View style={[s.roleBadge, { backgroundColor: user?.role === "admin" ? colors.gold + "30" : colors.primary + "25" }]}>
            <Text style={[s.roleBadgeText, { color: user?.role === "admin" ? colors.gold : "#FFF" }]}>
              {user?.role === "admin" ? "⭐ Admin" : "Student"}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>LEARNING PROGRESS</Text>
        <View style={[s.statsGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {statItems.map((item, i) => (
            <View key={item.label} style={[s.statRow, i < statItems.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <View style={[s.statIcon, { backgroundColor: item.color + "20" }]}>
                <Feather name={item.icon as any} size={16} color={item.color} />
              </View>
              <Text style={[s.statLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Islamic Tools */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>{islamicToolsMenu.title.toUpperCase()}</Text>
        <View style={[s.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {islamicToolsMenu.items.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[s.menuRow, i < islamicToolsMenu.items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={[s.menuIcon, { backgroundColor: (item.color ?? colors.primary) + "20" }]}>
                {item.isMCIcon ? (
                  <MaterialCommunityIcons name={item.icon as any} size={16} color={item.color ?? colors.primary} />
                ) : (
                  <Feather name={item.icon as any} size={16} color={item.color ?? colors.primary} />
                )}
              </View>
              <Text style={[s.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Menu */}
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>{appMenu.title.toUpperCase()}</Text>
        <View style={[s.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {appMenu.items.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[s.menuRow, i < appMenu.items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={[s.menuIcon, { backgroundColor: (item.color ?? colors.primary) + "20" }]}>
                <Feather name={item.icon as any} size={16} color={item.color ?? colors.primary} />
              </View>
              <Text style={[s.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.infoTitle, { color: colors.foreground }]}>Islamic Research & Learning OS</Text>
          <Text style={[s.infoText, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
          <Text style={[s.infoAr, { color: colors.gold }]}>بِسۡمِ اللّٰهِ الرَّحۡمٰنِ الرَّحِيۡمِ</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[s.logoutBtn, { borderColor: colors.destructive + "60", backgroundColor: colors.destructive + "10" }]} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[s.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
    title: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    content: { paddingHorizontal: 16, paddingTop: 16 },

    avatarSection: { borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 24 },
    avatar: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    avatarText: { fontSize: 34, fontFamily: "Inter_700Bold" },
    avatarName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 4 },
    avatarEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10 },
    roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
    roleBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

    sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8, marginTop: 8 },
    statsGrid: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
    statRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
    statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    statLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
    statValue: { fontSize: 15, fontFamily: "Inter_700Bold" },

    menuCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
    menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
    menuIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    menuLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },

    infoCard: { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "center", marginTop: 8, marginBottom: 4 },
    infoTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4, textAlign: "center" },
    infoText: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
    infoAr: { fontSize: 16 },

    logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, marginTop: 16 },
    logoutText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });
}
