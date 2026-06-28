import React from 'react';
import { motion } from 'motion/react';
import {
  Terminal,
  Layers,
  Workflow,
  Briefcase,
  Database,
  Settings,
  Cpu
} from 'lucide-react';

export default function FrappeAdmin() {
  const adminBentoGrid = [
    {
      title: "Recorded Videos & Lessons",
      desc: "High-quality video content library with interactive timestamps, chapter markers, and searchable transcripts to track learner engagement and progress.",
      descHindi: "हाई-क्वालिटी वीडियो लाइब्रेरी जिसमें इंटरैक्टिव टाइमस्टैम्प्स, चैप्टर मार्कर्स और ट्रांसक्रिप्ट्स मौजूद हैं। स्टूडेंट्स की प्रोग्रेस आसानी से ट्रैक करें।",
      spec: "HD streaming · 4K available · Offline download support"
    },
    {
      title: "Assessments & Quizzes",
      desc: "Comprehensive assessment framework with auto-grading, instant feedback loops, multi-format questions, and performance analytics.",
      descHindi: "ऑटो-ग्रेडिंग और इंस्टेंट फीडबैक के साथ शानदार असेसमेंट सिस्टम। आपकी स्किल के हिसाब से एडजस्ट होने वाले क्विज़ और डिटेल्ड एनालिटिक्स शामिल हैं।",
      spec: "Real-time scoring · Progress tracking · Instant feedback"
    },
    {
      title: "Certificates & Credentials",
      desc: "Industry-recognized digital certificates with secure templates that can't be faked, and automated issuance on course completion.",
      descHindi: "पूरी तरह सिक्योर और इंडस्ट्री-रिकॉग्नाइज्ड डिजिटल सर्टिफिकेट्स। कोर्स पूरा होते ही लिंक्डइन और पोर्टफोलियो के लिए ऑटोमैटिक सर्टिफिकेट जनरेशन।",
      spec: "Blockchain verified · LinkedIn integration · Online certificates and awards"
    },
    {
      title: "Expert Teaching Opportunities",
      desc: "Join our network as an instructor if you have domain expertise. Share your knowledge, earn competitive commission, and build your personal brand.",
      descHindi: "अगर आपके पास किसी फील्ड की नॉलेज है, तो हमारे इंस्ट्रक्टर नेटवर्क से जुड़ें। अपना ज्ञान बांटें, अच्छा कमीशन कमाएं और स्टूडेंट्स को मेंटर करें।",
      spec: "Flexible schedule · High commission · Brand building"
    }
  ];

  return (
    <section id="b2b" className="pt-4 pb-24 bg-warm-cream text-dark-charcoal scroll-mt-12 bg-dot-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs uppercase font-extrabold tracking-widest text-brand-mustard bg-brand-mustard/10 border border-brand-mustard/20 px-3 py-1 rounded-full">
            Under the Hood
          </span>
          <h2 className="text-3xl sm:text-5xl font-sans font-bold text-dark-charcoal tracking-tight mt-4">
            One dashboard. Total control.
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-tan mt-4 leading-relaxed">
            T2U's Strong technology system that powers the platform is proudly powered by the robust, Built for people who create technology **A powerful, trusted software platform** — Proven to work well in real situations, completely customizable, and engineered from the ground up for high-scale enterprise operations.
          </p>
        </div>

        {/* 2x2 Bento Feature grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminBentoGrid.map((block, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="bg-near-black/60 border border-border-tan rounded-[28px] p-6 sm:p-8 hover:bg-near-black hover:border-brand-mustard/40 transition-all duration-300 shadow-xl flex flex-col"
            >
              <div className="flex items-center space-x-3.5 mb-4">
                <div className="p-2 bg-brand-mustard/10 text-brand-mustard rounded-lg">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-sans text-dark-charcoal">
                  {block.title}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-muted-tan leading-relaxed mb-3">
                {block.desc}
              </p>

              {block.descHindi && (
                <p className="font-hindi text-[15px] sm:text-base text-white/95 font-medium leading-[1.75] tracking-wide mb-6">
                  {block.descHindi}
                </p>
              )}

              <div className="pt-4 border-t border-border-tan flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between text-[10px] font-mono text-brand-mustard font-bold mt-auto">
                <span>SPECIFICATIONS</span>
                <span className="text-left sm:text-right">{block.spec}</span>
              </div>
            </motion.div>
          ))}
        </div>


      </div>
    </section>
  );
}
