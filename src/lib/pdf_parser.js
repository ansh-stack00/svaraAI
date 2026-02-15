export async function extractTextFromPDF(buffer) {
  const pdfParse = require('pdf-parse-debugging-disabled');

  // Force real Node buffer
  const nodeBuffer = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(buffer);

  const data = await pdfParse(nodeBuffer);

  return data.text
    .split("\f")
    .map((page, index) => ({
      pageNumber: index + 1,
      text: page.trim(),
    }));
}
