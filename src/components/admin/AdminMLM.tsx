import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import { Network, ToggleLeft, ToggleRight, Crown, Play, RotateCcw, AlertCircle, Loader2, Users, GitBranch, Info, Scale, Car, Home, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaginationFooter } from '@/components/ui/pagination-footer';
import AdminTeamManagement from './AdminTeamManagement';
import GenealogyTree from '../GenealogyTree';

type MlmTab = 'overview' | 'team' | 'genealogy';

// Generic monthly milestone-bonus run panel — used for Car Fund / House Fund, or any future
// admin-configured `category: 'milestone'` IncomeSource. Rate/threshold/months come entirely
// from that IncomeSource row; this component just triggers the run and shows the result.
function MilestoneBonusPanel({ code, title, icon: Icon, accentText, accentBg, accentBorder, description, canEdit }: {
  code: string; title: string; icon: LucideIcon;
  accentText: string; accentBg: string; accentBorder: string;
  description: string; canEdit: boolean;
}) {
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth()); // 1-based
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['milestone-bonus-history', code],
    queryFn: () => api.mlm.milestoneBonusHistory(code),
  });
  const history = historyData?.logs ?? [];

  const runMutation = useMutation({
    mutationFn: (force?: boolean) => api.mlm.runMilestoneBonus(code, year, month, force),
    onSuccess: (data) => {
      setResult(data);
      setError('');
      refetchHistory();
      qc.invalidateQueries({ queryKey: ['admin-mlm-network'] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setResult(null);
    },
  });

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accentText}`} />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {canEdit && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Year</Label>
              <Input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="h-9 text-xs bg-muted/20 font-mono w-24"
                min={2024} max={2099}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Month (1–12)</Label>
              <Input
                type="number"
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="h-9 text-xs bg-muted/20 font-mono w-20"
                min={1} max={12}
              />
            </div>
            <Button
              onClick={() => runMutation.mutate(undefined)}
              disabled={runMutation.isPending}
              className={`${accentBg} text-white text-xs font-bold h-9 px-4`}
            >
              {runMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Running…</> : <><Play className="w-3.5 h-3.5 mr-1.5" />Run {title}</>}
            </Button>
            <Button
              variant="outline"
              onClick={() => runMutation.mutate(true)}
              disabled={runMutation.isPending}
              className={`text-xs font-bold h-9 px-4 ${accentBorder} ${accentText}`}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Force Re-run
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 flex items-start gap-2 text-xs text-rose-500">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-xl border ${accentBorder} bg-muted/5 space-y-2 text-xs`}>
            <p className={`font-bold uppercase tracking-wider text-[10px] ${accentText}`}>
              {result.distributions_count > 0 ? `✓ ${title} Distributed` : '⚠ No Distributions'} — {result.year}-{String(result.month).padStart(2, '0')}
            </p>
            {result.message && <p className="text-muted-foreground">{result.message}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {[
                { label: 'Rate', val: result.rate_pct != null ? `${result.rate_pct}%` : '—' },
                { label: 'Qualified', val: String(result.qualified_count ?? 0) },
                { label: 'Paid Out', val: String(result.distributions_count ?? 0) },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-lg p-2 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">{s.label}</p>
                  <p className="text-sm font-black font-mono text-foreground mt-0.5">{s.val}</p>
                </div>
              ))}
            </div>
            {result.results?.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1 scrollbar-none">
                {result.results.map((r: any) => (
                  <div key={r.user_id} className="flex justify-between items-center text-[10px] text-muted-foreground px-1">
                    <span className="font-medium text-foreground">{r.name}</span>
                    <span className={`font-mono font-bold ${accentText}`}>+₹{parseFloat(r.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Past Distributions</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {history.slice(0, 6).map((log: any) => (
                <div key={log.id} className="p-3 rounded-lg border border-border bg-muted/10 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{log.year}-{String(log.month).padStart(2, '0')}</span>
                    <span className="text-[9px] text-muted-foreground">{new Date(log.ran_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Distributed to:</span><strong className="text-foreground">{log.distributions_count} members</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminMLM() {
  const perm = useEmployeePermission('admin-mlm');
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<MlmTab>('overview');
  const [networkPage, setNetworkPage] = useState(1);
  const NETWORK_PAGE_LIMIT = 20;

  // Fetch network nodes
  const { data: rawNetwork = { users: [], total: 0, summary: { active_count: 0, total_bv: 0 } }, isLoading: isLoadingNetwork } = useQuery({
    queryKey: ['admin-mlm-network', networkPage],
    queryFn: () => api.mlm.networkList(networkPage, NETWORK_PAGE_LIMIT),
  });

  // Mapped network nodes
  const networkNodes = (rawNetwork.users || []).map((u: any) => {
    let displayKyc = 'Pending';
    if (u.kyc_status === 'approved') displayKyc = 'Verified';
    else if (u.kyc_status === 'submitted') displayKyc = 'Pending Verification';

    const totalEarnings = (u.commissions || []).reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0);

    let level = 1;
    if (u.role === 'admin') level = 0;
    else if (!u.binary_parent_id) level = 1;
    else level = 2;

    return {
      id: u.id,
      name: u.full_name,
      avatar: u.profile_photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.full_name)}`,
      referralCode: u.referral_code,
      role: u.role === 'admin' ? 'Super Admin' : u.role === 'instructor' ? 'Instructor' : 'Student',
      level,
      position: u.binary_position || 'root',
      bv: parseFloat(u.total_bv || '0'),
      totalEarnings,
      directReferrals: u._count?.referrals_made || 0,
      kycStatus: displayKyc,
      status: u.is_active ? 'IN' : 'OUT'
    };
  });

  // Mutations
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.mlm.updateStatus(id, is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-mlm-network'] });
    }
  });

  // Weekly BV matching state
  const [bvMatchResult, setBvMatchResult] = useState<any>(null);
  const [bvMatchError, setBvMatchError] = useState('');

  const runBvMatchingMutation = useMutation({
    mutationFn: (force?: boolean) => api.mlm.runBvMatching(force),
    onSuccess: (data) => {
      setBvMatchResult(data);
      setBvMatchError('');
      qc.invalidateQueries({ queryKey: ['admin-mlm-network'] });
    },
    onError: (err: Error) => {
      setBvMatchError(err.message);
      setBvMatchResult(null);
    },
  });

  // Royalty distribution state
  const now = new Date();
  const [royaltyYear, setRoyaltyYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [royaltyMonth, setRoyaltyMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth()); // 1-based
  const [royaltyResult, setRoyaltyResult] = useState<any>(null);
  const [royaltyError, setRoyaltyError] = useState('');

  const { data: royaltyHistoryData, refetch: refetchRoyaltyHistory } = useQuery({
    queryKey: ['royalty-history'],
    queryFn: () => api.mlm.royaltyHistory(),
  });
  const royaltyHistory = royaltyHistoryData?.logs ?? [];

  const runRoyaltyMutation = useMutation({
    mutationFn: ({ year, month, force }: { year: number; month: number; force?: boolean }) =>
      api.mlm.runMonthlyRoyalty(year, month, force),
    onSuccess: (data) => {
      setRoyaltyResult(data);
      setRoyaltyError('');
      refetchRoyaltyHistory();
    },
    onError: (err: Error) => {
      setRoyaltyError(err.message);
      setRoyaltyResult(null);
    },
  });

  // Network-wide totals come from the backend summary (all members), not just the current page.
  const totalBV = rawNetwork.summary?.total_bv ?? 0;
  const activeNodes = rawNetwork.summary?.active_count ?? 0;
  const maxLevel = networkNodes.length ? Math.max(...networkNodes.map(n => n.level)) : 0;

  const levelColor = (l: number) => {
    const colors = ['text-violet-400 bg-violet-500/10', 'text-blue-400 bg-blue-500/10', 'text-emerald-400 bg-emerald-500/10', 'text-amber-400 bg-amber-500/10'];
    return colors[l % colors.length];
  };

  const kycBadge = (s: string) => {
    if (s === 'Verified') return 'text-emerald-400 bg-emerald-500/10';
    if (s === 'Pending Verification') return 'text-amber-400 bg-amber-500/10';
    return 'text-slate-400 bg-slate-700';
  };

  const TABS: { id: MlmTab; label: string; icon: typeof Network }[] = [
    { id: 'overview',  label: 'Overview',        icon: Network },
    { id: 'team',      label: 'Team Management', icon: Users },
    { id: 'genealogy', label: 'Genealogy Tree',  icon: GitBranch },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">MLM / Network Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage the binary MLM network, team placement, and genealogy — all in one place</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1.5 border-b border-border/40 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Network stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Members', value: isLoadingNetwork ? '…' : String(rawNetwork.total ?? 0), color: 'text-violet-400' },
              { label: 'Active (IN)', value: isLoadingNetwork ? '…' : String(activeNodes), color: 'text-emerald-400' },
              { label: 'Total BV', value: isLoadingNetwork ? '…' : totalBV.toLocaleString(), color: 'text-blue-400' },
              { label: 'Max Depth', value: isLoadingNetwork ? '…' : `Level ${maxLevel + 1}`, color: 'text-amber-400' },
            ].map(s => (
              <Card key={s.label} className="border border-border bg-card">
                <CardContent className="p-4 text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.label}</p>
                  <p className={`text-2xl font-black font-mono mt-1 ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rate config note — rates now live on the Incentive Criteria page (single source of truth) */}
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-2.5 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              DSI, binary matching, generational, and other commission rates are configured globally on the{' '}
              <strong className="text-foreground">Incentive Criteria</strong> page and apply platform-wide. This page no longer holds a separate copy of those rates.
            </span>
          </div>

          {/* Weekly BV Matching */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-500" />
                Weekly BV Matching
              </CardTitle>
              <CardDescription className="text-xs">
                Matches unmatched left/right leg BV and pays the binary bonus. Runs automatically every Sunday 00:30 IST — any BV left unmatched (or held back by the cap) simply carries forward to the next run, nothing is ever reset.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {perm.edit && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => runBvMatchingMutation.mutate(false)}
                    disabled={runBvMatchingMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4"
                  >
                    {runBvMatchingMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Running…</> : <><Play className="w-3.5 h-3.5 mr-1.5" />Run BV Matching Now</>}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runBvMatchingMutation.mutate(true)}
                    disabled={runBvMatchingMutation.isPending}
                    className="text-xs font-bold h-9 px-4 border-emerald-500/30 text-emerald-500"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Force Re-run
                  </Button>
                </div>
              )}

              {bvMatchError && (
                <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 flex items-start gap-2 text-xs text-rose-500">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{bvMatchError}
                </div>
              )}

              {bvMatchResult && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2 text-xs">
                  <p className="font-bold text-emerald-500 uppercase tracking-wider text-[10px]">
                    {bvMatchResult.skipped ? '⚠ Already Run This Week' : bvMatchResult.users_processed > 0 ? '✓ Matching Complete' : '⚠ No Matches'} — {bvMatchResult.date ?? new Date().toISOString().split('T')[0]}
                  </p>
                  {bvMatchResult.message && <p className="text-muted-foreground">{bvMatchResult.message}</p>}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-card border border-border rounded-lg p-2 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Users Matched</p>
                      <p className="text-sm font-black font-mono text-foreground mt-0.5">{bvMatchResult.users_processed ?? 0}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-2 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Bonus Paid</p>
                      <p className="text-sm font-black font-mono text-foreground mt-0.5">₹{bvMatchResult.total_bonus_paid ?? '0.00'}</p>
                    </div>
                  </div>
                  {bvMatchResult.results?.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1 scrollbar-none">
                      {bvMatchResult.results.map((r: any) => (
                        <div key={r.user_id} className="flex justify-between items-center text-[10px] text-muted-foreground px-1">
                          <span className="font-medium text-foreground">{r.name}</span>
                          <span className="font-mono font-bold text-emerald-500">+₹{parseFloat(r.bonus).toFixed(2)}{r.capped ? ' (capped)' : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Royalty Distribution */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Crown className="w-4 h-4 text-pink-500" />
                Monthly Royalty Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Distribute the 2% company BV pool to qualified distributors (≥20L BV on each binary leg in the month).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {perm.edit && (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Year</Label>
                    <Input
                      type="number"
                      value={royaltyYear}
                      onChange={e => setRoyaltyYear(Number(e.target.value))}
                      className="h-9 text-xs bg-muted/20 font-mono w-24"
                      min={2024} max={2099}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Month (1–12)</Label>
                    <Input
                      type="number"
                      value={royaltyMonth}
                      onChange={e => setRoyaltyMonth(Number(e.target.value))}
                      className="h-9 text-xs bg-muted/20 font-mono w-20"
                      min={1} max={12}
                    />
                  </div>
                  <Button
                    onClick={() => runRoyaltyMutation.mutate({ year: royaltyYear, month: royaltyMonth })}
                    disabled={runRoyaltyMutation.isPending}
                    className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold h-9 px-4"
                  >
                    {runRoyaltyMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Running…</> : <><Play className="w-3.5 h-3.5 mr-1.5" />Run Royalty</>}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runRoyaltyMutation.mutate({ year: royaltyYear, month: royaltyMonth, force: true })}
                    disabled={runRoyaltyMutation.isPending}
                    className="text-xs font-bold h-9 px-4 border-pink-500/30 text-pink-500"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Force Re-run
                  </Button>
                </div>
              )}

              {royaltyError && (
                <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 flex items-start gap-2 text-xs text-rose-500">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{royaltyError}
                </div>
              )}

              {royaltyResult && (
                <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-500/5 space-y-2 text-xs">
                  <p className="font-bold text-pink-500 uppercase tracking-wider text-[10px]">
                    {royaltyResult.distributions_count > 0 ? '✓ Royalty Distributed' : '⚠ No Distributions'} — {royaltyResult.year}-{String(royaltyResult.month).padStart(2, '0')}
                  </p>
                  {royaltyResult.message && <p className="text-muted-foreground">{royaltyResult.message}</p>}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {[
                      { label: 'Company BV', val: `₹${parseFloat(royaltyResult.total_company_bv ?? 0).toLocaleString()}` },
                      { label: 'Pool (2%)', val: `₹${parseFloat(royaltyResult.pool_bv ?? 0).toFixed(2)}` },
                      { label: 'Qualified', val: String(royaltyResult.qualified_count ?? 0) },
                      { label: 'Paid Out', val: String(royaltyResult.distributions_count ?? 0) },
                    ].map(s => (
                      <div key={s.label} className="bg-card border border-border rounded-lg p-2 text-center">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">{s.label}</p>
                        <p className="text-sm font-black font-mono text-foreground mt-0.5">{s.val}</p>
                      </div>
                    ))}
                  </div>
                  {royaltyResult.results?.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1 scrollbar-none">
                      {royaltyResult.results.map((r: any) => (
                        <div key={r.user_id} className="flex justify-between items-center text-[10px] text-muted-foreground px-1">
                          <span className="font-medium text-foreground">{r.name}</span>
                          <span className="font-mono font-bold text-pink-500">+₹{parseFloat(r.royalty_amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* History of past runs */}
              {royaltyHistory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Past Distributions</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {royaltyHistory.slice(0, 6).map((log: any) => (
                      <div key={log.id} className="p-3 rounded-lg border border-border bg-muted/10 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground">{log.year}-{String(log.month).padStart(2, '0')}</span>
                          <span className="text-[9px] text-muted-foreground">{new Date(log.ran_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Pool:</span><strong className="text-pink-500 font-mono">₹{parseFloat(log.pool_bv).toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Distributed to:</span><strong className="text-foreground">{log.distributions_count} members</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Car Fund / House Fund milestone bonuses — configured in the Incentives tab (category: milestone) */}
          <MilestoneBonusPanel
            code="car_fund"
            title="Car Fund Bonus"
            icon={Car}
            accentText="text-orange-500"
            accentBg="bg-orange-600 hover:bg-orange-700"
            accentBorder="border-orange-500/30"
            description="Monthly bonus for members sustaining the configured BV on each binary leg for the required consecutive months. Must be enabled in Income Sources."
            canEdit={perm.edit}
          />
          <MilestoneBonusPanel
            code="house_fund"
            title="House Fund Bonus"
            icon={Home}
            accentText="text-sky-500"
            accentBg="bg-sky-600 hover:bg-sky-700"
            accentBorder="border-sky-500/30"
            description="Monthly bonus for elite members sustaining the configured BV on each binary leg for the required consecutive months. Must be enabled in Income Sources."
            canEdit={perm.edit}
          />

          {/* Network Tree Table */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" />
                Binary Network Tree
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {isLoadingNetwork ? (
                  <div className="p-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />Loading network tree…
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        {['Member', 'Role', 'Level', 'Position', 'BV', 'Total Earned', 'Referrals', 'KYC', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {networkNodes.map(n => (
                        <tr key={n.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <img src={n.avatar} alt={n.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-border shrink-0" />
                              <div>
                                <p className="font-bold text-foreground">{n.name}</p>
                                <p className="text-[9px] text-muted-foreground font-mono">{n.referralCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-[10px]">{n.role}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${levelColor(n.level)}`}>L{n.level}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-[10px] capitalize">{n.position || 'root'}</td>
                          <td className="px-4 py-3 font-mono font-bold text-foreground">{n.bv.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-emerald-400">₹{n.totalEarnings.toFixed(2)}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono">{n.directReferrals}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${kycBadge(n.kycStatus)}`}>{n.kycStatus}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${n.status === 'IN' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>{n.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            {perm.edit ? (
                              <Button size="sm" onClick={() => toggleStatusMutation.mutate({ id: n.id, is_active: n.status !== 'IN' })}
                                disabled={toggleStatusMutation.isPending}
                                className={`h-6 text-[9px] font-bold px-2 ${n.status === 'IN' ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'}`}>
                                {n.status === 'IN' ? <><ToggleLeft className="w-3 h-3 mr-1" />Set OUT</> : <><ToggleRight className="w-3 h-3 mr-1" />Set IN</>}
                              </Button>
                            ) : <span className="text-[9px] text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      ))}
                      {networkNodes.length === 0 && (
                        <tr>
                          <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">No network members found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
            <PaginationFooter
              page={networkPage}
              totalPages={Math.ceil((rawNetwork.total ?? 0) / NETWORK_PAGE_LIMIT)}
              total={rawNetwork.total ?? 0}
              onPageChange={setNetworkPage}
              label="members"
            />
          </Card>
        </div>
      )}

      {activeTab === 'team' && <AdminTeamManagement />}

      {activeTab === 'genealogy' && <GenealogyTree adminMode />}
    </div>
  );
}
