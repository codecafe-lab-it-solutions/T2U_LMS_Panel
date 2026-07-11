import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, CheckCircle2, Shield, Bell, Globe, Database, DollarSign, CreditCard, Upload, Loader2, X, Plus, Trash2, Percent, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getStoredToken, getMediaUrl } from '../../services/api';

// ── Payment method types ──────────────────────────────────────────────────────
interface PaymentMethod {
  id: string;
  type: 'upi' | 'bank';
  label: string;
  // UPI fields
  upi_id?: string;
  qr_url?: string;
  // Bank fields
  bank_name?: string;
  account_holder?: string;
  account_no?: string;
  ifsc?: string;
  branch?: string;
}

function makeId() { return Math.random().toString(36).slice(2, 10); }

function emptyMethod(type: 'upi' | 'bank'): PaymentMethod {
  return { id: makeId(), type, label: type === 'upi' ? 'UPI Payment' : 'Bank Transfer', upi_id: '', qr_url: '', bank_name: '', account_holder: '', account_no: '', ifsc: '', branch: '' };
}

interface GSTCategory {
  id: string;
  name: string;
  description?: string;
  gst_rate: number;
  hsn_sac_code?: string;
  is_active: boolean;
}

function emptyGSTCat(): Omit<GSTCategory, 'id' | 'is_active'> {
  return { name: '', description: '', gst_rate: 18, hsn_sac_code: '' };
}

