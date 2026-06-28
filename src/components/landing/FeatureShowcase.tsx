import React from 'react';
import { TrendingUp, Users } from 'lucide-react';

export default function FeatureShowcase() {
  const features = [
    {
      icon: TrendingUp,
      label: 'HANDS-ON WORK',
      title: 'Portfolio-Grade Live Projects',
      description: 'Assemble real-world Excel sheets, launch fully configured ad campaigns, and program working AI automated assistants that prove job-readiness instantly.',
      badge: 'QUALITY ASSURANCE',
      accent: 'Certified projects saved on online platforms'
    },
    {
      icon: Users,
      label: 'CAREER CONFIDENCE',
      title: 'Mock Interview & Accent Labs',
      description: 'Overcome fear and neutralise accents. Practice with corporate mock drills, professional resumes, and peer feedback in curated communication modules.',
      badge: 'INTERVIEW READY',
      accent: 'Industry-Standard Preparation'
    }
  ];

  return (
    <section className="py-24 bg-near-black text-white scroll-mt-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="border-[1px] border-white/35 card-border-strong rounded-[28px] p-8 sm:p-12 hover:border-white/55 hover:shadow-lg hover:shadow-white/20 transition-all duration-300"
              >
                {/* Header with icon and label */}
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-brand-coral/10 text-brand-coral rounded-xl">
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-brand-mustard uppercase tracking-widest">
                    {feature.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-3xl sm:text-4xl font-sans font-bold text-white mb-4">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-6">
                  {feature.description}
                </p>

                {/* Divider */}
                <div className="border-t border-white/20 my-6"></div>

                {/* Footer with badges */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span className="text-sm font-extrabold text-white/60 uppercase tracking-wider">
                    {feature.badge}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#ff7a00]">
                    {feature.accent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
