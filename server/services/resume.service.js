const pdfParse = require('pdf-parse');
const fs = require('fs');

/**
 * Extracts text from a PDF. Returns { text, length, isImageBased }.
 * `isImageBased` is true when the PDF parsed cleanly but produced almost no text —
 * a strong signal that it's a scan or was exported from a tool that flattened the text layer.
 */
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  let data;
  try {
    data = await pdfParse(dataBuffer);
  } catch (err) {
    console.error('PDF extraction error:', err);
    throw new Error('PDF parsing failed: ' + err.message);
  }

  const text = (data.text || '').trim();
  const length = text.length;
  const isImageBased = length < 20 && (data.numpages || 0) > 0;

  console.log(`[resume] extracted ${length} chars from ${data.numpages} page(s)`);
  return { text, length, isImageBased };
}

module.exports = { extractTextFromPDF };
