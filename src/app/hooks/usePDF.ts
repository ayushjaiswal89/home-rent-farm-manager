import { useCallback } from "react";

export function usePDF() {
  return useCallback((title: string, headers: string[], rows: (string | number)[][]) => {
    const ths = headers.map(header => `<th>${header}</th>`).join("");
    const trs = rows.map(row => `<tr>${row.map(cell => `<td>${String(cell)}</td>`).join("")}</tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
        h2 { color: #166534; margin-bottom: 4px; }
        p { color: #666; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #166534; color: #fff; padding: 8px 10px; text-align: left; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f9fafb; }
      </style></head><body>
      <h2>${title}</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>
    </body></html>`;
    const w = window.open("", "_blank", "width=900,height=600");
    if (!w) {
      alert("Popup blocked. Please allow popups for PDF download.");
      return;
    }
    w.document.write(html);
    w.document.close();
  }, []);
}
