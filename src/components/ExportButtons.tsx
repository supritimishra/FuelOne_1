import { Button } from "@/components/ui/button";

type Row = Record<string, any>;

function toCSV(rows: Row[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: any) => {
    if (val === null || val === undefined) return "";
    const s = String(val).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))];
  return lines.join("\n");
}

function download(filename: string, content: string, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openPrintWindow(title: string, html: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:16px}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ddd;padding:8px;font-size:12px}
    th{background:#f5f5f5;text-align:left}
  </style></head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export function ExportButtons({ rows, filename, title }: { rows: Row[]; filename: string; title?: string }) {
  const onCSV = () => download(`${filename}.csv`, toCSV(rows));
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(toCSV(rows));
      // no toast here to keep component generic
    } catch {
      // ignore
    }
  };
  const onPrint = () => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const table = `
      <h2>${title || filename}</h2>
      <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map(r => `<tr>${headers.map(h => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`).join("")}
      </tbody></table>`;
    openPrintWindow(title || filename, table);
  };
  const onPDF = onPrint; // users can Save as PDF in print dialog

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={onCopy}>Copy</Button>
      <Button size="sm" variant="outline" onClick={onCSV}>CSV</Button>
      <Button size="sm" variant="outline" onClick={onPDF}>PDF</Button>
      <Button size="sm" variant="outline" onClick={onPrint}>Print</Button>
    </div>
  );
}

export default ExportButtons;
