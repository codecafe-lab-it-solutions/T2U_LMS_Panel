import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import {
  Layers, Plus, Edit2, ToggleLeft, ToggleRight, Loader2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginationFooter } from '@/components/ui/pagination-footer';

const PAGE_LIMIT = 20;

type PackageRow = {
  id: string; name: string; price: number; bv: number;
  dsi_reward: number; description: string | null; is_active: boolean;
};

const EMPTY_FORM = { name: '', description: '' };

// ── Add / Edit form ──────────────────────────────────────────────────────────
// Packages are now just tier labels — price/BV/distributor pricing all live on the
// courses linked to a package (Course.price / distributor_price / bv_credit). Price,
// BV and DSI Reward still exist on the Package row itself (defaulted to 0 here) purely
// because the older, untouched standalone "buy a package directly" flow in packages.js
// still reads them — they're just not editable from this screen anymore.
function PackageForm({
  initial, onSave, onCancel, saving,
}: {
  initial?: Partial<PackageRow>;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initial ? {
      name:        initial.name        ?? '',
      description: initial.description ?? '',
    } : {}),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name:        form.name.trim(),
      description: form.description.trim() || null,
      ...(isEdit ? {} : { price: 0, bv: 0, dsi_reward: 0 }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Package Name *</label>
          <input
            required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Silver, Gold, Diamond…"
            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
        <textarea
          rows={2} value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Optional — shown to distributors when choosing a package"
          className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving}
          className="h-8 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-5">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          {isEdit ? 'Save Changes' : 'Create Package'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-8 text-xs px-4">Cancel</Button>
      </div>
    </form>
  );
}

// ── Single package row ────────────────────────────────────────────────────────
function PackageRowItem({
  pkg, onEdit, onToggle, toggling,
}: {
  pkg: PackageRow;
  onEdit: (p: PackageRow) => void;
  onToggle: (p: PackageRow) => void;
  toggling: boolean;
}) {
  const perm = useEmployeePermission('admin-packages');
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
      pkg.is_active ? 'bg-card border-border hover:border-border/60' : 'bg-muted/20 border-border/40 opacity-60'
    }`}>
      <div className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border bg-amber-500/10 border-amber-500/25">
        <Layers className="w-4 h-4 text-amber-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-bold text-foreground">{pkg.name}</p>
          {!pkg.is_active && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-500">Disabled</span>
          )}
        </div>
        {pkg.description && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{pkg.description}</p>}
        {(Number(pkg.price) > 0 || Number(pkg.bv) > 0 || Number(pkg.dsi_reward) > 0) && (
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[9px] font-semibold text-muted-foreground/70">
            <span title="Only used by the legacy standalone package-purchase flow — not by course distributor pricing">
              Legacy purchase: ₹{Number(pkg.price).toLocaleString('en-IN')} · {Number(pkg.bv).toFixed(0)} BV
              {Number(pkg.dsi_reward) > 0 ? ` · ₹${Number(pkg.dsi_reward).toLocaleString('en-IN')} DSI` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {perm.edit && (
          <button
            type="button" title={pkg.is_active ? 'Disable' : 'Enable'}
            onClick={() => onToggle(pkg)}
            disabled={toggling}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {toggling
              ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              : pkg.is_active
                ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
          </button>
        )}
        {perm.edit && (
          <button
            type="button" title="Edit"
            onClick={() => onEdit(pkg)}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminPackages() {
  const perm = useEmployeePermission('admin-packages');
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PackageRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ packages: PackageRow[]; total: number }>({
    queryKey: ['admin-packages', page],
    queryFn: () => api.packages.listPaged(page, PAGE_LIMIT, true) as unknown as Promise<{ packages: PackageRow[]; total: number }>,
  });
  const packages = data?.packages ?? [];
  const total = data?.total ?? 0;

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-packages'] });

  const createMut = useMutation({
    mutationFn: (data: any) => api.packages.create(data),
    onSuccess: () => { invalidate(); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.packages.update(id, data),
    onSuccess: () => { invalidate(); setEditing(null); },
  });

  const sorted = packages; // API returns them oldest-first

  function handleSave(data: any) {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  }

  function handleToggle(pkg: PackageRow) {
    setTogglingId(pkg.id);
    updateMut.mutate({ id: pkg.id, data: { is_active: !pkg.is_active } }, {
      onSettled: () => setTogglingId(null),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-500" />
            Packages
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Membership tiers (Silver, Gold, Diamond…) that make a distributor and unlock course distributor pricing.
          </p>
        </div>
        {!showForm && !editing && perm.create && (
          <Button onClick={() => setShowForm(true)} className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-4">
            <Plus className="w-3.5 h-3.5 mr-1.5" />New Package
          </Button>
        )}
      </div>

      {(showForm || editing) && (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold">{editing ? `Edit ${editing.name}` : 'New Package'}</CardTitle>
            <CardDescription className="text-xs">
              Any distributor owning any active package qualifies for distributor pricing on courses linked to a package.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <PackageForm
              initial={editing ?? undefined}
              saving={createMut.isPending || updateMut.isPending}
              onCancel={() => { setShowForm(false); setEditing(null); }}
              onSave={handleSave}
            />
          </CardContent>
        </Card>
      )}

      {(createMut.isError || updateMut.isError) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {(createMut.error as any)?.message || (updateMut.error as any)?.message || 'Failed to save package'}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />Loading packages…
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-14 text-center space-y-2">
          <Layers className="w-8 h-8 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No packages yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(pkg => (
            <PackageRowItem
              key={pkg.id} pkg={pkg}
              onEdit={p => { setEditing(p); setShowForm(false); }}
              onToggle={handleToggle}
              toggling={togglingId === pkg.id}
            />
          ))}
        </div>
      )}

      {!isLoading && Math.ceil(total / PAGE_LIMIT) > 1 && (
        <Card className="border border-border bg-card empty:hidden">
          <PaginationFooter page={page} totalPages={Math.ceil(total / PAGE_LIMIT)} total={total} onPageChange={setPage} label="packages" />
        </Card>
      )}
    </div>
  );
}
