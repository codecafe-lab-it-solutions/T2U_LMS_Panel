import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getMediaUrl } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import {
  Shield, CheckCircle2, XCircle, Eye, AlertCircle, Loader2,
  User, FileText, CreditCard, Camera, X, ExternalLink, Building2,
  Pencil, Save, Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginationFooter } from '@/components/ui/pagination-footer';

const PAGE_LIMIT = 20;

// Maps the frontend's display-level status tabs to the raw prisma KycDocument.status values
// the backend filters on — "Pending Verification" spans both draft and submitted.
const STATUS_QUERY: Record<string, string | undefined> = {
  All: undefined,
  'Pending Verification': 'draft,submitted',
  'DSA Review': 'awaiting_dsa_review',
  Verified: 'approved',
  Rejected: 'rejected',
};

type PersonalData = Record<string, string>;

type KYCEntry = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  submittedAt: string;
  docs: string[];
  status: 'Pending Verification' | 'DSA Review' | 'Verified' | 'Rejected';
  notes?: string;
  personal_data?: PersonalData;
  aadhaar_front_url?: string;
  aadhaar_back_url?: string;
  pan_url?: string;
  selfie_url?: string;
  cancelled_cheque_url?: string;
  dsa_signed_url?: string;
};

const API_ORIGIN = (import.meta.env.VITE_API_URL as string || '').replace(/\/api$/, '');
function resolveUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_ORIGIN}${url}`;
}

function statusBadge(s: string) {
  if (s === 'Verified') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (s === 'Rejected') return 'bg-red-500/15 text-red-400 border-red-500/30';
  if (s === 'DSA Review') return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
  return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
}

function maskAadhaar(v?: string) {
  if (!v) return '—';
  return v.length >= 4 ? `XXXX XXXX ${v.slice(-4)}` : v;
}

function DocThumbnail({ label, url: rawUrl }: { label: string; url?: string }) {
  const [open, setOpen] = useState(false);
  if (!rawUrl) return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border/50 bg-muted/10 opacity-50">
      <Shield className="w-6 h-6 text-muted-foreground" />
      <span className="text-[9px] text-muted-foreground font-semibold">{label}</span>
      <span className="text-[8px] text-muted-foreground">Not uploaded</span>
    </div>
  );
  // Uploaded files come back from the API as relative paths (e.g. /api/upload/xxx.jpg) —
  // resolve to an absolute URL pointing at the API server before using as img/iframe/anchor
  // src, since this page's own origin (the frontend) doesn't serve them.
  const url = getMediaUrl(rawUrl);
  const isPdf = url.match(/\.(pdf)$/i) || label === 'Signed DSA';
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer">
        <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center relative">
          {isPdf ? (
            <div className="flex flex-col items-center gap-0.5">
              <FileText className="w-6 h-6 text-primary/60" />
              <span className="text-[7px] text-primary/60 font-bold uppercase">PDF</span>
            </div>
          ) : (
            <img src={url} alt={label} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Eye className="w-4 h-4 text-white" />
          </div>
        </div>
        <span className="text-[9px] text-muted-foreground font-semibold">{label}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setOpen(false)}>
          <div className="relative max-w-2xl w-full max-h-[85vh] bg-card rounded-2xl border border-border overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-bold text-foreground">{label}</span>
              <div className="flex gap-2">
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary px-2 py-1 rounded-lg bg-muted/30 transition-colors">
                  <ExternalLink className="w-3 h-3" />Open
                </a>
                <button type="button" title="Close preview" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center bg-black/20 min-h-[300px] max-h-[75vh] overflow-auto">
              {isPdf
                ? <iframe src={url} title={label} className="w-full h-[600px] border-0" />
                : <img src={url} alt={label} className="max-w-full max-h-[70vh] object-contain" />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-xs text-foreground font-semibold">{value || '—'}</span>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <input
        title={label}
        placeholder={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none focus:border-primary/60 transition-colors"
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminKYC() {
  const perm = useEmployeePermission('admin-kyc');
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending Verification' | 'DSA Review' | 'Verified' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [noteModal, setNoteModal] = useState<{ open: boolean; id: string; action: 'approve' | 'reject' }>({ open: false, id: '', action: 'approve' });
  const [note, setNote] = useState('');
  const [detailEntry, setDetailEntry] = useState<KYCEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editPd, setEditPd] = useState<PersonalData>({});
  const [editUrls, setEditUrls] = useState({
    aadhaar_front_url: '',
    aadhaar_back_url: '',
    pan_url: '',
    selfie_url: '',
    cancelled_cheque_url: '',
    dsa_signed_url: '',
  });

  const { data: kycData, isLoading } = useQuery({
    queryKey: ['admin-kyc-docs', filterStatus, search, page],
    queryFn: () => api.kyc.listAdmin({ status: STATUS_QUERY[filterStatus], search: search.trim() || undefined, page, limit: PAGE_LIMIT }),
  });
  const rawEntries = kycData?.docs ?? [];
  const total = kycData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);
  const summary = kycData?.summary ?? { pending_count: 0, dsa_review_count: 0, verified_count: 0, rejected_count: 0 };

  const entries: KYCEntry[] = rawEntries.map((doc: any) => {
    const docs: string[] = [];
    if (doc.aadhaar_front_url) docs.push('Aadhaar Front');
    if (doc.aadhaar_back_url) docs.push('Aadhaar Back');
    if (doc.pan_url) docs.push('PAN Card');
    if (doc.selfie_url) docs.push('Selfie');
    if (doc.cancelled_cheque_url) docs.push('Cheque');
    if (doc.dsa_signed_url) docs.push('Signed DSA');

    let displayStatus: KYCEntry['status'] = 'Pending Verification';
    if (doc.status === 'awaiting_dsa_review') displayStatus = 'DSA Review';
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
      personal_data: doc.personal_data || {},
      aadhaar_front_url: resolveUrl(doc.aadhaar_front_url),
      aadhaar_back_url: resolveUrl(doc.aadhaar_back_url),
      pan_url: resolveUrl(doc.pan_url),
      selfie_url: resolveUrl(doc.selfie_url),
      cancelled_cheque_url: resolveUrl(doc.cancelled_cheque_url),
      dsa_signed_url: resolveUrl(doc.dsa_signed_url),
    };
  });

  const approveKyc = useMutation({
    mutationFn: (id: string) => api.kyc.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-kyc-docs'] });
      setNoteModal({ open: false, id: '', action: 'approve' });
      setNote('');
      setDetailEntry(prev => prev ? { ...prev, status: 'Verified' } : null);
    }
  });

  const rejectKyc = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.kyc.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-kyc-docs'] });
      setNoteModal({ open: false, id: '', action: 'approve' });
      setNote('');
      setDetailEntry(prev => prev ? { ...prev, status: 'Rejected', notes: note } : null);
    }
  });

  const updateKyc = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.kyc.adminUpdate(id, data),
    onSuccess: (updated: any) => {
      qc.invalidateQueries({ queryKey: ['admin-kyc-docs'] });
      setDetailEntry(prev => prev ? {
        ...prev,
        personal_data: updated.personal_data ?? prev.personal_data,
        aadhaar_front_url: resolveUrl(updated.aadhaar_front_url) ?? prev.aadhaar_front_url,
        aadhaar_back_url: resolveUrl(updated.aadhaar_back_url) ?? prev.aadhaar_back_url,
        pan_url: resolveUrl(updated.pan_url) ?? prev.pan_url,
        selfie_url: resolveUrl(updated.selfie_url) ?? prev.selfie_url,
        cancelled_cheque_url: resolveUrl(updated.cancelled_cheque_url) ?? prev.cancelled_cheque_url,
        dsa_signed_url: resolveUrl(updated.dsa_signed_url) ?? prev.dsa_signed_url,
      } : null);
      setIsEditing(false);
    },
  });

  const closeDrawer = () => {
    setDetailEntry(null);
    setIsEditing(false);
  };

  const startEditing = () => {
    if (!detailEntry) return;
    setEditPd({ ...(detailEntry.personal_data ?? {}) });
    setEditUrls({
      aadhaar_front_url: detailEntry.aadhaar_front_url || '',
      aadhaar_back_url: detailEntry.aadhaar_back_url || '',
      pan_url: detailEntry.pan_url || '',
      selfie_url: detailEntry.selfie_url || '',
      cancelled_cheque_url: detailEntry.cancelled_cheque_url || '',
      dsa_signed_url: detailEntry.dsa_signed_url || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!detailEntry) return;
    updateKyc.mutate({
      id: detailEntry.id,
      data: {
        personal_data: editPd,
        aadhaar_front_url: editUrls.aadhaar_front_url || undefined,
        aadhaar_back_url: editUrls.aadhaar_back_url || undefined,
        pan_url: editUrls.pan_url || undefined,
        selfie_url: editUrls.selfie_url || undefined,
        cancelled_cheque_url: editUrls.cancelled_cheque_url || undefined,
        dsa_signed_url: editUrls.dsa_signed_url || undefined,
      },
    });
  };

  // Filtering now happens server-side (via STATUS_QUERY + pagination), so `entries` already
  // reflects the current tab/page — no further client-side filtering needed.
  const filtered = entries;
  const pending = summary.pending_count + summary.dsa_review_count;

  const confirm = () => {
    if (noteModal.action === 'approve') {
      approveKyc.mutate(noteModal.id);
    } else {
      rejectKyc.mutate({ id: noteModal.id, reason: note });
    }
  };

  const pd = isEditing ? editPd : (detailEntry?.personal_data ?? {});

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

      {/* Stats — always reflect the full dataset, independent of the current tab/page */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Docs Pending', value: summary.pending_count, color: 'text-amber-400', border: 'border-amber-500/20 bg-amber-500/5' },
          { label: 'DSA Review', value: summary.dsa_review_count, color: 'text-violet-400', border: 'border-violet-500/20 bg-violet-500/5' },
          { label: 'Verified', value: summary.verified_count, color: 'text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/5' },
          { label: 'Rejected', value: summary.rejected_count, color: 'text-red-400', border: 'border-red-500/20 bg-red-500/5' },
        ].map(s => (
          <Card key={s.label} className={`border ${s.border}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-[9px] font-bold uppercase ${s.color}`}>{s.label}</p>
              <p className={`text-3xl font-black font-mono ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['All', 'Pending Verification', 'DSA Review', 'Verified', 'Rejected'] as const).map(f => (
            <button key={f} type="button" onClick={() => { setFilterStatus(f); setPage(1); }}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${filterStatus === f ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted'}`}>
              {f === 'Pending Verification' ? 'Docs Pending' : f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, email, phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
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
                    <tr key={e.id}
                      onClick={() => { setDetailEntry(e); setIsEditing(false); }}
                      className="border-b border-border/20 hover:bg-muted/10 transition-colors cursor-pointer">
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
                            <span key={d} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded flex items-center gap-0.5">
                              <Eye className="w-2.5 h-2.5" />{d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusBadge(e.status)}`}>{e.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-muted-foreground max-w-[200px]">{e.notes || '—'}</td>
                      <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                        {(e.status === 'Pending Verification' || e.status === 'DSA Review') && perm.approve ? (
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
          <PaginationFooter page={page} totalPages={totalPages} total={total} onPageChange={setPage} label="KYC submissions" />
        </CardContent>
      </Card>

      {/* ── Approve / Reject confirmation modal ─────────────────────────────── */}
      {noteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <Card className="max-w-sm w-full border border-border bg-card shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${noteModal.action === 'approve' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase flex items-center gap-1.5">
                {noteModal.action === 'approve'
                  ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" />Approve KYC</>
                  : <><XCircle className="w-4 h-4 text-red-500" />Reject KYC</>}
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

      {/* ── Full KYC Detail Drawer ───────────────────────────────────────────── */}
      {detailEntry && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm" onClick={closeDrawer}>
          <div
            onClick={e => e.stopPropagation()}
            className="relative h-full w-full max-w-2xl bg-card border-l border-border shadow-2xl overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <img src={detailEntry.avatar} alt={detailEntry.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-border" />
                <div>
                  <p className="font-black text-sm text-foreground">{detailEntry.name}</p>
                  <p className="text-[10px] text-muted-foreground">{detailEntry.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(detailEntry.status)}`}>
                  {detailEntry.status}
                </span>
                {!isEditing ? (
                  perm.edit && (
                    <Button type="button" size="sm" onClick={startEditing}
                      className="h-7 text-[10px] font-bold px-2.5 bg-muted/50 text-foreground hover:bg-muted border border-border">
                      <Pencil className="w-3 h-3 mr-1" />Edit
                    </Button>
                  )
                ) : (
                  <Button type="button" size="sm" onClick={() => setIsEditing(false)}
                    disabled={updateKyc.isPending}
                    className="h-7 text-[10px] font-bold px-2.5 bg-muted/50 text-foreground hover:bg-muted border border-border">
                    Cancel
                  </Button>
                )}
                <button type="button" title="Close detail panel" onClick={closeDrawer}
                  className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-6">
              {/* ── Personal Info ───────────────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-primary/70" />
                  <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Personal Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border/60 bg-muted/5">
                  {isEditing ? (
                    <>
                      <EditField label="Full Name" value={editPd.fullName || ''} onChange={v => setEditPd(p => ({ ...p, fullName: v }))} />
                      <EditField label="Father's Name" value={editPd.fatherName || ''} onChange={v => setEditPd(p => ({ ...p, fatherName: v }))} />
                      <EditField label="Age" value={editPd.age || ''} onChange={v => setEditPd(p => ({ ...p, age: v }))} />
                      <EditField label="Mobile" value={editPd.mobile || ''} onChange={v => setEditPd(p => ({ ...p, mobile: v }))} />
                      <div className="col-span-2">
                        <EditField label="Address" value={editPd.address || ''} onChange={v => setEditPd(p => ({ ...p, address: v }))} />
                      </div>
                      <div className="col-span-2">
                        <EditField label="Email" value={editPd.email || ''} onChange={v => setEditPd(p => ({ ...p, email: v }))} />
                      </div>
                    </>
                  ) : (
                    <>
                      <InfoRow label="Full Name" value={pd.fullName || detailEntry.name} />
                      <InfoRow label="Father's Name" value={pd.fatherName} />
                      <InfoRow label="Age" value={pd.age} />
                      <InfoRow label="Mobile" value={pd.mobile} />
                      <div className="col-span-2">
                        <InfoRow label="Address" value={pd.address} />
                      </div>
                      <div className="col-span-2">
                        <InfoRow label="Email" value={pd.email || detailEntry.email} />
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* ── Identity ────────────────────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary/70" />
                  <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Identity Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border/60 bg-muted/5">
                  {isEditing ? (
                    <>
                      <EditField label="Aadhaar Number" value={editPd.aadhaarNumber || ''} onChange={v => setEditPd(p => ({ ...p, aadhaarNumber: v }))} />
                      <EditField label="PAN Number" value={editPd.panNumber || ''} onChange={v => setEditPd(p => ({ ...p, panNumber: v }))} />
                    </>
                  ) : (
                    <>
                      <InfoRow label="Aadhaar Number" value={maskAadhaar(pd.aadhaarNumber)} />
                      <InfoRow label="PAN Number" value={pd.panNumber} />
                    </>
                  )}
                </div>
              </section>

              {/* ── Bank Details ─────────────────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-primary/70" />
                  <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Bank Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border/60 bg-muted/5">
                  {isEditing ? (
                    <>
                      <EditField label="Bank Name" value={editPd.bankName || ''} onChange={v => setEditPd(p => ({ ...p, bankName: v }))} />
                      <EditField label="Account Holder" value={editPd.accountHolder || ''} onChange={v => setEditPd(p => ({ ...p, accountHolder: v }))} />
                      <EditField label="Account Number" value={editPd.accountNumber || ''} onChange={v => setEditPd(p => ({ ...p, accountNumber: v }))} />
                      <EditField label="IFSC Code" value={editPd.ifsc || ''} onChange={v => setEditPd(p => ({ ...p, ifsc: v }))} />
                    </>
                  ) : (
                    <>
                      <InfoRow label="Bank Name" value={pd.bankName} />
                      <InfoRow label="Account Holder" value={pd.accountHolder} />
                      <InfoRow label="Account Number" value={pd.accountNumber} />
                      <InfoRow label="IFSC Code" value={pd.ifsc} />
                    </>
                  )}
                </div>
              </section>

              {/* ── Uploaded Documents ───────────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-primary/70" />
                  <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Uploaded Documents</h3>
                </div>
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-3 p-4 rounded-xl border border-border/60 bg-muted/5">
                    <p className="text-[9px] text-muted-foreground font-semibold">Enter new URL to replace document (leave blank to keep existing)</p>
                    <EditField label="Aadhaar Front URL" value={editUrls.aadhaar_front_url} onChange={v => setEditUrls(p => ({ ...p, aadhaar_front_url: v }))} />
                    <EditField label="Aadhaar Back URL" value={editUrls.aadhaar_back_url} onChange={v => setEditUrls(p => ({ ...p, aadhaar_back_url: v }))} />
                    <EditField label="PAN Card URL" value={editUrls.pan_url} onChange={v => setEditUrls(p => ({ ...p, pan_url: v }))} />
                    <EditField label="Selfie URL" value={editUrls.selfie_url} onChange={v => setEditUrls(p => ({ ...p, selfie_url: v }))} />
                    <EditField label="Cancelled Cheque URL" value={editUrls.cancelled_cheque_url} onChange={v => setEditUrls(p => ({ ...p, cancelled_cheque_url: v }))} />
                    <EditField label="Signed DSA URL" value={editUrls.dsa_signed_url} onChange={v => setEditUrls(p => ({ ...p, dsa_signed_url: v }))} />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <DocThumbnail label="Aadhaar Front" url={detailEntry.aadhaar_front_url} />
                    <DocThumbnail label="Aadhaar Back" url={detailEntry.aadhaar_back_url} />
                    <DocThumbnail label="PAN Card" url={detailEntry.pan_url} />
                    <DocThumbnail label="Selfie" url={detailEntry.selfie_url} />
                    <DocThumbnail label="Cancelled Cheque" url={detailEntry.cancelled_cheque_url} />
                  </div>
                )}
              </section>

              {/* ── Signed DSA Agreement ─────────────────────────────────────── */}
              {!isEditing && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-primary/70" />
                    <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Signed DSA Agreement</h3>
                  </div>
                  {detailEntry.dsa_signed_url ? (
                    <div className="rounded-xl border border-border/60 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/40">
                        <span className="text-[10px] text-muted-foreground font-semibold">Direct Seller Agreement (Signed)</span>
                        <a href={getMediaUrl(detailEntry.dsa_signed_url)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" />Open in new tab
                        </a>
                      </div>
                      <iframe src={getMediaUrl(detailEntry.dsa_signed_url)} title="Signed DSA Agreement"
                        className="w-full h-64 border-0 bg-muted/10" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-8 rounded-xl border border-dashed border-border/50 bg-muted/5 text-muted-foreground">
                      <Shield className="w-8 h-8 opacity-30" />
                      <p className="text-xs font-semibold">No signed DSA uploaded yet</p>
                    </div>
                  )}
                </section>
              )}

              {/* ── Rejection reason (if any) ────────────────────────────────── */}
              {!isEditing && detailEntry.notes && detailEntry.status === 'Rejected' && (
                <section>
                  <div className="flex items-center gap-2 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-red-400 uppercase">Rejection Reason</p>
                      <p className="text-xs text-red-300 mt-0.5">{detailEntry.notes}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Submission date */}
              <p className="text-[9px] text-muted-foreground text-right">Submitted: {detailEntry.submittedAt}</p>
            </div>

            {/* ── Footer actions ───────────────────────────────────────────────── */}
            {isEditing ? (
              <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-3 shrink-0">
                <Button type="button" className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold"
                  onClick={handleSave} disabled={updateKyc.isPending}>
                  {updateKyc.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                </Button>
                <Button type="button" variant="outline" className="font-bold"
                  onClick={() => setIsEditing(false)} disabled={updateKyc.isPending}>
                  Cancel
                </Button>
              </div>
            ) : (detailEntry.status === 'Pending Verification' || detailEntry.status === 'DSA Review') && perm.approve && (
              <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-3 shrink-0">
                <Button type="button" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                  onClick={() => { setNoteModal({ open: true, id: detailEntry.id, action: 'approve' }); setNote(''); }}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />Approve KYC
                </Button>
                <Button type="button" className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold"
                  onClick={() => { setNoteModal({ open: true, id: detailEntry.id, action: 'reject' }); setNote(''); }}>
                  <XCircle className="w-4 h-4 mr-2" />Reject KYC
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
