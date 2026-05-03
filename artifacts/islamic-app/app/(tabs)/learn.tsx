import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetLearningPaths } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;
type Level = typeof LEVELS[number];

const levelColors: Record<string, string> = {
  beginner: "#10B981",
  intermediate: "#F59E0B",
  advanced: "#EF4444",
};

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [level, setLevel] = useState<Level>("all");
  const { data: paths, isLoading } = useGetLearningPaths(
    level !== "all" ? { level } : {}
  );

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
        <Text style={[s.title, { color: colors.foreground }]}>Learning Paths</Text>
        <Text style={[s.subtitle, { color: colors.gold }]}>طرق التعلم</Text>
        <View style={s.filters}>
          {LEVELS.map(l => (
            <TouchableOpacity
              key={l}
              onPress={() => setLevel(l)}
              style={[s.filter, { backgroundColor: level === l ? colors.primary : colors.card, borderColor: level === l ? colors.primary : colors.border }]}
            >
              <Text style={[s.filterText, { color: level === l ? colors.primaryForeground : colors.mutedForeground }]}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={paths ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/learning/${item.id}` as any)}
            >
              <View style={s.cardTop}>
                <View style={[s.levelBadge, { backgroundColor: (levelColors[item.level] ?? colors.primary) + "20" }]}>
                  <Text style={[s.levelText, { color: levelColors[item.level] ?? colors.primary }]}>{item.level}</Text>
                </View>
                <Text style={[s.topic, { color: colors.mutedForeground }]}>{item.topic}</Text>
              </View>
              <Text style={[s.name, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[s.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{item.description}</Text>
              <View style={s.cardFooter}>
                <View style={s.meta}>
                  <Feather name="book" size={13} color={colors.mutedForeground} />
                  <Text style={[s.metaText, { color: colors.mutedForeground }]}>{item.totalLessons} lessons</Text>
                </View>
                <View style={s.meta}>
                  <Feather name="clock" size={13} color={colors.mutedForeground} />
                  <Text style={[s.metaText, { color: colors.mutedForeground }]}>{item.estimatedHours}h</Text>
                </View>
                <View style={s.meta}>
                  <Feather name="users" size={13} color={colors.mutedForeground} />
                  <Text style={[s.metaText, { color: colors.mutedForeground }]}>{item.enrolledCount} enrolled</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="award" size={40} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No learning paths yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingBottom: 12 },
    title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 2 },
    subtitle: { fontSize: 16, marginBottom: 12 },
    filters: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    filter: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    levelText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    topic: { fontSize: 12, fontFamily: "Inter_400Regular" },
    name: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
    desc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 12 },
    cardFooter: { flexDirection: "row", gap: 16 },
    meta: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
    empty: { alignItems: "center", marginTop: 60, gap: 10 },
    emptyText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  });
}
