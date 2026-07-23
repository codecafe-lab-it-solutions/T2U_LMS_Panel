import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getStoredToken } from '../services/api';
import {
  Video, Play, Search, Filter, Calendar, Clock, User,
  AlertCircle, Loader2, X, Sparkles, Tv, CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function getEmbedUrl(url: string): { type: 'youtube' | 'video' | 'iframe'; src: string } {
  if (!url) return { type: 'iframe', src: '' };
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) {
    return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };
  }
  if (/\.(mp4|webm|ogg|mov)$/i.test(url)) {
    return { type: 'video', src: url };
  }
  return { type: 'iframe', src: url };
}

export default function PrerecordedVideos() {
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [activeVideo, setActiveVideo] = useState<any | null>(null);

  // Fetch live classes to extract archived recordings
  const { data: liveClasses = [], isLoading } = useQuery<any[]>({
    queryKey: ['live-classes-prerecorded'],
    queryFn: () => api.liveClasses.list(),
    enabled: !!getStoredToken(),
  });

  // Filter ended classes or any class with a valid recording_url
  const recordings = liveClasses.filter(c => c.recording_url || c.status === 'ended');

  // Unique course list for dropdown filter
  const courseTitles = Array.from(
    new Set(recordings.map(r => r.course?.title).filter(Boolean))
  );

  const filtered = recordings.filter(r => {
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
            Access archived live sessions and class recordings anytime to catch up on missed lessons.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-card px-4 py-2 rounded-xl border border-border shrink-0">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{recordings.length} Sessions Available</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by session title, topic, or instructor…"
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

      {/* Video Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-xs font-semibold">Loading recorded sessions…</span>
        </div>
      ) : filtered.length === 0 ? (
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
          {filtered.map((item: any) => {
            const dateStr = item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            }) : 'Recorded Session';

            return (
              <Card key={item.id} className="border border-border bg-card overflow-hidden hover:border-violet-500/40 hover:shadow-lg transition-all flex flex-col group">
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                  <Tv className="w-12 h-12 text-white/20 group-hover:scale-110 transition-transform duration-300" />
                  
                  <button
                    type="button"
                    onClick={() => setActiveVideo(item)}
                    className="absolute inset-0 z-20 flex items-center justify-center group-hover:scale-105 transition-transform"
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
                      onClick={() => setActiveVideo(item)}
                      className="w-full h-8 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
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

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-violet-400 uppercase">Pre-recorded Class Session</p>
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
              {(() => {
                const embed = getEmbedUrl(activeVideo.recording_url);
                if (embed.type === 'youtube') {
                  return (
                    <iframe
                      src={embed.src}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      title={activeVideo.title}
                    />
                  );
                }
                if (embed.type === 'video') {
                  return <video src={embed.src} controls autoPlay className="w-full h-full" />;
                }
                if (embed.src) {
                  return <iframe src={embed.src} className="w-full h-full border-0" allowFullScreen title={activeVideo.title} />;
                }
                return (
                  <div className="text-center space-y-2 p-6 text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-amber-500/80" />
                    <p className="text-xs">No direct stream URL provided for this session.</p>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span>Instructor: <strong>{activeVideo.instructor?.full_name || '—'}</strong></span>
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
