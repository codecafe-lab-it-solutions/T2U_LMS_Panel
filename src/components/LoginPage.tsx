import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Lock, ArrowRight, Sun, Moon, Rocket, User, Briefcase, ArrowLeft,
  Sparkles, UserPlus, LogIn, Eye, EyeOff, Phone, ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface LoginPageProps {
  onBack?: () => void;
}

export default function LoginPage({ onBack }: LoginPageProps) {
  const { login, registerUser, darkMode, toggleDarkMode } = useAppStore();
  const [view, setView] = useState<'login' | 'register'>('login');

  // Login state
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Register state
  const [regForm, setRegForm] = useState({
    name: '', email: '', mobile: '', username: '', password: '', confirmPassword: '',
    role: 'student' as 'student' | 'instructor', referralCode: ''
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const success = login(userId.trim(), password);
      setLoading(false);
      if (!success) setError('Invalid credentials. Check your User ID / Email and password.');
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (regForm.password !== regForm.confirmPassword) { setRegError('Passwords do not match.'); return; }
    if (regForm.password.length < 6) { setRegError('Password must be at least 6 characters.'); return; }
    if (!regForm.username.trim()) { setRegError('Username is required.'); return; }
    setRegLoading(true);
    setTimeout(() => {
      registerUser({
        name: regForm.name,
        email: regForm.email,
        mobile: regForm.mobile,
        username: regForm.username.toLowerCase().trim(),
        role: regForm.role === 'instructor' ? 'Lead AI & Automation Instructor' : 'Student (Elite Learner)',
        address: '',
        dob: '',
        password: regForm.password,
      });
      setRegLoading(false);
      setRegSuccess(true);
      setTimeout(() => {
        setView('login');
        setUserId(regForm.username.toLowerCase().trim());
        setPassword(regForm.password);
        setRegSuccess(false);
      }, 1500);
    }, 1000);
  };

  const quickFill = (role: 'student' | 'instructor' | 'admin') => {
    if (role === 'admin') { setUserId('t2u1000'); setPassword('admin@t2u'); }
    else if (role === 'instructor') { setUserId('t2u1002'); setPassword('password'); }
    else { setUserId('t2u1001'); setPassword('password'); }
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
              {/* View toggle */}
              <div className="flex border-b border-border/40">
                {(['login', 'register'] as const).map(v => (
                  <button key={v} type="button" onClick={() => { setView(v); setError(null); setRegError(null); }}
                    className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${view === v ? 'text-violet-400 border-b-2 border-violet-500 -mb-px bg-violet-500/5' : 'text-muted-foreground hover:text-foreground'}`}>
                    {v === 'login' ? <><LogIn className="w-3.5 h-3.5" />Sign In</> : <><UserPlus className="w-3.5 h-3.5" />Register</>}
                  </button>
                ))}
              </div>

              <CardContent className="p-7 space-y-5">
                {/* ── LOGIN ── */}
                {view === 'login' && (
                  <>
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-foreground">Access Portal</h3>
                      <p className="text-xs text-muted-foreground">Enter your credentials to open your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground">User ID or Email</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <Input value={userId} onChange={e => setUserId(e.target.value)} placeholder="T2U1000 or admin@t2upgrade.com"
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
                      </div>
                      {error && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 text-center font-medium">{error}</div>}
                      <Button type="submit" className="w-full h-10 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl" disabled={loading}>
                        {loading ? 'Authenticating...' : <><span>Sign In Now</span><ArrowRight className="w-4 h-4 ml-1.5" /></>}
                      </Button>
                    </form>

                    {/* Quick fill */}
                    <div className="space-y-2 pt-1 border-t border-border/40">
                      <span className="text-[10px] font-bold text-muted-foreground block text-center uppercase tracking-wider">Quick Sandbox Logins:</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { role: 'student' as const, label: 'Student', icon: User, color: 'text-violet-500' },
                          { role: 'instructor' as const, label: 'Instructor', icon: Briefcase, color: 'text-orange-500' },
                          { role: 'admin' as const, label: 'Admin', icon: ShieldCheck, color: 'text-rose-500' },
                        ].map(({ role, label, icon: Icon, color }) => (
                          <Button key={role} type="button" onClick={() => quickFill(role)} variant="outline"
                            className="text-[10px] h-8 font-semibold flex items-center justify-center gap-1 border-border">
                            <Icon className={`w-3.5 h-3.5 ${color}`} />{label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Credentials box */}
                    <div className="bg-muted/40 p-3.5 rounded-xl border border-border/40 text-[10.5px] text-muted-foreground font-sans leading-relaxed space-y-1">
                      <span className="font-bold text-foreground block mb-1 uppercase text-[9px] tracking-widest">Demo Accounts</span>
                      <div>Student: <strong className="text-violet-400 font-mono">T2U1001</strong> / <strong className="text-foreground">password</strong></div>
                      <div>Instructor: <strong className="text-orange-400 font-mono">T2U1002</strong> / <strong className="text-foreground">password</strong></div>
                      <div>Admin: <strong className="text-rose-400 font-mono">T2U1000</strong> / <strong className="text-foreground">admin@t2u</strong></div>
                    </div>
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
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</Label>
                            <Input required placeholder="Aarya Garg" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Username</Label>
                            <Input required placeholder="t2uuser01" value={regForm.username} onChange={e => setRegForm(p => ({ ...p, username: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Email</Label>
                          <Input required type="email" placeholder="you@example.com" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                            <Input required type="tel" placeholder="9876543210" value={regForm.mobile} onChange={e => setRegForm(p => ({ ...p, mobile: e.target.value }))} className="h-9 text-xs bg-muted/20 pl-9" />
                          </div>
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
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Referral Code (Optional)</Label>
                          <Input placeholder="E.g. T2U1000" value={regForm.referralCode} onChange={e => setRegForm(p => ({ ...p, referralCode: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                        </div>

                        {regError && <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 text-center font-medium">{regError}</div>}

                        <Button type="submit" className="w-full h-10 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl" disabled={regLoading}>
                          {regLoading ? 'Creating account…' : <><span>Create Account Now</span><ArrowRight className="w-4 h-4 ml-1.5" /></>}
                        </Button>
                      </form>
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
        <span className="text-[11px] text-muted-foreground font-sans">© 2026 T2Upgrade Pvt. Ltd. All rights reserved.</span>
        <div className="flex gap-4 text-[11px] text-muted-foreground font-sans font-medium">
          <a href="#" className="hover:text-foreground">Terms of Service</a>
          <a href="#" className="hover:text-foreground">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
