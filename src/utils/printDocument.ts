// Opens a self-contained HTML document in a new tab as a Blob URL, so the user can save it
// as a PDF via the browser's native print dialog (Ctrl/Cmd+P → Save as PDF). Same pattern
// KYCVerification.tsx already uses for the DSA agreement form — kept here as a shared helper
// so invoice/payslip documents don't duplicate it.
export function openPrintableDocument(html: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
