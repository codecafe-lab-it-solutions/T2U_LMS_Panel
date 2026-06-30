import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, MapPin, Tag, BookOpen } from 'lucide-react';

/* ─── Site theme tokens ───
   bg:       #171421   dark midnight
   surface:  #1f1b2e   card surfaces
   border:   #2a263d   subtle borders
   accent:   #8b5cf6   brand violet
   orange:   #ff7a00   brand mustard
   muted:    #94a3b8   slate text
   green:    #10b981   live green
─────────────────────────── */

const COURSES = [
  { value: '', label: 'Select a course' },
  { value: 'Become A Direct Selling Pro', label: 'Become A Direct Selling Pro (₹1,999)' },
  { value: 'Spoken English Mastery', label: 'Spoken English Mastery (₹4,999)' },
  { value: 'Office Ready Skills', label: 'Office Ready Skills (₹8,999)' },
  { value: 'AI Automation & Workflow Mastery', label: 'AI Automation & Workflow Mastery (₹14,999)' },
  { value: 'Advanced Digital Marketing Mastery', label: 'Advanced Digital Marketing Mastery (₹17,999)' },
];

function FieldRow({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-tan uppercase tracking-widest">
        <span className="text-brand-coral/80 shrink-0">{icon}</span>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-tan/50 pointer-events-none">
          {icon}
        </span>
        {children}
      </div>
      {error && <p className="text-red-400 text-[11px] font-medium">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full bg-warm-cream border border-border-tan focus:border-brand-coral rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-muted-tan/40 focus:outline-none transition-colors duration-150 font-medium';

export default function LeadFormModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [courseInterest, setCourseInterest] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref) setReferredBy(ref);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!mobile.trim()) errs.mobile = 'Mobile number is required';
    if (!email.trim()) errs.email = 'Email address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const body = new URLSearchParams({
        lead_name: name,
        mobile_no: mobile,
        email_id: email,
        city,
        referred_by: referredBy,
        course_interest: courseInterest,
      });
      const res = await fetch('https://t2u.codecafelab.in/api/method/create_t2u_lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const data = await res.json();
      if (data?.data?.success === true) {
        setIsSuccess(true);
      } else {
        setSubmitError(data?.data?.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName(''); setMobile(''); setEmail(''); setCity('');
    setReferredBy(''); setCourseInterest('');
    setErrors({}); setSubmitError(''); setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 18 }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="relative z-10 w-full max-w-md bg-warm-cream border border-border-tan rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
          >
            {/* Top gradient accent strip */}
            <div className="h-1 w-full bg-linear-to-r from-brand-coral via-[#a855f7] to-brand-mustard shrink-0" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border-tan flex items-start justify-between shrink-0">
              <div>
                <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-brand-mustard bg-brand-mustard/10 border border-brand-mustard/20 px-2.5 py-0.5 rounded-full mb-2">
                  🚀 Get Started Free
                </span>
                <h2 className="text-[1.15rem] font-extrabold text-white font-sans leading-snug">
                  Start Your Journey
                </h2>
                <p className="text-muted-tan text-xs mt-0.5">
                  Join T2UPGRADE — Learn &amp; Earn
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-border-tan/70 rounded-full text-muted-tan hover:text-white transition-colors cursor-pointer shrink-0 mt-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 hide-scrollbar">
              {isSuccess ? (
                /* ── Success state ── */
                <div className="text-center py-6">
                  <div className="text-5xl mb-4 leading-none">🎉</div>
                  <h3 className="text-xl font-extrabold text-live-green mb-2">
                    You're on the list!
                  </h3>
                  <p className="text-muted-tan text-sm leading-relaxed mb-7 max-w-xs mx-auto">
                    Our team will call you within 24 hours and send your enrollment
                    link to your email.
                  </p>
                  <button
                    onClick={handleClose}
                    className="bg-live-green hover:bg-[#0ea271] text-white font-bold px-8 py-3 rounded-xl transition-colors cursor-pointer text-sm uppercase tracking-wider"
                  >
                    Got it! ✓
                  </button>
                </div>
              ) : (
                /* ── Lead form ── */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FieldRow label="Full Name" icon={<User className="w-4 h-4" />} error={errors.name}>
                    <input
                      type="text"
                      value={name}
                      onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
                      placeholder="Your full name"
                      className={inputCls + (errors.name ? ' border-red-500/60' : '')}
                    />
                  </FieldRow>

                  <FieldRow label="Mobile Number" icon={<Phone className="w-4 h-4" />} error={errors.mobile}>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={e => { setMobile(e.target.value); if (errors.mobile) setErrors(p => ({ ...p, mobile: '' })); }}
                      placeholder="+91 9876543210"
                      className={inputCls + (errors.mobile ? ' border-red-500/60' : '')}
                    />
                  </FieldRow>

                  <FieldRow label="Email Address" icon={<Mail className="w-4 h-4" />} error={errors.email}>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
                      placeholder="your@email.com"
                      className={inputCls + (errors.email ? ' border-red-500/60' : '')}
                    />
                  </FieldRow>

                  <FieldRow label="City" icon={<MapPin className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Your city"
                      className={inputCls}
                    />
                  </FieldRow>

                  <FieldRow label="Referred By" icon={<Tag className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={referredBy}
                      onChange={e => setReferredBy(e.target.value)}
                      placeholder="T2U ID if referred e.g. T2USTU001"
                      className={inputCls}
                    />
                  </FieldRow>

                  {/* Course Interest — no icon prefix, full select */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-tan uppercase tracking-widest">
                      <span className="text-brand-coral/80"><BookOpen className="w-4 h-4" /></span>
                      Course Interest
                    </label>
                    <select
                      value={courseInterest}
                      onChange={e => setCourseInterest(e.target.value)}
                      className="w-full bg-warm-cream border border-border-tan focus:border-brand-coral rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-colors duration-150 cursor-pointer font-medium"
                      style={{ colorScheme: 'dark' }}
                    >
                      {COURSES.map(c => (
                        <option key={c.value} value={c.value} style={{ background: '#1f1b2e' }}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* API error */}
                  {submitError && (
                    <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl px-4 py-3 leading-relaxed">
                      {submitError}
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-coral hover:bg-[#7c3aed] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer text-xs shadow-lg shadow-brand-coral/20 mt-1"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Get Free Callback →'
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

