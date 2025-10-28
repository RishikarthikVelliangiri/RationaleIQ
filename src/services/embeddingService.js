// Placeholder for embedding service
// For now, we'll store decisions in MongoDB without vector embeddings
// You can add ChromaDB integration later if needed

class EmbeddingService {
  async addDecision(decisionId, decision, rationale, category) {
    // Placeholder - return a simple ID
    return `emb_${decisionId}`;
  }

  async searchDecisions(query, topK = 5) {
    // Placeholder - returns empty array
    // In production, implement vector similarity search
    return [];
  }
}

export default new EmbeddingService();
