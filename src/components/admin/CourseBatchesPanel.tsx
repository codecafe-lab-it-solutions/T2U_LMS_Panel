import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Plus, Save, Search, UserRound, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, getStoredToken } from '../../services/api';
import BatchFormModal from './BatchFormModal';

interface AssignmentRow {
  batchId: string;
  batchTitle: string;
  batchStatus: string;
  userId: string;
  userName: string;
  commissionPercent: number;
}

// There's no single "primary instructor" for a course — instead you add as many instructors as
// the course needs, each tied to the batch they actually teach (Morning/Evening/etc). Every
// assignment here is the same BatchCourse/BatchInstructor data Batch Management reads and
// writes, so it's reflected on both surfaces automatically. An instructor added to a course this
// way immediately sees the course on their own panel — server-side, "my courses" now matches on
// batch membership, not just the legacy single-owner field.
export default function CourseBatchesPanel({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');

  const [addUserId, setAddUserId] = useState('');
  const [addBatchId, setAddBatchId] = useState('');
  const [addPct, setAddPct] = useState('0');

  const [rowEdits, setRowEdits] = useState<Record<string, string>>({}); // key: `${batchId}:${userId}` -> pct
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const { data: linkedBatches = [], isLoading } = useQuery<any[]>({
    queryKey: ['course-batches-admin', courseId],
    queryFn: () => api.batches.list({ course_id: courseId }),
    enabled: !!getStoredToken(),
  });
  const { data: allInstructors = [] } = useQuery<any[]>({
    queryKey: ['instructors-list'],
    queryFn: api.users.instructors,
    enabled: !!getStoredToken(),
  });
  const { data: allBatches = [] } = useQuery<any[]>({
    queryKey: ['batches'],
    queryFn: () => api.batches.list(),
    enabled: linking && !!getStoredToken(),
  });

  const rows: AssignmentRow[] = linkedBatches.flatMap((b: any) =>
    (b.instructors ?? []).map((bi: any) => {
      const user = bi.user ?? bi;
      return {
        batchId: b.id, batchTitle: b.title, batchStatus: b.status,
        userId: user.id, userName: user.full_name, commissionPercent: bi.commission_percent ?? 0,
      };
    })
  );

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['course-batches-admin', courseId] });
    qc.invalidateQueries({ queryKey: ['batches'] });
  }

  const commissionMut = useMutation({
    mutationFn: ({ batchId, userId, pct }: { batchId: string; userId: string; pct: number }) =>
      api.batches.updateInstructorCommission(batchId, userId, pct),
    onSuccess: (_d, { batchId, userId }) => {
      invalidate();
      setSavedKey(`${batchId}:${userId}`);
      setTimeout(() => setSavedKey(null), 2000);
    },
  });

  const moveMut = useMutation({
    mutationFn: async ({ fromBatchId, toBatchId, userId, pct }: { fromBatchId: string; toBatchId: string; userId: string; pct: number }) => {
      await api.batches.addInstructor(toBatchId, userId, pct);
      await api.batches.removeInstructor(fromBatchId, userId);
    },
    onSuccess: invalidate,
  });

  const removeMut = useMutation({
    mutationFn: ({ batchId, userId }: { batchId: string; userId: string }) => api.batches.removeInstructor(batchId, userId),
    onSuccess: invalidate,
  });

  const addMut = useMutation({
    mutationFn: ({ batchId, userId, pct }: { batchId: string; userId: string; pct: number }) => api.batches.addInstructor(batchId, userId, pct),
    onSuccess: () => {
      invalidate();
      setAddUserId(''); setAddBatchId(''); setAddPct('0');
    },
  });

  const linkMut = useMutation({
    mutationFn: (batchId: string) => api.batches.addCourse(batchId, courseId),
    onSuccess: () => { invalidate(); setLinking(false); setLinkSearch(''); },
  });

  const linkedIds = new Set(linkedBatches.map((b: any) => b.id));
  const unlinkedCandidates = allBatches.filter((b: any) => !linkedIds.has(b.id) && b.title.toLowerCase().includes(linkSearch.toLowerCase()));

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <UserRound className="w-4 h-4 text-primary" />
          Instructors
        </CardTitle>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Add as many instructors as this course needs — each tied to the batch (Morning/Evening/etc) they teach.
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No instructors assigned yet.</p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/20">
            {rows.map(row => {
              const key = `${row.batchId}:${row.userId}`;
              const editValue = rowEdits[key] ?? String(row.commissionPercent);
              return (
                <div key={key} className="flex items-center gap-2 px-3 py-2.5 flex-wrap">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                    {row.userName?.[0] ?? '?'}
                  </div>
                  <p className="text-xs font-semibold text-foreground min-w-[100px]">{row.userName}</p>
                  <select
                    value={row.batchId} title="Batch"
                    onChange={e => {
                      const toBatchId = e.target.value;
                      if (toBatchId !== row.batchId) moveMut.mutate({ fromBatchId: row.batchId, toBatchId, userId: row.userId, pct: row.commissionPercent });
                    }}
                    className="h-7 px-2 rounded-lg border border-border bg-muted/20 text-[11px] text-foreground focus:outline-none flex-1 min-w-[120px]"
                  >
                    {linkedBatches.map((b: any) => <option key={b.id} value={b.id}>{b.title}</option>)}
                  </select>
                  <Input
                    type="number" min={0} max={100} step="0.01"
                    value={editValue}
                    onChange={e => setRowEdits(p => ({ ...p, [key]: e.target.value }))}
                    className="h-7 w-16 text-xs text-right bg-muted/20"
                  />
                  <span className="text-[10px] text-muted-foreground font-bold">%</span>
                  <Button
                    size="sm" type="button" disabled={commissionMut.isPending}
                    onClick={() => commissionMut.mutate({ batchId: row.batchId, userId: row.userId, pct: parseFloat(editValue) || 0 })}
                    className="h-7 text-[10px] font-bold px-2 bg-muted/50 text-foreground hover:bg-muted border border-border"
                  >
                    {savedKey === key ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Save className="w-3 h-3" />}
                  </Button>
                  <button
                    type="button" title="Remove instructor" disabled={removeMut.isPending}
                    onClick={() => { if (confirm(`Remove ${row.userName} from ${row.batchTitle}?`)) removeMut.mutate({ batchId: row.batchId, userId: row.userId }); }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add instructor — assigns them to one of this course's existing batches */}
        {linkedBatches.length > 0 ? (
          <div className="p-3 rounded-xl border border-dashed border-border space-y-2">
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Add Instructor</p>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={addUserId} onChange={e => setAddUserId(e.target.value)} title="Instructor"
                className="h-8 px-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none flex-1 min-w-[140px]">
                <option value="">Select instructor…</option>
                {allInstructors.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
              <select value={addBatchId} onChange={e => setAddBatchId(e.target.value)} title="Batch"
                className="h-8 px-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none flex-1 min-w-[120px]">
                <option value="">Select batch…</option>
                {linkedBatches.map((b: any) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
              <Input type="number" min={0} max={100} step="0.01" value={addPct} onChange={e => setAddPct(e.target.value)}
                placeholder="%" className="h-8 w-16 text-xs bg-muted/20" />
              <Button
                type="button" size="sm" disabled={!addUserId || !addBatchId || addMut.isPending}
                onClick={() => addMut.mutate({ batchId: addBatchId, userId: addUserId, pct: parseFloat(addPct) || 0 })}
                className="h-8 text-[10px] font-bold px-3 bg-primary text-white"
              >
                Add
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground text-center py-1">Create a batch below, then add instructors to it.</p>
        )}

        {/* Batch bootstrap */}
        {linking ? (
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input placeholder="Search batches…" value={linkSearch} onChange={e => setLinkSearch(e.target.value)} className="h-7 text-xs pl-7 bg-card" />
            </div>
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {unlinkedCandidates.map((b: any) => (
                <button key={b.id} type="button" disabled={linkMut.isPending} onClick={() => linkMut.mutate(b.id)}
                  className="w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-muted/40 text-foreground transition-colors">
                  {b.title}
                </button>
              ))}
              {unlinkedCandidates.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No other batches to link.</p>}
            </div>
            <Button size="sm" type="button" variant="outline" onClick={() => { setLinking(false); setLinkSearch(''); }} className="h-7 text-[10px] w-full">
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setLinking(true)} className="flex-1 h-8 text-[10px] font-bold">
              Link Existing Batch
            </Button>
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)} className="flex-1 h-8 text-[10px] font-bold bg-primary text-white">
              <Plus className="w-3 h-3 mr-1" />Create New Batch
            </Button>
          </div>
        )}
      </CardContent>

      <BatchFormModal open={createOpen} onClose={() => setCreateOpen(false)} preselectedCourseId={courseId} />
    </Card>
  );
}
