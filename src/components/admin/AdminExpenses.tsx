import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getMediaUrl } from '../../services/api';
import { Calculator, Plus, Trash2, Pencil, X, Loader2, Paperclip, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaginationFooter } from '@/components/ui/pagination-footer';
import { formatDate } from '../../utils/date';

const PAGE_LIMIT = 20;

const CATEGORIES = [
  { value: 'marketing', label: 'Marketing', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  { value: 'purchases', label: 'Purchases', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  { value: 'operational', label: 'Operational', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { value: 'other', label: 'Other', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
] as const;

function fmt(n: number | string | null | undefined) {
  return `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const EMPTY_FORM = { category: 'marketing', sub_category: '', amount: '', expense_date: new Date().toISOString().slice(0, 10), description: '', payment_method: '', attachment_url: '' };

export default function AdminExpenses() {
  const qc = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-expenses', categoryFilter, search, page],
    queryFn: () => api.expenses.list({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      search: search || undefined,
      page, limit: PAGE_LIMIT,
    }),
    staleTime: 15_000,
  });

  const expenses = data?.expenses ?? [];
  const total = data?.total ?? 0;
  const totalAmount = data?.total_amount ?? 0;

  const createMutation = useMutation({
    mutationFn: (body: typeof EMPTY_FORM) => api.expenses.create({ ...body, amount: parseFloat(body.amount) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-expenses'] }); closeForm(); },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: typeof EMPTY_FORM }) => api.expenses.update(id, { ...body, amount: parseFloat(body.amount) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-expenses'] }); closeForm(); },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.expenses.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-expenses'] }),
  });

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }
  function openEdit(exp: any) {
    setEditId(exp.id);
    setForm({
      category: exp.category, sub_category: exp.sub_category ?? '', amount: String(exp.amount),
      expense_date: exp.expense_date.slice(0, 10), description: exp.description ?? '',
      payment_method: exp.payment_method ?? '', attachment_url: exp.attachment_url ?? '',
    });
    setFormError('');
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.upload.file(file);
      setForm(f => ({ ...f, attachment_url: res.url }));
    } catch (err: any) {
      setFormError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { setFormError('Amount must be greater than 0'); return; }
    if (editId) updateMutation.mutate({ id: editId, body: form });
    else createMutation.mutate(form);
  }

  const catMeta = (cat: string) => CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[3];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Calculator className="w-6 h-6 text-teal-500" />
            Expenses
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Marketing, purchases, operational, and other company expenses — Super Admin only. Employee salary is tracked separately under Payroll.</p>
        </div>
        <Button onClick={openCreate} className="h-9 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4 mr-1.5" />Add Expense
        </Button>
      </div>

      {/* Summary */}
      <Card className="border border-teal-500/20 bg-teal-500/5">
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total (filtered)</span>
          <span className="text-xl font-black font-mono text-teal-500">{fmt(totalAmount)}</span>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
          {(['all', ...CATEGORIES.map(c => c.value)] as const).map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${categoryFilter === cat ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-48">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search description / sub-category..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="h-8.5 text-xs bg-muted/20"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border border-border bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">No expenses found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border/40 bg-muted/20">
                    <th className="p-3 font-bold">Date</th>
                    <th className="p-3 font-bold">Category</th>
                    <th className="p-3 font-bold">Sub-category</th>
                    <th className="p-3 font-bold">Description</th>
                    <th className="p-3 font-bold text-right">Amount</th>
                    <th className="p-3 font-bold">Payment</th>
                    <th className="p-3 font-bold">Attachment</th>
                    <th className="p-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {expenses.map((exp: any) => {
                    const meta = catMeta(exp.category);
                    return (
                      <tr key={exp.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 text-muted-foreground font-mono whitespace-nowrap">{formatDate(exp.expense_date)}</td>
                        <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-black border capitalize ${meta.color}`}>{meta.label}</span></td>
                        <td className="p-3 text-foreground font-medium">{exp.sub_category ?? '—'}</td>
                        <td className="p-3 text-muted-foreground max-w-[280px]">{exp.description ?? '—'}</td>
                        <td className="p-3 text-right font-black font-mono text-foreground">{fmt(exp.amount)}</td>
                        <td className="p-3 text-muted-foreground">{exp.payment_method ?? '—'}</td>
                        <td className="p-3">
                          {exp.attachment_url ? (
                            <a href={getMediaUrl(exp.attachment_url)} target="_blank" rel="noreferrer" className="text-teal-500 hover:underline flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />View
                            </a>
                          ) : '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1.5">
                            <Button size="sm" onClick={() => openEdit(exp)} className="h-7 text-[9px] font-bold px-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20">
                              <Pencil className="w-3 h-3 mr-1" />Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => { if (confirm('Delete this expense entry?')) deleteMutation.mutate(exp.id); }}
                              disabled={deleteMutation.isPending}
                              className="h-7 text-[9px] font-bold px-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />Delete
                            </Button>
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
        <PaginationFooter page={page} totalPages={Math.ceil(total / PAGE_LIMIT)} total={total} onPageChange={setPage} label="expenses" />
      </Card>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl relative">
            <button onClick={closeForm} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-sm font-black text-foreground">{editId ? 'Edit Expense' : 'Add Expense'}</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Category</Label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground mt-1"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Sub-category</Label>
                  <Input value={form.sub_category} onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))} placeholder="e.g. Facebook Ads, Office Rent" className="h-9 text-xs mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Amount (₹)</Label>
                    <Input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="h-9 text-xs mt-1" required />
                  </div>
                  <div>
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Date</Label>
                    <Input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className="h-9 text-xs mt-1" required />
                  </div>
                </div>
                <div>
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Payment Method</Label>
                  <Input value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} placeholder="e.g. Bank Transfer, UPI, Cash" className="h-9 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-9 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Attachment (bill/receipt)</Label>
                  <input type="file" onChange={handleFileChange} className="w-full text-xs mt-1" />
                  {uploading && <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Uploading...</p>}
                  {form.attachment_url && !uploading && <p className="text-[10px] text-emerald-500 mt-1">Attached ✓</p>}
                </div>

                {formError && <p className="text-[11px] text-rose-500">{formError}</p>}

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading} className="flex-1 h-9 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white">
                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                    {editId ? 'Save Changes' : 'Add Expense'}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeForm} className="h-9 text-xs font-bold">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
