// Shared bits for every screen. The banner is permanent on every result-bearing screen (CLAUDE.md rule 4).
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function Banner() {
  return (
    <View style={s.banner}>
      <Text style={s.bannerText}>Screening only, not a diagnosis</Text>
    </View>
  );
}

export function Btn({ title, onPress, disabled, kind = 'primary' }: {
  title: string; onPress: () => void; disabled?: boolean; kind?: 'primary' | 'plain' | 'danger';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[s.btn, kind === 'plain' && s.btnPlain, kind === 'danger' && s.btnDanger, disabled && s.btnDisabled]}>
      <Text style={[s.btnText, kind === 'plain' && s.btnPlainText]}>{title}</Text>
    </Pressable>
  );
}

export function Chips<T extends string>({ options, value, onChange }: {
  options: readonly T[]; value: T | null; onChange: (v: T) => void;
}) {
  return (
    <View style={s.chips}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} style={[s.chip, value === o && s.chipOn]}>
          <Text style={value === o ? s.chipOnText : undefined}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={s.check}>
      <Text style={s.checkBox}>{value ? '☑' : '☐'}</Text>
      <Text style={s.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export const H = ({ children }: { children: ReactNode }) => <Text style={s.h}>{children}</Text>;
export const P = ({ children }: { children: ReactNode }) => <Text style={s.p}>{children}</Text>;

export const s = StyleSheet.create({
  screen: { padding: 16, gap: 12 },
  banner: { backgroundColor: '#fff3cd', borderColor: '#b58105', borderWidth: 1, borderRadius: 6, padding: 8 },
  bannerText: { color: '#664d03', fontWeight: '600', textAlign: 'center' },
  btn: { backgroundColor: '#0a58ca', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnPlain: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#0a58ca' },
  btnDanger: { backgroundColor: '#b02a37' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: 'white', fontSize: 17, fontWeight: '600' },
  btnPlainText: { color: '#0a58ca' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#888', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipOn: { backgroundColor: '#0a58ca', borderColor: '#0a58ca' },
  chipOnText: { color: 'white' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkBox: { fontSize: 24 },
  checkLabel: { flex: 1, fontSize: 16 },
  h: { fontSize: 20, fontWeight: '700' },
  p: { fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 6, padding: 10, fontSize: 16 },
  warn: { color: '#b02a37', fontWeight: '600' },
  ok: { color: '#146c43', fontWeight: '600' },
});
