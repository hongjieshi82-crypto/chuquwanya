import { useLocalSearchParams, useRouter } from 'expo-router';
import { type FormEvent, useEffect, useState } from 'react';

import { type AuthView, useChuquAuth } from '@/hooks/use-chuqu-auth';
import { safeReturnTo } from '@/lib/safe-return-to';
import { BrandLogo } from '../components/brand-logo';

const codeViews: AuthView[] = ['email-code', 'signup-code', 'reset-code'];

export default function PcEmailLoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reason?: string; returnTo?: string }>();
  const auth = useChuquAuth();
  const [view, setView] = useState<AuthView>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const returnTo = safeReturnTo(params.returnTo) ?? '/pc';
  const cameFromDraw = params.reason === 'draw';

  useEffect(() => {
    if (auth.user) window.location.assign(returnTo);
  }, [auth.user, returnTo]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const switchView = (next: AuthView) => {
    setView(next); setCode(''); setPassword(''); setConfirmPassword(''); auth.clearMessage();
  };
  const sendCode = async (kind: 'login' | 'signup' | 'reset') => {
    if (!email.trim() || busy || cooldown) return;
    setBusy(true);
    const sent = kind === 'login'
      ? await auth.sendLoginCode(email.trim())
      : kind === 'signup'
        ? await auth.signUp(email.trim(), password)
        : await auth.startPasswordReset(email.trim());
    setBusy(false);
    if (!sent) return;
    setCooldown(60); setCode('');
    setView(kind === 'login' ? 'email-code' : kind === 'signup' ? 'signup-code' : 'reset-code');
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if ((view === 'signup' || view === 'reset-code') && (password.length < 6 || password !== confirmPassword)) return;
    if (view === 'signup') { await sendCode('signup'); return; }
    if (view === 'forgot') { await sendCode('reset'); return; }
    setBusy(true);
    if (view === 'password') await auth.signIn(email.trim(), password);
    else if (view === 'email-code') await auth.verifyLoginCode(email.trim(), code);
    else if (view === 'signup-code') await auth.verifySignUpCode(email.trim(), code);
    else await auth.resetPasswordWithCode(email.trim(), code, password);
    setBusy(false);
  };
  const hasPassword = view === 'password' || view === 'signup' || view === 'reset-code';
  const hasConfirmation = view === 'signup' || view === 'reset-code';
  const isCodeView = codeViews.includes(view);

  return <main className="auth-gate">
    <style>{authCss}</style><div className="auth-gate-bg" />
    <button className="auth-gate-back" type="button" onClick={() => router.replace(cameFromDraw ? '/box/config' : '/pc')}>← {cameFromDraw ? '返回盲盒配置' : '返回首页'}</button>
    <section className="auth-gate-card">
      <BrandLogo className="auth-gate-logo" />
      <h1>粗去玩鸭！</h1>
      <p>{auth.loading ? '正在检查登录状态…' : isCodeView ? `验证码已发送至 ${email.trim()}` : view === 'signup' ? '创建账号，同步你的旅行和收藏' : view === 'forgot' || view === 'reset-code' ? '验证邮箱后重置登录密码' : cameFromDraw ? '你的盲盒偏好已保存，登录后继续抽取' : '登录后同步你的行程'}</p>
      {!isCodeView ? <div className="auth-gate-tabs"><button className={view === 'password' ? 'active' : ''} type="button" onClick={() => switchView('password')}>登录</button><button className={view === 'signup' ? 'active' : ''} type="button" onClick={() => switchView('signup')}>注册</button></div> : null}
      <form className="auth-gate-form" onSubmit={(event) => void submit(event)}>
        {isCodeView ? <label><span>#</span><input inputMode="numeric" autoComplete="one-time-code" value={code} placeholder="输入邮箱验证码" onChange={(event) => setCode(event.target.value.replace(/\s/g, '').slice(0, 8))} /></label> : <label><span>@</span><input type="email" autoComplete="email" value={email} placeholder="邮箱地址" onChange={(event) => setEmail(event.target.value)} /></label>}
        {hasPassword ? <label><span>●</span><input type="password" autoComplete={view === 'password' ? 'current-password' : 'new-password'} value={password} placeholder={view === 'password' ? '密码' : '密码，至少 6 位'} onChange={(event) => setPassword(event.target.value)} /></label> : null}
        {hasConfirmation ? <label><span>●</span><input type="password" autoComplete="new-password" value={confirmPassword} placeholder="确认密码" onChange={(event) => setConfirmPassword(event.target.value)} /></label> : null}
        {hasConfirmation && confirmPassword && password !== confirmPassword ? <div className="auth-gate-message">两次输入的密码不一致。</div> : null}
        {auth.message ? <div className="auth-gate-message">{auth.message}</div> : null}
        <button className="auth-gate-submit" disabled={busy || auth.loading || !auth.configured || !email.trim() || (hasPassword && password.length < 6) || (hasConfirmation && password !== confirmPassword) || (isCodeView && !code.trim())} type="submit">{busy ? '处理中…' : view === 'password' ? '密码登录' : view === 'email-code' ? '验证并登录' : view === 'signup' ? '发送注册验证码' : view === 'signup-code' ? '完成邮箱验证' : view === 'forgot' ? '发送重置验证码' : '重置密码并登录'}</button>
        {view === 'password' ? <div className="auth-gate-secondary"><button type="button" onClick={() => void sendCode('login')}>邮箱验证码登录</button><button type="button" onClick={() => switchView('forgot')}>忘记密码？</button></div> : null}
        {view === 'forgot' ? <button className="auth-gate-text" type="button" onClick={() => switchView('password')}>返回密码登录</button> : null}
        {isCodeView ? <div className="auth-gate-secondary"><button disabled={busy || cooldown > 0} type="button" onClick={() => void (view === 'signup-code' ? auth.resendSignUpCode(email) : sendCode(view === 'reset-code' ? 'reset' : 'login'))}>{cooldown ? `${cooldown} 秒后可重发` : '重新发送'}</button><button type="button" onClick={() => switchView(view === 'signup-code' ? 'signup' : view === 'reset-code' ? 'forgot' : 'password')}>返回</button></div> : null}
      </form>
      <div className="auth-gate-foot">仅支持邮箱登录 · 验证码由 Supabase Auth 发送</div>
    </section>
  </main>;
}

const authCss = `
html,body,#root{min-height:100%;background:#090b09!important}.auth-gate{position:relative;min-height:100dvh;padding:24px;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#f6f6ef;background:#090b09;font-family:Inter,"PingFang SC","Microsoft YaHei",sans-serif}.auth-gate-bg{position:absolute;inset:0;background:radial-gradient(ellipse 680px 460px at 50% 0%,rgba(201,255,98,.12),transparent 68%),radial-gradient(ellipse 420px 320px at 18% 88%,rgba(123,232,241,.055),transparent 70%)}.auth-gate-back{position:absolute;z-index:2;top:32px;left:4.2vw;border:0;color:rgba(255,255,255,.72);background:none;font-size:15px;font-weight:800;cursor:pointer}.auth-gate-card{position:relative;z-index:1;width:min(92vw,500px);padding:44px 42px 34px;border:1px solid rgba(201,255,98,.2);border-radius:32px;background:rgba(255,255,255,.045);box-shadow:0 30px 80px rgba(0,0,0,.42);text-align:center;backdrop-filter:blur(24px)}.auth-gate-logo{display:block;width:92px;height:92px;margin:0 auto 17px;object-fit:contain}.auth-gate-card h1{margin:0;color:#c9ff62;font-size:34px;font-weight:900}.auth-gate-card>p{min-height:50px;margin:11px 0 0;color:rgba(255,255,255,.48);font-size:15px;line-height:1.7}.auth-gate-tabs{display:flex;gap:4px;margin:26px 0 18px;padding:4px;border-radius:16px;background:rgba(201,255,98,.06)}.auth-gate-tabs button{flex:1;padding:13px;border:0;border-radius:13px;color:rgba(255,255,255,.42);background:transparent;font-size:16px;font-weight:800;cursor:pointer}.auth-gate-tabs button.active{color:#eaffc8;background:rgba(201,255,98,.13)}.auth-gate-form{display:flex;flex-direction:column;gap:14px}.auth-gate-form label{min-height:58px;display:flex;align-items:center;gap:12px;padding:0 18px;border:1px solid rgba(255,255,255,.12);border-radius:16px;color:rgba(201,255,98,.72);background:rgba(255,255,255,.04)}.auth-gate-form input{min-width:0;flex:1;padding:17px 0;border:0;outline:0;color:#fff;background:transparent;font-size:17px}.auth-gate-form input::placeholder{color:rgba(255,255,255,.25)}.auth-gate-message{min-height:20px;color:#ffae8c;font-size:13px;line-height:1.5}.auth-gate-submit{width:100%;min-height:58px;margin-top:6px;padding:15px;border:0;border-radius:16px;color:#11150d;background:#c9ff62;font-size:18px;font-weight:900;cursor:pointer}.auth-gate-submit:disabled{cursor:not-allowed;opacity:.42}.auth-gate-secondary{display:flex;justify-content:space-between;gap:12px}.auth-gate-secondary button,.auth-gate-text{border:0;color:rgba(255,255,255,.55);background:transparent;font-size:14px;font-weight:750;cursor:pointer}.auth-gate-secondary button:disabled{opacity:.4}.auth-gate-foot{margin-top:23px;padding-top:19px;border-top:1px solid rgba(201,255,98,.09);color:rgba(255,255,255,.32);font-size:13px;line-height:1.6}@media(max-width:560px){.auth-gate{padding:18px}.auth-gate-card{width:100%;padding:32px 22px 26px;border-radius:26px}.auth-gate-logo{width:78px;height:78px}.auth-gate-card h1{font-size:29px}.auth-gate-card>p{font-size:13px}.auth-gate-tabs{margin:20px 0 14px}.auth-gate-tabs button{padding:11px;font-size:14px}.auth-gate-form{gap:10px}.auth-gate-form label{min-height:52px}.auth-gate-form input{padding:14px 0;font-size:15px}.auth-gate-submit{min-height:54px;font-size:16px}.auth-gate-secondary button,.auth-gate-text{font-size:12px}.auth-gate-foot{font-size:11px}}
`;
