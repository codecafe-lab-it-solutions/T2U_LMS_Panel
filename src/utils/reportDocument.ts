import { formatDate } from './date';

function money(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function docShell(title: string, subtitle: string, dateRangeLabel: string, bodyHtml: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;max-width:900px;margin:40px auto;padding:0 24px;}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:20px;}
  .brand h1{font-size:18px;margin:0;letter-spacing:.02em;}
  .brand p{font-size:11px;color:#6b7280;margin:2px 0 0;}
  .meta{text-align:right;font-size:11px;color:#6b7280;}
  h2{font-size:14px;margin:0 0 4px;}
  table{width:100%;border-collapse:collapse;margin-top:12px;}
  th{text-align:right;padding:8px 6px;border-bottom:2px solid #111;font-size:9.5px;text-transform:uppercase;letter-spacing:.04em;color:#374151;}
  th:first-child{text-align:left;}
  td{text-align:right;padding:7px 6px;border-bottom:1px solid #e5e7eb;font-family:monospace;}
  td:first-child{text-align:left;font-family:Arial,Helvetica,sans-serif;}
  tr.total td{border-top:2px solid #111;border-bottom:none;font-weight:bold;}
  .footer{margin-top:28px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center;}
  @media print{body{margin:0;padding:16px;}}
</style>
</head><body>
<div class="top">
  <div class="brand">
    <h1>T2UPGRADE PVT. LTD.</h1>
    <p>Time to Upgrade — Learn · Upgrade · Earn</p>
  </div>
  <div class="meta">
    <h2>${title}</h2>
    <div>${subtitle}</div>
    <div>${dateRangeLabel}</div>
  </div>
</div>
${bodyHtml}
<div class="footer">
  Generated on ${formatDate(new Date())} from T2UPGRADE Pvt. Ltd. platform records.
</div>
</body></html>`;
}

export interface GstReportRow {
  category: string;
  gst_rate: number | string;
  count: number;
  subtotal: number | string;
  gst_amount: number | string;
  total_amount: number | string;
}

export function buildGstReportHtml(rows: GstReportRow[], dateRangeLabel: string): string {
  const grandTxn = rows.reduce((s, r) => s + Number(r.count), 0);
  const grandBase = rows.reduce((s, r) => s + Number(r.subtotal), 0);
  const grandGst = rows.reduce((s, r) => s + Number(r.gst_amount), 0);
  const grandTotal = rows.reduce((s, r) => s + Number(r.total_amount), 0);

  const body = `
<table>
  <thead><tr><th>Category</th><th>GST Rate</th><th>Transactions</th><th>Base Amount</th><th>GST Amount</th><th>Total</th></tr></thead>
  <tbody>
    ${rows.map(r => `<tr><td>${r.category.replace(/_/g, ' ')}</td><td>${Number(r.gst_rate)}%</td><td>${r.count}</td><td>${money(r.subtotal)}</td><td>${money(r.gst_amount)}</td><td>${money(r.total_amount)}</td></tr>`).join('')}
    <tr class="total"><td colspan="2">Grand Total</td><td>${grandTxn}</td><td>${money(grandBase)}</td><td>${money(grandGst)}</td><td>${money(grandTotal)}</td></tr>
  </tbody>
</table>`;

  return docShell('GST Report', 'Tax collected on purchases', dateRangeLabel, body);
}

export interface TdsReportRow {
  invoice_number: string;
  user?: { full_name?: string; email?: string } | null;
  subtotal: number | string;
  tds_rate?: number | string | null;
  tds_amount: number | string;
  admin_charge?: number | string | null;
  total_amount: number | string;
  created_at: string;
}

export function buildTdsReportHtml(rows: TdsReportRow[], dateRangeLabel: string): string {
  const grandGross = rows.reduce((s, r) => s + Number(r.subtotal), 0);
  const grandTds = rows.reduce((s, r) => s + Number(r.tds_amount), 0);
  const grandNet = rows.reduce((s, r) => s + Number(r.total_amount), 0);

  const body = `
<table>
  <thead><tr><th>Invoice #</th><th>User</th><th>Gross</th><th>TDS Rate</th><th>TDS Amount</th><th>Admin Ch.</th><th>Net Paid</th><th>Date</th></tr></thead>
  <tbody>
    ${rows.map(r => `<tr><td>${r.invoice_number}</td><td>${r.user?.full_name ?? ''}</td><td>${money(r.subtotal)}</td><td>${Number(r.tds_rate ?? 0)}%</td><td>${money(r.tds_amount)}</td><td>${money(r.admin_charge)}</td><td>${money(r.total_amount)}</td><td>${formatDate(r.created_at)}</td></tr>`).join('')}
    <tr class="total"><td colspan="2">Grand Total</td><td>${money(grandGross)}</td><td></td><td>${money(grandTds)}</td><td></td><td>${money(grandNet)}</td><td></td></tr>
  </tbody>
</table>`;

  return docShell('TDS Report', 'Tax deducted on withdrawal payouts', dateRangeLabel, body);
}
