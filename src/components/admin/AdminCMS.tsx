import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe, Star, FileText, Package, Image, Award, Plus, Trash2, Save,
  Loader2, Upload, X, ExternalLink, GripVertical, ZoomIn, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getMediaUrl } from '../../services/api';
import ConfirmDialog from '../ConfirmDialog';

type CmsTab = 'Hero' | 'Testimonials' | 'FAQs' | 'Products' | 'Gallery' | 'Certifications' | 'Documents';

const TAB_ICONS: Record<CmsTab, any> = {
  Hero: Globe, Testimonials: Star, FAQs: FileText,
  Products: Package, Gallery: Image, Certifications: Award, Documents: FileText,
};

// ── Shared: UploadField ───────────────────────────────────────────────────────
// Renders a file-picker + upload button. Shows preview for images.
// Falls back to a URL text input for paste-in.
interface UploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;      // e.g. "image/*" or ".pdf,.doc,.docx"
  previewImage?: boolean;
  required?: boolean;
}

function UploadField({ label, value, onChange, accept = 'image/*', previewImage = true, required }: UploadFieldProps) {
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
  const isImage = previewImage && value && (displayUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i) || accept.includes('image'));

  return (
    <div className="space-y-1.5">
      <Label className="text-[9px] font-bold text-muted-foreground uppercase">{label}{required && ' *'}</Label>

      {/* Preview */}
      {value && isImage && (
        <div className="relative inline-block">
          <img src={displayUrl} alt={label} className="h-20 rounded-lg object-cover border border-border" />
          <button type="button" title="Remove" onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {value && !isImage && (
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

      {/* Upload button + URL toggle */}
      {!value && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 text-[10px] font-bold text-primary hover:bg-primary/10 transition-colors disabled:opacity-60"
            >
              {uploading
                ? <><Loader2 className="w-3 h-3 animate-spin" />Uploading…</>
                : <><Upload className="w-3 h-3" />Upload File</>}
            </button>
            <span className="text-[9px] text-muted-foreground">or</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(v => !v)}
              className="text-[9px] text-primary underline font-semibold"
            >
              Paste URL
            </button>
          </div>

          {showUrlInput && (
            <Input
              type="url"
              placeholder="https://…"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="h-8 text-xs bg-muted/20 font-mono"
            />
          )}

          {error && <p className="text-[9px] text-red-500 font-medium">{error}</p>}
        </div>
      )}

      {/* Change button when file already exists */}
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

// ── Hero Tab ──────────────────────────────────────────────────────────────────
function HeroTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ headline?: string; subheadline?: string; cta_text?: string }>({
    queryKey: ['cms-hero'], queryFn: api.cms.hero.get,
  });
  const [form, setForm] = useState<{ headline: string; subheadline: string; cta_text: string } | null>(null);
  const current = form ?? (data
    ? { headline: data.headline ?? '', subheadline: data.subheadline ?? '', cta_text: data.cta_text ?? '' }
    : { headline: '', subheadline: '', cta_text: '' });

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
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}
            className="h-8 text-xs bg-primary text-white font-bold">
            {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}Save
          </Button>
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
      </CardContent>
    </Card>
  );
}

