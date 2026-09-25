import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, BookOpen, Calendar, Users, TrendingUp, Loader2, AlertCircle, Library,
  CheckCircle2, Layers, HelpCircle, ClipboardList, Lock, Play, FileText, File, ChevronDown, ChevronRight, Clock, Eye,
} from 'lucide-react';
import { api, getMediaUrl, getErrorMessage } from '../../services/api';
import { navigatePublic, bundlePath } from '../../lib/publicRoutes';

type Tab = 'overview' | 'modules' | 'quizzes' | 'assignments';

const LESSON_ICON: Record<string, React.ReactNode> = {
  video: <Play className="w-3.5 h-3.5 text-violet-400" />,
  pdf: <File className="w-3.5 h-3.5 text-red-400" />,
  text: <FileText className="w-3.5 h-3.5 text-blue-400" />,
  assignment: <ClipboardList className="w-3.5 h-3.5 text-amber-400" />,
};

function formatDuration(hrs: number | null | undefined): string {
  if (!hrs) return 'Self-paced';
  if (hrs >= 40) return `${Math.round(hrs / 8)} days`;
  if (hrs >= 10) return `${Math.round(hrs / 8)} weeks`;
  return `${hrs} hrs`;
}

// Same embed rules the student course view uses, so a course looks identical before and after enrolling.
function MediaEmbed({ url, title, className = '' }: { url: string; title: string; className?: string }) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return (
      <iframe
        src={url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
        className={`w-full h-full border-0 ${className}`}
        allow="autoplay; fullscreen"
        allowFullScreen
        title={title}
      />
    );
  }
  if (url.match(/\.(mp4|webm|ogg)$/i)) return <video src={getMediaUrl(url)} controls className={`w-full h-full ${className}`} />;
  return <iframe src={getMediaUrl(url)} className={`w-full h-full border-0 ${className}`} title={title} allowFullScreen />;
}

export function NotFoundState({ what, onBack }: { what: string; onBack: () => void }) {
  return (
    <section className="bg-[#12031e] text-white min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-white/30" />
        <h1 className="text-2xl font-black mb-2">{what} not found</h1>
        <p className="text-white/60 text-sm mb-6">It may have been removed or is no longer available.</p>
        <button type="button" onClick={onBack} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 font-bold text-sm">Browse all</button>
      </div>
    </section>
  );
}

