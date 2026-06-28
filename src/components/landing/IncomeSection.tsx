import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Laptop,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Briefcase,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Six premium skill and support pillars replacing MLM earning options
const SKILL_PILLARS = [
  {
    id: "live-cohorts",
    title: "Live Interactive Classes",
    description: "Join live classes with experts and clear your doubts in real-time. No boring recordings.",
    descriptionHindi: "एक्सपर्ट्स के साथ लाइव क्लासेस ज्वाइन करें और अपने डाउट तुरंत क्लियर करें।",
    tag: "100% INTERACTIVE",
    icon: Laptop,
    badgeText: "Quality check in small batches"
  },
  {
    id: "portfolio-projects",
    title: "Live Industry Projects",
    description: "Work on real-world projects like Excel dashboards, live ads, and AI assistants.",
    descriptionHindi: "रियल-वर्ल्ड प्रोजेक्ट्स पर काम करें। एक्सेल, एड्स और एआई के प्रैक्टिकल काम सीखें।",
    tag: "HANDS-ON WORK",
    icon: TrendingUp,
    badgeText: "Build Certified Projects"
  },
  {
    id: "speaking-clinics",
    title: "Mock Interviews & Communication",
    description: "Overcome your interview fear. Improve your communication skills with mock drills and expert feedback.",
    descriptionHindi: "इंटरव्यू का डर खत्म करें। मॉक इंटरव्यू और एक्सपर्ट फीडबैक से अपनी कम्युनिकेशन बेहतर बनाएं।",
    tag: "CAREER CONFIDENCE",
    icon: Users,
    badgeText: "Trained Professional Coaches"
  },
  {
    id: "practical-blueprints",
    title: "Real Business Case Studies",
    description: "Learn from the real examples of top companies. Understand successful digital marketing campaigns.",
    descriptionHindi: "टॉप कंपनियों के असली उदाहरणों से सीखें। सफल डिजिटल मार्केटिंग कैम्पेन को समझें।",
    tag: "INDUSTRY FOCUS",
    icon: BookOpen,
    badgeText: "Learn from Real Businesses"
  },
  {
    id: "verified-credentials",
    title: "Project-Backed Certificates",
    description: "Get certificates that include links to your live projects. Perfect for your LinkedIn profile.",
    descriptionHindi: "ऐसे सर्टिफिकेट्स पाएं जिनमें आपके लाइव प्रोजेक्ट्स का लिंक हो, जो लिंक्डइन के लिए परफेक्ट हैं।",
    tag: "RECOGNIZED PROFILE",
    icon: Award,
    badgeText: "LinkedIn-Ready Portfolio"
  },
  {
    id: "professional-network",
    title: "Freelance & Sales Skills",
    description: "Learn how to pitch to high-paying clients and improve your presentation skills to increase earnings.",
    descriptionHindi: "हाई-पेइंग क्लाइंट्स को पिच करना और अपनी प्रेजेंटेशन स्किल्स को बेहतर बनाना सीखें।",
    tag: "COMMERCIAL PROFICIENCY",
    icon: Briefcase,
    badgeText: "Step-by-step Practical Guides"
  }
];

export default function IncomeSection() {
  const [freelanceGigs, setFreelanceGigs] = useState(6);
  const [avgGigPayout, setAvgGigPayout] = useState(3500);
  const [directReferrals, setDirectReferrals] = useState(5);
  const programPrice = 4999; 

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const directCommissionRate = 0.20; 

  const calculatedFreelanceIncome = freelanceGigs * avgGigPayout;
  const calculatedReferralIncome = Math.round(directReferrals * programPrice * directCommissionRate);
  const totalProjectedEarnings = calculatedFreelanceIncome + calculatedReferralIncome;

  return (
    <section id="income" className="py-24 bg-warm-cream text-dark-charcoal scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-4xl mb-16 pb-6 border-b-2 border-brand-coral/30">
          <span className="text-sm uppercase font-extrabold tracking-widest text-brand-coral bg-brand-coral/10 px-3 py-1.5 rounded-full">
            Upskilling Deliverables
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-black tracking-tight mt-4">
            <span className="text-dark-charcoal">Pillars of </span>
            <span className="text-brand-mustard">real-world</span>
            <span className="text-dark-charcoal"> capability.</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-tan mt-4 leading-relaxed max-w-3xl">
            At T2U, our curriculum bypasses obsolete textbook definitions. We focus entirely on interactive building blocks, practical assignments, and verified credentials to empower your digital career.
          </p>
        </div>

        {/* 6 High-Value Skill & Career Pillar Cards Replacing MLM Payout Options */}
        <div ref={scrollContainerRef} className="flex md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 md:mb-20 overflow-x-auto md:overflow-visible hide-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-6 md:pb-0 scroll-smooth">
          {SKILL_PILLARS.map((pillar, idx) => {
            const IconComponent = pillar.icon;
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="bg-near-black border border-border-tan card-border-strong hover:border-brand-coral/40 rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 shrink-0 w-[280px] sm:w-[320px] md:w-auto snap-center"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="p-3 bg-brand-coral/10 text-brand-coral rounded-2xl">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="bg-brand-coral/10 text-brand-coral text-[10px] font-mono font-extrabold tracking-wide px-2.5 py-1 rounded-full uppercase">
                      {pillar.tag}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold font-sans text-dark-charcoal leading-snug">
                    {pillar.title}
                  </h3>

                  <p className="text-sm text-muted-tan mt-3 leading-relaxed">
                    {pillar.description}
                  </p>
                  
                  {pillar.descriptionHindi && (
                    <p className="font-hindi text-[16px] sm:text-lg text-white/90 mt-2.5 leading-[1.75] font-medium tracking-wide">
                      {pillar.descriptionHindi}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border-tan/40 flex items-center justify-between">
                  <span className="text-[10px] text-muted-tan font-bold uppercase tracking-wider">
                    QUALITY ASSURANCE
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#ff7a00] font-mono">
                    {pillar.badgeText}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Navigation Arrows */}
        <div className="flex md:hidden items-center justify-center space-x-4 mb-20">
          <button 
            onClick={() => scroll('left')}
            className="p-3 bg-brand-coral/10 hover:bg-brand-coral/20 border border-brand-coral/30 rounded-full text-brand-coral transition-colors active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-3 bg-brand-coral/10 hover:bg-brand-coral/20 border border-brand-coral/30 rounded-full text-brand-coral transition-colors active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Regulatory & Ethical Trust Badges Strip Restructured to reflect EdTech Certifications */}
        <div className="mt-12 bg-border-tan/20 rounded-2xl border border-border-tan p-4 sm:px-6 flex flex-wrap items-center justify-center gap-6 text-center text-xs text-muted-tan font-medium">
          <span className="flex items-center">
            <ShieldCheck className="w-4 h-4 text-live-green mr-1.5 shrink-0" />
            100% Verified Project Links
          </span>
          <span className="text-border-tan hidden sm:inline">|</span>
          <span className="flex items-center">
            <ShieldCheck className="w-4 h-4 text-live-green mr-1.5 shrink-0" />
            Online certificates sent to your email
          </span>
          <span className="text-border-tan hidden sm:inline">|</span>
          <span className="flex items-center">
            <CheckCircle2 className="w-4 h-4 text-live-green mr-1.5 shrink-0" />
            Active Peer Group Access
          </span>
          <span className="text-border-tan hidden sm:inline">|</span>
          <span className="flex items-center">
            <CheckCircle2 className="w-4 h-4 text-live-green mr-1.5 shrink-0" />
            Access to recorded classes forever
          </span>
        </div>

      </div>
    </section>
  );
}
