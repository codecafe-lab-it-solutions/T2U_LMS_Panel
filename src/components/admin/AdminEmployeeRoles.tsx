import { Fragment, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  ShieldCheck, Plus, Edit2, Trash2, Loader2, AlertCircle, X, Check, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminNavItems } from '../../constants/adminNav';

const OPERATIONS = [
  { key: 'can_view', label: 'View' },
  { key: 'can_create', label: 'Create' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
  { key: 'can_approve', label: 'Approve' },
] as const;

interface PermRow {
  page_key: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  [key: string]: string | boolean;
}

function emptyMatrix(): Record<string, PermRow> {
  const m: Record<string, PermRow> = {};
  for (const item of adminNavItems) {
    m[item.id] = { page_key: item.id, can_view: false, can_create: false, can_edit: false, can_delete: false, can_approve: false };
  }
  return m;
}

// ── Permission matrix editor ────────────────────────────────────────────────
function PermissionMatrix({
  matrix, onChange,
}: {
  matrix: Record<string, PermRow>;
  onChange: (pageKey: string, op: string, value: boolean) => void;
}) {
  const sections = ['Overview', 'Platform', 'Content', 'CMS'];

  function toggleColumn(op: string) {
    const allChecked = adminNavItems.every(item => matrix[item.id]?.[op]);
    for (const item of adminNavItems) onChange(item.id, op, !allChecked);
  }

  function toggleRow(pageKey: string) {
    const row = matrix[pageKey];
    const allChecked = OPERATIONS.every(o => row?.[o.key]);
    for (const o of OPERATIONS) onChange(pageKey, o.key, !allChecked);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted/30 sticky top-0">
          <tr>
            <th className="text-left px-3 py-2 font-bold text-muted-foreground min-w-[220px]">Page</th>
            {OPERATIONS.map(op => (
              <th key={op.key} className="px-2 py-2 font-bold text-muted-foreground text-center">
                <button type="button" onClick={() => toggleColumn(op.key)} className="hover:text-primary transition-colors" title={`Toggle all ${op.label}`}>
                  {op.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {sections.map(section => (
            <Fragment key={section}>
              <tr className="bg-muted/10">
                <td colSpan={OPERATIONS.length + 1} className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {section}
                </td>
              </tr>
              {adminNavItems.filter(i => i.section === section).map(item => {
                const row = matrix[item.id];
                const Icon = item.icon;
                return (
                  <tr key={item.id} className="hover:bg-muted/10">
                    <td className="px-3 py-1.5">
                      <button type="button" onClick={() => toggleRow(item.id)} className="flex items-center gap-2 hover:text-primary transition-colors text-left">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-foreground">{item.label}</span>
                      </button>
                    </td>
                    {OPERATIONS.map(op => (
                      <td key={op.key} className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          title={`${op.label} — ${item.label}`}
                          checked={!!row?.[op.key]}
                          onChange={e => onChange(item.id, op.key, e.target.checked)}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Role editor (name/description + matrix) ─────────────────────────────────
function RoleEditor({
  roleId, onClose,
}: {
  roleId: string | null; // null = creating new
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!roleId;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [matrix, setMatrix] = useState<Record<string, PermRow>>(emptyMatrix());
  const [loaded, setLoaded] = useState(!isEdit);

  const { data: roleDetail } = useQuery({
    queryKey: ['employee-role-detail', roleId],
    queryFn: () => api.employeeRoles.get(roleId!),
    enabled: isEdit,
  });

  if (roleDetail && !loaded) {
    setName(roleDetail.name);
    setDescription(roleDetail.description || '');
    const m = emptyMatrix();
    for (const p of roleDetail.permissions || []) {
      if (m[p.page_key]) {
        m[p.page_key] = { page_key: p.page_key, can_view: p.can_view, can_create: p.can_create, can_edit: p.can_edit, can_delete: p.can_delete, can_approve: p.can_approve };
      }
    }
    setMatrix(m);
    setLoaded(true);
  }

  const createMut = useMutation({
    mutationFn: async () => {
      const role = await api.employeeRoles.create({ name: name.trim(), description: description.trim() || undefined });
      await api.employeeRoles.setPermissions(role.id, Object.values(matrix));
      return role;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee-roles'] }); onClose(); },
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      await api.employeeRoles.update(roleId!, { name: name.trim(), description: description.trim() || undefined });
      await api.employeeRoles.setPermissions(roleId!, Object.values(matrix));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee-roles'] }); onClose(); },
  });

  const saving = createMut.isPending || updateMut.isPending;
  const error = (createMut.error as any)?.message || (updateMut.error as any)?.message;

  function handleChange(pageKey: string, op: string, value: boolean) {
    setMatrix(prev => ({ ...prev, [pageKey]: { ...prev[pageKey], [op]: value } }));
  }

  function handleSave() {
    if (!name.trim()) return;
    if (isEdit) updateMut.mutate();
    else createMut.mutate();
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold">{isEdit ? 'Edit Role' : 'New Role'}</CardTitle>
          <CardDescription className="text-xs">Admin-defined — name it whatever fits (CRM, Payment Approval, KYC Verification…).</CardDescription>
        </div>
        <button type="button" title="Close" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Role Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Payment Approval" className="h-9 text-xs bg-muted/20" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" className="h-9 text-xs bg-muted/20" />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Page Permissions</p>
          <PermissionMatrix matrix={matrix} onChange={handleChange} />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </div>
        )}

        <div className="flex gap-2">
          <Button disabled={saving || !name.trim()} onClick={handleSave} className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-5">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
            {isEdit ? 'Save Changes' : 'Create Role'}
          </Button>
          <Button variant="outline" onClick={onClose} className="h-9 text-xs px-4">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminEmployeeRoles() {
  const qc = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: roles = [], isLoading } = useQuery<any[]>({
    queryKey: ['employee-roles'],
    queryFn: () => api.employeeRoles.list(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.employeeRoles.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee-roles'] }); setDeleteTarget(null); },
  });

  function openCreate() { setEditingRoleId(null); setEditorOpen(true); }
  function openEdit(id: string) { setEditingRoleId(id); setEditorOpen(true); }
  function closeEditor() { setEditorOpen(false); setEditingRoleId(null); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Roles & Permissions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dynamic staff roles — each grants View/Create/Edit/Delete/Approve on specific pages. An employee's effective access is the union of every role assigned to them.
          </p>
        </div>
        {!editorOpen && (
          <Button onClick={openCreate} className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-4">
            <Plus className="w-3.5 h-3.5 mr-1.5" />New Role
          </Button>
        )}
      </div>

      {editorOpen && <RoleEditor roleId={editingRoleId} onClose={closeEditor} />}

      {!editorOpen && (
        isLoading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />Loading roles…
          </div>
        ) : roles.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No roles yet. Create one to start delegating access.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {roles.map((role: any) => (
              <div key={role.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                role.is_active ? 'bg-card border-border hover:border-border/60' : 'bg-muted/20 border-border/40 opacity-60'
              }`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border bg-primary/10 border-primary/25">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-foreground">{role.name}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-500 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />{role._count?.permissions ?? 0} pages
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/25 text-violet-500 flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" />{role._count?.assignments ?? 0} employees
                    </span>
                    {!role.is_active && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-500">Disabled</span>
                    )}
                  </div>
                  {role.description && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{role.description}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button type="button" title="Edit" onClick={() => openEdit(role.id)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button type="button" title="Delete" onClick={() => setDeleteTarget({ id: role.id, name: role.name })} className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-foreground">Delete "{deleteTarget.name}"?</h2>
            <p className="text-sm text-muted-foreground">This unassigns the role from every employee who has it. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-9 text-xs">Cancel</Button>
              <Button
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(deleteTarget.id)}
                className="h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {deleteMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                Delete Role
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