export default function CoursePage({ slug, onBack, onEnroll, onEnquire }: {
  slug: string;
  onBack: () => void;
  onEnroll: () => void;
  onEnquire: () => void;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: course, isLoading, error } = useQuery<any>({
    queryKey: ['public-course', slug],
    queryFn: () => api.courses.getPublic(slug),
    retry: false,
  });
  const { data: bundles = [] } = useQuery({
    queryKey: ['course-bundles'],
    queryFn: () => api.courseBundles.list(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return <section className="bg-[#12031e] min-h-[70vh] flex items-center justify-center gap-3 text-white/60"><Loader2 className="w-5 h-5 animate-spin" />Loading course…</section>;
  }
  // The course endpoint also serves drafts to staff; a public page must only ever show published ones.
  if (error || !course || course.status !== 'published' || course.deleted_at) {
    if (error && !/not found/i.test(getErrorMessage(error))) {
      return <section className="bg-[#12031e] min-h-[70vh] flex items-center justify-center text-red-300 text-sm px-4">{getErrorMessage(error)}</section>;
    }
    return <NotFoundState what="Course" onBack={onBack} />;
  }

  const modules: any[] = course.modules ?? [];
  const quizzes: any[] = course.quizzes ?? [];
  const assignments: any[] = course.assignments ?? [];
  const totalLessons = modules.reduce((n, m) => n + (m.lessons?.length ?? 0), 0);
  const inBundles = bundles.filter(b => b.courses.some(c => c.id === course.id));
  const price = course.price != null ? Number(course.price) : null;
  const tags: string[] = Array.isArray(course.tags) ? course.tags : [];

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: BookOpen },
    { key: 'modules', label: 'Modules', icon: Layers, count: modules.length },
    { key: 'quizzes', label: 'Quizzes', icon: HelpCircle, count: quizzes.length },
    { key: 'assignments', label: 'Assignments', icon: ClipboardList, count: assignments.length },
  ];

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <section className="pt-8 pb-20 bg-[#12031e] text-white min-h-screen">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs text-white/55 hover:text-orange-400 font-semibold transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to all courses
        </button>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6 min-w-0">
            {/* Banner: course video if there is one, otherwise the course image — same as the student view */}
            {(course.video_url || course.thumbnail_url) && (
              <div className="rounded-2xl border border-white/10 bg-black overflow-hidden aspect-video max-h-[70vh] w-full">
                {course.video_url
                  ? <MediaEmbed url={course.video_url} title={course.title} />
                  : <img src={getMediaUrl(course.thumbnail_url)} alt={course.title} className="w-full h-full object-contain" />}
              </div>
            )}

            <div>
              {course.category && <span className="text-[10px] font-bold bg-orange-500/15 text-orange-300 px-2.5 py-1 rounded-full uppercase tracking-wider">{course.category}</span>}
              <h1 className="text-2xl sm:text-4xl font-black leading-tight mt-2">{course.title}</h1>
              {course.instructor?.full_name && <p className="text-sm text-white/50 mt-2 font-semibold">by {course.instructor.full_name}</p>}
            </div>

            <div className="flex flex-wrap gap-1 border-b border-white/10">
              {tabs.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.key} type="button" onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-orange-500 text-orange-400' : 'border-transparent text-white/55 hover:text-white'}`}>
                    <Icon className="w-3.5 h-3.5" />{t.label}
                    {t.count !== undefined && <span className="text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded-full">{t.count}</span>}
                  </button>
                );
              })}
            </div>

            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-[#1e0d2f] p-5 sm:p-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Course Description</h2>
                  {course.description ? (
                    <div
                      className="text-sm text-white/85 leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-1.5 [&_h3]:text-sm [&_h3]:font-bold [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2 [&_p]:mb-2 [&_strong]:font-bold [&_li]:mb-1 [&_a]:text-orange-400 [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                  ) : (
                    <p className="text-sm text-white/60">{course.short_desc || 'No description provided.'}</p>
                  )}
                </div>
                {tags.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#1e0d2f] p-5 sm:p-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">What you’ll learn</h2>
                    <ul className="grid sm:grid-cols-2 gap-2.5">
                      {tags.map(t => <li key={t} className="flex items-center gap-2 text-sm text-white/85"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />{t}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {tab === 'modules' && (
              <div className="space-y-2.5">
                {modules.length === 0 && <p className="text-center py-12 text-white/50 text-sm">The curriculum for this course hasn’t been published yet.</p>}
                {modules.map((mod, mIdx) => {
                  const lessons: any[] = mod.lessons ?? [];
                  const open = expanded.has(mod.id);
                  return (
                    <div key={mod.id} className="rounded-xl border border-white/10 overflow-hidden bg-[#1e0d2f]">
                      <button type="button" onClick={() => toggle(mod.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 text-left">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-black bg-orange-500/15 text-orange-300 px-1.5 py-0.5 rounded font-mono shrink-0">M{mIdx + 1}</span>
                          <span className="text-sm font-bold truncate">{mod.title}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0 ml-2 text-[11px] text-white/50 font-mono">
                          {lessons.length} lessons {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </span>
                      </button>
                      {open && (
                        <div className="divide-y divide-white/5 border-t border-white/10">
                          {lessons.length === 0 && <p className="px-4 py-3 text-xs text-white/50">No lessons in this module.</p>}
                          {lessons.map(l => {
                            const previewable = l.is_free_preview && l.content_url;
                            return (
                              <div key={l.id}>
                                <div className="flex items-center gap-3 px-4 py-2.5">
                                  <span className="shrink-0">{previewable ? (LESSON_ICON[l.type] ?? <FileText className="w-3.5 h-3.5" />) : <Lock className="w-3.5 h-3.5 text-white/30" />}</span>
                                  <span className="flex-1 min-w-0">
                                    <span className="text-xs block truncate text-white/85">{l.title}</span>
                                    <span className="text-[10px] text-white/45 capitalize flex items-center gap-1 mt-0.5">
                                      {l.type}{l.duration_mins ? <><Clock className="w-2.5 h-2.5 ml-1" />{l.duration_mins}m</> : null}
                                    </span>
                                  </span>
                                  {previewable && l.type === 'video' && (
                                    <button type="button" onClick={() => setPreviewId(previewId === l.id ? null : l.id)} className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 shrink-0">
                                      <Eye className="w-3.5 h-3.5" />Free preview
                                    </button>
                                  )}
                                </div>
                                {previewId === l.id && previewable && (
                                  <div className="px-4 pb-3"><div className="aspect-video rounded-xl overflow-hidden bg-black"><MediaEmbed url={l.content_url} title={l.title} /></div></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {modules.length > 0 && <p className="text-[11px] text-white/45 pt-1">Lesson content unlocks once you enroll.</p>}
              </div>
            )}

            {tab === 'quizzes' && (
              quizzes.length === 0 ? <p className="text-center py-12 text-white/50 text-sm">No quizzes for this course yet.</p> : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {quizzes.map(q => (
                    <div key={q.id} className="rounded-xl border border-white/10 bg-[#1e0d2f] p-4 space-y-2">
                      <h3 className="text-sm font-bold">{q.title}</h3>
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        {q.time_limit_mins && <span className="px-2 py-0.5 rounded-full bg-white/10 font-semibold flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{q.time_limit_mins} min</span>}
                        <span className="px-2 py-0.5 rounded-full bg-white/10 font-semibold">Pass: {q.passing_score ?? 60}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'assignments' && (
              assignments.length === 0 ? <p className="text-center py-12 text-white/50 text-sm">No assignments for this course yet.</p> : (
                <div className="space-y-3">
                  {assignments.map(a => (
                    <div key={a.id} className="rounded-xl border border-white/10 bg-[#1e0d2f] p-4 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold">{a.title}</h3>
                      {a.max_score && <span className="text-[11px] text-white/55 shrink-0">Max score: <b className="text-white">{a.max_score}</b></span>}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          <aside>
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-[#1e0d2f] p-5 space-y-5">
                <p className="text-3xl font-black font-mono text-orange-400">{price ? `₹${price.toLocaleString('en-IN')}` : 'Free'}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-white/45 uppercase text-[9px] tracking-wider block">Duration</span><span className="font-bold flex items-center gap-1 mt-1"><Calendar className="w-3.5 h-3.5 text-orange-400" />{formatDuration(course.duration_hrs)}</span></div>
                  <div><span className="text-white/45 uppercase text-[9px] tracking-wider block">Modules</span><span className="font-bold flex items-center gap-1 mt-1"><BookOpen className="w-3.5 h-3.5 text-orange-400" />{modules.length || course._count?.modules || 0}</span></div>
                  <div><span className="text-white/45 uppercase text-[9px] tracking-wider block">Lessons</span><span className="font-bold flex items-center gap-1 mt-1"><Layers className="w-3.5 h-3.5 text-orange-400" />{totalLessons}</span></div>
                  <div><span className="text-white/45 uppercase text-[9px] tracking-wider block">Enrolled</span><span className="font-bold flex items-center gap-1 mt-1"><Users className="w-3.5 h-3.5 text-orange-400" />{course._count?.enrollments ?? 0}</span></div>
                  <div className="col-span-2"><span className="text-white/45 uppercase text-[9px] tracking-wider block">Category</span><span className="font-bold flex items-center gap-1 mt-1"><TrendingUp className="w-3.5 h-3.5 text-orange-400" />{course.category || 'General'}</span></div>
                </div>
                <button type="button" onClick={onEnroll} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
                  Enroll Now <ArrowRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={onEnquire} className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 text-sm font-semibold">Request a callback</button>
              </div>

              {inBundles.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-[#1e0d2f] p-5 space-y-3">
                  <h2 className="text-xs uppercase font-extrabold tracking-widest flex items-center gap-2"><Library className="w-4 h-4 text-orange-400" />Also in a bundle</h2>
                  {inBundles.map(b => (
                    <button key={b.id} type="button" onClick={() => navigatePublic(bundlePath(b.slug))} className="w-full text-left rounded-xl border border-white/10 hover:border-orange-400/60 px-3 py-2.5 transition-colors">
                      <p className="text-sm font-bold">{b.name}</p>
                      <p className="text-[11px] text-white/55">{b.course_count} courses · {b.price ? `₹${Number(b.price).toLocaleString('en-IN')}` : 'Free'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
