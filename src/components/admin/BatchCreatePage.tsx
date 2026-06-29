import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, X, Loader2, Users, BookOpen, Video, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getStoredToken } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Dubai', 'Asia/Singapore',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
  'Australia/Sydney', 'UTC',
];

export default function BatchCreatePage({ onBack }: { onBack: () => void }) {
  const setActiveTab = useAppStore(s => s.setActiveTab);

  const { data: instructors = [] } = useQuery<any[]>({
    queryKey: ['instructors-list'],
    queryFn: api.users.instructors,
    enabled: !!getStoredToken(),
  });
  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['courses-list'],
    queryFn: api.courses.list,
    enabled: !!getStoredToken(),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [details, setDetails] = useState('');

  // Zoom config
  const [zoomMeetingId, setZoomMeetingId] = useState('');
  const [zoomJoinUrl, setZoomJoinUrl] = useState('');
  const [zoomPassword, setZoomPassword] = useState('');

  // Instructors (multi-select)
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [instructorSearch, setInstructorSearch] = useState('');

  // Courses (multi-select)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState('');

  const toggleInstructor = (id: string) => {
    setSelectedInstructors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleCourse = (id: string) => {
    setSelectedCourses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredInstructors = instructors.filter((u: any) =>
    u.full_name.toLowerCase().includes(instructorSearch.toLowerCase())
  );
  const filteredCourses = courses.filter((c: any) =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Batch title is required.'); return; }
    if (!startDate) { setError('Start date is required.'); return; }
    if (!endDate) { setError('End date is required.'); return; }

    setSaving(true);
    setError(null);

    try {
      await api.batches.create({
        title: title.trim(),
        description: description || undefined,
        start_date: `${startDate}T${startTime}:00`,
        end_date: `${endDate}T${endTime}:00`,
        timezone,
        zoom_meeting_id: zoomMeetingId || undefined,
        zoom_join_url: zoomJoinUrl || undefined,
        zoom_password: zoomPassword || undefined,
        details: details || undefined,
        instructor_ids: selectedInstructors,
        course_ids: selectedCourses,
      });

      setActiveTab('admin-courses');
    } catch (err: any) {
      setError(err.message || 'Failed to create batch.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} title="Back"
          className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground">Create Batch</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedInstructors.length} instructor{selectedInstructors.length !== 1 ? 's' : ''} · {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {error && <span className="text-xs text-red-500 font-semibold max-w-xs truncate">{error}</span>}
          <Button type="submit" disabled={saving} className="h-9 px-5 bg-primary text-white font-bold text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : 'Create Batch'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details + zoom */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Batch Details</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Batch Title *</Label>
                <Input placeholder="e.g. Batch 2025 — Web Development" value={title}
                  onChange={e => setTitle(e.target.value)} className="h-10 text-sm bg-muted/20 font-semibold" required />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description</Label>
                <textarea placeholder="What this batch covers, prerequisites, goals…" rows={3}
                  aria-label="Batch description" title="Batch description"
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Start Date *</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs bg-muted/20" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Start Time</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">End Date *</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 text-xs bg-muted/20" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">End Time</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9 text-xs bg-muted/20" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Timezone</Label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} title="Timezone"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none">
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Additional Details</Label>
                <textarea placeholder="Schedule details, venue, rules, joining instructions…" rows={3}
                  aria-label="Additional details" title="Additional details"
                  value={details} onChange={e => setDetails(e.target.value)}
                  className="w-full p-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
              </div>
            </CardContent>
          </Card>

          {/* Zoom config */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Video className="w-4 h-4 text-primary" />Zoom Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Meeting ID</Label>
                <Input placeholder="e.g. 123 456 7890" value={zoomMeetingId}
                  onChange={e => setZoomMeetingId(e.target.value)} className="h-9 text-xs bg-muted/20 font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Join URL</Label>
                <Input placeholder="https://zoom.us/j/…" value={zoomJoinUrl}
                  onChange={e => setZoomJoinUrl(e.target.value)} className="h-9 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Passcode</Label>
                <Input placeholder="Meeting passcode (optional)" value={zoomPassword}
                  onChange={e => setZoomPassword(e.target.value)} className="h-9 text-xs bg-muted/20 font-mono" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: instructors + courses */}
        <div className="space-y-5">
          {/* Instructors */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Batch Instructors
                {selectedInstructors.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {selectedInstructors.length} selected
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Selected chips */}
              {selectedInstructors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedInstructors.map(id => {
                    const u = instructors.find((x: any) => x.id === id);
                    return u ? (
                      <span key={id} className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {u.full_name}
                        <button type="button" onClick={() => toggleInstructor(id)} title="Remove" className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <Input placeholder="Search instructors…" value={instructorSearch}
                onChange={e => setInstructorSearch(e.target.value)} className="h-8 text-xs bg-muted/20" />
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filteredInstructors.map((u: any) => {
                  const selected = selectedInstructors.includes(u.id);
                  return (
                    <button key={u.id} type="button" onClick={() => toggleInstructor(u.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left ${selected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/40 text-foreground'}`}>
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-black shrink-0">
                        {u.full_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{u.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{u.role}</p>
                      </div>
                      {selected && <Plus className="w-3 h-3 ml-auto rotate-45" />}
                    </button>
                  );
                })}
                {filteredInstructors.length === 0 && (
                  <p className="text-center text-[10px] text-muted-foreground py-3">No instructors found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Connected courses */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Connected Courses
                {selectedCourses.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {selectedCourses.length} selected
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Selected chips */}
              {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCourses.map(id => {
                    const c = courses.find((x: any) => x.id === id);
                    return c ? (
                      <span key={id} className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {c.title.length > 20 ? c.title.slice(0, 20) + '…' : c.title}
                        <button type="button" onClick={() => toggleCourse(id)} title="Remove" className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <Input placeholder="Search courses…" value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)} className="h-8 text-xs bg-muted/20" />
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filteredCourses.map((c: any) => {
                  const selected = selectedCourses.includes(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => toggleCourse(c.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left ${selected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/40 text-foreground'}`}>
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="w-8 h-6 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-6 rounded bg-primary/20 flex items-center justify-center shrink-0">
                          <BookOpen className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{c.title}</p>
                        {c.category && <p className="text-[10px] text-muted-foreground">{c.category}</p>}
                      </div>
                      {selected && <Plus className="w-3 h-3 ml-auto rotate-45" />}
                    </button>
                  );
                })}
                {filteredCourses.length === 0 && (
                  <p className="text-center text-[10px] text-muted-foreground py-3">No courses found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timezone display */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/50">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-[10px] text-muted-foreground">All times shown in <span className="font-bold text-foreground">{timezone}</span></p>
          </div>
        </div>
      </div>
    </form>
  );
}
