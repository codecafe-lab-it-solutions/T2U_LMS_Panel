import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ArrowRight, TrendingUp, X, Calendar, BookOpen, CheckCircle2, Users, Loader2, GraduationCap } from 'lucide-react';
import CourseCarousel from './CourseCarousel';
import { api } from '../../services/api';

function formatDuration(hrs: number | null | undefined): string {
  if (!hrs) return 'Self-paced';
  if (hrs >= 40) return `${Math.round(hrs / 8)} days`;
  if (hrs >= 10) return `${Math.round(hrs / 8)} weeks`;
  return `${hrs} hrs`;
}

interface ExploreAllCoursesProps {
  onOpenEnrollModal?: (courseId: string) => void;
  onBackToHome?: () => void;
  // Kept for parent compat but unused (brochure removed)
  onOpenBrochure?: (courseId: string) => void;
}

export default function ExploreAllCourses({ onOpenEnrollModal, onBackToHome }: ExploreAllCoursesProps) {
  const [selectedCategory, setSelectedCategory] = useState('All Courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCourse, setActiveCourse] = useState<any | null>(null);

  const { data: allCourses = [], isLoading } = useQuery<any[]>({
    queryKey: ['public-courses'],
    queryFn: () => api.courses.list(),
    staleTime: 5 * 60_000,
  });

  // Derive category list from real courses
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allCourses.forEach(c => { if (c.category) cats.add(c.category); });
    return ['All Courses', ...Array.from(cats)];
  }, [allCourses]);

  const filteredCourses = useMemo(() => {
    return allCourses.filter(course => {
      const categoryMatch = selectedCategory === 'All Courses' || course.category === selectedCategory;
      const term = searchTerm.toLowerCase();
      const searchMatch = !term ||
        course.title?.toLowerCase().includes(term) ||
        course.description?.toLowerCase().includes(term) ||
        course.short_desc?.toLowerCase().includes(term) ||
        course.category?.toLowerCase().includes(term);
      return categoryMatch && searchMatch;
    });
  }, [allCourses, selectedCategory, searchTerm]);

  return (
    <section className="pt-10 pb-20 bg-[#12031e] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link */}
        {onBackToHome && (
          <div className="mb-4 -mt-2 flex justify-start border-b border-white/5 pb-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center gap-2 text-xs text-white/55 hover:text-orange-400 font-semibold transition-colors duration-300 group cursor-pointer"
            >
              <span className="text-sm group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Back to Home Page</span>
            </button>
          </div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            Explore All Courses
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Discover courses across multiple categories and skill levels. Find your perfect learning path today.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Search courses by name, topic, or category…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-full pl-12 pr-6 py-4 text-white placeholder-white/50 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </motion.div>

        {/* Category filters — built from real data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 flex items-center gap-3 flex-wrap justify-center"
        >
          <Filter className="w-5 h-5 text-orange-400" />
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/40'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 gap-3 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Loading courses…</span>
          </div>
        )}

        {/* Carousel */}
        {!isLoading && filteredCourses.length > 0 && (
          <CourseCarousel courses={filteredCourses} setActiveCourse={setActiveCourse} />
        )}

        {/* Empty */}
        {!isLoading && filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p className="text-white/50 text-lg mb-4">No courses found matching your criteria.</p>
            {(searchTerm || selectedCategory !== 'All Courses') && (
              <button
                type="button"
                onClick={() => { setSelectedCategory('All Courses'); setSearchTerm(''); }}
                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Count */}
        {!isLoading && filteredCourses.length > 0 && (
          <div className="text-center">
            <p className="text-white/70">
              Showing <span className="font-bold text-orange-400">{filteredCourses.length}</span> course{filteredCourses.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {activeCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
            onClick={() => setActiveCourse(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-[#171421] border border-border-tan rounded-3xl shadow-2xl text-white flex flex-col"
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-border-tan pb-4 mb-0 px-5 pt-5 sm:px-7 sm:pt-7 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-brand-coral/10 text-brand-coral rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {activeCourse.category && (
                    <span className="text-[11px] font-sans font-extrabold tracking-widest text-brand-coral uppercase px-2.5 py-1 bg-brand-coral/5 rounded-full">
                      {activeCourse.category}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  title="Close"
                  onClick={() => setActiveCourse(null)}
                  className="p-1.5 hover:bg-border-tan/40 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-5 py-5 sm:px-7">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                  {/* Left — title, description, modules */}
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <h3 className="text-xl sm:text-3xl font-sans font-black text-white leading-tight">
                        {activeCourse.title}
                      </h3>
                      {activeCourse.instructor?.full_name && (
                        <p className="text-xs text-white/50 mt-1 font-semibold">by {activeCourse.instructor.full_name}</p>
                      )}
                      {activeCourse.description ? (
                        <div className="text-sm text-muted-tan mt-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: activeCourse.description }} />
                      ) : (
                        <p className="text-sm text-muted-tan mt-2 leading-relaxed">
                          {activeCourse.short_desc || 'No description available.'}
                        </p>
                      )}
                    </div>

                    {/* Modules */}
                    {activeCourse.modules && activeCourse.modules.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-border-tan/50">
                        <h4 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center">
                          <BookOpen className="w-4 h-4 mr-1.5 text-brand-coral" />
                          Course Modules ({activeCourse.modules.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activeCourse.modules.map((mod: any, i: number) => (
                            <div key={mod.id}
                              className="p-3 bg-[#1f1b2e] border border-border-tan rounded-xl hover:border-brand-coral/20 transition-all duration-200">
                              <p className="text-xs font-bold text-white">
                                <span className="text-brand-coral font-mono mr-2">M{i + 1}.</span>
                                {mod.title}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {activeCourse.tags && activeCourse.tags.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border-tan/50">
                        <h4 className="text-xs uppercase font-extrabold text-white tracking-widest">Topics Covered</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {activeCourse.tags.map((tag: string) => (
                            <span key={tag} className="px-2.5 py-1 rounded-full bg-brand-coral/10 text-brand-coral text-[10px] font-bold border border-brand-coral/20">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right — meta + actions */}
                  <div className="lg:col-span-5 flex flex-col justify-between self-stretch space-y-6">
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3 p-3 bg-border-tan/20 rounded-2xl border border-border-tan/55">
                        <div>
                          <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">DURATION</span>
                          <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                            {formatDuration(activeCourse.duration_hrs)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">CATEGORY</span>
                          <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                            <TrendingUp className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                            {activeCourse.category || 'General'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">ENROLLED</span>
                          <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                            <Users className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                            {activeCourse._count?.enrollments ?? 0} students
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">MODULES</span>
                          <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                            <BookOpen className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                            {activeCourse.modules?.length ?? 0} chapters
                          </span>
                        </div>
                      </div>

                      {activeCourse.tags && activeCourse.tags.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-extrabold text-muted-tan tracking-wider block">What You'll Learn:</span>
                          <ul className="space-y-1.5">
                            {activeCourse.tags.slice(0, 5).map((tag: string) => (
                              <li key={tag} className="flex items-center space-x-2 text-xs text-white font-medium">
                                <CheckCircle2 className="w-3 h-3 text-live-green shrink-0 animate-pulse" />
                                <span>{tag}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border-tan bg-transparent space-y-2.5 mt-auto">
                      <button
                        type="button"
                        onClick={() => { setActiveCourse(null); if (onOpenEnrollModal) onOpenEnrollModal(activeCourse.id); }}
                        className="w-full bg-brand-coral hover:bg-brand-coral/95 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-brand-coral/15 cursor-pointer"
                      >
                        <span>Apply for Enrollment</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCourse(null)}
                        className="w-full py-3 px-6 border border-border-tan hover:bg-near-black rounded-xl text-xs font-semibold text-white tracking-wide transition-colors cursor-pointer text-center"
                      >
                        Back to Courses
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
