import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'completed'],
    default: 'active',
  },
  tags: [{
    type: String,
    trim: true,
  }],
})

// Virtual field to populate documents
projectSchema.virtual('documents', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'projectId',
})

// Virtual field to populate decisions
projectSchema.virtual('decisions', {
  ref: 'Decision',
  localField: '_id',
  foreignField: 'projectId',
})

// Ensure virtuals are included in JSON
projectSchema.set('toJSON', { virtuals: true })
projectSchema.set('toObject', { virtuals: true })

export default mongoose.model('Project', projectSchema)
