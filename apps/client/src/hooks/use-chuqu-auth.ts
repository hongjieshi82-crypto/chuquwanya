import type { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { getBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase-browser';

export type AuthView = 'password' | 'email-code' | 'signup' | 'signup-code' | 'forgot' | 'reset-code';

export function useChuquAuth() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      queueMicrotask(() => {
        setMessage('Supabase 环境变量缺失，无法登录。');
        setLoading(false);
      });
      return;
    }
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const run = useCallback(async (operation: () => Promise<{ error: { message: string } | null }>) => {
    setMessage('');
    try {
      const { error } = await operation();
      if (error) { setMessage(mapError(error.message)); return false; }
      return true;
    } catch {
      setMessage('登录服务暂时不可用，请检查网络后重试。');
      return false;
    }
  }, []);

  return {
    configured: isSupabaseConfigured(), loading, user, session, message,
    clearMessage: () => setMessage(''),
    signIn: (email: string, password: string) => run(async () => {
      const client = getBrowserSupabase()!;
      return await client.auth.signInWithPassword({ email, password });
    }),
    signUp: (email: string, password: string) => run(async () => {
      const client = getBrowserSupabase()!;
      return await client.auth.signUp({ email, password });
    }),
    verifySignUpCode: (email: string, token: string) => run(async () => {
      const client = getBrowserSupabase()!;
      return await client.auth.verifyOtp({ email, token, type: 'signup' });
    }),
    resendSignUpCode: (email: string) => run(async () => {
      const client = getBrowserSupabase()!;
      return await client.auth.resend({ type: 'signup', email });
    }),
    sendLoginCode: (email: string) => run(async () => {
      const client = getBrowserSupabase()!;
      return await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    }),
    verifyLoginCode: (email: string, token: string) => run(async () => {
      const client = getBrowserSupabase()!;
      return await client.auth.verifyOtp({ email, token, type: 'email' });
    }),
    startPasswordReset: (email: string) => run(async () => {
      const client = getBrowserSupabase()!;
      return await client.auth.resetPasswordForEmail(email);
    }),
    resetPasswordWithCode: async (email: string, token: string, password: string) => {
      const client = getBrowserSupabase()!;
      const verified = await run(() => client.auth.verifyOtp({ email, token, type: 'recovery' }));
      return verified && await run(() => client.auth.updateUser({ password }));
    },
    signOut: async () => { await getBrowserSupabase()?.auth.signOut(); },
  };
}

function mapError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login')) return '邮箱或密码不正确。';
  if (normalized.includes('expired') || normalized.includes('invalid token')) return '验证码不正确或已过期。';
  if (normalized.includes('not found')) return '该邮箱尚未注册。';
  return message;
}
