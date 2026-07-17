import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import {
  Search, GraduationCap, BookOpen, Users, Play, Plus,
  Loader2, BookMarked, CheckCircle2, Filter, Upload, Clock, XCircle,
  AlertCircle, BadgePercent, MessageCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import PaymentMethodPicker from './PaymentMethodPicker';
import { buildWhatsAppLink } from '../utils/whatsapp';

type CoursesTab = 'enrolled' | 'all';
type EnrolledFilter = 'all' | 'ongoing' | 'completed' | 'not-started';

const PAYMENT_STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:  { label: 'Payment Pending',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',  icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved',         className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',  icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: 'Payment Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',          icon: <XCircle className="w-3 h-3" /> },
};

export default function StudentCourses() {
  const { authToken, setActiveCourseId } = useAppStore();
  const qc = useQueryClient();

  const [tab, setTab] = useState<CoursesTab>('enrolled');
  const [search, setSearch] = useState('');
  const [enrolledFilter, setEnrolledFilter] = useState<EnrolledFilter>('all');
  const [allCategoryFilter, setAllCategoryFilter] = useState('all');

  // Course overview modal (pre-enrollment: title/description/price only, no chapters)
  const [overviewCourseId, setOverviewCourseId] = useState<string | null>(null);
  // Step 1: confirm dialog
  const [confirmCourse, setConfirmCourse] = useState<any | null>(null);
  // Step 2: payment form
  const [paymentCourse, setPaymentCourse] = useState<any | null>(null);
  const [txnId, setTxnId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const { data: publicSettings } = useQuery<{ map: Record<string, string> }>({
    queryKey: ['public-settings'],
    queryFn: () => api.platformSettings.getPublic(),
    enabled: !!paymentCourse,
    staleTime: 300_000,
  });

  const { data: integrationPublic } = useQuery({
    queryKey: ['integration-settings-public'],
    queryFn: () => api.integrationSettings.getPublic(),
    enabled: !!paymentCourse,
    staleTime: 300_000,
  });

  const { data: coursePricing, isFetching: pricingLoading } = useQuery({
    queryKey: ['course-pricing', paymentCourse?.id, referralCode],
    queryFn: () => api.courses.pricing(paymentCourse.id, referralCode.trim() || undefined),
    enabled: !!paymentCourse,
  });

  const { data: overviewCourse, isLoading: loadingOverview } = useQuery<any>({
    queryKey: ['course-overview', overviewCourseId],
    queryFn: () => api.courses.get(overviewCourseId!),
    enabled: !!overviewCourseId,
  });

  const enrollMutation = useMutation({
    mutationFn: ({ courseId, transactionId, ssUrl, refCode }: { courseId: string; transactionId: string; ssUrl?: string; refCode?: string }) =>
      api.courses.enrollWithPayment(courseId, { transaction_id: transactionId, screenshot_url: ssUrl, referral_code: refCode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrolled-courses'] });
      qc.invalidateQueries({ queryKey: ['all-courses-browse'] });
      closePaymentDialog();
      setTab('enrolled');
    },
    onError: (err: any) => setPaymentError(err.message || 'Submission failed. Please try again.'),
  });

  const enrolledMap = new Map<string, any>(enrollments.map((e: any) => [e.course_id, e]));
  const enrolledCourseIds = new Set(enrollments.map((e: any) => e.course_id));

  const enrolledFiltered = enrollments
    .filter((e: any) => {
      if (e.payment_status !== 'approved') return true; // show all statuses
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

  function closePaymentDialog() {
    setPaymentCourse(null);
    setTxnId('');
    setScreenshotFile(null);
    setScreenshotUrl('');
    setPaymentError('');
    setUploadingScreenshot(false);
    setReferralCode('');
  }

  async function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setScreenshotFile(f);
    setUploadingScreenshot(true);
    setPaymentError('');
    try {
      const res = await api.upload.file(f);
      setScreenshotUrl(res.url);
    } catch (err: any) {
      setPaymentError('Screenshot upload failed: ' + (err.message || 'Unknown error'));
      setScreenshotFile(null);
    } finally {
      setUploadingScreenshot(false);
    }
  }

  function handleSubmitPayment() {
    if (!paymentCourse) return;
    if (!txnId.trim()) { setPaymentError('Please enter your transaction ID.'); return; }
    setPaymentError('');
    enrollMutation.mutate({
      courseId: paymentCourse.id,
      transactionId: txnId.trim(),
      ssUrl: screenshotUrl || undefined,
      refCode: referralCode.trim() || undefined,
    });
  }

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
              const payStatus = e.payment_status ?? 'approved';
              const badge = PAYMENT_STATUS_BADGE[payStatus];
              const isApproved = payStatus === 'approved';
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
                    {pct === 100 && isApproved && (
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
                    {/* Payment status badge */}
                    {badge && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${badge.className}`}>
                        {badge.icon} {badge.label}
                      </span>
                    )}

                    {isApproved && (
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <BookMarked className="w-3 h-3" />
                          {course._count?.modules ?? 0} modules
                        </span>
                        <span className={`font-bold ${statusColor}`}>{statusLabel}</span>
                      </div>
                    )}

                    {isApproved && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-bold text-foreground">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5 bg-muted-foreground/10" />
                      </div>
                    )}

                    {isApproved ? (
                      <Button
                        onClick={() => setActiveCourseId(course.id)}
                        className="w-full text-xs font-bold h-8 mt-auto bg-secondary hover:bg-muted text-primary hover:text-primary border border-border"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {pct > 0 ? 'Continue Learning' : 'Start Course'}
                      </Button>
                    ) : payStatus === 'rejected' ? (
                      <Button
                        onClick={() => { setConfirmCourse(course); }}
                        className="w-full text-xs font-bold h-8 mt-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Re-submit Payment
                      </Button>
                    ) : (
                      <div className="mt-auto flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <p className="text-[10px] text-amber-700 dark:text-amber-400">
                          Awaiting admin approval. You'll get access once payment is verified.
                        </p>
                      </div>
                    )}
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
              const enrollment = enrolledMap.get(course.id);
              const payStatus = enrollment?.payment_status;
              const isEnrolled = !!enrollment;
              const isApproved = payStatus === 'approved';

              return (
                <Card
                  key={course.id}
                  onClick={() => setOverviewCourseId(course.id)}
                  className="group border border-border bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col cursor-pointer"
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
                    {isApproved && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-600/90 backdrop-blur-md text-white text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        ENROLLED
                      </span>
                    )}
                    {isEnrolled && !isApproved && payStatus && (
                      <span className={`absolute top-3 right-3 flex items-center gap-1 backdrop-blur-md text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        payStatus === 'pending' ? 'bg-amber-600/90 text-white' : 'bg-red-600/90 text-white'
                      }`}>
                        {payStatus === 'pending' ? 'PENDING' : 'REJECTED'}
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
                        {course._count?.modules ?? 0} modules
                      </span>
                    </div>

                    {course.instructor?.full_name && (
                      <p className="text-[10px] text-muted-foreground">
                        by {course.instructor.full_name}
                      </p>
                    )}

                    {course.price != null && (
                      <p className="text-sm font-bold text-foreground font-mono">
                        ₹{Number(course.price).toLocaleString('en-IN')}
                      </p>
                    )}

                    {isApproved ? (
                      <Button
                        onClick={e => { e.stopPropagation(); setActiveCourseId(course.id); }}
                        className="w-full text-xs font-bold h-8 mt-auto bg-secondary hover:bg-muted text-primary hover:text-primary border border-border"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Continue Learning
                      </Button>
                    ) : isEnrolled && payStatus === 'pending' ? (
                      <div className="mt-auto flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <p className="text-[10px] text-amber-700 dark:text-amber-400">Payment under review</p>
                      </div>
                    ) : (
                      <Button
                        onClick={e => { e.stopPropagation(); setConfirmCourse(course); }}
                        className="w-full text-xs font-bold h-8 mt-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {payStatus === 'rejected' ? 'Re-submit Payment' : 'Enroll Now'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ── Course Overview (pre-enrollment) ─────────────────────────────
          Shown on card click for ANY course, enrolled or not. The API only ever
          returns chapters/quizzes/assignments once the enrollment is approved
          (server-side gated) — everything else here is safe to show freely. */}
      <Dialog open={!!overviewCourseId} onOpenChange={open => { if (!open) setOverviewCourseId(null); }}>
        <DialogContent
          showCloseButton={false}
          className="max-w-4xl sm:max-w-4xl w-[95vw] border border-border bg-card max-h-[90vh] overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden p-0"
        >
          {loadingOverview || !overviewCourse ? (
            <div className="py-24 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading course…
            </div>
          ) : (() => {
            const enrollment = enrolledMap.get(overviewCourse.id);
            const payStatus = enrollment?.payment_status;
            const isEnrolled = !!enrollment;
            const isApproved = payStatus === 'approved';
            const durationLabel =
              overviewCourse.duration_hrs == null ? 'Self-paced'
              : overviewCourse.duration_hrs >= 40 ? `${Math.round(overviewCourse.duration_hrs / 8)} days`
              : overviewCourse.duration_hrs >= 10 ? `${Math.round(overviewCourse.duration_hrs / 8)} weeks`
              : `${overviewCourse.duration_hrs} hrs`;

            const ctaButton = isApproved ? (
              <Button
                onClick={() => { setActiveCourseId(overviewCourse.id); setOverviewCourseId(null); }}
                className="w-full text-xs font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />Continue Learning
              </Button>
            ) : isEnrolled && payStatus === 'pending' ? (
              <Button disabled className="w-full text-xs font-bold h-10 bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 cursor-not-allowed">
                <Clock className="w-3.5 h-3.5 mr-1.5" />Payment under review
              </Button>
            ) : (
              <Button
                onClick={() => { setConfirmCourse(overviewCourse); setOverviewCourseId(null); }}
                className="w-full text-xs font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />{payStatus === 'rejected' ? 'Re-submit Payment' : 'Enroll Now'}
              </Button>
            );

            return (
              <>
                {/* Banner */}
                <div className="relative h-56 w-full overflow-hidden rounded-t-xl shrink-0">
                  <img
                    src={overviewCourse.thumbnail_url ?? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900'}
                    alt={overviewCourse.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <button
                    type="button"
                    title="Close"
                    onClick={() => setOverviewCourseId(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  {overviewCourse.category && (
                    <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-white/20">
                      {overviewCourse.category}
                    </span>
                  )}
                  <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="text-xl font-black text-white leading-tight">{overviewCourse.title}</h3>
                    {overviewCourse.instructor?.full_name && (
                      <p className="text-xs text-white/70 mt-1 font-semibold">by {overviewCourse.instructor.full_name}</p>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left — full description + tags */}
                  <div className="lg:col-span-7 space-y-4">
                    {(overviewCourse.description || overviewCourse.short_desc) && (
                      <div>
                        <h4 className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest mb-2">About this course</h4>
                        <div
                          className="text-xs text-foreground leading-relaxed [&_h1]:text-sm [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:mb-1.5 [&_h3]:text-xs [&_h3]:font-bold [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1.5 [&_p]:mb-2 [&_strong]:font-bold [&_li]:mb-0.5"
                          dangerouslySetInnerHTML={{ __html: overviewCourse.description || overviewCourse.short_desc }}
                        />
                      </div>
                    )}

                    {overviewCourse.tags?.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <h4 className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest mb-2">What you'll learn</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {overviewCourse.tags.map((tag: string) => (
                            <span key={tag} className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right — meta + price + CTA */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-muted/20 border border-border/60">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block tracking-wider">Duration</span>
                        <span className="text-xs font-bold text-foreground mt-1 block">{durationLabel}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block tracking-wider">Category</span>
                        <span className="text-xs font-bold text-foreground mt-1 block">{overviewCourse.category || 'General'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block tracking-wider">Enrolled</span>
                        <span className="text-xs font-bold text-foreground mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3" />{overviewCourse._count?.enrollments ?? 0} students
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block tracking-wider">Modules</span>
                        <span className="text-xs font-bold text-foreground mt-1 flex items-center gap-1">
                          <BookMarked className="w-3 h-3" />{overviewCourse._count?.modules ?? 0} chapters
                        </span>
                      </div>
                    </div>

                    {overviewCourse.price != null && (
                      <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-center">
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider">Course Fee</span>
                        <p className="text-2xl font-black text-primary font-mono mt-0.5">₹{Number(overviewCourse.price).toLocaleString('en-IN')}</p>
                      </div>
                    )}

                    {ctaButton}

                    {!isApproved && (
                      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                        Enroll and complete payment to unlock chapters, quizzes, assignments, and live classes for this course.
                      </p>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Step 1: Enrollment Confirmation Dialog ──────────────────────── */}
      <Dialog open={!!confirmCourse && !paymentCourse} onOpenChange={open => { if (!open) setConfirmCourse(null); }}>
        <DialogContent className="max-w-sm border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Confirm Enrollment</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to enroll in this course? You'll need to complete a payment in the next step.
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
                {confirmCourse.price != null && (
                  <p className="text-sm font-bold text-primary mt-1 font-mono">
                    ₹{Number(confirmCourse.price).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmCourse(null)}
              className="text-xs font-semibold border-border flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!confirmCourse) return;
                setPaymentCourse(confirmCourse);
              }}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
            >
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Step 2: Payment Details Dialog ──────────────────────────────── */}
      <Dialog open={!!paymentCourse} onOpenChange={open => { if (!open) { closePaymentDialog(); setConfirmCourse(null); } }}>
        <DialogContent className="sm:max-w-2xl border border-border bg-card max-h-[90vh] overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Complete Payment</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Transfer the course fee via UPI, then submit your transaction ID as proof of payment.
            </DialogDescription>
          </DialogHeader>

          {paymentCourse && (
            <div className="space-y-4">
              {/* Course info + price */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/60">
                <img
                  src={paymentCourse.thumbnail_url ?? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80'}
                  alt={paymentCourse.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground line-clamp-1">{paymentCourse.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Course enrollment fee</p>
                </div>
                <div className="text-right shrink-0">
                  {coursePricing && coursePricing.discount_amount > 0 ? (
                    <>
                      <p className="text-[10px] text-muted-foreground line-through font-mono">
                        ₹{coursePricing.base_price.toLocaleString('en-IN')}
                      </p>
                      <p className="text-lg font-black text-primary font-mono">
                        ₹{coursePricing.final_price.toLocaleString('en-IN')}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-black text-primary font-mono">
                      {(coursePricing?.final_price ?? paymentCourse.price) != null
                        ? `₹${Number(coursePricing?.final_price ?? paymentCourse.price).toLocaleString('en-IN')}`
                        : 'Free'}
                    </p>
                  )}
                  {coursePricing?.distributor_price_applied && (
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center justify-end gap-0.5 mt-0.5">
                      <BadgePercent className="w-2.5 h-2.5" />Distributor price applied
                    </p>
                  )}
                </div>
              </div>

              {/* Referral code (optional discount + BV to your sponsor) */}
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">
                  Referral ID (optional)
                </Label>
                <Input
                  type="text"
                  placeholder="Enter a referral ID"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  className="h-9 text-xs bg-muted/20 font-mono uppercase"
                />
                {referralCode.trim() && !pricingLoading && coursePricing && (
                  coursePricing.referral_valid ? (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Referral ID applied{coursePricing.discount_amount > 0 ? ` — ₹${coursePricing.discount_amount.toLocaleString('en-IN')} discount` : ''}
                    </p>
                  ) : (
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold">Invalid referral ID</p>
                  )
                )}
              </div>

              {/* Payment method(s) */}
              <PaymentMethodPicker settingsMap={publicSettings?.map} />

              {/* Chat on WhatsApp — send screenshot + payment details directly to support */}
              {integrationPublic?.support_whatsapp_number && (
                <a
                  href={buildWhatsAppLink(
                    integrationPublic.support_whatsapp_number,
                    `Hi, I've made a payment for the course "${paymentCourse.title}" (₹${Number(coursePricing?.final_price ?? paymentCourse.price ?? 0).toLocaleString('en-IN')}). Sharing my payment screenshot and details here.${txnId.trim() ? ` Transaction ID: ${txnId.trim()}` : ''}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp — Send Screenshot & Details
                </a>
              )}

              {/* Transaction ID */}
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">
                  Transaction ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter UPI transaction / reference ID"
                  value={txnId}
                  onChange={e => setTxnId(e.target.value)}
                  className="h-9 text-xs bg-muted/20 font-mono"
                />
              </div>

              {/* Screenshot upload */}
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">
                  Payment Screenshot (optional)
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  title="Upload payment screenshot"
                  className="hidden"
                  onChange={handleScreenshotChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingScreenshot}
                  className={`w-full flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed text-xs font-semibold transition-colors ${
                    screenshotFile
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/20'
                  }`}
                >
                  {uploadingScreenshot ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</>
                  ) : screenshotFile ? (
                    <><CheckCircle2 className="w-4 h-4" />{screenshotFile.name}</>
                  ) : (
                    <><Upload className="w-4 h-4" />Click to upload screenshot</>
                  )}
                </button>
              </div>

              {paymentError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-400">{paymentError}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => { closePaymentDialog(); setConfirmCourse(null); }}
              className="text-xs font-semibold border-border flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={enrollMutation.isPending || uploadingScreenshot}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
            >
              {enrollMutation.isPending ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Submitting…</>
              ) : (
                'Submit Payment Proof'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
