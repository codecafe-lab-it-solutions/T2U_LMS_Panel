import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, BookOpen, X, Video } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getStoredToken } from '../../services/api';

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Dubai', 'Asia/Singapore',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
  'Australia/Sydney', 'UTC',
];

interface InstructorSel { id: string; pct: string; }

interface BatchFormModalProps {
  open: boolean;
  onClose: () => void;
  batchId?: string;
  preselectedCourseId?: string;
}

// Create/edit a batch (including instructors + commission and linked courses) without leaving
// whatever page opened it — used both from BatchManagePage.tsx (Edit button) and
// CourseBatchesPanel.tsx (Create New Batch, with preselectedCourseId so the new batch links to
// that course immediately). The full-page BatchCreatePage.tsx flow is left untouched; this is an
// additional, modal-based way to reach the same underlying create/edit endpoints.
export default function BatchFormModal({ open, onClose, batchId, preselectedCourseId }: BatchFormModalProps) {
  const qc = useQueryClient();
  const isEdit = !!batchId;

  const { data: existingBatch, isLoading: loadingBatch } = useQuery<any>({
    queryKey: ['batch-detail', batchId],
    queryFn: () => api.batches.get(batchId!),
    enabled: open && isEdit,
  });
  const { data: allInstructors = [] } = useQuery<any[]>({
    queryKey: ['instructors-list'],
    queryFn: api.users.instructors,
    enabled: open && !!getStoredToken(),
  });
  const { data: allCourses = [] } = useQuery<any[]>({
    queryKey: ['courses-list'],
    queryFn: api.courses.list,
    enabled: open && !!getStoredToken(),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [details, setDetails] = useState('');
  const [zoomMeetingId, setZoomMeetingId] = useState('');
  const [zoomJoinUrl, setZoomJoinUrl] = useState('');
  const [zoomPassword, setZoomPassword] = useState('');

  const [instructorSel, setInstructorSel] = useState<InstructorSel[]>([]);
  const [addInstructorId, setAddInstructorId] = useState('');
  const [addInstructorPct, setAddInstructorPct] = useState('0');
  const [instructorSearch, setInstructorSearch] = useState('');

  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState('');

  // Original snapshots — diffed against on save in edit mode so only changed links get an API call.
  const [origInstructorIds, setOrigInstructorIds] = useState<Set<string>>(new Set());
  const [origCourseIds, setOrigCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    if (isEdit && existingBatch) {
      setTitle(existingBatch.title ?? '');
      setDescription(existingBatch.description ?? '');
      const sd = existingBatch.start_date ? new Date(existingBatch.start_date) : null;
      const ed = existingBatch.end_date ? new Date(existingBatch.end_date) : null;
      setStartDate(sd ? sd.toISOString().slice(0, 10) : '');
      setStartTime(sd ? sd.toISOString().slice(11, 16) : '09:00');
      setEndDate(ed ? ed.toISOString().slice(0, 10) : '');
      setEndTime(ed ? ed.toISOString().slice(11, 16) : '18:00');
      setTimezone(existingBatch.timezone ?? 'Asia/Kolkata');
      setDetails(existingBatch.details ?? '');
      setZoomMeetingId(existingBatch.zoom_meeting_id ?? '');
      setZoomJoinUrl(existingBatch.zoom_join_url ?? '');
      setZoomPassword(existingBatch.zoom_password ?? '');
      const sel = (existingBatch.instructors ?? []).map((bi: any) => ({
        id: (bi.user ?? bi).id, pct: String(bi.commission_percent ?? 0),
      }));
      setInstructorSel(sel);
      setOrigInstructorIds(new Set(sel.map((s: InstructorSel) => s.id)));
      const courseIds = (existingBatch.courses ?? []).map((bc: any) => (bc.course ?? bc).id);
      setSelectedCourses(courseIds);
      setOrigCourseIds(new Set(courseIds));
    } else if (!isEdit) {
      setTitle(''); setDescription(''); setStartDate(''); setStartTime('09:00');
      setEndDate(''); setEndTime('18:00'); setTimezone('Asia/Kolkata'); setDetails('');
      setZoomMeetingId(''); setZoomJoinUrl(''); setZoomPassword('');
      setInstructorSel([]);
      setOrigInstructorIds(new Set());
      setSelectedCourses(preselectedCourseId ? [preselectedCourseId] : []);
      setOrigCourseIds(new Set());
    }
    setError(null);
  }, [open, isEdit, existingBatch, preselectedCourseId]);

  const existingIds = new Set(instructorSel.map(s => s.id));
  const addCandidates = allInstructors.filter((u: any) =>
    !existingIds.has(u.id) && u.full_name.toLowerCase().includes(instructorSearch.toLowerCase())
  );
  const filteredCourses = allCourses.filter((c: any) => c.title.toLowerCase().includes(courseSearch.toLowerCase()));

  function addInstructor() {
    if (!addInstructorId) return;
    setInstructorSel(prev => [...prev, { id: addInstructorId, pct: addInstructorPct || '0' }]);
    setAddInstructorId('');
    setAddInstructorPct('0');
  }
  function removeInstructor(id: string) {
    setInstructorSel(prev => prev.filter(s => s.id !== id));
  }
  function updateInstructorPct(id: string, pct: string) {
    setInstructorSel(prev => prev.map(s => s.id === id ? { ...s, pct } : s));
  }
  function toggleCourse(id: string) {
    setSelectedCourses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (!title.trim()) { setError('Batch title is required.'); return; }
    if (!startDate) { setError('Start date is required.'); return; }
    if (!endDate) { setError('End date is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      const basePayload = {
        title: title.trim(),
        description: description || undefined,
        start_date: `${startDate}T${startTime}:00`,
        end_date: `${endDate}T${endTime}:00`,
        timezone,
        details: details || undefined,
        zoom_meeting_id: zoomMeetingId || undefined,
        zoom_join_url: zoomJoinUrl || undefined,
        zoom_password: zoomPassword || undefined,
      };

      let targetBatchId = batchId;
      if (isEdit) {
        await api.batches.update(batchId!, basePayload);
      } else {
        const created = await api.batches.create({
          ...basePayload,
          instructor_ids: [],
          course_ids: [],
        });
        targetBatchId = created.id;
      }

      // Sync instructors: always upsert every currently-selected instructor's rate (covers both
      // brand-new and changed %), then remove any that were dropped from the selection.
      await Promise.all(instructorSel.map(s => api.batches.addInstructor(targetBatchId!, s.id, parseFloat(s.pct) || 0)));
      const currentInstructorIds = new Set(instructorSel.map(s => s.id));
      const removedInstructors = [...origInstructorIds].filter(id => !currentInstructorIds.has(id));
      await Promise.all(removedInstructors.map(id => api.batches.removeInstructor(targetBatchId!, id)));

      // Sync courses: link newly-added, unlink removed.
      const currentCourseIds = new Set(selectedCourses);
      const addedCourses = selectedCourses.filter(id => !origCourseIds.has(id));
      const removedCourses = [...origCourseIds].filter(id => !currentCourseIds.has(id));
      await Promise.all(addedCourses.map(id => api.batches.addCourse(targetBatchId!, id)));
      await Promise.all(removedCourses.map(id => api.batches.removeCourse(targetBatchId!, id)));

      qc.invalidateQueries({ queryKey: ['batches'] });
      qc.invalidateQueries({ queryKey: ['course-batches-admin'] });
      qc.invalidateQueries({ queryKey: ['batch-detail', batchId] });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save batch.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl border border-border bg-card max-h-[90vh] overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">{isEdit ? 'Edit Batch' : 'Create Batch'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Set schedule, instructors with commission rates, and which courses this batch serves.
          </DialogDescription>
        </DialogHeader>

        {isEdit && loadingBatch ? (
          <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />Loading batch…
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Batch Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Morning Batch" className="h-9 text-xs bg-muted/20 font-semibold" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description</Label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Start Date *</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Start Time</Label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">End Date *</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">End Time</Label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Timezone</Label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} title="Timezone"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none">
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Additional Details</Label>
                <textarea rows={2} value={details} onChange={e => setDetails(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
              </div>
            </div>

            {/* Zoom */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> Zoom Meeting (optional)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input value={zoomMeetingId} onChange={e => setZoomMeetingId(e.target.value)} placeholder="Meeting ID" className="h-9 text-xs bg-muted/20 font-mono" />
                <Input value={zoomJoinUrl} onChange={e => setZoomJoinUrl(e.target.value)} placeholder="Join URL" className="h-9 text-xs bg-muted/20 font-mono" />
                <Input value={zoomPassword} onChange={e => setZoomPassword(e.target.value)} placeholder="Password" className="h-9 text-xs bg-muted/20 font-mono" />
              </div>
            </div>

            {/* Instructors + commission */}
            <div className="space-y-2 pt-3 border-t border-border/40">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Instructors & Commission
              </Label>
              {instructorSel.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/20">
                  {instructorSel.map(s => {
                    const u = allInstructors.find((x: any) => x.id === s.id);
                    return (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2">
                        <p className="text-xs font-semibold text-foreground flex-1 truncate">{u?.full_name ?? s.id}</p>
                        <Input type="number" min={0} max={100} step="0.01" value={s.pct}
                          onChange={e => updateInstructorPct(s.id, e.target.value)}
                          className="h-7 w-20 text-xs text-right bg-muted/20" />
                        <span className="text-[10px] text-muted-foreground font-bold">%</span>
                        <button type="button" title="Remove" onClick={() => removeInstructor(s.id)} className="p-1 text-red-400 hover:text-red-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-2">
                <select value={addInstructorId} onChange={e => setAddInstructorId(e.target.value)} title="Add instructor"
                  className="flex-1 h-8 px-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none">
                  <option value="">Select instructor to add…</option>
                  {addCandidates.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
                <Input type="number" min={0} max={100} step="0.01" value={addInstructorPct} onChange={e => setAddInstructorPct(e.target.value)}
                  placeholder="%" className="h-8 w-16 text-xs bg-muted/20" />
                <Button type="button" size="sm" disabled={!addInstructorId} onClick={addInstructor} className="h-8 text-[10px] font-bold px-3 bg-primary text-white">
                  Add
                </Button>
              </div>
            </div>

            {/* Courses */}
            <div className="space-y-2 pt-3 border-t border-border/40">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Connected Courses
              </Label>
              {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCourses.map(id => {
                    const c = allCourses.find((x: any) => x.id === id);
                    return c ? (
                      <span key={id} className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {c.title.length > 24 ? c.title.slice(0, 24) + '…' : c.title}
                        <button type="button" onClick={() => toggleCourse(id)} title="Remove" className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <Input placeholder="Search courses…" value={courseSearch} onChange={e => setCourseSearch(e.target.value)} className="h-8 text-xs bg-muted/20" />
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {filteredCourses.map((c: any) => {
                  const selected = selectedCourses.includes(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => toggleCourse(c.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/40 text-foreground'}`}>
                      {c.title}
                    </button>
                  );
                })}
                {filteredCourses.length === 0 && <p className="text-center text-[10px] text-muted-foreground py-2">No courses found</p>}
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs">Cancel</Button>
              <Button type="button" disabled={saving} onClick={handleSave} className="h-9 text-xs font-bold bg-primary text-white px-5">
                {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</> : isEdit ? 'Save Changes' : 'Create Batch'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
