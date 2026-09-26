import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Trash2, Eye, EyeOff, Loader2, ChevronRight, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginationFooter } from '@/components/ui/pagination-footer';
import { useAppStore } from '../../store/useAppStore';
import { getStoredToken, getMediaUrl } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';

const BASE = import.meta.env.VITE_API_URL as string;
const PAGE_LIMIT = 20;

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
  const perm = useEmployeePermission('admin-courses');
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const setActiveCourseId = useAppStore(s => s.setActiveCourseId);
  const qc = useQueryClient();

  // ── Courses ────────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const { data: coursesData, isLoading: loadingCourses } = useQuery<{ courses: any[]; total: number }>({
    queryKey: ['admin-courses', page],
    queryFn: () => authFetch(`/courses?all=1&page=${page}&limit=${PAGE_LIMIT}`),
    enabled: !!getStoredToken(),
  });
  const apiCourses = coursesData?.courses ?? [];
  const totalCourses = coursesData?.total ?? 0;

  const [actionError, setActionError] = useState('');

  const togglePublish = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      authFetch(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify({ status: status === 'published' ? 'draft' : 'published' }) }),
    onSuccess: (updated: any) => {
      setActionError('');
      // Show the new status right away, then refresh every view that caches this course
      // (edit form, detail page, bundle picker) so none of them holds the old status.
      qc.setQueryData<{ courses: any[]; total: number }>(['admin-courses', page], old =>
        old ? { ...old, courses: old.courses.map(c => (c.id === updated.id ? { ...c, status: updated.status, published_at: updated.published_at } : c)) } : old);
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      qc.invalidateQueries({ queryKey: ['course-edit', updated.id] });
      qc.invalidateQueries({ queryKey: ['course-detail', updated.id] });
      qc.invalidateQueries({ queryKey: ['admin-all-courses-for-bundles'] });
      qc.invalidateQueries({ queryKey: ['admin-course-bundles'] });
    },
    onError: (e: any) => setActionError(e?.message || 'Could not update the course status.'),
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) => authFetch(`/courses/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }),
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
              All Courses ({loadingCourses ? '…' : totalCourses})
            </CardTitle>
            <CardDescription className="text-xs">Publish/unpublish courses and manage content</CardDescription>
          </div>
          <div className="flex gap-2">
            {perm.edit && (
              <Button type="button" size="sm" onClick={() => setActiveTab('admin-batch-manage')}
                className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted font-semibold">
                <Plus className="w-3.5 h-3.5 mr-1" />Manage Batches
              </Button>
            )}
            {perm.create && (
              <Button type="button" size="sm" onClick={() => setActiveTab('admin-quiz-create')}
                className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted font-semibold">
                <Plus className="w-3.5 h-3.5 mr-1" />Create Quiz
              </Button>
            )}
            {perm.create && (
              <Button type="button" size="sm" onClick={() => { setActiveCourseId(null); setActiveTab('admin-course-create'); }}
                className="h-8 text-xs bg-primary text-white font-bold">
                <Plus className="w-3.5 h-3.5 mr-1" />Create Course
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {actionError && (
            <div className="m-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs px-3 py-2">{actionError}</div>
          )}
          {loadingCourses ? (
            <div className="p-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />Loading courses…
            </div>
          ) : apiCourses.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">No courses yet.</p>
              {perm.create && (
                <Button type="button" size="sm" onClick={() => { setActiveCourseId(null); setActiveTab('admin-course-create'); }}
                  className="h-8 text-xs bg-primary text-white font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" />Create First Course
                </Button>
              )}
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
                            <img src={getMediaUrl(c.thumbnail_url)} alt={c.title} className="w-10 h-7 rounded object-cover shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{c.title}</p>
                            {c.short_desc && <p className="text-[10px] text-muted-foreground max-w-[280px]">{c.short_desc}</p>}
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
                          {perm.edit && (
                            <Button size="sm" type="button"
                              onClick={() => { setActiveCourseId(c.id); setActiveTab('admin-course-create'); }}
                              className="h-6 text-[9px] font-bold px-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20">
                              <Edit2 className="w-3 h-3 mr-1" />Edit
                            </Button>
                          )}
                          {perm.edit && (
                            <Button size="sm" type="button"
                              onClick={() => togglePublish.mutate({ id: c.id, status: c.status })}
                              disabled={togglePublish.isPending && togglePublish.variables?.id === c.id}
                              className={`h-6 text-[9px] font-bold px-2 ${c.status === 'published' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'}`}>
                              {c.status === 'published' ? <><EyeOff className="w-3 h-3 mr-1" />Unpublish</> : <><Eye className="w-3 h-3 mr-1" />Publish</>}
                            </Button>
                          )}
                          {perm.delete && (
                            <Button size="sm" type="button"
                              onClick={() => { if (confirm(`Delete "${c.title}"?`)) deleteCourse.mutate(c.id); }}
                              disabled={deleteCourse.isPending}
                              className="h-6 text-[9px] font-bold px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <PaginationFooter page={page} totalPages={Math.ceil(totalCourses / PAGE_LIMIT)} total={totalCourses} onPageChange={setPage} label="courses" />
      </Card>

    </div>
  );
}
