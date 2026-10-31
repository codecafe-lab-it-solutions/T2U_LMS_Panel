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
import { formatDate } from './utils/date';
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
const PrerecordedVideos   = lazy(() => import('./components/PrerecordedVideos'));
const StudentModules    = lazy(() => import('./components/StudentModules'));
const InstructorModules = lazy(() => import('./components/InstructorModules'));
const InstructorPendingApproval = lazy(() => import('./components/InstructorPendingApproval'));
const MLMDashboard      = lazy(() => import('./components/MLMDashboard'));
const AdminPanel        = lazy(() => import('./components/admin/AdminPanel'));
const EmployeePanel     = lazy(() => import('./components/employee/EmployeePanel'));
const QuizCreatePage    = lazy(() => import('./components/admin/QuizCreatePage'));
const QuizTakingPage    = lazy(() => import('./components/QuizTakingPage'));
const QuizEditPage      = lazy(() => import('./components/QuizEditPage'));
const CourseCreatePage  = lazy(() => import('./components/admin/CourseCreatePage'));
const ProductShop       = lazy(() => import('./components/ProductShop'));
const SupportPage       = lazy(() => import('./components/SupportPage'));
const InvoicesPage      = lazy(() => import('./components/InvoicesPage'));
const StudentBundles    = lazy(() => import('./components/StudentBundles'));
const StudentCourses    = lazy(() => import('./components/StudentCourses'));
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { INSTRUCTOR_MANAGEMENT_TABS } from './constants/instructorGating';
import { SHOW_PRODUCTS } from './constants/featureFlags';

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
  const { activeTab, setActiveTab, setDarkMode, darkMode, isAuthenticated, authToken, userProfile, acceptTerms, syncTermsStatus, logout, userRole, activeQuizId, setActiveQuizId, activeCourseId, setActiveCourseId, isEmployee, employeeAuthToken } = useAppStore();
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [termsSubmitting, setTermsSubmitting] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Instructor content-creation features (courses, live classes, quizzes, assignments,
  // batches) are locked until an admin approves the account. Defaults to true so students/
  // admins (and instructors before the first /auth/me sync) are never wrongly gated.
  const [instructorApproved, setInstructorApproved] = useState(true);

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

  // Sync terms_accepted + instructor approval status from server on every login / session restore
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && typeof data.terms_accepted === 'boolean') {
          syncTermsStatus(data.terms_accepted);
        }
        if (data && data.role === 'instructor') {
          setInstructorApproved(!!data.course_upload_approved);
        }
      })
      .catch(() => { /* best-effort */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authToken]);

  // Employee session restore — re-fetch the permission map on every load so a revoked
  // role doesn't stay in effect longer than a page refresh.
  useEffect(() => {
    if (!isEmployee || !employeeAuthToken) return;
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/employee-auth/me`, {
      headers: { Authorization: `Bearer ${employeeAuthToken}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.permissions) useAppStore.setState({ employeePermissions: data.permissions });
      })
      .catch(() => { /* best-effort */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee, employeeAuthToken]);

  // Detailed tab-based routing for Student and Instructor modules
  const renderTabContent = () => {
    // Admin panel — all admin-* tabs routed through AdminPanel
    if (userRole === 'admin') return <AdminPanel />;

    if (userRole === 'instructor' && !instructorApproved && INSTRUCTOR_MANAGEMENT_TABS.has(activeTab)) {
      return <InstructorPendingApproval />;
    }

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

      case 'prerecorded-videos':
        return <PrerecordedVideos />;
      
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
      case 'bv-ledger':
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

      // Instructor course creation / editing
      case 'instructor-course-create':
        return <CourseCreatePage
          role="instructor"
          courseId={activeCourseId ?? undefined}
          loggedInUserId={userProfile.apiUserId}
          onBack={() => { setActiveCourseId(null); setActiveTab('instructor-courses'); }}
        />;

      // Shop (students + instructors)
      case 'student-products':
        if (!SHOW_PRODUCTS) {
          return <StudentCourses />;
        }
        return <ProductShop />;

      // Support (students + instructors)
      case 'support':
        return <SupportPage />;

      // Invoices (students + instructors)
      case 'invoices':
        return <InvoicesPage />;

      // Course bundles (students)
      case 'course-bundles':
        return <StudentBundles />;

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

  // Employee sessions are fully self-contained (own sidebar, own header, own layout) —
  // bypass the shared Sidebar/Header entirely rather than retrofitting a 4th role branch
  // into every part of that already-complex shared chrome.
  if (isEmployee) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <EmployeePanel />
      </Suspense>
    );
  }

  // Terms & Conditions / Direct Selling Rules Acceptance Modal
  const needsTermsAcceptance = userProfile && (!userProfile.hasAcceptedTerms || userProfile.firstLogin);

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden overflow-x-hidden bg-background text-foreground antialiased select-none font-sans transition-colors duration-300">
      {/* Sidebar / mobile drawer */}
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} instructorApproved={instructorApproved} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-x-hidden">
        {/* Uniform Top Header */}
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Scrollable layout panel */}
        <main 
          id="routing-container-parent" 
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden px-3 py-4 sm:px-4 md:px-6 lg:px-8 pb-24 md:pb-8 focus:outline-hidden"
        >
          {/* Slide & Fade entering animation Container */}
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-300">
            <Suspense fallback={<div className="flex items-center justify-center py-24 text-muted-foreground text-sm">Loading…</div>}>
              {renderTabContent()}
            </Suspense>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav instructorApproved={instructorApproved} />
      </div>

      {/* Declaration & Disclaimer Modal Overlay */}
      {needsTermsAcceptance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-primary to-orange-500" />

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-6 pt-6 pb-4 shrink-0">
              <div className="p-2 bg-violet-500/10 text-violet-500 rounded-lg shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">T2UPGRADE PVT. LTD.</p>
                <h2 className="text-sm md:text-base font-black text-foreground uppercase tracking-wide leading-tight">
                  Terms &amp; Conditions — Distributor Agreement
                </h2>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="text-xs text-muted-foreground space-y-6 overflow-y-auto px-6 py-5 font-sans leading-relaxed flex-1">

              {/* ── DOCUMENT 1 ── */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Document 1 of 2</p>
                <h3 className="text-[13px] font-black text-foreground uppercase tracking-wide">Direct Seller / Distributor Disclaimer &amp; Declaration</h3>
              </div>

              {/* Distributor info */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] bg-muted/30 border border-border/50 rounded-xl p-4">
                <div><span className="font-bold text-foreground">Name:</span> {userProfile.name}</div>
                <div><span className="font-bold text-foreground">Distributor ID:</span> {userProfile.username || '—'}</div>
                <div><span className="font-bold text-foreground">Mobile:</span> {userProfile.mobile || '—'}</div>
                <div><span className="font-bold text-foreground">Email:</span> {userProfile.email}</div>
                <div className="col-span-2"><span className="font-bold text-foreground">Address:</span> {userProfile.address || '—'}</div>
                <div><span className="font-bold text-foreground">Date:</span> {formatDate(new Date())}</div>
              </div>

              {/* Declaration */}
              <div className="space-y-3">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">Declaration</h4>
                <p>I, <strong className="text-foreground">{userProfile.name}</strong>, voluntarily join T2UPGRADE Pvt. Ltd. as an Independent Direct Seller / Distributor.</p>
                <p>I hereby declare and agree that:</p>
                <ol className="space-y-2 list-decimal list-outside pl-4">
                  <li>I have read, understood, and accepted the Policies &amp; Procedures, Compensation Plan, Code of Conduct, Terms &amp; Conditions, and other applicable guidelines of T2UPGRADE Pvt. Ltd.</li>
                  <li>I understand that I am an Independent Direct Seller and not an employee, partner, agent, franchise owner, legal representative, or authorized spokesperson of T2UPGRADE Pvt. Ltd.</li>
                  <li>I shall promote only those products, services, educational programs, and business opportunities officially approved by T2UPGRADE Pvt. Ltd.</li>
                  <li>I shall not make any false, misleading, exaggerated, deceptive, or unauthorized claims regarding:
                    <ul className="list-disc list-outside pl-4 mt-1 space-y-0.5">
                      <li>Income opportunities</li>
                      <li>Product performance</li>
                      <li>Educational outcomes</li>
                      <li>Employment opportunities</li>
                      <li>Business earnings</li>
                      <li>Return on investment</li>
                    </ul>
                  </li>
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
              <div className="space-y-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Income Disclaimer
                </h4>
                <p>I understand and acknowledge that:</p>
                <ul className="space-y-1 list-disc list-outside pl-4">
                  <li>T2UPGRADE Pvt. Ltd. does not guarantee any income, profit, commission, reward, employment, or financial success.</li>
                  <li>Any income examples, success stories, testimonials, presentations, projections, or illustrations are provided solely for educational and informational purposes.</li>
                  <li>Individual results may vary based on skills, dedication, effort, market conditions, sales performance, and business activities.</li>
                  <li>Past performance of any distributor does not guarantee future results.</li>
                </ul>
              </div>

              {/* Training Disclaimer */}
              <div className="space-y-2">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">Training &amp; Education Disclaimer</h4>
                <p>T2UPGRADE Pvt. Ltd. provides educational, vocational, skill-development, and training programs intended to enhance knowledge and professional capabilities.</p>
                <p>I understand that completion of any course or training program does not guarantee:</p>
                <ul className="list-disc list-outside pl-4 space-y-0.5">
                  <li>Employment</li>
                  <li>Job Placement</li>
                  <li>Business Success</li>
                  <li>Fixed Income</li>
                  <li>Government Certification (unless specifically stated)</li>
                  <li>Any specific financial outcome</li>
                </ul>
              </div>

              {/* Consent Doc 1 */}
              <div className="space-y-2 p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide">Consent &amp; Acknowledgement</h4>
                <p>I have carefully read, understood, and voluntarily accepted this Disclaimer &amp; Declaration. I agree to abide by all company policies, procedures, ethical standards, and applicable laws throughout my association with T2UPGRADE Pvt. Ltd. I further acknowledge that any violation of these terms may result in disciplinary action, including suspension or termination of my distributorship.</p>
              </div>

              {/* ── DOCUMENT 2 ── */}
              <div className="border-t-2 border-dashed border-border/60 pt-4 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Document 2 of 2</p>
                <h3 className="text-[13px] font-black text-foreground uppercase tracking-wide">Distributor Compliance &amp; Policy Acknowledgement</h3>
              </div>

              {/* 1. Code of Conduct */}
              <div className="space-y-2">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">1. Code of Conduct Declaration</h4>
                <p>I agree to:</p>
                <ul className="space-y-1 list-none pl-0">
                  {['Maintain honesty, integrity, and professionalism in all business activities.','Treat customers, prospects, and fellow distributors respectfully.','Provide accurate information regarding products, services, courses, compensation plans, and company policies.','Avoid misleading statements, false promises, income guarantees, or deceptive marketing practices.','Follow all company rules, policies, and procedures.','Protect the reputation and goodwill of T2UPGRADE Pvt. Ltd.','Refrain from any unethical, illegal, abusive, discriminatory, or fraudulent conduct.'].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-black shrink-0">✓</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>

              {/* 2. Anti-Pyramid */}
              <div className="space-y-2">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">2. Anti-Pyramid &amp; Anti-Money Circulation Declaration</h4>
                <p>I understand and acknowledge that:</p>
                <ul className="space-y-1 list-none pl-0">
                  {['T2UPGRADE Pvt. Ltd. does not operate a Pyramid Scheme, Ponzi Scheme, Chain Referral Scheme, or Money Circulation Scheme.','My earnings are based on legitimate sales activities and compensation policies approved by the company.','I shall not promote the business opportunity as an investment scheme.','I shall not make statements suggesting guaranteed returns, passive income, or risk-free earnings.','I shall immediately report any such activities to the company.'].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-black shrink-0">✓</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>

              {/* 3. Social Media */}
              <div className="space-y-2">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">3. Social Media &amp; Digital Marketing Policy</h4>
                <p>I agree that:</p>
                <ul className="space-y-1 list-none pl-0">
                  {['I will use only company-approved logos, branding materials, and promotional content.','I will not create fake income screenshots, edited testimonials, or misleading advertisements.','I will not run paid advertisements using the company name without written approval.','I will not create websites, domains, applications, or social media pages that may create confusion with the official company identity.','I will comply with all applicable advertising and consumer protection laws.'].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-black shrink-0">✓</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>

              {/* 4. Customer Protection */}
              <div className="space-y-2">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">4. Customer Protection Declaration</h4>
                <p>I agree that:</p>
                <ul className="space-y-1 list-none pl-0">
                  {['Customers shall receive complete information before purchasing any product or service.','Customers shall not be pressured, forced, or misled into purchasing.','Customers shall receive applicable invoices, receipts, and support information.','I shall cooperate with customer grievance resolution processes.','I shall respect refund and cancellation policies established by the company.'].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-black shrink-0">✓</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>

              {/* 5. Data Privacy */}
              <div className="space-y-2">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">5. Data Privacy &amp; Confidentiality Declaration</h4>
                <p>I understand that:</p>
                <ul className="space-y-1 list-none pl-0">
                  {['Customer information is confidential.','I shall not sell, transfer, share, or misuse customer or distributor data.','I shall comply with company privacy policies and applicable data protection laws.','Any confidential company information shall remain protected even after termination of my distributorship.'].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-black shrink-0">✓</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>

              {/* 6. Refund */}
              <div className="space-y-2">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">6. Refund &amp; Cancellation Policy Acknowledgement</h4>
                <p>I acknowledge that:</p>
                <ul className="space-y-1 list-none pl-0">
                  {['I have read and understood the company\'s Refund & Cancellation Policy.','I shall accurately communicate refund eligibility and conditions to customers.','I shall not make promises beyond the official policy.','Any refund request shall be processed according to company procedures.'].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-black shrink-0">✓</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>

              {/* 7. Non-Disparagement */}
              <div className="space-y-2">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">7. Non-Disparagement Declaration</h4>
                <p>I agree that:</p>
                <ul className="space-y-1 list-none pl-0">
                  {['I shall not publish false, defamatory, or misleading information about T2UPGRADE Pvt. Ltd., its management, employees, distributors, products, or services.','Any concerns or disputes shall first be addressed through the company grievance process.'].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-black shrink-0">✓</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>

              {/* 8. KYC */}
              <div className="space-y-2">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">8. KYC &amp; Document Authenticity Declaration</h4>
                <p>I hereby declare that:</p>
                <ul className="space-y-1 list-none pl-0">
                  {['All documents submitted by me are genuine and valid.','The information provided in my KYC form is true and correct.','Any false information may result in suspension or termination of my distributorship.'].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-black shrink-0">✓</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>

              {/* 9. Grievance */}
              <div className="space-y-2">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide border-b border-border/40 pb-1">9. Grievance Redressal Acknowledgement</h4>
                <p>I understand that:</p>
                <ul className="space-y-1 list-none pl-0">
                  {['T2UPGRADE Pvt. Ltd. has established a grievance redressal mechanism.','Any complaints shall be submitted through official company channels.','I shall cooperate fully in any investigation or dispute resolution process.'].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-black shrink-0">✓</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>

              {/* 10. Final Consent */}
              <div className="space-y-2 p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                <h4 className="font-black text-foreground text-[11.5px] uppercase tracking-wide">10. Final Consent</h4>
                <p>I confirm that:</p>
                <ul className="space-y-1 list-none pl-0">
                  {['I have carefully read and understood all company policies.','I voluntarily agree to abide by all company rules and applicable laws.','I understand that violation of these policies may result in disciplinary action, suspension, withholding of benefits where legally permissible, or termination of my distributorship.'].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-black shrink-0">✓</span><span>{item}</span></li>
                  ))}
                </ul>
                <p className="font-bold text-foreground pt-1">I hereby accept all terms and conditions of T2UPGRADE Pvt. Ltd.</p>
              </div>

            </div>

            {/* Footer: checkbox + buttons */}
            <div className="border-t border-border/60 px-6 py-4 space-y-3 shrink-0 bg-card">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="accept-terms-checkbox"
                  checked={checkedTerms}
                  onChange={(e) => setCheckedTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-border text-primary accent-primary shrink-0 cursor-pointer"
                />
                <label
                  htmlFor="accept-terms-checkbox"
                  className="text-[11px] text-muted-foreground leading-normal cursor-pointer select-none font-sans"
                >
                  I have carefully read, understood, and voluntarily accept both documents above — the Disclaimer &amp; Declaration and the Compliance &amp; Policy Acknowledgement — and agree to abide by all policies, procedures, and applicable laws of T2UPGRADE Pvt. Ltd.
                </label>
              </div>
              {termsError && (
                <p className="text-[11px] text-destructive font-medium">{termsError}</p>
              )}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={logout}
                  className="text-xs font-bold px-5 py-2 h-9 text-muted-foreground hover:text-destructive hover:border-destructive/50"
                >
                  Disagree &amp; Exit
                </Button>
                <Button
                  disabled={!checkedTerms || termsSubmitting}
                  onClick={async () => {
                    setTermsSubmitting(true);
                    setTermsError(null);
                    try {
                      await acceptTerms();
                    } catch {
                      setTermsError('Could not save your agreement. Please check your connection and try again.');
                    } finally {
                      setTermsSubmitting(false);
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-6 py-2 h-9"
                >
                  {termsSubmitting ? 'Saving…' : 'Agree & Enter Site'}
                </Button>
              </div>
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
