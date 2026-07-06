import { useState } from 'react';

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

// 'login' is the dedicated full-screen auth page
type LandingPage = 'home' | 'explore' | 'products' | 'login' | 'about' | ContentPageType;

export default function PublicSite() {
  const [currentPage, setCurrentPage] = useState<LandingPage>('home');

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
    setCurrentPage(page);
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
    return <LoginPage onBack={() => navigate('home')} />;
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
      className="landing-page min-h-screen font-sans overflow-x-hidden"
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

        {currentPage !== 'home' && currentPage !== 'explore' && currentPage !== 'products' && (
          <ContentPage type={currentPage as ContentPageType} onBack={() => navigate('home')} />
        )}
      </main>

      <Footer
        onOpenEnrollModal={handleOpenEnrollModal}
        onOpenInstructorModal={handleOpenInstructorModal}
        onOpenBusinessModal={handleOpenBusinessModal}
        onNavigateToContent={(page) => navigate(page)}
        showCTAs={currentPage === 'home' || currentPage === 'explore'}
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
