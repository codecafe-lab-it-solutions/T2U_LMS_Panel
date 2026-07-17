import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppStore } from '../../store/useAppStore';
import { api, getMediaUrl } from '../../services/api';
import { User, Loader2, Check, AlertCircle, KeyRound, Briefcase, Building2, Hash, Camera, Trash2 } from 'lucide-react';
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

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState('');

  const updateProfileMut = useMutation({
    mutationFn: () => api.employeeAuth.updateProfile({ full_name: fullName.trim(), phone: phone.trim() || undefined }),
    onSuccess: (employee) => {
      useAppStore.setState({ employeeProfile: employee });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    },
  });

  const uploadPhotoMut = useMutation({
    mutationFn: async (file: File) => {
      const { url } = await api.upload.file(file);
      return api.employeeAuth.updateProfile({ profile_photo_url: url });
    },
    onSuccess: (employee) => {
      useAppStore.setState({ employeeProfile: employee });
      setPhotoError('');
    },
    onError: (err: any) => setPhotoError(err.message || 'Failed to upload photo'),
  });

  const removePhotoMut = useMutation({
    mutationFn: () => api.employeeAuth.updateProfile({ profile_photo_url: null }),
    onSuccess: (employee) => {
      useAppStore.setState({ employeeProfile: employee });
      setPhotoError('');
    },
    onError: (err: any) => setPhotoError(err.message || 'Failed to remove photo'),
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setPhotoError('Please choose an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image must be under 5MB.'); return; }
    uploadPhotoMut.mutate(file);
  }

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
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-muted/40 border border-border flex items-center justify-center">
              {employeeProfile?.profile_photo_url ? (
                <img src={getMediaUrl(employeeProfile.profile_photo_url)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-muted-foreground" />
              )}
              {uploadPhotoMut.isPending && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <div className="flex items-center gap-2">
                <Button
                  type="button" variant="outline" size="sm"
                  disabled={uploadPhotoMut.isPending}
                  onClick={() => photoInputRef.current?.click()}
                  className="h-7 text-[11px] font-semibold px-2.5"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  {employeeProfile?.profile_photo_url ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {employeeProfile?.profile_photo_url && (
                  <Button
                    type="button" variant="outline" size="sm"
                    disabled={removePhotoMut.isPending}
                    onClick={() => removePhotoMut.mutate()}
                    className="h-7 text-[11px] font-semibold px-2.5 text-red-500 hover:text-red-600"
                  >
                    {removePhotoMut.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground">JPG, PNG, GIF or WebP. Max 5MB.</p>
              {photoError && <p className="text-[9px] text-red-500">{photoError}</p>}
            </div>
          </div>

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
