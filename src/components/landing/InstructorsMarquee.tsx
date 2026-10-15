import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { INSTRUCTORS } from '../../landing-data';
import { api } from '../../services/api';
import { InstructorDisplay } from '../common/InstructorDisplay';

export default function InstructorsMarquee() {
  const { data: apiInstructors = [] } = useQuery<any[]>({
    queryKey: ['public-instructors'],
    queryFn: () => api.users.instructors(),
    staleTime: 5 * 60_000,
  });

  // Use dynamic backend instructors if available, fallback to INSTRUCTORS data
  const instructorsList = (apiInstructors.length > 0
    ? apiInstructors.map((inst: any) => ({
        id: inst.id,
        full_name: inst.full_name,
        headline: inst.headline || (inst.expertise_tags?.length ? `${inst.expertise_tags.slice(0, 2).join(' • ')} Specialist` : 'Industry Specialist'),
        profile_photo_url: inst.profile_photo_url,
        bio: inst.bio,
        expertise_tags: inst.expertise_tags,
      }))
    : INSTRUCTORS.map((inst: any) => ({
        name: inst.name,
        role: inst.role,
        company: inst.company,
        headline: `${inst.role} • ${inst.company}`,
        avatar: inst.avatar,
      }))
  );

  const half = Math.ceil(instructorsList.length / 2);
  const marquee1 = instructorsList.slice(0, half);
  const marquee2 = instructorsList.slice(half);

  // Duplicate items to ensure smooth continuous marquee
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
          Instructors from India's fastest-growing companies who train you with real work tasks you do during class.
        </p>
      </div>

      <div className="space-y-6 relative">
        {/* Shading edges gradient overflows */}
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-warm-cream to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-warm-cream to-transparent z-10 pointer-events-none" />

        {/* Marquee Row 1: Slide Left */}
        <div className="w-full overflow-hidden flex py-2 border-t border-b border-border-tan/30 bg-near-black/25">
          <div className="animate-marquee-left flex items-center gap-5">
            {doubled1.map((inst, index) => (
              <div
                key={index}
                className="bg-near-black border-[1.5px] border-white/50 px-5 py-3 rounded-2xl min-w-[280px] shrink-0 hover:border-white/70 transition-colors hover:shadow-lg hover:shadow-white/30"
              >
                <InstructorDisplay instructor={inst} variant="card" />
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
                className="bg-near-black border-[1.5px] border-white/50 px-5 py-3 rounded-2xl min-w-[280px] shrink-0 hover:border-white/70 transition-colors hover:shadow-lg hover:shadow-white/30"
              >
                <InstructorDisplay instructor={inst} variant="card" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

