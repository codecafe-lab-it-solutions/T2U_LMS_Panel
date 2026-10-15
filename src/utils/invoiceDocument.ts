export interface InvoiceDocData {
  invoice_number: string;
  type: string; // 'purchase' | 'withdrawal'
  status: string;
  description?: string | null;
  created_at: string;
  subtotal: number | string;
  gst_rate?: number | string | null;
  gst_amount?: number | string | null;
  gst_category?: string | null;
  tds_rate?: number | string | null;
  tds_amount?: number | string | null;
  admin_charge?: number | string | null;
  total_amount: number | string;
}

export interface InvoiceCustomer {
  name: string;
  email?: string | null;
}

function money(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#d97706', paid: '#059669', cancelled: '#e11d48', refunded: '#2563eb',
};

// Builds a self-contained, printable one-page invoice document. Mirrors the branded look of
// KYCVerification.tsx's DSA form (same "T2UPGRADE PVT. LTD." header convention) but styled for
// a financial document rather than a legal one. Opened via utils/printDocument.ts.
export function buildInvoiceHtml(inv: InvoiceDocData, customer: InvoiceCustomer): string {
  const date = new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const statusColor = STATUS_COLOR[inv.status] ?? '#6b7280';
  const isPurchase = inv.type === 'purchase';

  const rows: string[] = [
    `<tr><td class="label">Subtotal</td><td class="amt">${money(inv.subtotal)}</td></tr>`,
  ];
  if (inv.gst_rate != null) {
    rows.push(`<tr><td class="label">GST (${Number(inv.gst_rate)}%)${inv.gst_category ? ` — ${inv.gst_category}` : ''}</td><td class="amt plus">+ ${money(inv.gst_amount)}</td></tr>`);
  }
  if (inv.tds_rate != null) {
    rows.push(`<tr><td class="label">TDS (${Number(inv.tds_rate)}%)</td><td class="amt minus">− ${money(inv.tds_amount)}</td></tr>`);
  }
  if (inv.admin_charge != null && Number(inv.admin_charge) > 0) {
    rows.push(`<tr><td class="label">Admin Charge</td><td class="amt ${isPurchase ? 'plus' : 'minus'}">${isPurchase ? '+' : '−'} ${money(inv.admin_charge)}</td></tr>`);
  }

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Invoice ${inv.invoice_number}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111;max-width:720px;margin:40px auto;padding:0 24px;}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px;}
  .brand h1{font-size:18px;margin:0;letter-spacing:.02em;}
  .brand p{font-size:11px;color:#6b7280;margin:2px 0 0;}
  .meta{text-align:right;}
  .meta .num{font-size:15px;font-weight:bold;font-family:monospace;}
  .meta .date{font-size:11px;color:#6b7280;margin-top:2px;}
  .status{display:inline-block;margin-top:6px;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;padding:3px 10px;border-radius:999px;color:#fff;background:${statusColor};}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}
  .box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;}
  .box .k{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:4px;}
  .box .v{font-size:13px;font-weight:600;}
  .box .v2{font-size:11px;color:#6b7280;}
  table{width:100%;border-collapse:collapse;margin-top:8px;}
  td{padding:8px 4px;border-bottom:1px solid #e5e7eb;}
  td.label{color:#374151;}
  td.amt{text-align:right;font-family:monospace;font-weight:600;}
  td.amt.plus{color:#059669;}
  td.amt.minus{color:#e11d48;}
  tr.total td{border-top:2px solid #111;border-bottom:none;font-weight:bold;font-size:15px;padding-top:12px;}
  .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center;}
  @media print{body{margin:0;padding:16px;}}
</style>
</head><body>

<div class="top">
  <div class="brand">
    <h1>T2UPGRADE PVT. LTD.</h1>
    <p>Time to Upgrade — Learn · Upgrade · Earn</p>
    <p style="font-size:10px;color:#6b7280;margin:3px 0 0;">Ward No. 18, Mochiyon Ka Mohalla, Lunkaransar, Rajasthan, India</p>
  </div>
  <div class="meta">
    <div class="num">${inv.invoice_number}</div>
    <div class="date">${date}</div>
    <div class="status">${inv.status}</div>
  </div>
</div>

<div class="grid">
  <div class="box">
    <div class="k">Billed To</div>
    <div class="v">${customer.name}</div>
    ${customer.email ? `<div class="v2">${customer.email}</div>` : ''}
  </div>
  <div class="box">
    <div class="k">${isPurchase ? 'Purchase' : 'Withdrawal'} Details</div>
    <div class="v">${inv.description || (isPurchase ? 'Platform purchase' : 'Withdrawal payout')}</div>
  </div>
</div>

<table>
  <tbody>
    ${rows.join('')}
    <tr class="total"><td>Total ${isPurchase ? 'Amount' : 'Paid Out'}</td><td class="amt">${money(inv.total_amount)}</td></tr>
  </tbody>
</table>

<div class="footer">
  T2UPGRADE Pvt. Ltd. • Ward No. 18, Mochiyon Ka Mohalla, Lunkaransar, Rajasthan, India<br>
  This is a system-generated invoice and does not require a signature.<br>
  Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
</div>

</body></html>`;
}
