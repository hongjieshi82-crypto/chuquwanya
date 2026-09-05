import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { type AuthView, useChuquAuth } from '@/hooks/use-chuqu-auth';
import { BrandLogo } from '../components/brand-logo';

const codeViews: AuthView[] = ['email-code', 'signup-code', 'reset-code'];

export default function MobileEmailAuthScreen() {
  const router = useRouter();
  const auth = useChuquAuth();
  const [view, setView] = useState<AuthView>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const isCode = codeViews.includes(view);
  const needsPassword = view === 'password' || view === 'signup' || view === 'reset-code';
  const needsConfirmation = view === 'signup' || view === 'reset-code';

  useEffect(() => { if (auth.user) router.replace('/'); }, [auth.user, router]);
  const switchView = (next: AuthView) => { setView(next); setCode(''); setPassword(''); setConfirmation(''); auth.clearMessage(); };
  const send = async (kind: 'login' | 'signup' | 'reset') => {
    setBusy(true);
    const ok = kind === 'login' ? await auth.sendLoginCode(email.trim()) : kind === 'signup' ? await auth.signUp(email.trim(), password) : await auth.startPasswordReset(email.trim());
    setBusy(false);
    if (ok) setView(kind === 'login' ? 'email-code' : kind === 'signup' ? 'signup-code' : 'reset-code');
  };
  const submit = async () => {
    if (busy || (needsConfirmation && password !== confirmation)) return;
    setBusy(true);
    if (view === 'password') await auth.signIn(email.trim(), password);
    else if (view === 'signup') await send('signup');
    else if (view === 'forgot') await send('reset');
    else if (view === 'email-code') await auth.verifyLoginCode(email.trim(), code);
    else if (view === 'signup-code') await auth.verifySignUpCode(email.trim(), code);
    else await auth.resetPasswordWithCode(email.trim(), code, password);
    setBusy(false);
  };

  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={styles.logo}><BrandLogo style={styles.logoImage} /></View><Text style={styles.brand}>粗去玩鸭！</Text>
    <Text style={styles.subtitle}>{isCode ? `验证码已发送至 ${email}` : '登录后同步你的行程'}</Text>
    {!isCode ? <View style={styles.tabs}><Pressable style={[styles.tab, view === 'password' && styles.activeTab]} onPress={() => switchView('password')}><Text style={styles.tabText}>登录</Text></Pressable><Pressable style={[styles.tab, view === 'signup' && styles.activeTab]} onPress={() => switchView('signup')}><Text style={styles.tabText}>注册</Text></Pressable></View> : null}
    {isCode ? <TextInput style={styles.input} keyboardType="number-pad" value={code} placeholder="邮箱验证码" placeholderTextColor="#687065" onChangeText={setCode} /> : <TextInput style={styles.input} keyboardType="email-address" autoCapitalize="none" value={email} placeholder="邮箱地址" placeholderTextColor="#687065" onChangeText={setEmail} />}
    {needsPassword ? <TextInput style={styles.input} secureTextEntry value={password} placeholder={view === 'password' ? '密码' : '密码，至少 6 位'} placeholderTextColor="#687065" onChangeText={setPassword} /> : null}
    {needsConfirmation ? <TextInput style={styles.input} secureTextEntry value={confirmation} placeholder="确认密码" placeholderTextColor="#687065" onChangeText={setConfirmation} /> : null}
    {auth.message ? <Text style={styles.message}>{auth.message}</Text> : null}
    <Pressable disabled={busy || auth.loading || !auth.configured} style={[styles.submit, (busy || !auth.configured) && styles.disabled]} onPress={() => void submit()}>{busy ? <ActivityIndicator color="#11150d" /> : <Text style={styles.submitText}>{view === 'password' ? '密码登录' : view === 'signup' ? '发送注册验证码' : view === 'forgot' ? '发送重置验证码' : view === 'reset-code' ? '重置密码并登录' : '验证并登录'}</Text>}</Pressable>
    {view === 'password' ? <View style={styles.links}><Pressable onPress={() => void send('login')}><Text style={styles.link}>验证码登录</Text></Pressable><Pressable onPress={() => switchView('forgot')}><Text style={styles.link}>忘记密码？</Text></Pressable></View> : null}
    {isCode || view === 'forgot' ? <Pressable onPress={() => switchView(view === 'signup-code' ? 'signup' : 'password')}><Text style={styles.back}>返回</Text></Pressable> : null}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#090b09' },
  page: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 72, height: 72, alignSelf: 'center', borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#c9ff62' },
  logoImage: { width: 64, height: 64 },
  brand: { marginTop: 14, color: '#c9ff62', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: { minHeight: 42, marginTop: 8, color: '#8d958a', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  tabs: { flexDirection: 'row', marginVertical: 18, padding: 3, borderRadius: 14, backgroundColor: '#141a12' },
  tab: { flex: 1, padding: 11, borderRadius: 12 },
  activeTab: { backgroundColor: '#24301d' },
  tabText: { color: '#e9f2e4', fontWeight: '800', textAlign: 'center' },
  input: { height: 54, marginBottom: 11, paddingHorizontal: 16, borderWidth: 1, borderColor: '#293027', borderRadius: 14, color: '#fff', backgroundColor: '#111411' },
  message: { marginBottom: 10, color: '#ffae8c', fontSize: 12 },
  submit: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#c9ff62' },
  submitText: { color: '#11150d', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  links: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  link: { color: '#aeb6aa', fontSize: 13, fontWeight: '700' },
  back: { marginTop: 18, color: '#aeb6aa', textAlign: 'center', fontWeight: '700' },
});
