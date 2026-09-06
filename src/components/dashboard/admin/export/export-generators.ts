import type { ExportPayload } from "@/actions/exports";

export function downloadExcel(payload: ExportPayload) {
  return import("xlsx").then((XLSX) => {
    const records = payload.rows.map((row) =>
      Object.fromEntries(payload.columns.map((column) => [column.label, row[column.key] ?? ""]))
    );

    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
    XLSX.writeFile(workbook, `${payload.suggestedFileName}.xlsx`);
  });
}

export async function buildExportPdf(payload: ExportPayload) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const autoTable = autoTableModule.default;
  const orientation = payload.columns.length > 7 ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.text(payload.title, 40, 44);

  doc.setFontSize(10);
  if (payload.subtitle) {
    doc.text(payload.subtitle, 40, 62);
  }

  let summaryY = payload.subtitle ? 80 : 62;
  for (const item of payload.summary) {
    doc.text(`${item.label}: ${item.value}`, 40, summaryY);
    summaryY += 14;
  }

  doc.setFontSize(9);
  doc.text(`Generado: ${new Date(payload.generatedAt).toLocaleString()}`, 40, summaryY + 4);

  autoTable(doc, {
    startY: summaryY + 18,
    head: [payload.columns.map((column) => column.label)],
    body: payload.rows.map((row) => payload.columns.map((column) => String(row[column.key] ?? ""))),
    styles: {
      fontSize: 8,
      cellPadding: 6,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [109, 76, 217],
    },
    alternateRowStyles: {
      fillColor: [246, 244, 255],
    },
    margin: { top: 36, right: 24, bottom: 28, left: 24 },
  });

  return doc;
}
