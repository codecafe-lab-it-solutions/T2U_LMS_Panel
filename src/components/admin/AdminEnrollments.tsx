import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { CheckCircle, XCircle, Clock, ExternalLink, ChevronDown } from 'lucide-react';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',  icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',  icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',    icon: <XCircle className="w-3 h-3" /> },
};

export default function AdminEnrollments() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [rejectTarget, setRejectTarget] = useState<{ id: string; note: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['admin-enrollments', filter],
    queryFn: () => api.courses.adminEnrollments(filter === 'all' ? undefined : filter),
  });

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
              onClick={() => setFilter(s)}
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
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Referral</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Transaction ID</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Screenshot</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Submitted</th>
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
                        <div className="font-medium text-foreground max-w-[160px] truncate">{e.course?.title || '—'}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {(e.price_charged ?? e.course?.price) != null ? `₹${Number(e.price_charged ?? e.course.price).toLocaleString('en-IN')}` : '—'}
                        {e.discount_amount > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">−₹{Number(e.discount_amount).toLocaleString('en-IN')} discount</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {e.referral_code_used || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {e.payment_transaction_id || <span className="text-muted-foreground">Not provided</span>}
                      </td>
                      <td className="px-4 py-3">
                        {e.payment_screenshot_url ? (
                          <a
                            href={e.payment_screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(e.enrolled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                          {badge.icon} {badge.label}
                        </span>
                        {e.payment_status === 'rejected' && e.payment_note && (
                          <button
                            type="button"
                            title={isExpanded ? 'Hide rejection note' : 'Show rejection note'}
                            onClick={() => setExpandedId(isExpanded ? null : e.id)}
                            className="ml-1.5 text-muted-foreground hover:text-foreground"
                          >
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {e.payment_status === 'pending' && (
                          <div className="flex gap-2">
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
                          </div>
                        )}
                        {e.payment_status === 'approved' && (
                          <span className="text-xs text-muted-foreground">
                            {e.payment_reviewed_at
                              ? `Approved ${new Date(e.payment_reviewed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
                              : 'Approved'}
                          </span>
                        )}
                        {e.payment_status === 'rejected' && (
                          <button
                            type="button"
                            onClick={() => approveMut.mutate(e.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                          >
                            Re-approve
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && e.payment_note && (
                      <tr key={`${e.id}-note`} className="bg-red-50 dark:bg-red-900/10">
                        <td colSpan={9} className="px-4 py-2 text-xs text-red-700 dark:text-red-400">
                          <span className="font-semibold">Rejection note:</span> {e.payment_note}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
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
