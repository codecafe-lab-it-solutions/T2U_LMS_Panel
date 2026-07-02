import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, Plus, Loader2, CheckCircle2, FileText, ExternalLink,
  AlertCircle, Trash2, Calendar, BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getStoredToken } from '../../services/api';

type Tab = 'assignments' | 'submissions';

export default function AdminAssignments() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('submissions');

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['admin-courses-list'],
    queryFn: () => api.courses.list(),
    enabled: !!getStoredToken(),
  });

  const { data: pendingSubmissions = [], isLoading: loadingSubs } = useQuery<any[]>({
    queryKey: ['admin-pending-submissions'],
    queryFn: () => api.assignments.submissions('pending'),
    enabled: !!getStoredToken(),
  });

  const { data: allAssignments = [], isLoading: loadingAssignments } = useQuery<any[]>({
    queryKey: ['admin-all-assignments'],
    queryFn: () => api.assignments.list(),
    enabled: !!getStoredToken(),
  });

  // ── Grade submission ───────────────────────────────────────────────────────
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

  // ── Delete assignment ──────────────────────────────────────────────────────
  const deleteAssignment = useMutation({
    mutationFn: (id: string) => api.assignments.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-all-assignments'] }),
  });

  // ── Create assignment ──────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newCourseId, setNewCourseId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMaxScore, setNewMaxScore] = useState('100');

  const resetForm = () => { setNewTitle(''); setNewDesc(''); setNewDueDate(''); setNewMaxScore('100'); setNewCourseId(''); };

  const createMutation = useMutation({
    mutationFn: () => api.assignments.create({
      course_id: newCourseId,
      title: newTitle,
      description: newDesc,
      due_date: newDueDate,
      max_score: parseInt(newMaxScore),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-assignments'] });
      setShowCreate(false);
      resetForm();
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Assignments</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Create assignments and grade student submissions</p>
        </div>
        <Button type="button" size="sm" onClick={() => setShowCreate(true)}
          className="h-9 text-xs bg-primary text-white font-bold px-5">
          <Plus className="w-3.5 h-3.5 mr-1.5" />Create Assignment
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border border-border bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Total Assignments</p>
            <p className="text-2xl font-extrabold text-foreground font-mono">{allAssignments.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Pending to Grade</p>
            <p className="text-2xl font-extrabold text-amber-500 font-mono">{pendingSubmissions.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card sm:col-span-1 col-span-2">
          <CardContent className="p-4 space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Courses with Assignments</p>
            <p className="text-2xl font-extrabold text-primary font-mono">
              {new Set(allAssignments.map((a: any) => a.course_id)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/40">
        {([['submissions', 'Pending Submissions', pendingSubmissions.length], ['assignments', 'All Assignments', allAssignments.length]] as const).map(([id, label, count]) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {label}
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-primary text-white' : 'bg-muted/60 text-muted-foreground'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── Pending Submissions tab ──────────────────────────────────────────── */}
      {activeTab === 'submissions' && (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-500" />
              Pending Submissions ({loadingSubs ? '…' : pendingSubmissions.length})
            </CardTitle>
            <CardDescription className="text-xs">Review and grade student assignment submissions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSubs ? (
              <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />Loading submissions…
              </div>
            ) : pendingSubmissions.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-semibold">No pending submissions</p>
                <p className="text-xs text-muted-foreground">All caught up! New submissions will appear here.</p>
              </div>
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
                      <tr key={sub.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground">{sub.student?.full_name ?? '—'}</p>
                          <p className="text-[9px] text-muted-foreground font-mono">{sub.student?.email}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{sub.assignment?.title ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-[10px]">{sub.assignment?.course?.title ?? '—'}</td>
                        <td className="px-4 py-3">
                          {sub.file_url ? (
                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                              className="text-primary font-semibold text-[10px] flex items-center gap-1 hover:underline">
                              <FileText className="w-3 h-3" /><ExternalLink className="w-3 h-3" />View
                            </a>
                          ) : <span className="text-muted-foreground text-[10px]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-[10px]">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {gradeFor === sub.id ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <input value={gradeInput} onChange={e => setGradeInput(e.target.value)}
                                placeholder="Grade" className="h-7 w-16 px-2 rounded border border-border bg-muted/20 text-xs font-mono" />
                              <input value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)}
                                placeholder="Feedback…" className="h-7 w-28 px-2 rounded border border-border bg-muted/20 text-xs" />
                              <Button size="sm" type="button"
                                onClick={() => gradeMutation.mutate({ id: sub.id, grade: gradeInput, feedback: gradeFeedback })}
                                disabled={gradeMutation.isPending}
                                className="h-7 text-[9px] font-bold px-2 bg-emerald-500 text-white">
                                <CheckCircle2 className="w-3 h-3 mr-0.5" />Save
                              </Button>
                              <Button size="sm" type="button" variant="outline" onClick={() => setGradeFor(null)}
                                className="h-7 text-[9px] border-border px-2">Cancel</Button>
                            </div>
                          ) : (
                            <Button size="sm" type="button"
                              onClick={() => { setGradeFor(sub.id); setGradeInput('A+'); setGradeFeedback(''); }}
                              className="h-6 text-[9px] font-bold px-3 bg-primary text-white">Grade</Button>
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
      )}

      {/* ── All Assignments tab ──────────────────────────────────────────────── */}
      {activeTab === 'assignments' && (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              All Assignments ({loadingAssignments ? '…' : allAssignments.length})
            </CardTitle>
            <CardDescription className="text-xs">All assignments created across courses</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAssignments ? (
              <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />Loading assignments…
              </div>
            ) : allAssignments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-semibold">No assignments yet</p>
                <Button type="button" size="sm" onClick={() => setShowCreate(true)}
                  className="h-8 text-xs bg-primary text-white font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" />Create First Assignment
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      {['Title', 'Course', 'Due Date', 'Max Score', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allAssignments.map((a: any) => (
                      <tr key={a.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground">{a.title}</p>
                          {a.description && <p className="text-[9px] text-muted-foreground truncate max-w-[200px]">{a.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{a.course?.title ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-muted-foreground font-mono text-[10px]">
                            <Calendar className="w-3 h-3" />
                            {a.due_date ? new Date(a.due_date).toLocaleDateString('en-IN') : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-foreground">{a.max_score ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" type="button"
                            onClick={() => { if (confirm(`Delete "${a.title}"?`)) deleteAssignment.mutate(a.id); }}
                            disabled={deleteAssignment.isPending}
                            className="h-6 text-[9px] font-bold px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Create Assignment Modal ──────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase text-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />Create Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Course *</Label>
                  <select required aria-label="Select course" value={newCourseId} onChange={e => setNewCourseId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none">
                    <option value="">Select course…</option>
                    {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Title *</Label>
                  <Input required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Week 3 Project Report" className="h-9 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Description</Label>
                  <textarea rows={2} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    placeholder="Describe the assignment task…"
                    className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Due Date *</Label>
                    <Input required type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Max Score</Label>
                    <Input type="number" min="1" value={newMaxScore} onChange={e => setNewMaxScore(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono" />
                  </div>
                </div>
                {createMutation.isError && (
                  <p className="text-[10px] text-red-500 font-semibold">
                    {(createMutation.error as Error)?.message ?? 'Failed to create assignment'}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}
                    className="text-xs font-semibold h-9 border-border">Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}
                    className="bg-primary text-xs font-bold px-6 h-9 text-white">
                    {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Assignment'}
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
