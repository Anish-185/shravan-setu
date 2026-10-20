// Bottom tab bar: Home, Children, Cases, Teacher, Settings. The original DhwaniSarathi app has none (its _layout.js is
// a Slot under an empty Header), so this is ours. Hidden while a test runs, so a stray tap can't leave it.
import { router, usePathname, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT, type Key } from '@/i18n';
import { Icon, type IconName } from '@/icons';
import { C, F } from '@/ui';

const TABS: { icon: IconName; label: Key; href: Href; match: (p: string) => boolean }[] = [
  { icon: 'house', label: 'tab.home', href: '/', match: (p) => p === '/' },
  { icon: 'users', label: 'tab.children', href: '/children', match: (p) => p.startsWith('/children') },
  { icon: 'folder-heart', label: 'tab.cases', href: '/cases', match: (p) => p.startsWith('/cases') },
  { icon: 'clipboard-list', label: 'tab.teacher', href: '/teacher/login', match: (p) => p.startsWith('/teacher') || p.startsWith('/results') },
  { icon: 'settings', label: 'tab.settings', href: '/settings', match: (p) => p.startsWith('/settings') },
];

export function TabBar() {
  const t = useT();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  if (path.startsWith('/screen/') || path.startsWith('/detailed/')) return null;
  return (
    <View style={[st.bar, { paddingBottom: insets.bottom + 4 }]}>
      {TABS.map((tab) => {
        const on = tab.match(path);
        return (
          <Pressable key={tab.label} accessibilityRole="tab" accessibilityState={{ selected: on }} style={st.tab}
            onPress={() => (on ? null : router.navigate(tab.href))}>
            <Icon name={tab.icon} size={22} color={on ? C.indigo : C.dusk} stroke={on ? 2.2 : 1.75} />
            <Text style={[st.label, { color: on ? C.indigo : C.dusk }]} numberOfLines={1}>{t(tab.label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.lilac, paddingTop: 4 },
  tab: { flex: 1, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  label: { fontFamily: F.uiMed, fontSize: 12, lineHeight: 20 },
});
