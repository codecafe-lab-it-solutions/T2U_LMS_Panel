import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sliders, Save, CheckCircle2, Shield, Bell, Globe, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSettings() {
  const { referralCommissionRate, setReferralCommissionRate, matchingBonusRate, setMatchingBonusRate, dailyMatchingCap, setDailyMatchingCap } = useAppStore();
  const [saved, setSaved] = useState(false);

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
                onClick={() => setForm(f => ({ ...f, [toggle.key]: !(f as any)[toggle.key] }))}
                className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 transition-colors ${(form as any)[toggle.key] ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${(form as any)[toggle.key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
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
