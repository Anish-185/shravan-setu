// Bottom tab bar: Home, Children, Assignments, Cases, Settings. The original DhwaniSarathi home had a bottom button
// row (Start Test, Noise Data, ...); this is ours. Hidden at login and while a test runs, so a stray tap can't leave it.
import { router, usePathname, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';

import { useAuth } from '@/auth';
import { useT, type Key } from '@/i18n';
import { Icon, type IconName } from '@/icons';
import { C, F } from '@/ui';

const TABS: { icon: IconName; label: Key; href: Href; match: (p: string) => boolean }[] = [
  { icon: 'house', label: 'tab.home', href: '/', match: (p) => p === '/' || p.startsWith('/teacher/c') },
  { icon: 'users', label: 'tab.children', href: '/children', match: (p) => p.startsWith('/children') || p.startsWith('/child/') },
  { icon: 'clipboard-list', label: 'ds.assignments', href: '/assignments', match: (p) => p.startsWith('/assignments') || p.startsWith('/teacher/a') },
  { icon: 'folder-heart', label: 'tab.cases', href: '/cases', match: (p) => p.startsWith('/cases') || p.startsWith('/camp') },
  { icon: 'settings', label: 'tab.settings', href: '/settings', match: (p) => p.startsWith('/settings') },
];

export function TabBar() {
  const t = useT();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const { teacher } = useAuth();
  if (!teacher || path.startsWith('/screen/') || path.startsWith('/detailed/')) return null;
  return (
    <View style={[st.bar, { paddingBottom: insets.bottom + 4 }]}>
      {TABS.map((tab) => {
        const on = tab.match(path);
        return (
          <Pressable key={tab.label} accessibilityRole="tab" accessibilityState={{ selected: on }} style={st.tab}
            onPress={() => (on ? null : router.navigate(tab.href))}>
            <View style={[st.pill, on && st.pillOn]}>
              {on && <Svg width={22} height={7} style={st.arch}><Path d="M2 6a9 5 0 0 1 18 0" stroke={C.marigold} strokeWidth={2.5} fill="none" strokeLinecap="round" /></Svg>}
              <Icon name={tab.icon} size={22} color={on ? C.indigo : C.dusk} stroke={on ? 2.2 : 1.75} />
            </View>
            <Text style={[st.label, { color: on ? C.indigo : C.dusk }]} numberOfLines={1}>{t(tab.label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.lilac, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  label: { fontFamily: F.uiMed, fontSize: 12, lineHeight: 20 },
  pill: { width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: C.indigoTint },
  arch: { position: 'absolute', top: -8 },
});
