import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, FileText, Calendar, AlertTriangle, Folder, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/Card'
import Button from '../components/Button'
import api from '../services/api'

export default function Documents() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [projects, setProjects] = useState([])
  const [groupedDocs, setGroupedDocs] = useState({})
  const [expandedGroups, setExpandedGroups] = useState({})
  const [loading, setLoading] = useState(true)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [showDeleteDecisions, setShowDeleteDecisions] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch documents
      const docsResponse = await fetch(`${import.meta.env.VITE_API_URL}/documents`)
      if (!docsResponse.ok) throw new Error('Failed to fetch documents')
      const docsData = await docsResponse.json()
      const docs = Array.isArray(docsData) ? docsData : []
      setDocuments(docs)
      
      // Fetch projects
      const projectsResponse = await fetch(`${import.meta.env.VITE_API_URL}/projects`)
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(Array.isArray(projectsData) ? projectsData : [])
      }
      
      // Group documents by project
      const grouped = {
        standalone: { name: 'Standalone Documents', documents: [] }
      }
      
      docs.forEach(doc => {
        if (doc.projectId) {
          if (!grouped[doc.projectId]) {
            grouped[doc.projectId] = { name: 'Unknown Project', documents: [] }
          }
          grouped[doc.projectId].documents.push(doc)
        } else {
          grouped.standalone.documents.push(doc)
        }
      })
      
      // Add project names
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        projectsData.forEach(project => {
          if (grouped[project._id]) {
            grouped[project._id].name = project.name
            grouped[project._id].projectId = project._id
          }
        })
      }
      
      setGroupedDocs(grouped)
      
      // Expand all groups by default
      const expanded = {}
      Object.keys(grouped).forEach(key => {
        expanded[key] = true
      })
      setExpandedGroups(expanded)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/${documentId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete document')
      
      toast.success('Document deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleClearAll = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/clear-all`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to clear documents')
      
      toast.success('All documents cleared successfully')
      setShowDeleteAll(false)
      fetchData()
    } catch (error) {
      console.error('Error clearing documents:', error)
      toast.error('Failed to clear documents')
    }
  }

  const handleClearDecisions = async () => {
    try {
      const response = await api.delete('/decisions/clear-all')
      toast.success(`${response.data.deletedCount} decisions cleared successfully`)
      setShowDeleteDecisions(false)
    } catch (error) {
      console.error('Error clearing decisions:', error)
      toast.error('Failed to clear decisions')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading documents...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Documents
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage all uploaded documents
          </p>
        </div>
        {documents.length > 0 && (
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={() => setShowDeleteDecisions(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Decisions
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteAll(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Documents
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {documents.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Grouped Documents List */}
      {documents.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No documents uploaded yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a project and upload documents to get started
            </p>
            <Button onClick={() => navigate('/projects')}>
              Go to Projects
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocs).map(([groupKey, group]) => {
            if (group.documents.length === 0) return null
            
            return (
              <Card key={groupKey} className="overflow-hidden">
                {/* Group Header */}
                <div 
                  className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-5 cursor-pointer hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-all border-b-2 border-gray-200 dark:border-gray-700"
                  onClick={() => toggleGroup(groupKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {group.name}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {group.documents.length} document{group.documents.length !== 1 ? 's' : ''}
                          {group.projectId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/projects/${group.projectId}`)
                              }}
                              className="ml-3 text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              View Project →
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {expandedGroups[groupKey] ? (
                        <ChevronUp className="w-6 h-6" />
                      ) : (
                        <ChevronDown className="w-6 h-6" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents in Group */}
                {expandedGroups[groupKey] && (
                  <div className="p-4 space-y-4">
                    {group.documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Icon */}
                            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl shadow-sm">
                              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {doc.filename}
                              </h3>
                              
                              <div className="flex flex-wrap items-center gap-3 mb-3">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(doc.uploadedAt)}
                                </div>
                                <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">
                                  {doc.fileType || 'TXT'}
                                </div>
                                {doc.content && (
                                  <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full text-xs font-medium text-purple-700 dark:text-purple-300">
                                    {doc.content.length} chars
                                  </div>
                                )}
                              </div>

                              {doc.content && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
                                    {doc.content.substring(0, 150)}...
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAll && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Clear All Documents?
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This will permanently delete all {documents.length} documents and their associated decisions. 
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteAll(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleClearAll}
                  className="flex-1"
                >
                  Delete All
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete All Decisions Modal */}
      {showDeleteDecisions && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Clear All Decisions?
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This will permanently delete all extracted decisions from all documents. 
                The documents themselves will remain. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteDecisions(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleClearDecisions}
                  className="flex-1"
                >
                  Delete All Decisions
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
