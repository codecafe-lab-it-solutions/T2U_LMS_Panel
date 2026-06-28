import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Users, FileText,
  Building, Hash, Package, CreditCard, Image, Tag,
  CheckSquare, Loader, CheckCircle, AlertCircle,
} from 'lucide-react';

/* ─── Site theme tokens ─────────────────
   bg:       #0d0b18   page background
   surface:  #171421   card background
   elevated: #1f1b2e   input/elevated surface
   border:   #2a263d   borders
   accent:   #8b5cf6   brand violet (brand-coral)
   orange:   #ff7a00   brand mustard
   gold:     #ffd700   brand yellow
   muted:    #94a3b8   slate body text
   green:    #10b981   success / live-green
   red:      #ef4444   error
──────────────────────────────────────── */

interface PackageDef {
  id: string;
  name: string;
  price: number;
  display: string;
  bv: number;
  tag: string;
  diamond?: boolean;
}

const PACKAGES: PackageDef[] = [
  { id: 'Starter', name: 'Become A Direct Selling Pro',       price: 1999,  display: '₹1,999',  bv: 1200,  tag: 'Starter' },
  { id: 'Basic',   name: 'Spoken English Mastery',            price: 4999,  display: '₹4,999',  bv: 3000,  tag: 'Basic' },
  { id: 'Silver',  name: 'Office Ready Skills',               price: 8999,  display: '₹8,999',  bv: 5400,  tag: 'Silver' },
  { id: 'Gold',    name: 'AI Automation & Workflow Mastery',  price: 14999, display: '₹14,999', bv: 9000,  tag: 'Gold' },
  {
    id: 'Diamond', name: 'Advanced Digital Marketing Mastery', price: 17999, display: '₹17,999', bv: 10000,
    tag: 'Diamond', diamond: true,
  },
];

