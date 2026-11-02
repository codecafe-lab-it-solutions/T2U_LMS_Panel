import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Library, Loader2, Clock, XCircle, CheckCircle2, Play, Lock, AlertCircle, BookOpen, User, BadgePercent } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api, getMediaUrl, getErrorMessage, type ApiCourseBundle } from '../services/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CourseOverviewDialog from './CourseOverviewDialog';

const inr = (n: number | string | null | undefined) => (n != null && Number(n) > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : 'Free');

// A bundle's own page inside the student panel: what it is, what you pay, and every course in it
// with your progress. Progress comes from the regular enrolled-courses query, so the numbers here
// always match the Courses page.
export default function StudentBundleDetail({ bundleId, onBack, onEnroll }: {
  bundleId: string;
  onBack: () => void;
  onEnroll: (bundle: ApiCourseBundle) => void;
}) {
  const { authToken, setActiveTab, setActiveCourseId } = useAppStore();
  const [overviewCourseId, setOverviewCourseId] = useState<string | null>(null);

  const { data: bundle, isLoading, error } = useQuery({
    queryKey: ['course-bundle', bundleId, authToken],
    queryFn: () => api.courseBundles.get(bundleId),
  });
  const { data: enrolled = [] } = useQuery({
    queryKey: ['enrolled-courses', authToken],
    queryFn: () => api.courses.enrolled(),
    enabled: !!authToken,
    staleTime: 60_000,
  });
  const { data: pricing } = useQuery({
    queryKey: ['bundle-pricing', bundleId, ''],
    queryFn: () => api.courseBundles.pricing(bundleId),
    enabled: !!authToken && !!bundle && !bundle.my_enrollment,
    staleTime: 30_000,
  });

  const progress = new Map(enrolled.map(e => [e.course_id, e.completion_percentage ?? 0]));
  const courseStatus = new Map(enrolled.map(e => [e.course_id, e.payment_status as string]));

  if (isLoading) return <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading bundle…</div>;
  if (error || !bundle) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="w-3.5 h-3.5" />Back to bundles</button>
        <div className="flex items-center gap-2 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-xs text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />{error ? getErrorMessage(error) : 'This bundle is no longer available.'}
        </div>
      </div>
    );
  }

  const status = bundle.my_enrollment?.payment_status;
  const canEnroll = !status || status === 'rejected';
  const owned = new Set(bundle.owned_course_ids ?? []);
  const doneCount = bundle.courses.filter(c => (progress.get(c.id) ?? 0) === 100).length;
  const avg = bundle.courses.length ? Math.round(bundle.courses.reduce((s, c) => s + (progress.get(c.id) ?? 0), 0) / bundle.courses.length) : 0;
  const shownPrice = pricing?.final_price ?? Number(bundle.price ?? 0);

  function openCourse(courseId: string) {
    setActiveCourseId(courseId);
    setActiveTab('courses');
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />Back to bundles
      </button>

      {/* Hero */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Course Bundle</span>
              {status === 'approved' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3" />Enrolled</span>}
              {status === 'pending' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3" />Awaiting Approval</span>}
              {status === 'rejected' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3 h-3" />Payment Rejected</span>}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground leading-tight">{bundle.name}</h1>
            {bundle.short_desc && <p className="text-sm text-muted-foreground">{bundle.short_desc}</p>}
            {bundle.description && <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{bundle.description}</p>}
            {status === 'rejected' && bundle.my_enrollment?.payment_note && <p className="text-xs text-red-600">{bundle.my_enrollment.payment_note}</p>}

            {status === 'approved' && (
              <div className="pt-2 max-w-md space-y-1.5">
                <div className="flex justify-between text-xs font-mono"><span className="text-muted-foreground">Bundle progress</span><span className="font-bold text-foreground">{doneCount}/{bundle.courses.length} courses done</span></div>
                <Progress value={avg} className="h-2 bg-muted/30" />
              </div>
            )}
          </div>

          <div className="border-t md:border-t-0 md:border-l border-border bg-muted/10 p-5 sm:p-6 space-y-4 flex flex-col justify-center">
            {bundle.thumbnail_url
              ? <img src={getMediaUrl(bundle.thumbnail_url)} alt={bundle.name} className="w-full aspect-video object-cover rounded-xl" />
              : <div className="w-full aspect-video rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Library className="w-8 h-8" /></div>}
            {canEnroll && (
              <>
                <div>
                  {pricing && pricing.final_price < pricing.mrp && <p className="text-xs text-muted-foreground line-through font-mono">₹{pricing.mrp.toLocaleString('en-IN')}</p>}
                  <p className="text-2xl font-black text-primary font-mono">{inr(shownPrice)}</p>
                  {pricing?.distributor_price_applied && <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5"><BadgePercent className="w-3 h-3" />Distributor price applied</p>}
                  {bundle.courses_total_value > shownPrice && shownPrice > 0 && <p className="text-[11px] text-emerald-600 font-semibold mt-1">Worth ₹{bundle.courses_total_value.toLocaleString('en-IN')} if bought separately</p>}
                </div>
                <Button onClick={() => onEnroll(bundle)} className="w-full text-xs font-bold">{status === 'rejected' ? 'Resubmit Payment' : 'Enroll in Bundle'}</Button>
                <p className="text-[10px] text-muted-foreground">Have a referral ID? You can enter it at checkout.</p>
              </>
            )}
            {status === 'pending' && <p className="text-xs text-muted-foreground">Your payment is being verified. All {bundle.courses.length} courses unlock as soon as an admin approves it.</p>}
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-foreground flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Courses in this bundle ({bundle.courses.length})</h2>
        {bundle.courses.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground rounded-xl border border-dashed border-border">No courses are available in this bundle right now.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bundle.courses.map((c, i) => {
              const has = owned.has(c.id);
              const pct = progress.get(c.id) ?? 0;
              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOverviewCourseId(c.id)}
                  onKeyDown={e => { if (e.key === 'Enter') setOverviewCourseId(c.id); }}
                  className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col cursor-pointer hover:border-primary/40 transition-colors"
                >
                  <div className="relative h-36 bg-muted/40">
                    {c.thumbnail_url ? <img src={getMediaUrl(c.thumbnail_url)} alt={c.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><BookOpen className="w-7 h-7" /></div>}
                    <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white text-[11px] font-black flex items-center justify-center">{i + 1}</span>
                    {!has && <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold"><Lock className="w-3 h-3" />Locked</span>}
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    {c.category && <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{c.category}</span>}
                    <h3 className="text-sm font-bold text-foreground leading-tight">{c.title}</h3>
                    {c.short_desc && <p className="text-[11px] text-muted-foreground line-clamp-2">{c.short_desc}</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                      {c.instructor?.full_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.instructor.full_name}</span>}
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{c._count?.modules ?? 0} modules</span>
                      {c.duration_hrs ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration_hrs}h</span> : null}
                    </div>
                    <div className="mt-auto pt-3">
                      {has ? (
                        <>
                          <div className="flex items-center gap-2 mb-2"><Progress value={pct} className="h-1.5 flex-1" /><span className="text-[10px] font-mono text-muted-foreground">{pct}%</span></div>
                          <Button size="sm" variant="outline" className="w-full h-8 text-[11px]" onClick={e => { e.stopPropagation(); openCourse(c.id); }}><Play className="w-3 h-3 mr-1" />{pct === 100 ? 'Review' : pct > 0 ? 'Continue' : 'Start Course'}</Button>
                        </>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">{status === 'pending' ? 'Unlocks after approval' : 'Included with this bundle'}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CourseOverviewDialog
        courseId={overviewCourseId}
        paymentStatus={overviewCourseId ? (courseStatus.get(overviewCourseId) ?? (status === 'pending' ? 'pending' : null)) : null}
        onClose={() => setOverviewCourseId(null)}
        onContinue={openCourse}
        onEnroll={() => { if (bundle && canEnroll) onEnroll(bundle); }}
        enrollLabel="Enroll in Bundle"
        lockedNote="This course is included in the bundle. Enroll in the bundle to unlock its chapters, quizzes, assignments, and live classes."
      />
    </div>
  );
}
