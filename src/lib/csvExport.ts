import { Lang } from './types';
import { formatCsvCell, sanitizeFilename } from './excelExport';

export function generateCsvString(rows: (string | number | undefined | null)[][]): string {
  return (
    '\uFEFF' +
    rows
      .map((row) => row.map((cell) => formatCsvCell(cell)).join(','))
      .join('\r\n')
  );
}

export async function exportCsvFile(options: {
  filename: string;
  csvString: string;
  title?: string;
  lang?: Lang;
}): Promise<void> {
  const blob = new Blob([options.csvString], { type: 'text/csv;charset=utf-8;' });
  const finalFilename = sanitizeFilename(options.filename, 'csv');

  // Try Mobile Native Share API if supported
  if (
    typeof navigator !== 'undefined' &&
    typeof File !== 'undefined' &&
    typeof navigator.canShare === 'function'
  ) {
    try {
      const file = new File([blob], finalFilename, { type: 'text/csv;charset=utf-8;' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: options.title || finalFilename,
          text: options.lang === 'hi' ? 'स्मार्ट खाता - CSV फ़ाइल' : 'Smart Khata - CSV Export',
        });
        return;
      }
    } catch {
      // Fallback to browser download if user cancels
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}
