// Shared bits for every screen: Direction B v2 "Setu Line" tokens and components (docs/DESIGN.md).
// "Screening only, not a diagnosis" is stated in the camp-request PDF and the docs, not on app screens (CLAUDE.md rule 4).
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useLang, useT } from '@/i18n';
import { Icon, type IconName } from '@/icons';

/** Colours (docs/DESIGN.md section 0 and 4B; contrast pairs checked by scripts/check_contrast.py). */
export const C = {
  night: '#1D1A4E', paper: '#F7F7FB', white: '#FFFFFF', indigo: '#3B35B8', marigold: '#F4A300', dusk: '#5B5A7A',
  lilac: '#E2E1EE', lavender: '#D9D4FF', dawn: '#FFE1A8', coral: '#EF4E3A', bandText: '#CFCBF7',
  indigoTint: '#EEEDF8', marigoldTint: '#FFF0D1', greyTint: '#EDEDF2', routeTint: '#F1F0F7',
  warnBg: '#FFE9DE', warnLine: '#B23C00', warnText: '#8F2A00', okText: '#2E6B47', okTint: '#E5F1EA', amber: '#7A4F00',
};

/** Font families as loaded in app/_layout.tsx. Weights are separate families: Android ignores fontWeight for them. */
export const F = {
  ui: 'Hind', uiMed: 'Hind-Medium', uiBold: 'Hind-SemiBold', title: 'Tiro', quote: 'Tiro-Italic', child: 'Baloo',
};

export const OUTCOME = {
  PASS: { fill: '#006B7A', on: C.white, tint: '#DDF2F4', onTint: '#005F6B', icon: 'circle-check' },
  RETEST: { fill: '#F2B33D', on: C.night, tint: '#FFF0D1', onTint: '#7A4F00', icon: 'rotate-ccw' },
  REFER: { fill: '#B23C00', on: C.white, tint: '#FCE6D9', onTint: '#A33A00', icon: 'send' },
} as const satisfies Record<string, { fill: string; on: string; tint: string; onTint: string; icon: IconName }>;

/** Header button: switches English <-> Telugu. A marigold pill on the dark Home band, indigo elsewhere. */
export function LangToggle({ onNight }: { onNight?: boolean }) {
  const { lang, setLang } = useLang();
  const t = useT();
  const c = onNight ? C.marigold : C.indigo;
  return (
    <Pressable accessibilityRole="button" onPress={() => setLang(lang === 'en' ? 'te' : 'en')} hitSlop={4}
      style={[s.lang, { borderColor: c }]}>
      <Icon name="languages" size={18} color={c} />
      <Text style={[s.langText, { color: c }]}>{t(lang === 'en' ? 'lang.switchToTe' : 'lang.switchToEn')}</Text>
    </Pressable>
  );
}

/** Small icon + text line with no box (UNCALIBRATED). */
export function Note({ icon, color, text }: { icon: IconName; color: string; text: string }) {
  return (
    <View style={s.note}>
      <Icon name={icon} size={15} color={color} />
      <Text style={[s.noteText, { color }]}>{text}</Text>
    </View>
  );
}

