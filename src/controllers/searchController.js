import Decision from '../models/Decision.js';
import geminiService from '../services/geminiService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Generate embedding for text using Gemini
async function generateEmbedding(text, apiKey = null) {
  try {
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(effectiveKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Legacy search endpoint (kept for backward compatibility)
export const searchDecisions = async (req, res) => {
  try {
    const { q, top_k = 5 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    // Use semantic search if available
    const queryEmbedding = await generateEmbedding(q, req.geminiApiKey);
    
    if (queryEmbedding) {
      // Semantic search
      const decisions = await Decision.find({ 
        userId: req.user._id,
        embedding: { $ne: null } 
      })
        .populate('documentId', 'title uploadedAt');
      
      const results = decisions.map(decision => {
        const similarity = cosineSimilarity(queryEmbedding, decision.embedding);
        return { ...decision.toObject(), similarityScore: similarity };
      })
      .filter(r => r.similarityScore >= 0.3)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, parseInt(top_k));
      
      // Generate answer using Gemini
      let answer = 'No relevant decisions found in your archive.';
      if (results.length > 0) {
        const decisionsData = results.map(d => ({
          decision: d.decision,
          rationale: d.rationale,
          category: d.category
        }));
        answer = await geminiService.answerQuestion(q, decisionsData, req.geminiApiKey);
      }
      
      return res.json({ query: q, results, answer });
    }
    
    // Fallback to text search
    const decisions = await Decision.find({
      userId: req.user._id,
      $or: [
        { decision: { $regex: q, $options: 'i' } },
        { rationale: { $regex: q, $options: 'i' } }
      ]
    })
      .populate('documentId', 'title uploadedAt')
      .limit(parseInt(top_k))
      .sort({ extractedAt: -1 });
    
    let answer = 'No relevant decisions found in your archive.';
    if (decisions.length > 0) {
      const decisionsData = decisions.map(d => ({
        decision: d.decision,
        rationale: d.rationale,
        category: d.category
      }));
      answer = await geminiService.answerQuestion(q, decisionsData, req.geminiApiKey);
    }
    
    res.json({ query: q, results: decisions, answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Semantic search using embeddings
export const semanticSearch = async (req, res) => {
  try {
    const { query, limit = 10, minSimilarity = 0.5, category } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const queryEmbedding = await generateEmbedding(query, req.geminiApiKey);
    if (!queryEmbedding) {
      return res.status(500).json({ error: 'Failed to generate query embedding' });
    }

    let baseQuery = { 
      userId: req.user._id,
      embedding: { $ne: null } 
    };
    if (category) baseQuery.category = category;

    const decisions = await Decision.find(baseQuery)
      .populate('documentId', 'title filename')
      .populate('projectId', 'name');

    const results = decisions.map(decision => {
      const similarity = cosineSimilarity(queryEmbedding, decision.embedding);
      return { ...decision.toObject(), similarityScore: similarity };
    })
    .filter(result => result.similarityScore >= minSimilarity)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, parseInt(limit));

    res.json({ query, results, total: results.length });
  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generate embeddings for decisions
export const generateEmbeddings = async (req, res) => {
  try {
    const { decisionIds } = req.body;
    
    let decisions;
    if (decisionIds && Array.isArray(decisionIds)) {
      decisions = await Decision.find({ 
        _id: { $in: decisionIds },
        userId: req.user._id
      });
    } else {
      decisions = await Decision.find({ 
        userId: req.user._id,
        embedding: null 
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const decision of decisions) {
      try {
        const searchableText = `${decision.decision} ${decision.rationale} ${decision.summary || ''} ${decision.category}`;
        const embedding = await generateEmbedding(searchableText);
        
        if (embedding) {
          decision.embedding = embedding;
          decision.searchableText = searchableText;
          await decision.save();
          successCount++;
        } else {
          errorCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error generating embedding for decision ${decision._id}:`, error);
        errorCount++;
      }
    }

    res.json({
      message: 'Embeddings generation complete',
      successCount,
      errorCount,
      total: decisions.length
    });
  } catch (error) {
    console.error('Generate embeddings error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Hybrid search (semantic + keyword)
export const hybridSearch = async (req, res) => {
  try {
    const { query, limit = 10, category, minScore = 0.3 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const queryEmbedding = await generateEmbedding(query);
    let baseQuery = { userId: req.user._id };
    if (category) baseQuery.category = category;

    const decisions = await Decision.find(baseQuery)
      .populate('documentId', 'title filename')
      .populate('projectId', 'name');

    const results = decisions.map(decision => {
      let score = 0;
      const queryLower = query.toLowerCase();
      const decisionText = `${decision.decision} ${decision.rationale} ${decision.summary || ''}`.toLowerCase();

      // Semantic similarity (70% weight)
      if (queryEmbedding && decision.embedding) {
        score += cosineSimilarity(queryEmbedding, decision.embedding) * 0.7;
      }

      // Keyword match (30% weight)
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      const matchCount = queryWords.filter(word => decisionText.includes(word)).length;
      score += Math.min((matchCount / queryWords.length) * 0.3, 0.3);

      // Exact phrase bonus
      if (decisionText.includes(queryLower)) score += 0.1;

      return {
        ...decision.toObject(),
        searchScore: Math.min(score, 1),
        matchedKeywords: queryWords.filter(word => decisionText.includes(word))
      };
    })
    .filter(result => result.searchScore >= minScore)
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, parseInt(limit));

    res.json({ query, results, total: results.length, searchType: 'hybrid' });
  } catch (error) {
    console.error('Hybrid search error:', error);
    res.status(500).json({ error: error.message });
  }
};
