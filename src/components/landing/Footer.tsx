import React from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';
import { navigatePublic } from '../../lib/publicRoutes';
import {
  ArrowRight,
  Linkedin,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  PhoneCall,
  MapPin,
  Sparkles,
  GraduationCap,
  UsersRound,
  ArrowUpRight
} from 'lucide-react';

interface FooterProps {
  onOpenEnrollModal: () => void;
  onOpenInstructorModal: () => void;
  onOpenBusinessModal: () => void;
  onNavigateToContent: (page: any) => void;
  onNavigateToProducts?: () => void;
  showCTAs?: boolean;
}

export default function Footer({
  onOpenEnrollModal,
  onOpenInstructorModal,
  onOpenBusinessModal,
  onNavigateToContent,
  onNavigateToProducts,
  showCTAs = true
}: FooterProps) {

  const b2bCards = [
    {
      title: "Corporate Training",
      desc: "Custom training groups for your company for your staffing needs. Scaling from 10 to 1000 employees with Track each employee's learning progress."
    },
    {
      title: "Talent Hiring Pools",
      desc: "Acquire Skilled learners who've completed real projects across five Important skills for digital jobs instantly."
    },
    {
      title: "Channel Partnerships",
      desc: "Enroll as a Official partner who refers people in your area and unlock Special profit-sharing plan for your company."
    }
  ];

  return (
    <>
      {showCTAs && (
        <>
          {/* 1. Become an Instructor recruitment CTA banner */}
          <section className="py-20 bg-warm-cream border-t border-b border-border-tan">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[40px] bg-gradient-to-br from-brand-mustard/20 via-brand-coral/10 to-brand-coral/30 border border-brand-coral/35 p-8 sm:p-12 lg:p-16 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-coral/10 rounded-full blur-3xl pointer-events-none" />
                {/* Decorative Twinkling Star at right corner */}
                <div className="absolute top-8 right-8 twinkle-star hidden md:block pointer-events-none">
                  <svg className="w-16 h-16 sm:w-24 sm:h-24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>

                <div className="relative z-10 max-w-3xl space-y-6">
                  <span className="text-sm uppercase font-extrabold tracking-widest text-white bg-white/10 px-3.5 py-1.5 rounded-full inline-block border border-white/30">
                    ★ Join the Faculty Node
                  </span>

                  <h2 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-extrabold text-white leading-tight">
                    Got 5+ years of experience? Teach. Earn. Inspire.
                  </h2>

                  <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
                    Join our roster of 50+ practitioners teaching the next generation of builders. Host live classes, set your own modules, earn generous educator royalties on cohort sizes, and build an audience of learners.
                  </p>

                  <div className="pt-4">
                    <button
                      onClick={onOpenInstructorModal}
                      className="bg-near-black text-white hover:bg-near-black/90 font-bold px-8 py-3.5 rounded-full text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2 transition-all transition-transform active:scale-[0.98]"
                    >
                      <span>Apply as an Instructor</span>
                      <ArrowRight className="w-4 h-4 text-brand-mustard" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* 2. For Business (B2B Strips) */}
          <section id="business" className="py-24 bg-near-black text-white scroll-mt-12 bg-dot-pattern">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              <div className="max-w-3xl mb-16">
                <span className="text-sm uppercase font-extrabold tracking-widest text-[#ff7a00] bg-[#ff7a00]/20 border border-[#ff7a00]/30 px-3.5 py-1.5 rounded-full inline-block">
                  B2B Enterprise Node
                </span>
                <h2 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-bold text-white tracking-tight mt-4">
                  Train your team. Hire from us. Grow with us.
                </h2>
                <p className="text-base sm:text-lg text-white/70 mt-3 leading-relaxed">
                  Work together to train and hire skilled people for Modern companies that want to grow, recruitment networks, and marketing agencies.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {b2bCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="bg-warm-cream border-[1px] border-white/35 card-border-strong rounded-3xl p-6 sm:p-8 space-y-4 hover:border-white/55 hover:shadow-lg hover:shadow-white/20 transition-all duration-300"
                  >
                    <div className="p-2 w-max bg-brand-coral/10 rounded-xl text-brand-coral">
                      <span className="text-xs font-mono font-black">0{idx + 1}</span>
                    </div>
                    <h3 className="font-bold text-base text-white">{card.title}</h3>
                    <p className="text-sm text-white/70 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>

              <div className="text-center md:text-left">
                <button
                  onClick={onOpenBusinessModal}
                  className="bg-brand-coral hover:bg-brand-coral/90 text-white font-bold px-8 py-4 rounded-full text-xs sm:text-sm uppercase tracking-wider inline-flex items-center space-x-2 transition-all shadow-xl shadow-brand-coral/15"
                >
                  <span>Talk to our Business Team</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>

            </div>
          </section>

          {/* 3. Final Massive CTA section */}
          <section className="py-28 bg-near-black text-white border-t border-b border-border-tan relative overflow-hidden text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-coral/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-8">
              <span className="text-sm uppercase tracking-widest text-[#10b981] bg-[#10b981]/20 px-4.5 py-2 rounded-full font-sans font-bold inline-block border border-[#10b981]/30">
                ★ LIMITLESS UPGRADES INCENTIVES
              </span>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-sans font-extrabold text-white leading-tight">
                Time to upgrade your
                <span className="block bg-gradient-to-r from-brand-mustard via-brand-yellow to-brand-mustard bg-clip-text text-transparent">
                  skills, income & life.
                </span>
              </h2>

              <div className="pt-4 flex flex-col items-center justify-center space-y-4">
                <button
                  onClick={onOpenEnrollModal}
                  className="w-full sm:w-auto bg-brand-coral hover:bg-brand-coral/95 text-white font-bold px-10 py-5 rounded-full text-sm sm:text-base uppercase tracking-wider flex items-center justify-center space-x-2 shadow-2xl shadow-brand-coral/40 transform hover:scale-[1.03] duration-150"
                >
                  <span>Start Your T2U Journey</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 4. Multi-column compliance footer */}
      <footer className="bg-[#12031e] text-white pt-16 pb-10 border-t border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Top block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pb-16 border-b border-purple-900/30 items-start">
            {/* Left columns */}
            <div className="lg:col-span-3 space-y-5">
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); onNavigateToContent('home'); }}
                className="inline-block transition-opacity hover:opacity-90 cursor-pointer"
                aria-label="T2U Homepage"
              >
                <Logo size="sm" />
              </a>
              <p className="text-xs text-white/70 leading-relaxed max-w-xs">
                India's all-in-one learn, sell, e-commerce, and one place to track all your referral earnings. Fully compliant and audited.
              </p>

              {/* Social Widgets */}
              <div className="flex items-center space-x-3 pt-2">
                <a
                  href="https://www.linkedin.com/company/t2upgrade"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="T2U LinkedIn"
                  className="p-2 bg-near-black text-white hover:text-brand-coral hover:bg-border-tan rounded-full transition-all"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://www.youtube.com/@t2upgrade"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="T2U YouTube Channel"
                  className="p-2 bg-near-black text-white hover:text-brand-coral hover:bg-border-tan rounded-full transition-all"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com/t2upgradepvt.ltd?mdxt=MXEwY3U3enhiZDIzNQ%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="T2U Instagram"
                  className="p-2 bg-near-black text-white hover:text-brand-coral hover:bg-border-tan rounded-full transition-all"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://www.facebook.com/share/1NCKyt5FUj/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="T2U Facebook"
                  className="p-2 bg-near-black text-white hover:text-brand-coral hover:bg-border-tan rounded-full transition-all"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/919269488028"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-near-black text-white hover:text-brand-coral hover:bg-border-tan rounded-full transition-all"
                  aria-label="Chat on WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.855.002-2.632-1.023-5.105-2.887-6.97C16.582 1.964 14.113.94 11.48.94c-5.44 0-9.866 4.42-9.869 9.858-.002 1.8.48 3.56 1.394 5.147L2.004 22l6.059-1.59-1.416-.846zM17.47 14.61c-.27-.14-1.61-.8-1.86-.89-.25-.09-.44-.14-.62.14-.18.27-.71.89-.87 1.07-.16.18-.31.2-.58.06-.27-.14-1.15-.43-2.19-1.35-.81-.72-1.36-1.61-1.52-1.89-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.14-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.06-.14-.62-1.5-.85-2.05-.22-.54-.45-.47-.62-.48-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.98 2.67 1.12 2.85.14.18 1.94 2.96 4.71 4.16.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.61-.66 1.84-1.3.23-.64.23-1.19.16-1.3-.07-.11-.25-.18-.52-.31z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com/t2upgrade"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="T2U Twitter / X"
                  className="p-2 bg-near-black text-white hover:text-brand-coral hover:bg-border-tan rounded-full transition-all"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Links Columns Grid */}
            <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Col 1 */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-mono uppercase font-bold text-white tracking-widest">
                  Programs
                </h4>
                <ul className="space-y-2.5 text-xs text-white/70">
                  <li>
                    <a
                      href="/courses?category=Spoken%20English"
                      onClick={(e) => { e.preventDefault(); navigatePublic('/courses?category=' + encodeURIComponent('Spoken English')); }}
                      className="hover:text-brand-coral transition-colors"
                    >
                      Spoken English
                    </a>
                  </li>
                  <li>
                    <a
                      href="/courses?category=Computer%20Skills"
                      onClick={(e) => { e.preventDefault(); navigatePublic('/courses?category=' + encodeURIComponent('Computer Skills')); }}
                      className="hover:text-brand-coral transition-colors"
                    >
                      Computer Skills
                    </a>
                  </li>
                  <li>
                    <a
                      href="/courses?category=AI%20%26%20Automation"
                      onClick={(e) => { e.preventDefault(); navigatePublic('/courses?category=' + encodeURIComponent('AI & Automation')); }}
                      className="hover:text-brand-coral transition-colors"
                    >
                      AI &amp; Automation
                    </a>
                  </li>
                  <li>
                    <a
                      href="/courses?category=Digital%20Marketing"
                      onClick={(e) => { e.preventDefault(); navigatePublic('/courses?category=' + encodeURIComponent('Digital Marketing')); }}
                      className="hover:text-brand-coral transition-colors"
                    >
                      Digital Marketing
                    </a>
                  </li>
                  <li>
                    <a
                      href="/courses?category=Sales%20%26%20Leadership"
                      onClick={(e) => { e.preventDefault(); navigatePublic('/courses?category=' + encodeURIComponent('Sales & Leadership')); }}
                      className="hover:text-brand-coral transition-colors"
                    >
                      Sales &amp; Leadership
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 3 */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-mono uppercase font-bold text-white tracking-widest">
                  Company
                </h4>
                <ul className="space-y-2.5 text-xs text-white/70">
                  <li><a href="#about" onClick={(e)=>{e.preventDefault(); onNavigateToContent('about');}} className="hover:text-brand-coral transition-colors">About T2U</a></li>
                  <li><a href="#partner" onClick={(e)=>{e.preventDefault(); onNavigateToContent('partner');}} className="hover:text-brand-coral transition-colors">Become Partner</a></li>
                  <li><a href="#instructors" onClick={(e)=>{e.preventDefault(); onNavigateToContent('instructors-hub');}} className="hover:text-brand-coral transition-colors">Instructors Hub</a></li>
                  <li><a href="#success" onClick={(e)=>{e.preventDefault(); onNavigateToContent('success-stories');}} className="hover:text-brand-coral transition-colors">Success Stories</a></li>
                  {onNavigateToProducts && (
                    <li><a href="#products" onClick={(e)=>{e.preventDefault(); onNavigateToProducts();}} className="text-brand-mustard hover:text-brand-coral transition-colors font-semibold">T2U Product Store</a></li>
                  )}
                </ul>
              </div>

              {/* Col 4 */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-mono uppercase font-bold text-white tracking-widest">
                  Legal Policy
                </h4>
                <ul className="space-y-2.5 text-xs font-medium text-white/70">
                  <li><a href="#terms" onClick={(e)=>{e.preventDefault(); onNavigateToContent('terms');}} className="hover:text-brand-coral transition-colors">Terms &amp; Conditions</a></li>
                  <li><a href="#privacy" onClick={(e)=>{e.preventDefault(); onNavigateToContent('privacy');}} className="hover:text-brand-coral transition-colors">Privacy Policy</a></li>
                  <li><a href="#refund" onClick={(e)=>{e.preventDefault(); onNavigateToContent('refund');}} className="hover:text-brand-coral transition-colors">Refund Policy</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Row */}
          <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/70 border-b border-purple-900/30">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-brand-coral shrink-0" />
              <span>Email:&nbsp;</span>
              <a
                href="mailto:t2upgradeofficial@gmail.com"
                className="hover:text-brand-coral transition-colors underline-offset-2 hover:underline"
              >
                t2upgradeofficial@gmail.com
              </a>
            </div>

            <div className="flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-brand-coral shrink-0" />
              <span>Call support:&nbsp;</span>
              <a
                href="tel:+919269488028"
                className="hover:text-brand-coral transition-colors underline-offset-2 hover:underline font-mono"
              >
                +91 92694 88028
              </a>
            </div>

            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-brand-coral shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="block text-white font-medium">Ward No. 18, Mochiyon Ka Mohalla,</span>
                <span className="block text-white font-medium">Lunkaransar, Rajasthan, India</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright line bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-white/70 font-mono">
            <span>
              © {new Date().getFullYear()} T2U — Time to Upgrade. All rights reserved.
            </span>
            <div className="flex items-center space-x-4">
              <span>GSTIN: 08AAACC4915X2Z7</span>
              <span>CIN: U80902RJ2026PTC095114</span>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
