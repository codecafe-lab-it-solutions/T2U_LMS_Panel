import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown, ArrowRight, LogIn } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Layers } from 'lucide-react';
import { api } from '../../services/api';
import Logo from './Logo';
import { navigatePublic } from '../../lib/publicRoutes';

interface NavigationProps {
  onOpenEnrollModal: (courseId?: string) => void;
  onOpenPartnerModal: () => void;
  onNavigateToHome: () => void;
  onNavigateToAbout: () => void;
  onNavigateToExplore: () => void;
  onNavigateToProducts: () => void;
  onLoginClick: () => void;
  currentPage: string;
}

export default function Navigation({
  onOpenEnrollModal,
  onOpenPartnerModal,
  onNavigateToHome,
  onNavigateToAbout,
  onNavigateToExplore,
  onNavigateToProducts,
  onLoginClick,
  currentPage,
}: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobile = () => setIsMobileMenuOpen(false);

  // Categories come from the real published courses (same query as the Explore page, so it's cached).
  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['public-courses'],
    queryFn: () => api.courses.list(),
    staleTime: 5 * 60_000,
  });
  const categories = Array.from(new Set(courses.map(c => c.category).filter(Boolean))) as string[];
  const countIn = (cat: string) => courses.filter(c => c.category === cat).length;
  const openCategory = (cat: string) => navigatePublic(`/courses?category=${encodeURIComponent(cat)}`);

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-md py-2.5 border-b-2 border-[#8b5cf6] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Logo → Home */}
            <div
              className="flex items-center cursor-pointer"
              onClick={() => { onNavigateToHome(); }}
            >
              <Logo size="md" />
            </div>

            {/* Desktop Nav — 4 links: Home · Courses (dropdown) · About · Products */}
            <nav className="hidden lg:flex items-center space-x-8">

              {/* Home */}
              <button
                onClick={onNavigateToHome}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'home' ? 'text-brand-coral' : 'text-white/90 hover:text-brand-coral'
                }`}
              >
                Home
              </button>

              {/* About */}
              <button
                onClick={onNavigateToAbout}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'about' ? 'text-brand-coral' : 'text-white/90 hover:text-brand-coral'
                }`}
              >
                About
              </button>

              {/* Courses — dropdown listing career tracks */}
              <div
                className="relative"
                onMouseEnter={() => setIsCoursesOpen(true)}
                onMouseLeave={() => setIsCoursesOpen(false)}
              >
                <button
                  onClick={onNavigateToExplore}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors py-2 ${
                    (currentPage === 'explore' || currentPage === 'course') ? 'text-brand-coral' : 'text-white/90 hover:text-brand-coral'
                  }`}
                >
                  <span>Courses</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCoursesOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isCoursesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 w-80 bg-warm-cream border border-border-tan rounded-2xl shadow-xl p-4 mt-1 z-50 grid gap-2"
                    >
                      <div className="text-[11px] font-sans font-bold text-muted-tan tracking-wider uppercase px-2 mb-1">
                        COURSE CATEGORIES
                      </div>
                      {categories.map((cat) => (
                        <div
                          key={cat}
                          onClick={() => { setIsCoursesOpen(false); openCategory(cat); }}
                          className="flex items-start space-x-3 p-2 rounded-xl hover:bg-border-tan/30 cursor-pointer transition-colors"
                        >
                          <div className="p-2 bg-brand-coral/10 rounded-lg text-brand-coral mt-0.5 shrink-0">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{cat}</h4>
                            <p className="text-[11px] text-muted-tan line-clamp-1">{countIn(cat)} {countIn(cat) === 1 ? 'course' : 'courses'}</p>
                          </div>
                        </div>
                      ))}
                      {categories.length === 0 && <div className="text-[11px] text-muted-tan px-2 pb-1">Loading categories…</div>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Course Bundles */}
              <button
                onClick={() => navigatePublic('/course-bundles')}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'bundles' || currentPage === 'bundle' ? 'text-brand-coral' : 'text-white/90 hover:text-brand-coral'
                }`}
              >
                Bundles
              </button>

              {/* Products */}
              <button
                onClick={onNavigateToProducts}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'products' ? 'text-brand-coral' : 'text-white/90 hover:text-brand-coral'
                }`}
              >
                Products
              </button>
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <button
                onClick={onLoginClick}
                className="flex items-center space-x-1.5 text-xs font-semibold text-white/80 hover:text-white px-4 py-2.5 rounded-full border border-white/15 hover:border-white/30 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
              <button
                onClick={() => onOpenEnrollModal()}
                className="bg-brand-coral text-white text-xs font-semibold px-6 py-3 rounded-full hover:bg-brand-coral/90 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center space-x-1.5 shadow-md shadow-brand-coral/20"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-full bg-[#0b0118] z-50 shadow-2xl p-6 flex flex-col justify-between border-l border-violet-900/40"
            >
              <div>
                {/* Drawer header */}
                <div className="flex items-center justify-between mb-8 border-b border-violet-900/30 pb-4">
                  <div className="cursor-pointer" onClick={() => { closeMobile(); onNavigateToHome(); }}>
                    <Logo size="sm" />
                  </div>
                  <button type="button" aria-label="Close menu" onClick={closeMobile} className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile nav links */}
                <nav className="flex flex-col space-y-1">
                  {/* Home */}
                  <button
                    onClick={() => { closeMobile(); onNavigateToHome(); }}
                    className={`text-left w-full font-semibold py-3 px-3 rounded-xl transition-colors text-sm ${
                      currentPage === 'home' ? 'text-brand-coral bg-white/5' : 'text-white/90 hover:text-brand-coral hover:bg-white/5'
                    }`}
                  >
                    Home
                  </button>

                  {/* About */}
                  <button
                    onClick={() => { closeMobile(); onNavigateToAbout(); }}
                    className={`text-left w-full font-semibold py-3 px-3 rounded-xl transition-colors text-sm ${
                      currentPage === 'about' ? 'text-brand-coral bg-white/5' : 'text-white/90 hover:text-brand-coral hover:bg-white/5'
                    }`}
                  >
                    About
                  </button>

                  {/* Courses (expandable) */}
                  <div className="space-y-1">
                    <button
                      onClick={() => { closeMobile(); onNavigateToExplore(); }}
                      className={`text-left w-full font-semibold py-3 px-3 rounded-xl transition-colors text-sm ${
                        currentPage === 'explore' ? 'text-brand-coral bg-white/5' : 'text-white/90 hover:text-brand-coral hover:bg-white/5'
                      }`}
                    >
                      Courses
                    </button>
                    <div className="pl-4 border-l-2 border-violet-800/40 ml-3 space-y-2 pb-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => { closeMobile(); openCategory(cat); }}
                          className="block text-[11px] text-white/60 hover:text-brand-coral font-medium py-1 text-left"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Course Bundles */}
                  <button
                    onClick={() => { closeMobile(); navigatePublic('/course-bundles'); }}
                    className={`text-left w-full font-semibold py-3 px-3 rounded-xl transition-colors text-sm ${
                      currentPage === 'bundles' || currentPage === 'bundle' ? 'text-brand-coral bg-white/5' : 'text-white/90 hover:text-brand-coral hover:bg-white/5'
                    }`}
                  >
                    Bundles
                  </button>

                  {/* Products */}
                  <button
                    onClick={() => { closeMobile(); onNavigateToProducts(); }}
                    className={`text-left w-full font-semibold py-3 px-3 rounded-xl transition-colors text-sm ${
                      currentPage === 'products' ? 'text-brand-coral bg-white/5' : 'text-white/90 hover:text-brand-coral hover:bg-white/5'
                    }`}
                  >
                    Products
                  </button>
                </nav>
              </div>

              {/* Bottom actions */}
              <div className="space-y-3 pt-6 border-t border-violet-900/30 mt-auto">
                <button
                  onClick={() => { closeMobile(); onLoginClick(); }}
                  className="w-full border border-white/20 text-white/80 py-3 rounded-full text-sm font-semibold text-center hover:border-white/40 hover:text-white transition-colors flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login to Portal</span>
                </button>
                <button
                  onClick={() => { closeMobile(); onOpenEnrollModal(); }}
                  className="w-full bg-brand-coral text-white py-3 rounded-full text-sm font-bold text-center hover:bg-brand-coral/95 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-brand-coral/15"
                >
                  <span>Start Learning</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
