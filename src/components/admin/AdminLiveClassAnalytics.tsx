import { useState, useMemo } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import {
  Video, UserCheck, UserX, ClipboardCheck, Loader2, RefreshCw,
  LineChart, Search, ArrowLeft, ChevronRight, Clock, Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const sel = (v: string, onChange: (v: string) => void, children: React.ReactNode, label = '') => (
  <select
    value={v}
    onChange={e => onChange(e.target.value)}
    aria-label={label}
    className="h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium min-w-[140px]"
  >
    {children}
  </select>
);

export default function AdminLiveClassAnalytics() {
  const perm = useEmployeePermission('admin-live-class-analytics');
  const qc = useQueryClient();

  // Filter state
  const [search, setSearch]               = useState('');
  const [timelineFilter, setTimeline]     = useState('all');
  const [durationFilter, setDuration]     = useState('all');
  const [courseFilter, setCourse]         = useState('all');
  const [selectedClassId, setSelected]    = useState<string | null>(null);
  const [syncingId, setSyncingId]         = useState<string | null>(null);

  // Queries
  const { data: allClasses = [], isLoading: loadingClasses } = useQuery<any[]>({
    queryKey: ['admin-live-classes-analytics'],
    queryFn: () => api.liveClasses.list(),
    staleTime: 30_000,
  });

  const endedClasses = useMemo(
    () => allClasses.filter(lc => lc.status === 'ended'),
    [allClasses]
  );

  const attendeeResults = useQueries({
    queries: endedClasses.map(lc => ({
      queryKey: ['live-class-attendees', lc.id],
      queryFn: () => api.liveClasses.attendees(lc.id),
      staleTime: 60_000,
    })),
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.liveClasses.syncParticipants(id),
    onMutate: (id) => setSyncingId(id),
    onSettled: () => setSyncingId(null),
    onSuccess: (_res: any, id: string) => {
      qc.invalidateQueries({ queryKey: ['live-class-attendees', id] });
      qc.invalidateQueries({ queryKey: ['admin-live-classes-analytics'] });
    },
  });

  // Build full analytics records
  const allAnalytics = useMemo(() => endedClasses.map((lc, i) => {
    const r = attendeeResults[i];
    const aData: any = r?.data ?? { total: 0, registered: 0, attendees: [] };
    const registered = aData.registered || lc.course?._count?.enrollments || 0;
    const attended   = aData.total ?? 0;
    const absent     = Math.max(0, registered - attended);
    const rate       = registered > 0 ? Math.round((attended / registered) * 100) : 0;
    const rawDate    = lc.scheduled_at ? new Date(lc.scheduled_at) : null;

    return {
      id:          lc.id,
      title:       lc.title,
      course:      lc.course?.title || '—',
      instructor:  lc.instructor?.full_name || '—',
      rawDate,
      dateStr:     rawDate ? rawDate.toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—',
      durationMins: lc.duration_mins || 0,
      registered, attended, absent, rate,
      isLoadingAttendees: r?.isLoading ?? false,
      attendees: (aData.attendees as any[] ?? []).map((a: any) => ({
        name:        a.participant_name || a.user_email || 'Unknown',
        email:       a.user_email || '',
        joinTime:    a.join_time ? new Date(a.join_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
        durationMins: a.duration_secs ? Math.round(a.duration_secs / 60) : null,
      })),
    };
  }), [endedClasses, attendeeResults]);

  // Unique courses for filter
  const uniqueCourses = useMemo(
    () => [...new Set(allAnalytics.map(c => c.course).filter(v => v !== '—'))],
    [allAnalytics]
  );

  // Apply filters
  const filtered = useMemo(() => {
    const now = Date.now();
    const q   = search.toLowerCase();
    return allAnalytics.filter(cls => {
      if (q && !cls.title.toLowerCase().includes(q) && !cls.course.toLowerCase().includes(q) && !cls.instructor.toLowerCase().includes(q)) return false;
      if (timelineFilter !== 'all' && cls.rawDate) {
        const days = (now - cls.rawDate.getTime()) / 86_400_000;
        if (timelineFilter === 'week'    && days > 7)  return false;
        if (timelineFilter === 'month'   && days > 30) return false;
        if (timelineFilter === '3months' && days > 90) return false;
      }
      if (durationFilter !== 'all') {
        const d = cls.durationMins;
        if (durationFilter === 'u30'   && d >= 30)         return false;
        if (durationFilter === '30-60' && (d < 30 || d > 60)) return false;
        if (durationFilter === '60-90' && (d < 60 || d > 90)) return false;
        if (durationFilter === '90p'   && d <= 90)         return false;
      }
      if (courseFilter !== 'all' && cls.course !== courseFilter) return false;
      return true;
    });
  }, [allAnalytics, search, timelineFilter, durationFilter, courseFilter]);

  const totalRegistered = filtered.reduce((s, c) => s + c.registered, 0);
  const totalAttended   = filtered.reduce((s, c) => s + c.attended,   0);
  const totalAbsent     = filtered.reduce((s, c) => s + c.absent,     0);

  const selectedClass = selectedClassId ? allAnalytics.find(c => c.id === selectedClassId) : null;

  const isLoading = loadingClasses || attendeeResults.some(r => r.isLoading);

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (selectedClass) {
    return (
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setSelected(null)} className="h-8 text-xs font-semibold gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <div>
              <h2 className="text-base font-extrabold text-foreground leading-tight">{selectedClass.title}</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {selectedClass.course} · {selectedClass.instructor} · {selectedClass.dateStr}
                {selectedClass.durationMins > 0 && ` · ${selectedClass.durationMins} min`}
              </p>
            </div>
          </div>
          {perm.edit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncMutation.mutate(selectedClass.id)}
              disabled={syncingId === selectedClass.id}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingId === selectedClass.id ? 'animate-spin' : ''}`} />
              {syncingId === selectedClass.id ? 'Syncing…' : 'Sync Zoom'}
            </Button>
          )}
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Registered', value: selectedClass.registered, color: 'text-violet-500' },
            { label: 'Attended',   value: selectedClass.attended,   color: 'text-emerald-500' },
            { label: 'Absent',     value: selectedClass.absent,     color: 'text-rose-500' },
            { label: 'Rate',       value: `${selectedClass.rate}%`, color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-border bg-card text-center">
              <div className={`text-xl font-black font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Attendee table */}
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-0">
            {selectedClass.isLoadingAttendees ? (
              <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading attendees…
              </div>
            ) : selectedClass.attendees.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                {selectedClass.attended > 0 ? (
                  <>
                    <p className="font-semibold text-foreground text-sm">{selectedClass.attended} students attended</p>
                    <p>Per-participant records not yet synced. Click "Sync Zoom" above to import them.</p>
                  </>
                ) : (
                  <p>No attendance records. Click "Sync Zoom" above after the session ends.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3 text-center">Attendance</th>
                      <th className="px-4 py-3 text-center">Duration</th>
                      <th className="px-4 py-3 text-right">Join Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {selectedClass.attendees.map((a, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-[10px]">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                              {a.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{a.name}</p>
                              {a.email && <p className="text-[9px] text-muted-foreground">{a.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-500">ATTENDED</span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                          {a.durationMins != null ? `${a.durationMins} min` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">{a.joinTime}</td>
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

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <LineChart className="w-6 h-6 text-primary" /> Live Class Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Attendance analytics across all instructors and sessions</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Registered', value: totalRegistered, color: 'text-violet-500', sub: 'Across all live sessions' },
          { label: 'Total Attended',   value: totalAttended,   color: 'text-emerald-500', sub: 'Students who joined the session' },
          { label: 'Total Absent',     value: totalAbsent,     color: 'text-rose-500',    sub: 'Registered but did not attend' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-card shadow-sm text-center space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">{s.label}</span>
            <span className={`text-3xl font-extrabold font-mono block ${s.color}`}>{s.value}</span>
            <span className="text-[10px] text-muted-foreground block">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center p-4 bg-card border border-border rounded-xl">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search class or course…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        {sel(timelineFilter, setTimeline, <>
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="3months">Last 3 Months</option>
        </>, 'Timeline')}
        {sel(durationFilter, setDuration, <>
          <option value="all">All Durations</option>
          <option value="u30">Under 30 min</option>
          <option value="30-60">30 – 60 min</option>
          <option value="60-90">60 – 90 min</option>
          <option value="90p">90+ min</option>
        </>, 'Duration')}
        {sel(courseFilter, setCourse, <>
          <option value="all">All Courses</option>
          {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
        </>, 'Course')}
      </div>

      {/* Class list table */}
      {isLoading ? (
        <div className="p-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center space-y-2">
          <Video className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-semibold text-foreground">{allAnalytics.length === 0 ? 'No completed classes yet' : 'No results match your filters'}</p>
          <p className="text-xs text-muted-foreground">
            {allAnalytics.length === 0 ? 'Analytics appear after a live class session has ended.' : 'Try adjusting the search or filters.'}
          </p>
        </div>
      ) : (
        <Card className="border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                  {['Class Title', 'Course', 'Instructor', 'Date', 'Duration', 'Registered', 'Attended', 'Absent', 'Rate', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map(cls => (
                  <tr
                    key={cls.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={() => setSelected(cls.id)}
                  >
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Video className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground truncate">{cls.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[130px]">{cls.course}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{cls.instructor}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />{cls.dateStr}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.durationMins} min</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-violet-500 font-bold text-center">{cls.registered}</td>
                    <td className="px-4 py-3 font-mono text-emerald-500 font-bold text-center">{cls.attended}</td>
                    <td className="px-4 py-3 font-mono text-rose-500 font-bold text-center">{cls.absent}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-mono font-bold ${cls.rate >= 75 ? 'text-emerald-500' : cls.rate >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {cls.rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
