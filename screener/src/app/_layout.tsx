import { Stack } from "expo-router";

// Titles here, or expo-router shows route file names ("index", "screen/[childId]"). English only until the
// Telugu strings are written by [TELUGU_SPEAKER].
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Hearing screening" }} />
      <Stack.Screen name="children" options={{ title: "Children" }} />
      <Stack.Screen name="screen/[childId]" options={{ title: "Screening test" }} />
      <Stack.Screen name="sync" options={{ title: "Sync" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="spike" options={{ title: "Audio spike (developer)" }} />
    </Stack>
  );
}
