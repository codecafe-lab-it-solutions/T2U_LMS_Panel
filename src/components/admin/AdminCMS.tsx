import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe, Star, FileText, Image, Award, Plus, Trash2, Save,
  Loader2, Upload, X, ExternalLink, GripVertical, ZoomIn, ChevronLeft, ChevronRight,
  Video, Camera, GraduationCap, ArrowUp, ArrowDown, Edit2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getMediaUrl } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import ConfirmDialog from '../ConfirmDialog';

type CmsTab = 'Hero' | 'Experts' | 'Testimonials' | 'Videos' | 'FAQs' | 'Gallery' | 'Certifications' | 'Documents';

const TAB_ICONS: Record<CmsTab, any> = {
  Hero: Globe, Experts: GraduationCap, Testimonials: Star, Videos: Video, FAQs: FileText,
  Gallery: Image, Certifications: Award, Documents: FileText,
};

// â”€â”€ Shared: UploadField â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface UploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  previewImage?: boolean;
  previewVideo?: boolean;
  urlPlaceholder?: string;
  required?: boolean;
  previewClassName?: string;
}

function UploadField({ label, value, onChange, accept = 'image/*', previewImage = true, previewVideo = false, urlPlaceholder, required, previewClassName }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await api.upload.file(file);
      onChange(result.url);
      setShowUrlInput(false);
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = getMediaUrl(value);
  const isImage = previewImage && value && !previewVideo && (displayUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i) || (accept.includes('image') && !accept.includes('video')));
  const isVideo = previewVideo && value && (displayUrl.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/i) || accept.includes('video'));

  return (
    <div className="space-y-1.5">
      <Label className="text-[9px] font-bold text-muted-foreground uppercase">{label}{required && ' *'}</Label>

      {/* Image preview */}
      {value && isImage && (
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt={label}
            className={previewClassName || "h-28 max-w-xs rounded-xl object-cover border border-border shadow-sm"}
          />
          <button type="button" title="Remove" onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Video preview */}
      {value && isVideo && (
        <div className="relative rounded-xl overflow-hidden border border-border bg-black">
          <video src={displayUrl} controls className="w-full max-h-48 rounded-xl" />
          <button type="button" title="Remove video" onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1 shadow hover:bg-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Generic file (pdf etc.) */}
      {value && !isImage && !isVideo && (
        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg border border-border/50">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[10px] font-mono text-muted-foreground truncate flex-1">{value.split('/').pop()}</span>
          <a href={value} target="_blank" rel="noopener noreferrer" title="Open file">
            <ExternalLink className="w-3.5 h-3.5 text-primary" />
          </a>
          <button type="button" title="Remove" onClick={() => onChange('')}>
            <X className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
          </button>
        </div>
      )}

      {/* Upload button + URL toggle (shown when empty) */}
      {!value && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 text-[10px] font-bold text-primary hover:bg-primary/10 transition-colors disabled:opacity-60"
            >
              {uploading
                ? <><Loader2 className="w-3 h-3 animate-spin" />Uploading…</>
                : <><Upload className="w-3 h-3" />{previewVideo ? 'Upload Video' : 'Upload File'}</>}
            </button>
            <span className="text-[9px] text-muted-foreground">or</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(v => !v)}
              className="text-[9px] text-primary underline font-semibold"
            >
              {previewVideo ? 'Paste YouTube / Video URL' : 'Paste URL'}
            </button>
          </div>

          {showUrlInput && (
            <Input
              type="url"
              placeholder={urlPlaceholder ?? (previewVideo ? 'https://youtube.com/watch?v=… or video URL' : 'https://…')}
              value={value}
              onChange={e => onChange(e.target.value)}
              className="h-8 text-xs bg-muted/20 font-mono"
            />
          )}

          {error && <p className="text-[9px] text-red-500 font-medium">{error}</p>}
        </div>
      )}

      {/* Replace button when file exists */}
      {value && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border bg-muted/30 text-[9px] font-bold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? 'Uploading…' : 'Replace'}
          </button>
          {error && <p className="text-[9px] text-red-500 font-medium">{error}</p>}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        aria-label={label}
        title={label}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// â”€â”€ Hero Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HeroTab() {
  const perm = useEmployeePermission('admin-cms');
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ headline?: string; subheadline?: string; cta_text?: string; video_url?: string }>({
    queryKey: ['cms-hero'], queryFn: api.cms.hero.get,
  });
  const [form, setForm] = useState<{ headline: string; subheadline: string; cta_text: string; video_url: string } | null>(null);
  const current = form ?? (data
    ? { headline: data.headline ?? '', subheadline: data.subheadline ?? '', cta_text: data.cta_text ?? '', video_url: data.video_url ?? '' }
    : { headline: '', subheadline: '', cta_text: '', video_url: '' });

  const save = useMutation({
    mutationFn: () => api.cms.hero.update(current),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-hero'] }); setForm(null); },
  });

  if (isLoading) return <Spinner />;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold">Hero Section</CardTitle>
        <div className="flex items-center gap-2">
          {save.isSuccess && <span className="text-[10px] text-emerald-500 font-bold">Saved!</span>}
          {perm.edit && (
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}
              className="h-8 text-xs bg-primary text-white font-bold">
              {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}Save
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Headline</Label>
          <Input value={current.headline} onChange={e => setForm(f => ({ ...current, ...f, headline: e.target.value }))} className="h-9 text-xs bg-muted/20" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Sub Headline</Label>
          <textarea rows={2} aria-label="Sub Headline" title="Sub Headline"
            value={current.subheadline} onChange={e => setForm(f => ({ ...current, ...f, subheadline: e.target.value }))}
            className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[9px] font-bold text-muted-foreground uppercase">CTA Button Text</Label>
          <Input value={current.cta_text} onChange={e => setForm(f => ({ ...current, ...f, cta_text: e.target.value }))} className="h-9 text-xs bg-muted/20" />
        </div>
        <div className="border-t border-border/40 pt-4">
          <p className="text-[9px] text-muted-foreground uppercase font-bold mb-3">Hero Video (optional) — shown below the headline on the home page</p>
          <UploadField
            label="Hero Video — upload an MP4 or paste a YouTube link"
            value={current.video_url}
            onChange={url => setForm(f => ({ ...current, ...f, video_url: url }))}
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
            previewVideo
          />
        </div>
      </CardContent>
    </Card>
  );
}

