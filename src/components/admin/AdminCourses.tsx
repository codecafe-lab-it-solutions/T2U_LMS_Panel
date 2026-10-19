import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Trash2, Eye, EyeOff, Loader2, ChevronRight, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginationFooter } from '@/components/ui/pagination-footer';
import { useAppStore } from '../../store/useAppStore';
import { getStoredToken, getMediaUrl } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';

import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '../../hooks/useDebounce';
import { useFilterParams } from '../../hooks/useFilterParams';
import { api } from '../../services/api';

const BASE = import.meta.env.VITE_API_URL as string;
const PAGE_LIMIT = 20;

const DEFAULT_COURSE_FILTERS = {
  search: '',
  status: '',
  category: '',
  instructor_id: '',
  page: 1,
};

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

  const { params: filterParams, setFilterParams, resetFilterParams } = useFilterParams(DEFAULT_COURSE_FILTERS);

  const [searchInput, setSearchInput] = useState(filterParams.search || '');
  const [statusFilter, setStatusFilter] = useState(filterParams.status || '');
  const [categoryFilter, setCategoryFilter] = useState(filterParams.category || '');
  const [instructorFilter, setInstructorFilter] = useState(filterParams.instructor_id || '');
  const [page, setPage] = useState(Number(filterParams.page) || 1);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Instructors list for dropdown filter
  const { data: instructors = [] } = useQuery<any[]>({
    queryKey: ['admin-instructors-picker'],
    queryFn: () => api.users.instructors(),
    staleTime: 60_000,
  });

  const updateFilters = (newValues: Partial<typeof DEFAULT_COURSE_FILTERS>) => {
    setFilterParams((prev) => ({
      ...prev,
      ...newValues,
    }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setCategoryFilter('');
    setInstructorFilter('');
    setPage(1);
    resetFilterParams();
  };

  // ── Courses ────────────────────────────────────────────────────────────────
  const { data: coursesData, isLoading: loadingCourses } = useQuery<{ courses: any[]; total: number }>({
    queryKey: ['admin-courses', debouncedSearch, statusFilter, categoryFilter, instructorFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ all: '1', page: String(page), limit: String(PAGE_LIMIT) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (instructorFilter) params.set('instructor_id', instructorFilter);
      return authFetch(`/courses?${params.toString()}`);
    },
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

          {/* Filters Bar */}
          <div className="p-3 border-b border-border/40 bg-muted/10 flex flex-wrap items-center gap-2.5">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
              <Input
                placeholder="Search course title, description..."
                value={searchInput}
                onChange={e => {
                  const val = e.target.value;
                  setSearchInput(val);
                  setPage(1);
                  updateFilters({ search: val, page: 1 });
                }}
                className="pl-9 h-8 text-xs bg-muted/20"
              />
            </div>

            {/* Status Filter */}
            <select
              title="Filter by Status"
              className="bg-muted/20 border border-border rounded-lg text-foreground px-2.5 h-8 text-xs font-semibold"
              value={statusFilter}
              onChange={e => {
                const val = e.target.value;
                setStatusFilter(val);
                setPage(1);
                updateFilters({ status: val, page: 1 });
              }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            {/* Category Filter */}
            <select
              title="Filter by Category"
              className="bg-muted/20 border border-border rounded-lg text-foreground px-2.5 h-8 text-xs font-semibold"
              value={categoryFilter}
              onChange={e => {
                const val = e.target.value;
                setCategoryFilter(val);
                setPage(1);
                updateFilters({ category: val, page: 1 });
              }}
            >
              <option value="">All Categories</option>
              <option value="Language">Language</option>
              <option value="Professional Skills">Professional Skills</option>
              <option value="AI Productivity">AI Productivity</option>
              <option value="Digital Growth">Digital Growth</option>
              <option value="Design & Visual Media">Design & Visual Media</option>
              <option value="AI-Assisted Fast Prototyping">AI Prototyping</option>
              <option value="Cross-Platform & Native">Mobile Dev</option>
              <option value="Modern Full-Stack Technologies">Full-Stack</option>
              <option value="Autonomous AI Agents & Workflows">Agentic AI</option>
              <option value="Digital Growth & Funnels">Affiliate Marketing</option>
            </select>

            {/* Assigned Instructor Filter */}
            <select
              title="Filter by Instructor"
              className="bg-muted/20 border border-border rounded-lg text-foreground px-2.5 h-8 text-xs font-semibold max-w-[180px]"
              value={instructorFilter}
              onChange={e => {
                const val = e.target.value;
                setInstructorFilter(val);
                setPage(1);
                updateFilters({ instructor_id: val, page: 1 });
              }}
            >
              <option value="">All Instructors</option>
              {instructors.map((inst: any) => (
                <option key={inst.id} value={inst.id}>
                  {inst.full_name}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            {(searchInput || statusFilter || categoryFilter || instructorFilter) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1 px-2.5"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            )}
          </div>

          {loadingCourses ? (
            <div className="p-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />Loading courses…
            </div>
          ) : apiCourses.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-bold text-foreground">No courses found matching your filters</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try clearing or adjusting your search term, status, category, or assigned instructor.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 text-xs font-semibold"
                >
                  Reset All Filters
                </Button>
                {perm.create && (
                  <Button type="button" size="sm" onClick={() => { setActiveCourseId(null); setActiveTab('admin-course-create'); }}
                    className="h-8 text-xs bg-primary text-white font-bold">
                    <Plus className="w-3.5 h-3.5 mr-1" />Create New Course
                  </Button>
                )}
              </div>
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
                            <img src={getMediaUrl(c.thumbnail_url)} alt={c.title} onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} className="w-10 h-7 rounded object-cover shrink-0" />
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
