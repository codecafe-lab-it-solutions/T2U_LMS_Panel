import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import { CheckCircle2, XCircle, Loader2, FileBarChart2, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PaginationFooter } from '@/components/ui/pagination-footer';
import { formatDate } from '../../utils/date';

const PAGE_LIMIT = 20;

const TDS_RATE          = 0.10;
const ADMIN_CHARGE_RATE = 0.02;
const GST_RATE          = 0.18;

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminWithdrawals() {
  const perm = useEmployeePermission('admin-withdrawals');
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [noteModal, setNoteModal] = useState<{ open: boolean; id: string; action: 'approve' | 'reject' }>({ open: false, id: '', action: 'approve' });
  const [note, setNote] = useState('');
  const [utr, setUtr] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');

  // Display labels map 1:1 to backend statuses — 'processing' is a legacy enum value never
  // actually set anywhere, so 'Pending' only ever needs to match 'pending'.
  const FILTER_TO_STATUS: Record<typeof filter, string | undefined> = {
    All: undefined, Pending: 'pending', Approved: 'paid', Rejected: 'rejected',
  };

  const { data: rawData = { requests: [], total: 0, summary: undefined }, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', filter, search, page],
    queryFn: () => api.withdrawals.listAdmin({ status: FILTER_TO_STATUS[filter], search: search.trim() || undefined, page, limit: PAGE_LIMIT }),
  });

  const { data: reportData, isLoading: reportLoading, refetch: fetchReport } = useQuery({
    queryKey: ['withdrawal-report', reportFrom, reportTo],
    queryFn: () => api.withdrawals.report(reportFrom || undefined, reportTo || undefined),
    enabled: false,
  });

  const mappedWithdrawals = (rawData.requests || []).map((w: any) => {
    let displayStatus: 'Pending' | 'Approved' | 'Rejected' = 'Pending';
    if (w.status === 'paid') displayStatus = 'Approved';
    if (w.status === 'rejected') displayStatus = 'Rejected';

    const gross = Number(w.amount);
    const tds   = Number(w.tds_amount)   || gross * TDS_RATE;
    const adm   = Number(w.admin_charge) || gross * ADMIN_CHARGE_RATE;
    const gst   = Number(w.gst_amount)   || adm * GST_RATE;
    const net   = Number(w.net_amount)   || gross - tds - adm - gst;

    return {
      id: w.id,
      userName: w.user?.full_name || 'Anonymous User',
      userId: w.user?.email || 'N/A',
      userAvatar: w.user?.profile_photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(w.user?.full_name || 'User')}`,
      gross, tds, admin: adm, gst, net,
      bankAccount: `${w.bank_name} · ${w.bank_holder || '—'} · A/C ${w.bank_account_no} · ${w.bank_ifsc}`,
      kycStatus: w.user?.kyc_status === 'approved' ? 'Verified' : 'Pending',
      date: w.requested_at ? formatDate(w.requested_at) : '—',
      status: displayStatus,
      utr: w.utr_number || '',
      notes: w.admin_note || '',
    };
  });

  // Filtering now happens server-side (FILTER_TO_STATUS → status query param), so the fetched
  // page already matches the active tab — no client-side re-filter needed.
  const filtered = mappedWithdrawals;
  const summary = rawData.summary;

  const approveMutation = useMutation({
    mutationFn: ({ id, utr_number, admin_note }: { id: string; utr_number: string; admin_note: string }) =>
      api.withdrawals.approve(id, { utr_number, admin_note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-withdrawals'] }); setNoteModal({ open: false, id: '', action: 'approve' }); setNote(''); setUtr(''); }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, admin_note }: { id: string; admin_note: string }) =>
      api.withdrawals.reject(id, { admin_note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-withdrawals'] }); setNoteModal({ open: false, id: '', action: 'approve' }); setNote(''); setUtr(''); }
  });

  const confirm = () => {
    if (noteModal.action === 'approve') approveMutation.mutate({ id: noteModal.id, utr_number: utr, admin_note: note });
    else rejectMutation.mutate({ id: noteModal.id, admin_note: note });
  };

  const statusStyle = (s: string) => {
    if (s === 'Approved') return 'text-emerald-400 bg-emerald-500/10';
    if (s === 'Rejected') return 'text-red-400 bg-red-500/10';
    return 'text-amber-400 bg-amber-500/10';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground">Withdrawal Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Process user withdrawal requests and view tax charge reports</p>
        </div>
        <Button size="sm" type="button" onClick={() => setShowReport(v => !v)}
          className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted flex items-center gap-1.5">
          <FileBarChart2 className="w-3.5 h-3.5" />{showReport ? 'Hide Report' : 'Tax & Charges Report'}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: summary?.pending_count ?? 0, sub: `${fmt(summary?.pending_gross ?? 0)} gross`, color: 'text-amber-400', border: 'border-amber-500/20 bg-amber-500/5' },
          { label: 'Approved', value: summary?.approved_count ?? 0, sub: `${fmt(summary?.approved_net ?? 0)} paid out`, color: 'text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/5' },
          { label: 'TDS Collected', value: fmt(summary?.approved_tds ?? 0), sub: 'from paid withdrawals', color: 'text-blue-400', border: 'border-blue-500/20 bg-blue-500/5' },
          { label: 'Govt Payable', value: fmt((summary?.approved_tds ?? 0) + (summary?.approved_gst ?? 0)), sub: 'TDS + GST to remit', color: 'text-violet-400', border: 'border-violet-500/20 bg-violet-500/5' },
        ].map(s => (
          <Card key={s.label} className={`border ${s.border}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-[9px] font-bold uppercase ${s.color}`}>{s.label}</p>
              <p className={`text-xl font-black font-mono ${s.color} mt-0.5`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tax & Charges Report */}
      {showReport && (
        <Card className="border border-violet-500/20 bg-violet-500/5">
          <CardHeader className="pb-3 border-b border-violet-500/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-violet-600">
              <FileBarChart2 className="w-4 h-4" />Tax & Charges Report (Paid Withdrawals)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">From Date</Label>
                <input type="date" title="Report from date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                  className="h-8 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">To Date</Label>
                <input type="date" title="Report to date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                  className="h-8 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none" />
              </div>
              <Button size="sm" type="button" onClick={() => fetchReport()}
                disabled={reportLoading}
                className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold">
                {reportLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}Generate
              </Button>
            </div>

            {reportData && (
              <>
                {/* Totals summary */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Gross Withdrawn', value: reportData.totals.gross, color: 'text-foreground' },
                    { label: 'TDS (10%)', value: reportData.totals.tds, color: 'text-red-500' },
                    { label: 'Admin Fee (2%)', value: reportData.totals.admin_charge, color: 'text-orange-500' },
                    { label: 'GST on Fee (18%)', value: reportData.totals.gst, color: 'text-red-500' },
                    { label: 'Net Paid Out', value: reportData.totals.net, color: 'text-emerald-500' },
                  ].map(c => (
                    <div key={c.label} className="p-3 bg-card border border-border rounded-xl text-center">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{c.label}</p>
                      <p className={`text-base font-black font-mono mt-0.5 ${c.color}`}>{fmt(c.value)}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-muted-foreground font-medium">
                  Government liability = TDS ({fmt(reportData.totals.tds)}) + GST ({fmt(reportData.totals.gst)}) = <span className="text-red-500 font-bold">{fmt(reportData.totals.tds + reportData.totals.gst)}</span> to remit
                </p>

                {/* Per-transaction breakdown */}
                {reportData.requests.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-border/50 rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/40">
                          {['Date', 'User', 'Gross', 'TDS (10%)', 'Admin (2%)', 'GST (18% of fee)', 'Net Paid'].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-[9px] font-bold text-muted-foreground uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.requests.map((r: any) => {
                          const g = Number(r.amount);
                          const t = Number(r.tds_amount);
                          const a = Number(r.admin_charge);
                          const gs = Number(r.gst_amount);
                          const n = Number(r.net_amount);
                          return (
                            <tr key={r.id} className="border-b border-border/20 hover:bg-muted/10">
                              <td className="px-3 py-2 font-mono text-muted-foreground text-[10px]">{r.processed_at ? r.processed_at.substring(0,10) : '—'}</td>
                              <td className="px-3 py-2">
                                <p className="font-bold">{r.user?.full_name || '—'}</p>
                                <p className="text-[9px] text-muted-foreground">{r.user?.email || ''}</p>
                              </td>
                              <td className="px-3 py-2 font-mono font-bold">{fmt(g)}</td>
                              <td className="px-3 py-2 font-mono text-red-500">{fmt(t)}</td>
                              <td className="px-3 py-2 font-mono text-orange-500">{fmt(a)}</td>
                              <td className="px-3 py-2 font-mono text-red-500">{fmt(gs)}</td>
                              <td className="px-3 py-2 font-mono text-emerald-500 font-bold">{fmt(n)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
            <button key={f} type="button" onClick={() => { setFilter(f); setPage(1); }}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${filter === f ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member, email, UTR, bank..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />Loading withdrawals…
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['User', 'Gross', 'TDS (10%)', 'Admin (2%)', 'GST', 'Net Paid', 'Bank', 'KYC', 'Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(w => (
                    <tr key={w.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <img src={w.userAvatar} alt={w.userName} className="w-7 h-7 rounded-full object-cover ring-1 ring-border shrink-0" />
                          <div>
                            <p className="font-bold text-foreground whitespace-nowrap">{w.userName}</p>
                            <p className="text-[9px] text-muted-foreground font-mono">{w.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-black text-foreground font-mono whitespace-nowrap">{fmt(w.gross)}</td>
                      <td className="px-3 py-3 font-mono text-red-500 whitespace-nowrap">{fmt(w.tds)}</td>
                      <td className="px-3 py-3 font-mono text-orange-500 whitespace-nowrap">{fmt(w.admin)}</td>
                      <td className="px-3 py-3 font-mono text-red-500 whitespace-nowrap">{fmt(w.gst)}</td>
                      <td className="px-3 py-3 font-mono text-emerald-500 font-bold whitespace-nowrap">{fmt(w.net)}</td>
                      <td className="px-3 py-3 text-muted-foreground text-[10px] max-w-[220px]">{w.bankAccount}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${w.kycStatus === 'Verified' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                          {w.kycStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground font-mono text-[10px] whitespace-nowrap">{w.date}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusStyle(w.status)}`}>{w.status}</span>
                        {w.utr && <p className="text-[9px] text-muted-foreground font-mono mt-0.5">UTR: {w.utr}</p>}
                      </td>
                      <td className="px-3 py-3">
                        {w.status === 'Pending' && perm.approve ? (
                          <div className="flex gap-1.5">
                            <Button size="sm" onClick={() => { setNoteModal({ open: true, id: w.id, action: 'approve' }); setNote(''); setUtr(''); }}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                              className="h-6 text-[9px] font-bold px-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                            </Button>
                            <Button size="sm" onClick={() => { setNoteModal({ open: true, id: w.id, action: 'reject' }); setNote(''); setUtr(''); }}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                              className="h-6 text-[9px] font-bold px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                              <XCircle className="w-3 h-3 mr-1" />Reject
                            </Button>
                          </div>
                        ) : <span className="text-[9px] text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={11} className="px-4 py-10 text-center text-xs text-muted-foreground">No withdrawal requests found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
        <PaginationFooter page={page} totalPages={Math.ceil((rawData.total ?? 0) / PAGE_LIMIT)} total={rawData.total ?? 0} onPageChange={setPage} label="withdrawal requests" />
      </Card>

      {/* Approve / Reject modal */}
      {noteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <Card className="max-w-sm w-full border border-border bg-card shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${noteModal.action === 'approve' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase flex items-center gap-1.5">
                {noteModal.action === 'approve'
                  ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" />Approve Withdrawal</>
                  : <><XCircle className="w-4 h-4 text-red-500" />Reject Withdrawal</>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {noteModal.action === 'approve' && (
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">UTR / Transaction Reference</Label>
                  <input value={utr} onChange={e => setUtr(e.target.value)} placeholder="e.g. HDFC2026062700001"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-mono text-foreground focus:outline-none" />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Admin Note (optional)</Label>
                <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for the user..."
                  className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setNoteModal({ open: false, id: '', action: 'approve' })} className="h-8 text-xs">Cancel</Button>
                <Button type="button" size="sm" onClick={confirm}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className={`h-8 text-xs font-bold text-white ${noteModal.action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  {approveMutation.isPending || rejectMutation.isPending ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
