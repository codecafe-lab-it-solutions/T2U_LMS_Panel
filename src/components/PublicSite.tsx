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
import { BundlesPage, BundlePage } from './landing/BundlePages';
import { parsePublicPath, NAVIGATE_EVENT, PENDING_BUNDLE_KEY, type PublicRoute } from '../lib/publicRoutes';

// 'login' is the dedicated full-screen auth page
type LandingPage = 'home' | 'explore' | 'products' | 'login' | 'about' | 'course' | 'bundles' | 'bundle' | ContentPageType;

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

// Clean URLs for shareable pages: /courses, /courses/:slug, /course-bundles, /course-bundles/:slug.
// Everything else stays state-driven exactly as before.
const initialRoute: PublicRoute | null = (resetTokenFromUrl || portalFromUrl) ? null : parsePublicPath(window.location.pathname);

export default function PublicSite() {
  const [currentPage, setCurrentPage] = useState<LandingPage>(
    (resetTokenFromUrl || portalFromUrl) ? 'login' : initialRoute?.page ?? 'home',
  );
  const [routeSlug, setRouteSlug] = useState<string | undefined>(initialRoute && 'slug' in initialRoute ? initialRoute.slug : undefined);

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
    // Pages with their own URL keep it in the address bar; every other page resets to '/'.
    const path = page === 'explore' ? '/courses' : page === 'bundles' ? '/course-bundles' : '/';
    if (page !== 'course' && page !== 'bundle' && page !== 'login' && window.location.pathname !== path) {
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
          <ProductsPage
            onBackToHome={() => navigate('home')}
            onOpenOrderModal={handleOpenProductModal}
          />
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

        {!['home', 'explore', 'products', 'course', 'bundles', 'bundle'].includes(currentPage) && (
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
