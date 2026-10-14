import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  Users, Plus, Search, Edit2, Loader2, AlertCircle, X, KeyRound,
  ToggleLeft, ToggleRight, ShieldCheck, Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationFooter } from '@/components/ui/pagination-footer';

const PAGE_LIMIT = 20;

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', password: '',
  designation: '', department: '', date_of_joining: '', role_ids: [] as string[],
};

// ── Create / Edit form ──────────────────────────────────────────────────────
function EmployeeForm({
  initial, roles, onSave, onCancel, saving,
}: {
  initial?: any;
  roles: any[];
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initial ? {
      full_name: initial.full_name ?? '',
      email: initial.email ?? '',
      phone: initial.phone ?? '',
      designation: initial.designation ?? '',
      department: initial.department ?? '',
      date_of_joining: initial.date_of_joining ? String(initial.date_of_joining).slice(0, 10) : '',
      role_ids: (initial.role_assignments || []).map((a: any) => a.role_id ?? a.role?.id),
    } : {}),
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  function toggleRole(roleId: string) {
    setForm(f => ({
      ...f,
      role_ids: f.role_ids.includes(roleId) ? f.role_ids.filter(id => id !== roleId) : [...f.role_ids, roleId],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      designation: form.designation.trim() || undefined,
      department: form.department.trim() || undefined,
      date_of_joining: form.date_of_joining || undefined,
      role_ids: form.role_ids,
    };
    if (!isEdit) payload.password = form.password;
    onSave(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name *</label>
          <Input required value={form.full_name} onChange={e => set('full_name', e.target.value)} className="h-9 text-xs bg-muted/20" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Email *</label>
          <Input required type="email" disabled={isEdit} value={form.email} onChange={e => set('email', e.target.value)} className="h-9 text-xs bg-muted/20 disabled:opacity-60" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone</label>
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} className="h-9 text-xs bg-muted/20" />
        </div>
        {!isEdit && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Password *</label>
            <Input required type="text" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" className="h-9 text-xs bg-muted/20 font-mono" />
          </div>
        )}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Designation</label>
          <Input value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Support Executive" className="h-9 text-xs bg-muted/20" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Department</label>
          <Input value={form.department} onChange={e => set('department', e.target.value)} className="h-9 text-xs bg-muted/20" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Date of Joining</label>
          <Input type="date" value={form.date_of_joining} onChange={e => set('date_of_joining', e.target.value)} className="h-9 text-xs bg-muted/20" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">Assign Roles</label>
        {roles.length === 0 ? (
          <p className="text-xs text-muted-foreground">No roles created yet — create one under Roles & Permissions first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <button
                key={role.id} type="button" onClick={() => toggleRole(role.id)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                  form.role_ids.includes(role.id)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-muted/20 text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />{role.name}
              </button>
            ))}
          </div>
        )}
        <p className="text-[9px] text-muted-foreground">Multiple roles can be assigned — access is the union of all of them.</p>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving} className="h-8 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-5">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          {isEdit ? 'Save Changes' : 'Create Employee'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-8 text-xs px-4">Cancel</Button>
      </div>
    </form>
  );
}

