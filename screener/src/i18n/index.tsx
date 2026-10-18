// Language choice (English / Telugu), kept on the phone and switchable from every screen's header.
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { db } from '@/db';
import { kvGet, kvSet } from '@/db/store';

import { pick, tr, type Key, type Lang, type Text as T } from './strings';

export { pick, tr, type Key, type Lang } from './strings';

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'en', setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>(() => (kvGet(db, 'lang') === 'te' ? 'te' : 'en'));
  const setLang = (l: Lang) => {
    kvSet(db, 'lang', l);
    set(l);
  };
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

/** t('key', {vars}) for UI strings; tx({en, te}) for text that lives in config (triage questions, reminders). */
export function useT() {
  const { lang } = useContext(Ctx);
  return Object.assign((key: Key, vars?: Record<string, string | number>) => tr(lang, key, vars), {
    x: (text: T, vars?: Record<string, string | number>) => pick(text, lang, vars),
  });
}

/** Header button: switches English <-> Telugu. */
export function LangToggle() {
  const { lang, setLang } = useLang();
  const t = useT();
  return (
    <Pressable accessibilityRole="button" onPress={() => setLang(lang === 'en' ? 'te' : 'en')} style={{ padding: 8 }}>
      <Text style={{ color: '#0a58ca', fontWeight: '600' }}>{t(lang === 'en' ? 'lang.switchToTe' : 'lang.switchToEn')}</Text>
    </Pressable>
  );
}
