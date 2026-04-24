const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

function normalizeCell(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

async function buildExcelBuffer(title, columns, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 31));

  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width || 24
  }));

  rows.forEach((row) => {
    const mapped = {};
    columns.forEach((column) => {
      mapped[column.key] = normalizeCell(row[column.key]);
    });
    sheet.addRow(mapped);
  });

  return workbook.xlsx.writeBuffer();
}

function buildPdfBuffer(title, columns, rows) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 36, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(16).text(title);
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Gerado em ${new Date().toLocaleString("pt-BR")}`);
    doc.moveDown();

    doc.font("Helvetica-Bold");
    doc.text(columns.map((column) => column.header).join(" | "));
    doc.font("Helvetica");
    doc.moveDown(0.3);

    rows.forEach((row) => {
      const line = columns.map((column) => normalizeCell(row[column.key])).join(" | ");
      doc.text(line);
    });

    doc.end();
  });
}

async function sendExport(res, options) {
  const { format, fileName, title, columns, rows } = options;
  if (format === "xlsx") {
    const buffer = await buildExcelBuffer(title, columns, rows);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.xlsx"`);
    return res.send(Buffer.from(buffer));
  }

  const buffer = await buildPdfBuffer(title, columns, rows);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}.pdf"`);
  return res.send(buffer);
}

module.exports = {
  sendExport
};
