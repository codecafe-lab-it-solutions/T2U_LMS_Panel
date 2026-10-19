import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStoredToken, getMediaUrl } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import { Search, UserCheck, UserX, Plus, Pencil, X, UploadCloud, ShieldOff, RotateCcw, Calendar } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useFilterParams } from '../../hooks/useFilterParams';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PaginationFooter } from '@/components/ui/pagination-footer';

const BASE = import.meta.env.VITE_API_URL as string;
const PAGE_LIMIT = 20;

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400',
  instructor: 'bg-blue-500/20 text-blue-400',
  student: 'bg-slate-700 text-slate-300',
};

const KYC_COLORS: Record<string, string> = {
  verified: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-amber-500/20 text-amber-400',
  draft: 'bg-slate-700 text-slate-400',
  rejected: 'bg-red-500/20 text-red-400',
};

interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  referral_code: string;
  kyc_status: string;
  is_active: boolean;
  profile_photo_url: string | null;
  created_at: string;
  last_login_at: string | null;
  total_bv?: number;
  package?: { name: string } | null;
  course_upload_approved?: boolean;
}

const EMPTY_FORM = { full_name: '', email: '', phone: '', password: '', role: 'student', referred_by_code: '', position: 'auto' as 'auto' | 'left' | 'right' };

const DEFAULT_FILTERS = {
  search: '',
  role: '',
  status: '',
  from: '',
  to: '',
  specialization: '',
  verification_status: '',
  has_active_courses: '',
  page: 1,
};

