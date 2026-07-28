import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import {
  Video, Plus, Edit2, Trash2, ArrowLeft, Save,
  CheckCircle2, XCircle, Loader2, Zap, RefreshCw, Eye, EyeOff, Film, ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaginationFooter } from '@/components/ui/pagination-footer';

const PAGE_LIMIT = 20;

interface ZoomAccount {
  id: string;
  label: string;
  account_id: string;
  client_id: string;
  client_secret: string;
  default_host: string | null;
  is_active: boolean;
  created_at: string;
  webhook_secret_configured?: boolean;
  _count?: { live_classes: number };
}

export default function AdminZoomAccounts() {
  const perm = useEmployeePermission('admin-zoom-accounts');
  const qc = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [page, setPage] = useState(1);

  // Form state
  const [label, setLabel] = useState('');
  const [accountId, setAccountId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [defaultHost, setDefaultHost] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [editingWebhookConfigured, setEditingWebhookConfigured] = useState(false);

  // Test state per account
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const { data, isLoading } = useQuery<{ accounts: ZoomAccount[]; total: number }>({
    queryKey: ['zoom-accounts', page],
    queryFn: () => api.zoomAccounts.listPaged(page, PAGE_LIMIT),
  });
  const accounts = data?.accounts ?? [];
  const total = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: (data: any) => api.zoomAccounts.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['zoom-accounts'] }); closeForm(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.zoomAccounts.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['zoom-accounts'] }); closeForm(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.zoomAccounts.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zoom-accounts'] }),
  });
  const testMutation = useMutation({
    mutationFn: (id: string) => api.zoomAccounts.test(id),
    onSuccess: (res: any, id) => {
      setTestResults(prev => ({ ...prev, [id]: { ok: true, msg: res.message || 'Connection successful' } }));
    },
    onError: (err: any, id) => {
      setTestResults(prev => ({ ...prev, [id]: { ok: false, msg: err.message || 'Connection failed' } }));
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setLabel(''); setAccountId(''); setClientId(''); setClientSecret('');
    setDefaultHost(''); setIsActive(true); setShowSecret(false);
    setWebhookSecret(''); setShowWebhookSecret(false); setEditingWebhookConfigured(false);
  };
  const closeForm = () => { setIsFormOpen(false); resetForm(); };

  const handleEditClick = (acc: ZoomAccount) => {
    setEditingId(acc.id);
    setLabel(acc.label);
    setAccountId(acc.account_id);
    setClientId(acc.client_id);
    setClientSecret(acc.client_secret);
    setDefaultHost(acc.default_host || '');
    setIsActive(acc.is_active);
    setWebhookSecret('');
    setEditingWebhookConfigured(!!acc.webhook_secret_configured);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      label: label.trim(),
      account_id: accountId.trim(),
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      default_host: defaultHost.trim() || null,
      is_active: isActive,
    };
    // Leave the webhook secret untouched unless the admin actually typed a new one.
    if (webhookSecret.trim()) payload.webhook_secret = webhookSecret.trim();
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-foreground">Zoom Accounts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage Server-to-Server OAuth credentials for auto meeting creation</p>
        </div>
        {!isFormOpen && perm.create && (
          <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-primary text-white text-xs font-bold h-9 px-4 gap-1.5">
            <Plus className="w-4 h-4" /> Add Account
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
          {/* Header bar */}
          <div className="flex justify-between items-center bg-card border border-border px-5 py-3.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={closeForm} className="h-8 text-xs font-semibold">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
              <h2 className="text-sm font-extrabold text-foreground">{editingId ? 'Edit Zoom Account' : 'New Zoom Account'}</h2>
            </div>
            <Button type="submit" disabled={isSaving} className="h-8 bg-primary hover:bg-primary/90 text-white font-bold text-xs px-5 gap-1.5">
              <Save className="w-3.5 h-3.5" />{isSaving ? 'Saving…' : 'Save Account'}
            </Button>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
            <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold mb-0.5">Server-to-Server OAuth</p>
              <p className="text-blue-500/80">Create an app at <span className="font-mono">marketplace.zoom.us</span> → Server-to-Server OAuth. Copy the Account ID, Client ID, and Client Secret here. Scopes needed: <span className="font-mono">meeting:write:admin</span></p>
            </div>
          </div>

          <Card className="border border-border bg-card">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Label / Display Name *</Label>
                <Input required value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. T2U Main Zoom Account" className="h-9 text-xs border-border bg-background" />
                <p className="text-[9px] text-muted-foreground">Shown in the live class Zoom account dropdown</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Account ID *</Label>
                <Input required value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="xxxxxxxxxxxxxxxx" className="h-9 text-xs border-border bg-background font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Client ID *</Label>
                <Input required value={clientId} onChange={e => setClientId(e.target.value)} placeholder="abcABC123456789" className="h-9 text-xs border-border bg-background font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Client Secret *</Label>
                <div className="relative">
                  <Input
                    required
                    type={showSecret ? 'text' : 'password'}
                    value={clientSecret}
                    onChange={e => setClientSecret(e.target.value)}
                    placeholder="Client secret from Zoom app"
                    className="h-9 text-xs border-border bg-background font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(s => !s)}
                    title={showSecret ? 'Hide secret' : 'Show secret'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Default Host Email (optional)</Label>
                <Input value={defaultHost} onChange={e => setDefaultHost(e.target.value)} placeholder="host@yourdomain.com" type="email" className="h-9 text-xs border-border bg-background" />
                <p className="text-[9px] text-muted-foreground">Zoom user email to create meetings under. Leave blank to use the API key owner.</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-border/40">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Film className="w-3 h-3" /> Webhook Secret Token (for auto recording sync)
                  {editingWebhookConfigured && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                </Label>
                <div className="relative">
                  <Input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={webhookSecret}
                    onChange={e => setWebhookSecret(e.target.value)}
                    placeholder={editingWebhookConfigured ? 'Leave blank to keep current token' : 'Secret Token from Zoom Event Subscription'}
                    className="h-9 text-xs border-border bg-background font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(s => !s)}
                    title={showWebhookSecret ? 'Hide secret' : 'Show secret'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showWebhookSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  From Zoom Marketplace → this app → Feature → Event Subscriptions → add the "Recording Completed" event with endpoint
                  <span className="font-mono"> /api/zoom/webhooks</span> — Zoom shows a Secret Token there. Once set here, every class recorded to
                  the cloud is saved automatically and appears in students' Pre-recorded Videos.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                <input
                  type="checkbox"
                  id="zoom-active"
                  title="Active"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                />
                <Label htmlFor="zoom-active" className="text-xs text-foreground font-semibold cursor-pointer">Active (available in live class dropdown)</Label>
              </div>
            </CardContent>
          </Card>
        </form>
      ) : (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              Configured Zoom Accounts ({isLoading ? '…' : total})
            </CardTitle>
            <CardDescription className="text-xs">Add Server-to-Server OAuth accounts to auto-generate Zoom meeting links when scheduling live classes</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 flex items-center justify-center text-xs text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading accounts…
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Video className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-muted-foreground font-medium">No Zoom accounts configured</p>
                <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto">Add a Server-to-Server OAuth app from Zoom Marketplace to auto-create meeting links when scheduling live classes.</p>
                {perm.create && (
                  <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-primary text-white text-xs font-bold px-4">
                    Add First Account
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {accounts.map((acc) => {
                  const testResult = testResults[acc.id];
                  return (
                    <div key={acc.id} className="px-5 py-4 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                      {/* Status icon */}
                      <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${acc.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                        <Video className="w-3.5 h-3.5" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{acc.label}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${acc.is_active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-border/40'}`}>
                            {acc.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          {acc._count && (
                            <span className="text-[9px] text-muted-foreground">{acc._count.live_classes} classes</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground font-mono">
                          <span>Account: <span className="text-foreground">{acc.account_id.substring(0, 8)}…</span></span>
                          <span>Client: <span className="text-foreground">{acc.client_id.substring(0, 8)}…</span></span>
                          {acc.default_host && <span>Host: <span className="text-foreground">{acc.default_host}</span></span>}
                        </div>
                        {testResult && (
                          <div className={`flex items-center gap-1.5 text-[10px] font-semibold mt-1 ${testResult.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                            {testResult.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {testResult.msg}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {perm.edit && (
                          <Button
                            size="sm"
                            type="button"
                            disabled={testMutation.isPending}
                            onClick={() => testMutation.mutate(acc.id)}
                            className="h-7 text-[9px] px-2.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${testMutation.isPending && testMutation.variables === acc.id ? 'animate-spin' : ''}`} />
                            Test
                          </Button>
                        )}
                        {perm.edit && (
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => handleEditClick(acc)}
                            className="h-7 text-[9px] px-2.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        {perm.delete && (
                          <Button
                            size="sm"
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() => { if (confirm(`Delete "${acc.label}"? This cannot be undone.`)) deleteMutation.mutate(acc.id); }}
                            className="h-7 text-[9px] px-2.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          <PaginationFooter page={page} totalPages={Math.ceil(total / PAGE_LIMIT)} total={total} onPageChange={setPage} label="Zoom accounts" />
        </Card>
      )}

      {/* Usage guide */}
      <Card className="border border-border/40 bg-muted/20">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-bold text-foreground">How auto meeting creation works</p>
          <ol className="text-[10px] text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Add a Zoom Server-to-Server OAuth app here with valid credentials</li>
            <li>When scheduling a live class, select a Zoom account from the dropdown</li>
            <li>On save, the backend calls the Zoom API to create a meeting automatically</li>
            <li>Join URL, Start URL, Meeting ID, and Password are populated from the Zoom response</li>
            <li>If the Zoom API fails, the class is still saved and you can enter URLs manually</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
