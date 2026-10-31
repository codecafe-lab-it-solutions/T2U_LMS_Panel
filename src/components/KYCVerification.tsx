import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import {
  ShieldCheck, ShieldAlert, Shield, Phone, User,
  CreditCard, Building2, UploadCloud, FileText, CheckCircle2,
  Download, Pen, RefreshCw, Eye, AlertTriangle, Loader2, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatDate } from '../utils/date';

// ── DSA Form HTML Generator ────────────────────────────────────────────────
function buildDsaHtml(data: {
  fullName: string; fatherName?: string; age?: string; address?: string;
  mobile: string; email: string; pan: string; aadhaar: string;
  distributorId: string;
}) {
  const today = formatDate(new Date());
  return `<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"><title>T2UPGRADE DSA Form</title>
<style>
  body{font-family:Arial,sans-serif;font-size:13px;line-height:1.7;color:#111;max-width:800px;margin:40px auto;padding:0 24px;}
  h1{font-size:17px;font-weight:bold;text-align:center;margin:0;}
  h2{font-size:14px;font-weight:bold;text-align:center;margin:4px 0 16px;}
  .date-row{margin-bottom:12px;}
  .field-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:18px;}
  .field-line{border-bottom:1px solid #444;min-width:160px;display:inline-block;padding:0 4px;}
  ol{margin:0;padding-left:20px;}
  ol li{margin-bottom:8px;}
  .declaration{font-weight:bold;border:1px solid #111;padding:12px;margin:16px 0;}
  .sign-section{margin-top:32px;border-top:2px solid #111;padding-top:16px;}
  .sign-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 40px;}
  .sign-line{border-bottom:1px solid #444;height:24px;margin-bottom:4px;}
  @media print{body{margin:0;padding:16px;} button{display:none;}}
</style>
</head><body>
<h1>T2UPGRADE PVT. LTD.</h1>
<h2>DIRECT SELLER / DISTRIBUTOR AGREEMENT &amp; DECLARATION</h2>

<div class="date-row"><strong>Date:</strong> ${today}</div>

<div>
  मैं, <strong>श्री/श्रीमती/कुमारी</strong> <span class="field-line">${data.fullName || '___________________'}</span>,<br>
  पिता/पति का नाम <span class="field-line">${data.fatherName || '___________________'}</span>, उम्र <span class="field-line">${data.age || '__'}</span> वर्ष,<br>
  निवासी <span class="field-line" style="min-width:300px">${data.address || '___________________________'}</span>,<br>
  Mobile No. <span class="field-line">${data.mobile || '_______________'}</span>, Email <span class="field-line">${data.email || '_______________'}</span>,<br>
  PAN No. <span class="field-line">${data.pan || '_______________'}</span>, Aadhaar/ID Proof No. <span class="field-line">${data.aadhaar || '_______________'}</span>,
</div>

<p style="margin:14px 0">स्वेच्छा से <strong>T2UPGRADE Pvt. Ltd.</strong> के साथ <strong>Independent Direct Seller / Distributor</strong> के रूप में जुड़ रहा/रही हूँ।</p>
<p style="margin-bottom:10px"><strong>मैं यह स्वीकार करता/करती हूँ कि:</strong></p>

<ol>
  <li>मैं कंपनी का employee, partner, agent, franchise owner या legal representative नहीं हूँ। मैं केवल independent direct seller/distributor के रूप में कार्य करूंगा/करूंगी।</li>
  <li>मैं केवल कंपनी द्वारा approved products, services, courses, digital programs और official offerings को ही promote और sell करूंगा/करूंगी।</li>
  <li>कंपनी direct seller बनने के लिए कोई entry fee, joining fee, subscription fee या compulsory purchase fee नहीं लेती। कोई भी purchase customer/distributor की स्वैच्छिक पसंद होगी।</li>
  <li>Commission/incentive केवल genuine sale पर मिलेगा। केवल किसी व्यक्ति को जोड़ने या recruitment करने पर कोई income payable नहीं होगी।</li>
  <li>मैं किसी भी प्रकार की false income claim, fake earning screenshot, job guarantee, placement guarantee, fixed income promise, quick-rich promise या misleading claim नहीं करूंगा/करूंगी।</li>
  <li>मैं pyramid scheme, money circulation scheme, illegal investment plan, chain scheme या किसी भी unauthorized business opportunity को company के नाम से promote नहीं करूंगा/करूंगी।</li>
  <li>मैं customers को product/course price, features, refund policy, cancellation policy, support details और terms &amp; conditions की सही जानकारी दूंगा/दूंगी।</li>
  <li>मैं company के name, logo, course content, videos, PDFs, certificates, website, social media creatives और training material का use केवल company-approved purpose के लिए करूंगा/करूंगी। बिना permission copy, resell, rebrand या misuse नहीं करूंगा/करूंगी।</li>
  <li>मैं customer data, student data, payment details और company confidential information को सुरक्षित रखूंगा/रखूंगी और इसका misuse/share/sell नहीं करूंगा/करूंगी।</li>
  <li>मैं company की policies, code of conduct, compensation plan, refund policy, Consumer Protection Rules, Direct Selling Rules और सभी applicable laws का पालन करूंगा/करूंगी।</li>
  <li>यदि मेरे द्वारा कोई false promise, fraud, misleading promotion, unauthorized payment collection, brand misuse या policy violation किया जाता है, तो company मेरा distributor ID terminate कर सकती है और applicable payout रोक/adjust कर सकती है।</li>
  <li>Refund/cancellation होने पर उस sale पर दिया गया commission future payout से adjust/recover किया जा सकता है।</li>
  <li>किसी भी dispute की स्थिति में पहले company के साथ mutual discussion द्वारा समाधान किया जाएगा। आवश्यकता होने पर jurisdiction <strong>Bikaner, Rajasthan</strong> रहेगा।</li>
</ol>

<div class="declaration">
  <strong>Important Declaration</strong><br><br>
  <strong>T2UPGRADE Pvt. Ltd. fixed income, job, placement या business success की कोई guarantee नहीं देती। Earnings केवल company-approved products/services की genuine sale और personal effort पर आधारित होती हैं। केवल recruitment करने पर कोई income payable नहीं है।</strong><br><br>
  मैंने ऊपर लिखी सभी शर्तों को पढ़ लिया है, समझ लिया है और अपनी स्वतंत्र इच्छा से इस agreement/declaration पर हस्ताक्षर कर रहा/रही हूँ।
</div>

<div class="sign-section">
  <strong>Direct Seller / Distributor</strong>
  <div class="sign-grid" style="margin-top:16px">
    <div>
      <div class="sign-line"></div>
      <div><strong>Name:</strong> ${data.fullName || '___________________________'}</div>
    </div>
    <div>
      <div class="sign-line"></div>
      <div><strong>Distributor ID:</strong> ${data.distributorId || '___________________________'}</div>
    </div>
    <div style="margin-top:16px">
      <div class="sign-line"></div>
      <div><strong>Signature:</strong></div>
    </div>
    <div style="margin-top:16px">
      <div class="sign-line"></div>
      <div><strong>Date:</strong></div>
    </div>
  </div>
</div>

<div style="text-align:center;margin-top:24px">
  <button onclick="window.print()" style="padding:10px 28px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:bold;">
    🖨️ Print / Save as PDF
  </button>
</div>
</body></html>`;
}

