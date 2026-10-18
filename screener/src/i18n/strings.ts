// English + Telugu text, written or reviewed line by line by a native Telugu speaker (CLAUDE.md, docs/TELUGU_REVIEW.md).
// A Telugu entry still "TODO_TE" shows the English text with a visible [TODO_TE] marker.
// strings.json is the one place to fill Telugu UI text; docs/TELUGU_STRINGS.md lists it (scripts/telugu_strings.py).
import strings from './strings.json';

export type Lang = 'en' | 'te';
export type Key = keyof typeof strings;
export type Text = { en: string; te: string };
type Vars = Record<string, string | number>;

export const TODO_TE = 'TODO_TE';
export const STRINGS: Record<Key, Text & { where: string }> = strings;

/** en or te text, {name} placeholders filled from vars. Missing Telugu falls back to English, visibly. */
export function pick(text: Text, lang: Lang, vars: Vars = {}) {
  const raw = lang === 'te' ? (text.te === TODO_TE ? `[TODO_TE] ${text.en}` : text.te) : text.en;
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export const tr = (lang: Lang, key: Key, vars?: Vars) => pick(STRINGS[key], lang, vars);

// Rule reasons (result, 500 Hz, triage) are made and stored in English by both rule engines (parity fixtures, server).
// To show one, match it against the English of the reason.* templates and fill that template's Telugu.
const REASONS = (Object.keys(STRINGS) as Key[]).filter((k) => k.startsWith('reason.')).map((k) => [k, new RegExp(
  `^${STRINGS[k].en.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\w+)\}/g, '(?<$1>.+?)')}$`)] as const);

/** The reason.* template a stored English reason was made from, with its filled values; null if none. */
export function reasonMatch(reason: string) {
  for (const [key, re] of REASONS) {
    const m = re.exec(reason);
    if (m) return { key, vars: { ...m.groups } as Vars };
  }
  return null;
}

/** A stored English rule reason in the UI language. An unknown reason falls back to English, visibly. */
export function reasonText(lang: Lang, reason: string) {
  const m = reasonMatch(reason);
  if (!m) return pick({ en: reason, te: TODO_TE }, lang);
  const { ear } = m.vars;
  if (ear === 'Left' || ear === 'Right') m.vars.ear = tr(lang, ear === 'Left' ? 'lr.left' : 'lr.right');
  return tr(lang, m.key, m.vars);
}
