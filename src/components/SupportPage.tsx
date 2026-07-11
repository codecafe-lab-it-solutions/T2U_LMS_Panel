import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import {
  HelpCircle, Loader2, CheckCircle2, MessageSquare, Send,
  Clock, AlertCircle, ChevronDown, ChevronUp, LifeBuoy,
  UserCircle2, ShieldCheck, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_STYLE: Record<string, string> = {
  open:        'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
  in_progress: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
  resolved:    'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  closed:      'bg-muted/40 border-border text-muted-foreground',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
};

export default function SupportPage() {
  const qc = useQueryClient();
  const { userProfile } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<'raise' | 'previous'>('raise');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch own support queries with their messages
  const { data: queries = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['my-support-queries'],
    queryFn: () => api.support.myQueries(),
    staleTime: 30_000,
  });

  // Submit new query mutation
  const submitMutation = useMutation({
    mutationFn: (data: { subject: string; message: string }) => api.support.submit(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-support-queries'] });
      setSubject('');
      setMessage('');
      setSuccessMsg('Your support query has been submitted successfully.');
      setTimeout(() => setSuccessMsg(null), 5000);
      setActiveSubTab('previous');
    },
  });

  // Reply to a ticket thread
  const replyMutation = useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) =>
      api.support.reply(ticketId, content),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['my-support-queries'] });
      setReplyText(p => ({ ...p, [vars.ticketId]: '' }));
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    submitMutation.mutate({ subject, message });
  };

  const handleReply = (ticketId: string) => {
    const content = replyText[ticketId]?.trim();
    if (!content) return;
    replyMutation.mutate({ ticketId, content });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-violet-500" /> Help & Support
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Submit support requests, track progress, and reply directly to admin responses.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 max-w-sm">
        <button
          type="button"
          onClick={() => setActiveSubTab('raise')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'raise' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Raise Query
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('previous')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'previous' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My Queries ({queries.length})
        </button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── RAISE QUERY TAB ── */}
      {activeSubTab === 'raise' ? (
        <Card className="border border-border bg-card shadow-sm max-w-2xl">
          <CardHeader className="pb-3 border-b border-border/45">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-violet-500" /> Need Help?
            </CardTitle>
            <CardDescription className="text-xs">Describe your concern and our team will respond shortly.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-[10px] font-bold text-muted-foreground uppercase">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Summarize your issue (e.g. KYC rejected, Payout query)..."
                  required
                  className="h-10 text-xs bg-muted/10 border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-[10px] font-bold text-muted-foreground uppercase">Detailed Message</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Provide full details about your issue here..."
                  required
                  rows={6}
                  className="w-full text-xs bg-muted/10 border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-sans leading-relaxed"
                />
              </div>
              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full sm:w-auto px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 text-xs shadow-md shadow-violet-500/10"
                >
                  {submitMutation.isPending ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5 mr-2" /> Submit Ticket</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      ) : (
        /* ── PREVIOUS QUERIES TAB ── */
        <div className="space-y-3 max-w-4xl">
          {/* Refresh button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : queries.length === 0 ? (
            <Card className="border border-border bg-card">
              <CardContent className="p-12 text-center text-muted-foreground space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-bold text-foreground">No queries submitted yet</p>
                <p className="text-xs">Your raised support tickets will show up here.</p>
              </CardContent>
            </Card>
          ) : (
            queries.map((q: any) => {
              const isOpen = openId === q.id;
              const messages: any[] = q.messages ?? [];
              const lastAdminMsg = [...messages].reverse().find(m => m.sender === 'admin');
              const hasUnreadAdminReply = !!lastAdminMsg;

              return (
                <Card key={q.id} className="border border-border bg-card transition-all">
                  <CardContent className="p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground text-sm truncate">{q.subject}</p>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            STATUS_STYLE[q.status] ?? 'bg-muted/40 border-border text-muted-foreground'
                          }`}>
                            {STATUS_LABEL[q.status] ?? q.status}
                          </span>
                          {hasUnreadAdminReply && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400">
                              Admin replied
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">
                          {new Date(q.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                          {' · '}{messages.length} message{messages.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        title={isOpen ? 'Hide Thread' : 'View Thread'}
                        onClick={() => setOpenId(isOpen ? null : q.id)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Thread view */}
                    {isOpen && (
                      <div className="border-t border-border/40 pt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">

                        {/* Message thread */}
                        <div className="space-y-2">
                          {/* Original message */}
                          <div className="flex gap-2.5">
                            <div className="shrink-0 mt-0.5">
                              <UserCircle2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 bg-muted/20 rounded-xl p-3 text-xs">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-bold text-foreground">{userProfile.name}</span>
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{q.message}</p>
                            </div>
                          </div>

                          {/* Thread messages */}
                          {messages.map((msg: any) => (
                            <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'admin' ? '' : 'flex-row-reverse'}`}>
                              <div className="shrink-0 mt-0.5">
                                {msg.sender === 'admin'
                                  ? <ShieldCheck className="w-5 h-5 text-violet-500" />
                                  : <UserCircle2 className="w-5 h-5 text-muted-foreground" />
                                }
                              </div>
                              <div className={`flex-1 rounded-xl p-3 text-xs ${
                                msg.sender === 'admin'
                                  ? 'bg-violet-500/8 border border-violet-500/20'
                                  : 'bg-muted/20'
                              }`}>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="font-bold text-foreground">
                                    {msg.sender === 'admin' ? 'Support Team' : userProfile.name}
                                  </span>
                                  {msg.sender === 'admin' && (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">Admin</span>
                                  )}
                                  <span className="text-[9px] text-muted-foreground font-mono">
                                    {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              </div>
                            </div>
                          ))}

                          {/* No messages yet */}
                          {messages.length === 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/10 border border-dashed border-border rounded-xl p-3 ml-7">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              Pending admin review. We will respond shortly.
                            </div>
                          )}
                        </div>

                        {/* Reply box — disabled if ticket is closed */}
                        {q.status !== 'closed' ? (
                          <div className="ml-7 space-y-2">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase">
                              <AlertCircle className="w-3 h-3" /> Your Reply
                            </div>
                            <textarea
                              rows={3}
                              value={replyText[q.id] ?? ''}
                              onChange={e => setReplyText(p => ({ ...p, [q.id]: e.target.value }))}
                              placeholder="Type your reply here..."
                              className="w-full text-xs bg-muted/10 border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-sans leading-relaxed resize-none"
                            />
                            <Button
                              size="sm"
                              disabled={!replyText[q.id]?.trim() || replyMutation.isPending}
                              onClick={() => handleReply(q.id)}
                              className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                            >
                              {replyMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <Send className="w-3 h-3 mr-1" />
                              )}
                              Send Reply
                            </Button>
                          </div>
                        ) : (
                          <div className="ml-7 text-[11px] text-muted-foreground italic border border-dashed border-border/60 rounded-xl p-3 text-center">
                            This ticket is closed. Please raise a new query if you need further assistance.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
