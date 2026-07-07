import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { FileSpreadsheet, Loader2, AlertCircle, IndianRupee, Receipt, Landmark, Building2, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminTaxReport() {
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');
  const [queryKey, setQueryKey] = useState<[string, string]>(['', '']);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['admin-tax-report', queryKey[0], queryKey[1]],
    queryFn: () => api.withdrawals.report(queryKey[0] || undefined, queryKey[1] || undefined),
    enabled: true,
  });

  const totals = data?.totals ?? { gross: 0, tds: 0, admin_charge: 0, gst: 0, net: 0 };
  const requests: any[] = data?.requests ?? [];

  const govtLiability = totals.tds + totals.gst;

  function generate() {
    setQueryKey([from, to]);
  }

  function clearFilter() {
    setFrom('');
    setTo('');
    setQueryKey(['', '']);
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-rose-500" />
          Tax &amp; Charges Report
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          All deductions on paid withdrawals — TDS, GST, and platform fee. Use this to remit government dues.
        </p>
      </div>

      {/* Date range filter */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase block">From Date</label>
            <input
              type="date"
              title="Report from date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase block">To Date</label>
            <input
              type="date"
              title="Report to date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>
          <Button
            onClick={generate}
            disabled={isFetching}
            className="h-9 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold px-5"
          >
            {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
            Generate Report
          </Button>
          {(from || to) && (
            <Button variant="outline" onClick={clearFilter} className="h-9 text-xs px-4 border-border">
              Clear Filter
            </Button>
          )}
          <p className="text-[10px] text-muted-foreground self-end pb-1">
            {from || to
              ? `Showing paid withdrawals${from ? ` from ${from}` : ''}${to ? ` to ${to}` : ''}`
              : 'Showing all paid withdrawals'}
          </p>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <IndianRupee className="w-3 h-3" />Total Gross
            </p>
            <p className="text-xl font-extrabold text-foreground font-mono">{fmt(totals.gross)}</p>
            <p className="text-[9px] text-muted-foreground">Total requested</p>
          </CardContent>
        </Card>

        <Card className="border border-red-500/20 bg-card shadow-sm">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Receipt className="w-3 h-3 text-red-500" />TDS Collected
            </p>
            <p className="text-xl font-extrabold text-red-500 font-mono">{fmt(totals.tds)}</p>
            <p className="text-[9px] text-muted-foreground">→ Income Tax dept.</p>
          </CardContent>
        </Card>

        <Card className="border border-orange-500/20 bg-card shadow-sm">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-orange-500" />Platform Fee
            </p>
            <p className="text-xl font-extrabold text-orange-500 font-mono">{fmt(totals.admin_charge)}</p>
            <p className="text-[9px] text-muted-foreground">Retained by T2U</p>
          </CardContent>
        </Card>

        <Card className="border border-red-500/20 bg-card shadow-sm">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Landmark className="w-3 h-3 text-red-500" />GST Collected
            </p>
            <p className="text-xl font-extrabold text-red-500 font-mono">{fmt(totals.gst)}</p>
            <p className="text-[9px] text-muted-foreground">→ GST dept.</p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-500/20 bg-card shadow-sm">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-emerald-500" />Net Paid Out
            </p>
            <p className="text-xl font-extrabold text-emerald-500 font-mono">{fmt(totals.net)}</p>
            <p className="text-[9px] text-muted-foreground">Received by users</p>
          </CardContent>
        </Card>
      </div>

      {/* Government liability callout */}
      <Card className="border border-rose-500/30 bg-rose-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Landmark className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-500">Government Liability</p>
            <p className="text-xs text-rose-400 mt-0.5">
              TDS ({fmt(totals.tds)}) + GST ({fmt(totals.gst)}) ={' '}
              <span className="font-black text-rose-300 text-sm">{fmt(govtLiability)}</span>
              {' '}to be remitted to the government.
            </p>
            <p className="text-[10px] text-rose-400/70 mt-1">
              TDS → Income Tax dept. (Sec. 194H) &nbsp;|&nbsp; GST → GST dept. (on platform fee)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Per-transaction table */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-rose-500" />
            Transaction-level Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Every paid withdrawal with individual TDS, GST, and platform fee amounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isFetching ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading report…
            </div>
          ) : isError ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4" />Failed to load report. Try again.
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No paid withdrawals found{from || to ? ' in the selected date range.' : '.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Date', 'User', 'Email', 'Gross Amount', 'TDS (Govt)', 'Platform Fee', 'GST (Govt)', 'Net Paid', 'Govt Payable'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r: any) => {
                    const govtDue = Number(r.tds_amount || 0) + Number(r.gst_amount || 0);
                    return (
                      <tr key={r.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-mono text-muted-foreground text-[10px] whitespace-nowrap">
                          {r.processed_at ? new Date(r.processed_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                          {r.user?.full_name || 'Anonymous'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[10px] whitespace-nowrap">
                          {r.user?.email || '—'}
                        </td>
                        <td className="px-4 py-3 font-bold font-mono text-foreground whitespace-nowrap">
                          {fmt(Number(r.amount || 0))}
                        </td>
                        <td className="px-4 py-3 font-mono text-red-500 whitespace-nowrap">
                          {fmt(Number(r.tds_amount || 0))}
                        </td>
                        <td className="px-4 py-3 font-mono text-orange-500 whitespace-nowrap">
                          {fmt(Number(r.admin_charge || 0))}
                        </td>
                        <td className="px-4 py-3 font-mono text-red-500 whitespace-nowrap">
                          {fmt(Number(r.gst_amount || 0))}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-500 font-bold whitespace-nowrap">
                          {fmt(Number(r.net_amount || 0))}
                        </td>
                        <td className="px-4 py-3 font-mono text-rose-500 font-bold whitespace-nowrap">
                          {fmt(govtDue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border/60 bg-muted/20 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase">
                      Totals ({requests.length} transactions)
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">{fmt(totals.gross)}</td>
                    <td className="px-4 py-3 font-mono text-red-500">{fmt(totals.tds)}</td>
                    <td className="px-4 py-3 font-mono text-orange-500">{fmt(totals.admin_charge)}</td>
                    <td className="px-4 py-3 font-mono text-red-500">{fmt(totals.gst)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-500">{fmt(totals.net)}</td>
                    <td className="px-4 py-3 font-mono text-rose-500">{fmt(govtLiability)}</td>
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
