import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Mail, Lock, Sparkles, ArrowRight, Sun, Moon, Rocket, User, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { login, darkMode, toggleDarkMode } = useAppStore();
  const [userId, setUserId] = useState('T2U1001');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const success = login(userId, password);
      setLoading(false);
      if (!success) {
        setError('Invalid credentials. Use T2U1001 (Student) or T2U1002 (Instructor)');
      }
    }, 800);
  };

  const fillCredentials = (role: 'student' | 'instructor') => {
    if (role === 'student') {
      setUserId('T2U1001');
    } else {
      setUserId('T2U1002');
    }
    setPassword('password');
    setError(null);
  };

  return (
    <div className={`min-h-screen w-screen flex flex-col justify-between p-6 relative overflow-hidden transition-colors duration-300 select-none ${
      darkMode ? 't2u-gradient-bg text-foreground' : 't2u-light-bg text-foreground'
    }`}>
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-orange-500/5 blur-[90px] pointer-events-none" />

      {/* Header Bar */}
      <header className="flex justify-between items-center max-w-7xl w-full mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Rocket className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-wider text-violet-500 font-sans leading-none flex items-center gap-1">
              T2U <span className="text-xs font-bold text-muted-foreground uppercase font-mono">Portal</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-widest font-sans">T2Upgrade LMS Layer</span>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-full hover:bg-muted/40 border border-border/40 backdrop-blur-md transition-colors"
          title="Toggle theme mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-violet-500" />}
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center max-w-7xl w-full mx-auto relative z-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Text Column */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full t2u-pill-badge text-[11px] font-bold tracking-wider uppercase text-violet-400 font-sans">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sync API Layer Enabled</span>
            </div>

            <h1 className="text-4xl sm:text-5.5xl font-extrabold tracking-tight leading-[1.05] text-foreground font-sans">
              Upgrade your skills. <br />
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent filter drop-shadow-xs">
                Upgrade your income.
              </span>
            </h1>

            <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed font-sans">
              A unified gateway for T2U students and instructors. Sync assignments, live lectures, binary referral trees, and KYC banking details directly to secure databases.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl border border-border/40 bg-card/45 backdrop-blur-md">
                <span className="text-xl font-extrabold text-foreground block">T2U Cloud</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Single Source</span>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/45 backdrop-blur-md">
                <span className="text-xl font-extrabold text-foreground block">Real-time</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Live Status Sync</span>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/45 backdrop-blur-md col-span-2 sm:col-span-1">
                <span className="text-xl font-extrabold text-foreground block">Secured</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">KYC & Banking</span>
              </div>
            </div>
          </div>

          {/* Right Login Card Column */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <Card className="w-full max-w-md t2u-card-glass shadow-2xl relative overflow-hidden transition-all duration-300 t2u-purple-glow">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-1.5 text-center">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">Sign In</h3>
                  <p className="text-xs text-muted-foreground">Access your Student or Instructor Dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* User ID Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="login-userid" className="text-[11px] font-bold text-muted-foreground">User ID or Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <Input
                        id="login-userid"
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="E.g. T2U1001 or student@t2u.com"
                        className="pl-10 h-10 text-xs bg-muted/20 border-border/60 focus:border-violet-500"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-[11px] font-bold text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 h-10 text-xs bg-muted/20 border-border/60 focus:border-violet-500"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 text-center font-medium animate-shake">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-10 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-600/25 transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5 mt-2"
                    disabled={loading}
                  >
                    {loading ? 'Authenticating with T2Upgrade...' : 'Sign In Now'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </form>

                {/* Auto-fill buttons */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <span className="text-[10px] font-bold text-muted-foreground block text-center uppercase tracking-wider">Quick Sandbox Logins:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      onClick={() => fillCredentials('student')}
                      variant="outline"
                      className="text-[10px] h-8 font-semibold flex items-center justify-center gap-1 border-border"
                    >
                      <User className="w-3.5 h-3.5 text-violet-500" />
                      Student
                    </Button>
                    <Button
                      type="button"
                      onClick={() => fillCredentials('instructor')}
                      variant="outline"
                      className="text-[10px] h-8 font-semibold flex items-center justify-center gap-1 border-border"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                      Instructor
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/40 text-[10.5px] text-muted-foreground font-sans leading-normal">
                  <span className="font-bold text-foreground block mb-0.5">Demo Accounts:</span>
                  Student ID: <strong className="text-violet-400 font-bold">T2U1001</strong><br />
                  Instructor ID: <strong className="text-orange-400 font-bold">T2U1002</strong><br />
                  Password: <strong className="text-foreground font-bold">password</strong>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="max-w-7xl w-full mx-auto py-4 border-t border-border/20 text-center relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span className="text-[11px] text-muted-foreground font-sans">
          © 2026 T2Upgrade Pvt. Ltd. All rights reserved.
        </span>
        <div className="flex gap-4 text-[11px] text-muted-foreground font-sans font-medium">
          <a href="#" className="hover:text-foreground">System Status</a>
          <a href="#" className="hover:text-foreground">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
