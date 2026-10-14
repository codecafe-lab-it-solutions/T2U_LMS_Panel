import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import {
  Video, Plus, Edit2, Trash2, ArrowLeft, RefreshCw,
  Save, Users, Loader2, Zap, CheckCircle2, Search, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLiveClasses() {
  const perm = useEmployeePermission('admin-live-classes');
  const qc = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter state for list view
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [classStatusFilter, setClassStatusFilter] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [topic, setTopic] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('18:00');
  const [durationMins, setDurationMins] = useState(120);
  const [zoomAccountId, setZoomAccountId] = useState('');
  const [zoomTimezone, setZoomTimezone] = useState('Asia/Kolkata');
  const [batchId, setBatchId] = useState('');
  const [autoRecording, setAutoRecording] = useState('Cloud');
  const [zoomMeetingId, setZoomMeetingId] = useState('');
  const [zoomJoinUrl, setZoomJoinUrl] = useState('');
  const [zoomStartUrl, setZoomStartUrl] = useState('');
  const [zoomPassword, setZoomPassword] = useState('');
  const [zoomUuid, setZoomUuid] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('upcoming');
  const [attendanceCount, setAttendanceCount] = useState(0);

  // Data queries
  const { data: liveClasses = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['admin-live-classes', searchQuery, courseFilter, classStatusFilter],
    queryFn: () => api.liveClasses.list({
      search: searchQuery.trim() || undefined,
      course_id: courseFilter || undefined,
      status: classStatusFilter || undefined,
    }),
  });
  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['admin-courses-dropdown'],
    queryFn: () => api.courses.listAll(),
  });
  const { data: instructors = [] } = useQuery<any[]>({
    queryKey: ['admin-instructors-dropdown'],
    queryFn: () => api.users.instructors(),
  });
  const { data: batchesResp } = useQuery<{ batches: any[]; total: number }>({
    queryKey: ['admin-batches-dropdown'],
    queryFn: () => api.batches.list(),
  });
  const batches = batchesResp?.batches ?? [];
  const { data: zoomAccounts = [] } = useQuery<any[]>({
    queryKey: ['admin-zoom-accounts-list'],
    queryFn: () => api.zoomAccounts.list(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.liveClasses.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-live-classes'] }); setIsFormOpen(false); resetForm(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.liveClasses.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-live-classes'] }); setIsFormOpen(false); resetForm(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.liveClasses.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-live-classes'] }),
  });
  const syncMutation = useMutation({
    mutationFn: (id: string) => api.liveClasses.syncParticipants(id),
    onSuccess: (res: any) => { qc.invalidateQueries({ queryKey: ['admin-live-classes'] }); setAttendanceCount(res.attendance_count); },
  });

  const resetForm = () => {
    setSelectedClassId(null); setTitle(''); setCourseId(''); setInstructorId(''); setTopic('');
    setScheduledDate(''); setScheduledTime('18:00'); setDurationMins(120);
    setZoomAccountId(''); setZoomTimezone('Asia/Kolkata'); setBatchId('');
    setAutoRecording('Cloud'); setZoomMeetingId(''); setZoomJoinUrl('');
    setZoomStartUrl(''); setZoomPassword(''); setZoomUuid('');
    setRegistrationEnabled(false); setRegistrationStatus('');
    setDescription(''); setStatus('upcoming'); setAttendanceCount(0);
  };

  const handleEditClick = (lc: any) => {
    setSelectedClassId(lc.id);
    setTitle(lc.title || '');
    setCourseId(lc.course_id || '');
    setInstructorId(lc.instructor_id || '');
    setTopic(lc.topic || '');
    if (lc.scheduled_at) {
      const d = new Date(lc.scheduled_at);
      setScheduledDate(d.toISOString().substring(0, 10));
      setScheduledTime(d.toTimeString().substring(0, 5));
    }
    setDurationMins(lc.duration_mins || 120);
    setZoomAccountId(lc.zoom_account_id || '');
    setZoomTimezone(lc.zoom_timezone || 'Asia/Kolkata');
    setBatchId(lc.batch_id || '');
    setAutoRecording(lc.auto_recording || 'Cloud');
    setZoomMeetingId(lc.zoom_meeting_id || '');
    setZoomJoinUrl(lc.zoom_join_url || '');
    setZoomStartUrl(lc.zoom_start_url || '');
    setZoomPassword(lc.zoom_password || '');
    setZoomUuid(lc.zoom_uuid || '');
    setRegistrationEnabled(lc.registration_enabled || false);
    setRegistrationStatus(lc.registration_status || '');
    setDescription(lc.description || '');
    setStatus(lc.status || 'upcoming');
    setAttendanceCount(lc.attendance_count || 0);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const scheduled_at = new Date(`${scheduledDate}T${scheduledTime || '00:00'}:00`).toISOString();
    const payload = {
      course_id: courseId,
      instructor_id: instructorId || undefined,
      title, topic, scheduled_at,
      duration_mins: Number(durationMins),
      zoom_account_id: zoomAccountId || null,
      zoom_timezone: zoomTimezone, batch_id: batchId || null,
      auto_recording: autoRecording,
      zoom_meeting_id: zoomMeetingId || undefined,
      zoom_join_url: zoomJoinUrl || undefined,
      zoom_start_url: zoomStartUrl || undefined,
      zoom_password: zoomPassword || undefined,
      zoom_uuid: zoomUuid || undefined,
      registration_enabled: registrationEnabled,
      registration_status: registrationStatus,
      description, status,
    };
    if (selectedClassId) updateMutation.mutate({ id: selectedClassId, data: payload });
    else createMutation.mutate(payload);
  };

  const sel = (v: string, onChange: (v: string) => void, children: React.ReactNode, required = false, label = '') => (
    <select
      required={required}
      value={v}
      onChange={e => onChange(e.target.value)}
      title={label}
      aria-label={label}
      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
    >
      {children}
    </select>
  );

  const inp = (value: string, onChange: (v: string) => void, placeholder = '', type = 'text', required = false) => (
    <Input
      type={type}
      required={required}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 text-xs border-border bg-background"
    />
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-foreground">Live Classes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Schedule Zoom sessions, manage recordings and attendance</p>
        </div>
        {!isFormOpen && perm.create && (
          <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-primary text-white text-xs font-bold h-9 px-4 gap-1.5">
            <Plus className="w-4 h-4" /> Schedule Class
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <form onSubmit={handleSave} className="space-y-5 max-w-5xl">
          {/* Form top bar */}
          <div className="flex justify-between items-center bg-card border border-border px-5 py-3.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="h-8 text-xs font-semibold">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
              <h2 className="text-sm font-extrabold text-foreground truncate max-w-xs">{title || 'New Live Class'}</h2>
            </div>
            <div className="flex items-center gap-2">
              {selectedClassId && perm.edit && (
                <Button type="button" variant="outline" size="sm" onClick={() => syncMutation.mutate(selectedClassId)} disabled={syncMutation.isPending} className="h-8 text-xs gap-1">
                  <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync Zoom
                </Button>
              )}
              <Button type="submit" disabled={isSaving} className="h-8.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs px-5 gap-1.5">
                <Save className="w-3.5 h-3.5" />{isSaving ? 'Saving…' : 'Save Class'}
              </Button>
            </div>
          </div>

          {/* Auto-generate notice */}
          {zoomAccountId && !selectedClassId && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              Zoom meeting will be auto-created when you save — join URL, start URL and password will be generated automatically.
            </div>
          )}

          {/* Attendance row (edit mode) */}
          {selectedClassId && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Connections</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-lg">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-mono bg-primary/20 px-1.5 py-0.5 rounded text-[10px]">{attendanceCount}</span>
                  Participants
                </span>
              </div>
            </div>
          )}

          {/* Main form card */}
          <Card className="border border-border bg-card">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Title *</Label>
                    {inp(title, setTitle, 'e.g. Live Class - 01', 'text', true)}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Topic / Host Name</Label>
                    {inp(topic, setTopic, 'e.g. Blockchain Fundamentals')}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">LMS Course *</Label>
                    {sel(courseId, setCourseId, <>
                      <option value="">— Select Course —</option>
                      {(courses as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.title}{c.status !== 'published' ? ` (${c.status})` : ''}</option>)}
                    </>, true, 'LMS Course')}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Instructor *</Label>
                    {sel(instructorId, setInstructorId, <>
                      <option value="">— Select Instructor —</option>
                      {(instructors as any[]).map((i: any) => (
                        <option key={i.id} value={i.id}>{i.full_name}{i.email ? ` (${i.email})` : ''}</option>
                      ))}
                    </>, true, 'Instructor')}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Batch (optional)</Label>
                    {sel(batchId, setBatchId, <>
                      <option value="">— No Batch —</option>
                      {(batches as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.title}</option>)}
                    </>, false, 'Batch')}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status</Label>
                    {sel(status, setStatus, <>
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live Now</option>
                      <option value="ended">Ended</option>
                      <option value="cancelled">Cancelled</option>
                    </>, false, 'Status')}
                  </div>
                </div>

                {/* Right */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Date *</Label>
                    {inp(scheduledDate, setScheduledDate, '', 'date', true)}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Time *</Label>
                    {inp(scheduledTime, setScheduledTime, '', 'time', true)}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Duration (mins) *</Label>
                    <Input type="number" required value={durationMins} onChange={e => setDurationMins(Number(e.target.value))} className="h-9 text-xs border-border bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Timezone</Label>
                    {sel(zoomTimezone, setZoomTimezone, <>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Calcutta">Asia/Calcutta (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </>, false, 'Timezone')}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Auto Recording</Label>
                    {sel(autoRecording, setAutoRecording, <>
                      <option value="No Recording">No Recording</option>
                      <option value="Local">Local</option>
                      <option value="Cloud">Cloud</option>
                    </>, false, 'Auto Recording')}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 border-t border-border/50 pt-5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Description</Label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Class description, curriculum notes, agenda…"
                  className="w-full p-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  aria-label="Description"
                />
              </div>

              {/* Zoom Account selector */}
              <div className="space-y-4 border-t border-border/50 pt-5">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Zoom Configuration</p>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Zoom Account
                      {!selectedClassId && <span className="ml-2 text-emerald-500 font-semibold normal-case">→ meeting auto-generated on save</span>}
                    </Label>
                    {sel(zoomAccountId, setZoomAccountId, <>
                      <option value="">— Manual (enter URLs below) —</option>
                      {(zoomAccounts as any[]).map((z: any) => (
                        <option key={z.id} value={z.id}>{z.label}{z.default_host ? ` (${z.default_host})` : ''}</option>
                      ))}
                    </>, false, 'Zoom Account')}
                    {zoomAccounts.length === 0 && (
                      <p className="text-[10px] text-amber-500 mt-1">No Zoom accounts configured. Go to Admin → Zoom Accounts to add one.</p>
                    )}
                  </div>
                </div>

                {/* Zoom detail fields — read-only, only visible after class is saved and Zoom data is auto-filled */}
                {selectedClassId && (zoomMeetingId || zoomJoinUrl || zoomStartUrl || zoomPassword) && (
                  <div className="rounded-lg border border-border/50 bg-muted/10 p-4 space-y-4">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Auto-generated Zoom Details
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {zoomMeetingId && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Meeting ID</Label>
                          <Input readOnly value={zoomMeetingId} className="h-9 text-xs border-border bg-muted/20 cursor-not-allowed font-mono" />
                        </div>
                      )}
                      {zoomPassword && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Password</Label>
                          <Input readOnly value={zoomPassword} className="h-9 text-xs border-border bg-muted/20 cursor-not-allowed font-mono" />
                        </div>
                      )}
                      {zoomUuid && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">UUID</Label>
                          <Input readOnly value={zoomUuid} className="h-9 text-xs border-border bg-muted/20 cursor-not-allowed font-mono" />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Attendees</Label>
                        <Input type="number" readOnly value={attendanceCount} className="h-9 text-xs border-border bg-muted/20 cursor-not-allowed" />
                      </div>
                    </div>
                    {zoomJoinUrl && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Join URL</Label>
                        <div className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground font-mono break-all leading-relaxed select-all cursor-text">
                          {zoomJoinUrl}
                        </div>
                      </div>
                    )}
                    {zoomStartUrl && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Start URL (Host)</Label>
                        <div className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground font-mono break-all leading-relaxed select-all cursor-text">
                          {zoomStartUrl}
                        </div>
                      </div>
                    )}
                    {registrationEnabled && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Registration Required{registrationStatus ? ` · ${registrationStatus}` : ''}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      ) : (
        /* List view */
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  Live Classes Registry ({isLoadingClasses ? '…' : (liveClasses as any[]).length})
                </CardTitle>
                <CardDescription className="text-xs">Schedule sessions, configure recordings, and sync attendance</CardDescription>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-7 text-xs rounded-lg border border-border bg-muted/20 text-foreground w-40 sm:w-48 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <select
                  value={courseFilter}
                  onChange={e => setCourseFilter(e.target.value)}
                  className="h-8 text-xs rounded-lg border border-border bg-muted/20 text-foreground px-2.5 max-w-[170px] truncate focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Courses</option>
                  {(courses as any[]).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>

                <select
                  value={classStatusFilter}
                  onChange={e => setClassStatusFilter(e.target.value)}
                  className="h-8 text-xs rounded-lg border border-border bg-muted/20 text-foreground px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live Now</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {(searchQuery || courseFilter || classStatusFilter) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSearchQuery(''); setCourseFilter(''); setClassStatusFilter(''); }}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingClasses ? (
              <div className="p-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading sessions…
              </div>
            ) : (liveClasses as any[]).length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Video className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-muted-foreground">No live classes scheduled yet</p>
                {perm.create && (
                  <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-primary text-white text-xs font-bold px-4">
                    Schedule First Class
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      {['Title & Course', 'Batch', 'Instructor', 'Scheduled', 'Duration', 'Zoom Account', 'Attendees', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(liveClasses as any[]).map((lc: any) => {
                      const displayDate = lc.scheduled_at
                        ? new Date(lc.scheduled_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                        : '—';
                      return (
                        <tr key={lc.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground">
                            <p>{lc.title}</p>
                            <p className="text-[9px] text-primary/70 font-semibold mt-0.5">{lc.course?.title || '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{lc.batch?.title || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <p>{lc.instructor?.full_name || '—'}</p>
                            <p className="text-[9px] font-mono text-muted-foreground/60">{lc.instructor?.email}</p>
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px] text-foreground">{displayDate}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{lc.duration_mins}m</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {lc.zoom_account_config ? (
                              <span className="flex items-center gap-1 text-emerald-500">
                                <CheckCircle2 className="w-3 h-3" />{lc.zoom_account_config.label}
                              </span>
                            ) : (lc.zoom_meeting_id ? (
                              <span className="font-mono text-[10px]">#{lc.zoom_meeting_id}</span>
                            ) : '—')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-muted px-2 py-0.5 rounded border border-border/40 text-[10px] font-mono font-bold">{lc.attendance_count || 0}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              lc.status === 'live' ? 'text-rose-500 bg-rose-500/10 border border-rose-500/20 animate-pulse' :
                              lc.status === 'ended' ? 'text-slate-400 bg-slate-500/10' :
                              lc.status === 'cancelled' ? 'text-red-400 bg-red-500/10' :
                              'text-blue-500 bg-blue-500/10'
                            }`}>{lc.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              {perm.edit && (
                                <Button size="sm" type="button" onClick={() => handleEditClick(lc)}
                                  className="h-6 text-[9px] px-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              )}
                              {perm.delete && (
                                <Button size="sm" type="button" disabled={deleteMutation.isPending}
                                  onClick={() => { if (confirm(`Delete "${lc.title}"?`)) deleteMutation.mutate(lc.id); }}
                                  className="h-6 text-[9px] px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
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
      )}
    </div>
  );
}
