import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { 
  ShieldCheck, ShieldAlert, Shield, Phone, User, 
  CreditCard, Building2, UploadCloud, FileText, CheckCircle2, 
  AlertTriangle, RefreshCw, Eye, Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function KYCVerification() {
  const {
    kycRecord,
    authToken,
    updateKycPersonal,
    updateKycIdentity,
    updateKycBank,
    uploadKycDoc,
    submitKycForVerification,
    resetKycRecord
  } = useAppStore();

  const { data: apiKyc } = useQuery({
    queryKey: ['my-kyc', authToken],
    queryFn: () => api.kyc.me(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  // Use real KYC status from API when available
  const kycStatus: 'Draft' | 'Pending Verification' | 'Verified' | 'Rejected' = authToken && apiKyc
    ? ((apiKyc as any).status ?? kycRecord.status)
    : kycRecord.status;

  const [activeStep, setActiveStep] = useState<'personal' | 'identity' | 'bank' | 'uploads'>('personal');
  
  // Local form inputs synced with store initial values or drafts
  const [personalForm, setPersonalForm] = useState(kycRecord.personal);
  const [identityForm, setIdentityForm] = useState(kycRecord.identity);
  const [bankForm, setBankForm] = useState(kycRecord.bank);

  // File mock inputs local uploading status
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    updateKycPersonal(personalForm);
    setActiveStep('identity');
  };

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    updateKycIdentity(identityForm);
    setActiveStep('bank');
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    updateKycBank(bankForm);
    setActiveStep('uploads');
  };

  const handleMockUpload = (field: 'panCard' | 'aadhaarFront' | 'aadhaarBack' | 'cancelledCheque' | 'selfie') => {
    setUploadProgress(prev => ({ ...prev, [field]: true }));
    setTimeout(() => {
      uploadKycDoc(field, `mock_${field}_upload.png`);
      setUploadProgress(prev => ({ ...prev, [field]: false }));
    }, 1000);
  };

  const isFormComplete = () => {
    return (
      kycRecord.personal.fullName &&
      kycRecord.personal.mobile &&
      kycRecord.personal.email &&
      kycRecord.identity.aadhaarNumber &&
      kycRecord.identity.panNumber &&
      kycRecord.bank.bankName &&
      kycRecord.bank.accountHolder &&
      kycRecord.bank.accountNumber &&
      kycRecord.bank.ifsc &&
      kycRecord.uploads.panCard &&
      kycRecord.uploads.aadhaarFront &&
      kycRecord.uploads.aadhaarBack &&
      kycRecord.uploads.cancelledCheque &&
      kycRecord.uploads.selfie
    );
  };

  const handleSubmitAll = () => {
    submitKycForVerification();
  };

  const statusColors = {
    'Draft': 'text-blue-500 bg-blue-500/10 border-blue-500/25',
    'Pending Verification': 'text-amber-500 bg-amber-500/10 border-amber-500/25 animate-pulse',
    'Verified': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25',
    'Rejected': 'text-rose-500 bg-rose-500/10 border-rose-500/25'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none animate-in fade-in duration-300">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* KYC Overview Card */}
      <Card className="border border-border bg-card shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-primary to-orange-500" />
        
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                KYC Compliance Hub
              </CardTitle>
              <CardDescription className="text-xs">
                LMS Identity Registry & Bank Verification
              </CardDescription>
            </div>
            
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border ${statusColors[kycStatus]}`}>
              {kycStatus}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8 space-y-8">
          
          {/* Status-Based Splash UI */}
          {kycStatus === 'Verified' ? (
            <div className="text-center py-8 space-y-4 max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-12 h-12 text-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-emerald-500 uppercase tracking-wide">Verification Success</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your identity and banking registry details have been audited and verified. All withdrawal locks have been successfully removed, allowing vault transfers.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-left space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Registered Credentials</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="text-muted-foreground">Name:</div>
                  <div className="text-foreground text-right font-bold">{kycRecord.personal.fullName}</div>
                  <div className="text-muted-foreground">PAN:</div>
                  <div className="text-foreground text-right font-bold">{kycRecord.identity.panNumber}</div>
                  <div className="text-muted-foreground">Account:</div>
                  <div className="text-foreground text-right font-bold">{kycRecord.bank.bankName} (...{kycRecord.bank.accountNumber.slice(-4)})</div>
                </div>
              </div>
            </div>
          ) : kycStatus === 'Pending Verification' ? (
            <div className="text-center py-8 space-y-4 max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto animate-pulse">
                <Shield className="w-12 h-12 text-amber-500 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-amber-500 uppercase tracking-wide animate-pulse">Pending Auditor Review</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your uploaded PAN cards, Aadhaar files, and bank statements are queued in the compliance registry. Payout sweeps will activate immediately upon verification.
                </p>
              </div>
              <div className="bg-muted/40 p-4 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed">
                Verification checks generally require less than 1-2 hours. You will receive an alert once audited.
              </div>
            </div>
          ) : kycStatus === 'Rejected' ? (
            <div className="text-center py-8 space-y-4 max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-full bg-rose-500/15 border border-rose-500/35 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-12 h-12 text-rose-500" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-rose-500 uppercase tracking-wide">Verification Rejected</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The compliance checks detected blurred text or incorrect document formats. Review and update details before re-submitting.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-left text-xs text-rose-400 space-y-1">
                <span className="font-bold block text-rose-500">Reason for rejection:</span>
                <p>Blurred selfie picture or mismatch between Aadhaar profile name and Bank holder name details.</p>
              </div>
              <Button
                id="btn-restart-kyc"
                onClick={resetKycRecord}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-6 h-9"
              >
                Restart Compliance Form
              </Button>
            </div>
          ) : (
            // DRAFT MODE - Multi-step interactive wizard
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Sidebar Step Indicators */}
              <div className="lg:col-span-3 space-y-2 border-r border-border/30 pr-4">
                {[
                  { id: 'personal', label: 'Personal details', desc: 'Registry identification', icon: User },
                  { id: 'identity', label: 'Identity credentials', desc: 'Aadhaar / PAN registry', icon: CreditCard },
                  { id: 'bank', label: 'Banking settings', desc: 'Earning sweeps channel', icon: Building2 },
                  { id: 'uploads', label: 'Identity uploads', desc: 'File uploads & docs', icon: UploadCloud }
                ].map((st, index) => {
                  const Icon = st.icon;
                  const isActive = activeStep === st.id;
                  const isDone = 
                    st.id === 'personal' && kycRecord.personal.fullName ||
                    st.id === 'identity' && kycRecord.identity.aadhaarNumber ||
                    st.id === 'bank' && kycRecord.bank.bankName;

                  return (
                    <button
                      key={st.id}
                      onClick={() => setActiveStep(st.id as any)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all ${
                        isActive 
                          ? 'bg-primary/10 border-primary/30 text-foreground font-bold' 
                          : 'bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/80'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] block leading-tight">{st.label}</span>
                        <span className="text-[9px] text-muted-foreground font-sans truncate block">{st.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Form Content */}
              <div className="lg:col-span-9 space-y-6">
                
                {/* STEP 1: PERSONAL DETAILS */}
                {activeStep === 'personal' && (
                  <form onSubmit={handleSavePersonal} className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                      1. Personal details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Legal Full Name</Label>
                        <Input
                          type="text"
                          required
                          placeholder="Exactly as in Aadhaar card"
                          value={personalForm.fullName}
                          onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                          className="h-9 text-xs bg-muted/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile phone</Label>
                        <Input
                          type="text"
                          required
                          placeholder="E.g. +91 98765 43210"
                          value={personalForm.mobile}
                          onChange={(e) => setPersonalForm({ ...personalForm, mobile: e.target.value })}
                          className="h-9 text-xs bg-muted/20"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Primary Email</Label>
                        <Input
                          type="email"
                          required
                          placeholder="Your email address"
                          value={personalForm.email}
                          onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                          className="h-9 text-xs bg-muted/20"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" className="bg-primary text-xs font-bold px-6 h-9">
                        Save & Continue
                      </Button>
                    </div>
                  </form>
                )}

                {/* STEP 2: IDENTITY DETAILS */}
                {activeStep === 'identity' && (
                  <form onSubmit={handleSaveIdentity} className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                      2. Identity credentials
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Aadhaar Card Number</Label>
                        <Input
                          type="text"
                          required
                          maxLength={12}
                          placeholder="12 digit Aadhaar number"
                          value={identityForm.aadhaarNumber}
                          onChange={(e) => setIdentityForm({ ...identityForm, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                          className="h-9 text-xs bg-muted/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">PAN Card Number</Label>
                        <Input
                          type="text"
                          required
                          maxLength={10}
                          placeholder="10 digit alphanumeric PAN code"
                          value={identityForm.panNumber}
                          onChange={(e) => setIdentityForm({ ...identityForm, panNumber: e.target.value.toUpperCase() })}
                          className="h-9 text-xs bg-muted/20"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button type="button" onClick={() => setActiveStep('personal')} variant="outline" className="text-xs font-semibold h-9 border-border">
                        Back
                      </Button>
                      <Button type="submit" className="bg-primary text-xs font-bold px-6 h-9">
                        Save & Continue
                      </Button>
                    </div>
                  </form>
                )}

                {/* STEP 3: BANK DETAILS */}
                {activeStep === 'bank' && (
                  <form onSubmit={handleSaveBank} className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                      3. Bank Settlement coordinates
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Bank Name</Label>
                        <Input
                          type="text"
                          required
                          placeholder="E.g. HDFC Bank, ICICI Bank"
                          value={bankForm.bankName}
                          onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                          className="h-9 text-xs bg-muted/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Account Holder Name</Label>
                        <Input
                          type="text"
                          required
                          placeholder="Name in bank records"
                          value={bankForm.accountHolder}
                          onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                          className="h-9 text-xs bg-muted/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Bank Account Number</Label>
                        <Input
                          type="text"
                          required
                          placeholder="Enter account number"
                          value={bankForm.accountNumber}
                          onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                          className="h-9 text-xs bg-muted/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">IFSC Code</Label>
                        <Input
                          type="text"
                          required
                          placeholder="11 digit IFSC code"
                          value={bankForm.ifsc}
                          onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })}
                          className="h-9 text-xs bg-muted/20"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button type="button" onClick={() => setActiveStep('identity')} variant="outline" className="text-xs font-semibold h-9 border-border">
                        Back
                      </Button>
                      <Button type="submit" className="bg-primary text-xs font-bold px-6 h-9">
                        Save & Continue
                      </Button>
                    </div>
                  </form>
                )}

                {/* STEP 4: DOCUMENT UPLOADS */}
                {activeStep === 'uploads' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                      4. Verification Document files
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Upload photographic files corresponding to your details. PDF, PNG, JPG accepted. Max size 2MB.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { field: 'panCard', label: 'PAN Card Photo' },
                        { field: 'aadhaarFront', label: 'Aadhaar Card Front' },
                        { field: 'aadhaarBack', label: 'Aadhaar Card Back' },
                        { field: 'cancelledCheque', label: 'Cancelled Cheque / Passbook' },
                        { field: 'selfie', label: 'Profile selfie image' }
                      ].map((doc) => {
                        const file = kycRecord.uploads[doc.field as keyof typeof kycRecord.uploads];
                        const isUploading = uploadProgress[doc.field];

                        return (
                          <div key={doc.field} className="p-4 rounded-xl border border-border bg-muted/15 flex flex-col justify-between gap-3">
                            <div>
                              <Label className="text-[10.5px] font-bold text-foreground block">{doc.label}</Label>
                              <span className="text-[9.5px] text-muted-foreground block mt-0.5">Mock verification scanning active</span>
                            </div>
                            
                            {file ? (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs font-medium text-emerald-500">
                                <span className="flex items-center gap-1.5 font-mono truncate">
                                  <FileText className="w-3.5 h-3.5" />
                                  {file}
                                </span>
                                <span className="text-[9.5px] font-bold uppercase tracking-wider font-mono">Uploaded</span>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                id={`btn-upload-${doc.field}`}
                                disabled={isUploading}
                                onClick={() => handleMockUpload(doc.field as any)}
                                variant="outline"
                                className="w-full text-xs font-bold h-8.5 border-dashed border-border"
                              >
                                {isUploading ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    Scanning file...
                                  </>
                                ) : (
                                  <>
                                    <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                                    Select photo file
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between pt-6 border-t border-border/40">
                      <Button type="button" onClick={() => setActiveStep('bank')} variant="outline" className="text-xs font-semibold h-9 border-border">
                        Back
                      </Button>
                      
                      <Button
                        type="button"
                        id="btn-submit-kyc-registry"
                        disabled={!isFormComplete()}
                        onClick={handleSubmitAll}
                        className="bg-primary text-xs font-bold px-8 h-9 shadow-md shadow-primary/10"
                      >
                        Submit KYC verification
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </CardContent>
      </Card>


    </div>
  );
}
