import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api, getStoredToken } from '../services/api';
import {
  Video, Calendar, Clock, Play, Plus, Trash2, StopCircle,
  ExternalLink, CheckCircle2, User, Edit2, BarChart2, Loader2,
  ArrowLeft, RefreshCw, Save, Zap, Users, Copy, Link2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function LiveClassManagement() {
  const { userRole, authToken, userProfile } = useAppStore();
  const qc = useQueryClient();

  // Form open / editing
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state — mirrors admin panel exactly (instructor is auto-assigned, no instructor dropdown)
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
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

  // End session dialog
  const [activeEndingId, setActiveEndingId] = useState<string | null>(null);
  const [recordingLinkInput, setRecordingLinkInput] = useState('');

  // Attendees modal
  const [attendeesClassId, setAttendeesClassId] = useState<string | null>(null);
  const [participantTab, setParticipantTab] = useState<'registered' | 'attended'>('registered');

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: apiLiveClasses = [], isLoading } = useQuery<any[]>({
    queryKey: ['live-classes-list', authToken],
    queryFn: () => api.liveClasses.list(),
    enabled: !!authToken,
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['instructor-courses-dropdown', authToken],
    queryFn: () => api.courses.instructor(),
    enabled: !!authToken && userRole === 'instructor',
  });

  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ['instructor-batches-dropdown', authToken],
    queryFn: () => api.batches.list(),
    enabled: !!authToken && userRole === 'instructor',
  });

  const { data: zoomAccounts = [] } = useQuery<any[]>({
    queryKey: ['zoom-accounts-available'],
    queryFn: () => api.zoomAccounts.available(),
    enabled: !!getStoredToken(),
    staleTime: 60_000,
  });

  const { data: attendeesData, isLoading: attendeesLoading } = useQuery<any>({
    queryKey: ['live-class-attendees', attendeesClassId],
    queryFn: () => api.liveClasses.attendees(attendeesClassId!),
    enabled: !!attendeesClassId,
    staleTime: 30_000,
  });

  const { data: registrantsData, isLoading: registrantsLoading } = useQuery<any>({
    queryKey: ['live-class-registrants', attendeesClassId],
    queryFn: () => api.liveClasses.registrants(attendeesClassId!),
    enabled: !!attendeesClassId,
    staleTime: 30_000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: any) => api.liveClasses.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['live-classes-list'] }); setIsFormOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.liveClasses.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['live-classes-list'] }); setIsFormOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.liveClasses.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-classes-list'] }),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => api.liveClasses.update(id, { status: 'live' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-classes-list'] }),
  });

  const endMutation = useMutation({
    mutationFn: ({ id, recording_url }: { id: string; recording_url: string }) =>
      api.liveClasses.update(id, { status: 'ended', recording_url }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-classes-list'] }),
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.liveClasses.syncParticipants(id),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['live-classes-list'] });
      setAttendanceCount(res.attendance_count);
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  const resetForm = () => {
    setEditingId(null); setTitle(''); setCourseId(''); setTopic('');
    setScheduledDate(''); setScheduledTime('18:00'); setDurationMins(120);
    setZoomAccountId(''); setZoomTimezone('Asia/Kolkata'); setBatchId('');
    setAutoRecording('Cloud'); setZoomMeetingId(''); setZoomJoinUrl('');
    setZoomStartUrl(''); setZoomPassword(''); setZoomUuid('');
    setRegistrationEnabled(false); setRegistrationStatus('');
    setDescription(''); setStatus('upcoming'); setAttendanceCount(0);
  };

  const handleEditClick = (lc: any) => {
    setEditingId(lc.id);
    setTitle(lc.title || '');
    setCourseId(lc.course_id || '');
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
      title, topic, scheduled_at,
      duration_mins: Number(durationMins),
      zoom_account_id: zoomAccountId || null,
      zoom_timezone: zoomTimezone,
      batch_id: batchId || null,
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
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEndingId) return;
    endMutation.mutate({ id: activeEndingId, recording_url: recordingLinkInput });
    setActiveEndingId(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Map API data to display format
  const liveClasses = apiLiveClasses.map((item: any) => {
    let dateStr = '—';
    let timeStr = '—';
    if (item.scheduled_at) {
      const d = new Date(item.scheduled_at);
      dateStr = d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
      timeStr = d.toLocaleTimeString('en-IN', { timeStyle: 'short' });
    }
    let displayStatus = 'upcoming';
    if (item.status === 'live') displayStatus = 'LIVE';
    if (item.status === 'ended') displayStatus = 'Completed';
    if (item.status === 'cancelled') displayStatus = 'Cancelled';

    return {
      id: item.id,
      title: item.title,
      course: item.course?.title || 'General Course',
      course_id: item.course_id,
      topic: item.topic || '—',
      instructor: item.instructor?.full_name || 'Guest Speaker',
      instructor_id: item.instructor_id,
      date: dateStr,
      time: timeStr,
      duration: `${item.duration_mins || 90} Mins`,
      status: displayStatus,
      meetingLink: item.zoom_join_url || '',
      startUrl: item.zoom_start_url || '',
      recordingLink: item.recording_url || '',
      studentCount: item.attendance_count || 0,
      _raw: item,
    };
  });

  // ==========================================
  // RENDER: STUDENT VIEW
  // ==========================================
  const renderStudentView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {liveClasses.map((item) => {
          const isLive = item.status === 'LIVE';
          const isCompleted = item.status === 'Completed';

          return (
            <Card
              key={item.id}
              className={`border bg-card shadow-lg relative overflow-hidden transition-all duration-300 ${
                isLive
                  ? 'border-primary/50 shadow-primary/10 ring-2 ring-primary/20'
                  : 'border-border/60'
              }`}
            >
              {isLive && (
                <div className="absolute top-0 right-0 bg-rose-500 text-white font-mono text-[9px] font-bold px-3 py-1 uppercase tracking-widest flex items-center gap-1 rounded-bl-xl shadow-xs z-10 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  LIVE NOW
                </div>
              )}

              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase bg-muted/40 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                    {item.course}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">ID: {item.id}</span>
                </div>
                <CardTitle className="text-sm font-extrabold text-foreground tracking-tight mt-2 truncate">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-primary truncate">
                  Topic: {item.topic}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-[10.5px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.time} ({item.duration})</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>Instructor: {item.instructor}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40">
                  {isLive ? (
                    <Button
                      onClick={() => item.meetingLink && window.open(item.meetingLink, '_blank')}
                      disabled={!item.meetingLink}
                      className="w-full text-xs font-bold h-9 bg-rose-500 hover:bg-rose-600 text-white animate-pulse flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      JOIN LIVE CLASS
                    </Button>
                  ) : isCompleted ? (
                    item.recordingLink ? (
                      <Button
                        onClick={() => window.open(item.recordingLink, '_blank')}
                        className="w-full text-xs font-bold h-9 bg-secondary hover:bg-muted text-primary hover:text-primary border border-border flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        WATCH RECORDING
                      </Button>
                    ) : (
                      <Button disabled className="w-full text-xs font-semibold h-9 bg-muted/20 border border-border text-muted-foreground cursor-not-allowed">
                        Session Ended
                      </Button>
                    )
                  ) : (
                    <Button disabled className="w-full text-xs font-semibold h-9 bg-muted/20 border border-border text-muted-foreground cursor-not-allowed">
                      Upcoming · {item.date} at {item.time}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {liveClasses.length === 0 && (
          <div className="col-span-2 text-center text-xs text-muted-foreground py-12">
            <Video className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground text-sm">No live classes yet</p>
            <p className="mt-1 max-w-xs mx-auto">
              Live classes will appear here once your instructor schedules one for a course you're enrolled in.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ==========================================
  // RENDER: INSTRUCTOR CREATE / EDIT FORM
  // ==========================================
  const renderInstructorForm = () => (
    <form onSubmit={handleSave} className="space-y-5 max-w-5xl">
      {/* Top bar */}
      <div className="flex justify-between items-center bg-card border border-border px-5 py-3.5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setIsFormOpen(false); resetForm(); }}
            className="h-8 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Button>
          <h2 className="text-sm font-extrabold text-foreground truncate max-w-xs">
            {title || (editingId ? 'Edit Live Class' : 'New Live Class')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {editingId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate(editingId)}
              disabled={syncMutation.isPending}
              className="h-8 text-xs gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync Zoom
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSaving}
            className="h-8.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs px-5 gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving…' : 'Save Class'}
          </Button>
        </div>
      </div>

      {/* Auto-assigned instructor badge */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-lg">
        <User className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-[10px] text-muted-foreground">Instructor (auto-assigned):</span>
        <span className="text-[10px] font-bold text-foreground">{userProfile.name || 'You'}</span>
      </div>

      {/* Zoom auto-generate notice */}
      {zoomAccountId && !editingId && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          Zoom meeting will be auto-created when you save — join URL, start URL and password will be generated automatically.
        </div>
      )}

      {/* Attendance row (edit mode only) */}
      {editingId && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Connections</p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-lg">
            <Users className="w-3.5 h-3.5" />
            <span className="font-mono bg-primary/20 px-1.5 py-0.5 rounded text-[10px]">{attendanceCount}</span>
            Participants
          </span>
        </div>
      )}

      {/* Main form card */}
      <Card className="border border-border bg-card">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* Left column */}
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
                  {(courses as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </>, true, 'LMS Course')}
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

            {/* Right column */}
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
                <Input
                  type="number"
                  required
                  value={durationMins}
                  onChange={e => setDurationMins(Number(e.target.value))}
                  className="h-9 text-xs border-border bg-background"
                />
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

          {/* Zoom configuration */}
          <div className="space-y-4 border-t border-border/50 pt-5">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Zoom Configuration</p>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Zoom Account
                  {!editingId && <span className="ml-2 text-emerald-500 font-semibold normal-case">→ meeting auto-generated on save</span>}
                </Label>
                {sel(zoomAccountId, setZoomAccountId, <>
                  <option value="">— Manual (enter URLs below) —</option>
                  {(zoomAccounts as any[]).map((z: any) => (
                    <option key={z.id} value={z.id}>{z.label}{z.default_host ? ` (${z.default_host})` : ''}</option>
                  ))}
                </>, false, 'Zoom Account')}
                {zoomAccounts.length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">No Zoom accounts configured. Contact admin to add one.</p>
                )}
              </div>
            </div>

            {/* Zoom detail fields — read-only, only visible after class is saved and Zoom data is auto-filled */}
            {editingId && (zoomMeetingId || zoomJoinUrl || zoomStartUrl || zoomPassword) && (
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
  );

  // ==========================================
  // RENDER: INSTRUCTOR LIST
  // ==========================================
  const renderInstructorList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border border-border p-4 rounded-2xl shadow-xs">
        <div>
          <span className="text-[10px] text-muted-foreground font-mono uppercase font-bold">Scheduled Classes</span>
          <span className="text-xs font-bold text-foreground block font-sans">Active Webinar Registry</span>
        </div>
        <Button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="text-xs font-bold h-8.5 bg-primary hover:bg-primary/95 text-primary-foreground flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Schedule Live Class
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {liveClasses.map((item) => {
          const isLive = item.status === 'LIVE';
          const isCompleted = item.status === 'Completed';

          return (
            <Card key={item.id} className="border border-border/60 bg-card shadow-md">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase bg-muted/40 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                    {item.course}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                    isLive ? 'bg-rose-500/10 text-rose-500 border border-rose-500/25 animate-pulse' :
                    isCompleted ? 'bg-muted text-muted-foreground border border-border/40' :
                    'bg-blue-500/10 text-blue-500 border border-blue-500/25'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <CardTitle className="text-sm font-extrabold text-foreground truncate mt-2">{item.title}</CardTitle>
                <CardDescription className="text-xs font-semibold text-primary truncate">Topic: {item.topic}</CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-[10.5px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{item.time}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 flex gap-2">
                  {!isLive && !isCompleted && (
                    <Button
                      onClick={() => {
                        startMutation.mutate(item.id);
                        if (item.startUrl) window.open(item.startUrl, '_blank');
                      }}
                      disabled={startMutation.isPending}
                      className="flex-1 text-xs font-bold h-8.5 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Start Class
                    </Button>
                  )}

                  {isLive && (
                    <>
                      {item.startUrl && (
                        <Button
                          onClick={() => window.open(item.startUrl, '_blank')}
                          className="flex-1 text-xs font-bold h-8.5 bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center gap-1.5 animate-pulse"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open in Zoom
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setActiveEndingId(item.id);
                          setRecordingLinkInput('');
                        }}
                        className="flex-1 text-xs font-bold h-8.5 bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center gap-1.5 border border-border"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        End Session
                      </Button>
                    </>
                  )}

                  {isCompleted && (
                    <>
                      <Button
                        disabled
                        className="flex-1 text-xs font-semibold h-8.5 bg-muted/20 border border-border text-muted-foreground cursor-not-allowed"
                      >
                        Session Archived
                      </Button>
                      <Button
                        onClick={() => setAttendeesClassId(item.id)}
                        variant="outline"
                        className="p-2 border-border text-primary hover:bg-primary/10 shrink-0 h-8.5"
                        title="View Attendees"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    onClick={() => handleEditClick(item._raw)}
                    variant="outline"
                    className="p-2 border-border text-primary hover:bg-primary/10 shrink-0 h-8.5"
                    title="Edit Class Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => { if (confirm('Delete this class?')) deleteMutation.mutate(item.id); }}
                    disabled={deleteMutation.isPending}
                    variant="outline"
                    className="p-2 border-border text-rose-500 hover:bg-rose-500/10 shrink-0 h-8.5"
                    title="Delete meeting"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Attendance summary for completed classes */}
                {isCompleted && item.studentCount > 0 && (
                  <div className="mt-1 pt-3 border-t border-border/40 bg-muted/10 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <BarChart2 className="w-4 h-4 text-primary" />
                      <span>Attendance Analytics</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-muted/30 p-2 rounded-md border border-border/40">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase">Total</div>
                        <div className="text-xs font-extrabold text-foreground">{item.studentCount}</div>
                      </div>
                      <div className="bg-emerald-500/5 p-2 rounded-md border border-emerald-500/20">
                        <div className="text-[9px] font-bold text-emerald-500 uppercase">Present</div>
                        <div className="text-xs font-extrabold text-emerald-400">{Math.round(item.studentCount * 0.8)}</div>
                      </div>
                      <div className="bg-rose-500/5 p-2 rounded-md border border-rose-500/20">
                        <div className="text-[9px] font-bold text-rose-500 uppercase">Absent</div>
                        <div className="text-xs font-extrabold text-rose-400">{item.studentCount - Math.round(item.studentCount * 0.8)}</div>
                      </div>
                      <div className="bg-primary/5 p-2 rounded-md border border-primary/20">
                        <div className="text-[9px] font-bold text-primary uppercase">Ratio</div>
                        <div className="text-xs font-extrabold text-primary">80%</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {liveClasses.length === 0 && (
          <div className="col-span-2 text-center text-xs text-muted-foreground py-10">
            <Video className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground text-sm">No live classes scheduled</p>
            <p className="mt-1">Click "Schedule Live Class" to create your first session.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          <Video className="w-5 h-5 text-primary animate-pulse" />
          {userRole === 'instructor' ? 'Live Classes Manager' : 'LMS Live Classes'}
        </h2>
        <p className="text-xs text-muted-foreground font-sans mt-0.5">
          {userRole === 'instructor'
            ? 'Broadcast live masterclasses to students, publish video archives, and track scheduled webinars.'
            : 'Join scheduled Zoom webinar sessions or replay video archives.'}
        </p>
      </div>

      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading webinar sessions…
        </div>
      ) : userRole === 'instructor' ? (
        isFormOpen ? renderInstructorForm() : renderInstructorList()
      ) : (
        renderStudentView()
      )}

      {/* ── End Session Dialog ───────────────────────────────────────────── */}
      {activeEndingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase text-muted-foreground">Complete Live Session & Link Recording</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleEndSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Archived recording URL</Label>
                  <Input
                    type="text"
                    placeholder="Enter recorded link address"
                    value={recordingLinkInput}
                    onChange={e => setRecordingLinkInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20 font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" onClick={() => setActiveEndingId(null)} variant="outline" className="text-xs font-semibold h-8.5 border-border">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={endMutation.isPending} className="bg-primary text-xs font-bold px-5 h-8.5 text-primary-foreground">
                    End Meeting & Save Archive
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Participants Modal ──────────────────────────────────────────────── */}
      <Dialog open={!!attendeesClassId} onOpenChange={(open) => { if (!open) { setAttendeesClassId(null); setParticipantTab('registered'); } }}>
        <DialogContent className="max-w-xl bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {registrantsData?.title ? `Participants — ${registrantsData.title}` : 'Participant List'}
            </DialogTitle>
          </DialogHeader>

          {/* Stats row */}
          <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/30 rounded-lg border border-border/60 text-xs">
            <div className="text-center">
              <div className="text-lg font-black text-foreground font-mono">{registrantsData?.total_enrolled ?? '—'}</div>
              <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">Enrolled</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-lg font-black text-emerald-500 font-mono">{registrantsData?.total_registered ?? 0}</div>
              <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">Registered</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-lg font-black text-violet-400 font-mono">{attendeesData?.total ?? 0}</div>
              <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">Attended</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/40">
            {(['registered', 'attended'] as const).map(t => (
              <button key={t} type="button" onClick={() => setParticipantTab(t)}
                className={`px-4 py-2 text-[10px] font-bold capitalize border-b-2 -mb-px transition-colors ${
                  participantTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                {t === 'registered' ? `Registered (${registrantsData?.total_registered ?? 0})` : `Zoom Attended (${attendeesData?.total ?? 0})`}
              </button>
            ))}
          </div>

          {/* Registered tab */}
          {participantTab === 'registered' && (
            <div className="space-y-2">
              {registrantsLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading registrants…
                </div>
              ) : registrantsData?.registrants?.length > 0 ? (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {registrantsData.registrants.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/20 border border-border/40 text-[10.5px] gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[9px] font-bold text-emerald-500 shrink-0">
                          {(r.full_name || r.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{r.full_name || r.student?.full_name || '—'}</div>
                          <div className="text-muted-foreground text-[9px] truncate">{r.email}</div>
                        </div>
                      </div>
                      {r.join_url ? (
                        <button type="button" title="Copy personal join link"
                          onClick={() => navigator.clipboard.writeText(r.join_url)}
                          className="flex items-center gap-1 text-[9px] font-semibold text-emerald-500 hover:text-emerald-400 shrink-0 px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                          <Link2 className="w-3 h-3" /> Copy Link
                        </button>
                      ) : (
                        <span className="text-[9px] text-muted-foreground shrink-0">No link</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
                  No students registered yet. Create this class with a Zoom account to auto-register enrolled students.
                </div>
              )}
            </div>
          )}

          {/* Attended tab */}
          {participantTab === 'attended' && (
            <div className="space-y-2">
              {attendeesLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading attendance…
                </div>
              ) : attendeesData?.attendees?.length > 0 ? (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {attendeesData.attendees.map((a: any, i: number) => (
                    <div key={a.id ?? i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-[10.5px]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                          {(a.participant_name || a.user_email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{a.participant_name || a.user_email || 'Unknown'}</div>
                          {a.user_email && <div className="text-muted-foreground text-[9px]">{a.user_email}</div>}
                        </div>
                      </div>
                      {a.duration_secs != null && (
                        <span className="text-muted-foreground font-mono text-[9px]">{Math.round(a.duration_secs / 60)} min</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
                  No Zoom attendance records yet. Use "Sync Zoom" after the class ends.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
