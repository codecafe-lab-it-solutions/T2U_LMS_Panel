import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Loader2, BookOpen, Video, FileText, GraduationCap, Upload, Link } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '../../services/api';
import { getStoredToken } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

// ── Reusable file-or-url input ────────────────────────────────────────────────
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
    setUploading(true);
    setUploadErr('');
    try {
      const res = await api.upload.file(file);
      onChange(`${import.meta.env.VITE_API_URL}${res.url.replace('/api', '')}/upload/${res.filename}`);
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
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'text' | 'quiz';
  content_url: string;
  duration_mins: string;
  is_free_preview: boolean;
  instructor_notes: string;
}

interface ChapterDraft {
  id: string;
  title: string;
  description: string;
  lessons: LessonDraft[];
  expanded: boolean;
}

const CATEGORIES = ['Web Development', 'Mobile Development', 'Data Science', 'Design', 'Marketing', 'Business', 'Finance', 'Health', 'Gig Economy', 'Digital Marketing', 'Other'];
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

// ── LessonRow ─────────────────────────────────────────────────────────────────
function LessonRow({ lesson, onChange, onDelete }: {
  lesson: LessonDraft;
  onChange: (l: LessonDraft) => void;
  onDelete: () => void;
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
        <button type="button" title="Delete lesson" onClick={onDelete}
          className="text-red-400 hover:text-red-600 transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        <FileOrUrlInput
          value={lesson.content_url}
          onChange={url => set('content_url', url)}
          accept={lesson.type === 'pdf' ? '.pdf,application/pdf' : lesson.type === 'video' ? 'video/*,.mp4,.webm,.mov' : 'image/*,.pdf,video/*'}
          placeholder={lesson.type === 'pdf' ? 'PDF URL' : lesson.type === 'video' ? 'Video URL or upload' : 'Content URL'}
        />
        <Input placeholder="Duration (mins)" type="number" value={lesson.duration_mins} onChange={e => set('duration_mins', e.target.value)}
          className="h-8 text-xs bg-muted/20" />
      </div>

      <textarea placeholder="Instructor notes (internal, not visible to students)" rows={2} value={lesson.instructor_notes}
        aria-label="Instructor notes" title="Instructor notes"
        onChange={e => set('instructor_notes', e.target.value)}
        className="w-full p-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />

      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input type="checkbox" checked={lesson.is_free_preview} onChange={e => set('is_free_preview', e.target.checked)}
          className="w-3.5 h-3.5 accent-primary" />
        <span className="text-[10px] font-bold text-muted-foreground">Free preview (visible without enrollment)</span>
      </label>
    </div>
  );
}

