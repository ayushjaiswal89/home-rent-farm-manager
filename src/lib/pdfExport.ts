import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface SummaryCardData {
  label: string;
  value: string;
  color?: string;
}

export interface TableRowData {
  cells: (string | number)[];
}

export interface PrintFinancialReportOptions {
  title: string;
  subtitle?: string;
  lang: 'hi' | 'en';
  season?: string;
  summaryCards: SummaryCardData[];
  tableHeaders: string[];
  tableRows: TableRowData[];
  footerNotes?: string;
}

/**
 * Triggers safe browser download of any Blob
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Exports any DOM element as a genuine, multi-page vector-wrapped high-resolution PDF file.
 * Preserves full Devanagari Hindi typography, colors, badges, tables, and borders.
 * Supports mobile Web Share API for direct WhatsApp / Drive sharing.
 */
export async function exportElementToPdf(element: HTMLElement | null, filename: string): Promise<void> {
  if (!element) {
    console.warn('exportElementToPdf: element is null');
    return;
  }

  const cleanFilename = filename.toLowerCase().endsWith('.pdf')
    ? filename
    : `${filename.replace(/[/\\?%*:|"<> ]/g, '-')}.pdf`;

  // Render high-DPI canvas (scale 2 = 192dpi equivalent)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: Math.max(element.scrollWidth, 800),
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm
  const margin = 10; // 10 mm margin
  const contentWidth = pdfWidth - margin * 2; // 190 mm
  const contentHeight = pdfHeight - margin * 2; // 277 mm

  const scaleRatio = contentWidth / canvas.width;
  const totalImgHeightMm = canvas.height * scaleRatio;

  if (totalImgHeightMm <= contentHeight) {
    // Fits on a single A4 page
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, totalImgHeightMm);
  } else {
    // Multi-page document with smooth canvas chunking
    const pageCanvasHeightPx = Math.floor(contentHeight / scaleRatio);
    let renderedPx = 0;

    while (renderedPx < canvas.height) {
      const sliceHeightPx = Math.min(canvas.height - renderedPx, pageCanvasHeightPx);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          renderedPx,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );
        const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
        if (renderedPx > 0) {
          pdf.addPage();
        }
        const sliceHeightMm = sliceHeightPx * scaleRatio;
        pdf.addImage(pageData, 'JPEG', margin, margin, contentWidth, sliceHeightMm);
      }
      renderedPx += sliceHeightPx;
    }
  }

  const pdfBlob = pdf.output('blob');

  // Mobile Web Share API: User can share directly to WhatsApp / Drive / Files
  if (
    typeof navigator !== 'undefined' &&
    typeof File !== 'undefined' &&
    typeof navigator.canShare === 'function'
  ) {
    try {
      const pdfFile = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: cleanFilename.replace('.pdf', ''),
          text: 'स्मार्ट खाता - डिजिटल कृषि बहीखाता रिपोर्ट (PDF)',
        });
        return;
      }
    } catch {
      // Continue to direct save if user cancels share dialog
    }
  }

  // Direct save download
  pdf.save(cleanFilename);
}

/**
 * Generates an off-screen HTML report and exports it directly as a real .pdf file
 */
