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
import { useRegister } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const registerMutation = useRegister();

  const s = makeStyles(colors);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    try {
      const data = await registerMutation.mutateAsync({ data: { name: name.trim(), email: email.trim(), password } });
      await login(data.user as any, data.token);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Registration Failed", err?.message ?? "Something went wrong");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={[s.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[s.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40) }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[s.title, { color: colors.foreground }]}>Create Account</Text>
        <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Join the Islamic learning community</Text>

        <View style={[s.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.inputGroup, { borderBottomColor: colors.border }]}> 
            <Text style={[s.label, { color: colors.mutedForeground }]}>Full Name</Text>
            <TextInput style={[s.input, { color: colors.foreground }]} placeholder="Your name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} autoCapitalize="words" />
          </View>
          <View style={[s.inputGroup, { borderBottomColor: colors.border }]}> 
            <Text style={[s.label, { color: colors.mutedForeground }]}>Email</Text>
            <TextInput style={[s.input, { color: colors.foreground }]} placeholder="your@email.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username" />
          </View>
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>Password</Text>
            <TextInput style={[s.input, { color: colors.foreground }]} placeholder="Min 8 characters" placeholderTextColor={colors.mutedForeground} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
          </View>
        </View>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.primary, opacity: registerMutation.isPending ? 0.7 : 1 }]}
          onPress={handleRegister}
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[s.btnText, { color: colors.primaryForeground }]}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={s.loginRow}>
          <Text style={[s.loginText, { color: colors.mutedForeground }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login") }>
            <Text style={[s.loginLink, { color: colors.primary }]}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    backBtn: { marginBottom: 24, alignSelf: "flex-start" },
    title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 6 },
    subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 32 },
    form: { width: "100%", borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: "hidden" },
    inputGroup: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    label: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
    input: { fontSize: 16, fontFamily: "Inter_400Regular", paddingVertical: 4 },
    btn: { width: "100%", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginBottom: 24 },
    btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    loginRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
    loginText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    loginLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  });
}
