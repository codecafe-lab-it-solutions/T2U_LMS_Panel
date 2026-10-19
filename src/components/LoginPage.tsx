import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { useSEO } from '../hooks/useSEO';
import {
  Lock, ArrowRight, Sun, Moon, Rocket, User, Briefcase, ArrowLeft,
  Sparkles, UserPlus, LogIn, Eye, EyeOff, Phone, ShieldCheck, Mail, KeyRound
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface LoginPageProps {
  onBack?: () => void;
  /** Set when the app loaded from an emailed password-reset link (?reset_token=...). */
  resetToken?: string;
  /** Set when the app loaded from a dedicated portal URL (/admin-login, /instructor-login, or /employee-login). */
  portal?: 'admin' | 'instructor' | 'employee';
}

export default function LoginPage({ onBack, resetToken, portal }: LoginPageProps) {
  useSEO({
    title: portal ? `${portal.charAt(0).toUpperCase() + portal.slice(1)} Portal Login | T2U` : 'Login to Portal | T2U — Time to Upgrade',
    description: 'Sign in to access your T2U learner dashboard, courses, and direct selling earnings.',
  });

  const { login, employeeLogin, darkMode, toggleDarkMode } = useAppStore();
  const [currentPortal, setCurrentPortal] = useState<'admin' | 'instructor' | 'employee' | undefined>(portal);
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>(resetToken ? 'reset' : 'login');

  // Forgot / reset password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const [resetPass1, setResetPass1] = useState('');
  const [resetPass2, setResetPass2] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Login state
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Register state
  const [regForm, setRegForm] = useState({
    name: '', email: '', mobile: '', password: '', confirmPassword: '',
    role: (portal === 'instructor' ? 'instructor' : 'student') as 'student' | 'instructor',
    fatherName: '', gender: '' as '' | 'male' | 'female' | 'other', dob: '', address: '',
    sponsorId: '', position: '' as '' | 'left' | 'right',
    nomineeName: '', nomineeDob: '', nomineeMobile: '', nomineeRelationship: '',
  });
  const [showNominee, setShowNominee] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let success = false;
      if (currentPortal === 'employee') {
        success = await employeeLogin(userId.trim(), password);
      } else {
        success = await login(userId.trim(), password);
        // If regular login failed and no strict portal is locked, seamlessly attempt employeeLogin
        if (!success && !currentPortal) {
          success = await employeeLogin(userId.trim(), password);
        }
      }
      if (!success) setError('Invalid credentials. Check your User ID / Email and password.');
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    setForgotLoading(true);
    try {
      if (currentPortal === 'employee') {
        const res = await api.employeeAuth.forgotPassword(forgotEmail.trim());
        setForgotMessage(res.message);
      } else {
        const res = await api.auth.forgotPassword(forgotEmail.trim());
        setForgotMessage(res.message);
      }
    } catch (err: any) {
      setForgotError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (resetPass1 !== resetPass2) { setResetError('Passwords do not match.'); return; }
    if (resetPass1.length < 6) { setResetError('Password must be at least 6 characters.'); return; }
    if (!resetToken) { setResetError('Missing or invalid reset link.'); return; }
    setResetLoading(true);
    try {
      await api.auth.resetPassword(resetToken, resetPass1);
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message || 'This reset link is invalid or has expired.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (regForm.password !== regForm.confirmPassword) { setRegError('Passwords do not match.'); return; }
    if (regForm.password.length < 6) { setRegError('Password must be at least 6 characters.'); return; }
    if (!regForm.name.trim()) { setRegError('Full name is required.'); return; }
    if (!regForm.mobile.trim()) { setRegError('Phone number is required.'); return; }
    setRegLoading(true);
    try {
      await api.auth.register({
        full_name: regForm.name.trim(),
        email: regForm.email.trim().toLowerCase(),
        phone: regForm.mobile.trim(),
        password: regForm.password,
        role: regForm.role,
        referred_by_code: regForm.sponsorId.trim().toUpperCase() || undefined,
        father_name: regForm.fatherName.trim() || undefined,
        gender: regForm.gender || undefined,
        dob: regForm.dob || undefined,
        address: regForm.address.trim() || undefined,
        requested_position: regForm.sponsorId.trim() ? (regForm.position || undefined) : undefined,
        nominee_name: regForm.nomineeName.trim() || undefined,
        nominee_dob: regForm.nomineeDob || undefined,
        nominee_mobile: regForm.nomineeMobile.trim() || undefined,
        nominee_relationship: regForm.nomineeRelationship.trim() || undefined,
      });
      setRegSuccess(true);
      // Auto-login with the registered email
      setTimeout(async () => {
        const ok = await login(regForm.email.trim(), regForm.password);
        if (!ok) {
          // If auto-login fails, just redirect to login tab with email pre-filled
          setView('login');
          setUserId(regForm.email.trim());
          setPassword(regForm.password);
        }
        setRegSuccess(false);
      }, 1200);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const quickFill = (role: 'student' | 'instructor' | 'admin') => {
    if (role === 'admin') { setUserId('t2u1000'); setPassword('admin@t2u'); }
    else if (role === 'instructor') { setUserId('T2UINSTR01'); setPassword('password'); }
    else { setUserId('T2USTU001'); setPassword('password'); }
    setError(null);
  };

  return (
    <div className={`min-h-screen w-screen flex flex-col justify-between p-6 relative overflow-hidden transition-colors duration-300 select-none ${darkMode ? 't2u-gradient-bg text-foreground' : 't2u-light-bg text-foreground'}`}>
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-orange-500/5 blur-[90px] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center max-w-7xl w-full mx-auto relative z-10">
        <div className="flex items-center gap-4">
          {onBack && (
            <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to site</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider text-violet-500 font-sans leading-none">T2U <span className="text-xs font-bold text-muted-foreground uppercase font-mono">Portal</span></span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-widest font-sans">T2Upgrade LMS Layer</span>
            </div>
          </div>
        </div>
        <button type="button" onClick={toggleDarkMode} className="p-2.5 rounded-full hover:bg-muted/40 border border-border/40 backdrop-blur-md transition-colors" title="Toggle theme">
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-violet-500" />}
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center max-w-7xl w-full mx-auto relative z-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">

          {/* Left pitch */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full t2u-pill-badge text-[11px] font-bold tracking-wider uppercase text-violet-400 font-sans">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>India's Future-Ready Ecosystem</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-foreground font-sans">
              Upgrade your skills.<br />
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">Upgrade your income.</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed font-sans">
              Join premium live lectures, complete hands-on projects, verify your achievements, and build passive affiliate pipelines with India's first EdTech + Direct Selling hybrid platform.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { v: '10,000+', l: 'Smart Learners' },
                { v: '5+', l: 'Courses' },
                { v: '₹50L+', l: 'Earnings' },
                { v: '100+', l: 'Cities' },
              ].map(s => (
                <div key={s.l} className="p-4 rounded-xl border border-border/40 bg-card/45 backdrop-blur-md text-center">
                  <span className="text-xl font-extrabold text-violet-400 block font-mono">{s.v}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right card */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <Card className="w-full max-w-md t2u-card-glass shadow-2xl relative overflow-hidden t2u-purple-glow">
              {/* Portal badge or selector */}
              {portal ? (
                <div className={`px-5 py-2 text-center text-[10px] font-black uppercase tracking-widest ${
                  portal === 'admin' ? 'bg-red-500/10 text-red-400' : portal === 'employee' ? 'bg-amber-500/10 text-amber-400' : 'bg-orange-500/10 text-orange-400'
                }`}>
                  {portal === 'admin' ? 'T2U Admin Portal' : portal === 'employee' ? 'T2U Employee Portal' : 'T2U Instructor Portal'}
                </div>
              ) : (
                <div className="p-2 border-b border-border/40 bg-muted/10">
                  <div className="flex bg-muted/20 p-1 rounded-xl border border-border/40 text-[10.5px] font-bold">
                    <button
                      type="button"
                      onClick={() => { setCurrentPortal(undefined); setError(null); }}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${!currentPortal ? 'bg-violet-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Learner
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCurrentPortal('employee'); setError(null); setView('login'); }}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${currentPortal === 'employee' ? 'bg-amber-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCurrentPortal('admin'); setError(null); setView('login'); }}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${currentPortal === 'admin' ? 'bg-red-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              )}

              {/* View toggle */}
              {(view === 'login' || view === 'register') ? (
                <div className="flex border-b border-border/40">
                  {(currentPortal === 'admin' || currentPortal === 'employee' ? (['login'] as const) : (['login', 'register'] as const)).map(v => (
                    <button key={v} type="button" onClick={() => { setView(v); setError(null); setRegError(null); }}
                      className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${view === v ? 'text-violet-400 border-b-2 border-violet-500 -mb-px bg-violet-500/5' : 'text-muted-foreground hover:text-foreground'}`}>
                      {v === 'login' ? <><LogIn className="w-3.5 h-3.5" />Sign In</> : <><UserPlus className="w-3.5 h-3.5" />Register</>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40">
                  {!resetToken && (
                    <button type="button" onClick={() => { setView('login'); setForgotError(null); setForgotMessage(null); }}
                      className="text-muted-foreground hover:text-foreground p-1 -ml-1 rounded-lg hover:bg-muted/30">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    {view === 'forgot' ? <><Mail className="w-3.5 h-3.5 text-violet-400" />Reset Password</> : <><KeyRound className="w-3.5 h-3.5 text-violet-400" />Set New Password</>}
                  </span>
                </div>
              )}

              <CardContent className="p-7 space-y-5">
                {/* ── LOGIN ── */}
                {view === 'login' && (
                  <>
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-foreground">
                        {currentPortal === 'admin' ? 'Admin Sign In' : currentPortal === 'instructor' ? 'Instructor Sign In' : currentPortal === 'employee' ? 'Employee Sign In' : 'Sign In to Portal'}
                      </h3>
                      <p className="text-xs text-muted-foreground">Enter your credentials to open your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground">
                          {currentPortal === 'employee' ? 'Employee ID or Work Email' : 'User ID, Email or Phone'}
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <Input value={userId} onChange={e => setUserId(e.target.value)} placeholder={currentPortal === 'employee' ? 'EMP101 or name@t2upgrade.com' : 'T2U1000 or email@example.com'}
                            className="pl-10 h-10 text-xs bg-muted/20 border-border/60 focus:border-violet-500" required disabled={loading} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <Input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                            className="pl-10 pr-10 h-10 text-xs bg-muted/20 border-border/60 focus:border-violet-500" required disabled={loading} />
                          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground">
                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="text-right">
                          <button type="button" onClick={() => { setView('forgot'); setError(null); setForgotMessage(null); setForgotError(null); }}
                            className="text-[10.5px] font-semibold text-violet-400 hover:text-violet-300 hover:underline">
                            Forgot Password?
                          </button>
                        </div>
                      </div>
                      {error && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 text-center font-medium">{error}</div>}
                      <Button type="submit" className="w-full h-10 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl" disabled={loading}>
                        {loading ? 'Authenticating...' : <><span>Sign In Now</span><ArrowRight className="w-4 h-4 ml-1.5" /></>}
                      </Button>
                    </form>

                    {/* Quick fill — no sandbox account exists for employees (admin-created only)
                    {portal !== 'employee' && (
                      <div className="space-y-2 pt-1 border-t border-border/40">
                        <span className="text-[10px] font-bold text-muted-foreground block text-center uppercase tracking-wider">Quick Sandbox Logins:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {(portal === 'admin'
                            ? [{ role: 'admin' as const, label: 'Admin', icon: ShieldCheck, color: 'text-red-500' }]
                            : portal === 'instructor'
                            ? [{ role: 'instructor' as const, label: 'Instructor', icon: Briefcase, color: 'text-orange-500' }]
                            : [
                                { role: 'student' as const, label: 'Student', icon: User, color: 'text-violet-500' },
                                { role: 'instructor' as const, label: 'Instructor', icon: Briefcase, color: 'text-orange-500' },
                              ]
                          ).map(({ role, label, icon: Icon, color }) => (
                            <Button key={role} type="button" onClick={() => quickFill(role)} variant="outline"
                              className="text-[10px] h-8 font-semibold flex items-center justify-center gap-1 border-border">
                              <Icon className={`w-3.5 h-3.5 ${color}`} />{label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )} */}
                  </>
                )}

                {/* ── REGISTER ── */}
                {view === 'register' && (
                  <>
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-foreground">Create Account</h3>
                      <p className="text-xs text-muted-foreground">Fill in your details to start learning and earning</p>
                    </div>

                    {regSuccess ? (
                      <div className="py-8 text-center space-y-3">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                          <ShieldCheck className="w-7 h-7 text-emerald-500" />
                        </div>
                        <p className="text-sm font-bold text-emerald-500">Account created! Logging you in…</p>
                      </div>
                    ) : (
                      <form onSubmit={handleRegister} className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</Label>
                          <Input required placeholder="Aarya Garg" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Father Name</Label>
                          <Input placeholder="Rakesh Garg" value={regForm.fatherName} onChange={e => setRegForm(p => ({ ...p, fatherName: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Gender</Label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {(['male', 'female', 'other'] as const).map(g => (
                                <button key={g} type="button" onClick={() => setRegForm(p => ({ ...p, gender: g }))}
                                  className={`h-9 rounded-lg border text-[10px] font-bold capitalize transition-colors ${regForm.gender === g ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-border text-muted-foreground hover:border-border/80 bg-muted/10'}`}>
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Date of Birth</Label>
                            <Input type="date" value={regForm.dob} onChange={e => setRegForm(p => ({ ...p, dob: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Email</Label>
                          <Input required type="email" placeholder="you@example.com" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                            <Input required type="tel" placeholder="9876543210" value={regForm.mobile} onChange={e => setRegForm(p => ({ ...p, mobile: e.target.value }))} className="h-9 text-xs bg-muted/20 pl-9" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Address</Label>
                          <textarea rows={2} placeholder="House no., street, city, state, PIN"
                            value={regForm.address} onChange={e => setRegForm(p => ({ ...p, address: e.target.value }))}
                            className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Password</Label>
                            <div className="relative">
                              <Input required type={showRegPass ? 'text' : 'password'} placeholder="Min 6 chars" value={regForm.password} onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} className="h-9 text-xs bg-muted/20 pr-9" />
                              <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                                {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Confirm</Label>
                            <Input required type="password" placeholder="Repeat password" value={regForm.confirmPassword} onChange={e => setRegForm(p => ({ ...p, confirmPassword: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                          </div>
                        </div>

                        {/* Role toggle */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Join As</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['student', 'instructor'] as const).map(r => (
                              <button key={r} type="button" onClick={() => setRegForm(p => ({ ...p, role: r }))}
                                className={`py-2 rounded-lg border text-xs font-bold capitalize transition-colors ${regForm.role === r ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-border text-muted-foreground hover:border-border/80 bg-muted/10'}`}>
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Sponsor ID (Optional)</Label>
                          <Input placeholder="E.g. T2U1000" value={regForm.sponsorId} onChange={e => setRegForm(p => ({ ...p, sponsorId: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                        </div>

                        {regForm.sponsorId.trim() && (
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Team — Left or Right</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['left', 'right'] as const).map(pos => (
                                <button key={pos} type="button" onClick={() => setRegForm(p => ({ ...p, position: pos }))}
                                  className={`h-9 rounded-lg border text-xs font-bold transition-colors ${
                                    regForm.position === pos
                                      ? pos === 'left' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-orange-500 bg-orange-500/10 text-orange-400'
                                      : 'border-border text-muted-foreground hover:border-border/80 bg-muted/10'
                                  }`}>
                                  {pos === 'left' ? '← Left Team' : 'Right Team →'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Nominee details */}
                        <div className="space-y-2 pt-1 border-t border-border/40">
                          <button type="button" onClick={() => setShowNominee(s => !s)}
                            className="w-full flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase pt-2">
                            <span>Nominee Details (Optional)</span>
                            <span className="text-violet-400">{showNominee ? 'Hide −' : 'Add +'}</span>
                          </button>
                          {showNominee && (
                            <div className="space-y-2">
                              <Input placeholder="Nominee full name" value={regForm.nomineeName} onChange={e => setRegForm(p => ({ ...p, nomineeName: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                              <div className="grid grid-cols-2 gap-3">
                                <Input type="date" placeholder="Date of birth" value={regForm.nomineeDob} onChange={e => setRegForm(p => ({ ...p, nomineeDob: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                                <Input type="tel" placeholder="Mobile number" value={regForm.nomineeMobile} onChange={e => setRegForm(p => ({ ...p, nomineeMobile: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                              </div>
                              <Input placeholder="Relationship (e.g. Spouse, Parent)" value={regForm.nomineeRelationship} onChange={e => setRegForm(p => ({ ...p, nomineeRelationship: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                            </div>
                          )}
                        </div>

                        {regError && <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 text-center font-medium">{regError}</div>}

                        <Button type="submit" className="w-full h-10 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl" disabled={regLoading}>
                          {regLoading ? 'Creating account…' : <><span>Create Account Now</span><ArrowRight className="w-4 h-4 ml-1.5" /></>}
                        </Button>
                      </form>
                    )}
                  </>
                )}

                {/* ── FORGOT PASSWORD ── */}
                {view === 'forgot' && (
                  <>
                    {forgotMessage ? (
                      <div className="py-8 text-center space-y-3">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                          <Mail className="w-7 h-7 text-emerald-500" />
                        </div>
                        <p className="text-sm font-bold text-emerald-500 px-4">{forgotMessage}</p>
                        <Button type="button" variant="outline" onClick={() => setView('login')} className="text-xs h-9 mt-2">
                          Back to Sign In
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="text-center space-y-1">
                          <h3 className="text-lg font-bold text-foreground">Reset Your Password</h3>
                          <p className="text-xs text-muted-foreground">Enter your account email and we'll send you a reset link</p>
                        </div>
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                              <Input required type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                                className="pl-10 h-10 text-xs bg-muted/20 border-border/60 focus:border-violet-500" disabled={forgotLoading} />
                            </div>
                          </div>
                          {forgotError && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 text-center font-medium">{forgotError}</div>}
                          <Button type="submit" className="w-full h-10 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl" disabled={forgotLoading}>
                            {forgotLoading ? 'Sending…' : <><span>Send Reset Link</span><ArrowRight className="w-4 h-4 ml-1.5" /></>}
                          </Button>
                        </form>
                      </>
                    )}
                  </>
                )}

                {/* ── RESET PASSWORD (from emailed link) ── */}
                {view === 'reset' && (
                  <>
                    {!resetToken ? (
                      <div className="py-8 text-center space-y-3">
                        <p className="text-sm font-bold text-rose-500 px-4">This reset link is missing or invalid. Please request a new one.</p>
                        <Button type="button" variant="outline" onClick={() => setView('forgot')} className="text-xs h-9 mt-2">
                          Request New Link
                        </Button>
                      </div>
                    ) : resetSuccess ? (
                      <div className="py-8 text-center space-y-3">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                          <ShieldCheck className="w-7 h-7 text-emerald-500" />
                        </div>
                        <p className="text-sm font-bold text-emerald-500">Password updated! You can now sign in.</p>
                        <Button type="button" onClick={() => setView('login')} className="text-xs h-9 mt-2 bg-violet-600 hover:bg-violet-700 text-white">
                          Go to Sign In
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="text-center space-y-1">
                          <h3 className="text-lg font-bold text-foreground">Set a New Password</h3>
                          <p className="text-xs text-muted-foreground">Choose a new password for your account</p>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground">New Password</Label>
                            <Input required type="password" placeholder="Min 6 chars" value={resetPass1} onChange={e => setResetPass1(e.target.value)}
                              className="h-10 text-xs bg-muted/20 border-border/60 focus:border-violet-500" disabled={resetLoading} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground">Confirm Password</Label>
                            <Input required type="password" placeholder="Repeat password" value={resetPass2} onChange={e => setResetPass2(e.target.value)}
                              className="h-10 text-xs bg-muted/20 border-border/60 focus:border-violet-500" disabled={resetLoading} />
                          </div>
                          {resetError && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 text-center font-medium">{resetError}</div>}
                          <Button type="submit" className="w-full h-10 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl" disabled={resetLoading}>
                            {resetLoading ? 'Updating…' : <><span>Update Password</span><ArrowRight className="w-4 h-4 ml-1.5" /></>}
                          </Button>
                        </form>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto py-4 border-t border-border/20 text-center relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span className="text-[11px] text-muted-foreground font-sans">
          © {new Date().getFullYear()} T2Upgrade Pvt. Ltd. All rights reserved.
        </span>
        <div className="flex gap-4 text-[11px] text-muted-foreground font-sans font-medium">
          <a
            href="/terms"
            onClick={(e) => { e.preventDefault(); if (onBack) onBack(); }}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Terms of Service
          </a>
          <a
            href="/privacy"
            onClick={(e) => { e.preventDefault(); if (onBack) onBack(); }}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
