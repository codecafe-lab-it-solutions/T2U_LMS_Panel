import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { api, getMediaUrl, getErrorMessage } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import { PaginationFooter } from '@/components/ui/pagination-footer';

const PAGE_LIMIT = 20;
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
};

// Bundle purchase requests. Approving one grants approved Enrollment rows for every included
// course server-side; those then show up in the regular course enrollment list ("via bundle").
export default function AdminBundleEnrollments() {
  const perm = useEmployeePermission('admin-enrollments');
  const qc = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; note: string } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-bundle-enrollments', filter, page],
    queryFn: () => api.courseBundles.adminEnrollments({ status: filter === 'all' ? undefined : filter, page, limit: PAGE_LIMIT }),
  });
  const rows = data?.enrollments ?? [];
  const total = data?.total ?? 0;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-bundle-enrollments'] });
    qc.invalidateQueries({ queryKey: ['admin-enrollments'] });
  };

  const approveMut = useMutation({
    mutationFn: (id: string) => api.courseBundles.approveEnrollment(id),
    onSuccess: (r) => {
      refresh();
      setMessage({ ok: true, text: `Approved — ${r.granted ?? 0} course(s) granted${r.already_had ? `, ${r.already_had} already owned (progress kept)` : ''}${r.unavailable ? `, ${r.unavailable} unavailable skipped` : ''}.` });
    },
    onError: (e) => setMessage({ ok: false, text: getErrorMessage(e) }),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.courseBundles.rejectEnrollment(id, note),
    onSuccess: () => { refresh(); setRejectTarget(null); },
    onError: (e) => { setMessage({ ok: false, text: getErrorMessage(e) }); setRejectTarget(null); },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map(s => (
          <button key={s} type="button" onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${filter === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {s}
          </button>
        ))}
      </div>

      {message && (
        <div className={`rounded-xl border text-sm px-4 py-3 ${message.ok ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : isError ? (
        <div className="text-center py-16 text-red-500 text-sm">{getErrorMessage(error)}</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No bundle enrollment requests found.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Student', 'Bundle', 'Price', 'Payment', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((e: any) => {
                const badge = STATUS_BADGE[e.payment_status] ?? STATUS_BADGE.pending;
                return (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{e.student?.full_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{e.student?.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{e.bundle?.name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{e.bundle?._count?.items ?? 0} courses</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {(e.price_charged ?? e.bundle?.price) != null ? `₹${Number(e.price_charged ?? e.bundle.price).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-mono text-foreground">{e.payment_transaction_id || <span className="text-muted-foreground">No txn ID</span>}</div>
                      {e.payment_screenshot_url && (
                        <a href={getMediaUrl(e.payment_screenshot_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                          Screenshot <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {e.referral_code_used && <div className="text-muted-foreground">Ref: {e.referral_code_used}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>{badge.icon} {badge.label}</span>
                      {e.payment_status === 'rejected' && e.payment_note && <div className="text-[11px] text-red-600 mt-1">{e.payment_note}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {e.payment_status === 'pending' && perm.approve ? (
                        <div className="flex gap-2">
                          <button type="button" disabled={approveMut.isPending} onClick={() => approveMut.mutate(e.id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg disabled:opacity-60">Approve</button>
                          <button type="button" onClick={() => setRejectTarget({ id: e.id, note: '' })} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">Reject</button>
                        </div>
                      ) : e.payment_status === 'approved' ? (
                        <span className="text-xs text-muted-foreground">{e._count?.course_enrollments ?? 0} courses granted</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <PaginationFooter page={page} totalPages={Math.ceil(total / PAGE_LIMIT)} total={total} onPageChange={setPage} label="bundle requests" />
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-foreground">Reject Bundle Enrollment</h2>
            <p className="text-sm text-muted-foreground">The student is notified and can resubmit payment. Add a reason to help them.</p>
            <textarea value={rejectTarget.note} onChange={e => setRejectTarget(p => p ? { ...p, note: e.target.value } : null)} rows={3} placeholder="Reason (optional)"
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setRejectTarget(null)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
              <button type="button" disabled={rejectMut.isPending} onClick={() => rejectMut.mutate(rejectTarget)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                {rejectMut.isPending ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
