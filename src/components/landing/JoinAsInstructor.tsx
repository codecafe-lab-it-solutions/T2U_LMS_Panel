import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Users, Zap, TrendingUp, Award, ArrowRight } from 'lucide-react';
import InstructorApplicationForm from './InstructorApplicationForm';

export default function JoinAsInstructor() {
  const [instructorFormOpen, setInstructorFormOpen] = useState(false);

  const benefits = [
    {
      icon: BookOpen,
      title: 'Share Your Knowledge',
      description: 'Create and deliver high-quality courses to learners worldwide'
    },
    {
      icon: TrendingUp,
      title: 'Earn Significantly',
      description: 'Competitive commission on every course enrollment and student success'
    },
    {
      icon: Users,
      title: 'Build Your Brand',
      description: 'Establish authority and credibility in your field of expertise'
    },
    {
      icon: Zap,
      title: 'Flexible Schedule',
      description: 'Work at your own pace with full control over content and timing'
    },
    {
      icon: Award,
      title: 'Premium Support',
      description: 'Get marketing, technical, and educational support from our team'
    },
    {
      icon: Users,
      title: 'Growing Community',
      description: 'Connect with thousands of engaged learners and fellow instructors'
    }
  ];

  return (
    <section className="py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-300/50 px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-purple-300" />
            <span className="text-sm font-bold text-purple-300">Join Our Team</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            Do You Have Great Knowledge?
          </h2>

          <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Got expertise in ANY skill? Teach it. Whether you teach yoga, cooking, music, coding, fitness, or business skills — if you're an expert, you belong here. Share your knowledge with millions, create meaningful educational content, build your personal brand, and earn excellent income while making a real impact.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-lg hover:shadow-xl hover:border-purple-300 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl px-4 py-10 sm:p-14 lg:p-16 text-center text-white"
        >
          <h3 className="text-3xl sm:text-4xl font-black mb-4">
            Ready to Become an Instructor?
          </h3>
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
            Start creating impactful courses today and join thousands of instructors who are earning excellent income while helping learners achieve their goals.
          </p>
          <motion.button
            type="button"
            onClick={() => setInstructorFormOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="bg-white hover:bg-gray-100 text-purple-600 font-bold px-5 sm:px-10 py-3 sm:py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2 text-sm sm:text-lg cursor-pointer whitespace-nowrap"
          >
            <span>Become an Instructor</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </motion.button>
        </motion.div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16 flex justify-center"
        >
          <div className="relative inline-block px-8 max-w-3xl">
            <span className="absolute top-[-1.5rem] left-0 text-5xl font-black text-white font-serif leading-none">"</span>
            <p className="text-white/80 text-lg font-medium leading-relaxed italic">
              Our instructor onboarding process is simple, fast, and designed to get you up and running within days. We provide all the tools and support you need.
            </p>
            <span className="absolute bottom-[-2.5rem] right-0 text-5xl font-black text-white font-serif leading-none">"</span>
          </div>
        </motion.div>

        {/* Instructor Application Form Modal */}
        <InstructorApplicationForm
          isOpen={instructorFormOpen}
          onClose={() => setInstructorFormOpen(false)}
        />
      </div>
    </section>
  );
}
