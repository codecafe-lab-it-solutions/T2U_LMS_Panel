import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  FileText, Award, Sparkles, Link, Users, Bell, Settings, 
  Upload, CheckCircle2, Shield, Calendar, AwardIcon, Copy, 
  UserCheck, Mail, Lock, RefreshCw, Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function StudentModules() {
  const { 
    activeTab, 
    assignments, 
    submitAssignment, 
    rewardPoints, 
    teamMembers, 
    notificationsList, 
    markNotificationRead,
    userProfile,
    updateUserProfile,
    courses,
    userRole
  } = useAppStore();

  // Local state for copy refer link
  const [copiedLink, setCopiedLink] = useState(false);

  // Local states for upload assignment
  const [selectedAssignId, setSelectedAssignId] = useState<string | null>(null);
  const [mockFileName, setMockFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local settings forms
  const [profileName, setProfileName] = useState(userProfile.name);
  const [profileUsername, setProfileUsername] = useState(userProfile.username);
  const [profileMobile, setProfileMobile] = useState(userProfile.mobile);
  const [profileAddress, setProfileAddress] = useState(userProfile.address);
  const [profileDob, setProfileDob] = useState(userProfile.dob);
  const [profileEmail, setProfileEmail] = useState(userProfile.email);
  const [profileSaved, setProfileSaved] = useState(false);



  const referralCode = userRole === 'instructor' ? 'T2U-INSTRUCTOR-EVELYN' : 'T2U-ELITE-AARYA';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignId || !mockFileName) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      submitAssignment(selectedAssignId, mockFileName);
      setIsSubmitting(false);
      setSelectedAssignId(null);
      setMockFileName('');
    }, 1200);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ 
      name: profileName, 
      username: profileUsername,
      mobile: profileMobile,
      address: profileAddress,
      dob: profileDob
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
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
                      onClick={() => {
                        setSelectedAssignId(as.id);
                        setMockFileName(as.title.toLowerCase().replace(/ /g, '_') + '_submission.pdf');
                      }}
                      className="w-full text-xs font-bold h-8 bg-primary hover:bg-primary/95 text-primary-foreground"
                    >
                      Upload Submission file
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
              <CardTitle className="text-xs font-extrabold uppercase text-muted-foreground">Upload Assignment file</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">File Name (Mock)</Label>
                  <Input
                    type="text"
                    required
                    placeholder="Enter file name"
                    value={mockFileName}
                    onChange={(e) => setMockFileName(e.target.value)}
                    className="h-9 text-xs bg-muted/20 font-mono"
                  />
                </div>
                
                {isSubmitting && (
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-[10.5px] text-primary flex items-center gap-2 justify-center">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Transmitting files to server...
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => setSelectedAssignId(null)}
                    variant="outline"
                    className="text-xs font-semibold h-8.5 border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary text-xs font-bold px-5 h-8.5 text-primary-foreground"
                  >
                    Submit Files
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
    const passedCourses = courses.filter(c => c.progress === 100);

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
            {passedCourses.length === 0 ? (
              <div className="p-12 text-center space-y-3 select-none">
                <AwardIcon className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <h4 className="text-xs font-bold text-foreground uppercase">No Certificates Unlocked Yet</h4>
                <p className="text-xs text-muted-foreground font-sans max-w-sm mx-auto">
                  Certificates are generated once a course reaches 100% progress. Open courses to solve checking quizzes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {passedCourses.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{c.title}</h4>
                        <span className="text-[9px] font-mono text-muted-foreground block uppercase">Passed: verified via LMS</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
                      <span className="text-[10px] text-muted-foreground">ID: T2U-CERT-{c.id}</span>
                      <Button
                        onClick={() => alert(`Downloading Certificate PDF for ${c.title}...`)}
                        className="text-[10px] h-7 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3"
                      >
                        Download PDF
                      </Button>
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
  const renderRewards = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left panel: points summary (4cols) */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="border border-border bg-card shadow-sm border-primary/20 shadow-primary/5">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Available Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-3">
            <div className="inline-block p-2 rounded-full bg-primary/10 text-primary animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <span className="text-4xl font-extrabold text-foreground tracking-tight font-mono">
                {rewardPoints.points}
              </span>
              <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider mt-1">
                T2U reward points
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-sans leading-relaxed">
              Points are generated automatically through course completions, daily sign-ins, and direct referrals sweeps.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Right panel: Ledger list (8cols) */}
      <div className="lg:col-span-8 space-y-4">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Points History Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold font-sans">
                    <th className="p-4">Activity Description</th>
                    <th className="p-4">Processed Date</th>
                    <th className="p-4 text-right">Points Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rewardPoints.history.map((h) => (
                    <tr key={h.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-semibold text-foreground">{h.description}</td>
                      <td className="p-4 text-muted-foreground font-mono">{h.date}</td>
                      <td className="p-4 text-right font-bold text-emerald-500 font-mono">+{h.points} PTS</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );

  // ==========================================
  // VIEW: REFERRAL DASHBOARD (`referral-dashboard`)
  // ==========================================
  const renderReferralDashboard = () => (
    <div className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            <div className="space-y-4">
              <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
                Invite friends and earn ₹500 Referral cashouts
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

            <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Referrals Incentives Program</span>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Direct Signup Bonus:</span>
                  <span className="font-bold text-emerald-500">+₹25.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Binary Team Match (1000 BV):</span>
                  <span className="font-bold text-emerald-500">+₹100.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Capping limit:</span>
                  <span className="font-bold text-foreground">₹10,000.00</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ==========================================
  // VIEW: MY TEAM (`my-team`)
  // ==========================================
  const renderMyTeam = () => (
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold font-sans">
                <th className="p-4">Partner Name</th>
                <th className="p-4">Registry Email</th>
                <th className="p-4">Date Joined</th>
                <th className="p-4">Commissions generated</th>
                <th className="p-4 text-center">Chronology Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {teamMembers.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 flex items-center gap-2.5 font-semibold text-foreground">
                    <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover border border-border" />
                    {m.name}
                  </td>
                  <td className="p-4 text-muted-foreground font-mono">{m.email}</td>
                  <td className="p-4 text-muted-foreground font-mono">{m.joinDate}</td>
                  <td className="p-4 font-bold text-emerald-500 font-mono">+₹{m.commissionEarned.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      m.status === 'IN' 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}>
                      {m.status === 'IN' ? 'Active IN' : 'Inactive OUT'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

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
    <div className="max-w-xl mx-auto text-left">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Personal Profile parameters
          </CardTitle>
          <CardDescription className="text-xs font-sans">
            Update your basic vocational contact profile details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="flex items-center gap-4 border-b border-border/40 pb-4">
              <img src={userProfile.avatar} alt="Profile" className="w-14 h-14 rounded-full object-cover ring-2 ring-primary shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-foreground">{userProfile.name}</h4>
                <span className="text-[9.5px] font-mono text-muted-foreground uppercase block">{userProfile.role}</span>
                <span className="text-[9px] text-muted-foreground font-sans block mt-0.5">Member since: {userProfile.memberSince}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Username</Label>
                <Input
                  type="text"
                  disabled
                  value={profileUsername}
                  className="h-9 text-xs bg-muted/30 font-mono opacity-80 cursor-not-allowed border-border"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</Label>
                <Input
                  type="email"
                  disabled
                  value={userProfile.email}
                  className="h-9 text-xs bg-muted/30 font-mono opacity-80 cursor-not-allowed border-border"
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
                  required
                  value={profileMobile}
                  onChange={(e) => setProfileMobile(e.target.value)}
                  className="h-9 text-xs bg-muted/20 border-border"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Date of Birth</Label>
                <Input
                  type="date"
                  required
                  value={profileDob}
                  onChange={(e) => setProfileDob(e.target.value)}
                  className="h-9 text-xs bg-muted/20 border-border font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Permanent Address</Label>
                <Input
                  type="text"
                  required
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="h-9 text-xs bg-muted/20 border-border"
                />
              </div>
            </div>

            {profileSaved && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10.5px] text-emerald-500 text-center font-medium">
                Profile updated successfully!
              </div>
            )}

            <Button type="submit" className="w-full bg-primary text-xs font-bold h-9">
              Save Profile changes
            </Button>
          </form>
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
          {activeTab === 'rewards' && <><Sparkles className="w-5 h-5 text-primary" /> Rewards points Ledger</>}
          {activeTab === 'referral-dashboard' && <><Link className="w-5 h-5 text-primary" /> Referrals share center</>}
          {activeTab === 'my-team' && <><Users className="w-5 h-5 text-primary" /> Referred team network</>}
          {activeTab === 'notifications' && <><Bell className="w-5 h-5 text-primary" /> Notifications feed</>}
          {activeTab === 'settings' && <><Settings className="w-5 h-5 text-primary" /> Profile Settings</>}
        </h2>
        <p className="text-xs text-muted-foreground font-sans mt-0.5">
          {activeTab === 'assignments' && 'Upload project reports or audit feedbacks.'}
          {activeTab === 'certificates' && 'Confirm completed courses credentials.'}
          {activeTab === 'rewards' && 'Track bonus history sweeps balances.'}
          {activeTab === 'referral-dashboard' && 'Distribute invitation code and view metrics.'}
          {activeTab === 'my-team' && 'Direct referred users active parameters.'}
          {activeTab === 'notifications' && 'System logs feed updates.'}
          {activeTab === 'settings' && 'Update identity display parameters.'}
        </p>
      </div>

      {activeTab === 'assignments' && renderAssignments()}
      {activeTab === 'certificates' && renderCertificates()}
      {activeTab === 'rewards' && renderRewards()}
      {activeTab === 'referral-dashboard' && renderReferralDashboard()}
      {activeTab === 'my-team' && renderMyTeam()}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'settings' && renderSettings()}

    </div>
  );
}
