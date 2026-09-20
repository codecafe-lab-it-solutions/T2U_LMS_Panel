import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api, getMediaUrl } from '../services/api';
import {
  Users, Wallet, ArrowUpRight, GitCommit, Link,
  Copy, CheckCircle2, TrendingUp, ChevronRight,
  Star, Activity, Shield, Network
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MLMDashboard() {
  const {
    userProfile, teamMembers, earningSummary,
    withdrawalRequests, leftTeamBV, rightTeamBV, transactions,
    setActiveTab, rewardPoints, authToken
  } = useAppStore();

  const [copiedCode, setCopiedCode] = useState(false);

  const { data: apiTree } = useQuery({
    queryKey: ['mlm-tree', authToken],
    queryFn: () => api.mlm.tree(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: apiMe } = useQuery({
    queryKey: ['me', authToken],
    queryFn: () => api.auth.me(),
    enabled: !!authToken,
    staleTime: 300_000,
  });

  const { data: apiIncomeSummary } = useQuery({
    queryKey: ['income-summary', authToken],
    queryFn: () => api.mlm.incomeSummary(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: apiTeam } = useQuery({
    queryKey: ['mlm-team', authToken],
    queryFn: () => api.mlm.team(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: apiReferrals } = useQuery({
    queryKey: ['mlm-referrals', authToken],
    queryFn: () => api.mlm.referrals(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  // Real referral code from API, fall back to computed value
  const referralCode = (authToken && (apiMe?.referral_code ?? apiReferrals?.referral_code))
    || userProfile.referralCode
    || `T2U-${userProfile.name.split(' ')[0].toUpperCase().slice(0, 6)}-${userProfile.username.slice(-4).toUpperCase()}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeTeam = authToken && apiTeam ? apiTeam.active_count : teamMembers.filter(m => m.status === 'IN').length;
  const inactiveTeam = authToken && apiTeam ? apiTeam.inactive_count : teamMembers.filter(m => m.status === 'OUT').length;
  const totalTeam = authToken && apiTeam ? (apiTeam.direct_team?.length ?? 0) : teamMembers.length;
  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'Pending');

  const effectiveLeftBV = authToken && apiTeam ? apiTeam.left_bv : (authToken && apiTree ? (apiTree as any).left_bv ?? leftTeamBV : leftTeamBV);
  const effectiveRightBV = authToken && apiTeam ? apiTeam.right_bv : (authToken && apiTree ? (apiTree as any).right_bv ?? rightTeamBV : rightTeamBV);
  const matchableBonus = Math.min(effectiveLeftBV, effectiveRightBV);
  const claimableBonus = (matchableBonus * 0.12).toFixed(2);

  const effectiveEarnings = authToken && apiIncomeSummary
    ? { total: apiIncomeSummary.lifetime ?? 0, available: apiIncomeSummary.available ?? 0, pending: apiIncomeSummary.pending ?? 0 }
    : { total: earningSummary.total, available: earningSummary.available, pending: earningSummary.pending };

  const totalReferralDsi = authToken && apiReferrals
    ? (apiReferrals.total_dsi ?? 0)
    : transactions.filter(t => t.category === 'Referral' && t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalReferralCount = authToken && apiReferrals ? (apiReferrals.total_referrals ?? 0) : 0;

  const statCards = [
    { label: 'Active Team', value: `${activeTeam}/${totalTeam}`, sub: `${inactiveTeam} inactive`, icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Total Earned', value: `₹${effectiveEarnings.total.toFixed(2)}`, sub: `₹${effectiveEarnings.available.toFixed(2)} available`, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Pending W/D', value: `₹${pendingWithdrawals.reduce((s, w) => s + w.amount, 0).toFixed(2)}`, sub: `${pendingWithdrawals.length} requests`, icon: ArrowUpRight, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

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
        <p className="text-xs text-muted-foreground font-sans">Your complete network, earnings &amp; activity overview</p>
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
                <p className="text-base font-black text-foreground font-mono">{totalReferralCount || teamMembers.length}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">DSI Earned</p>
                <p className="text-base font-black text-emerald-500 font-mono">₹{totalReferralDsi.toFixed(0)}</p>
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
                <p className="text-lg font-black text-emerald-500 font-mono">₹{effectiveEarnings.available.toFixed(2)}</p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold text-amber-600 uppercase">Pending</p>
                <p className="text-lg font-black text-amber-500 font-mono">₹{effectiveEarnings.pending.toFixed(2)}</p>
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
                <p className="text-xl font-black text-blue-500 font-mono">{Number(effectiveLeftBV).toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">{authToken && apiTeam ? `${apiTeam.left_count ?? 0} members` : 'Business Volume'}</p>
              </div>
              <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-3">
                <p className="text-[9px] font-bold text-violet-500 uppercase mb-1">Right BV</p>
                <p className="text-xl font-black text-violet-500 font-mono">{Number(effectiveRightBV).toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">{authToken && apiTeam ? `${apiTeam.right_count ?? 0} members` : 'Business Volume'}</p>
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
            My Direct Team
            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full">{totalTeam} members</span>
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
            {authToken && apiTeam?.direct_team?.length ? (
              apiTeam.direct_team.slice(0, 6).map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/10">
                  {m.profile_photo_url ? (
                    <img src={getMediaUrl(m.profile_photo_url)} alt={m.full_name} className="w-9 h-9 rounded-full object-cover ring-2 ring-border shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-violet-500/20 ring-2 ring-border shrink-0 flex items-center justify-center text-xs font-bold text-violet-500">
                      {m.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground truncate">{m.full_name}</p>
                    <p className="text-[9px] text-muted-foreground">{m.referral_code} · {m.package?.name ?? 'No package'}</p>
                    <p className="text-[9.5px] font-bold text-emerald-500">₹{Number(m.total_earnings ?? 0).toFixed(2)} earned</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full shrink-0 ${m.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))
            ) : (
              teamMembers.map((m) => (
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
              ))
            )}
            {totalTeam === 0 && teamMembers.length === 0 && (
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
          { label: 'BV Ledger', icon: Star, tab: 'rewards' as const, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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

    </div>
  );
}
