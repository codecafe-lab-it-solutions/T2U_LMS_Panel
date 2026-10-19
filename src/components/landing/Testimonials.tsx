import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TESTIMONIALS, PARTNERS_LOGOS, VIDEO_TESTIMONIALS } from '../../landing-data';
import HiringPartners from './HiringPartners';
import {
  ArrowRight,
  Linkedin,
  Compass,
  HeartHandshake,
  UsersRound,
  BookOpenText,
  Star,
  Play,
  X,
  Maximize2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api, getMediaUrl } from '../../services/api';

interface NormalizedVideoTestimonial {
  id: string;
  studentName: string;
  courseCompleted: string;
  outcomeTag: string;
  videoUrl: string;
  posterUrl?: string;
  quote?: string;
  starRating?: number;
}

function parseVideoSource(url: string) {
  if (!url) return { type: 'unknown', embedUrl: '', thumbUrl: '' };

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
      thumbUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
    };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|video\/|)(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      thumbUrl: '',
    };
  }

  const cfMatch = url.match(/(?:cloudflarestream\.com|watch\.cloudflarestream\.com|videodelivery\.net)\/([a-zA-Z0-9]+)/);
  if (cfMatch) {
    return {
      type: 'cloudflare',
      embedUrl: `https://iframe.videodelivery.net/${cfMatch[1]}?autoplay=true`,
      thumbUrl: `https://videodelivery.net/${cfMatch[1]}/thumbnails/thumbnail.jpg`,
    };
  }

  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.includes('/gtv-videos-bucket/')) {
    return {
      type: 'direct',
      embedUrl: url,
      thumbUrl: '',
    };
  }

  return { type: 'iframe', embedUrl: url, thumbUrl: '' };
}

function VideoPlayer({ videoUrl, title }: { videoUrl: string; title: string }) {
  const parsed = parseVideoSource(videoUrl);
  const mediaUrl = getMediaUrl(parsed.embedUrl);

  if (parsed.type === 'direct') {
    return (
      <video
        src={mediaUrl}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-cover rounded-xl"
      />
    );
  }

  return (
    <iframe
      src={parsed.embedUrl}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="w-full h-full rounded-xl border-0"
      title={title}
    />
  );
}

