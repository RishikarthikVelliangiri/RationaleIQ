import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Target, Upload, Sparkles, Calendar, Trash2, Eye, Download, FileDown, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import Card, { CardBody } from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { projectsAPI, documentsAPI, decisionsAPI } from '../services/api'
import api from '../services/api'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [decisionsPerDoc, setDecisionsPerDoc] = useState(1)
  const [collapsedGroups, setCollapsedGroups] = useState({})
  const [viewingDocument, setViewingDocument] = useState(null)
  const [documentsCollapsed, setDocumentsCollapsed] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await projectsAPI.getOne(id)
      setProject(response.data)
    } catch (error) {
      console.error('Error fetching project:', error)
      if (error.response?.status !== 401) {
        toast.error('Failed to load project')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeProject = async (customPrompt = '') => {
    // Validate selection
    if (selectedDocuments.length === 0) {
      toast.error('Please select at least one document to analyze')
      return
    }

    if (!customPrompt.trim()) {
      toast.error('Please provide an analysis focus or question')
      return
    }

    setAnalyzing(true)
    try {
      const response = await projectsAPI.analyze(id, { 
        customPrompt: customPrompt.trim(),
        documentIds: selectedDocuments,
        decisionsPerDoc: decisionsPerDoc
      })

      toast.success(response.data.message || 'Analysis complete!')
      setShowPromptModal(false)
      setCustomPrompt('')
      setSelectedDocuments([])
      fetchProject()
    } catch (error) {
      console.error('Error analyzing documents:', error)
      toast.error('Failed to analyze documents')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Delete this document?')) return

    try {
      await api.delete(`/documents/${documentId}`)
      toast.success('Document deleted')
      fetchProject()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleDeleteAllDocuments = async () => {
    if (!confirm('Delete ALL documents in this project? This cannot be undone!')) return

    try {
      // Delete each document
      for (const doc of project.documents) {
        await api.delete(`/documents/${doc._id}`)
      }

      toast.success('All documents deleted')
      fetchProject()
    } catch (error) {
      console.error('Error deleting documents:', error)
      toast.error('Failed to delete all documents')
    }
  }

  const handleDeleteAllDecisions = async () => {
    if (!confirm('Delete ALL insights in this project? This cannot be undone!')) return

    try {
      // Delete each decision
      for (const decision of project.decisions) {
        await api.delete(`/decisions/${decision._id}`)
      }

      toast.success('All insights deleted')
      fetchProject()
    } catch (error) {
      console.error('Error deleting insights:', error)
      toast.error('Failed to delete all insights')
    }
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const validExtensions = ['.txt', '.md', '.pdf', '.docx', '.doc', '.csv', '.json', '.xml', '.log']
    const validFiles = []

    for (const file of selectedFiles) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (validExtensions.includes(ext)) {
        validFiles.push(file)
      } else {
        toast.error(`${file.name}: Unsupported file type. Supported: TXT, MD, PDF, DOCX, CSV, JSON, XML, LOG`)
      }
    }

    if (validFiles.length > 0) {
      setFiles(validFiles)
    }
  }

  const handleUploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setUploading(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const file of files) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          const titleFromFile = file.name.replace(/\.[^/.]+$/, '')
          formData.append('title', titleFromFile)
          formData.append('source_type', 'file')
          formData.append('projectId', id)

          await documentsAPI.upload(formData)
          successCount++
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s). Click "Generate Ideas" to analyze them.`)
        setShowUploadModal(false)
        setFiles([])
        fetchProject()
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} file(s)`)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const exportAllDecisionsAsJSON = () => {
    if (!project.decisions || project.decisions.length === 0) {
      toast.error('No decisions to export')
      return
    }

    const exportData = {
      project: {
        name: project.name,
        description: project.description,
        createdAt: project.createdAt
      },
      decisions: project.decisions.map(d => ({
        decision: d.decision,
        category: d.category,
        summary: d.summary,
        rationale: d.rationale,
        confidenceScore: d.confidenceScore,
        evidenceQuotes: d.evidenceQuotes,
        aiReasoning: d.aiReasoning,
        extractedAt: d.extractedAt
      })),
      totalInsights: project.decisions.length,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-')}-decisions.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${project.decisions.length} decisions as JSON`)
  }

  const exportAllDecisionsAsMarkdown = () => {
    if (!project.decisions || project.decisions.length === 0) {
      toast.error('No decisions to export')
      return
    }

    let markdown = `# ${project.name}\n\n`
    if (project.description) {
      markdown += `${project.description}\n\n`
    }
    markdown += `**Total Insights:** ${project.decisions.length}\n`
    markdown += `**Exported:** ${new Date().toLocaleDateString()}\n\n`
    markdown += `---\n\n`

    project.decisions.forEach((decision, idx) => {
      markdown += `## ${idx + 1}. ${decision.decision}\n\n`
      markdown += `**Category:** ${decision.category}\n`
      if (decision.confidenceScore) {
        markdown += `**Confidence:** ${decision.confidenceScore}/100\n`
      }
      markdown += `\n**Summary:** ${decision.summary}\n\n`
      markdown += `**Rationale:** ${decision.rationale}\n\n`
      
      if (decision.evidenceQuotes && decision.evidenceQuotes.length > 0) {
        markdown += `**Evidence:**\n`
        decision.evidenceQuotes.forEach(quote => {
          markdown += `- "${quote}"\n`
        })
        markdown += `\n`
      }
      
      markdown += `---\n\n`
    })

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-')}-decisions.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${project.decisions.length} decisions as Markdown`)
  }

  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  const extractPromptFromGroupKey = (groupKey) => {
    // Group key format: "timestamp_prompt_with_underscores"
    const parts = groupKey.split('_')
    if (parts.length > 1) {
      // Remove timestamp (first part) and join the rest
      return parts.slice(1).join(' ').replace(/_/g, ' ')
    }
    return 'Analysis'
  }

  const openDocumentInNewTab = async (docId) => {
    try {
      const response = await documentsAPI.getOne(docId)
      const doc = response.data
      
      // Create a new window with the document content
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${doc.filename || doc.title || 'Document'}</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  max-width: 900px;
                  margin: 40px auto;
                  padding: 20px;
                  line-height: 1.6;
                  color: #333;
                  background: #f9fafb;
                }
                h1 {
                  color: #111827;
                  border-bottom: 2px solid #8b5cf6;
                  padding-bottom: 10px;
                }
                .meta {
                  color: #6b7280;
                  font-size: 0.9em;
                  margin-bottom: 30px;
                }
                .content {
                  background: white;
                  padding: 30px;
                  border-radius: 8px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
              </style>
            </head>
            <body>
              <h1>${doc.filename || doc.title || 'Document'}</h1>
              <div class="meta">
                <strong>Type:</strong> ${doc.fileType || 'Unknown'} | 
                <strong>Uploaded:</strong> ${new Date(doc.uploadedAt).toLocaleString()}
              </div>
              <div class="content">${doc.content || doc.rawContent || 'No content available'}</div>
            </body>
          </html>
        `)
        newWindow.document.close()
      }
    } catch (error) {
      console.error('Error opening document:', error)
      toast.error('Failed to open document')
    }
  }

  const exportGroupAsJSON = (groupKey, decisions) => {
    const exportData = {
      prompt: extractPromptFromGroupKey(groupKey),
      totalInsights: decisions.length,
      decisions: decisions.map(d => ({
        decision: d.decision,
        category: d.category,
        summary: d.summary,
        rationale: d.rationale,
        confidenceScore: d.confidenceScore,
        evidenceQuotes: d.evidenceQuotes,
        aiReasoning: d.aiReasoning,
        extractedAt: d.extractedAt
      })),
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${extractPromptFromGroupKey(groupKey).replace(/\s+/g, '-')}-insights.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${decisions.length} insights as JSON`)
  }

  const exportGroupAsMarkdown = (groupKey, decisions) => {
    let markdown = `# ${extractPromptFromGroupKey(groupKey)}\n\n`
    markdown += `**Total Insights:** ${decisions.length}\n`
    markdown += `**Exported:** ${new Date().toLocaleDateString()}\n\n`
    markdown += `---\n\n`

    decisions.forEach((decision, idx) => {
      markdown += `## ${idx + 1}. ${decision.decision}\n\n`
      markdown += `**Category:** ${decision.category}\n`
      if (decision.confidenceScore) {
        markdown += `**Confidence:** ${decision.confidenceScore}/100\n`
      }
      markdown += `\n**Summary:** ${decision.summary}\n\n`
      markdown += `**Rationale:** ${decision.rationale}\n\n`
      
      if (decision.evidenceQuotes && decision.evidenceQuotes.length > 0) {
        markdown += `**Evidence:**\n`
        decision.evidenceQuotes.forEach(quote => {
          markdown += `- "${quote}"\n`
        })
        markdown += `\n`
      }
      
      markdown += `---\n\n`
    })

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${extractPromptFromGroupKey(groupKey).replace(/\s+/g, '-')}-insights.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${decisions.length} insights as Markdown`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project not found</h2>
        <Button onClick={() => navigate('/projects')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-down">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowUploadModal(true)}
            variant="secondary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
          <Button
            onClick={() => {
              setShowPromptModal(true)
              setSelectedDocuments([]) // Reset selection when opening
            }}
            disabled={analyzing || !project.documents || project.documents.length === 0}
            title={!project.documents || project.documents.length === 0 ? 'Upload documents first' : 'Analyze documents and extract strategic insights'}
            className={!project.documents || project.documents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {analyzing ? 'Analyzing...' : 'Analyze & Extract'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {project.documentCount || 0}
                </p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Decisions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {project.decisionCount || 0}
                </p>
              </div>
              <Target className="w-10 h-10 text-purple-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 capitalize">
                  {project.status}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-green-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Documents */}
      <div>
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer group"
          onClick={() => setDocumentsCollapsed(!documentsCollapsed)}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Documents
            {project.documents && project.documents.length > 0 && (
              <span className="text-lg text-gray-500 dark:text-gray-400">({project.documents.length})</span>
            )}
          </h2>
          {project.documents && project.documents.length > 0 && (
            documentsCollapsed ? 
              <ChevronDown className="w-6 h-6 text-gray-500 group-hover:text-purple-600 transition-colors" /> :
              <ChevronUp className="w-6 h-6 text-gray-500 group-hover:text-purple-600 transition-colors" />
          )}
        </div>
        
        {!documentsCollapsed && (
          <>
            {!project.documents || project.documents.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No documents yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Upload documents to this project to get started
                  </p>
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {project.documents.map((doc, index) => (
                  <Card 
                    key={doc._id} 
                    className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up border-2 border-transparent hover:border-purple-400 dark:hover:border-purple-600" 
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardBody className="p-2.5">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-center mb-2">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="text-center mb-2">
                          <h3 className="text-[11px] font-bold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {doc.filename || doc.title}
                          </h3>
                          <Badge variant="primary" className="text-[9px] px-1.5 py-0.5 mt-1">{doc.fileType || 'TXT'}</Badge>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-[9px] text-gray-500 dark:text-gray-400 mb-2">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex gap-1 mt-auto">
                          <Button
                            variant="secondary"
                            onClick={() => openDocumentInNewTab(doc._id)}
                            size="sm"
                            className="flex-1 text-[10px] py-1 px-1"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteDocument(doc._id)}
                            size="sm"
                            className="text-[10px] py-1 px-1.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Decisions - Grouped by Analysis */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Strategic Insights</h2>
        </div>
        {!project.decisions || project.decisions.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No insights extracted yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {project.documentCount > 0
                  ? 'Click "Analyze & Extract" above to generate strategic insights from your documents'
                  : 'Upload documents first, then analyze them to extract insights'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {(() => {
              // Group decisions by analysisGroup
              const grouped = {}
              project.decisions.forEach(decision => {
                const group = decision.analysisGroup || 'ungrouped'
                if (!grouped[group]) {
                  grouped[group] = []
                }
                grouped[group].push(decision)
              })
              
              return Object.entries(grouped).map(([groupKey, decisions]) => {
                // Extract timestamp and prompt from group key
                const isGrouped = groupKey !== 'ungrouped'
                const groupDate = isGrouped ? new Date(groupKey.split('_')[0]) : null
                const promptText = isGrouped ? extractPromptFromGroupKey(groupKey) : 'Analysis Group'
                const isCollapsed = collapsedGroups[groupKey] || false
                
                return (
                  <Card key={groupKey} className="overflow-hidden">
                    {/* Collapsible Header */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => toggleGroupCollapse(groupKey)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {promptText}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {groupDate?.toLocaleString()} • {decisions.length} insight{decisions.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            exportGroupAsJSON(groupKey, decisions)
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            exportGroupAsMarkdown(groupKey, decisions)
                          }}
                        >
                          <FileDown className="w-3 h-3" />
                        </Button>
                        {isCollapsed ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {!isCollapsed && (
                      <div className="p-4 pt-0 space-y-3">
                        {decisions.map((decision, idx) => (
                          <Card
                            key={decision._id}
                            className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
                            onClick={() => navigate(`/decisions/${decision._id}`)}
                          >
                            <CardBody className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {decision.decision}
                                    </h3>
                                    <Badge variant={decision.category}>{decision.category}</Badge>
                                    {decision.confidenceScore && (
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                        decision.confidenceScore >= 80 
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                          : decision.confidenceScore >= 60 
                                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                      }`}>
                                        {decision.confidenceScore}%
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {decision.summary || decision.rationale}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })
            })()}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card className="max-w-2xl w-full animate-scale-in">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Upload Documents
                </h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setFiles([])
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="text-2xl text-gray-500">×</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* File Drop Zone */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Supported: TXT, MD, PDF, DOCX, CSV, JSON, XML, LOG
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".txt,.md,.pdf,.docx,.doc,.csv,.json,.xml,.log"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    Select Files
                  </label>
                </div>

                {/* Selected Files */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Selected Files ({files.length})
                    </h3>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {files.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowUploadModal(false)
                      setFiles([])
                    }}
                    className="flex-1"
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUploadFiles}
                    className="flex-1"
                    disabled={files.length === 0 || uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Custom Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="max-w-3xl w-full animate-scale-in my-8 max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-7 h-7 text-purple-500 flex-shrink-0" />
                  Strategic Analysis
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Select documents and define your analysis focus
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPromptModal(false)
                  setCustomPrompt('')
                  setSelectedDocuments([])
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={analyzing}
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                {/* Document Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Documents to Analyze *
                    </label>
                    <button
                      onClick={() => {
                        if (selectedDocuments.length === project.documents?.length) {
                          setSelectedDocuments([])
                        } else {
                          setSelectedDocuments(project.documents?.map(d => d._id) || [])
                        }
                      }}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      {selectedDocuments.length === project.documents?.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800/50">
                    {project.documents?.map((doc) => (
                      <label
                        key={doc._id}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocuments([...selectedDocuments, doc._id])
                            } else {
                              setSelectedDocuments(selectedDocuments.filter(id => id !== doc._id))
                            }
                          }}
                          className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {doc.filename || doc.title}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {doc.fileType || 'Document'} • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Selected: {selectedDocuments.length} of {project.documents?.length || 0} documents
                  </p>
                </div>

                {/* Analysis Focus */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Analysis Focus / Question *
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="What specific insight or decision do you need? Example: 'What are the key financial risks?' or 'Should we proceed with this initiative?'"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                {/* Decisions Per Document */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Insights to Extract
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={decisionsPerDoc}
                      onChange={(e) => setDecisionsPerDoc(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {decisionsPerDoc}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        total
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 AI will extract up to {decisionsPerDoc} key insight{decisionsPerDoc > 1 ? 's' : ''} total across all selected documents
                  </p>
                </div>

                {/* Quick Templates */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Common Analysis Questions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'What are the key risks?',
                      'What strategic decisions are needed?',
                      'What are the resource requirements?',
                      'What are the main opportunities?',
                      'Should we proceed with this initiative?'
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => setCustomPrompt(template)}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        disabled={analyzing}
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Analysis Summary */}
                {selectedDocuments.length > 0 && customPrompt.trim() && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">
                      ✓ Ready to Analyze
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      AI will extract up to {decisionsPerDoc} total insight{decisionsPerDoc > 1 ? 's' : ''} from {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} focused on: "{customPrompt.substring(0, 60)}{customPrompt.length > 60 ? '...' : ''}"
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowPromptModal(false)
                      setCustomPrompt('')
                      setSelectedDocuments([])
                    }}
                    className="flex-1"
                    disabled={analyzing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleAnalyzeProject(customPrompt)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    disabled={analyzing || selectedDocuments.length === 0 || !customPrompt.trim()}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {analyzing ? 'Analyzing...' : 'Analyze Documents'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons - Bottom Right */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40">
        {project.documents && project.documents.length > 0 && (
          <button
            onClick={handleDeleteAllDocuments}
            className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
            title="Delete All Documents"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}
        {project.decisions && project.decisions.length > 0 && (
          <button
            onClick={handleDeleteAllDecisions}
            className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
            title="Delete All Insights"
          >
            <Target className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
