import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import QuizCreatePage from './admin/QuizCreatePage';
import BatchCreatePage from './admin/BatchCreatePage';
import BatchManagePage from './admin/BatchManagePage';
import CourseDetailPage from './admin/CourseDetailPage';
import InstructorWithdrawal from './admin/InstructorWithdrawal';
import InstructorLiveClassAnalytics from './InstructorLiveClassAnalytics';
import {
  FolderOpen, ClipboardList, BarChart3, Edit2, CheckCircle2,
  User, FileText, ChevronRight, HelpCircle, Info, Plus, Trash2,
  BookOpen, Package, Users, Video, Loader2,
  ExternalLink, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { api, getStoredToken } from '../services/api';

// ── Instructor Quiz Management (real API) ─────────────────────────────────────
function InstructorQuizManagement() {
  const { setActiveTab, authToken } = useAppStore();
  const qc = useQueryClient();

  const { data: quizzes = [], isLoading } = useQuery<any[]>({
    queryKey: ['instructor-quizzes'],
    queryFn: () => api.quizzes.list(),
    enabled: !!getStoredToken(),
  });

  const deleteQuiz = useMutation({
    mutationFn: (id: string) => api.quizzes.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-quizzes'] }),
  });

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
          <div className="text-left">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Quiz Management
            </CardTitle>
            <CardDescription className="text-xs">Create and manage quizzes for your courses and chapters</CardDescription>
          </div>
          <Button
            onClick={() => setActiveTab('instructor-quiz-create')}
            size="sm"
            className="h-8 text-xs bg-primary text-white font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />Create Quiz
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading quizzes…
            </div>
          ) : quizzes.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No quizzes yet.{' '}
              <button type="button" className="text-primary underline font-semibold" onClick={() => setActiveTab('instructor-quiz-create')}>
                Create your first quiz
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                    <th className="p-4">Quiz Title</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Chapter</th>
                    <th className="p-4">Questions</th>
                    <th className="p-4">Pass %</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {quizzes.map((qz: any) => (
                    <tr key={qz.id} className="hover:bg-muted/20">
                      <td className="p-4 font-bold text-foreground">{qz.title}</td>
                      <td className="p-4 text-muted-foreground">{qz.course?.title ?? '—'}</td>
                      <td className="p-4 text-muted-foreground">
                        {qz.module ? (
                          <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Ch {qz.module.order_index}: {qz.module.title}
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground/60">Course-level</span>
                        )}
                      </td>
                      <td className="p-4 font-mono">{qz._count?.questions ?? 0}</td>
                      <td className="p-4 font-mono">{qz.passing_score}%</td>
                      <td className="p-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { if (confirm(`Delete "${qz.title}"?`)) deleteQuiz.mutate(qz.id); }}
                          className="h-6 text-[9px] font-bold px-2 border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InstructorModules() {
  const {
    activeTab,
    courses,
    assignments: storeAssignments,
    gradeAssignment: storeGradeAssignment,
    earningSummary,
    createCourse,
    updateCourse,
    deleteCourse,
    createQuiz,
    updateQuiz,
    deleteQuiz,
  } = useAppStore();

  const qc = useQueryClient();

  // Real API: submissions for grading
  const { data: apiSubmissions = [], isLoading: loadingSubs } = useQuery<any[]>({
    queryKey: ['instructor-submissions'],
    queryFn: () => api.assignments.submissions(),
    enabled: !!getStoredToken(),
  });

  // Real API: instructor courses (for create-assignment form + course grid)
  const { data: instructorCourses = [] } = useQuery<any[]>({
    queryKey: ['instructor-courses'],
    queryFn: () => api.courses.instructor(),
    enabled: !!getStoredToken(),
  });

  // Real API: instructor analytics stats (for Student Analytics page)
  const { data: analyticsStats, isLoading: loadingAnalytics } = useQuery<any>({
    queryKey: ['instructor-analytics-stats'],
    queryFn: () => api.courses.analytics(),
    enabled: !!getStoredToken() && activeTab === 'student-analytics',
    staleTime: 60_000,
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, grade, feedback }: { id: string; grade: string; feedback: string }) =>
      api.assignments.grade(id, grade, feedback),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-submissions'] }),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.assignments.create>[0]) => api.assignments.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-submissions'] }),
  });

  // Create Assignment form state
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignDue, setNewAssignDue] = useState('');
  const [newAssignMaxScore, setNewAssignMaxScore] = useState('100');
  const [newAssignCourseId, setNewAssignCourseId] = useState('');

  // Local grading panel state
  const [selectedAssignId, setSelectedAssignId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Course Editor State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null); // Null means "Create"
  const [courseTitleInput, setCourseTitleInput] = useState('');
  const [courseDescriptionInput, setCourseDescriptionInput] = useState('');
  const [courseCategoryInput, setCourseCategoryInput] = useState('Gig Economy');
  const [courseThumbnailInput, setCourseThumbnailInput] = useState('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600');
  const [courseDurationInput, setCourseDurationInput] = useState('2 Hours');

  // Product detail view state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Quiz Editor State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null); // Null means "Create"
  const [quizCourseId, setQuizCourseId] = useState('');
  const [quizTitleInput, setQuizTitleInput] = useState('');
  const [quizDescriptionInput, setQuizDescriptionInput] = useState('');
  const [quizDurationInput, setQuizDurationInput] = useState('5 Mins');
  const [quizRewardInput, setQuizRewardInput] = useState('15');
  const [quizCategoryInput, setQuizCategoryInput] = useState('Gig Economy');

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignId || !gradeInput) return;
    setSavingGrade(true);
    gradeMutation.mutate(
      { id: selectedAssignId, grade: gradeInput, feedback: feedbackInput },
      {
        onSettled: () => {
          setSavingGrade(false);
          setSelectedAssignId(null);
          setGradeInput('');
          setFeedbackInput('');
        },
      }
    );
  };

  // Course Actions
  const handleOpenAddCourse = () => {
    setEditingCourse(null);
    setCourseTitleInput('');
    setCourseDescriptionInput('');
    setCourseCategoryInput('Gig Economy');
    setCourseThumbnailInput('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600');
    setCourseDurationInput('2 Hours');
    setShowCourseModal(true);
  };

  const handleOpenEditCourse = (course: any) => {
    setEditingCourse(course);
    setCourseTitleInput(course.title);
    setCourseDescriptionInput(course.description);
    setCourseCategoryInput(course.category);
    setCourseThumbnailInput(course.thumbnail);
    setCourseDurationInput(course.duration);
    setShowCourseModal(true);
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitleInput || !courseDescriptionInput) return;

    if (editingCourse) {
      updateCourse({
        ...editingCourse,
        title: courseTitleInput,
        description: courseDescriptionInput,
        category: courseCategoryInput,
        thumbnail: courseThumbnailInput,
        duration: courseDurationInput
      });
    } else {
      createCourse({
        title: courseTitleInput,
        description: courseDescriptionInput,
        category: courseCategoryInput,
        thumbnail: courseThumbnailInput,
        duration: courseDurationInput,
        featured: true,
        courseStatus: 'new',
        instructor: 'Dr. Evelyn Carter',
        modulesCount: 3,
        chapters: [
          { id: Math.random().toString(), level: 1, title: 'Introduction to Core concepts', content: 'Academic overview parameters.', duration: '15 Mins', completed: false }
        ],
        quizzes: []
      });
    }
    setShowCourseModal(false);
  };

  const handleDeleteCourse = (id: string) => {
    if (confirm('Are you sure you want to delete this course from the LMS catalog?')) {
      deleteCourse(id);
    }
  };

  // Quiz Actions
  const handleOpenAddQuiz = () => {
    setEditingQuiz(null);
    setQuizCourseId(courses[0]?.id || '');
    setQuizTitleInput('');
    setQuizDescriptionInput('');
    setQuizDurationInput('5 Mins');
    setQuizRewardInput('15');
    setQuizCategoryInput('Gig Economy');
    setShowQuizModal(true);
  };

  const handleOpenEditQuiz = (qz: any, courseId: string) => {
    setEditingQuiz(qz);
    setQuizCourseId(courseId);
    setQuizTitleInput(qz.title);
    setQuizDescriptionInput(qz.description);
    setQuizDurationInput(qz.duration);
    setQuizRewardInput(qz.reward.toString());
    setQuizCategoryInput(qz.category);
    setShowQuizModal(true);
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitleInput || !quizCourseId) return;

    if (editingQuiz) {
      updateQuiz(quizCourseId, {
        ...editingQuiz,
        title: quizTitleInput,
        description: quizDescriptionInput,
        duration: quizDurationInput,
        reward: Number(quizRewardInput),
        category: quizCategoryInput
      });
    } else {
      createQuiz(quizCourseId, {
        title: quizTitleInput,
        description: quizDescriptionInput,
        questionsCount: 2,
        duration: quizDurationInput,
        reward: Number(quizRewardInput),
        category: quizCategoryInput,
        questions: [
          { id: 'Q1', questionText: 'Sample compliance checking question 1', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 0 },
          { id: 'Q2', questionText: 'Sample compliance checking question 2', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 1 }
        ]
      });
    }
    setShowQuizModal(false);
  };

  const handleDeleteQuiz = (courseId: string, quizId: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      deleteQuiz(courseId, quizId);
    }
  };

  // ==========================================
  // VIEW: COURSE MANAGEMENT (`course-management`)
  // ==========================================
  const renderCourseManagement = () => (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
          <div className="text-left">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FolderOpen className="w-4.5 h-4.5 text-primary" />
              Instructor Assigned Courses
            </CardTitle>
            <CardDescription className="text-xs font-sans">
              Track module distributions, lesson completes, and student attendance lists.
            </CardDescription>
          </div>
          <Button type="button" size="sm"
            onClick={() => setActiveTab('instructor-batch-manage')}
            className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted font-semibold">
            <Users className="w-3.5 h-3.5 mr-1" />Manage Batches
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {instructorCourses.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No courses assigned to you yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {instructorCourses.map((course: any) => (
                <div key={course.id} className="p-4 rounded-xl border border-border bg-muted/10 flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    <div className="flex gap-4 text-left">
                      {course.thumbnail_url
                        ? <img src={course.thumbnail_url} alt={course.title} className="w-16 h-16 rounded-lg object-cover border border-border shrink-0" />
                        : <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><BookOpen className="w-6 h-6 text-primary/40" /></div>
                      }
                      <div className="min-w-0 flex-1">
                        {course.category && (
                          <span className="text-[9px] text-primary font-bold font-mono uppercase bg-primary/10 px-2 py-0.5 rounded-md">
                            {course.category}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-foreground truncate mt-1.5">{course.title}</h4>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {course.duration_hrs ? `${course.duration_hrs}h total` : 'Self-paced'} · {course.status}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/40 grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-muted/40 p-2.5 rounded-lg">
                        <span className="text-muted-foreground block text-[9px] font-bold uppercase">ENROLLED</span>
                        <strong className="text-sm font-mono text-foreground">{course._count?.enrollments ?? 0}</strong>
                      </div>
                      <div className="bg-muted/40 p-2.5 rounded-lg">
                        <span className="text-muted-foreground block text-[9px] font-bold uppercase">MODULES</span>
                        <strong className="text-sm font-mono text-foreground">{course._count?.modules ?? course.modules?.length ?? 0}</strong>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => { setActiveCourseId(course.id); setActiveTab('instructor-course-detail'); }}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[9.5px] font-bold border-primary/20 text-primary hover:bg-primary/10 w-full"
                  >
                    <ChevronRight className="w-3 h-3 mr-1" />View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ==========================================
  // VIEW: QUIZ MANAGEMENT (`quiz-management`)
  // ==========================================
  const renderQuizManagement = () => {
    return <InstructorQuizManagement />;
  };

  // ==========================================
  // VIEW: ASSIGNMENT MANAGEMENT (`assignment-management`)
  // ==========================================
  const renderAssignmentManagement = () => {
    const pendingSubs = apiSubmissions.filter((s: any) => !s.grade);
    const gradedSubs = apiSubmissions.filter((s: any) => s.grade);

    return (
      <div className="space-y-6">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
            <div className="text-left">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ClipboardList className="w-4.5 h-4.5 text-primary animate-pulse" />
                Grading Evaluation Dashboard
              </CardTitle>
              <CardDescription className="text-xs font-sans">
                Evaluate student project answers, issue grading cards, and offer written feedback.
              </CardDescription>
            </div>
            <Button type="button" size="sm" onClick={() => setShowCreateAssignment(true)}
              className="h-8 text-xs bg-primary text-white font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />Create Assignment
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {loadingSubs ? (
              <div className="p-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />Loading submissions…
              </div>
            ) : apiSubmissions.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground font-sans">
                No student submissions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold font-sans">
                      <th className="p-4">Student</th>
                      <th className="p-4">Assignment</th>
                      <th className="p-4">Course</th>
                      <th className="p-4">File</th>
                      <th className="p-4">Grade</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {apiSubmissions.map((sub: any) => {
                      const isPending = !sub.grade;
                      return (
                        <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2 font-bold text-foreground">
                              <User className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div>
                                <p>{sub.student?.full_name ?? '—'}</p>
                                <p className="text-[9px] font-normal text-muted-foreground font-mono">{sub.student?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-foreground">{sub.assignment?.title ?? '—'}</td>
                          <td className="p-4 text-muted-foreground text-[10px]">{sub.assignment?.course?.title ?? '—'}</td>
                          <td className="p-4">
                            {sub.file_url ? (
                              <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                                className="font-mono text-primary hover:underline text-[10px] flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                <ExternalLink className="w-3 h-3" />
                                View
                              </a>
                            ) : <span className="text-muted-foreground text-[10px]">—</span>}
                          </td>
                          <td className="p-4 font-mono font-bold">
                            {isPending ? (
                              <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-[9px]">Pending</span>
                            ) : (
                              <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[9px]">{sub.grade}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {isPending ? (
                              <Button
                                type="button"
                                onClick={() => { setSelectedAssignId(sub.id); setGradeInput('A+'); setFeedbackInput(''); }}
                                className="text-[10px] h-7 bg-primary text-primary-foreground font-bold px-3.5"
                              >
                                Grade
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-sans">Verified ✓</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade submit dialog */}
        {selectedAssignId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <Card className="max-w-md w-full border border-border bg-card shadow-2xl">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-xs font-extrabold uppercase text-muted-foreground text-left">Submit Grade & Feedback</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleGradeSubmit} className="space-y-4">
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Grade Card Code</Label>
                    <Input type="text" required placeholder="E.g. A+, B, 95/100"
                      value={gradeInput} onChange={(e) => setGradeInput(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono" />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Feedback comment</Label>
                    <textarea required placeholder="Provide constructive review comments"
                      value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)}
                      className="w-full min-h-[80px] p-2.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden" />
                  </div>
                  {savingGrade && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10.5px] text-emerald-500 flex items-center gap-2 justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Syncing score with LMS registry...
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" onClick={() => setSelectedAssignId(null)} variant="outline"
                      className="text-xs font-semibold h-8.5 border-border">Cancel</Button>
                    <Button type="submit" disabled={savingGrade}
                      className="bg-primary text-xs font-bold px-5 h-8.5 text-primary-foreground">
                      Verify & Grade
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Assignment Modal */}
        {showCreateAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <Card className="max-w-md w-full border border-border bg-card shadow-2xl">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-xs font-extrabold uppercase text-foreground text-left">Create Assignment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createAssignmentMutation.mutate(
                      { course_id: newAssignCourseId, title: newAssignTitle, description: newAssignDesc, due_date: newAssignDue, max_score: parseInt(newAssignMaxScore) },
                      { onSuccess: () => { setShowCreateAssignment(false); setNewAssignTitle(''); setNewAssignDesc(''); setNewAssignDue(''); setNewAssignMaxScore('100'); setNewAssignCourseId(''); } }
                    );
                  }}
                  className="space-y-4 text-left"
                >
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Course</Label>
                    <select required aria-label="Select course" value={newAssignCourseId} onChange={e => setNewAssignCourseId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden">
                      <option value="">Select course…</option>
                      {instructorCourses.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Title</Label>
                    <Input required value={newAssignTitle} onChange={e => setNewAssignTitle(e.target.value)}
                      placeholder="e.g. Week 3 Project Report" className="h-9 text-xs bg-muted/20 border-border" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Description</Label>
                    <textarea required rows={2} value={newAssignDesc} onChange={e => setNewAssignDesc(e.target.value)}
                      placeholder="Describe the assignment…"
                      className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Due Date</Label>
                      <Input required type="date" value={newAssignDue} onChange={e => setNewAssignDue(e.target.value)}
                        className="h-9 text-xs bg-muted/20 border-border font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Max Score</Label>
                      <Input type="number" min="1" value={newAssignMaxScore} onChange={e => setNewAssignMaxScore(e.target.value)}
                        className="h-9 text-xs bg-muted/20 border-border font-mono" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateAssignment(false)}
                      className="text-xs font-semibold h-9 border-border">Cancel</Button>
                    <Button type="submit" disabled={createAssignmentMutation.isPending}
                      className="bg-primary text-xs font-bold px-6 h-9 text-white">
                      {createAssignmentMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    );
  };

  // ==========================================
  // VIEW: STUDENT ANALYTICS (`student-analytics`)
  // ==========================================
  const renderStudentAnalytics = () => {
    const avgProgress    = analyticsStats?.avg_progress        ?? null;
    const quizPassRate   = analyticsStats?.quiz_pass_rate      ?? null;
    const attendanceRate = analyticsStats?.live_attendance_rate ?? null;
    const totalStudents  = analyticsStats?.total_students      ?? 0;
    const totalCourses   = analyticsStats?.total_courses       ?? 0;
    const totalAttempts  = analyticsStats?.total_quiz_attempts ?? 0;
    const endedClasses   = analyticsStats?.total_ended_classes ?? 0;

    const fmt = (v: number | null) =>
      loadingAnalytics ? '—' : v === null ? '—' : `${v}%`;

    return (
      <div className="space-y-6">

        {/* Top stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Avg Course Progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
              ) : (
                <>
                  <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono">{fmt(avgProgress)}</span>
                  <p className="text-[10px] text-muted-foreground mt-2">Average lesson completion across {totalStudents} enrolled student{totalStudents !== 1 ? 's' : ''}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quiz Pass Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
              ) : (
                <>
                  <span className="text-3xl font-extrabold text-violet-500 tracking-tight font-mono">{fmt(quizPassRate)}</span>
                  <p className="text-[10px] text-muted-foreground mt-2">Passed out of {totalAttempts} total attempt{totalAttempts !== 1 ? 's' : ''}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Live Class Attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
              ) : (
                <>
                  <span className="text-3xl font-extrabold text-emerald-500 tracking-tight font-mono">{fmt(attendanceRate)}</span>
                  <p className="text-[10px] text-muted-foreground mt-2">Attended vs registered across {endedClasses} completed session{endedClasses !== 1 ? 's' : ''}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Courses',  value: totalCourses,  color: 'text-primary' },
            { label: 'Total Students', value: totalStudents, color: 'text-violet-500' },
            { label: 'Quiz Attempts',  value: totalAttempts, color: 'text-amber-500' },
            { label: 'Sessions Done',  value: endedClasses,  color: 'text-emerald-500' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-border bg-card text-center shadow-sm">
              {loadingAnalytics
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
                : <span className={`text-2xl font-black font-mono block ${s.color}`}>{s.value}</span>
              }
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-6 flex items-start gap-3 text-left">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-foreground block">Live data from your courses</span>
              <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                Progress is computed from actual lesson completions. Quiz pass rate reflects all attempt outcomes. Attendance rate covers ended live sessions.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    );
  };

  // ==========================================
  // VIEW: INSTRUCTOR COURSES (`instructor-courses`)
  // ==========================================
  const renderInstructorCourses = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{instructorCourses.length} course{instructorCourses.length !== 1 ? 's' : ''} assigned to you</p>
        <Button type="button" size="sm"
          onClick={() => setActiveTab('instructor-batch-manage')}
          className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted font-semibold">
          <Users className="w-3.5 h-3.5 mr-1" />Manage Batches
        </Button>
      </div>
      {instructorCourses.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">No courses assigned to you yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instructorCourses.map((course: any) => {
            const moduleCount  = course.modules?.length ?? 0;
            const lessonCount  = (course.modules ?? []).reduce((s: number, m: any) => s + (m._count?.lessons ?? 0), 0);
            const quizCount    = course._count?.quizzes ?? 0;
            const enrolled     = course._count?.enrollments ?? 0;
            return (
              <div key={course.id}
                onClick={() => { setActiveCourseId(course.id); setActiveTab('instructor-course-detail'); }}
                className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group">
                {course.thumbnail_url
                  ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-36 object-cover" />
                  : <div className="w-full h-36 bg-primary/10 flex items-center justify-center"><BookOpen className="w-8 h-8 text-primary/40" /></div>}
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {course.category && (
                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase font-mono">{course.category}</span>
                      )}
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase font-mono ${
                        course.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
                      }`}>{course.status}</span>
                    </div>
                    <h4 className="text-xs font-bold text-foreground mt-2 leading-snug group-hover:text-primary transition-colors">{course.title}</h4>
                    {course.short_desc && <p className="text-[10.5px] text-muted-foreground font-sans mt-1 line-clamp-2">{course.short_desc}</p>}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-1.5 text-center mt-auto">
                    {[
                      { label: 'Modules',  value: moduleCount },
                      { label: 'Lessons',  value: lessonCount },
                      { label: 'Quizzes',  value: quizCount   },
                      { label: 'Students', value: enrolled     },
                    ].map(s => (
                      <div key={s.label} className="bg-muted/40 p-2 rounded-lg">
                        <span className="text-[8.5px] text-muted-foreground block uppercase font-bold">{s.label}</span>
                        <strong className="font-mono text-foreground text-xs">{s.value}</strong>
                      </div>
                    ))}
                  </div>

                  {course.duration_hrs && (
                    <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-2">
                      Duration: <strong className="text-foreground font-mono">{course.duration_hrs}h</strong>
                    </p>
                  )}
                  <div className="pt-1 border-t border-border/40 flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3 h-3" />View & Manage</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ==========================================
  // VIEW: INSTRUCTOR PRODUCTS (`instructor-products`)
  // ==========================================
  const renderInstructorProducts = () => {
    const products = [
      {
        id: 'P001',
        name: 'T2U Starter Kit',
        category: 'Learning Pack',
        price: 4999,
        stock: 120,
        status: 'Active',
        bv: 500,
        validity: '6 Months',
        sku: 'T2U-SK-001',
        thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600',
        description: 'Beginner bundle with course access and workbook. Perfect for new distributors starting their T2U journey.',
        features: [
          'Access to 2 foundational courses',
          'Digital workbook & study materials',
          'Gig Economy starter guide',
          '90-day mentor support access',
          'T2U community forum access',
        ],
        includes: ['1× Digital Course License', '1× Workbook PDF', '1× Referral Code Activation'],
      },
      {
        id: 'P002',
        name: 'AI & Gig Mastery Bundle',
        category: 'Course Bundle',
        price: 9999,
        stock: 45,
        status: 'Active',
        bv: 1000,
        validity: '12 Months',
        sku: 'T2U-AIGIG-002',
        thumbnail: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&q=80&w=600',
        description: 'Combined AI + Gig Economy courses with live session access. Unlock advanced earning strategies powered by AI tools.',
        features: [
          'AI Fundamentals & Prompt Engineering course',
          'Gig Economy Mastery course',
          '4 live webinar session passes',
          'Certificate of completion for both courses',
          'Priority instructor support',
          'Binary BV activation at 1000 BV',
        ],
        includes: ['2× Course Licenses', '4× Live Session Passes', '2× Digital Certificates'],
      },
      {
        id: 'P003',
        name: 'Blockchain Pro Pack',
        category: 'Specialization',
        price: 14999,
        stock: 20,
        status: 'Active',
        bv: 1500,
        validity: '12 Months',
        sku: 'T2U-BC-003',
        thumbnail: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&q=80&w=600',
        description: 'Advanced blockchain certification and mentorship access. Master smart contracts, DeFi, and Web3 token ecosystems.',
        features: [
          'Web3 & Token Rewards Ecosystem course',
          'Smart Contract development modules',
          'DeFi fundamentals & yield strategies',
          '1-on-1 mentorship session (30 min)',
          'Blockchain certification badge',
          'Early access to new blockchain content',
        ],
        includes: ['1× Specialization License', '1× Mentorship Session', '1× Blockchain Certificate'],
      },
      {
        id: 'P004',
        name: 'Spoken English Crash Course',
        category: 'Single Course',
        price: 1999,
        stock: 200,
        status: 'Active',
        bv: 200,
        validity: '3 Months',
        sku: 'T2U-ENG-004',
        thumbnail: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&q=80&w=600',
        description: 'Intensive 4-week spoken English program designed for professionals who need confident communication skills.',
        features: [
          '20+ video lessons with native speaker examples',
          'Daily practice exercises',
          'Pronunciation correction modules',
          'Business English communication',
          'Completion certificate',
        ],
        includes: ['1× Course License', '1× Practice Workbook', '1× Certificate'],
      },
    ];

    const selected = selectedProductId ? products.find(p => p.id === selectedProductId) : null;

    // ── PRODUCT DETAIL VIEW ───────────────────────────────────────────────────
    if (selected) {
      return (
        <div className="space-y-0 animate-in fade-in duration-300 max-w-4xl mx-auto">

          {/* Back button */}
          <button
            type="button"
            onClick={() => setSelectedProductId(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-6 transition-colors group"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Back to Products
          </button>

          {/* Hero banner */}
          <div className="relative w-full h-[220px] rounded-2xl overflow-hidden bg-muted mb-6">
            <img src={selected.thumbnail} alt={selected.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-violet-600 text-white text-[9.5px] font-bold uppercase tracking-wider rounded">
                  {selected.category}
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold uppercase rounded-full">
                  {selected.status}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{selected.name}</h1>
              <p className="text-[11px] text-white/70 font-mono mt-0.5">SKU: {selected.sku}</p>
            </div>
          </div>

          {/* Body: left = details, right = info card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-5">

              {/* About */}
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold">About this Product</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">{selected.description}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    {[
                      { label: 'Price', value: `₹${selected.price.toLocaleString('en-IN')}`, color: 'text-emerald-500' },
                      { label: 'BV Points', value: selected.bv, color: 'text-violet-500' },
                      { label: 'Stock Left', value: selected.stock, color: 'text-foreground' },
                      { label: 'Validity', value: selected.validity, color: 'text-foreground' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-muted/30 border border-border/50 rounded-xl p-3 text-center">
                        <span className="text-[8.5px] font-bold text-muted-foreground uppercase tracking-wider block">{label}</span>
                        <strong className={`text-sm font-extrabold font-mono ${color}`}>{value}</strong>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold">Key Features</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-2.5">
                  {selected.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-foreground">{feat}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* What's included */}
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold">What's Included</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selected.includes.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/50 text-xs font-semibold text-foreground">
                        <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right — sticky summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card className="border border-primary/30 bg-card shadow-xl shadow-primary/5 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-violet-600 via-primary to-orange-500" />
                  <CardContent className="p-6 space-y-4">

                    <div className="text-center">
                      <span className="text-3xl font-extrabold text-foreground font-mono">
                        ₹{selected.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">One-time product price</span>
                    </div>

                    <div className="space-y-2 text-xs border border-border/50 rounded-xl p-3 bg-muted/10">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Category</span>
                        <strong className="text-foreground">{selected.category}</strong>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>BV Points</span>
                        <strong className="text-violet-500 font-mono">{selected.bv} BV</strong>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Validity</span>
                        <strong className="text-foreground">{selected.validity}</strong>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Stock</span>
                        <strong className={selected.stock < 30 ? 'text-amber-500 font-mono' : 'text-emerald-500 font-mono'}>
                          {selected.stock} units
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold h-10 shadow-md shadow-primary/10">
                        Assign to Student
                      </Button>
                      <Button variant="outline" className="w-full border-border text-xs font-bold h-9">
                        Edit Product Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── PRODUCT LIST VIEW ─────────────────────────────────────────────────────
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProductId(p.id)}
              className="text-left rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 group cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative h-[160px] overflow-hidden bg-muted">
                <img
                  src={p.thumbnail}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 px-2.5 py-0.5 bg-violet-600 text-white text-[9.5px] font-bold uppercase tracking-wider rounded">
                  {p.category}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold uppercase rounded-full">
                  {p.status}
                </span>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1 gap-3">
                <div>
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">{p.sku}</p>
                  <h3 className="text-sm font-bold text-foreground mt-0.5">{p.name}</h3>
                  <p className="text-[10.5px] text-muted-foreground font-sans mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center border border-border/50 rounded-xl p-3 bg-muted/10">
                  <div>
                    <span className="text-[8.5px] text-muted-foreground block uppercase font-bold">Price</span>
                    <strong className="text-xs font-mono text-emerald-500">₹{p.price.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-muted-foreground block uppercase font-bold">BV</span>
                    <strong className="text-xs font-mono text-violet-500">{p.bv}</strong>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-muted-foreground block uppercase font-bold">Stock</span>
                    <strong className={`text-xs font-mono ${p.stock < 30 ? 'text-amber-500' : 'text-foreground'}`}>{p.stock}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-mono">Valid: {p.validity}</span>
                  <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                    View Details <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ==========================================
  // RETURN — INSTRUCTOR PANEL ONLY
  // ==========================================

  // Full-page views that replace the panel entirely
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const activeCourseId = useAppStore(s => s.activeCourseId);
  const setActiveCourseId = useAppStore(s => s.setActiveCourseId);

  if (activeTab === 'instructor-quiz-create') {
    return <QuizCreatePage onBack={() => setActiveTab('quiz-management')} />;
  }
  if (activeTab === 'instructor-batch-create') {
    return <BatchCreatePage onBack={() => setActiveTab('instructor-batch-manage')} />;
  }
  if (activeTab === 'instructor-batch-manage') {
    return (
      <BatchManagePage
        onBack={() => setActiveTab('course-management')}
        onCreateBatch={() => setActiveTab('instructor-batch-create')}
        role="instructor"
      />
    );
  }
  if (activeTab === 'instructor-course-detail' && activeCourseId) {
    return (
      <CourseDetailPage
        courseId={activeCourseId}
        onBack={() => { setActiveCourseId(null); setActiveTab('instructor-courses'); }}
        role="instructor"
      />
    );
  }
  if (activeTab === 'instructor-withdrawals') {
    return (
      <div className="space-y-6">
        <div className="border-b border-border/40 pb-4 text-left">
          <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-primary" />Withdrawal Requests
          </h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Submit and track your earnings withdrawal requests.</p>
        </div>
        <InstructorWithdrawal />
      </div>
    );
  }
  if (activeTab === 'live-class-analytics') {
    return <InstructorLiveClassAnalytics />;
  }

  return (
    <div className="space-y-6">

      {/* Title greeting blocks */}
      <div className="border-b border-border/40 pb-4 text-left">
        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          {activeTab === 'course-management' && <><FolderOpen className="w-5 h-5 text-primary" /> LMS Course Management</>}
          {activeTab === 'quiz-management' && <><HelpCircle className="w-5 h-5 text-primary" /> Exam registry Logs</>}
          {activeTab === 'assignment-management' && <><ClipboardList className="w-5 h-5 text-primary" /> Assignments evaluator</>}
          {activeTab === 'student-analytics' && <><BarChart3 className="w-5 h-5 text-primary" /> Student Engagement metrics</>}
          {activeTab === 'instructor-courses' && <><BookOpen className="w-5 h-5 text-primary" /> Courses Catalog</>}
          {activeTab === 'instructor-products' && <><Package className="w-5 h-5 text-primary" /> Products Catalog</>}
        </h2>
        <p className="text-xs text-muted-foreground font-sans mt-0.5 font-normal">
          {activeTab === 'course-management' && 'Track progress details across enrolled user modules.'}
          {activeTab === 'quiz-management' && 'Review exam configurations and dynamic rewards parameters.'}
          {activeTab === 'assignment-management' && 'Submit grades scoring cards and review student answers.'}
          {activeTab === 'student-analytics' && 'Aggregate completion rates and student performance metrics.'}
          {activeTab === 'instructor-courses' && 'Browse all courses assigned to you as an instructor.'}
          {activeTab === 'instructor-products' && 'View and manage T2U products and learning bundles.'}
        </p>
      </div>

      {activeTab === 'course-management' && renderCourseManagement()}
      {activeTab === 'quiz-management' && renderQuizManagement()}
      {activeTab === 'assignment-management' && renderAssignmentManagement()}
      {activeTab === 'student-analytics' && renderStudentAnalytics()}
      {activeTab === 'instructor-courses' && renderInstructorCourses()}
      {activeTab === 'instructor-products' && renderInstructorProducts()}

      {/* Course Modal Editor Form */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-primary to-orange-500" />
            <CardHeader className="pb-3 border-b border-border/40 text-left">
              <CardTitle className="text-xs font-extrabold uppercase text-foreground tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-4.5 h-4.5 text-primary" />
                {editingCourse ? 'Edit Course details' : 'Create New LMS Course'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCourseSubmit} className="space-y-4 text-left">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Course Title</Label>
                  <Input 
                    required
                    value={courseTitleInput}
                    onChange={(e) => setCourseTitleInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20 border-border"
                    placeholder="e.g. Solidity Smart Contract Audits"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Description</Label>
                  <textarea 
                    required
                    rows={3}
                    value={courseDescriptionInput}
                    onChange={(e) => setCourseDescriptionInput(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden"
                    placeholder="Detail course outline and scope..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Category</Label>
                    <select
                      aria-label="Course category"
                      value={courseCategoryInput}
                      onChange={(e) => setCourseCategoryInput(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden"
                    >
                      <option value="Gig Economy">Gig Economy</option>
                      <option value="Blockchain">Blockchain</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Spoken English">Spoken English</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Duration</Label>
                    <Input 
                      required
                      value={courseDurationInput}
                      onChange={(e) => setCourseDurationInput(e.target.value)}
                      className="h-9 text-xs bg-muted/20 border-border"
                      placeholder="e.g. 4.5 Hours"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Thumbnail URL</Label>
                  <Input 
                    required
                    value={courseThumbnailInput}
                    onChange={(e) => setCourseThumbnailInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20 border-border font-mono text-[10.5px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => setShowCourseModal(false)}
                    variant="outline"
                    className="text-xs font-semibold h-9 border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-xs font-bold px-6 h-9 text-white"
                  >
                    {editingCourse ? 'Save Changes' : 'Create Course'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quiz Modal Editor Form */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-primary to-orange-500" />
            <CardHeader className="pb-3 border-b border-border/40 text-left">
              <CardTitle className="text-xs font-extrabold uppercase text-foreground tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4.5 h-4.5 text-primary" />
                {editingQuiz ? 'Edit Quiz details' : 'Create New LMS Quiz'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleQuizSubmit} className="space-y-4 text-left">
                
                {!editingQuiz && (
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Linked Course Target</Label>
                    <select
                      aria-label="Linked course"
                      value={quizCourseId}
                      onChange={(e) => setQuizCourseId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden"
                    >
                      <option value="">Select course...</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Quiz Title</Label>
                  <Input 
                    required
                    value={quizTitleInput}
                    onChange={(e) => setQuizTitleInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20 border-border"
                    placeholder="e.g. Smart Contract Security check"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Description</Label>
                  <textarea 
                    required
                    rows={2}
                    value={quizDescriptionInput}
                    onChange={(e) => setQuizDescriptionInput(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden"
                    placeholder="Short summary of exam guidelines..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Category</Label>
                    <select
                      aria-label="Quiz category"
                      value={quizCategoryInput}
                      onChange={(e) => setQuizCategoryInput(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden"
                    >
                      <option value="Gig Economy">Gig Economy</option>
                      <option value="Blockchain">Blockchain</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Spoken English">Spoken English</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Duration</Label>
                    <Input 
                      required
                      value={quizDurationInput}
                      onChange={(e) => setQuizDurationInput(e.target.value)}
                      className="h-9 text-xs bg-muted/20 border-border text-center font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Bounty Reward (INR)</Label>
                  <Input 
                    type="number"
                    required
                    value={quizRewardInput}
                    onChange={(e) => setQuizRewardInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20 border-border font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => setShowQuizModal(false)}
                    variant="outline"
                    className="text-xs font-semibold h-9 border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-xs font-bold px-6 h-9 text-white"
                  >
                    {editingQuiz ? 'Save Changes' : 'Create Quiz'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}

