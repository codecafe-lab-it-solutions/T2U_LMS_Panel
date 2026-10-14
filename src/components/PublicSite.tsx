import { useState, useEffect } from 'react';

// Landing page section components
import Navigation from './landing/Navigation';
import Hero from './landing/Hero';
import Courses from './landing/Courses';
import CardsStack from './landing/CardsStack';
import JoinAsInstructor from './landing/JoinAsInstructor';
import IncomeSection from './landing/IncomeSection';
import AppShowcase from './landing/AppShowcase';
import FrappeAdmin from './landing/FrappeAdmin';
import InstructorsMarquee from './landing/InstructorsMarquee';
import Testimonials from './landing/Testimonials';
import FaqAccordion from './landing/FaqAccordion';
import Footer from './landing/Footer';
import Modals from './landing/Modals';
import LeadFormModal from './landing/LeadFormModal';
import ExploreAllCourses from './landing/ExploreAllCourses';
import ProductsPage from './landing/ProductsPage';
import ContentPage, { ContentPageType } from './landing/ContentPage';
import AboutPage from './landing/AboutPage';
import LoginPage from './LoginPage';
import CoursePage from './landing/CoursePage';
import NotFoundPage from './landing/NotFoundPage';
import { BundlesPage, BundlePage } from './landing/BundlePages';
import { parsePublicPath, NAVIGATE_EVENT, PENDING_BUNDLE_KEY, type PublicRoute } from '../lib/publicRoutes';
import { SHOW_PRODUCTS } from '../constants/featureFlags';
import { useSEO } from '../hooks/useSEO';

// 'login' is the dedicated full-screen auth page
type LandingPage = 'home' | 'explore' | 'products' | 'login' | 'about' | 'course' | 'bundles' | 'bundle' | '404' | ContentPageType;

// Read once at module load — an emailed password-reset link lands here as ?reset_token=...
const resetTokenFromUrl = new URLSearchParams(window.location.search).get('reset_token') || undefined;

// Dedicated login URLs: /admin-login, /instructor-login, and /employee-login skip the
// marketing site and land straight on a portal-specific sign-in screen.
const portalFromUrl: 'admin' | 'instructor' | 'employee' | undefined = (() => {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/admin-login') return 'admin';
  if (path === '/instructor-login') return 'instructor';
  if (path === '/employee-login') return 'employee';
  return undefined;
})();

// Clean URLs for shareable pages: /courses, /courses/:slug, /course-bundles, /course-bundles/:slug, /about, /terms, etc.
const initialRoute: PublicRoute | null = (resetTokenFromUrl || portalFromUrl) ? null : parsePublicPath(window.location.pathname);

