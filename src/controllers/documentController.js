import Document from '../models/Document.js';
import Decision from '../models/Decision.js';
import geminiService from '../services/geminiService.js';
import embeddingService from '../services/embeddingService.js';
import path from 'path';
import { createRequire } from 'module';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Import CommonJS modules
const require = createRequire(import.meta.url);
const removeMarkdownModule = require('remove-markdown');
const removeMd = removeMarkdownModule?.default ?? removeMarkdownModule;

// Helper function to extract text from PDF using pdfjs-dist
async function extractTextFromPDF(buffer) {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/',
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
}

export const createDocument = async (req, res) => {
  try {
    const { title, content, sourceType } = req.body;
    
    const document = new Document({
      userId: req.user._id,
      title,
      content,
      sourceType: sourceType || 'text'
    });
    
    await document.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    let { title, sourceType, projectId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Auto-generate title from filename if not provided
    const originalName = req.file.originalname || '';
    if (!title || title.trim() === '') {
      // Extract filename without extension
      const ext = path.extname(originalName);
      title = path.basename(originalName, ext);
    }
    
    // Determine file type and extract text accordingly
    const ext = path.extname(originalName).toLowerCase();
    let content = '';

    if (ext === '.pdf' || req.file.mimetype === 'application/pdf') {
      try {
        content = await extractTextFromPDF(req.file.buffer);
        
        if (!content) {
          throw new Error('No text could be extracted from the PDF');
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return res.status(400).json({ 
          error: 'Failed to extract text from PDF. The file might be corrupted or contain only images.' 
        });
      }
    } else if (ext === '.md' || ext === '.markdown' || req.file.mimetype === 'text/markdown') {
      // Convert markdown to plain text by stripping formatting
      const raw = req.file.buffer.toString('utf-8');
      content = removeMd(raw);
    } else if (ext === '.csv') {
      // Parse CSV and convert to readable text
      const raw = req.file.buffer.toString('utf-8');
      const lines = raw.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      content = `CSV Data Analysis:\n\nHeaders: ${headers.join(', ')}\n\nData:\n`;
      for (let i = 1; i < Math.min(lines.length, 100); i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        content += `Row ${i}: ${headers.map((h, idx) => `${h}: ${values[idx] || 'N/A'}`).join(', ')}\n`;
      }
      if (lines.length > 100) {
        content += `\n... and ${lines.length - 100} more rows`;
      }
    } else if (ext === '.json') {
      // Parse JSON and convert to readable text
      const raw = req.file.buffer.toString('utf-8');
      try {
        const jsonData = JSON.parse(raw);
        content = `JSON Data:\n\n${JSON.stringify(jsonData, null, 2)}`;
      } catch (e) {
        content = raw; // Fallback to raw content if JSON parsing fails
      }
    } else if (ext === '.xml') {
      // XML as text
      const raw = req.file.buffer.toString('utf-8');
      content = `XML Document:\n\n${raw}`;
    } else if (ext === '.log') {
      // Log files
      const raw = req.file.buffer.toString('utf-8');
      content = `Log File:\n\n${raw}`;
    } else {
      // Default: treat as utf-8 text
      content = req.file.buffer.toString('utf-8');
    }

    // Validate that we have content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'The uploaded file appears to be empty or unreadable.' 
      });
    }

    const document = new Document({
      userId: req.user._id,
      title,
      content,
      sourceType: sourceType || 'file',
      filename: originalName,
      fileType: ext.replace('.', '').toUpperCase(),
      projectId: projectId || null
    });
    
    await document.save();
    
    // Return document without automatic processing
    // User will manually trigger idea generation later with custom prompts
    res.status(201).json({
      document,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const { skip = 0, limit = 100 } = req.query;
    const documents = await Document.find({ userId: req.user._id })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ uploadedAt: -1 });
    
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const processDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Update status to processing
    document.processed = 1;
    await document.save();
    
    try {
      // Extract decisions using Gemini (with user's API key if provided)
      const decisionsData = await geminiService.extractDecisions(document.content, '', 1, req.geminiApiKey);
      
      // Save decisions to database
      for (const decisionData of decisionsData) {
        const decision = new Decision({
          userId: req.user._id,
          decision: decisionData.decision,
          rationale: decisionData.rationale,
          category: decisionData.category,
          summary: decisionData.summary,
          documentId: document._id
        });
        
        await decision.save();
        
        // Add to vector database (placeholder)
        const embeddingId = await embeddingService.addDecision(
          decision._id.toString(),
          decisionData.decision,
          decisionData.rationale,
          decisionData.category
        );
        
        decision.embeddingId = embeddingId;
        await decision.save();
      }
      
      // Mark document as processed
      document.processed = 2;
      await document.save();
      
      res.json({
        documentId: document._id,
        status: 'completed',
        decisionsCount: decisionsData.length,
        message: `Successfully extracted ${decisionsData.length} decision(s)`
      });
    } catch (error) {
      // Mark as failed
      document.processed = 0;
      await document.save();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Delete associated decisions
    await Decision.deleteMany({ 
      documentId: document._id,
      userId: req.user._id
    });
    
    // Delete the document
    await Document.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Document and associated decisions deleted successfully',
      documentId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearAllDocuments = async (req, res) => {
  try {
    // Delete all user's decisions
    const decisionsResult = await Decision.deleteMany({ userId: req.user._id });
    
    // Delete all user's documents
    const documentsResult = await Document.deleteMany({ userId: req.user._id });
    
    res.json({ 
      message: 'All your documents and decisions cleared successfully',
      deletedDocuments: documentsResult.deletedCount,
      deletedDecisions: decisionsResult.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
