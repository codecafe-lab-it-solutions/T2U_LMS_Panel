import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import {
  Search, GraduationCap, BookOpen, Users, Play, Plus,
  Loader2, BookMarked, CheckCircle2, Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';

type CoursesTab = 'enrolled' | 'all';
type EnrolledFilter = 'all' | 'ongoing' | 'completed' | 'not-started';

export default function StudentCourses() {
  const { authToken, setActiveCourseId } = useAppStore();
  const qc = useQueryClient();

  const [tab, setTab] = useState<CoursesTab>('enrolled');
  const [search, setSearch] = useState('');
  const [enrolledFilter, setEnrolledFilter] = useState<EnrolledFilter>('all');
  const [allCategoryFilter, setAllCategoryFilter] = useState('all');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [confirmCourse, setConfirmCourse] = useState<any | null>(null); // course pending enroll confirm

  const { data: enrollments = [], isLoading: loadingEnrolled } = useQuery({
    queryKey: ['enrolled-courses', authToken],
    queryFn: () => api.courses.enrolled(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: allCourses = [], isLoading: loadingAll } = useQuery<any[]>({
    queryKey: ['all-courses-browse'],
    queryFn: () => api.courses.list(),
    enabled: tab === 'all',
    staleTime: 120_000,
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => api.courses.enroll(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrolled-courses'] });
      qc.invalidateQueries({ queryKey: ['all-courses-browse'] });
      setEnrollingId(null);
    },
    onError: () => setEnrollingId(null),
  });

  const enrolledCourseIds = new Set(enrollments.map((e: any) => e.course_id));

  const enrolledFiltered = enrollments
    .filter((e: any) => {
      const pct = e.completion_percentage ?? 0;
      if (enrolledFilter === 'completed') return pct === 100;
      if (enrolledFilter === 'ongoing') return pct > 0 && pct < 100;
      if (enrolledFilter === 'not-started') return pct === 0;
      return true;
    })
    .filter((e: any) =>
      !search || e.course.title.toLowerCase().includes(search.toLowerCase())
    );

  const categories = [...new Set(allCourses.map((c: any) => c.category).filter(Boolean))] as string[];

  const allFiltered = allCourses
    .filter((c: any) => allCategoryFilter === 'all' || c.category === allCategoryFilter)
    .filter((c: any) =>
      !search || c.title.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pl-1">
        <GraduationCap className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground">My Courses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Continue enrolled courses or discover new ones.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border">
        {(['enrolled', 'all'] as CoursesTab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setSearch(''); }}
            className={`flex-1 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all ${
              tab === t
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'enrolled' ? (
              <span className="flex items-center justify-center gap-1.5">
                Enrolled Courses
                {enrollments.length > 0 && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                    tab === 'enrolled' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {enrollments.length}
                  </span>
                )}
              </span>
            ) : 'All Courses'}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder={tab === 'enrolled' ? 'Search enrolled courses…' : 'Search all courses…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-9 text-xs bg-muted/20"
        />
      </div>

      {/* Enrolled filters */}
      {tab === 'enrolled' && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
          {(['all', 'ongoing', 'completed', 'not-started'] as EnrolledFilter[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setEnrolledFilter(f)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                enrolledFilter === f
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
              }`}
            >
              {f === 'not-started' ? 'Not Started' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* All courses category filter */}
      {tab === 'all' && categories.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
          <button
            type="button"
            onClick={() => setAllCategoryFilter('all')}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
              allCategoryFilter === 'all'
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setAllCategoryFilter(cat)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                allCategoryFilter === cat
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* === ENROLLED TAB === */}
      {tab === 'enrolled' && (
        loadingEnrolled ? (
          <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your courses…
          </div>
        ) : enrolledFiltered.length === 0 ? (
          <div className="text-center py-16 border border-border rounded-2xl bg-card">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">No courses found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              {enrollments.length === 0
                ? 'You haven\'t enrolled in any courses yet. Browse "All Courses" to get started.'
                : 'No enrolled courses match your current filter.'}
            </p>
            {enrollments.length === 0 && (
              <Button
                onClick={() => setTab('all')}
                className="mt-4 text-xs font-bold h-8 bg-primary text-primary-foreground"
              >
                Browse All Courses
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrolledFiltered.map((e: any) => {
              const pct = e.completion_percentage ?? 0;
              const course = e.course;
              const statusLabel = pct === 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started';
              const statusColor =
                pct === 100 ? 'text-emerald-500' : pct > 0 ? 'text-primary' : 'text-muted-foreground';

              return (
                <Card
                  key={e.id}
                  className="group border border-border bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col"
                >
                  <div className="relative h-40 w-full overflow-hidden shrink-0">
                    <img
                      src={
                        course.thumbnail_url ??
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'
                      }
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    {course.category && (
                      <span className="absolute top-3 left-3 bg-[#07020d]/80 backdrop-blur-md text-[#f1edfa] font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-border/60">
                        {course.category}
                      </span>
                    )}
                    {pct === 100 && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-600/90 backdrop-blur-md text-white text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        DONE
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                        {course.title}
                      </h4>
                    </div>
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <BookMarked className="w-3 h-3" />
                        {course.modules?.length ?? 0} modules
                      </span>
                      <span className={`font-bold ${statusColor}`}>{statusLabel}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-bold text-foreground">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5 bg-muted-foreground/10" />
                    </div>

                    <Button
                      onClick={() => setActiveCourseId(course.id)}
                      className="w-full text-xs font-bold h-8 mt-auto bg-secondary hover:bg-muted text-primary hover:text-primary border border-border"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {pct > 0 ? 'Continue Learning' : 'Start Course'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* === ALL COURSES TAB === */}
      {tab === 'all' && (
        loadingAll ? (
          <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading courses…
          </div>
        ) : allFiltered.length === 0 ? (
          <div className="text-center py-16 border border-border rounded-2xl bg-card">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">No courses found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different search term or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {allFiltered.map((course: any) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const isEnrolling = enrollingId === course.id && enrollMutation.isPending;

              return (
                <Card
                  key={course.id}
                  className="group border border-border bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col"
                >
                  <div className="relative h-40 w-full overflow-hidden shrink-0">
                    <img
                      src={
                        course.thumbnail_url ??
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'
                      }
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    {course.category && (
                      <span className="absolute top-3 left-3 bg-[#07020d]/80 backdrop-blur-md text-[#f1edfa] font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-border/60">
                        {course.category}
                      </span>
                    )}
                    {isEnrolled && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-600/90 backdrop-blur-md text-white text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        ENROLLED
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                        {course.title}
                      </h4>
                    </div>
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {course._count?.enrollments ?? 0} enrolled
                      </span>
                      <span className="flex items-center gap-1">
                        <BookMarked className="w-3 h-3" />
                        {course.modules?.length ?? 0} modules
                      </span>
                    </div>

                    {course.instructor?.full_name && (
                      <p className="text-[10px] text-muted-foreground">
                        by {course.instructor.full_name}
                      </p>
                    )}

                    {isEnrolled ? (
                      <Button
                        onClick={() => setActiveCourseId(course.id)}
                        className="w-full text-xs font-bold h-8 mt-auto bg-secondary hover:bg-muted text-primary hover:text-primary border border-border"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Continue Learning
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setConfirmCourse(course)}
                        disabled={isEnrolling}
                        className="w-full text-xs font-bold h-8 mt-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isEnrolling ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Enrolling…
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3 mr-1" />
                            Enroll Now
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ── Enrollment Confirmation Dialog ──────────────────────────── */}
      <Dialog open={!!confirmCourse} onOpenChange={open => { if (!open) setConfirmCourse(null); }}>
        <DialogContent className="max-w-sm border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Confirm Enrollment</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to enroll in this course?
            </DialogDescription>
          </DialogHeader>

          {confirmCourse && (
            <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 my-1">
              <img
                src={confirmCourse.thumbnail_url ?? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120'}
                alt={confirmCourse.title}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground line-clamp-2">{confirmCourse.title}</p>
                {confirmCourse.instructor?.full_name && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">by {confirmCourse.instructor.full_name}</p>
                )}
                {confirmCourse.category && (
                  <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                    {confirmCourse.category}
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmCourse(null)}
              className="text-xs font-semibold h-8.5 border-border flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!confirmCourse) return;
                setEnrollingId(confirmCourse.id);
                setConfirmCourse(null);
                enrollMutation.mutate(confirmCourse.id);
              }}
              disabled={enrollMutation.isPending}
              className="text-xs font-bold h-8.5 bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
            >
              {enrollMutation.isPending ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Enrolling…</>
              ) : (
                'Yes, Enroll Me'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
