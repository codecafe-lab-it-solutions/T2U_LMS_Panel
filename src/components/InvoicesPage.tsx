import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { exportCsv } from '../utils/exportCsv';
import { openPrintableDocument } from '../utils/printDocument';
import { buildInvoiceHtml } from '../utils/invoiceDocument';
import { Receipt, Loader2, ChevronDown, ChevronUp, FileText, Download, FileDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const TYPE_TABS = ['all', 'purchase', 'withdrawal'] as const;
type TypeFilter = typeof TYPE_TABS[number];

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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ invoices: any[]; total: number }>({
    queryKey: ['my-invoices', typeFilter],
    queryFn: () => api.invoices.my({ type: typeFilter === 'all' ? undefined : typeFilter, limit: 100 }),
    staleTime: 60_000,
  });

  const invoices = data?.invoices ?? [];

  const handleExportCsv = () => {
    exportCsv(
      `my-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Invoice #', 'Type', 'Status', 'Description', 'Subtotal', 'GST Rate', 'GST Amount', 'TDS Rate', 'TDS Amount', 'Admin Charge', 'Total', 'Date'],
      invoices.map((inv: any) => [
        inv.invoice_number, inv.type, inv.status, inv.description ?? '', Number(inv.subtotal ?? 0),
        inv.gst_rate ?? '', inv.gst_amount ?? '', inv.tds_rate ?? '', inv.tds_amount ?? '',
        inv.admin_charge ?? '', Number(inv.total_amount ?? 0), new Date(inv.created_at).toLocaleDateString('en-IN'),
      ])
    );
  };

  const handleDownloadInvoice = (inv: any) => {
    openPrintableDocument(buildInvoiceHtml(inv, { name: userProfile.name, email: userProfile.email }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-border/40 pb-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-violet-500" /> My Invoices
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">View all invoices generated for your purchases and withdrawals.</p>
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

      {/* Type filter */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 max-w-xs">
        {TYPE_TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${typeFilter === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No invoices yet</p>
          <p className="text-xs mt-1">Invoices are generated automatically for purchases and withdrawals.</p>
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
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{inv.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {inv.workflow_stage && <span className="ml-2 font-bold">[{inv.workflow_stage}]</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black font-mono text-foreground">{fmt(inv.total_amount)}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <button
                      type="button"
                      title="Download invoice"
                      onClick={() => handleDownloadInvoice(inv)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-violet-600 shrink-0"
                    >
                      <Download className="w-4 h-4" />
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
