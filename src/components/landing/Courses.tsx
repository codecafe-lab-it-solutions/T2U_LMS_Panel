import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COURSE_CATEGORIES, Course } from '../../landing-data';
import { BookOpen, Calendar, Milestone, ArrowRight, CheckCircle2, X, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface CoursesProps {
  onOpenEnrollModal: (courseId: string) => void;
  onExploreCourses?: () => void;
  onOpenBrochure: (courseId: string) => void;
}

export default function Courses({ onOpenEnrollModal, onExploreCourses, onOpenBrochure }: CoursesProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth - container.clientWidth;
      if (scrollWidth <= 0) return;
      const percent = scrollLeft / scrollWidth;
      const index = Math.round(percent * (COURSE_CATEGORIES.length - 1));
      setActiveIndex(index);
    }
  };

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      if (direction === 'left') {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
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

        <div className="relative">
          {/* Fade gradient overlay - left */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#12031e] to-transparent z-10 pointer-events-none" />
          {/* Fade gradient overlay - right */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#12031e] to-transparent z-10 pointer-events-none" />

          {/* Horizontal scroll container with scrollbar hidden */}
          <div ref={scrollContainerRef} className="overflow-x-auto scroll-smooth pb-4 px-4 hide-scrollbar">
            <div className="flex gap-6 min-w-max">
            {COURSE_CATEGORIES.map((course, index) => {
              const IconComponent = course.icon;
              const accentBg = [
                'from-[#3f1f70] via-[#6f2dd0] to-[#f59e0b]',
                'from-[#1f3f86] via-[#3b82f6] to-[#fb923c]',
                'from-[#581c87] via-[#a855f7] to-[#fb7185]',
                'from-[#9333ea] via-[#d946ef] to-[#fbbf24]',
                'from-[#0f766e] via-[#14b8a6] to-[#f97316]'
              ][index % 5];

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
                  <div className={`relative overflow-hidden bg-gradient-to-br ${accentBg} px-4 py-4 h-[160px] sm:h-[180px] flex flex-col`}>
                    {course.image && (
                      <>
                        <img 
                          src={course.image} 
                          alt={course.title} 
                          className="absolute inset-0 w-full h-full object-cover z-0 opacity-70 transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/30 z-10" />
                      </>
                    )}

                    <div className="relative z-20 flex flex-col h-full justify-between flex-1">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="rounded-lg bg-white/10 p-2 text-white shadow-lg shadow-black/20">
                          <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-[#12031e]">
                          <Calendar className="w-3.5 h-3.5 text-[#f97316]" />
                          {course.duration}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
                        <h3 
                          className="text-base sm:text-lg font-black text-white leading-tight"
                          style={course.image ? { textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.95)' } : undefined}
                        >
                          {course.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      {course.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold text-white/80">
                          {tag}
                        </span>
                      ))}
                    </div>

                     {/* Stats row â€” Clean inline list without background boxes */}
                     <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-2">
                       {/* Enrolled */}
                       <div className="flex items-center gap-1">
                         <Users className="h-3.5 w-3.5 text-[#f97316] shrink-0" />
                         <div className="flex items-baseline gap-0.5">
                           <span className="text-[11px] sm:text-xs font-black text-white">{course.students}</span>
                           <span className="text-[9px] sm:text-[10px] font-bold text-white/50">Enrolled</span>
                         </div>
                       </div>
                       {/* Next Batch */}
                       <div className="flex items-center gap-1">
                         <Calendar className="h-3.5 w-3.5 text-[#f97316] shrink-0" />
                         <div className="flex items-baseline gap-0.5">
                           <span className="text-[9px] sm:text-[10px] font-bold text-white/50">Batch:</span>
                           <span className="text-[11px] sm:text-xs font-black text-white whitespace-nowrap">{course.nextBatch}</span>
                         </div>
                       </div>
                     </div>

                    <div className="grid gap-2.5 grid-cols-2 mt-auto">
                      <button 
                        onClick={() => onOpenBrochure(course.id)}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:border-[#f97316] hover:text-[#f97316] cursor-pointer"
                      >
                        Brochure
                      </button>
                      <button 
                        onClick={() => setSelectedCourse(course)}
                        className="rounded-full bg-[#f97316] px-2 py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:bg-[#ea580c] cursor-pointer"
                      >
                        View Program
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#3e185c] text-center text-[8px] uppercase tracking-[0.2em] font-bold text-[#f8f0ff] py-2.5">
                    {course.ribbon || 'Scholarship Available'}
                  </div>
                </motion.div>
              );
            })}
            </div>
          </div>

          {/* Pagination dots (glowing active index indicators) */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {COURSE_CATEGORIES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const scrollWidth = container.scrollWidth - container.clientWidth;
                    const targetScroll = (idx / (COURSE_CATEGORIES.length - 1)) * scrollWidth;
                    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
                  }
                }}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeIndex === idx 
                    ? 'w-6 bg-[#ff7a00] shadow-md shadow-orange-500/50' 
                    : 'w-2.5 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>

        {/* Browse More Courses Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center mt-12"
        >
          <button
            onClick={onExploreCourses}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-10 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/40 flex items-center gap-2"
          >
            <span>Explore All Courses</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Dynamic sliding course curriculum details overlay drawer */}
        <AnimatePresence>
          {selectedCourse && (
            <>
              {/* Centered Modal Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
              >
                <div className="flex items-center justify-center w-full">
                {/* Modal panel container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-4xl bg-[#171421] border border-border-tan rounded-3xl shadow-2xl text-white flex flex-col"
                  style={{ maxHeight: 'calc(100vh - 2rem)' }}
                >
                  {/* Top bar - sticky */}
                  <div className="flex items-center justify-between border-b border-border-tan pb-4 mb-0 px-5 pt-5 sm:px-7 sm:pt-7 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-brand-coral/10 text-brand-coral rounded-xl">
                        {React.createElement(selectedCourse.icon, { className: 'w-5 h-5' })}
                      </div>
                      <span className="text-[11px] font-sans font-extrabold tracking-widest text-brand-coral uppercase px-2.5 py-1 bg-brand-coral/5 rounded-full">
                        Interactive Track
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="p-1.5 hover:bg-border-tan/40 rounded-full text-white transition-colors focus:ring-1 focus:ring-brand-coral cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable content area */}
                  <div className="overflow-y-auto flex-1 px-5 py-5 sm:px-7">
                  {/* Two-Column Course Detail Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* Left Column - Details & Syllabus */}
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <h3 className="text-xl sm:text-3xl font-sans font-black text-white leading-tight">
                          {selectedCourse.title}
                        </h3>
                        <p className="text-sm text-muted-tan mt-1.5 leading-relaxed">
                          {selectedCourse.description}
                        </p>
                      </div>

                      {/* Course visual banner image if exists */}
                      {selectedCourse.image && (
                        <div className="w-full h-32 rounded-2xl overflow-hidden border border-border-tan">
                          <img 
                            src={selectedCourse.image} 
                            alt={selectedCourse.title} 
                            className="w-full h-full object-cover brightness-95"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Modules Syllabus Syllabus lists */}
                      <div className="space-y-3 pt-3 border-t border-border-tan/50">
                        <h4 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center">
                          <BookOpen className="w-4 h-4 mr-1.5 text-brand-coral" />
                          Course Syllabus (Weekly Modules)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {selectedCourse.syllabus.map((m, mIndex) => (
                            <div
                              key={mIndex}
                              className="p-3 bg-[#1f1b2e] border border-border-tan rounded-xl hover:border-brand-coral/20 transition-all duration-200"
                            >
                              <p className="text-xs font-bold text-white select-none">
                                {m}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Stats & Registration */}
                    <div className="lg:col-span-5 flex flex-col justify-between self-stretch space-y-6">
                      <div className="space-y-5">
                        {/* Horizontal Meta Badges */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-border-tan/20 rounded-2xl border border-border-tan/55">
                          <div>
                            <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">
                              DURATION
                            </span>
                            <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                              <Calendar className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                              {selectedCourse.duration}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">
                              LEVEL
                            </span>
                            <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                              <Milestone className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                              {selectedCourse.difficulty}
                            </span>
                          </div>
                        </div>

                        {/* Live Cohort Unique Features */}
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-extrabold text-muted-tan tracking-wider block">
                            Guaranteed Perks Included:
                          </span>
                          <ul className="space-y-1.5">
                            {selectedCourse.features.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-center space-x-2 text-xs text-white font-medium">
                                <CheckCircle2 className="w-3 h-3 text-live-green shrink-0 animate-pulse" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-4 border-t border-border-tan bg-transparent space-y-2.5 mt-auto">
                        <button
                          onClick={() => {
                            setSelectedCourse(null);
                            onOpenEnrollModal(selectedCourse.id);
                          }}
                          className="w-full bg-brand-coral hover:bg-brand-coral/95 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-brand-coral/15 cursor-pointer"
                        >
                          <span>Apply for Enrollment</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        
                        <button
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
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}

