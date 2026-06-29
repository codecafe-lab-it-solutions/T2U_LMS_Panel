import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Shield, CheckCircle2, XCircle, Eye, AlertCircle, Loader2 } from 'lucide-react';
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
  aadhaar_front_url?: string;
  aadhaar_back_url?: string;
  pan_url?: string;
  selfie_url?: string;
};

export default function AdminKYC() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending Verification' | 'Verified' | 'Rejected'>('All');
  const [noteModal, setNoteModal] = useState<{ open: boolean; id: string; action: 'approve' | 'reject' }>({ open: false, id: '', action: 'approve' });
  const [note, setNote] = useState('');
  const [viewDoc, setViewDoc] = useState<{ title: string; url: string } | null>(null);

  // Fetch KYC documents
  const { data: rawEntries = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-kyc-docs'],
    queryFn: () => api.kyc.listAdmin(),
  });

  // Map backend kycDocument to frontend format
  const entries: KYCEntry[] = rawEntries.map((doc: any) => {
    const docs: string[] = [];
    if (doc.aadhaar_front_url) docs.push('Aadhaar Front');
    if (doc.aadhaar_back_url) docs.push('Aadhaar Back');
    if (doc.pan_url) docs.push('PAN Card');
    if (doc.selfie_url) docs.push('Selfie');

    let displayStatus: 'Pending Verification' | 'Verified' | 'Rejected' = 'Pending Verification';
    if (doc.status === 'approved') displayStatus = 'Verified';
    if (doc.status === 'rejected') displayStatus = 'Rejected';

    return {
      id: doc.id,
      name: doc.user?.full_name || 'Anonymous User',
      email: doc.user?.email || '',
      avatar: doc.user?.profile_photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doc.user?.full_name || 'User')}`,
      submittedAt: doc.submitted_at ? doc.submitted_at.substring(0, 10) : '—',
      docs,
      status: displayStatus,
      notes: doc.rejection_reason || undefined,
      aadhaar_front_url: doc.aadhaar_front_url,
      aadhaar_back_url: doc.aadhaar_back_url,
      pan_url: doc.pan_url,
      selfie_url: doc.selfie_url
    };
  });

  // Mutations
  const approveKyc = useMutation({
    mutationFn: (id: string) => api.kyc.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-kyc-docs'] });
      setNoteModal({ open: false, id: '', action: 'approve' });
      setNote('');
    }
  });

  const rejectKyc = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.kyc.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-kyc-docs'] });
      setNoteModal({ open: false, id: '', action: 'approve' });
      setNote('');
    }
  });

  const filtered = filterStatus === 'All' ? entries : entries.filter(e => e.status === filterStatus);
  const pending = entries.filter(e => e.status === 'Pending Verification').length;

  const confirm = () => {
    if (noteModal.action === 'approve') {
      approveKyc.mutate(noteModal.id);
    } else {
      rejectKyc.mutate({ id: noteModal.id, reason: note });
    }
  };

  const getDocUrl = (e: KYCEntry, d: string): string => {
    if (d === 'Aadhaar Front') return e.aadhaar_front_url || '';
    if (d === 'Aadhaar Back') return e.aadhaar_back_url || '';
    if (d === 'PAN Card') return e.pan_url || '';
    if (d === 'Selfie') return e.selfie_url || '';
    return '';
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
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-500 animate-pulse">
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
            {isLoading ? (
              <div className="p-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />Loading submissions…
              </div>
            ) : (
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
                            <button key={d} type="button" onClick={() => setViewDoc({ title: d, url: getDocUrl(e, d) })}
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
                              disabled={approveKyc.isPending || rejectKyc.isPending}
                              className="h-6 text-[9px] font-bold px-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                            </Button>
                            <Button size="sm" onClick={() => { setNoteModal({ open: true, id: e.id, action: 'reject' }); setNote(''); }}
                              disabled={approveKyc.isPending || rejectKyc.isPending}
                              className="h-6 text-[9px] font-bold px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                              <XCircle className="w-3 h-3 mr-1" />Reject
                            </Button>
                          </div>
                        ) : <span className="text-[9px] text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No KYC submissions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
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
                  disabled={approveKyc.isPending || rejectKyc.isPending}
                  className={`h-8 text-xs font-bold text-white ${noteModal.action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  {approveKyc.isPending || rejectKyc.isPending ? 'Syncing...' : `Confirm ${noteModal.action === 'approve' ? 'Approval' : 'Rejection'}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Doc preview modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setViewDoc(null)}>
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6 text-center space-y-4">
              <p className="font-bold text-foreground">{viewDoc.title} Preview</p>
              <div className="border border-border/50 rounded-lg overflow-hidden bg-muted/10 min-h-[250px] max-h-[400px] flex items-center justify-center">
                {viewDoc.url ? (
                  <img src={viewDoc.url} alt={viewDoc.title} className="max-w-full max-h-[380px] object-contain" />
                ) : (
                  <div className="p-10 space-y-2">
                    <Shield className="w-12 h-12 text-primary/40 mx-auto" />
                    <p className="text-xs text-muted-foreground font-semibold">No document image uploaded</p>
                    <p className="text-[10px] text-muted-foreground/60">No URL exists for this document field in the database.</p>
                  </div>
                )}
              </div>
              <Button onClick={() => setViewDoc(null)} className="w-full text-xs bg-primary text-white">Close</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
