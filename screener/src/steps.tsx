// Consent and device-check steps, shared by the screening (src/app/screen/[childId].tsx) and the detailed test
// (src/app/detailed/[childId].tsx). Moved unchanged from the screening screen. Consent is recorded before any test.
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ScreeningAudio as Audio } from '@/audio/useScreeningAudio';
import { db } from '@/db';
import { kvGet, put } from '@/db/store';
import { useT } from '@/i18n';
import { Btn, C, Card, Check, Chips, H, P, Pill, s } from '@/ui';

const GIVEN_BY = ['parent', 'guardian'] as const;
const METHODS = ['written', 'verbal', 'school_form'] as const;

export function ConsentStep({ childId, onDone }: { childId: string; onDone: (consentId: string) => void }) {
  const t = useT();
  const [by, setBy] = useState<(typeof GIVEN_BY)[number] | null>(null);
  const [method, setMethod] = useState<(typeof METHODS)[number] | null>(null);
  return (
    <View style={st.step}>
      <H>{t('consent.h')}</H>
      <Text style={s.muted}>{t('consent.p')}</Text>
      <Card>
        <Chips options={GIVEN_BY} value={by} onChange={setBy} label={(o) => t(`consent.by.${o}`)} />
        <View style={st.rule} />
        <Chips options={METHODS} value={method} onChange={setMethod} label={(o) => t(`consent.method.${o}`)} />
      </Card>
      <Btn icon="signature" title={t('consent.continue')} disabled={!by || !method} onPress={() => {
        const id = Crypto.randomUUID();
        put(db, 'consent', id, { child: childId, given_by: by, method, given_at: new Date().toISOString() });
        onDone(id);
      }} />
      <Btn kind="plain" title={t('consent.stop')} onPress={() => router.back()} />
    </View>
  );
}

export function DeviceStep({ audio, onMic, onDone }: { audio: Audio; onMic: (t: number) => void; onDone: () => void }) {
  const t = useT();
  const [volumeOk, setVolumeOk] = useState(false);
  const [btOff, setBtOff] = useState(false);
  const earphone = kvGet(db, 'earphone_model');
  const volume = kvGet(db, 'volume_setting');

  useEffect(() => {
    // The mic runs from here to the end of the session: earphone detection and noise gating both need it.
    audio.startMic().then((ms) => ms !== null && onMic(ms)).catch(() => {}); // the error is shown via audio.error
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={st.step}>
      <H>{t('device.h')}</H>
      <Card>
        <P>{t('device.phone', { model: Device.modelName ?? '?' })}</P>
        <P>{t('device.earphones', { model: earphone || t('device.notSetSettings') })}</P>
        <P>{t('device.volume', { setting: volume || t('device.notSetSettings') })}</P>
      </Card>
      {audio.micOn && audio.earphones
        ? <Pill icon="headphones" text={t('device.detected')} tint={C.okTint} color={C.okText} />
        : <Text style={s.warn}>{audio.micOn ? t('device.notDetected') : t('device.micStarting')}</Text>}
      <Check label={t('device.volumeOk', { setting: volume || '?' })} value={volumeOk} onChange={setVolumeOk} />
      <Check label={t('device.btOff')} value={btOff} onChange={setBtOff} />
      <Btn title={t('common.continue')} onPress={onDone}
        disabled={!audio.earphones || !volumeOk || !btOff || !earphone || !volume} />
    </View>
  );
}

const st = StyleSheet.create({
  step: { gap: 14 },
  rule: { height: 1, backgroundColor: C.lilac },
});
