import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getMediaUrl } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import { CheckCircle, XCircle, Clock, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { PaginationFooter } from '@/components/ui/pagination-footer';
import AdminBundleEnrollments from './AdminBundleEnrollments';
import { formatDate } from '../../utils/date';

const PAGE_LIMIT = 20;

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',  icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',  icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',    icon: <XCircle className="w-3 h-3" /> },
};

// Lazily loads the enrolled course's batches only when the dropdown is opened, and lets admin
// assign/reassign/clear which batch this enrollment is linked to (drives instructor commission).
function BatchAssignCell({ enrollment }: { enrollment: any }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: batches = [], isLoading } = useQuery<any[]>({
    queryKey: ['course-batches', enrollment.course?.id],
    queryFn: () => api.courses.batches(enrollment.course.id),
    enabled: open && !!enrollment.course?.id,
  });

  const assignMut = useMutation({
    mutationFn: (batchId: string | null) => api.courses.assignBatch(enrollment.id, batchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-enrollments'] });
      setOpen(false);
    },
  });

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors"
      >
        {enrollment.batch?.title || <span className="text-muted-foreground">Unassigned</span>}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-56 rounded-lg border border-border bg-card shadow-xl p-1.5 space-y-0.5">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />Loading batches…
            </div>
          ) : batches.length === 0 ? (
            <p className="px-2 py-1.5 text-[11px] text-muted-foreground">No batches offered for this course.</p>
          ) : (
            batches.map((b: any) => (
              <button
                key={b.id}
                type="button"
                disabled={assignMut.isPending}
                onClick={() => assignMut.mutate(b.id)}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                  enrollment.batch?.id === b.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                {b.title}
              </button>
            ))
          )}
          {enrollment.batch && (
            <button
              type="button"
              disabled={assignMut.isPending}
              onClick={() => assignMut.mutate(null)}
              className="w-full text-left px-2 py-1.5 rounded-md text-xs text-red-500 hover:bg-red-500/10 transition-colors border-t border-border/40 mt-0.5 pt-1.5"
            >
              Clear batch
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Course vs Bundle purchase requests live side by side under one page/permission key.
export default function AdminEnrollments() {
  const [kind, setKind] = useState<'courses' | 'bundles'>('courses');
  return (
    <div>
      <div className="px-6 pt-6 flex gap-1 w-fit">
        {(['courses', 'bundles'] as const).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${kind === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            {k}
          </button>
        ))}
      </div>
      {kind === 'courses' ? <CourseEnrollments /> : (
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bundle Enrollments</h1>
            <p className="text-sm text-muted-foreground mt-1">Approving a bundle grants access to every course it includes</p>
          </div>
          <AdminBundleEnrollments />
        </div>
      )}
    </div>
  );
}

function CourseEnrollments() {
  const perm = useEmployeePermission('admin-enrollments');
  const qc = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [rejectTarget, setRejectTarget] = useState<{ id: string; note: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-enrollments', filter, page],
    queryFn: () => api.courses.adminEnrollments({ status: filter === 'all' ? undefined : filter, page, limit: PAGE_LIMIT }),
  });
  const enrollments = data?.enrollments ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const approveMut = useMutation({
    mutationFn: (id: string) => api.courses.approveEnrollment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-enrollments'] }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.courses.rejectEnrollment(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-enrollments'] });
      setRejectTarget(null);
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enrollment Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve course enrollment payment requests</p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                filter === s
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No enrollment requests found.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Course</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Price</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enrollments.map((e: any) => {
                const badge = STATUS_BADGE[e.payment_status] ?? STATUS_BADGE.pending;
                const isExpanded = expandedId === e.id;
                return (
                  <>
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{e.student?.full_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{e.student?.email || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{e.course?.title || '—'}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {(e.price_charged ?? e.course?.price) != null ? `₹${Number(e.price_charged ?? e.course.price).toLocaleString('en-IN')}` : '—'}
                        {e.discount_amount > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">−₹{Number(e.discount_amount).toLocaleString('en-IN')} discount</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {e.payment_status === 'pending' && perm.approve && (
                            <>
                              <button
                                type="button"
                                disabled={approveMut.isPending}
                                onClick={() => approveMut.mutate(e.id)}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget({ id: e.id, note: '' })}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {e.payment_status === 'pending' && !perm.approve && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {e.payment_status === 'approved' && (
                            <span className="text-xs text-muted-foreground">
                              {e.payment_reviewed_at
                                ? `Approved ${formatDate(e.payment_reviewed_at)}`
                                : 'Approved'}
                            </span>
                          )}
                          {e.payment_status === 'rejected' && perm.approve && (
                            <button
                              type="button"
                              onClick={() => approveMut.mutate(e.id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                            >
                              Re-approve
                            </button>
                          )}
                          <button
                            type="button"
                            title={isExpanded ? 'Hide details' : 'Show details (batch, transaction ID, screenshot…)'}
                            onClick={() => setExpandedId(isExpanded ? null : e.id)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto"
                          >
                            Details {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${e.id}-details`} className="bg-muted/20">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Batch</p>
                              {perm.approve ? <BatchAssignCell enrollment={e} /> : (
                                <span className="text-xs text-foreground">{e.batch?.title || <span className="text-muted-foreground">Unassigned</span>}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Referral</p>
                              <p className="font-mono text-xs text-foreground">{e.referral_code_used || <span className="text-muted-foreground">—</span>}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Transaction ID</p>
                              <p className="font-mono text-xs text-foreground">{e.payment_transaction_id || <span className="text-muted-foreground">Not provided</span>}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Screenshot</p>
                              {e.payment_screenshot_url ? (
                                <a
                                  href={getMediaUrl(e.payment_screenshot_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">None</span>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Submitted</p>
                              <p className="text-xs text-foreground">
                                {formatDate(e.enrolled_at)}
                              </p>
                            </div>
                          </div>
                          {e.payment_status === 'rejected' && e.payment_note && (
                            <div className="mt-4 pt-4 border-t border-border/60 text-xs text-red-700 dark:text-red-400">
                              <span className="font-semibold">Rejection note:</span> {e.payment_note}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          <PaginationFooter page={page} totalPages={totalPages} total={total} onPageChange={setPage} label="enrollment requests" />
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-foreground">Reject Enrollment</h2>
            <p className="text-sm text-muted-foreground">Optionally add a note explaining the rejection reason (visible to admin only).</p>
            <textarea
              value={rejectTarget.note}
              onChange={e => setRejectTarget(prev => prev ? { ...prev, note: e.target.value } : null)}
              rows={3}
              placeholder="Rejection reason (optional)"
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectMut.isPending}
                onClick={() => rejectMut.mutate({ id: rejectTarget.id, note: rejectTarget.note })}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {rejectMut.isPending ? 'Rejecting...' : 'Reject Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
