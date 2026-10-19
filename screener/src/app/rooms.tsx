// Quiet-spot finder: measure room noise (same measurement as the pre-test step) in each room at different hours,
// keep the readings on the phone, and show the quietest room and hour first. Relative levels only, never decibels.
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';

import { useScreeningAudio } from '@/audio/useScreeningAudio';
import { cfg } from '@/config';
import { db } from '@/db';
import { list, put } from '@/db/store';
import { useT } from '@/i18n';
import { ambientLevel, v, type Sample } from '@/rules';
import { rankQuietSpots, slotLabel, type RoomReading } from '@/rooms';
import { Btn, Card, P, s } from '@/ui';

export default function Rooms() {
  const t = useT();
  const audio = useScreeningAudio(cfg);
  const [micStart, setMicStart] = useState<number | null>(null);
  const [room, setRoom] = useState('');
  const [measuring, setMeasuring] = useState(false);
  const [msg, setMsg] = useState('');
  const [readings, setReadings] = useState(() => list<RoomReading>(db, 'room_reading'));

  useEffect(() => {
    // Earphones in, like a real test: the inline mic is what noise.reference_quiet_db was measured with.
    audio.startMic().then((ms) => ms !== null && setMicStart(ms)).catch(() => {}); // error shown via audio.error
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function measure() {
    if (micStart === null) return;
    const samples: Sample[] = [];
    setMeasuring(true);
    setMsg('');
    audio.setListeners({ onSample: (dB, at) => samples.push({ t: at, db: dB }) });
    const wait = Math.max(0, micStart + v(cfg, 'noise', 'mic_settle_ms') - Date.now()) + v(cfg, 'noise', 'ambient_measure_ms');
    setTimeout(() => {
      audio.setListeners({});
      setMeasuring(false);
      const amb = ambientLevel(samples, micStart, audio.deviceChanges(), cfg);
      if (amb.db_re_reference === null) return setMsg(t('ambient.couldNot'));
      const now = new Date();
      put(db, 'room_reading', Crypto.randomUUID(), {
        room: room.trim(), slot: now.getHours(), at: now.toISOString(), db_re_reference: amb.db_re_reference, valid: amb.valid,
      });
      setReadings(list<RoomReading>(db, 'room_reading'));
    }, wait);
  }

  const spots = rankQuietSpots(readings);
  const gate = v(cfg, 'noise', 'gate_db_above_baseline');
  const fmt = (x: number) => `${x > 0 ? '+' : ''}${x.toFixed(1)}`;
  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={s.muted}>{t('rooms.p')}</Text>
      {!(audio.micOn && audio.earphones) && <Text style={s.warn}>{audio.error || t('device.notDetected')}</Text>}
      <TextInput style={s.input} value={room} onChangeText={setRoom} placeholder={t('rooms.name')} />
      <Btn icon="volume-2" title={t(measuring ? 'ambient.measuring' : 'rooms.measure')} onPress={measure}
        disabled={measuring || !room.trim() || !audio.earphones || micStart === null} />
      {!!msg && <P>{msg}</P>}
      {spots.length === 0 ? <Text style={s.muted}>{t('rooms.none')}</Text> : (
        <Card>
          <P>{t('rooms.best', { room: spots[0].room, slot: slotLabel(spots[0].slot) })}</P>
          {spots.map((x) => (
            <Text key={`${x.room}|${x.slot}`} style={s.p}>
              {t('rooms.row', { room: x.room, slot: slotLabel(x.slot), value: fmt(x.median), n: x.n })}
              {x.median > gate ? ` · ${t('rooms.noisy')}` : ''}
            </Text>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
