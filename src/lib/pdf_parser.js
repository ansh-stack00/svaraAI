export async function extractTextFromPDF(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Invalid PDF buffer");
  }

  // Use require instead of import
  const pdfParse = require("pdf-parse");

  const data = await pdfParse(buffer);

  return data.text
    .split("\f")
    .map((page, index) => ({
      pageNumber: index + 1,
      text: page.trim(),
    }));
}
