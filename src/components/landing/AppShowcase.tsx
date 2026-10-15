import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Smartphone,
  Radio,
  Wallet,
  Users,
  Award,
  Video,
  BookOpen,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Download,
  Percent,
  Play,
  RotateCw,
  BellRing,
  ClipboardList,
  ShoppingBag
} from 'lucide-react';
import Logo from './Logo';

const ZoomLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0">
    <circle cx="12" cy="12" r="12" fill="#2D8CFF"/>
    <path d="M14.5 9h-7C6.67 9 6 9.67 6 10.5v3C6 14.33 6.67 15 7.5 15h7c.83 0 1.5-.67 1.5-1.5v-3c0-.83-.67-1.5-1.5-1.5z" fill="white"/>
    <path d="M17.5 10.5l3-2v7l-3-2v-3z" fill="white"/>
  </svg>
);

const WhatsAppLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0">
    <path fill="#25D366" d="M12.01 2.01c-5.52 0-10 4.48-10 10 0 1.95.56 3.77 1.54 5.31L2.03 22l4.81-1.26c1.51.92 3.28 1.45 5.17 1.45 5.52 0 10-4.48 10-10s-4.48-10-10-10z"/>
    <path fill="white" d="M17.47 14.61c-.27-.14-1.61-.8-1.86-.89-.25-.09-.44-.14-.62.14-.18.27-.71.89-.87 1.07-.16.18-.31.2-.58.06-.27-.14-1.15-.43-2.19-1.35-.81-.72-1.36-1.61-1.52-1.89-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.14-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.06-.14-.62-1.5-.85-2.05-.22-.54-.45-.47-.62-.48-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.98 2.67 1.12 2.85.14.18 1.94 2.96 4.71 4.16.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.61-.66 1.84-1.3.23-.64.23-1.19.16-1.3-.07-.11-.25-.18-.52-.31z"/>
  </svg>
);

const QuizIcon = () => (
  <div className="bg-purple-100 text-purple-600 rounded-[10px] shrink-0 h-8 w-8 flex items-center justify-center font-bold">
    <ClipboardList className="w-4 h-4" />
  </div>
);

const CertIcon = () => (
  <div className="bg-amber-100 text-amber-600 rounded-[10px] shrink-0 h-8 w-8 flex items-center justify-center font-bold">
    <Award className="w-4 h-4" />
  </div>
);

const StoreIcon = () => (
  <div className="bg-blue-100 text-blue-600 rounded-[10px] shrink-0 h-8 w-8 flex items-center justify-center font-bold">
    <ShoppingBag className="w-4 h-4" />
  </div>
);

const WalletIconComponent = () => (
  <div className="bg-emerald-100 text-emerald-600 rounded-[10px] shrink-0 h-8 w-8 flex items-center justify-center font-bold">
    <Wallet className="w-4 h-4" />
  </div>
);

export default function AppShowcase() {

  const appFeatures = [
    { title: "Live Zoom classes", desc: "One-tap secure join, automatically authenticated into your batch.", icon: <ZoomLogo /> },
    { title: "Module-wise quizzes", desc: "Interactive learning tests + instant assessment rankings.", icon: <QuizIcon /> },
    { title: "Auto-generated certificates", desc: "Deploy internationally valid PDF certificates instantly.", icon: <CertIcon /> },
    { title: "In-App e-commerce store", desc: "Buy printed books and study materials, courses, and Marketing items like posters and banners.", icon: <StoreIcon /> },
    { title: "Wallet that tracks all your referral earnings", desc: "See all your earnings - from people you've referred and from your own work.", icon: <WalletIconComponent /> },
    { title: " automatic WhatsApp and app notifications", desc: "Instant updates about your earnings and classes on commissions and lectures.", icon: <WhatsAppLogo /> }
  ];


  return (
    <section id="app" className="pt-12 pb-24 bg-white bg-dot-pattern-dark border-t border-gray-200 text-black scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Block: Title & checklist */}
          <div className="lg:col-span-8 space-y-8">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-brand-coral bg-brand-coral/10 px-3 py-1 rounded-full">
                Native App Experience
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-sans font-bold text-black tracking-tight mt-4 pb-3 border-b border-brand-coral/25 max-w-3xl">
                Your entire upgrade journey, in your pocket.
              </h2>
              <p className="text-base sm:text-lg text-black/80 mt-5 leading-relaxed max-w-2xl">
                T2U is fully optimized for android and iOS. Enjoy seamless live zoom streaming, quick assessments, dynamic wallet payouts, and chat channels.
              </p>
            </div>

            {/* Unified Feature Box */}
            <div className="bg-[#0f172a] border border-slate-800 p-6 sm:p-8 rounded-[32px] shadow-lg shadow-slate-900/20 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {appFeatures.map((feat, index) => (
                  <div key={index} className="flex gap-2.5 items-start bg-white p-3.5 rounded-[16px] shadow-sm border border-brand-coral/5 hover:shadow-md hover:border-brand-coral/20 transition-all">
                    {feat.icon}
                    <div>
                      <h4 className="text-[13px] font-extrabold text-black leading-tight">{feat.title}</h4>
                      <p className="text-[11px] font-medium text-gray-700 mt-1 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* App Store Links */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border-tan/30">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('download-app');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else window.open('https://play.google.com/store', '_blank');
                }}
                className="bg-near-black text-[#ffffff] border border-border-tan hover:bg-near-black/85 hover:border-brand-mustard/40 text-[11px] font-sans font-bold px-5 py-3 rounded-xl flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
              >
                <svg className="w-6 h-6 text-brand-mustard" viewBox="0 0 512 512" fill="currentColor">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                </svg>
                <div className="text-left font-mono leading-tight">
                  <span className="text-[8px] font-sans text-white/50 block font-normal uppercase leading-none">Download on</span>
                  Google Play Store
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('download-app');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else window.open('https://www.apple.com/app-store/', '_blank');
                }}
                className="bg-near-black text-[#ffffff] border border-border-tan hover:bg-near-black/85 hover:border-white/40 text-[11px] font-sans font-bold px-5 py-3 rounded-xl flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
              >
                <svg className="w-6 h-6 text-white" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                <div className="text-left font-mono leading-tight">
                  <span className="text-[8px] font-sans text-white/50 block font-normal uppercase leading-none">Download on</span>
                  Apple App Store
                </div>
              </button>
            </div>
          </div>

          {/* Right Block: Pure CSS Smartphone mockup simulator */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-full max-w-[300px] aspect-[9/16] sm:aspect-[9/17] bg-[#121212] rounded-[44px] p-3 border-[6px] border-[#1E202E] shadow-2xl relative flex flex-col justify-between overflow-hidden">

              {/* Dynamic camera notch cutout */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-[#1E202E] rounded-b-2xl z-40 flex items-center justify-around px-4">
                <div className="w-2.5 h-2.5 bg-neutral-800 rounded-full" />
                <div className="w-16 h-1 bg-neutral-800 rounded-full" />
                <div className="w-2.5 h-2.5 bg-indigo-900 rounded-full" />
              </div>

              {/* Screens content block */}
              <div className="w-full h-full bg-white rounded-[36px] overflow-hidden pt-7 pb-12 flex flex-col items-center justify-center relative shadow-inner border border-gray-100">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                  className="flex flex-col items-center justify-center w-full px-6"
                >
                  <img
                    src="/images/logo-dark.png"
                    alt="T2U Logo"
                    width={200}
                    height={60}
                    loading="lazy"
                    className="w-full h-auto object-contain max-w-[200px]"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
