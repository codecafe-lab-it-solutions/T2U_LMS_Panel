import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck, CheckCircle2, XCircle, Clock, Copy, Save, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '../../services/api';

function Spinner() {
  return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
}

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-500/15 text-amber-600 border-amber-500/30',
  approved:  'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  rejected:  'bg-red-500/15 text-red-500 border-red-500/30',
  registered:'bg-blue-500/15 text-blue-600 border-blue-500/30',
  contacted: 'bg-violet-500/15 text-violet-600 border-violet-500/30',
};

export default function AdminInstructorApplications() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['cms-instructor-applications'],
    queryFn: api.cms.instructorApplications.list,
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [registeredCreds, setRegisteredCreds] = useState<{ email: string; temp_password: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; admin_note?: string } }) =>
      api.cms.instructorApplications.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-instructor-applications'] }),
  });

  const register = useMutation({
    mutationFn: (id: string) => api.cms.instructorApplications.register(id),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['cms-instructor-applications'] });
      if (res.temp_password) setRegisteredCreds({ email: res.email, temp_password: res.temp_password });
    },
  });

  const filtered = statusFilter === 'all'
    ? (data as any[])
    : (data as any[]).filter((a: any) => a.status === statusFilter);

  const counts: Record<string, number> = { all: data.length };
  for (const a of data as any[]) counts[a.status] = (counts[a.status] ?? 0) + 1;

  if (isLoading) return <Spinner />;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-foreground">Instructor Applications</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Submitted from the "Become an Instructor" form on the landing page.
        </p>
      </div>

      {/* Registered credentials banner */}
      {registeredCreds && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
          <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Instructor account created!
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Email: </span>
              <span className="font-mono font-bold">{registeredCreds.email}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Password: </span>
              <span className="font-mono font-bold">{registeredCreds.temp_password}</span>
              <button type="button" title="Copy password"
                onClick={() => navigator.clipboard.writeText(registeredCreds!.temp_password)}>
                <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Share these credentials with the instructor. They can change their password after logging in.</p>
          <button type="button" onClick={() => setRegisteredCreds(null)} className="text-[10px] text-muted-foreground underline">Dismiss</button>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'contacted', 'approved', 'rejected', 'registered'].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`h-7 px-3 rounded-full text-[10px] font-bold border transition-colors capitalize ${
              statusFilter === s
                ? 'bg-primary text-white border-primary'
                : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {s === 'all' ? 'All' : s} {counts[s] != null ? `(${counts[s]})` : ''}
          </button>
        ))}
      </div>

      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold">
            {statusFilter === 'all' ? 'All Applications' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Applications`}
            {' '}({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">No applications found.</p>
          )}

          {filtered.map((app: any) => (
            <div key={app.id} className="rounded-xl border border-border/50 overflow-hidden">
              {/* Header row — click to expand */}
              <button
                type="button"
                onClick={() => setExpanded(e => e === app.id ? null : app.id)}
                className="w-full flex items-center gap-3 p-3 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {app.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{app.full_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{app.email} · {app.phone}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide shrink-0 ${STATUS_COLOR[app.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                  {app.status}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(app.created_at).toLocaleDateString('en-IN')}
                </span>
              </button>

              {/* Expanded details */}
              {expanded === app.id && (
                <div className="p-4 border-t border-border/40 space-y-3 bg-card">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {app.location && <div><span className="text-muted-foreground">Location: </span><span className="font-medium">{app.location}</span></div>}
                    {app.experience && <div><span className="text-muted-foreground">Experience: </span><span className="font-medium">{app.experience}</span></div>}
                    {app.expertise && <div><span className="text-muted-foreground">Expertise: </span><span className="font-medium">{app.expertise}</span></div>}
                    {app.course_title && <div><span className="text-muted-foreground">Course: </span><span className="font-medium">{app.course_title}</span></div>}
                    {app.course_category && <div><span className="text-muted-foreground">Category: </span><span className="font-medium">{app.course_category}</span></div>}
                    {app.teaching_experience && <div><span className="text-muted-foreground">Teaching Exp: </span><span className="font-medium">{app.teaching_experience}</span></div>}
                  </div>
                  {app.course_description && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Course Description: </span>
                      <p className="mt-0.5 text-foreground/80">{app.course_description}</p>
                    </div>
                  )}

                  {/* Admin note */}
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Admin Note</Label>
                    <div className="flex gap-2">
                      <Input
                        defaultValue={app.admin_note ?? ''}
                        id={`note-${app.id}`}
                        placeholder="Internal note…"
                        className="h-7 text-xs bg-muted/20 flex-1"
                      />
                      <Button size="sm" type="button"
                        onClick={() => {
                          const el = document.getElementById(`note-${app.id}`) as HTMLInputElement;
                          update.mutate({ id: app.id, data: { admin_note: el.value } });
                        }}
                        className="h-7 px-2 text-xs bg-muted hover:bg-muted/80 text-foreground border border-border shrink-0">
                        <Save className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {app.status !== 'registered' && (
                      <Button size="sm" type="button" disabled={register.isPending}
                        onClick={() => register.mutate(app.id)}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                        <UserCheck className="w-3 h-3 mr-1" />
                        {register.isPending ? 'Creating…' : 'Register as Instructor'}
                      </Button>
                    )}
                    {app.status === 'pending' && (
                      <Button size="sm" type="button"
                        onClick={() => update.mutate({ id: app.id, data: { status: 'contacted' } })}
                        className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold">
                        <Clock className="w-3 h-3 mr-1" />Mark Contacted
                      </Button>
                    )}
                    {app.status !== 'approved' && app.status !== 'registered' && (
                      <Button size="sm" type="button"
                        onClick={() => update.mutate({ id: app.id, data: { status: 'approved' } })}
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                      </Button>
                    )}
                    {app.status !== 'rejected' && app.status !== 'registered' && (
                      <Button size="sm" type="button"
                        onClick={() => update.mutate({ id: app.id, data: { status: 'rejected' } })}
                        className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white font-bold">
                        <XCircle className="w-3 h-3 mr-1" />Reject
                      </Button>
                    )}
                  </div>

                  {app.status === 'registered' && app.registered_user_id && (
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Instructor account created.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
