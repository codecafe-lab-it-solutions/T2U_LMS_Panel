import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Library, Plus, Pencil, Trash2, ArrowUp, ArrowDown, X, Search, Loader2, Upload, AlertTriangle, Star } from 'lucide-react';
import { api, getMediaUrl, getStoredToken, getErrorMessage, type ApiCourseBundle } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';

interface FormState {
  name: string;
  short_desc: string;
  description: string;
  thumbnail_url: string;
  price: string;
  bv_credit: string;
  distributor_price: string;
  referral_discount_percent: string;
  makes_distributor: boolean;
  gst_category_id: string;
  is_active: boolean;
  is_featured: boolean;
  course_ids: string[]; // order = display order
}

const EMPTY_FORM: FormState = {
  name: '', short_desc: '', description: '', thumbnail_url: '', price: '', bv_credit: '',
  distributor_price: '', referral_discount_percent: '', makes_distributor: false, gst_category_id: '', is_active: false, is_featured: false, course_ids: [],
};

const inputCls = 'w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';
const labelCls = 'block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1';
const inr = (n: number | string | null | undefined) => (n == null || n === '' ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);

export default function AdminCourseBundles() {
  const perm = useEmployeePermission('admin-course-bundles');
  const coursePerm = useEmployeePermission('admin-courses');
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiCourseBundle | null>(null);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: bundles = [], isLoading, isError, error } = useQuery<ApiCourseBundle[]>({
    queryKey: ['admin-course-bundles'],
    queryFn: () => api.courseBundles.adminList(),
  });
  const { data: allCourses = [] } = useQuery<any[]>({
    queryKey: ['admin-all-courses-for-bundles'],
    queryFn: () => api.courses.listAll(),
    enabled: !!getStoredToken(),
  });
  const { data: gstCategories = [] } = useQuery<any[]>({
    queryKey: ['gst-categories'],
    queryFn: () => api.gstCategories.list(),
    enabled: !!getStoredToken(),
  });

  const courseById = useMemo(() => new Map(allCourses.map((c: any) => [c.id, c])), [allCourses]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-course-bundles'] });
    qc.invalidateQueries({ queryKey: ['course-bundles'] });
  };

  const saveMut = useMutation({
    mutationFn: ({ id, form }: { id: string | null; form: FormState }) => {
      const payload = {
        name: form.name.trim(),
        short_desc: form.short_desc.trim() || null,
        description: form.description.trim() || null,
        thumbnail_url: form.thumbnail_url.trim() || null,
        price: form.price.trim() === '' ? null : form.price,
        bv_credit: form.bv_credit.trim() === '' ? null : form.bv_credit,
        distributor_price: form.distributor_price.trim() === '' ? null : form.distributor_price,
        referral_discount_percent: form.referral_discount_percent.trim() === '' ? null : form.referral_discount_percent,
        makes_distributor: form.makes_distributor,
        gst_category_id: form.gst_category_id || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        course_ids: form.course_ids,
      };
      return id ? api.courseBundles.update(id, payload) : api.courseBundles.create(payload);
    },
    onSuccess: () => { invalidate(); setEditing(null); setFormError(''); },
    onError: (e) => setFormError(getErrorMessage(e)),
  });

  const toggleMut = useMutation({
    mutationFn: (b: ApiCourseBundle) => api.courseBundles.update(b.id, { is_active: !b.is_active }),
    onSuccess: () => { invalidate(); setPageError(''); },
    onError: (e) => setPageError(getErrorMessage(e)),
  });

  // Publishes a draft course straight from the bundle editor, so admins don't have to leave the
  // form to fix a "Not published" course in the bundle.
  const publishCourseMut = useMutation({
    mutationFn: (courseId: string) => api.courses.setStatus(courseId, 'published'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-courses-for-bundles'] });
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      invalidate();
      setFormError('');
    },
    onError: (e) => setFormError(getErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.courseBundles.remove(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
    onError: (e) => { setPageError(getErrorMessage(e)); setDeleteTarget(null); },
  });

  function openCreate() { setFormError(''); setCourseSearch(''); setEditing({ id: null, form: { ...EMPTY_FORM } }); }
  function openEdit(b: ApiCourseBundle) {
    setFormError(''); setCourseSearch('');
    setEditing({
      id: b.id,
      form: {
        name: b.name, short_desc: b.short_desc ?? '', description: b.description ?? '',
        thumbnail_url: b.thumbnail_url ?? '', price: b.price != null ? String(b.price) : '',
        bv_credit: b.bv_credit != null ? String(b.bv_credit) : '', gst_category_id: b.gst_category_id ?? '',
        distributor_price: b.distributor_price != null ? String(b.distributor_price) : '',
        referral_discount_percent: b.referral_discount_percent != null ? String(b.referral_discount_percent) : '',
        makes_distributor: !!b.makes_distributor,
        is_active: b.is_active, is_featured: b.is_featured, course_ids: b.courses.map(c => c.id),
      },
    });
  }
  const patchForm = (p: Partial<FormState>) => setEditing(e => (e ? { ...e, form: { ...e.form, ...p } } : e));

  function moveCourse(idx: number, dir: -1 | 1) {
    if (!editing) return;
    const ids = [...editing.form.course_ids];
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    patchForm({ course_ids: ids });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const { url } = await api.upload.file(f);
      patchForm({ thumbnail_url: url });
    } catch (err) {
      setFormError('Image upload failed: ' + getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!editing) return;
    const f = editing.form;
    if (!f.name.trim()) return setFormError('Bundle name is required.');
    if (f.is_active && f.course_ids.length === 0) return setFormError('Add at least one course before activating this bundle.');
    setFormError('');
    saveMut.mutate(editing);
  }

  const selected = editing?.form.course_ids ?? [];
  const pickable = allCourses
    .filter((c: any) => !selected.includes(c.id))
    .filter((c: any) => !courseSearch || c.title.toLowerCase().includes(courseSearch.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Course Bundles</h1>
          <p className="text-sm text-muted-foreground mt-1">Group existing courses into a single enrollable package</p>
        </div>
        {perm.create && (
          <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> New Bundle
          </button>
        )}
      </div>

      {pageError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-4 py-3">{pageError}</div>}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading bundles…</div>
      ) : isError ? (
        <div className="text-center py-16 text-red-500 text-sm">{getErrorMessage(error)}</div>
      ) : bundles.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border">
          <Library className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No bundles yet. Create your first course bundle.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bundles.map(b => {
            const unavailable = b.courses.filter(c => !c.available).length;
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
                <div className="h-32 bg-muted/40 relative">
                  {b.thumbnail_url ? (
                    <img src={getMediaUrl(b.thumbnail_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Library className="w-8 h-8" /></div>
                  )}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${b.is_active ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground border border-border'}`}>
                    {b.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {b.is_featured && <Star className="absolute top-2 right-2 w-4 h-4 text-amber-400 fill-amber-400" />}
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="font-bold text-foreground leading-tight">{b.name}</h3>
                  {b.short_desc && <p className="text-xs text-muted-foreground line-clamp-2">{b.short_desc}</p>}
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    <span><b className="text-foreground">{b.courses.length}</b> courses</span>
                    <span>Price <b className="text-foreground">{inr(b.price)}</b></span>
                    <span><b className="text-foreground">{b.enrollment_count ?? 0}</b> enrolled</span>
                  </div>
                  {unavailable > 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {unavailable} course{unavailable > 1 ? 's' : ''} unpublished/unavailable
                    </p>
                  )}
                  <ul className="text-xs text-foreground/80 space-y-0.5 mt-1">
                    {b.courses.slice(0, 4).map(c => (
                      <li key={c.id} className={`truncate ${c.available ? '' : 'line-through opacity-60'}`}>• {c.title}</li>
                    ))}
                    {b.courses.length > 4 && <li className="text-muted-foreground">+ {b.courses.length - 4} more</li>}
                  </ul>
                  <div className="flex items-center gap-2 mt-auto pt-3">
                    {perm.edit && (
                      <>
                        <button type="button" onClick={() => openEdit(b)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted/50"><Pencil className="w-3 h-3" /> Edit</button>
                        <button
                          type="button"
                          disabled={toggleMut.isPending}
                          onClick={() => toggleMut.mutate(b)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted/50 disabled:opacity-60"
                        >
                          {b.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </>
                    )}
                    {perm.delete && (
                      <button type="button" onClick={() => setDeleteTarget(b)} className="ml-auto p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg" title="Delete bundle"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="bg-background border border-border rounded-2xl w-full max-w-3xl shadow-2xl max-h-[calc(100vh-1.5rem)] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 className="text-lg font-bold text-foreground">{editing.id ? 'Edit Bundle' : 'New Bundle'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid gap-5 md:grid-cols-2 overflow-y-auto min-h-0 flex-1 content-start">
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input className={inputCls} value={editing.form.name} onChange={e => patchForm({ name: e.target.value })} placeholder="e.g. Digital Growth Bundle" />
                </div>
                <div>
                  <label className={labelCls}>Short description</label>
                  <input className={inputCls} value={editing.form.short_desc} onChange={e => patchForm({ short_desc: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={4} className={`${inputCls} resize-none`} value={editing.form.description} onChange={e => patchForm({ description: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Image</label>
                  <div className="flex items-center gap-2">
                    <input className={inputCls} value={editing.form.thumbnail_url} onChange={e => patchForm({ thumbnail_url: e.target.value })} placeholder="Image URL or upload" />
                    <label className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-border cursor-pointer hover:bg-muted/50">
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    </label>
                  </div>
                  {editing.form.thumbnail_url && <img src={getMediaUrl(editing.form.thumbnail_url)} alt="" className="mt-2 h-20 rounded-lg object-cover border border-border" />}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Price (₹, incl. GST)</label>
                    <input type="number" min="0" className={inputCls} value={editing.form.price} onChange={e => patchForm({ price: e.target.value })} placeholder="Free if empty" />
                  </div>
                  <div>
                    <label className={labelCls}>BV credit</label>
                    <input type="number" min="0" className={inputCls} value={editing.form.bv_credit} onChange={e => patchForm({ bv_credit: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Distributor price (₹)</label>
                    <input type="number" min="0" className={inputCls} value={editing.form.distributor_price} onChange={e => patchForm({ distributor_price: e.target.value })} placeholder="Optional" />
                    <p className="text-[10px] text-muted-foreground mt-1">Charged to distributors from their 2nd approved purchase.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Referral discount (%)</label>
                    <input type="number" min="0" max="100" step="0.5" className={inputCls} value={editing.form.referral_discount_percent} onChange={e => patchForm({ referral_discount_percent: e.target.value })} placeholder="Optional" />
                    <p className="text-[10px] text-muted-foreground mt-1">For non-distributors entering a valid referral ID.</p>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>GST category</label>
                  <select className={inputCls} value={editing.form.gst_category_id} onChange={e => patchForm({ gst_category_id: e.target.value })}>
                    <option value="">None</option>
                    {gstCategories.filter((c: any) => c.is_active).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({Number(c.gst_rate)}%)</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={editing.form.makes_distributor} onChange={e => patchForm({ makes_distributor: e.target.checked })} />
                  <span>Makes the buyer a distributor<span className="block text-[10px] text-muted-foreground">Approving a purchase of this bundle unlocks distributor pricing for their future purchases.</span></span>
                </label>
                <div className="flex gap-5">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="checkbox" checked={editing.form.is_active} onChange={e => patchForm({ is_active: e.target.checked })} /> Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="checkbox" checked={editing.form.is_featured} onChange={e => patchForm({ is_featured: e.target.checked })} /> Featured
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Courses in bundle ({selected.length}) — order = learning order</label>
                  <div className="rounded-xl border border-border divide-y divide-border max-h-56 overflow-y-auto">
                    {selected.length === 0 ? (
                      <p className="p-3 text-xs text-muted-foreground">No courses added yet. Pick from the list below.</p>
                    ) : selected.map((id, idx) => {
                      const c = courseById.get(id);
                      const bad = !c || c.status !== 'published';
                      return (
                        <div key={id} className="flex items-center gap-2 px-3 py-2">
                          <span className="text-[10px] font-mono text-muted-foreground w-4">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{c?.title ?? 'Unknown course'}</p>
                            {bad && <p className="text-[10px] text-amber-600 dark:text-amber-400">Not published — students won't receive it until it is</p>}
                          </div>
                          {c && c.status !== 'published' && coursePerm.edit && (
                            <button type="button" disabled={publishCourseMut.isPending} onClick={() => publishCourseMut.mutate(c.id)}
                              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50">
                              {publishCourseMut.isPending && publishCourseMut.variables === c.id ? 'Publishing…' : 'Publish'}
                            </button>
                          )}
                          <button type="button" disabled={idx === 0} onClick={() => moveCourse(idx, -1)} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                          <button type="button" disabled={idx === selected.length - 1} onClick={() => moveCourse(idx, 1)} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => patchForm({ course_ids: selected.filter(x => x !== id) })} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Add courses</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input className={`${inputCls} pl-8`} placeholder="Search courses…" value={courseSearch} onChange={e => setCourseSearch(e.target.value)} />
                  </div>
                  <div className="rounded-xl border border-border divide-y divide-border max-h-48 overflow-y-auto">
                    {pickable.length === 0 ? (
                      <p className="p-3 text-xs text-muted-foreground">No more courses to add.</p>
                    ) : pickable.map((c: any) => (
                      <button key={c.id} type="button" onClick={() => patchForm({ course_ids: [...selected, c.id] })} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/40">
                        <span className="text-sm text-foreground truncate">{c.title}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          {c.status !== 'published' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">{c.status}</span>}
                          <Plus className="w-3.5 h-3.5 text-primary" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {formError && <div className="mx-5 my-3 shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-4 py-2">{formError}</div>}
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
              <button type="button" disabled={saveMut.isPending} onClick={submit} className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl disabled:opacity-60">
                {saveMut.isPending ? 'Saving…' : editing.id ? 'Save changes' : 'Create bundle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-foreground">Delete “{deleteTarget.name}”?</h2>
            <p className="text-sm text-muted-foreground">
              The bundle will be removed from the catalogue and can no longer be purchased. Students who already enrolled keep access to the courses they were granted.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
              <button type="button" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(deleteTarget.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                {deleteMut.isPending ? 'Deleting…' : 'Delete bundle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