function calculateAge(dob: string): number | null {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// ── Upload helper ──────────────────────────────────────────────────────────
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const base = (import.meta.env.VITE_API_URL as string).replace('/api', '');
  const res = await fetch(`${base}/api/upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const json = await res.json();
  return json.url as string;
}

type Step = 'personal' | 'identity' | 'bank' | 'docs' | 'dsa';

const STEPS: { id: Step; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Details', desc: 'Name, address, contact', icon: User },
  { id: 'identity', label: 'Identity', desc: 'Aadhaar & PAN', icon: CreditCard },
  { id: 'bank', label: 'Bank Details', desc: 'Settlement account', icon: Building2 },
  { id: 'docs', label: 'Documents', desc: 'Upload ID proofs', icon: UploadCloud },
  { id: 'dsa', label: 'DSA Agreement', desc: 'Sign & submit form', icon: Pen },
];

export default function KYCVerification() {
  const { authToken, userProfile } = useAppStore();
  const qc = useQueryClient();

  const { data: apiKyc, isLoading: loadingKyc } = useQuery({
    queryKey: ['my-kyc', authToken],
    queryFn: () => api.kyc.me(),
    enabled: !!authToken,
    staleTime: 30_000,
  });

  // Registration/profile data (father name, DOB, address, etc.) — used to pre-fill Personal
  // Details for fields that overlap with the registration form and haven't been KYC-edited yet.
  const { data: apiMe } = useQuery({
    queryKey: ['auth-me', authToken],
    queryFn: () => api.auth.me(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const [step, setStep] = useState<Step>('personal');
  // kycStatus stays 'rejected' (it's server data) until a fresh submission is actually
  // accepted — so the "rejected" screen below can't just check kycStatus, or clicking
  // "Re-submit Documents" would re-render straight back into the same rejected screen every
  // time (setStep alone never took effect, since the early return happens before step is
  // ever read). This flag lets the user explicitly dismiss the rejected screen and reach the
  // main wizard while the server still reports 'rejected'.
  const [resubmitting, setResubmitting] = useState(false);
  const [personal, setPersonal] = useState({
    fullName: userProfile?.name || '',
    fatherName: '',
    age: '',
    address: '',
    mobile: userProfile?.mobile || '',
    email: userProfile?.email || '',
  });
  const [identity, setIdentity] = useState({ aadhaarNumber: '', panNumber: '' });
  const [bank, setBank] = useState({ bankName: '', accountHolder: '', accountNumber: '', ifsc: '' });

  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [dsaUploading, setDsaUploading] = useState(false);
  const [dsaSignedUrl, setDsaSignedUrl] = useState('');
  const [submitError, setSubmitError] = useState('');

  const dsaFileRef = useRef<HTMLInputElement>(null);

  // Restore saved KYC draft data if it exists. Blank fields in the draft never overwrite
  // non-blank state — this keeps ordering safe against the profile-fallback effect below,
  // regardless of which of the two API calls resolves first.
  React.useEffect(() => {
    if (apiKyc?.personal_data) {
      const d = apiKyc.personal_data as any;
      if (d.fullName) {
        setPersonal(p => ({
          fullName: d.fullName || p.fullName,
          fatherName: d.fatherName || p.fatherName,
          age: d.age || p.age,
          address: d.address || p.address,
          mobile: d.mobile || p.mobile,
          email: d.email || p.email,
        }));
      }
      if (d.aadhaarNumber || d.panNumber) setIdentity(i => ({ ...i, aadhaarNumber: d.aadhaarNumber || '', panNumber: d.panNumber || '' }));
      if (d.bankName) setBank(b => ({ ...b, bankName: d.bankName || '', accountHolder: d.accountHolder || '', accountNumber: d.accountNumber || '', ifsc: d.ifsc || '' }));
    }
    if (apiKyc?.aadhaar_front_url) setDocUrls(prev => ({
      ...prev,
      aadhaarFront: apiKyc.aadhaar_front_url,
      aadhaarBack: apiKyc.aadhaar_back_url || '',
      panCard: apiKyc.pan_url || '',
      selfie: apiKyc.selfie_url || '',
      cancelledCheque: apiKyc.cancelled_cheque_url || '',
    }));
  }, [apiKyc]);

  // Fill in any still-blank Personal Details fields from the saved profile (registration
  // data) — KYC draft data restored above always wins over this fallback.
  React.useEffect(() => {
    if (!apiMe) return;
    setPersonal(p => ({
      fullName: p.fullName || apiMe.full_name || '',
      fatherName: p.fatherName || apiMe.father_name || '',
      age: p.age || (apiMe.dob ? String(calculateAge(apiMe.dob) ?? '') : ''),
      address: p.address || apiMe.address || '',
      mobile: p.mobile || apiMe.phone || '',
      email: p.email || apiMe.email || '',
    }));
  }, [apiMe]);

  const saveDraftMutation = useMutation({
    mutationFn: () => api.kyc.saveDraft({
      fullName: personal.fullName, fatherName: personal.fatherName, age: personal.age,
      address: personal.address, mobile: personal.mobile, email: personal.email,
      aadhaarNumber: identity.aadhaarNumber, panNumber: identity.panNumber,
      bankName: bank.bankName, accountHolder: bank.accountHolder,
      accountNumber: bank.accountNumber, ifsc: bank.ifsc,
    }),
  });

  const submitDocsMutation = useMutation({
    mutationFn: () => api.kyc.submitDocs({
      aadhaar_front_url: docUrls.aadhaarFront,
      aadhaar_back_url: docUrls.aadhaarBack,
      pan_url: docUrls.panCard,
      selfie_url: docUrls.selfie,
      cancelled_cheque_url: docUrls.cancelledCheque || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-kyc'] }); setStep('dsa'); },
    onError: (e: Error) => setSubmitError(e.message),
  });

  const submitDsaMutation = useMutation({
    mutationFn: (url: string) => api.kyc.submitDsa(url),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-kyc'] }),
    onError: (e: Error) => setSubmitError(e.message),
  });

  const handleFileUpload = async (field: string, file: File) => {
    if (!authToken) return;
    setUploading(p => ({ ...p, [field]: true }));
    try {
      const url = await uploadFile(file);
      setDocUrls(p => ({ ...p, [field]: url }));
    } catch {
      setSubmitError('File upload failed. Please try again.');
    } finally {
      setUploading(p => ({ ...p, [field]: false }));
    }
  };

  const handleDsaUpload = async (file: File) => {
    if (!authToken) return;
    setDsaUploading(true);
    setSubmitError('');
    try {
      const url = await uploadFile(file);
      setDsaSignedUrl(url);
    } catch {
      setSubmitError('Failed to upload signed DSA form. Please try again.');
    } finally {
      setDsaUploading(false);
    }
  };

  const handleDsaSubmit = () => {
    if (!dsaSignedUrl) return;
    setSubmitError('');
    submitDsaMutation.mutate(dsaSignedUrl);
  };

  const openDsaForm = () => {
    const html = buildDsaHtml({
      fullName: personal.fullName,
      fatherName: personal.fatherName,
      age: personal.age,
      address: personal.address,
      mobile: personal.mobile,
      email: personal.email,
      pan: identity.panNumber,
      aadhaar: identity.aadhaarNumber,
      distributorId: userProfile?.username || '',
    });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const kycStatus = apiKyc?.status ?? 'not_submitted';

  const isDocsComplete = !!(docUrls.aadhaarFront && docUrls.aadhaarBack && docUrls.panCard && docUrls.selfie);
  const stepDone = {
    personal: !!(personal.fullName && personal.mobile && personal.email),
    identity: !!(identity.aadhaarNumber && identity.panNumber),
    bank: !!(bank.bankName && bank.accountHolder && bank.accountNumber && bank.ifsc),
    docs: isDocsComplete,
    dsa: kycStatus === 'awaiting_dsa_review' || kycStatus === 'approved',
  };

  // Fully approved
  if (kycStatus === 'approved') {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
        <Card className="border border-emerald-500/30 bg-emerald-500/5 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500" />
          <CardContent className="p-10 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-emerald-500 uppercase tracking-wide">KYC Verified</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Your identity, banking details, and signed DSA agreement have been verified. Withdrawal requests are now unlocked.
            </p>
            <div className="p-4 rounded-xl bg-muted/40 border border-border text-left space-y-2 max-w-xs mx-auto">
              <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Verified Details</span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <span className="text-muted-foreground">Name:</span>
                <span className="text-foreground font-bold text-right">{personal.fullName || apiKyc?.personal_data?.fullName || '—'}</span>
                <span className="text-muted-foreground">PAN:</span>
                <span className="text-foreground font-bold text-right">{identity.panNumber || apiKyc?.personal_data?.panNumber || '—'}</span>
                <span className="text-muted-foreground">Bank:</span>
                <span className="text-foreground font-bold text-right">{bank.bankName || apiKyc?.personal_data?.bankName || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Awaiting DSA review
  if (kycStatus === 'awaiting_dsa_review') {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
        <Card className="border border-amber-500/30 bg-amber-500/5 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" />
          <CardContent className="p-10 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto animate-pulse">
              <Shield className="w-12 h-12 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-amber-500 uppercase tracking-wide">Under Review</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Your documents and signed DSA Agreement have been submitted. Our compliance team will review within 1–2 business days.
            </p>
            <div className="inline-flex items-center gap-2 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Signed DSA Form Submitted
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected — allow re-submission
  if (kycStatus === 'rejected' && !resubmitting) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-300 space-y-4">
        <Card className="border border-rose-500/30 bg-rose-500/5 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-500" />
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-rose-500/15 border border-rose-500/35 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-12 h-12 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-rose-500 uppercase tracking-wide">Verification Rejected</h3>
            {apiKyc?.rejection_reason && (
              <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-left text-xs text-rose-400">
                <span className="font-bold block text-rose-500 mb-1">Reason:</span>
                {apiKyc.rejection_reason}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Please correct the issues and re-submit your documents.</p>
            <Button onClick={() => { setResubmitting(true); setStep('docs'); }} className="bg-primary text-xs font-bold px-6 h-9">
              Re-submit Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main wizard ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Card className="border border-border bg-card shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-primary to-orange-500" />

        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                KYC & DSA Verification
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Complete all 5 steps to unlock withdrawals</p>
            </div>
            {loadingKyc && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Step sidebar */}
            <div className="lg:col-span-3 space-y-1">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                const done = stepDone[s.id];
                return (
                  <button key={s.id} type="button" onClick={() => setStep(s.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all ${
                      isActive
                        ? 'bg-primary/10 border-primary/30 text-foreground font-bold'
                        : 'bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/30'
                    }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black ${
                      isActive ? 'bg-primary text-white' : done ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted/60'
                    }`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] leading-tight font-semibold">{idx + 1}. {s.label}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{s.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step content */}
            <div className="lg:col-span-9 space-y-5">

              {/* STEP 1 — PERSONAL */}
              {step === 'personal' && (
                <form onSubmit={e => { e.preventDefault(); if (authToken) saveDraftMutation.mutate(); setStep('identity'); }} className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                    1. Personal Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name (as in Aadhaar) *</Label>
                      <Input required value={personal.fullName} onChange={e => setPersonal(p => ({ ...p, fullName: e.target.value }))} className="h-9 text-xs bg-muted/20" placeholder="Exactly as in Aadhaar card" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Father / Husband Name</Label>
                      <Input value={personal.fatherName} onChange={e => setPersonal(p => ({ ...p, fatherName: e.target.value }))} className="h-9 text-xs bg-muted/20" placeholder="Father / husband name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Age</Label>
                      <Input type="number" min="18" max="100" value={personal.age} onChange={e => setPersonal(p => ({ ...p, age: e.target.value }))} className="h-9 text-xs bg-muted/20" placeholder="Years" />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Residential Address</Label>
                      <Input value={personal.address} onChange={e => setPersonal(p => ({ ...p, address: e.target.value }))} className="h-9 text-xs bg-muted/20" placeholder="Full address with pin code" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile Number *</Label>
                      <Input required value={personal.mobile} onChange={e => setPersonal(p => ({ ...p, mobile: e.target.value }))} className="h-9 text-xs bg-muted/20" placeholder="+91 98765 43210" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address *</Label>
                      <Input required type="email" value={personal.email} onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))} className="h-9 text-xs bg-muted/20" placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" className="bg-primary text-xs font-bold px-6 h-9">Save & Continue</Button>
                  </div>
                </form>
              )}

              {/* STEP 2 — IDENTITY */}
              {step === 'identity' && (
                <form onSubmit={e => { e.preventDefault(); if (authToken) saveDraftMutation.mutate(); setStep('bank'); }} className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                    2. Identity Credentials
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Aadhaar Number *</Label>
                      <Input required maxLength={12} value={identity.aadhaarNumber} onChange={e => setIdentity(i => ({ ...i, aadhaarNumber: e.target.value.replace(/\D/g, '') }))} className="h-9 text-xs bg-muted/20 font-mono tracking-widest" placeholder="12-digit Aadhaar" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">PAN Number *</Label>
                      <Input required maxLength={10} value={identity.panNumber} onChange={e => setIdentity(i => ({ ...i, panNumber: e.target.value.toUpperCase() }))} className="h-9 text-xs bg-muted/20 font-mono tracking-widest" placeholder="ABCDE1234F" />
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep('personal')} className="text-xs h-9">Back</Button>
                    <Button type="submit" className="bg-primary text-xs font-bold px-6 h-9">Save & Continue</Button>
                  </div>
                </form>
              )}

              {/* STEP 3 — BANK */}
              {step === 'bank' && (
                <form onSubmit={e => { e.preventDefault(); if (authToken) saveDraftMutation.mutate(); setStep('docs'); }} className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                    3. Bank Settlement Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Bank Name *</Label>
                      <Input required value={bank.bankName} onChange={e => setBank(b => ({ ...b, bankName: e.target.value }))} className="h-9 text-xs bg-muted/20" placeholder="e.g. HDFC Bank" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Account Holder Name *</Label>
                      <Input required value={bank.accountHolder} onChange={e => setBank(b => ({ ...b, accountHolder: e.target.value }))} className="h-9 text-xs bg-muted/20" placeholder="Name in bank records" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Account Number *</Label>
                      <Input required value={bank.accountNumber} onChange={e => setBank(b => ({ ...b, accountNumber: e.target.value.replace(/\D/g, '') }))} className="h-9 text-xs bg-muted/20 font-mono" placeholder="Account number" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">IFSC Code *</Label>
                      <Input required value={bank.ifsc} onChange={e => setBank(b => ({ ...b, ifsc: e.target.value.toUpperCase() }))} className="h-9 text-xs bg-muted/20 font-mono" placeholder="HDFC0001234" />
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep('identity')} className="text-xs h-9">Back</Button>
                    <Button type="submit" className="bg-primary text-xs font-bold px-6 h-9">Save & Continue</Button>
                  </div>
                </form>
              )}

              {/* STEP 4 — DOCUMENT UPLOADS */}
              {step === 'docs' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                    4. Identity Document Uploads
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Upload clear photos/scans. Accepted: JPG, PNG, PDF. Max 10MB each.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { field: 'aadhaarFront', label: 'Aadhaar Card — Front *', required: true },
                      { field: 'aadhaarBack', label: 'Aadhaar Card — Back *', required: true },
                      { field: 'panCard', label: 'PAN Card *', required: true },
                      { field: 'selfie', label: 'Selfie with PAN Card *', required: true },
                      { field: 'cancelledCheque', label: 'Cancelled Cheque / Passbook', required: false },
                    ].map(doc => {
                      const url = docUrls[doc.field];
                      const isUp = uploading[doc.field];
                      return (
                        <div key={doc.field} className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                          <Label className="text-[10.5px] font-bold text-foreground">{doc.label}</Label>
                          {url ? (
                            <div className="flex items-center justify-between gap-2">
                              <a href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold hover:underline truncate">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Uploaded</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                              <label className="text-[9px] text-muted-foreground cursor-pointer hover:text-foreground underline">
                                Replace
                                <input type="file" className="hidden" accept="image/*,.pdf"
                                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(doc.field, f); }} />
                              </label>
                            </div>
                          ) : (
                            <label className={`flex items-center justify-center gap-2 w-full h-10 rounded-lg border-2 border-dashed text-xs font-semibold cursor-pointer transition-colors ${isUp ? 'border-primary/40 text-primary/60 bg-primary/5' : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/30'}`}>
                              {isUp ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading…</> : <><UploadCloud className="w-3.5 h-3.5" />Select file</>}
                              <input type="file" className="hidden" accept="image/*,.pdf" disabled={isUp}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(doc.field, f); }} />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {submitError}
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep('bank')} className="text-xs h-9">Back</Button>
                    <Button
                      type="button"
                      disabled={!isDocsComplete || submitDocsMutation.isPending}
                      onClick={() => { setSubmitError(''); submitDocsMutation.mutate(); }}
                      className="bg-primary text-xs font-bold px-6 h-9"
                    >
                      {submitDocsMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</> : 'Save & Continue'}
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 5 — DSA FORM */}
              {step === 'dsa' && (
                <div className="space-y-5">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                    5. Direct Seller Agreement (DSA)
                  </h3>

                  {/* Instructions */}
                  <div className="space-y-3">
                    {[
                      { n: '1', text: 'Download your pre-filled DSA Agreement form', action: (
                        <Button type="button" onClick={openDsaForm} size="sm"
                          className="h-8 text-[10px] font-bold bg-primary hover:bg-primary/90 text-white px-4">
                          <Download className="w-3.5 h-3.5 mr-1.5" />Download / Print Form
                        </Button>
                      )},
                      { n: '2', text: 'Print the form, sign it by hand on the signature line, and date it.' },
                      { n: '3', text: 'Scan or photograph the signed form clearly (JPG, PNG, or PDF).' },
                      { n: '4', text: 'Upload the signed form below, then review and click Submit.', action: (
                        <div>
                          <input ref={dsaFileRef} type="file" className="hidden" accept="image/*,.pdf"
                            title="Upload signed DSA agreement form"
                            aria-label="Upload signed DSA agreement form"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleDsaUpload(f); }} />
                          <Button type="button" onClick={() => dsaFileRef.current?.click()}
                            disabled={dsaUploading || submitDsaMutation.isPending}
                            size="sm" variant="outline"
                            className={`h-8 text-[10px] font-bold px-4 ${dsaSignedUrl ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10' : 'border-primary/30 text-primary hover:bg-primary/10'}`}>
                            {dsaUploading
                              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Uploading…</>
                              : dsaSignedUrl
                                ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Uploaded — change file</>
                                : <><UploadCloud className="w-3.5 h-3.5 mr-1.5" />Upload Signed Form</>}
                          </Button>
                        </div>
                      )},
                    ].map(row => (
                      <div key={row.n} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/10">
                        <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{row.n}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground font-semibold leading-snug">{row.text}</p>
                          {row.action && <div className="mt-2">{row.action}</div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {submitError}
                    </div>
                  )}

                  {/* Preview of what gets generated */}
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Your Form Will Be Pre-Filled With:</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                      <span className="text-muted-foreground">Name:</span><span className="font-semibold text-foreground">{personal.fullName || '—'}</span>
                      <span className="text-muted-foreground">Mobile:</span><span className="font-semibold text-foreground">{personal.mobile || '—'}</span>
                      <span className="text-muted-foreground">Email:</span><span className="font-semibold text-foreground">{personal.email || '—'}</span>
                      <span className="text-muted-foreground">PAN:</span><span className="font-mono font-semibold text-foreground">{identity.panNumber || '—'}</span>
                      <span className="text-muted-foreground">Aadhaar:</span><span className="font-mono font-semibold text-foreground">{identity.aadhaarNumber ? `****${identity.aadhaarNumber.slice(-4)}` : '—'}</span>
                      <span className="text-muted-foreground">Distributor ID:</span><span className="font-mono font-semibold text-foreground">{userProfile?.username || '—'}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">Not correct? <button type="button" className="text-primary underline" onClick={() => setStep('personal')}>Go back to edit</button></p>
                  </div>

                  <div className="flex justify-between pt-1">
                    <Button type="button" variant="outline" onClick={() => setStep('docs')} className="text-xs h-9">Back</Button>
                    <Button
                      type="button"
                      disabled={!dsaSignedUrl || submitDsaMutation.isPending}
                      onClick={handleDsaSubmit}
                      className="bg-primary hover:bg-primary/90 text-white text-xs font-bold h-9 px-6"
                    >
                      {submitDsaMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Submitting…</> : 'Submit KYC'}
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
