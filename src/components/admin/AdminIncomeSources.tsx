import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  Wallet, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  AlertCircle, Loader2, ChevronDown, ChevronUp, Info,
  GitBranch, Zap, Trophy, Star, BookOpen, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ── Category metadata ────────────────────────────────────────────────────────
const CAT_META: Record<string, { label: string; icon: any; color: string; bg: string; desc: string }> = {
  dsi:          { label: 'Direct Sponsor Income', icon: Users,     color: 'text-violet-500',  bg: 'bg-violet-500/10 border-violet-500/25', desc: 'Paid to direct sponsor on referral package purchase' },
  generational: { label: 'Generational Income',   icon: GitBranch, color: 'text-blue-500',    bg: 'bg-blue-500/10 border-blue-500/25',    desc: 'Paid up N levels in the referral chain on first purchase' },
  binary:       { label: 'Binary Matching',        icon: Zap,       color: 'text-amber-500',   bg: 'bg-amber-500/10 border-amber-500/25',  desc: 'Daily bonus on left/right BV matching' },
  milestone:    { label: 'Milestone Bonus',        icon: Trophy,    color: 'text-rose-500',    bg: 'bg-rose-500/10 border-rose-500/25',    desc: 'Paid when BV milestones or rank targets are achieved' },
  course:       { label: 'Course Income',          icon: BookOpen,  color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/25', desc: 'Instructor/platform share on course purchases' },
  referral:     { label: 'Referral Bonus',         icon: Star,      color: 'text-cyan-500',    bg: 'bg-cyan-500/10 border-cyan-500/25',    desc: 'Flat bonus for bringing new members' },
};

const CATEGORIES = Object.keys(CAT_META);

const EMPTY_FORM = {
  code: '', name: '', description: '',
  category: 'generational',
  rate: '', fixed_amount: '', daily_cap: '',
  generation_level: '', order_index: '',
};

type IncomeSource = {
  id: string; code: string; name: string; description?: string | null;
  category: string; rate?: string | null; fixed_amount?: string | null;
  daily_cap?: string | null; generation_level?: number | null;
  is_active: boolean; is_system: boolean; order_index: number;
};

function fmtRate(src: IncomeSource) {
  if (src.fixed_amount && Number(src.fixed_amount) > 0) return `₹${Number(src.fixed_amount).toLocaleString('en-IN')} fixed`;
  if (src.rate && Number(src.rate) > 0) return `${Number(src.rate)}%`;
  if (src.category === 'dsi') return 'Per-package amount';
  return '—';
}

// ── Add / Edit form ──────────────────────────────────────────────────────────
function SourceForm({
  initial, onSave, onCancel, saving,
}: {
  initial?: Partial<IncomeSource>;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initial ? {
      code:             initial.code             ?? '',
      name:             initial.name             ?? '',
      description:      initial.description      ?? '',
      category:         initial.category         ?? 'generational',
      rate:             initial.rate             != null ? String(Number(initial.rate))         : '',
      fixed_amount:     initial.fixed_amount     != null ? String(Number(initial.fixed_amount)) : '',
      daily_cap:        initial.daily_cap        != null ? String(Number(initial.daily_cap))    : '',
      generation_level: initial.generation_level != null ? String(initial.generation_level)    : '',
      order_index:      initial.order_index      != null ? String(initial.order_index)          : '',
    } : {}),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      name:        form.name.trim(),
      description: form.description.trim() || null,
      category:    form.category,
      rate:             form.rate             ? parseFloat(form.rate)             : null,
      fixed_amount:     form.fixed_amount     ? parseFloat(form.fixed_amount)     : null,
      daily_cap:        form.daily_cap        ? parseFloat(form.daily_cap)        : null,
      generation_level: form.generation_level ? parseInt(form.generation_level)   : null,
      order_index:      form.order_index      ? parseInt(form.order_index)        : undefined,
    };
    if (!isEdit) payload.code = form.code.trim().toLowerCase().replace(/\s+/g, '_');
    onSave(payload);
  }

  const isGen = form.category === 'generational';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Code — only for new */}
        {!isEdit && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Code *</label>
            <input
              required value={form.code} onChange={e => set('code', e.target.value)}
              placeholder="gen4, referral_bonus…"
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[9px] text-muted-foreground">Unique identifier (lowercase, underscores). Cannot be changed later.</p>
          </div>
        )}

        {/* Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Display Name *</label>
          <input
            required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="4th Generation Income"
            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Category *</label>
          <select
            value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{CAT_META[c]?.label ?? c}</option>
            ))}
          </select>
        </div>

        {/* Generation Level — only for generational */}
        {isGen && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Generation Level *</label>
            <input
              type="number" min={1} max={20} required={isGen}
              value={form.generation_level} onChange={e => set('generation_level', e.target.value)}
              placeholder="2 = gen2, 3 = gen3, 4 = gen4…"
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[9px] text-muted-foreground">Hops from buyer up the referral chain (2 = sponsor's sponsor).</p>
          </div>
        )}

        {/* Rate */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Rate (%)
            {form.category === 'generational' && <span className="ml-1 text-muted-foreground font-normal">of DSI reward</span>}
            {form.category === 'binary'        && <span className="ml-1 text-muted-foreground font-normal">of matched BV</span>}
          </label>
          <input
            type="number" min={0} max={100} step={0.01}
            value={form.rate} onChange={e => set('rate', e.target.value)}
            placeholder="10.00"
            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Fixed Amount */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Fixed Amount (₹) <span className="text-muted-foreground font-normal">overrides rate</span></label>
          <input
            type="number" min={0} step={0.01}
            value={form.fixed_amount} onChange={e => set('fixed_amount', e.target.value)}
            placeholder="0.00"
            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Daily Cap — only for binary */}
        {form.category === 'binary' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Daily Cap (₹)</label>
            <input
              type="number" min={0} step={1}
              value={form.daily_cap} onChange={e => set('daily_cap', e.target.value)}
              placeholder="10000"
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[9px] text-muted-foreground">Maximum binary bonus per user per day.</p>
          </div>
        )}

        {/* Order */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Display Order</label>
          <input
            type="number" min={0}
            value={form.order_index} onChange={e => set('order_index', e.target.value)}
            placeholder="0"
            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
        <textarea
          rows={2} value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Optional — explains when/how this income is paid"
          className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving}
          className="h-8 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-5">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          {isEdit ? 'Save Changes' : 'Create Income Source'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-8 text-xs px-4">Cancel</Button>
      </div>
    </form>
  );
}

