import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInvoiceHtml } from '../../src/utils/invoiceDocument';
import { buildPayslipHtml } from '../../src/utils/payslipDocument';
import { buildGstReportHtml, buildTdsReportHtml } from '../../src/utils/reportDocument';

test('buildInvoiceHtml: renders correct DD/MM/YYYY date and invoice breakdown', () => {
  const inv = {
    invoice_number: 'INV-2026-001',
    type: 'purchase',
    status: 'paid',
    description: 'Course Bundle Purchase',
    created_at: '2026-10-15T10:00:00.000Z',
    subtotal: 10000,
    gst_rate: 18,
    gst_amount: 1800,
    gst_category: 'Services',
    tds_rate: null,
    tds_amount: null,
    admin_charge: null,
    total_amount: 11800,
  };
  const customer = { name: 'Rahul Sharma', email: 'rahul@example.com' };

  const html = buildInvoiceHtml(inv, customer);
  assert.ok(html.includes('INV-2026-001'), 'HTML contains invoice number');
  assert.ok(html.includes('Rahul Sharma'), 'HTML contains customer name');
  assert.ok(html.includes('15/10/2026'), 'Invoice date must be DD/MM/YYYY');
  assert.match(html, /Generated on \d{2}\/\d{2}\/\d{4}/, 'Generated on footer must be DD/MM/YYYY');
});

test('buildPayslipHtml: renders employee payslip with DD/MM/YYYY footer', () => {
  const payslip = {
    month: 10,
    year: 2026,
    basic: 30000,
    hra: 15000,
    other_allowances: 5000,
    gross_earnings: 50000,
    pf_deduction: 1800,
    other_deductions: 200,
    total_deductions: 2000,
    net_pay: 48000,
    status: 'paid',
  };

  const html = buildPayslipHtml(payslip, 'Pooja Verma', 'EMP-007');
  assert.ok(html.includes('Pooja Verma'), 'HTML contains employee name');
  assert.ok(html.includes('October 2026'), 'HTML contains period');
  assert.match(html, /Generated on \d{2}\/\d{2}\/\d{4}/, 'Generated on footer must be DD/MM/YYYY');
});

test('buildTdsReportHtml: formats row dates as DD/MM/YYYY', () => {
  const rows = [
    {
      invoice_number: 'TDS-001',
      user: { full_name: 'Amit Patel' },
      subtotal: 5000,
      tds_rate: 10,
      tds_amount: 500,
      admin_charge: 100,
      total_amount: 4400,
      created_at: '2026-09-20',
    },
  ];

  const html = buildTdsReportHtml(rows, 'September 2026');
  assert.ok(html.includes('TDS-001'), 'HTML contains invoice number');
  assert.ok(html.includes('Amit Patel'), 'HTML contains user name');
  assert.ok(html.includes('20/09/2026'), 'Row date must be DD/MM/YYYY');
  assert.match(html, /Generated on \d{2}\/\d{2}\/\d{4}/, 'Generated on footer must be DD/MM/YYYY');
});

