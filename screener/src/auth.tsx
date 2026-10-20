// Demo teacher login, on this phone only: any teacher name and a PIN kept here (the first login sets the PIN). No
// accounts, no server, no Firebase (the original signed in with Firebase). Remembered until Logout in Settings.
// Demo only, not authentication: the PIN is stored as typed.
import { createContext, useContext, useState, type ReactNode } from 'react';

import { db } from '@/db';
import { kvGet, kvSet } from '@/db/store';

type Auth = { teacher: string | null; login: (name: string, pin: string) => boolean; logout: () => void };
const Ctx = createContext<Auth>({ teacher: null, login: () => false, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState(() => kvGet(db, 'teacher_session') || null);
  const login = (name: string, pin: string) => {
    const saved = kvGet(db, 'teacher_pin');
    if (saved !== null && saved !== pin) return false;
    if (saved === null) kvSet(db, 'teacher_pin', pin);
    kvSet(db, 'teacher_name', name);
    kvSet(db, 'teacher_session', name);
    setTeacher(name);
    return true;
  };
  const logout = () => {
    kvSet(db, 'teacher_session', '');
    setTeacher(null);
  };
  return <Ctx.Provider value={{ teacher, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
