import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Shield, CheckCircle2, XCircle, Eye, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type KYCEntry = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  submittedAt: string;
  docs: string[];
  status: 'Pending Verification' | 'Verified' | 'Rejected';
  notes?: string;
};

const initialEntries: KYCEntry[] = [
  { id: 'KYC001', name: 'Rohan Mehra', email: 'rohan.m@t2u.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80', submittedAt: '2026-06-27', docs: ['Aadhaar Front', 'Aadhaar Back', 'PAN Card', 'Selfie'], status: 'Pending Verification' },
  { id: 'KYC002', name: 'Priya Sharma', email: 'priya.sharma@t2u.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=80', submittedAt: '2026-06-26', docs: ['Aadhaar Front', 'PAN Card', 'Selfie'], status: 'Pending Verification' },
  { id: 'KYC003', name: 'Deepa Menon', email: 'deepa.menon@t2u.com', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=80', submittedAt: '2026-06-25', docs: ['Aadhaar Front', 'Aadhaar Back', 'PAN Card', 'Selfie'], status: 'Pending Verification' },
  { id: 'KYC004', name: 'Aarya Garg', email: 'gargiarya2006@gmail.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80', submittedAt: '2026-06-20', docs: ['Aadhaar Front', 'Aadhaar Back', 'PAN Card', 'Selfie'], status: 'Verified' },
  { id: 'KYC005', name: 'Sneha Krishnan', email: 'sneha.k@t2u.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=80', submittedAt: '2026-06-22', docs: ['Aadhaar Front', 'PAN Card'], status: 'Verified' },
];

export default function AdminKYC() {
  const [entries, setEntries] = useState<KYCEntry[]>(initialEntries);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending Verification' | 'Verified' | 'Rejected'>('All');
  const [noteModal, setNoteModal] = useState<{ open: boolean; id: string; action: 'approve' | 'reject' }>({ open: false, id: '', action: 'approve' });
  const [note, setNote] = useState('');
  const [viewDoc, setViewDoc] = useState<string | null>(null);

  const filtered = filterStatus === 'All' ? entries : entries.filter(e => e.status === filterStatus);
  const pending = entries.filter(e => e.status === 'Pending Verification').length;

  const confirm = () => {
    setEntries(prev => prev.map(e =>
      e.id === noteModal.id
        ? { ...e, status: noteModal.action === 'approve' ? 'Verified' : 'Rejected', notes: note || undefined }
        : e
    ));
    setNoteModal({ open: false, id: '', action: 'approve' });
    setNote('');
  };

  const statusBadge = (s: string) => {
    if (s === 'Verified') return 'bg-emerald-500/15 text-emerald-400';
    if (s === 'Rejected') return 'bg-red-500/15 text-red-400';
    return 'bg-amber-500/15 text-amber-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">KYC Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Review and verify user KYC document submissions</p>
      </div>

      {pending > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">{pending} KYC submissions pending review</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: entries.filter(e => e.status === 'Pending Verification').length, color: 'text-amber-400', border: 'border-amber-500/20 bg-amber-500/5' },
          { label: 'Verified', value: entries.filter(e => e.status === 'Verified').length, color: 'text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/5' },
          { label: 'Rejected', value: entries.filter(e => e.status === 'Rejected').length, color: 'text-red-400', border: 'border-red-500/20 bg-red-500/5' },
        ].map(s => (
          <Card key={s.label} className={`border ${s.border}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-[9px] font-bold uppercase ${s.color}`}>{s.label}</p>
              <p className={`text-3xl font-black font-mono ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['All', 'Pending Verification', 'Verified', 'Rejected'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilterStatus(f)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${filterStatus === f ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted'}`}>
            {f === 'Pending Verification' ? 'Pending' : f}
          </button>
        ))}
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  {['User', 'Submitted', 'Documents', 'Status', 'Notes', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={e.avatar} alt={e.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-border" />
                        <div>
                          <p className="font-bold text-foreground">{e.name}</p>
                          <p className="text-[9px] text-muted-foreground">{e.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">{e.submittedAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {e.docs.map(d => (
                          <button key={d} type="button" onClick={() => setViewDoc(d)}
                            className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded flex items-center gap-0.5 hover:bg-primary/20">
                            <Eye className="w-2.5 h-2.5" />{d}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusBadge(e.status)}`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground max-w-[120px] truncate">{e.notes || '—'}</td>
                    <td className="px-4 py-3">
                      {e.status === 'Pending Verification' ? (
                        <div className="flex gap-1.5">
                          <Button size="sm" onClick={() => { setNoteModal({ open: true, id: e.id, action: 'approve' }); setNote(''); }}
                            className="h-6 text-[9px] font-bold px-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                          </Button>
                          <Button size="sm" onClick={() => { setNoteModal({ open: true, id: e.id, action: 'reject' }); setNote(''); }}
                            className="h-6 text-[9px] font-bold px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                            <XCircle className="w-3 h-3 mr-1" />Reject
                          </Button>
                        </div>
                      ) : <span className="text-[9px] text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Note modal */}
      {noteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <Card className="max-w-sm w-full border border-border bg-card shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${noteModal.action === 'approve' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase flex items-center gap-1.5">
                {noteModal.action === 'approve' ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" />Approve KYC</> : <><XCircle className="w-4 h-4 text-red-500" />Reject KYC</>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                placeholder={noteModal.action === 'reject' ? 'Reason for rejection (required for user notification)...' : 'Optional approval note...'}
                className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none resize-none" />
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

      {/* Doc preview modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setViewDoc(null)}>
          <Card className="max-w-sm w-full border border-border bg-card shadow-2xl">
            <CardContent className="p-6 text-center space-y-4">
              <Shield className="w-12 h-12 text-primary mx-auto" />
              <p className="font-bold text-foreground">{viewDoc}</p>
              <p className="text-xs text-muted-foreground">Document preview requires backend file storage integration (AWS S3 / Prisma).</p>
              <Button onClick={() => setViewDoc(null)} className="w-full text-xs bg-primary text-white">Close</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
