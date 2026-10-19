import React from 'react';
import { INSTRUCTORS } from '../../landing-data';
import { Star } from 'lucide-react';

export default function InstructorsMarquee() {
  // Split 12 experts into two listings (6 and 6)
  const marquee1 = INSTRUCTORS.slice(0, 6);
  const marquee2 = INSTRUCTORS.slice(6, 12);

  // Duplicate items twice to ensure perfect seamless continuous animation wrapper
  const doubled1 = [...marquee1, ...marquee1, ...marquee1];
  const doubled2 = [...marquee2, ...marquee2, ...marquee2];

  return (
    <section className="py-20 bg-warm-cream border-t border-b border-border-tan overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center md:text-left">
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#10b981] bg-[#10b981]/10 px-3 py-1 rounded-full">
          Practitioner Node
        </span>
        <h2 className="text-3xl sm:text-5xl font-sans font-bold text-dark-charcoal tracking-tight mt-4">
          Learn from practitioners, not theorists.
        </h2>
        <p className="text-xs sm:text-sm text-muted-tan mt-2">
          Instructors from India's fastest-growing companies who train you with Real work tasks you do during class.
        </p>
      </div>

      <div className="space-y-6 relative">
        {/* Shading edges gradient overflows to look perfectly integrated */}
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-warm-cream to-transparent z-15 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-warm-cream to-transparent z-15 pointer-events-none" />

        {/* Marquee Row 1: Slide Left */}
        <div className="w-full overflow-hidden flex py-2 border-t border-b border-border-tan/30 bg-near-black/25">
          <div className="animate-marquee-left flex items-center gap-5">
            {doubled1.map((inst, index) => (
              <div
                key={index}
                className="flex items-center space-x-3.5 bg-near-black border-[1.5px] border-white/50 px-6 py-4 rounded-2xl min-w-[280px] shrink-0 hover:border-white/70 transition-colors hover:shadow-lg hover:shadow-white/30"
              >
                <div className={`w-14 h-14 rounded-full ${inst.avatar} flex items-center justify-center font-bold font-mono text-base shadow-lg border-[1.5px] border-white/50`}>
                  {inst.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-dark-charcoal flex items-center">
                    {inst.name}
                    <Star className="w-3 h-3 text-brand-mustard fill-current ml-1" />
                  </h4>
                  <span className="text-[10px] text-muted-tan block">{inst.role}</span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-coral bg-brand-coral/5 px-2 py-0.5 rounded-md mt-1 inline-block">
                    {inst.company}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Row 2: Slide Right */}
        <div className="w-full overflow-hidden flex py-2 border-b border-border-tan/30 bg-near-black/25">
          <div className="animate-marquee-right flex items-center gap-5">
            {doubled2.map((inst, index) => (
              <div
                key={index}
                className="flex items-center space-x-3.5 bg-near-black border-[1.5px] border-white/50 px-6 py-4 rounded-2xl min-w-[280px] shrink-0 hover:border-white/70 transition-colors hover:shadow-lg hover:shadow-white/30"
              >
                <div className={`w-14 h-14 rounded-full ${inst.avatar} flex items-center justify-center font-bold font-mono text-base shadow-lg border-[1.5px] border-white/50`}>
                  {inst.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-dark-charcoal flex items-center">
                    {inst.name}
                    <Star className="w-3 h-3 text-brand-mustard fill-current ml-1" />
                  </h4>
                  <span className="text-[10px] text-muted-tan block">{inst.role}</span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-coral bg-brand-coral/5 px-2 py-0.5 rounded-md mt-1 inline-block">
                    {inst.company}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
