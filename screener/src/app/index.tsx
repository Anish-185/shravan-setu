// Home: the Night band with the setu line, then "Screen a child" and the teacher's other places. Scrolls, so long
// Telugu labels never get cut off. Developer screens (audio spike, calibration) live in Settings → Developer.
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Arch, Muggu, SetuLine } from '@/art';
import { db } from '@/db';
import { list, outbox } from '@/db/store';
import { useT, type Key } from '@/i18n';
import { Icon, type IconName } from '@/icons';
import { C, F, LangToggle, s, Tile } from '@/ui';

export default function Home() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [counts, setCounts] = useState({ cases: 0, sync: 0 });
  // Back from a test, a case or a sync: the numbers may have moved.
  useFocusEffect(useCallback(() => setCounts({
    cases: list(db, 'case').length, sync: outbox(db).filter((r) => r.status !== 'synced').length,
  }), []));

  return (
    <ScrollView style={{ backgroundColor: C.paper }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <View style={[st.band, { paddingTop: insets.top + 6 }]}>
        <Muggu color={C.marigold} opacity={0.13} />
        <View style={st.langRow}><LangToggle onNight /></View>
        <View style={st.hero}>
          <View style={{ flex: 1, paddingBottom: 22 }}>
            <Text style={st.name} accessibilityRole="header">Shravan{'\n'}Setu</Text>
            <Text style={st.sub}>{t('title.home')}</Text>
          </View>
          <Arch width={112} height={142} bg={C.indigo} border={C.marigold} source={require('../../assets/images/peeps/home-teacher.png')}
            imgWidth={95} imgHeight={128} offset={-6} />
        </View>
        <SetuLine color={C.marigold} height={60} style={{ marginTop: -18 }} />
      </View>

      <View style={st.body}>
        <Text style={s.muted}>{t('home.intro')}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/children')}
          style={({ pressed }) => [st.primary, pressed && s.pressed]}>
          <Muggu color={C.white} opacity={0.08} size={18} dot={1.6} />
          <Tile name="ear" tint={C.marigold} />
          <Text style={st.primaryText}>{t('home.screen')}</Text>
          <Icon name="chevron-right" size={22} color={C.white} />
        </Pressable>
        <View>
          <Row icon="folder-heart" tint={C.indigoTint} label="home.cases" n={counts.cases} href="/cases" />
          <Row icon="cloud-upload" tint={C.marigoldTint} label="home.sync" n={counts.sync} href="/sync" />
          <Row icon="settings" tint={C.greyTint} label="home.settings" n={0} href="/settings" />
        </View>
      </View>
    </ScrollView>
  );
}

function Row({ icon, tint, label, n, href }: { icon: IconName; tint: string; label: Key; n: number; href: Href }) {
  const t = useT();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(href)} style={({ pressed }) => [st.row, pressed && { opacity: 0.7 }]}>
      <Tile name={icon} tint={tint} />
      <Text style={st.rowText}>{t(label)}</Text>
      {n > 0 && <View style={st.count}><Text style={st.countText}>{n}</Text></View>}
      <Icon name="chevron-right" size={20} color={C.dusk} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  band: { backgroundColor: C.night, overflow: 'hidden', paddingBottom: 4 },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 18 },
  hero: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingLeft: 22, paddingRight: 18, paddingTop: 2 },
  name: { color: C.white, fontFamily: F.title, fontSize: 34, lineHeight: 42 },
  sub: { color: C.bandText, fontFamily: F.title, fontSize: 18, lineHeight: 32, marginTop: 6 },
  body: { padding: 20, paddingTop: 14, gap: 14 },
  primary: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.indigo, borderRadius: 24, padding: 16,
    paddingHorizontal: 18, overflow: 'hidden', minHeight: 76 },
  primaryText: { flex: 1, color: C.white, fontFamily: F.uiBold, fontSize: 18, lineHeight: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 68, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.lilac },
  rowText: { flex: 1, color: C.night, fontFamily: F.uiMed, fontSize: 17, lineHeight: 29 },
  count: { backgroundColor: C.indigoTint, borderRadius: 999, paddingHorizontal: 11, minWidth: 30, alignItems: 'center' },
  countText: { color: C.indigo, fontFamily: F.uiBold, fontSize: 14, lineHeight: 24 },
});
