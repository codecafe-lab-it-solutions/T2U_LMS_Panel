import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, BookOpen, GraduationCap, Briefcase, Globe, Code, Cpu, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMediaUrl } from '../../services/api';
import { InstructorDisplay } from '../common/InstructorDisplay';

const ICONS = [GraduationCap, Briefcase, Globe, Code, Cpu, BarChart2, BookOpen];
const ACCENT_GRADIENTS = [
  'from-[#3f1f70] via-[#6f2dd0] to-[#f59e0b]',
  'from-[#1f3f86] via-[#3b82f6] to-[#fb923c]',
  'from-[#581c87] via-[#a855f7] to-[#fb7185]',
  'from-[#9333ea] via-[#d946ef] to-[#fbbf24]',
  'from-[#0f766e] via-[#14b8a6] to-[#f97316]',
];

function formatDuration(hrs: number | null | undefined): string {
  if (!hrs) return 'Self-paced';
  if (hrs >= 40) return `${Math.round(hrs / 8)} days`;
  if (hrs >= 10) return `${Math.round(hrs / 8)} weeks`;
  return `${hrs} hrs`;
}

interface CourseCarouselProps {
  courses: any[];
  setActiveCourse: (course: any) => void;
}

export default function CourseCarousel({ courses, setActiveCourse }: CourseCarouselProps) {
  if (!courses || courses.length === 0) return null;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, courses.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = 344;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto py-6 group">
      {/* Floating Left Arrow Button */}
      <button
        type="button"
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
        className={`absolute -left-2 sm:-left-5 top-[45%] -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center bg-[#1e0d2f]/95 hover:bg-[#f97316] text-white border-2 border-white/20 hover:border-orange-400 shadow-2xl shadow-black/90 backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-0 disabled:pointer-events-none`}
      >
        <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Floating Right Arrow Button */}
      <button
        type="button"
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        aria-label="Scroll right"
        className={`absolute -right-2 sm:-right-5 top-[45%] -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center bg-[#1e0d2f]/95 hover:bg-[#f97316] text-white border-2 border-white/20 hover:border-orange-400 shadow-2xl shadow-black/90 backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-0 disabled:pointer-events-none`}
      >
        <ChevronRight className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Edge gradient fades for clean overflow aesthetics */}
      <div className="absolute left-0 top-0 bottom-16 w-8 sm:w-12 bg-gradient-to-r from-[#12031e] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-16 w-8 sm:w-12 bg-gradient-to-l from-[#12031e] to-transparent z-10 pointer-events-none" />

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scroll-smooth hide-scrollbar px-2 sm:px-4"
      >
        <div className="flex gap-6 min-w-max">
          {courses.map((course, index) => {
            const Icon = ICONS[index % ICONS.length];
            const accentBg = ACCENT_GRADIENTS[index % ACCENT_GRADIENTS.length];
            const enrollments = course._count?.enrollments ?? 0;
            const duration = formatDuration(course.duration_hrs);

            return (
              <motion.div
                key={course.id}
                whileHover={{ y: -4 }}
                className="flex-shrink-0 w-[280px] sm:w-[320px] snap-center cursor-pointer"
                onClick={() => setActiveCourse(course)}
              >
                <div className="w-full overflow-hidden rounded-[20px] border border-white/10 bg-[#1e0d2f] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 hover:border-white/40 hover:shadow-orange-500/20">
                  {/* Card header */}
                  <div className={`relative overflow-hidden bg-gradient-to-br ${accentBg} px-4 py-4 h-[160px] sm:h-[180px] flex flex-col shrink-0 group`}>
                    {course.thumbnail_url && (
                      <>
                        <img
                          src={getMediaUrl(course.thumbnail_url)}
                          alt={course.title}
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          className="absolute inset-0 w-full h-full object-cover z-0 opacity-70 transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 z-10" />
                      </>
                    )}
                    <div className="relative z-20 flex flex-col h-full justify-between flex-1">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="rounded-lg bg-white/10 p-2 text-white shadow-lg shadow-black/20">
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-[#12031e]">
                          <Calendar className="w-3.5 h-3.5 text-[#f97316]" />
                          {duration}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className={`text-base sm:text-lg font-black text-white leading-tight${course.thumbnail_url ? ' [text-shadow:0_2px_8px_rgba(0,0,0,0.95)]' : ''}`}>
                          {course.title}
                        </h3>
                        {course.instructor ? (
                          <div className="mt-1.5">
                            <InstructorDisplay instructor={course.instructor} variant="card" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex flex-col gap-3 flex-1 bg-[#1e0d2f]">
                    {/* Tags */}
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {[course.category, ...(course.tags as string[])].filter(Boolean).slice(0, 2).map((tag: string) => (
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
                        <span className="text-[11px] sm:text-xs font-black text-white">{course.modules?.length ?? 0}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-white/50">Modules</span>
                      </div>
                    </div>

                    {/* Single action */}
                    <div className="mt-auto pt-4">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveCourse(course); }}
                        className="w-full rounded-full bg-[#f97316] px-2 py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:bg-[#ea580c] cursor-pointer"
                      >
                        View Program
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#3e185c] text-center text-[8px] uppercase tracking-[0.2em] font-bold text-[#f8f0ff] py-2.5 shrink-0">
                    {course.is_featured ? 'Featured Course' : 'Scholarship Available'}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls Bar below carousel */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <button
          type="button"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          aria-label="Previous courses"
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-[#f97316] disabled:opacity-30 disabled:hover:bg-white/10 text-white border border-white/15 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed active:scale-95 flex items-center gap-2 text-xs font-bold shadow-md"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          aria-label="Next courses"
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-[#f97316] disabled:opacity-30 disabled:hover:bg-white/10 text-white border border-white/15 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed active:scale-95 flex items-center gap-2 text-xs font-bold shadow-md"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
