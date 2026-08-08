import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { mockApiService } from '../services/mockApi';
import { ChartSkeleton, TableSkeleton } from './Skeletons';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Download, Search, ArrowUpRight, AlertCircle, 
  Wallet, History, CheckCircle2, ShieldAlert, BadgeHelp, ArrowRightLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function IncomeDashboard() {
  const {
    activeTab,
    setActiveTab,
    authToken,
    earningSummary,
    transactions: storeTransactions,
    withdrawalRequests: storeWithdrawalRequests,
    requestWithdrawal,
    kycRecord
  } = useAppStore();

  const qc = useQueryClient();

  // Filter ranges for charts
  const [chartRange, setChartRange] = useState<'7days' | '30days' | 'all'>('30days');

  // Commission History ledger filters
  const [textSearch, setTextSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  // Instructor sweeps log filters (separate state from commission history)
  const [sweepsSearch, setSweepsSearch] = useState('');
  const [sweepsCategory, setSweepsCategory] = useState('all');
  const [sweepsStatus, setSweepsStatus] = useState('all');

  // Withdrawal form inputs
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccountSelect, setBankAccountSelect] = useState('');
  const [withdrawalResult, setWithdrawalResult] = useState<{ success: boolean; message: string } | null>(null);

  // ── Real API queries ──────────────────────────────────────────────────────
  const { data: apiMe } = useQuery({
    queryKey: ['auth-me', authToken],
    queryFn: () => api.auth.me(),
    enabled: !!authToken,
    staleTime: 300_000,
  });

  // Bank details entered during KYC — kept in sync onto User.bank_* by routes/kyc.js as of
  // this fix, but fetched here too as a fallback for any KYC completed before that sync
  // existed (so those users don't have to redo the bank step just to withdraw).
  const { data: apiKyc } = useQuery({
    queryKey: ['my-kyc', authToken],
    queryFn: () => api.kyc.me(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: apiIncomeSummary } = useQuery({
    queryKey: ['mlm-income-summary', authToken],
    queryFn: () => api.mlm.incomeSummary(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: apiCommissions } = useQuery({
    queryKey: ['my-commissions', authToken],
    queryFn: () => api.mlm.commissions(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: apiWithdrawals = [] } = useQuery<any[]>({
    queryKey: ['my-withdrawals', authToken],
    queryFn: () => api.withdrawals.list(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: publicSettings } = useQuery<{ map: Record<string, string> }>({
    queryKey: ['public-settings'],
    queryFn: () => api.platformSettings.getPublic(),
    staleTime: 300_000,
  });
  // GST is NOT applied on withdrawals — only TDS (income tax) and the admin charge, matching
  // routes/withdrawals.js's computeDeductions (which always sets gst_amount to 0 for these).
  const liveRates = {
    tds:   (parseFloat(publicSettings?.map?.withdrawal_tds_rate   ?? '') || 10) / 100,
    admin: (parseFloat(publicSettings?.map?.withdrawal_admin_rate ?? '') || 2)  / 100,
  };
  const tdsLabel   = publicSettings?.map?.withdrawal_tds_rate   ?? '10';
  const adminLabel = publicSettings?.map?.withdrawal_admin_rate ?? '2';

  // MLM incentive rates — live from the admin-configured IncomeSource table (Incentives tab),
  // not the dead `mlm_*` PlatformSetting keys nothing ever writes.
  const { data: incomeSourcesList } = useQuery<any[]>({
    queryKey: ['income-sources-active'],
    queryFn: () => api.incomeSources.list(true),
    enabled: !!authToken,
    staleTime: 60_000,
  });
  const binarySrc = incomeSourcesList?.find(s => s.category === 'binary');
  const genSources = (incomeSourcesList ?? [])
    .filter(s => s.category === 'generational' && s.generation_level != null)
    .sort((a, b) => a.generation_level - b.generation_level);
  const carFundSrc = incomeSourcesList?.find(s => s.code === 'car_fund');
  const houseFundSrc = incomeSourcesList?.find(s => s.code === 'house_fund');

  const mlmBinaryRate  = String(binarySrc?.rate != null ? parseFloat(binarySrc.rate) : 12);
  const mlmDailyCap    = (binarySrc?.daily_cap != null ? parseFloat(binarySrc.daily_cap) : 10000).toLocaleString('en-IN');
  const carFundRatePct = carFundSrc?.rate != null ? parseFloat(carFundSrc.rate) : 5;
  const houseFundRatePct = houseFundSrc?.rate != null ? parseFloat(houseFundSrc.rate) : 10;
  // Generation-income label — scales automatically with however many levels admin configures (L2, L3, L4...)
  const generationLevelsLabel = genSources.length > 0
    ? genSources.map(s => `L${s.generation_level}`).join('+')
    : 'L2+L3';
  const generationRateLabel = genSources.length > 0
    ? genSources.map(s => `Level ${s.generation_level} (${s.rate != null ? parseFloat(s.rate) : 0}%)`).join(' + ')
    : 'Level 2 (5%) + Level 3 (2%)';

  // Withdrawal mutation via real API
  const withdrawalMutation = useMutation({
    mutationFn: (data: { amount: number; bank_account_no: string; bank_ifsc: string; bank_name: string; bank_holder: string }) =>
      api.withdrawals.request(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-withdrawals'] });
      qc.invalidateQueries({ queryKey: ['mlm-income-summary'] });
      setWithdrawAmount('');
      setWithdrawalResult({ success: true, message: 'Withdrawal request submitted successfully!' });
      setTimeout(() => setWithdrawalResult(null), 4000);
    },
    onError: (err: Error) => {
      setWithdrawalResult({ success: false, message: err.message });
      setTimeout(() => setWithdrawalResult(null), 4000);
    },
  });

  // Fetch earnings history for chart (mock fallback)
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['earningHistory', chartRange],
    queryFn: () => mockApiService.getEarningHistory(chartRange),
    enabled: !authToken,
  });

  // Derive transactions and withdrawals from real API or store
  const transactions = authToken && apiCommissions
    ? apiCommissions.map((c: any) => ({
        id: c.id,
        date: new Date(c.created_at).toLocaleDateString('en-IN'),
        description: c.description ?? c.type,
        category: c.type,
        amount: parseFloat(c.amount),
        status: c.status === 'paid' || c.status === 'approved' ? 'Success' : 'Pending',
      }))
    : storeTransactions;

  const withdrawalRequests = authToken && Array.isArray(apiWithdrawals) && apiWithdrawals.length > 0
    ? apiWithdrawals.map((w: any) => ({
        id: w.id,
        amount: parseFloat(w.amount),
        account: `${w.bank_name ?? ''} (...${(w.bank_account_no ?? '').slice(-4)})`,
        date: new Date(w.requested_at ?? w.created_at).toLocaleDateString('en-IN'),
        status: w.status === 'paid' ? 'Approved' : w.status === 'rejected' ? 'Rejected' : 'Pending',
        utr: w.utr_number ?? undefined,
      }))
    : storeWithdrawalRequests;

  // Build chart data from API commissions when available
  const apiChartData = authToken && apiCommissions
    ? apiCommissions.slice(-30).map((c: any) => ({
        date: new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        earnings: parseFloat(c.amount),
        referrals: 0,
      }))
    : null;

  // ── Effective earning values: real API > store fallback ───────────────────
  const effectiveSummary = authToken && apiIncomeSummary
    ? {
        total: apiIncomeSummary.lifetime,
        weekly: apiIncomeSummary.weekly,
        available: apiIncomeSummary.available,
        pending: apiIncomeSummary.pending,
        withdrawn: apiIncomeSummary.withdrawn,
      }
    : earningSummary;

  // Real bank details from logged-in user — prefers User.bank_* (kept in sync by routes/kyc.js
  // on every KYC save), falls back to the KYC record's own bank fields directly for any KYC
  // completed before that sync existed.
  const kycBank = apiKyc?.personal_data;
  const userBankAccount = apiMe?.bank_account_no ?? kycBank?.accountNumber ?? null;
  const userBankIfsc = apiMe?.bank_ifsc ?? kycBank?.ifsc ?? null;
  const userBankName = apiMe?.bank_name ?? kycBank?.bankName ?? null;
  const userBankHolder = apiMe?.bank_holder_name ?? kycBank?.accountHolder ?? null;
  const hasBankDetails = !!(userBankAccount && userBankIfsc && userBankName && userBankHolder);

  // Handle new withdrawal request
  const handleRequestWithdrawal = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return;

    if (authToken && hasBankDetails) {
      withdrawalMutation.mutate({
        amount: Number(withdrawAmount),
        bank_account_no: userBankAccount!,
        bank_ifsc: userBankIfsc!,
        bank_name: userBankName!,
        bank_holder: userBankHolder!,
      });
    } else if (authToken && !hasBankDetails) {
      setWithdrawalResult({ success: false, message: 'Please complete your KYC and add bank details before withdrawing.' });
      setTimeout(() => setWithdrawalResult(null), 4000);
    } else {
      const account = bankAccountSelect || `Bank Account (...${kycRecord.bank.accountNumber.slice(-4) || '2241'})`;
      const res = requestWithdrawal(Number(withdrawAmount), account);
      setWithdrawalResult(res);
      if (res.success) setWithdrawAmount('');
      setTimeout(() => setWithdrawalResult(null), 3500);
    }
  };

  // Export transaction ledger to CSV
  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return;
    const headers = ['Transaction ID', 'Date', 'Description', 'Category', 'Amount (INR)', 'Status'];
    const rows = transactions.map((tx: any) => [
      tx.id,
      tx.date,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.category,
      parseFloat(tx.amount).toFixed(2),
      tx.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'T2U_Transaction_History.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KYC verification: real API > store fallback
  const isKycVerified = authToken
    ? apiMe?.kyc_status === 'approved'
    : kycRecord.status === 'Verified';

  // Dynamic splits calculations for Student Earnings
  // Prefer real API income summary by type, fall back to transaction filtering
  const byType = authToken && apiIncomeSummary?.by_type;
  const studentReferralIncome = byType
    ? (byType.dsi ?? 0)
    : transactions.filter((t: any) => t.status === 'Success' && (t.category === 'dsi' || t.category === 'Referral')).reduce((s: number, t: any) => s + parseFloat(t.amount), 0);

  const studentBinaryIncome = byType
    ? (byType.binary ?? 0)
    : transactions.filter((t: any) => t.status === 'Success' && (t.category === 'binary' || (t.category === 'Referral' && t.description.toLowerCase().includes('matching')))).reduce((s: number, t: any) => s + parseFloat(t.amount), 0);

  const studentGenIncome = byType
    ? (apiIncomeSummary?.generational_total ?? ((byType.gen2 ?? 0) + (byType.gen3 ?? 0)))
    : transactions.filter((t: any) => t.status === 'Success' && (t.category === 'gen2' || t.category === 'gen3')).reduce((s: number, t: any) => s + parseFloat(t.amount), 0);

  const studentRewardIncome = byType
    ? (byType.royalty ?? 0)
    : transactions.filter((t: any) => t.status === 'Success' && (t.category === 'Reward' || t.category === 'Task Completion' || t.category === 'royalty')).reduce((s: number, t: any) => s + parseFloat(t.amount), 0);

  const studentAcademicIncome = byType
    ? ((byType.car_fund ?? 0) + (byType.house_fund ?? 0))
    : transactions.filter((t: any) => t.status === 'Success' && t.category === 'Course Bonus').reduce((s: number, t: any) => s + parseFloat(t.amount), 0);

  // Dynamic filtering of ledger history
  const filteredTxs = transactions.filter((tx) => {
    // Text search
    if (textSearch.trim() !== '') {
      const q = textSearch.toLowerCase().trim();
      const match = tx.id.toLowerCase().includes(q) || 
                    tx.description.toLowerCase().includes(q) ||
                    tx.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    // Category filter
    if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
    // Status filter
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    
    // Month/Year split (tx.date format: YYYY-MM-DD)
    const dateParts = tx.date.split('-');
    if (dateParts.length === 3) {
      const year = dateParts[0];
      const month = dateParts[1];
      
      if (yearFilter !== 'all' && year !== yearFilter) return false;
      if (monthFilter !== 'all' && month !== monthFilter) return false;
    }
    return true;
  });

  // Calculate success Category Summaries for the ledger
  const catReferralTotal = byType ? (byType.dsi ?? 0) : transactions.filter(t => t.status === 'Success' && t.category === 'Referral' && !t.description.toLowerCase().includes('matching')).reduce((sum, t) => sum + t.amount, 0);
  const catBinaryTotal = byType ? (byType.binary ?? 0) : transactions.filter(t => t.status === 'Success' && t.category === 'Referral' && t.description.toLowerCase().includes('matching')).reduce((sum, t) => sum + t.amount, 0);
  const catAcademicTotal = byType ? (apiIncomeSummary?.generational_total ?? ((byType.gen2 ?? 0) + (byType.gen3 ?? 0))) : transactions.filter(t => t.status === 'Success' && t.category === 'Course Bonus').reduce((sum, t) => sum + t.amount, 0);
  const catRewardTotal = byType ? ((byType.royalty ?? 0) + (byType.car_fund ?? 0) + (byType.house_fund ?? 0)) : transactions.filter(t => t.status === 'Success' && (t.category === 'Reward' || t.category === 'Task Completion')).reduce((sum, t) => sum + t.amount, 0);
  const catPayoutTotal = transactions.filter(t => t.status === 'Success' && t.category === 'Payout').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Instructor Calculations — real API takes precedence over hardcoded values
  const instructorReferralEarnings = byType
    ? (byType.dsi ?? 0)
    : transactions.filter(t => t.status === 'Success' && t.category === 'Referral' && !t.description.toLowerCase().includes('matching')).reduce((sum, t) => sum + t.amount, 0);
  const instructorWebinarEarnings = byType
    ? ((byType.royalty ?? 0))
    : 0;
  // Real, payable per-student commission from batches this instructor manages — separate from
  // the MLM-network figures above, which are this instructor's own earnings as a network member.
  const instructorCommissionEarnings = byType ? (byType.instructor_commission ?? 0) : 0;

  // ==========================================
  // VIEW: VAULT & OVERVIEW (income-dashboard)
  // ==========================================
  const renderVaultOverview = () => (
    <div className="space-y-6">
      
      {/* Student Earnings splits cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-600" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Earnings (INR)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
                ₹{effectiveSummary.total.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Cumulative DSI, binary match, generation & reward income</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Weekly Earnings (INR)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-indigo-500">
                ₹{effectiveSummary.weekly.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Volume settled in current weekly cycle</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Direct Sponsor Income (DSI)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-violet-400">
                ₹{studentReferralIncome.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Direct sponsor income from referred package purchases</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
              Binary Matching Income ({mlmBinaryRate}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-emerald-500">
                ₹{studentBinaryIncome.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{mlmBinaryRate}% matched BV payouts between left/right downlines</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-teal-500 uppercase tracking-wider">
              Generation Income ({generationLevelsLabel})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-teal-400">
                ₹{studentGenIncome.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{generationRateLabel} generation income</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-foreground" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-foreground">
                ₹{effectiveSummary.available.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2"> balance currently available for settlement cashouts</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-sky-500 uppercase tracking-wider">
              House Fund
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-sky-500">
                ₹{(byType?.house_fund ?? 0).toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{houseFundRatePct}% of BV generated — house fund accumulation</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
              Car Fund
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-orange-500">
                ₹{(byType?.car_fund ?? 0).toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{carFundRatePct}% of BV generated — car fund accumulation</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-pink-500 uppercase tracking-wider">
              Royalty Bonus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-pink-500">
                ₹{(byType?.royalty ?? 0).toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">2% company BV pool — distributed to qualified distributors monthly</p>
          </CardContent>
        </Card>
      </div>

      {/* Area chart mapping speed */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Earnings Area Velocity
            </CardTitle>
            <CardDescription className="text-xs">
              Continuous history representing team splits, chapter bonuses & referral sweeps.
            </CardDescription>
          </div>
          <div className="flex bg-muted rounded-lg p-1 border border-border">
            {(['7days', '30days', 'all'] as const).map((rng) => (
              <button
                key={rng}
                onClick={() => setChartRange(rng)}
                className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-md transition-all ${
                  chartRange === rng 
                    ? 'bg-card text-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {rng.toUpperCase()}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {chartLoading && !apiChartData ? (
            <ChartSkeleton />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={apiChartData ?? chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.06} stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    style={{ fontSize: '10px', fill: 'var(--color-muted-foreground)' }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    style={{ fontSize: '10px', fill: 'var(--color-muted-foreground)' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-card)', 
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: 'var(--color-foreground)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorEarnings)" 
                    name="Balance Sum (₹)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick navigation box */}
      <div className="flex gap-4">
        <Button onClick={() => setActiveTab('withdrawals')} className="bg-primary text-xs font-bold px-6 h-9">
          Request a Payout Withdrawal
        </Button>
        <Button onClick={() => setActiveTab('commission-history')} variant="outline" className="text-xs font-bold px-6 h-9 border-border">
          View Commission history
        </Button>
      </div>

    </div>
  );

  // ==========================================
  // VIEW: WITHDRAWAL REQUESTS (withdrawals)
  // ==========================================
  const renderWithdrawals = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left panel: Withdrawal Form (8cols) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Form Card */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-violet-500" />
              Request Withdrawal Transfer
            </CardTitle>
            <CardDescription className="text-xs">
              Transfer verified earnings from your available balance to bank settlement registry accounts.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            
            {/* KYC Compliance Status Warning */}
            {!isKycVerified ? (
              <div className="p-4 rounded-xl border border-rose-500/25 bg-rose-500/5 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-rose-500 block uppercase tracking-wider">
                    Payout withdrawal requests blocked
                  </span>
                  <p className="text-[11px] text-rose-400 font-sans leading-relaxed">
                    Under compliance regulations, users must hold a "Verified" KYC status to sweep balances. Your current status is: <strong>{kycRecord.status}</strong>.
                  </p>
                  <Button
                    onClick={() => setActiveTab('kyc')}
                    variant="link"
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold p-0 h-auto flex items-center gap-1.5"
                  >
                    Go to KYC verification forms
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="text-[11px] text-emerald-400 font-sans">
                  Compliance KYC status is <strong>Verified</strong>. Withdrawals are unlocked.
                </div>
              </div>
            )}

            {/* Request Form */}
            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5 text-left">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Withdraw Amount (INR)
                  </Label>
                  <Input
                    type="number"
                    min={100}
                    placeholder="Enter amount (e.g. ₹500)"
                    disabled={!isKycVerified}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="h-9 text-xs bg-muted/20 font-mono"
                  />
                  <span className="text-[9.5px] text-muted-foreground block">
                    Available balance: ₹{effectiveSummary.available.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5 text-left">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Bank Destination Details
                  </Label>
                  <select
                    disabled={!isKycVerified}
                    value={bankAccountSelect}
                    onChange={(e) => setBankAccountSelect(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden"
                  >
                    {userBankAccount ? (
                      <option value={userBankAccount}>
                        {userBankName ?? 'Bank'} — {userBankHolder ?? ''} (...{userBankAccount.slice(-4)})
                      </option>
                    ) : kycRecord.bank.bankName ? (
                      <option value="">
                        {kycRecord.bank.bankName} - {kycRecord.bank.accountHolder} (...{kycRecord.bank.accountNumber.slice(-4)})
                      </option>
                    ) : (
                      <option value="">Select bank details (No default profile linked)</option>
                    )}
                  </select>
                  <span className="text-[9.5px] text-muted-foreground block">
                    Settlements route through verified details.
                  </span>
                </div>
              </div>

              {/* Weekly limit notice */}
              {(() => {
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const recent = (Array.isArray(apiWithdrawals) ? apiWithdrawals : [])
                  .filter((r: any) => r.status !== 'rejected')
                  .find((r: any) => new Date(r.requested_at || r.created_at) >= oneWeekAgo);
                if (!recent) return null;
                const next = new Date(new Date(recent.requested_at || recent.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
                return (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-600 font-semibold">
                    Weekly limit reached — one request per 7 days. Next eligible:{' '}
                    <span className="font-bold">{next.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                );
              })()}

              {/* Charge breakdown */}
              {withdrawAmount && Number(withdrawAmount) > 0 && (() => {
                const gross = Number(withdrawAmount);
                const tds   = parseFloat((gross * liveRates.tds).toFixed(2));
                const admin = parseFloat((gross * liveRates.admin).toFixed(2));
                const net   = parseFloat((gross - tds - admin).toFixed(2));
                return (
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Applicable Deductions</span>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Gross Amount</span>
                        <strong className="text-foreground font-mono">₹{gross.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>TDS – {tdsLabel}% (Sec. 194H)</span>
                        <strong className="text-rose-400 font-mono">−₹{tds.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Platform Fee – {adminLabel}%</span>
                        <strong className="text-rose-400 font-mono">−₹{admin.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-border/50 font-bold">
                        <span className="text-foreground">Net to your bank</span>
                        <strong className="text-emerald-500 font-mono">₹{net.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {withdrawalResult && (
                <div className={`p-3 rounded-lg border text-center text-xs font-bold ${
                  withdrawalResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                }`}>
                  {withdrawalResult.message}
                </div>
              )}

              <Button
                id="btn-request-payout"
                type="submit"
                disabled={!isKycVerified || !withdrawAmount || Number(withdrawAmount) <= 0}
                className="w-full bg-primary text-xs font-bold h-9 shadow-md shadow-primary/10"
              >
                Submit Payout request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right panel: Withdrawal History list (4cols) */}
      <div className="lg:col-span-4 space-y-4">
        
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Withdrawals Registry
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 space-y-3 max-h-[400px] overflow-y-auto scrollbar-none">
            {withdrawalRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground select-none font-sans">
                No past withdrawals registered.
              </div>
            ) : (
              withdrawalRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-lg border border-border bg-muted/10 space-y-2 text-xs text-left">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-foreground">{req.id}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                      req.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[10.5px]">
                    <span>Amount:</span>
                    <strong className="text-foreground font-mono">₹{req.amount.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[9px]">
                    <span>Date: {req.date}</span>
                    <span className="truncate max-w-[150px]">{'account' in req ? req.account : req.bankAccount}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );

  // ==========================================
  // VIEW: COMMISSION HISTORY (commission-history)
  // ==========================================
  const renderCommissionHistory = () => (
    <Card className="border border-border bg-card shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-4">
        <div className="text-left">
          <CardTitle className="text-sm font-bold">Commission History Ledger</CardTitle>
          <CardDescription className="text-xs">
            Detailed listing of referral sweeps, binary BV matches, and chapter academics rewards.
          </CardDescription>
        </div>
        <Button 
          id="export-ledger-btn"
          onClick={handleExportCSV} 
          className="text-xs bg-secondary hover:bg-muted text-primary px-3.5 py-1.5 font-bold"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export CSV
        </Button>
      </CardHeader>
      
      {/* Filters bar */}
      <div className="p-4 bg-muted/20 border-b border-border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            id="ledger-search-input"
            type="text"
            placeholder="Search description or Tx ID..."
            value={textSearch}
            onChange={(e) => setTextSearch(e.target.value)}
            className="pl-9 h-8.5 text-xs bg-card"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8.5 px-3 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-hidden"
          >
            <option value="all">All Sectors</option>
            <option value="dsi">Direct Selling Income (DSI)</option>
            <option value="Referral">Referrals & Splits</option>
            <option value="gen2">Generation L2 ({genSources.find(s => s.generation_level === 2)?.rate ?? 5}%)</option>
            <option value="gen3">Generation L3 ({genSources.find(s => s.generation_level === 3)?.rate ?? 2}%)</option>
            <option value="binary">Binary Matching ({mlmBinaryRate}%)</option>
            <option value="royalty">Royalty / Milestone</option>
            <option value="car_fund">Car Fund</option>
            <option value="house_fund">House Fund</option>
            <option value="Course Bonus">Academic Incentive</option>
            <option value="Reward">Platform Rewards</option>
            <option value="Payout">Account Cashout</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8.5 px-3 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-hidden"
          >
            <option value="all">All States</option>
            <option value="Success">Success only</option>
            <option value="Pending">Pending review</option>
            <option value="Failed">Failed/Rejected</option>
          </select>

          {/* Monthly Filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="h-8.5 px-3 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-hidden"
          >
            <option value="all">All Months</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="h-8.5 px-3 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-hidden"
          >
            <option value="all">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* Category Summaries Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-muted/10 border-b border-border/40">
        <div className="bg-card border border-border p-3 rounded-xl text-center space-y-0.5">
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">DSI (Direct)</span>
          <span className="text-xs font-black font-mono text-violet-500">₹{catReferralTotal.toFixed(2)}</span>
        </div>
        <div className="bg-card border border-border p-3 rounded-xl text-center space-y-0.5">
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Binary Match ({mlmBinaryRate}%)</span>
          <span className="text-xs font-black font-mono text-emerald-500">₹{catBinaryTotal.toFixed(2)}</span>
        </div>
        <div className="bg-card border border-border p-3 rounded-xl text-center space-y-0.5">
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Generation ({generationLevelsLabel})</span>
          <span className="text-xs font-black font-mono text-teal-500">₹{catAcademicTotal.toFixed(2)}</span>
        </div>
        <div className="bg-card border border-border p-3 rounded-xl text-center space-y-0.5">
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Royalty & Funds</span>
          <span className="text-xs font-black font-mono text-amber-500">₹{catRewardTotal.toFixed(2)}</span>
        </div>
        <div className="bg-card border border-border p-3 rounded-xl text-center space-y-0.5">
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Total Withdrawals</span>
          <span className="text-xs font-black font-mono text-foreground">₹{catPayoutTotal.toFixed(2)}</span>
        </div>
      </div>

      <CardContent className="p-0">
        {filteredTxs.length === 0 ? (
          <div className="p-12 text-center space-y-2 select-none">
            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-foreground">No transactions match filters</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto font-sans">
              Clear your search queries or choose another calendar month.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold font-sans">
                  <th className="p-4">Tx ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Amount (INR)</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-foreground">{tx.id}</td>
                    <td className="p-4 text-muted-foreground font-mono">{tx.date}</td>
                    <td className="p-4 font-medium text-foreground text-left">{tx.description}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-primary font-bold text-[10px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold font-mono">
                      <span className={tx.amount > 0 ? 'text-emerald-500' : 'text-foreground'}>
                        {tx.amount > 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        tx.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' :
                        tx.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ==========================================
  // VIEW: INSTRUCTOR EARNINGS (instructor-earnings)
  // ==========================================
  const renderInstructorEarnings = () => (
    <div className="space-y-6">

      {/* Header Cards stats — same full earnings breakdown shown on the student Balance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-600" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Earnings (INR)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
                ₹{effectiveSummary.total.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Cumulative DSI, binary match, generation & reward income</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Weekly Earnings (INR)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-indigo-500">
                ₹{effectiveSummary.weekly.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Volume settled in current weekly cycle</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Direct Sponsor Income (DSI)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-violet-400">
                ₹{instructorReferralEarnings.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Direct sponsor income on referred student course purchases</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-cyan-500 uppercase tracking-wider">
              Batch Teaching Commission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-cyan-500">
                ₹{instructorCommissionEarnings.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Real payable commission + BV from batch-linked course enrollments you manage</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
              Binary Matching Income ({mlmBinaryRate}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-emerald-500">
                ₹{studentBinaryIncome.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{mlmBinaryRate}% matched BV payouts between left/right downlines</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-teal-500 uppercase tracking-wider">
              Generation Income ({generationLevelsLabel})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-teal-400">
                ₹{studentGenIncome.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{generationRateLabel} generation income</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-foreground" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-foreground">
                ₹{effectiveSummary.available.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2"> balance currently available for settlement cashouts</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-sky-500 uppercase tracking-wider">
              House Fund
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-sky-500">
                ₹{(byType?.house_fund ?? 0).toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{houseFundRatePct}% of BV generated towards house fund</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
              Car Fund
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-orange-500">
                ₹{(byType?.car_fund ?? 0).toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{carFundRatePct}% of BV generated towards car fund</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-pink-500 uppercase tracking-wider">
              Royalty Bonus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-pink-500">
                ₹{instructorWebinarEarnings.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">2% company BV pool — distributed to qualified distributors monthly</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Area Velocity chart — same as the student Balance Overview */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Earnings Area Velocity
            </CardTitle>
            <CardDescription className="text-xs">
              Continuous history representing team splits, chapter bonuses & referral sweeps.
            </CardDescription>
          </div>
          <div className="flex bg-muted rounded-lg p-1 border border-border">
            {(['7days', '30days', 'all'] as const).map((rng) => (
              <button
                key={rng}
                onClick={() => setChartRange(rng)}
                className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-md transition-all ${
                  chartRange === rng
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {rng.toUpperCase()}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {chartLoading && !apiChartData ? (
            <ChartSkeleton />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={apiChartData ?? chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarningsInstructor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.06} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: '10px', fill: 'var(--color-muted-foreground)' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: '10px', fill: 'var(--color-muted-foreground)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: 'var(--color-foreground)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorEarningsInstructor)"
                    name="Balance Sum (₹)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Incentive Program card */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            Referral Incentive Program
          </CardTitle>
          <CardDescription className="text-xs">
            Earnings structure for referring new members to the binary network.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Binary Team Match (1000 BV at {mlmBinaryRate}%):</span>
            <span className="font-bold text-emerald-500">+₹{(1000 * (Number(mlmBinaryRate) || 0) / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily Capping limit:</span>
            <span className="font-bold text-foreground">₹{Number(String(mlmDailyCap).replace(/,/g, '')).toLocaleString('en-IN')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Instructor Commission ledgers */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="text-left">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Instructor Royalties Sweeps
            </CardTitle>
            <CardDescription className="text-xs">
              Direct ledger sync with payout channels and content validation royalties.
            </CardDescription>
          </div>
        </CardHeader>

        {/* Search & Filter bar */}
        <div className="p-4 border-b border-border/40 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search description…"
              value={sweepsSearch}
              onChange={e => setSweepsSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
          <select
            title="Filter by category"
            value={sweepsCategory}
            onChange={e => setSweepsCategory(e.target.value)}
            className="h-8 text-xs rounded-md border border-border bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            <option value="dsi">DSI</option>
            <option value="gen2">Gen2</option>
            <option value="gen3">Gen3</option>
            <option value="binary">Binary</option>
            <option value="car_fund">Car Fund</option>
            <option value="house_fund">House Fund</option>
            <option value="royalty">Royalty</option>
          </select>
          <select
            title="Filter by status"
            value={sweepsStatus}
            onChange={e => setSweepsStatus(e.target.value)}
            className="h-8 text-xs rounded-md border border-border bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
          {(sweepsSearch || sweepsCategory !== 'all' || sweepsStatus !== 'all') && (
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs px-3"
              onClick={() => { setSweepsSearch(''); setSweepsCategory('all'); setSweepsStatus('all'); }}
            >
              Clear
            </Button>
          )}
        </div>

        <CardContent className="p-0">
          {(() => {
            const rows = (Array.isArray(apiCommissions) ? apiCommissions : []) as any[];
            const filtered = rows.filter((c: any) => {
              const desc = (c.description ?? c.type ?? '').toLowerCase();
              if (sweepsSearch && !desc.includes(sweepsSearch.toLowerCase())) return false;
              if (sweepsCategory !== 'all' && c.type !== sweepsCategory) return false;
              if (sweepsStatus !== 'all' && c.status !== sweepsStatus) return false;
              return true;
            });

            const categoryLabel: Record<string, string> = {
              dsi: 'DSI', gen2: 'Gen2', gen3: 'Gen3', binary: 'Binary',
              car_fund: 'Car Fund', house_fund: 'House Fund', royalty: 'Royalty',
            };
            const categoryColor: Record<string, string> = {
              dsi: 'bg-violet-500/10 text-violet-500',
              gen2: 'bg-indigo-500/10 text-indigo-500',
              gen3: 'bg-blue-500/10 text-blue-500',
              binary: 'bg-emerald-500/10 text-emerald-500',
              car_fund: 'bg-orange-500/10 text-orange-500',
              house_fund: 'bg-sky-500/10 text-sky-500',
              royalty: 'bg-pink-500/10 text-pink-500',
            };

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold font-sans">
                      <th className="p-4">Date</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filtered.length > 0 ? filtered.map((c: any) => (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-4 font-medium text-foreground max-w-xs truncate">
                          {c.description ?? categoryLabel[c.type] ?? c.type}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${categoryColor[c.type] ?? 'bg-muted text-muted-foreground'}`}>
                            {categoryLabel[c.type] ?? c.type}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold font-mono text-emerald-500">
                          +₹{parseFloat(c.amount).toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            c.status === 'paid'     ? 'bg-emerald-500/10 text-emerald-500' :
                            c.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                                                      'bg-amber-500/10 text-amber-500'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                          {rows.length === 0 ? 'No commission records found.' : 'No records match the current filters.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {filtered.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-border/40 text-[10px] text-muted-foreground flex justify-between">
                    <span>Showing {filtered.length} of {rows.length} entries</span>
                    <span className="font-bold text-emerald-500">
                      Total: ₹{filtered.reduce((s: number, c: any) => s + parseFloat(c.amount), 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

    </div>
  );

  // Router switcher mapping
  return (
    <div className="space-y-6">
      
      {/* Title greeting bar */}
      <div className="border-b border-border/40 pb-4 text-left">
        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          {activeTab === 'income-dashboard' && 'Balance overview'}
          {activeTab === 'withdrawals' && 'Payout Withdrawal Requests'}
          {activeTab === 'commission-history' && 'Commission split Ledger'}
          {activeTab === 'instructor-earnings' && 'Instructor Royalties Ledger'}
        </h2>
        <p className="text-xs text-muted-foreground font-sans mt-0.5 font-normal">
          {activeTab === 'income-dashboard' && 'Track available sums, pending sweeps, and total historical earnings.'}
          {activeTab === 'withdrawals' && 'Create bank transfer audits or track compliance queues.'}
          {activeTab === 'commission-history' && 'Audit direct downline commission shares and quizzes.'}
          {activeTab === 'instructor-earnings' && 'royalties matching course sales and hourly masterclass webinar fees.'}
        </p>
      </div>

      {activeTab === 'income-dashboard' && renderVaultOverview()}
      {activeTab === 'withdrawals' && renderWithdrawals()}
      {activeTab === 'commission-history' && renderCommissionHistory()}
      {activeTab === 'instructor-earnings' && renderInstructorEarnings()}

    </div>
  );
}
