import React, { useEffect, useState } from 'react';
import { TESTIMONIALS, PARTNERS_LOGOS } from '../../landing-data';
import HiringPartners from './HiringPartners';
import { 
  ArrowRight, 
  Linkedin, 
  Smartphone, 
  MapPin, 
  Compass, 
  HeartHandshake, 
  UsersRound, 
  BookOpenText,
  BadgeAlert
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Testimonials() {
  const doubledPartners = [...PARTNERS_LOGOS, ...PARTNERS_LOGOS, ...PARTNERS_LOGOS];

  const [tick, setTick] = useState(0);

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
              <h4 className="font-bold text-base text-white">ðŸŽ¯ Built for India</h4>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Courses available in Hindi and English, Payment methods for Indian rupees, secure Instant payments through UPI, fully Follows all Indian tax rules.
              </p>
            </div>

            <div className="space-y-2.5 text-center md:text-left">
              <div className="p-3 bg-brand-coral/15 text-brand-coral rounded-xl w-max mx-auto md:mx-0">
                <BookOpenText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white">ðŸ“š Hands-on, No Clutter</h4>
              <p className="text-sm text-neutral-300 leading-relaxed">
                No boring lectures - only practical learning. Every course helps you complete real projects that you can show to employers.
              </p>
            </div>

            <div className="space-y-2.5 text-center md:text-left">
              <div className="p-3 bg-brand-coral/15 text-brand-coral rounded-xl w-max mx-auto md:mx-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">ðŸ¤ Earn While You Learn</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Get your referral code immediately when you join lets you share course keys and Earn money from your team and get it in your bank.
              </p>
            </div>

            <div className="space-y-2.5 text-center md:text-left">
              <div className="p-3 bg-brand-coral/15 text-brand-coral rounded-xl w-max mx-auto md:mx-0">
                <UsersRound className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">ðŸ›¡ï¸ Ethical & Audited</h4>
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

