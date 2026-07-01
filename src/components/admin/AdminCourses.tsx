import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Trash2, Eye, EyeOff, CheckCircle2, Loader2, ClipboardList, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '../../store/useAppStore';
import { api, getStoredToken } from '../../services/api';
import { useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

async function authFetch(path: string, opts: RequestInit = {}) {
  const token = getStoredToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
  return res.json();
}

export default function AdminCourses() {
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const setActiveCourseId = useAppStore(s => s.setActiveCourseId);
  const qc = useQueryClient();

  // ── Courses ────────────────────────────────────────────────────────────────
  const { data: apiCourses = [], isLoading: loadingCourses } = useQuery<any[]>({
    queryKey: ['admin-courses'],
    queryFn: () => authFetch('/courses').then((r: any) => r.courses ?? r),
    enabled: !!getStoredToken(),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      authFetch(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify({ status: status === 'published' ? 'draft' : 'published' }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }),
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) => authFetch(`/courses/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }),
  });

  // ── Assignments & Submissions ───────────────────────────────────────────────
  const { data: pendingSubmissions = [], isLoading: loadingSubs } = useQuery<any[]>({
    queryKey: ['admin-pending-submissions'],
    queryFn: () => api.assignments.submissions('pending'),
    enabled: !!getStoredToken(),
  });

  const [gradeFor, setGradeFor] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('A+');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const gradeMutation = useMutation({
    mutationFn: ({ id, grade, feedback }: { id: string; grade: string; feedback: string }) =>
      api.assignments.grade(id, grade, feedback),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-submissions'] });
      setGradeFor(null);
    },
  });

  // ── Create Assignment ───────────────────────────────────────────────────────
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMaxScore, setNewMaxScore] = useState('100');
  const [newCourseId, setNewCourseId] = useState('');

  const createAssignmentMutation = useMutation({
    mutationFn: () => api.assignments.create({
      course_id: newCourseId,
      title: newTitle,
      description: newDesc,
      due_date: newDueDate,
      max_score: parseInt(newMaxScore),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-submissions'] });
      setShowCreateAssignment(false);
      setNewTitle(''); setNewDesc(''); setNewDueDate(''); setNewMaxScore('100'); setNewCourseId('');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Course Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage all platform courses, chapters, and lessons</p>
      </div>

      {/* ── Courses Table ──────────────────────────────────────────────────────── */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              All Courses ({loadingCourses ? '…' : apiCourses.length})
            </CardTitle>
            <CardDescription className="text-xs">Publish/unpublish courses and manage content</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => setActiveTab('admin-batch-manage')}
              className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" />Manage Batches
            </Button>
            <Button type="button" size="sm" onClick={() => setActiveTab('admin-quiz-create')}
              className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" />Create Quiz
            </Button>
            <Button type="button" size="sm" onClick={() => setActiveTab('admin-course-create')}
              className="h-8 text-xs bg-primary text-white font-bold">
              <Plus className="w-3.5 h-3.5 mr-1" />Create Course
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingCourses ? (
            <div className="p-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />Loading courses…
            </div>
          ) : apiCourses.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">No courses yet.</p>
              <Button type="button" size="sm" onClick={() => setActiveTab('admin-course-create')}
                className="h-8 text-xs bg-primary text-white font-bold">
                <Plus className="w-3.5 h-3.5 mr-1" />Create First Course
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Course', 'Category', 'Instructor', 'Status', 'Featured', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apiCourses.map((c: any) => (
                    <tr key={c.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors cursor-pointer group"
                      onClick={() => { setActiveCourseId(c.id); setActiveTab('admin-course-detail'); }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.thumbnail_url && (
                            <img src={c.thumbnail_url} alt={c.title} className="w-10 h-7 rounded object-cover shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-foreground max-w-[160px] truncate group-hover:text-primary transition-colors">{c.title}</p>
                            {c.short_desc && <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{c.short_desc}</p>}
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.category && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{c.category}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.instructor?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.status === 'published' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.is_featured ? (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">Featured</span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1.5">
                          <Button size="sm" type="button"
                            onClick={() => togglePublish.mutate({ id: c.id, status: c.status })}
                            disabled={togglePublish.isPending}
                            className={`h-6 text-[9px] font-bold px-2 ${c.status === 'published' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'}`}>
                            {c.status === 'published' ? <><EyeOff className="w-3 h-3 mr-1" />Unpublish</> : <><Eye className="w-3 h-3 mr-1" />Publish</>}
                          </Button>
                          <Button size="sm" type="button"
                            onClick={() => { if (confirm(`Delete "${c.title}"?`)) deleteCourse.mutate(c.id); }}
                            disabled={deleteCourse.isPending}
                            className="h-6 text-[9px] font-bold px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Assignment Management ─────────────────────────────────────────────── */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Pending Assignment Submissions ({loadingSubs ? '…' : pendingSubmissions.length})
            </CardTitle>
            <CardDescription className="text-xs">Grade student assignment submissions</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={() => setShowCreateAssignment(true)}
            className="h-8 text-xs bg-primary text-white font-bold">
            <Plus className="w-3.5 h-3.5 mr-1" />Create Assignment
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingSubs ? (
            <div className="p-8 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />Loading submissions…
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No pending submissions</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Student', 'Assignment', 'Course', 'File', 'Submitted', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingSubmissions.map((sub: any) => (
                    <tr key={sub.id} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="px-4 py-3">
                        <p className="font-bold text-foreground">{sub.student?.full_name ?? '—'}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{sub.student?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{sub.assignment?.title ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sub.assignment?.course?.title ?? '—'}</td>
                      <td className="px-4 py-3">
                        {sub.file_url ? (
                          <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                            className="text-primary font-mono text-[10px] flex items-center gap-1 hover:underline">
                            <FileText className="w-3 h-3" />
                            <ExternalLink className="w-3 h-3" />
                            View
                          </a>
                        ) : <span className="text-muted-foreground text-[10px]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-[10px]">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {gradeFor === sub.id ? (
                          <div className="flex items-center gap-2">
                            <input value={gradeInput} onChange={e => setGradeInput(e.target.value)}
                              placeholder="Grade" className="h-7 w-16 px-2 rounded border border-border bg-muted/20 text-xs font-mono" />
                            <input value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)}
                              placeholder="Feedback…" className="h-7 w-32 px-2 rounded border border-border bg-muted/20 text-xs" />
                            <Button size="sm" type="button"
                              onClick={() => gradeMutation.mutate({ id: sub.id, grade: gradeInput, feedback: gradeFeedback })}
                              disabled={gradeMutation.isPending}
                              className="h-7 text-[9px] font-bold px-2 bg-emerald-500 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" />Grade
                            </Button>
                            <Button size="sm" type="button" variant="outline" onClick={() => setGradeFor(null)}
                              className="h-7 text-[9px] border-border">Cancel</Button>
                          </div>
                        ) : (
                          <Button size="sm" type="button"
                            onClick={() => { setGradeFor(sub.id); setGradeInput('A+'); setGradeFeedback(''); }}
                            className="h-6 text-[9px] font-bold px-2 bg-primary text-white">Grade</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create Assignment Modal ───────────────────────────────────────────── */}
      {showCreateAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase text-foreground">Create Assignment</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form
                onSubmit={(e) => { e.preventDefault(); createAssignmentMutation.mutate(); }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Course</Label>
                  <select
                    required
                    aria-label="Select course"
                    value={newCourseId}
                    onChange={e => setNewCourseId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden"
                  >
                    <option value="">Select course…</option>
                    {apiCourses.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Title</Label>
                  <Input required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Week 3 Project Report" className="h-9 text-xs bg-muted/20 border-border" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Description</Label>
                  <textarea required rows={2} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    placeholder="Describe the assignment…"
                    className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Due Date</Label>
                    <Input required type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                      className="h-9 text-xs bg-muted/20 border-border font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Max Score</Label>
                    <Input type="number" min="1" value={newMaxScore} onChange={e => setNewMaxScore(e.target.value)}
                      className="h-9 text-xs bg-muted/20 border-border font-mono" />
                  </div>
                </div>
                {createAssignmentMutation.isError && (
                  <p className="text-[10px] text-red-500 font-medium">
                    {(createAssignmentMutation.error as Error)?.message ?? 'Failed to create assignment'}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateAssignment(false)}
                    className="text-xs font-semibold h-8 border-border">Cancel</Button>
                  <Button type="submit" disabled={createAssignmentMutation.isPending}
                    className="bg-primary text-xs font-bold px-5 h-8 text-white">
                    {createAssignmentMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