// â”€â”€ Testimonials Tab (text testimonials only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TestimonialsTab() {
  const perm = useEmployeePermission('admin-cms');
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['cms-testimonials'], queryFn: api.cms.testimonials.list });
  const textOnly = (data as any[]).filter((t: any) => !t.video_url);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ student_name: '', story_text: '', star_rating: 5, photo_url: '' });

  const create = useMutation({
    mutationFn: () => api.cms.testimonials.create(newItem),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-testimonials'] }); setAdding(false); setNewItem({ student_name: '', story_text: '', star_rating: 5, photo_url: '' }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.cms.testimonials.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-testimonials'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold">Text Testimonials ({textOnly.length})</CardTitle>
        {perm.create && (
          <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
            className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
            <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {adding && perm.create && (
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Student Name *</Label>
                <Input placeholder="e.g. Priya Sharma" value={newItem.student_name}
                  onChange={e => setNewItem(v => ({ ...v, student_name: e.target.value }))} className="h-8 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Star Rating (1-5)</Label>
                <Input placeholder="5" type="number" min={1} max={5} value={newItem.star_rating}
                  onChange={e => setNewItem(v => ({ ...v, star_rating: parseInt(e.target.value) || 5 }))} className="h-8 text-xs bg-muted/20" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Testimonial Text *</Label>
              <textarea placeholder="Student review…" rows={2} value={newItem.story_text}
                onChange={e => setNewItem(v => ({ ...v, story_text: e.target.value }))}
                className="w-full p-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
            </div>
            <UploadField
              label="Student Photo (optional)"
              value={newItem.photo_url}
              onChange={url => setNewItem(v => ({ ...v, photo_url: url }))}
              accept="image/*"
              previewImage
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending || !newItem.student_name || !newItem.story_text}
                className="h-7 text-xs bg-primary text-white font-bold">
                {create.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}Save
              </Button>
            </div>
          </div>
        )}
        {textOnly.map((t: any) => (
          <div key={t.id} className="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {t.photo_url && <img src={getMediaUrl(t.photo_url)} alt={t.student_name} className="w-7 h-7 rounded-full object-cover border border-border" />}
                <span className="text-xs font-bold">{t.student_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-500">{'â˜…'.repeat(t.star_rating)}</span>
                {perm.delete && (
                  <button type="button" title="Delete" onClick={() => del.mutate(t.id)}
                    className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{t.story_text}</p>
          </div>
        ))}
        {textOnly.length === 0 && !adding && <p className="text-center text-xs text-muted-foreground py-4">No text testimonials yet. Click Add to create one.</p>}
      </CardContent>
    </Card>
  );
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function VideoFramePicker({ videoUrl, onCapture }: { videoUrl: string; onCapture: (url: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uploading, setUploading] = useState(false);
  const [captured, setCaptured] = useState(false);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      video.pause();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setUploading(true);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const result = await api.upload.file(file);
      onCapture(result.url);
      setCaptured(true);
    } catch {
      // canvas taint or upload error — silently ignore
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 p-3 bg-violet-500/5 rounded-xl border border-violet-500/20">
      <p className="text-[9px] font-bold text-violet-600 uppercase tracking-wide flex items-center gap-1">
        <Camera className="w-3 h-3" /> Pick Thumbnail Frame
      </p>
      <video
        ref={videoRef}
        src={getMediaUrl(videoUrl)}
        controls
        playsInline
        muted
        crossOrigin="anonymous"
        className="w-full max-h-28 rounded-lg border border-border/50 bg-black"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={capture}
          disabled={uploading}
          className="flex items-center gap-1.5 h-7 px-3 text-[10px] font-bold rounded-lg bg-violet-500/15 text-violet-600 border border-violet-500/30 hover:bg-violet-500/25 disabled:opacity-60 transition-colors"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
          {captured ? 'âœ“ Captured!' : 'Capture current frame'}
        </button>
        <span className="text-[9px] text-muted-foreground">Seek to the frame you want, then click capture.</span>
      </div>
    </div>
  );
}

// â”€â”€ Video Testimonials Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function VideoTestimonialsTab() {
  const perm = useEmployeePermission('admin-cms');
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['cms-testimonials'], queryFn: api.cms.testimonials.list });
  const videoOnly = (data as any[]).filter((t: any) => !!t.video_url);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ student_name: '', story_text: '', star_rating: 5, photo_url: '', video_url: '' });

  const create = useMutation({
    mutationFn: () => api.cms.testimonials.create(newItem),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-testimonials'] }); setAdding(false); setNewItem({ student_name: '', story_text: '', star_rating: 5, photo_url: '', video_url: '' }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.cms.testimonials.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-testimonials'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold">Video Testimonials ({videoOnly.length})</CardTitle>
          <p className="text-[10px] text-muted-foreground mt-0.5">Paste a YouTube URL or a direct video URL. These appear as a video carousel on the homepage.</p>
        </div>
        {perm.create && (
          <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
            className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
            <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add Video'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {adding && perm.create && (
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
            <UploadField
              label="Video * — upload a file or paste a YouTube link"
              value={newItem.video_url}
              onChange={url => setNewItem(v => ({ ...v, video_url: url }))}
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
              previewVideo
              required
            />
            {/* Frame picker — appears when a direct video file is uploaded (not YouTube) */}
            {newItem.video_url && !getYouTubeId(newItem.video_url) && /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(newItem.video_url) && (
              <VideoFramePicker
                videoUrl={newItem.video_url}
                onCapture={url => setNewItem(v => ({ ...v, photo_url: url }))}
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Person Name *</Label>
                <Input placeholder="e.g. Rajan Mehta" value={newItem.student_name}
                  onChange={e => setNewItem(v => ({ ...v, student_name: e.target.value }))} className="h-8 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Star Rating (1-5)</Label>
                <Input placeholder="5" type="number" min={1} max={5} value={newItem.star_rating}
                  onChange={e => setNewItem(v => ({ ...v, star_rating: parseInt(e.target.value) || 5 }))} className="h-8 text-xs bg-muted/20" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Caption / Short Note (optional)</Label>
              <Input placeholder="Brief description shown below the video" value={newItem.story_text}
                onChange={e => setNewItem(v => ({ ...v, story_text: e.target.value }))} className="h-8 text-xs bg-muted/20" />
            </div>
            <UploadField label="Thumbnail / Avatar (optional)" value={newItem.photo_url}
              onChange={url => setNewItem(v => ({ ...v, photo_url: url }))} accept="image/*" previewImage />
            <div className="flex justify-end">
              <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending || !newItem.student_name || !newItem.video_url}
                className="h-7 text-xs bg-primary text-white font-bold">
                {create.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}Save
              </Button>
            </div>
          </div>
        )}
        {videoOnly.map((t: any) => (
          <div key={t.id} className="p-3 bg-muted/20 rounded-xl border border-border/50 flex items-center gap-3">
            <div className="w-16 h-10 bg-black/30 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-border/40">
              {t.photo_url ? (
                <img src={getMediaUrl(t.photo_url)} alt={t.student_name} className="w-full h-full object-cover" />
              ) : t.video_url && !getYouTubeId(t.video_url) && /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(t.video_url) ? (
                <video
                  src={getMediaUrl(t.video_url)}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                  onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
                />
              ) : (
                <Video className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{t.student_name}</p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">{t.video_url}</p>
              {t.story_text && <p className="text-[10px] text-muted-foreground truncate">{t.story_text}</p>}
            </div>
            {perm.delete && (
              <button type="button" title="Delete" onClick={() => del.mutate(t.id)}
                className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {videoOnly.length === 0 && !adding && <p className="text-center text-xs text-muted-foreground py-4">No video testimonials yet. Click Add Video to add one.</p>}
      </CardContent>
    </Card>
  );
}

// â”€â”€ FAQs Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FaqsTab() {
  const perm = useEmployeePermission('admin-cms');
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['cms-faqs'], queryFn: api.cms.faqs.list });
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ question: '', answer: '', category: '' });

  const create = useMutation({
    mutationFn: () => api.cms.faqs.create(newItem),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-faqs'] }); setAdding(false); setNewItem({ question: '', answer: '', category: '' }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.cms.faqs.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-faqs'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold">FAQs ({data.length})</CardTitle>
        {perm.create && (
          <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
            className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
            <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {adding && perm.create && (
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
            <Input placeholder="Question" value={newItem.question} onChange={e => setNewItem(v => ({ ...v, question: e.target.value }))} className="h-8 text-xs bg-muted/20" />
            <textarea placeholder="Answer" rows={3} value={newItem.answer} onChange={e => setNewItem(v => ({ ...v, answer: e.target.value }))}
              className="w-full p-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
            <Input placeholder="Category (optional)" value={newItem.category} onChange={e => setNewItem(v => ({ ...v, category: e.target.value }))} className="h-8 text-xs bg-muted/20" />
            <div className="flex justify-end">
              <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending || !newItem.question || !newItem.answer}
                className="h-7 text-xs bg-primary text-white font-bold">
                {create.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}Save
              </Button>
            </div>
          </div>
        )}
        {data.map((f: any) => (
          <div key={f.id} className="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold">{f.question}</span>
              {perm.delete && (
                <button type="button" title="Delete" onClick={() => del.mutate(f.id)}
                  className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{f.answer}</p>
            {f.category && <span className="inline-block text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{f.category}</span>}
          </div>
        ))}
        {data.length === 0 && !adding && <p className="text-center text-xs text-muted-foreground py-4">No FAQs yet. Click Add to create one.</p>}
      </CardContent>
    </Card>
  );
}

// â”€â”€ Gallery Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function GalleryTab() {
  const perm = useEmployeePermission('admin-cms');
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['cms-gallery'], queryFn: api.cms.gallery.list });
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', image_url: '', caption: '', category: '' });
  const [lightbox, setLightbox] = useState<number | null>(null); // index into items
  const [items, setItems] = useState<any[]>([]);
  const [orderChanged, setOrderChanged] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const dragIdx = useRef<number | null>(null);

  // Sync local items when server data changes
  useEffect(() => { setItems(data); setOrderChanged(false); }, [data]);

  const create = useMutation({
    mutationFn: () => api.cms.gallery.add(newItem),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-gallery'] }); setAdding(false); setNewItem({ title: '', image_url: '', caption: '', category: '' }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.cms.gallery.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-gallery'] }),
  });
  const reorder = useMutation({
    mutationFn: (order: { id: string; order_index: number }[]) => api.cms.gallery.reorder(order),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-gallery'] }); setOrderChanged(false); },
  });

  const handleDelete = (img: any) => setConfirmDelete(img);

  // Drag-and-drop handlers
  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    dragIdx.current = i;
    setItems(next);
    setOrderChanged(true);
  };
  const onDragEnd = () => { dragIdx.current = null; };

  const saveOrder = () => {
    reorder.mutate(items.map((img, i) => ({ id: img.id, order_index: i + 1 })));
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        icon="delete"
        danger
        title={`Delete "${confirmDelete?.title || 'this image'}"?`}
        description="This will permanently remove the image from the gallery and cannot be undone."
        confirmLabel="Yes, Delete"
        cancelLabel="Keep It"
        onConfirm={() => del.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Lightbox */}
      {lightbox !== null && items[lightbox] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}>
          <button type="button" title="Close" aria-label="Close"
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-10"
            onClick={() => setLightbox(null)}>
            <X className="w-5 h-5" />
          </button>
          {lightbox > 0 && (
            <button type="button" title="Previous" aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-10"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1); }}>
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {lightbox < items.length - 1 && (
            <button type="button" title="Next" aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-10"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1); }}>
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          <div className="max-w-4xl max-h-[85vh] px-16" onClick={e => e.stopPropagation()}>
            <img src={getMediaUrl(items[lightbox].image_url)} alt={items[lightbox].title}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl" />
            {(items[lightbox].title || items[lightbox].caption) && (
              <div className="text-center mt-3">
                {items[lightbox].title && <p className="text-white font-bold text-sm">{items[lightbox].title}</p>}
                {items[lightbox].caption && <p className="text-white/70 text-xs mt-0.5">{items[lightbox].caption}</p>}
              </div>
            )}
            <p className="text-center text-white/40 text-[10px] mt-2">{lightbox + 1} / {items.length}</p>
          </div>
        </div>
      )}

      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">Gallery ({items.length} images)</CardTitle>
          <div className="flex items-center gap-2">
            {orderChanged && perm.edit && (
              <Button size="sm" type="button" onClick={saveOrder} disabled={reorder.isPending}
                className="h-8 text-xs bg-emerald-600 text-white font-bold">
                {reorder.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}Save Order
              </Button>
            )}
            {perm.create && (
              <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
                className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
                <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add Image'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {adding && perm.create && (
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Title</Label>
                  <Input placeholder="Photo title" value={newItem.title} onChange={e => setNewItem(v => ({ ...v, title: e.target.value }))} className="h-8 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Category (optional)</Label>
                  <Input placeholder="Event / Batch…" value={newItem.category} onChange={e => setNewItem(v => ({ ...v, category: e.target.value }))} className="h-8 text-xs bg-muted/20" />
                </div>
              </div>
              <UploadField label="Gallery Image *" value={newItem.image_url}
                onChange={url => setNewItem(v => ({ ...v, image_url: url }))}
                accept="image/*" previewImage required />
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Caption (optional)</Label>
                <Input placeholder="Short description of the photo" value={newItem.caption} onChange={e => setNewItem(v => ({ ...v, caption: e.target.value }))} className="h-8 text-xs bg-muted/20" />
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending || !newItem.image_url}
                  className="h-7 text-xs bg-primary text-white font-bold">
                  {create.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}Save
                </Button>
              </div>
            </div>
          )}

          {orderChanged && (
            <p className="text-[10px] text-amber-500 font-semibold text-center">
              Drag to reorder • Click "Save Order" to persist the new order
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((img: any, i: number) => (
              <div key={img.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDragEnd={onDragEnd}
                className="relative group rounded-xl overflow-hidden border border-border/50 bg-muted/20 cursor-grab active:cursor-grabbing select-none">
                {/* Drag handle indicator */}
                <div className="absolute top-2 left-2 z-10 p-1 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-white" />
                </div>
                {/* Preview button */}
                <button type="button" title="Preview full image" aria-label="Preview"
                  className="absolute top-2 right-10 z-10 p-1 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={e => { e.stopPropagation(); setLightbox(i); }}>
                  <ZoomIn className="w-3 h-3 text-white" />
                </button>
                {/* Delete button */}
                {perm.delete && (
                  <button type="button" title="Delete" aria-label="Delete image"
                    onClick={e => { e.stopPropagation(); handleDelete(img); }}
                    className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                {/* Image — click to preview */}
                <img src={getMediaUrl(img.image_url)} alt={img.title}
                  className="w-full h-28 object-cover"
                  onClick={() => setLightbox(i)} />
                <div className="p-2">
                  <p className="text-[10px] font-bold truncate">{img.title}</p>
                  {img.caption && <p className="text-[10px] text-muted-foreground truncate">{img.caption}</p>}
                  {img.category && <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{img.category}</span>}
                </div>
              </div>
            ))}
          </div>
          {items.length === 0 && !adding && <p className="text-center text-xs text-muted-foreground py-4">No gallery images yet. Click Add Image to upload one.</p>}
        </CardContent>
      </Card>
    </>
  );
}

// â”€â”€ Certifications Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CertificationsTab() {
  const perm = useEmployeePermission('admin-cms');
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['cms-certifications'], queryFn: api.cms.certifications.list });
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', issuer: '', image_url: '', description: '' });

  const create = useMutation({
    mutationFn: () => api.cms.certifications.add(newItem),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-certifications'] }); setAdding(false); setNewItem({ name: '', issuer: '', image_url: '', description: '' }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.cms.certifications.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-certifications'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold">Company Certifications ({data.length})</CardTitle>
        {perm.create && (
          <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
            className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
            <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {adding && perm.create && (
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Certificate Name *</Label>
                <Input placeholder="ISO 9001" value={newItem.name} onChange={e => setNewItem(v => ({ ...v, name: e.target.value }))} className="h-8 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Issuer</Label>
                <Input placeholder="Govt. of India" value={newItem.issuer} onChange={e => setNewItem(v => ({ ...v, issuer: e.target.value }))} className="h-8 text-xs bg-muted/20" />
              </div>
            </div>
            <UploadField
              label="Certificate Image / Badge *"
              value={newItem.image_url}
              onChange={url => setNewItem(v => ({ ...v, image_url: url }))}
              accept="image/*"
              previewImage
              required
            />
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description (optional)</Label>
              <Input placeholder="Brief note about the cert" value={newItem.description} onChange={e => setNewItem(v => ({ ...v, description: e.target.value }))} className="h-8 text-xs bg-muted/20" />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending || !newItem.name}
                className="h-7 text-xs bg-primary text-white font-bold">
                {create.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}Save
              </Button>
            </div>
          </div>
        )}
        {data.map((c: any) => (
          <div key={c.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
            {c.image_url && <img src={getMediaUrl(c.image_url)} alt={c.name} className="w-10 h-10 rounded-lg object-contain border border-border" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{c.name}</p>
              {c.issuer && <p className="text-[11px] text-muted-foreground">by {c.issuer}</p>}
              {c.description && <p className="text-[10px] text-muted-foreground truncate">{c.description}</p>}
            </div>
            {perm.delete && (
              <button type="button" title="Delete" onClick={() => del.mutate(c.id)}
                className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {data.length === 0 && !adding && <p className="text-center text-xs text-muted-foreground py-4">No certifications yet.</p>}
      </CardContent>
    </Card>
  );
}

// â”€â”€ Documents Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DocumentsTab() {
  const perm = useEmployeePermission('admin-cms');
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['cms-documents'], queryFn: api.cms.documents.list });
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', file_url: '', file_type: '' });

  const create = useMutation({
    mutationFn: () => api.cms.documents.add(newItem),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-documents'] }); setAdding(false); setNewItem({ name: '', description: '', file_url: '', file_type: '' }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.cms.documents.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-documents'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold">Company Documents ({data.length})</CardTitle>
        {perm.create && (
          <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
            className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
            <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add Document'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {adding && perm.create && (
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Document Name *</Label>
                <Input placeholder="Company Policy" value={newItem.name} onChange={e => setNewItem(v => ({ ...v, name: e.target.value }))} className="h-8 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">File Type</Label>
                <Input placeholder="PDF / DOCX…" value={newItem.file_type} onChange={e => setNewItem(v => ({ ...v, file_type: e.target.value }))} className="h-8 text-xs bg-muted/20" />
              </div>
            </div>
            <UploadField
              label="Document File *"
              value={newItem.file_url}
              onChange={url => setNewItem(v => ({ ...v, file_url: url }))}
              accept=".pdf,.doc,.docx,.xlsx,.pptx,application/pdf,application/msword"
              previewImage={false}
              required
            />
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description (optional)</Label>
              <Input placeholder="Short note about this document" value={newItem.description} onChange={e => setNewItem(v => ({ ...v, description: e.target.value }))} className="h-8 text-xs bg-muted/20" />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending || !newItem.name || !newItem.file_url}
                className="h-7 text-xs bg-primary text-white font-bold">
                {create.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}Save
              </Button>
            </div>
          </div>
        )}
        {data.map((d: any) => (
          <div key={d.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{d.name}</p>
              {d.description && <p className="text-[11px] text-muted-foreground truncate">{d.description}</p>}
              {d.file_type && <span className="text-[9px] font-bold bg-muted/60 px-1.5 py-0.5 rounded">{d.file_type}</span>}
            </div>
            <a href={getMediaUrl(d.file_url)} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-primary underline mr-2 flex items-center gap-1 shrink-0">
              <ExternalLink className="w-3 h-3" />View
            </a>
            {perm.delete && (
              <button type="button" title="Delete" onClick={() => del.mutate(d.id)}
                className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {data.length === 0 && !adding && <p className="text-center text-xs text-muted-foreground py-4">No documents yet.</p>}
      </CardContent>
    </Card>
  );
}

// â”€â”€ Shared spinner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Spinner() {
  return (
    <div className="p-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />Loading…
    </div>
  );
}

// ─── ExpertsTab ──────────────────────────────────────────────────────────────
function ExpertsTab() {
  const qc = useQueryClient();
  const perm = useEmployeePermission('admin-cms');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState<any>({
    name: '',
    role: '',
    company: '',
    photo_url: '',
    headline: '',
    bio: '',
    expertise_tags: [] as string[],
    category: 'AI & Automation',
    rating: 5.0,
    students_count: 1000,
    linkedin_url: '',
    is_active: true,
  });

  const { data: experts = [], isLoading } = useQuery<any[]>({
    queryKey: ['cms-industry-experts-admin'],
    queryFn: api.cms.experts.adminList,
  });

  const saveMutation = useMutation({
    mutationFn: (updated: any[]) => api.cms.experts.saveAll(updated),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-industry-experts-admin'] });
      qc.invalidateQueries({ queryKey: ['cms-industry-experts'] });
      setAdding(false);
      setEditingId(null);
    },
  });

  const handleStartAdd = () => {
    setForm({
      name: '',
      role: '',
      company: '',
      photo_url: '',
      headline: '',
      bio: '',
      expertise_tags: ['Automation', 'Strategy'],
      category: 'AI & Automation',
      rating: 5.0,
      students_count: 500,
      linkedin_url: 'https://linkedin.com',
      is_active: true,
    });
    setTagInput('');
    setEditingId(null);
    setAdding(true);
  };

  const handleStartEdit = (exp: any) => {
    setForm({ ...exp });
    setTagInput('');
    setAdding(false);
    setEditingId(exp.id);
  };

  const handleSaveItem = () => {
    if (!form.name || !form.role || !form.company || !form.bio) return;
    let updated: any[];
    if (editingId) {
      updated = experts.map((e: any) => (e.id === editingId ? { ...form, id: editingId } : e));
    } else {
      const newId = 'exp-' + Date.now();
      const newExp = { ...form, id: newId, order_index: experts.length + 1 };
      updated = [...experts, newExp];
    }
    saveMutation.mutate(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to remove this expert?')) return;
    const updated = experts.filter((e: any) => e.id !== id);
    saveMutation.mutate(updated);
  };

  const handleToggleActive = (id: string) => {
    const updated = experts.map((e: any) => (e.id === id ? { ...e, is_active: !e.is_active } : e));
    saveMutation.mutate(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= experts.length) return;
    const updated = [...experts];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    updated.forEach((e, idx) => {
      e.order_index = idx + 1;
    });
    saveMutation.mutate(updated);
  };

  const handleAddTag = () => {
    const val = tagInput.trim();
    if (!val) return;
    if (!form.expertise_tags.includes(val)) {
      setForm((prev: any) => ({ ...prev, expertise_tags: [...prev.expertise_tags, val] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm((prev: any) => ({
      ...prev,
      expertise_tags: prev.expertise_tags.filter((t: string) => t !== tag),
    }));
  };

  if (isLoading) return <Spinner />;

  return (
    <Card className="border border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-bold">Industry Practitioner Faculty ({experts.length})</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage experts showcased in the "Learn from Industry Experts" section on the landing page
          </p>
        </div>
        {perm.create && !adding && !editingId && (
          <Button size="sm" onClick={handleStartAdd} className="h-7 text-xs bg-primary text-white font-bold gap-1">
            <Plus className="w-3.5 h-3.5" />Add Expert
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {(adding || editingId) && (
          <div className="p-4 bg-muted/30 border border-primary/30 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="text-xs font-bold text-foreground">
                {editingId ? 'Edit Industry Expert' : 'Add New Industry Expert'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setEditingId(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Expert Name *</Label>
                <Input
                  placeholder="e.g. Vikram Singh"
                  value={form.name}
                  onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
                  className="h-8 text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Role / Designation *</Label>
                <Input
                  placeholder="e.g. Head of Digital Marketing"
                  value={form.role}
                  onChange={(e) => setForm((f: any) => ({ ...f, role: e.target.value }))}
                  className="h-8 text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Company / Background *</Label>
                <Input
                  placeholder="e.g. ex-CRED or Razorpay"
                  value={form.company}
                  onChange={(e) => setForm((f: any) => ({ ...f, company: e.target.value }))}
                  className="h-8 text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Category</Label>
                <select
                  value={form.category || 'AI & Automation'}
                  onChange={(e) => setForm((f: any) => ({ ...f, category: e.target.value }))}
                  className="w-full h-8 px-2 text-xs rounded-md bg-muted/20 border border-border"
                >
                  <option value="AI & Automation">AI & Automation</option>
                  <option value="Performance Marketing">Performance Marketing</option>
                  <option value="Tech & Dev">Tech & Dev</option>
                  <option value="Design & Media">Design & Media</option>
                  <option value="Business & Sales">Business & Sales</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Headline / Credential</Label>
                <Input
                  placeholder="e.g. Performance Marketer & Growth Strategist (10+ Yrs Exp)"
                  value={form.headline || ''}
                  onChange={(e) => setForm((f: any) => ({ ...f, headline: e.target.value }))}
                  className="h-8 text-xs bg-muted/20"
                />
              </div>
            </div>

            <UploadField
              label="Profile Photo (Upload or image URL)"
              value={form.photo_url || ''}
              onChange={(url) => setForm((f: any) => ({ ...f, photo_url: url }))}
              accept="image/*"
              urlPlaceholder="https://... or upload"
              previewClassName="w-44 sm:w-52 aspect-[4/5] rounded-2xl object-cover border-2 border-primary/30 shadow-xl"
            />

            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">About / Bio *</Label>
              <textarea
                rows={3}
                placeholder="Write detailed background about the mentor, what they built, and what they teach..."
                value={form.bio || ''}
                onChange={(e) => setForm((f: any) => ({ ...f, bio: e.target.value }))}
                className="w-full p-2 text-xs rounded-md bg-muted/20 border border-border resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Expertise Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill tag (e.g. Meta Ads) and click Add"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="h-8 text-xs bg-muted/20"
                />
                <Button type="button" size="sm" onClick={handleAddTag} className="h-8 text-xs">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(form.expertise_tags || []).map((t: string) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[11px] bg-muted/80 px-2 py-0.5 rounded-md border border-border"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-red-400 hover:text-red-600"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Rating (1 - 5)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={form.rating ?? 5.0}
                  onChange={(e) => setForm((f: any) => ({ ...f, rating: parseFloat(e.target.value) || 5.0 }))}
                  className="h-8 text-xs bg-muted/20"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Students Mentored</Label>
                <Input
                  type="number"
                  value={form.students_count ?? 500}
                  onChange={(e) => setForm((f: any) => ({ ...f, students_count: parseInt(e.target.value) || 0 }))}
                  className="h-8 text-xs bg-muted/20"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">LinkedIn Profile URL</Label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={form.linkedin_url || ''}
                  onChange={(e) => setForm((f: any) => ({ ...f, linkedin_url: e.target.value }))}
                  className="h-8 text-xs bg-muted/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={(e) => setForm((f: any) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded"
                />
                <span>Active on Landing Page</span>
              </label>

              <Button
                size="sm"
                onClick={handleSaveItem}
                disabled={saveMutation.isPending || !form.name || !form.role || !form.company}
                className="h-8 text-xs bg-primary text-white font-bold"
              >
                {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                {editingId ? 'Update Expert' : 'Save Expert'}
              </Button>
            </div>
          </div>
        )}

        {/* Experts List */}
        <div className="space-y-2">
          {experts.map((exp: any, index: number) => (
            <div
              key={exp.id || index}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                exp.is_active === false
                  ? 'bg-muted/10 border-border/40 opacity-60'
                  : 'bg-muted/20 border-border/60 hover:border-primary/40'
              }`}
            >
              {/* Order Controls */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  title="Move Up"
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Move Down"
                  disabled={index === experts.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>

              {/* Photo Preview */}
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted/40 border border-border shrink-0">
                {exp.photo_url ? (
                  <img src={getMediaUrl(exp.photo_url)} alt={exp.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-primary/20 text-primary">
                    {exp.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground truncate">{exp.name}</h4>
                  <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {exp.company}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded hidden sm:inline-block">
                    {exp.category || 'Expert'}
                  </span>
                </div>
                <p className="text-[11px] text-primary font-medium truncate">{exp.role}</p>
                <p className="text-[10px] text-muted-foreground truncate">{exp.bio}</p>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleActive(exp.id)}
                  title={exp.is_active === false ? 'Click to Activate' : 'Click to Deactivate'}
                  className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer ${
                    exp.is_active === false
                      ? 'bg-zinc-700 text-zinc-300'
                      : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  }`}
                >
                  {exp.is_active === false ? 'Inactive' : 'Active'}
                </button>

                {perm.edit && (
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => handleStartEdit(exp)}
                    className="p-1 text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {perm.delete && (
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => handleDelete(exp.id)}
                    className="p-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {experts.length === 0 && !adding && (
            <p className="text-center text-xs text-muted-foreground py-6">No industry experts found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main AdminCMS ──────────────────────────────────────────────────────────
export default function AdminCMS() {
  const [activeTab, setActiveTab] = useState<CmsTab>('Hero');
  const tabs: CmsTab[] = ['Hero', 'Experts', 'Testimonials', 'Videos', 'FAQs', 'Gallery', 'Certifications', 'Documents'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Landing Page CMS</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Edit website content: hero, industry experts, testimonials, videos, FAQs, products, gallery, certifications, documents and instructor applications</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const Icon = TAB_ICONS[t];
          return (
            <button key={t} type="button" onClick={() => setActiveTab(t)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === t ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border/50'}`}>
              <Icon className="w-3.5 h-3.5" />{t}
            </button>
          );
        })}
      </div>

      {activeTab === 'Hero' && <HeroTab />}
      {activeTab === 'Experts' && <ExpertsTab />}
      {activeTab === 'Testimonials' && <TestimonialsTab />}
      {activeTab === 'Videos' && <VideoTestimonialsTab />}
      {activeTab === 'FAQs' && <FaqsTab />}
      {activeTab === 'Gallery' && <GalleryTab />}
      {activeTab === 'Certifications' && <CertificationsTab />}
      {activeTab === 'Documents' && <DocumentsTab />}
    </div>
  );
}
