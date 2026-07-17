import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { User, Loader2, Check, AlertCircle, KeyRound, Briefcase, Building2, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Employee's own profile — name/phone/email/employee code + designation/department, plus
// a self-service change-password form. Always reachable regardless of role grants, same
// as My Payslips.
export default function EmployeeProfile() {
  const employeeProfile = useAppStore(s => s.employeeProfile);

  const [fullName, setFullName] = useState(employeeProfile?.full_name || '');
  const [phone, setPhone] = useState(employeeProfile?.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const updateProfileMut = useMutation({
    mutationFn: () => api.employeeAuth.updateProfile({ full_name: fullName.trim(), phone: phone.trim() || undefined }),
    onSuccess: (employee) => {
      useAppStore.setState({ employeeProfile: employee });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    },
  });

  const changePasswordMut = useMutation({
    mutationFn: () => api.employeeAuth.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPasswordError(''); setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 2500);
    },
    onError: (err: any) => setPasswordError(err.message || 'Failed to change password'),
  });

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) { setPasswordError('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    changePasswordMut.mutate();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          My Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your account details. Contact an admin to update your role or department.</p>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-9 text-xs bg-muted/20" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-9 text-xs bg-muted/20" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Hash className="w-2.5 h-2.5" />Email</label>
              <Input value={employeeProfile?.email || ''} disabled className="h-9 text-xs bg-muted/20 opacity-60" />
              <p className="text-[9px] text-muted-foreground">Contact an admin to change your email.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Hash className="w-2.5 h-2.5" />Employee ID</label>
              <Input value={employeeProfile?.employee_code || ''} disabled className="h-9 text-xs bg-muted/20 font-mono opacity-60" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Briefcase className="w-2.5 h-2.5" />Designation</label>
              <Input value={employeeProfile?.designation || '—'} disabled className="h-9 text-xs bg-muted/20 opacity-60" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Building2 className="w-2.5 h-2.5" />Department</label>
              <Input value={employeeProfile?.department || '—'} disabled className="h-9 text-xs bg-muted/20 opacity-60" />
            </div>
          </div>

          {updateProfileMut.isError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{(updateProfileMut.error as any).message}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              disabled={updateProfileMut.isPending || !fullName.trim()}
              onClick={() => updateProfileMut.mutate()}
              className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-5"
            >
              {updateProfileMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
              Save Changes
            </Button>
            {profileSaved && <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" />Saved</span>}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5"><KeyRound className="w-4 h-4" />Change Password</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Current Password</label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="h-9 text-xs bg-muted/20" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">New Password</label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="h-9 text-xs bg-muted/20" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Confirm New Password</label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-9 text-xs bg-muted/20" required />
              </div>
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{passwordError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={changePasswordMut.isPending} className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-5">
                {changePasswordMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5 mr-1.5" />}
                Update Password
              </Button>
              {passwordSuccess && <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" />Password updated</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
