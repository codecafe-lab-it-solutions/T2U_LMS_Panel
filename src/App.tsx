import { useEffect, useState, useRef, Component, lazy, Suspense, type ReactNode, type ErrorInfo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('React render error:', error, info); }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-lg w-full space-y-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
            <p className="text-sm font-black text-red-500">Something went wrong</p>
            <pre className="text-[11px] text-red-400 whitespace-pre-wrap font-mono bg-red-500/5 p-3 rounded-xl overflow-auto max-h-64">
              {err.message}{'\n\n'}{err.stack}
            </pre>
            <button type="button" onClick={() => this.setState({ error: null })}
              className="text-xs font-bold bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeDashboard from './components/HomeDashboard';

const PublicSite        = lazy(() => import('./components/PublicSite'));
const LearningSection   = lazy(() => import('./components/LearningSection'));
const KYCVerification   = lazy(() => import('./components/KYCVerification'));
const GenealogyTree     = lazy(() => import('./components/GenealogyTree'));
const IncomeDashboard   = lazy(() => import('./components/IncomeDashboard'));
const LiveClassManagement = lazy(() => import('./components/LiveClassManagement'));
const StudentModules    = lazy(() => import('./components/StudentModules'));
const InstructorModules = lazy(() => import('./components/InstructorModules'));
const MLMDashboard      = lazy(() => import('./components/MLMDashboard'));
const AdminPanel        = lazy(() => import('./components/admin/AdminPanel'));
const QuizCreatePage    = lazy(() => import('./components/admin/QuizCreatePage'));
const QuizTakingPage    = lazy(() => import('./components/QuizTakingPage'));
const QuizEditPage      = lazy(() => import('./components/QuizEditPage'));
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});


