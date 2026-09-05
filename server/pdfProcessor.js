import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

class PDFProcessor {
  async extractText(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      numPages: data.numpages,
      title: data.info?.Title || 'Untitled Document',
      author: data.info?.Author || 'Unknown'
    };
  }

  chunkText(text, chunkSize = 500, overlap = 100) {
    const chunks = [];
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 20) {
        chunks.push({
          id: chunks.length,
          text: chunk.trim(),
          startWord: i,
          endWord: Math.min(i + chunkSize, words.length)
        });
      }
    }
    return chunks;
  }
}

export default new PDFProcessor();
