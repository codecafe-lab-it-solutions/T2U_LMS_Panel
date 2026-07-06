import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getMediaUrl } from '../../services/api';
import {
  Trophy, Gift, Plus, Pencil, Trash2, Loader2,
  CheckCircle2, XCircle, Package, ChevronDown, Upload, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AdminTab = 'milestones' | 'claims';

const CLAIM_STATUSES = ['pending', 'approved', 'rejected', 'delivered', 'cancelled'];

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-500/10 border-amber-500/30 text-amber-600',
  approved:  'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
  rejected:  'bg-red-500/10 border-red-500/30 text-red-600',
  delivered: 'bg-violet-500/10 border-violet-500/30 text-violet-600',
  cancelled: 'bg-muted/40 border-border text-muted-foreground',
};

function formatBV(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(2)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

const EMPTY_FORM = {
  name: '',
  required_bv: '',
  required_left_bv: '',
  required_right_bv: '',
  reward_desc: '',
  cash_value: '',
  image_url: '',
  order_index: '0',
  is_active: true,
};

interface MilestoneFormProps {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}

function MilestoneForm({ initial, onSave, onCancel, loading }: MilestoneFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    required_bv: initial?.required_bv != null ? String(initial.required_bv) : '',
    required_left_bv: initial?.required_left_bv != null ? String(initial.required_left_bv) : '',
    required_right_bv: initial?.required_right_bv != null ? String(initial.required_right_bv) : '',
    reward_desc: initial?.reward_desc ?? '',
    cash_value: initial?.cash_value != null ? String(initial.cash_value) : '',
    image_url: initial?.image_url ?? '',
    order_index: initial?.order_index != null ? String(initial.order_index) : '0',
    is_active: initial?.is_active ?? true,
  });
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState('');
  const imgFileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function handleImgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    setImgError('');
    try {
      const res = await api.upload.file(file);
      set('image_url', res.url);
    } catch (err: any) {
      setImgError('Upload failed: ' + (err.message ?? 'Unknown error'));
    } finally {
      setImgUploading(false);
      if (imgFileRef.current) imgFileRef.current.value = '';
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const leftBv = form.required_left_bv ? Number(form.required_left_bv) : Number(form.required_bv) / 2;
    onSave({
      name: form.name,
      required_bv: Number(form.required_bv) || leftBv * 2,
      required_left_bv: leftBv,
      required_right_bv: form.required_right_bv ? Number(form.required_right_bv) : leftBv,
      reward_desc: form.reward_desc,
      cash_value: Number(form.cash_value || 0),
      image_url: form.image_url || null,
      order_index: Number(form.order_index || 0),
      is_active: form.is_active,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide">Milestone Name *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Goa Trip Reward" required className="h-9 text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide">Left Leg BV Required *</Label>
          <Input
            type="number" min="0" step="any"
            value={form.required_left_bv}
            onChange={e => set('required_left_bv', e.target.value)}
            placeholder="e.g. 50000"
            required
            className="h-9 text-sm"
          />
          <p className="text-[10px] text-muted-foreground">Left leg BV needed (e.g. 50,000 for 50k:50k)</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide">Right Leg BV Required *</Label>
          <Input
            type="number" min="0" step="any"
            value={form.required_right_bv}
            onChange={e => set('required_right_bv', e.target.value)}
            placeholder="e.g. 50000"
            required
            className="h-9 text-sm"
          />
          <p className="text-[10px] text-muted-foreground">Right leg BV needed (equal to left for paired milestones)</p>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide">Reward Description *</Label>
          <textarea
            value={form.reward_desc}
            onChange={e => set('reward_desc', e.target.value)}
            placeholder="e.g. Goa Trip — 3 Days / 2 Nights"
            required
            rows={2}
            className="w-full rounded-lg border border-input bg-background text-sm px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide">Cash Alternative (₹)</Label>
          <Input
            type="number" min="0" step="any"
            value={form.cash_value}
            onChange={e => set('cash_value', e.target.value)}
            placeholder="e.g. 20000"
            className="h-9 text-sm"
          />
          <p className="text-[10px] text-muted-foreground">Cash value if user prefers money instead</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide">Display Order</Label>
          <Input
            type="number" min="0"
            value={form.order_index}
            onChange={e => set('order_index', e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide">Reward Image</Label>
          <input ref={imgFileRef} type="file" accept="image/*" title="Upload reward image" className="hidden" onChange={handleImgUpload} />
          <div className="flex gap-2">
            <Input
              value={form.image_url}
              onChange={e => set('image_url', e.target.value)}
              placeholder="Paste URL or upload →"
              className="h-9 text-sm flex-1"
            />
            <Button
              type="button"
              disabled={imgUploading}
              onClick={() => imgFileRef.current?.click()}
              className="h-9 px-3 text-xs bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold shrink-0"
            >
              {imgUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              {imgUploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
          {imgError && <p className="text-[11px] text-destructive">{imgError}</p>}
          {form.image_url && (
            <div className="relative inline-block mt-1">
              <img src={getMediaUrl(form.image_url)} alt="preview" className="h-24 w-auto rounded-lg object-cover border border-border" />
              <button
                type="button"
                title="Remove image"
                onClick={() => set('image_url', '')}
                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={e => set('is_active', e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <label htmlFor="is_active" className="text-xs font-bold text-foreground cursor-pointer">Active (visible to users)</label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-9 text-xs">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-1 h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : initial ? 'Save Changes' : 'Create Milestone'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminRewards() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('milestones');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [claimNotes, setClaimNotes] = useState<Record<string, string>>({});
  const [openClaimId, setOpenClaimId] = useState<string | null>(null);

  // Milestones
  const { data: milestones = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-rewards-milestones'],
    queryFn: () => api.rewards.admin.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.rewards.admin.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rewards-milestones'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.rewards.admin.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rewards-milestones'] }); setEditTarget(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.rewards.admin.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rewards-milestones'] }); setDeleteTarget(null); },
  });

  // Claims
  const { data: claims = [], isLoading: claimsLoading } = useQuery<any[]>({
    queryKey: ['admin-rewards-claims'],
    queryFn: () => api.rewards.admin.claims(),
    enabled: activeTab === 'claims',
  });

  const updateClaimMutation = useMutation({
    mutationFn: ({ id, status, admin_note }: { id: string; status: string; admin_note: string }) =>
      api.rewards.admin.updateClaim(id, { status, admin_note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rewards-claims'] }); setOpenClaimId(null); },
  });

  const pendingClaims = claims.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/40 pb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Reward Milestones
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage BV milestone rewards and redemption requests.</p>
        </div>
        {activeTab === 'milestones' && !showForm && !editTarget && (
          <Button onClick={() => setShowForm(true)} className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit">
        {([
          { id: 'milestones' as const, label: 'Milestones', count: milestones.length },
          { id: 'claims' as const, label: 'Claim Requests', count: pendingClaims, badge: pendingClaims > 0 },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
            {t.badge ? (
              <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 rounded-full">{t.count}</span>
            ) : (
              <span className="bg-muted text-muted-foreground text-[9px] px-1.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Milestones tab ── */}
      {activeTab === 'milestones' && (
        <>
          {/* Create form */}
          {showForm && (
            <Card>
              <CardHeader className="pb-0 pt-4 px-5">
                <CardTitle className="text-sm font-black uppercase tracking-wide">New Milestone</CardTitle>
              </CardHeader>
              <MilestoneForm
                onSave={data => createMutation.mutate(data)}
                onCancel={() => setShowForm(false)}
                loading={createMutation.isPending}
              />
            </Card>
          )}

          {/* Edit form */}
          {editTarget && (
            <Card>
              <CardHeader className="pb-0 pt-4 px-5">
                <CardTitle className="text-sm font-black uppercase tracking-wide">Edit — {editTarget.name}</CardTitle>
              </CardHeader>
              <MilestoneForm
                initial={editTarget}
                onSave={data => updateMutation.mutate({ id: editTarget.id, data })}
                onCancel={() => setEditTarget(null)}
                loading={updateMutation.isPending}
              />
            </Card>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : milestones.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">No milestones yet. Click Add Milestone to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((m: any) => (
                <Card key={m.id} className={!m.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                      {m.image_url ? (
                        <img src={getMediaUrl(m.image_url)} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-foreground text-sm">{m.name}</p>
                        {!m.is_active && (
                          <span className="text-[10px] bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded-full font-bold">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.reward_desc}</p>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className="text-[10px] font-black bg-muted px-2 py-0.5 rounded-full">
                          {formatBV(Number(m.required_left_bv ?? m.required_bv / 2))} : {formatBV(Number(m.required_right_bv ?? m.required_bv / 2))} BV
                        </span>
                        {Number(m.cash_value) > 0 && (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            OR ₹{Number(m.cash_value).toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {m._count?.milestone_logs ?? 0} achieved · {m._count?.claim_requests ?? 0} claimed
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditTarget(m)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(m.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Claims tab ── */}
      {activeTab === 'claims' && (
        claimsLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : claims.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No redemption requests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl border flex-shrink-0 ${STATUS_STYLE[c.status] ?? 'bg-muted/40 border-border'}`}>
                      <Gift className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-foreground text-sm">{c.user?.full_name}</p>
                        <span className="text-[10px] text-muted-foreground">{c.user?.email}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[c.status] ?? 'bg-muted/40 border-border'}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.milestone?.name} — {c.milestone?.reward_desc}</p>
                      <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                        <span>{c.cash_opted ? '💰 Cash option' : '📦 Physical gift'}</span>
                        <span>Claimed: {new Date(c.claim_date).toLocaleDateString('en-IN')}</span>
                        {c.processed_at && <span>Processed: {new Date(c.processed_at).toLocaleDateString('en-IN')}</span>}
                      </div>
                      {c.delivery_info && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 italic bg-muted/40 px-2 py-1 rounded-lg">
                          {c.cash_opted ? 'Bank details: ' : 'Delivery: '}{c.delivery_info}
                        </p>
                      )}
                      {c.admin_note && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 italic">Admin note: {c.admin_note}</p>
                      )}
                    </div>

                    {/* Expand toggle */}
                    <button
                      type="button"
                      title={openClaimId === c.id ? 'Collapse' : 'Expand to update status'}
                      onClick={() => setOpenClaimId(openClaimId === c.id ? null : c.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                    >
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openClaimId === c.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded status updater */}
                  {openClaimId === c.id && (
                    <div className="border-t border-border/60 pt-3 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wide">Update Status</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {CLAIM_STATUSES.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setClaimNotes(n => ({ ...n, [`${c.id}-status`]: s }))}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                (claimNotes[`${c.id}-status`] ?? c.status) === s
                                  ? (STATUS_STYLE[s] ?? 'bg-muted border-border')
                                  : 'border-border text-muted-foreground hover:border-foreground/30'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wide">Admin Note</Label>
                        <Input
                          value={claimNotes[`${c.id}-note`] ?? c.admin_note ?? ''}
                          onChange={e => setClaimNotes(n => ({ ...n, [`${c.id}-note`]: e.target.value }))}
                          placeholder="Optional note to user…"
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateClaimMutation.mutate({
                            id: c.id,
                            status: claimNotes[`${c.id}-status`] ?? c.status,
                            admin_note: claimNotes[`${c.id}-note`] ?? c.admin_note ?? '',
                          })}
                          disabled={updateClaimMutation.isPending}
                          className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          {updateClaimMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                          Save
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => setOpenClaimId(null)}
                          className="h-8 text-xs"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl"><Trash2 className="w-5 h-5 text-red-500" /></div>
              <div>
                <p className="font-black text-foreground">Delete Milestone?</p>
                <p className="text-xs text-muted-foreground">This will remove the milestone and all related records.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 h-9 text-xs">Cancel</Button>
              <Button
                onClick={() => deleteMutation.mutate(deleteTarget)}
                disabled={deleteMutation.isPending}
                className="flex-1 h-9 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
