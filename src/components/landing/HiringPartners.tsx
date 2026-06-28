import React, { useState } from 'react';
import { motion } from 'motion/react';
import InstructorApplicationForm from './InstructorApplicationForm';

const PARTNERS = [
  'PhonePe',
  'Paytm',
  'Unacademy',
  'Upgrad',
  'Zerodha',
  'Byju\'s',
  'Razorpay',
  'OLA',
  'Swiggy',
  'Cred',
  'Zoho',
  'BAN Company'
];

export default function HiringPartners() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [instructorFormOpen, setInstructorFormOpen] = useState(false);

  return (
    <section className="relative pt-20 pb-4 sm:pt-28 lg:pt-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 -z-10" />

      {/* Animated Gradient Orbs */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -50, 100, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 100, -50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear', delay: 2 }}
        className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, 50, -100, 0],
          y: [0, -100, 50, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear', delay: 4 }}
        className="absolute top-1/2 right-1/4 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-24"
        >
          <div className="inline-block mb-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-400/50 rounded-full backdrop-blur-md"
            >
              <span className="text-sm font-bold text-blue-300">Trusted By Industry Leaders</span>
            </motion.div>
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Our Graduates
            </span>
            <br />
            <span>Thrive at Top Companies</span>
          </h2>

          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
            Join a community of successful learners working at India's most innovative and valuable companies
          </p>
        </motion.div>

        {/* Bento Grid Layout - sliding on mobile, grid on desktop */}
        <div className="flex md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16 overflow-x-auto md:overflow-visible pb-6 md:pb-0 hide-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
          {PARTNERS.map((partner, index) => {
            const isLarge = index === 0 || index === 5 || index === 10;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: (index % 3) * 0.1,
                  ease: 'easeOut'
                }}
                className={`group relative cursor-pointer shrink-0 w-[180px] sm:w-[240px] md:w-auto snap-center ${isLarge ? 'md:col-span-1 lg:col-span-1' : ''}`}
              >
                {/* Outer Glow Container */}
                <motion.div
                  animate={{
                    boxShadow: hoveredIndex === index
                      ? ['0 0 0 0px rgba(59, 130, 246, 0)', '0 0 0 20px rgba(59, 130, 246, 0.1)']
                      : '0 0 0 0px rgba(59, 130, 246, 0)'
                  }}
                  transition={{ duration: 0.6 }}
                  className="relative h-full"
                >
                  {/* Main Card */}
                  <motion.div
                    onHoverStart={() => setHoveredIndex(index)}
                    onHoverEnd={() => setHoveredIndex(null)}
                    whileHover={{
                      y: -8,
                      scale: 1.02,
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="relative h-full min-h-[100px] sm:min-h-[130px] rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 group"
                  >
                    {/* Gradient Background Base */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-100 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Animated Gradient Overlay on Hover */}
                    <motion.div
                      animate={{
                        background: hoveredIndex === index
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))'
                          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(168, 85, 247, 0.05))'
                      }}
                      className="absolute inset-0 transition-all duration-300"
                    />

                    {/* Border Gradient */}
                    <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-blue-400/50 transition-all duration-300" />

                    {/* Content Container */}
                    <div className="relative h-full p-4 sm:p-5 flex flex-col items-center justify-center text-center z-10">
                      {/* Animated Background Shapes */}
                      <motion.div
                        animate={{
                          rotate: hoveredIndex === index ? 180 : 0,
                          scale: hoveredIndex === index ? 1.2 : 1,
                        }}
                        transition={{ duration: 0.6 }}
                        className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-md pointer-events-none"
                      />

                      {/* Company Name */}
                      <motion.h3
                        animate={{
                          scale: hoveredIndex === index ? 1.1 : 1,
                          color: hoveredIndex === index ? '#93c5fd' : '#ffffff'
                        }}
                        transition={{ duration: 0.3 }}
                        className="text-base sm:text-lg font-black relative z-10"
                      >
                        {partner}
                      </motion.h3>

                      {/* Bottom Accent Line */}
                      <motion.div
                        animate={{
                          width: hoveredIndex === index ? '100%' : '40%',
                          opacity: hoveredIndex === index ? 1 : 0.5
                        }}
                        transition={{ duration: 0.3 }}
                        className="h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full mt-2"
                      />
                    </div>

                    {/* Floating Particles Effect */}
                    {hoveredIndex === index && (
                      <>
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{
                              x: Math.random() * 100 - 50,
                              y: Math.random() * 100 - 50,
                              opacity: 1,
                              scale: 1
                            }}
                            animate={{
                              x: Math.random() * 200 - 100,
                              y: Math.random() * 200 - 100,
                              opacity: 0,
                              scale: 0
                            }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="absolute w-2 h-2 bg-blue-400 rounded-full pointer-events-none"
                            style={{
                              top: '50%',
                              left: '50%',
                              marginTop: '-4px',
                              marginLeft: '-4px'
                            }}
                          />
                        ))}
                      </>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats at Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 grid grid-cols-3 gap-4 text-center"
        >
          <div>
            <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              12+
            </p>
            <p className="text-white/70 text-sm mt-2">Companies</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              10K+
            </p>
            <p className="text-white/70 text-sm mt-2">Graduates Hired</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              5x
            </p>
            <p className="text-white/70 text-sm mt-2">Salary Growth</p>
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
