import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Users, Code, ClipboardList, Award, ChevronLeft, ChevronRight, Navigation } from 'lucide-react';

const CARDS_DATA = [
  {
    id: 'learn',
    label: 'Learn',
    title: 'Master In-Demand Skills',
    metric: '4.7/5',
    metricLabel: 'Avg Rating',
    description: 'Build strong foundations in high-demand domains — Business, Technology, Design, Health & more.',
    icon: BookOpen,
    bg: 'from-[#1a1060] to-[#3b1fa8]',
    accentColor: '#6366f1',
    image: '/images/computer-skills.png',
  },
  {
    id: 'mentor',
    label: 'Get Mentored',
    title: 'Learn from Industry Experts',
    metric: '4.9/5',
    metricLabel: 'Mentor Rating',
    description: 'Receive 1-on-1 mentorship. Get doubts resolved and stay on track with structured support.',
    icon: Users,
    bg: 'from-[#3b0f4f] to-[#7c3aed]',
    accentColor: '#a855f7',
    image: '/images/mentorship.png',
  },
  {
    id: 'build',
    label: 'Build',
    title: 'Work on Real-World Projects',
    metric: '10+',
    metricLabel: 'Projects',
    description: 'Gain hands-on experience building industry-relevant projects that strengthen your portfolio.',
    icon: Code,
    bg: 'from-[#064e3b] to-[#059669]',
    accentColor: '#10b981',
    image: '/images/fullstack-dev.png',
  },
  {
    id: 'mock',
    label: 'Mock Sessions',
    title: 'Practice with Mock Interviews',
    metric: '12+',
    metricLabel: 'Sessions',
    description: 'Sharpen skills through mock interviews and assessments designed for real hiring scenarios.',
    icon: ClipboardList,
    bg: 'from-[#7c1d1d] to-[#ea580c]',
    accentColor: '#f97316',
    image: '/images/assesement.png',
  },
  {
    id: 'certificate',
    label: 'Get Certificate',
    title: 'Earn Industry Certificates',
    metric: '∞',
    metricLabel: 'Career Value',
    description: 'Complete your course and earn verifiable certificates that impress employers worldwide.',
    icon: Award,
    bg: 'from-[#0c4a6e] to-[#0891b2]',
    accentColor: '#06b6d4',
    image: '/images/certificates.png',
  },
];

// Base dimensions for cards in the carousel
const CARD_WIDTH = 340;
const CARD_HEIGHT = 420;

