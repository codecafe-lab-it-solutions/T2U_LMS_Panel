import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getMediaUrl, getStoredToken } from '../services/api';
import {
  Trophy, Gift, CheckCircle2, Lock, Clock, Loader2,
  ChevronRight, Star, Package,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type TabId = 'milestones' | 'my-claims';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending Review', color: 'text-amber-500',  bg: 'bg-amber-500/10 border-amber-500/30' },
  approved:  { label: 'Approved',       color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  rejected:  { label: 'Rejected',       color: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/30' },
  delivered: { label: 'Delivered',      color: 'text-violet-500',  bg: 'bg-violet-500/10 border-violet-500/30' },
  cancelled: { label: 'Cancelled',      color: 'text-muted-foreground', bg: 'bg-muted/40 border-border' },
};

function formatBV(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(2)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function ProgressBar({ value, max, color = 'bg-violet-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

interface ClaimModalProps {
  milestone: any;
  onClose: () => void;
  onSubmit: (cashOpted: boolean, deliveryInfo: string) => void;
  loading: boolean;
}

function ClaimModal({ milestone, onClose, onSubmit, loading }: ClaimModalProps) {
  const [cashOpted, setCashOpted] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-border">
          <h3 className="font-black text-foreground uppercase tracking-wide text-sm flex items-center gap-2">
            <Gift className="w-4 h-4 text-violet-500" /> Redeem Reward
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{milestone.name} — {milestone.reward_desc}</p>
        </div>

        <div className="p-5 space-y-4">
          {milestone.cash_value > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Preference</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCashOpted(false)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${!cashOpted ? 'border-violet-500 bg-violet-500/10 text-violet-600' : 'border-border text-muted-foreground hover:border-violet-400'}`}
                >
                  <Package className="w-4 h-4 mx-auto mb-1" />
                  Physical Gift
                </button>
                <button
                  type="button"
                  onClick={() => setCashOpted(true)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${cashOpted ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-border text-muted-foreground hover:border-emerald-400'}`}
                >
                  <span className="block text-lg">₹</span>
                  Cash (₹{Number(milestone.cash_value).toLocaleString('en-IN')})
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wide">
              {cashOpted ? 'Bank / UPI Details' : 'Delivery Address'}
            </label>
            <textarea
              rows={3}
              value={deliveryInfo}
              onChange={(e) => setDeliveryInfo(e.target.value)}
              placeholder={cashOpted ? 'Bank account number, IFSC, name…' : 'Full delivery address with PIN code…'}
              className="w-full rounded-xl border border-border bg-muted/30 text-xs p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="flex gap-2 p-5 pt-0">
          <Button variant="outline" onClick={onClose} className="flex-1 text-xs h-9">Cancel</Button>
          <Button
            onClick={() => onSubmit(cashOpted, deliveryInfo)}
            disabled={loading || !deliveryInfo.trim()}
            className="flex-1 text-xs h-9 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Request'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RewardsMilestones() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('milestones');
  const [claimTarget, setClaimTarget] = useState<any | null>(null);

  const { data: milestones = [], isLoading } = useQuery<any[]>({
    queryKey: ['rewards-milestones'],
    queryFn: () => api.rewards.list(),
    enabled: !!getStoredToken(),
    staleTime: 30_000,
  });

  const { data: myClaims = [], isLoading: claimsLoading } = useQuery<any[]>({
    queryKey: ['rewards-my-claims'],
    queryFn: () => api.rewards.myClaims(),
    enabled: !!getStoredToken() && activeTab === 'my-claims',
    staleTime: 30_000,
  });

  const claimMutation = useMutation({
    mutationFn: ({ milestoneId, cashOpted, deliveryInfo }: { milestoneId: string; cashOpted: boolean; deliveryInfo: string }) =>
      api.rewards.claim(milestoneId, { cash_opted: cashOpted, delivery_info: deliveryInfo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards-milestones'] });
      qc.invalidateQueries({ queryKey: ['rewards-my-claims'] });
      setClaimTarget(null);
    },
  });

  const achieved = milestones.filter(m => m.is_achieved).length;
  const total = milestones.length;
  const claimed = milestones.filter(m => m.claim).length;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'milestones', label: 'Milestones', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'my-claims', label: 'My Claims', icon: <Gift className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Reward Income Milestones
        </h2>
        <p className="text-xs text-muted-foreground font-sans mt-0.5">
          Achieve equal BV on both legs to unlock rewards — no time limit.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Milestones', value: total, color: 'text-foreground' },
          { label: 'Achieved', value: achieved, color: 'text-emerald-500' },
          { label: 'Redeemed', value: claimed, color: 'text-violet-500' },
        ].map(s => (
          <Card key={s.label} className="bg-muted/30">
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Milestones grid ── */}
      {activeTab === 'milestones' && (
        isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No milestones configured yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {milestones.map((m: any) => {
              const hasClaim = !!m.claim;
              const claimStatus = m.claim?.status;

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    m.is_achieved
                      ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-card shadow-amber-500/5 shadow-lg'
                      : 'border-border bg-card'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-36 bg-muted/40 overflow-hidden">
                    {m.image_url ? (
                      <img
                        src={getMediaUrl(m.image_url)}
                        alt={m.name}
                        className={`w-full h-full object-cover transition-all ${m.is_achieved ? '' : 'grayscale opacity-50'}`}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Gift className={`w-12 h-12 ${m.is_achieved ? 'text-amber-400' : 'text-muted-foreground/30'}`} />
                      </div>
                    )}
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      {hasClaim ? (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${STATUS_CONFIG[claimStatus]?.bg ?? 'bg-muted/40 border-border'} ${STATUS_CONFIG[claimStatus]?.color ?? 'text-muted-foreground'}`}>
                          {STATUS_CONFIG[claimStatus]?.label ?? claimStatus}
                        </span>
                      ) : m.is_achieved ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-600 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5" /> Achieved
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted/60 border border-border text-muted-foreground flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* BV requirement chip */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-black bg-muted px-2.5 py-0.5 rounded-full text-foreground uppercase tracking-wide">
                        {formatBV(m.required_left_bv)} : {formatBV(m.required_right_bv)} BV
                      </span>
                    </div>

                    <div>
                      <p className="font-black text-foreground text-sm leading-tight">{m.name}</p>
                      <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-2">{m.reward_desc}</p>
                      {Number(m.cash_value) > 0 && (
                        <p className="text-xs text-emerald-600 font-bold mt-0.5">
                          OR ₹{Number(m.cash_value).toLocaleString('en-IN')} Cash
                        </p>
                      )}
                    </div>

                    {/* Progress */}
                    {!m.is_achieved && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                          <span>Left BV</span>
                          <span>{formatBV(m.user_left_bv)} / {formatBV(m.required_left_bv)}</span>
                        </div>
                        <ProgressBar value={m.user_left_bv} max={m.required_left_bv} color="bg-blue-500" />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-bold mt-1">
                          <span>Right BV</span>
                          <span>{formatBV(m.user_right_bv)} / {formatBV(m.required_right_bv)}</span>
                        </div>
                        <ProgressBar value={m.user_right_bv} max={m.required_right_bv} color="bg-violet-500" />
                        <p className="text-[10px] text-muted-foreground font-sans text-center mt-0.5">
                          Both legs need equal BV to unlock
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    {m.is_achieved && !hasClaim && (
                      <Button
                        className="w-full h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold"
                        onClick={() => setClaimTarget(m)}
                      >
                        <Gift className="w-3.5 h-3.5 mr-1" /> Redeem Reward
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </Button>
                    )}

                    {m.is_achieved && hasClaim && (
                      <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${STATUS_CONFIG[claimStatus]?.bg ?? 'bg-muted/40 border-border'} ${STATUS_CONFIG[claimStatus]?.color ?? ''}`}>
                        {claimStatus === 'delivered' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {STATUS_CONFIG[claimStatus]?.label ?? claimStatus}
                        {m.claim?.admin_note && (
                          <span className="ml-auto text-[10px] text-muted-foreground normal-case font-normal truncate">
                            {m.claim.admin_note}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── My Claims ── */}
      {activeTab === 'my-claims' && (
        claimsLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : myClaims.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No redemption requests yet.</p>
            <p className="text-xs mt-1">Achieve a milestone and click Redeem.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myClaims.map((c: any) => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                <div className={`p-2 rounded-xl border ${STATUS_CONFIG[c.status]?.bg ?? 'bg-muted/40 border-border'}`}>
                  <Gift className={`w-4 h-4 ${STATUS_CONFIG[c.status]?.color ?? 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{c.milestone?.name}</p>
                  <p className="text-xs text-muted-foreground">{c.milestone?.reward_desc}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${STATUS_CONFIG[c.status]?.bg ?? 'bg-muted/40 border-border'} ${STATUS_CONFIG[c.status]?.color ?? ''}`}>
                      {STATUS_CONFIG[c.status]?.label ?? c.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {c.cash_opted ? 'Cash option' : 'Physical gift'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.claim_date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  {c.admin_note && (
                    <p className="text-[11px] text-muted-foreground mt-1 italic">Admin: {c.admin_note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Claim modal */}
      {claimTarget && (
        <ClaimModal
          milestone={claimTarget}
          onClose={() => setClaimTarget(null)}
          loading={claimMutation.isPending}
          onSubmit={(cashOpted, deliveryInfo) =>
            claimMutation.mutate({ milestoneId: claimTarget.id, cashOpted, deliveryInfo })
          }
        />
      )}

      {/* Mutation error */}
      {claimMutation.isError && (
        <p className="text-xs text-destructive text-center">{(claimMutation.error as Error).message}</p>
      )}
    </div>
  );
}
