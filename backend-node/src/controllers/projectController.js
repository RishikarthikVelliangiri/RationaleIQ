import Project from '../models/Project.js'
import Document from '../models/Document.js'
import Decision from '../models/Decision.js'
import geminiService from '../services/geminiService.js'

// Get all projects
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort({ createdAt: -1 })
    
    // Get document and decision counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const documentCount = await Document.countDocuments({ 
          projectId: project._id,
          userId: req.user._id
        })
        const decisionCount = await Decision.countDocuments({ 
          projectId: project._id,
          userId: req.user._id
        })
        
        return {
          ...project.toObject(),
          documentCount,
          decisionCount,
        }
      })
    )
    
    res.json(projectsWithCounts)
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
}

// Get a single project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params
    const project = await Project.findOne({
      _id: id,
      userId: req.user._id
    })
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    // Get associated documents and decisions
    const documents = await Document.find({ 
      projectId: id,
      userId: req.user._id
    }).sort({ uploadedAt: -1 })
    const decisions = await Decision.find({ 
      projectId: id,
      userId: req.user._id
    }).sort({ extractedAt: -1 })
    
    res.json({
      ...project.toObject(),
      documents,
      decisions,
      documentCount: documents.length,
      decisionCount: decisions.length,
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    res.status(500).json({ error: 'Failed to fetch project' })
  }
}

// Create a new project
export const createProject = async (req, res) => {
  try {
    const { name, description, tags, status } = req.body
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Project name is required' })
    }
    
    const project = new Project({
      userId: req.user._id,
      name: name.trim(),
      description: description || '',
      tags: tags || [],
      status: status || 'active',
    })
    
    await project.save()
    
    res.status(201).json({
      ...project.toObject(),
      documentCount: 0,
      decisionCount: 0,
    })
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
}

// Update a project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, tags, status } = req.body
    
    const project = await Project.findOne({
      _id: id,
      userId: req.user._id
    })
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    if (name !== undefined) project.name = name.trim()
    if (description !== undefined) project.description = description
    if (tags !== undefined) project.tags = tags
    if (status !== undefined) project.status = status
    project.updatedAt = Date.now()
    
    await project.save()
    
    const documentCount = await Document.countDocuments({ 
      projectId: id,
      userId: req.user._id
    })
    const decisionCount = await Decision.countDocuments({ 
      projectId: id,
      userId: req.user._id
    })
    
    res.json({
      ...project.toObject(),
      documentCount,
      decisionCount,
    })
  } catch (error) {
    console.error('Error updating project:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
}

// Delete a project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params
    
    const project = await Project.findOne({
      _id: id,
      userId: req.user._id
    })
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    // Delete all associated documents and decisions
    await Document.deleteMany({ 
      projectId: id,
      userId: req.user._id
    })
    await Decision.deleteMany({ 
      projectId: id,
      userId: req.user._id
    })
    await Project.findByIdAndDelete(id)
    
    res.json({ message: 'Project and all associated data deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
}

// Analyze selected documents in a project and generate decisions
export const analyzeProject = async (req, res) => {
  try {
    const { id } = req.params
    const { customPrompt, documentIds, decisionsPerDoc = 1 } = req.body
    
    // Validate inputs
    if (!customPrompt || customPrompt.trim() === '') {
      return res.status(400).json({ error: 'Analysis focus/question is required' })
    }
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one document to analyze' })
    }
    
    // Validate totalInsights (now represents total across all docs, not per doc)
    const totalInsights = Math.min(Math.max(1, parseInt(decisionsPerDoc) || 1), 10)
    
    const project = await Project.findOne({
      _id: id,
      userId: req.user._id
    })
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    // Fetch only selected documents
    const documents = await Document.find({ 
      _id: { $in: documentIds },
      projectId: id,
      userId: req.user._id
    })
    
    if (documents.length === 0) {
      return res.status(400).json({ error: 'Selected documents not found' })
    }
    
    // Create analysis group identifier (timestamp + shortened prompt)
    const timestamp = new Date().toISOString()
    const promptShort = customPrompt.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_')
    const analysisGroup = `${timestamp}_${promptShort}`
    
    console.log(`Analyzing ${documents.length} documents with prompt: "${customPrompt}" (extracting ${totalInsights} total insights)`)
    
    // Combine all document contents for holistic analysis
    const combinedContext = documents.map(doc => 
      `=== ${doc.filename || doc.title} ===\n${doc.content}\n`
    ).join('\n\n')
    
    // Extract total insights across ALL documents
    const decisions = await geminiService.extractDecisions(combinedContext, customPrompt, totalInsights)
    
    // Save decisions (they may reference multiple docs, so we'll use first doc as primary)
    const savedDecisions = []
    const decisionsToSave = decisions.slice(0, totalInsights)
    
    for (const decisionData of decisionsToSave) {
      const decision = new Decision({
        userId: req.user._id,
        decision: decisionData.decision,
        rationale: decisionData.rationale,
        category: decisionData.category,
        summary: decisionData.summary,
        confidenceScore: decisionData.confidenceScore || null,
        evidenceQuotes: decisionData.evidenceQuotes || [],
        aiReasoning: decisionData.aiReasoning || null,
        documentId: documents[0]._id, // Primary document reference
        sourceDocumentIds: documents.map(doc => doc._id), // All documents used in analysis
        projectId: id,
        analysisGroup: analysisGroup
      })
      
      await decision.save()
      savedDecisions.push(decision)
    }
    
    console.log(`✓ Extracted ${savedDecisions.length} total insights from ${documents.length} documents`)
    
    res.json({
      message: `Analysis complete: ${savedDecisions.length} insights extracted from ${documents.length} documents`,
      decisions: savedDecisions,
      analysisGroup: analysisGroup,
      prompt: customPrompt
    })
  } catch (error) {
    console.error('Error analyzing project:', error)
    res.status(500).json({ error: 'Failed to analyze documents' })
  }
}
