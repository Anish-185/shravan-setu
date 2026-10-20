import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";

import { AuthProvider, useAuth } from "@/auth";
import { LangProvider, useT } from "@/i18n";
import { TabBar } from "@/TabBar";
import { C, F, LangToggle } from "@/ui";

// Fonts load from the bundle (offline) while the splash screen stays up.
SplashScreen.preventAutoHideAsync();

// Titles here, or expo-router shows route file names ("index", "screen/[childId]"). Every screen gets the
// English/Telugu toggle in its header; the five tab screens and the login draw their own band instead of a header.
// Login comes first: until a teacher logs in (demo, src/auth.tsx) only the login route exists.
function Screens() {
  const t = useT();
  const { teacher } = useAuth();
  const band = { headerShown: false, statusBarStyle: 'light' } as const;
  return (
    <Stack screenOptions={{
      headerRight: () => <LangToggle />,
      headerStyle: { backgroundColor: C.paper },
      headerShadowVisible: false,
      headerTintColor: C.night,
      headerTitleStyle: { fontFamily: F.uiBold, fontSize: 18 },
      contentStyle: { backgroundColor: C.paper },
      statusBarStyle: "dark",
    }}>
      <Stack.Protected guard={!teacher}>
        <Stack.Screen name="login" options={{ title: t("title.teacherLogin"), ...band }} />
      </Stack.Protected>
      <Stack.Protected guard={!!teacher}>
        <Stack.Screen name="index" options={{ title: t("title.home"), ...band }} />
        <Stack.Screen name="children" options={{ title: t("title.children"), ...band }} />
        <Stack.Screen name="assignments" options={{ title: t("ds.assignments"), ...band }} />
        <Stack.Screen name="cases/index" options={{ title: t("title.cases"), ...band }} />
        <Stack.Screen name="settings" options={{ title: t("title.settings"), ...band }} />
        <Stack.Screen name="child/[childId]" options={{ title: t("title.history") }} />
        <Stack.Screen name="screen/[childId]" options={{ title: t("title.screen") }} />
        <Stack.Screen name="cases/[caseId]" options={{ title: t("title.case") }} />
        <Stack.Screen name="camp" options={{ title: t("title.camp") }} />
        <Stack.Screen name="sync" options={{ title: t("title.sync") }} />
        <Stack.Screen name="rooms" options={{ title: t("title.rooms") }} />
        <Stack.Screen name="teacher/class" options={{ title: t("title.class") }} />
        <Stack.Screen name="teacher/assignment/[id]" options={{ title: t("ds.analytics") }} />
        <Stack.Screen name="teacher/result/[sessionId]" options={{ title: t("title.childResult") }} />
        <Stack.Screen name="teacher/create" options={{ title: t("ds.createClassroom") }} />
        <Stack.Screen name="detailed/[childId]" options={{ title: t("ds.detailedTest") }} />
        <Stack.Screen name="results/[testId]" options={{ title: t("ds.yourResults") }} />
        <Stack.Screen name="spike" options={{ title: t("title.spike") }} />
        <Stack.Screen name="calibrate" options={{ title: t("title.calibrate") }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [F.ui]: require("../../assets/fonts/HindGuntur-Regular.ttf"),
    [F.uiMed]: require("../../assets/fonts/HindGuntur-Medium.ttf"),
    [F.uiBold]: require("../../assets/fonts/HindGuntur-SemiBold.ttf"),
    [F.title]: require("../../assets/fonts/TiroTelugu.ttf"),
    [F.quote]: require("../../assets/fonts/TiroTelugu-Italic.ttf"),
    [F.child]: require("../../assets/fonts/BalooTammudu2-SemiBold.ttf"),
  });
  // A font that fails to load falls back to the system font; the app must still open.
  const ready = loaded || !!error;
  useEffect(() => {
    if (error) console.warn("font load failed, using system font", error);
    if (ready) SplashScreen.hideAsync();
  }, [ready, error]);
  if (!ready) return null;
  return (
    <LangProvider>
      <AuthProvider>
        <View style={{ flex: 1, backgroundColor: C.paper }}>
          <Screens />
          <TabBar />
        </View>
      </AuthProvider>
    </LangProvider>
  );
}