function MainLayoutContent() {
  const { activeTab, setActiveTab, setDarkMode, darkMode, isAuthenticated, userProfile, acceptTerms, userRole, activeQuizId, setActiveQuizId } = useAppStore();
  const [checkedTerms, setCheckedTerms] = useState(false);

  // ── URL / History routing ─────────────────────────────────────────────────
  // skipNextPush: prevents pushState when the tab change was triggered BY popstate
  const skipNextPush = useRef(false);
  // pendingTab: remembers a deep-link tab opened while the user wasn't logged in yet
  const pendingTab = useRef<string | null>(null);

  const tabFromHash = (): string | null => {
    const h = window.location.hash; // e.g. '#/my-team'
    if (!h.startsWith('#/')) return null;
    return h.slice(2) || null;
  };

  // 1. Mount: read hash, wire up popstate listener
  useEffect(() => {
    const hash = tabFromHash();
    if (hash) {
      if (isAuthenticated) {
        // Already logged in — navigate straight to the hashed tab
        skipNextPush.current = true;
        setActiveTab(hash as any);
      } else {
        // Not yet logged in — remember it for after login
        pendingTab.current = hash;
      }
    }

    const onPop = () => {
      const t = tabFromHash();
      if (t === null) {
        // Back went past the app (empty hash / pre-app URL).
        // history.go(1) cancels the navigation without truncating forward history,
        // then fires another popstate that lands on #/home.
        history.go(1);
      } else if (t !== 'home') {
        // Back/forward to a real inner tab — navigate normally.
        // URL is already correct; just sync the store.
        skipNextPush.current = true;
        setActiveTab(t as any);
      } else {
        // Back/forward landed on home.
        // Do NOT pushState here — that would destroy the forward stack
        // (e.g. "My Referral" would vanish from the forward history).
        // Just sync the store; the URL is already #/home.
        skipNextPush.current = true;
        setActiveTab('home');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. After login: restore a pending deep-link tab
  useEffect(() => {
    if (isAuthenticated && pendingTab.current) {
      skipNextPush.current = true;
      setActiveTab(pendingTab.current as any);
      pendingTab.current = null;
    }
  }, [isAuthenticated]);

  // 3. Whenever activeTab changes: push a new history entry (unless we came from popstate)
  useEffect(() => {
    if (!isAuthenticated) {
      // On logout, strip the hash so the URL is clean
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      return;
    }
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    // Only push if the URL actually needs to change
    if (tabFromHash() !== activeTab) {
      history.pushState({ tab: activeTab }, '', `#/${activeTab}`);
    }
  }, [activeTab, isAuthenticated]);
  // ─────────────────────────────────────────────────────────────────────────

  // Apply the stored theme preference to the DOM on mount
  useEffect(() => {
    setDarkMode(darkMode);
  }, []);

  // Detailed tab-based routing for Student and Instructor modules
  const renderTabContent = () => {
    // Admin panel — all admin-* tabs routed through AdminPanel
    if (userRole === 'admin') return <AdminPanel />;

    switch (activeTab) {
      case 'home':
        return <HomeDashboard />;
      
      // Educational modules (ERPNext LMS Mirror)
      case 'courses':
      case 'quizzes':
        return <LearningSection />;
      
      // Live Sessions Page
      case 'live-classes':
      case 'live-class-management':
        return <LiveClassManagement />;
      
      // KYC Verification (SunCity Solar Profile Style)
      case 'kyc':
        return <KYCVerification />;
      
      // Genealogy Referral Downlines (You/Ram/Shyam Matchings)
      case 'genealogy':
        return <GenealogyTree />;
      
      // Income and Commission ledgers
      case 'income-dashboard':
      case 'withdrawals':
      case 'commission-history':
      case 'instructor-earnings':
        return <IncomeDashboard />;
      
      // MLM Network Dashboard (student)
      case 'mlm-dashboard':
        return <MLMDashboard />;

      // Student sub-modules
      case 'assignments':
      case 'certificates':
      case 'rewards':
      case 'referral-dashboard':
      case 'my-team':
      case 'notifications':
      case 'settings':
        return <StudentModules />;

      // Instructor quiz create (full-page flow)
      case 'instructor-quiz-create':
        return <QuizCreatePage onBack={() => setActiveTab('quiz-management')} />;

      // Quiz taking (student)
      case 'quiz-taking':
        return activeQuizId ? (
          <QuizTakingPage quizId={activeQuizId} onBack={() => { setActiveQuizId(null); setActiveTab('quizzes'); }} />
        ) : <HomeDashboard />;

      // Instructor quiz edit
      case 'instructor-quiz-edit':
        return activeQuizId ? (
          <QuizEditPage quizId={activeQuizId} onBack={() => { setActiveQuizId(null); setActiveTab('quiz-management'); }} />
        ) : <InstructorModules />;

      // Instructor-specific management sub-modules
      case 'course-management':
      case 'quiz-management':
      case 'assignment-management':
      case 'student-analytics':
      case 'instructor-courses':
      case 'instructor-products':
      case 'live-class-analytics':
      case 'instructor-course-detail':
      case 'instructor-batch-create':
      case 'instructor-batch-manage':
      case 'instructor-withdrawals':
        return <InstructorModules />;
      
      default:
        return <HomeDashboard />;
    }
  };

  // If the user is not authenticated, show the Public Landing Site
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <PublicSite />
      </Suspense>
    );
  }

  // Terms & Conditions / Direct Selling Rules Acceptance Modal
  const needsTermsAcceptance = userProfile && (!userProfile.hasAcceptedTerms || userProfile.firstLogin);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased select-none font-sans transition-colors duration-300">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Uniform Top Header */}
        <Header />

        {/* Scrollable layout panel */}
        <main 
          id="routing-container-parent" 
          className="flex-1 overflow-y-auto px-4 py-6 md:p-8 pb-24 md:pb-8 focus:outline-hidden"
        >
          {/* Slide & Fade entering animation Container */}
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-300">
            <Suspense fallback={<div className="flex items-center justify-center py-24 text-muted-foreground text-sm">Loading…</div>}>
              {renderTabContent()}
            </Suspense>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>

      {/* Declaration & Disclaimer Modal Overlay */}
      {needsTermsAcceptance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-primary to-orange-500" />

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="p-2 bg-violet-500/10 text-violet-500 rounded-lg shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">T2UPGRADE PVT. LTD.</p>
                <h2 className="text-sm md:text-base font-black text-foreground uppercase tracking-wide leading-tight">
                  Direct Seller / Distributor Disclaimer & Declaration
                </h2>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="text-xs text-muted-foreground space-y-5 max-h-[380px] overflow-y-auto pr-2 font-sans leading-relaxed">

              {/* Distributor info */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] bg-muted/30 border border-border/50 rounded-xl p-4">
                <div><span className="font-bold text-foreground">Name:</span> {userProfile.name}</div>
                <div><span className="font-bold text-foreground">Email:</span> {userProfile.email}</div>
                <div><span className="font-bold text-foreground">Mobile:</span> {userProfile.mobile || '—'}</div>
                <div><span className="font-bold text-foreground">Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
              </div>

              {/* Declaration */}
              <div className="space-y-3">
                <h3 className="font-black text-foreground text-[11.5px] uppercase tracking-wide">Declaration</h3>
                <p>I, <strong className="text-foreground">{userProfile.name}</strong>, voluntarily join T2UPGRADE Pvt. Ltd. as an Independent Direct Seller / Distributor.</p>
                <p>I hereby declare and agree that:</p>
                <ol className="space-y-2 list-decimal list-outside pl-4">
                  <li>I have read, understood, and accepted the Policies & Procedures, Compensation Plan, Code of Conduct, Terms & Conditions, and other applicable guidelines of T2UPGRADE Pvt. Ltd.</li>
                  <li>I understand that I am an Independent Direct Seller and not an employee, partner, agent, franchise owner, legal representative, or authorized spokesperson of T2UPGRADE Pvt. Ltd.</li>
                  <li>I shall promote only those products, services, educational programs, and business opportunities officially approved by T2UPGRADE Pvt. Ltd.</li>
                  <li>I shall not make any false, misleading, exaggerated, deceptive, or unauthorized claims regarding income opportunities, product performance, educational outcomes, employment opportunities, business earnings, or return on investment.</li>
                  <li>I understand that my earnings, commissions, incentives, bonuses, and rewards depend solely upon my personal efforts, sales activities, customer acquisition, customer retention, team performance (where applicable), and compliance with company policies.</li>
                  <li>I acknowledge that T2UPGRADE Pvt. Ltd. does not guarantee any fixed income, assured returns, guaranteed profit, employment, or financial success.</li>
                  <li>I understand that T2UPGRADE Pvt. Ltd. does not promote or operate any Pyramid Scheme, Money Circulation Scheme, Ponzi Scheme, or any unlawful recruitment-based compensation model.</li>
                  <li>I shall not collect any unauthorized fee, charge, donation, investment, security deposit, or cash amount from any customer, prospect, or distributor in the name of T2UPGRADE Pvt. Ltd.</li>
                  <li>I shall maintain professional, ethical, and lawful conduct while representing the company.</li>
                  <li>I shall not use fake testimonials, manipulated screenshots, misleading social media advertisements, unauthorized presentations, or any marketing material not approved by the company.</li>
                  <li>I shall respect consumer rights and comply with all applicable consumer protection laws and company policies.</li>
                  <li>I understand that violation of company policies, code of conduct, or applicable laws may result in suspension, termination, withholding of commissions (where legally permitted), or other disciplinary action by the company.</li>
                  <li>I agree to comply with the Consumer Protection Act, 2019; Consumer Protection (Direct Selling) Rules, 2021; Information Technology Act, 2000; and all other applicable laws and regulations of India.</li>
                  <li>I confirm that all information provided by me during registration and KYC verification is true, accurate, and complete.</li>
                </ol>
              </div>

              {/* Income Disclaimer */}
              <div className="space-y-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <h3 className="font-black text-foreground text-[11.5px] uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Income Disclaimer
                </h3>
                <ul className="space-y-1 list-disc list-outside pl-4">
                  <li>T2UPGRADE Pvt. Ltd. does not guarantee any income, profit, commission, reward, employment, or financial success.</li>
                  <li>Any income examples, success stories, testimonials, presentations, projections, or illustrations are provided solely for educational and informational purposes.</li>
                  <li>Individual results may vary based on skills, dedication, effort, market conditions, sales performance, and business activities.</li>
                  <li>Past performance of any distributor does not guarantee future results.</li>
                </ul>
              </div>

              {/* Training Disclaimer */}
              <div className="space-y-2">
                <h3 className="font-black text-foreground text-[11.5px] uppercase tracking-wide">Training & Education Disclaimer</h3>
                <p>T2UPGRADE Pvt. Ltd. provides educational, vocational, skill-development, and training programs intended to enhance knowledge and professional capabilities. Completion of any course or training program does not guarantee employment, job placement, business success, fixed income, government certification (unless specifically stated), or any specific financial outcome.</p>
              </div>

              {/* Consent */}
              <div className="space-y-2">
                <h3 className="font-black text-foreground text-[11.5px] uppercase tracking-wide">Consent & Acknowledgement</h3>
                <p>I have carefully read, understood, and voluntarily accepted this Disclaimer & Declaration. I agree to abide by all company policies, procedures, ethical standards, and applicable laws throughout my association with T2UPGRADE Pvt. Ltd. I further acknowledge that any violation of these terms may result in disciplinary action, including suspension or termination of my distributorship.</p>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-3 pt-3 border-t border-border/60">
              <input
                type="checkbox"
                id="accept-terms-checkbox"
                checked={checkedTerms}
                onChange={(e) => setCheckedTerms(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary accent-primary shrink-0 cursor-pointer"
              />
              <label
                htmlFor="accept-terms-checkbox"
                className="text-[11px] text-muted-foreground leading-normal cursor-pointer select-none font-sans"
              >
                I have carefully read, understood, and voluntarily accept this Disclaimer & Declaration and agree to abide by all policies, procedures, and applicable laws of T2UPGRADE Pvt. Ltd.
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                disabled={!checkedTerms}
                onClick={acceptTerms}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-6 py-2 h-9"
              >
                Agree and Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <MainLayoutContent />
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
