import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Loader2, Plus, Clock, CheckCircle2, XCircle, AlertCircle, CalendarClock, Filter, RotateCcw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getStoredToken } from '../../services/api';
import { useFilterParams } from '../../hooks/useFilterParams';
import { useDebounce } from '../../hooks/useDebounce';

// GST is NOT applied on withdrawals — only TDS (income tax) and the admin charge, matching
// routes/withdrawals.js's computeDeductions (which always sets gst_amount to 0 for these).
function calcCharges(gross: number, rates: { tds: number; admin: number }) {
  const tds   = parseFloat((gross * rates.tds).toFixed(2));
  const admin = parseFloat((gross * rates.admin).toFixed(2));
  const net   = parseFloat((gross - tds - admin).toFixed(2));
  return { tds, admin, net };
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function weeklyLimitInfo(requests: any[]): { blocked: boolean; nextEligible: Date | null } {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = requests
    .filter(r => r.status !== 'rejected')
    .find(r => new Date(r.requested_at || r.created_at) >= oneWeekAgo);
  if (!recent) return { blocked: false, nextEligible: null };
  const next = new Date(new Date(recent.requested_at || recent.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
  return { blocked: true, nextEligible: next };
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-500/10 text-amber-500 border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paid:       'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  rejected:   'bg-red-500/10 text-red-500 border-red-500/20',
};
const STATUS_ICONS: Record<string, React.FC<{ className?: string }>> = {
  pending: Clock, processing: Clock, paid: CheckCircle2, rejected: XCircle,
};

const DEFAULT_WITHDRAWAL_FILTERS = {
  status: '',
  source: '',
  from: '',
  to: '',
  search: '',
};

export default function InstructorWithdrawal() {
  const qc = useQueryClient();
  const { params: filterParams, setFilterParams, resetFilterParams } = useFilterParams(DEFAULT_WITHDRAWAL_FILTERS);

  const [statusFilter, setStatusFilter] = useState(filterParams.status || '');
  const [sourceFilter, setSourceFilter] = useState(filterParams.source || '');
  const [dateFrom, setDateFrom] = useState(filterParams.from || '');
  const [dateTo, setDateTo] = useState(filterParams.to || '');
  const [searchInput, setSearchInput] = useState(filterParams.search || '');

  const debouncedSearch = useDebounce(searchInput, 300);

  const updateFilters = (newValues: Partial<typeof DEFAULT_WITHDRAWAL_FILTERS>) => {
    setFilterParams(prev => ({ ...prev, ...newValues }));
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setSourceFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchInput('');
    resetFilterParams();
  };

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [formError, setFormError] = useState('');

  const { data: rawRequests = [], isLoading } = useQuery<any[]>({
    queryKey: ['instructor-withdrawals'],
    queryFn: () => api.withdrawals.list(),
    enabled: !!getStoredToken(),
  });

  // Client-side filtering across settlement status, date range, course source, and search
  const requests = rawRequests.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (sourceFilter) {
      const matchSource = (r.notes || r.admin_note || r.bank_name || '').toLowerCase().includes(sourceFilter.toLowerCase());
      if (!matchSource) return false;
    }
    if (dateFrom) {
      const reqDate = new Date(r.requested_at || r.created_at);
      if (reqDate < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const reqDate = new Date(r.requested_at || r.created_at);
      const toDateObj = new Date(dateTo);
      toDateObj.setHours(23, 59, 59, 999);
      if (reqDate > toDateObj) return false;
    }
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      const match =
        (r.bank_name || '').toLowerCase().includes(s) ||
        (r.utr_number || '').toLowerCase().includes(s) ||
        (r.admin_note || '').toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  const { data: publicSettings } = useQuery<{ map: Record<string, string> }>({
    queryKey: ['public-settings'],
    queryFn: () => api.platformSettings.getPublic(),
    staleTime: 300_000,
  });

  const liveRates = {
    tds:   (parseFloat(publicSettings?.map?.withdrawal_tds_rate   ?? '') || 10) / 100,
    admin: (parseFloat(publicSettings?.map?.withdrawal_admin_rate ?? '') || 2)  / 100,
  };
  const tdsLabel   = `${publicSettings?.map?.withdrawal_tds_rate   ?? '10'}%`;
  const adminLabel = `${publicSettings?.map?.withdrawal_admin_rate ?? '2'}%`;

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.withdrawals.request>[0]) =>
      api.withdrawals.request(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructor-withdrawals'] });
      setShowForm(false);
      setAmount(''); setBankAccountNo(''); setBankIfsc(''); setBankName(''); setBankHolder('');
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit request.');
    },
  });

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setFormError('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setFormError('Enter a valid amount.'); return; }
    if (!bankAccountNo.trim()) { setFormError('Bank account number is required.'); return; }
    if (!bankIfsc.trim()) { setFormError('IFSC code is required.'); return; }
    if (!bankName.trim()) { setFormError('Bank name is required.'); return; }
    if (!bankHolder.trim()) { setFormError('Account holder name is required.'); return; }
    createMutation.mutate({
      amount: amt,
      bank_account_no: bankAccountNo.trim(),
      bank_ifsc: bankIfsc.trim().toUpperCase(),
      bank_name: bankName.trim(),
      bank_holder: bankHolder.trim(),
    });
  };

  const pending  = requests.filter(r => r.status === 'pending' || r.status === 'processing');
  const paid     = requests.filter(r => r.status === 'paid');
  const totalPaid = paid.reduce((s: number, r: any) => s + Number(r.net_amount || r.amount || 0), 0);
  const { blocked, nextEligible } = weeklyLimitInfo(requests);

  const gross = parseFloat(amount) || 0;
  const { tds, admin, net } = calcCharges(gross, liveRates);

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-extrabold text-foreground font-mono">{requests.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Pending / Processing</p>
            <p className="text-2xl font-extrabold text-amber-500 font-mono">{pending.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Net Paid</p>
            <p className="text-2xl font-extrabold text-emerald-500 font-mono">{fmt(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly limit banner */}
      {blocked && nextEligible && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <CalendarClock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-500">Weekly withdrawal limit reached</p>
            <p className="text-[11px] text-amber-500/80 mt-0.5">
              You can submit one withdrawal request per week. Next eligible date:{' '}
              <span className="font-bold">{nextEligible.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </p>
          </div>
        </div>
      )}

      {/* Requests list */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-primary" />
              My Withdrawal Requests
            </CardTitle>
            <CardDescription className="text-xs">Submit and track your earnings withdrawal requests</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)} disabled={blocked}
            title={blocked ? 'Weekly limit reached' : undefined}
            className="h-8 text-xs bg-primary text-white font-bold flex items-center gap-1 disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" />New Request
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters Bar */}
          <div className="p-3 border-b border-border/40 bg-muted/10 flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              title="Settlement Status"
              className="bg-muted/20 border border-border rounded-lg text-foreground px-2.5 h-8 text-xs font-semibold"
              value={statusFilter}
              onChange={e => {
                const val = e.target.value;
                setStatusFilter(val);
                updateFilters({ status: val });
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Course Source */}
            <select
              title="Course Source"
              className="bg-muted/20 border border-border rounded-lg text-foreground px-2.5 h-8 text-xs font-semibold"
              value={sourceFilter}
              onChange={e => {
                const val = e.target.value;
                setSourceFilter(val);
                updateFilters({ source: val });
              }}
            >
              <option value="">All Earnings Sources</option>
              <option value="direct">Direct Referral</option>
              <option value="level">Level Commission</option>
              <option value="batch">Batch Instruction</option>
              <option value="milestone">Milestone Reward</option>
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 bg-muted/20 border border-border rounded-lg px-2 h-8 text-xs">
              <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
              <Input
                type="date"
                title="Date From"
                value={dateFrom}
                onChange={e => {
                  const val = e.target.value;
                  setDateFrom(val);
                  updateFilters({ from: val });
                }}
                className="h-6 text-xs w-32 border-0 bg-transparent p-0"
              />
              <span className="text-muted-foreground text-xs">–</span>
              <Input
                type="date"
                title="Date To"
                value={dateTo}
                onChange={e => {
                  const val = e.target.value;
                  setDateTo(val);
                  updateFilters({ to: val });
                }}
                className="h-6 text-xs w-32 border-0 bg-transparent p-0"
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[160px]">
              <Input
                placeholder="Search UTR, bank, notes..."
                value={searchInput}
                onChange={e => {
                  const val = e.target.value;
                  setSearchInput(val);
                  updateFilters({ search: val });
                }}
                className="h-8 text-xs bg-muted/20"
              />
            </div>

            {/* Reset Filters */}
            {(statusFilter || sourceFilter || dateFrom || dateTo || searchInput) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1 px-2.5"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading requests…
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-bold text-foreground">No withdrawal requests found matching your filters</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try adjusting your settlement status, date range, or source filters.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 text-xs font-semibold"
                >
                  Reset All Filters
                </Button>
                <Button size="sm" onClick={() => setShowForm(true)} disabled={blocked} className="h-8 text-xs bg-primary text-white font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" />Submit Request
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Date', 'Gross', `TDS (${tdsLabel})`, `Admin (${adminLabel})`, 'Net Received', 'Bank', 'UTR / Notes', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r: any) => {
                    const StatusIcon = STATUS_ICONS[r.status] ?? Clock;
                    const g  = Number(r.amount || 0);
                    const td = Number(r.tds_amount)   || parseFloat((g * liveRates.tds).toFixed(2));
                    const ad = Number(r.admin_charge) || parseFloat((g * liveRates.admin).toFixed(2));
                    const nt = Number(r.net_amount)   || parseFloat((g - td - ad).toFixed(2));
                    return (
                      <tr key={r.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-mono text-muted-foreground text-[10px] whitespace-nowrap">
                          {r.requested_at ? new Date(r.requested_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold font-mono text-foreground whitespace-nowrap">{fmt(g)}</td>
                        <td className="px-4 py-3 font-mono text-red-500 whitespace-nowrap">{fmt(td)}</td>
                        <td className="px-4 py-3 font-mono text-orange-500 whitespace-nowrap">{fmt(ad)}</td>
                        <td className="px-4 py-3 font-mono text-emerald-500 font-bold whitespace-nowrap">{fmt(nt)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-[10px]">
                          <div>{r.bank_name || '—'}</div>
                          <div className="text-[9px] opacity-70">{r.bank_ifsc || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[10px]">
                          {r.utr_number || r.admin_note || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${STATUS_STYLES[r.status] ?? 'bg-muted/20 text-muted-foreground border-border'}`}>
                            <StatusIcon className="w-3 h-3" />
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New request modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase text-foreground text-left flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-primary" />New Withdrawal Request
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Amount (₹) *</Label>
                  <Input type="number" min="1" step="1" required placeholder="e.g. 5000"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    className="h-9 text-xs bg-muted/20 font-mono" />
                </div>

                {/* Live charge breakdown */}
                {gross > 0 && (
                  <div className="p-3 rounded-xl border border-amber-500/25 bg-amber-500/5 space-y-1.5 text-[11px]">
                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">Applicable Deductions</p>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Gross Amount</span>
                      <span className="font-mono font-bold text-foreground">{fmt(gross)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>TDS – {tdsLabel} (Sec. 194H)</span>
                      <span className="font-mono text-red-500">−{fmt(tds)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Platform Fee – {adminLabel}</span>
                      <span className="font-mono text-orange-500">−{fmt(admin)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-1.5 font-bold">
                      <span className="text-foreground">Net to your bank</span>
                      <span className="font-mono text-emerald-500">{fmt(net)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Bank Name *</Label>
                    <Input required placeholder="e.g. SBI, HDFC"
                      value={bankName} onChange={e => setBankName(e.target.value)}
                      className="h-9 text-xs bg-muted/20" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">IFSC Code *</Label>
                    <Input required placeholder="e.g. SBIN0001234"
                      value={bankIfsc} onChange={e => setBankIfsc(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Account Holder Name *</Label>
                  <Input required placeholder="Name as per bank records"
                    value={bankHolder} onChange={e => setBankHolder(e.target.value)}
                    className="h-9 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Account Number *</Label>
                  <Input required placeholder="Enter your bank account number"
                    value={bankAccountNo} onChange={e => setBankAccountNo(e.target.value)}
                    className="h-9 text-xs bg-muted/20 font-mono" />
                </div>
                {formError && (
                  <p className="text-xs text-red-500 font-semibold">{formError}</p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setFormError(''); }}
                    className="text-xs font-semibold h-9 border-border">Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}
                    className="bg-primary text-xs font-bold px-6 h-9 text-white">
                    {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
