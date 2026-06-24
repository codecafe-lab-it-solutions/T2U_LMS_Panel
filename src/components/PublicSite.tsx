import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  Rocket, BookOpen, Video, HelpCircle, FileText, Award, Sparkles, 
  Link, Users, ShieldCheck, Sun, Moon, LogIn, UserPlus, FileSpreadsheet, 
  ArrowRight, Download, CheckCircle2, AlertTriangle, Calculator, Mail, 
  Lock, User, Calendar, MapPin, Eye, Copy, Info, Check, Image
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type PublicSubTab = 
  | 'home'
  | 'about'
  | 'products'
  | 'courses'
  | 'login'
  | 'register';

export default function PublicSite() {
  const { login, registerUser, courses, darkMode, toggleDarkMode } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<PublicSubTab>('home');

  // Login inputs
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register inputs
  const [regRole, setRegRole] = useState<'student' | 'instructor'>('student');
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginId || !loginPassword) return;

    const success = login(loginId, loginPassword);
    if (!success) {
      setLoginError('Invalid username, email, or password.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regName || !regEmail || !regMobile || !regPassword) return;

    registerUser({
      username: regUsername,
      name: regName,
      email: regEmail,
      mobile: regMobile,
      address: regAddress || 'Not Provided',
      dob: regDob || '2000-01-01',
      role: regRole
    });

    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      setLoginId(regUsername);
      setLoginPassword(regPassword);
      setActiveSubTab('login');
      // Reset registration forms
      setRegUsername('');
      setRegName('');
      setRegEmail('');
      setRegMobile('');
      setRegAddress('');
      setRegDob('');
      setRegPassword('');
    }, 2000);
  };


  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-background select-none text-foreground font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Dynamic atmospheric ambient glow vectors */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[150px] pointer-events-none" />

      {/* Landing Top Header Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-8 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-xs">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveSubTab('home')}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-sm tracking-wide text-violet-500 leading-tight">
              T2Upgrade
            </span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
              Learn • Share • Earn
            </span>
          </div>
        </div>

        {/* Desktop Navbar Items */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          {[
            { id: 'home', label: 'Home' },
            { id: 'about', label: 'About Us' },
            { id: 'courses', label: 'Courses' },
            { id: 'products', label: 'Products' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as PublicSubTab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === tab.id 
                  ? 'bg-primary/10 text-primary font-bold border border-primary/20' 
                  : 'hover:text-foreground hover:bg-muted/50 border border-transparent'
              }`}
            >
              {tab.label}
              {tab.id === 'products' && (
                <span className="text-[8px] font-black text-orange-500 bg-orange-500/10 px-1 ml-1 rounded border border-orange-500/20">SOON</span>
              )}
            </button>
          ))}
        </nav>

        {/* Left header toggles & auth buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-violet-500" />}
          </button>

          <Button 
            onClick={() => setActiveSubTab('login')}
            size="sm" 
            variant="outline"
            className="h-8.5 text-xs font-bold border-border/80 hover:bg-muted/50 hidden sm:flex items-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            Login
          </Button>

          <Button 
            onClick={() => setActiveSubTab('register')}
            size="sm" 
            className="h-8.5 text-xs font-bold bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Register
          </Button>
        </div>
      </header>

      {/* Main Public Content Panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-12 relative z-10 flex flex-col justify-center">
        
        {/* VIEW: HOME PAGE */}
        {activeSubTab === 'home' && (
          <div className="space-y-16 animate-in fade-in duration-300">
            
            {/* Hero Main Screen */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
              <div className="lg:col-span-7 space-y-6 text-left">
                <span className="inline-flex px-3 py-1 bg-violet-500/10 text-violet-500 text-[10px] font-extrabold tracking-widest uppercase rounded-full border border-violet-500/20">
                  ⚡ TIME TO UPGRADE YOUR FUTURE
                </span>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-none">
                  Empowering Youth <br/>
                  Through <span className="text-gradient bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">High-Income Skills</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl font-sans">
                  Unlike traditional systems, T2Upgrade Pvt. Ltd. focuses on practical, job-oriented, and income-generating skills. Learn high-demand digital workflows, unlock matching downline incentives, and build financial independence.
                </p>

                <div className="flex flex-wrap gap-3.5 pt-2">
                  <Button 
                    onClick={() => setActiveSubTab('register')}
                    className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-6 text-xs shadow-md shadow-primary/20 flex items-center gap-1.5 group"
                  >
                    Enroll Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveSubTab('courses')}
                    variant="outline"
                    className="border-border hover:bg-muted/40 font-bold h-10 px-6 text-xs flex items-center gap-1.5"
                  >
                    Browse Courses
                  </Button>
                </div>
              </div>

              {/* Graphical Hero Right Card */}
              <div className="lg:col-span-5 relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 opacity-10 blur-xl pointer-events-none" />
                <Card className="border border-border/80 bg-card/45 backdrop-blur-md p-6 relative overflow-hidden rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-violet-400">
                      <Sparkles className="w-4.5 h-4.5" />
                      Qualify for Earning Streams
                    </CardTitle>
                    <CardDescription className="text-xs">
                      A complete hybrid learning system.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border/40 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground block">Learn Skills</strong>
                          <span className="text-[11px] text-muted-foreground">Artificial Intelligence, Web3, Spoken English, DeFi, and smart audits.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border/40 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground block">Share & Build Downlines</strong>
                          <span className="text-[11px] text-muted-foreground">Add direct members, balance Ram and Shyam matching BV nodes.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border/40 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground block">Earn Royalties</strong>
                          <span className="text-[11px] text-muted-foreground">Receive direct signup payouts, matching commission blocks, and certification bonuses.</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Core Statistics counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-border/40">
              {[
                { val: '15,000+', label: 'Active Students' },
                { val: '12%', label: 'Binary Matching Share' },
                { val: '₹120', label: 'Reward Per 1K BV' },
                { val: '₹1.2Cr+', label: 'Commissions Paid' }
              ].map((stat, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-muted/20 border border-border/40 text-center space-y-1">
                  <span className="text-2xl sm:text-3.5xl font-black text-foreground block font-mono tracking-tight">{stat.val}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Your Journey Ecosystem */}
            <div className="space-y-8 pt-10 border-t border-border/40 text-center">
              <div className="space-y-3 max-w-xl mx-auto">
                <span className="px-2.5 py-0.5 bg-violet-500/10 text-violet-500 text-[10px] font-extrabold uppercase rounded-md tracking-wider border border-violet-500/20">The T2U Pathway</span>
                <h2 className="text-2xl sm:text-4xl font-black text-foreground">Every Step, Covered • सफलता का सफर</h2>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  From your very first lesson to building your dream career, we provide a complete, end-to-end ecosystem. Master high-demand skills, gain industry credentials, and earn while you learn.
                  <br />
                  <span className="text-[11px] italic text-violet-400">
                    "आपके पहले पाठ से लेकर अपनी ड्रीम जॉब तक, हम एक संपूर्ण एंड-टू-एंड इकोसिस्टम प्रदान करते हैं।"
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto pt-4 text-left">
                {[
                  { step: '01', title: 'Learn • सीखें', desc: 'Master in-demand skills in AI, Web3, Spoken English, and Digital Growth led by experts.', icon: <BookOpen className="w-5 h-5 text-violet-400" /> },
                  { step: '02', title: 'Get Mentored • मार्गदर्शन', desc: '1-on-1 industry mentorship sessions to guide you through tough curriculum milestones.', icon: <Users className="w-5 h-5 text-violet-400" /> },
                  { step: '03', title: 'Build • निर्माण', desc: 'Work on 10+ real-world portfolio projects and automated assessment sandboxes.', icon: <Rocket className="w-5 h-5 text-violet-400" /> },
                  { step: '04', title: 'Mock Sessions • अभ्यास', desc: 'Build presentation skills and practice mock interviews with elite corporate leaders.', icon: <Sparkles className="w-5 h-5 text-violet-400" /> },
                  { step: '05', title: 'Get Certificate • प्रमाणपत्र', desc: 'Earn verifiable corporate and skill certifications to show off your capability.', icon: <Award className="w-5 h-5 text-violet-400" /> }
                ].map((item, idx) => (
                  <Card key={idx} className="border border-border/80 bg-card/45 relative overflow-hidden p-5 flex flex-col justify-between group hover:border-violet-500/30 transition-all">
                    <div className="absolute top-3 right-3 text-lg font-black text-violet-500/10 font-mono group-hover:text-violet-500/20 transition-colors">
                      {item.step}
                    </div>
                    <div className="space-y-3">
                      <div className="h-9 w-9 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-foreground uppercase tracking-wider">{item.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-normal font-sans">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Faculty / Practitioner Node */}
            <div className="space-y-8 pt-10 border-t border-border/40 text-center">
              <div className="space-y-3 max-w-xl mx-auto">
                <span className="px-2.5 py-0.5 bg-violet-500/10 text-violet-500 text-[10px] font-extrabold uppercase rounded-md tracking-wider border border-violet-500/20">Expert Guides</span>
                <h2 className="text-2xl sm:text-4xl font-black text-foreground">Learn from Elite Practitioners</h2>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Our modules are led by senior professionals who bring real-world corporate experience from top global and domestic firms.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto pt-4 text-left">
                {[
                  { name: 'Vikram Singh', role: 'Head of Digital Marketing', company: 'CRED', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Priya Menon', role: 'Spoken English Lead Coach', company: 'BBC Certified', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Arjun Kapoor', role: 'Excel & Analytics Mentor', company: 'Deloitte Ex-Manager', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Sneha Reddy', role: 'DeFi & Solidity Architect', company: 'Zoho Ex-Senior Eng', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Rohan Sharma', role: 'UI/UX & Product Design', company: 'Razorpay Design Lead', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Divya Joshi', role: 'Office Readiness Mentor', company: 'Nykaa Operations', img: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Karan Malhotra', role: 'MLM & Network Specialist', company: 'Network Director', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
                  { name: 'Rahul Verma', role: 'AI Tools & Productivity', company: 'Flipkart Engineer', img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80' }
                ].map((fac, idx) => (
                  <Card key={idx} className="border border-border/60 bg-card/35 overflow-hidden group">
                    <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                      <img 
                        src={fac.img} 
                        alt={fac.name} 
                        className="w-full h-full object-cover grayscale opacity-90 transition-all duration-300 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                    </div>
                    <CardHeader className="p-4">
                      <span className="text-[9px] text-primary uppercase font-black font-mono tracking-wider">{fac.company}</span>
                      <h4 className="text-xs font-bold text-foreground mt-0.5">{fac.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-sans leading-normal mt-0.5">{fac.role}</p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Success Portfolios */}
            <div className="space-y-8 pt-10 border-t border-border/40 text-center">
              <div className="space-y-3 max-w-xl mx-auto">
                <span className="px-2.5 py-0.5 bg-violet-500/10 text-violet-500 text-[10px] font-extrabold uppercase rounded-md tracking-wider border border-violet-500/20">Success Stories</span>
                <h2 className="text-2xl sm:text-4xl font-black text-foreground">Real Learners, Real Income</h2>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  See how students across India are upgrading their vocational skills and building reliable direct selling downline rewards.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-4 text-left">
                {[
                  {
                    name: 'Rakesh Yadav',
                    story: 'Junior Office Assistant ➔ Branch Coordinator',
                    company: 'Jaipur Logistics',
                    quote: 'T2U Office Ready skills and Excel analytics guides changed how I work. I secured an 80%+ salary hike and now manage branch log sheets smoothly.',
                    income: '₹22,000 / month salary'
                  },
                  {
                    name: 'Priyanka Saxena',
                    story: 'Homemaker ➔ Digital Marketer & Team Lead',
                    company: 'Self-Employed (T2U Partner)',
                    quote: 'I started learning digital marketing and sharing course links part-time. Last month, my binary matching volume payout reached ₹35,000. It gave me financial freedom.',
                    income: '₹35,000 referral payout'
                  },
                  {
                    name: 'Mohammed Faizal',
                    story: 'College BCA Student ➔ Remote AI Intern',
                    company: 'Remote Tech Solutions',
                    quote: 'The AI & Automation sandbox allowed me to build custom workflow triggers. Showing these real projects in interviews landed me an internship instantly.',
                    income: '₹15,000 stipend'
                  },
                  {
                    name: 'Sunita Kumari',
                    story: 'Beauty Parlour Owner ➔ Business Growth Expert',
                    company: 'Local Business Owner',
                    quote: 'I used the customer acquisition funnel templates to double my salon bookings. I also built a downline network of 50+ students who are learning and earning.',
                    income: '2x Parlour Growth + Commission'
                  }
                ].map((s, idx) => (
                  <Card key={idx} className="border border-border bg-card/40 p-6 relative overflow-hidden flex flex-col justify-between hover:border-violet-500/25 transition-all">
                    <div className="absolute top-0 right-0 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 font-mono text-[9px] font-bold rounded-bl-xl border-l border-b border-emerald-500/20">
                      {s.income}
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-foreground uppercase tracking-wider">{s.name}</h4>
                        <span className="text-[10px] text-primary font-semibold block">{s.story} ({s.company})</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-sans leading-relaxed italic">
                        "{s.quote}"
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW: ABOUT US */}
        {activeSubTab === 'about' && (
          <div className="space-y-20 animate-in fade-in duration-300">
            
            {/* Section 1: Our Story */}
            <div className="space-y-8">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <span className="px-2.5 py-0.5 bg-violet-500/10 text-violet-500 text-[10px] font-extrabold uppercase rounded-md tracking-wider border border-violet-500/20">Our Story</span>
                <h2 className="text-2xl sm:text-4xl font-black text-foreground">Bridging the Vocational Gap</h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
                  T2Upgrade Pvt. Ltd. is committed to empowering India's youth with high-income skills, career builders, and multi-income streams.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <Card className="border border-border bg-card shadow-sm p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-violet-500" />
                      OUR VISION
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground leading-relaxed font-sans space-y-2">
                    <p>
                      We envision a future where high-tier technological and vocational expertise is accessible to every individual. Our aim is to transform learning from theoretical memorization into direct, financially generating skills.
                    </p>
                    <p>
                      By creating a network of skilled practitioners, T2Upgrade bridges the demand-supply discrepancy in international crowdworking, software verification, and Web3 environments.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-sm p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-500" />
                      OUR MISSION
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground leading-relaxed font-sans space-y-2">
                    <p>
                      To deliver practical course modules paired with transparent referral networks that qualify users for instant payouts. We guide students along structured learning roadmaps toward international certifications.
                    </p>
                    <p>
                      Every learner qualifies for real-world campaigns, earning matching commissions, daily bounty logs, and project grading compensations.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Coordinates */}
              <Card className="border border-border/60 bg-muted/10 p-6 rounded-2xl max-w-3xl mx-auto mt-6">
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Corporate Headquarters & Inquiries
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <Mail className="w-5 h-5 text-violet-500" />
                    <span className="font-semibold text-foreground">Email Support</span>
                    <a href="mailto:t2upgradeofficial@gmail.com" className="text-primary hover:underline font-mono text-[10.5px]">
                      t2upgradeofficial@gmail.com
                    </a>
                  </div>
                  <div className="flex flex-col items-center gap-1 border-t md:border-t-0 md:border-x border-border/40 pt-4 md:pt-0">
                    <Calendar className="w-5 h-5 text-violet-500" />
                    <span className="font-semibold text-foreground">Phone Helpline</span>
                    <a href="tel:+919269488028" className="text-primary hover:underline font-mono text-[10.5px]">
                      +91 92694 88028
                    </a>
                  </div>
                  <div className="flex flex-col items-center gap-1 border-t md:border-t-0 pt-4 md:pt-0">
                    <MapPin className="w-5 h-5 text-violet-500" />
                    <span className="font-semibold text-foreground">Registered Office</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      Ward no. 18, Mochiyon ka Mohalla, <br/>
                      Lunkaransar, Rajasthan, India
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 2: Company Registrations & Certifications */}
            <div className="space-y-8 pt-8 border-t border-border/40">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <span className="px-2.5 py-0.5 bg-violet-500/10 text-violet-500 text-[10px] font-extrabold uppercase rounded-md tracking-wider border border-violet-500/20">Corporate Trust</span>
                <h2 className="text-2xl sm:text-3.5xl font-black text-foreground uppercase tracking-tight">Company Registrations & Certifications</h2>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  T2Upgrade Pvt. Ltd. is a fully registered, verified, and legally compliant direct selling and vocational education entity under the Government of India guidelines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {[
                  { 
                    title: 'Certificate of Incorporation', 
                    authority: 'Ministry of Corporate Affairs, Govt of India', 
                    id: 'CIN: U80902RJ2026PTC085140', 
                    date: 'February 12, 2026',
                    desc: 'Official certificate recognizing T2Upgrade Pvt. Ltd. as a legally registered corporate body.'
                  },
                  { 
                    title: 'ISO 9001:2015 Certification', 
                    authority: 'International Standards Organization (QMS)', 
                    id: 'Certificate No: ISO-2026-98124', 
                    date: 'March 02, 2026',
                    desc: 'Certified Quality Management System for delivering digital vocational education and skill development services.'
                  },
                  { 
                    title: 'MSME Udyam Registration', 
                    authority: 'Ministry of Micro, Small & Medium Enterprises, Govt of India', 
                    id: 'Udyam-RJ-18-0029314', 
                    date: 'February 15, 2026',
                    desc: 'Registered micro enterprise under central vocational support networks.'
                  },
                  { 
                    title: 'GSTIN Registry Certificate', 
                    authority: 'Department of Revenue, Ministry of Finance, Govt of India', 
                    id: 'GSTIN: 08AAACT9023L1Z4', 
                    date: 'February 18, 2026',
                    desc: 'Official tax registration enabling transparent fiat routing and ledger audits.'
                  }
                ].map((cert, idx) => (
                  <Card key={idx} className="border border-border bg-card/65 relative overflow-hidden flex flex-col justify-between hover:border-violet-500/30 transition-all group">
                    <div className="absolute top-0 left-0 h-full w-1 bg-primary group-hover:bg-violet-500 transition-colors" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-primary font-mono uppercase bg-primary/10 px-2 py-0.5 rounded-md">
                          {cert.authority}
                        </span>
                        <Award className="w-5 h-5 text-violet-500" />
                      </div>
                      <CardTitle className="text-sm font-extrabold text-foreground mt-2">{cert.title}</CardTitle>
                      <span className="text-[10px] text-muted-foreground font-mono block font-bold pt-1">{cert.id}</span>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed font-sans">{cert.desc}</p>
                      <div className="flex justify-between items-center text-[10px] pt-3 border-t border-border/40 text-muted-foreground font-mono">
                        <span>Registered: {cert.date}</span>
                        <Button 
                          onClick={() => alert(`Opening official copy of ${cert.title}...\nRegistration ID: ${cert.id}`)}
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[9px] font-bold border-border/80 hover:bg-muted/40"
                        >
                          View Document
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Section 3: Downloads Directory */}
            <div className="space-y-6 pt-8 border-t border-border/40 max-w-xl mx-auto">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Downloads Directory</h2>
                <p className="text-xs text-muted-foreground font-sans">Access slide decks, study guidelines, and brochures.</p>
              </div>

              <Card className="border border-border bg-card shadow-sm">
                <CardContent className="p-4 divide-y divide-border/60">
                  {[
                    { title: 'T2Upgrade Company Profile & Prospectus', format: 'PDF (2.4 MB)', desc: 'Full business details, core mission statements, and direct selling declarations.' },
                    { title: 'Foundations of Micro-Earning Syllabus Deck', format: 'PDF (1.8 MB)', desc: 'Study guidelines, accuracy targets checklist, and certification parameters.' },
                    { title: 'Referral Rewards Rules & Binary Structure Guide', format: 'PDF (1.2 MB)', desc: 'Guide to Left (Ram) and Right (Shyam) node BV matching systems and daily capping.' },
                    { title: 'LMS Platform Enrollment User Guide', format: 'PDF (850 KB)', desc: 'Step-by-step layout overview detailing course workspace navigation.' },
                  ].map((item, idx) => (
                    <div key={idx} className="py-4 flex justify-between items-start gap-4 text-xs first:pt-1 last:pb-1">
                      <div className="min-w-0 space-y-0.5">
                        <strong className="text-foreground block font-semibold">{item.title}</strong>
                        <span className="text-[10px] text-muted-foreground font-sans block leading-normal">{item.desc}</span>
                        <span className="text-[9px] text-primary font-mono block mt-1">{item.format}</span>
                      </div>
                      <Button 
                        onClick={() => alert(`Downloading mock file: ${item.title}...`)}
                        size="sm" 
                        variant="outline"
                        className="h-8 text-[10px] font-bold border-border/80 hover:bg-muted/40 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Section 4: Gallery & Highlights */}
            <div className="space-y-6 pt-8 border-t border-border/40">
              <div className="text-center max-w-md mx-auto space-y-2">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Gallery & Highlights</h2>
                <p className="text-xs text-muted-foreground font-sans">Glimpses of our active learning events, workshops, and graduation ceremonies.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {[
                  { title: 'Interactive AI Prompt Masterclass', desc: 'Over 150 scholars attended the live RLHF alignment checks tutorial.', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80' },
                  { title: 'KYC Document Registry Training', desc: 'Step-by-step training for legal Aadhaar/PAN compliance and account sweeps.', img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80' },
                  { title: 'Graduation Certification Day', desc: 'Scholars awarded with Micro-Earning qualifications and course credits.', img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80' },
                  { title: 'Instructor Collaboration Summit', desc: 'Lead educators aligning on new Solidity audits and DeFi modules syllabus.', img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80' },
                  { title: 'Direct Selling Consumer Support Workshop', desc: 'Reviewing Indian direct selling laws and downline transparency structures.', img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80' },
                  { title: 'Web3 & Staking Sandbox Launch', desc: 'Interactive wallet configuration drills led by Dr. Evelyn Carter.', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80' }
                ].map((item, idx) => (
                  <Card key={idx} className="border border-border bg-card shadow-sm overflow-hidden group">
                    <div className="relative overflow-hidden aspect-video">
                      <img 
                        src={item.img} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-xs font-bold text-foreground truncate">{item.title}</CardTitle>
                      <CardDescription className="text-[10px] leading-relaxed mt-1 font-sans">{item.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW: PRODUCTS */}
        {activeSubTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center max-w-md mx-auto space-y-2">
              <span className="px-2 py-0.5 bg-violet-500/10 text-violet-500 border border-violet-500/20 text-[9px] uppercase font-black rounded tracking-wider">OFFICIAL REVENUE STORE</span>
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">T2U Learning Store</h2>
              <p className="text-xs text-muted-foreground font-sans">Acquire professional study guides, manual binders, and digital asset templates.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 max-w-5xl mx-auto">
              {[
                { title: 'Advanced Spoken English Complete Course Book', category: 'Study Material', price: 499, originalPrice: 999, img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80' },
                { title: 'Advanced Digital Marketing Playbook', category: 'Study Material', price: 599, originalPrice: 1199, img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&q=80' },
                { title: 'Tally Prime & GST Accounting Guide', category: 'Practice Manual', price: 399, originalPrice: 799, img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80' },
                { title: 'AI Automation Prompt Mastery Vault', category: 'Digital Assets', price: 299, originalPrice: 599, img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80' },
                { title: 'Corporate Readiness & Confidence Building Kit', category: 'Personal Growth', price: 349, originalPrice: 699, img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80' },
                { title: 'B2B Client Acquisition Funnel Template', category: 'Digital Assets', price: 449, originalPrice: 899, img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80' }
              ].map((prod, idx) => (
                <Card key={idx} className="border border-border bg-card flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                    <img src={prod.img} alt={prod.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 text-[8px] font-black text-white bg-primary px-2 py-0.5 rounded border border-primary/20 uppercase tracking-widest font-mono">
                      {Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)}% OFF
                    </span>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <span className="text-[8px] text-primary uppercase font-bold tracking-wider font-mono">{prod.category}</span>
                    <CardTitle className="text-xs font-bold text-foreground mt-0.5 leading-tight">{prod.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-foreground font-mono">₹{prod.price}</span>
                      <span className="text-[10px] text-muted-foreground line-through font-mono">₹{prod.originalPrice}</span>
                    </div>
                    <Button 
                      onClick={() => alert(`Adding "${prod.title}" to cart...`)}
                      className="w-full h-8 bg-primary hover:bg-primary/90 text-white text-[10px] font-bold"
                    >
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: COURSES */}
        {activeSubTab === 'courses' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center max-w-md mx-auto space-y-2">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">LMS Courses</h2>
              <p className="text-xs text-muted-foreground font-sans">Browse curriculum modules, qualifiers, and certificates. Sign in to start learning.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 max-w-4xl mx-auto">
              {courses.map((course) => (
                <Card key={course.id} className="border border-border bg-card shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 px-2.5 py-0.5 bg-violet-600 text-white text-[9.5px] font-bold uppercase tracking-wider rounded">
                      {course.category}
                    </span>
                  </div>

                  <CardHeader className="p-5">
                    <CardTitle className="text-sm font-bold text-foreground">{course.title}</CardTitle>
                    <CardDescription className="text-xs mt-1 leading-relaxed font-sans">{course.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 border-t border-border/40 bg-muted/5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Instructor: <strong className="text-foreground">{course.instructor}</strong></span>
                    <span>Duration: <strong className="text-foreground">{course.duration}</strong></span>
                  </CardContent>

                  <div className="p-4 border-t border-border/40 bg-muted/10">
                    <Button 
                      onClick={() => setActiveSubTab('login')}
                      className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold h-9"
                    >
                      Login to enroll
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: LOGIN FORM */}
        {activeSubTab === 'login' && (
          <div className="max-w-md w-full mx-auto animate-in fade-in duration-300">
            <Card className="border border-border bg-card shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-primary to-orange-500" />
              <CardHeader className="text-center pb-4 border-b border-border/40">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Account Login</CardTitle>
                <CardDescription className="text-xs">Access student or instructor portals</CardDescription>
              </CardHeader>

              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Username or Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="text"
                        required
                        placeholder="e.g. t2u1001 or student@t2u.com"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        className="h-9.5 pl-10 text-xs bg-muted/20 border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-9.5 pl-10 text-xs bg-muted/20 border-border"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 text-center font-medium">
                      {loginError}
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 text-xs mt-2 shadow-md shadow-primary/10">
                    Sign In to Portal
                  </Button>

                  <div className="text-center pt-2 text-[10.5px] text-muted-foreground">
                    Don't have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => setActiveSubTab('register')}
                      className="text-primary font-bold hover:underline"
                    >
                      Register here
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VIEW: REGISTER FORM */}
        {activeSubTab === 'register' && (
          <div className="max-w-xl w-full mx-auto animate-in fade-in duration-300">
            <Card className="border border-border bg-card shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-primary to-orange-500" />
              <CardHeader className="text-center pb-4 border-b border-border/40">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Create Portal Account</CardTitle>
                <CardDescription className="text-xs">Select role and fill credential details</CardDescription>
              </CardHeader>

              <CardContent className="p-6 md:p-8">
                {regSuccess ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 rounded-full mx-auto flex items-center justify-center">
                      <Check className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-foreground">Registration Success!</h3>
                      <p className="text-xs text-muted-foreground leading-normal max-w-sm mx-auto font-sans">
                        Account created dynamically. You are being redirected to the login form portal...
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
                    
                    {/* Role Selection Tabs */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Choose Account Role</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRegRole('student')}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                            regRole === 'student' 
                              ? 'bg-primary/10 border-primary text-primary' 
                              : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Student Portal
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegRole('instructor')}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                            regRole === 'instructor' 
                              ? 'bg-primary/10 border-primary text-primary' 
                              : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Instructor Portal
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="text"
                            required
                            placeholder="e.g. t2u1005"
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                            className="h-9 text-xs pl-10 bg-muted/20 border-border"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</Label>
                        <Input 
                          type="text"
                          required
                          placeholder="Legal name"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="h-9 text-xs bg-muted/20 border-border"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</Label>
                        <Input 
                          type="email"
                          required
                          placeholder="Email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="h-9 text-xs bg-muted/20 border-border"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile Phone</Label>
                        <Input 
                          type="text"
                          required
                          placeholder="+91 Mobile number"
                          value={regMobile}
                          onChange={(e) => setRegMobile(e.target.value)}
                          className="h-9 text-xs bg-muted/20 border-border"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Date of Birth</Label>
                        <Input 
                          type="date"
                          required
                          value={regDob}
                          onChange={(e) => setRegDob(e.target.value)}
                          className="h-9 text-xs bg-muted/20 border-border font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Password</Label>
                        <Input 
                          type="password"
                          required
                          placeholder="Password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="h-9 text-xs bg-muted/20 border-border"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Postal Address</Label>
                        <Input 
                          type="text"
                          placeholder="Permanent Address"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          className="h-9 text-xs bg-muted/20 border-border"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 text-xs mt-4 shadow-md shadow-primary/10">
                      Register & Create Roster Account
                    </Button>

                    <div className="text-center pt-2 text-[10.5px] text-muted-foreground">
                      Already have an account?{' '}
                      <button 
                        type="button" 
                        onClick={() => setActiveSubTab('login')}
                        className="text-primary font-bold hover:underline"
                      >
                        Login here
                      </button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </main>

      {/* Landing Footer bar */}
      <footer className="border-t border-border/50 bg-card/40 p-6 text-center select-none">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-4 text-[10.5px] text-muted-foreground">
          <span>&copy; 2026 T2Upgrade Pvt. Ltd. | All rights reserved.</span>
          <div className="flex gap-4 font-sans">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Consumer Protection Rules</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
