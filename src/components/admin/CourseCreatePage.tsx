import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Loader2, BookOpen,
  Video, FileText, GraduationCap, Upload, Link, Edit2, Check, X, DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '../../services/api';
import { getStoredToken } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

// ── Rich Text Editor ──────────────────────────────────────────────────────────
function RichTextEditor({
  value, onChange, placeholder = 'Write content here…', minRows = 5,
}: {
  value: string; onChange: (html: string) => void; placeholder?: string; minRows?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(!value);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || '';
    setEmpty(!value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // init once on mount; key prop drives re-mounts for different contexts

  const exec = (cmd: string, val?: string) => {
    (document as any).execCommand(cmd, false, val ?? undefined);
    ref.current?.focus();
    onChange(ref.current?.innerHTML ?? '');
  };

  const Btn = ({ cmd, arg, title, children }: { cmd: string; arg?: string; title: string; children: React.ReactNode }) => (
    <button type="button" title={title}
      onMouseDown={e => { e.preventDefault(); exec(cmd, arg); }}
      className="px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded transition-colors select-none">
      {children}
    </button>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background focus-within:border-primary/50 transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-muted/20 border-b border-border/60">
        <Btn cmd="bold" title="Bold"><b>B</b></Btn>
        <Btn cmd="italic" title="Italic"><i>I</i></Btn>
        <Btn cmd="underline" title="Underline"><u>U</u></Btn>
        <span className="w-px h-4 bg-border/60 mx-1 inline-block" />
        <Btn cmd="formatBlock" arg="h2" title="Heading 2">H2</Btn>
        <Btn cmd="formatBlock" arg="h3" title="Heading 3">H3</Btn>
        <Btn cmd="formatBlock" arg="p" title="Paragraph">¶</Btn>
        <span className="w-px h-4 bg-border/60 mx-1 inline-block" />
        <Btn cmd="insertUnorderedList" title="Bullet list">• List</Btn>
        <Btn cmd="insertOrderedList" title="Numbered list">1. List</Btn>
        <span className="w-px h-4 bg-border/60 mx-1 inline-block" />
        <Btn cmd="removeFormat" title="Clear formatting">✕ Format</Btn>
      </div>
      {/* Editable area */}
      <div className="relative">
        {empty && (
          <span className="absolute top-3 left-3 text-xs text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            const html = ref.current?.innerHTML ?? '';
            setEmpty(!html || html === '<br>');
            onChange(html);
          }}
          className="p-3 text-xs text-foreground focus:outline-none [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-bold [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
          style={{ minHeight: `${minRows * 1.6}rem` }}
        />
      </div>
    </div>
  );
}

// ── File-or-URL input ─────────────────────────────────────────────────────────
function FileOrUrlInput({
  value, onChange, accept, placeholder, label,
}: {
  value: string; onChange: (url: string) => void;
  accept: string; placeholder: string; label?: string;
}) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadErr('');
    try {
      const res = await api.upload.file(file);
      onChange(res.url);
    } catch (err: any) {
      setUploadErr(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {label && <Label className="text-[9px] font-bold text-muted-foreground uppercase flex-1">{label}</Label>}
        <div className="flex rounded-lg overflow-hidden border border-border text-[9px] font-bold">
          <button type="button" onClick={() => setMode('url')}
            className={`px-2 py-0.5 flex items-center gap-1 transition-colors ${mode === 'url' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            <Link className="w-2.5 h-2.5" />URL
          </button>
          <button type="button" onClick={() => setMode('upload')}
            className={`px-2 py-0.5 flex items-center gap-1 transition-colors ${mode === 'upload' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            <Upload className="w-2.5 h-2.5" />Upload
          </button>
        </div>
      </div>
      {mode === 'url' ? (
        <Input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
          className="h-9 text-xs bg-muted/20" />
      ) : (
        <div className="flex items-center gap-2">
          <label className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed border-border bg-muted/20 text-xs font-semibold cursor-pointer hover:bg-muted/40 transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading…</> : <><Upload className="w-3.5 h-3.5" />Choose file</>}
            <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          {value && <span className="text-[10px] text-emerald-500 font-mono truncate max-w-[120px]">Uploaded ✓</span>}
        </div>
      )}
      {uploadErr && <p className="text-[10px] text-red-500">{uploadErr}</p>}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface LessonDraft {
  id: string; title: string; type: 'video' | 'pdf' | 'text' | 'quiz';
  content_url: string; duration_mins: string; is_free_preview: boolean; instructor_notes: string;
}
interface ChapterDraft {
  id: string; title: string; description: string; lessons: LessonDraft[]; expanded: boolean;
}

const CATEGORIES = [
  'Language', 'Professional Skills', 'AI Productivity', 'Digital Growth',
  'Web Development', 'Mobile Development', 'Data Science', 'Design',
  'Marketing', 'Business', 'Finance', 'Health', 'Gig Economy', 'Digital Marketing', 'Other',
];
const LESSON_TYPES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'text', label: 'Text', icon: BookOpen },
  { value: 'quiz', label: 'Quiz', icon: GraduationCap },
];
function newLesson(): LessonDraft {
  return { id: crypto.randomUUID(), title: '', type: 'video', content_url: '', duration_mins: '', is_free_preview: false, instructor_notes: '' };
}
function newChapter(): ChapterDraft {
  return { id: crypto.randomUUID(), title: '', description: '', lessons: [newLesson()], expanded: true };
}

function formatDurationPreview(hrs: number) {
  if (hrs < 5) return `${hrs} hrs`;
  if (hrs < 80) return `≈ ${Math.round(hrs / 3)} weeks on landing page`;
  return `≈ ${Math.round(hrs / 20)} months on landing page`;
}

// ── Lesson row (for new course creation) ─────────────────────────────────────
function LessonRow({ lesson, onChange, onDelete }: {
  lesson: LessonDraft; onChange: (l: LessonDraft) => void; onDelete: () => void;
}) {
  const set = (k: keyof LessonDraft, v: any) => onChange({ ...lesson, [k]: v });
  return (
    <div className="p-3 bg-background rounded-xl border border-border/60 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {LESSON_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.value} type="button" title={t.label}
                onClick={() => set('type', t.value)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${lesson.type === t.value ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
        <Input placeholder="Lesson title" value={lesson.title} onChange={e => set('title', e.target.value)}
          className="flex-1 h-8 text-xs bg-muted/20" />
        <button type="button" title="Delete lesson" onClick={onDelete} className="text-red-400 hover:text-red-600 shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {lesson.type === 'text' ? (
        <RichTextEditor
          key={lesson.id}
          value={lesson.instructor_notes}
          onChange={v => set('instructor_notes', v)}
          placeholder="Write lesson content here…"
          minRows={5}
        />
      ) : (
        <FileOrUrlInput value={lesson.content_url} onChange={url => set('content_url', url)}
          accept={lesson.type === 'pdf' ? '.pdf,application/pdf' : lesson.type === 'video' ? 'video/*,.mp4,.webm,.mov' : 'image/*,.pdf,video/*'}
          placeholder={lesson.type === 'pdf' ? 'PDF URL' : lesson.type === 'video' ? 'Video URL or upload' : 'Content URL'} />
      )}
      <Input placeholder="Duration (mins)" type="number" value={lesson.duration_mins} onChange={e => set('duration_mins', e.target.value)}
        className="h-8 text-xs bg-muted/20" />
      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input type="checkbox" checked={lesson.is_free_preview} onChange={e => set('is_free_preview', e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
        <span className="text-[10px] font-bold text-muted-foreground">Free preview</span>
      </label>
    </div>
  );
}

function ChapterCard({ chapter, index, onChange, onDelete }: {
  chapter: ChapterDraft; index: number; onChange: (c: ChapterDraft) => void; onDelete: () => void;
}) {
  const set = (k: keyof ChapterDraft, v: any) => onChange({ ...chapter, [k]: v });
  const updateLesson = (i: number, l: LessonDraft) => { const ll = [...chapter.lessons]; ll[i] = l; set('lessons', ll); };
  const deleteLesson = (i: number) => set('lessons', chapter.lessons.filter((_, j) => j !== i));
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border/50">
        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">{index + 1}</span>
        <Input placeholder="Chapter title" value={chapter.title} onChange={e => set('title', e.target.value)} className="flex-1 h-8 text-xs bg-background font-semibold" />
        <button type="button" title={chapter.expanded ? 'Collapse' : 'Expand'} onClick={() => set('expanded', !chapter.expanded)} className="text-muted-foreground hover:text-foreground">
          {chapter.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button type="button" title="Delete chapter" onClick={onDelete} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
      {chapter.expanded && (
        <div className="p-4 space-y-3">
          <Input placeholder="Chapter description (optional)" value={chapter.description} onChange={e => set('description', e.target.value)} className="h-8 text-xs bg-muted/20" />
          {chapter.lessons.map((l, i) => (
            <LessonRow key={l.id} lesson={l} onChange={ll => updateLesson(i, ll)} onDelete={() => deleteLesson(i)} />
          ))}
          <Button type="button" size="sm" onClick={() => set('lessons', [...chapter.lessons, newLesson()])}
            className="h-7 text-[10px] bg-muted/40 text-foreground border border-dashed border-border hover:bg-muted font-semibold w-full">
            <Plus className="w-3 h-3 mr-1" />Add Lesson
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Edit-mode: Module & Lesson Manager ───────────────────────────────────────
function ModuleLessonEditor({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const [expandedMods, setExpandedMods] = useState<Record<string, boolean>>({});
  const [editingModId, setEditingModId] = useState<string | null>(null);
  const [modTitleInput, setModTitleInput] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonInput, setLessonInput] = useState<any>({});
  const [addingLessonForMod, setAddingLessonForMod] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<'video' | 'pdf' | 'text' | 'quiz'>('video');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [newLessonText, setNewLessonText] = useState('');
  const [newModTitle, setNewModTitle] = useState('');
  const [addingMod, setAddingMod] = useState(false);

  const { data: modules = [], isLoading } = useQuery<any[]>({
    queryKey: ['course-modules-edit', courseId],
    queryFn: () => api.courses.modules.list(courseId),
    enabled: !!getStoredToken() && !!courseId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['course-modules-edit', courseId] });

  const createMod = useMutation({
    mutationFn: (title: string) => api.courses.modules.create(courseId, { title }),
    onSuccess: () => { invalidate(); setNewModTitle(''); setAddingMod(false); },
  });
  const updateMod = useMutation({
    mutationFn: ({ modId, title }: { modId: string; title: string }) =>
      api.courses.modules.update(courseId, modId, { title }),
    onSuccess: () => { invalidate(); setEditingModId(null); },
  });
  const deleteMod = useMutation({
    mutationFn: (modId: string) => api.courses.modules.delete(courseId, modId),
    onSuccess: invalidate,
  });
  const createLesson = useMutation({
    mutationFn: ({ modId, data }: { modId: string; data: any }) =>
      api.courses.modules.lessons.create(courseId, modId, data),
    onSuccess: () => { invalidate(); setAddingLessonForMod(null); setNewLessonTitle(''); setNewLessonUrl(''); setNewLessonDuration(''); setNewLessonText(''); },
  });
  const updateLesson = useMutation({
    mutationFn: ({ modId, lessonId, data }: { modId: string; lessonId: string; data: any }) =>
      api.courses.modules.lessons.update(courseId, modId, lessonId, data),
    onSuccess: () => { invalidate(); setEditingLessonId(null); },
  });
  const deleteLesson = useMutation({
    mutationFn: ({ modId, lessonId }: { modId: string; lessonId: string }) =>
      api.courses.modules.lessons.delete(courseId, modId, lessonId),
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="flex items-center gap-2 text-xs text-muted-foreground p-4"><Loader2 className="w-4 h-4 animate-spin" />Loading modules…</div>;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />Modules & Lessons ({modules.length})
        </CardTitle>
        <Button size="sm" type="button" onClick={() => setAddingMod(true)}
          className="h-7 text-xs bg-primary text-white font-bold">
          <Plus className="w-3.5 h-3.5 mr-1" />Add Module
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {/* Add new module form */}
        {addingMod && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Input autoFocus placeholder="Module / Chapter title…" value={newModTitle}
              onChange={e => setNewModTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newModTitle.trim()) createMod.mutate(newModTitle.trim()); } }}
              className="flex-1 h-8 text-xs bg-background" />
            <Button size="sm" type="button" disabled={!newModTitle.trim() || createMod.isPending}
              onClick={() => createMod.mutate(newModTitle.trim())}
              className="h-8 text-xs bg-primary text-white font-bold px-3">
              {createMod.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" type="button" onClick={() => setAddingMod(false)}
              className="h-8 text-xs bg-muted/40 text-foreground border border-border px-3">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {modules.length === 0 && !addingMod && (
          <p className="text-center text-xs text-muted-foreground py-6">No modules yet. Click "Add Module" to create the first one.</p>
        )}

        {modules.map((mod: any, mIdx: number) => {
          const isExpanded = expandedMods[mod.id] !== false; // default expanded
          const isEditingThis = editingModId === mod.id;
          return (
            <div key={mod.id} className="border border-border rounded-xl overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/20 border-b border-border/50">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-black shrink-0">{mIdx + 1}</span>
                {isEditingThis ? (
                  <Input autoFocus value={modTitleInput} onChange={e => setModTitleInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); updateMod.mutate({ modId: mod.id, title: modTitleInput }); } if (e.key === 'Escape') setEditingModId(null); }}
                    className="flex-1 h-7 text-xs bg-background font-semibold" />
                ) : (
                  <span className="flex-1 text-xs font-bold text-foreground">{mod.title}</span>
                )}
                <div className="flex items-center gap-1">
                  {isEditingThis ? (
                    <>
                      <button type="button" title="Save module title" onClick={() => updateMod.mutate({ modId: mod.id, title: modTitleInput })}
                        className="w-6 h-6 rounded flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title="Cancel edit" onClick={() => setEditingModId(null)}
                        className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button type="button" title="Edit module title" onClick={() => { setEditingModId(mod.id); setModTitleInput(mod.title); }}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  <button type="button" title="Delete module"
                    onClick={() => { if (confirm(`Delete module "${mod.title}" and all its lessons?`)) deleteMod.mutate(mod.id); }}
                    className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-500/10">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button type="button" title={isExpanded ? 'Collapse' : 'Expand'}
                    onClick={() => setExpandedMods(prev => ({ ...prev, [mod.id]: !isExpanded }))}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Module lessons */}
              {isExpanded && (
                <div className="p-3 space-y-2 bg-background">
                  {(mod.lessons ?? []).length === 0 && addingLessonForMod !== mod.id && (
                    <p className="text-[10px] text-muted-foreground text-center py-2">No lessons yet.</p>
                  )}

                  {(mod.lessons ?? []).map((ls: any) => {
                    const isEditingLesson = editingLessonId === ls.id;
                    return (
                      <div key={ls.id} className="p-2.5 rounded-lg border border-border/60 bg-muted/10 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">{ls.type}</span>
                          {isEditingLesson ? (
                            <Input autoFocus value={lessonInput.title ?? ls.title}
                              onChange={e => setLessonInput((p: any) => ({ ...p, title: e.target.value }))}
                              className="flex-1 h-7 text-xs bg-background" />
                          ) : (
                            <span className="flex-1 text-xs font-semibold text-foreground">{ls.title}</span>
                          )}
                          {!isEditingLesson && (
                            <button type="button" title="Edit lesson" onClick={() => { setEditingLessonId(ls.id); setLessonInput({ title: ls.title, type: ls.type, content_url: ls.content_url || '', duration_mins: ls.duration_mins || '', instructor_notes: ls.instructor_notes || '' }); }}
                              className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          <button type="button" title="Delete lesson"
                            onClick={() => deleteLesson.mutate({ modId: mod.id, lessonId: ls.id })}
                            className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {isEditingLesson && (
                          <div className="space-y-2 pt-1">
                            <div className="flex gap-1">
                              {LESSON_TYPES.map(t => {
                                const Icon = t.icon;
                                return (
                                  <button key={t.value} type="button" title={t.label}
                                    onClick={() => setLessonInput((p: any) => ({ ...p, type: t.value }))}
                                    className={`w-6 h-6 rounded flex items-center justify-center text-[9px] transition-colors ${(lessonInput.type ?? ls.type) === t.value ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground hover:text-foreground'}`}>
                                    <Icon className="w-3 h-3" />
                                  </button>
                                );
                              })}
                            </div>
                            {(lessonInput.type ?? ls.type) === 'text' ? (
                              <RichTextEditor
                                key={editingLessonId}
                                value={lessonInput.instructor_notes ?? ls.instructor_notes ?? ''}
                                onChange={v => setLessonInput((p: any) => ({ ...p, instructor_notes: v }))}
                                placeholder="Write lesson content here…"
                                minRows={6}
                              />
                            ) : (
                              <FileOrUrlInput value={lessonInput.content_url ?? ls.content_url ?? ''}
                                onChange={url => setLessonInput((p: any) => ({ ...p, content_url: url }))}
                                accept="video/*,.pdf,image/*" placeholder="Content URL or upload" />
                            )}
                            <Input placeholder="Duration (mins)" type="number" value={lessonInput.duration_mins ?? ''}
                              onChange={e => setLessonInput((p: any) => ({ ...p, duration_mins: e.target.value }))}
                              className="h-7 text-xs bg-muted/20" />
                            <div className="flex justify-end gap-1.5">
                              <Button size="sm" type="button" onClick={() => setEditingLessonId(null)}
                                className="h-6 text-[9px] bg-muted/40 text-foreground border border-border px-2">Cancel</Button>
                              <Button size="sm" type="button"
                                disabled={updateLesson.isPending}
                                onClick={() => updateLesson.mutate({ modId: mod.id, lessonId: ls.id, data: { title: lessonInput.title, type: lessonInput.type, content_url: (lessonInput.type ?? ls.type) !== 'text' ? (lessonInput.content_url || undefined) : undefined, instructor_notes: (lessonInput.type ?? ls.type) === 'text' ? (lessonInput.instructor_notes || undefined) : undefined, duration_mins: lessonInput.duration_mins || undefined } })}
                                className="h-6 text-[9px] bg-primary text-white font-bold px-3">
                                {updateLesson.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add new lesson form */}
                  {addingLessonForMod === mod.id ? (
                    <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                      <div className="flex gap-1 mb-1">
                        {LESSON_TYPES.map(t => {
                          const Icon = t.icon;
                          return (
                            <button key={t.value} type="button" title={t.label}
                              onClick={() => setNewLessonType(t.value as any)}
                              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${newLessonType === t.value ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground hover:text-foreground'}`}>
                              <Icon className="w-3 h-3" />
                            </button>
                          );
                        })}
                      </div>
                      <Input autoFocus placeholder="Lesson title" value={newLessonTitle}
                        onChange={e => setNewLessonTitle(e.target.value)}
                        className="h-7 text-xs bg-background" />
                      {newLessonType === 'text' ? (
                        <RichTextEditor
                          key={`${addingLessonForMod}-new`}
                          value={newLessonText}
                          onChange={setNewLessonText}
                          placeholder="Write lesson content here…"
                          minRows={6}
                        />
                      ) : (
                        <FileOrUrlInput value={newLessonUrl} onChange={setNewLessonUrl}
                          accept="video/*,.pdf,image/*" placeholder="Content URL (optional)" />
                      )}
                      <Input placeholder="Duration (mins)" type="number" value={newLessonDuration}
                        onChange={e => setNewLessonDuration(e.target.value)}
                        className="h-7 text-xs bg-muted/20" />
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" type="button" onClick={() => { setAddingLessonForMod(null); setNewLessonTitle(''); setNewLessonUrl(''); setNewLessonDuration(''); setNewLessonText(''); }}
                          className="h-6 text-[9px] bg-muted/40 text-foreground border border-border px-2">Cancel</Button>
                        <Button size="sm" type="button" disabled={!newLessonTitle.trim() || createLesson.isPending}
                          onClick={() => createLesson.mutate({ modId: mod.id, data: { title: newLessonTitle.trim(), type: newLessonType, content_url: newLessonType !== 'text' ? (newLessonUrl || undefined) : undefined, instructor_notes: newLessonType === 'text' ? (newLessonText || undefined) : undefined, duration_mins: newLessonDuration || undefined } })}
                          className="h-6 text-[9px] bg-primary text-white font-bold px-3">
                          {createLesson.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add Lesson'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button type="button"
                      onClick={() => { setAddingLessonForMod(mod.id); setNewLessonTitle(''); setNewLessonType('video'); setNewLessonUrl(''); setNewLessonDuration(''); setNewLessonText(''); }}
                      className="w-full h-7 rounded-lg border border-dashed border-border/60 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary font-semibold flex items-center justify-center gap-1 transition-colors">
                      <Plus className="w-3 h-3" />Add Lesson
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Main CourseCreatePage ─────────────────────────────────────────────────────
export default function CourseCreatePage({ onBack, courseId }: { onBack: () => void; courseId?: string }) {
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const setActiveCourseId = useAppStore(s => s.setActiveCourseId);
  const isEditMode = !!courseId;

  const { data: instructors = [] } = useQuery<any[]>({
    queryKey: ['instructors-list'],
    queryFn: api.users.instructors,
    enabled: !!getStoredToken(),
  });

  const { data: existingCourse, isLoading: loadingCourse } = useQuery<any>({
    queryKey: ['course-edit', courseId],
    queryFn: () => api.courses.get(courseId!),
    enabled: isEditMode && !!getStoredToken(),
  });

  // Fetch BV% from platform settings
  const { data: settingsData } = useQuery<{ map: Record<string, string> }>({
    queryKey: ['platform-settings'],
    queryFn: () => api.platformSettings.get(),
    enabled: !!getStoredToken(),
  });
  const bvPercent = settingsData?.map?.bv_percent ? parseFloat(settingsData.map.bv_percent) : 60;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Course fields
  const [title, setTitle] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [shortIntro, setShortIntro] = useState('');
  const [description, setDescription] = useState('');
  const [durationHrs, setDurationHrs] = useState('');
  const [price, setPrice] = useState('');

  const bvCredit = price && !isNaN(parseFloat(price)) ? (parseFloat(price) * bvPercent / 100).toFixed(2) : '';

  const [chapters, setChapters] = useState<ChapterDraft[]>([newChapter()]);
  const [fieldsLoaded, setFieldsLoaded] = useState(false);

  useEffect(() => {
    if (existingCourse && !fieldsLoaded) {
      setTitle(existingCourse.title ?? '');
      setInstructorId(existingCourse.instructor_id ?? '');
      setThumbnail(existingCourse.thumbnail_url ?? '');
      setCategory(existingCourse.category ?? '');
      setTagsInput((existingCourse.tags ?? []).join(', '));
      setPublished(existingCourse.status === 'published');
      setPublishedAt(existingCourse.published_at ? existingCourse.published_at.slice(0, 10) : '');
      setIsFeatured(existingCourse.is_featured ?? false);
      setShortIntro(existingCourse.short_desc ?? '');
      setDescription(existingCourse.description ?? '');
      setDurationHrs(existingCourse.duration_hrs != null ? String(existingCourse.duration_hrs) : '');
      setPrice(existingCourse.price != null ? String(existingCourse.price) : '');
      setFieldsLoaded(true);
    }
  }, [existingCourse, fieldsLoaded]);

  const updateChapter = (i: number, c: ChapterDraft) => setChapters(prev => { const n = [...prev]; n[i] = c; return n; });
  const deleteChapter = (i: number) => setChapters(prev => prev.filter((_, j) => j !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Course title is required.'); return; }
    if (!isEditMode && chapters.some(c => !c.title.trim())) { setError('All chapters must have a title.'); return; }

    setSaving(true); setError(null);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const courseData = {
        title: title.trim(), instructor_id: instructorId || undefined,
        thumbnail_url: thumbnail || undefined, category: category || undefined, tags,
        status: published ? 'published' : 'draft', is_featured: isFeatured,
        published_at: publishedAt || undefined, short_desc: shortIntro || undefined,
        description: description || undefined,
        duration_hrs: durationHrs ? parseFloat(durationHrs) : undefined,
        price: price ? parseFloat(price) : undefined,
        bv_credit: bvCredit ? parseFloat(bvCredit) : undefined,
      };

      if (isEditMode) {
        await api.courses.update(courseId, courseData);
        setActiveCourseId(null);
        setActiveTab('admin-courses');
      } else {
        const course = await api.courses.create(courseData);
        for (const chapter of chapters) {
          if (!chapter.title.trim()) continue;
          const mod = await api.courses.modules.create(course.id, { title: chapter.title, description: chapter.description || undefined });
          for (const lesson of chapter.lessons) {
            if (!lesson.title.trim()) continue;
            await api.courses.modules.lessons.create(course.id, mod.id, {
              title: lesson.title, type: lesson.type,
              content_url: lesson.content_url || undefined, duration_mins: lesson.duration_mins || undefined,
              is_free_preview: lesson.is_free_preview, instructor_notes: lesson.instructor_notes || undefined,
            });
          }
        }
        setActiveTab('admin-courses');
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} course.`);
    } finally {
      setSaving(false);
    }
  };

  if (isEditMode && loadingCourse) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground text-xs">
        <Loader2 className="w-4 h-4 animate-spin" />Loading course data…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} title="Back"
          className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground">{isEditMode ? 'Edit Course' : 'Create New Course'}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditMode ? 'Update course details, modules, and lessons.' : 'Fill in the details, add chapters and lessons, then save.'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {error && <span className="text-xs text-red-500 font-semibold">{error}</span>}
          <Button type="submit" disabled={saving} className="h-9 px-5 bg-primary text-white font-bold text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isEditMode ? 'Saving…' : 'Creating…'}</> : isEditMode ? 'Save Changes' : 'Publish Course'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Course Details</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Course Title *</Label>
                <Input placeholder="e.g. Spoken English Mastery" value={title} onChange={e => setTitle(e.target.value)}
                  className="h-10 text-sm bg-muted/20 font-semibold" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Short Intro</Label>
                  <Input placeholder="One-line summary" value={shortIntro} onChange={e => setShortIntro(e.target.value)} className="h-9 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Category</Label>
                  <select value={category} onChange={e => setCategory(e.target.value)} title="Category"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none">
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Duration (total hours)</Label>
                  <Input type="number" min="0" step="0.5" placeholder="e.g. 36"
                    value={durationHrs} onChange={e => setDurationHrs(e.target.value)} className="h-9 text-xs bg-muted/20" />
                  {durationHrs && !isNaN(parseFloat(durationHrs)) && parseFloat(durationHrs) > 0 && (
                    <p className="text-[10px] text-primary font-semibold">{formatDurationPreview(parseFloat(durationHrs))}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Course Price (₹)</Label>
                  <Input type="number" min="0" step="1" placeholder="e.g. 4999"
                    value={price} onChange={e => setPrice(e.target.value)} className="h-9 text-xs bg-muted/20" />
                  {bvCredit && (
                    <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />BV = ₹{parseFloat(bvCredit).toLocaleString('en-IN')} ({bvPercent}% of price)
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description</Label>
                <RichTextEditor
                  key={fieldsLoaded ? (courseId || 'new') : 'pending'}
                  value={description}
                  onChange={setDescription}
                  placeholder="Full course description…"
                  minRows={5}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Tags (comma-separated — shown as features on landing page)</Label>
                <Input placeholder="e.g. Beginner to Advanced, BBC Certified Trainers, 1-on-1 Practice"
                  value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="h-9 text-xs bg-muted/20" />
                {tagsInput && (
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Modules & Lessons (edit mode) */}
          {isEditMode && courseId && <ModuleLessonEditor courseId={courseId} />}

          {/* Chapters (create mode) */}
          {!isEditMode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-foreground">Chapters ({chapters.length})</h2>
                <Button type="button" size="sm" onClick={() => setChapters(prev => [...prev, newChapter()])}
                  className="h-8 text-xs bg-primary text-white font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" />Add Chapter
                </Button>
              </div>
              {chapters.map((ch, i) => (
                <ChapterCard key={ch.id} chapter={ch} index={i}
                  onChange={c => updateChapter(i, c)} onDelete={() => deleteChapter(i)} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Instructor</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <select value={instructorId} onChange={e => setInstructorId(e.target.value)} title="Instructor"
                className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none">
                <option value="">Select instructor…</option>
                {instructors.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Banner Image</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <FileOrUrlInput value={thumbnail} onChange={setThumbnail}
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
                placeholder="Image URL or /images/filename.png" />
              {thumbnail && (
                <img src={thumbnail} alt="Preview" className="w-full aspect-video object-cover rounded-xl border border-border/50" />
              )}
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-xs font-semibold">Published</span>
              </label>
              {published && (
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Published On</Label>
                  <Input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} className="h-9 text-xs bg-muted/20" />
                </div>
              )}
              <div className="border-t border-border/40 pt-3 space-y-2">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Section</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setIsFeatured(false)}
                    className={`h-9 rounded-lg text-xs font-semibold border transition-colors ${!isFeatured ? 'bg-primary text-white border-primary' : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'}`}>
                    Upcoming
                  </button>
                  <button type="button" onClick={() => setIsFeatured(true)}
                    className={`h-9 rounded-lg text-xs font-semibold border transition-colors ${isFeatured ? 'bg-amber-500 text-white border-amber-500' : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'}`}>
                    Featured
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BV info card */}
          {price && bvCredit && (
            <Card className="border border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                  <DollarSign className="w-4 h-4" />Business Volume (BV)
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Price</p>
                    <p className="text-sm font-mono font-bold text-foreground">₹{parseFloat(price).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">BV ({bvPercent}%)</p>
                    <p className="text-sm font-mono font-bold text-amber-500">₹{parseFloat(bvCredit).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground text-center">BV % can be changed in Admin Settings</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