export async function downloadFinancialReportPdf(
  options: PrintFinancialReportOptions,
  filename?: string
): Promise<void> {
  const isHi = options.lang === 'hi';
  const todayStr = new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const cardsHtml = options.summaryCards
    .map(
      (c) => `
      <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:10px 14px;flex:1;min-width:140px;">
        <div style="font-size:11px;color:#64748b;margin-bottom:4px;font-weight:600;">${c.label}</div>
        <div style="font-size:16px;font-weight:bold;color:${c.color || '#0f172a'};font-family:monospace;">${c.value}</div>
      </div>
    `
    )
    .join('');

  const headersHtml = options.tableHeaders
    .map((h) => `<th style="padding:9px 10px;text-align:left;border-bottom:2px solid #059669;font-size:11px;color:#065f46;font-weight:bold;">${h}</th>`)
    .join('');

  const rowsHtml = options.tableRows
    .map(
      (r, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};border-bottom:1px solid #e2e8f0;">
        ${r.cells.map((cell) => `<td style="padding:8px 10px;font-size:11px;color:#1e293b;">${cell}</td>`).join('')}
      </tr>
    `
    )
    .join('');

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = '#ffffff';
  container.style.padding = '32px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = 'Arial, "Noto Sans Devanagari", sans-serif';
  container.style.color = '#0f172a';

  container.innerHTML = `
    <div style="border-bottom:2px solid #10b981;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1 style="margin:0;font-size:22px;color:#065f46;font-weight:bold;">🌾 ${options.title}</h1>
        ${options.subtitle ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">${options.subtitle}</p>` : ''}
      </div>
      <div style="text-align:right;font-size:11px;color:#475569;line-height:1.4;">
        <div><b>दिनांक:</b> ${todayStr}</div>
        ${options.season ? `<div><b>सत्र:</b> ${options.season}</div>` : ''}
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      ${cardsHtml}
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #e2e8f0;">
      <thead>
        <tr style="background:#ecfdf5;">
          ${headersHtml}
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    ${options.footerNotes ? `<div style="font-size:11px;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:12px;text-align:center;">${options.footerNotes}</div>` : ''}
  `;

  document.body.appendChild(container);

  try {
    const fallbackName = `${options.title.replace(/[/\\?%*:|"<> ]/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
    const targetFilename = filename || fallbackName;
    await exportElementToPdf(container, targetFilename);
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

/**
 * In-page safe element printing using hidden iframe.
 * Avoids window.open / window.alert so it works seamlessly inside iframes and mobile web.
 */
export function printElement(element: HTMLElement | null): void {
  if (!element) {
    if (typeof window !== 'undefined') window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const stylesheetLinks = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  )
    .map((link) => `<link rel="stylesheet" href="${link.href}">`)
    .join('\n');

  const inlineStyles = Array.from(document.querySelectorAll<HTMLStyleElement>('style'))
    .map((style) => style.outerHTML)
    .join('\n');

  const clonedReport = element.cloneNode(true) as HTMLElement;
  clonedReport.removeAttribute('id');
  clonedReport.style.width = '100%';
  clonedReport.style.maxWidth = 'none';
  clonedReport.style.margin = '0';
  clonedReport.style.boxShadow = 'none';
  clonedReport.style.borderRadius = '0';

  doc.open();
  doc.write(`<!doctype html>
    <html lang="hi">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Smart Khaata - Farm Report</title>
        ${stylesheetLinks}
        ${inlineStyles}
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          html, body { background: #fff !important; color: #111827 !important; margin: 0 !important; padding: 0 !important; }
          body { font-family: Arial, "Noto Sans Devanagari", sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          * { box-sizing: border-box; }
          table { width: 100% !important; border-collapse: collapse !important; }
          thead { display: table-header-group; }
          tr, .rounded-lg, .border { break-inside: avoid; page-break-inside: avoid; }
          .overflow-x-auto, .overflow-y-auto { overflow: visible !important; }
          @media print { body { width: 100%; } }
        </style>
      </head>
      <body><main id="print-root"></main></body>
    </html>`);
  doc.close();

  doc.getElementById('print-root')?.appendChild(clonedReport);

  const finishPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  };

  setTimeout(finishPrint, 350);
}

/**
 * Print financial report using hidden iframe (safe in all browsers & iframes)
 */
export function printFinancialReport(options: PrintFinancialReportOptions): void {
  const isHi = options.lang === 'hi';
  const todayStr = new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const cardsHtml = options.summaryCards
    .map(
      (c) => `
      <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:10px 14px;flex:1;min-width:140px;">
        <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${c.label}</div>
        <div style="font-size:16px;font-weight:bold;color:${c.color || '#0f172a'};font-family:monospace;">${c.value}</div>
      </div>
    `
    )
    .join('');

  const headersHtml = options.tableHeaders
    .map((h) => `<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #cbd5e1;font-size:11px;color:#334155;">${h}</th>`)
    .join('');

  const rowsHtml = options.tableRows
    .map(
      (r, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};border-bottom:1px solid #f1f5f9;">
        ${r.cells.map((cell) => `<td style="padding:7px 10px;font-size:11px;color:#1e293b;">${cell}</td>`).join('')}
      </tr>
    `
    )
    .join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="${options.lang}">
    <head>
      <meta charset="utf-8">
      <title>${options.title}</title>
      <style>
        body { font-family: Arial, "Noto Sans Devanagari", sans-serif; margin: 24px; color: #0f172a; }
        @media print {
          body { margin: 0; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <div style="border-bottom:2px solid #10b981;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h1 style="margin:0;font-size:20px;color:#065f46;">🌾 ${options.title}</h1>
          ${options.subtitle ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">${options.subtitle}</p>` : ''}
        </div>
        <div style="text-align:right;font-size:11px;color:#64748b;">
          <div><b>दिनांक:</b> ${todayStr}</div>
          ${options.season ? `<div><b>सत्र:</b> ${options.season}</div>` : ''}
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
        ${cardsHtml}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f1f5f9;">
            ${headersHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${options.footerNotes ? `<div style="font-size:10px;color:#94a3b8;border-top:1px dashed #cbd5e1;padding-top:12px;text-align:center;">${options.footerNotes}</div>` : ''}
    </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(fullHtml);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 3000);
    }
  }, 250);
}

/**
 * Standalone offline HTML statement download
 */
export function downloadPrintableHtml(options: {
  title: string;
  subtitle?: string;
  lang: 'hi' | 'en';
  season?: string;
  summaryCards: SummaryCardData[];
  tableHeaders: string[];
  tableRows: TableRowData[];
  footerNotes?: string;
}): void {
  const isHi = options.lang === 'hi';
  const todayStr = new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const cardsHtml = options.summaryCards
    .map(
      (c) => `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;flex:1;min-width:140px;">
        <div style="font-size:11px;color:#64748b;margin-bottom:4px;font-weight:600;">${c.label}</div>
        <div style="font-size:16px;font-weight:bold;color:${c.color || '#0f172a'};font-family:monospace;">${c.value}</div>
      </div>
    `
    )
    .join('');

  const headersHtml = options.tableHeaders
    .map((h) => `<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #cbd5e1;font-size:11px;color:#334155;">${h}</th>`)
    .join('');

  const rowsHtml = options.tableRows
    .map(
      (r, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};border-bottom:1px solid #f1f5f9;">
        ${r.cells.map((cell) => `<td style="padding:7px 10px;font-size:11px;color:#1e293b;">${cell}</td>`).join('')}
      </tr>
    `
    )
    .join('');

  const fullHtml = `<!DOCTYPE html>
<html lang="${options.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${options.title}</title>
  <style>
    body { font-family: Arial, "Noto Sans Devanagari", sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div style="border-bottom:2px solid #10b981;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <h1 style="margin:0;font-size:22px;color:#065f46;">🌾 ${options.title}</h1>
      ${options.subtitle ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">${options.subtitle}</p>` : ''}
    </div>
    <div style="text-align:right;font-size:11px;color:#64748b;">
      <div><b>दिनांक:</b> ${todayStr}</div>
      ${options.season ? `<div><b>सत्र:</b> ${options.season}</div>` : ''}
    </div>
  </div>

  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
    ${cardsHtml}
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#f1f5f9;">
        ${headersHtml}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  ${options.footerNotes ? `<div style="font-size:11px;color:#94a3b8;border-top:1px dashed #cbd5e1;padding-top:12px;text-align:center;">${options.footerNotes}</div>` : ''}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  triggerBlobDownload(blob, `${options.title.replace(/[/\\?%*:|"<> ]/g, '-')}.html`);
}
