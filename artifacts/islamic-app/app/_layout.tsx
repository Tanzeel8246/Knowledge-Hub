import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { useAutoPreload } from "@/hooks/useAutoPreload";

function BackgroundSyncMounter() {
  useBackgroundSync();
  useAutoPreload();
  return null;
}

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();

  // Seamless Guest Mode: App opens directly to tabs without blocking user with login
  useEffect(() => {
    // If auth finishes and there is completely no state, guest user kicks in via AuthContext
  }, [user, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="quran/[surahNumber]" options={{ headerShown: false }} />
      <Stack.Screen name="hadith/[collectionId]" options={{ headerShown: false }} />
      <Stack.Screen name="hadith/[collectionId]/[bookNumber]" options={{ headerShown: false }} />
      <Stack.Screen name="books" options={{ headerShown: false }} />
      <Stack.Screen name="book/[bookId]" options={{ headerShown: false }} />
      <Stack.Screen name="book/[bookId]/[chapterId]" options={{ headerShown: false }} />
      <Stack.Screen name="learning/[pathId]" options={{ headerShown: false }} />
      <Stack.Screen name="learning/[pathId]/[lessonId]" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="qaris" options={{ headerShown: false }} />
      <Stack.Screen name="tasbih" options={{ headerShown: false }} />
      <Stack.Screen name="prayer-times" options={{ headerShown: false }} />
      <Stack.Screen name="qibla" options={{ headerShown: false }} />
      <Stack.Screen name="duas" options={{ headerShown: false }} />
      <Stack.Screen name="names-of-allah" options={{ headerShown: false }} />
      <Stack.Screen name="quran-search" options={{ headerShown: false }} />
      <Stack.Screen name="islamic-calendar" options={{ headerShown: false }} />
      <Stack.Screen name="zakat-calculator" options={{ headerShown: false }} />
      <Stack.Screen name="prayer-tracker" options={{ headerShown: false }} />
      <Stack.Screen name="islamic-quiz" options={{ headerShown: false }} />
      <Stack.Screen name="adhkar" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="hifz-tracker" options={{ headerShown: false }} />
      <Stack.Screen name="ramadan-tracker" options={{ headerShown: false }} />
      <Stack.Screen name="salah-guide" options={{ headerShown: false }} />
      <Stack.Screen name="islamic-history" options={{ headerShown: false }} />
      <Stack.Screen name="arabic-alphabet" options={{ headerShown: false }} />
      <Stack.Screen name="prophets" options={{ headerShown: false }} />
      <Stack.Screen name="wudu-guide" options={{ headerShown: false }} />
      <Stack.Screen name="tajweed" options={{ headerShown: false }} />
      <Stack.Screen name="seerah" options={{ headerShown: false }} />
      <Stack.Screen name="islamic-names" options={{ headerShown: false }} />
      <Stack.Screen name="quran-juz" options={{ headerShown: false }} />
      <Stack.Screen name="glossary" options={{ headerShown: false }} />
      <Stack.Screen name="fasting-tracker" options={{ headerShown: false }} />
      <Stack.Screen name="mosques" options={{ headerShown: false }} />
      <Stack.Screen name="kids-corner" options={{ headerShown: false }} />
      <Stack.Screen name="inheritance-calculator" options={{ headerShown: false }} />
      <Stack.Screen name="research-suite" options={{ headerShown: false }} />
      <Stack.Screen name="spiritual-suite" options={{ headerShown: false }} />
      <Stack.Screen name="downloads" options={{ headerShown: false }} />
      <Stack.Screen name="fatawa-archive" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BackgroundSyncMounter />
                <RootLayoutNav />
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
