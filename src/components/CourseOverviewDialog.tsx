import { useQuery } from '@tanstack/react-query';
import { Loader2, Play, Clock, Plus, XCircle, Users, BookMarked } from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// The course overview shown when a student clicks a course card — shared by the Courses page and
// the Course Bundles page so both open exactly the same thing. The API only ever returns chapters,
// quizzes and assignments once an enrollment is approved (server-side gated), so everything shown
// here is safe to display for any course, enrolled or not.
export default function CourseOverviewDialog({
  courseId,
  paymentStatus,
  onClose,
  onContinue,
  onEnroll,
  enrollLabel = 'Enroll Now',
  lockedNote = 'Enroll and complete payment to unlock chapters, quizzes, assignments, and live classes for this course.',
}: {
  courseId: string | null;
  /** The student's enrollment status for THIS course, or null/undefined if not enrolled. */
  paymentStatus?: string | null;
  onClose: () => void;
  onContinue: (courseId: string) => void;
  /** Called with the loaded course when the student chooses to enroll. */
  onEnroll: (course: any) => void;
  enrollLabel?: string;
  lockedNote?: string;
}) {
  const { data: course, isLoading } = useQuery<any>({
    queryKey: ['course-overview', courseId],
    queryFn: () => api.courses.get(courseId!),
    enabled: !!courseId,
  });

  const isEnrolled = !!paymentStatus;
  const isApproved = paymentStatus === 'approved';

  return (
    <Dialog open={!!courseId} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl sm:max-w-4xl w-[95vw] border border-border bg-card max-h-[90vh] overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden p-0"
      >
        {isLoading || !course ? (
          <div className="py-24 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />Loading course…
          </div>
        ) : (() => {
          const durationLabel =
            course.duration_hrs == null ? 'Self-paced'
            : course.duration_hrs >= 40 ? `${Math.round(course.duration_hrs / 8)} days`
            : course.duration_hrs >= 10 ? `${Math.round(course.duration_hrs / 8)} weeks`
            : `${course.duration_hrs} hrs`;

          const ctaButton = isApproved ? (
            <Button
              onClick={() => { onContinue(course.id); onClose(); }}
              className="w-full text-xs font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />Continue Learning
            </Button>
          ) : isEnrolled && paymentStatus === 'pending' ? (
            <Button disabled className="w-full text-xs font-bold h-10 bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 cursor-not-allowed">
              <Clock className="w-3.5 h-3.5 mr-1.5" />Payment under review
            </Button>
          ) : (
            <Button
              onClick={() => { onEnroll(course); onClose(); }}
              className="w-full text-xs font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />{paymentStatus === 'rejected' ? 'Re-submit Payment' : enrollLabel}
            </Button>
          );

          return (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-border/50 flex items-start justify-between bg-muted/20 gap-3 shrink-0 rounded-t-xl">
                <div className="min-w-0 space-y-1">
                  {course.category && (
                    <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      {course.category}
                    </span>
                  )}
                  <h3 className="text-lg sm:text-xl font-black text-foreground leading-snug">{course.title}</h3>
                  {course.instructor?.full_name && (
                    <p className="text-xs text-muted-foreground font-medium">by {course.instructor.full_name}</p>
                  )}
                </div>
                <button
                  type="button"
                  title="Close"
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left — image + full description + tags */}
                <div className="lg:col-span-7 space-y-4">
                  {course.video_url ? (
                    <div className="w-full aspect-[16/9] max-h-64 rounded-2xl overflow-hidden bg-black border border-border flex items-center justify-center">
                      {course.video_url.includes('youtube.com') || course.video_url.includes('youtu.be') ? (
                        <iframe
                          src={course.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                          className="w-full h-full border-0"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                          title={course.title}
                        />
                      ) : course.video_url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={getMediaUrl(course.video_url)} controls className="w-full h-full" />
                      ) : (
                        <iframe src={getMediaUrl(course.video_url)} className="w-full h-full border-0" title={course.title} allowFullScreen />
                      )}
                    </div>
                  ) : course.thumbnail_url ? (
                    <div className="w-full aspect-[16/9] max-h-64 rounded-2xl overflow-hidden bg-slate-950/20 border border-border flex items-center justify-center p-2">
                      <img src={getMediaUrl(course.thumbnail_url)} alt={course.title} onError={(e) => { e.currentTarget.src = '/images/computer-skills.png'; }} className="w-full h-full object-contain rounded-xl" />
                    </div>
                  ) : null}

                  {(course.description || course.short_desc) && (
                    <div>
                      <h4 className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest mb-2">About this course</h4>
                      <div
                        className="text-xs text-foreground leading-relaxed [&_h1]:text-sm [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:mb-1.5 [&_h3]:text-xs [&_h3]:font-bold [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1.5 [&_p]:mb-2 [&_strong]:font-bold [&_li]:mb-0.5"
                        dangerouslySetInnerHTML={{ __html: course.description || course.short_desc }}
                      />
                    </div>
                  )}

                  {course.tags?.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <h4 className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest mb-2">What you'll learn</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {course.tags.map((tag: string) => (
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
                      <span className="text-xs font-bold text-foreground mt-1 block">{course.category || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase font-semibold block tracking-wider">Enrolled</span>
                      <span className="text-xs font-bold text-foreground mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />{course._count?.enrollments ?? 0} students
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase font-semibold block tracking-wider">Modules</span>
                      <span className="text-xs font-bold text-foreground mt-1 flex items-center gap-1">
                        <BookMarked className="w-3 h-3" />{course._count?.modules ?? 0} chapters
                      </span>
                    </div>
                  </div>

                  {course.price != null && (
                    <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-center">
                      <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider">Course Fee</span>
                      <p className="text-2xl font-black text-primary font-mono mt-0.5">₹{Number(course.price).toLocaleString('en-IN')}</p>
                    </div>
                  )}

                  {ctaButton}

                  {!isApproved && (
                    <p className="text-[10px] text-muted-foreground text-center leading-relaxed">{lockedNote}</p>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
