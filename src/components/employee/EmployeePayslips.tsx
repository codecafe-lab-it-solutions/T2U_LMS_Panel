import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { exportCsv } from '../../utils/exportCsv';
import { openPrintableDocument } from '../../utils/printDocument';
import { buildPayslipHtml } from '../../utils/payslipDocument';
import { Wallet, Award, Loader2, Receipt, Download, FileDown, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function money(n: any) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }

// Employee's own payslip + incentive history — read-only, always visible regardless of
// role grants (this is never gated by the permission matrix, unlike every other page in
// the employee panel).
export default function EmployeePayslips() {
  const { employeeProfile } = useAppStore();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
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

  const handleExportCsv = () => {
    exportCsv(
      `my-payslips-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Month', 'Year', 'Basic', 'HRA', 'Other Allowances', 'Gross Earnings', 'PF', 'Other Deductions', 'Total Deductions', 'Net Pay', 'Status'],
      payslips.map((p: any) => [
        MONTHS[p.month - 1], p.year, Number(p.basic ?? 0), Number(p.hra ?? 0), Number(p.other_allowances ?? 0),
        Number(p.gross_earnings ?? 0), Number(p.pf_deduction ?? 0), Number(p.other_deductions ?? 0),
        Number(p.total_deductions ?? 0), Number(p.net_pay ?? 0), p.status,
      ])
    );
  };

  const handleViewPayslip = (p: any) => {
    openPrintableDocument(buildPayslipHtml(p, employeeProfile?.full_name ?? 'Employee', employeeProfile?.employee_code));
  };

  const handleDownloadPayslip = async (p: any) => {
    setDownloadingId(p.id);
    try {
      const { downloadHtmlAsPdf } = await import('../../utils/downloadPdf');
      const html = buildPayslipHtml(p, employeeProfile?.full_name ?? 'Employee', employeeProfile?.employee_code);
      await downloadHtmlAsPdf(html, `payslip-${MONTHS[p.month - 1]}-${p.year}.pdf`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            My Payslips
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your finalized and paid payslips, plus any incentives you've been awarded.</p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={payslips.length === 0}
          className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none shrink-0"
        >
          <FileDown className="w-3.5 h-3.5" /> Export CSV
        </button>
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
                <button
                  type="button"
                  title="View payslip"
                  onClick={() => handleViewPayslip(p)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Download PDF"
                  disabled={downloadingId === p.id}
                  onClick={() => handleDownloadPayslip(p)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary shrink-0 disabled:opacity-50"
                >
                  {downloadingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                </button>
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
