// English + Telugu text. Telugu is written by a person ([TELUGU_SPEAKER]), never machine-translated (CLAUDE.md).
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
