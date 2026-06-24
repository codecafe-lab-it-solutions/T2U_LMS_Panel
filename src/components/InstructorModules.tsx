import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  FolderOpen, ClipboardList, BarChart3, Edit2, CheckCircle2, 
  User, Calendar, FileText, ChevronRight, Award, HelpCircle, Save, Info, Plus, Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function InstructorModules() {
  const { 
    activeTab, 
    courses, 
    assignments, 
    gradeAssignment,
    earningSummary,
    createCourse,
    updateCourse,
    deleteCourse,
    createQuiz,
    updateQuiz,
    deleteQuiz
  } = useAppStore();

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
    setTimeout(() => {
      gradeAssignment(selectedAssignId, gradeInput, feedbackInput);
      setSavingGrade(false);
      setSelectedAssignId(null);
      setGradeInput('');
      setFeedbackInput('');
    }, 1000);
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
          <Button 
            onClick={handleOpenAddCourse}
            size="sm"
            className="h-8.5 text-xs bg-primary text-white font-bold flex items-center gap-1 shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => {
              const enrollmentCount = course.id === 'C101' ? 84 : 61;
              const completeCount = course.id === 'C101' ? 28 : 8;

              return (
                <div key={course.id} className="p-4 rounded-xl border border-border bg-muted/10 flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    <div className="flex gap-4 text-left">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title} 
                        className="w-16 h-16 rounded-lg object-cover border border-border shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-primary font-bold font-mono uppercase bg-primary/10 px-2 py-0.5 rounded-md">
                          {course.category}
                        </span>
                        <h4 className="text-xs font-bold text-foreground truncate mt-1.5">{course.title}</h4>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          Chapters: {course.chapters?.length || 0} | Duration: {course.duration}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/40 grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-muted/40 p-2.5 rounded-lg">
                        <span className="text-muted-foreground block text-[9px] font-bold uppercase">STUDENTS ENROLLED</span>
                        <strong className="text-sm font-mono text-foreground">{enrollmentCount}</strong>
                      </div>
                      <div className="bg-muted/40 p-2.5 rounded-lg border border-emerald-500/10">
                        <span className="text-emerald-500 block text-[9px] font-bold uppercase font-sans">COMPLETED CORE</span>
                        <strong className="text-sm font-mono text-emerald-500">{completeCount}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                    <Button
                      onClick={() => handleOpenEditCourse(course)}
                      size="xs"
                      variant="outline"
                      className="h-7 text-[9.5px] font-bold border-border/80 text-foreground hover:bg-muted/50"
                    >
                      <Edit2 className="w-3 h-3 mr-1 text-primary" />
                      Edit Course
                    </Button>
                    <Button
                      onClick={() => handleDeleteCourse(course.id)}
                      size="xs"
                      variant="outline"
                      className="h-7 text-[9.5px] font-bold border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3 h-3 mr-1 text-rose-500" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ==========================================
  // VIEW: QUIZ MANAGEMENT (`quiz-management`)
  // ==========================================
  const renderQuizManagement = () => {
    // Map quizzes to include their parent course details
    const quizRows = courses.flatMap(c => 
      (c.quizzes || []).map(qz => ({ qz, courseId: c.id, courseTitle: c.title }))
    );

    return (
      <div className="space-y-6">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
            <div className="text-left">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-primary" />
                LMS Quiz Management Logs
              </CardTitle>
              <CardDescription className="text-xs font-sans">
                Review exam items, edit questions pools, and sync bounty rewards.
              </CardDescription>
            </div>
            <Button 
              onClick={handleOpenAddQuiz}
              size="sm"
              className="h-8.5 text-xs bg-primary text-white font-bold flex items-center gap-1 shadow-md shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              Add Quiz
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {quizRows.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground font-sans">
                No active quizzes in the registry. Click Add Quiz to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold font-sans">
                      <th className="p-4">Quiz Title</th>
                      <th className="p-4">Linked Course</th>
                      <th className="p-4">Questions</th>
                      <th className="p-4 text-right">Bounty Reward</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {quizRows.map(({ qz, courseId, courseTitle }) => (
                      <tr key={qz.id} className="hover:bg-muted/20">
                        <td className="p-4 font-bold text-foreground text-left">{qz.title}</td>
                        <td className="p-4 text-muted-foreground text-left">{courseTitle}</td>
                        <td className="p-4 font-mono text-left">{qz.questionsCount} items</td>
                        <td className="p-4 text-right font-bold font-mono text-emerald-500">₹{qz.reward.toFixed(2)}</td>
                        <td className="p-4 text-center flex items-center justify-center gap-2">
                          <Button
                            onClick={() => handleOpenEditQuiz(qz, courseId)}
                            size="xs"
                            variant="outline"
                            className="h-7 text-[9px] font-bold border-border/80 hover:bg-muted/40"
                          >
                            <Edit2 className="w-3 h-3 mr-1 text-primary" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteQuiz(courseId, qz.id)}
                            size="xs"
                            variant="outline"
                            className="h-7 text-[9px] font-bold border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3 h-3 mr-1 text-rose-500" />
                            Delete
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
  };

  // ==========================================
  // VIEW: ASSIGNMENT MANAGEMENT (`assignment-management`)
  // ==========================================
  const renderAssignmentManagement = () => {
    // Show submitted or all assignments
    const submissions = assignments.filter(as => as.status === 'Submitted' || as.status === 'Graded');

    return (
      <div className="space-y-6">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-primary animate-pulse" />
              Grading Evaluation Dashboard
            </CardTitle>
            <CardDescription className="text-xs font-sans">
              Evaluate student project answers, issue grading cards, and offer written feedback.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {submissions.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground font-sans">
                No active student submissions waiting in queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold font-sans">
                      <th className="p-4">Student</th>
                      <th className="p-4">Assignment Name</th>
                      <th className="p-4">Uploaded File</th>
                      <th className="p-4">Score Grade</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {submissions.map((sub) => {
                      const studentName = sub.studentName || 'Aarya Garg (Student)';
                      const isSubmitted = sub.status === 'Submitted';

                      return (
                        <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 flex items-center gap-2 font-bold text-foreground">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {studentName}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-foreground block text-left">{sub.title}</span>
                            <span className="text-[9.5px] text-muted-foreground font-mono text-left block">{sub.course}</span>
                          </td>
                          <td className="p-4 font-mono text-primary hover:underline cursor-pointer flex items-center gap-1 text-left">
                            <FileText className="w-3.5 h-3.5" />
                            {sub.submissionFile}
                          </td>
                          <td className="p-4 font-mono font-bold">
                            {isSubmitted ? (
                              <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">Pending</span>
                            ) : (
                              <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{sub.grade}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {isSubmitted ? (
                              <Button
                                id={`btn-grade-${sub.id}`}
                                onClick={() => {
                                  setSelectedAssignId(sub.id);
                                  setGradeInput('A+');
                                  setFeedbackInput('Excellent structure and comprehensive verification analysis!');
                                }}
                                className="text-[10px] h-7 bg-primary text-primary-foreground font-bold px-3.5"
                              >
                                Grade Sub
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-sans">Verified</span>
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
                    <Input
                      type="text"
                      required
                      placeholder="E.g. A+, B, 95/100"
                      value={gradeInput}
                      onChange={(e) => setGradeInput(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Feedback comment</Label>
                    <textarea
                      required
                      placeholder="Provide constructive review comments"
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      className="w-full min-h-[80px] p-2.5 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden"
                    />
                  </div>
                  
                  {savingGrade && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10.5px] text-emerald-500 flex items-center gap-2 justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Syncing score with LMS registry...
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      onClick={() => setSelectedAssignId(null)}
                      variant="outline"
                      className="text-xs font-semibold h-8.5 border-border"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingGrade}
                      className="bg-primary text-xs font-bold px-5 h-8.5 text-primary-foreground"
                    >
                      Verify & Grade
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
  const renderStudentAnalytics = () => (
    <div className="space-y-6">
      
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Course Progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono">68.4%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Active student pool progress metric</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quiz Clear Accuracy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-violet-500">92.5%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">First attempt passing registry index</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Live webinar attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono text-emerald-500">84.2%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Webinar broadcast join ratios</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-6 flex items-start gap-3 text-left">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-foreground block">Analytics Reports sync</span>
            <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
              Student engagement charts sync periodically with the main database logs to verify active learning indices.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Title greeting blocks */}
      <div className="border-b border-border/40 pb-4 text-left">
        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          {activeTab === 'course-management' && <><FolderOpen className="w-5 h-5 text-primary" /> LMS Course Management</>}
          {activeTab === 'quiz-management' && <><HelpCircle className="w-5 h-5 text-primary" /> Exam registry Logs</>}
          {activeTab === 'assignment-management' && <><ClipboardList className="w-5 h-5 text-primary" /> Assignments evaluator</>}
          {activeTab === 'student-analytics' && <><BarChart3 className="w-5 h-5 text-primary" /> Student Engagement metrics</>}
        </h2>
        <p className="text-xs text-muted-foreground font-sans mt-0.5 font-normal">
          {activeTab === 'course-management' && 'Track progress details across enrolled user modules.'}
          {activeTab === 'quiz-management' && 'Review exam configurations and dynamic rewards parameters.'}
          {activeTab === 'assignment-management' && 'Submit grades scoring cards and review student answers.'}
          {activeTab === 'student-analytics' && 'Aggregate completion rates and student performance metrics.'}
        </p>
      </div>

      {activeTab === 'course-management' && renderCourseManagement()}
      {activeTab === 'quiz-management' && renderQuizManagement()}
      {activeTab === 'assignment-management' && renderAssignmentManagement()}
      {activeTab === 'student-analytics' && renderStudentAnalytics()}

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

