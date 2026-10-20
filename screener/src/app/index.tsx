// Home = the teacher's page, where login lands. Ideas from DhwaniSarathi audiometer/app/Screens/Educator/EducatorHome.js
// (Apache-2.0, the DhwaniSarathi team): welcome with the teacher's name and institute, today's date, Create Classroom
// and the classroom list. Ours: the Night band with the setu line, "Screen a child" first, sync and quiet-spot links.
// Developer screens (audio spike, calibration) live in Settings → Developer.
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Band, Muggu } from '@/art';
import { useAuth } from '@/auth';
import { db } from '@/db';
import { kvGet, list, outbox } from '@/db/store';
import { useT, type Key } from '@/i18n';
import { Icon, type IconName } from '@/icons';
import ClassroomList from '@/teacher/ClassroomList';
import { ymd } from '@/teacher/data';
import { C, F, LinkBtn, s, SectionH, Tile } from '@/ui';

export default function Home() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { teacher } = useAuth();
  const [counts, setCounts] = useState({ cases: 0, sync: 0 });
  // Back from a test, a case or a sync: the numbers may have moved.
  useFocusEffect(useCallback(() => setCounts({
    cases: list<{ status: string }>(db, 'case').filter((c) => !c.status.startsWith('closed')).length,
    sync: outbox(db).filter((r) => r.status !== 'synced').length,
  }), []));
  const school = kvGet(db, 'school_name');
  const today = ymd(new Date()).split('-').reverse().join('-'); // DD-MM-YYYY, as the original; same in both languages

  return (
    <ScrollView style={{ backgroundColor: C.paper }} contentContainerStyle={{ paddingBottom: 28 }}>
      <Band top={insets.top} title={t('home.welcome', { name: `\n${teacher ?? ''}` })} sub={school || t('children.pickSchool')}
        figure={{ source: require('../../assets/images/peeps/home-teacher.png'), w: 95, h: 128 }}>
        <View style={st.date}>
          <Icon name="calendar-clock" size={16} color={C.marigold} />
          <Text style={st.dateText}>{today}</Text>
        </View>
      </Band>

      <View style={st.body}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/children')}
          style={({ pressed }) => [st.primary, pressed && s.pressed]}>
          <Muggu color={C.white} opacity={0.08} size={18} dot={1.6} />
          <Tile name="ear" tint={C.marigold} />
          <View style={{ flex: 1 }}>
            <Text style={st.primaryText}>{t('home.screen')}</Text>
            <Text style={st.primarySub}>{t('home.screenSub')}</Text>
          </View>
          <Icon name="chevron-right" size={22} color={C.white} />
        </Pressable>

        <View style={st.tiles}>
          <Small icon="folder-heart" tint={C.indigoTint} label="home.openCases" n={counts.cases} href="/cases" />
          <Small icon="cloud-upload" tint={C.marigoldTint} label="home.sync" n={counts.sync} href="/sync" />
          <Small icon="calendar-clock" tint={C.indigoTint} label="title.rooms" href="/rooms" />
        </View>

        <SectionH title={t('teacher.classrooms')}
          action={<LinkBtn icon="plus" title={t('home.newClass')} onPress={() => router.push('/teacher/create')} />} />
        {kvGet(db, 'school_id') ? <ClassroomList /> : <Text style={s.muted}>{t('children.pickSchool')}</Text>}
      </View>
    </ScrollView>
  );
}

function Small({ icon, tint, label, n, href }: { icon: IconName; tint: string; label: Key; n?: number; href: Href }) {
  const t = useT();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(href)} style={({ pressed }) => [st.small, pressed && s.pressed]}>
      <View style={st.smallTop}>
        <Tile name={icon} tint={tint} size={38} />
        {n !== undefined && <Text style={st.n}>{n}</Text>}
      </View>
      <Text style={st.smallText}>{t(label)}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  date: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10,
    paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(244,163,0,0.5)' },
  dateText: { color: C.dawn, fontFamily: F.uiMed, fontSize: 14, lineHeight: 24 },
  body: { padding: 20, paddingTop: 16, gap: 14 },
  primary: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.indigo, borderRadius: 24, padding: 16,
    paddingHorizontal: 18, overflow: 'hidden', minHeight: 84 },
  primaryText: { color: C.white, fontFamily: F.uiBold, fontSize: 19, lineHeight: 31 },
  primarySub: { color: C.bandText, fontFamily: F.ui, fontSize: 14, lineHeight: 24 },
  tiles: { flexDirection: 'row', gap: 10 },
  small: { flex: 1, backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.lilac, padding: 12, gap: 8 },
  smallTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  n: { color: C.night, fontFamily: F.title, fontSize: 24, lineHeight: 36 },
  smallText: { color: C.night, fontFamily: F.uiMed, fontSize: 14, lineHeight: 23 },
});