function VideoCard({
  t,
  onOpenLightbox,
}: {
  t: NormalizedVideoTestimonial;
  onOpenLightbox: (item: NormalizedVideoTestimonial) => void;
}) {
  const [inlinePlaying, setInlinePlaying] = useState(false);
  const parsed = parseVideoSource(t.videoUrl);
  const effectivePoster = t.posterUrl || parsed.thumbUrl;

  return (
    <div className="bg-[#180927] border border-white/10 hover:border-brand-coral/40 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/40 group">
      {/* Zero CLS aspect container */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-950/50 to-slate-900 overflow-hidden">
        {inlinePlaying ? (
          <VideoPlayer videoUrl={t.videoUrl} title={t.studentName} />
        ) : (
          <div className="relative w-full h-full">
            {effectivePoster ? (
              <img
                src={getMediaUrl(effectivePoster)}
                alt={t.studentName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-900 to-indigo-900">
                <span className="text-white/40 font-mono text-xs">Preview</span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

            {/* Outcome Tag overlay */}
            {t.outcomeTag && (
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/90 text-white px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm">
                  <Sparkles className="w-3 h-3" />
                  {t.outcomeTag}
                </span>
              </div>
            )}

            {/* Lightbox expand button */}
            <button
              type="button"
              onClick={() => onOpenLightbox(t)}
              aria-label="Expand video modal"
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Play Button */}
            <button
              type="button"
              onClick={() => setInlinePlaying(true)}
              aria-label={`Play video testimonial of ${t.studentName}`}
              className="absolute inset-0 flex items-center justify-center group/btn"
            >
              <div className="w-14 h-14 rounded-full bg-brand-coral/90 hover:bg-brand-coral flex items-center justify-center shadow-lg shadow-coral-500/30 group-hover/btn:scale-110 transition-transform">
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Student metadata overlay & description */}
      <div className="p-4 flex flex-col justify-between flex-1 bg-[#1a0a2c]/60">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-coral to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow">
                {t.studentName?.charAt(0) ?? 'S'}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{t.studentName}</p>
                <p className="text-[11px] text-purple-200/70 font-medium">{t.courseCompleted}</p>
              </div>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(t.starRating ?? 5, 5) }).map((_, i) => (
                <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>

          {t.quote && (
            <p className="text-xs text-purple-100/80 italic leading-relaxed pt-1">
              "{t.quote}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [activeLightbox, setActiveLightbox] = useState<NormalizedVideoTestimonial | null>(null);
  const testimonialsScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = React.useCallback(() => {
    const el = testimonialsScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = testimonialsScrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scrollTestimonials = (direction: 'left' | 'right') => {
    const el = testimonialsScrollRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -420 : 420;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const { data: cmsTestimonials = [] } = useQuery<any[]>({
    queryKey: ['cms-testimonials'],
    queryFn: api.cms.testimonials.list,
    staleTime: 60_000,
  });

  // Map CMS video testimonials or fallback to VIDEO_TESTIMONIALS
  const cmsVideoItems: NormalizedVideoTestimonial[] = cmsTestimonials
    .filter((t: any) => !!t.video_url)
    .map((t: any) => ({
      id: String(t.id),
      studentName: t.student_name || 'T2U Alum',
      courseCompleted: t.course_completed || 'Skill Track Alum',
      outcomeTag: t.outcome_tag || 'Career Upgrade',
      videoUrl: t.video_url,
      posterUrl: t.photo_url || '',
      quote: t.story_text || '',
      starRating: t.star_rating || 5,
    }));

  const allVideoTestimonials: NormalizedVideoTestimonial[] =
    cmsVideoItems.length > 0 ? cmsVideoItems : VIDEO_TESTIMONIALS;

  return (
    <section id="testimonials" className="py-24 bg-warm-cream text-dark-charcoal scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Testimonials Title Grid */}
        <div className="max-w-3xl mb-16">
          <span className="text-sm uppercase font-extrabold tracking-widest text-brand-coral bg-brand-coral/10 px-3 py-1.5 rounded-full">
            Success Portfolios
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-bold tracking-tight mt-4">
            Real stories. Real upgrades.
          </h2>
          <p className="text-base sm:text-lg text-muted-tan mt-2">
            See how Indian learners completed tracks and went from basic clerical slots to coordinated office heads.
          </p>
        </div>

        {/* Testimonials horizontal scroll slider */}
        <div className="relative group mb-24">
          {/* Floating Left Button */}
          <button
            type="button"
            onClick={() => scrollTestimonials('left')}
            disabled={!canScrollLeft}
            aria-label="Previous testimonials"
            className="absolute -left-2 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center bg-[#1e0d2f]/95 hover:bg-[#f97316] text-white border-2 border-white/20 hover:border-orange-400 shadow-2xl shadow-black/90 backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Floating Right Button */}
          <button
            type="button"
            onClick={() => scrollTestimonials('right')}
            disabled={!canScrollRight}
            aria-label="Next testimonials"
            className="absolute -right-2 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center bg-[#1e0d2f]/95 hover:bg-[#f97316] text-white border-2 border-white/20 hover:border-orange-400 shadow-2xl shadow-black/90 backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div
            ref={testimonialsScrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-4 snap-x snap-mandatory scroll-smooth hide-scrollbar px-2 sm:px-4"
          >
          {TESTIMONIALS.map((col, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="shrink-0 w-[85vw] sm:w-[450px] snap-center bg-near-black border-[1px] border-white/35 card-border-strong hover:border-white/55 rounded-[32px] p-6 sm:p-8 flex flex-col justify-between hover:shadow-xl hover:shadow-white/20 transition-all duration-300"
            >
              <div className="space-y-5">
                {/* Header with before and after company indicator */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-tan/40 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-brand-coral text-white font-mono font-bold text-xs flex items-center justify-center">
                      {col.initials}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-dark-charcoal leading-none">
                        {col.name}
                      </h4>
                      <span className="text-xs text-muted-tan mt-1 block">Verified Alumnus</span>
                    </div>
                  </div>

                  <a
                    href="https://www.linkedin.com/company/t2upgrade"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View verified alumni network on LinkedIn"
                    aria-label="View verified alumni network on LinkedIn"
                    className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
                  >
                    <Linkedin className="w-4 h-4 fill-current" />
                  </a>
                </div>

                {/* Transition flow */}
                <div className="inline-flex flex-wrap items-center text-sm font-semibold gap-x-2 gap-y-1 py-1.5 bg-border-tan/20 px-3 rounded-xl border border-border-tan/30 max-w-full">
                  <span className="text-muted-tan font-normal">{col.prevRole}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                  <span className="text-emerald-400 break-words line-clamp-1 sm:line-clamp-none">{col.newRole}</span>
                </div>

                {/* Testimonial Quote paragraph */}
                <p className="text-sm sm:text-base text-dark-charcoal/85 italic leading-relaxed pt-2">
                  "{col.quote}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border-tan/30 text-xs font-mono text-emerald-400 font-bold uppercase flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                All earnings and payments checked and verified
              </div>
            </motion.div>
          ))}
          </div>
        </div>

        {/* ── CMS Text Testimonials ── */}
        {cmsTestimonials.filter((t: any) => !t.video_url).length > 0 && (
          <div className="mb-20">
            <h3 className="text-2xl sm:text-3xl font-bold text-dark-charcoal mb-8 text-center">What Our Students Say</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cmsTestimonials.filter((t: any) => !t.video_url).map((t: any, idx: number) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="bg-near-black border border-border-tan/40 rounded-2xl p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    {t.photo_url ? (
                      <img src={getMediaUrl(t.photo_url)} alt={t.student_name}
                        className="w-10 h-10 rounded-full object-cover border border-border-tan/30 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-coral text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {t.student_name?.charAt(0) ?? '?'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-dark-charcoal">{t.student_name}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(t.star_rating ?? 5, 5) }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed italic">"{t.story_text}"</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Video Testimonials Grid ── */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <span className="text-sm uppercase font-extrabold tracking-widest text-brand-coral bg-brand-coral/10 px-3 py-1.5 rounded-full">
              Video Testimonials
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-dark-charcoal mt-4">Hear it from them directly.</h3>
            <p className="text-base text-muted-tan mt-2">Approved student success stories & career transformations.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allVideoTestimonials.map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <VideoCard t={t} onOpenLightbox={(item) => setActiveLightbox(item)} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Video Modal Lightbox ── */}
        <AnimatePresence>
          {activeLightbox && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveLightbox(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl bg-[#130221] border border-white/20 rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1b082e]">
                  <div>
                    <h4 className="text-base font-bold text-white">{activeLightbox.studentName}</h4>
                    <p className="text-xs text-purple-200/70">{activeLightbox.courseCompleted} • {activeLightbox.outcomeTag}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveLightbox(null)}
                    aria-label="Close modal"
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative aspect-video bg-black">
                  <VideoPlayer videoUrl={activeLightbox.videoUrl} title={activeLightbox.studentName} />
                </div>
                {activeLightbox.quote && (
                  <div className="p-4 bg-[#1b082e]/80 border-t border-white/10 text-sm text-purple-100/90 italic">
                    "{activeLightbox.quote}"
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Why T2U? Differentiators Strip on dark charcoal */}
        <div id="why" className="bg-[#1A1A1A] text-white rounded-[36px] p-8 sm:p-12 border border-warm-cream/10 mb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-coral/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center md:text-left max-w-xl mb-12">
            <span className="text-sm tracking-widest uppercase font-bold text-brand-mustard">
              THE T2U ADVANTAGE
            </span>
            <h3 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-bold text-white tracking-tight mt-3">
              Why Indian learners upgrade with us.
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2.5 text-center md:text-left">
              <div className="p-3 bg-brand-coral/15 text-brand-coral rounded-xl w-max mx-auto md:mx-0">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white">Built for India</h4>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Courses available in Hindi and English, Payment methods for Indian rupees, secure Instant payments through UPI, fully Follows all Indian tax rules.
              </p>
            </div>

            <div className="space-y-2.5 text-center md:text-left">
              <div className="p-3 bg-brand-coral/15 text-brand-coral rounded-xl w-max mx-auto md:mx-0">
                <BookOpenText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white">Hands-on, No Clutter</h4>
              <p className="text-sm text-neutral-300 leading-relaxed">
                No boring lectures - only practical learning. Every course helps you complete real projects that you can show to employers.
              </p>
            </div>

            <div className="space-y-2.5 text-center md:text-left">
              <div className="p-3 bg-brand-coral/15 text-brand-coral rounded-xl w-max mx-auto md:mx-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Earn While You Learn</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Get your referral code immediately when you join lets you share course keys and Earn money from your team and get it in your bank.
              </p>
            </div>

            <div className="space-y-2.5 text-center md:text-left">
              <div className="p-3 bg-brand-coral/15 text-brand-coral rounded-xl w-max mx-auto md:mx-0">
                <UsersRound className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Ethical & Audited</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Clear records of all your referrals and earnings. Important identity verification required. No payments for courses that don't get used.
              </p>
            </div>
          </div>
        </div>

        {/* Hiring Partners - New Modern Design */}
        <HiringPartners />

      </div>
    </section>
  );
}

