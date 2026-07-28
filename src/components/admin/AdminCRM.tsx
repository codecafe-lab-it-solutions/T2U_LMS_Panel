import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone, Mail, MapPin, Tag, BookOpen, Loader2, Trash2,
  UserPlus, RefreshCw, ChevronDown
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

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[status] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
}

export default function AdminCRM() {
  const perm = useEmployeePermission('admin-crm');
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

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
                    {['Name', 'Contact', 'Location', 'Course Interest', 'Referred By', 'Status', 'Date', 'Notes', 'Actions'].map(h => (
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
                          <span className="flex items-center gap-1 text-muted-foreground max-w-[140px] truncate">
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
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-[10px]">
                        {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        {!perm.edit ? (
                          <span className="text-[10px] text-muted-foreground max-w-[140px] truncate block">{lead.notes || '—'}</span>
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
                            className="text-left text-[10px] text-muted-foreground hover:text-foreground transition-colors max-w-[140px] truncate block">
                            {lead.notes || <span className="text-muted-foreground/40 italic">+ add note</span>}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {perm.delete && (
                          <Button size="sm" variant="outline"
                            onClick={() => { if (confirm(`Delete lead "${lead.full_name}"?`)) deleteLead.mutate(lead.id); }}
                            className="h-6 text-[9px] font-bold px-2 border-red-500/20 text-red-500 hover:bg-red-500/10">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
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
    </div>
  );
}
