import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";

import { LangProvider, useT } from "@/i18n";
import { Paper } from "@/original/paper";
import { TabBar } from "@/TabBar";
import { C, F, LangToggle } from "@/ui";

// Fonts load from the bundle (offline) while the splash screen stays up.
SplashScreen.preventAutoHideAsync();

// Titles here, or expo-router shows route file names ("index", "screen/[childId]"). Every screen gets the
// English/Telugu toggle in its header; Home draws its own band instead of a header.
function Screens() {
  const t = useT();
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
      <Stack.Screen name="index" options={{ title: t("title.home"), headerShown: false, statusBarStyle: "light" }} />
      <Stack.Screen name="children" options={{ title: t("title.children") }} />
      <Stack.Screen name="screen/[childId]" options={{ title: t("title.screen") }} />
      <Stack.Screen name="cases/index" options={{ title: t("title.cases") }} />
      <Stack.Screen name="cases/[caseId]" options={{ title: t("title.case") }} />
      <Stack.Screen name="camp" options={{ title: t("title.camp") }} />
      <Stack.Screen name="sync" options={{ title: t("title.sync") }} />
      <Stack.Screen name="rooms" options={{ title: t("title.rooms") }} />
      <Stack.Screen name="teacher/login" options={{ title: t("title.teacherLogin") }} />
      <Stack.Screen name="teacher/index" options={{ title: t("title.teacher") }} />
      <Stack.Screen name="teacher/class" options={{ title: t("title.class") }} />
      <Stack.Screen name="teacher/assignment/[id]" options={{ title: t("title.round") }} />
      <Stack.Screen name="teacher/result/[sessionId]" options={{ title: t("title.childResult") }} />
      <Stack.Screen name="teacher/create" options={{ title: t("ds.createClassroom") }} />
      <Stack.Screen name="detailed/[childId]" options={{ title: t("ds.detailedTest") }} />
      <Stack.Screen name="results/[testId]" options={{ title: t("ds.yourResults") }} />
      <Stack.Screen name="settings" options={{ title: t("title.settings") }} />
      <Stack.Screen name="spike" options={{ title: t("title.spike") }} />
      <Stack.Screen name="calibrate" options={{ title: t("title.calibrate") }} />
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
      <Paper>
        <View style={{ flex: 1, backgroundColor: C.paper }}>
          <Screens />
          <TabBar />
        </View>
      </Paper>
    </LangProvider>
  );
}
