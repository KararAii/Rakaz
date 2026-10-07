import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type Account, AccountType } from '@/types/models';
import { Fmt } from '@/utils/fmt';
import { Haptics } from '@/utils/haptics';
import { isRecord, Storage } from '@/utils/storage';

export type SessionPhase = 'splash' | 'login' | 'resolvingAccount' | 'main';

export class AuthError extends Error {
  static invalidPhone = new AuthError('رقم الهاتف غير صحيح. أدخل رقماً عراقياً يبدأ بـ ٧ (١٠ أرقام).');
  static invalidCode = new AuthError('رمز التحقق غير صحيح. حاول مرة أخرى.');
  static invalidPassword = new AuthError('كلمة المرور غير صحيحة.');
}

export const DEMO_CODE = '123456';
const ACCOUNT_KEY = 'rakaz.account';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Normalizes to a 10-digit local number starting with 7 (Iraqi mobile). */
export function normalizePhone(raw: string): string {
  let d = Fmt.latinDigits(raw).replace(/\D/g, '');
  if (d.startsWith('964')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return d;
}

export function isValidPhone(phone: string): boolean {
  const d = normalizePhone(phone);
  return d.length === 10 && d.startsWith('7');
}

function isAccount(value: unknown): value is Account {
  return (
    isRecord(value) &&
    typeof value.phone === 'string' &&
    typeof value.name === 'string' &&
    typeof value.familyName === 'string' &&
    (value.type === AccountType.guardian || value.type === AccountType.student)
  );
}

export const [SessionStoreProvider, useSession] = createContextHook(() => {
  const [phase, setPhase] = useState<SessionPhase>('splash');
  const [account, setAccount] = useState<Account | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const accountRef = useRef<Account | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Storage.load(ACCOUNT_KEY, isAccount).then((saved) => {
      if (cancelled) return;
      accountRef.current = saved;
      setAccount(saved);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const finishSplash = useCallback(() => {
    setPhase(accountRef.current == null ? 'login' : 'main');
  }, []);

  /** After authentication the backend tells us the account type; guardians get the parent experience. */
  const signIn = useCallback(async (phone: string) => {
    setPhase('resolvingAccount');
    await sleep(1400);
    const next: Account = { phone: `+964${normalizePhone(phone)}`, name: 'أحمد محمد', familyName: 'عائلة أحمد', type: AccountType.guardian };
    accountRef.current = next;
    setAccount(next);
    Storage.save(ACCOUNT_KEY, next);
    Haptics.success();
    setPhase('main');
  }, []);

  const requestOTP = useCallback(async (phone: string) => {
    if (!isValidPhone(phone)) throw AuthError.invalidPhone;
    await sleep(900);
  }, []);

  const verify = useCallback(
    async (phone: string, code: string) => {
      await sleep(700);
      if (Fmt.latinDigits(code) !== DEMO_CODE) throw AuthError.invalidCode;
      await signIn(phone);
    },
    [signIn],
  );

  const login = useCallback(
    async (phone: string, password: string) => {
      if (!isValidPhone(phone)) throw AuthError.invalidPhone;
      await sleep(800);
      if (password.length < 4) throw AuthError.invalidPassword;
      await signIn(phone);
    },
    [signIn],
  );

  const logout = useCallback(() => {
    accountRef.current = null;
    setAccount(null);
    Storage.remove(ACCOUNT_KEY);
    setPhase('login');
  }, []);

  return useMemo(
    () => ({ phase, account, hydrated, finishSplash, requestOTP, verify, login, logout }),
    [phase, account, hydrated, finishSplash, requestOTP, verify, login, logout],
  );
});