export default function AdminUsers() {
  const authToken = getStoredToken();
  const perm = useEmployeePermission('admin-users');
  const qc = useQueryClient();

  const { params: filterParams, setFilterParams, resetFilterParams } = useFilterParams(DEFAULT_FILTERS);

  const [searchInput, setSearchInput] = useState(filterParams.search || '');
  const [roleFilter, setRoleFilter] = useState(filterParams.role || '');
  const [statusFilter, setStatusFilter] = useState(filterParams.status || '');
  const [fromDate, setFromDate] = useState(filterParams.from || '');
  const [toDate, setToDate] = useState(filterParams.to || '');
  const [specialization, setSpecialization] = useState(filterParams.specialization || '');
  const [verificationStatus, setVerificationStatus] = useState(filterParams.verification_status || '');
  const [hasActiveCourses, setHasActiveCourses] = useState(filterParams.has_active_courses || '');
  const [page, setPage] = useState(Number(filterParams.page) || 1);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Sync back to URL
  const updateFilters = (newValues: Partial<typeof DEFAULT_FILTERS>) => {
    setFilterParams((prev) => ({
      ...prev,
      ...newValues,
    }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setRoleFilter('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setSpecialization('');
    setVerificationStatus('');
    setHasActiveCourses('');
    setPage(1);
    resetFilterParams();
  };

  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', role: '', is_active: true, password: '' });
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

  const { data, isLoading } = useQuery<{ users: ApiUser[]; total: number }>({
    queryKey: ['admin-users', debouncedSearch, roleFilter, statusFilter, fromDate, toDate, specialization, verificationStatus, hasActiveCourses, page],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(PAGE_LIMIT), page: String(page) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (specialization) params.set('specialization', specialization);
      if (verificationStatus) params.set('verification_status', verificationStatus);
      if (hasActiveCourses) params.set('has_active_courses', hasActiveCourses);
      const res = await fetch(`${BASE}/users?${params}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: !!authToken,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (body: typeof EMPTY_FORM) => {
      const res = await fetch(`${BASE}/users`, { method: 'POST', headers, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create user');
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['mlm-tree'] });
      qc.invalidateQueries({ queryKey: ['mlm-bv-summary'] });
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      qc.invalidateQueries({ queryKey: ['admin-unplaced'] });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: typeof editForm }) => {
      const res = await fetch(`${BASE}/users/${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update user');
      return json;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setEditUser(null); setEditError(''); },
    onError: (e: Error) => setEditError(e.message),
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`${BASE}/users/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ is_active }) });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const courseApprovalMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const res = await fetch(`${BASE}/users/${id}/course-upload-approval`, { method: 'PATCH', headers, body: JSON.stringify({ approved }) });
      if (!res.ok) throw new Error('Failed to update course upload permission');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const openEdit = (u: ApiUser) => {
    setEditUser(u);
    setEditForm({ full_name: u.full_name, email: u.email, phone: u.phone || '', role: u.role, is_active: u.is_active, password: '' });
    setEditError('');
  };

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage all platform users — {data?.total ?? 0} total</p>
        </div>
        {perm.create && (
          <Button
            size="sm"
            className="h-8 text-[10px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground px-3"
            onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); setFormError(''); }}
          >
            <Plus className="w-3 h-3 mr-1" /> Add User
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 bg-muted/10 p-3 rounded-xl border border-border">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search name, email, phone, referral..."
            value={searchInput}
            onChange={e => {
              const val = e.target.value;
              setSearchInput(val);
              setPage(1);
              updateFilters({ search: val, page: 1 });
            }}
            className="pl-9 h-8 text-xs bg-muted/20"
          />
        </div>

        {/* Role Filter */}
        <select
          title="Filter by Role"
          className="bg-muted/20 border border-border rounded-lg text-foreground px-2.5 h-8 text-xs font-semibold"
          value={roleFilter}
          onChange={e => {
            const val = e.target.value;
            setRoleFilter(val);
            setPage(1);
            updateFilters({ role: val, page: 1 });
          }}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>

        {/* Status Filter */}
        <select
          title="Filter by Status"
          className="bg-muted/20 border border-border rounded-lg text-foreground px-2.5 h-8 text-xs font-semibold"
          value={statusFilter}
          onChange={e => {
            const val = e.target.value;
            setStatusFilter(val);
            setPage(1);
            updateFilters({ status: val, page: 1 });
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        {/* Date Joined Range */}
        <div className="flex items-center gap-1 bg-muted/20 border border-border rounded-lg px-2 h-8 text-xs">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="date"
            title="Joined From Date"
            value={fromDate}
            onChange={e => {
              const val = e.target.value;
              setFromDate(val);
              setPage(1);
              updateFilters({ from: val, page: 1 });
            }}
            className="bg-transparent text-[11px] text-foreground focus:outline-none"
          />
          <span className="text-muted-foreground text-[10px]">to</span>
          <input
            type="date"
            title="Joined To Date"
            value={toDate}
            onChange={e => {
              const val = e.target.value;
              setToDate(val);
              setPage(1);
              updateFilters({ to: val, page: 1 });
            }}
            className="bg-transparent text-[11px] text-foreground focus:outline-none"
          />
        </div>

        {/* Instructor Specific Filters */}
        {roleFilter === 'instructor' && (
          <>
            <Input
              placeholder="Specialization (e.g. AI, Web, Design)..."
              value={specialization}
              onChange={e => {
                const val = e.target.value;
                setSpecialization(val);
                setPage(1);
                updateFilters({ specialization: val, page: 1 });
              }}
              className="h-8 text-xs bg-muted/20 w-44"
            />

            <select
              title="Verification Status"
              className="bg-muted/20 border border-border rounded-lg text-foreground px-2.5 h-8 text-xs font-semibold"
              value={verificationStatus}
              onChange={e => {
                const val = e.target.value;
                setVerificationStatus(val);
                setPage(1);
                updateFilters({ verification_status: val, page: 1 });
              }}
            >
              <option value="">All Verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              title="Active Courses"
              className="bg-muted/20 border border-border rounded-lg text-foreground px-2.5 h-8 text-xs font-semibold"
              value={hasActiveCourses}
              onChange={e => {
                const val = e.target.value;
                setHasActiveCourses(val);
                setPage(1);
                updateFilters({ has_active_courses: val, page: 1 });
              }}
            >
              <option value="">All Courses Status</option>
              <option value="true">Has Active Courses</option>
              <option value="false">No Active Courses</option>
            </select>
          </>
        )}

        {/* Reset Filters */}
        {(searchInput || roleFilter || statusFilter || fromDate || toDate || specialization || verificationStatus || hasActiveCourses) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1 px-2.5"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-black text-foreground">Create New User</h2>
              <button type="button" title="Close" aria-label="Close" onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form
              className="p-5 space-y-3"
              onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }}
            >
              {formError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name *</Label>
                  <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="mt-1 h-8 text-xs" required />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1 h-8 text-xs" required />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone *</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 h-8 text-xs" required />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password *</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="mt-1 h-8 text-xs" required />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Role</Label>
                  <select title="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="mt-1 w-full h-8 bg-muted/20 border border-border rounded-md text-xs px-2">
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Referral Code (optional)</Label>
                  <Input value={form.referred_by_code} onChange={e => setForm(f => ({ ...f, referred_by_code: e.target.value }))} className="mt-1 h-8 text-xs" placeholder="Referrer's T2U code" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Placement Side</Label>
                  <select
                    title="Placement Side"
                    value={form.position}
                    onChange={e => setForm(f => ({ ...f, position: e.target.value as 'auto' | 'left' | 'right' }))}
                    className="mt-1 w-full h-8 bg-muted/20 border border-border rounded-md text-xs px-2"
                  >
                    <option value="auto">Auto (Balanced)</option>
                    <option value="left">Left Team</option>
                    <option value="right">Right Team</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={createMutation.isPending} size="sm" className="flex-1 h-8 text-xs font-bold bg-primary hover:bg-primary/90">
                  {createMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-sm font-black text-foreground">Edit User</h2>
                <p className="text-[10px] text-muted-foreground font-mono">{editUser.referral_code}</p>
              </div>
              <button type="button" title="Close" aria-label="Close" onClick={() => setEditUser(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form
              className="p-5 space-y-3"
              onSubmit={e => { e.preventDefault(); editMutation.mutate({ id: editUser.id, body: editForm }); }}
            >
              {editError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{editError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                  <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</Label>
                  <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</Label>
                  <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Role</Label>
                  <select title="Role" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="mt-1 w-full h-8 bg-muted/20 border border-border rounded-md text-xs px-2">
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</Label>
                  <select title="Status" value={editForm.is_active ? 'active' : 'suspended'} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.value === 'active' }))} className="mt-1 w-full h-8 bg-muted/20 border border-border rounded-md text-xs px-2">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New Password (leave blank to keep)</Label>
                  <Input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} className="mt-1 h-8 text-xs" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={editMutation.isPending} size="sm" className="flex-1 h-8 text-xs font-bold bg-primary hover:bg-primary/90">
                  {editMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditUser(null)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card className="border border-border bg-card">
        <CardContent className="pt-4 overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Loading users...</p>
          ) : users.length === 0 ? (
            <div className="text-center py-12 px-4">
              <UserX className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">No users found matching your filters</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Try adjusting your search criteria, role selection, status, or date range.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-4 text-xs font-semibold h-8"
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/40">
                  <th className="pb-3 font-bold">User</th>
                  <th className="pb-3 font-bold">Referral Code</th>
                  <th className="pb-3 font-bold">Role</th>
                  <th className="pb-3 font-bold">KYC</th>
                  <th className="pb-3 font-bold">Joined</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[11px] shrink-0 ring-1 ring-border">
                          {u.profile_photo_url
                            ? <img src={getMediaUrl(u.profile_photo_url)} alt={u.full_name} className="w-8 h-8 rounded-full object-cover" />
                            : u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{u.full_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{u.email}</p>
                          {u.phone && <p className="text-[9px] text-muted-foreground">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-[10px] text-muted-foreground">{u.referral_code}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${ROLE_COLORS[u.role] || 'bg-slate-700 text-slate-300'}`}>{u.role}</span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${KYC_COLORS[u.kyc_status?.toLowerCase()] || 'bg-slate-700 text-slate-400'}`}>{u.kyc_status || 'draft'}</span>
                    </td>
                    <td className="py-3 text-muted-foreground text-[10px] whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1.5">
                        {perm.edit && (
                          <Button
                            size="sm"
                            onClick={() => openEdit(u)}
                            className="h-7 text-[9px] font-bold px-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>
                        )}
                        {perm.edit && (
                          <Button
                            size="sm"
                            disabled={suspendMutation.isPending}
                            onClick={() => suspendMutation.mutate({ id: u.id, is_active: !u.is_active })}
                            className={`h-7 text-[9px] font-bold px-2 ${u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'}`}
                          >
                            {u.is_active ? <><UserX className="w-3 h-3 mr-1" />Suspend</> : <><UserCheck className="w-3 h-3 mr-1" />Restore</>}
                          </Button>
                        )}
                        {u.role === 'instructor' && perm.approve && (
                          <Button
                            size="sm"
                            disabled={courseApprovalMutation.isPending}
                            title={u.course_upload_approved ? 'Revoke course upload permission' : 'Approve course upload permission'}
                            onClick={() => courseApprovalMutation.mutate({ id: u.id, approved: !u.course_upload_approved })}
                            className={`h-7 text-[9px] font-bold px-2 ${u.course_upload_approved ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20' : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20'}`}
                          >
                            {u.course_upload_approved ? <><ShieldOff className="w-3 h-3 mr-1" />Revoke Upload</> : <><UploadCloud className="w-3 h-3 mr-1" />Approve Upload</>}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
        <PaginationFooter page={page} totalPages={Math.ceil((data?.total ?? 0) / PAGE_LIMIT)} total={data?.total ?? 0} onPageChange={setPage} label="users" />
      </Card>
    </div>
  );
}
