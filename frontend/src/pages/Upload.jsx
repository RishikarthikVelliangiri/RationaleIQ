import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { documentsAPI } from '../services/api'
import Card, { CardHeader, CardBody } from '../components/Card'
import Button from '../components/Button'
import FileDropzone from '../components/FileDropzone'
import { Upload as UploadIcon, FileText, File } from 'lucide-react'
import toast from 'react-hot-toast'

const Upload = () => {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState('file') // 'text' or 'file' - default to file
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([]) // Changed to array for multiple files
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '')
  const [projects, setProjects] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleTextSubmit = async (e) => {
    e.preventDefault()
    if (!title || !content) {
      toast.error('Please provide title and content')
      return
    }

    setLoading(true)
    try {
      const response = await documentsAPI.create({
        title,
        content,
        source_type: 'text'
      })
      
      toast.success('Document created successfully')
      
      // Process the document
      const documentId = response.data._id || response.data.id
      await processDocument(documentId)
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.detail || 'Failed to create document')
      setLoading(false)
    }
  }

  const handleFileSubmit = async (e) => {
    e.preventDefault()
    if (files.length === 0) {
      toast.error('Please select at least one file')
      return
    }

    setLoading(true)
    let successCount = 0
    let failCount = 0
    
    try {
      // Upload and process each file
      for (const file of files) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          // Use filename as title (without extension)
          const titleFromFile = file.name.replace(/\.[^/.]+$/, '')
          formData.append('title', titleFromFile)
          formData.append('source_type', 'file')
          if (projectId) {
            formData.append('projectId', projectId)
          }

          const response = await documentsAPI.upload(formData)
          
          // Process the document
          const documentId = response.data._id || response.data.id
          await documentsAPI.process(documentId)
          
          successCount++
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          failCount++
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully uploaded and processed ${successCount} file(s)`)
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} file(s)`)
      }
      
      // Redirect to decisions page
      setTimeout(() => {
        navigate('/decisions')
      }, 1500)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setLoading(false)
      setProcessing(false)
    }
  }

  const processDocument = async (documentId) => {
    setProcessing(true)
    try {
      const response = await documentsAPI.process(documentId)
      toast.success(response.data.message)
      
      // Redirect to decisions page
      setTimeout(() => {
        navigate('/decisions')
      }, 1500)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process document')
    } finally {
      setLoading(false)
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto page-transition">
      {/* Header */}
      <div className="text-center animate-fade-in-up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
          Upload Document
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg">
          Upload a meeting transcript or document to extract decision rationales with AI
        </p>
      </div>

      {/* Project Selector */}
      {projects.length > 0 && (
        <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <CardBody className="p-5">
            <label htmlFor="project-select" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📁 Project (Optional)
            </label>
            <select
              id="project-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
            >
              <option value="">No Project (Standalone Document)</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              💡 Assign this document to a project to organize related documents together
            </p>
          </CardBody>
        </Card>
      )}

      {/* Mode Selector */}
      <div className="flex space-x-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <button
          onClick={() => setMode('file')}
          className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md ${
            mode === 'file'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 text-white shadow-lg shadow-purple-500/30 scale-105'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-lg'
          }`}
        >
          <File className="w-5 h-5 inline mr-2" />
          Upload File(s)
        </button>
        <button
          onClick={() => setMode('text')}
          className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md ${
            mode === 'text'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 text-white shadow-lg shadow-purple-500/30 scale-105'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-lg'
          }`}
        >
          <FileText className="w-5 h-5 inline mr-2" />
          Paste Text
        </button>
      </div>

      {/* Text Input Form */}
      {mode === 'text' && (
        <Card className="animate-scale-in">
          <CardHeader className="p-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">✍️ Paste Your Content</h2>
          </CardHeader>
          <CardBody className="p-5 pt-0">
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Document Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                  placeholder="e.g., Weekly Team Meeting - Jan 15, 2024"
                  required
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm transition-all shadow-sm hover:shadow-md"
                  placeholder="Paste your meeting transcript, notes, or discussion here..."
                  required
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  💡 Tip: Include context about decisions made and the reasoning behind them
                </p>
              </div>

              <Button type="submit" loading={loading || processing} className="w-full">
                {processing ? (
                  <>Processing Document...</>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* File Upload Form */}
      {mode === 'file' && (
        <Card className="animate-scale-in">
          <CardHeader className="p-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">📄 Upload File(s)</h2>
          </CardHeader>
          <CardBody className="p-5 pt-0">
            <form onSubmit={handleFileSubmit} className="space-y-4">
              <div>
                <label htmlFor="file-dropzone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Select Files (.txt, .md, .pdf, or .docx)
                </label>
                <FileDropzone
                  id="file-dropzone"
                  onFilesSelected={setFiles}
                  accept=".txt,.md,.pdf,.docx"
                  multiple={true}
                  maxSize={10 * 1024 * 1024}
                />
              </div>

              <Button type="submit" loading={loading || processing} disabled={files.length === 0} className="w-full">
                {processing ? (
                  <>Processing Document(s)...</>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Upload & Process {files.length > 0 ? `${files.length} File(s)` : ''}
                  </>
                )}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Info Card */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <CardBody className="p-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            What happens next?
          </h3>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full text-xs font-bold">
                1
              </span>
              <span className="flex-1">Your document is analyzed by AI to identify decisions</span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-full text-xs font-bold">
                2
              </span>
              <span className="flex-1">Rationales and context are extracted and summarized</span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gradient-to-br from-green-600 to-teal-600 text-white rounded-full text-xs font-bold">
                3
              </span>
              <span className="flex-1">Decisions are categorized and made searchable</span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gradient-to-br from-yellow-600 to-orange-600 text-white rounded-full text-xs font-bold">4</span>
              <span>You can search and reference them anytime with AI</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

export default Upload
