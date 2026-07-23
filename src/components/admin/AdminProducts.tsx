import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getStoredToken, getMediaUrl } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import {
  Package, Plus, Search, Edit2, Trash2, X, Save, Loader2, Upload,
  AlertCircle, CheckCircle2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown,
  Boxes, Factory, Layers, Tag, IndianRupee
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Helpers ───────────────────────────────────────────────────────────────────
function stockBadge(qty: number) {
  if (qty <= 0) return { label: 'Out of Stock', cls: 'bg-red-500/10 text-red-500 border-red-500/20' };
  if (qty <= 10) return { label: 'Low Stock', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
  return { label: 'In Stock', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
}

const EMPTY_FORM = {
  name: '', short_description: '', long_description: '', category: '',
  gst_category_id: '', price: '',
  bv: '', sku: '', stock_quantity: '0', is_active: true,
  manufacturer: '', material: '', weight: '', dimensions: '',
  image_url: '', pdf_url: '', buy_url: '', detail_url: '', features: '',
  referral_discount_percent: '',
};

type FormState = typeof EMPTY_FORM & { is_active: boolean };

export default function AdminProducts() {
  const perm = useEmployeePermission('admin-products');
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [formSection, setFormSection] = useState<'basic' | 'inventory' | 'manufacturer' | 'media'>('basic');
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [inlineStock, setInlineStock] = useState<Record<string, string>>({});

  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-products'],
    queryFn: () => api.cms.products.list(),
    enabled: !!getStoredToken(),
  });

  const { data: publicSettings } = useQuery<{ map: Record<string, string> }>({
    queryKey: ['public-settings'],
    queryFn: () => api.platformSettings.getPublic(),
  });
  const defaultBvRate = parseFloat(publicSettings?.map?.product_bv_rate ?? '') || 10;

  const { data: gstCategories = [] } = useQuery<any[]>({
    queryKey: ['gst-categories'],
    queryFn: () => api.gstCategories.list(),
    enabled: !!getStoredToken(),
  });

  // Derive categories from real data
  const categories = ['All', ...Array.from(new Set(products.filter(p => p.category).map((p: any) => p.category as string)))];

  const filtered = products.filter((p: any) => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !(p.sku || '').toLowerCase().includes(q) && !(p.category || '').toLowerCase().includes(q)) return false;
    if (catFilter !== 'All' && p.category !== catFilter) return false;
    if (stockFilter === 'in_stock' && Number(p.stock_quantity) <= 10) return false;
    if (stockFilter === 'low_stock' && (Number(p.stock_quantity) <= 0 || Number(p.stock_quantity) > 10)) return false;
    if (stockFilter === 'out_of_stock' && Number(p.stock_quantity) > 0) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.cms.products.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); qc.invalidateQueries({ queryKey: ['cms-products'] }); closeForm(); },
    onError: (e: any) => setFormError(e.message || 'Failed to save'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.cms.products.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); qc.invalidateQueries({ queryKey: ['cms-products'] }); closeForm(); },
    onError: (e: any) => setFormError(e.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.cms.products.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); qc.invalidateQueries({ queryKey: ['cms-products'] }); setDeleteId(null); },
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      api.cms.products.update(id, { stock_quantity: qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setFormSection('basic');
    setFormError('');
    setShowForm(true);
  }

  function openEdit(p: any) {
    setEditId(p.id);
    setForm({
      name: p.name || '',
      short_description: p.short_description || '',
      long_description: p.long_description || '',
      category: p.category || '',
      gst_category_id: p.gst_category_id || '',
      price: p.price != null ? String(p.price) : '',
      bv: p.bv != null ? String(p.bv) : '',
      sku: p.sku || '',
      stock_quantity: String(p.stock_quantity ?? 0),
      is_active: p.is_active !== false,
      manufacturer: p.manufacturer || '',
      material: p.material || '',
      weight: p.weight || '',
      dimensions: p.dimensions || '',
      image_url: p.image_url || '',
      pdf_url: p.pdf_url || '',
      buy_url: p.buy_url || '',
      detail_url: p.detail_url || '',
      features: Array.isArray(p.features) ? p.features.join('\n') : (p.features ? JSON.stringify(p.features) : ''),
      referral_discount_percent: p.referral_discount_percent != null ? String(p.referral_discount_percent) : '',
    });
    setFormSection('basic');
    setFormError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setFormError('');
  }

  function f(key: keyof FormState, val: string | boolean) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleImgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    try {
      const res = await api.upload.file(file);
      f('image_url', res.url);
    } catch { /* ignore */ } finally {
      setImgUploading(false);
      if (imgRef.current) imgRef.current.value = '';
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploading(true);
    try {
      const res = await api.upload.file(file);
      f('pdf_url', res.url);
    } catch { /* ignore */ } finally {
      setPdfUploading(false);
      if (pdfRef.current) pdfRef.current.value = '';
    }
  }

  function handleSave() {
    if (!form.name.trim()) { setFormError('Product name is required.'); return; }
    if (!form.short_description.trim()) { setFormError('Short description is required.'); return; }
    setFormError('');

    let featuresData: any = undefined;
    if (form.features.trim()) {
      featuresData = form.features.split('\n').map(s => s.trim()).filter(Boolean);
    }

    const payload = {
      name: form.name.trim(),
      short_description: form.short_description.trim(),
      long_description: form.long_description.trim() || undefined,
      category: form.category.trim() || undefined,
      gst_category_id: form.gst_category_id || undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      bv: form.bv ? parseFloat(form.bv) : 0,
      sku: form.sku.trim() || undefined,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      is_active: form.is_active,
      manufacturer: form.manufacturer.trim() || undefined,
      material: form.material.trim() || undefined,
      weight: form.weight.trim() || undefined,
      dimensions: form.dimensions.trim() || undefined,
      image_url: form.image_url.trim() || undefined,
      pdf_url: form.pdf_url.trim() || undefined,
      buy_url: form.buy_url.trim() || undefined,
      detail_url: form.detail_url.trim() || undefined,
      features: featuresData,
      referral_discount_percent: form.referral_discount_percent ? parseFloat(form.referral_discount_percent) : null,
    };

    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const SECTIONS = [
    { id: 'basic', label: 'Basic Info', icon: Tag },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'manufacturer', label: 'Manufacturer', icon: Factory },
    { id: 'media', label: 'Media & Links', icon: Layers },
  ] as const;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-violet-500" />
            Product Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full CRUD, inventory stock control, and manufacturer details. Products appear in the student and instructor shop.
          </p>
        </div>
        {perm.create && (
          <Button onClick={openCreate} className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1" />Add Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, SKU, category…"
              className="pl-9 h-9 text-xs bg-muted/20" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} title="Filter by category"
            className="h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value as any)} title="Filter by stock"
            className="h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none">
            <option value="all">All Stock</option>
            <option value="in_stock">In Stock (&gt;10)</option>
            <option value="low_stock">Low Stock (1–10)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <p className="text-[10px] text-muted-foreground">{filtered.length} / {products.length} products</p>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length, color: 'text-foreground' },
          { label: 'Active', value: products.filter((p:any) => p.is_active).length, color: 'text-emerald-500' },
          { label: 'Out of Stock', value: products.filter((p:any) => Number(p.stock_quantity) <= 0).length, color: 'text-red-500' },
          { label: 'Low Stock', value: products.filter((p:any) => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 10).length, color: 'text-amber-500' },
        ].map(s => (
          <Card key={s.label} className="border border-border bg-card">
            <CardContent className="p-4 space-y-0.5">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.label}</p>
              <p className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Products table */}
      <Card className="border border-border bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading products…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{products.length === 0 ? 'No products yet. Add your first product.' : 'No products match the current filters.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Image', 'Name / SKU', 'Category', 'Price', 'BV', 'Stock', 'Manufacturer', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => {
                    const sb = stockBadge(Number(p.stock_quantity));
                    const inlineVal = inlineStock[p.id] ?? String(p.stock_quantity ?? 0);
                    return (
                      <tr key={p.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          {p.image_url ? (
                            <img src={getMediaUrl(p.image_url)} alt="" className="w-10 h-10 object-cover rounded-lg border border-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-border bg-muted/30 flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground">{p.name}</p>
                          {p.sku && <p className="text-[9px] text-muted-foreground font-mono mt-0.5">SKU: {p.sku}</p>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.category || '—'}</td>
                        <td className="px-4 py-3 font-mono font-bold text-foreground">
                          {p.price != null ? `₹${Number(p.price).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-violet-500">
                          {p.bv ? Number(p.bv).toFixed(0) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {perm.edit ? (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => {
                                const v = Math.max(0, (parseInt(inlineVal) || 0) - 1);
                                setInlineStock(s => ({ ...s, [p.id]: String(v) }));
                                stockMutation.mutate({ id: p.id, qty: v });
                              }} className="w-5 h-5 rounded border border-border text-muted-foreground hover:text-foreground flex items-center justify-center">
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              <input
                                type="number" min="0"
                                value={inlineVal}
                                onChange={e => setInlineStock(s => ({ ...s, [p.id]: e.target.value }))}
                                onBlur={e => stockMutation.mutate({ id: p.id, qty: parseInt(e.target.value) || 0 })}
                                className="w-12 h-5 text-center text-[10px] font-mono border border-border rounded bg-muted/20 focus:outline-none"
                              />
                              <button onClick={() => {
                                const v = (parseInt(inlineVal) || 0) + 1;
                                setInlineStock(s => ({ ...s, [p.id]: String(v) }));
                                stockMutation.mutate({ id: p.id, qty: v });
                              }} className="w-5 h-5 rounded border border-border text-muted-foreground hover:text-foreground flex items-center justify-center">
                                <ChevronUp className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-muted-foreground">{inlineVal}</span>
                          )}
                          <span className={`mt-1 inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${sb.cls}`}>
                            {sb.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[10px] max-w-[140px]">
                          <p className="truncate">{p.manufacturer || '—'}</p>
                          {p.material && <p className="truncate text-[9px] opacity-70">{p.material}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {perm.edit ? (
                            <button onClick={() => updateMutation.mutate({ id: p.id, data: { is_active: !p.is_active } })}
                              className={`flex items-center gap-1 text-[9px] font-bold ${p.is_active ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                              {p.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              {p.is_active ? 'Active' : 'Inactive'}
                            </button>
                          ) : (
                            <span className={`flex items-center gap-1 text-[9px] font-bold ${p.is_active ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                              {p.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {perm.edit && (
                              <button onClick={() => openEdit(p)}
                                className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {perm.delete && (
                              <button onClick={() => setDeleteId(p.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="max-w-2xl w-full bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
              <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-500" />
                {editId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section tabs */}
            <div className="flex border-b border-border/40 px-6 gap-1 pt-1 bg-muted/10">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setFormSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-t-lg border-b-2 transition-colors ${
                    formSection === s.id
                      ? 'border-violet-500 text-violet-500'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  <s.icon className="w-3 h-3" />{s.label}
                </button>
              ))}
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

              {formSection === 'basic' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Product Name *</Label>
                      <Input value={form.name} onChange={e => f('name', e.target.value)}
                        placeholder="e.g. T2U Starter Kit" className="h-9 text-xs bg-muted/20" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Category</Label>
                      <Input value={form.category} onChange={e => f('category', e.target.value)}
                        placeholder="e.g. Study Material" className="h-9 text-xs bg-muted/20" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">GST Category</Label>
                      <select
                        value={form.gst_category_id}
                        onChange={e => f('gst_category_id', e.target.value)}
                        title="Select GST category for this product"
                        className="w-full h-9 text-xs border border-border rounded-lg bg-muted/20 px-3 text-foreground focus:outline-none"
                      >
                        <option value="">— No GST Category —</option>
                        {gstCategories.filter((c: any) => c.is_active).map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({Number(c.gst_rate)}%)
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-muted-foreground">Used to calculate GST on purchase invoices.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Price (₹)</Label>
                      <Input type="number" min="0" value={form.price}
                        onChange={e => {
                          const price = e.target.value;
                          f('price', price);
                          // Auto-fill BV from configured rate when BV is blank or was auto-filled
                          const priceNum = parseFloat(price);
                          if (!isNaN(priceNum) && priceNum > 0) {
                            const autoBv = Math.round(priceNum * defaultBvRate / 100);
                            setForm(prev => ({ ...prev, price, bv: String(autoBv) }));
                          }
                        }}
                        placeholder="e.g. 4999" className="h-9 text-xs bg-muted/20 font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">
                        Business Volume (BV)
                        <span className="ml-1.5 text-[8px] text-muted-foreground font-normal normal-case">
                          auto-fills at {defaultBvRate}% of price — override if needed
                        </span>
                      </Label>
                      <Input type="number" min="0" value={form.bv} onChange={e => f('bv', e.target.value)}
                        placeholder={`auto: ${defaultBvRate}% of price`} className="h-9 text-xs bg-muted/20 font-mono" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Referral Discount (%)</Label>
                      <Input type="number" min="0" max="100" step="0.5" value={form.referral_discount_percent}
                        onChange={e => f('referral_discount_percent', e.target.value)}
                        placeholder="e.g. 10" className="h-9 text-xs bg-muted/20 font-mono max-w-[160px]" />
                      <p className="text-[9px] text-muted-foreground">Discount for non-distributors who enter a valid referral ID at checkout.</p>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Short Description *</Label>
                      <Input value={form.short_description} onChange={e => f('short_description', e.target.value)}
                        placeholder="One-line description shown in cards" className="h-9 text-xs bg-muted/20" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Long Description</Label>
                      <textarea value={form.long_description} onChange={e => f('long_description', e.target.value)}
                        rows={3} placeholder="Full product description…"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Features (one per line)</Label>
                      <textarea value={form.features} onChange={e => f('features', e.target.value)}
                        rows={3} placeholder={'Course completion certificate\nLive mentorship sessions\nLifetime access'}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono" />
                    </div>
                  </div>
                </>
              )}

              {formSection === 'inventory' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">SKU</Label>
                    <Input value={form.sku} onChange={e => f('sku', e.target.value)}
                      placeholder="e.g. T2U-SK-001" className="h-9 text-xs bg-muted/20 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Stock Quantity</Label>
                    <Input type="number" min="0" value={form.stock_quantity} onChange={e => f('stock_quantity', e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono" />
                  </div>
                  <div className="col-span-2">
                    <button type="button" onClick={() => f('is_active', !form.is_active)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${
                        form.is_active
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                          : 'border-border bg-muted/20 text-muted-foreground'
                      }`}>
                      {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {form.is_active ? 'Active — visible in shop' : 'Inactive — hidden from shop'}
                    </button>
                  </div>
                  <div className="col-span-2 p-3 bg-muted/10 border border-border/50 rounded-xl text-[10px] text-muted-foreground space-y-0.5">
                    <p className="font-bold text-foreground text-xs mb-1">Stock Status Preview</p>
                    {(() => { const sb = stockBadge(parseInt(form.stock_quantity) || 0);
                      return <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${sb.cls}`}>{sb.label}</span>;
                    })()}
                    <p className="mt-1">In Stock = &gt;10 units · Low Stock = 1–10 units · Out of Stock = 0 units</p>
                  </div>
                </div>
              )}

              {formSection === 'manufacturer' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Manufacturer / Brand</Label>
                    <Input value={form.manufacturer} onChange={e => f('manufacturer', e.target.value)}
                      placeholder="e.g. T2Upgrade Pvt Ltd" className="h-9 text-xs bg-muted/20" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Material / Build Quality</Label>
                    <textarea value={form.material} onChange={e => f('material', e.target.value)}
                      rows={2} placeholder="e.g. Premium coated paper, 300 GSM, matte finish"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Weight</Label>
                    <Input value={form.weight} onChange={e => f('weight', e.target.value)}
                      placeholder="e.g. 250g" className="h-9 text-xs bg-muted/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Dimensions</Label>
                    <Input value={form.dimensions} onChange={e => f('dimensions', e.target.value)}
                      placeholder="e.g. 21 × 29.7 × 1.5 cm" className="h-9 text-xs bg-muted/20" />
                  </div>
                </div>
              )}

              {formSection === 'media' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Product Image</Label>
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input value={form.image_url} onChange={e => f('image_url', e.target.value)}
                          placeholder="Paste image URL or upload →" className="h-9 text-xs bg-muted/20" />
                        <input ref={imgRef} type="file" accept="image/*" title="Upload product image" className="hidden"
                          onChange={handleImgUpload} />
                        <Button type="button" size="sm" disabled={imgUploading}
                          onClick={() => imgRef.current?.click()}
                          className="h-8 text-xs bg-muted hover:bg-muted/80 text-foreground border border-border">
                          {imgUploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                          {imgUploading ? 'Uploading…' : 'Upload Image'}
                        </Button>
                      </div>
                      {form.image_url && (
                        <div className="relative shrink-0">
                          <img src={getMediaUrl(form.image_url)} alt="" className="w-20 h-20 object-cover rounded-xl border border-border" />
                          <button type="button" onClick={() => f('image_url', '')}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Product PDF Attachment (Brochure / Manual)</Label>
                    <div className="flex gap-2 items-center">
                      <Input value={form.pdf_url} onChange={e => f('pdf_url', e.target.value)}
                        placeholder="Paste PDF URL or upload →" className="h-9 text-xs bg-muted/20 flex-1" />
                      <input ref={pdfRef} type="file" accept=".pdf,application/pdf" title="Upload product PDF attachment" className="hidden"
                        onChange={handlePdfUpload} />
                      <Button type="button" size="sm" disabled={pdfUploading}
                        onClick={() => pdfRef.current?.click()}
                        className="h-9 text-xs bg-muted hover:bg-muted/80 text-foreground border border-border shrink-0">
                        {pdfUploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                        {pdfUploading ? 'Uploading…' : 'Upload PDF'}
                      </Button>
                    </div>
                    <p className="text-[9px] text-muted-foreground">Attached PDF will be accessible in full-screen reader mode for product buyers.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Buy / Purchase URL</Label>
                    <Input value={form.buy_url} onChange={e => f('buy_url', e.target.value)}
                      placeholder="https://… (external checkout link)" className="h-9 text-xs bg-muted/20" />
                    <p className="text-[9px] text-muted-foreground">If set, "Buy Now" opens this URL in a new tab. Leave blank for in-app order flow.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Product Detail Page URL</Label>
                    <Input value={form.detail_url} onChange={e => f('detail_url', e.target.value)}
                      placeholder="https://… (optional product page)" className="h-9 text-xs bg-muted/20" />
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-border/40 flex items-center gap-3">
              <Button disabled={isSaving} onClick={handleSave}
                className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-5">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                {editId ? 'Save Changes' : 'Create Product'}
              </Button>
              <Button variant="outline" onClick={closeForm} className="h-9 text-xs border-border">Cancel</Button>
              {formError && <p className="text-xs text-red-500 font-semibold flex-1">{formError}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="max-w-sm w-full border border-red-500/30 bg-card shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">Delete Product</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This will permanently delete the product from the catalogue and the public shop. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-xs border-border">Cancel</Button>
                <Button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteId!)}
                  className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white font-bold px-4">
                  {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
