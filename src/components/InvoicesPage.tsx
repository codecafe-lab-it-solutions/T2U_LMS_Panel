import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { exportCsv } from '../utils/exportCsv';
import { openPrintableDocument } from '../utils/printDocument';
import { buildInvoiceHtml } from '../utils/invoiceDocument';
import { formatDate, formatDateTime } from '../utils/date';
import { useDebounce } from '../hooks/useDebounce';
import { useFilterParams } from '../hooks/useFilterParams';
import {
  Receipt, Loader2, ChevronDown, ChevronUp, FileText, Download,
  FileDown, Eye, Filter, RotateCcw, Calendar, Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TYPE_TABS = ['all', 'purchase', 'withdrawal'] as const;
type TypeFilter = typeof TYPE_TABS[number];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
];

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

export default function InvoicesPage() {
  const { userProfile } = useAppStore();
  const { getParam, setParams } = useFilterParams();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>((getParam('type') as TypeFilter) || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(getParam('status') || 'all');
  const [search, setSearch] = useState<string>(getParam('search') || getParam('q') || '');
  const debouncedSearch = useDebounce(search, 300);
  const [fromDate, setFromDate] = useState<string>(getParam('from') || '');
  const [toDate, setToDate] = useState<string>(getParam('to') || '');

  const [openId, setOpenId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Sync state with URL params
  useEffect(() => {
    setParams({
      type: typeFilter === 'all' ? undefined : typeFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      from: fromDate || undefined,
      to: toDate || undefined,
      search: debouncedSearch.trim() || undefined,
    });
  }, [typeFilter, statusFilter, fromDate, toDate, debouncedSearch, setParams]);

  const { data, isLoading } = useQuery<{ invoices: any[]; total: number }>({
    queryKey: ['my-invoices', typeFilter, statusFilter, fromDate, toDate, debouncedSearch],
    queryFn: () =>
      api.invoices.my({
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        from: fromDate || undefined,
        to: toDate || undefined,
        search: debouncedSearch.trim() || undefined,
        limit: 100,
      }),
    staleTime: 60_000,
  });

  const rawInvoices = data?.invoices ?? [];

  // Fallback client-side filter in case backend returns unfiltered mock dataset
  const invoices = rawInvoices.filter((inv: any) => {
    if (typeFilter !== 'all' && inv.type !== typeFilter) return false;
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const numMatch = inv.invoice_number?.toLowerCase().includes(q);
      const descMatch = inv.description?.toLowerCase().includes(q);
      if (!numMatch && !descMatch) return false;
    }
    if (fromDate) {
      const invDate = new Date(inv.created_at);
      if (invDate < new Date(fromDate)) return false;
    }
    if (toDate) {
      const invDate = new Date(inv.created_at);
      if (invDate > new Date(toDate + 'T23:59:59Z')) return false;
    }
    return true;
  });

  const hasActiveFilters = Boolean(
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    search.trim() ||
    fromDate ||
    toDate
  );

  const handleResetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setSearch('');
    setFromDate('');
    setToDate('');
  };

  const handleExportCsv = () => {
    exportCsv(
      `my-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Invoice #', 'Type', 'Status', 'Description', 'Subtotal', 'GST Rate', 'GST Amount', 'TDS Rate', 'TDS Amount', 'Admin Charge', 'Total', 'Date'],
      invoices.map((inv: any) => [
        inv.invoice_number, inv.type, inv.status, inv.description ?? '', Number(inv.subtotal ?? 0),
        inv.gst_rate ?? '', inv.gst_amount ?? '', inv.tds_rate ?? '', inv.tds_amount ?? '',
        inv.admin_charge ?? '', Number(inv.total_amount ?? 0), formatDate(inv.created_at),
      ])
    );
  };

  const handleViewInvoice = (inv: any) => {
    openPrintableDocument(buildInvoiceHtml(inv, { name: userProfile.name, email: userProfile.email }));
  };

  const handleDownloadInvoice = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      const { downloadHtmlAsPdf } = await import('../utils/downloadPdf');
      const html = buildInvoiceHtml(inv, { name: userProfile.name, email: userProfile.email });
      await downloadHtmlAsPdf(html, `${inv.invoice_number}.pdf`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-border/40 pb-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-violet-500" /> My Invoices & Receipts
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View and download receipts for purchases, course enrollments, and withdrawals.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={invoices.length === 0}
          className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
        >
          <FileDown className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-card border border-border rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Debounced search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice number or description…"
              className="pl-8 h-8 text-xs bg-muted/20"
            />
          </div>

          {/* Type switcher tabs */}
          <div className="flex gap-1 bg-muted/40 rounded-xl p-1 shrink-0">
            {TYPE_TABS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`py-1 px-3 rounded-lg text-xs font-bold transition-all capitalize ${
                  typeFilter === t
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Status, Date range, and Reset row */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Status:</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                  statusFilter === opt.value
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-600'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Date Range inputs */}
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>From:</span>
              <Input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="h-7 w-32 text-[10px] px-2 bg-muted/20"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>To:</span>
              <Input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="h-7 w-32 text-[10px] px-2 bg-muted/20"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-[11px] font-bold text-muted-foreground hover:text-foreground gap-1 px-2"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-border rounded-2xl bg-card p-6">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold text-foreground">
            {hasActiveFilters ? 'No invoices found matching your filters' : 'No invoices yet'}
          </p>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try widening your date range, clearing search criteria, or selecting all statuses.'
              : 'Invoices are generated automatically for purchases, course enrollments, and withdrawals.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="mt-4 text-xs font-bold h-8 gap-1.5 border-border"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-w-4xl">
          {invoices.map((inv: any) => {
            const isOpen = openId === inv.id;
            return (
              <Card key={inv.id} className="border border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  {/* Summary row */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground text-sm font-mono">{inv.invoice_number}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border capitalize ${TYPE_STYLE[inv.type] ?? 'bg-muted/40 border-border text-muted-foreground'}`}>
                          {inv.type}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[inv.status] ?? 'bg-muted/40 border-border text-muted-foreground'}`}>
                          {inv.status}
                        </span>
                      </div>
                      {inv.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{inv.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {formatDateTime(inv.created_at)}
                        {inv.workflow_stage && <span className="ml-2 font-bold">[{inv.workflow_stage}]</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black font-mono text-foreground">{fmt(inv.total_amount)}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <button
                      type="button"
                      title="View invoice"
                      onClick={() => handleViewInvoice(inv)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-violet-600 shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Download PDF"
                      disabled={downloadingId === inv.id}
                      onClick={() => handleDownloadInvoice(inv)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-violet-600 shrink-0 disabled:opacity-50"
                    >
                      {downloadingId === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      title={isOpen ? 'Hide' : 'Details'}
                      onClick={() => setOpenId(isOpen ? null : inv.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded breakdown */}
                  {isOpen && (
                    <div className="border-t border-border/40 pt-3 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="bg-muted/10 border border-border/50 rounded-xl p-4 space-y-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-bold text-foreground">{fmt(inv.subtotal)}</span>
                        </div>
                        {inv.gst_rate != null && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                            <span>GST ({Number(inv.gst_rate)}%){inv.gst_category ? ` — ${inv.gst_category}` : ''}</span>
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
                            <span className="font-bold">
                              {inv.type === 'purchase' ? '+' : '−'} {fmt(inv.admin_charge)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-border/60 pt-2 font-black text-sm">
                          <span className="text-foreground">Total</span>
                          <span className="text-foreground">{fmt(inv.total_amount)}</span>
                        </div>
                      </div>

                      {inv.admin_note && (
                        <div className="mt-3 bg-violet-500/5 border border-violet-500/15 rounded-xl p-3 text-xs">
                          <p className="text-[9px] font-bold text-violet-500 uppercase mb-1">Admin Note</p>
                          <p className="text-foreground">{inv.admin_note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
