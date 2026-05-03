import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetLesson, useCompleteLesson } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";

export default function LessonScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pathId, lessonId } = useLocalSearchParams<{ pathId: string; lessonId: string }>();
  const { data: lesson, isLoading } = useGetLesson(pathId, lessonId);
  const completeMutation = useCompleteLesson();
  const queryClient = useQueryClient();
  const [completed, setCompleted] = useState(false);

  const s = makeStyles(colors);

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync({ pathId, lessonId });
      setCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["/learning/my-paths"] });
      Alert.alert("Lesson Complete!", "Great work! Keep learning.", [
        { text: "Continue", onPress: () => router.back() }
      ]);
    } catch {
      Alert.alert("Error", "Could not mark lesson as complete");
    }
  };

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!lesson) return null;

  const refs = Array.isArray(lesson.references) ? lesson.references : [];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.lessonNum, { color: colors.mutedForeground }]}>Lesson {lesson.lessonNumber}</Text>
        <View style={[s.timeTag, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="clock" size={12} color={colors.primary} />
          <Text style={[s.timeText, { color: colors.primary }]}>{lesson.estimatedMinutes}m</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={[s.title, { color: colors.foreground }]}>{lesson.title}</Text>
        <Text style={[s.body, { color: colors.foreground }]}>{lesson.content}</Text>

        {refs.length > 0 && (
          <View style={[s.refsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.refsTitle, { color: colors.foreground }]}>References</Text>
            {refs.map((ref: any, i: number) => (
              <View key={i} style={[s.refItem, { borderTopColor: colors.border }]}>
                <View style={[s.refType, { backgroundColor: colors.gold + "20" }]}>
                  <Text style={[s.refTypeText, { color: colors.gold }]}>{ref.type}</Text>
                </View>
                <View style={s.refInfo}>
                  <Text style={[s.refLabel, { color: colors.foreground }]}>{ref.label}</Text>
                  {ref.text && <Text style={[s.refText, { color: colors.mutedForeground }]} numberOfLines={2}>{ref.text}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Complete Button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 20, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[s.completeBtn, { backgroundColor: completed ? colors.muted : colors.primary, opacity: completeMutation.isPending ? 0.7 : 1 }]}
          onPress={handleComplete}
          disabled={completed || completeMutation.isPending}
        >
          {completeMutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Feather name={completed ? "check-circle" : "check"} size={18} color={completed ? colors.primary : "#FFF"} />
              <Text style={[s.completeBtnText, { color: completed ? colors.primary : "#FFF" }]}>
                {completed ? "Completed!" : "Mark as Complete"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 14 },
    lessonNum: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
    timeTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    timeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    content: { paddingHorizontal: 20, paddingTop: 20 },
    title: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 20, lineHeight: 34 },
    body: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 28, marginBottom: 24 },
    refsSection: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
    refsTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", padding: 14 },
    refItem: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, gap: 10 },
    refType: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    refTypeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    refInfo: { flex: 1 },
    refLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    refText: { fontSize: 12, fontFamily: "Inter_400Regular" },
    footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1 },
    completeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
    completeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });
}
