import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api, getStoredToken, getMediaUrl } from '../services/api';
import {
  GraduationCap, ArrowRight, Award,
  Clock, Calendar, Play,
  CheckCircle2, ExternalLink, Video,
  BookOpen, ClipboardList, Plus, Trash2, Tv
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function HomeDashboard() {
  const {
    setActiveTab,
    userRole,
    userProfile,
    courses: storeCourses,
    liveClasses: storeLiveClasses,
    ongoingQuizzes,
    assignments,
    rewardPoints,
    earningSummary,
    joinLiveClass,
    startLiveClass,
    endLiveClass,
    deleteLiveClass,
    setActiveCourseId,
    setActiveQuizId,
    authToken,
  } = useAppStore();

  // Fetch real enrolled courses when logged in via real backend
  const { data: apiEnrollments } = useQuery({
    queryKey: ['enrolled-courses', authToken],
    queryFn: () => api.courses.enrolled(),
    enabled: !!authToken && userRole === 'student',
    staleTime: 60_000,
  });

  // Fetch instructor's own courses
  const { data: apiInstructorCourses } = useQuery({
    queryKey: ['instructor-courses', authToken],
    queryFn: () => api.courses.instructor(),
    enabled: !!authToken && userRole === 'instructor',
    staleTime: 60_000,
  });

  // Fetch live classes for the dashboard (auto-refreshes every 60 s to catch status changes)
  const { data: apiLiveClassesRaw = [] } = useQuery<any[]>({
    queryKey: ['live-classes-list', authToken],
    queryFn: () => api.liveClasses.list(),
    enabled: !!authToken,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Real stats for student dashboard
  const { data: myStats } = useQuery({
    queryKey: ['my-stats', authToken],
    queryFn: () => api.reports.myStats(),
    enabled: !!authToken && userRole === 'student',
    staleTime: 60_000,
  });

  // Real stats for instructor dashboard
  const { data: instructorStats } = useQuery({
    queryKey: ['instructor-stats', authToken],
    queryFn: () => api.reports.instructorStats(),
    enabled: !!authToken && userRole === 'instructor',
    staleTime: 60_000,
  });

  // Real course analytics for Student Performance card
  const { data: homeAnalytics } = useQuery({
    queryKey: ['courses-analytics-home', authToken],
    queryFn: () => api.courses.analytics(),
    enabled: !!authToken && userRole === 'instructor',
    staleTime: 120_000,
  });

  // Derive display data: real API takes precedence over mock store data
  const enrolledCourses = authToken && apiEnrollments
    ? apiEnrollments.map(e => ({
        id: e.course.id,
        title: e.course.title,
        description: e.course.description ?? '',
        category: e.course.category ?? '',
        thumbnail: getMediaUrl(e.course.thumbnail_url) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
        duration: e.course.duration_hrs ? `${e.course.duration_hrs}h` : '--',
        progress: e.completion_percentage ?? 0,
        featured: false,
        instructor: e.course.instructor?.full_name ?? 'Instructor',
        modulesCount: e.course.modules?.length ?? 0,
        courseStatus: 'enrolled' as const,
        chapters: [],
        quizzes: [],
        lastActivity: e.lesson_progress?.length > 0 ? 'Recently' : '--',
      }))
    : storeCourses.filter(c => c.courseStatus === 'enrolled');

  // Map API live classes into dashboard display format
  const liveClasses = authToken && apiLiveClassesRaw.length > 0
    ? apiLiveClassesRaw.map((item: any) => {
        let dateStr = '—';
        let timeStr = '—';
        if (item.scheduled_at) {
          const d = new Date(item.scheduled_at);
          dateStr = d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
          timeStr = d.toLocaleTimeString('en-IN', { timeStyle: 'short' });
        }
        const displayStatus = item.status === 'live' ? 'LIVE'
          : item.status === 'ended' ? 'Completed'
          : item.status === 'cancelled' ? 'Cancelled'
          : 'Upcoming';
        return {
          id: item.id,
          title: item.title,
          course: item.course?.title || '',
          topic: item.topic || '',
          instructor: item.instructor?.full_name || '',
          date: dateStr,
          time: timeStr,
          duration: `${item.duration_mins || 60} Mins`,
          status: displayStatus,
          meetingLink: item.zoom_join_url || '',
          startUrl: item.zoom_start_url || '',
          recordingLink: item.recording_url || '',
        };
      })
    : storeLiveClasses;
  // Only show upcoming/live on dashboard — hide ended/completed/cancelled
  const upcomingLiveClasses = liveClasses.filter(c => c.status === 'Upcoming' || c.status === 'LIVE');

  const completedCount = authToken && apiEnrollments
    ? apiEnrollments.filter(e => e.completion_status === 'completed').length
    : storeCourses.filter(c => c.progress === 100).length;

  // Quizzes: real API for enrolled students
  const { data: apiQuizzesRaw = [] } = useQuery<any[]>({
    queryKey: ['student-quizzes-dashboard', authToken],
    queryFn: () => api.quizzes.list(),
    enabled: !!getStoredToken() && userRole === 'student',
    staleTime: 60_000,
  });

  const apiQuizzes = authToken && userRole === 'student'
    ? apiQuizzesRaw.map((q: any) => ({
        id: q.id,
        title: q.title,
        category: q.course?.title ?? 'Course',
        description: q.description ?? `From: ${q.course?.title ?? ''}`,
        availableUntil: q.deadline ? new Date(q.deadline).toLocaleDateString('en-IN') : 'Open',
        questionsCount: q._count?.questions ?? 0,
        reward: 0,
        completed: false,
      }))
    : null;

  // Resume course helper
  const handleResumeCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setActiveTab('courses');
  };

  // Navigate to full-page quiz taking
  const handleOpenQuiz = (quiz: any) => {
    setActiveQuizId(quiz.id);
    setActiveTab('quiz-taking');
  };


  // ==========================================
  // RENDER INSTRUCTOR DASHBOARD
  // ==========================================
  if (userRole === 'instructor') {
    const myCourses = authToken && apiInstructorCourses ? apiInstructorCourses : storeCourses;
    const totalStudents = instructorStats?.totalStudents
      ?? (authToken && apiInstructorCourses
        ? apiInstructorCourses.reduce((sum: number, c: any) => sum + (c._count?.enrollments ?? 0), 0)
        : 0);
    const todayStr = new Date().toDateString();
    const liveClassesToday = instructorStats?.liveClassesToday
      ?? apiLiveClassesRaw.filter((c: any) => c.scheduled_at && new Date(c.scheduled_at).toDateString() === todayStr).length;
    const pendingAssignmentsCount = instructorStats?.pendingGrading
      ?? assignments.filter(as => as.status === 'Submitted').length;
    const totalReferrals = instructorStats?.referrals ?? 0;
    const totalEarnings = instructorStats?.totalCommissions != null
      ? instructorStats.totalCommissions
      : earningSummary.total;

    return (
      <div className="space-y-8 select-none animate-in fade-in duration-300">
        {/* Instructor Greeting */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Welcome, {userProfile.name}! 👋
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground font-sans">
              Manage your live classes, evaluate assignments, and monitor student metrics at a glance.
            </p>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-4 border border-border/60 bg-card/60">
            <span className="text-2xl font-black text-foreground block font-mono">{myCourses.length}</span>
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">My Courses</span>
          </Card>
          <Card className="p-4 border border-border/60 bg-card/60">
            <span className="text-2xl font-black text-foreground block font-mono">{totalStudents}</span>
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Total Students</span>
          </Card>
          <Card className="p-4 border border-border/60 bg-card/60">
            <span className="text-2xl font-black text-primary block font-mono">{liveClassesToday}</span>
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Classes Today</span>
          </Card>
          <Card className="p-4 border border-border/60 bg-card/60">
            <span className="text-2xl font-black text-amber-500 block font-mono">{pendingAssignmentsCount}</span>
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Pending Grads</span>
          </Card>
          <Card className="p-4 border border-border/60 bg-card/60">
            <span className="text-2xl font-black text-foreground block font-mono">{totalReferrals}</span>
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Total Referrals</span>
          </Card>
          <Card className="p-4 border border-border/60 bg-card/60">
            <span className="text-2xl font-black text-emerald-500 block font-mono">₹{Number(totalEarnings).toFixed(2)}</span>
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Total Earnings</span>
          </Card>
        </div>

        {/* Main Grid Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Live class schedule manager */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Tv className="w-4.5 h-4.5 text-primary animate-pulse" />
                    Upcoming Live Class Schedules
                  </CardTitle>
                  <CardDescription className="text-xs">Start and manage live video streams for students</CardDescription>
                </div>
                <Button
                  onClick={() => setActiveTab('live-class-management')}
                  className="h-8 text-[10px] font-bold bg-primary text-primary-foreground rounded-lg px-3"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Create Class
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {upcomingLiveClasses.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No upcoming classes scheduled.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingLiveClasses.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                          item.status === 'LIVE' 
                            ? 'bg-rose-500/5 border-rose-500/25' 
                            : 'bg-muted/20 border-border/60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                              item.status === 'LIVE' 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse'
                                : item.status === 'Completed'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                              {item.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{item.course}</span>
                          </div>
                          <h4 className="text-xs font-bold text-foreground leading-snug">{item.title}</h4>
                          <p className="text-[10px] text-muted-foreground">Topic: {item.topic}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">Date/Time: {item.date} • {item.time} ({item.duration})</p>
                        </div>

                        <div className="flex items-center gap-2.5 sm:self-center">
                          {(item.status === 'Upcoming' || item.status === 'LIVE') && (item as any).startUrl && (
                            <Button
                              onClick={() => window.open((item as any).startUrl, '_blank')}
                              className={`text-[10px] h-8 font-bold px-3.5 rounded-xl shadow-md flex items-center gap-1.5 ${
                                item.status === 'LIVE'
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                                  : 'bg-rose-600 hover:bg-rose-700 text-white'
                              }`}
                            >
                              {item.status === 'LIVE' ? 'Open in Zoom' : 'Start Live Class'}
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                          {item.status === 'Completed' && (
                            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              Completed ✓
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submissions Review checklist */}
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ClipboardList className="w-4.5 h-4.5 text-primary" />
                  Assigned Student Submissions Pending Review
                </CardTitle>
                <CardDescription className="text-xs">Grade uploaded PDF files and provide constructive text feedback</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {assignments.filter(as => as.status === 'Submitted').length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">All assignments evaluated. Good job!</p>
                ) : (
                  <div className="space-y-4">
                    {assignments.filter(as => as.status === 'Submitted').map((as) => (
                      <div key={as.id} className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <span className="text-[9px] font-bold text-violet-400 font-mono uppercase bg-violet-500/5 px-2 py-0.5 rounded-md border border-violet-500/10 block w-max mb-1">
                            {as.course}
                          </span>
                          <h4 className="text-xs font-bold text-foreground leading-tight">{as.title}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Submitted File: <span className="underline cursor-pointer text-primary">{as.submissionFile}</span></p>
                        </div>
                        <Button
                          onClick={() => setActiveTab('assignment-management')}
                          className="text-[10px] h-8 bg-secondary hover:bg-muted text-primary border border-border font-bold px-3.5 rounded-xl"
                        >
                          Grade Submission
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right side analytics column */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Student Performance & Engagement</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {(() => {
                  const attendance = homeAnalytics?.live_attendance_rate ?? null;
                  const completion = homeAnalytics?.avg_progress ?? null;
                  const quizScore  = homeAnalytics?.quiz_pass_rate ?? null;
                  const fmt = (v: number | null) => v === null ? '—' : `${v.toFixed(1)}%`;
                  return (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">General Class Attendance:</span>
                          <span className="font-bold text-foreground">{fmt(attendance)}</span>
                        </div>
                        <Progress value={attendance ?? 0} className="h-1.5 bg-muted-foreground/10" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Course Completion Ratio:</span>
                          <span className="font-bold text-foreground">{fmt(completion)}</span>
                        </div>
                        <Progress value={completion ?? 0} className="h-1.5 bg-muted-foreground/10" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Avg. Quiz Score:</span>
                          <span className="font-bold text-foreground">{fmt(quizScore)}</span>
                        </div>
                        <Progress value={quizScore ?? 0} className="h-1.5 bg-muted-foreground/10" />
                      </div>
                    </>
                  );
                })()}
                <Button 
                  onClick={() => setActiveTab('student-analytics')}
                  className="w-full text-[10px] h-8 bg-secondary hover:bg-muted border border-border text-primary hover:text-primary font-bold mt-2"
                >
                  View Analytics Details
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STUDENT DASHBOARD
  // ==========================================
  return (
    <div className="space-y-8 select-none animate-in fade-in duration-300">
      
      {/* Student Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Hey, {userProfile.name}! 👋
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground font-sans">
            Manage your courses and batches at a glance • <span className="text-primary font-semibold">Now you are an Elite Scholar</span>
          </p>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4 border border-border/60 bg-card/60">
          <span className="text-2xl font-black text-foreground block font-mono">
            {myStats?.enrolledCourses ?? enrolledCourses.length}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Enrolled Courses</span>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/60">
          <span className="text-2xl font-black text-foreground block font-mono">
            {myStats?.completedCourses ?? completedCount}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Completed Courses</span>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/60">
          <span className="text-2xl font-black text-primary block font-mono">
            {myStats?.certificates ?? completedCount}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Certificates</span>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/60">
          <span className="text-2xl font-black text-amber-500 block font-mono">
            {myStats?.rewardPoints ?? rewardPoints.points}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Reward Points</span>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/60">
          <span className="text-2xl font-black text-foreground block font-mono">
            {myStats?.enrolledCourses ?? (storeCourses.filter(c => c.courseStatus === 'enrolled').length || enrolledCourses.length)}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Active Courses</span>
        </Card>
        <Card className="p-4 border border-border/60 bg-card/60">
          <span className="text-2xl font-black text-emerald-500 block font-mono">
            ₹{myStats?.totalCommissions != null ? Number(myStats.totalCommissions).toFixed(2) : earningSummary.total.toFixed(2)}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest block mt-1">Earnings</span>
        </Card>
      </div>

      <div className="space-y-8">
          
          {/* A. UPCOMING LIVE CLASSES (Airtribe-style upcoming sessions cards) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-violet-500 animate-pulse" />
              Upcoming Live Classes
            </h3>

            {upcomingLiveClasses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 bg-card/45 border border-border/60 rounded-2xl">No upcoming live classes scheduled.</p>
            ) : (
              <div className="space-y-4">
                {upcomingLiveClasses.map((item) => {
                  const isLive = item.status === 'LIVE';
                  const isCompleted = item.status === 'Completed';
                  const isUpcoming = item.status === 'Upcoming';

                  return (
                    <Card 
                      key={item.id}
                      className={`border bg-card rounded-2xl p-5 space-y-4 transition-all duration-300 ${
                        isLive ? 'border-rose-500/35 bg-rose-500/[0.02] shadow-[0_0_15px_rgba(239,68,68,0.06)]' : 'border-border/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                              isLive 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' 
                                : isCompleted
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                              {item.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{item.course}</span>
                          </div>
                          <h4 className="text-xs md:text-sm font-bold text-foreground leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[10.5px] text-muted-foreground">Topic: {item.topic} • Instructor: {item.instructor}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-4 border-t border-border/40 mt-1">
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {item.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {item.time} ({item.duration})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 sm:self-center">
                          {isUpcoming && (
                            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                              Waiting for Instructor...
                            </span>
                          )}

                          {isCompleted && (
                            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                              Session Completed ✓
                            </span>
                          )}

                          {isCompleted && (item as any).recordingLink ? (
                            <Button
                              onClick={() => window.open((item as any).recordingLink, '_blank')}
                              className="h-8 px-4 text-[10px] font-bold rounded-xl bg-secondary hover:bg-muted text-primary border border-border flex items-center gap-1.5"
                            >
                              Watch Recording
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Button
                              id={`btn-join-class-${item.id}`}
                              onClick={() => {
                                if (isLive && (item as any).meetingLink) {
                                  window.open((item as any).meetingLink, '_blank');
                                }
                              }}
                              disabled={!isLive || !(item as any).meetingLink}
                              className={`h-8 px-4 text-[10px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md ${
                                isLive
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/15 animate-pulse'
                                  : 'bg-muted/40 text-muted-foreground cursor-not-allowed border border-border/40 shadow-none'
                              }`}
                            >
                              <span>{isLive ? 'JOIN LIVE' : isCompleted ? 'Ended' : `Starts ${(item as any).time}`}</span>
                              {isLive && <ExternalLink className="w-3 h-3" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. ONGOING QUIZZES */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500 animate-pulse" />
              Ongoing Quizzes
            </h3>

            {(apiQuizzes ?? ongoingQuizzes).filter(q => !q.completed).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 bg-card/45 border border-border/60 rounded-2xl">
                No upcoming quizzes available for your enrolled courses.
              </p>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {((apiQuizzes ?? ongoingQuizzes) as any[]).filter((q: any) => !q.completed).map((quiz: any) => {
                const attUsed = quiz.my_result?.attempt_count ?? 0;
                const maxAtt = quiz.max_attempts ?? 1;
                const exhausted = attUsed >= maxAtt;
                return (
                    <Card
                      key={quiz.id}
                      className={`p-5 border bg-card rounded-2xl flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${exhausted ? 'border-border/40 opacity-80' : 'border-border/80 hover:border-amber-500/20'}`}
                    >
                      {quiz.my_result?.passed && (
                        <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md text-[8.5px] font-mono font-bold border border-emerald-500/20">
                          PASSED ✓
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10">
                            {quiz.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">Until {quiz.availableUntil}</span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground leading-tight">{quiz.title}</h4>
                        <p className="text-[11px] text-muted-foreground leading-normal">{quiz.description}</p>
                      </div>
                      <div className="pt-4 border-t border-border/40 mt-4 flex justify-between items-center text-[10.5px]">
                        <span className="text-muted-foreground font-mono">{quiz.questionsCount} Questions</span>
                        {maxAtt > 1 && (
                          <span className={`font-bold font-mono ${exhausted ? 'text-rose-500' : 'text-muted-foreground'}`}>
                            {attUsed}/{maxAtt} attempts
                          </span>
                        )}
                        {quiz.my_result && (
                          <span className="font-bold text-primary font-mono">{quiz.my_result.score}/{quiz.my_result.total_marks}</span>
                        )}
                      </div>
                      <Button
                        id={`btn-start-quiz-${quiz.id}`}
                        onClick={() => handleOpenQuiz(quiz)}
                        className={`w-full mt-4 text-xs font-bold h-8 ${
                          exhausted
                            ? 'bg-muted/40 text-muted-foreground border border-border/40'
                            : 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 text-amber-500'
                        }`}
                      >
                        {exhausted ? 'View Result' : attUsed > 0 ? `Retry (Attempt ${attUsed + 1}/${maxAtt})` : 'Start Quiz'}
                        {!exhausted && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                      </Button>
                    </Card>
                  );
                })}
            </div>
          </div>

          {/* C. ENROLLED COURSES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-primary animate-pulse" />
                My Courses
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('courses')}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                View All
              </button>
            </div>

            {enrolledCourses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10 bg-card/45 border border-border/60 rounded-2xl">
                You are not enrolled in any courses yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolledCourses.map((course) => (
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
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'; }}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                        <span className="absolute top-3 left-3 bg-[#07020d]/80 backdrop-blur-md text-[#f1edfa] font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-border/60">
                          {course.category}
                        </span>
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
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-muted-foreground text-[10px]">
                            {course.progress === 100 ? 'Completed ✓' : course.progress > 0 ? 'In Progress' : 'Not Started'}
                          </span>
                          <span className="text-foreground text-[11px] font-bold font-mono">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1 bg-muted-foreground/10" />
                      </div>
                      <Button
                        id={`btn-resume-dash-${course.id}`}
                        onClick={() => handleResumeCourse(course.id)}
                        className="w-full text-xs font-bold bg-secondary hover:bg-muted text-primary hover:text-primary border border-border py-1.5 h-8.5"
                      >
                        Continue Learning
                        <Play className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
      </div>


    </div>
  );
}
