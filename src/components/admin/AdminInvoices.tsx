import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import {
  Receipt, Loader2, ChevronDown, ChevronUp, FileText,
  CheckCircle2, XCircle, RefreshCw, Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaginationFooter } from '@/components/ui/pagination-footer';

const PAGE_LIMIT = 20;

const TYPE_TABS = ['all', 'purchase', 'withdrawal'] as const;
type TypeFilter = typeof TYPE_TABS[number];

const STATUS_OPTIONS = ['pending', 'paid', 'cancelled', 'refunded'] as const;
const WORKFLOW_STAGES = ['created', 'processing', 'completed', 'on_hold', 'disputed'] as const;

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-500/10 border-amber-500/30 text-amber-600',
  paid:      'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
  cancelled: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
  refunded:  'bg-blue-500/10 border-blue-500/30 text-blue-600',
};

const TYPE_STYLE: Record<string, string> = {
  purchase:   'bg-violet-500/10 border-violet-500/30 text-violet-600',
  withdrawal: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
};

function fmt(v: number | null | undefined) {
  if (v == null) return '—';
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminInvoices() {
  const perm = useEmployeePermission('admin-invoices');
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusInputs, setStatusInputs] = useState<Record<string, string>>({});
  const [stageInputs, setStageInputs] = useState<Record<string, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery<{ invoices: any[]; total: number; totals: any }>({
    queryKey: ['admin-invoices', typeFilter, statusFilter, dateFrom, dateTo, page],
    queryFn: () => api.invoices.adminList({
      type:   typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter || undefined,
      from:   dateFrom || undefined,
      to:     dateTo   || undefined,
      page,
      limit: PAGE_LIMIT,
    }),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, workflow_stage, admin_note }: any) =>
      api.invoices.update(id, { status, workflow_stage, admin_note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-invoices'] }); setOpenId(null); },
  });

  const invoices = (data?.invoices ?? []).filter(inv => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(s) ||
      inv.user?.full_name?.toLowerCase().includes(s) ||
      inv.user?.email?.toLowerCase().includes(s) ||
      inv.description?.toLowerCase().includes(s)
    );
  });

  const totals = data?.totals ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/40 pb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-violet-500" /> Invoice Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">View, manage, and update workflow for all platform invoices.</p>
        </div>
        <button type="button" onClick={() => refetch()} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: fmt(totals.total_amount), color: 'text-foreground' },
          { label: 'GST Collected', value: fmt(totals.gst_amount), color: 'text-emerald-500' },
          { label: 'TDS Deducted', value: fmt(totals.tds_amount), color: 'text-rose-500' },
          { label: 'Admin Charges', value: fmt(totals.admin_charge), color: 'text-amber-500' },
        ].map(s => (
          <Card key={s.label} className="border border-border bg-card">
            <CardContent className="p-3 text-center">
              <p className={`text-lg font-black font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
          {TYPE_TABS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${typeFilter === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-8 text-xs border border-border rounded-lg bg-muted/20 px-2 text-foreground"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="h-8 text-xs w-36" />
          <span className="text-muted-foreground text-xs">–</span>
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="h-8 text-xs w-36" />
        </div>
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search number, name, email..."
          className="h-8 text-xs max-w-xs bg-muted/20"
        />
      </div>

      {/* Invoice list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No invoices found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv: any) => {
            const isOpen = openId === inv.id;
            const curStatus = statusInputs[inv.id] ?? inv.status;
            const curStage  = stageInputs[inv.id]  ?? inv.workflow_stage ?? 'created';
            const curNote   = noteInputs[inv.id]   ?? inv.admin_note ?? '';

            return (
              <Card key={inv.id} className="border border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  {/* Summary row */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground text-sm font-mono">{inv.invoice_number}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border capitalize ${TYPE_STYLE[inv.type] ?? ''}`}>
                          {inv.type}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[inv.status] ?? ''}`}>
                          {inv.status}
                        </span>
                        {inv.workflow_stage && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-border bg-muted/40 text-muted-foreground">
                            {inv.workflow_stage}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {inv.user?.full_name} · {inv.user?.email}
                      </p>
                      {inv.description && (
                        <p className="text-[10px] text-muted-foreground truncate">{inv.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black font-mono text-foreground">{fmt(inv.total_amount)}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <button
                      type="button"
                      title={isOpen ? 'Collapse' : 'Expand'}
                      onClick={() => setOpenId(isOpen ? null : inv.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded admin controls */}
                  {isOpen && (
                    <div className="border-t border-border/60 pt-3 space-y-4">
                      {/* Breakdown */}
                      <div className="bg-muted/10 border border-border/50 rounded-xl p-4 space-y-2 text-xs font-mono">
                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-bold">{fmt(inv.subtotal)}</span></div>
                        {inv.gst_rate != null && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                            <span>GST ({Number(inv.gst_rate)}%){inv.gst_category ? ` · ${inv.gst_category}` : ''}</span>
                            <span className="font-bold">+ {fmt(inv.gst_amount)}</span>
                          </div>
                        )}
                        {inv.tds_rate != null && (
                          <div className="flex justify-between text-rose-500">
                            <span>TDS ({Number(inv.tds_rate)}%)</span>
                            <span className="font-bold">− {fmt(inv.tds_amount)}</span>
                          </div>
                        )}
                        {inv.admin_charge != null && Number(inv.admin_charge) > 0 && (
                          <div className="flex justify-between text-amber-500">
                            <span>Admin Charges</span>
                            <span className="font-bold">{inv.type === 'purchase' ? '+' : '−'} {fmt(inv.admin_charge)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-border/60 pt-2 font-black text-sm">
                          <span>Total</span><span>{fmt(inv.total_amount)}</span>
                        </div>
                      </div>

                      {/* Status & workflow controls */}
                      {perm.edit && (
                        <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-muted-foreground uppercase">Payment Status</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {STATUS_OPTIONS.map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setStatusInputs(p => ({ ...p, [inv.id]: s }))}
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all capitalize ${curStatus === s ? (STATUS_STYLE[s] ?? 'bg-muted border-border') : 'border-border text-muted-foreground hover:border-foreground/30'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-muted-foreground uppercase">Workflow Stage</Label>
                            <select
                              value={curStage}
                              onChange={e => setStageInputs(p => ({ ...p, [inv.id]: e.target.value }))}
                              className="w-full h-9 text-xs border border-border rounded-lg bg-muted/20 px-2 text-foreground"
                            >
                              {WORKFLOW_STAGES.map(st => (
                                <option key={st} value={st}>{st.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-muted-foreground uppercase">Admin Note</Label>
                            <Input
                              value={curNote}
                              onChange={e => setNoteInputs(p => ({ ...p, [inv.id]: e.target.value }))}
                              placeholder="Note visible to user…"
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: inv.id, status: curStatus, workflow_stage: curStage, admin_note: curNote })}
                            className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                            Save Changes
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setOpenId(null)} className="h-8 text-xs">
                            <XCircle className="w-3 h-3 mr-1" />Cancel
                          </Button>
                        </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && invoices.length > 0 && (
        <Card className="border border-border bg-card">
          <PaginationFooter page={page} totalPages={Math.ceil((data?.total ?? 0) / PAGE_LIMIT)} total={data?.total ?? 0} onPageChange={setPage} label="invoices" />
        </Card>
      )}
    </div>
  );
}
