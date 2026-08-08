export interface PayslipDocData {
  month: number;
  year: number;
  basic: number | string;
  hra: number | string;
  other_allowances: number | string;
  gross_earnings: number | string;
  pf_deduction: number | string;
  other_deductions: number | string;
  total_deductions: number | string;
  net_pay: number | string;
  status: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function money(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Builds a self-contained, printable one-page payslip. Same visual convention as
// invoiceDocument.ts (T2UPGRADE header, violet accent) — opened via utils/printDocument.ts.
export function buildPayslipHtml(p: PayslipDocData, employeeName: string, employeeCode?: string): string {
  const period = `${MONTHS[p.month - 1]} ${p.year}`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Payslip — ${period}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111;max-width:720px;margin:40px auto;padding:0 24px;}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px;}
  .brand h1{font-size:18px;margin:0;letter-spacing:.02em;}
  .brand p{font-size:11px;color:#6b7280;margin:2px 0 0;}
  .meta{text-align:right;}
  .meta .period{font-size:15px;font-weight:bold;}
  .status{display:inline-block;margin-top:6px;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;padding:3px 10px;border-radius:999px;color:#fff;background:${p.status === 'paid' ? '#059669' : '#2563eb'};}
  .box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-bottom:24px;}
  .box .k{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:4px;}
  .box .v{font-size:13px;font-weight:600;}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
  .col h3{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin:0 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;}
  table{width:100%;border-collapse:collapse;}
  td{padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:12px;}
  td.label{color:#374151;}
  td.amt{text-align:right;font-family:monospace;font-weight:600;}
  tr.sub td{border-top:1px solid #111;border-bottom:none;font-weight:bold;padding-top:8px;}
  .net{margin-top:24px;background:#7c3aed;color:#fff;border-radius:8px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;}
  .net .k{font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;opacity:.85;}
  .net .v{font-size:20px;font-weight:bold;font-family:monospace;}
  .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center;}
  @media print{body{margin:0;padding:16px;}}
</style>
</head><body>

<div class="top">
  <div class="brand">
    <h1>T2UPGRADE PVT. LTD.</h1>
    <p>Payslip</p>
  </div>
  <div class="meta">
    <div class="period">${period}</div>
    <div class="status">${p.status}</div>
  </div>
</div>

<div class="box">
  <div class="k">Employee</div>
  <div class="v">${employeeName}${employeeCode ? ` · ${employeeCode}` : ''}</div>
</div>

<div class="cols">
  <div class="col">
    <h3>Earnings</h3>
    <table>
      <tr><td class="label">Basic</td><td class="amt">${money(p.basic)}</td></tr>
      <tr><td class="label">HRA</td><td class="amt">${money(p.hra)}</td></tr>
      <tr><td class="label">Other Allowances</td><td class="amt">${money(p.other_allowances)}</td></tr>
      <tr class="sub"><td>Gross Earnings</td><td class="amt">${money(p.gross_earnings)}</td></tr>
    </table>
  </div>
  <div class="col">
    <h3>Deductions</h3>
    <table>
      <tr><td class="label">PF</td><td class="amt">${money(p.pf_deduction)}</td></tr>
      <tr><td class="label">Other Deductions</td><td class="amt">${money(p.other_deductions)}</td></tr>
      <tr class="sub"><td>Total Deductions</td><td class="amt">${money(p.total_deductions)}</td></tr>
    </table>
  </div>
</div>

<div class="net">
  <span class="k">Net Pay</span>
  <span class="v">${money(p.net_pay)}</span>
</div>

<div class="footer">
  This is a system-generated payslip from T2UPGRADE Pvt. Ltd. and does not require a signature.<br>
  Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
</div>

</body></html>`;
}
