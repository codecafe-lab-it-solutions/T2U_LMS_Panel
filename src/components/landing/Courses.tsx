import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { api, getMediaUrl } from '../../services/api';
import { navigatePublic, coursePath } from '../../lib/publicRoutes';
import {
  BookOpen, Calendar, Milestone, ArrowRight, CheckCircle2, X,
  Users, Loader2, GraduationCap, Briefcase, Globe, Code, Cpu, BarChart2,
} from 'lucide-react';

// Pick a consistent icon by category or index
const ICONS = [GraduationCap, Briefcase, Globe, Code, Cpu, BarChart2, BookOpen];
function pickIcon(index: number) { return ICONS[index % ICONS.length]; }

const ACCENT_GRADIENTS = [
  'from-[#3f1f70] via-[#6f2dd0] to-[#f59e0b]',
  'from-[#1f3f86] via-[#3b82f6] to-[#fb923c]',
  'from-[#581c87] via-[#a855f7] to-[#fb7185]',
  'from-[#9333ea] via-[#d946ef] to-[#fbbf24]',
  'from-[#0f766e] via-[#14b8a6] to-[#f97316]',
];

interface CoursesProps {
  onOpenEnrollModal: (courseId: string) => void;
  onExploreCourses?: () => void;
  // Kept for parent compat but unused (brochure removed)
  onOpenBrochure?: (courseId: string) => void;
}

