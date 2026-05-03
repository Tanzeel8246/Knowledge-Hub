import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "react-native";
import { useGetUserStats } from "@workspace/api-client-react";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data: stats } = useGetUserStats();
  const colorScheme = useColorScheme();

  const s = makeStyles(colors);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
        await logout();
        router.replace("/auth/login");
      }},
    ]);
  };

  const sections = [
    {
      title: "Account",
      items: [
        { icon: "user", label: "Name", value: user?.name },
        { icon: "mail", label: "Email", value: user?.email },
        { icon: "shield", label: "Role", value: user?.role },
      ],
    },
    {
      title: "Learning Stats",
      items: [
        { icon: "file-text", label: "Notes Created", value: String(stats?.totalNotes ?? 0) },
        { icon: "bookmark", label: "Bookmarks", value: String(stats?.totalBookmarks ?? 0) },
        { icon: "award", label: "Lessons Completed", value: String(stats?.completedLessons ?? 0) },
        { icon: "zap", label: "Day Streak", value: `${stats?.readingStreak ?? 0} days` },
        { icon: "clock", label: "Total Study Time", value: `${stats?.totalReadingMinutes ?? 0} min` },
      ],
    },
  ];

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
        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={[s.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[s.avatarText, { color: colors.primaryForeground }]}>
              {(user?.name ?? "?")[0].toUpperCase()}
            </Text>
          </View>
          <Text style={[s.avatarName, { color: colors.foreground }]}>{user?.name}</Text>
          <View style={[s.roleBadge, { backgroundColor: user?.role === "admin" ? colors.gold + "25" : colors.primary + "20" }]}>
            <Text style={[s.roleBadgeText, { color: user?.role === "admin" ? colors.gold : colors.primary }]}>
              {user?.role}
            </Text>
          </View>
        </View>

        {sections.map(section => (
          <View key={section.title}>
            <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>{section.title.toUpperCase()}</Text>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, i) => (
                <View key={item.label} style={[s.row, i < section.items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={[s.rowIcon, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name={item.icon as any} size={16} color={colors.primary} />
                  </View>
                  <Text style={[s.rowLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                  <Text style={[s.rowValue, { color: colors.foreground }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={[s.logoutBtn, { borderColor: colors.destructive }]} onPress={handleLogout}>
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
    content: { paddingHorizontal: 20, paddingTop: 20 },
    avatarSection: { alignItems: "center", marginBottom: 32 },
    avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    avatarText: { fontSize: 32, fontFamily: "Inter_700Bold" },
    avatarName: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
    roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    roleBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8, marginTop: 20 },
    card: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
    row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
    rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    rowLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
    rowValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
    logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, marginTop: 24 },
    logoutText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });
}
