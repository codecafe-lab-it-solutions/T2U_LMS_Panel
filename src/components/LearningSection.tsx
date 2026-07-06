import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api, getStoredToken } from '../services/api';
import { Clock, ArrowRight, CheckCircle2, Award, Loader2 } from 'lucide-react';
import StudentCourses from './StudentCourses';
import StudentCourseView from './StudentCourseView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { Course, Quiz } from '../types';

type QuizCard = Quiz & {
  courseId: string;
  courseTitle: string;
  courseStatus: string;
};

export default function LearningSection() {
  const queryClient = useQueryClient();
  const {
    courses: storeCourses,
    authToken,
    activeCourseId,
    setActiveCourseId,
    setActiveQuizId,
    completeChapter,
    submitCourseQuiz,
    activeTab,
    setActiveTab,
    userProfile
  } = useAppStore();

  const { data: apiEnrollments } = useQuery({
    queryKey: ['enrolled-courses', authToken],
    queryFn: () => api.courses.enrolled(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: apiQuizzes = [], isLoading: loadingQuizzes } = useQuery<any[]>({
    queryKey: ['student-quizzes'],
    queryFn: () => api.quizzes.list(),
    enabled: !!getStoredToken() && activeTab === 'quizzes',
    staleTime: 30_000,
  });

  const courses = authToken && apiEnrollments
    ? apiEnrollments.map(e => ({
        id: e.course.id,
        title: e.course.title,
        description: e.course.description ?? '',
        category: e.course.category ?? 'Course',
        thumbnail: e.course.thumbnail_url ?? '/placeholder-course.jpg',
        progress: e.completion_percentage ?? 0,
        courseStatus: 'enrolled' as const,
        instructor: e.course.instructor?.full_name ?? 'Instructor',
        modulesCount: e.course.modules?.length ?? 0,
        chapters: [],
        quizzes: [],
        lastActivity: e.lesson_progress?.length > 0 ? 'Recently' : '--',
      }))
    : storeCourses;

  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [selectedQuizCard, setSelectedQuizCard] = useState<QuizCard | null>(null);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState({
    name: userProfile.name,
    email: userProfile.email,
    mobile: userProfile.mobile,
    notes: ''
  });
  const [enrollmentSubmitted, setEnrollmentSubmitted] = useState(false);
  const [showQuizAttempt, setShowQuizAttempt] = useState(false);
  const [activeQuizAttemptQuestionIndex, setActiveQuizAttemptQuestionIndex] = useState(0);
  const [selectedQuizAttemptOption, setSelectedQuizAttemptOption] = useState<number | null>(null);
  const [quizAttemptAnswers, setQuizAttemptAnswers] = useState<number[]>([]);
  const [quizAttemptComplete, setQuizAttemptComplete] = useState(false);

  // Interactive workspace states
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [showQuizInterface, setShowQuizInterface] = useState(false);

  // Quiz Solver state
  const [activeQuizQuestionIndex, setActiveQuizQuestionIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);

  // Current active course helper
  const currentCourse = activeTab === 'courses' ? courses.find(c => c.id === activeCourseId) : undefined;
  const activeChapter = currentCourse?.chapters?.[activeChapterIndex];
  const activeQuiz = currentCourse?.quizzes?.[0];

  // Check if all chapters in the active course are completed
  const allChaptersCompleted = currentCourse?.chapters?.every(ch => ch.completed) || false;

  const handleSelectCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setPreviewCourse(null);
    setActiveChapterIndex(0);
    setShowQuizInterface(false);
    setQuizComplete(false);
    setActiveQuizQuestionIndex(0);
    setSelectedQuizOption(null);
    setQuizAnswers([]);
  };

  const handleOpenCoursePreview = (course: Course) => {
    setPreviewCourse(course);
    setActiveCourseId(null);
    setShowEnrollmentForm(false);
    setEnrollmentSubmitted(false);
    setEnrollmentForm({
      name: userProfile.name,
      email: userProfile.email,
      mobile: userProfile.mobile,
      notes: ''
    });
  };

  const handleEnrollmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEnrollmentForm(false);
    setEnrollmentSubmitted(true);
  };

  const resetQuizAttemptState = () => {
    setActiveQuizAttemptQuestionIndex(0);
    setSelectedQuizAttemptOption(null);
    setQuizAttemptAnswers([]);
    setQuizAttemptComplete(false);
  };

  const handleOpenQuizPreview = (quiz: QuizCard) => {
    setSelectedQuizCard(quiz);
    setShowQuizAttempt(false);
    resetQuizAttemptState();
  };

  const handleStartQuizAttempt = (quiz: QuizCard) => {
    setSelectedQuizCard(quiz);
    setShowQuizAttempt(true);
    resetQuizAttemptState();
  };

  const handleNextQuizAttemptQuestion = () => {
    if (!selectedQuizCard || selectedQuizAttemptOption === null) return;

    const newAnswers = [...quizAttemptAnswers, selectedQuizAttemptOption];
    setQuizAttemptAnswers(newAnswers);
    setSelectedQuizAttemptOption(null);

    const questions = selectedQuizCard.questions || [];
    if (activeQuizAttemptQuestionIndex < questions.length - 1) {
      setActiveQuizAttemptQuestionIndex(activeQuizAttemptQuestionIndex + 1);
    } else {
      setQuizAttemptComplete(true);
      submitCourseQuiz(selectedQuizCard.courseId, selectedQuizCard.id, 100);
      queryClient.invalidateQueries({ queryKey: ['coursesList'] });
      setSelectedQuizCard({ ...selectedQuizCard, completed: true, attemptStatus: 'Completed' });
    }
  };

  const handleMarkChapterDone = () => {
    if (!currentCourse || !activeChapter) return;
    completeChapter(currentCourse.id, activeChapter.id);

    // Dynamic state transition: automatically move to next chapter if available
    const totalChapters = currentCourse.chapters?.length || 0;
    if (activeChapterIndex < totalChapters - 1) {
      setTimeout(() => {
        setActiveChapterIndex(activeChapterIndex + 1);
      }, 400);
    } else {
      // If we completed all, show hint to take quiz
      queryClient.invalidateQueries({ queryKey: ['coursesList'] });
    }
  };

  const handleStartCourseQuiz = () => {
    setShowQuizInterface(true);
    setActiveQuizQuestionIndex(0);
    setSelectedQuizOption(null);
    setQuizAnswers([]);
    setQuizComplete(false);
  };

  const handleNextQuizQuestion = () => {
    if (selectedQuizOption === null || !activeQuiz) return;
    
    const newAnswers = [...quizAnswers, selectedQuizOption];
    setQuizAnswers(newAnswers);
    setSelectedQuizOption(null);

    const questions = activeQuiz.questions || [];
    if (activeQuizQuestionIndex < questions.length - 1) {
      setActiveQuizQuestionIndex(activeQuizQuestionIndex + 1);
    } else {
      // Submit and record quiz results!
      setQuizComplete(true);
      if (currentCourse) {
        submitCourseQuiz(currentCourse.id, activeQuiz.id, 100);
        queryClient.invalidateQueries({ queryKey: ['coursesList'] });
      }
    }
  };

  const renderCoursePreview = () => {
    if (!previewCourse) return null;

    const chapters = previewCourse.chapters || [];
    const quizzes = previewCourse.quizzes || [];

    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => setPreviewCourse(null)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors group"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
          Back to Courses
        </button>

        <div className="relative w-full rounded-2xl overflow-hidden bg-muted h-[240px]">
          <img src={previewCourse.thumbnail} alt={previewCourse.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-violet-600 text-white text-[9.5px] font-bold uppercase tracking-wider rounded">
                {previewCourse.category}
              </span>
              <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                previewCourse.courseStatus === 'live' ? 'bg-emerald-500 text-white' :
                previewCourse.courseStatus === 'new' ? 'bg-blue-500 text-white' :
                'bg-amber-500 text-white'
              }`}>
                {previewCourse.courseStatus}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
              {previewCourse.title}
            </h1>
          </div>
        </div>

        {showEnrollmentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md border border-border bg-card shadow-2xl">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-bold">Enroll in {previewCourse.title}</CardTitle>
                <CardDescription className="text-xs">Fill in your details and our team will confirm your enrollment.</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</Label>
                    <Input
                      required
                      value={enrollmentForm.name}
                      onChange={(e) => setEnrollmentForm({ ...enrollmentForm, name: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Email</Label>
                    <Input
                      type="email"
                      required
                      value={enrollmentForm.email}
                      onChange={(e) => setEnrollmentForm({ ...enrollmentForm, email: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Mobile</Label>
                    <Input
                      required
                      value={enrollmentForm.mobile}
                      onChange={(e) => setEnrollmentForm({ ...enrollmentForm, mobile: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Notes (Optional)</Label>
                    <Input
                      placeholder="Any additional notes"
                      value={enrollmentForm.notes}
                      onChange={(e) => setEnrollmentForm({ ...enrollmentForm, notes: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowEnrollmentForm(false)} className="text-xs font-semibold h-8.5 border-border">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-white text-xs font-bold h-8.5">
                      Submit Enrollment
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold">About this Course</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {previewCourse.description ? (
                  <div
                    className="text-xs text-muted-foreground font-sans leading-relaxed [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-2 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-1.5 [&_h3]:font-bold [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1.5 [&_p]:mb-2 [&_strong]:font-bold [&_strong]:text-foreground [&_li]:mb-0.5"
                    dangerouslySetInnerHTML={{ __html: previewCourse.description }}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">No description provided.</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  {[
                    { label: 'Duration', value: previewCourse.duration },
                    { label: 'Chapters', value: chapters.length },
                    { label: 'Quizzes', value: quizzes.length },
                    { label: 'Instructor', value: previewCourse.instructor },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/30 border border-border/50 rounded-xl p-3 text-center">
                      <span className="text-[8.5px] font-bold text-muted-foreground uppercase tracking-wider block">{label}</span>
                      <strong className="text-base font-extrabold font-mono text-foreground">{value}</strong>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {chapters.length > 0 && (
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold">Course Syllabus</CardTitle>
                  <CardDescription className="text-xs">{chapters.length} chapters included</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/60">
                    {chapters.map((ch, i) => (
                      <div key={ch.id} className="flex items-start gap-3 p-4">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-foreground block truncate">{ch.title}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{ch.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <Card className="border border-primary/30 bg-card shadow-xl shadow-primary/5 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-violet-600 via-primary to-orange-500" />
                <CardContent className="p-6 space-y-5">
                  <div className="text-center">
                    <span className="text-3xl font-extrabold text-foreground font-mono">â‚¹5,000</span>
                    <span className="text-xs text-muted-foreground block mt-0.5">One-time enrollment fee</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      'Full lifetime access',
                      `${chapters.length} structured chapters`,
                      `${quizzes.length} reward-earning quizzes`,
                      'Downloadable certificate',
                      'Live class access',
                    ].map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      setShowEnrollmentForm(true);
                      setEnrollmentSubmitted(false);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold h-10 shadow-lg shadow-primary/20"
                  >
                    Enroll Now
                  </Button>

                  {enrollmentSubmitted && (
                    <p className="text-[10px] text-emerald-600 font-semibold text-center">
                      Enrollment request submitted for this course. Our team will contact you shortly.
                    </p>
                  )}

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => handleSelectCourse(previewCourse.id)}
                      className="text-[10px] text-primary font-bold hover:underline"
                    >
                      Continue learning
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuizzesView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pl-1">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              My Quizzes
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              All quizzes for your enrolled courses. Click Start Quiz to begin.
            </p>
          </div>
        </div>

        {loadingQuizzes ? (
          <div className="p-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading quizzesâ€¦
          </div>
        ) : apiQuizzes.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Award className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-semibold text-foreground">No quizzes available</p>
            <p className="text-xs text-muted-foreground">Enroll in courses to access their quizzes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiQuizzes.map((qz: any) => {
              const attemptsUsed = qz.my_result?.attempt_count ?? 0;
              const maxAtt = qz.max_attempts ?? 1;
              const exhausted = attemptsUsed >= maxAtt;
              const hasPassed = qz.my_result?.passed;
              const lastScore = qz.my_result ? `${qz.my_result.score}/${qz.my_result.total_marks}` : null;
              const deadline = qz.deadline ? new Date(qz.deadline) : null;

              return (
                <Card key={qz.id} className={`border bg-card shadow-sm transition-colors ${exhausted ? 'border-border/40 opacity-80' : 'border-border hover:border-primary/40'}`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{qz.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{qz.course?.title}</p>
                        {qz.module && <p className="text-[9px] text-muted-foreground">Chapter: {qz.module.title}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {qz.is_final_assessment && (
                          <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">Final</span>
                        )}
                        {hasPassed && (
                          <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">Passed âœ“</span>
                        )}
                      </div>
                    </div>
                    {qz.description && <p className="text-[11px] text-muted-foreground">{qz.description}</p>}
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-muted/40 font-semibold">{qz._count?.questions ?? 0} Questions</span>
                      {qz.time_limit_mins && <span className="px-2 py-0.5 rounded-full bg-muted/40 font-semibold">{qz.time_limit_mins} min</span>}
                      <span className="px-2 py-0.5 rounded-full bg-muted/40 font-semibold">Pass: {qz.passing_score ?? 60}%</span>
                      {maxAtt > 1
                        ? <span className={`px-2 py-0.5 rounded-full font-semibold ${exhausted ? 'bg-rose-500/10 text-rose-500' : 'bg-muted/40'}`}>
                            {attemptsUsed}/{maxAtt} attempts used
                          </span>
                        : <span className="px-2 py-0.5 rounded-full bg-muted/40 font-semibold">1 attempt</span>}
                      {deadline && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold">Ends {deadline.toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>}
                    </div>
                    {lastScore && (
                      <p className="text-[10px] text-muted-foreground">Last score: <span className="font-bold text-foreground">{lastScore}</span></p>
                    )}
                    <Button
                      size="sm"
                      onClick={() => { setActiveQuizId(qz.id); setActiveTab('quiz-taking'); }}
                      disabled={exhausted}
                      className={`w-full h-9 text-xs font-bold ${exhausted ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-white'}`}
                    >
                      {exhausted ? 'All Attempts Used â€” View Result' : attemptsUsed > 0 ? `Retry Quiz (Attempt ${attemptsUsed + 1}/${maxAtt})` : 'Start Quiz'}
                    </Button>
                    {exhausted && (
                      <Button size="sm" variant="outline" onClick={() => { setActiveQuizId(qz.id); setActiveTab('quiz-taking'); }}
                        className="w-full h-8 text-xs font-semibold">
                        View My Result
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // RENDER DETAILED COURSE WORKSPACE
  if (activeTab === 'quizzes') {
    return renderQuizzesView();
  }

  if (activeCourseId) {
    const enrollment = apiEnrollments?.find((e: any) => e.course_id === activeCourseId);
    if (enrollment) {
      return (
        <StudentCourseView
          enrollment={enrollment}
          onBack={() => setActiveCourseId(null)}
        />
      );
    }
  }


  // RENDER MY COURSES VIEW (Default activeCourseId = null) â€” delegated to StudentCourses
  return <StudentCourses />;
}