// ── ChapterCard ───────────────────────────────────────────────────────────────
function ChapterCard({ chapter, index, onChange, onDelete }: {
  chapter: ChapterDraft;
  index: number;
  onChange: (c: ChapterDraft) => void;
  onDelete: () => void;
}) {
  const set = (k: keyof ChapterDraft, v: any) => onChange({ ...chapter, [k]: v });

  const updateLesson = (i: number, l: LessonDraft) => {
    const lessons = [...chapter.lessons];
    lessons[i] = l;
    set('lessons', lessons);
  };
  const deleteLesson = (i: number) => set('lessons', chapter.lessons.filter((_, j) => j !== i));
  const addLesson = () => set('lessons', [...chapter.lessons, newLesson()]);

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      {/* Chapter header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border/50">
        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">{index + 1}</span>
        <Input placeholder="Chapter title" value={chapter.title} onChange={e => set('title', e.target.value)}
          className="flex-1 h-8 text-xs bg-background font-semibold" />
        <button type="button" title={chapter.expanded ? 'Collapse' : 'Expand'} onClick={() => set('expanded', !chapter.expanded)}
          className="text-muted-foreground hover:text-foreground transition-colors">
          {chapter.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button type="button" title="Delete chapter" onClick={onDelete}
          className="text-red-400 hover:text-red-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {chapter.expanded && (
        <div className="p-4 space-y-3">
          <Input placeholder="Chapter description (optional)" value={chapter.description} onChange={e => set('description', e.target.value)}
            className="h-8 text-xs bg-muted/20" />

          <div className="space-y-2">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Lessons ({chapter.lessons.length})</p>
            {chapter.lessons.map((l, i) => (
              <LessonRow key={l.id} lesson={l} onChange={ll => updateLesson(i, ll)} onDelete={() => deleteLesson(i)} />
            ))}
          </div>

          <Button type="button" size="sm" onClick={addLesson}
            className="h-7 text-[10px] bg-muted/40 text-foreground border border-dashed border-border hover:bg-muted font-semibold w-full">
            <Plus className="w-3 h-3 mr-1" />Add Lesson
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main CourseCreatePage ─────────────────────────────────────────────────────
export default function CourseCreatePage({ onBack }: { onBack: () => void }) {
  const setActiveTab = useAppStore(s => s.setActiveTab);

  const { data: instructors = [] } = useQuery<any[]>({
    queryKey: ['instructors-list'],
    queryFn: api.users.instructors,
    enabled: !!getStoredToken(),
  });

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

  // Chapters
  const [chapters, setChapters] = useState<ChapterDraft[]>([newChapter()]);

  const updateChapter = (i: number, c: ChapterDraft) => setChapters(prev => { const n = [...prev]; n[i] = c; return n; });
  const deleteChapter = (i: number) => setChapters(prev => prev.filter((_, j) => j !== i));
  const addChapter = () => setChapters(prev => [...prev, newChapter()]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Course title is required.'); return; }
    if (chapters.some(c => !c.title.trim())) { setError('All chapters must have a title.'); return; }

    setSaving(true);
    setError(null);

    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      // 1. Create course
      const course = await api.courses.create({
        title: title.trim(),
        instructor_id: instructorId || undefined,
        thumbnail_url: thumbnail || undefined,
        category: category || undefined,
        tags,
        status: published ? 'published' : 'draft',
        is_featured: isFeatured,
        published_at: publishedAt || undefined,
        short_desc: shortIntro || undefined,
        description: description || undefined,
      });

      // 2. Create chapters + lessons sequentially
      for (const chapter of chapters) {
        if (!chapter.title.trim()) continue;
        const mod = await api.courses.modules.create(course.id, {
          title: chapter.title,
          description: chapter.description || undefined,
        });

        for (const lesson of chapter.lessons) {
          if (!lesson.title.trim()) continue;
          await api.courses.modules.lessons.create(course.id, mod.id, {
            title: lesson.title,
            type: lesson.type,
            content_url: lesson.content_url || undefined,
            duration_mins: lesson.duration_mins || undefined,
            is_free_preview: lesson.is_free_preview,
            instructor_notes: lesson.instructor_notes || undefined,
          });
        }
      }

      setActiveTab('admin-courses');
    } catch (err: any) {
      setError(err.message || 'Failed to create course.');
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
          <h1 className="text-2xl font-black text-foreground">Create New Course</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Fill in the details below, add chapters and lessons, then save.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {error && <span className="text-xs text-red-500 font-semibold">{error}</span>}
          <Button type="submit" disabled={saving} className="h-9 px-5 bg-primary text-white font-bold text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : 'Publish Course'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: main fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Course Details</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Course Title *</Label>
                <Input placeholder="e.g. Complete Web Development Bootcamp" value={title} onChange={e => setTitle(e.target.value)}
                  className="h-10 text-sm bg-muted/20 font-semibold" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Short Intro</Label>
                  <Input placeholder="One-line summary for listing cards" value={shortIntro} onChange={e => setShortIntro(e.target.value)}
                    className="h-9 text-xs bg-muted/20" />
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

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description</Label>
                <textarea placeholder="Full course description, what students will learn…" rows={4}
                  aria-label="Description" title="Description"
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Tags</Label>
                <Input placeholder="Comma-separated: react, javascript, web, beginner" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                  className="h-9 text-xs bg-muted/20" />
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

          {/* Chapters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-foreground">Chapters ({chapters.length})</h2>
              <Button type="button" size="sm" onClick={addChapter}
                className="h-8 text-xs bg-primary text-white font-bold">
                <Plus className="w-3.5 h-3.5 mr-1" />Add Chapter
              </Button>
            </div>
            {chapters.map((ch, i) => (
              <ChapterCard key={ch.id} chapter={ch} index={i}
                onChange={c => updateChapter(i, c)}
                onDelete={() => deleteChapter(i)} />
            ))}
          </div>
        </div>

        {/* Right column: settings */}
        <div className="space-y-5">
          {/* Instructor */}
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
              {instructors.length === 0 && (
                <p className="text-[10px] text-muted-foreground">No instructors found. Create a user with instructor role first.</p>
              )}
            </CardContent>
          </Card>

          {/* Preview image */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Banner Image</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <FileOrUrlInput
                value={thumbnail}
                onChange={setThumbnail}
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
                placeholder="Image URL (https://…)"
              />
              {thumbnail && (
                <img src={thumbnail} alt="Preview" className="w-full aspect-video object-cover rounded-xl border border-border/50" />
              )}
            </CardContent>
          </Card>

          {/* Publish settings */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}
                  className="w-4 h-4 accent-primary" />
                <span className="text-xs font-semibold">Published</span>
              </label>

              {published && (
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Published On</Label>
                  <Input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)}
                    className="h-9 text-xs bg-muted/20" />
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
        </div>
      </div>
    </form>
  );
}
