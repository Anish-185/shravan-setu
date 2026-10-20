// Pre-test checklist ("Make sure…"). Idea and the six checks from DhwaniSarathi audiometer/app/Screens/BeforeTest1.js
// (Apache-2.0, the DhwaniSarathi team): quiet place, headphones, notifications off, equalizer neutral, no talking,
// noise cancelling off, then Next. Ours: our design and our own drawings (src/illustrations.tsx) instead of their
// pictures; "headphones" made specific (wired earphones: our test never plays through Bluetooth or the speaker).
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useT, type Key } from '@/i18n';
import {
  EqualizerNeutral, NoiseCancelOff, NoTalking, NotificationsOff, QuietPlace, WiredEarphones,
} from '@/illustrations';
import { Btn, C, F } from '@/ui';

const ITEMS: [typeof QuietPlace, Key][] = [
  [QuietPlace, 'ds.quietPlace'], [WiredEarphones, 'ds.headphones'], [NotificationsOff, 'ds.notificationsOff'],
  [EqualizerNeutral, 'ds.equalizerNeutral'], [NoTalking, 'ds.noTalking'], [NoiseCancelOff, 'ds.noiseCancelOff'],
];

export default function MakeSure({ onNext }: { onNext: () => void }) {
  const t = useT();
  const { width } = useWindowDimensions();
  const size = Math.min(120, (width - 40 - 12) / 2 - 24);
  return (
    <View style={{ gap: 16 }}>
      <Text accessibilityRole="header" style={st.title}>{t('ds.makeSure')}</Text>
      <View style={st.grid}>
        {ITEMS.map(([Art, label]) => (
          <View key={label} style={st.tile}>
            <Art size={size} />
            <Text style={st.label}>{t(label)}</Text>
          </View>
        ))}
      </View>
      <Btn title={t('ds.next')} onPress={onNext} />
    </View>
  );
}

const st = StyleSheet.create({
  title: { color: C.night, fontFamily: F.title, fontSize: 26, lineHeight: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '48%', flexGrow: 1, alignItems: 'center', gap: 6, backgroundColor: C.white, borderRadius: 20, paddingVertical: 12,
    paddingHorizontal: 8, borderWidth: 1, borderColor: C.lilac },
  label: { color: C.night, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25, textAlign: 'center' },
});
