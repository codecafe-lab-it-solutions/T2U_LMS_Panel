import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone, Mail, MapPin, Tag, BookOpen, Loader2, Trash2,
  UserPlus, RefreshCw, ChevronDown, Clipboard, Eye, X,
  CreditCard, BadgeIndianRupee, CalendarClock, Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginationFooter } from '@/components/ui/pagination-footer';
import { api } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';

const PAGE_LIMIT = 20;

const STATUS_OPTIONS = ['new', 'contacted', 'interested', 'converted', 'lost'] as const;
type LeadStatus = typeof STATUS_OPTIONS[number];

const STATUS_STYLES: Record<LeadStatus, string> = {
  new:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contacted:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  interested: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  converted:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  lost:       'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const PAYMENT_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  REFUNDED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[status] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
}

function formatAmount(value: unknown) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PaymentBadge({ lead }: { lead: any }) {
  const status = String(lead.payment_status || 'PENDING').toUpperCase();
  const amount = formatAmount(lead.amount_paid);
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${PAYMENT_STYLES[status] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
      <span className="text-[8px] leading-none">{status === 'PAID' ? '●' : status === 'FAILED' ? '●' : status === 'PENDING' ? '●' : '●'}</span>
      {status}{status === 'PAID' && amount ? ` (${amount})` : ''}
    </span>
  );
}

function shortId(value?: string | null) {
  if (!value) return '—';
  return value.length > 11 ? `${value.slice(0, 7)}...${value.slice(-4)}` : value;
}

