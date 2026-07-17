import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Wallet, Award, Loader2, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function money(n: any) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }

// Employee's own payslip + incentive history — read-only, always visible regardless of
// role grants (this is never gated by the permission matrix, unlike every other page in
// the employee panel).
export default function EmployeePayslips() {
  const { data: payslips = [], isLoading: loadingPayslips } = useQuery<any[]>({
    queryKey: ['my-payslips'],
    queryFn: () => api.employeePayroll.myPayslips(),
  });
  const { data: incentives = [], isLoading: loadingIncentives } = useQuery<any[]>({
    queryKey: ['my-incentives'],
    queryFn: () => api.employeePayroll.myIncentives(),
  });
  const { data: salary } = useQuery<any>({
    queryKey: ['my-salary-structure'],
    queryFn: () => api.employeePayroll.mySalaryStructure(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" />
          My Payslips
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your finalized and paid payslips, plus any incentives you've been awarded.</p>
      </div>

      {salary && (
        <Card className="border border-border bg-card">
          <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Basic</p><p className="font-mono font-bold text-foreground">{money(salary.basic)}</p></div>
            <div><p className="text-[9px] text-muted-foreground uppercase font-bold">HRA</p><p className="font-mono font-bold text-foreground">{money(salary.hra)}</p></div>
            <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Other Allowances</p><p className="font-mono font-bold text-foreground">{money(salary.other_allowances)}</p></div>
            <div><p className="text-[9px] text-muted-foreground uppercase font-bold">PF %</p><p className="font-mono font-bold text-foreground">{Number(salary.pf_percent)}%</p></div>
          </CardContent>
        </Card>
      )}

      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" />Payslips</p>
        {loadingPayslips ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />Loading…
          </div>
        ) : payslips.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No finalized payslips yet.</p>
        ) : (
          <div className="space-y-2">
            {payslips.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs flex-wrap gap-2">
                <p className="font-bold text-foreground">{MONTHS[p.month - 1]} {p.year}</p>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>Gross: {money(p.gross_earnings)}</span>
                  <span>Deductions: {money(p.total_deductions)}</span>
                  <span className="font-bold text-primary">Net: {money(p.net_pay)}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${
                  p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' : 'bg-blue-500/10 text-blue-500 border-blue-500/25'
                }`}>{p.status === 'paid' ? 'Paid' : 'Finalized'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />Incentives</p>
        {loadingIncentives ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />Loading…
          </div>
        ) : incentives.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No incentives yet.</p>
        ) : (
          <div className="space-y-2">
            {incentives.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs">
                <div>
                  <p className="font-bold text-foreground">{i.title}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(i.awarded_on).toLocaleDateString('en-IN')}{i.reason ? ` · ${i.reason}` : ''}</p>
                </div>
                <span className="font-mono font-bold text-violet-500">{money(i.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
