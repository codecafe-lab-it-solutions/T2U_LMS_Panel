import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Video, Users, Trophy, Clock, Award, Zap } from 'lucide-react';

const FEATURES = [
  {
    id: 1,
    icon: CheckCircle,
    image: '/images/assesement.png',
    title: 'Quiz & Assessments',
    description: 'Regular quizzes and assessments to test your knowledge and skills',
    benefit: 'Track progress and identify improvement areas'
  },
  {
    id: 2,
    icon: Video,
    image: '/video-lesson.png',
    title: 'Video Lessons',
    description: 'High-quality video lessons taught by industry experts',
    benefit: 'Learn at your own pace with crystal-clear explanations'
  },
  {
    id: 3,
    icon: Users,
    image: '/images/mentorship.png',
    title: 'Mentorship',
    description: 'One-on-one guidance from experienced mentors',
    benefit: 'Get personalized feedback and career guidance'
  },
  {
    id: 4,
    icon: Trophy,
    image: '/images/awards.png',
    title: 'Leaderboards',
    description: 'Compete with peers and track your position',
    benefit: 'Stay motivated with friendly competition'
  },
  {
    id: 5,
    icon: Clock,
    image: '/images/time.png',
    title: 'Flexible Timing',
    description: 'Learn whenever and wherever you want',
    benefit: 'Balance learning with your schedule'
  },
  {
    id: 6,
    icon: Award,
    image: '/images/certificates.png',
    title: 'Certificates',
    description: 'Earn verifiable certificates upon completion',
    benefit: 'Showcase your achievements to employers'
  }
];

interface FeaturesProps {
  onGetStarted?: () => void;
}

export default function Features({ onGetStarted }: FeaturesProps) {
  return (
    <section className="pt-12 pb-4 bg-[#12031e] text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 px-4 py-2 rounded-full mb-4">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400">What We Deliver</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Our comprehensive learning platform includes all the tools, guidance, and support you need to master your skills and advance your career.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="flex md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 overflow-x-auto md:overflow-visible hide-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-6 md:pb-0">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            // Elegant, muted gradients
            const gradients = [
              'from-blue-700/80 via-blue-600/70 to-cyan-700/75',
              'from-purple-700/80 via-purple-600/70 to-pink-700/75',
              'from-orange-700/80 via-orange-600/70 to-pink-700/75',
              'from-yellow-700/80 via-orange-700/70 to-orange-800/75',
              'from-pink-700/80 via-purple-700/70 to-pink-800/75',
              'from-blue-700/80 via-purple-700/70 to-pink-800/75'
            ];

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative shrink-0 w-[280px] sm:w-[320px] md:w-auto snap-center"
              >
                {/* Card with gradient border effect */}
                <div className={`relative overflow-hidden flex flex-col justify-between bg-gradient-to-br ${gradients[index % 6]} border border-white/30 hover:border-white/60 rounded-3xl h-full transition-all duration-300 hover:shadow-2xl hover:shadow-white/30 backdrop-blur-sm`}>
                  
                  {/* Top portion containing image (if any) and details */}
                  <div className="relative p-8 pb-4 flex-1">
                    {feature.image && (
                      <>
                        <img 
                          src={feature.image} 
                          alt={feature.title} 
                          className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-105 opacity-75" 
                        />
                        {/* Soft overall tint overlay */}
                        <div className="absolute inset-0 bg-black/10 z-10" />
                      </>
                    )}

                    {/* Content wrapper */}
                    <div className="relative z-20">
                      {/* Icon container - only if no background image is present */}
                      {!feature.image && (
                        <div className="mb-6">
                          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-orange-500/50 transition-all duration-300">
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                        </div>
                      )}

                      <h3 
                        className="text-xl font-bold text-white mb-3"
                        style={feature.image ? { textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.95), 0 0 20px rgba(0, 0, 0, 0.6)' } : undefined}
                      >
                        {feature.title}
                      </h3>
                      <p 
                        className="text-sm text-white mb-4 font-semibold leading-relaxed"
                        style={feature.image ? { textShadow: '0 2px 8px rgba(0, 0, 0, 0.95), 0 1px 2px rgba(0, 0, 0, 0.95), 0 0 15px rgba(0, 0, 0, 0.6)' } : undefined}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Benefit highlight (Bottom portion) */}
                  <div className="px-8 pb-8 pt-4 border-t border-white/10 relative z-20 bg-black/20">
                    <p className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      {feature.benefit}
                    </p>
                  </div>

                  {/* Hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-purple-500/0 group-hover:from-orange-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300 pointer-events-none z-10" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-white/70 mb-4">Ready to start your learning journey?</p>
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/40"
          >
            Get Started Now
          </button>
        </motion.div>
      </div>
    </section>
  );
}
