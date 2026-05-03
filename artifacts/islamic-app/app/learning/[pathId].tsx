import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetLearningPath, useEnrollInPath } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";

export default function LearningPathScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pathId } = useLocalSearchParams<{ pathId: string }>();
  const { data: path, isLoading } = useGetLearningPath(pathId);
  const enrollMutation = useEnrollInPath();
  const queryClient = useQueryClient();

  const s = makeStyles(colors);

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync({ pathId });
      queryClient.invalidateQueries({ queryKey: ["/learning/my-paths"] });
      Alert.alert("Enrolled!", "You've been enrolled in this learning path.");
    } catch (err: any) {
      const msg = err?.message ?? "Could not enroll";
      if (msg.includes("already")) Alert.alert("Already Enrolled", "You are already in this path.");
      else Alert.alert("Error", msg);
    }
  };

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!path) return null;

  const levelColors: Record<string, string> = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#EF4444" };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={path.lessons}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        ListHeaderComponent={
          <View>
            <View style={[s.hero, { backgroundColor: colors.navy, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <Feather name="arrow-left" size={22} color="#FFF" />
              </TouchableOpacity>
              <View style={[s.levelBadge, { backgroundColor: (levelColors[path.level] ?? colors.primary) + "25" }]}>
                <Text style={[s.levelText, { color: levelColors[path.level] ?? colors.primary }]}>{path.level}</Text>
              </View>
              <Text style={[s.topic, { color: colors.gold }]}>{path.topic}</Text>
              <Text style={s.pathTitle}>{path.title}</Text>
              <Text style={s.pathDesc}>{path.description}</Text>
              <View style={s.heroMeta}>
                <View style={s.heroMetaItem}>
                  <Feather name="book" size={14} color="#FFFFFF90" />
                  <Text style={s.heroMetaText}>{path.totalLessons} lessons</Text>
                </View>
                <View style={s.heroMetaItem}>
                  <Feather name="clock" size={14} color="#FFFFFF90" />
                  <Text style={s.heroMetaText}>{path.estimatedHours}h estimated</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[s.enrollBtn, { backgroundColor: colors.gold, opacity: enrollMutation.isPending ? 0.7 : 1 }]}
                onPress={handleEnroll}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={s.enrollBtnText}>Enroll in Path</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={[s.lessonsTitle, { color: colors.foreground }]}>Lessons</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[s.lessonItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/learning/${pathId}/${item.id}` as any)}
          >
            <View style={[s.lessonNum, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[s.lessonNumText, { color: colors.primary }]}>{index + 1}</Text>
            </View>
            <View style={s.lessonInfo}>
              <Text style={[s.lessonTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[s.lessonTime, { color: colors.mutedForeground }]}>{item.estimatedMinutes} min</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    hero: { paddingHorizontal: 20, paddingBottom: 24 },
    backBtn: { marginBottom: 16 },
    levelBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
    levelText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    topic: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
    pathTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 10 },
    pathDesc: { fontSize: 14, lineHeight: 22, color: "#FFFFFF90", marginBottom: 16 },
    heroMeta: { flexDirection: "row", gap: 20, marginBottom: 20 },
    heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    heroMetaText: { fontSize: 13, color: "#FFFFFF90", fontFamily: "Inter_400Regular" },
    enrollBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
    enrollBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#000" },
    lessonsTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
    lessonItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, gap: 14 },
    lessonNum: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    lessonNumText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    lessonInfo: { flex: 1 },
    lessonTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    lessonTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  });
}
