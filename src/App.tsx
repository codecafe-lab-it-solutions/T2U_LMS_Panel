import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeDashboard from './components/HomeDashboard';
import LearningSection from './components/LearningSection';
import PublicSite from './components/PublicSite';
import KYCVerification from './components/KYCVerification';
import GenealogyTree from './components/GenealogyTree';
import IncomeDashboard from './components/IncomeDashboard';
import LiveClassManagement from './components/LiveClassManagement';
import StudentModules from './components/StudentModules';
import InstructorModules from './components/InstructorModules';
import { FileText, ShieldCheck, AlertCircle } from 'lucide-react';
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
  const { activeTab, setDarkMode, darkMode, isAuthenticated, userProfile, acceptTerms } = useAppStore();
  const [checkedTerms, setCheckedTerms] = useState(false);

  // Apply the stored theme preference to the DOM on mount
  useEffect(() => {
    setDarkMode(darkMode);
  }, []);

  // Detailed tab-based routing for Student and Instructor modules
  const renderTabContent = () => {
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
      
      // Student sub-modules
      case 'assignments':
      case 'certificates':
      case 'rewards':
      case 'referral-dashboard':
      case 'my-team':
      case 'notifications':
      case 'settings':
        return <StudentModules />;
      
      // Instructor-specific management sub-modules
      case 'course-management':
      case 'quiz-management':
      case 'assignment-management':
      case 'student-analytics':
        return <InstructorModules />;
      
      default:
        return <HomeDashboard />;
    }
  };

  // If the user is not authenticated, show the Public Landing Site
  if (!isAuthenticated) {
    return <PublicSite />;
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
            {renderTabContent()}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>

      {/* Terms & Conditions Acceptance Modal Overlay */}
      {needsTermsAcceptance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-primary to-orange-500" />
            
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="p-2 bg-violet-500/10 text-violet-500 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black text-foreground uppercase tracking-wide">
                  Compliance and Direct Selling Verification
                </h2>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  T2Upgrade Pvt. Ltd. Regulatory Mandates
                </p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-4 max-h-[300px] overflow-y-auto pr-2 font-sans leading-relaxed">
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 text-amber-500 rounded-xl flex gap-2 text-[11px]">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong>Mandatory Acknowledgment:</strong> Under the Indian Consumer Protection (Direct Selling) Rules, 2021, all independent representatives and learners must review and accept the official compliance policies below to unlock dashboard payouts.
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-foreground text-[11.5px] uppercase">1. Direct Selling Compliance Principles</h3>
                <p>
                  T2Upgrade operates strictly under the Consumer Protection (Direct Selling) Rules. We declare that no sign-up fee, registration investment, or recruitment-only commission blocks exist. All downline commissions are calculated solely from genuine academic subscriptions, course credentials, or certified micro-task completions.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-foreground text-[11.5px] uppercase">2. 12% Binary Matching Commissions</h3>
                <p>
                  Commissions are computed using our binary downline hierarchy (Left Team/Ram and Right Team/Shyam). Matching volume generates payouts at a 12% ratio (₹120 matching credit per 1000 matched Business Volume). Excess business volume rolls over dynamically to the next calculation cycles.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-foreground text-[11.5px] uppercase">3. Verification & Compliance Controls</h3>
                <p>
                  To secure compliance with anti-money laundering (AML) and banking guidelines, withdrawal requests are restricted until your KYC validation records are verified. Users must not engage in misrepresentation of potential earnings, inventory loading, or multi-account fraud.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-foreground text-[11.5px] uppercase">4. Skill Campaign Accountability</h3>
                <p>
                  Learner rewards are directly linked to micro-task accuracy and training validation milestones. Bounties, quiz rewards, and assignment certifications represent direct outputs of verified vocational accuracy.
                </p>
              </div>
            </div>

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
                I hereby declare that I have read, understood, and accept all the terms, compliance guidelines, and Direct Selling Rules of T2Upgrade.
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
    <QueryClientProvider client={queryClient}>
      <MainLayoutContent />
    </QueryClientProvider>
  );
}
