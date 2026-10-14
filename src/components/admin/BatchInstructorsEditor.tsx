import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Percent, Save, CheckCircle2, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, getStoredToken } from '../../services/api';

// Per-batch instructor roster + commission-rate editor — admin-only (instructors see their own
// rate read-only, elsewhere, on their earnings page). Add/remove/edit-rate all reuse the same
// admin-gated endpoints built for batch-wise commission. Shared between BatchManagePage.tsx and
// CourseBatchesPanel.tsx so the two surfaces never drift out of sync.
export default function BatchInstructorsEditor({ batch, role }: { batch: any; role: string }) {
  const qc = useQueryClient();
  const instructorRows: any[] = batch.instructors ?? [];

  const [commissionEdits, setCommissionEdits] = useState<Record<string, string>>({});
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [addPct, setAddPct] = useState('0');
  const [addSearch, setAddSearch] = useState('');

  const { data: allInstructors = [] } = useQuery<any[]>({
    queryKey: ['instructors-list'],
    queryFn: () => api.users.instructors(),
    enabled: adding && !!getStoredToken(),
  });

  const commissionMut = useMutation({
    mutationFn: ({ userId, pct }: { userId: string; pct: number }) =>
      api.batches.updateInstructorCommission(batch.id, userId, pct),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['course-batches-admin'] });
      setSavedFor(userId);
      setTimeout(() => setSavedFor(null), 2000);
    },
  });

  const addMut = useMutation({
    mutationFn: ({ userId, pct }: { userId: string; pct: number }) =>
      api.batches.addInstructor(batch.id, userId, pct),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['course-batches-admin'] });
      setAdding(false);
      setAddUserId('');
      setAddPct('0');
      setAddSearch('');
    },
  });

  const removeMut = useMutation({
    mutationFn: (userId: string) => api.batches.removeInstructor(batch.id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['course-batches-admin'] });
    },
  });

  const existingIds = new Set(instructorRows.map((bi: any) => (bi.user ?? bi).id));
  const addCandidates = allInstructors.filter((u: any) =>
    !existingIds.has(u.id) && u.full_name.toLowerCase().includes(addSearch.toLowerCase())
  );

  if (role !== 'admin') {
    // Non-admins (instructors viewing their own batch) see the roster read-only.
    return (
      <div className="flex flex-wrap gap-1.5">
        {instructorRows.map((bi: any) => {
          const user = bi.user ?? bi;
          return (
            <span key={user.id} className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {user.full_name}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/20">
        {instructorRows.map((bi: any) => {
          const user = bi.user ?? bi;
          const editValue = commissionEdits[user.id] ?? String(bi.commission_percent ?? 0);
          return (
            <div key={user.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                {user.full_name?.[0] ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{user.full_name}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Input
                  type="number" min={0} max={100} step="0.01"
                  value={editValue}
                  onChange={e => setCommissionEdits(p => ({ ...p, [user.id]: e.target.value }))}
                  className="h-7 w-20 text-xs text-right bg-muted/20"
                />
                <span className="text-[10px] text-muted-foreground font-bold">%</span>
                <Button
                  size="sm" type="button"
                  disabled={commissionMut.isPending}
                  onClick={() => commissionMut.mutate({ userId: user.id, pct: parseFloat(editValue) || 0 })}
                  className="h-7 text-[10px] font-bold px-2 bg-muted/50 text-foreground hover:bg-muted border border-border"
                >
                  {savedFor === user.id ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Save className="w-3 h-3" />}
                </Button>
                <button
                  type="button" title="Remove instructor from batch"
                  disabled={removeMut.isPending}
                  onClick={() => { if (confirm(`Remove ${user.full_name} from this batch?`)) removeMut.mutate(user.id); }}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        {instructorRows.length === 0 && (
          <p className="px-3 py-3 text-center text-[10px] text-muted-foreground">No instructors assigned yet.</p>
        )}
      </div>

      {adding ? (
        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
          <Input placeholder="Search instructors…" value={addSearch} onChange={e => setAddSearch(e.target.value)} className="h-7 text-xs bg-card" />
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {addCandidates.map((u: any) => (
              <button
                key={u.id} type="button" onClick={() => setAddUserId(u.id)}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${addUserId === u.id ? 'bg-primary/15 text-primary font-bold' : 'hover:bg-muted/40 text-foreground'}`}
              >
                {u.full_name}
              </button>
            ))}
            {addCandidates.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No matching instructors</p>}
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} max={100} step="0.01" placeholder="0" value={addPct} onChange={e => setAddPct(e.target.value)} className="h-7 w-20 text-xs bg-card" />
            <span className="text-[10px] text-muted-foreground font-bold">%</span>
            <Button
              size="sm" type="button" disabled={!addUserId || addMut.isPending}
              onClick={() => addMut.mutate({ userId: addUserId, pct: parseFloat(addPct) || 0 })}
              className="h-7 text-[10px] font-bold px-2.5 bg-primary text-white ml-auto"
            >
              {addMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
            </Button>
            <Button size="sm" type="button" variant="outline" onClick={() => { setAdding(false); setAddUserId(''); setAddSearch(''); }} className="h-7 text-[10px] px-2.5">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button" onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed border-border text-[10px] font-bold text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Instructor
        </button>
      )}
      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
        <Percent className="w-2.5 h-2.5" />% of the course price (plus matching BV) each instructor earns per student enrolled in this batch.
      </p>
    </div>
  );
}
