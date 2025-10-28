import Decision from '../models/Decision.js';

export const getDecisions = async (req, res) => {
  try {
    const { skip = 0, limit = 100, category } = req.query;
    
    const query = { userId: req.user._id };
    if (category) {
      query.category = category;
    }
    
    const decisions = await Decision.find(query)
      .populate('documentId', 'title uploadedAt')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ extractedAt: -1 });
    
    res.json(decisions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDecision = async (req, res) => {
  try {
    const decision = await Decision.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
      .populate('documentId', 'title uploadedAt content filename fileType')
      .populate('sourceDocumentIds', 'title uploadedAt content filename fileType');
    
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    
    res.json(decision);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDecisionStatus = async (req, res) => {
  try {
    const { status, notes = '', changedBy = 'user' } = req.body;
    
    const validStatuses = ['draft', 'review', 'approved', 'implemented', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }
    
    const decision = await Decision.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    
    // Update status
    decision.status = status;
    
    // Add to status history
    decision.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy,
      notes
    });
    
    await decision.save();
    
    res.json({ 
      message: 'Decision status updated successfully',
      decision
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearAllDecisions = async (req, res) => {
  try {
    const result = await Decision.deleteMany({ userId: req.user._id });
    
    res.json({ 
      message: 'All your decisions cleared successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
