import { useAppStore } from '../../store/useAppStore';
import {
  Users, TrendingUp, BookOpen, CreditCard, GitBranch, Shield, Video, ArrowRight,
  CheckCircle2, Clock, AlertCircle, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const { setActiveTab, adminWithdrawalQueue, networkNodes, assignments, courses } = useAppStore();

  const pendingWithdrawals = adminWithdrawalQueue.filter(w => w.status === 'Pending').length;
  const pendingKyc = 3; // mock
  const totalUsers = (networkNodes?.length ?? 0) + 12;
  const totalBV = (networkNodes ?? []).reduce((s, n) => s + n.bv, 0);
  const activeEnrollments = courses.length * 18;

  const kpiCards = [
    { icon: Users, label: 'Total Users', value: totalUsers, color: 'text-blue-400', bg: 'bg-blue-500/10', tab: 'admin-users' as const },
    { icon: TrendingUp, label: 'Revenue MTD', value: '₹2,84,500', color: 'text-green-400', bg: 'bg-green-500/10', tab: 'admin-reports' as const },
    { icon: BookOpen, label: 'Active Enrollments', value: activeEnrollments, color: 'text-purple-400', bg: 'bg-purple-500/10', tab: 'admin-courses' as const },
    { icon: GitBranch, label: 'BV in Circulation', value: totalBV.toLocaleString(), color: 'text-amber-400', bg: 'bg-amber-500/10', tab: 'admin-mlm' as const },
    { icon: CreditCard, label: 'Pending Withdrawals', value: pendingWithdrawals, color: 'text-red-400', bg: 'bg-red-500/10', tab: 'admin-withdrawals' as const },
    { icon: Shield, label: 'Pending KYC', value: pendingKyc, color: 'text-orange-400', bg: 'bg-orange-500/10', tab: 'admin-kyc' as const },
    { icon: Video, label: 'Live Classes Today', value: 2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', tab: 'admin-live-classes' as const },
    { icon: DollarSign, label: 'Commissions Paid', value: '₹48,200', color: 'text-cyan-400', bg: 'bg-cyan-500/10', tab: 'admin-mlm' as const },
  ];

  const quickActions = [
    { label: 'Review KYC', tab: 'admin-kyc' as const, count: pendingKyc, color: 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60', icon: Shield, iconColor: 'text-orange-400' },
    { label: 'Process Withdrawals', tab: 'admin-withdrawals' as const, count: pendingWithdrawals, color: 'border-red-500/30 bg-red-500/5 hover:border-red-500/60', icon: CreditCard, iconColor: 'text-red-400' },
    { label: 'Grade Assignments', tab: 'admin-assignments' as const, count: assignments.filter(a => a.status === 'Submitted').length, color: 'border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60', icon: CheckCircle2, iconColor: 'text-violet-400' },
  ];

  const recentActivity = [
    { text: 'New withdrawal request ₹5,000 — Aarya Garg', time: '2 min ago', type: 'withdrawal' },
    { text: 'KYC submitted — Rohan Mehra (Aadhaar + PAN)', time: '15 min ago', type: 'kyc' },
    { text: 'Assignment submitted — Smart Contract Audit', time: '1 hr ago', type: 'assignment' },
    { text: 'New user registered — Sneha Krishnan', time: '3 hr ago', type: 'user' },
    { text: 'Commission paid — Binary match ₹1,200', time: '5 hr ago', type: 'commission' },
  ];

  const typeColor = (t: string) => {
    if (t === 'withdrawal') return 'bg-red-500/15 text-red-400';
    if (t === 'kyc') return 'bg-orange-500/15 text-orange-400';
    if (t === 'assignment') return 'bg-violet-500/15 text-violet-400';
    if (t === 'user') return 'bg-blue-500/15 text-blue-400';
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
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-[10px] font-bold uppercase truncate">{c.label}</p>
                <p className={`font-black text-xl ${c.color} font-mono leading-none mt-0.5`}>{c.value}</p>
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
                <p className="text-muted-foreground text-xs mt-0.5">{a.count} pending</p>
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
          <div className="divide-y divide-border/40">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${typeColor(item.type)}`}>{item.type}</span>
                <span className="text-xs text-foreground flex-1">{item.text}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform health row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'System Status', value: 'Operational', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Pending Reviews', value: `${pendingKyc + pendingWithdrawals} items`, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Active Instructors', value: '6 online', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
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
