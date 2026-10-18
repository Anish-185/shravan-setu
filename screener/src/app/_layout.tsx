import { Stack } from "expo-router";

import { LangProvider, LangToggle, useT } from "@/i18n";

// Titles here, or expo-router shows route file names ("index", "screen/[childId]"). Every screen gets the
// English/Telugu toggle in its header.
function Screens() {
  const t = useT();
  return (
    <Stack screenOptions={{ headerRight: () => <LangToggle /> }}>
      <Stack.Screen name="index" options={{ title: t("title.home") }} />
      <Stack.Screen name="children" options={{ title: t("title.children") }} />
      <Stack.Screen name="screen/[childId]" options={{ title: t("title.screen") }} />
      <Stack.Screen name="cases/index" options={{ title: t("title.cases") }} />
      <Stack.Screen name="cases/[caseId]" options={{ title: t("title.case") }} />
      <Stack.Screen name="camp" options={{ title: t("title.camp") }} />
      <Stack.Screen name="sync" options={{ title: t("title.sync") }} />
      <Stack.Screen name="settings" options={{ title: t("title.settings") }} />
      <Stack.Screen name="spike" options={{ title: t("title.spike") }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LangProvider>
      <Screens />
    </LangProvider>
  );
}
