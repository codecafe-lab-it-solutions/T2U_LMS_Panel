import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Network, ToggleLeft, ToggleRight, Save, CheckCircle2, Loader2, Crown, Play, RotateCcw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminMLM() {
  const qc = useQueryClient();

  const [editCommission, setEditCommission] = useState('');
  const [editMatching, setEditMatching] = useState('');
  const [editDailyCap, setEditDailyCap] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  // Fetch settings
  const { data: rawSettings = [], isLoading: isLoadingSettings } = useQuery({
    queryKey: ['admin-mlm-settings'],
    queryFn: () => api.mlm.getSettings(),
  });

  // Fetch network nodes
  const { data: rawNetwork = { users: [], total: 0 }, isLoading: isLoadingNetwork } = useQuery({
    queryKey: ['admin-mlm-network'],
    queryFn: () => api.mlm.networkList(),
  });

  const referralCommissionRate = parseFloat(rawSettings.find((s: any) => s.key === 'dsi_rate')?.value || '25');
  const matchingBonusRate = parseFloat(rawSettings.find((s: any) => s.key === 'matching_rate')?.value || '12');
  const dailyMatchingCap = parseFloat(rawSettings.find((s: any) => s.key === 'daily_cap')?.value || '10000');

  if (!isInitialized && rawSettings.length > 0) {
    setEditCommission(String(referralCommissionRate));
    setEditMatching(String(matchingBonusRate));
    setEditDailyCap(String(dailyMatchingCap));
    setIsInitialized(true);
  }

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
  const saveSettingsMutation = useMutation({
    mutationFn: (updates: { dsi_rate?: number; matching_rate?: number; daily_cap?: number }) =>
      api.mlm.updateSettings(updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-mlm-settings'] });
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 2500);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.mlm.updateStatus(id, is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-mlm-network'] });
    }
  });

  const handleSaveSettings = () => {
    const dsi_rate = parseFloat(editCommission);
    const matching_rate = parseFloat(editMatching);
    const daily_cap = parseFloat(editDailyCap);
    saveSettingsMutation.mutate({
      ...(isNaN(dsi_rate) ? {} : { dsi_rate }),
      ...(isNaN(matching_rate) ? {} : { matching_rate }),
      ...(isNaN(daily_cap) ? {} : { daily_cap })
    });
  };

  // Royalty distribution state
  const now = new Date();
  const [royaltyYear, setRoyaltyYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [royaltyMonth, setRoyaltyMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth()); // 1-based
  const [royaltyResult, setRoyaltyResult] = useState<any>(null);
  const [royaltyError, setRoyaltyError] = useState('');

  const { data: royaltyHistory = [], refetch: refetchRoyaltyHistory } = useQuery({
    queryKey: ['royalty-history'],
    queryFn: () => api.mlm.royaltyHistory(),
  });

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

  const totalBV = networkNodes.reduce((s, n) => s + n.bv, 0);
  const activeNodes = networkNodes.filter(n => n.status === 'IN').length;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">MLM / Network Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage the binary MLM network, BV, and commission settings</p>
      </div>

      {/* Network stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: isLoadingNetwork ? '…' : String(networkNodes.length), color: 'text-violet-400' },
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

      {/* Commission Settings */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold">Commission Rate Settings</CardTitle>
          <CardDescription className="text-xs">Configure referral and binary matching bonus rates</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          {isLoadingSettings ? (
            <div className="p-4 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />Loading settings…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">DSI / Referral Rate (%)</Label>
                  <Input value={editCommission} onChange={e => setEditCommission(e.target.value)} type="number" step="0.1"
                    className="h-9 text-xs bg-muted/20 font-mono" />
                  <p className="text-[9px] text-muted-foreground">Current: {referralCommissionRate}%</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Binary Matching Bonus (%)</Label>
                  <Input value={editMatching} onChange={e => setEditMatching(e.target.value)} type="number" step="0.1"
                    className="h-9 text-xs bg-muted/20 font-mono" />
                  <p className="text-[9px] text-muted-foreground">Current: {matchingBonusRate}%</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Daily Matching Cap (₹)</Label>
                  <Input value={editDailyCap} onChange={e => setEditDailyCap(e.target.value)} type="number"
                    className="h-9 text-xs bg-muted/20 font-mono" />
                  <p className="text-[9px] text-muted-foreground">Current: ₹{dailyMatchingCap.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending} className="bg-primary text-white text-xs font-bold h-9 px-5">
                  <Save className="w-3.5 h-3.5 mr-1.5" />{saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
                {savedSettings && (
                  <span className="text-xs text-emerald-500 flex items-center gap-1.5 font-bold animate-in fade-in duration-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />Settings saved!
                  </span>
                )}
              </div>
            </>
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
          {(royaltyHistory as any[]).length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Past Distributions</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {(royaltyHistory as any[]).slice(0, 6).map((log: any) => (
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
                        <Button size="sm" onClick={() => toggleStatusMutation.mutate({ id: n.id, is_active: n.status !== 'IN' })}
                          disabled={toggleStatusMutation.isPending}
                          className={`h-6 text-[9px] font-bold px-2 ${n.status === 'IN' ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'}`}>
                          {n.status === 'IN' ? <><ToggleLeft className="w-3 h-3 mr-1" />Set OUT</> : <><ToggleRight className="w-3 h-3 mr-1" />Set IN</>}
                        </Button>
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
      </Card>
    </div>
  );
}
