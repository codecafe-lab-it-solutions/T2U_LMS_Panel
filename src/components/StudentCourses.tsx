import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api, getMediaUrl } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useFilterParams } from '../hooks/useFilterParams';
import { InstructorDisplay } from './common/InstructorDisplay';
import {
  Search, GraduationCap, BookOpen, Users, Play, Plus,
  Loader2, BookMarked, CheckCircle2, Filter, Upload, Clock, XCircle,
  AlertCircle, BadgePercent, MessageCircle, RotateCcw, Award,
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
import CourseOverviewDialog from './CourseOverviewDialog';
import { buildWhatsAppLink } from '../utils/whatsapp';
import { formatDate } from '../utils/date';

type CoursesTab = 'enrolled' | 'all';
type EnrolledFilter = 'all' | 'in-progress' | 'completed' | 'certificate-issued';

const ENROLLED_FILTER_OPTIONS: { id: EnrolledFilter; label: string }[] = [
  { id: 'all', label: 'All Enrolled' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'certificate-issued', label: 'Certificate Issued' },
];

const PAYMENT_STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:  { label: 'Payment Pending',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',  icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved',         className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',  icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: 'Payment Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',          icon: <XCircle className="w-3 h-3" /> },
};

export default function StudentCourses() {
  const { authToken, setActiveCourseId } = useAppStore();
  const qc = useQueryClient();
  const { getParam, setParams } = useFilterParams();

  const [tab, setTab] = useState<CoursesTab>((getParam('tab') as CoursesTab) || 'enrolled');
  const [search, setSearch] = useState(getParam('search') || getParam('q') || '');
  const debouncedSearch = useDebounce(search, 300);
  const [enrolledFilter, setEnrolledFilter] = useState<EnrolledFilter>((getParam('status') as EnrolledFilter) || 'all');
  const [allCategoryFilter, setAllCategoryFilter] = useState(getParam('category') || 'all');

  // Sync state to URL params for deep-linking & shareable filtered states
  useEffect(() => {
    setParams({
      tab: tab === 'enrolled' ? undefined : tab,
      status: enrolledFilter === 'all' ? undefined : enrolledFilter,
      category: allCategoryFilter === 'all' ? undefined : allCategoryFilter,
      search: debouncedSearch.trim() || undefined,
    });
  }, [tab, enrolledFilter, allCategoryFilter, debouncedSearch, setParams]);

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
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: enrollments = [], isLoading: loadingEnrolled } = useQuery({
    queryKey: ['enrolled-courses', authToken],
    queryFn: () => api.courses.enrolled(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: userCertificates = [] } = useQuery({
    queryKey: ['my-certificates', authToken],
    queryFn: () => api.certificates.my(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const certifiedCourseIds = new Set(
    (userCertificates as any[]).map((c: any) => c.course_id || c.course?.id).filter(Boolean)
  );

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

  const { data: courseBatches = [] } = useQuery<any[]>({
    queryKey: ['course-batches', paymentCourse?.id],
    queryFn: () => api.courses.batches(paymentCourse.id),
    enabled: !!paymentCourse,
  });

  const enrollMutation = useMutation({
    mutationFn: ({ courseId, transactionId, ssUrl, refCode, batchId }: { courseId: string; transactionId: string; ssUrl?: string; refCode?: string; batchId?: string }) =>
      api.courses.enrollWithPayment(courseId, { transaction_id: transactionId, screenshot_url: ssUrl, referral_code: refCode, batch_id: batchId }),
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
      if (enrolledFilter === 'in-progress') return pct >= 0 && pct < 100;
      if (enrolledFilter === 'certificate-issued') return certifiedCourseIds.has(e.course_id) || pct === 100;
      return true;
    })
    .filter((e: any) =>
      !debouncedSearch || e.course?.title?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

  const categories = [...new Set(allCourses.map((c: any) => c.category).filter(Boolean))] as string[];

  const allFiltered = allCourses
    .filter((c: any) => allCategoryFilter === 'all' || c.category === allCategoryFilter)
    .filter((c: any) =>
      !debouncedSearch || c.title?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

  const hasActiveFilters = Boolean(
    search.trim() ||
    (tab === 'enrolled' ? enrolledFilter !== 'all' : allCategoryFilter !== 'all')
  );

  const handleResetFilters = () => {
    setSearch('');
    setEnrolledFilter('all');
    setAllCategoryFilter('all');
  };

  function closePaymentDialog() {
    setPaymentCourse(null);
    setTxnId('');
    setScreenshotFile(null);
    setScreenshotUrl('');
    setPaymentError('');
    setUploadingScreenshot(false);
    setReferralCode('');
    setSelectedBatchId('');
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
      batchId: selectedBatchId || undefined,
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

      {/* Filters row & reset button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Enrolled filters */}
        {tab === 'enrolled' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
            {ENROLLED_FILTER_OPTIONS.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setEnrolledFilter(f.id)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  enrolledFilter === f.id
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                }`}
              >
                {f.id === 'certificate-issued' && <Award className="w-2.5 h-2.5" />}
                {f.label}
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

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-7 text-[11px] font-bold text-muted-foreground hover:text-foreground gap-1.5 ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All Filters
          </Button>
        )}
      </div>

      {/* === ENROLLED TAB === */}
      {tab === 'enrolled' && (
        loadingEnrolled ? (
          <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your courses…
          </div>
        ) : enrolledFiltered.length === 0 ? (
          <div className="text-center py-16 border border-border rounded-2xl bg-card p-6">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">No records found matching your filters</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              {enrollments.length === 0
                ? 'You haven\'t enrolled in any courses yet. Browse "All Courses" to get started.'
                : 'Try adjusting your search query or selecting a different status filter.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="text-xs font-bold h-8 gap-1.5 border-border"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filters
                </Button>
              )}
              {enrollments.length === 0 && (
                <Button
                  onClick={() => setTab('all')}
                  className="text-xs font-bold h-8 bg-primary text-primary-foreground"
                >
                  Browse All Courses
                </Button>
              )}
            </div>
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
                  <div className="relative aspect-video w-full overflow-hidden shrink-0 bg-slate-950/20 flex items-center justify-center">
                    <img
                      src={
                        getMediaUrl(course.thumbnail_url) ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'
                      }
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'; }}
                      className="w-full h-full object-contain group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
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
          <div className="text-center py-16 border border-border rounded-2xl bg-card p-6">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">No records found matching your filters</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Try a different search term or category filter.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="mt-4 text-xs font-bold h-8 gap-1.5 border-border"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </Button>
            )}
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
                  <div className="relative aspect-video w-full overflow-hidden shrink-0 bg-slate-950/20 flex items-center justify-center">
                    <img
                      src={
                        getMediaUrl(course.thumbnail_url) ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'
                      }
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'; }}
                      className="w-full h-full object-contain group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
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

                    {course.instructor && (
                      <InstructorDisplay instructor={course.instructor} variant="card" className="pt-0.5" />
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

      {/* ── Course Overview (shared with the Course Bundles page) ─────────── */}
      <CourseOverviewDialog
        courseId={overviewCourseId}
        paymentStatus={overviewCourseId ? enrolledMap.get(overviewCourseId)?.payment_status : null}
        onClose={() => setOverviewCourseId(null)}
        onContinue={id => setActiveCourseId(id)}
        onEnroll={course => setConfirmCourse(course)}
      />

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
                src={getMediaUrl(confirmCourse.thumbnail_url) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120'}
                alt={confirmCourse.title}
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120'; }}
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
                  src={getMediaUrl(paymentCourse.thumbnail_url) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80'}
                  alt={paymentCourse.title}
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80'; }}
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

              {/* Batch picker — only shown when this course has active batches */}
              {courseBatches.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">
                    Choose Your Batch (optional)
                  </Label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {courseBatches.map((b: any) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBatchId(prev => prev === b.id ? '' : b.id)}
                        className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                          selectedBatchId === b.id
                            ? 'bg-primary/10 border-primary text-primary font-bold'
                            : 'border-border bg-muted/20 text-foreground hover:border-primary/40'
                        }`}
                      >
                        <span className="font-bold">{b.title}</span>
                        {b.start_date && (
                          <span className="text-[10px] text-muted-foreground ml-2">
                            {formatDate(b.start_date)}
                            {b.end_date ? ` – ${formatDate(b.end_date)}` : ''}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground">You can also be assigned to a batch later if you skip this.</p>
                </div>
              )}

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
