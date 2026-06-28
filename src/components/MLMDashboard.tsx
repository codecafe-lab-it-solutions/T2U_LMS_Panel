import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Users, Wallet, FileText, ArrowUpRight, GitCommit, Link,
  Copy, CheckCircle2, Clock, AlertCircle, TrendingUp, ChevronRight,
  Upload, Star, Activity, DollarSign, Shield, Network
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MLMDashboard() {
  const {
    userProfile, assignments, teamMembers, earningSummary,
    withdrawalRequests, leftTeamBV, rightTeamBV, transactions,
    setActiveTab, submitAssignment, rewardPoints
  } = useAppStore();

  const [copiedCode, setCopiedCode] = useState(false);
  const [submitModal, setSubmitModal] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: '', title: '' });
  const [fileNameInput, setFileNameInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const referralCode = `T2U-${userProfile.name.split(' ')[0].toUpperCase().slice(0, 6)}-${userProfile.username.slice(-4).toUpperCase()}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileNameInput || !submitModal.id) return;
    setSubmitting(true);
    setTimeout(() => {
      submitAssignment(submitModal.id, fileNameInput);
      setSubmitting(false);
      setSubmitModal({ open: false, id: '', title: '' });
      setFileNameInput('');
    }, 800);
  };

  const activeTeam = teamMembers.filter(m => m.status === 'IN').length;
  const inactiveTeam = teamMembers.filter(m => m.status === 'OUT').length;
  const pendingAssignments = assignments.filter(a => a.status === 'Not Started').length;
  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'Pending');
  const matchableBonus = Math.min(leftTeamBV, rightTeamBV);
  const claimableBonus = ((matchableBonus / 1000) * 120).toFixed(2);
  const referralTxs = transactions.filter(t => t.category === 'Referral' && t.amount > 0);
  const totalReferralEarnings = referralTxs.reduce((s, t) => s + t.amount, 0);

  const statCards = [
    { label: 'Active Team', value: `${activeTeam}/${teamMembers.length}`, sub: `${inactiveTeam} inactive`, icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Total Earned', value: `₹${earningSummary.total.toFixed(2)}`, sub: `₹${earningSummary.available.toFixed(2)} available`, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Open Assignments', value: String(pendingAssignments), sub: `${assignments.length} total tasks`, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Pending W/D', value: `₹${pendingWithdrawals.reduce((s, w) => s + w.amount, 0).toFixed(2)}`, sub: `${pendingWithdrawals.length} requests`, icon: ArrowUpRight, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  const statusColor = (s: string) => {
    if (s === 'Graded') return 'text-emerald-500 bg-emerald-500/10';
    if (s === 'Submitted') return 'text-blue-500 bg-blue-500/10';
    return 'text-amber-500 bg-amber-500/10';
  };

  const wdStatusColor = (s: string) => {
    if (s === 'Approved') return 'text-emerald-500 bg-emerald-500/10';
    if (s === 'Rejected') return 'text-rose-500 bg-rose-500/10';
    return 'text-amber-500 bg-amber-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-violet-500/10 rounded-lg">
            <Network className="w-4 h-4 text-violet-500" />
          </div>
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">MLM Network Dashboard</h2>
        </div>
        <p className="text-xs text-muted-foreground font-sans">Your complete network, earnings, assignments &amp; activity overview</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                    <p className="text-lg font-black text-foreground mt-0.5 font-mono">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                  </div>
                  <div className={`p-2 rounded-lg shrink-0 ml-2 ${s.bg}`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two-column grid for main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ASSIGNMENTS */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Assignments
              {pendingAssignments > 0 && (
                <span className="text-[9px] font-bold bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded-full">
                  {pendingAssignments} pending
                </span>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('assignments')}
              className="text-[10px] h-7 text-primary font-bold gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {assignments.slice(0, 3).map((a, i) => (
              <div key={a.id} className={`flex items-center gap-3 px-4 py-3 ${i < 2 ? 'border-b border-border/30' : ''}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${a.status === 'Graded' ? 'bg-emerald-500' : a.status === 'Submitted' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-foreground truncate">{a.title}</p>
                  <p className="text-[9.5px] text-muted-foreground">{a.course} • Due {a.dueDate}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusColor(a.status)}`}>{a.status}</span>
                  {a.status === 'Not Started' && (
                    <Button
                      size="sm"
                      onClick={() => { setSubmitModal({ open: true, id: a.id, title: a.title }); setFileNameInput(''); }}
                      className="h-6 text-[9px] font-bold px-2 bg-primary text-white"
                    >
                      <Upload className="w-2.5 h-2.5 mr-1" /> Submit
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No assignments yet</p>
            )}
          </CardContent>
        </Card>

        {/* REFERRAL */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Link className="w-4 h-4 text-violet-500" />
              Referral Program
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('referral-dashboard')}
              className="text-[10px] h-7 text-primary font-bold gap-1"
            >
              Manage <ChevronRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1.5">Your Referral Code</p>
              <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl px-3 py-2">
                <span className="font-mono text-xs font-bold text-primary flex-1">{referralCode}</span>
                <button type="button" onClick={handleCopyCode} className="text-muted-foreground hover:text-primary transition-colors">
                  {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/30 rounded-xl p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Referrals</p>
                <p className="text-base font-black text-foreground font-mono">{referralTxs.length}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Earned</p>
                <p className="text-base font-black text-emerald-500 font-mono">₹{totalReferralEarnings.toFixed(0)}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Reward Pts</p>
                <p className="text-base font-black text-violet-500 font-mono">{rewardPoints.points}</p>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground bg-violet-500/5 border border-violet-500/15 rounded-xl p-2.5 flex items-start gap-1.5">
              <Star className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
              Share your code and earn ₹25 commission for every active referral who joins your network.
            </div>
          </CardContent>
        </Card>

        {/* WITHDRAWALS */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
              Withdrawals
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('withdrawals')}
              className="text-[10px] h-7 text-primary font-bold gap-1"
            >
              Request <ChevronRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold text-emerald-600 uppercase">Available</p>
                <p className="text-lg font-black text-emerald-500 font-mono">₹{earningSummary.available.toFixed(2)}</p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold text-amber-600 uppercase">Pending</p>
                <p className="text-lg font-black text-amber-500 font-mono">₹{earningSummary.pending.toFixed(2)}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Recent Requests</p>
              {withdrawalRequests.slice(0, 3).map((w) => (
                <div key={w.id} className="flex items-center justify-between text-[10.5px] py-1.5 border-b border-border/20 last:border-0">
                  <div>
                    <span className="font-bold text-foreground font-mono">₹{w.amount.toFixed(2)}</span>
                    <span className="text-muted-foreground ml-2">{w.bankAccount}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${wdStatusColor(w.status)}`}>{w.status}</span>
                </div>
              ))}
              {withdrawalRequests.length === 0 && <p className="text-xs text-muted-foreground py-2">No withdrawal history</p>}
            </div>
          </CardContent>
        </Card>

        {/* GENEALOGY PREVIEW */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-blue-500" />
              Genealogy Tree
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('genealogy')}
              className="text-[10px] h-7 text-primary font-bold gap-1"
            >
              Open Tree <ChevronRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
                <p className="text-[9px] font-bold text-blue-500 uppercase mb-1">Left BV</p>
                <p className="text-xl font-black text-blue-500 font-mono">{leftTeamBV.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">Business Volume</p>
              </div>
              <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-3">
                <p className="text-[9px] font-bold text-violet-500 uppercase mb-1">Right BV</p>
                <p className="text-xl font-black text-violet-500 font-mono">{rightTeamBV.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">Business Volume</p>
              </div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-emerald-600 uppercase">Matching Bonus Claimable</p>
                <p className="text-lg font-black text-emerald-500 font-mono">₹{claimableBonus}</p>
                <p className="text-[9.5px] text-muted-foreground">12% rate · Daily cap ₹10,000</p>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveTab('genealogy')}
                className="text-[10px] h-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              >
                Claim
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MY TEAM full-width */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            My Team
            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full">{teamMembers.length} members</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('my-team')}
            className="text-[10px] h-7 text-primary font-bold gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {teamMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/10">
                <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-border shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-foreground truncate">{m.name}</p>
                  <p className="text-[9px] text-muted-foreground">{m.role} · {m.joinDate}</p>
                  <p className="text-[9.5px] font-bold text-emerald-500">₹{m.commissionEarned.toFixed(2)} earned</p>
                </div>
                <span className={`text-[9px] font-black px-2 py-1 rounded-full shrink-0 ${m.status === 'IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                  {m.status}
                </span>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <p className="col-span-3 text-xs text-muted-foreground text-center py-4">No team members yet. Share your referral code to grow your network.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Income Dashboard', icon: TrendingUp, tab: 'income-dashboard' as const, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Commission History', icon: Activity, tab: 'commission-history' as const, color: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: 'KYC Verification', icon: Shield, tab: 'kyc' as const, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Reward Points', icon: Star, tab: 'rewards' as const, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((q) => {
          const Icon = q.icon;
          return (
            <button
              key={q.label}
              type="button"
              onClick={() => setActiveTab(q.tab)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors text-center"
            >
              <div className={`p-2.5 rounded-xl ${q.bg}`}>
                <Icon className={`w-4 h-4 ${q.color}`} />
              </div>
              <span className="text-[10px] font-bold text-foreground">{q.label}</span>
            </button>
          );
        })}
      </div>

      {/* Submit Assignment Modal */}
      {submitModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-primary to-orange-500" />
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black text-foreground">Submit Assignment</h3>
            </div>
            <p className="text-[10.5px] text-muted-foreground mb-4 font-sans">{submitModal.title}</p>
            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1.5">File Name / Submission Link</label>
                <input
                  type="text"
                  required
                  value={fileNameInput}
                  onChange={(e) => setFileNameInput(e.target.value)}
                  placeholder="e.g. assignment_final.pdf"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setSubmitModal({ open: false, id: '', title: '' })} className="h-8 text-xs">Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-primary text-white font-bold">
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
