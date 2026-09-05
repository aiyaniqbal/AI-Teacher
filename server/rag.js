import pdfProcessor from './pdfProcessor.js';
import { v4 as uuidv4 } from 'uuid';

class RAGEngine {
  constructor() {
    this.vectors = new Map(); // Store document chunks with simple embeddings
    this.documents = new Map(); // Store original documents
    this.isReady = false;
  }

  // Simple TF-IDF-like similarity (no external ML dependencies)
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  // Simple cosine similarity using word overlap
  cosineSimilarity(vec1, vec2) {
    const allWords = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const word of allWords) {
      const v1 = vec1[word] || 0;
      const v2 = vec2[word] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // Create simple word frequency vector
  createVector(text) {
    const tokens = this.tokenize(text);
    const vector = {};
    tokens.forEach(token => {
      vector[token] = (vector[token] || 0) + 1;
    });
    return vector;
  }

  async indexDocument(filePath, documentId) {
    try {
      const pdfResult = await pdfProcessor.extractText(filePath);
      const chunks = pdfProcessor.chunkText(pdfResult.text);
      
      const docId = documentId || uuidv4();
      this.documents.set(docId, {
        id: docId,
        title: pdfResult.title,
        numPages: pdfResult.numPages,
        chunks: chunks.length,
        indexedAt: new Date().toISOString()
      });

      chunks.forEach(chunk => {
        const vector = this.createVector(chunk.text);
        this.vectors.set(chunk.id, {
          id: chunk.id,
          documentId: docId,
          text: chunk.text,
          vector,
          metadata: {
            startWord: chunk.startWord,
            endWord: chunk.endWord
          }
        });
      });

      this.isReady = true;
      return { success: true, documentId: docId, chunks: chunks.length };
    } catch (error) {
      console.error('RAG indexing error:', error);
      return { success: false, error: error.message };
    }
  }

  async search(query, topK = 3) {
    if (this.vectors.size === 0) {
      return [];
    }

    const queryVector = this.createVector(query);
    const results = [];

    for (const [id, chunk] of this.vectors) {
      const similarity = this.cosineSimilarity(queryVector, chunk.vector);
      results.push({
        id: chunk.id,
        documentId: chunk.documentId,
        text: chunk.text,
        similarity,
        metadata: chunk.metadata
      });
    }

    // Sort by similarity and return top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async getContextForTopic(topic, numChunks = 3) {
    const results = await this.search(topic, numChunks);
    
    if (results.length === 0) {
      return {
        topic,
        chunks: [],
        context: 'No specific content found. Using general knowledge.',
        documentTitle: null
      };
    }

    const context = results.map(r => r.text).join('\n\n');
    const docId = results[0].documentId;
    const doc = this.documents.get(docId);

    return {
      topic,
      chunks: results.map(r => ({
        text: r.text.substring(0, 200) + '...',
        similarity: Math.round(r.similarity * 100) + '%'
      })),
      context: context.substring(0, 2000),
      documentTitle: doc?.title || 'Unknown Document'
    };
  }

  async getFullDocumentContext() {
    const allChunks = [...this.vectors.values()];
    const context = allChunks.map(c => c.text).join('\n\n');
    return {
      totalChunks: allChunks.length,
      context: context.substring(0, 5000),
      documents: [...this.documents.values()]
    };
  }

  getStats() {
    return {
      totalChunks: this.vectors.size,
      totalDocuments: this.documents.size,
      isReady: this.isReady,
      documents: [...this.documents.values()]
    };
  }
}

export default new RAGEngine();