// ── Testimonials Tab ──────────────────────────────────────────────────────────
function TestimonialsTab() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['cms-testimonials'], queryFn: api.cms.testimonials.list });
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
        <CardTitle className="text-sm font-bold">Testimonials ({data.length})</CardTitle>
        <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
          className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
          <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add'}
        </Button>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {adding && (
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
        {data.map((t: any) => (
          <div key={t.id} className="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {t.photo_url && <img src={getMediaUrl(t.photo_url)} alt={t.student_name} className="w-7 h-7 rounded-full object-cover border border-border" />}
                <span className="text-xs font-bold">{t.student_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-500">{'★'.repeat(t.star_rating)}</span>
                <button type="button" title="Delete" onClick={() => del.mutate(t.id)}
                  className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{t.story_text}</p>
          </div>
        ))}
        {data.length === 0 && !adding && <p className="text-center text-xs text-muted-foreground py-4">No testimonials yet. Click Add to create one.</p>}
      </CardContent>
    </Card>
  );
}

// ── FAQs Tab ──────────────────────────────────────────────────────────────────
function FaqsTab() {
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
        <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
          className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
          <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add'}
        </Button>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {adding && (
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
              <button type="button" title="Delete" onClick={() => del.mutate(f.id)}
                className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['cms-products'], queryFn: api.cms.products.list });
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', short_description: '', price: '', category: '', image_url: '', buy_url: '' });

  const create = useMutation({
    mutationFn: () => api.cms.products.create(newItem),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-products'] }); setAdding(false); setNewItem({ name: '', short_description: '', price: '', category: '', image_url: '', buy_url: '' }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => api.cms.products.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-products'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold">Products ({data.length})</CardTitle>
        <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
          className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
          <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add Product'}
        </Button>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {adding && (
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Product Name *</Label>
                <Input placeholder="e.g. Starter Kit" value={newItem.name} onChange={e => setNewItem(v => ({ ...v, name: e.target.value }))} className="h-8 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Category</Label>
                <Input placeholder="Learning Pack" value={newItem.category} onChange={e => setNewItem(v => ({ ...v, category: e.target.value }))} className="h-8 text-xs bg-muted/20" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Short Description</Label>
              <Input placeholder="Brief product description" value={newItem.short_description} onChange={e => setNewItem(v => ({ ...v, short_description: e.target.value }))} className="h-8 text-xs bg-muted/20" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Price (₹)</Label>
                <Input placeholder="4999" type="number" value={newItem.price} onChange={e => setNewItem(v => ({ ...v, price: e.target.value }))} className="h-8 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Buy URL</Label>
                <Input placeholder="https://…" value={newItem.buy_url} onChange={e => setNewItem(v => ({ ...v, buy_url: e.target.value }))} className="h-8 text-xs bg-muted/20 font-mono" />
              </div>
            </div>
            <UploadField
              label="Product Image"
              value={newItem.image_url}
              onChange={url => setNewItem(v => ({ ...v, image_url: url }))}
              accept="image/*"
              previewImage
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending || !newItem.name}
                className="h-7 text-xs bg-primary text-white font-bold">
                {create.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}Save
              </Button>
            </div>
          </div>
        )}
        {data.map((p: any) => (
          <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
            {p.image_url && <img src={getMediaUrl(p.image_url)} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{p.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{p.short_description}</p>
              {p.price != null && <p className="text-[11px] text-primary font-bold">₹{p.price}</p>}
            </div>
            <button type="button" title="Delete" onClick={() => del.mutate(p.id)}
              className="text-red-400 hover:text-red-600 transition-colors shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {data.length === 0 && !adding && <p className="text-center text-xs text-muted-foreground py-4">No products yet. Click Add Product to create one.</p>}
      </CardContent>
    </Card>
  );
}

// ── Gallery Tab ───────────────────────────────────────────────────────────────
function GalleryTab() {
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
            {orderChanged && (
              <Button size="sm" type="button" onClick={saveOrder} disabled={reorder.isPending}
                className="h-8 text-xs bg-emerald-600 text-white font-bold">
                {reorder.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}Save Order
              </Button>
            )}
            <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
              className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
              <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add Image'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {adding && (
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
                <button type="button" title="Delete" aria-label="Delete image"
                  onClick={e => { e.stopPropagation(); handleDelete(img); }}
                  className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                  <Trash2 className="w-3 h-3" />
                </button>
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

// ── Certifications Tab ────────────────────────────────────────────────────────
function CertificationsTab() {
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
        <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
          className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
          <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add'}
        </Button>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {adding && (
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
            <button type="button" title="Delete" onClick={() => del.mutate(c.id)}
              className="text-red-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {data.length === 0 && !adding && <p className="text-center text-xs text-muted-foreground py-4">No certifications yet.</p>}
      </CardContent>
    </Card>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────
function DocumentsTab() {
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
        <Button size="sm" type="button" onClick={() => setAdding(v => !v)}
          className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
          <Plus className="w-3.5 h-3.5 mr-1" />{adding ? 'Cancel' : 'Add Document'}
        </Button>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {adding && (
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
            <a href={d.file_url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-primary underline mr-2 flex items-center gap-1 shrink-0">
              <ExternalLink className="w-3 h-3" />View
            </a>
            <button type="button" title="Delete" onClick={() => del.mutate(d.id)}
              className="text-red-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {data.length === 0 && !adding && <p className="text-center text-xs text-muted-foreground py-4">No documents yet.</p>}
      </CardContent>
    </Card>
  );
}

// ── Shared spinner ────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="p-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />Loading…
    </div>
  );
}

// ── Main AdminCMS ─────────────────────────────────────────────────────────────
export default function AdminCMS() {
  const [activeTab, setActiveTab] = useState<CmsTab>('Hero');
  const tabs: CmsTab[] = ['Hero', 'Testimonials', 'FAQs', 'Products', 'Gallery', 'Certifications', 'Documents'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Landing Page CMS</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Edit website content: hero, testimonials, FAQs, products, gallery, certifications and documents</p>
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
      {activeTab === 'Testimonials' && <TestimonialsTab />}
      {activeTab === 'FAQs' && <FaqsTab />}
      {activeTab === 'Products' && <ProductsTab />}
      {activeTab === 'Gallery' && <GalleryTab />}
      {activeTab === 'Certifications' && <CertificationsTab />}
      {activeTab === 'Documents' && <DocumentsTab />}
    </div>
  );
}
