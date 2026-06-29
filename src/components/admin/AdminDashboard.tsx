import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../store/useAppStore';
import { api, getStoredToken } from '../../services/api';
import {
  Users, TrendingUp, BookOpen, CreditCard, GitBranch, Shield, Video, ArrowRight,
  CheckCircle2, Clock, AlertCircle, DollarSign, Loader2, GraduationCap, Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function fmt(n: number) {
  return n.toLocaleString('en-IN');
}
function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function AdminDashboard() {
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const token = getStoredToken();

  const { data: overview, isLoading: loadingOverview } = useQuery<any>({
    queryKey: ['admin-overview'],
    queryFn: () => api.reports.overview(),
    enabled: !!token,
    staleTime: 30_000,
  });

  const { data: activity = [], isLoading: loadingActivity } = useQuery<any[]>({
    queryKey: ['admin-activity'],
    queryFn: () => api.reports.activity(),
    enabled: !!token,
    staleTime: 30_000,
  });

  const o = overview ?? {};
  const pendingWithdrawals = o.withdrawals?.pending ?? 0;
  const pendingKyc = o.kyc?.pending ?? 0;
  const pendingSubmissions = o.pendingSubmissions ?? 0;

  const kpiCards = [
    {
      icon: Users,
      label: 'Total Users',
      value: o.totalUsers != null ? fmt(o.totalUsers) : '—',
      sub: o.totalStudents != null ? `${fmt(o.totalStudents)} students · ${fmt(o.totalInstructors ?? 0)} instructors` : undefined,
      color: 'text-blue-400', bg: 'bg-blue-500/10',
      tab: 'admin-users' as const,
    },
    {
      icon: TrendingUp,
      label: 'Commissions MTD',
      value: o.commissions?.revenueMTD != null ? fmtINR(o.commissions.revenueMTD) : '—',
      sub: o.commissions?.paidTotal != null ? `${fmtINR(o.commissions.paidTotal)} all-time paid` : undefined,
      color: 'text-green-400', bg: 'bg-green-500/10',
      tab: 'admin-mlm' as const,
    },
    {
      icon: BookOpen,
      label: 'Active Enrollments',
      value: o.totalEnrollments != null ? fmt(o.totalEnrollments) : '—',
      sub: o.totalCourses != null ? `across ${fmt(o.totalCourses)} courses` : undefined,
      color: 'text-purple-400', bg: 'bg-purple-500/10',
      tab: 'admin-courses' as const,
    },
    {
      icon: GitBranch,
      label: 'BV in Circulation',
      value: o.bvCirculation != null ? fmt(Math.round(o.bvCirculation)) : '—',
      sub: undefined,
      color: 'text-amber-400', bg: 'bg-amber-500/10',
      tab: 'admin-mlm' as const,
    },
    {
      icon: CreditCard,
      label: 'Pending Withdrawals',
      value: o.withdrawals?.pending != null ? fmt(pendingWithdrawals) : '—',
      sub: o.withdrawals?.pendingAmount != null ? `${fmtINR(o.withdrawals.pendingAmount)} pending` : undefined,
      color: 'text-red-400', bg: 'bg-red-500/10',
      tab: 'admin-withdrawals' as const,
    },
    {
      icon: Shield,
      label: 'Pending KYC',
      value: o.kyc?.pending != null ? fmt(pendingKyc) : '—',
      sub: o.kyc?.approved != null ? `${fmt(o.kyc.approved)} approved` : undefined,
      color: 'text-orange-400', bg: 'bg-orange-500/10',
      tab: 'admin-kyc' as const,
    },
    {
      icon: Video,
      label: 'Live Classes Today',
      value: o.liveClassesToday != null ? fmt(o.liveClassesToday) : '—',
      sub: undefined,
      color: 'text-emerald-400', bg: 'bg-emerald-500/10',
      tab: 'admin-live-classes' as const,
    },
    {
      icon: DollarSign,
      label: 'Commissions Paid',
      value: o.commissions?.paidTotal != null ? fmtINR(o.commissions.paidTotal) : '—',
      sub: o.commissions?.paidMTD != null ? `${fmtINR(o.commissions.paidMTD)} this month` : undefined,
      color: 'text-cyan-400', bg: 'bg-cyan-500/10',
      tab: 'admin-mlm' as const,
    },
  ];

  const quickActions = [
    {
      label: 'Review KYC',
      tab: 'admin-kyc' as const,
      count: pendingKyc,
      color: 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60',
      icon: Shield,
      iconColor: 'text-orange-400',
    },
    {
      label: 'Process Withdrawals',
      tab: 'admin-withdrawals' as const,
      count: pendingWithdrawals,
      color: 'border-red-500/30 bg-red-500/5 hover:border-red-500/60',
      icon: CreditCard,
      iconColor: 'text-red-400',
    },
    {
      label: 'Grade Assignments',
      tab: 'admin-assignments' as const,
      count: pendingSubmissions,
      color: 'border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60',
      icon: CheckCircle2,
      iconColor: 'text-violet-400',
    },
  ];

  const typeColor = (t: string) => {
    if (t === 'withdrawal') return 'bg-red-500/15 text-red-400';
    if (t === 'kyc') return 'bg-orange-500/15 text-orange-400';
    if (t === 'assignment') return 'bg-violet-500/15 text-violet-400';
    if (t === 'user') return 'bg-blue-500/15 text-blue-400';
    if (t === 'enrollment') return 'bg-emerald-500/15 text-emerald-400';
    return 'bg-green-500/15 text-green-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Admin Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Full platform overview — T2Upgrade Pvt. Ltd.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setActiveTab(c.tab)}
            className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                {loadingOverview
                  ? <Loader2 className={`h-4 w-4 ${c.color} animate-spin`} />
                  : <c.icon className={`h-5 w-5 ${c.color}`} />}
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-[10px] font-bold uppercase truncate">{c.label}</p>
                <p className={`font-black text-xl ${c.color} font-mono leading-none mt-0.5`}>{c.value}</p>
                {c.sub && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{c.sub}</p>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => setActiveTab(a.tab)}
            className={`p-4 rounded-xl border ${a.color} text-left flex items-center justify-between transition-all`}
          >
            <div className="flex items-center gap-3">
              <a.icon className={`w-5 h-5 ${a.iconColor} shrink-0`} />
              <div>
                <p className="font-semibold text-foreground text-sm">{a.label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {loadingOverview ? '...' : `${a.count} pending`}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Platform Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingActivity ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-xs">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading activity…
            </div>
          ) : activity.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No recent activity.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {activity.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${typeColor(item.type)}`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-foreground flex-1 min-w-0 truncate">{item.text}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">{item.relative}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform health row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'System Status',
            value: 'Operational',
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Pending Reviews',
            value: loadingOverview ? '…' : `${pendingKyc + pendingWithdrawals} items`,
            icon: AlertCircle,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Active Instructors',
            value: loadingOverview ? '…' : fmt(o.totalInstructors ?? 0),
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Active Batches',
            value: loadingOverview ? '…' : fmt(o.activeBatches ?? 0),
            icon: Layers,
            color: 'text-violet-500',
            bg: 'bg-violet-500/10',
          },
        ].map(s => (
          <Card key={s.label} className="border border-border bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">{s.label}</p>
                <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
