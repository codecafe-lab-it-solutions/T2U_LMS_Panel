import React from 'react';
import { motion } from 'motion/react';
import { Smartphone, Star, ShieldCheck, Zap, QrCode } from 'lucide-react';

export default function DownloadApp() {
  return (
    <section id="download-app" className="py-16 bg-white bg-dot-pattern-dark text-black relative overflow-hidden">
      {/* Dynamic graphic radial glow decoration background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-coral/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#8b5cf6]/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-br from-near-black to-warm-cream rounded-[40px] border-[1.5px] border-gray-300 card-border-strong p-6 sm:p-8 lg:p-10 shadow-2xl shadow-gray-300/20 relative overflow-hidden">
          {/* Subtle grid pattern overlay inside the box */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] rounded-[40px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Block: Engaging app stats and messaging */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <span className="inline-flex items-center space-x-2 bg-brand-coral/20 border border-brand-coral/30 text-brand-coral text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
                  <Star className="w-4 h-4 fill-current text-brand-mustard" />
                  <span>Now Live on Android & iOS</span>
                </span>

                <h2 className="text-3xl sm:text-5xl font-sans font-black text-white tracking-tight mt-6 leading-tight">
                  Upgrade On The Go. <br />
                  <span className="text-brand-coral">Download the T2U App</span>
                </h2>

                <p className="text-base sm:text-lg text-slate-300 mt-6 leading-relaxed max-w-xl">
                  Take control of your learning and earning journey. Access live webinars, interact with India's best coaches, track automated direct/downline ledger payouts, and transact secure UPI withdrawals with one click.
                </p>
              </div>

              {/* Unique selling points inside the application download center */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-0">
                <div className="flex items-start space-x-3.5 bg-near-black/40 border-[1px] border-white/35 hover:border-white/55 transition-colors p-4 rounded-2xl">
                  <div className="p-2 bg-brand-coral/10 text-brand-coral rounded-xl shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Classrooms & LMS</h4>
                    <p className="text-xs text-slate-400 mt-1">One-click Zoom login with offline study files downloading support.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5 bg-near-black/40 border-[1px] border-white/35 hover:border-white/55 transition-colors p-4 rounded-2xl">
                  <div className="p-2 bg-[#8b5cf6]/10 text-[#a78bfa] rounded-xl shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Secure UPI Ledger</h4>
                    <p className="text-xs text-slate-400 mt-1">Auto TDS computations, Instant KYC, and lightning-fast direct transfers.</p>
                  </div>
                </div>
              </div>

              {/* Official Store Badges Download CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download T2U on Google Play"
                  className="bg-white text-near-black hover:bg-slate-100 px-6 py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl group border border-slate-200 cursor-pointer"
                >
                  <svg className="w-7 h-7 text-[#00e676]" viewBox="0 0 512 512" fill="currentColor">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                  </svg>
                  <div className="text-left leading-tight">
                    <span className="text-[9px] text-slate-500 block uppercase font-medium leading-none">GET IT ON</span>
                    <span className="text-sm font-sans font-black tracking-tight text-near-black">Google Play</span>
                  </div>
                </a>

                <a
                  href="https://www.apple.com/app-store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download T2U on Apple App Store"
                  className="bg-white text-near-black hover:bg-slate-100 px-6 py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl group border border-slate-200 cursor-pointer"
                >
                  <svg className="w-7 h-7 text-near-black" viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  <div className="text-left leading-tight">
                    <span className="text-[9px] text-slate-500 block uppercase font-medium leading-none">Download on the</span>
                    <span className="text-sm font-sans font-black tracking-tight text-near-black">App Store</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Right Block: Instant QR Code & App Mascot Banner */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="bg-[#1e1f29] border border-border-tan/35 rounded-3xl p-8 max-w-[325px] w-full text-center relative shadow-2xl">
                {/* Visual badge highlight */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-mustard text-near-black text-[9px] font-mono font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                  Secure Quick Scan
                </div>

                {/* Stylized Simulated QR Code Area */}
                <div className="bg-white p-4 rounded-2xl inline-block mt-2 relative">
                  <QrCode className="w-40 h-40 text-near-black" strokeWidth={1.5} />

                  {/* T2U micro centered symbol in QR */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#12131c] text-[#ff7a00] text-[10px] font-sans font-black px-2 py-1 rounded border border-border-tan">
                    T2U
                  </div>
                </div>

                <div className="mt-5 space-y-1.5">
                  <h4 className="text-sm font-bold text-white">Scan to Install</h4>
                  <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                    Point your smartphone camera at this secure QR code to install T2U APK or App direct link immediately.
                  </p>
                </div>

                {/* Rating stats */}
                <div className="mt-6 pt-5 border-t border-border-tan/20 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-lg font-black text-brand-mustard font-mono">4.9 ★</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mt-0.5">Average Rating</span>
                  </div>
                  <div>
                    <span className="text-lg font-black text-white font-mono">100K+</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mt-0.5">Indian Learners</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
