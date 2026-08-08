import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Renders a self-contained HTML document (as produced by invoiceDocument.ts /
// payslipDocument.ts / reportDocument.ts) into an offscreen iframe — so the document's own
// embedded <style> block applies cleanly, isolated from the app's styles — captures it as an
// image, and saves it as an actual downloaded PDF file (unlike printDocument.ts's
// openPrintableDocument, which just opens a tab for the user to print/save manually).
export async function downloadHtmlAsPdf(html: string, filename: string): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '820px';
  iframe.style.height = '1120px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error('Failed to render document'));
      iframe.srcdoc = html;
    });

    const doc = iframe.contentDocument;
    if (!doc?.body) throw new Error('Could not access rendered document');

    // Let layout/webfonts settle before capturing.
    await new Promise(r => setTimeout(r, 80));

    const canvas = await html2canvas(doc.body, {
      scale: 2,
      backgroundColor: '#ffffff',
      width: doc.body.scrollWidth,
      height: doc.body.scrollHeight,
      windowWidth: doc.body.scrollWidth,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      unit: 'px',
      format: [canvas.width, canvas.height],
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
  } finally {
    document.body.removeChild(iframe);
  }
}