export default function Courses({ onOpenEnrollModal, onExploreCourses }: CoursesProps) {
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  // Fetch published courses from real backend
  const { data: courses = [], isLoading } = useQuery<any[]>({
    queryKey: ['public-courses'],
    queryFn: () => api.courses.list(),
    staleTime: 5 * 60_000,
  });

  const handleScroll = () => {
    if (!scrollContainerRef.current || courses.length === 0) return;
    const container = scrollContainerRef.current;
    const scrollWidth = container.scrollWidth - container.clientWidth;
    if (scrollWidth <= 0) return;
    const index = Math.round((container.scrollLeft / scrollWidth) * (courses.length - 1));
    setActiveIndex(index);
  };

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) container.addEventListener('scroll', handleScroll, { passive: true });
    return () => { if (container) container.removeEventListener('scroll', handleScroll); };
  }, [courses.length]);

  const scrollTo = (idx: number) => {
    if (!scrollContainerRef.current || courses.length === 0) return;
    const container = scrollContainerRef.current;
    const scrollWidth = container.scrollWidth - container.clientWidth;
    container.scrollTo({ left: (idx / Math.max(courses.length - 1, 1)) * scrollWidth, behavior: 'smooth' });
  };

  const formatDuration = (hrs: number | null | undefined) => {
    if (!hrs) return 'Self-paced';
    if (hrs < 5) return `${hrs} hrs`;
    if (hrs < 80) return `${Math.round(hrs / 3)} weeks`;
    return `${Math.round(hrs / 20)} months`;
  };

  return (
    <section id="courses" className="pt-24 pb-12 bg-[#12031e] text-white scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-sm uppercase font-extrabold tracking-widest text-[#fbbf24] bg-[#3b0f4f]/50 px-3 py-1.5 rounded-full">
            Flagship Curriculum
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight mt-4 text-white">
            Unlock Careers Through In-Demand Skills
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/70 mt-4 leading-relaxed">
            Practical learning paths made for students, working professionals, and future network leaders.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 gap-3 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Loading courses…</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && courses.length === 0 && (
          <div className="text-center py-20 text-white/40">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">No courses published yet. Check back soon!</p>
          </div>
        )}

        {/* Carousel */}
        {!isLoading && courses.length > 0 && (
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#12031e] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#12031e] to-transparent z-10 pointer-events-none" />

            <div ref={scrollContainerRef} className="overflow-x-auto scroll-smooth pb-4 px-4 hide-scrollbar">
              <div className="flex gap-6 min-w-max">
                {courses.map((course, index) => {
                  const IconComponent = pickIcon(index);
                  const accentBg = ACCENT_GRADIENTS[index % ACCENT_GRADIENTS.length];
                  const enrollments = course._count?.enrollments ?? 0;
                  const duration = formatDuration(course.duration_hrs);

                  return (
                    <motion.div
                      key={course.id}
                      whileHover={{ y: -4 }}
                      viewport={{ once: true }}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.07 }}
                      className="flex-shrink-0 w-[280px] sm:w-[300px] overflow-hidden rounded-[20px] border border-white/10 bg-[#1e0d2f] shadow-lg shadow-black/30 flex flex-col"
                    >
                      {/* Card image/gradient header */}
                      <div className={`relative overflow-hidden bg-gradient-to-br ${accentBg} px-4 py-4 h-[160px] sm:h-[180px] flex flex-col`}>
                        {course.thumbnail_url && (
                          <>
                            <img src={getMediaUrl(course.thumbnail_url)} alt={course.title}
                              className="absolute inset-0 w-full h-full object-cover z-0 opacity-70" />
                            <div className="absolute inset-0 bg-black/30 z-10" />
                          </>
                        )}
                        <div className="relative z-20 flex flex-col h-full justify-between flex-1">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="rounded-lg bg-white/10 p-2 text-white shadow-lg">
                              <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] sm:text-[11px] font-bold text-[#12031e]">
                              <Calendar className="w-3.5 h-3.5 text-[#f97316]" />
                              {duration}
                            </span>
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <h3
                              className={`text-base sm:text-lg font-black text-white leading-tight${course.thumbnail_url ? ' [text-shadow:0_2px_8px_rgba(0,0,0,0.95)]' : ''}`}
                            >
                              {course.title}
                            </h3>
                            {course.instructor?.full_name && (
                              <p className={`text-[10px] text-white/70 mt-1 font-semibold${course.thumbnail_url ? ' [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]' : ''}`}>
                                {course.instructor.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col gap-3 flex-1">
                        {/* Tags */}
                        {course.tags && course.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {course.tags.slice(0, 2).map((tag: string) => (
                              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold text-white/80">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-2">
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-[#f97316] shrink-0" />
                            <span className="text-[11px] sm:text-xs font-black text-white">{enrollments}</span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-white/50">Enrolled</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5 text-[#f97316] shrink-0" />
                            <span className="text-[11px] sm:text-xs font-black text-white">{course._count?.modules ?? 0}</span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-white/50">Modules</span>
                          </div>
                        </div>

                        {/* Single action button */}
                        <div className="mt-auto">
                          <button
                            type="button"
                            onClick={() => (course.slug ? navigatePublic(coursePath(course.slug)) : setSelectedCourse(course))}
                            className="w-full rounded-full bg-[#f97316] px-2 py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:bg-[#ea580c] cursor-pointer"
                          >
                            View Program
                          </button>
                        </div>
                      </div>

                      {/* Ribbon */}
                      <div className="bg-[#3e185c] text-center text-[8px] uppercase tracking-[0.2em] font-bold text-[#f8f0ff] py-2.5">
                        {course.is_featured ? 'Featured Course' : 'Scholarship Available'}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {courses.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollTo(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeIndex === idx ? 'w-6 bg-[#ff7a00] shadow-md shadow-orange-500/50' : 'w-2.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Explore All button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center mt-12"
        >
          <button
            type="button"
            onClick={onExploreCourses}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-10 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/40 flex items-center gap-2"
          >
            <span>Explore All Courses</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* View Program Modal */}
        <AnimatePresence>
          {selectedCourse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
              onClick={() => setSelectedCourse(null)}
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
                    {selectedCourse.category && (
                      <span className="text-[11px] font-sans font-extrabold tracking-widest text-brand-coral uppercase px-2.5 py-1 bg-brand-coral/5 rounded-full">
                        {selectedCourse.category}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    title="Close"
                    onClick={() => setSelectedCourse(null)}
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
                          {selectedCourse.title}
                        </h3>
                        {selectedCourse.instructor?.full_name && (
                          <p className="text-xs text-white/50 mt-1 font-semibold">
                            by {selectedCourse.instructor.full_name}
                          </p>
                        )}
                        {selectedCourse.description ? (
                          <div
                            className="text-sm text-muted-tan mt-2 leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-1.5 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-white [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1.5 [&_p]:mb-2 [&_strong]:font-bold [&_strong]:text-white [&_li]:mb-0.5"
                            dangerouslySetInnerHTML={{ __html: selectedCourse.description }}
                          />
                        ) : (
                          <p className="text-sm text-muted-tan mt-2 leading-relaxed">
                            {selectedCourse.short_desc || 'No description available.'}
                          </p>
                        )}
                      </div>
                      {selectedCourse.tags && selectedCourse.tags.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border-tan/50">
                          <h4 className="text-xs uppercase font-extrabold text-white tracking-widest">Topics Covered</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCourse.tags.map((tag: string) => (
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
                              {formatDuration(selectedCourse.duration_hrs)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">LEVEL</span>
                            <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                              <Milestone className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                              {selectedCourse.category || 'All Levels'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">ENROLLED</span>
                            <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                              <Users className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                              {selectedCourse._count?.enrollments ?? 0} students
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">MODULES</span>
                            <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                              <BookOpen className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                              {selectedCourse._count?.modules ?? 0} chapters
                            </span>
                          </div>
                        </div>

                        {/* Perks from tags */}
                        {selectedCourse.tags && selectedCourse.tags.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-extrabold text-muted-tan tracking-wider block">What You'll Learn:</span>
                            <ul className="space-y-1.5">
                              {selectedCourse.tags.slice(0, 5).map((tag: string) => (
                                <li key={tag} className="flex items-center space-x-2 text-xs text-white font-medium">
                                  <CheckCircle2 className="w-3 h-3 text-live-green shrink-0 animate-pulse" />
                                  <span>{tag}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-4 border-t border-border-tan bg-transparent space-y-2.5 mt-auto">
                        <button
                          type="button"
                          onClick={() => { setSelectedCourse(null); onOpenEnrollModal(selectedCourse.id); }}
                          className="w-full bg-brand-coral hover:bg-brand-coral/95 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-brand-coral/15 cursor-pointer"
                        >
                          <span>Apply for Enrollment</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        {selectedCourse.slug && (
                          <button
                            type="button"
                            onClick={() => { const slug = selectedCourse.slug; setSelectedCourse(null); navigatePublic(coursePath(slug)); }}
                            className="w-full py-3 px-6 border border-brand-coral/60 hover:bg-brand-coral/10 rounded-xl text-xs font-semibold text-white tracking-wide transition-colors cursor-pointer text-center"
                          >
                            View Course Page
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedCourse(null)}
                          className="w-full py-3 px-6 border border-border-tan hover:bg-near-black rounded-xl text-xs font-semibold text-white tracking-wide transition-colors cursor-pointer text-center"
                        >
                          Back to Tracks
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
