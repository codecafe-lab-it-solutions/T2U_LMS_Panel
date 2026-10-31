import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getMediaUrl, getStoredToken } from '../services/api';
import {
  Video, Play, Search, Filter, Calendar, Clock, User,
  AlertCircle, Loader2, X, Sparkles, Tv, BookMarked, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '../utils/date';

type Tab = 'course' | 'live';

interface ActiveVideo {
  title: string;
  subtitle: string;
  embed: { type: 'youtube' | 'video' | 'iframe'; src: string };
}

function detectEmbed(rawUrl: string): { type: 'youtube' | 'video' | 'iframe'; src: string } {
  if (!rawUrl) return { type: 'iframe', src: '' };
  const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) {
    return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };
  }
  if (/\.(mp4|webm|ogg|mov)$/i.test(rawUrl)) {
    return { type: 'video', src: getMediaUrl(rawUrl) };
  }
  return { type: 'iframe', src: rawUrl };
}

export default function PrerecordedVideos() {
  const [tab, setTab] = useState<Tab>('course');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [collapsedCourses, setCollapsedCourses] = useState<Set<string>>(new Set());

  // ── Tab 1: module-wise videos from enrolled courses ──────────────────────
  const { data: enrollments = [], isLoading: loadingCourseVideos } = useQuery({
    queryKey: ['enrolled-courses', getStoredToken()],
    queryFn: () => api.courses.enrolled(),
    enabled: !!getStoredToken() && tab === 'course',
  });

  // Backend only populates modules/lessons for approved enrollments (empty arrays otherwise),
  // so no separate payment-status filter is needed here.
  const courseGroups = enrollments
    .map(e => ({
      course: e.course,
      videoModules: e.course.modules
        .map(m => ({ ...m, lessons: m.lessons.filter(l => l.type === 'video') }))
        .filter(m => m.lessons.length > 0),
    }))
    .filter(g => g.videoModules.length > 0);

  // ── Tab 2: missed live-class recordings ───────────────────────────────────
  const { data: liveClasses = [], isLoading: loadingLive } = useQuery<any[]>({
    queryKey: ['live-classes-prerecorded'],
    queryFn: () => api.liveClasses.list(),
    enabled: !!getStoredToken() && tab === 'live',
  });
  const recordings = liveClasses.filter(c => c.recording_url || c.status === 'ended');

  const courseTitles = tab === 'course'
    ? Array.from(new Set(courseGroups.map(g => g.course.title)))
    : Array.from(new Set(recordings.map(r => r.course?.title).filter(Boolean)));

  const filteredCourseGroups = courseGroups.filter(g => {
    const matchesCourse = selectedCourse === 'All' || g.course.title === selectedCourse;
    if (!matchesCourse) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return g.course.title.toLowerCase().includes(q)
      || g.videoModules.some(m => m.title.toLowerCase().includes(q) || m.lessons.some(l => l.title.toLowerCase().includes(q)));
  });

  const filteredRecordings = recordings.filter(r => {
    const title = r.title || '';
    const topic = r.topic || '';
    const courseTitle = r.course?.title || '';
    const instructorName = r.instructor?.full_name || '';
    const matchesSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      topic.toLowerCase().includes(search.toLowerCase()) ||
      courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      instructorName.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = selectedCourse === 'All' || courseTitle === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  function toggleCourseCollapsed(courseId: string) {
    setCollapsedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId); else next.add(courseId);
      return next;
    });
  }

  function switchTab(next: Tab) {
    setTab(next);
    setSearch('');
    setSelectedCourse('All');
  }

  const isLoading = tab === 'course' ? loadingCourseVideos : loadingLive;
  const totalCount = tab === 'course'
    ? courseGroups.reduce((s, g) => s + g.videoModules.reduce((s2, m) => s2 + m.lessons.length, 0), 0)
    : recordings.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-900/20 via-primary/10 to-transparent p-6 rounded-2xl border border-violet-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-600/10 text-violet-500 border border-violet-500/20">
              <Tv className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-foreground">Pre-recorded Videos</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Watch your course video lessons anytime, or catch up on live classes you missed.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-card px-4 py-2 rounded-xl border border-border shrink-0">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{totalCount} {tab === 'course' ? 'Videos' : 'Sessions'} Available</span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border w-full sm:w-auto sm:inline-flex">
        <button
          type="button"
          onClick={() => switchTab('course')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-4 rounded-lg transition-all ${
            tab === 'course' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" /> Course Videos
        </button>
        <button
          type="button"
          onClick={() => switchTab('live')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-4 rounded-lg transition-all ${
            tab === 'live' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tv className="w-3.5 h-3.5" /> Live Class Recordings
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'course' ? 'Search by course, module, or lesson…' : 'Search by session title, topic, or instructor…'}
            className="pl-9 h-9 text-xs bg-card border-border"
          />
        </div>
        {courseTitles.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none w-full sm:w-48"
            >
              <option value="All">All Courses</option>
              {courseTitles.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-xs font-semibold">Loading…</span>
        </div>
      ) : tab === 'course' ? (
        filteredCourseGroups.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-card border border-border rounded-2xl">
            <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/30" />
            <h3 className="text-sm font-bold text-foreground">No Course Videos Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {courseGroups.length === 0
                ? 'None of your enrolled courses have video lessons yet.'
                : 'No videos match your active search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourseGroups.map(g => {
              const collapsed = collapsedCourses.has(g.course.id);
              const totalVideos = g.videoModules.reduce((s, m) => s + m.lessons.length, 0);
              return (
                <Card key={g.course.id} className="border border-border bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCourseCollapsed(g.course.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/10 transition-colors text-left"
                  >
                    {g.course.thumbnail_url ? (
                      <img src={getMediaUrl(g.course.thumbnail_url)} alt={g.course.title} onError={(e) => { e.currentTarget.src = '/images/computer-skills.png'; }} className="w-12 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <BookMarked className="w-4 h-4 text-violet-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{g.course.title}</p>
                      <p className="text-[10px] text-muted-foreground">{totalVideos} video{totalVideos !== 1 ? 's' : ''} · {g.videoModules.length} module{g.videoModules.length !== 1 ? 's' : ''}</p>
                    </div>
                    {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {!collapsed && (
                    <div className="border-t border-border/40 divide-y divide-border/20">
                      {g.videoModules.map(m => (
                        <div key={m.id} className="p-4 space-y-2">
                          <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">{m.title}</p>
                          <div className="space-y-1">
                            {m.lessons.map(l => (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => setActiveVideo({
                                  title: l.title,
                                  subtitle: `${g.course.title} · ${m.title}`,
                                  embed: detectEmbed(l.content_url || ''),
                                })}
                                disabled={!l.content_url}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <span className="w-7 h-7 rounded-full bg-violet-600/10 text-violet-500 flex items-center justify-center shrink-0">
                                  <Play className="w-3 h-3 fill-current ml-0.5" />
                                </span>
                                <span className="flex-1 text-xs font-semibold text-foreground truncate">{l.title}</span>
                                {l.duration_mins != null && (
                                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{l.duration_mins}m
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      ) : filteredRecordings.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-card border border-border rounded-2xl">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/30" />
          <h3 className="text-sm font-bold text-foreground">No Pre-recorded Videos Found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {recordings.length === 0
              ? 'No live class recordings have been published yet. Check back after scheduled live classes end.'
              : 'No recordings match your active search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecordings.map((item: any) => {
            const dateStr = item.scheduled_at ? formatDate(item.scheduled_at) : 'Recorded Session';

            return (
              <Card key={item.id} className="border border-border bg-card overflow-hidden hover:border-violet-500/40 hover:shadow-lg transition-all flex flex-col group">
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                  <Tv className="w-12 h-12 text-white/20 group-hover:scale-110 transition-transform duration-300" />

                  <button
                    type="button"
                    onClick={() => item.recording_url && setActiveVideo({
                      title: item.title,
                      subtitle: item.instructor?.full_name ? `Instructor: ${item.instructor.full_name}` : '',
                      embed: detectEmbed(item.recording_url),
                    })}
                    disabled={!item.recording_url}
                    className="absolute inset-0 z-20 flex items-center justify-center group-hover:scale-105 transition-transform disabled:cursor-not-allowed"
                  >
                    <span className="w-12 h-12 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:bg-violet-500 transition-colors">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </span>
                  </button>

                  {item.course?.category && (
                    <span className="absolute top-3 left-3 z-20 text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full border border-white/10">
                      {item.course.category}
                    </span>
                  )}

                  <span className="absolute bottom-3 right-3 z-20 text-[10px] font-mono font-bold text-white bg-black/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-violet-400" /> {item.duration_mins || 60}m
                  </span>
                </div>

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">
                      {item.course?.title || 'Course Lecture'}
                    </p>
                    <h3 className="text-sm font-extrabold text-foreground leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    {item.topic && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        Topic: {item.topic}
                      </p>
                    )}
                    {!item.recording_url && (
                      <p className="text-[10px] text-amber-500 font-semibold">Recording not yet available</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {item.instructor?.full_name || 'Instructor'}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {dateStr}
                      </span>
                    </div>

                    <Button
                      type="button"
                      disabled={!item.recording_url}
                      onClick={() => setActiveVideo({
                        title: item.title,
                        subtitle: item.instructor?.full_name ? `Instructor: ${item.instructor.full_name}` : '',
                        embed: detectEmbed(item.recording_url),
                      })}
                      className="w-full h-8 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white gap-1.5 disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Watch Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Video Modal Player — shared by both tabs */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-violet-400 uppercase">{activeVideo.subtitle || 'Video'}</p>
                <h2 className="text-sm font-extrabold text-slate-100 truncate">{activeVideo.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black relative flex items-center justify-center">
              {activeVideo.embed.type === 'youtube' ? (
                <iframe
                  src={activeVideo.embed.src}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  title={activeVideo.title}
                />
              ) : activeVideo.embed.type === 'video' ? (
                <video src={activeVideo.embed.src} controls autoPlay className="w-full h-full" />
              ) : activeVideo.embed.src ? (
                <iframe src={activeVideo.embed.src} className="w-full h-full border-0" allowFullScreen title={activeVideo.title} />
              ) : (
                <div className="text-center space-y-2 p-6 text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto text-amber-500/80" />
                  <p className="text-xs">No direct stream URL provided for this session.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span>{activeVideo.subtitle}</span>
              <Button size="sm" variant="outline" onClick={() => setActiveVideo(null)} className="h-8 text-xs border-slate-700 text-slate-200">
                Close Player
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