/* ─── Reusable input wrapper ─── */
function FormField({
  label,
  icon,
  required,
  error,
  children,
  fullWidth,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2 sm:col-span-2' : ''}>
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-tan uppercase tracking-widest mb-1.5">
        {icon && <span className="text-brand-coral/70">{icon}</span>}
        {label}
        {required && <span className="text-brand-mustard ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-red-400 text-[11px] mt-1 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Input class strings ─── */
const inputCls = 'w-full bg-near-black border border-border-tan focus:border-brand-coral rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-muted-tan/40 focus:outline-none transition-colors duration-150 font-medium';
const inputErrCls = ' border-red-500/50 focus:border-red-500';

/* ─── Section card wrapper ─── */
function SectionCard({
  number,
  title,
  icon,
  children,
}: {
  number: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-warm-cream border border-border-tan rounded-[20px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.35)] mb-5">
      {/* Section header strip */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border-tan bg-[#1a1726]">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-coral/15 border border-brand-coral/30 text-brand-coral text-xs font-black font-mono shrink-0">
          {number}
        </span>
        <span className="text-brand-coral/70 shrink-0">{icon}</span>
        <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

interface SuccessData {
  user_id: string;
  email: string;
  login_url?: string;
}

export default function EnrollPage() {
  /* ── Personal Info state ── */
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [emailVal,  setEmailVal]  = useState('');
  const [mobileVal, setMobileVal] = useState('');
  const [dob,       setDob]       = useState('');
  const [gender,    setGender]    = useState('');
  const [address,   setAddress]   = useState('');
  const [cityVal,   setCityVal]   = useState('');
  const [stateVal,  setStateVal]  = useState('');
  const [pinCode,   setPinCode]   = useState('');

  /* ── Package ── */
  const [selectedPkg, setSelectedPkg] = useState('');

  /* ── Payment ── */
  const [transactionId, setTransactionId] = useState('');
  const [screenshot,    setScreenshot]    = useState<File | null>(null);

  /* ── Referral ── */
  const [sponsorCode,    setSponsorCode]    = useState('');
  const [referralStatus, setReferralStatus] = useState<{ valid: boolean | null; msg: string }>({ valid: null, msg: '' });
  const referralTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Terms ── */
  const [agreed, setAgreed] = useState(false);

  /* ── Submission ── */
  const [fieldErrors,  setFieldErrors]  = useState<Record<string, string>>({});
  const [submitError,  setSubmitError]  = useState('');
  const [btnLabel,     setBtnLabel]     = useState('Complete Enrollment & Create Account →');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData,  setSuccessData]  = useState<SuccessData | null>(null);

  /* ── Init from URL ── */
  useEffect(() => {
    const sponsor = new URLSearchParams(window.location.search).get('sponsor');
    if (sponsor) setSponsorCode(sponsor.toUpperCase());
    document.title = 'Complete Your Enrollment — T2UPGRADE';
  }, []);

  const selectedPkgObj = PACKAGES.find(p => p.id === selectedPkg);

  /* ── Referral validation (600ms debounce) ── */
  const validateReferral = useCallback((code: string) => {
    if (!code.trim()) { setReferralStatus({ valid: null, msg: '' }); return; }
    if (referralTimer.current) clearTimeout(referralTimer.current);
    referralTimer.current = setTimeout(async () => {
      try {
        const body = new URLSearchParams({ referral_code: code });
        const res  = await fetch('https://t2u.codecafelab.in/api/method/validate_referral_code', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
        });
        const data = await res.json();
        if (data?.data?.success === true) {
          setReferralStatus({ valid: true, msg: '✅ Valid referral — Sponsor linked!' });
        } else {
          setReferralStatus({ valid: false, msg: '❌ ' + (data?.data?.message || 'Invalid referral code') });
        }
      } catch {
        setReferralStatus({ valid: false, msg: '❌ Could not verify referral code' });
      }
    }, 600);
  }, []);

  /* ── Validation ── */
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim())    errs.firstName    = 'First name is required';
    if (!lastName.trim())     errs.lastName     = 'Last name is required';
    if (!emailVal.trim())     errs.emailVal     = 'Email is required';
    if (!mobileVal.trim())    errs.mobileVal    = 'Mobile number is required';
    if (!address.trim())      errs.address      = 'Address is required';
    if (!cityVal.trim())      errs.cityVal      = 'City is required';
    if (!stateVal.trim())     errs.stateVal     = 'State is required';
    if (!selectedPkg)         errs.pkg          = 'Please select a package';
    if (!transactionId.trim()) errs.transactionId = 'Transaction ID is required';
    if (!agreed)              errs.terms        = 'You must agree to the terms & conditions';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) {
      // Scroll to first error
      setTimeout(() => {
        const el = document.querySelector('[data-error="true"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setIsSubmitting(true);
    let fileUrl = '';
    try {
      if (screenshot) {
        setBtnLabel('Uploading payment proof...');
        const fd = new FormData();
        fd.append('file', screenshot);
        fd.append('is_private', '1');
        fd.append('doctype', 'T2U Enrollment');
        fd.append('fieldname', 'payment_screenshot');
        const upRes  = await fetch('https://t2u.codecafelab.in/api/method/upload_file', { method: 'POST', body: fd });
        const upData = await upRes.json();
        fileUrl = upData?.message?.file_url || '';
      }

      setBtnLabel('Creating your account...');
      const body = new URLSearchParams({
        first_name:          firstName,
        last_name:           lastName,
        email:               emailVal,
        mobile:              mobileVal,
        dob,
        gender,
        address,
        city:                cityVal,
        state:               stateVal,
        pin_code:            pinCode,
        package_name:        selectedPkg,
        transaction_id:      transactionId,
        sponsor_code:        sponsorCode.toUpperCase(),
        payment_screenshot:  fileUrl,
      });
      const res  = await fetch('https://t2u.codecafelab.in/api/method/complete_t2u_enrollment', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
      });
      const data = await res.json();
      if (data?.data?.success === true) {
        setSuccessData({ user_id: data.data.user_id, email: data.data.email, login_url: data.data.login_url });
      } else {
        setSubmitError(data?.data?.message || 'Enrollment failed. Please try again.');
        setBtnLabel('Complete Enrollment & Create Account →');
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      setBtnLabel('Complete Enrollment & Create Account →');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── SUCCESS PAGE ─── */
  if (successData) {
    return (
      <div className="min-h-screen bg-[#0d0b18] flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {/* Glow circle */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-live-green/20 blur-2xl" />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-live-green/10 border border-live-green/30">
              <CheckCircle className="w-12 h-12 text-live-green" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">Enrollment Successful!</h1>
          <p className="text-muted-tan mb-8">
            Welcome to T2UPGRADE! Your account has been created.
          </p>

          {/* T2U ID card */}
          <div className="bg-warm-cream border border-border-tan rounded-[20px] p-6 mb-6 text-left">
            <p className="text-[11px] font-mono font-bold text-muted-tan uppercase tracking-widest mb-2">
              Your T2U ID — Your Referral Code
            </p>
            <div className="text-3xl font-black text-brand-coral tracking-[6px] mb-2 font-mono">
              {successData.user_id}
            </div>
            <p className="text-muted-tan text-xs">
              Share this ID to earn commissions when others enroll!
            </p>
          </div>

          <p className="text-muted-tan text-sm mb-6">
            Login credentials have been sent to:{' '}
            <span className="text-white font-semibold">{successData.email}</span>
          </p>

          <a
            href={successData.login_url || 'https://t2u.codecafelab.in/lms'}
            className="inline-flex items-center gap-2 bg-brand-coral hover:bg-[#7c3aed] text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm uppercase tracking-wider shadow-lg shadow-brand-coral/25"
          >
            Go to Learning Portal →
          </a>
        </div>
      </div>
    );
  }

  /* ─── MAIN ENROLLMENT FORM ─── */
  return (
    <div className="min-h-screen bg-[#0d0b18] py-10 px-4">
      {/* Subtle ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-coral/5 blur-[120px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">

        {/* Page header card */}
        <div className="bg-warm-cream border border-border-tan rounded-[20px] p-6 mb-6 relative overflow-hidden">
          {/* Gradient corner accent */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-brand-coral/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="h-0.5 w-16 bg-linear-to-r from-brand-coral to-brand-mustard rounded-full mb-4" />
          <div className="relative z-10">
            <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-brand-mustard bg-brand-mustard/10 border border-brand-mustard/20 px-2.5 py-0.5 rounded-full mb-3">
              📝 Enrollment Form
            </span>
            <h1 className="text-2xl font-extrabold text-white mb-1">Complete Your Enrollment</h1>
            <p className="text-muted-tan text-sm">
              Fill in your details below to activate your T2UPGRADE account
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ═══ SECTION 1 — Personal Information ═══ */}
          <SectionCard number="01" title="Personal Information" icon={<User className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <FormField label="First Name" icon={<User className="w-3.5 h-3.5" />} required error={fieldErrors.firstName}>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Rohit"
                  className={inputCls + (fieldErrors.firstName ? inputErrCls : '')}
                  data-error={!!fieldErrors.firstName}
                />
              </FormField>

              <FormField label="Last Name" icon={<User className="w-3.5 h-3.5" />} required error={fieldErrors.lastName}>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Sharma"
                  className={inputCls + (fieldErrors.lastName ? inputErrCls : '')}
                />
              </FormField>

              {/* Email — full width */}
              <FormField label="Email Address" icon={<Mail className="w-3.5 h-3.5" />} required error={fieldErrors.emailVal} fullWidth>
                <input
                  type="email"
                  value={emailVal}
                  onChange={e => setEmailVal(e.target.value)}
                  placeholder="rohit@gmail.com"
                  className={inputCls + (fieldErrors.emailVal ? inputErrCls : '')}
                />
              </FormField>

              <FormField label="Mobile Number" icon={<Phone className="w-3.5 h-3.5" />} required error={fieldErrors.mobileVal}>
                <input
                  type="tel"
                  value={mobileVal}
                  onChange={e => setMobileVal(e.target.value)}
                  placeholder="+91 9876543210"
                  className={inputCls + (fieldErrors.mobileVal ? inputErrCls : '')}
                />
              </FormField>

              <FormField label="Date of Birth" icon={<Calendar className="w-3.5 h-3.5" />}>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className={inputCls}
                  style={{ colorScheme: 'dark' }}
                />
              </FormField>

              <FormField label="Gender" icon={<Users className="w-3.5 h-3.5" />}>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className={inputCls + ' cursor-pointer'}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" style={{ background: '#1f1b2e' }}>Select gender</option>
                  <option value="Male" style={{ background: '#1f1b2e' }}>Male</option>
                  <option value="Female" style={{ background: '#1f1b2e' }}>Female</option>
                  <option value="Other" style={{ background: '#1f1b2e' }}>Other</option>
                </select>
              </FormField>

              {/* Address — full width */}
              <FormField label="Full Address" icon={<FileText className="w-3.5 h-3.5" />} required error={fieldErrors.address} fullWidth>
                <textarea
                  rows={3}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="House No, Street, Area..."
                  className={inputCls + ' resize-none' + (fieldErrors.address ? inputErrCls : '')}
                />
              </FormField>

              <FormField label="City" icon={<Building className="w-3.5 h-3.5" />} required error={fieldErrors.cityVal}>
                <input
                  type="text"
                  value={cityVal}
                  onChange={e => setCityVal(e.target.value)}
                  placeholder="Jaipur"
                  className={inputCls + (fieldErrors.cityVal ? inputErrCls : '')}
                />
              </FormField>

              <FormField label="State" icon={<MapPin className="w-3.5 h-3.5" />} required error={fieldErrors.stateVal}>
                <input
                  type="text"
                  value={stateVal}
                  onChange={e => setStateVal(e.target.value)}
                  placeholder="Rajasthan"
                  className={inputCls + (fieldErrors.stateVal ? inputErrCls : '')}
                />
              </FormField>

              <FormField label="PIN Code" icon={<Hash className="w-3.5 h-3.5" />}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="302001"
                  className={inputCls}
                />
              </FormField>

            </div>
          </SectionCard>

          {/* ═══ SECTION 2 — Package Selection ═══ */}
          <SectionCard number="02" title="Select Your Package" icon={<Package className="w-4 h-4" />}>
            {fieldErrors.pkg && (
              <p className="flex items-center gap-1.5 text-red-400 text-xs mb-3 font-medium" data-error="true">
                <AlertCircle className="w-3.5 h-3.5" /> {fieldErrors.pkg}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PACKAGES.map(pkg => {
                const isSelected = selectedPkg === pkg.id;
                return (
                  <button
                    type="button"
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id)}
                    className={[
                      'relative text-left rounded-[14px] border-2 p-4 transition-all duration-200 cursor-pointer group',
                      pkg.diamond ? 'sm:col-span-2' : '',
                      isSelected
                        ? 'border-brand-coral bg-brand-coral/10 shadow-lg shadow-brand-coral/15'
                        : pkg.diamond
                          ? 'border-brand-coral/30 bg-brand-coral/5 hover:border-brand-coral/60 hover:bg-brand-coral/8'
                          : 'border-border-tan bg-near-black/60 hover:border-brand-coral/40 hover:bg-brand-coral/5',
                    ].join(' ')}
                  >
                    {/* Diamond crown badge */}
                    {pkg.diamond && (
                      <span className="absolute top-3 right-3 text-[10px] font-mono font-bold text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/25 px-2 py-0.5 rounded-full">
                        💎 Best Value
                      </span>
                    )}

                    {/* Selected checkmark */}
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-coral flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}

                    {/* Package tier badge */}
                    <span className={[
                      'inline-block text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2.5',
                      pkg.diamond
                        ? 'text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/20'
                        : 'text-brand-coral bg-brand-coral/10 border border-brand-coral/20',
                    ].join(' ')}>
                      {pkg.tag}
                    </span>

                    <p className="text-sm font-bold text-white leading-snug mb-2 pr-6">{pkg.name}</p>
                    <p className={[
                      'text-xl font-black mb-1',
                      isSelected ? 'text-brand-coral' : 'text-white',
                    ].join(' ')}>
                      {pkg.display}
                    </p>
                    <p className="text-muted-tan text-xs">Business Volume: {pkg.bv.toLocaleString()} BV</p>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* ═══ SECTION 3 — Payment Details ═══ */}
          <SectionCard number="03" title="Payment Details" icon={<CreditCard className="w-4 h-4" />}>
            {/* Info box */}
            <div className="bg-brand-coral/8 border border-brand-coral/20 rounded-xl px-4 py-3 mb-5">
              <p className="text-white text-xs font-bold mb-0.5">Transfer the package amount and enter the Transaction ID below.</p>
              <p className="text-muted-tan text-xs">
                UPI: <span className="text-brand-mustard font-semibold">t2upgrade@upi</span>
                &nbsp;|&nbsp; Bank: <span className="text-brand-mustard font-semibold">T2UPGRADE PVT LTD</span>
              </p>
            </div>

            <div className="space-y-4">
              <FormField label="Transaction ID / UTR Number" icon={<Hash className="w-3.5 h-3.5" />} required error={fieldErrors.transactionId}>
                <input
                  type="text"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder="Enter payment transaction ID"
                  className={inputCls + (fieldErrors.transactionId ? inputErrCls : '')}
                />
              </FormField>

              {/* Amount — readonly auto-fill */}
              <FormField label="Amount Paid (₹) — auto-fills on package select" icon={<CreditCard className="w-3.5 h-3.5" />}>
                <input
                  type="number"
                  readOnly
                  value={selectedPkgObj ? selectedPkgObj.price : ''}
                  placeholder="Select a package above"
                  className={
                    inputCls +
                    ' cursor-not-allowed ' +
                    (selectedPkgObj ? 'text-brand-coral font-black' : 'text-muted-tan/50')
                  }
                  style={{ background: '#171421' }}
                />
              </FormField>

              {/* Screenshot upload */}
              <FormField label="Payment Screenshot (optional)" icon={<Image className="w-3.5 h-3.5" />}>
                <label className="flex items-center gap-3 w-full bg-near-black border border-border-tan hover:border-brand-coral/50 rounded-xl py-2.5 px-3 transition-colors cursor-pointer group">
                  <span className="shrink-0 text-muted-tan group-hover:text-brand-coral transition-colors">
                    <Image className="w-4 h-4" />
                  </span>
                  <span className="text-sm text-muted-tan group-hover:text-white transition-colors truncate">
                    {screenshot ? screenshot.name : 'Click to upload image...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setScreenshot(e.target.files?.[0] || null)}
                  />
                </label>
                {screenshot && (
                  <p className="text-live-green text-xs mt-1 font-medium">✅ {screenshot.name} selected</p>
                )}
              </FormField>
            </div>
          </SectionCard>

          {/* ═══ SECTION 4 — Referral Information ═══ */}
          <SectionCard number="04" title="Referral Information" icon={<Tag className="w-4 h-4" />}>
            <FormField label="Referred by T2U ID" icon={<Tag className="w-3.5 h-3.5" />}>
              <input
                type="text"
                value={sponsorCode}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setSponsorCode(val);
                  setReferralStatus({ valid: null, msg: '' });
                  validateReferral(val);
                }}
                placeholder="e.g. T2U1001"
                className={[
                  inputCls,
                  referralStatus.valid === true  ? ' border-live-green/60 focus:border-live-green' : '',
                  referralStatus.valid === false ? ' border-red-500/50 focus:border-red-500'    : '',
                ].join('')}
              />
            </FormField>
            {referralStatus.msg && (
              <p className={[
                'text-xs mt-1.5 font-medium flex items-center gap-1',
                referralStatus.valid ? 'text-live-green' : 'text-red-400',
              ].join('')}>
                {referralStatus.msg}
              </p>
            )}
          </SectionCard>

          {/* ═══ SECTION 5 — Terms & Conditions ═══ */}
          <SectionCard number="05" title="Terms & Conditions" icon={<CheckSquare className="w-4 h-4" />}>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-coral cursor-pointer"
                />
              </div>
              <span className="text-sm text-muted-tan leading-relaxed group-hover:text-white transition-colors">
                I agree to the{' '}
                <span className="text-brand-coral font-semibold">Terms &amp; Conditions</span> and{' '}
                <span className="text-brand-coral font-semibold">Privacy Policy</span> of T2UPGRADE Pvt. Ltd.
                I confirm all information provided is accurate.
              </span>
            </label>
            {fieldErrors.terms && (
              <p className="flex items-center gap-1 text-red-400 text-xs mt-2 font-medium" data-error="true">
                <AlertCircle className="w-3 h-3" /> {fieldErrors.terms}
              </p>
            )}
          </SectionCard>

          {/* Submit error */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-5 py-4 mb-4 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-coral hover:bg-[#7c3aed] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-[14px] flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer text-sm uppercase tracking-wider shadow-xl shadow-brand-coral/25"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {btnLabel}
              </>
            ) : (
              btnLabel
            )}
          </button>

          <p className="text-center text-muted-tan text-xs mt-4 pb-4">
            🔒 Your information is secure and will never be shared with third parties.
          </p>
        </form>
      </div>
    </div>
  );
}

