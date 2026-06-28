import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function AdminWithdrawals() {
  const { adminWithdrawalQueue, approveWithdrawal, rejectWithdrawal } = useAppStore();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [noteModal, setNoteModal] = useState<{ open: boolean; id: string; action: 'approve' | 'reject' }>({ open: false, id: '', action: 'approve' });
  const [note, setNote] = useState('');
  const [utr, setUtr] = useState('');

  const filtered = filter === 'All' ? adminWithdrawalQueue : adminWithdrawalQueue.filter(w => w.status === filter);
  const pending = adminWithdrawalQueue.filter(w => w.status === 'Pending');
  const totalPending = pending.reduce((s, w) => s + w.amount, 0);

  const confirm = () => {
    if (noteModal.action === 'approve') approveWithdrawal(noteModal.id, note || `Processed. UTR: ${utr || 'N/A'}`);
    else rejectWithdrawal(noteModal.id, note);
    setNoteModal({ open: false, id: '', action: 'approve' });
    setNote(''); setUtr('');
  };

  const statusStyle = (s: string) => {
    if (s === 'Approved') return 'text-emerald-400 bg-emerald-500/10';
    if (s === 'Rejected') return 'text-red-400 bg-red-500/10';
    return 'text-amber-400 bg-amber-500/10';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Withdrawal Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Process and approve user withdrawal requests</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: pending.length, sub: `₹${totalPending.toFixed(0)} total`, color: 'text-amber-400', border: 'border-amber-500/20 bg-amber-500/5' },
          { label: 'Approved', value: adminWithdrawalQueue.filter(w => w.status === 'Approved').length, sub: 'processed', color: 'text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/5' },
          { label: 'Rejected', value: adminWithdrawalQueue.filter(w => w.status === 'Rejected').length, sub: 'declined', color: 'text-red-400', border: 'border-red-500/20 bg-red-500/5' },
        ].map(s => (
          <Card key={s.label} className={`border ${s.border}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-[9px] font-bold uppercase ${s.color}`}>{s.label}</p>
              <p className={`text-3xl font-black font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${filter === f ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted'}`}>
            {f}
          </button>
        ))}
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  {['User', 'Amount', 'Bank Account', 'KYC', 'Date', 'Status', 'Notes', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={w.userAvatar} alt={w.userName} className="w-7 h-7 rounded-full object-cover ring-1 ring-border shrink-0" />
                        <div>
                          <p className="font-bold text-foreground">{w.userName}</p>
                          <p className="text-[9px] text-muted-foreground font-mono">{w.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-black text-foreground font-mono">₹{w.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-[11px] max-w-[120px] truncate">{w.bankAccount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${w.kycStatus === 'Verified' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                        {w.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[10px]">{w.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusStyle(w.status)}`}>{w.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground max-w-[100px] truncate">{w.notes || '—'}</td>
                    <td className="px-4 py-3">
                      {w.status === 'Pending' ? (
                        <div className="flex gap-1.5">
                          <Button size="sm" onClick={() => { setNoteModal({ open: true, id: w.id, action: 'approve' }); setNote(''); setUtr(''); }}
                            className="h-6 text-[9px] font-bold px-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                          </Button>
                          <Button size="sm" onClick={() => { setNoteModal({ open: true, id: w.id, action: 'reject' }); setNote(''); setUtr(''); }}
                            className="h-6 text-[9px] font-bold px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                            <XCircle className="w-3 h-3 mr-1" />Reject
                          </Button>
                        </div>
                      ) : <span className="text-[9px] text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-xs text-muted-foreground">No withdrawal requests found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
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
                  className={`h-8 text-xs font-bold text-white ${noteModal.action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  Confirm {noteModal.action === 'approve' ? 'Approval' : 'Rejection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
