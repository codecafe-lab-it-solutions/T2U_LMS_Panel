import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  Wallet, Plus, Loader2, AlertCircle, Check, Trash2, Award, FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationFooter } from '@/components/ui/pagination-footer';

const PAGE_LIMIT = 20;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/25' },
  finalized: { label: 'Finalized', cls: 'bg-blue-500/10 text-blue-500 border-blue-500/25' },
  paid: { label: 'Paid', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' },
};

function money(n: any) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }

// ── Salary structure tab ─────────────────────────────────────────────────────
function SalaryStructureTab({ employees }: { employees: any[] }) {
  const qc = useQueryClient();
  const [employeeId, setEmployeeId] = useState('');
  const [form, setForm] = useState({ basic: '', hra: '', other_allowances: '', pf_percent: '', effective_from: new Date().toISOString().slice(0, 10) });
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['salary-structures', page],
    queryFn: () => api.employeePayroll.salaryStructures({ page, limit: PAGE_LIMIT }),
  });
  const structures = data?.structures ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const saveMut = useMutation({
    mutationFn: () => api.employeePayroll.setSalaryStructure(employeeId, {
      basic: parseFloat(form.basic) || 0,
      hra: parseFloat(form.hra) || 0,
      other_allowances: parseFloat(form.other_allowances) || 0,
      pf_percent: parseFloat(form.pf_percent) || 0,
      effective_from: form.effective_from,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-structures'] }); setEmployeeId(''); setForm({ basic: '', hra: '', other_allowances: '', pf_percent: '', effective_from: new Date().toISOString().slice(0, 10) }); },
  });

  // Looks up the selected employee's structure directly by employee_id, independent of which
  // page of the (now paginated) full list happens to be showing — the picker needs to reach
  // any employee's existing structure regardless of table page.
  const { data: selectedStructureData } = useQuery({
    queryKey: ['salary-structure-for-employee', employeeId],
    queryFn: () => api.employeePayroll.salaryStructures({ employee_id: employeeId }),
    enabled: !!employeeId,
  });

  useEffect(() => {
    if (!employeeId) return;
    const existing = selectedStructureData?.structures?.[0];
    if (existing) {
      setForm({
        basic: String(existing.basic), hra: String(existing.hra), other_allowances: String(existing.other_allowances),
        pf_percent: String(existing.pf_percent), effective_from: String(existing.effective_from).slice(0, 10),
      });
    } else if (selectedStructureData) {
      setForm({ basic: '', hra: '', other_allowances: '', pf_percent: '', effective_from: new Date().toISOString().slice(0, 10) });
    }
  }, [selectedStructureData, employeeId]);

  function loadExisting(id: string) {
    setEmployeeId(id);
  }

  return (
    <div className="space-y-5">
      <Card className="border border-border bg-card">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Employee</label>
            <select value={employeeId} onChange={e => loadExisting(e.target.value)} title="Select employee"
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none">
              <option value="">Select an employee…</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
            </select>
          </div>
          {employeeId && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Basic (₹)</label>
                  <Input type="number" min={0} value={form.basic} onChange={e => setForm(f => ({ ...f, basic: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">HRA (₹)</label>
                  <Input type="number" min={0} value={form.hra} onChange={e => setForm(f => ({ ...f, hra: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Other Allowances (₹)</label>
                  <Input type="number" min={0} value={form.other_allowances} onChange={e => setForm(f => ({ ...f, other_allowances: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">PF (%)</label>
                  <Input type="number" min={0} max={100} value={form.pf_percent} onChange={e => setForm(f => ({ ...f, pf_percent: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
                </div>
              </div>
              <div className="space-y-1 max-w-[200px]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Effective From</label>
                <Input type="date" value={form.effective_from} onChange={e => setForm(f => ({ ...f, effective_from: e.target.value }))} className="h-9 text-xs bg-muted/20" />
              </div>
              <Button disabled={saveMut.isPending || !form.basic} onClick={() => saveMut.mutate()} className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-5">
                {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                Save Salary Structure
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {structures.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs">
            <div>
              <p className="font-bold text-foreground">{s.employee?.full_name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{s.employee?.employee_code}</p>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>Basic: {money(s.basic)}</span>
              <span>HRA: {money(s.hra)}</span>
              <span>PF: {Number(s.pf_percent)}%</span>
            </div>
          </div>
        ))}
      </div>
      <Card className="border border-border bg-card">
        <PaginationFooter page={page} totalPages={totalPages} total={total} onPageChange={setPage} label="salary structures" />
      </Card>
    </div>
  );
}

// ── Payslips tab ──────────────────────────────────────────────────────────────
function PayslipsTab({ employees }: { employees: any[] }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    employee_id: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()),
    basic: '', hra: '', other_allowances: '', pf_deduction: '', other_deductions: '', remarks: '',
  });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payslips', page],
    queryFn: () => api.employeePayroll.payslips({ page, limit: PAGE_LIMIT }),
  });
  const payslips = data?.payslips ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['payslips'] });

  const createMut = useMutation({
    mutationFn: () => api.employeePayroll.createPayslip({
      employee_id: form.employee_id, month: parseInt(form.month), year: parseInt(form.year),
      basic: parseFloat(form.basic) || 0, hra: parseFloat(form.hra) || 0, other_allowances: parseFloat(form.other_allowances) || 0,
      pf_deduction: parseFloat(form.pf_deduction) || 0, other_deductions: parseFloat(form.other_deductions) || 0,
      remarks: form.remarks || undefined,
    }),
    onSuccess: () => { invalidate(); setShowForm(false); },
  });
  const finalizeMut = useMutation({ mutationFn: (id: string) => api.employeePayroll.finalizePayslip(id), onSuccess: invalidate });
  const markPaidMut = useMutation({ mutationFn: (id: string) => api.employeePayroll.markPayslipPaid(id), onSuccess: invalidate });
  const deleteMut = useMutation({ mutationFn: (id: string) => api.employeePayroll.deletePayslip(id), onSuccess: invalidate });

  function prefillFromStructure(employeeId: string) {
    setForm(f => ({ ...f, employee_id: employeeId }));
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-4">
          <Plus className="w-3.5 h-3.5 mr-1.5" />New Payslip
        </Button>
      ) : (
        <Card className="border border-border bg-card">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Employee *</label>
                <select value={form.employee_id} onChange={e => prefillFromStructure(e.target.value)} title="Select employee"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none">
                  <option value="">Select…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Month *</label>
                <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} title="Month"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none">
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Year *</label>
                <Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Basic (₹) *</label>
                <Input type="number" min={0} value={form.basic} onChange={e => setForm(f => ({ ...f, basic: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">HRA (₹)</label>
                <Input type="number" min={0} value={form.hra} onChange={e => setForm(f => ({ ...f, hra: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Other Allowances (₹)</label>
                <Input type="number" min={0} value={form.other_allowances} onChange={e => setForm(f => ({ ...f, other_allowances: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">PF Deduction (₹)</label>
                <Input type="number" min={0} value={form.pf_deduction} onChange={e => setForm(f => ({ ...f, pf_deduction: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Other Deductions (₹)</label>
                <Input type="number" min={0} value={form.other_deductions} onChange={e => setForm(f => ({ ...f, other_deductions: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Remarks</label>
              <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} className="h-9 text-xs bg-muted/20" />
            </div>
            {createMut.isError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{(createMut.error as any).message}
              </div>
            )}
            <div className="flex gap-2">
              <Button disabled={createMut.isPending || !form.employee_id || !form.basic} onClick={() => createMut.mutate()} className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-5">
                {createMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                Create Payslip
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="h-9 text-xs px-4">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />Loading payslips…
        </div>
      ) : (
        <div className="space-y-2">
          {payslips.map((p: any) => {
            const meta = STATUS_META[p.status] || STATUS_META.draft;
            return (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs flex-wrap gap-2">
                <div className="min-w-[160px]">
                  <p className="font-bold text-foreground">{p.employee?.full_name}</p>
                  <p className="text-[10px] text-muted-foreground">{MONTHS[p.month - 1]} {p.year}</p>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>Gross: {money(p.gross_earnings)}</span>
                  <span>Deductions: {money(p.total_deductions)}</span>
                  <span className="font-bold text-foreground">Net: {money(p.net_pay)}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${meta.cls}`}>{meta.label}</span>
                <div className="flex items-center gap-1.5">
                  {p.status === 'draft' && (
                    <>
                      <Button size="sm" disabled={finalizeMut.isPending} onClick={() => finalizeMut.mutate(p.id)} className="h-7 text-[10px] bg-blue-500 hover:bg-blue-600 text-white font-bold px-3">
                        Finalize
                      </Button>
                      <button type="button" title="Delete" onClick={() => deleteMut.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10">
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </>
                  )}
                  {p.status === 'finalized' && (
                    <Button size="sm" disabled={markPaidMut.isPending} onClick={() => markPaidMut.mutate(p.id)} className="h-7 text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3">
                      Mark Paid
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Card className="border border-border bg-card">
        <PaginationFooter page={page} totalPages={totalPages} total={total} onPageChange={setPage} label="payslips" />
      </Card>
    </div>
  );
}

// ── Incentives tab ────────────────────────────────────────────────────────────
function IncentivesTab({ employees }: { employees: any[] }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ employee_id: '', title: '', amount: '', reason: '', awarded_on: new Date().toISOString().slice(0, 10) });

  const { data } = useQuery({
    queryKey: ['incentives', page],
    queryFn: () => api.employeePayroll.incentives({ page, limit: PAGE_LIMIT }),
  });
  const incentives = data?.incentives ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const createMut = useMutation({
    mutationFn: () => api.employeePayroll.createIncentive({
      employee_id: form.employee_id, title: form.title.trim(), amount: parseFloat(form.amount) || 0,
      reason: form.reason || undefined, awarded_on: form.awarded_on,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incentives'] }); setForm({ employee_id: '', title: '', amount: '', reason: '', awarded_on: new Date().toISOString().slice(0, 10) }); },
  });
  const deleteMut = useMutation({ mutationFn: (id: string) => api.employeePayroll.deleteIncentive(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['incentives'] }) });

  return (
    <div className="space-y-5">
      <Card className="border border-border bg-card">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Employee *</label>
              <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} title="Select employee"
                className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs focus:outline-none">
                <option value="">Select…</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Performance Bonus" className="h-9 text-xs bg-muted/20" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Amount (₹) *</label>
              <Input type="number" min={0} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="h-9 text-xs bg-muted/20 font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Awarded On</label>
              <Input type="date" value={form.awarded_on} onChange={e => setForm(f => ({ ...f, awarded_on: e.target.value }))} className="h-9 text-xs bg-muted/20" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Reason</label>
              <Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="h-9 text-xs bg-muted/20" />
            </div>
          </div>
          <Button disabled={createMut.isPending || !form.employee_id || !form.title || !form.amount} onClick={() => createMut.mutate()} className="h-9 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-5">
            {createMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Award className="w-3.5 h-3.5 mr-1.5" />}
            Add Incentive
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {incentives.map((i: any) => (
          <div key={i.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs">
            <div>
              <p className="font-bold text-foreground">{i.title}</p>
              <p className="text-[10px] text-muted-foreground">{i.employee?.full_name} · {new Date(i.awarded_on).toLocaleDateString('en-IN')}{i.reason ? ` · ${i.reason}` : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-violet-500">{money(i.amount)}</span>
              <button type="button" title="Delete" onClick={() => deleteMut.mutate(i.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Card className="border border-border bg-card">
        <PaginationFooter page={page} totalPages={totalPages} total={total} onPageChange={setPage} label="incentives" />
      </Card>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminEmployeePayroll() {
  const [tab, setTab] = useState<'salary' | 'payslips' | 'incentives'>('payslips');
  // Full employee roster (not the paginated admin list) — this page only needs it to
  // populate the employee-picker <select> in each tab, never to render a table of its own.
  const { data } = useQuery({
    queryKey: ['admin-employees', 'payroll-picker'],
    queryFn: () => api.employees.list({ limit: 1000 }),
  });
  const employees = data?.employees ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" />
          Payroll
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manual salary ledger — salary structures, monthly payslips, and ad-hoc incentives.</p>
      </div>

      <div className="flex gap-1 bg-muted/20 border border-border rounded-xl p-1 w-fit">
        {([
          { id: 'payslips', label: 'Payslips', icon: FileText },
          { id: 'salary', label: 'Salary Structures', icon: Wallet },
          { id: 'incentives', label: 'Incentives', icon: Award },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              tab === t.id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'salary' && <SalaryStructureTab employees={employees} />}
      {tab === 'payslips' && <PayslipsTab employees={employees} />}
      {tab === 'incentives' && <IncentivesTab employees={employees} />}
    </div>
  );
}
