import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Loader2, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getStoredToken } from '../../services/api';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const STATUS_ICONS: Record<string, React.FC<{ className?: string }>> = {
  pending: Clock,
  processing: Clock,
  paid: CheckCircle2,
  rejected: XCircle,
};

export default function InstructorWithdrawal() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [formError, setFormError] = useState('');

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ['instructor-withdrawals'],
    queryFn: () => api.withdrawals.list(),
    enabled: !!getStoredToken(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.withdrawals.request>[0]) =>
      api.withdrawals.request(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructor-withdrawals'] });
      setShowForm(false);
      setAmount('');
      setBankAccountNo('');
      setBankIfsc('');
      setBankName('');
      setBankHolder('');
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit request.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
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

  const pending = requests.filter(r => r.status === 'pending' || r.status === 'processing');
  const paid = requests.filter(r => r.status === 'paid');
  const totalPaid = paid.reduce((s: number, r: any) => s + (r.amount || 0), 0);

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
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Paid</p>
            <p className="text-2xl font-extrabold text-emerald-500 font-mono">₹{totalPaid.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

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
          <Button size="sm" onClick={() => setShowForm(true)}
            className="h-8 text-xs bg-primary text-white font-bold flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />New Request
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading requests…
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
              <Button size="sm" onClick={() => setShowForm(true)} className="h-8 text-xs bg-primary text-white font-bold">
                <Plus className="w-3.5 h-3.5 mr-1" />Submit First Request
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Date', 'Amount', 'Bank', 'Account No.', 'UTR / Notes', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r: any) => {
                    const StatusIcon = STATUS_ICONS[r.status] ?? Clock;
                    return (
                      <tr key={r.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-mono text-muted-foreground text-[10px]">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold font-mono text-foreground">
                          ₹{(r.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[10px]">
                          <div>{r.bank_name || '—'}</div>
                          <div className="text-[9px] opacity-70">{r.bank_ifsc || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-[10px]">
                          {r.bank_account_no || '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[10px]">
                          {r.utr_number || r.notes || '—'}
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
