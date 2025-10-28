import mongoose from 'mongoose';

const decisionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  decision: {
    type: String,
    required: true
  },
  rationale: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  summary: {
    type: String
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  evidenceQuotes: {
    type: [String],
    default: []
  },
  aiReasoning: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'implemented', 'rejected'],
    default: 'draft'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'implemented', 'rejected']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: String,
      default: 'system'
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  sourceDocumentIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Document',
    default: []
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  analysisGroup: {
    type: String,
    default: null,
    index: true
  },
  embeddingId: {
    type: String,
    unique: true,
    sparse: true
  },
  embedding: {
    type: [Number],
    default: null
  },
  searchableText: {
    type: String,
    default: null
  },
  extractedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient text search
decisionSchema.index({ decision: 'text', rationale: 'text', summary: 'text' });

export default mongoose.model('Decision', decisionSchema);