// ── Assign-roles inline widget ──────────────────────────────────────────────
function RoleAssignments({ employee, roles }: { employee: any; roles: any[] }) {
  const qc = useQueryClient();
  const assignedIds = new Set((employee.role_assignments || []).map((a: any) => a.role_id ?? a.role?.id));

  const assignMut = useMutation({
    mutationFn: (roleId: string) => api.employees.assignRole(employee.id, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-employees'] }),
  });
  const unassignMut = useMutation({
    mutationFn: (roleId: string) => api.employees.unassignRole(employee.id, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-employees'] }),
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map(role => {
        const active = assignedIds.has(role.id);
        const busy = assignMut.isPending || unassignMut.isPending;
        return (
          <button
            key={role.id} type="button" disabled={busy}
            onClick={() => active ? unassignMut.mutate(role.id) : assignMut.mutate(role.id)}
            className={`text-[9px] font-bold px-2 py-1 rounded-full border transition-colors ${
              active ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted/20 text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            {role.name}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminEmployees() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [syncingRoles, setSyncingRoles] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-employees', search, department, statusFilter, page],
    queryFn: () => api.employees.list({
      search: search || undefined,
      department: department || undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      page,
      limit: PAGE_LIMIT,
    }),
  });
  const employees = data?.employees ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);
  const { data: roles = [] } = useQuery<any[]>({
    queryKey: ['employee-roles'],
    queryFn: () => api.employeeRoles.list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-employees'] });

  const createMut = useMutation({
    mutationFn: (data: any) => api.employees.create(data),
    onSuccess: () => { invalidate(); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.employees.update(id, data),
  });
  const resetMut = useMutation({
    mutationFn: () => api.employees.resetPassword(resetTarget.id, resetPassword),
    onSuccess: () => { setResetTarget(null); setResetPassword(''); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.employees.delete(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
  });

  async function handleSave(data: any) {
    const { role_ids, ...profileFields } = data;
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, data: profileFields });

      // PATCH /employees/:id doesn't touch role assignments — reconcile via the
      // granular assign/unassign endpoints (same ones the inline role chips use).
      const currentIds = new Set<string>((editing.role_assignments || []).map((a: any) => a.role_id ?? a.role?.id));
      const nextIds = new Set<string>(role_ids as string[]);
      const toAssign = (role_ids as string[]).filter((id: string) => !currentIds.has(id));
      const toUnassign = [...currentIds].filter((id: string) => !nextIds.has(id));
      if (toAssign.length || toUnassign.length) {
        setSyncingRoles(true);
        try {
          await Promise.all([
            ...toAssign.map((id: string) => api.employees.assignRole(editing.id, id)),
            ...toUnassign.map((id: string) => api.employees.unassignRole(editing.id, id)),
          ]);
        } finally {
          setSyncingRoles(false);
        }
      }
      invalidate();
      setEditing(null);
    } else {
      createMut.mutate(data);
    }
  }

  function toggleActive(emp: any) {
    updateMut.mutate({ id: emp.id, data: { is_active: !emp.is_active } });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Employees
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Staff accounts, fully separate from students/instructors/admins — access is entirely role-driven.</p>
        </div>
        {!showForm && !editing && (
          <Button onClick={() => setShowForm(true)} className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-4">
            <Plus className="w-3.5 h-3.5 mr-1.5" />New Employee
          </Button>
        )}
      </div>

      {(showForm || editing) && (
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <EmployeeForm
              initial={editing ?? undefined}
              roles={roles}
              saving={createMut.isPending || updateMut.isPending || syncingRoles}
              onCancel={() => { setShowForm(false); setEditing(null); }}
              onSave={handleSave}
            />
          </CardContent>
        </Card>
      )}

      {(createMut.isError || updateMut.isError) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {(createMut.error as any)?.message || (updateMut.error as any)?.message}
        </div>
      )}
      {deleteMut.isError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {(deleteMut.error as any)?.message}
        </div>
      )}

      {!showForm && !editing && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, designation…" className="pl-9 h-9 text-xs bg-muted/20" />
            {search && (
              <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={department}
              onChange={e => { setDepartment(e.target.value); setPage(1); }}
              className="h-9 text-xs rounded-lg border border-border bg-muted/20 text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Departments</option>
              <option value="Executive">Executive</option>
              <option value="Customer Support">Customer Support</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
              <option value="Technology">Technology</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Marketing & Operations">Marketing & Operations</option>
            </select>

            <div className="flex items-center gap-1 p-0.5 bg-muted/30 rounded-lg border border-border">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded capitalize transition-colors ${
                    statusFilter === s ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {(search || department || statusFilter !== 'all') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setDepartment(''); setStatusFilter('all'); setPage(1); }}
                className="h-9 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      )}

      {!showForm && !editing && (
        isLoading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />Loading employees…
          </div>
        ) : employees.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <Users className="w-8 h-8 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No employees yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {employees.map((emp: any) => (
              <div key={emp.id} className={`p-3 rounded-xl border transition-all ${
                emp.is_active ? 'bg-card border-border hover:border-border/60' : 'bg-muted/20 border-border/40 opacity-60'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border bg-primary/10 border-primary/25 text-xs font-black text-primary">
                    {emp.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-foreground">{emp.full_name}</p>
                      <span className="text-[9px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/50">{emp.employee_code}</span>
                      {!emp.is_active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-500">Disabled</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{emp.email}{emp.designation ? ` · ${emp.designation}` : ''}{emp.department ? ` · ${emp.department}` : ''}</p>
                    <div className="mt-2">
                      <RoleAssignments employee={emp} roles={roles} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button type="button" title={emp.is_active ? 'Disable' : 'Enable'} onClick={() => toggleActive(emp)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                      {emp.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <button type="button" title="Reset password" onClick={() => setResetTarget(emp)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button type="button" title="Edit" onClick={() => setEditing(emp)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button type="button" title="Delete" onClick={() => setDeleteTarget(emp)} className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <Card className="border border-border bg-card empty:hidden">
              <PaginationFooter page={page} totalPages={totalPages} total={total} onPageChange={setPage} label="employees" />
            </Card>
          </div>
        )
      )}

      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Reset Password</h2>
              <button type="button" title="Close" onClick={() => { setResetTarget(null); setResetPassword(''); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Set a new password for <strong className="text-foreground">{resetTarget.full_name}</strong>. They'll be emailed the new credentials.</p>
            <Input type="text" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="New password (min 6 characters)" className="h-9 text-xs bg-muted/20 font-mono" />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setResetTarget(null); setResetPassword(''); }} className="h-9 text-xs">Cancel</Button>
              <Button disabled={resetMut.isPending || resetPassword.length < 6} onClick={() => resetMut.mutate()} className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold">
                {resetMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-foreground">Delete "{deleteTarget.full_name}"?</h2>
            <p className="text-sm text-muted-foreground">
              This deactivates the employee's account and removes it from this list. They will no longer be able to log in. This cannot be undone from here.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-9 text-xs">Cancel</Button>
              <Button
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(deleteTarget.id)}
                className="h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {deleteMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                Delete Employee
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
