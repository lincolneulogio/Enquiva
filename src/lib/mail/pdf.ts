function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  const contentLines = [
    "BT",
    "/F1 18 Tf",
    "72 760 Td",
    ...lines.flatMap((line, index) => {
      const safeLine = escapePdfText(line);
      if (index === 0) {
        return [`(${safeLine}) Tj`];
      }
      return ["0 -24 Td", `(${safeLine}) Tj`];
    }),
    "ET",
  ];

  const content = contentLines.join("\n");
  const contentLength = Buffer.byteLength(content, "utf8");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${contentLength} >> stream\n${content}\nendstream endobj`,
  ];

  const header = "%PDF-1.4\n";
  let pdf = header;
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export function generatePdfBuffer(opts: { eventTitle: string; code?: string; qrDataUrl?: string }) {
  const lines = [
    opts.eventTitle,
    `Código: ${opts.code ?? "-"}`,
    "Ticket emitido por SistemaEventsFIN",
    opts.qrDataUrl ? "QR disponible en el correo HTML" : "",
  ].filter(Boolean);

  return buildSimplePdf(lines);
}