export function Btn({ title, onPress, disabled, kind = 'primary', icon }: {
  title: string; onPress: () => void; disabled?: boolean; kind?: 'primary' | 'plain' | 'danger'; icon?: IconName;
}) {
  const fg = kind === 'plain' ? C.indigo : C.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, kind === 'plain' && s.btnPlain, kind === 'danger' && s.btnDanger,
        disabled && s.btnDisabled, pressed && s.pressed]}>
      {icon && <Icon name={icon} size={20} color={fg} />}
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chips<T extends string>({ options, value, onChange, label = (o) => o }: {
  options: readonly T[]; value: T | null; onChange: (v: T) => void; label?: (o: T) => string;
}) {
  return (
    <View style={s.chips}>
      {options.map((o) => (
        <Pressable key={o} accessibilityRole="button" accessibilityState={{ selected: value === o }}
          onPress={() => onChange(o)} style={[s.chip, value === o && s.chipOn]}>
          {value === o && <Icon name="check" size={16} color={C.white} stroke={2.4} />}
          <Text style={[s.chipText, value === o && { color: C.white }]}>{label(o)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={s.check}>
      <View style={[s.checkBox, value && s.checkBoxOn]}>{value && <Icon name="check" size={18} color={C.white} stroke={3} />}</View>
      {!!label && <Text style={s.checkLabel}>{label}</Text>}
    </Pressable>
  );
}

/** Small speaker button for one voice line; shows a "voice placeholder" tag in dev builds while it's silent. */
export function VoiceBtn({ onPress, placeholder }: { onPress: () => void; placeholder: boolean }) {
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.playVoice')} onPress={onPress}
        style={({ pressed }) => [s.voice, pressed && s.pressed]}>
        <Icon name="volume-2" size={22} color={C.indigo} />
      </Pressable>
      {__DEV__ && placeholder && <Text style={s.tag}>{t('test.voicePlaceholder')}</Text>}
    </View>
  );
}

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) =>
  <View style={[s.card, style]}>{children}</View>;

/** Rounded tile with a soft tint behind a list icon. */
export const Tile = ({ name, tint = C.indigoTint, size = 42 }: { name: IconName; tint?: string; size?: number }) => (
  <View style={[s.tile, { backgroundColor: tint, width: size, height: size }]}><Icon name={name} size={size >= 42 ? 22 : 20} /></View>
);

/** Tint + icon + word: case statuses, ear outcomes, routes. */
export function Pill({ icon, text, tint, color }: { icon: IconName; text: string; tint: string; color: string }) {
  return (
    <View style={[s.pill, { backgroundColor: tint }]}>
      <Icon name={icon} size={15} color={color} />
      <Text style={[s.pillText, { color }]}>{text}</Text>
    </View>
  );
}

export const STATUS: Record<string, { icon: IconName; tint: string; color: string }> = {
  screened: { icon: 'ear', tint: C.indigoTint, color: C.indigo },
  referred: { icon: 'send', tint: C.indigoTint, color: C.indigo },
  camp_scheduled: { icon: 'tent', tint: C.marigoldTint, color: '#7A4F00' },
  missed: { icon: 'calendar-x', tint: OUTCOME.REFER.tint, color: OUTCOME.REFER.onTint },
  rescheduled: { icon: 'calendar-clock', tint: C.marigoldTint, color: '#7A4F00' },
  seen: { icon: 'stethoscope', tint: C.indigoTint, color: C.indigo },
  treated: { icon: 'heart-pulse', tint: C.okTint, color: C.okText },
  closed: { icon: 'archive', tint: C.routeTint, color: C.dusk },
  closed_lost_to_followup: { icon: 'archive', tint: C.routeTint, color: C.dusk },
};

export function StatusPill({ status, text }: { status: string; text: string }) {
  const st = STATUS[status] ?? STATUS.closed;
  return <Pill icon={st.icon} text={text} tint={st.tint} color={st.color} />;
}

/** Vermillion-bordered warning block (triage label). Never collapsed. */
export function Warn({ children }: { children: ReactNode }) {
  return (
    <View style={s.warnBox}>
      <Icon name="triangle-alert" size={22} color={C.warnLine} stroke={2} />
      <Text style={s.warnBoxText}>{children}</Text>
    </View>
  );
}

export const H = ({ children }: { children: ReactNode }) => <Text accessibilityRole="header" style={s.h}>{children}</Text>;
export const P = ({ children }: { children: ReactNode }) => <Text style={s.p}>{children}</Text>;

// Line heights are set for Telugu (about 1.7x), which stacks vowel signs above and below the line; English uses the same.
export const s = StyleSheet.create({
  screen: { padding: 20, gap: 14, backgroundColor: C.paper, flexGrow: 1 },
  lang: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 14, borderRadius: 999,
    borderWidth: 1.5 },
  langText: { fontFamily: F.uiBold, fontSize: 14, lineHeight: 24 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteText: { flex: 1, fontFamily: F.ui, fontSize: 13, lineHeight: 22 },
  btn: { flexDirection: 'row', gap: 10, backgroundColor: C.indigo, minHeight: 54, paddingVertical: 10, paddingHorizontal: 22,
    borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnPlain: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.indigo },
  btnDanger: { backgroundColor: OUTCOME.REFER.fill },
  btnDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnText: { flexShrink: 1, textAlign: 'center', color: C.white, fontFamily: F.uiBold, fontSize: 17, lineHeight: 28 },
  btnPlainText: { color: C.indigo },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, borderWidth: 1.5, borderColor: C.lilac,
    backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 16 },
  chipOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  chipText: { color: C.night, fontFamily: F.uiMed, fontSize: 15, lineHeight: 26 },
  chipOnText: { color: C.white },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  // Drawn box, not a ☑/☐ glyph: the glyph's look depends on the phone's fonts. The label shrinks, never grows,
  // so a Check without a label stays box-sized inside a row (ERR-031).
  checkBox: { width: 28, height: 28, borderWidth: 2, borderColor: C.indigo, borderRadius: 8, backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center' },
  checkBoxOn: { backgroundColor: C.indigo },
  checkLabel: { flexShrink: 1, color: C.night, fontFamily: F.ui, fontSize: 16, lineHeight: 27 },
  voice: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: C.indigo, backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: C.white, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: C.lilac, gap: 10 },
  tile: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999,
    paddingVertical: 3, paddingHorizontal: 11 },
  pillText: { fontFamily: F.uiBold, fontSize: 14, lineHeight: 24 },
  warnBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.warnBg, borderColor: C.warnLine,
    borderWidth: 1.5, borderRadius: 16, padding: 14 },
  warnBoxText: { flex: 1, color: C.warnText, fontFamily: F.uiBold, fontSize: 15, lineHeight: 25 },
  h: { color: C.night, fontFamily: F.title, fontSize: 24, lineHeight: 38 },
  p: { color: C.night, fontFamily: F.ui, fontSize: 16, lineHeight: 27 },
  muted: { color: C.dusk, fontFamily: F.ui, fontSize: 16, lineHeight: 27 },
  input: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.lilac, borderRadius: 14, paddingHorizontal: 14,
    minHeight: 52, color: C.night, fontFamily: F.ui, fontSize: 16 },
  warn: { color: C.warnText, fontFamily: F.uiBold, fontSize: 16, lineHeight: 27 },
  ok: { color: C.okText, fontFamily: F.uiBold, fontSize: 16, lineHeight: 27 },
  tag: { fontSize: 12, lineHeight: 20, fontFamily: F.ui, color: '#7A4F00', backgroundColor: C.marigoldTint, paddingHorizontal: 6, borderRadius: 4 },
});