export default function CardsStack() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.floor(CARDS_DATA.length / 2));

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % CARDS_DATA.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + CARDS_DATA.length) % CARDS_DATA.length);
  };

  return (
    <section className="w-full pt-4 pb-16 sm:py-20 lg:py-24 bg-[#12031e] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-sm uppercase font-extrabold tracking-widest text-[#fbbf24] bg-[#3b0f4f]/50 px-3 py-1.5 rounded-full">
            Your Journey
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-4 tracking-tight">
            Every Step, Covered
          </h2>
          <p className="text-white/60 mt-4 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            <strong className="text-white font-semibold">From beginner to master — for ANY skill you want to learn or teach.</strong><br/>
            From your very first lesson to landing your dream job, we provide a complete, end-to-end ecosystem.
            Master high-demand skills through hands-on projects, gain industry certifications, and connect directly with top hiring partners.
            Tap the button below to explore all stages.
          </p>

          <p className="font-hindi text-white/90 mt-5 text-base sm:text-lg lg:text-xl max-w-4xl mx-auto leading-[1.8] font-medium tracking-wide">
            आपके पहले पाठ से लेकर अपनी ड्रीम जॉब तक, हम एक संपूर्ण, एंड-टू-एंड इकोसिस्टम प्रदान करते हैं। हाथों-हाथ प्रोजेक्ट के माध्यम से उच्च-मांग कौशल में महारत हासिल करें, उद्योग प्रमाणपत्र प्राप्त करें, और शीर्ष भर्ती भागीदारों के साथ सीधे जुड़ें। सभी चरणों का पता लगाने के लिए नीचे दिए गए बटन को टैप करें।
          </p>
        </div>

        {/* ── 3D Carousel Container ── */}
        <div className="relative w-full py-12 flex flex-col items-center justify-center min-h-[600px] overflow-hidden" style={{ perspective: 1000 }}>
          <div className="relative w-full max-w-7xl h-[450px] flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
            <AnimatePresence>
              {CARDS_DATA.map((card, index) => {
                const Icon = card.icon;

                // --- STACKED DECK STATE ---
                if (!isExpanded) {
                  return (
                    <motion.div
                      key={`stack-${card.id}`}
                      initial={{ opacity: 0, y: 50, rotateZ: 0 }}
                      animate={{
                        opacity: 1 - index * 0.15,
                        y: index * 15,
                        x: index * (index % 2 === 0 ? 10 : -10),
                        rotateZ: index === 0 ? 0 : index * (index % 2 === 0 ? 5 : -5),
                        scale: 1 - index * 0.04,
                        zIndex: 20 - index
                      }}
                      transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100 }}
                      className="absolute w-[280px] sm:w-[340px] h-[420px]"
                    >
                      <div className={`w-full h-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br ${card.bg} flex flex-col`}>
                        <div className="relative h-[48%] overflow-hidden shrink-0">
                          <img
                            src={card.image}
                            alt={card.title}
                            width={340}
                            height={200}
                            loading="lazy"
                            className="w-full h-full object-cover brightness-60"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />
                          <div className="absolute top-4 left-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-white/90">
                              {card.label}
                            </span>
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <p className="text-4xl font-black text-white leading-none">{card.metric}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mt-0.5">
                              {card.metricLabel}
                            </p>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col gap-3 flex-1">
                          <h3 className="text-lg font-black text-white leading-tight">{card.title}</h3>
                          <p className="text-sm text-white/65 leading-relaxed">{card.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                // --- EXPANDED COVERFLOW STATE ---
                const offset = index - activeIndex;
                const absOffset = Math.abs(offset);

                if (absOffset > 4) return null; // performance optimization

                return (
                  <motion.div
                    key={`coverflow-${card.id}`}
                    layout
                    initial={false}
                    animate={{
                      x: offset * 220,
                      y: absOffset * 35 + (absOffset === 2 ? 25 : 0), // Creates the arch shape
                      z: absOffset * -80, // Subtle depth
                      rotateY: offset * -12, // Slight 3D inward turn
                      rotateZ: offset * 8, // The signature fan tilt
                      scale: offset === 0 ? 1 : 0.9 - absOffset * 0.05,
                      opacity: 1,
                      zIndex: 20 - absOffset
                    }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute w-[280px] sm:w-[340px] h-[420px] cursor-pointer"
                    onClick={() => {
                      if (offset !== 0) setActiveIndex(index);
                    }}
                  >
                    <div className={`w-full h-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br ${card.bg} flex flex-col ${offset === 0 ? 'hover:border-white/40 shadow-orange-500/20' : ''}`}>
                      <div className="relative h-[48%] overflow-hidden shrink-0">
                        <img
                          src={card.image}
                          alt={card.title}
                          width={340}
                          height={200}
                          loading="lazy"
                          className="w-full h-full object-cover brightness-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-white/90">
                            {card.label}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <p className="text-4xl font-black text-white leading-none">{card.metric}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mt-0.5">
                            {card.metricLabel}
                          </p>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col gap-3 flex-1 bg-black/20">
                        <h3 className="text-lg font-black text-white leading-tight">{card.title}</h3>
                        <p className="text-sm text-white/65 leading-relaxed">{card.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* The Play/Spread Yellow Arrow Button */}
            {!isExpanded && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                className="absolute z-50 pointer-events-auto cursor-pointer"
                onClick={() => setIsExpanded(true)}
              >
                <div className="w-20 h-20 bg-[#fcc920] rounded-full flex items-center justify-center shadow-2xl shadow-[#fcc920]/50 hover:scale-110 transition-transform">
                  <Navigation className="w-8 h-8 text-black fill-black transform translate-x-0.5 -translate-y-0.5 rotate-45" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Pagination Dots */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12 flex items-center justify-center gap-3 z-50"
            >
              {CARDS_DATA.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? 'w-8 bg-[#fcc920]'
                      : 'w-2.5 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </motion.div>
          )}

        </div>
      </div>
    </section>
  );
}