// ── Single income source row ─────────────────────────────────────────────────
function SourceRow({
  src, onEdit, onToggle, onDelete, toggling, deleting,
}: {
  src: IncomeSource;
  onEdit: (s: IncomeSource) => void;
  onToggle: (s: IncomeSource) => void;
  onDelete: (s: IncomeSource) => void;
  toggling: boolean; deleting: boolean;
}) {
  const cat = CAT_META[src.category] ?? CAT_META['referral'];
  const Icon = cat.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
      src.is_active
        ? 'bg-card border-border hover:border-border/60'
        : 'bg-muted/20 border-border/40 opacity-60'
    }`}>
      {/* Icon */}
      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${cat.bg}`}>
        <Icon className={`w-4 h-4 ${cat.color}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-bold text-foreground">{src.name}</p>
          <span className="text-[9px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/50">{src.code}</span>
          {src.category === 'generational' && src.generation_level && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-500">
              Level {src.generation_level}
            </span>
          )}
          {src.is_system && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted/50 border border-border text-muted-foreground">System</span>
          )}
          {!src.is_active && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-500">Disabled</span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{src.description || cat.desc}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className={`text-[10px] font-bold ${cat.color}`}>{fmtRate(src)}</span>
          {src.category === 'binary' && src.daily_cap && (
            <span className="text-[9px] text-muted-foreground">Daily cap: ₹{Number(src.daily_cap).toLocaleString('en-IN')}</span>
          )}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cat.bg} ${cat.color}`}>
            {cat.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button" title={src.is_active ? 'Disable' : 'Enable'}
          onClick={() => onToggle(src)}
          disabled={toggling}
          className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
        >
          {toggling
            ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            : src.is_active
              ? <ToggleRight className="w-5 h-5 text-emerald-500" />
              : <ToggleLeft  className="w-5 h-5 text-muted-foreground" />}
        </button>
        <button
          type="button" title="Edit"
          onClick={() => onEdit(src)}
          className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {!src.is_system && (
          <button
            type="button" title="Delete"
            onClick={() => onDelete(src)}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            {deleting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              : <Trash2 className="w-3.5 h-3.5 text-rose-500" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Category section (collapsible) ───────────────────────────────────────────
function CategorySection({
  category, sources, onEdit, onToggle, onDelete,
  togglingId, deletingId,
}: {
  category: string; sources: IncomeSource[];
  onEdit: (s: IncomeSource) => void;
  onToggle: (s: IncomeSource) => void;
  onDelete: (s: IncomeSource) => void;
  togglingId: string | null; deletingId: string | null;
}) {
  const [open, setOpen] = useState(true);
  const cat = CAT_META[category] ?? { label: category, icon: Star, color: 'text-foreground', bg: 'bg-muted', desc: '' };
  const Icon = cat.icon;
  const activeCount = sources.filter(s => s.is_active).length;

  return (
    <Card className="border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${cat.bg}`}>
            <Icon className={`w-4 h-4 ${cat.color}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{cat.label}</p>
            <p className="text-[10px] text-muted-foreground">{cat.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeCount > 0 ? `${cat.bg} ${cat.color}` : 'bg-muted/40 border-border text-muted-foreground'}`}>
            {activeCount}/{sources.length} active
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {sources.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No income sources in this category yet.</p>
          ) : (
            sources.map(src => (
              <SourceRow
                key={src.id} src={src}
                onEdit={onEdit} onToggle={onToggle} onDelete={onDelete}
                toggling={togglingId === src.id}
                deleting={deletingId === src.id}
              />
            ))
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminIncomeSources() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd]       = useState(false);
  const [editSrc, setEditSrc]       = useState<IncomeSource | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<IncomeSource | null>(null);

  const { data: sources = [], isLoading, isError } = useQuery<IncomeSource[]>({
    queryKey: ['income-sources'],
    queryFn:  () => api.incomeSources.list(),
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['income-sources'] });

  const createMut = useMutation({
    mutationFn: (data: any) => api.incomeSources.create(data),
    onSuccess: () => { invalidate(); setShowAdd(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.incomeSources.update(id, data),
    onSuccess: () => { invalidate(); setEditSrc(null); setTogglingId(null); },
    onError:   () => setTogglingId(null),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.incomeSources.remove(id),
    onSuccess: () => { invalidate(); setConfirmDel(null); setDeletingId(null); },
    onError:   () => setDeletingId(null),
  });

  function handleToggle(src: IncomeSource) {
    setTogglingId(src.id);
    updateMut.mutate({ id: src.id, data: { is_active: !src.is_active } });
  }

  function handleDelete(src: IncomeSource) {
    setDeletingId(src.id);
    deleteMut.mutate(src.id);
  }

  // Group by category in display order
  const grouped = CATEGORIES.reduce<Record<string, IncomeSource[]>>((acc, cat) => {
    acc[cat] = sources.filter(s => s.category === cat).sort((a, b) => a.order_index - b.order_index || (a.generation_level ?? 0) - (b.generation_level ?? 0));
    return acc;
  }, {});
  // Catch any custom/unknown categories
  const unknownCats = [...new Set(sources.filter(s => !CATEGORIES.includes(s.category)).map(s => s.category))];
  unknownCats.forEach(cat => { grouped[cat] = sources.filter(s => s.category === cat); });

  const allCategories = [...CATEGORIES, ...unknownCats].filter(cat => grouped[cat]?.length > 0 || cat === 'generational');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-violet-500" />
            Income Sources
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Single source of truth for all income types — DSI, generational, binary, milestone, and more.
            Changes apply to all new commission calculations immediately.
          </p>
        </div>
        <Button
          onClick={() => { setShowAdd(s => !s); setEditSrc(null); }}
          className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Income Source
        </Button>
      </div>

      {/* Info banner */}
      <Card className="border border-violet-500/20 bg-violet-500/5">
        <CardContent className="p-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-violet-600 dark:text-violet-400">
            <span className="font-bold">How it works:</span> Enabling or disabling an income source takes effect on the <em>next</em> package purchase or binary matching run.
            For generational income, set the <em>generation level</em> (e.g. level 4 = 4 hops from buyer) and the rate (% of DSI reward).
            The <strong>code</strong> must be unique and is permanent — rename via the name field instead.
          </p>
        </CardContent>
      </Card>

      {/* Add form */}
      {showAdd && (
        <Card className="border border-violet-500/30 bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-500" />
              New Income Source
            </CardTitle>
            <CardDescription className="text-xs">
              Define a new income type. It will appear in commission history and earnings dashboards immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <SourceForm
              onSave={data => createMut.mutate(data)}
              onCancel={() => setShowAdd(false)}
              saving={createMut.isPending}
            />
            {createMut.isError && (
              <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {(createMut.error as Error)?.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit form */}
      {editSrc && (
        <Card className="border border-amber-500/30 bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-500" />
              Edit — {editSrc.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <SourceForm
              initial={editSrc}
              onSave={data => updateMut.mutate({ id: editSrc.id, data })}
              onCancel={() => setEditSrc(null)}
              saving={updateMut.isPending}
            />
            {updateMut.isError && (
              <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {(updateMut.error as Error)?.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <Card className="border border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-rose-500">Delete "{confirmDel.name}"?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This removes the income source config. Existing commission transactions are not affected.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => { setConfirmDel(null); setDeletingId(null); }}
                className="h-8 text-xs"
              >Cancel</Button>
              <Button
                size="sm"
                onClick={() => handleDelete(confirmDel)}
                disabled={deleteMut.isPending}
                className="h-8 text-xs bg-rose-500 hover:bg-rose-600 text-white"
              >
                {deleteMut.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />Loading income sources…
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 gap-2 text-sm text-rose-500">
          <AlertCircle className="w-5 h-5" />Failed to load income sources.
        </div>
      ) : (
        <div className="space-y-4">
          {allCategories.map(cat => (
            <CategorySection
              key={cat}
              category={cat}
              sources={grouped[cat] ?? []}
              onEdit={s => { setEditSrc(s); setShowAdd(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onToggle={handleToggle}
              onDelete={s => { setConfirmDel(s); setDeletingId(s.id); }}
              togglingId={togglingId}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}

      {/* Summary footer */}
      {!isLoading && !isError && sources.length > 0 && (
        <Card className="border border-border bg-muted/20">
          <CardContent className="p-3 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
            <span><strong className="text-foreground">{sources.filter(s => s.is_active).length}</strong> active income sources</span>
            <span><strong className="text-foreground">{sources.filter(s => s.category === 'generational' && s.is_active).length}</strong> active generational levels</span>
            <span><strong className="text-foreground">{sources.filter(s => !s.is_active).length}</strong> disabled</span>
            <span><strong className="text-foreground">{sources.filter(s => !s.is_system).length}</strong> custom (admin-created)</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
