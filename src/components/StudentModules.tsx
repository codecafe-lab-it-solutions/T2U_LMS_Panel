import React, { useRef, useState, useEffect } from 'react';
import RewardsMilestones from './RewardsMilestones';
import BVLedger from './BVLedger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import {
  FileText, Award, Sparkles, Link, Users, Bell, Settings,
  CheckCircle2, Calendar, AwardIcon, Copy,
  UserCheck, Mail, Lock, RefreshCw, Camera, Loader2,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function StudentModules() {
  const {
    activeTab,
    setActiveTab,
    assignments: storeAssignments,
    teamMembers,
    notificationsList,
    markNotificationRead,
    userProfile,
    updateUserProfile,
    courses,
    withdrawalRequests,
    authToken,
  } = useAppStore();

  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Real API: assignments (when logged in via real backend)
  const { data: apiAssignments } = useQuery({
    queryKey: ['my-assignments', authToken],
    queryFn: () => api.assignments.my(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  // Real API: certificates
  const { data: apiCertificates } = useQuery({
    queryKey: ['my-certificates', authToken],
    queryFn: () => api.certificates.my(),
    enabled: !!authToken,
    staleTime: 60_000,
  });


  // Which data source to use
  const assignments = authToken && apiAssignments
    ? apiAssignments.map(a => ({
        id: a.id,
        title: a.title,
        course: a.course.title,
        dueDate: a.due_date?.split('T')[0] ?? '',
        description: a.description,
        status: (a.my_submission
          ? (a.my_submission.grade ? 'Graded' : 'Submitted')
          : 'Not Started') as 'Not Started' | 'Submitted' | 'Graded',
        submissionFile: a.my_submission?.file_url,
        grade: a.my_submission?.grade ?? undefined,
        feedback: a.my_submission?.feedback ?? undefined,
        points: a.max_score,
      }))
    : storeAssignments;

  // Real file upload + submit mutation
  const submitMutation = useMutation({
    mutationFn: async ({ assignId, file }: { assignId: string; file: File }) => {
      const uploaded = await api.upload.file(file);
      return api.assignments.submit(assignId, uploaded.url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      setSelectedAssignId(null);
      setUploadFile(null);
    },
  });

  // Local state for copy refer link
  const [copiedLink, setCopiedLink] = useState(false);

  // Local states for upload assignment
  const [selectedAssignId, setSelectedAssignId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Profile settings state
  const [profileName, setProfileName] = useState(userProfile.name);
  const [profileMobile, setProfileMobile] = useState(userProfile.mobile);
  const [profileAddress, setProfileAddress] = useState(userProfile.address);
  const [profileDob, setProfileDob] = useState(userProfile.dob);
  const [profileEmail, setProfileEmail] = useState(userProfile.email);
  const [profilePhoto, setProfilePhoto] = useState(userProfile.avatar);
  const [profileFatherName, setProfileFatherName] = useState('');
  const [profileGender, setProfileGender] = useState<'' | 'male' | 'female' | 'other'>('');
  const [profileNomineeName, setProfileNomineeName] = useState('');
  const [profileNomineeDob, setProfileNomineeDob] = useState('');
  const [profileNomineeMobile, setProfileNomineeMobile] = useState('');
  const [profileNomineeRelationship, setProfileNomineeRelationship] = useState('');
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Real API: own full profile — hydrates the Settings form with everything captured at
  // registration (father name, gender, DOB, address, nominee) so it's editable in one place.
  const { data: apiMe } = useQuery({
    queryKey: ['auth-me', authToken],
    queryFn: () => api.auth.me(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!apiMe || profileHydrated) return;
    setProfileName(apiMe.full_name || '');
    setProfileMobile(apiMe.phone || '');
    setProfileEmail(apiMe.email || '');
    setProfilePhoto(apiMe.profile_photo_url || userProfile.avatar);
    setProfileDob(apiMe.dob ? apiMe.dob.slice(0, 10) : '');
    setProfileAddress(apiMe.address || '');
    setProfileFatherName(apiMe.father_name || '');
    setProfileGender((apiMe.gender as 'male' | 'female' | 'other') || '');
    setProfileNomineeName(apiMe.nominee_name || '');
    setProfileNomineeDob(apiMe.nominee_dob ? apiMe.nominee_dob.slice(0, 10) : '');
    setProfileNomineeMobile(apiMe.nominee_mobile || '');
    setProfileNomineeRelationship(apiMe.nominee_relationship || '');
    setProfileHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiMe, profileHydrated]);

  // Real API: team / direct referrals
  const { data: teamData } = useQuery({
    queryKey: ['mlm-team', authToken],
    queryFn: () => api.mlm.team(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  // Real API: referrals (referral code + stats)
  const { data: referralsData } = useQuery({
    queryKey: ['mlm-referrals', authToken],
    queryFn: () => api.mlm.referrals(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  // Real API: withdrawals
  const { data: apiWithdrawals = [] } = useQuery<any[]>({
    queryKey: ['my-withdrawals', authToken],
    queryFn: () => api.withdrawals.list(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  // Real referral code from logged-in user data
  const referralCode = referralsData?.referral_code || userProfile.referralCode || userProfile.username || 'T2U-CODE';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProfilePhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignId || !uploadFile) return;
    submitMutation.mutate({ assignId: selectedAssignId, file: uploadFile });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSaving(true);
    try {
      if (authToken) {
        // Real API update
        const updated = await api.auth.updateProfile({
          full_name: profileName,
          phone: profileMobile,
          email: profileEmail !== userProfile.email ? profileEmail : undefined,
          profile_photo_url: profilePhoto !== userProfile.avatar ? profilePhoto : undefined,
          father_name: profileFatherName,
          gender: profileGender || undefined,
          dob: profileDob || undefined,
          address: profileAddress,
          nominee_name: profileNomineeName,
          nominee_dob: profileNomineeDob || undefined,
          nominee_mobile: profileNomineeMobile,
          nominee_relationship: profileNomineeRelationship,
        });
        updateUserProfile({
          name: updated.full_name,
          email: updated.email,
          mobile: updated.phone,
          address: updated.address || '',
          dob: updated.dob ? updated.dob.slice(0, 10) : '',
          avatar: updated.profile_photo_url || profilePhoto,
        });
        queryClient.invalidateQueries({ queryKey: ['auth-me', authToken] });
      } else {
        // Demo mode — update store only
        updateUserProfile({
          name: profileName,
          mobile: profileMobile,
          address: profileAddress,
          dob: profileDob,
          avatar: profilePhoto,
        });
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };



  // ==========================================
  // VIEW: ASSIGNMENTS (`assignments`)
  // ==========================================
  const renderAssignments = () => (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-primary" />
            LMS Assignment Submissions
          </CardTitle>
          <CardDescription className="text-xs">
            Review academic assignments, upload submissions, and check grading feedback.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((as) => (
              <div key={as.id} className="p-4 rounded-xl border border-border bg-muted/10 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">{as.course}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                      as.status === 'Graded' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25' :
                      as.status === 'Submitted' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/25' : 
                      'bg-rose-500/10 text-rose-500 border border-rose-500/25'
                    }`}>
                      {as.status}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-foreground truncate">{as.title}</h4>
                  <p className="text-[11px] text-muted-foreground font-sans leading-relaxed line-clamp-2">
                    {as.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 text-xs space-y-2">
                  <div className="flex justify-between text-[10.5px] text-muted-foreground font-mono">
                    <span>Due Date: {as.dueDate}</span>
                    <span>Points: {as.points}</span>
                  </div>

                  {as.status === 'Graded' && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 space-y-1">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-emerald-500">Grade Score:</span>
                        <strong className="font-mono text-emerald-500">{as.grade}</strong>
                      </div>
                      {as.feedback && (
                        <p className="text-[10px] text-muted-foreground font-sans italic">
                          "Feedback: {as.feedback}"
                        </p>
                      )}
                    </div>
                  )}

                  {as.status === 'Submitted' && (
                    <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/15 text-[10.5px] text-blue-400 font-mono truncate">
                      Submitted file: {as.submissionFile}
                    </div>
                  )}

                  {as.status === 'Not Started' && (
                    <Button
                      onClick={() => { setSelectedAssignId(as.id); setUploadFile(null); }}
                      className="w-full text-xs font-bold h-8 bg-primary hover:bg-primary/95 text-primary-foreground"
                    >
                      Upload Submission File
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload assignment dialog */}
      {selectedAssignId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase text-muted-foreground">Upload Assignment File</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Select File</Label>
                  <input
                    type="file"
                    required
                    title="Select assignment file to upload"
                    aria-label="Select assignment file to upload"
                    accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                  {uploadFile && (
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">{uploadFile.name}</p>
                  )}
                </div>

                {submitMutation.isPending && (
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-[10.5px] text-primary flex items-center gap-2 justify-center">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Uploading and submitting…
                  </div>
                )}

                {submitMutation.isError && (
                  <p className="text-[10px] text-red-500 font-medium text-center">
                    {(submitMutation.error as Error)?.message ?? 'Submission failed'}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" onClick={() => setSelectedAssignId(null)} variant="outline"
                    className="text-xs font-semibold h-8.5 border-border">Cancel</Button>
                  <Button type="submit" disabled={submitMutation.isPending || !uploadFile}
                    className="bg-primary text-xs font-bold px-5 h-8.5 text-primary-foreground">
                    Submit File
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );

  // ==========================================
  // VIEW: CERTIFICATES (`certificates`)
  // ==========================================
  const renderCertificates = () => {
    // Real API certs when logged in via backend; fallback to courses at 100% progress
    const certList = authToken && apiCertificates
      ? apiCertificates.map(cert => ({
          id: cert.id,
          title: cert.course.title,
          certNo: cert.certificate_no,
          issuedAt: cert.issued_at?.split('T')[0] ?? '',
          pdfUrl: cert.pdf_url,
        }))
      : courses
          .filter(c => c.progress === 100)
          .map(c => ({ id: c.id, title: c.title, certNo: `T2U-CERT-${c.id}`, issuedAt: '', pdfUrl: null }));

    return (
      <div className="space-y-6">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-primary animate-pulse" />
              LMS verified Certificates
            </CardTitle>
            <CardDescription className="text-xs">
              Complete courses, clear corresponding quizzes, and retrieve your credentials.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {certList.length === 0 ? (
              <div className="p-12 text-center space-y-3 select-none">
                <AwardIcon className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <h4 className="text-xs font-bold text-foreground uppercase">No Certificates Unlocked Yet</h4>
                <p className="text-xs text-muted-foreground font-sans max-w-sm mx-auto">
                  Certificates are generated once a course reaches 100% progress. Open courses to solve checking quizzes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certList.map((cert) => (
                  <div key={cert.id} className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{cert.title}</h4>
                        <span className="text-[9px] font-mono text-muted-foreground block uppercase">Verified via T2U LMS</span>
                        {cert.issuedAt && <span className="text-[9px] text-muted-foreground font-mono block">Issued: {cert.issuedAt}</span>}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
                      <span className="text-[10px] text-muted-foreground font-mono">ID: {cert.certNo}</span>
                      {cert.pdfUrl ? (
                        <a
                          href={cert.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] h-7 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded flex items-center"
                        >
                          Download PDF
                        </a>
                      ) : (
                        <Button
                          onClick={() => alert(`Certificate for ${cert.title} will be available for download once processed.`)}
                          className="text-[10px] h-7 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3"
                        >
                          Download PDF
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ==========================================
  // VIEW: REWARDS (`rewards`)
  // ==========================================
  const renderRewards = () => <RewardsMilestones />;

  // ==========================================
  // VIEW: REFERRAL DASHBOARD (`referral-dashboard`)
  // ==========================================
  const renderReferralDashboard = () => {
    const totalEnrolled = teamData?.direct_count ?? teamMembers.length;
    const activeEnrollments = teamData?.active_count ?? teamMembers.filter(m => m.status === 'IN').length;
    const totalDsi = referralsData?.total_dsi ?? teamMembers.reduce((sum, m) => sum + m.commissionEarned, 0);

    const displayWithdrawals = authToken && apiWithdrawals.length > 0
      ? apiWithdrawals.map((w: any) => ({
          id: w.id,
          date: new Date(w.requested_at ?? w.created_at).toLocaleDateString('en-IN'),
          amount: parseFloat(w.amount),
          status: w.status === 'paid' ? 'Approved' : w.status === 'rejected' ? 'Rejected' : 'Pending',
        }))
      : withdrawalRequests;

    return (
      <div className="space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm text-center space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Total Students</span>
            <span className="text-3xl font-extrabold text-violet-500 font-mono">{totalEnrolled}</span>
            <span className="text-[10px] text-muted-foreground block">Total unique referrals registered</span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm text-center space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Active Enrollment</span>
            <span className="text-3xl font-extrabold text-emerald-500 font-mono">{activeEnrollments}</span>
            <span className="text-[10px] text-muted-foreground block">Currently active in binary downline</span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm text-center space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Total Commissions from Enrollment</span>
            <span className="text-3xl font-extrabold text-indigo-500 font-mono">₹{totalDsi.toFixed(2)}</span>
            <span className="text-[10px] text-muted-foreground block">Lifetime earnings from referrals</span>
          </div>
        </div>

        {/* Referral code card */}
        <Card className="border border-border bg-card shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-primary to-orange-500" />

          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Link className="w-4.5 h-4.5 text-primary" />
              Referral Code sharing
            </CardTitle>
            <CardDescription className="text-xs">
              Invite colleagues, unlock binary matching structures, and earn sweeps incentives.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="space-y-4 max-w-md">
              <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
                Invite friends and earn referral cashouts
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                When new users subscribe with your code and activate their academic profiles, they enter your binary downline chronology.
              </p>

              <div className="flex gap-2 items-center bg-muted/40 p-2.5 rounded-xl border border-border">
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] text-muted-foreground block font-mono uppercase">Your Referral code</span>
                  <span className="text-sm font-bold text-foreground font-mono">{referralCode}</span>
                </div>
                <Button onClick={handleCopyCode} className="h-8.5 text-xs bg-primary text-primary-foreground font-bold flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5" />
                  {copiedLink ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Records */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserCheck className="w-4.5 h-4.5 text-primary" />
              My Withdrawal Records
            </CardTitle>
            <CardDescription className="text-xs">
              Your withdrawal request history and payout status.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {displayWithdrawals.length === 0 ? (
              <div className="p-10 text-center text-xs text-muted-foreground font-sans">
                No withdrawal records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                      <th className="p-4">Request ID</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Amount (INR)</th>
                      <th className="p-4 text-right">Net After Charges</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {displayWithdrawals.map((req: any) => (
                      <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-foreground">{String(req.id).slice(0, 8).toUpperCase()}</td>
                        <td className="p-4 text-muted-foreground font-mono">{req.date}</td>
                        <td className="p-4 text-right font-mono font-bold">₹{parseFloat(req.amount).toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-500">₹{(parseFloat(req.amount) * 0.90).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                            req.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    );
  };

  // ==========================================
  // VIEW: MY TEAM (`my-team`)
  // ==========================================
  const renderMyTeam = () => {
    const members = teamData?.direct_team ?? teamMembers.map(m => ({
      id: m.id,
      full_name: m.name,
      email: m.email,
      profile_photo_url: m.avatar,
      created_at: m.joinDate,
      is_active: m.status === 'IN',
      total_earnings: m.commissionEarned,
      package: { name: m.role },
      binary_position: null as string | null,
    }));

    return (
      <div className="space-y-4">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Members', value: teamData?.direct_count ?? members.length, color: 'text-violet-500' },
            { label: 'Active Members', value: teamData?.active_count ?? members.filter((m: any) => m.is_active).length, color: 'text-emerald-500' },
            { label: 'Left Leg', value: teamData?.left_count ?? 0, color: 'text-blue-500' },
            { label: 'Right Leg', value: teamData?.right_count ?? 0, color: 'text-orange-500' },
          ].map(kpi => (
            <div key={kpi.label} className="p-3 rounded-xl border border-border bg-card text-center space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">{kpi.label}</span>
              <span className={`text-2xl font-extrabold font-mono ${kpi.color}`}>{kpi.value}</span>
            </div>
          ))}
        </div>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-primary" />
              Direct Referral network
            </CardTitle>
            <CardDescription className="text-xs">
              Direct downline registry entries connected with your invitation code.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {members.length === 0 ? (
              <div className="p-10 text-center text-xs text-muted-foreground">No direct referrals yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold font-sans">
                      <th className="p-4">Partner Name</th>
                      <th className="p-4">Registry Email</th>
                      <th className="p-4">Package</th>
                      <th className="p-4">Date Joined</th>
                      <th className="p-4">Commissions generated</th>
                      <th className="p-4 text-center">Position</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {members.map((m: any) => (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-semibold text-foreground">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {(m.full_name ?? '?')[0]?.toUpperCase()}
                            </div>
                            {m.full_name ?? '—'}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground font-mono">{m.email}</td>
                        <td className="p-4 text-muted-foreground">{m.package?.name ?? '—'}</td>
                        <td className="p-4 text-muted-foreground font-mono">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="p-4 font-bold text-emerald-500 font-mono">+₹{parseFloat(m.total_earnings ?? 0).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          {m.binary_position ? (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              m.binary_position === 'left' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                            }`}>
                              {m.binary_position}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            m.is_active
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}>
                            {m.is_active ? 'Active IN' : 'Inactive OUT'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ==========================================
  // VIEW: NOTIFICATIONS (`notifications`)
  // ==========================================
  const renderNotifications = () => (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Bell className="w-4.5 h-4.5 text-primary animate-pulse" />
          System notifications registry
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-2.5">
        {notificationsList.map((n) => (
          <div 
            key={n.id} 
            className={`p-3.5 rounded-xl border flex justify-between items-start gap-4 transition-all ${
              n.unread 
                ? 'bg-primary/5 border-primary/20 shadow-xs' 
                : 'bg-muted/10 border-border opacity-70'
            }`}
          >
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase font-mono">
                {n.category}
              </span>
              <p className="text-xs text-foreground font-medium">{n.text}</p>
              <span className="text-[9.5px] text-muted-foreground font-mono block">{n.date}</span>
            </div>

            {n.unread && (
              <Button
                onClick={() => markNotificationRead(n.id)}
                variant="outline"
                className="text-[9.5px] font-bold h-7 border-border px-3 shrink-0"
              >
                Mark Read
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  // ==========================================
  // VIEW: PROFILE SETTINGS (`settings`)
  // ==========================================
  const renderSettings = () => (
    <div className="max-w-xl mx-auto text-left space-y-4">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Personal Profile Settings
          </CardTitle>
          <CardDescription className="text-xs font-sans">
            Update your contact details, email address, and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveSettings} className="space-y-5">

            {/* Profile photo section */}
            <div className="flex items-center gap-5 border-b border-border/40 pb-5">
              <div className="relative shrink-0">
                <img
                  src={profilePhoto || userProfile.avatar}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-primary"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow border-2 border-background hover:bg-primary/90 transition-colors"
                  title="Change photo"
                >
                  <Camera className="w-3 h-3 text-white" />
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">{userProfile.name}</h4>
                <span className="text-[9.5px] font-mono text-muted-foreground uppercase block">{userProfile.role}</span>
                <span className="text-[9px] text-muted-foreground font-sans block mt-0.5">Member since: {userProfile.memberSince}</span>
                <span className="text-[9px] text-violet-400 font-mono block mt-0.5">Click camera icon to change photo</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* T2U Username — always locked */}
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3" /> T2U Username (fixed)
                </Label>
                <Input
                  type="text"
                  disabled
                  value={userProfile.username}
                  className="h-9 text-xs bg-muted/30 font-mono opacity-70 cursor-not-allowed border-border"
                />
              </div>

              {/* Email — editable for real API users */}
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email Address
                  {authToken && <span className="text-violet-400 ml-1">(editable)</span>}
                </Label>
                <Input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  disabled={!authToken}
                  className={`h-9 text-xs border-border font-mono ${authToken ? 'bg-muted/20' : 'bg-muted/30 opacity-70 cursor-not-allowed'}`}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</Label>
                <Input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="h-9 text-xs bg-muted/20 border-border"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile Phone</Label>
                <Input
                  type="text"
                  value={profileMobile}
                  onChange={(e) => setProfileMobile(e.target.value)}
                  className="h-9 text-xs bg-muted/20 border-border"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Father Name</Label>
                <Input
                  type="text"
                  value={profileFatherName}
                  onChange={(e) => setProfileFatherName(e.target.value)}
                  className="h-9 text-xs bg-muted/20 border-border"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Gender</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['male', 'female', 'other'] as const).map(g => (
                    <button key={g} type="button" onClick={() => setProfileGender(g)}
                      className={`h-9 rounded-lg border text-[10px] font-bold capitalize transition-colors ${profileGender === g ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-border text-muted-foreground hover:border-border/80 bg-muted/10'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Date of Birth</Label>
                <Input
                  type="date"
                  value={profileDob}
                  onChange={(e) => setProfileDob(e.target.value)}
                  className="h-9 text-xs bg-muted/20 border-border font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Permanent Address</Label>
                <Input
                  type="text"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="h-9 text-xs bg-muted/20 border-border"
                />
              </div>
            </div>

            {/* Nominee details */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase block">Nominee Details</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Nominee Name</Label>
                  <Input type="text" value={profileNomineeName} onChange={(e) => setProfileNomineeName(e.target.value)} className="h-9 text-xs bg-muted/20 border-border" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Nominee Date of Birth</Label>
                  <Input type="date" value={profileNomineeDob} onChange={(e) => setProfileNomineeDob(e.target.value)} className="h-9 text-xs bg-muted/20 border-border font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Nominee Mobile</Label>
                  <Input type="tel" value={profileNomineeMobile} onChange={(e) => setProfileNomineeMobile(e.target.value)} className="h-9 text-xs bg-muted/20 border-border" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Relationship</Label>
                  <Input type="text" placeholder="e.g. Spouse, Parent" value={profileNomineeRelationship} onChange={(e) => setProfileNomineeRelationship(e.target.value)} className="h-9 text-xs bg-muted/20 border-border" />
                </div>
              </div>
            </div>

            {profileError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10.5px] text-rose-500 text-center font-medium">
                {profileError}
              </div>
            )}

            {profileSaved && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10.5px] text-emerald-500 text-center font-medium flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Profile updated successfully!
              </div>
            )}

            <Button type="submit" disabled={profileSaving} className="w-full bg-primary text-xs font-bold h-9">
              {profileSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving...</> : 'Save Profile Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Support shortcut card ── */}
      <Card className="border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent shadow-sm">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-500/10 shrink-0">
            <HelpCircle className="w-6 h-6 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Need Help?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Raise a support ticket, track replies, and respond to admin notes — all in one place.</p>
          </div>
          <Button
            type="button"
            onClick={() => setActiveTab('support')}
            className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold h-9 px-4"
          >
            Get Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Title block bar */}
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          {activeTab === 'assignments' && <><FileText className="w-5 h-5 text-primary" /> LMS Assignments</>}
          {activeTab === 'certificates' && <><Award className="w-5 h-5 text-primary" /> Unlocked Credentials</>}
          {/* {activeTab === 'rewards' && <><Sparkles className="w-5 h-5 text-primary" /> Reward Income Milestones</>} */}
          {activeTab === 'bv-ledger' && <><Sparkles className="w-5 h-5 text-primary" /> Business Volume Ledger</>}
          {activeTab === 'referral-dashboard' && <><Link className="w-5 h-5 text-primary" /> Earning from Enrollment</>}
          {activeTab === 'my-team' && <><Users className="w-5 h-5 text-primary" /> Referred team network</>}
          {activeTab === 'notifications' && <><Bell className="w-5 h-5 text-primary" /> Notifications feed</>}
          {activeTab === 'settings' && <><Settings className="w-5 h-5 text-primary" /> Profile Settings</>}
        </h2>
        <p className="text-xs text-muted-foreground font-sans mt-0.5">
          {activeTab === 'assignments' && 'Upload project reports or audit feedbacks.'}
          {activeTab === 'certificates' && 'Confirm completed courses credentials.'}
          {/* {activeTab === 'rewards' && 'Achieve equal BV on both legs to unlock and redeem rewards.'} */}
          {activeTab === 'bv-ledger' && 'Track your left and right leg business volume history.'}
          {activeTab === 'referral-dashboard' && 'Distribute invitation code and view metrics.'}
          {activeTab === 'my-team' && 'Direct referred users active parameters.'}
          {activeTab === 'notifications' && 'System logs feed updates.'}
          {activeTab === 'settings' && 'Update identity display parameters.'}
        </p>
      </div>

      {activeTab === 'assignments' && renderAssignments()}
      {activeTab === 'certificates' && renderCertificates()}
      {activeTab === 'rewards' && renderRewards()}
      {activeTab === 'bv-ledger' && <BVLedger />}
      {activeTab === 'referral-dashboard' && renderReferralDashboard()}
      {activeTab === 'my-team' && renderMyTeam()}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'settings' && renderSettings()}

    </div>
  );
}
