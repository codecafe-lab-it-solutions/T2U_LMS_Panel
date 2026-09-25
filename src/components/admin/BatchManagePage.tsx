import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Users, BookOpen, Calendar, Search, CheckSquare, Square,
  Loader2, CheckCircle2, Trash2, UserPlus, X, ChevronDown, ChevronUp, Percent, Save, Pencil,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationFooter } from '@/components/ui/pagination-footer';
import { api, getStoredToken } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import BatchInstructorsEditor from './BatchInstructorsEditor';
import BatchFormModal from './BatchFormModal';

const PAGE_LIMIT = 20;

interface BatchManagePageProps {
  onBack: () => void;
  onCreateBatch: () => void;
  role?: 'admin' | 'instructor';
}

function BatchRow({ batch, role }: { batch: any; role: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [success, setSuccess] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const [enrolledPage, setEnrolledPage] = useState(1);

  const { data: students = [], isLoading: loadingStudents } = useQuery<any[]>({
    queryKey: ['all-students'],
    queryFn: () => api.users.students(),
    enabled: open && !!getStoredToken(),
  });

  // Paginated (20/page) — drives the visible "Already Enrolled" list + footer below.
  const { data: enrolledResp } = useQuery<{ students: any[]; total: number }>({
    queryKey: ['batch-enrolled', batch.id, enrolledPage],
    queryFn: () => api.batches.enrolledStudents(batch.id, { page: enrolledPage, limit: 20 }),
    enabled: open && !!getStoredToken(),
  });
  const enrolled = enrolledResp?.students ?? [];
  const enrolledTotal = enrolledResp?.total ?? 0;

  // Separate, bounded (not paginated to 20) fetch of every enrolled student — needed to
  // correctly exclude already-enrolled students from the "Available Students" picker below,
  // which the paginated `enrolled` list above can't do once a batch has more than one page.
  const { data: allEnrolledResp } = useQuery<{ students: any[]; total: number }>({
    queryKey: ['batch-enrolled-all', batch.id],
    queryFn: () => api.batches.enrolledStudents(batch.id, { limit: 500 }),
    enabled: open && !!getStoredToken(),
  });
  const enrolledIds = new Set((allEnrolledResp?.students ?? []).map((s: any) => s.id));
  const available = students.filter(s => !enrolledIds.has(s.id) && (
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  ));

  const enrollMut = useMutation({
    mutationFn: () => api.batches.enrollStudents(batch.id, selected),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['batch-enrolled', batch.id] });
      qc.invalidateQueries({ queryKey: ['batch-enrolled-all', batch.id] });
      setSelected([]);
      setSuccess(`Enrolled ${data.students} student${data.students !== 1 ? 's' : ''} in ${data.courses} course${data.courses !== 1 ? 's' : ''} ✓`);
      setTimeout(() => setSuccess(''), 4000);
    },
  });

  const delMut = useMutation({
    mutationFn: () => api.batches.delete(batch.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(available.length === selected.length ? [] : available.map(s => s.id));

  const courses = batch.courses?.map((bc: any) => bc.course ?? bc) ?? [];
  const instructorRows: any[] = batch.instructors ?? [];
  const instructors = instructorRows.map((bi: any) => bi.user ?? bi);

  return (
    <Card className="border border-border bg-card overflow-hidden">
      {/* Batch summary row */}
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => setOpen(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-foreground">{batch.title}</p>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
              batch.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' :
              batch.status === 'upcoming' ? 'text-blue-400 bg-blue-500/10' :
              batch.status === 'completed' ? 'text-slate-400 bg-slate-500/10' :
              'text-red-400 bg-red-500/10'
            }`}>{batch.status}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(batch.start_date).toLocaleDateString()} → {new Date(batch.end_date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{instructors.length} instructor{instructors.length !== 1 ? 's' : ''}</span>
          </div>
          {/* Course chips */}
          {courses.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {courses.map((c: any) => (
                <span key={c.id} className="text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {c.title}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {role === 'admin' && (
            <>
              <button type="button" title="Edit batch"
                onClick={e => { e.stopPropagation(); setEditOpen(true); }}
                className="text-muted-foreground hover:text-primary transition-colors p-1">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button type="button" title="Delete batch"
                onClick={e => { e.stopPropagation(); if (confirm(`Delete batch "${batch.title}"?`)) delMut.mutate(); }}
                disabled={delMut.isPending}
                className="text-red-400 hover:text-red-600 transition-colors p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {role === 'admin' && (
        <BatchFormModal open={editOpen} onClose={() => setEditOpen(false)} batchId={batch.id} />
      )}

      {/* Expanded: student assignment */}
      {open && (
        <div className="border-t border-border/40 p-4 space-y-4 bg-muted/5">
          {/* Instructors & Commission — admin-only; instructors see rates read-only elsewhere (their earnings page), not editable here */}
          {role === 'admin' && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-primary" />
                Instructors & Commission
              </h4>
              <BatchInstructorsEditor batch={batch} role={role} />
            </div>
          )}

          {courses.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              No courses in this batch. Add courses first to assign students.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-primary" />
                  Assign Students to Batch
                </h4>
                {success && <span className="text-[10px] text-emerald-500 font-bold">{success}</span>}
                {selected.length > 0 && (
                  <Button size="sm" type="button"
                    onClick={() => enrollMut.mutate()}
                    disabled={enrollMut.isPending}
                    className="h-7 text-[10px] font-bold bg-primary text-white px-3">
                    {enrollMut.isPending
                      ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Enrolling…</>
                      : <><CheckCircle2 className="w-3 h-3 mr-1" />Enroll {selected.length} student{selected.length !== 1 ? 's' : ''}</>}
                  </Button>
                )}
              </div>

              {/* Already enrolled */}
              {enrolledTotal > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Already Enrolled ({enrolledTotal})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {enrolled.map((s: any) => (
                      <span key={s.id} className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />{s.full_name}
                      </span>
                    ))}
                  </div>
                  <PaginationFooter page={enrolledPage} totalPages={Math.ceil(enrolledTotal / 20)} total={enrolledTotal} onPageChange={setEnrolledPage} label="enrolled students" />
                </div>
              )}

              {/* Available students */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase flex-1">Available Students</p>
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)}
                      className="h-7 text-xs pl-6 bg-muted/20 w-48" />
                  </div>
                </div>

                {loadingStudents ? (
                  <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />Loading students…
                  </div>
                ) : available.length === 0 ? (
                  <p className="text-center py-3 text-xs text-muted-foreground">
                    {students.length === 0 ? 'No students in the system yet.' : 'All students are already enrolled.'}
                  </p>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden">
                    {/* Select all */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/40 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={toggleAll}>
                      <button type="button" title="Select all" className="text-primary">
                        {selected.length === available.length
                          ? <CheckSquare className="w-4 h-4" />
                          : <Square className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <span className="text-[10px] font-bold text-foreground">
                        {selected.length === available.length ? 'Deselect All' : `Select All (${available.length})`}
                      </span>
                      {selected.length > 0 && (
                        <span className="ml-auto text-[10px] font-bold text-primary">{selected.length} selected</span>
                      )}
                    </div>
                    {/* Student rows */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-border/20">
                      {available.map((s: any) => {
                        const isSelected = selected.includes(s.id);
                        return (
                          <div key={s.id}
                            onClick={() => toggle(s.id)}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/20'}`}>
                            <button type="button" title={isSelected ? 'Deselect' : 'Select'} className={isSelected ? 'text-primary' : 'text-muted-foreground'}>
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                              {s.full_name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{s.full_name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono truncate">{s.email}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {enrollMut.isError && (
                <p className="text-[10px] text-red-500 font-medium">{(enrollMut.error as Error)?.message}</p>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

export default function BatchManagePage({ onBack, onCreateBatch, role = 'admin' }: BatchManagePageProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery<{ batches: any[]; total: number }>({
    queryKey: ['batches', page],
    queryFn: () => api.batches.list({ page, limit: PAGE_LIMIT }),
    enabled: !!getStoredToken(),
  });
  const batches = data?.batches ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} title="Back"
          className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground">Batch Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage batches and assign students in bulk</p>
        </div>
        <Button type="button" size="sm" onClick={onCreateBatch} className="ml-auto h-9 text-xs bg-primary text-white font-bold px-4">
          <Plus className="w-3.5 h-3.5 mr-1" />Create Batch
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-xs text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />Loading batches…
        </div>
      ) : batches.length === 0 ? (
        <Card className="border border-border bg-card">
          <CardContent className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">No batches yet.</p>
            <Button type="button" size="sm" onClick={onCreateBatch} className="h-8 text-xs bg-primary text-white font-bold">
              <Plus className="w-3.5 h-3.5 mr-1" />Create First Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Click any batch to expand and assign students.</p>
          {batches.map(batch => (
            <BatchRow key={batch.id} batch={batch} role={role} />
          ))}
          <Card className="border border-border bg-card empty:hidden">
            <PaginationFooter page={page} totalPages={Math.ceil(total / PAGE_LIMIT)} total={total} onPageChange={setPage} label="batches" />
          </Card>
        </div>
      )}
    </div>
  );
}
