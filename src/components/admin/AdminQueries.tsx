import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  HelpCircle, Loader2, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, MessageSquare, Send,
  UserCircle2, ShieldCheck, RefreshCw, Paperclip, X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SupportAttachment from '../SupportAttachment';

const STATUS_TABS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const;
type StatusFilter = typeof STATUS_TABS[number];

const STATUS_STYLE: Record<string, string> = {
  open:        'bg-amber-500/10 border-amber-500/30 text-amber-600',
  in_progress: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
  resolved:    'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
  closed:      'bg-muted/40 border-border text-muted-foreground',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
};

export default function AdminQueries() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [statusInputs, setStatusInputs] = useState<Record<string, string>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyFile, setReplyFile] = useState<Record<string, File | null>>({});
  const replyFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, isLoading, refetch } = useQuery<{ queries: any[]; total: number }>({
    queryKey: ['admin-support-queries', statusFilter],
    queryFn: () => api.support.adminList(statusFilter),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, admin_note }: { id: string; status: string; admin_note: string }) =>
      api.support.update(id, { status, admin_note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-support-queries'] }); },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, content, file }: { ticketId: string; content: string; file: File | null }) => {
      const attachment_url = file ? (await api.upload.file(file)).url : undefined;
      return api.support.adminReply(ticketId, content, attachment_url);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-support-queries'] });
      setReplyText(p => ({ ...p, [vars.ticketId]: '' }));
      setReplyFile(p => ({ ...p, [vars.ticketId]: null }));
    },
  });

  const queries = (data?.queries ?? []).filter(q => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.user?.full_name?.toLowerCase().includes(s) ||
      q.user?.email?.toLowerCase().includes(s) ||
      q.subject?.toLowerCase().includes(s)
    );
  });

  const allQueries = data?.queries ?? [];
  const counts = {
    open:        allQueries.filter(q => q.status === 'open').length,
    in_progress: allQueries.filter(q => q.status === 'in_progress').length,
    resolved:    allQueries.filter(q => q.status === 'resolved').length,
    closed:      allQueries.filter(q => q.status === 'closed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/40 pb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-violet-500" /> Support Queries
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and reply to support tickets from users.</p>
        </div>
        <button type="button" onClick={() => refetch()} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open', value: counts.open, color: 'text-amber-500', border: 'border-amber-500/20' },
          { label: 'In Progress', value: counts.in_progress, color: 'text-blue-500', border: 'border-blue-500/20' },
          { label: 'Resolved', value: counts.resolved, color: 'text-emerald-500', border: 'border-emerald-500/20' },
          { label: 'Closed', value: counts.closed, color: 'text-muted-foreground', border: 'border-border' },
        ].map(s => (
          <Card key={s.label} className={`border ${s.border} bg-card`}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1 flex-wrap">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${statusFilter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s] ?? s}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, subject…"
          className="h-8 text-xs max-w-xs bg-muted/20"
        />
      </div>

      {/* Query list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : queries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No queries found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queries.map((q: any) => {
            const isOpen = openId === q.id;
            const curStatus = statusInputs[q.id] ?? q.status;
            const curNote = noteInputs[q.id] ?? q.admin_note ?? '';
            const messages: any[] = q.messages ?? [];

            return (
              <Card key={q.id} className="border border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground text-sm truncate">{q.subject}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[q.status] ?? 'bg-muted/40 border-border text-muted-foreground'}`}>
                          {STATUS_LABEL[q.status] ?? q.status}
                        </span>
                        {messages.length > 0 && (
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted/40 border border-border px-2 py-0.5 rounded-full">
                            {messages.length} msg{messages.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {q.user?.full_name} · {q.user?.email}
                        {q.user?.referral_code && <span className="ml-2 font-mono text-[10px]">({q.user.referral_code})</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      type="button"
                      title={isOpen ? 'Collapse' : 'Expand'}
                      onClick={() => setOpenId(isOpen ? null : q.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded thread + controls */}
                  {isOpen && (
                    <div className="border-t border-border/60 pt-3 space-y-4">

                      {/* ── Message thread ── */}
                      <div className="space-y-2">
                        {/* Original message */}
                        <div className="flex gap-2.5">
                          <UserCircle2 className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 bg-muted/20 rounded-xl p-3 text-xs">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-bold text-foreground">{q.user?.full_name}</span>
                              <span className="text-[9px] text-muted-foreground font-mono">
                                {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{q.message}</p>
                            {q.attachment_url && <SupportAttachment url={q.attachment_url} />}
                          </div>
                        </div>

                        {/* Subsequent messages */}
                        {messages.map((msg: any) => (
                          <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'admin' ? 'flex-row-reverse' : ''}`}>
                            {msg.sender === 'admin'
                              ? <ShieldCheck className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                              : <UserCircle2 className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                            }
                            <div className={`flex-1 rounded-xl p-3 text-xs ${
                              msg.sender === 'admin'
                                ? 'bg-violet-500/8 border border-violet-500/20'
                                : 'bg-muted/20'
                            }`}>
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="font-bold text-foreground">
                                  {msg.sender === 'admin' ? 'Support Admin' : q.user?.full_name}
                                </span>
                                {msg.sender === 'admin' && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600">Admin</span>
                                )}
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {msg.content && <p className="text-foreground whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                              {msg.attachment_url && <SupportAttachment url={msg.attachment_url} />}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* ── Admin reply box ── */}
                      <div className="space-y-2">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Reply to User</Label>
                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            value={replyText[q.id] ?? ''}
                            onChange={e => setReplyText(p => ({ ...p, [q.id]: e.target.value }))}
                            placeholder="Type your reply to the user..."
                            className="flex-1 text-xs bg-muted/10 border border-border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none font-sans leading-relaxed"
                          />
                          <Button
                            size="sm"
                            disabled={(!replyText[q.id]?.trim() && !replyFile[q.id]) || replyMutation.isPending}
                            onClick={() => replyMutation.mutate({ ticketId: q.id, content: replyText[q.id] || '', file: replyFile[q.id] || null })}
                            className="h-auto px-3 bg-violet-600 hover:bg-violet-700 text-white self-end"
                          >
                            {replyMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          </Button>
                        </div>
                        <input
                          ref={el => { replyFileInputRefs.current[q.id] = el; }}
                          type="file"
                          accept="image/*,video/*,application/pdf"
                          className="hidden"
                          onChange={e => setReplyFile(p => ({ ...p, [q.id]: e.target.files?.[0] || null }))}
                        />
                        {replyFile[q.id] ? (
                          <div className="flex items-center gap-2 text-[10.5px] bg-muted/10 border border-border rounded-lg px-2.5 py-1.5 w-fit">
                            <Paperclip className="w-3 h-3 text-violet-500 shrink-0" />
                            <span className="truncate max-w-[160px]">{replyFile[q.id]?.name}</span>
                            <button type="button" onClick={() => setReplyFile(p => ({ ...p, [q.id]: null }))} className="text-muted-foreground hover:text-rose-500">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <Button type="button" variant="outline" size="sm" onClick={() => replyFileInputRefs.current[q.id]?.click()} className="h-8 text-[10.5px]">
                            <Paperclip className="w-3 h-3 mr-1" /> Attach File
                          </Button>
                        )}
                      </div>

                      {/* ── Status & note controls ── */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/50 pt-3">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Update Status</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {(['open', 'in_progress', 'resolved', 'closed'] as const).map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setStatusInputs(p => ({ ...p, [q.id]: s }))}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${curStatus === s ? (STATUS_STYLE[s] ?? 'bg-muted border-border') : 'border-border text-muted-foreground hover:border-foreground/30'}`}
                              >
                                {STATUS_LABEL[s]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Admin Note (internal)</Label>
                          <Input
                            value={curNote}
                            onChange={e => setNoteInputs(p => ({ ...p, [q.id]: e.target.value }))}
                            placeholder="Internal note (not shown to user)…"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: q.id, status: curStatus, admin_note: curNote })}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                          Save Status
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setOpenId(null)} className="h-8 text-xs">
                          <XCircle className="w-3 h-3 mr-1" />Close
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
