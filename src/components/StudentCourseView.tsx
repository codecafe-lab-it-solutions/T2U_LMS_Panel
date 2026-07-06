import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import {
  ArrowLeft, BookOpen, Layers, HelpCircle, ClipboardList,
  CheckCircle2, Lock, Play, FileText, File, ChevronDown, ChevronRight,
  Clock, Award, Loader2, CheckCheck, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type Tab = 'overview' | 'modules' | 'quizzes' | 'assignments';

const LESSON_TYPE_ICON: Record<string, React.ReactNode> = {
  video:      <Play className="w-3.5 h-3.5 text-violet-500" />,
  pdf:        <File className="w-3.5 h-3.5 text-red-400" />,
  text:       <FileText className="w-3.5 h-3.5 text-blue-400" />,
  assignment: <ClipboardList className="w-3.5 h-3.5 text-amber-400" />,
};

export default function StudentCourseView({
  enrollment,
  onBack,
}: {
  enrollment: any;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const { setActiveQuizId, setActiveTab } = useAppStore();
  const [tab, setTabState] = useState<Tab>('modules');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const course = enrollment.course;
  const modules: any[] = course.modules ?? [];
  const lessonProgressMap = new Map<string, boolean>(
    enrollment.lesson_progress.map((lp: any) => [lp.lesson_id, lp.completed])
  );

  // Flat ordered list of all lessons across all modules
  const allLessons: Array<{ lesson: any; moduleId: string; globalIdx: number }> = [];
  modules.forEach((mod: any) => {
    (mod.lessons ?? []).forEach((lesson: any) => {
      allLessons.push({ lesson, moduleId: mod.id, globalIdx: allLessons.length });
    });
  });

  function isLessonUnlocked(globalIdx: number): boolean {
    if (globalIdx === 0) return true;
    const prev = allLessons[globalIdx - 1];
    return lessonProgressMap.get(prev.lesson.id) === true;
  }

  function isLessonCompleted(lessonId: string): boolean {
    return lessonProgressMap.get(lessonId) === true;
  }

  const activeLesson = allLessons.find(l => l.lesson.id === activeLessonId);

  const markCompleteMutation = useMutation({
    mutationFn: (lessonId: string) => api.courses.markLessonComplete(course.id, lessonId),
    onMutate: (lessonId) => setMarkingId(lessonId),
    onSuccess: (_, lessonId) => {
      qc.invalidateQueries({ queryKey: ['enrolled-courses'] });
      // Optimistically mark as complete and move to next
      lessonProgressMap.set(lessonId, true);
      const cur = allLessons.find(l => l.lesson.id === lessonId);
      if (cur && cur.globalIdx < allLessons.length - 1) {
        const next = allLessons[cur.globalIdx + 1];
        setActiveLessonId(next.lesson.id);
        setExpandedModules(prev => new Set([...prev, next.moduleId]));
      }
      setMarkingId(null);
    },
    onError: () => setMarkingId(null),
  });

  function openLesson(lesson: any, moduleId: string, globalIdx: number) {
    if (!isLessonUnlocked(globalIdx)) return;
    setActiveLessonId(lesson.id);
    setExpandedModules(prev => new Set([...prev, moduleId]));
  }

  function toggleModule(moduleId: string) {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  }

  const completionPct = enrollment.completion_percentage ?? 0;
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter(l => isLessonCompleted(l.lesson.id)).length;

  const TABS: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview',     label: 'Overview',     icon: BookOpen },
    { key: 'modules',      label: 'Modules',      icon: Layers,        count: modules.length },
    { key: 'quizzes',      label: 'Quizzes',      icon: HelpCircle,    count: course.quizzes?.length ?? 0 },
    { key: 'assignments',  label: 'Assignments',  icon: ClipboardList, count: course.assignments?.length ?? 0 },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Catalog
        </button>
        <span className="text-[10px] text-muted-foreground font-mono hidden sm:block">
          Instructor: {course.instructor?.full_name ?? '—'}
        </span>
      </div>

      {/* ── Course banner ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {course.thumbnail_url && (
          <div className="h-36 w-full overflow-hidden">
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5 flex flex-col md:flex-row gap-5 md:items-center justify-between">
          <div className="space-y-1">
            {course.category && (
              <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                {course.category}
              </span>
            )}
            <h1 className="text-lg font-black text-foreground">{course.title}</h1>
          </div>
          <div className="md:w-56 shrink-0 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-bold text-foreground">{completedCount}/{totalLessons} lessons</span>
            </div>
            <Progress value={completionPct} className="h-2 bg-muted/30" />
            <p className="text-[10px] text-muted-foreground text-right">{completionPct}% complete</p>
          </div>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border/50 pb-0">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} type="button" onClick={() => { setTabState(t.key); setActiveLessonId(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== undefined && (
                <span className="text-[9px] font-black bg-muted/60 px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* OVERVIEW TAB                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
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
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="border border-border bg-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Instructor</span><span className="font-bold">{course.instructor?.full_name ?? '—'}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Modules</span><span className="font-bold">{modules.length}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total Lessons</span><span className="font-bold">{totalLessons}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Completed</span><span className="font-bold text-emerald-500">{completedCount}</span></div>
                {course.duration_hrs && (
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Duration</span><span className="font-bold">{course.duration_hrs}h</span></div>
                )}
              </CardContent>
            </Card>
            {completionPct === 100 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-xs font-bold text-emerald-500">Course completed! Well done.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODULES TAB                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'modules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Module / Lesson sidebar */}
          <div className="lg:col-span-4 space-y-2">
            {modules.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-xs">No modules yet.</div>
            )}
            {modules.map((mod: any, mIdx: number) => {
              const modLessons: any[] = mod.lessons ?? [];
              const modCompletedCount = modLessons.filter(l => isLessonCompleted(l.id)).length;
              const isExpanded = expandedModules.has(mod.id);

              return (
                <div key={mod.id} className="rounded-xl border border-border overflow-hidden">
                  {/* Module header */}
                  <button
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono shrink-0">
                        M{mIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-foreground truncate">{mod.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] text-muted-foreground font-mono">{modCompletedCount}/{modLessons.length}</span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Lessons list */}
                  {isExpanded && (
                    <div className="divide-y divide-border/40 bg-card">
                      {modLessons.length === 0 && (
                        <p className="px-4 py-3 text-xs text-muted-foreground">No lessons in this module.</p>
                      )}
                      {modLessons.map((lesson: any) => {
                        const entry = allLessons.find(l => l.lesson.id === lesson.id)!;
                        const unlocked = entry ? isLessonUnlocked(entry.globalIdx) : false;
                        const completed = isLessonCompleted(lesson.id);
                        const isActive = activeLessonId === lesson.id;

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => openLesson(lesson, mod.id, entry?.globalIdx ?? 0)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isActive
                                ? 'bg-primary/10 border-l-2 border-primary'
                                : unlocked
                                  ? 'hover:bg-muted/30 cursor-pointer'
                                  : 'opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <span className="shrink-0">
                              {completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : !unlocked ? (
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                LESSON_TYPE_ICON[lesson.type] ?? <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className={`text-xs block truncate ${isActive ? 'font-bold text-primary' : completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {lesson.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
                                {lesson.type}
                                {lesson.duration_mins && <><Clock className="w-2.5 h-2.5 ml-1" />{lesson.duration_mins}m</>}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Lesson content area */}
          <div className="lg:col-span-8">
            {!activeLessonId ? (
              <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-border/50 border-dashed bg-muted/10 gap-3 text-center">
                <Layers className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-muted-foreground">Select a lesson to start learning</p>
                <p className="text-xs text-muted-foreground/60">Complete lessons in order to unlock the next one</p>
              </div>
            ) : activeLesson ? (
              <LessonViewer
                lesson={activeLesson.lesson}
                isCompleted={isLessonCompleted(activeLesson.lesson.id)}
                isMarking={markingId === activeLesson.lesson.id}
                onMarkComplete={() => markCompleteMutation.mutate(activeLesson.lesson.id)}
                hasNext={activeLesson.globalIdx < allLessons.length - 1}
                onNext={() => {
                  const next = allLessons[activeLesson.globalIdx + 1];
                  if (next && isLessonUnlocked(next.globalIdx)) {
                    setActiveLessonId(next.lesson.id);
                    setExpandedModules(prev => new Set([...prev, next.moduleId]));
                  }
                }}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* QUIZZES TAB                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'quizzes' && (
        <div className="space-y-4">
          {(course.quizzes ?? []).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-xs">No quizzes for this course yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(course.quizzes ?? []).map((qz: any) => (
                <Card key={qz.id} className="border border-border bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{qz.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {qz.time_limit_mins && (
                        <span className="px-2 py-0.5 rounded-full bg-muted/40 font-semibold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />{qz.time_limit_mins} min
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-muted/40 font-semibold">Pass: {qz.passing_score ?? 60}%</span>
                      {qz.deadline && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold">
                          Due: {new Date(qz.deadline).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => { setActiveQuizId(qz.id); setActiveTab('quiz-taking'); }}
                      className="w-full h-8 text-xs font-bold bg-primary text-white"
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ASSIGNMENTS TAB                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'assignments' && (
        <div className="space-y-4">
          {(course.assignments ?? []).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-xs">No assignments for this course yet.</div>
          ) : (
            <div className="space-y-3">
              {(course.assignments ?? []).map((asgn: any) => (
                <Card key={asgn.id} className="border border-border bg-card">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground">{asgn.title}</h3>
                      {asgn.due_date && (
                        <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />Due {new Date(asgn.due_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </span>
                      )}
                    </div>
                    {asgn.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{asgn.description}</p>
                    )}
                    {asgn.max_score && (
                      <p className="text-[10px] text-muted-foreground">Max score: <span className="font-bold text-foreground">{asgn.max_score}</span></p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Lesson Viewer ────────────────────────────────────────────────────────────
function LessonViewer({
  lesson,
  isCompleted,
  isMarking,
  onMarkComplete,
  hasNext,
  onNext,
}: {
  lesson: any;
  isCompleted: boolean;
  isMarking: boolean;
  onMarkComplete: () => void;
  hasNext: boolean;
  onNext: () => void;
}) {
  const isVideo = lesson.type === 'video';
  const isPdf   = lesson.type === 'pdf';
  const isText  = lesson.type === 'text';

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      {/* Lesson header */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
        <span className="shrink-0">{LESSON_TYPE_ICON[lesson.type] ?? <FileText className="w-4 h-4" />}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground truncate">{lesson.title}</h2>
          <p className="text-[10px] text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
            {lesson.type}
            {lesson.duration_mins && <><Clock className="w-2.5 h-2.5 ml-1" />{lesson.duration_mins} min</>}
          </p>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 p-5 space-y-4">
        {!lesson.content_url && !isText ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No content uploaded for this lesson yet.</p>
          </div>
        ) : isVideo && lesson.content_url ? (
          <div className="rounded-xl overflow-hidden bg-black aspect-video w-full">
            {lesson.content_url.includes('youtube.com') || lesson.content_url.includes('youtu.be') ? (
              <iframe
                src={lesson.content_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title={lesson.title}
              />
            ) : lesson.content_url.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={lesson.content_url} controls className="w-full h-full" />
            ) : (
              <iframe src={lesson.content_url} className="w-full h-full" title={lesson.title} allowFullScreen />
            )}
          </div>
        ) : isPdf && lesson.content_url ? (
          <div className="rounded-xl overflow-hidden border border-border" style={{ height: '60vh' }}>
            <iframe
              src={`${lesson.content_url}#toolbar=0`}
              className="w-full h-full"
              title={lesson.title}
            />
          </div>
        ) : isText ? (
          <div className="prose prose-sm max-w-none text-foreground">
            {lesson.content_url ? (
              <div
                className="text-sm leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: lesson.content_url }}
              />
            ) : (
              <p className="text-muted-foreground text-sm">No text content available.</p>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-border/50 flex items-center justify-between gap-3">
        <div>
          {!isCompleted && (
            <Button
              onClick={onMarkComplete}
              disabled={isMarking}
              className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isMarking ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</>
              ) : (
                <><CheckCheck className="w-3.5 h-3.5 mr-1.5" />Mark as Complete</>
              )}
            </Button>
          )}
          {isCompleted && !hasNext && (
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> All lessons completed!
            </span>
          )}
        </div>
        {isCompleted && hasNext && (
          <Button onClick={onNext} className="h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white ml-auto">
            Next Lesson →
          </Button>
        )}
      </div>
    </div>
  );
}
