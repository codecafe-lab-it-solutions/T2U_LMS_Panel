import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  TrendingUp, Users, BookOpen, DollarSign, Activity,
  Receipt, FileSpreadsheet, BarChart3, Loader2, Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ReportTab = 'overview' | 'gst' | 'tds';

const BAR_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

function MiniBar({ label, value, max, colorIdx = 0 }: { label: string; value: number; max: number; colorIdx?: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-28 text-[10px] text-muted-foreground truncate shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
        <div className={`h-full rounded-full ${BAR_COLORS[colorIdx % BAR_COLORS.length]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-14 text-right font-mono font-bold text-foreground text-[10px]">{value.toLocaleString()}</span>
    </div>
  );
}

function Sparkline({ values, color = '#8b5cf6' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 120, h = 32;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fmt(v: any) {
  const n = Number(v ?? 0);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const GST_CATEGORIES = [
  { value: '',            label: 'All Categories' },
  { value: 'education',  label: 'Education / Courses (Exempt / 0%)' },
  { value: 'goods_5',    label: 'Goods — 5% GST' },
  { value: 'goods_12',   label: 'Goods — 12% GST' },
  { value: 'goods_18',   label: 'Goods — 18% GST' },
  { value: 'goods_28',   label: 'Goods — 28% GST' },
  { value: 'services_18',label: 'Services — 18% GST' },
];

// ── Overview Tab ─────────────────────────────────────────────────────────────
function pct(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function OverviewTab() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['reports-overview'],
    queryFn: api.reports.overview,
    staleTime: 60_000,
  });
  const { data: growth, isLoading: growthLoading } = useQuery({
    queryKey: ['reports-growth'],
    queryFn: api.reports.growth,
    staleTime: 60_000,
  });
  const { data: topCourses = [], isLoading: topCoursesLoading } = useQuery({
    queryKey: ['reports-top-courses'],
    queryFn: api.reports.topCourses,
    staleTime: 60_000,
  });
  const { data: finance, isLoading: financeLoading } = useQuery({
    queryKey: ['accounts-overview-all'],
    queryFn: () => api.accounts.overview('all'),
    staleTime: 60_000,
  });

  if (overviewLoading || growthLoading || topCoursesLoading || financeLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }
  if (!overview || !growth || !finance) {
    return <div className="text-center py-16 text-sm text-muted-foreground">Could not load report data.</div>;
  }

  const monthlyRevenue = growth.revenue;
  const monthlyLabels  = growth.labels;

  // Running total across the 12-month window (starts at 0 — this is 12-month growth, not
  // lifetime signups; lifetime total is the "Registered Users" KPI above).
  let running = 0;
  const cumulativeUsers = growth.users.map(v => (running += v));

  const topCoursesForChart = topCourses.slice(0, 4).map(c => ({ name: c.title, enrollments: c.enrollments }));
  const maxEnroll = Math.max(1, ...topCoursesForChart.map(c => c.enrollments));

  const admins = Math.max(0, overview.totalUsers - overview.totalStudents - overview.totalInstructors);
  const roleBreakdown = [
    { label: 'Students',    value: overview.totalStudents },
    { label: 'Instructors', value: overview.totalInstructors },
    { label: 'Admins',      value: admins },
  ];
  const maxRole = Math.max(1, ...roleBreakdown.map(r => r.value));

  const kpis = [
    { label: 'Total Revenue', value: `₹${(finance.sales.totalSales / 1000).toFixed(0)}K`, sub: 'Course + product + package sales', icon: DollarSign, color: 'text-emerald-400', sparkValues: monthlyRevenue, sparkColor: '#34d399' },
    { label: 'Net Profit',    value: `₹${(finance.netProfit / 1000).toFixed(0)}K`, sub: 'Sales minus all expenses', icon: TrendingUp, color: 'text-blue-400', sparkValues: monthlyRevenue, sparkColor: '#60a5fa' },
    { label: 'Registered Users', value: String(overview.totalUsers), sub: `${overview.totalStudents} students, ${overview.totalInstructors} instructors`, icon: Users, color: 'text-violet-400', sparkValues: cumulativeUsers, sparkColor: '#a78bfa' },
    { label: 'Total Courses', value: String(overview.totalCourses), sub: `${overview.totalEnrollments} enrollments`, icon: BookOpen, color: 'text-amber-400', sparkValues: growth.enrollments, sparkColor: '#fbbf24' },
  ];

  const totalRevenue12mo = monthlyRevenue.reduce((a, b) => a + b, 0);
  const avgMonthly = Math.round(totalRevenue12mo / 12);

  const activityMetrics = [
    { label: 'KYC Verification Rate',   value: `${pct(overview.kyc.approved, overview.kyc.approved + overview.kyc.pending)}%`, color: 'text-violet-400' },
    { label: 'Withdrawals Paid Rate',   value: `${pct(overview.withdrawals.paid, overview.withdrawals.paid + overview.withdrawals.pending)}%`, color: 'text-emerald-400' },
    { label: 'Avg Course Completion',   value: `${pct(overview.completedEnrollments, overview.totalEnrollments)}%`, color: 'text-blue-400' },
    { label: 'Pending Instructor Approvals', value: String(overview.pendingInstructorApprovals), color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="border border-border bg-card overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{k.label}</p>
                  <p className={`text-2xl font-black font-mono ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
                </div>
                <k.icon className={`w-5 h-5 ${k.color} opacity-60 shrink-0`} />
              </div>
              <Sparkline values={k.sparkValues} color={k.sparkColor} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />Monthly Revenue (₹) — last 12 months
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-2">
              {monthlyRevenue.map((v, i) => (
                <MiniBar key={monthlyLabels[i]} label={monthlyLabels[i]} value={v} max={Math.max(1, ...monthlyRevenue)} colorIdx={0} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex justify-between text-xs">
              <span className="text-muted-foreground">Total (12mo)</span>
              <span className="font-black text-emerald-400 font-mono">₹{totalRevenue12mo.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />New User Signups (Cumulative, 12mo)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-2">
              {cumulativeUsers.map((v, i) => (
                <MiniBar key={monthlyLabels[i]} label={monthlyLabels[i]} value={v} max={Math.max(1, ...cumulativeUsers)} colorIdx={3} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex justify-between text-xs">
              <span className="text-muted-foreground">New in last 12mo</span>
              <span className="font-black text-violet-400 font-mono">{cumulativeUsers[cumulativeUsers.length - 1] ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />Top Courses by Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {topCoursesForChart.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No enrollments yet.</p>
            ) : (
              topCoursesForChart.map((c, i) => (
                <MiniBar key={c.name} label={c.name} value={c.enrollments} max={maxEnroll} colorIdx={i + 2} />
              ))
            )}
            <div className="mt-3 pt-3 border-t border-border/40 flex justify-between text-xs">
              <span className="text-muted-foreground">Avg Monthly Revenue (12mo)</span>
              <span className="font-black text-amber-400 font-mono">₹{avgMonthly.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />Platform Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">User Role Breakdown</p>
              <div className="space-y-2">
                {roleBreakdown.map((r, i) => (
                  <MiniBar key={r.label} label={r.label} value={r.value} max={maxRole} colorIdx={i} />
                ))}
              </div>
            </div>
            <div className="border-t border-border/40 pt-4 space-y-2">
              {activityMetrics.map(m => (
                <div key={m.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[10px]">{m.label}</span>
                  <span className={`font-black font-mono ${m.color}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── GST Report Tab ────────────────────────────────────────────────────────────
function GSTReportTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [catFilter, setCatFilter] = useState('');

  const { data: summary = [], isLoading } = useQuery<any[]>({
    queryKey: ['gst-summary', dateFrom, dateTo],
    queryFn: () => api.invoices.gstSummary({ from: dateFrom || undefined, to: dateTo || undefined }),
    staleTime: 60_000,
  });

  const filtered = catFilter ? summary.filter(r => r.category === catFilter) : summary;
  const grandTotal   = filtered.reduce((s, r) => s + Number(r.total_amount), 0);
  const grandGst     = filtered.reduce((s, r) => s + Number(r.gst_amount),   0);
  const grandBase    = filtered.reduce((s, r) => s + Number(r.subtotal),     0);
  const grandTxn     = filtered.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        GST is applied on <span className="font-bold text-foreground">purchases only</span> (products &amp; courses).
        Withdrawals do not attract GST — see the TDS tab for deductions on payouts.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase">From</label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase">To</label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Filter className="w-3 h-3" /> Category</label>
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="h-8 text-xs border border-border rounded-lg bg-muted/20 px-2 text-foreground min-w-[200px]"
          >
            {GST_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Txns',   value: grandTxn,   fmt: (v: number) => String(v), color: 'text-foreground' },
          { label: 'Base Amount',  value: grandBase,  fmt,               color: 'text-blue-400' },
          { label: 'GST Collected',value: grandGst,   fmt,               color: 'text-emerald-400' },
          { label: 'Invoice Total',value: grandTotal, fmt,               color: 'text-violet-400' },
        ].map(s => (
          <Card key={s.label} className="border border-border bg-card">
            <CardContent className="p-3 text-center">
              <p className={`text-lg font-black font-mono ${s.color}`}>{s.fmt(s.value)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-bold">No GST data for this period.</p>
          <p className="text-xs">Purchase invoices with GST will appear here.</p>
        </div>
      ) : (
        <Card className="border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[10px]">Category</th>
                  <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[10px]">GST Rate</th>
                  <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[10px]">Transactions</th>
                  <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[10px]">Base Amount</th>
                  <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[10px]">GST Amount</th>
                  <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[10px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-medium text-foreground capitalize">{row.category.replace(/_/g, ' ')}</td>
                    <td className="p-3 text-right font-mono text-amber-500 font-bold">{Number(row.gst_rate)}%</td>
                    <td className="p-3 text-right font-mono text-foreground">{row.count}</td>
                    <td className="p-3 text-right font-mono text-foreground">{fmt(row.subtotal)}</td>
                    <td className="p-3 text-right font-mono text-emerald-500 font-bold">{fmt(row.gst_amount)}</td>
                    <td className="p-3 text-right font-mono text-foreground font-bold">{fmt(row.total_amount)}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-muted/20 border-t-2 border-border">
                  <td className="p-3 font-black text-foreground uppercase text-[11px]" colSpan={2}>Grand Total</td>
                  <td className="p-3 text-right font-black font-mono">{grandTxn}</td>
                  <td className="p-3 text-right font-black font-mono">{fmt(grandBase)}</td>
                  <td className="p-3 text-right font-black font-mono text-emerald-500">{fmt(grandGst)}</td>
                  <td className="p-3 text-right font-black font-mono text-violet-500">{fmt(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── TDS Report Tab ─────────────────────────────────────────────────────────────
function TDSReportTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [openId,   setOpenId]   = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ invoices: any[]; totals: any }>({
    queryKey: ['tds-summary', dateFrom, dateTo],
    queryFn: () => api.invoices.tdsSummary({ from: dateFrom || undefined, to: dateTo || undefined }),
    staleTime: 60_000,
  });

  const invoices = data?.invoices ?? [];
  const totals   = data?.totals   ?? {};

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        TDS is deducted on <span className="font-bold text-foreground">withdrawals, salary payouts, and PF contributions</span> only.
        Purchases attract GST — see the GST tab for purchase tax.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase">From</label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase">To</label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Withdrawal Txns',   value: invoices.length,        fmt: (v: number) => String(v), color: 'text-foreground' },
          { label: 'Gross Withdrawals', value: Number(totals.subtotal ?? 0), fmt, color: 'text-blue-400' },
          { label: 'TDS Deducted',      value: Number(totals.tds_amount ?? 0), fmt, color: 'text-rose-500' },
          { label: 'Net Paid Out',      value: Number(totals.total_amount ?? 0), fmt, color: 'text-emerald-400' },
        ].map(s => (
          <Card key={s.label} className="border border-border bg-card">
            <CardContent className="p-3 text-center">
              <p className={`text-lg font-black font-mono ${s.color}`}>{s.fmt(s.value)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-bold">No TDS records for this period.</p>
          <p className="text-xs">Withdrawal invoices with TDS deduction will appear here.</p>
        </div>
      ) : (
        <Card className="border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[10px]">Invoice #</th>
                  <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[10px]">User</th>
                  <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[10px]">Gross</th>
                  <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[10px]">TDS Rate</th>
                  <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[10px]">TDS Amt</th>
                  <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[10px]">Admin Ch.</th>
                  <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[10px]">Net Paid</th>
                  <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[10px]">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-mono text-foreground font-bold">{inv.invoice_number}</td>
                    <td className="p-3">
                      <p className="font-bold text-foreground truncate max-w-[120px]">{inv.user?.full_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{inv.user?.email}</p>
                    </td>
                    <td className="p-3 text-right font-mono">{fmt(inv.subtotal)}</td>
                    <td className="p-3 text-right font-mono text-rose-500 font-bold">{Number(inv.tds_rate ?? 0)}%</td>
                    <td className="p-3 text-right font-mono text-rose-500 font-bold">{fmt(inv.tds_amount)}</td>
                    <td className="p-3 text-right font-mono text-amber-500">{fmt(inv.admin_charge)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-500">{fmt(inv.total_amount)}</td>
                    <td className="p-3 text-muted-foreground text-[10px]">
                      {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  const TABS: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview',   icon: BarChart3 },
    { id: 'gst',      label: 'GST Report', icon: FileSpreadsheet },
    { id: 'tds',      label: 'TDS Report', icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Reports & Analytics</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Platform performance — revenue, tax compliance, and transaction analytics</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 max-w-sm">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'gst'      && <GSTReportTab />}
      {activeTab === 'tds'      && <TDSReportTab />}
    </div>
  );
}
