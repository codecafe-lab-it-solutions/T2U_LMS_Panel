import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users } from 'lucide-react';

interface CourseCarouselProps {
  courses: any[];
  setActiveCourse: (course: any) => void;
  onOpenBrochure: (courseId: any) => void;
}

export default function CourseCarousel({ courses, setActiveCourse, onOpenBrochure }: CourseCarouselProps) {
  if (!courses || courses.length === 0) return null;

  return (
    <div className="relative w-full max-w-7xl mx-auto py-12 overflow-x-auto pb-8 snap-x snap-mandatory scroll-smooth hide-scrollbar">
      <div className="flex gap-6 min-w-max px-4">
        {courses.map((course, index) => {
          const Icon = course.icon;
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
              className="flex-shrink-0 w-[280px] sm:w-[320px] h-[450px] snap-center cursor-pointer"
              onClick={() => setActiveCourse(course)}
            >
              <CourseCard course={course} Icon={Icon} accentBg={accentBg} setActiveCourse={setActiveCourse} isInteractive={true} onOpenBrochure={onOpenBrochure} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Subcomponent for the card to keep the map clean
function CourseCard({ course, Icon, accentBg, setActiveCourse, isInteractive, onOpenBrochure }: any) {
  return (
    <div className={`w-full h-full overflow-hidden rounded-[20px] border border-white/10 bg-[#1e0d2f] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 ${isInteractive ? 'hover:border-white/40 hover:shadow-orange-500/20' : ''}`}>
      <div className={`relative overflow-hidden bg-gradient-to-br ${accentBg} px-4 py-4 h-[160px] sm:h-[180px] flex flex-col shrink-0 group`}>
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
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
      <div className="p-4 flex flex-col gap-3 flex-1 pointer-events-none bg-[#1e0d2f]">
        <div className="flex flex-wrap gap-1.5">
          {[course.category, course.level].map((tag: string) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold text-white/80">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-2">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-[#f97316] shrink-0" />
            <div className="flex items-baseline gap-0.5">
              <span className="text-[11px] sm:text-xs font-black text-white">{course.students}</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/50">Enrolled</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-white/50">⭐ Rating:</span>
            <span className="text-[11px] sm:text-xs font-black text-white whitespace-nowrap">{course.rating} / 5</span>
          </div>
        </div>
        <div className="grid gap-2.5 grid-cols-2 mt-auto pt-4 pointer-events-auto">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenBrochure(course.id);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-2 py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:border-[#f97316] hover:text-[#f97316] cursor-pointer text-center"
          >
            Brochure
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (isInteractive) setActiveCourse(course);
            }}
            className="rounded-full bg-[#f97316] px-2 py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:bg-[#ea580c] cursor-pointer text-center"
          >
            View Program
          </button>
        </div>
      </div>
      <div className="bg-[#3e185c] text-center text-[8px] uppercase tracking-[0.2em] font-bold text-[#f8f0ff] py-2.5 shrink-0">
        Scholarship Available
      </div>
    </div>
  );
}
