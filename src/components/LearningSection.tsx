import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api, getStoredToken } from '../services/api';
import {
  Clock,
  CheckCircle, ArrowLeft, ArrowRight, Play, Trophy,
  Video, Lock, CheckCircle2, BookMarked, Award, Loader2,
} from 'lucide-react';
import StudentCourses from './StudentCourses';
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
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">{previewCourse.description}</p>
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
                    <span className="text-3xl font-extrabold text-foreground font-mono">₹5,000</span>
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
            <Loader2 className="w-4 h-4 animate-spin" /> Loading quizzes…
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
                          <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">Passed ✓</span>
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
                      {exhausted ? 'All Attempts Used — View Result' : attemptsUsed > 0 ? `Retry Quiz (Attempt ${attemptsUsed + 1}/${maxAtt})` : 'Start Quiz'}
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

  if (previewCourse) {
    return renderCoursePreview();
  }

  if (currentCourse) {
    return (
      <div className="space-y-6">
        {/* Workspace navigation header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button 
            id="btn-return-catalog"
            onClick={() => setActiveCourseId(null)}
            variant="outline"
            className="text-xs font-semibold py-1.5 h-9 border-border"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Catalog Blueprints
          </Button>

          <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">
            Class ID: {currentCourse.id} • Instructor: {currentCourse.instructor}
          </span>
        </div>

        {/* Course Banner Info */}
        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <span className="inline-flex px-2.5 py-0.5 bg-violet-600/10 text-violet-400 border border-violet-500/20 text-[10px] font-bold tracking-wider uppercase rounded-md">
              {currentCourse.category}
            </span>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{currentCourse.title}</h2>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              {currentCourse.description}
            </p>
          </div>

          <div className="md:w-64 space-y-2 shrink-0 border-l border-border md:pl-6 pt-2 md:pt-0">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-muted-foreground">Course Progress:</span>
              <span className="font-bold text-foreground font-mono">{currentCourse.progress}%</span>
            </div>
            <Progress value={currentCourse.progress} className="h-2 bg-muted-foreground/10" />
            <p className="text-[10px] text-muted-foreground leading-normal">
              Pass the final module quiz to claim the <strong className="text-emerald-500 font-bold">₹15.00 certification bonus</strong>.
            </p>
          </div>
        </div>

        {/* WORKSPACE CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDE: Chapter Syllabus list navigation */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Interactive Syllabus</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-1.5">
                  {/* Render Chapters */}
                  {currentCourse.chapters?.map((ch, idx) => {
                    const isActive = activeChapterIndex === idx && !showQuizInterface;
                    const isUnlocked = idx === 0 || currentCourse.chapters?.[idx - 1]?.completed;
                    
                    let bgStyle = 'hover:bg-muted/30 text-muted-foreground border-transparent';
                    if (isActive) {
                      bgStyle = 'bg-primary/10 text-primary border-primary/20 font-bold';
                    } else if (ch.completed) {
                      bgStyle = 'bg-muted/15 text-foreground border-transparent';
                    } else if (!isUnlocked) {
                      bgStyle = 'opacity-50 cursor-not-allowed border-transparent';
                    }

                    return (
                      <button
                        key={ch.id}
                        id={`btn-chapter-node-${ch.id}`}
                        onClick={() => {
                          if (isUnlocked) {
                            setActiveChapterIndex(idx);
                            setShowQuizInterface(false);
                          }
                        }}
                        disabled={!isUnlocked}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${bgStyle}`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {ch.completed ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : !isUnlocked ? (
                            <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          ) : (
                            <Play className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <span className="text-[9px] text-muted-foreground font-mono block">LEVEL {ch.level}</span>
                            <span className="font-bold truncate block">{ch.title}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono shrink-0 pl-2 text-muted-foreground">{ch.duration}</span>
                      </button>
                    );
                  })}

                  {/* Render final Quiz trigger node */}
                  {activeQuiz && (
                    <button
                      id={`btn-quiz-node-trigger-${currentCourse.id}`}
                      onClick={() => {
                        if (allChaptersCompleted) {
                          handleStartCourseQuiz();
                        }
                      }}
                      disabled={!allChaptersCompleted}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${
                        showQuizInterface
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/25 font-bold shadow-xs'
                          : activeQuiz.completed 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : !allChaptersCompleted 
                              ? 'opacity-40 cursor-not-allowed border-transparent'
                              : 'bg-amber-500/5 hover:bg-amber-500/10 border-dashed border-amber-500/30 text-amber-500'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {activeQuiz.completed ? (
                          <Trophy className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : !allChaptersCompleted ? (
                          <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        ) : (
                          <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono block">FINAL TEST</span>
                          <span className="font-bold truncate block">{activeQuiz.title}</span>
                        </div>
                      </div>
                      <span className="text-[9.5px] font-bold text-emerald-500 shrink-0 pl-2 font-mono">+₹{activeQuiz.reward}</span>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDE: Active workspace panel */}
          <div className="lg:col-span-8">
            <Card className="border border-border bg-card shadow-xs min-h-[400px] flex flex-col justify-between">
              
              {!showQuizInterface ? (
                /* Chapter Reading / Video Lecture View */
                <>
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                        LEVEL {activeChapter?.level} LECTURE
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {activeChapter?.duration}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground mt-1.5">
                      {activeChapter?.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6 flex-1">
                    {/* Mock Glowing Video Player Container */}
                    <div className="w-full aspect-video rounded-xl border border-border bg-gradient-to-tr from-[#160a29] to-[#0d0714] shadow-lg relative overflow-hidden flex flex-col items-center justify-center space-y-3 group t2u-purple-glow">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.1)_0%,_transparent_65%)] pointer-events-none" />
                      <div className="w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-violet-500/25 transition-transform duration-300 group-hover:scale-105 cursor-pointer">
                        <Video className="w-6 h-6 ml-0.5 text-white" />
                      </div>
                      <div className="text-center z-10">
                        <span className="text-xs font-bold text-white block">Simulated Classroom Stream</span>
                        <span className="text-[9.5px] text-muted-foreground block font-mono mt-0.5">Duration: {activeChapter?.duration} • Resolution: 1080p HD</span>
                      </div>
                    </div>

                    {/* Lesson Text Content */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                        <BookMarked className="w-3.5 h-3.5 text-primary" />
                        Lesson Blueprints Content
                      </h4>
                      <p className="text-xs text-foreground font-sans leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/40">
                        {activeChapter?.content}
                      </p>
                    </div>
                  </CardContent>

                  <div className="p-6 border-t border-border mt-auto flex justify-between items-center bg-muted/10">
                    <span className="text-[11px] text-muted-foreground font-sans">
                      {activeChapter?.completed ? 'Chapter completed! You can review details.' : 'Complete lesson to unlock next level.'}
                    </span>
                    <Button
                      id="btn-complete-chapter"
                      onClick={handleMarkChapterDone}
                      disabled={activeChapter?.completed}
                      className={`text-xs font-bold ${
                        activeChapter?.completed 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg'
                      }`}
                    >
                      {activeChapter?.completed ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Level Finished
                        </span>
                      ) : (
                        'Complete & Unlock Next Level'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                /* Interactive Module Quiz Player Workspace */
                <>
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                        FINAL EXAM TIER
                      </span>
                      <span className="text-xs font-bold text-emerald-500 font-mono">
                        Certification Prize: +₹15.00
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground mt-1.5">
                      {activeQuiz?.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Question {activeQuizQuestionIndex + 1} of {activeQuiz?.questionsCount}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6 flex-1">
                    {!quizComplete ? (
                      <>
                        {/* Question Panel */}
                        <div className="p-4 rounded-xl bg-muted/40 border border-border">
                          <p className="text-xs font-bold leading-relaxed text-foreground">
                            {activeQuiz?.questions?.[activeQuizQuestionIndex]?.questionText}
                          </p>
                        </div>

                        {/* Options Selectors */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {activeQuiz?.questions?.[activeQuizQuestionIndex]?.options.map((option, idx) => {
                            const isSelected = selectedQuizOption === idx;
                            return (
                              <button
                                key={idx}
                                id={`course-quiz-opt-${idx}`}
                                onClick={() => setSelectedQuizOption(idx)}
                                className={`w-full text-left p-3.5 text-xs rounded-xl border transition-all ${
                                  isSelected 
                                    ? 'bg-violet-600/10 border-violet-500 text-violet-500 font-semibold' 
                                    : 'border-border/60 hover:border-border hover:bg-muted/30 text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                                    isSelected 
                                      ? 'bg-violet-600 border-violet-600 text-white' 
                                      : 'border-muted-foreground/30 text-muted-foreground'
                                  }`}>
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span>{option}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      /* Exam Passed visual summary screen */
                      <div className="text-center py-10 space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/5">
                          <Trophy className="w-8 h-8" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-base font-bold text-foreground">Course Fully Completed!</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto font-sans">
                            Congratulations! You scored 100% on the final exam. Your credential ratings has increased and a reward of <strong>₹15.00</strong> was claimed.
                          </p>
                        </div>
                        <div className="bg-muted/40 p-4 rounded-xl border border-border font-mono text-[11px] text-left max-w-xs mx-auto space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Course Status:</span>
                            <span className="font-bold text-emerald-500">100% CERTIFIED</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Financial Bonus:</span>
                            <span className="font-bold text-foreground">+₹15.00 CREDITED</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Verification Node:</span>
                            <span className="font-bold text-foreground">SHA-256 Verified</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <div className="p-6 border-t border-border mt-auto flex justify-end bg-muted/10">
                    {!quizComplete ? (
                      <Button
                        onClick={handleNextQuizQuestion}
                        disabled={selectedQuizOption === null}
                        className="text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg"
                      >
                        {activeQuizQuestionIndex === (activeQuiz?.questionsCount || 1) - 1 ? 'Submit & Finalize Exam' : 'Next Question'}
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setActiveCourseId(null)}
                        className="text-xs font-semibold bg-secondary hover:bg-muted border border-border text-primary hover:text-primary"
                      >
                        Return to Catalog Catalog
                      </Button>
                    )}
                  </div>
                </>
              )}
              
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // RENDER MY COURSES VIEW (Default activeCourseId = null) — delegated to StudentCourses
  return <StudentCourses />;
}
