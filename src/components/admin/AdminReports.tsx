import { useAppStore } from '../../store/useAppStore';
import { TrendingUp, Users, BookOpen, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BAR_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

function MiniBar({ label, value, max, colorIdx = 0 }: { label: string; value: number; max: number; colorIdx?: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 text-[10px] text-muted-foreground truncate shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
        <div className={`h-full rounded-full ${BAR_COLORS[colorIdx % BAR_COLORS.length]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right font-mono font-bold text-foreground text-[10px]">{value.toLocaleString()}</span>
    </div>
  );
}

// Sparkline using SVG
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

const MONTHLY_REVENUE = [12000, 18500, 22000, 19000, 27000, 31000, 28000, 34000, 41000, 38000, 45000, 52000];
const MONTHLY_USERS = [50, 85, 120, 160, 210, 270, 340, 420, 510, 610, 720, 850];
const MONTHLY_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminReports() {
  const { registeredUsers, courses, adminWithdrawalQueue, networkNodes } = useAppStore();

  const totalRevenue = MONTHLY_REVENUE.reduce((a, b) => a + b, 0);
  const totalApprovedWd = adminWithdrawalQueue.filter(w => w.status === 'Approved').reduce((s, w) => s + w.amount, 0);
  const netRevenue = totalRevenue - totalApprovedWd;
  const avgMonthly = Math.round(totalRevenue / 12);

  const courseEnrollMap: Record<string, number> = { 'C101': 84, 'C102': 61, 'C103': 43, 'C104': 29 };
  const topCourses = courses.slice(0, 4).map((c, i) => ({ name: c.title, enrollments: courseEnrollMap[c.id] || (30 - i * 5) }));
  const maxEnroll = Math.max(...topCourses.map(c => c.enrollments));

  const roleBreakdown = [
    { label: 'Students', value: registeredUsers.filter(u => !u.role.toLowerCase().includes('instructor') && !u.role.toLowerCase().includes('admin')).length },
    { label: 'Instructors', value: registeredUsers.filter(u => u.role.toLowerCase().includes('instructor')).length },
    { label: 'Admins', value: registeredUsers.filter(u => u.role.toLowerCase().includes('admin')).length },
  ];
  const maxRole = Math.max(...roleBreakdown.map(r => r.value));

  const kpis = [
    { label: 'Total Revenue', value: `₹${(totalRevenue / 1000).toFixed(0)}K`, sub: 'All time gross', icon: DollarSign, color: 'text-emerald-400', sparkValues: MONTHLY_REVENUE, sparkColor: '#34d399' },
    { label: 'Net Revenue', value: `₹${(netRevenue / 1000).toFixed(0)}K`, sub: 'After withdrawals', icon: TrendingUp, color: 'text-blue-400', sparkValues: MONTHLY_REVENUE.map((v, i) => v - (i % 3 === 0 ? 2000 : 500)), sparkColor: '#60a5fa' },
    { label: 'Registered Users', value: String(registeredUsers.length + (networkNodes?.length ?? 0)), sub: '+12% this month', icon: Users, color: 'text-violet-400', sparkValues: MONTHLY_USERS, sparkColor: '#a78bfa' },
    { label: 'Total Courses', value: String(courses.length), sub: `${topCourses.reduce((s, c) => s + c.enrollments, 0)} enrollments`, icon: BookOpen, color: 'text-amber-400', sparkValues: [2, 3, 4, 5, 6, 6, 7, 8, 8, 9, 9, courses.length], sparkColor: '#fbbf24' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Reports & Analytics</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Platform performance overview — revenue, users, and course metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="border border-border bg-card overflow-hidden relative">
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

      {/* Revenue trend + User growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />Monthly Revenue (₹)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-2">
              {MONTHLY_REVENUE.map((v, i) => (
                <MiniBar key={MONTHLY_LABELS[i]} label={MONTHLY_LABELS[i]} value={v} max={Math.max(...MONTHLY_REVENUE)} colorIdx={0} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex justify-between text-xs">
              <span className="text-muted-foreground">Total</span>
              <span className="font-black text-emerald-400 font-mono">₹{totalRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />User Growth (Cumulative)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-2">
              {MONTHLY_USERS.map((v, i) => (
                <MiniBar key={MONTHLY_LABELS[i]} label={MONTHLY_LABELS[i]} value={v} max={Math.max(...MONTHLY_USERS)} colorIdx={3} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex justify-between text-xs">
              <span className="text-muted-foreground">Current Total</span>
              <span className="font-black text-violet-400 font-mono">{MONTHLY_USERS[MONTHLY_USERS.length - 1]}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance + Role Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />Top Courses by Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {topCourses.map((c, i) => (
              <MiniBar key={c.name} label={c.name} value={c.enrollments} max={maxEnroll} colorIdx={i + 2} />
            ))}
            <div className="mt-3 pt-3 border-t border-border/40 flex justify-between text-xs">
              <span className="text-muted-foreground">Avg Monthly</span>
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
              {[
                { label: 'Withdrawal Success Rate', value: `${adminWithdrawalQueue.length ? Math.round((adminWithdrawalQueue.filter(w => w.status === 'Approved').length / adminWithdrawalQueue.length) * 100) : 0}%`, color: 'text-emerald-400' },
                { label: 'Avg Course Completion', value: '68%', color: 'text-blue-400' },
                { label: 'KYC Verification Rate', value: '74%', color: 'text-violet-400' },
                { label: 'Network (MLM) Active Ratio', value: `${networkNodes?.length ? Math.round((networkNodes.filter(n => n.status === 'IN').length / networkNodes.length) * 100) : 0}%`, color: 'text-amber-400' },
              ].map(m => (
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
