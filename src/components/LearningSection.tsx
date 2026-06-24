import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { mockApiService } from '../services/mockApi';
import { CourseGridSkeleton } from './Skeletons';
import {
  Search, BookOpen, Clock,
  User, CheckCircle, ArrowLeft, ArrowRight, Play, Trophy,
  Video, Lock, CheckCircle2, BookMarked, Award, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

export default function LearningSection() {
  const queryClient = useQueryClient();
  const {
    courses,
    activeCourseId,
    setActiveCourseId,
    completeChapter,
    submitCourseQuiz
  } = useAppStore();

  const [coursesTab, setCoursesTab] = useState<'enrolled' | 'live' | 'new' | 'upcoming'>('enrolled');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | string>('all');

  // Interactive workspace states
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [showQuizInterface, setShowQuizInterface] = useState(false);

  // Quiz Solver state
  const [activeQuizQuestionIndex, setActiveQuizQuestionIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);

  // Fetch courses via React Query (search filter only — tab filtering is client-side)
  const { data: qCourses, isLoading } = useQuery({
    queryKey: ['coursesList', courses, searchQuery],
    queryFn: () => mockApiService.getCourses(courses, { search: searchQuery }),
  });

  // Current active course helper
  const currentCourse = courses.find(c => c.id === activeCourseId);
  const activeChapter = currentCourse?.chapters?.[activeChapterIndex];
  const activeQuiz = currentCourse?.quizzes?.[0];

  // Check if all chapters in the active course are completed
  const allChaptersCompleted = currentCourse?.chapters?.every(ch => ch.completed) || false;

  const handleSelectCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setActiveChapterIndex(0);
    setShowQuizInterface(false);
    setQuizComplete(false);
    setActiveQuizQuestionIndex(0);
    setSelectedQuizOption(null);
    setQuizAnswers([]);
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

  const categoriesList = ['all', ...Array.from(new Set([...courses.map((course) => course.category), ...(qCourses || []).map((course) => course.category)]))].filter(Boolean);
  const filteredCourses = qCourses
    ? qCourses.filter((course) => activeCategory === 'all' || course.category === activeCategory)
    : [];
  const featuredCourses = filteredCourses.filter((course) => course.featured);

  // RENDER DETAILED COURSE WORKSPACE
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
                      id="btn-quiz-node-trigger"
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

  // RENDER MY COURSES VIEW (Default activeCourseId = null)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pl-1">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            My Courses
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Pick up your learning path, join live classes, and start new courses from one place.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border w-full">
        {(['enrolled', 'live', 'new', 'upcoming'] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setCoursesTab(tab)}
            className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg capitalize tracking-wide transition-all ${
              coursesTab === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'live' ? (
              <span className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
                Live
              </span>
            ) : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {(() => {
        const filtered = courses.filter((course) => course.courseStatus === coursesTab);

        if (filtered.length === 0) {
          return (
            <div className="border border-border bg-card rounded-2xl p-12 text-center select-none">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">No {coursesTab} courses found</h4>
              <p className="text-xs text-muted-foreground font-sans max-w-sm mx-auto mt-1">
                Your {coursesTab} learning plan will appear here once new courses are added.
              </p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((course) => (
              <Card
                key={course.id}
                className="group border border-border bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden shrink-0">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-[#07020d]/80 backdrop-blur-md text-[#f1edfa] font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-border/60">
                      {course.category}
                    </span>
                    {course.courseStatus === 'live' && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 bg-rose-600/90 backdrop-blur-md text-white text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    )}
                    {course.courseStatus === 'new' && (
                      <span className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        NEW
                      </span>
                    )}
                    {course.courseStatus === 'upcoming' && (
                      <span className="absolute top-3 right-3 bg-amber-600/90 backdrop-blur-md text-white text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        UPCOMING
                      </span>
                    )}
                  </div>

                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        {course.modulesCount} Chapters
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Last active: {course.lastActivity}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground leading-snug tracking-tight mt-1 group-hover:text-primary transition-colors line-clamp-1">
                      {course.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">Instructor: {course.instructor}</p>
                  </CardContent>
                </div>

                <div className="p-5 border-t border-border mt-auto pt-4 space-y-3 bg-muted/10">
                  {coursesTab === 'enrolled' && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-muted-foreground text-[10px]">
                          {course.progress === 100 ? 'Completed ✓' : course.progress > 0 ? 'In Progress' : 'Not Started'}
                        </span>
                        <span className="text-foreground text-[11px] font-bold font-mono">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-1 bg-muted-foreground/10" />
                    </div>
                  )}
                  <Button
                    id={`btn-resume-${course.id}`}
                    onClick={() => handleSelectCourse(course.id)}
                    className="w-full text-xs font-bold bg-secondary hover:bg-muted text-primary hover:text-primary border border-border py-1.5 h-8.5"
                  >
                    {coursesTab === 'enrolled' ? 'Continue Learning' : coursesTab === 'live' ? 'Join Live Session' : coursesTab === 'new' ? 'Start Course' : 'Notify Me'}
                    <Play className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
