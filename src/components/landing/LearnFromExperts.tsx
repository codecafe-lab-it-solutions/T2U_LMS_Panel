import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Linkedin,
  ArrowRight,
  X,
  Users,
  Award,
  Briefcase,
  Layers,
} from 'lucide-react';
import { api, getMediaUrl } from '../../services/api';

export interface IndustryExpert {
  id: string;
  name: string;
  role: string;
  company: string;
  photo_url: string;
  headline?: string;
  bio: string;
  expertise_tags: string[];
  category?: string;
  rating?: number;
  students_count?: number;
  linkedin_url?: string;
  order_index?: number;
  is_active?: boolean;
}

const CATEGORIES = [
  'All Mentors',
  'AI & Automation',
  'Performance Marketing',
  'Tech & Dev',
  'Design & Media',
  'Business & Sales',
];

interface LearnFromExpertsProps {
  onOpenEnrollModal?: () => void;
}

export default function LearnFromExperts({ onOpenEnrollModal }: LearnFromExpertsProps) {
  const [selectedCategory, setSelectedCategory] = useState('All Mentors');
  const [activeModalExpert, setActiveModalExpert] = useState<IndustryExpert | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Fetch dynamic experts from CMS
  const { data: serverExperts = [] } = useQuery<IndustryExpert[]>({
    queryKey: ['cms-industry-experts'],
    queryFn: api.cms.experts.list,
    staleTime: 60_000,
  });

  const experts: IndustryExpert[] = serverExperts || [];

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  const filteredExperts = experts.filter((expert) => {
    if (selectedCategory === 'All Mentors') return true;
    return expert.category === selectedCategory;
  });

  useEffect(() => {
    if (experts.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, filteredExperts.length, experts.length]);

  // Do not render section until admin configures mentors
  if (experts.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -380 : 380;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section id="experts" className="py-24 bg-[#0e0716] text-white relative overflow-hidden scroll-mt-12">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-coral/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 pb-6 border-b border-white/10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-widest text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/25 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
              Industry Practitioner Faculty
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-black tracking-tight mt-4">
              <span className="text-white">Learn from </span>
              <span className="text-brand-mustard">Industry</span>{' '}
              <span className="text-brand-coral">Experts</span>
              <span className="text-white">.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/70 mt-4 leading-relaxed max-w-2xl">
              Skip textbook theory. Master real-world digital execution directly from senior practitioners, leaders, and growth directors who build and scale these tools daily.
            </p>
          </div>

          {/* Controls: Nav buttons */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous experts"
              className="w-12 h-12 rounded-full border border-white/20 hover:border-brand-coral bg-white/5 hover:bg-brand-coral/20 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Next experts"
              className="w-12 h-12 rounded-full border border-white/20 hover:border-brand-coral bg-white/5 hover:bg-brand-coral/20 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Horizontal Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-6 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {filteredExperts.map((expert, idx) => {
            const hasImgError = imageErrors[expert.id];
            const initials = expert.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2);

            return (
              <motion.div
                key={expert.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="w-[300px] sm:w-[350px] shrink-0 snap-start bg-[#160d24] border border-white/10 hover:border-brand-coral/50 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-purple-950/60 group relative"
              >
                <div>
                  {/* Top: Avatar/Photo & Company Pill */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-white/20 group-hover:border-brand-coral/80 transition-colors shadow-lg bg-gradient-to-tr from-purple-900 to-indigo-900">
                        {expert.photo_url && !hasImgError ? (
                          <img
                            src={getMediaUrl(expert.photo_url)}
                            alt={expert.name}
                            onError={() => handleImageError(expert.id)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold font-mono text-xl text-white bg-gradient-to-tr from-orange-500 to-brand-coral">
                            {initials}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#160d24] flex items-center justify-center text-white" title="Verified Industry Mentor">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] uppercase font-black tracking-wider text-brand-mustard bg-brand-mustard/10 border border-brand-mustard/30 px-2.5 py-1 rounded-md mb-2 inline-block shadow-sm">
                        {expert.company}
                      </span>
                      {expert.rating && (
                        <div className="flex items-center gap-1 text-xs text-white/90 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{expert.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-brand-coral transition-colors flex items-center gap-1.5">
                      {expert.name}
                    </h3>
                    <p className="text-xs text-brand-coral/90 font-semibold mt-0.5">
                      {expert.role}
                    </p>
                    {expert.headline && (
                      <p className="text-[11px] text-white/50 italic mt-1 line-clamp-1">
                        {expert.headline}
                      </p>
                    )}
                  </div>

                  {/* About narrative */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 mb-4">
                    <p className="text-xs text-white/80 leading-relaxed line-clamp-3">
                      "{expert.bio}"
                    </p>
                  </div>

                  {/* Expertise Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {expert.expertise_tags.slice(0, 3).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-medium text-white/70 bg-white/5 px-2 py-0.5 rounded-md border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                    {expert.expertise_tags.length > 3 && (
                      <span className="text-[10px] font-medium text-brand-coral bg-brand-coral/10 px-1.5 py-0.5 rounded-md">
                        +{expert.expertise_tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  {expert.students_count ? (
                    <span className="text-[11px] text-white/50 flex items-center gap-1">
                      <Users className="w-3 h-3 text-white/40" />
                      {expert.students_count.toLocaleString()}+ Mentored
                    </span>
                  ) : (
                    <span className="text-[11px] text-white/50 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-white/40" />
                      Live Practitioner
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveModalExpert(expert)}
                    className="text-xs font-bold text-brand-coral hover:text-white flex items-center gap-1 transition-colors cursor-pointer group/btn"
                  >
                    <span>About them</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Banner / Invitation */}
        <div className="mt-12 bg-gradient-to-r from-brand-coral/15 via-purple-900/20 to-brand-mustard/15 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-coral/20 border border-brand-coral/30 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-brand-coral" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                Learn 1-on-1 from real practitioners
              </h4>
              <p className="text-xs sm:text-sm text-white/70">
                All course tracks include live interactive labs, code reviews, and project evaluations by verified industry experts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            {onOpenEnrollModal && (
              <button
                type="button"
                onClick={onOpenEnrollModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-coral hover:bg-brand-coral/90 text-white font-bold text-sm shadow-lg shadow-brand-coral/25 transition-all hover:scale-102 cursor-pointer text-center"
              >
                Enroll With Mentorship
              </button>
            )}
            <a
              href="#apply-instructor"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/15 font-semibold text-sm transition-colors text-center"
            >
              Join As Mentor
            </a>
          </div>
        </div>
      </div>

      {/* ── Detail Modal: "About Them" ── */}
      <AnimatePresence>
        {activeModalExpert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#160d24] border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-white max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="relative p-6 sm:p-8 border-b border-white/10 bg-gradient-to-br from-purple-950/60 to-transparent">
                <button
                  type="button"
                  onClick={() => setActiveModalExpert(null)}
                  className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-brand-coral shadow-xl shrink-0 bg-near-black">
                    {activeModalExpert.photo_url && !imageErrors[activeModalExpert.id] ? (
                      <img
                        src={getMediaUrl(activeModalExpert.photo_url)}
                        alt={activeModalExpert.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-mono font-bold text-2xl text-white bg-gradient-to-tr from-brand-coral to-amber-500">
                        {activeModalExpert.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-bold text-white">
                        {activeModalExpert.name}
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-mustard bg-brand-mustard/15 border border-brand-mustard/30 px-2 py-0.5 rounded">
                        {activeModalExpert.company}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-brand-coral">
                      {activeModalExpert.role}
                    </p>

                    {activeModalExpert.headline && (
                      <p className="text-xs text-white/60">
                        {activeModalExpert.headline}
                      </p>
                    )}

                    {activeModalExpert.rating && (
                      <div className="flex items-center gap-3 pt-1 text-xs text-white/70">
                        <span className="flex items-center gap-1 font-bold text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {activeModalExpert.rating.toFixed(1)} Instructor Rating
                        </span>
                        {activeModalExpert.students_count && (
                          <span>• {activeModalExpert.students_count.toLocaleString()}+ students trained</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-brand-coral" />
                    About This Mentor
                  </h4>
                  <p className="text-sm text-white/85 leading-relaxed bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                    {activeModalExpert.bio}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-mustard" />
                    Specialized Competencies & Tools
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeModalExpert.expertise_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/90"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {activeModalExpert.linkedin_url && (
                  <div className="pt-2">
                    <a
                      href={activeModalExpert.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5 fill-current" />
                      Verified Industry Profile
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setActiveModalExpert(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold text-white/80 hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
                {onOpenEnrollModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalExpert(null);
                      onOpenEnrollModal();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-brand-coral hover:bg-brand-coral/90 text-white text-xs font-bold shadow-lg shadow-brand-coral/25 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Enroll in Mentored Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
