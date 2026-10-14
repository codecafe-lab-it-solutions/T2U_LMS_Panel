import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';
import { api, getMediaUrl } from '../../services/api';

interface HeroProps {
  onOpenEnrollModal: () => void;
}

export default function Hero({ onOpenEnrollModal }: HeroProps) {
  const { data: heroData } = useQuery<any>({
    queryKey: ['cms-hero'],
    queryFn: api.cms.hero.get,
    staleTime: 60_000,
  });
  const headline = heroData?.headline || null;
  const subheadline = heroData?.subheadline || null;
  const ctaText = heroData?.cta_text || 'Start Learning';
  const DEMO_HERO_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
  const heroVideoUrl: string | null = heroData?.video_url || DEMO_HERO_VIDEO;
  const [videoPlaying, setVideoPlaying] = useState(false);
  const getYouTubeId = (url: string) => {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };
  const heroEmbedUrl = heroVideoUrl
    ? (getYouTubeId(heroVideoUrl) ? `https://www.youtube.com/embed/${getYouTubeId(heroVideoUrl)}?rel=0&modestbranding=1&autoplay=1` : null)
    : null;
  const heroIsYoutube = !!heroEmbedUrl;
  const heroThumb = heroVideoUrl && getYouTubeId(heroVideoUrl)
    ? `https://img.youtube.com/vi/${getYouTubeId(heroVideoUrl)}/maxresdefault.jpg`
    : null;

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, damping: 20, stiffness: 100 }
    }
  };

  return (
    <section
      id="hero"
      className="relative bg-warm-cream text-dark-charcoal flex items-center pt-2 pb-8 sm:pt-4 sm:pb-16 overflow-hidden bg-dot-pattern"
    >
      {/* Background gradients for premium ambient lighting */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-brand-coral/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-80 h-80 bg-brand-mustard/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center w-full"
        >
          {/* Pre-headline Badge Pill */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center space-x-2 bg-near-black border border-border-tan px-3 py-1 sm:px-4 sm:py-1 rounded-full mb-3 sm:mb-6 backdrop-blur-sm"
          >
            <span className="text-[10px] sm:text-sm font-semibold tracking-wide text-brand-mustard flex items-center leading-none">
              <span className="animate-pulse mr-1.5 inline-block w-2.5 h-2.5 rounded-full bg-live-green" />
              🚀 India's all-in-one Learn-Upgrade-Earn Platform
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="overflow-visible text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.2] font-sans font-extrabold text-dark-charcoal mb-3 sm:mb-6"
          >
            {headline ? (() => {
              const parts = headline.split(/\n|(?<=\.)\s+/);
              return parts.length >= 2 ? (
                <>
                  {parts[0]}
                  <span className="block mt-0.5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.2] font-sans font-black bg-gradient-to-r from-brand-mustard via-brand-yellow to-brand-mustard bg-clip-text text-transparent">
                    {parts.slice(1).join(' ')}
                  </span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-brand-mustard via-brand-yellow to-brand-mustard bg-clip-text text-transparent">
                  {headline}
                </span>
              );
            })() : (
              <>
                Upgrade your skills.
                <span className="block mt-0.5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.2] font-sans font-black bg-gradient-to-r from-brand-mustard via-brand-yellow to-brand-mustard bg-clip-text text-transparent">
                  Upgrade your income.
                </span>
              </>
            )}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-[13px] sm:text-base md:text-lg lg:text-xl text-white font-semibold w-full max-w-3xl leading-relaxed mb-5 sm:mb-8 mx-auto text-center px-2 sm:px-0"
          >
            {subheadline || 'Join live online classes, work on real projects, learn how to lead teams, and earn money by referring others. Made for India\'s next generation of builders and achievers.'}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-4 sm:mb-10"
          >
            <button type="button" onClick={() => onOpenEnrollModal()} className="group relative w-full sm:w-auto bg-brand-coral text-white font-bold text-lg px-8 py-4 rounded-full overflow-hidden shadow-xl shadow-brand-coral/20 hover:shadow-2xl hover:shadow-brand-coral/40 hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <div className="relative flex items-center justify-center space-x-2">
                  <span>{ctaText}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
            </button>

            <button
              type="button"
              onClick={() => scrollToId('income')}
              className="w-full sm:w-auto border-2 border-[#ff7a00] hover:border-[#ff9f43] hover:bg-brand-mustard/5 text-dark-charcoal font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-full transition-all duration-200 text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(255,122,0,0.3)] hover:shadow-[0_0_30px_rgba(255,122,0,0.6)]"
            >
              <span>Earn with T2U 💵</span>
            </button>
          </motion.div>

          {/* Hero Video — shown only when admin has set one */}
          {heroVideoUrl && (
            <motion.div variants={itemVariants} className="w-full max-w-3xl mx-auto mt-2 mb-4 sm:mb-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
              {heroIsYoutube ? (
                videoPlaying ? (
                  <div className="relative aspect-video">
                    <iframe
                      src={heroEmbedUrl!}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      title="Hero video"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVideoPlaying(true)}
                    className="relative w-full aspect-video bg-black flex items-center justify-center group"
                  >
                    {heroThumb && (
                      <img
                        src={heroThumb}
                        alt="Video thumbnail"
                        width={1280}
                        height={720}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
                      />
                    )}
                    <div className="relative z-10 w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 text-brand-coral fill-brand-coral ml-1" />
                    </div>
                  </button>
                )
              ) : (
                <div className="aspect-video bg-black">
                  <video
                    src={getMediaUrl(heroVideoUrl)}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Trust strip - Pill-shaped cards with connectors */}
          <motion.div
            variants={itemVariants}
            className="w-full pt-4 px-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-sm sm:text-base font-bold text-brand-mustard uppercase tracking-widest">
                Impact Created
              </h3>
            </div>

            {/* Pill-shaped Cards Container */}
            <div className="max-w-5xl mx-auto overflow-x-auto hide-scrollbar">
              <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-4 min-w-max sm:min-w-0 px-2 py-1">
                {/* Pill Card 1 */}
                <div className="bg-gradient-to-r from-[#1a3a4d] to-[#0f2d3d] rounded-full px-4 sm:px-6 py-2 sm:py-4 border border-brand-coral/30 min-w-max text-center">
                  <p className="text-lg sm:text-2xl font-extrabold text-white font-mono mb-0 sm:mb-0.5">10,000+</p>
                  <p className="text-[9px] sm:text-xs text-gray-300 uppercase tracking-wider font-bold whitespace-nowrap">
                    Learners Placed
                  </p>
                </div>

                {/* Connector 1 */}
                <div className="hidden sm:block w-2 h-2 rounded-full bg-white flex-shrink-0"></div>

                {/* Pill Card 2 */}
                <div className="bg-gradient-to-r from-[#1a3a4d] to-[#0f2d3d] rounded-full px-4 sm:px-6 py-2 sm:py-4 border border-brand-coral/30 min-w-max text-center">
                  <p className="text-lg sm:text-2xl font-extrabold text-white font-mono mb-0 sm:mb-0.5">50+</p>
                  <p className="text-[9px] sm:text-xs text-gray-300 uppercase tracking-wider font-bold whitespace-nowrap">
                    Expert Guides
                  </p>
                </div>

                {/* Connector 2 */}
                <div className="hidden sm:block w-2 h-2 rounded-full bg-white flex-shrink-0"></div>

                {/* Pill Card 3 */}
                <div className="bg-gradient-to-r from-[#1a3a4d] to-[#0f2d3d] rounded-full px-4 sm:px-6 py-2 sm:py-4 border border-brand-coral/30 min-w-max text-center">
                  <p className="text-lg sm:text-2xl font-extrabold text-white font-mono mb-0 sm:mb-0.5">5</p>
                  <p className="text-[9px] sm:text-xs text-gray-300 uppercase tracking-wider font-bold whitespace-nowrap">
                    Skill Verticals
                  </p>
                </div>

                {/* Connector 3 */}
                <div className="hidden sm:block w-2 h-2 rounded-full bg-white flex-shrink-0"></div>

                {/* Pill Card 4 */}
                <div className="bg-gradient-to-r from-[#1a3a4d] to-[#0f2d3d] rounded-full px-4 sm:px-6 py-2 sm:py-4 border border-brand-coral/30 min-w-max text-center">
                  <p className="text-lg sm:text-2xl font-extrabold text-white font-mono mb-0 sm:mb-0.5">4.9★</p>
                  <p className="text-[9px] sm:text-xs text-gray-300 uppercase tracking-wider font-bold whitespace-nowrap">
                    Platform Rating
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>


    </section>
  );
}