export default function AdminSettings() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [bvPercent, setBvPercent] = useState('60');
  const [bvSaved, setBvSaved] = useState(false);
  const [bvError, setBvError] = useState('');

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [qrUploading, setQrUploading] = useState<Record<string, boolean>>({});
  const qrFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [tdsRate, setTdsRate] = useState('10');
  const [adminRate, setAdminRate] = useState('2');
  const [chargesSaved, setChargesSaved] = useState(false);
  const [chargesError, setChargesError] = useState('');

  // GST category state
  const [gstCatForm, setGstCatForm] = useState<Omit<GSTCategory, 'id' | 'is_active'>>(emptyGSTCat());
  const [gstCatEditId, setGstCatEditId] = useState<string | null>(null);
  const [gstCatError, setGstCatError] = useState('');
  const [showGstCatForm, setShowGstCatForm] = useState(false);

  const [form, setForm] = useState({
    platformName: 'T2Upgrade',
    platformUrl: 'https://t2upgrade.com',
    supportEmail: 'support@t2upgrade.com',
    minWithdrawal: '500',
    maxWithdrawal: '50000',
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
    if (settingsData?.map?.bv_percent) setBvPercent(settingsData.map.bv_percent);
    if (settingsData?.map?.payment_methods) {
      try { setPaymentMethods(JSON.parse(settingsData.map.payment_methods)); } catch { /* ignore */ }
    } else if (settingsData?.map?.upi_id) {
      // Migrate legacy single UPI entry
      setPaymentMethods([{ id: makeId(), type: 'upi', label: 'UPI Payment', upi_id: settingsData.map.upi_id, qr_url: settingsData.map.upi_qr_url ?? '' }]);
    }
    if (settingsData?.map?.withdrawal_tds_rate)   setTdsRate(settingsData.map.withdrawal_tds_rate);
    if (settingsData?.map?.withdrawal_admin_rate)  setAdminRate(settingsData.map.withdrawal_admin_rate);
  }, [settingsData]);

  const updateBvMutation = useMutation({
    mutationFn: (value: string) => api.platformSettings.updateKey('bv_percent', value),
    onSuccess: () => { setBvSaved(true); setBvError(''); setTimeout(() => setBvSaved(false), 2500); },
    onError: (err: any) => setBvError(err.message || 'Failed to save'),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: () => api.platformSettings.updateKey('payment_methods', JSON.stringify(paymentMethods)),
    onSuccess: () => { setPaymentSaved(true); setPaymentError(''); setTimeout(() => setPaymentSaved(false), 2500); },
    onError: (err: any) => setPaymentError(err.message || 'Failed to save'),
  });

  const updateChargesMutation = useMutation({
    mutationFn: () => Promise.all([
      api.platformSettings.updateKey('withdrawal_tds_rate', tdsRate),
      api.platformSettings.updateKey('withdrawal_admin_rate', adminRate),
    ]),
    onSuccess: () => { setChargesSaved(true); setChargesError(''); setTimeout(() => setChargesSaved(false), 2500); },
    onError: (err: any) => setChargesError(err.message || 'Failed to save'),
  });

  const { data: gstCategories = [] } = useQuery<GSTCategory[]>({
    queryKey: ['gst-categories'],
    queryFn: () => api.gstCategories.list(),
    enabled: !!getStoredToken(),
  });

  const gstCatSaveMutation = useMutation({
    mutationFn: () => gstCatEditId
      ? api.gstCategories.update(gstCatEditId, gstCatForm)
      : api.gstCategories.create(gstCatForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gst-categories'] });
      setGstCatForm(emptyGSTCat());
      setGstCatEditId(null);
      setShowGstCatForm(false);
      setGstCatError('');
    },
    onError: (e: any) => setGstCatError(e.message || 'Failed to save'),
  });

  const gstCatToggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.gstCategories.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gst-categories'] }),
  });

  function updateMethod(id: string, patch: Partial<PaymentMethod>) {
    setPaymentMethods(ms => ms.map(m => m.id === id ? { ...m, ...patch } : m));
  }
  function removeMethod(id: string) {
    setPaymentMethods(ms => ms.filter(m => m.id !== id));
  }

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>, methodId: string) {
    const f = e.target.files?.[0];
    if (!f) return;
    setQrUploading(u => ({ ...u, [methodId]: true }));
    setPaymentError('');
    try {
      const res = await api.upload.file(f);
      updateMethod(methodId, { qr_url: res.url });
    } catch (err: any) {
      setPaymentError('QR upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setQrUploading(u => ({ ...u, [methodId]: false }));
      const ref = qrFileRefs.current[methodId];
      if (ref) ref.value = '';
    }
  }

  const handleSave = () => {
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

      {/* Withdrawal Charges */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-rose-500" />
            Withdrawal Charge Rates
          </CardTitle>
          <CardDescription className="text-xs">
            Applied to every withdrawal request. TDS (Sec. 194H) is remitted to Income Tax dept; platform fee is retained by T2U.
            GST is NOT charged on withdrawals — it applies only to product/course purchases.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">TDS Rate (%) — Sec. 194H</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={tdsRate}
                onChange={e => setTdsRate(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 10"
              />
              <p className="text-[9px] text-muted-foreground">Deducted from gross. Remitted to Income Tax dept.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Platform Fee (%)</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={adminRate}
                onChange={e => setAdminRate(e.target.value)}
                className="h-9 text-xs bg-muted/20 font-mono"
                placeholder="e.g. 2"
              />
              <p className="text-[9px] text-muted-foreground">Platform processing fee retained by T2U.</p>
            </div>
          </div>

          {/* Live preview */}
          {(() => {
            const gross = 10000;
            const tds   = parseFloat(((gross * parseFloat(tdsRate || '0')) / 100).toFixed(2));
            const adm   = parseFloat(((gross * parseFloat(adminRate || '0')) / 100).toFixed(2));
            const net   = gross - tds - adm;
            return (
              <div className="p-3 bg-muted/20 rounded-xl border border-border/50 text-[11px] space-y-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1.5">Preview — ₹10,000 withdrawal</p>
                <div className="flex justify-between text-muted-foreground"><span>Gross</span><span className="font-mono font-bold text-foreground">₹10,000.00</span></div>
                <div className="flex justify-between text-muted-foreground"><span>TDS ({tdsRate}%)</span><span className="font-mono text-red-500">−₹{tds.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Platform fee ({adminRate}%)</span><span className="font-mono text-orange-500">−₹{adm.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-border/50 pt-1 font-bold"><span className="text-foreground">Net to user</span><span className="font-mono text-emerald-500">₹{net.toFixed(2)}</span></div>
              </div>
            );
          })()}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={updateChargesMutation.isPending}
              onClick={() => {
                const t = parseFloat(tdsRate), a = parseFloat(adminRate);
                if (isNaN(t) || isNaN(a)) { setChargesError('All rates must be valid numbers.'); return; }
                if (t < 0 || t > 100 || a < 0 || a > 100) { setChargesError('Rates must be between 0 and 100.'); return; }
                setChargesError('');
                updateChargesMutation.mutate();
              }}
              className="h-9 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold px-4"
            >
              <Save className="w-3.5 h-3.5 mr-1" />Save Charge Rates
            </Button>
            {chargesSaved && <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Saved!</p>}
            {chargesError && <p className="text-xs text-red-500 font-semibold">{chargesError}</p>}
          </div>
        </CardContent>
      </Card>

      {/* GST Category Management */}
      <Card className="border border-emerald-500/20 bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-500" />
                GST Category Configuration
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Government-prescribed GST slabs for product categories. GST is applied on purchases only — not on withdrawals.
                Assign a category to each product so the correct GST rate is used when generating invoices.
              </CardDescription>
            </div>
            <Button type="button" size="sm"
              onClick={() => { setGstCatEditId(null); setGstCatForm(emptyGSTCat()); setShowGstCatForm(v => !v); setGstCatError(''); }}
              className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              <Plus className="w-3 h-3 mr-0.5" /> Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">

          {/* Add / Edit form */}
          {showGstCatForm && (
            <div className="border border-emerald-500/25 bg-emerald-500/5 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-black text-emerald-600 uppercase">{gstCatEditId ? 'Edit Category' : 'New GST Category'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Category Name</Label>
                  <input
                    value={gstCatForm.name}
                    onChange={e => setGstCatForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Sports Goods"
                    className="w-full h-8 text-xs border border-border rounded-lg bg-background px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">GST Rate (%)</Label>
                  <select
                    value={gstCatForm.gst_rate}
                    onChange={e => setGstCatForm(f => ({ ...f, gst_rate: Number(e.target.value) }))}
                    className="w-full h-8 text-xs border border-border rounded-lg bg-background px-3 text-foreground focus:outline-none"
                  >
                    <option value={0}>0% — Exempt</option>
                    <option value={5}>5% — Essential Goods</option>
                    <option value={12}>12% — Standard Goods</option>
                    <option value={18}>18% — Services & General Goods</option>
                    <option value={28}>28% — Luxury Goods</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">HSN / SAC Code</Label>
                  <input
                    value={gstCatForm.hsn_sac_code ?? ''}
                    onChange={e => setGstCatForm(f => ({ ...f, hsn_sac_code: e.target.value }))}
                    placeholder="e.g. HSN 9506"
                    className="w-full h-8 text-xs border border-border rounded-lg bg-background px-3 text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description</Label>
                  <input
                    value={gstCatForm.description ?? ''}
                    onChange={e => setGstCatForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of goods/services covered"
                    className="w-full h-8 text-xs border border-border rounded-lg bg-background px-3 text-foreground focus:outline-none"
                  />
                </div>
              </div>
              {gstCatError && <p className="text-xs text-red-500 font-semibold">{gstCatError}</p>}
              <div className="flex gap-2">
                <Button type="button" size="sm" disabled={gstCatSaveMutation.isPending}
                  onClick={() => {
                    if (!gstCatForm.name.trim()) { setGstCatError('Category name is required.'); return; }
                    setGstCatError('');
                    gstCatSaveMutation.mutate();
                  }}
                  className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-3">
                  {gstCatSaveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                  {gstCatEditId ? 'Update' : 'Save Category'}
                </Button>
                <Button type="button" size="sm" variant="ghost"
                  onClick={() => { setShowGstCatForm(false); setGstCatEditId(null); setGstCatForm(emptyGSTCat()); }}
                  className="h-7 text-[11px]">
                  <X className="w-3 h-3 mr-1" />Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Category list */}
          {gstCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No GST categories yet. Loading defaults on first request…</p>
          ) : (
            <div className="space-y-2">
              {gstCategories.map((cat) => (
                <div key={cat.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-opacity ${cat.is_active ? 'border-border/50 bg-muted/10' : 'border-border/30 bg-muted/5 opacity-60'}`}>
                  <div className={`shrink-0 mt-0.5 w-12 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border ${Number(cat.gst_rate) === 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : Number(cat.gst_rate) <= 5 ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : Number(cat.gst_rate) <= 12 ? 'bg-violet-500/10 border-violet-500/30 text-violet-600' : Number(cat.gst_rate) <= 18 ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-red-500/10 border-red-500/30 text-red-600'}`}>
                    {Number(cat.gst_rate)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{cat.name}</p>
                    {cat.description && <p className="text-[10px] text-muted-foreground">{cat.description}</p>}
                    {cat.hsn_sac_code && <p className="text-[9px] font-mono text-muted-foreground/70">{cat.hsn_sac_code}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" title="Edit"
                      onClick={() => {
                        setGstCatEditId(cat.id);
                        setGstCatForm({ name: cat.name, description: cat.description ?? '', gst_rate: Number(cat.gst_rate), hsn_sac_code: cat.hsn_sac_code ?? '' });
                        setShowGstCatForm(true);
                        setGstCatError('');
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button type="button" title={cat.is_active ? 'Deactivate' : 'Activate'}
                      onClick={() => gstCatToggleMutation.mutate({ id: cat.id, is_active: !cat.is_active })}
                      className={`p-1.5 rounded-lg transition-colors ${cat.is_active ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10'}`}>
                      <CheckCircle2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[10px] text-amber-600">
            <strong>Note:</strong> GST is only applied on purchases (products/courses). Withdrawals are subject to TDS (Sec. 194H) and platform fee only — no GST.
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card className="border border-violet-500/20 bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-500" />
                Payment Settings
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                UPI and bank accounts shown to students during enrollment payment. Add as many as needed.
              </CardDescription>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button type="button" size="sm" onClick={() => setPaymentMethods(ms => [...ms, emptyMethod('upi')])}
                className="h-7 text-[11px] px-2 bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="w-3 h-3 mr-0.5" /> UPI
              </Button>
              <Button type="button" size="sm" onClick={() => setPaymentMethods(ms => [...ms, emptyMethod('bank')])}
                className="h-7 text-[11px] px-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-3 h-3 mr-0.5" /> Bank
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {paymentMethods.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No payment methods added yet. Click + UPI or + Bank to add one.</p>
          )}

          {paymentMethods.map((m, idx) => (
            <div key={m.id} className={`rounded-xl border p-4 space-y-3 ${m.type === 'upi' ? 'border-violet-500/25 bg-violet-500/5' : 'border-blue-500/25 bg-blue-500/5'}`}>
              {/* Header row */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${m.type === 'upi' ? 'bg-violet-500/20 text-violet-600' : 'bg-blue-500/20 text-blue-600'}`}>
                  {m.type === 'upi' ? 'UPI' : 'Bank Transfer'} #{idx + 1}
                </span>
                <Input
                  value={m.label}
                  onChange={e => updateMethod(m.id, { label: e.target.value })}
                  placeholder="Label (e.g. T2Upgrade UPI)"
                  className="h-7 text-xs flex-1 bg-background"
                />
                <button type="button" title="Remove payment method" onClick={() => removeMethod(m.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* UPI fields */}
              {m.type === 'upi' && (
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">UPI ID</Label>
                    <Input value={m.upi_id ?? ''} onChange={e => updateMethod(m.id, { upi_id: e.target.value })}
                      placeholder="e.g. t2upgrade@upi" className="h-8 text-xs bg-background font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">QR Code Image</Label>
                    <input ref={el => { qrFileRefs.current[m.id] = el; }} type="file" accept="image/*"
                      title="Upload QR code image" className="hidden"
                      onChange={e => handleQrUpload(e, m.id)} />
                    <div className="flex gap-2">
                      <Input value={m.qr_url ?? ''} onChange={e => updateMethod(m.id, { qr_url: e.target.value })}
                        placeholder="Paste URL or upload →" className="h-8 text-xs bg-background flex-1" />
                      <Button type="button" disabled={!!qrUploading[m.id]}
                        onClick={() => qrFileRefs.current[m.id]?.click()}
                        className="h-8 px-2.5 text-xs bg-muted hover:bg-muted/80 text-foreground border border-border shrink-0">
                        {qrUploading[m.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                        {qrUploading[m.id] ? 'Uploading…' : 'Upload'}
                      </Button>
                    </div>
                    {m.qr_url && (
                      <div className="relative inline-block mt-1">
                        <img src={getMediaUrl(m.qr_url)} alt="QR" className="h-24 w-24 object-contain rounded-lg border border-border bg-white p-1" />
                        <button type="button" title="Remove QR" onClick={() => updateMethod(m.id, { qr_url: '' })}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bank fields */}
              {m.type === 'bank' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Bank Name</Label>
                    <Input value={m.bank_name ?? ''} onChange={e => updateMethod(m.id, { bank_name: e.target.value })}
                      placeholder="e.g. HDFC Bank" className="h-8 text-xs bg-background" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Account Holder Name</Label>
                    <Input value={m.account_holder ?? ''} onChange={e => updateMethod(m.id, { account_holder: e.target.value })}
                      placeholder="e.g. T2Upgrade Pvt Ltd" className="h-8 text-xs bg-background" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Account Number</Label>
                    <Input value={m.account_no ?? ''} onChange={e => updateMethod(m.id, { account_no: e.target.value })}
                      placeholder="e.g. 1234567890" className="h-8 text-xs bg-background font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">IFSC Code</Label>
                    <Input value={m.ifsc ?? ''} onChange={e => updateMethod(m.id, { ifsc: e.target.value.toUpperCase() })}
                      placeholder="e.g. HDFC0001234" className="h-8 text-xs bg-background font-mono uppercase" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase">Branch</Label>
                    <Input value={m.branch ?? ''} onChange={e => updateMethod(m.id, { branch: e.target.value })}
                      placeholder="e.g. Connaught Place, New Delhi" className="h-8 text-xs bg-background" />
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center gap-3 pt-1">
            <Button type="button" disabled={updatePaymentMutation.isPending} onClick={() => updatePaymentMutation.mutate()}
              className="h-9 text-xs bg-violet-600 text-white font-bold px-4 hover:bg-violet-700">
              <Save className="w-3.5 h-3.5 mr-1" /> Save Payment Settings
            </Button>
            {paymentSaved && <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Saved!</p>}
            {paymentError && <p className="text-xs text-red-500 font-semibold">{paymentError}</p>}
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