export default function AdminCRM() {
  const perm = useEmployeePermission('admin-crm');
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-leads', statusFilter, page],
    queryFn: () => api.leads.list(statusFilter || undefined, page, PAGE_LIMIT),
  });

  const leads: any[] = data?.leads ?? [];
  const total: number = data?.total ?? 0;

  const updateLead = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.leads.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leads'] }),
  });

  const deleteLead = useMutation({
    mutationFn: (id: string) => api.leads.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leads'] }),
  });

  const handleStatusChange = (id: string, status: string) => {
    updateLead.mutate({ id, payload: { status } });
  };

  const handleSaveNote = (id: string) => {
    updateLead.mutate({ id, payload: { notes: noteInput } }, {
      onSuccess: () => { setEditingNoteId(null); setNoteInput(''); },
    });
  };

  // Summary counts
  const counts = data?.counts ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">CRM — Leads</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Leads submitted via the landing page form. Total: {total}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map(s => (
          <button key={s} type="button" onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1); }}
            className={`p-3 rounded-xl border text-left transition-all ${statusFilter === s ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
            <p className="text-[9px] font-bold uppercase text-muted-foreground">{s}</p>
            <p className="text-xl font-black text-foreground mt-0.5">{counts[s] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Leads table */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              {statusFilter ? `Leads — ${statusFilter}` : 'All Leads'} ({leads.length})
            </CardTitle>
            <CardDescription className="text-xs">Click status to filter · Update status inline</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="h-8 text-xs border-border">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading leads…
            </div>
          ) : leads.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              {statusFilter ? `No leads with status "${statusFilter}"` : 'No leads yet. They will appear here when landing page forms are submitted.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Name', 'Contact', 'Location', 'Course Interest', 'Referred By', 'Status', 'Payment Status', 'Transaction ID', 'Date', 'Notes', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead: any) => (
                    <tr key={lead.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">{lead.full_name}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-2.5 h-2.5 shrink-0" />{lead.mobile}
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-2.5 h-2.5 shrink-0" />{lead.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.city ? <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5 shrink-0" />{lead.city}</span> : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {lead.course_interest ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <BookOpen className="w-2.5 h-2.5 shrink-0" />{lead.course_interest}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {lead.referred_by ? (
                          <span className="flex items-center gap-1 text-muted-foreground font-mono text-[9px]">
                            <Tag className="w-2.5 h-2.5 shrink-0" />{lead.referred_by}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {perm.edit ? (
                          <div className="relative">
                            <select
                              aria-label="Lead status"
                              value={lead.status}
                              onChange={e => handleStatusChange(lead.id, e.target.value)}
                              className="appearance-none pr-5 pl-2 py-0.5 rounded-full border text-[9px] font-bold cursor-pointer bg-transparent focus:outline-none"
                              style={{ colorScheme: 'dark' }}
                            >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown className="w-2.5 h-2.5 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                          </div>
                        ) : null}
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBadge lead={lead} />
                      </td>
                      <td className="px-4 py-3">
                        {lead.transaction_id ? (
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(lead.transaction_id)}
                            className="inline-flex items-center gap-1 font-mono text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                            title={lead.transaction_id}
                          >
                            {shortId(lead.transaction_id)}
                            <Clipboard className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-[10px]">
                        {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        {!perm.edit ? (
                          <span className="text-[10px] text-muted-foreground max-w-[220px] block">{lead.notes || '—'}</span>
                        ) : editingNoteId === lead.id ? (
                          <div className="flex gap-1">
                            <input
                              value={noteInput}
                              onChange={e => setNoteInput(e.target.value)}
                              placeholder="Add note…"
                              className="flex-1 h-6 px-2 rounded border border-border bg-muted/20 text-[10px] focus:outline-none"
                            />
                            <button type="button" onClick={() => handleSaveNote(lead.id)}
                              className="h-6 px-1.5 rounded bg-primary text-white text-[9px] font-bold">Save</button>
                            <button type="button" onClick={() => setEditingNoteId(null)}
                              className="h-6 px-1.5 rounded bg-muted/40 text-muted-foreground text-[9px]">×</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => { setEditingNoteId(lead.id); setNoteInput(lead.notes ?? ''); }}
                            className="text-left text-[10px] text-muted-foreground hover:text-foreground transition-colors max-w-[220px] block">
                            {lead.notes || <span className="text-muted-foreground/40 italic">+ add note</span>}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline"
                            onClick={() => setSelectedLead(lead)}
                            className="h-6 text-[9px] font-bold px-2 border-border">
                            <Eye className="w-3 h-3" />
                          </Button>
                        {perm.delete && (
                          <Button size="sm" variant="outline"
                            onClick={() => { if (confirm(`Delete lead "${lead.full_name}"?`)) deleteLead.mutate(lead.id); }}
                            className="h-6 text-[9px] font-bold px-2 border-red-500/20 text-red-500 hover:bg-red-500/10">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <PaginationFooter page={page} totalPages={Math.ceil(total / PAGE_LIMIT)} total={total} onPageChange={setPage} label="leads" />
      </Card>
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelectedLead(null)}>
          <div
            className="h-full w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-base font-black text-foreground">{selectedLead.full_name}</h2>
                <p className="text-xs text-muted-foreground">{selectedLead.mobile}{selectedLead.email ? ` · ${selectedLead.email}` : ''}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedLead(null)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-5 space-y-4">
              <Card className="border border-border bg-muted/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BadgeIndianRupee className="w-4 h-4 text-primary" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {[
                    ['Status', <PaymentBadge lead={selectedLead} />],
                    ['Amount', formatAmount(selectedLead.amount_paid) || '—'],
                    ['Gateway Ref', selectedLead.transaction_id || '—'],
                    ['Order ID', selectedLead.order_id || '—'],
                    ['Mode', selectedLead.payment_method || '—'],
                    ['Paid Date & Time', formatDateTime(selectedLead.paid_at)],
                    ['Registration ID', selectedLead.registration_id || '—'],
                    ['Receipt', selectedLead.receipt_number || '—'],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="grid grid-cols-[130px_1fr] gap-3">
                      <span className="text-muted-foreground font-semibold">{label}:</span>
                      <span className="text-foreground break-words">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border border-border bg-muted/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Lead Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="grid grid-cols-[130px_1fr] gap-3">
                    <span className="text-muted-foreground font-semibold">Course:</span>
                    <span>{selectedLead.course_interest || '—'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_1fr] gap-3">
                    <span className="text-muted-foreground font-semibold">Location:</span>
                    <span>{selectedLead.city || '—'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_1fr] gap-3">
                    <span className="text-muted-foreground font-semibold">Referred By:</span>
                    <span>{selectedLead.referred_by || '—'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_1fr] gap-3">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1"><CalendarClock className="w-3 h-3" />Registered:</span>
                    <span>{formatDateTime(selectedLead.created_at)}</span>
                  </div>
                  <div className="grid grid-cols-[130px_1fr] gap-3">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1"><Hash className="w-3 h-3" />Lead ID:</span>
                    <span className="font-mono text-[10px]">{selectedLead.id}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
