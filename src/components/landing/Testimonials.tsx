import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TESTIMONIALS, PARTNERS_LOGOS } from '../../landing-data';
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
} from 'lucide-react';
import { motion } from 'motion/react';
import { api, getMediaUrl } from '../../services/api';

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const DEMO_VIDEO_TESTIMONIALS = [
  {
    id: 'demo-v1',
    student_name: 'Priya Sharma',
    star_rating: 5,
    story_text: 'T2U completely changed my career. I went from a basic job to earning ₹50K/month in just 6 months!',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    photo_url: '',
    isDemo: true,
  },
  {
    id: 'demo-v2',
    student_name: 'Rahul Verma',
    star_rating: 5,
    story_text: 'The best platform for learning and earning simultaneously. Live classes are top quality.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    photo_url: '',
    isDemo: true,
  },
  {
    id: 'demo-v3',
    student_name: 'Anjali Singh',
    star_rating: 5,
    story_text: 'Amazing instructors and an incredibly supportive community. Highly recommend T2U!',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    photo_url: '',
    isDemo: true,
  },
];

function VideoCard({ t }: { t: any }) {
  const [playing, setPlaying] = useState(false);
  const ytId = getYouTubeId(t.video_url ?? '');
  const isDirectVideo = !ytId && /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(t.video_url ?? '');

  return (
    <div className="bg-near-black border border-border-tan/40 rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800">
        {playing ? (
          ytId ? (
            /* YouTube: embed as iframe */
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              title={t.student_name}
            />
          ) : isDirectVideo ? (
            /* Direct video file: use <video> element, never iframe */
            <video
              src={getMediaUrl(t.video_url)}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            /* Unknown URL type – fall back gracefully */
            <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
              Cannot play this video format
            </div>
          )
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="w-full h-full flex items-center justify-center group relative"
          >
            {/* Thumbnail: use explicit photo, YouTube thumbnail, or first frame of direct video */}
            {t.photo_url ? (
              <img src={getMediaUrl(t.photo_url)} alt={t.student_name} className="absolute inset-0 w-full h-full object-cover opacity-90" />
            ) : ytId ? (
              <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={t.student_name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : isDirectVideo ? (
              <video
                src={getMediaUrl(t.video_url)}
                className="absolute inset-0 w-full h-full object-cover"
                preload="metadata"
                muted
                playsInline
                onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
              />
            ) : null}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="relative z-10 w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-brand-coral fill-brand-coral ml-1" />
            </div>
            {(t as any).isDemo && (
              <span className="absolute top-2 right-2 z-10 text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                Demo
              </span>
            )}
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-8 h-8 rounded-full bg-brand-coral text-white font-bold text-xs flex items-center justify-center shrink-0">
            {t.student_name?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="text-sm font-bold text-dark-charcoal leading-none">{t.student_name}</p>
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: Math.min(t.star_rating ?? 5, 5) }).map((_, i) => (
                <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>
        </div>
        {t.story_text && <p className="text-xs text-dark-charcoal/70 italic">"{t.story_text}"</p>}
      </div>
    </div>
  );
}

export default function Testimonials() {
  const doubledPartners = [...PARTNERS_LOGOS, ...PARTNERS_LOGOS, ...PARTNERS_LOGOS];

  const [tick, setTick] = useState(0);

  const { data: cmsTestimonials = [] } = useQuery<any[]>({
    queryKey: ['cms-testimonials'],
    queryFn: api.cms.testimonials.list,
    staleTime: 60_000,
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 6000); // advance tick roughly every 6s to align with longer reveals

    return () => window.clearInterval(interval);
  }, []);

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
        <div className="flex gap-4 sm:gap-6 mb-24 overflow-x-auto pb-6 pt-4 snap-x snap-mandatory scroll-smooth hide-scrollbar">
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
                    href="#linkedin"
                    title="View LinkedIn verification"
                    onClick={(e) => { e.preventDefault(); alert("Simulating: Opening alumni LinkedIn verification certificate registry."); }}
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

        {/* ── Video Testimonials — CMS data when available, demo cards as fallback ── */}
        {(() => {
          const cmsVideos = cmsTestimonials.filter((t: any) => !!t.video_url);
          const videos = cmsVideos.length > 0 ? cmsVideos : DEMO_VIDEO_TESTIMONIALS;
          return (
            <div className="mb-20">
              <div className="text-center mb-10">
                <span className="text-sm uppercase font-extrabold tracking-widest text-brand-coral bg-brand-coral/10 px-3 py-1.5 rounded-full">
                  Video Stories
                </span>
                <h3 className="text-3xl sm:text-4xl font-bold text-dark-charcoal mt-4">Hear it from them directly.</h3>
                <p className="text-base text-muted-tan mt-2">Real students, real results — on video.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((t: any, idx: number) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                  >
                    <VideoCard t={t} />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })()}

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

