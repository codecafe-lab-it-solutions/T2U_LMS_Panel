import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  FileSpreadsheet, Loader2, AlertCircle, IndianRupee, Receipt, Landmark,
  Building2, TrendingDown, Tag, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ReportTab = 'gst' | 'tds';

function fmt(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DateFilter({
  from, to, onFrom, onTo, onGenerate, onClear, loading, label,
}: {
  from: string; to: string;
  onFrom: (v: string) => void; onTo: (v: string) => void;
  onGenerate: () => void; onClear: () => void;
  loading: boolean; label: string;
}) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase block">From Date</label>
          <input type="date" title="From date" value={from} onChange={e => onFrom(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase block">To Date</label>
          <input type="date" title="To date" value={to} onChange={e => onTo(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
        </div>
        <Button onClick={onGenerate} disabled={loading}
          className="h-9 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold px-5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
          {label}
        </Button>
        {(from || to) && (
          <Button variant="outline" onClick={onClear} className="h-9 text-xs px-4 border-border">
            <RefreshCw className="w-3 h-3 mr-1" />Clear
          </Button>
        )}
        <p className="text-[10px] text-muted-foreground self-end pb-1">
          {from || to
            ? `Filtered${from ? ` from ${from}` : ''}${to ? ` to ${to}` : ''}`
            : 'Showing all records'}
        </p>
      </CardContent>
    </Card>
  );
}

const RATE_BADGE: Record<number, string> = {
  0:  'bg-emerald-500/10 border-emerald-500/25 text-emerald-600',
  5:  'bg-blue-500/10 border-blue-500/25 text-blue-600',
  12: 'bg-violet-500/10 border-violet-500/25 text-violet-600',
  18: 'bg-amber-500/10 border-amber-500/25 text-amber-600',
  28: 'bg-red-500/10 border-red-500/25 text-red-600',
};
const RATE_TEXT: Record<number, string> = {
  0: 'text-emerald-500', 5: 'text-blue-500', 12: 'text-violet-500', 18: 'text-amber-500', 28: 'text-red-500',
};

// ── GST Report Tab ─────────────────────────────────────────────────────────────
function GSTReportTab() {
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [params, setParams]     = useState<{ from?: string; to?: string }>({});
  const [catFilter, setCatFilter] = useState('');
  const [detailPage, setDetailPage] = useState(1);
  const DETAIL_LIMIT = 100;

  const { data: gstRows = [], isFetching, isError, refetch } = useQuery<any[]>({
    queryKey: ['gst-summary', params.from, params.to],
    queryFn: () => api.invoices.gstSummary(Object.keys(params).length ? params : undefined),
    staleTime: 60_000,
  });

  // Per-invoice detail — paginated, respects date + category filter
  const detailParams = {
    ...params,
    ...(catFilter ? { category: catFilter } : {}),
    page: detailPage,
    limit: DETAIL_LIMIT,
  };
  const { data: detailData, isFetching: detailFetching, isError: detailError } = useQuery({
    queryKey: ['gst-detail', params.from, params.to, catFilter, detailPage] as const,
    queryFn: () => api.invoices.gstDetail(detailParams),
    staleTime: 60_000,
  });
  const gstInvoices: any[] = detailData?.invoices ?? [];
  const detailTotal: number = detailData?.total ?? 0;
  const totalPages  = Math.max(1, Math.ceil(detailTotal / DETAIL_LIMIT));

  // Build category options from what's actually in data
  const categoryOptions = Array.from(
    new Set(gstRows.map((r: any) => r.category as string).filter(Boolean))
  ).sort();

  const filtered = catFilter ? gstRows.filter((r: any) => r.category === catFilter) : gstRows;

  const totals = filtered.reduce(
    (a, r: any) => ({
      count:      a.count + Number(r.count ?? 0),
      subtotal:   a.subtotal + Number(r.subtotal ?? 0),
      gst_amount: a.gst_amount + Number(r.gst_amount ?? 0),
      total:      a.total + Number(r.total_amount ?? 0),
    }),
    { count: 0, subtotal: 0, gst_amount: 0, total: 0 }
  );

  return (
    <div className="space-y-5">
      <DateFilter
        from={from} to={to} loading={isFetching}
        onFrom={setFrom} onTo={setTo}
        onGenerate={() => setParams({ from: from || undefined, to: to || undefined })}
        onClear={() => { setFrom(''); setTo(''); setParams({}); }}
        label="Generate GST Report"
      />

      {/* Category filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <p className="text-xs font-bold text-foreground shrink-0">Category:</p>
        <button type="button"
          onClick={() => setCatFilter('')}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${catFilter === '' ? 'bg-violet-600 text-white border-violet-600' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}>
          All
        </button>
        {categoryOptions.map(cat => (
          <button type="button" key={cat}
            onClick={() => setCatFilter(cat === catFilter ? '' : cat)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all max-w-[220px] truncate ${catFilter === cat ? 'bg-violet-600 text-white border-violet-600' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}>
            {cat}
          </button>
        ))}
        {categoryOptions.length === 0 && !isFetching && (
          <p className="text-[10px] text-muted-foreground italic">Categories appear here after products are sold.</p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Invoices',      value: totals.count.toLocaleString('en-IN'), color: 'text-foreground',  icon: Receipt,         sub: 'Purchase invoices' },
          { label: 'Taxable Value', value: fmt(totals.subtotal),                 color: 'text-violet-500',  icon: IndianRupee,     sub: 'Before GST' },
          { label: 'GST Collected', value: fmt(totals.gst_amount),               color: 'text-emerald-500', icon: Landmark,        sub: '→ Remit to GST dept.' },
          { label: 'Invoice Total', value: fmt(totals.total),                    color: 'text-foreground',  icon: FileSpreadsheet, sub: 'Taxable + GST' },
        ].map(s => (
          <Card key={s.label} className="border border-border bg-card shadow-sm">
            <CardContent className="p-4 space-y-1">
              <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <s.icon className="w-3 h-3" />{s.label}
              </p>
              <p className={`text-xl font-extrabold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category-wise breakdown table */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-violet-500" />
            GST by Product Category
            {catFilter && (
              <span className="text-[11px] font-normal text-muted-foreground ml-1">— {catFilter}</span>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Purchase invoices grouped by product GST category and government-prescribed rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isFetching ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading GST report…
            </div>
          ) : isError ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4" />Failed to load.
              <button onClick={() => refetch()} className="underline">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-bold text-muted-foreground">No GST data found</p>
              <p className="text-xs text-muted-foreground">
                {catFilter
                  ? `No invoices found for category "${catFilter}".`
                  : 'No purchase invoices with GST for the selected period.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Category', 'GST Rate', 'Invoices', 'Taxable Value', 'GST Amount', 'Share', 'Total'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: any, i: number) => {
                    const rate = Number(r.gst_rate ?? 0);
                    const sharePct = totals.gst_amount > 0
                      ? ((Number(r.gst_amount) / totals.gst_amount) * 100).toFixed(1)
                      : '0';
                    return (
                      <tr key={i} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground">{r.category || 'Uncategorized'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black ${RATE_BADGE[rate] ?? 'bg-muted/40 border-border text-muted-foreground'}`}>
                            {rate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-foreground font-bold">
                          {Number(r.count ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-mono text-foreground">{fmt(r.subtotal)}</td>
                        <td className={`px-4 py-3 font-mono font-bold ${RATE_TEXT[rate] ?? 'text-foreground'}`}>
                          {fmt(r.gst_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                              <div className="h-full rounded-full bg-violet-500" style={{ width: `${sharePct}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">{sharePct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-foreground">{fmt(r.total_amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border/60 bg-muted/20 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase">
                      Totals {catFilter ? `— ${catFilter}` : '(All Categories)'}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">{totals.count.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-mono text-foreground">{fmt(totals.subtotal)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-500">{fmt(totals.gst_amount)}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">100%</td>
                    <td className="px-4 py-3 font-mono text-foreground">{fmt(totals.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-invoice GST detail table */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-violet-500" />
            GST Invoice Breakdown
            {catFilter && <span className="text-[11px] font-normal text-muted-foreground ml-1">— {catFilter}</span>}
          </CardTitle>
          <CardDescription className="text-xs">
            Individual purchase invoices showing exact GST applied per transaction.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {detailFetching ? (
            <div className="p-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading invoice detail…
            </div>
          ) : detailError ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4" />Failed to load invoice detail.
            </div>
          ) : gstInvoices.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-muted-foreground">No invoices found for the selected filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Invoice No.', 'Date', 'User', 'Description', 'GST Category', 'GST Rate', 'Taxable Value', 'GST Amount', 'Invoice Total', 'Status'].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gstInvoices.map((inv: any) => {
                    const rate = Number(inv.gst_rate ?? 0);
                    return (
                      <tr key={inv.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-[10px] text-foreground font-bold whitespace-nowrap">
                          {inv.invoice_number}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <p className="font-semibold text-foreground text-[11px]">{inv.user?.full_name || 'Unknown'}</p>
                          <p className="text-[9px] text-muted-foreground">{inv.user?.email || ''}</p>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground max-w-[260px]">
                          <p className="text-[10px]">{inv.description || '—'}</p>
                          {inv.category && <p className="text-[9px] opacity-60">{inv.category}</p>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <p className="text-[10px] text-foreground">{inv.gst_category || 'Uncategorized'}</p>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black ${RATE_BADGE[rate] ?? 'bg-muted/40 border-border text-muted-foreground'}`}>
                            {rate}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-foreground whitespace-nowrap">{fmt(inv.subtotal)}</td>
                        <td className={`px-3 py-2.5 font-mono font-bold whitespace-nowrap ${RATE_TEXT[rate] ?? 'text-foreground'}`}>
                          {Number(inv.gst_amount ?? 0) > 0 ? fmt(inv.gst_amount) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-foreground whitespace-nowrap">{fmt(inv.total_amount)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                            inv.status === 'paid'      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' :
                            inv.status === 'cancelled' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                            'bg-amber-500/10 border-amber-500/30 text-amber-600'
                          }`}>{inv.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border/60 bg-muted/20 font-bold">
                    <td colSpan={6} className="px-3 py-3 text-[10px] font-bold text-muted-foreground uppercase">
                      Page {detailPage} of {totalPages} · {detailTotal} total invoice{detailTotal !== 1 ? 's' : ''}
                    </td>
                    <td className="px-3 py-3 font-mono text-foreground">
                      {fmt((gstInvoices as any[]).reduce((s: number, i: any) => s + Number(i.subtotal ?? 0), 0))}
                    </td>
                    <td className="px-3 py-3 font-mono text-emerald-500">
                      {fmt((gstInvoices as any[]).reduce((s: number, i: any) => s + Number(i.gst_amount ?? 0), 0))}
                    </td>
                    <td className="px-3 py-3 font-mono text-foreground">
                      {fmt((gstInvoices as any[]).reduce((s: number, i: any) => s + Number(i.total_amount ?? 0), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground">
                    Showing {((detailPage - 1) * DETAIL_LIMIT) + 1}–{Math.min(detailPage * DETAIL_LIMIT, detailTotal)} of {detailTotal}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm"
                      className="h-7 px-3 text-[10px]"
                      disabled={detailPage <= 1 || detailFetching}
                      onClick={() => setDetailPage(p => Math.max(1, p - 1))}>
                      ← Prev
                    </Button>
                    <span className="text-[10px] font-mono text-muted-foreground">{detailPage} / {totalPages}</span>
                    <Button variant="outline" size="sm"
                      className="h-7 px-3 text-[10px]"
                      disabled={detailPage >= totalPages || detailFetching}
                      onClick={() => setDetailPage(p => Math.min(totalPages, p + 1))}>
                      Next →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {totals.gst_amount > 0 && (
        <Card className="border border-emerald-500/25 bg-emerald-500/5">
          <CardContent className="p-3 flex items-start gap-3">
            <Landmark className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-500">
                GST Liability — {fmt(totals.gst_amount)} to be remitted to GST department
              </p>
              <p className="text-[10px] text-emerald-500/70 mt-0.5">
                Collected on product/course purchases at government-prescribed category rates. Remit to GSTIN.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── TDS Report Tab ─────────────────────────────────────────────────────────────
function TDSReportTab() {
  const [from, setFrom]     = useState('');
  const [to, setTo]         = useState('');
  const [params, setParams] = useState<{ from?: string; to?: string }>({});

  const { data, isFetching, isError, refetch } = useQuery<{ invoices: any[]; totals: any }>({
    queryKey: ['tds-summary', params.from, params.to],
    queryFn: () => api.invoices.tdsSummary(Object.keys(params).length ? params : undefined),
    staleTime: 60_000,
  });

  const invoices: any[] = data?.invoices ?? [];
  const t = {
    subtotal:     Number(data?.totals?.subtotal     ?? 0),
    tds_amount:   Number(data?.totals?.tds_amount   ?? 0),
    admin_charge: Number(data?.totals?.admin_charge ?? 0),
  };
  const netPaid = t.subtotal - t.tds_amount - t.admin_charge;

  return (
    <div className="space-y-5">
      <DateFilter
        from={from} to={to} loading={isFetching}
        onFrom={setFrom} onTo={setTo}
        onGenerate={() => setParams({ from: from || undefined, to: to || undefined })}
        onClear={() => { setFrom(''); setTo(''); setParams({}); }}
        label="Generate TDS Report"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Gross Withdrawal', value: fmt(t.subtotal),     color: 'text-foreground',  icon: IndianRupee, sub: 'Total requested' },
          { label: 'TDS Deducted',     value: fmt(t.tds_amount),   color: 'text-red-500',     icon: Receipt,     sub: '→ Income Tax dept. (Sec. 194H)' },
          { label: 'Platform Fee',     value: fmt(t.admin_charge), color: 'text-orange-500',  icon: Building2,   sub: 'Retained by T2U' },
          { label: 'Net Paid Out',     value: fmt(netPaid),        color: 'text-emerald-500', icon: TrendingDown, sub: 'Received by users' },
        ].map(s => (
          <Card key={s.label} className="border border-border bg-card shadow-sm">
            <CardContent className="p-4 space-y-1">
              <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <s.icon className="w-3 h-3" />{s.label}
              </p>
              <p className={`text-xl font-extrabold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {t.tds_amount > 0 && (
        <Card className="border border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Landmark className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-500">
                TDS Government Liability — {fmt(t.tds_amount)}
              </p>
              <p className="text-xs text-rose-400 mt-0.5">
                {fmt(t.tds_amount)} deducted under Sec. 194H from {invoices.length} withdrawal{invoices.length !== 1 ? 's' : ''}.
                Remit to Income Tax department.
              </p>
              <p className="text-[10px] text-rose-400/70 mt-1">
                GST is NOT charged on withdrawals — it applies only to product/course purchases (see GST Report tab).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-transaction table */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-red-500" />
            TDS Deduction Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Every approved withdrawal with TDS (Sec. 194H) and platform fee. Invoices auto-generated on approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isFetching ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading TDS report…
            </div>
          ) : isError ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4" />Failed to load.
              <button onClick={() => refetch()} className="underline ml-1">Retry</button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-bold text-muted-foreground">No withdrawal invoices found</p>
              <p className="text-xs text-muted-foreground">
                Withdrawal invoices are auto-created when admin approves a withdrawal request.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Date', 'Invoice No.', 'User', 'Gross', 'TDS Rate', 'TDS (Govt)', 'Platform Fee', 'Net Paid', 'Govt Payable'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => {
                    const gross  = Number(inv.subtotal     ?? 0);
                    const tdsAmt = Number(inv.tds_amount   ?? 0);
                    const admCh  = Number(inv.admin_charge ?? 0);
                    const net    = Number(inv.total_amount ?? 0);
                    return (
                      <tr key={inv.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-mono text-muted-foreground text-[10px] whitespace-nowrap">
                          {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-foreground whitespace-nowrap">{inv.invoice_number}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-semibold text-foreground">{inv.user?.full_name || 'Unknown'}</p>
                          <p className="text-[9px] text-muted-foreground">{inv.user?.email || ''}</p>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-foreground whitespace-nowrap">{fmt(gross)}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                          {inv.tds_rate != null ? `${Number(inv.tds_rate)}%` : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-red-500 font-bold whitespace-nowrap">{fmt(tdsAmt)}</td>
                        <td className="px-4 py-3 font-mono text-orange-500 whitespace-nowrap">{fmt(admCh)}</td>
                        <td className="px-4 py-3 font-mono text-emerald-500 font-bold whitespace-nowrap">{fmt(net)}</td>
                        <td className="px-4 py-3 font-mono text-rose-500 font-bold whitespace-nowrap">{fmt(tdsAmt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border/60 bg-muted/20 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase">
                      Totals ({invoices.length} transaction{invoices.length !== 1 ? 's' : ''})
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">{fmt(t.subtotal)}</td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3 font-mono text-red-500">{fmt(t.tds_amount)}</td>
                    <td className="px-4 py-3 font-mono text-orange-500">{fmt(t.admin_charge)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-500">{fmt(netPaid)}</td>
                    <td className="px-4 py-3 font-mono text-rose-500">{fmt(t.tds_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminTaxReport() {
  const [activeTab, setActiveTab] = useState<ReportTab>('gst');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-rose-500" />
          Tax &amp; Charges Report
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          GST on purchases · TDS on withdrawals · Separate reports for each government tax type
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab('gst')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'gst' ? 'bg-card text-emerald-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />GST Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tds')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'tds' ? 'bg-card text-red-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />TDS Report
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground -mt-2">
        {activeTab === 'gst'
          ? 'GST — applied on product/course purchases, grouped by category and government-prescribed slab rate'
          : 'TDS — deducted under Sec. 194H on withdrawal payouts to instructors and students'}
      </p>

      {activeTab === 'gst' ? <GSTReportTab /> : <TDSReportTab />}
    </div>
  );
}
