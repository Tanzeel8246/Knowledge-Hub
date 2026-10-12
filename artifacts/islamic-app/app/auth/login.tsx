import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogin } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@islamicresearch.app");
  const [password, setPassword] = useState("admin123456");
  const loginMutation = useLogin();

  const s = makeStyles(colors);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      const data = await loginMutation.mutateAsync({ data: { email: email.trim(), password } });
      await login(data.user as any, data.token);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login Failed", err?.message ?? "Invalid credentials");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={[s.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[s.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.brand, { backgroundColor: colors.navy }]}>
          <Text style={s.brandArabic}>الإسلام</Text>
        </View>
        <Text style={[s.title, { color: colors.foreground }]}>Islamic Research OS</Text>
        <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Sign in to continue your learning journey</Text>

        <View style={[s.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.inputGroup, { borderBottomColor: colors.border }]}> 
            <Text style={[s.label, { color: colors.mutedForeground }]}>Email</Text>
            <TextInput
              style={[s.input, { color: colors.foreground }]}
              placeholder="your@email.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="username"
            />
          </View>
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>Password</Text>
            <TextInput
              style={[s.input, { color: colors.foreground }]}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[s.loginBtn, { backgroundColor: colors.primary, opacity: loginMutation.isPending ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[s.loginBtnText, { color: colors.primaryForeground }]}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Instant Guest Mode Button */}
        <TouchableOpacity
          style={[s.loginBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, marginTop: 10 }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[s.loginBtnText, { color: colors.foreground }]}>بغیر لاگ ان جاری رکھیں (Continue as Guest)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setEmail("admin@islamicresearch.app"); setPassword("admin123456"); }}>
          <Text style={[s.demo, { color: colors.primary }]}>Use demo credentials</Text>
        </TouchableOpacity>

        <View style={s.registerRow}>
          <Text style={[s.registerText, { color: colors.mutedForeground }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/register") }>
            <Text style={[s.registerLink, { color: colors.primary }]}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, alignItems: "center" },
    brand: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    brandArabic: { fontSize: 22, color: "#D4A843", fontWeight: "bold" },
    title: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 6, textAlign: "center" },
    subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 32, textAlign: "center" },
    form: { width: "100%", borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: "hidden" },
    inputGroup: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    label: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { fontSize: 16, fontFamily: "Inter_400Regular", paddingVertical: 4 },
    loginBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginBottom: 16 },
    loginBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    demo: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 24 },
    registerRow: { flexDirection: "row", alignItems: "center" },
    registerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    registerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  });
}
