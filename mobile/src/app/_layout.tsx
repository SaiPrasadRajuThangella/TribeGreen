import "../../global.css";
import "@/lib/interop";

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplash } from "@/components/AnimatedSplash";
import { RemoveGiftDialog } from "@/components/GiftRow";
import { ItemSheet } from "@/components/ItemSheet";
import { PortalHost } from "@/components/Portal";
import { useCustomer, usePrefs } from "@/store";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  // Wait for saved preferences and the saved sign-in, so screens start in the right state
  const prefsReady = usePrefs((s) => s.hydrated);
  const customerReady = useCustomer((s) => s.hydrated);
  const hydrated = prefsReady && customerReady;
  const ready = (fontsLoaded || !!fontError) && hydrated;
  // The 3-second brand intro, drawn over the app while the app loads underneath
  const [intro, setIntro] = useState(true);
  const endIntro = useCallback(() => setIntro(false), []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "#F1F2EE" },
          }}
        >
          <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
          <Stack.Screen name="enquiry" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="thank-you" options={{ animation: "fade", gestureEnabled: false }} />
          <Stack.Screen name="login" options={{ animation: "slide_from_bottom" }} />
        </Stack>
        {/* Shared by every screen: the size / customisation picker and "Remove this gift?" */}
        <ItemSheet />
        <RemoveGiftDialog />
        {/* Bottom sheets draw here, above every screen and the tab bar */}
        <PortalHost />
        {intro && <AnimatedSplash onDone={endIntro} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
