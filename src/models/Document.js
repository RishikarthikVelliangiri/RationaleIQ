import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  sourceType: {
    type: String,
    default: 'text'
  },
  filename: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    default: 'TXT'
  },
  processed: {
    type: Number,
    default: 0 // 0 = pending, 1 = processing, 2 = completed
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Document', documentSchema);
