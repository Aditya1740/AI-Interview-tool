const pdfParse = require('pdf-parse');
const fs = require('fs');

async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF extraction error:', err);
    throw new Error('Failed to extract text from PDF: ' + err.message);
  }
}

module.exports = { extractTextFromPDF };
