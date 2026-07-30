import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  Banknote, TrendingUp, TrendingDown, BookOpen, ShoppingBag, Layers,
  Wallet, Megaphone, Building2, ShoppingCart, MoreHorizontal, Network, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const PERIODS = ['today', 'month', 'year', 'all'] as const;
type Period = typeof PERIODS[number];

function fmt(n: number | undefined | null) {
  return `₹${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const COMMISSION_LABELS: Record<string, string> = {
  dsi: 'Direct Selling Income', gen2: 'Generation L2', gen3: 'Generation L3',
  binary: 'Binary Matching', car_fund: 'Car Fund', house_fund: 'House Fund',
  royalty: 'Royalty', instructor_commission: 'Instructor Commission',
};

export default function AdminFinanceDashboard() {
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['accounts-overview', period],
    queryFn: () => api.accounts.overview(period),
    staleTime: 30_000,
  });

  const sales = data?.sales;
  const expenses = data?.expenses;
  const netProfit = data?.netProfit ?? 0;

  const salesCards = [
    { icon: BookOpen, label: 'Course Sales', value: sales?.courseSales, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { icon: ShoppingBag, label: 'Product Sales', value: sales?.productSales, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Layers, label: 'Package Sales', value: sales?.packageSales, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const expenseCards = [
    { icon: Wallet, label: 'Employee Salary', value: expenses?.salaryExpense, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: Megaphone, label: 'Marketing', value: expenses?.marketingExpense, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { icon: ShoppingCart, label: 'Purchases', value: expenses?.purchasesExpense, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { icon: Building2, label: 'Operational', value: expenses?.operationalExpense, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: Network, label: 'MLM Commission Paid', value: expenses?.commissionPaid, color: 'text-red-500', bg: 'bg-red-500/10' },
    { icon: MoreHorizontal, label: 'Other', value: expenses?.otherExpense, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  ];

  const commissionRows = Object.entries(expenses?.commissionBreakdown ?? {}).filter(([, v]) => (v as number) > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Banknote className="w-6 h-6 text-teal-500" />
            Finance Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Consolidated revenue, expenses, and profit — Super Admin only.</p>
        </div>
        <div className="flex bg-muted rounded-lg p-1 border border-border w-fit">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${period === p ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />Loading finance overview...
        </div>
      ) : (
        <>
          {/* Net Profit hero card */}
          <Card className={`border ${netProfit >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Profit ({period})</p>
                <p className={`text-3xl font-black font-mono mt-1 ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {fmt(netProfit)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Total Sales − Total Expenses (salary + marketing + purchases + operational + other + commission paid)</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                {netProfit >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-rose-500" />}
                <div className="text-right">
                  <p className="text-muted-foreground text-[10px] uppercase">Total Sales</p>
                  <p className="text-foreground font-mono">{fmt(sales?.totalSales)}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-muted-foreground text-[10px] uppercase">Total Expenses</p>
                  <p className="text-foreground font-mono">{fmt(expenses?.totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales */}
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Sales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {salesCards.map(c => (
                <Card key={c.label} className="border border-border bg-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${c.bg} shrink-0`}><c.icon className={`w-5 h-5 ${c.color}`} /></div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{c.label}</p>
                      <p className={`text-lg font-black font-mono ${c.color}`}>{fmt(c.value)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Expenses</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {expenseCards.map(c => (
                <Card key={c.label} className="border border-border bg-card">
                  <CardContent className="p-4 text-center">
                    <div className={`w-9 h-9 mx-auto rounded-xl ${c.bg} flex items-center justify-center mb-2`}><c.icon className={`w-4 h-4 ${c.color}`} /></div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{c.label}</p>
                    <p className={`text-sm font-black font-mono mt-0.5 ${c.color}`}>{fmt(c.value)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* MLM commission breakdown */}
          {commissionRows.length > 0 && (
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold">MLM Commission Paid — Breakdown</CardTitle>
                <CardDescription className="text-xs">By income type, for the selected period</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {commissionRows.map(([type, amount]) => (
                    <div key={type} className="bg-muted/10 border border-border/50 rounded-xl p-3 text-center">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{COMMISSION_LABELS[type] ?? type}</p>
                      <p className="text-sm font-black font-mono text-foreground mt-0.5">{fmt(amount as number)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
