import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, BookOpen, Layers, HelpCircle, ClipboardList, Plus, Eye, EyeOff,
  Loader2, CheckCircle2, Users, Tag, Clock, Star, FileText, ExternalLink, Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getStoredToken } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

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

type Tab = 'overview' | 'modules' | 'quizzes' | 'assignments';

interface CourseDetailPageProps {
  courseId: string;
  onBack: () => void;
  onCreateQuiz?: (courseId: string) => void;
  onCreateBatch?: () => void;
  role?: 'admin' | 'instructor';
}

export default function CourseDetailPage({ courseId, onBack, onCreateQuiz, role = 'admin' }: CourseDetailPageProps) {
  const qc = useQueryClient();
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const [activeTab, setTab] = useState<Tab>('overview');

  // ── Course data ─────────────────────────────────────────────────────────────
  const { data: course, isLoading } = useQuery<any>({
    queryKey: ['course-detail', courseId],
    queryFn: () => authFetch(`/courses/${courseId}`),
    enabled: !!courseId && !!getStoredToken(),
  });

  const { data: modules = [] } = useQuery<any[]>({
    queryKey: ['course-modules', courseId],
    queryFn: () => api.courses.modules.list(courseId),
    enabled: !!courseId && !!getStoredToken(),
  });

  const { data: quizzes = [] } = useQuery<any[]>({
    queryKey: ['course-quizzes', courseId],
    queryFn: () => api.quizzes.list({ course_id: courseId }),
    enabled: !!courseId && !!getStoredToken(),
  });

  // ── Assignments ─────────────────────────────────────────────────────────────
  const { data: allSubmissions = [] } = useQuery<any[]>({
    queryKey: ['admin-pending-submissions'],
    queryFn: () => api.assignments.submissions(),
    enabled: !!getStoredToken(),
  });
  const courseSubmissions = allSubmissions.filter(s => s.assignment?.course?.id === courseId || s.assignment?.course_id === courseId);

  // ── Toggle publish ──────────────────────────────────────────────────────────
  const togglePublish = useMutation({
    mutationFn: () => authFetch(`/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: course?.status === 'published' ? 'draft' : 'published' }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-detail', courseId] });
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  // ── Create Assignment inline ─────────────────────────────────────────────────
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [aTitle, setATitle] = useState('');
  const [aDesc, setADesc] = useState('');
  const [aDue, setADue] = useState('');
  const [aMax, setAMax] = useState('100');

  const createAssign = useMutation({
    mutationFn: () => api.assignments.create({ course_id: courseId, title: aTitle, description: aDesc, due_date: aDue, max_score: parseInt(aMax) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-submissions'] });
      setShowAssignForm(false);
      setATitle(''); setADesc(''); setADue(''); setAMax('100');
    },
  });

  // ── Grade submission ─────────────────────────────────────────────────────────
  const [gradeFor, setGradeFor] = useState<string | null>(null);
  const [gradeVal, setGradeVal] = useState('A+');
  const [gradeFb, setGradeFb] = useState('');
  const gradeMut = useMutation({
    mutationFn: ({ id, grade, feedback }: any) => api.assignments.grade(id, grade, feedback),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pending-submissions'] }); setGradeFor(null); },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 text-xs text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />Loading course…
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Course not found. <button type="button" onClick={onBack} className="text-primary underline">Go back</button>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: BookOpen },
    { key: 'modules', label: `Modules`, icon: Layers, count: modules.length },
    { key: 'quizzes', label: 'Quizzes', icon: HelpCircle, count: quizzes.length },
    { key: 'assignments', label: 'Assignments', icon: ClipboardList, count: courseSubmissions.length },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <button type="button" onClick={onBack} title="Back"
          className="mt-1 w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-foreground leading-tight">{course.title}</h1>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${course.status === 'published' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
              {course.status}
            </span>
            {course.is_featured && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-amber-400 bg-amber-500/10 flex items-center gap-1">
                <Star className="w-2.5 h-2.5" />Featured
              </span>
            )}
          </div>
          {course.category && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{course.category}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" size="sm"
            onClick={() => togglePublish.mutate()}
            disabled={togglePublish.isPending}
            className={`h-8 text-xs font-bold ${course.status === 'published' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'}`}>
            {course.status === 'published' ? <><EyeOff className="w-3.5 h-3.5 mr-1" />Unpublish</> : <><Eye className="w-3.5 h-3.5 mr-1" />Publish</>}
          </Button>
          <Button type="button" size="sm"
            onClick={() => {
              const tab = role === 'admin' ? 'admin-quiz-create' : 'instructor-quiz-create';
              setActiveTab(tab as any);
            }}
            className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted font-semibold">
            <Plus className="w-3.5 h-3.5 mr-1" />Create Quiz
          </Button>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 border-b border-border/40 pb-0">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${activeTab === t.key ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== undefined && <span className="text-[9px] font-black bg-muted/60 px-1.5 py-0.5 rounded-full">{t.count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Overview ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {course.thumbnail_url && (
              <div className="rounded-2xl overflow-hidden border border-border/50 max-h-52 w-full object-cover">
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-52 object-cover" />
              </div>
            )}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-xs font-bold">Course Description</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {course.description ? (
                  <div
                    className="text-sm text-foreground leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-1.5 [&_h3]:text-xs [&_h3]:font-bold [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1.5 [&_p]:mb-2 [&_strong]:font-bold [&_li]:mb-0.5"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No description provided.</p>
                )}
                {course.short_desc && (
                  <p className="mt-2 text-xs text-muted-foreground">{course.short_desc}</p>
                )}
                {course.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    {course.tags.map((t: string) => (
                      <span key={t} className="text-[10px] font-semibold bg-muted/40 px-2 py-0.5 rounded-full text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar stats */}
          <div className="space-y-4">
            <Card className="border border-border bg-card">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Instructor</span>
                    <span className="font-bold text-foreground">{course.instructor?.full_name ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />Modules</span>
                    <span className="font-bold text-foreground">{modules.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Enrollments</span>
                    <span className="font-bold text-foreground">{course._count?.enrollments ?? 0}</span>
                  </div>
                  {course.duration_hrs && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Duration</span>
                      <span className="font-bold text-foreground">{course.duration_hrs} hrs</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" />Quizzes</span>
                    <span className="font-bold text-foreground">{quizzes.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" />Submissions</span>
                    <span className="font-bold text-foreground">{courseSubmissions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {course.published_at && (
              <div className="text-[10px] text-muted-foreground text-center">
                Published {new Date(course.published_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modules ────────────────────────────────────────────────────────────── */}
      {activeTab === 'modules' && (
        <div className="space-y-3">
          {modules.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No modules yet.</div>
          ) : modules.map((mod: any, i: number) => (
            <Card key={mod.id} className="border border-border bg-card">
              <div className="flex items-start gap-3 p-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[11px] font-black text-primary">
                  M{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{mod.title}</p>
                  {mod.description && <p className="text-[11px] text-muted-foreground mt-0.5">{mod.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    {mod.lessons?.length > 0 && (
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}</span>
                    )}
                    {mod.quizzes?.length > 0 && (
                      <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" />{mod.quizzes.length} quiz</span>
                    )}
                  </div>
                  {/* Lessons list */}
                  {mod.lessons?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {mod.lessons.map((l: any, li: number) => (
                        <div key={l.id} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="w-4 h-4 rounded bg-muted/40 flex items-center justify-center text-[9px] font-bold">{li + 1}</span>
                          <span className="truncate">{l.title}</span>
                          <span className="text-[9px] font-semibold bg-muted/40 px-1.5 py-0.5 rounded ml-auto">{l.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Quizzes ────────────────────────────────────────────────────────────── */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" size="sm"
              onClick={() => setActiveTab(role === 'admin' ? 'admin-quiz-create' : 'instructor-quiz-create' as any)}
              className="h-8 text-xs bg-primary text-white font-bold">
              <Plus className="w-3.5 h-3.5 mr-1" />Create Quiz for This Course
            </Button>
          </div>
          {quizzes.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No quizzes yet for this course.</div>
          ) : quizzes.map((q: any) => (
            <Card key={q.id} className="border border-border bg-card">
              <div className="flex items-center gap-3 p-4">
                <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{q.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>{q._count?.questions ?? q.questions?.length ?? 0} questions</span>
                    <span>{q.total_marks} marks</span>
                    <span>Pass: {q.passing_score}%</span>
                    {q.time_limit_mins && <span>{q.time_limit_mins} min limit</span>}
                    {q.is_final_assessment && <span className="text-amber-400 font-bold">Final Assessment</span>}
                  </div>
                  {q.exam_date && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Exam: {new Date(q.exam_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${q.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
                  {q.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Assignments ─────────────────────────────────────────────────────────── */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => setShowAssignForm(v => !v)}
              className="h-8 text-xs bg-primary text-white font-bold">
              <Plus className="w-3.5 h-3.5 mr-1" />{showAssignForm ? 'Cancel' : 'Create Assignment'}
            </Button>
          </div>

          {showAssignForm && (
            <Card className="border border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <form onSubmit={e => { e.preventDefault(); createAssign.mutate(); }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Title *</Label>
                      <Input required value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="Assignment title" className="h-8 text-xs bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Max Score</Label>
                      <Input type="number" min={1} value={aMax} onChange={e => setAMax(e.target.value)} className="h-8 text-xs bg-background font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description *</Label>
                    <textarea required rows={2} value={aDesc} onChange={e => setADesc(e.target.value)} placeholder="Describe the assignment…"
                      className="w-full p-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none resize-none" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Due Date *</Label>
                    <Input required type="date" value={aDue} onChange={e => setADue(e.target.value)} className="h-8 text-xs bg-background font-mono" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAssignForm(false)} className="h-7 text-xs border-border">Cancel</Button>
                    <Button type="submit" disabled={createAssign.isPending} className="h-7 text-xs bg-primary text-white font-bold px-4">
                      {createAssign.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {courseSubmissions.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No submissions for this course yet.</div>
          ) : (
            <Card className="border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      {['Student', 'Assignment', 'File', 'Submitted', 'Grade', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courseSubmissions.map((sub: any) => (
                      <tr key={sub.id} className="border-b border-border/20 hover:bg-muted/10">
                        <td className="px-4 py-3">
                          <p className="font-bold">{sub.student?.full_name ?? '—'}</p>
                          <p className="text-[9px] text-muted-foreground font-mono">{sub.student?.email}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold">{sub.assignment?.title ?? '—'}</td>
                        <td className="px-4 py-3">
                          {sub.file_url ? (
                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                              className="text-primary flex items-center gap-1 hover:underline">
                              <ExternalLink className="w-3 h-3" />View
                            </a>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-[10px]">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {sub.grade ? (
                            <span className="text-emerald-400 font-bold">{sub.grade}</span>
                          ) : (
                            <span className="text-muted-foreground text-[9px]">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!sub.grade && (
                            gradeFor === sub.id ? (
                              <div className="flex items-center gap-1.5">
                                <input value={gradeVal} onChange={e => setGradeVal(e.target.value)}
                                  className="h-6 w-14 px-1.5 rounded border border-border bg-muted/20 text-xs font-mono" />
                                <input value={gradeFb} onChange={e => setGradeFb(e.target.value)}
                                  placeholder="Feedback" className="h-6 w-24 px-1.5 rounded border border-border bg-muted/20 text-xs" />
                                <Button size="sm" type="button"
                                  onClick={() => gradeMut.mutate({ id: sub.id, grade: gradeVal, feedback: gradeFb })}
                                  disabled={gradeMut.isPending}
                                  className="h-6 text-[9px] font-bold px-2 bg-emerald-500 text-white">
                                  <CheckCircle2 className="w-3 h-3" />
                                </Button>
                                <Button size="sm" type="button" variant="outline" onClick={() => setGradeFor(null)} className="h-6 text-[9px] border-border">✕</Button>
                              </div>
                            ) : (
                              <Button size="sm" type="button"
                                onClick={() => { setGradeFor(sub.id); setGradeVal('A+'); setGradeFb(''); }}
                                className="h-6 text-[9px] font-bold px-2 bg-primary text-white">Grade</Button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
