import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400',
  instructor: 'bg-blue-500/20 text-blue-400',
  student: 'bg-slate-700 text-slate-300',
};

const KYC_COLORS: Record<string, string> = {
  Verified: 'bg-emerald-500/20 text-emerald-400',
  'Pending Verification': 'bg-amber-500/20 text-amber-400',
  Draft: 'bg-slate-700 text-slate-400',
  Rejected: 'bg-red-500/20 text-red-400',
};

export default function AdminUsers() {
  const { registeredUsers, networkNodes } = useAppStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [suspended, setSuspended] = useState<Set<string>>(new Set());

  const allUsers = [
    ...registeredUsers.map(u => ({
      id: u.username,
      name: u.name,
      email: u.email,
      role: u.role.toLowerCase().includes('admin') ? 'admin' : u.role.toLowerCase().includes('instructor') ? 'instructor' : 'student',
      kycStatus: 'Verified' as const,
      joinedAt: u.memberSince,
      avatar: u.avatar,
      package: u.role.toLowerCase().includes('student') ? 'T2U Starter Kit' : '—',
    })),
    ...(networkNodes ?? []).filter(n => !registeredUsers.find(u => u.email === n.email)).map(n => ({
      id: n.userId,
      name: n.name,
      email: n.email,
      role: 'student' as const,
      kycStatus: n.kycStatus,
      joinedAt: n.joinDate,
      avatar: n.avatar,
      package: 'T2U Starter Kit',
    })),
  ];

  const filtered = allUsers.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleSuspend = (id: string) => {
    setSuspended(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">User Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">View, search, and manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            placeholder="Search name, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-muted/20"
          />
        </div>
        <select
          className="bg-muted/20 border border-border rounded-lg text-foreground px-3 py-2 text-xs font-semibold"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="pt-4 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground text-xs font-semibold">{filtered.length} users found</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/40">
                <th className="pb-3 font-bold">User</th>
                <th className="pb-3 font-bold">Role</th>
                <th className="pb-3 font-bold">Package</th>
                <th className="pb-3 font-bold">KYC</th>
                <th className="pb-3 font-bold">Joined</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-border shrink-0" />
                      <div>
                        <p className="font-bold text-foreground">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${ROLE_COLORS[u.role] || 'bg-slate-700 text-slate-300'}`}>{u.role}</span>
                  </td>
                  <td className="py-3 text-muted-foreground text-[10px]">{u.package}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${KYC_COLORS[u.kycStatus] || 'bg-slate-700 text-slate-400'}`}>{u.kycStatus}</span>
                  </td>
                  <td className="py-3 text-muted-foreground text-[10px] whitespace-nowrap">{u.joinedAt}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${suspended.has(u.id) ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {suspended.has(u.id) ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      onClick={() => toggleSuspend(u.id)}
                      className={`h-7 text-[9px] font-bold px-2 ${suspended.has(u.id) ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border border-emerald-500/30' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'}`}
                    >
                      {suspended.has(u.id) ? <><UserCheck className="w-3 h-3 mr-1" />Restore</> : <><UserX className="w-3 h-3 mr-1" />Suspend</>}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
