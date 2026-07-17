import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiNotificationTemplate } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import { useAppStore } from '../../store/useAppStore';
import {
  Bell, Mail, MessageCircle, Loader2, CheckCircle2, ChevronDown, ChevronUp,
  Send, AlertCircle, Info, Settings2, ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Reusable on/off switch — used for per-channel Enabled/Disabled toggles and SMTP "Secure".
function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center gap-2 group"
    >
      <span className={`relative inline-block w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-emerald-500' : 'bg-muted-foreground/25'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
      {label && (
        <span className={`text-[10px] font-bold ${checked ? 'text-emerald-500' : 'text-muted-foreground'}`}>
          {label}
        </span>
      )}
    </button>
  );
}

// ── Provider credentials (SMTP + Meta WhatsApp) — fully admin-editable; server/.env is only
// a fallback used when no admin-panel value is configured for a given channel. ──────────────
function StatusBadge({ configured, envAvailable }: { configured: boolean; envAvailable: boolean }) {
  if (configured) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">Using Admin Panel Config</span>;
  }
  if (envAvailable) {
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500">Using .env Fallback</span>;
  }
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500">Not Configured — Stub Mode</span>;
}

function IntegrationSettingsCard() {
  const perm = useEmployeePermission('admin-notification-templates');
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    smtp_host: '', smtp_port: '', smtp_secure: false, smtp_user: '', smtp_pass: '', smtp_from: '',
    meta_whatsapp_token: '', meta_whatsapp_phone_number_id: '', meta_whatsapp_api_version: 'v21.0',
    support_whatsapp_number: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-integration-settings'],
    queryFn: () => api.integrationSettings.get(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!data || hydrated) return;
    setForm({
      smtp_host: data.smtp_host,
      smtp_port: data.smtp_port != null ? String(data.smtp_port) : '',
      smtp_secure: data.smtp_secure,
      smtp_user: data.smtp_user,
      smtp_pass: '', // secrets are never sent back from the server — leave blank to keep unchanged
      smtp_from: data.smtp_from,
      meta_whatsapp_token: '',
      meta_whatsapp_phone_number_id: data.meta_whatsapp_phone_number_id,
      meta_whatsapp_api_version: data.meta_whatsapp_api_version,
      support_whatsapp_number: data.support_whatsapp_number,
    });
    setHydrated(true);
  }, [data, hydrated]);

  const saveMutation = useMutation({
    mutationFn: () => api.integrationSettings.update({
      smtp_host: form.smtp_host,
      smtp_port: form.smtp_port ? parseInt(form.smtp_port, 10) : null,
      smtp_secure: form.smtp_secure,
      smtp_user: form.smtp_user,
      smtp_from: form.smtp_from,
      meta_whatsapp_phone_number_id: form.meta_whatsapp_phone_number_id,
      meta_whatsapp_api_version: form.meta_whatsapp_api_version,
      support_whatsapp_number: form.support_whatsapp_number,
      ...(form.smtp_pass ? { smtp_pass: form.smtp_pass } : {}),
      ...(form.meta_whatsapp_token ? { meta_whatsapp_token: form.meta_whatsapp_token } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-integration-settings'] });
      setForm(f => ({ ...f, smtp_pass: '', meta_whatsapp_token: '' }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => setIsOpen(o => !o)}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Email &amp; WhatsApp Provider Settings
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Configure SMTP and Meta WhatsApp Cloud API credentials here — fully dynamic, no server redeploy needed.
            </CardDescription>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
        </div>
        {data && (
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge configured={data.smtp_pass_configured} envAvailable={data.env_fallback_available.email} />
            <StatusBadge configured={data.meta_whatsapp_token_configured} envAvailable={data.env_fallback_available.whatsapp} />
          </div>
        )}
      </CardHeader>

      {isOpen && (
        <CardContent className="p-5 pt-0 space-y-5 border-t border-border/40">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {/* SMTP */}
              <div className="space-y-3 pt-4">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> SMTP (Email)
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Host</Label>
                    <Input value={form.smtp_host} onChange={e => setForm(f => ({ ...f, smtp_host: e.target.value }))} placeholder="smtp.hostinger.com" className="h-9 text-xs bg-muted/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Port</Label>
                      <Input value={form.smtp_port} onChange={e => setForm(f => ({ ...f, smtp_port: e.target.value }))} placeholder="465" type="number" className="h-9 text-xs bg-muted/20 font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Secure (TLS)</Label>
                      <div className="h-9 flex items-center">
                        <ToggleSwitch
                          checked={form.smtp_secure}
                          onChange={() => setForm(f => ({ ...f, smtp_secure: !f.smtp_secure }))}
                          label={form.smtp_secure ? 'On' : 'Off'}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Username</Label>
                    <Input value={form.smtp_user} onChange={e => setForm(f => ({ ...f, smtp_user: e.target.value }))} placeholder="support@yourdomain.com" className="h-9 text-xs bg-muted/20" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Password {data?.smtp_pass_configured && <ShieldCheck className="w-3 h-3 inline text-emerald-500 ml-1" />}
                    </Label>
                    <Input
                      type="password"
                      value={form.smtp_pass}
                      onChange={e => setForm(f => ({ ...f, smtp_pass: e.target.value }))}
                      placeholder={data?.smtp_pass_configured ? 'Leave blank to keep current password' : 'Enter password'}
                      className="h-9 text-xs bg-muted/20"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">"From" Header (Optional)</Label>
                    <Input value={form.smtp_from} onChange={e => setForm(f => ({ ...f, smtp_from: e.target.value }))} placeholder='Support <support@yourdomain.com>' className="h-9 text-xs bg-muted/20" />
                  </div>
                </div>
              </div>

              {/* Meta WhatsApp */}
              <div className="space-y-3 pt-4 border-t border-border/30">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> Meta WhatsApp Cloud API
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">
                      Access Token {data?.meta_whatsapp_token_configured && <ShieldCheck className="w-3 h-3 inline text-emerald-500 ml-1" />}
                    </Label>
                    <Input
                      type="password"
                      value={form.meta_whatsapp_token}
                      onChange={e => setForm(f => ({ ...f, meta_whatsapp_token: e.target.value }))}
                      placeholder={data?.meta_whatsapp_token_configured ? 'Leave blank to keep current token' : 'Meta permanent access token'}
                      className="h-9 text-xs bg-muted/20 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Phone Number ID</Label>
                    <Input value={form.meta_whatsapp_phone_number_id} onChange={e => setForm(f => ({ ...f, meta_whatsapp_phone_number_id: e.target.value }))} placeholder="1234567890" className="h-9 text-xs bg-muted/20 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">API Version</Label>
                    <Input value={form.meta_whatsapp_api_version} onChange={e => setForm(f => ({ ...f, meta_whatsapp_api_version: e.target.value }))} placeholder="v21.0" className="h-9 text-xs bg-muted/20 font-mono" />
                  </div>
                </div>
              </div>

              {/* Support WhatsApp number (click-to-chat, not the Meta API integration above) */}
              <div className="space-y-3 pt-4 border-t border-border/30">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> Support WhatsApp Number
                </Label>
                <p className="text-[10px] text-muted-foreground -mt-1">
                  The number students and buyers reach via the "Chat on WhatsApp" button on course and product checkout screens. Include country code, e.g. 919269488028.
                </p>
                <div className="max-w-xs space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">WhatsApp Number</Label>
                  <Input
                    value={form.support_whatsapp_number}
                    onChange={e => setForm(f => ({ ...f, support_whatsapp_number: e.target.value }))}
                    placeholder="919269488028"
                    className="h-9 text-xs bg-muted/20 font-mono"
                  />
                </div>
              </div>

              {perm.edit && (
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} className="h-9 text-xs bg-primary text-primary-foreground">
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                    Save Provider Settings
                  </Button>
                  {saved && (
                    <span className="text-[10.5px] text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved — takes effect on the next send
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

type EditState = {
  email_enabled: boolean;
  email_subject: string;
  email_body: string;
  whatsapp_enabled: boolean;
  whatsapp_template_name: string;
  whatsapp_language_code: string;
  whatsapp_param_order: string; // comma-separated in the UI, split/joined on save
  whatsapp_fallback_body: string;
};

function toEditState(t: ApiNotificationTemplate): EditState {
  return {
    email_enabled: t.email_enabled,
    email_subject: t.email_subject,
    email_body: t.email_body,
    whatsapp_enabled: t.whatsapp_enabled,
    whatsapp_template_name: t.whatsapp_template_name,
    whatsapp_language_code: t.whatsapp_language_code,
    whatsapp_param_order: (t.whatsapp_param_order || []).join(', '),
    whatsapp_fallback_body: t.whatsapp_fallback_body,
  };
}

export default function AdminNotificationTemplates() {
  const perm = useEmployeePermission('admin-notification-templates');
  const isEmployee = useAppStore(s => s.isEmployee);
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-notification-templates'],
    queryFn: () => api.notificationTemplates.list(),
    staleTime: 30_000,
  });

  // Hydrate local edit state whenever the server list (re)loads, without clobbering
  // in-progress edits on an unrelated re-render.
  useEffect(() => {
    setEdits(prev => {
      const next = { ...prev };
      for (const t of templates) {
        if (!next[t.event_type]) next[t.event_type] = toEditState(t);
      }
      return next;
    });
  }, [templates]);

  const saveMutation = useMutation({
    mutationFn: ({ eventType, data }: { eventType: string; data: Partial<ApiNotificationTemplate> }) =>
      api.notificationTemplates.update(eventType, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-notification-templates'] });
      setSavedId(vars.eventType);
      setTimeout(() => setSavedId(null), 2500);
    },
  });

  const testMutation = useMutation({
    mutationFn: (eventType: string) => api.notificationTemplates.test(eventType),
    onSuccess: (data, eventType) => {
      setTestResult(p => ({ ...p, [eventType]: data.message }));
      setTimeout(() => setTestResult(p => ({ ...p, [eventType]: '' })), 6000);
    },
    onError: (err: Error, eventType) => {
      setTestResult(p => ({ ...p, [eventType]: `Failed: ${err.message}` }));
    },
  });

  const handleSave = (eventType: string) => {
    const e = edits[eventType];
    if (!e) return;
    saveMutation.mutate({
      eventType,
      data: {
        email_enabled: e.email_enabled,
        email_subject: e.email_subject,
        email_body: e.email_body,
        whatsapp_enabled: e.whatsapp_enabled,
        whatsapp_template_name: e.whatsapp_template_name,
        whatsapp_language_code: e.whatsapp_language_code,
        whatsapp_param_order: e.whatsapp_param_order.split(',').map(s => s.trim()).filter(Boolean),
        whatsapp_fallback_body: e.whatsapp_fallback_body,
      },
    });
  };

  const updateEdit = (eventType: string, patch: Partial<EditState>) => {
    setEdits(p => ({ ...p, [eventType]: { ...p[eventType], ...patch } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Notification Templates</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure the email and WhatsApp content sent for each system event — registration, live session start,
          absentee alerts, and more. WhatsApp uses your Meta-approved template name when set; otherwise it falls
          back to the freeform text below (only works inside Meta's 24h customer-service window).
        </p>
      </div>

      <IntegrationSettingsCard />

      <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-2.5 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          Use <code className="font-mono text-foreground">{'{{variable_name}}'}</code> in email subject/body to insert dynamic
          values — the available variables for each event are listed on its card. For WhatsApp Meta templates, the
          <strong className="text-foreground"> Param Order</strong> field lists which variables fill the template's
          {' '}<code className="font-mono text-foreground">{'{{1}}'}</code>, <code className="font-mono text-foreground">{'{{2}}'}</code>… placeholders, in order.
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => {
            const isOpen = openId === t.event_type;
            const e = edits[t.event_type] ?? toEditState(t);
            const saving = saveMutation.isPending && saveMutation.variables?.eventType === t.event_type;
            const testing = testMutation.isPending && testMutation.variables === t.event_type;

            return (
              <Card key={t.event_type} className="border border-border bg-card">
                <CardHeader
                  className="pb-3 cursor-pointer select-none"
                  onClick={() => setOpenId(isOpen ? null : t.event_type)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        {t.label}
                      </CardTitle>
                      {t.description && <CardDescription className="text-xs mt-0.5">{t.description}</CardDescription>}
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>
                  {t.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {t.variables.map(v => (
                        <span key={v} className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/50">
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>

                {isOpen && (
                  <CardContent className="p-5 pt-0 space-y-5 border-t border-border/40">

                    {/* Email */}
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> Email
                        </Label>
                        <ToggleSwitch
                          checked={e.email_enabled}
                          onChange={() => updateEdit(t.event_type, { email_enabled: !e.email_enabled })}
                          label={e.email_enabled ? 'Enabled' : 'Disabled'}
                        />
                      </div>
                      <Input
                        value={e.email_subject}
                        onChange={ev => updateEdit(t.event_type, { email_subject: ev.target.value })}
                        placeholder="Email subject…"
                        className="h-9 text-xs bg-muted/20"
                      />
                      <textarea
                        rows={4}
                        value={e.email_body}
                        onChange={ev => updateEdit(t.event_type, { email_body: ev.target.value })}
                        placeholder="Email body…"
                        className="w-full text-xs bg-muted/20 border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans leading-relaxed resize-none"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-3 pt-1 border-t border-border/30 pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp (Meta)
                        </Label>
                        <ToggleSwitch
                          checked={e.whatsapp_enabled}
                          onChange={() => updateEdit(t.event_type, { whatsapp_enabled: !e.whatsapp_enabled })}
                          label={e.whatsapp_enabled ? 'Enabled' : 'Disabled'}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Meta Template Name</Label>
                          <Input
                            value={e.whatsapp_template_name}
                            onChange={ev => updateEdit(t.event_type, { whatsapp_template_name: ev.target.value })}
                            placeholder="e.g. registration_credentials_v1"
                            className="h-9 text-xs bg-muted/20 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Language Code</Label>
                          <Input
                            value={e.whatsapp_language_code}
                            onChange={ev => updateEdit(t.event_type, { whatsapp_language_code: ev.target.value })}
                            placeholder="en_US"
                            className="h-9 text-xs bg-muted/20 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">
                          Param Order (comma-separated, fills {'{{1}}'}, {'{{2}}'}… in order)
                        </Label>
                        <Input
                          value={e.whatsapp_param_order}
                          onChange={ev => updateEdit(t.event_type, { whatsapp_param_order: ev.target.value })}
                          placeholder={t.variables.join(', ')}
                          className="h-9 text-xs bg-muted/20 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Freeform Fallback (used when no template name is set)</Label>
                        <textarea
                          rows={3}
                          value={e.whatsapp_fallback_body}
                          onChange={ev => updateEdit(t.event_type, { whatsapp_fallback_body: ev.target.value })}
                          placeholder="Freeform WhatsApp text fallback…"
                          className="w-full text-xs bg-muted/20 border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans leading-relaxed resize-none"
                        />
                      </div>
                    </div>

                    {testResult[t.event_type] && (
                      <div className={`p-2.5 rounded-lg border text-[10.5px] flex items-start gap-1.5 ${testResult[t.event_type].startsWith('Failed') ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{testResult[t.event_type]}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {perm.edit && (
                        <Button
                          size="sm"
                          disabled={saving}
                          onClick={() => handleSave(t.event_type)}
                          className="h-9 text-xs bg-primary text-primary-foreground"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                          Save Template
                        </Button>
                      )}
                      {/* Test-send endpoint is admin-only server-side (requireAdmin, not permission-gated) — hide for employees entirely */}
                      {!isEmployee && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={testing}
                          onClick={() => testMutation.mutate(t.event_type)}
                          className="h-9 text-xs"
                        >
                          {testing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                          Send Test to Myself
                        </Button>
                      )}
                      {savedId === t.event_type && (
                        <span className="text-[10.5px] text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                        </span>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
