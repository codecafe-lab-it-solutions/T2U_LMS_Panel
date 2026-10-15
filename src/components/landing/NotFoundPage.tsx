import React, { useState } from 'react';
import { Home, Search, BookOpen, Layers, Info, LogIn, ArrowRight, Compass } from 'lucide-react';
import { navigatePublic } from '../../lib/publicRoutes';
import { useSEO } from '../../hooks/useSEO';

interface NotFoundPageProps {
  onBackToHome: () => void;
  onNavigateToContent?: (page: string) => void;
}

export default function NotFoundPage({ onBackToHome, onNavigateToContent }: NotFoundPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  useSEO({
    title: '404 - Page Not Found',
    description: 'The requested page could not be found. Explore top courses, career tracks, and learning resources at T2U — Time to Upgrade.',
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigatePublic(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigatePublic('/courses');
    }
  };

  const sitemapItems = [
    {
      title: 'Explore All Courses',
      description: 'Browse practical skill programs in Tech, AI, English, and Marketing.',
      icon: BookOpen,
      action: () => navigatePublic('/courses'),
      tag: 'Programs',
    },
    {
      title: 'Course Bundles',
      description: 'Comprehensive multi-course career tracks and learning packages.',
      icon: Layers,
      action: () => navigatePublic('/course-bundles'),
      tag: 'Career Tracks',
    },
    {
      title: 'About T2U',
      description: 'Our vision, mission, and direct learning ecosystem.',
      icon: Info,
      action: () => onNavigateToContent ? onNavigateToContent('about') : navigatePublic('/'),
      tag: 'Company',
    },
    {
      title: 'Learner & Partner Login',
      description: 'Access your student dashboard, live classes, and referral wallet.',
      icon: LogIn,
      action: () => navigatePublic('/login'),
      tag: 'Portal',
    },
  ];

  return (
    <section className="min-h-[80vh] bg-[#0c0214] text-white flex flex-col justify-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-coral/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full relative z-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-coral/15 border border-brand-coral/30 px-3.5 py-1.5 rounded-full text-brand-coral text-xs font-mono font-bold uppercase tracking-wider mb-6">
          <Compass className="w-3.5 h-3.5" />
          <span>404 Error • Page Not Found</span>
        </div>

        {/* Big 404 Headline */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black font-sans tracking-tight text-white leading-none">
          Lost in Space?
        </h1>

        <p className="mt-4 text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
          The page you requested might have been removed, renamed, or temporarily unavailable. Let's get you back on track.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="mt-8 max-w-lg mx-auto">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-white/40 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, skills, or tracks..."
              className="w-full bg-[#1b092b] border border-white/20 focus:border-brand-coral rounded-full py-3.5 pl-12 pr-28 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-1.5 bg-brand-coral hover:bg-brand-coral/90 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-transform active:scale-95 cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {/* Primary Home Action */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-coral to-[#ea580c] hover:from-brand-coral/90 hover:to-[#ea580c]/90 text-white font-bold px-8 py-3.5 rounded-full text-sm uppercase tracking-wider shadow-xl shadow-brand-coral/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </button>
        </div>

        {/* Quick Sitemap Links */}
        <div className="mt-16 text-left border-t border-white/10 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-mono font-bold text-brand-mustard uppercase tracking-widest">
              Quick Directory &amp; Popular Destinations
            </h2>
            <span className="text-[11px] text-white/40 hidden sm:inline">Select any link below</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sitemapItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={item.action}
                  className="group bg-[#150524] hover:bg-[#1f0a35] border border-white/10 hover:border-brand-coral/40 rounded-2xl p-4 transition-all cursor-pointer flex items-start gap-3.5 shadow-md"
                >
                  <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-brand-coral/20 text-brand-coral transition-colors shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white group-hover:text-brand-coral transition-colors">
                        {item.title}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-brand-coral group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
