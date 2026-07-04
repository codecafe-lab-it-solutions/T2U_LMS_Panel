import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAppStore } from '../../store/useAppStore';
import { Sliders, Save, CheckCircle2, Shield, Bell, Globe, Database, DollarSign, CreditCard, Upload, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getStoredToken, getMediaUrl } from '../../services/api';

export default function AdminSettings() {
  const { referralCommissionRate, setReferralCommissionRate, matchingBonusRate, setMatchingBonusRate, dailyMatchingCap, setDailyMatchingCap } = useAppStore();
  const [saved, setSaved] = useState(false);
  const [bvPercent, setBvPercent] = useState('60');
  const [bvSaved, setBvSaved] = useState(false);
  const [bvError, setBvError] = useState('');

  const [upiId, setUpiId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [upiSaved, setUpiSaved] = useState(false);
  const [upiError, setUpiError] = useState('');
  const [qrUploading, setQrUploading] = useState(false);
  const qrFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    platformName: 'T2Upgrade',
    platformUrl: 'https://t2upgrade.com',
    supportEmail: 'support@t2upgrade.com',
    minWithdrawal: '500',
    maxWithdrawal: '50000',
    referralRate: String(referralCommissionRate),
    matchingRate: String(matchingBonusRate),
    dailyCap: String(dailyMatchingCap),
    maintenanceMode: false,
    emailNotifications: true,
    kycRequired: true,
  });

  const { data: settingsData } = useQuery<{ map: Record<string, string> }>({
    queryKey: ['platform-settings'],
    queryFn: () => api.platformSettings.get(),
    enabled: !!getStoredToken(),
  });

  useEffect(() => {
    if (settingsData?.map?.bv_percent) {
      setBvPercent(settingsData.map.bv_percent);
    }
    if (settingsData?.map?.upi_id !== undefined) setUpiId(settingsData.map.upi_id);
    if (settingsData?.map?.upi_qr_url !== undefined) setUpiQrUrl(settingsData.map.upi_qr_url);
  }, [settingsData]);

  const updateBvMutation = useMutation({
    mutationFn: (value: string) => api.platformSettings.updateKey('bv_percent', value),
    onSuccess: () => { setBvSaved(true); setBvError(''); setTimeout(() => setBvSaved(false), 2500); },
    onError: (err: any) => setBvError(err.message || 'Failed to save'),
  });

  const updateUpiMutation = useMutation({
    mutationFn: () => Promise.all([
      api.platformSettings.updateKey('upi_id', upiId),
      api.platformSettings.updateKey('upi_qr_url', upiQrUrl),
    ]),
    onSuccess: () => { setUpiSaved(true); setUpiError(''); setTimeout(() => setUpiSaved(false), 2500); },
    onError: (err: any) => setUpiError(err.message || 'Failed to save'),
  });

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setQrUploading(true);
    setUpiError('');
    try {
      const res = await api.upload.file(f);
      setUpiQrUrl(res.url);
    } catch (err: any) {
      setUpiError('QR upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setQrUploading(false);
      if (qrFileRef.current) qrFileRef.current.value = '';
    }
  }

  const handleSave = () => {
    const r = parseFloat(form.referralRate);
    const m = parseFloat(form.matchingRate);
    const d = parseFloat(form.dailyCap);
    if (!isNaN(r)) setReferralCommissionRate(r);
    if (!isNaN(m)) setMatchingBonusRate(m);
    if (!isNaN(d)) setDailyMatchingCap(d);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sections = [
    {
      title: 'Platform Identity',
      icon: Globe,
      color: 'text-blue-500',
      fields: [
        { key: 'platformName', label: 'Platform Name', type: 'text' },
        { key: 'platformUrl', label: 'Website URL', type: 'url' },
        { key: 'supportEmail', label: 'Support Email', type: 'email' },
      ],
    },
    {
      title: 'Withdrawal Limits',
      icon: Database,
      color: 'text-amber-500',
      fields: [
        { key: 'minWithdrawal', label: 'Minimum Withdrawal (₹)', type: 'number' },
        { key: 'maxWithdrawal', label: 'Maximum Withdrawal (₹)', type: 'number' },
      ],
    },
    {
      title: 'MLM Commission Rates',
      icon: Sliders,
      color: 'text-violet-500',
      fields: [
        { key: 'referralRate', label: 'DSI / Referral Rate (%)', type: 'number' },
        { key: 'matchingRate', label: 'Binary Matching Bonus (%)', type: 'number' },
        { key: 'dailyCap', label: 'Daily Matching Cap (₹)', type: 'number' },
      ],
    },
  ];

  const toggleFields = [
    { key: 'maintenanceMode', label: 'Maintenance Mode', description: 'Puts the platform into maintenance mode for all users', icon: Shield, color: 'text-red-500' },
    { key: 'emailNotifications', label: 'Email Notifications', description: 'Send transactional emails to users on key actions', icon: Bell, color: 'text-blue-500' },
    { key: 'kycRequired', label: 'KYC Required for Withdrawal', description: 'Block withdrawal requests from unverified users', icon: Shield, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Platform Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Configure platform-wide settings, commission rates, and operational parameters</p>
      </div>

      {sections.map(section => (
        <Card key={section.title} className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <section.icon className={`w-4 h-4 ${section.color}`} />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">{field.label}</Label>
                  <Input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="h-9 text-xs bg-muted/20"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Toggle Settings */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-500" />
            Feature Toggles
          </CardTitle>
          <CardDescription className="text-xs">Enable or disable platform features</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {toggleFields.map(toggle => (
            <div key={toggle.key} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/10">
              <div className="flex items-center gap-3">
                <toggle.icon className={`w-4 h-4 ${toggle.color} shrink-0`} />
                <div>
                  <p className="text-xs font-bold text-foreground">{toggle.label}</p>
                  <p className="text-[10px] text-muted-foreground">{toggle.description}</p>
                </div>
              </div>
              <button
                type="button"
                title={`Toggle ${toggle.label}`}
                onClick={() => setForm(f => ({ ...f, [toggle.key]: !(f as any)[toggle.key] }))}
                className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 transition-colors ${(form as any)[toggle.key] ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${(form as any)[toggle.key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Business Volume Setting */}
      <Card className="border border-amber-500/20 bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            Course Business Volume (BV)
          </CardTitle>
          <CardDescription className="text-xs">
            BV is auto-calculated as a percentage of the course price. Changes apply to all new price calculations.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex items-end gap-3 max-w-xs">
            <div className="flex-1 space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">BV Percentage (%)</Label>
              <Input
                type="number" min="1" max="100" step="1"
                value={bvPercent}
                onChange={e => setBvPercent(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
              />
            </div>
            <Button
              type="button"
              disabled={updateBvMutation.isPending}
              onClick={() => {
                const v = parseFloat(bvPercent);
                if (isNaN(v) || v < 1 || v > 100) { setBvError('Enter a value between 1 and 100.'); return; }
                updateBvMutation.mutate(String(v));
              }}
              className="h-9 text-xs bg-amber-500 text-white font-bold px-4 hover:bg-amber-600"
            >
              <Save className="w-3.5 h-3.5 mr-1" />Save BV
            </Button>
          </div>
          {bvSaved && <p className="mt-2 text-xs text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />BV percentage saved!</p>}
          {bvError && <p className="mt-2 text-xs text-red-500 font-semibold">{bvError}</p>}
          <p className="mt-3 text-[10px] text-muted-foreground">
            Example: if a course costs ₹5,000 and BV = {bvPercent}%, the BV credit = ₹{isNaN(parseFloat(bvPercent)) ? '—' : (5000 * parseFloat(bvPercent) / 100).toLocaleString('en-IN')}.
          </p>
        </CardContent>
      </Card>

      {/* UPI / Payment Settings */}
      <Card className="border border-violet-500/20 bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-violet-500" />
            Payment Settings (UPI)
          </CardTitle>
          <CardDescription className="text-xs">
            UPI ID and QR code shown to students during course enrollment payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold text-muted-foreground uppercase">UPI ID</Label>
            <Input
              type="text"
              placeholder="e.g. t2upgrade@upi"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              className="h-9 text-xs bg-muted/20 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold text-muted-foreground uppercase">UPI QR Code Image</Label>
            {/* Hidden file input */}
            <input
              ref={qrFileRef}
              type="file"
              accept="image/*"
              title="Upload QR code image"
              className="hidden"
              onChange={handleQrUpload}
            />
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://... (paste URL or upload below)"
                value={upiQrUrl}
                onChange={e => setUpiQrUrl(e.target.value)}
                className="h-9 text-xs bg-muted/20 flex-1"
              />
              <Button
                type="button"
                disabled={qrUploading}
                onClick={() => qrFileRef.current?.click()}
                className="h-9 px-3 text-xs bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold shrink-0"
              >
                {qrUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                {qrUploading ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
            {upiQrUrl && (
              <div className="relative inline-block mt-2">
                <img src={getMediaUrl(upiQrUrl)} alt="QR Preview" className="h-28 w-28 object-contain rounded-lg border border-border bg-white p-1" />
                <button
                  type="button"
                  title="Remove QR code"
                  onClick={() => setUpiQrUrl('')}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={updateUpiMutation.isPending}
              onClick={() => updateUpiMutation.mutate()}
              className="h-9 text-xs bg-violet-600 text-white font-bold px-4 hover:bg-violet-700"
            >
              <Save className="w-3.5 h-3.5 mr-1" />Save Payment Settings
            </Button>
            {upiSaved && <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Saved!</p>}
            {upiError && <p className="text-xs text-red-500 font-semibold">{upiError}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} className="bg-primary text-white text-xs font-bold h-9 px-6">
          <Save className="w-3.5 h-3.5 mr-1.5" />Save All Settings
        </Button>
        {saved && (
          <span className="text-xs text-emerald-500 flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />Settings saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}