export default function PublicSite() {
  const [currentPage, setCurrentPage] = useState<LandingPage>(
    (resetTokenFromUrl || portalFromUrl) ? 'login' : initialRoute?.page ?? 'home',
  );
  const [routeSlug, setRouteSlug] = useState<string | undefined>(initialRoute && 'slug' in initialRoute ? initialRoute.slug : undefined);

  // Dynamic SEO metadata per route
  const seoConfig = (() => {
    switch (currentPage) {
      case 'home':
        return {
          title: 'Time to Upgrade | India\'s Learn-Upgrade-Earn Platform',
          description: 'Upgrade your career with India\'s all-in-one learn, upgrade, and earn platform. Live interactive cohorts, industry certificates, and automated referral rewards.'
        };
      case 'explore':
        return {
          title: 'Explore All Courses | T2U — Time to Upgrade',
          description: 'Browse practical curriculum and cohort courses in Computer Skills, AI, Digital Marketing, English, and Leadership.'
        };
      case 'bundles':
        return {
          title: 'Course Bundles & Career Tracks | T2U',
          description: 'Comprehensive multi-course learning packages designed for career transformation and industry certification.'
        };
      case 'about':
        return {
          title: 'About Us | T2U — Time to Upgrade',
          description: 'Learn about T2U\'s mission to democratize hands-on practical education and direct selling entrepreneurial growth in India.'
        };
      case 'products':
        return {
          title: 'Product Store | T2U — Time to Upgrade',
          description: 'Purchase verified educational resources, study kits, and official curriculum materials from T2U.'
        };
      case 'terms':
        return {
          title: 'Terms & Conditions | T2U — Time to Upgrade',
          description: 'Review the official terms, rules, and conditions for utilizing T2U educational services and platform features.'
        };
      case 'privacy':
        return {
          title: 'Privacy Policy | T2U — Time to Upgrade',
          description: 'Learn how T2Upgrade Pvt. Ltd. collects, safeguards, and respects your personal data and account privacy.'
        };
      case 'refund':
        return {
          title: 'Refund & Cancellation Policy | T2U',
          description: 'Our transparent 30-day cooling-off period and full statutory refund procedures under consumer protection guidelines.'
        };
      case 'partner':
        return {
          title: 'Become a Partner | T2U Enterprise Node',
          description: 'Collaborate with T2U for corporate training, pre-vetted talent hiring pools, and regional master affiliate partnerships.'
        };
      case 'instructors-hub':
        return {
          title: 'Instructors Hub | Teach on T2U',
          description: 'Join over 50+ industry practitioners. Teach interactive cohorts, launch modules, and earn generous royalties.'
        };
      case 'success-stories':
        return {
          title: 'Success Stories & Placements | T2U',
          description: 'Read verified alumni transformations, placement records, and career growth case studies from T2U cohorts.'
        };
      case '404':
        return {
          title: '404 Page Not Found | T2U — Time to Upgrade',
          description: 'The requested page could not be found. Explore top courses and learning tracks at T2U.'
        };
      default:
        return {
          title: 'T2U — Time to Upgrade',
          description: 'India\'s premier learn-upgrade-earn platform.'
        };
    }
  })();

  useSEO(seoConfig);

  // Keep state in sync with the URL for back/forward and for links fired via navigatePublic().
  useEffect(() => {
    const sync = () => {
      const r = parsePublicPath(window.location.pathname);
      setRouteSlug(r && 'slug' in r ? r.slug : undefined);
      setCurrentPage(r ? r.page : 'home');
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', sync);
    window.addEventListener(NAVIGATE_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(NAVIGATE_EVENT, sync);
    };
  }, []);

  // Enroll / partner modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'enroll' | 'instructor' | 'business' | 'product'>('enroll');
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined);
  const [selectedProductTitle, setSelectedProductTitle] = useState<string | undefined>(undefined);

  // Lead form
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  // Navigation helpers
  const navigate = (page: LandingPage) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let path = '/';
    if (page === 'explore') path = '/courses';
    else if (page === 'bundles') path = '/course-bundles';
    else if (page === 'about') path = '/about';
    else if (page === 'products') path = '/products';
    else if (['terms', 'privacy', 'refund', 'partner', 'instructors-hub', 'success-stories'].includes(page)) {
      path = `/${page}`;
    }
    if (page !== 'course' && page !== 'bundle' && page !== 'login' && page !== '404' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRouteSlug(undefined);
    setCurrentPage(page);
  };

  // "Enroll Now" on a course/bundle page: enrollment needs an account, so send the visitor to
  // sign-in. For a bundle we remember which one and land them on the bundles tab afterwards.
  const handleEnrollFromPage = (bundleSlug?: string) => {
    if (bundleSlug) {
      try { sessionStorage.setItem(PENDING_BUNDLE_KEY, bundleSlug); } catch { /* ignore */ }
      window.location.hash = '#/course-bundles';
    }
    navigate('login');
  };

  const handleOpenEnrollModal = (_courseId?: string) => {
    setIsLeadModalOpen(true);
  };

  const handleOpenInstructorModal = () => {
    setModalType('instructor');
    setSelectedCourseId(undefined);
    setSelectedProductTitle(undefined);
    setIsModalOpen(true);
  };

  const handleOpenBusinessModal = () => {
    setModalType('business');
    setSelectedCourseId(undefined);
    setSelectedProductTitle(undefined);
    setIsModalOpen(true);
  };

  const handleOpenProductModal = (productTitle: string) => {
    setModalType('product');
    setSelectedProductTitle(productTitle);
    setIsModalOpen(true);
  };

  // ── Full-screen Login page ─────────────────────────────────────────────────
  // When the user clicks Login in the nav, we swap the entire view to LoginPage.
  // LoginPage calls the store's login() directly; on success the store sets
  // isAuthenticated = true and App.tsx renders the portal instead.
  if (currentPage === 'login') {
    return <LoginPage onBack={() => navigate('home')} resetToken={resetTokenFromUrl} portal={portalFromUrl} />;
  }

  if (currentPage === 'about') {
    return (
      <>
        <Navigation
          onOpenEnrollModal={handleOpenEnrollModal}
          onOpenPartnerModal={handleOpenBusinessModal}
          onNavigateToHome={() => navigate('home')}
          onNavigateToAbout={() => navigate('about')}
          onNavigateToExplore={() => navigate('explore')}
          onNavigateToProducts={() => navigate('products')}
          onLoginClick={() => navigate('login')}
          currentPage={currentPage}
        />
        <AboutPage onBack={() => navigate('home')} onNavigateToLogin={() => navigate('login')} />
        <Footer
          onOpenEnrollModal={handleOpenEnrollModal}
          onOpenInstructorModal={handleOpenInstructorModal}
          onOpenBusinessModal={handleOpenBusinessModal}
          onNavigateToContent={(page) => navigate(page)}
          showCTAs={false}
        />
      </>
    );
  }

  // ── Main landing site ──────────────────────────────────────────────────────
  return (
    <div
      className="landing-page min-h-screen font-sans overflow-x-clip"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
    >
      {/* Sticky navigation */}
      <Navigation
        onOpenEnrollModal={handleOpenEnrollModal}
        onOpenPartnerModal={handleOpenBusinessModal}
        onNavigateToHome={() => navigate('home')}
        onNavigateToAbout={() => navigate('about')}
        onNavigateToExplore={() => navigate('explore')}
        onNavigateToProducts={() => navigate('products')}
        onLoginClick={() => navigate('login')}
        currentPage={currentPage}
      />

      <main>
        {currentPage === 'home' && (
          <>
            <Hero onOpenEnrollModal={handleOpenEnrollModal} />
            <Courses
              onOpenEnrollModal={handleOpenEnrollModal}
              onExploreCourses={() => navigate('explore')}
            />
            <CardsStack />
            <IncomeSection />
            <AppShowcase />
            <FrappeAdmin />
            <InstructorsMarquee />
            <Testimonials />
            <FaqAccordion />
            <JoinAsInstructor />
          </>
        )}

        {currentPage === 'explore' && (
          <ExploreAllCourses
            onOpenEnrollModal={handleOpenEnrollModal}
            onBackToHome={() => navigate('home')}
          />
        )}

        {currentPage === 'products' && (
          SHOW_PRODUCTS ? (
            <ProductsPage
              onBackToHome={() => navigate('home')}
              onOpenOrderModal={handleOpenProductModal}
            />
          ) : (
            <ExploreAllCourses
              onOpenEnrollModal={handleOpenEnrollModal}
              onBackToHome={() => navigate('home')}
            />
          )
        )}

        {currentPage === 'course' && routeSlug && (
          <CoursePage
            slug={routeSlug}
            onBack={() => navigate('explore')}
            onEnroll={() => handleEnrollFromPage()}
            onEnquire={() => setIsLeadModalOpen(true)}
          />
        )}

        {currentPage === 'bundles' && <BundlesPage onBackToHome={() => navigate('home')} />}

        {currentPage === 'bundle' && routeSlug && (
          <BundlePage
            slug={routeSlug}
            onBack={() => navigate('bundles')}
            onEnroll={() => handleEnrollFromPage(routeSlug)}
            onEnquire={() => setIsLeadModalOpen(true)}
          />
        )}

        {currentPage === '404' && (
          <NotFoundPage
            onBackToHome={() => navigate('home')}
            onNavigateToContent={(page) => navigate(page as any)}
          />
        )}

        {!['home', 'explore', 'products', 'course', 'bundles', 'bundle', '404'].includes(currentPage) && (
          <ContentPage type={currentPage as ContentPageType} onBack={() => navigate('home')} />
        )}
      </main>

      <Footer
        onOpenEnrollModal={handleOpenEnrollModal}
        onOpenInstructorModal={handleOpenInstructorModal}
        onOpenBusinessModal={handleOpenBusinessModal}
        onNavigateToContent={(page) => navigate(page)}
        showCTAs={currentPage === 'home' || currentPage === 'explore' || currentPage === 'bundles'}
      />

      {/* Modals */}
      <LeadFormModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      <Modals
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        initialCourseId={selectedCourseId}
        productTitle={selectedProductTitle}
      />
    </div>
  );
}
