import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Calendar, Tag, FileText, Lightbulb, GitBranch, Target, CheckCircle, TrendingUp, Shield, Zap, MessageCircle, Send, X, Download, FileDown } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import toast from 'react-hot-toast'
import recentlyViewedManager from '../utils/recentlyViewed'
import { decisionsAPI } from '../services/api'
import api from '../services/api'

// Helper function to parse AI explanation into structured sections
const parseAiExplanation = (text) => {
  if (!text) return null
  
  const sections = []
  const lines = text.split('\n')
  let currentSection = null
  
  lines.forEach(line => {
    const trimmed = line.trim()
    
    // Check for section headers (## Header)
    if (trimmed.startsWith('##')) {
      if (currentSection) sections.push(currentSection)
      currentSection = {
        title: trimmed.replace(/^##\s*/, ''),
        content: [],
        type: 'section'
      }
    } 
    // Check for bullet points
    else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      if (currentSection) {
        currentSection.content.push({
          type: 'bullet',
          text: trimmed.replace(/^[-•]\s*/, '')
        })
      }
    }
    // Check for numbered lists
    else if (/^\d+\.\s/.test(trimmed)) {
      if (currentSection) {
        currentSection.content.push({
          type: 'numbered',
          text: trimmed.replace(/^\d+\.\s*/, '')
        })
      }
    }
    // Regular paragraph
    else if (trimmed.length > 0) {
      if (currentSection) {
        currentSection.content.push({
          type: 'paragraph',
          text: trimmed
        })
      }
    }
  })
  
  if (currentSection) sections.push(currentSection)
  return sections
}

// Icon mapping for section titles
const getSectionIcon = (title) => {
  const titleLower = title.toLowerCase()
  if (titleLower.includes('overview') || titleLower.includes('summary')) return Lightbulb
  if (titleLower.includes('matter') || titleLower.includes('benefit')) return TrendingUp
  if (titleLower.includes('consideration') || titleLower.includes('factor')) return Target
  if (titleLower.includes('risk') || titleLower.includes('challenge')) return Shield
  if (titleLower.includes('implementation') || titleLower.includes('path')) return GitBranch
  if (titleLower.includes('success') || titleLower.includes('metric')) return CheckCircle
  return Zap
}

export default function DecisionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [decision, setDecision] = useState(null)
  const [sourceDocuments, setSourceDocuments] = useState([])
  const [expandedDocId, setExpandedDocId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiExplanation, setAiExplanation] = useState('')
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [flowchartData, setFlowchartData] = useState(null)
  const [loadingFlowchart, setLoadingFlowchart] = useState(false)
  
  // Alternative analyses state
  const [alternativeAnalyses, setAlternativeAnalyses] = useState([])
  const [loadingAlternatives, setLoadingAlternatives] = useState(false)
  const [activeAnalysisTab, setActiveAnalysisTab] = useState(0) // 0 = main, 1-2 = alternatives
  
  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showChatHint, setShowChatHint] = useState(false)

  useEffect(() => {
    fetchDecision()
  }, [id])

  useEffect(() => {
    // Show chat hint after 2 seconds
    const timer = setTimeout(() => {
      setShowChatHint(true)
    }, 2000)

    // Auto-hide after 5 seconds
    const hideTimer = setTimeout(() => {
      setShowChatHint(false)
    }, 7000)

    return () => {
      clearTimeout(timer)
      clearTimeout(hideTimer)
    }
  }, [])

  const fetchDecision = async () => {
    try {
      setLoading(true)
      const response = await decisionsAPI.getOne(id)
      const data = response.data
      setDecision(data)
      
      // Track this decision as recently viewed
      recentlyViewedManager.add(data)
      
      // Extract source documents (populated from backend)
      if (data.sourceDocumentIds && data.sourceDocumentIds.length > 0) {
        setSourceDocuments(data.sourceDocumentIds)
      } else if (data.documentId) {
        // Fallback to single document for older decisions
        const doc = typeof data.documentId === 'object' ? data.documentId : null
        if (doc) {
          setSourceDocuments([doc])
        }
      }
      
      // Auto-generate explanation
      generateExplanation(data)
      generateFlowchart(data)
    } catch (error) {
      console.error('Error fetching decision:', error)
      toast.error('Failed to load decision')
    } finally {
      setLoading(false)
    }
  }

  const generateExplanation = async (decisionData) => {
    try {
      setLoadingExplanation(true)
      
      // Create a detailed prompt for structured explanation
      const prompt = `Analyze this business decision and provide a CONCISE, structured explanation:

Decision: "${decisionData.decision}"
Category: ${decisionData.category}
Rationale: ${decisionData.rationale}

Please provide your analysis in this format (keep each section to 2-4 SHORT bullet points max):

## Why This Matters
- [One key benefit]
- [Another key benefit]

## Key Considerations
- [Important factor 1]
- [Important factor 2]

## Potential Risks
- [Main risk]
- [Secondary concern]

## Implementation Path
1. [Step 1 - brief]
2. [Step 2 - brief]
3. [Step 3 - brief]

Keep bullet points to ONE line each. Be extremely concise and actionable.`
      
      const response = await api.post('/ai/explain', { prompt })
      setAiExplanation(response.data.explanation)
    } catch (error) {
      console.error('Error generating explanation:', error)
      setAiExplanation('Unable to generate explanation at this time.')
    } finally {
      setLoadingExplanation(false)
    }
  }

  const generateAlternativeAnalyses = async () => {
    if (!decision) return;
    
    try {
      setLoadingAlternatives(true);
      const perspectives = [
        {
          name: 'Risk-Focused Perspective',
          prompt: `Analyze this decision from a RISK MANAGEMENT perspective:

Decision: "${decision.decision}"
Rationale: ${decision.rationale}

Provide analysis in this format (2-3 bullet points per section):

## Risk Assessment
- [Key risk 1]
- [Key risk 2]

## Mitigation Strategies
- [Strategy 1]
- [Strategy 2]

## Early Warning Signs
- [Indicator 1]
- [Indicator 2]

## Contingency Plans
1. [Plan A]
2. [Plan B]`
        },
        {
          name: 'Opportunity-Focused Perspective',
          prompt: `Analyze this decision from an OPPORTUNITY and GROWTH perspective:

Decision: "${decision.decision}"
Rationale: ${decision.rationale}

Provide analysis in this format (2-3 bullet points per section):

## Growth Opportunities
- [Opportunity 1]
- [Opportunity 2]

## Strategic Advantages
- [Advantage 1]
- [Advantage 2]

## Scaling Potential
- [Potential 1]
- [Potential 2]

## Innovation Pathways
1. [Pathway 1]
2. [Pathway 2]`
        }
      ];

      const analyses = [];
      for (const perspective of perspectives) {
        const response = await api.post('/ai/explain', { prompt: perspective.prompt });
        analyses.push({
          name: perspective.name,
          content: response.data.explanation
        });
      }

      setAlternativeAnalyses(analyses);
      if (analyses.length > 0) {
        toast.success(`Generated ${analyses.length} alternative perspectives`);
      }
    } catch (error) {
      console.error('Error generating alternative analyses:', error);
      toast.error('Failed to generate alternative perspectives');
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const generateFlowchart = async (decisionData) => {
    try {
      setLoadingFlowchart(true)
      
      const prompt = `Based on this decision, create the MOST APPROPRIATE visualization. DO NOT default to pie charts - choose based on the content.

Decision: "${decisionData.decision}"
Category: ${decisionData.category}
Rationale: ${decisionData.rationale}

**VISUALIZATION SELECTION GUIDE:**

**Use TIMELINE if:**
- Decision involves phases, steps, or chronological sequence
- Implementation roadmap or process flow
- Before/during/after scenarios

**Use COMPARISON if:**
- Comparing 2-4 distinct options or alternatives
- Side-by-side evaluation of choices
- Different approaches being considered

**Use PROSCONS if:**
- Clear advantages and disadvantages discussed
- Trade-offs or risk/benefit analysis
- Arguments for and against

**Use BARCHART if:**
- Comparing numeric quantities or metrics
- Rankings or performance comparison
- Budget items or cost categories (use numbers like 50000, not percentages)

**Use PIECHART ONLY if:**
- Explicit percentages that sum to 100%
- Clear part-of-whole relationships with percentages
- Distribution across categories (market share, budget %)

**Use LINECHART if:**
- Growth, trends, or progression over time
- Performance trajectory
- Forecast or projection

**Use STAKEHOLDERS/IMPACT/FLOW for:**
- People/groups affected
- Impact levels (high/medium/low)
- Process flows without clear timeline

Return JSON:
{
  "type": "timeline|comparison|proscons|barchart|piechart|linechart|stakeholders|impact|flow",
  "title": "Descriptive title",
  "items": [
    {
      "label": "Item name",
      "value": "For charts: NUMBER only. For others: description text",
      "color": "blue|green|orange|red|purple|teal|pink|indigo"
    }
  ]
}

CRITICAL: 
- Choose visualization based on decision content, NOT category
- For barchart/linechart: value must be plain NUMBER (e.g., 50000, not "$50k")
- For piechart: use ONLY if percentages are explicit (values sum to 100)
- For timeline/comparison/proscons: value is TEXT description
- Return 4-6 items

Return ONLY valid JSON, no other text.`
      
      const response = await api.post('/ai/explain', { prompt })
      
      try {
        // Extract JSON from response
        const jsonMatch = response.data.explanation.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          setFlowchartData(JSON.parse(jsonMatch[0]))
        }
      } catch (e) {
        console.error('Failed to parse visualization JSON:', e)
      }
    } catch (error) {
      console.error('Error generating visualization:', error)
    } finally {
      setLoadingFlowchart(false)
    }
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    
    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      const prompt = `You are helping someone understand this business decision:

Decision: "${decision.decision}"
Category: ${decision.category}
Rationale: ${decision.rationale}

User's question: ${userMessage}

Provide a clear, concise answer (2-3 sentences max) that directly addresses their question about this specific decision.`

      const response = await api.post('/ai/explain', { prompt })
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.explanation }])
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Technical': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Cost': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Operational': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Strategic': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
    return colors[category] || colors['Other']
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Export functions
  const exportAsJSON = () => {
    const exportData = {
      decision: decision.decision,
      category: decision.category,
      summary: decision.summary,
      rationale: decision.rationale,
      confidenceScore: decision.confidenceScore,
      evidenceQuotes: decision.evidenceQuotes,
      aiReasoning: decision.aiReasoning,
      extractedAt: decision.extractedAt,
      sourceDocuments: sourceDocuments.map(doc => ({
        filename: doc.filename || doc.title,
        type: doc.fileType,
        uploadedAt: doc.uploadedAt
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `decision-${decision._id}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported as JSON')
  }

  const exportAsMarkdown = () => {
    let markdown = `# ${decision.decision}\n\n`
    markdown += `**Category:** ${decision.category}\n\n`
    markdown += `**Date:** ${formatDate(decision.extractedAt)}\n\n`
    
    if (decision.confidenceScore) {
      markdown += `**Confidence Score:** ${decision.confidenceScore}/100\n\n`
    }
    
    markdown += `## Summary\n\n${decision.summary}\n\n`
    markdown += `## Rationale\n\n${decision.rationale}\n\n`
    
    if (decision.evidenceQuotes && decision.evidenceQuotes.length > 0) {
      markdown += `## Supporting Evidence\n\n`
      decision.evidenceQuotes.forEach((quote, idx) => {
        markdown += `${idx + 1}. "${quote}"\n`
      })
      markdown += `\n`
    }
    
    if (decision.aiReasoning) {
      markdown += `## AI Analysis\n\n${decision.aiReasoning}\n\n`
    }
    
    if (sourceDocuments.length > 0) {
      markdown += `## Source Documents\n\n`
      sourceDocuments.forEach(doc => {
        markdown += `- ${doc.filename || doc.title} (${doc.fileType})\n`
      })
    }
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `decision-${decision._id}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported as Markdown')
  }

  const exportAsPDF = () => {
    toast.info('PDF export coming soon! Use Markdown for now.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading decision...</div>
      </div>
    )
  }

  if (!decision) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Decision not found</h2>
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const projectId = decision.projectId?._id || decision.projectId

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header with Back and Export Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="secondary" onClick={() => navigate(projectId ? `/projects/${projectId}` : '/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportAsJSON}>
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={exportAsMarkdown}>
            <FileDown className="w-4 h-4 mr-2" />
            Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={exportAsPDF}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6 animate-slide-in-left">
          {/* Decision Header */}
          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(decision.category)}`}>
                    {decision.category}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(decision.extractedAt)}
                  </span>
                </div>
                {/* Workflow Status */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
                  <select
                    value={decision.status || 'draft'}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        await api.patch(`/decisions/${decision._id}/status`, { status: newStatus });
                        setDecision({ ...decision, status: newStatus });
                        toast.success(`Status updated to ${newStatus}`);
                      } catch (error) {
                        console.error('Status update error:', error);
                        toast.error('Failed to update status');
                      }
                    }}
                    className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium cursor-pointer hover:border-primary-400 transition-colors"
                  >
                    <option value="draft">📝 Draft</option>
                    <option value="review">👀 Review</option>
                    <option value="approved">✅ Approved</option>
                    <option value="implemented">🚀 Implemented</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>
              </div>
              
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {decision.decision}
              </h1>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {decision.summary}
              </p>
            </div>
          </Card>

          {/* AI Transparency - Confidence & Evidence */}
          {(decision.confidenceScore || decision.evidenceQuotes?.length > 0 || decision.aiReasoning) && (
            <Card className="animate-fade-in-up">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    AI Transparency
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Confidence Score */}
                  {decision.confidenceScore && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Confidence Score
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                decision.confidenceScore >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                decision.confidenceScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                              style={{ width: `${decision.confidenceScore}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white min-w-[45px]">
                          {decision.confidenceScore}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                        {decision.confidenceScore >= 80 ? '✓ High confidence' :
                         decision.confidenceScore >= 60 ? '⚠ Moderate confidence' :
                         '⚠ Low confidence'}
                      </p>
                    </div>
                  )}

                  {/* Evidence Quotes */}
                  {decision.evidenceQuotes && decision.evidenceQuotes.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Evidence from Source Documents
                      </h3>
                      <div className="space-y-2">
                        {decision.evidenceQuotes.map((quote, idx) => (
                          <div 
                            key={idx}
                            className="group bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-l-3 border-blue-500 p-2.5 rounded-r-md animate-fade-in-up hover:shadow-md transition-all cursor-pointer"
                            style={{ animationDelay: `${idx * 100}ms` }}
                            onClick={() => {
                              // Scroll to source documents section
                              const sourceSection = document.getElementById('source-documents');
                              if (sourceSection) {
                                sourceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                // Highlight the section briefly
                                sourceSection.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
                                setTimeout(() => {
                                  sourceSection.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
                                }, 2000);
                              }
                            }}
                          >
                            <p className="text-xs italic text-gray-700 dark:text-gray-300 mb-1.5">
                              "{quote}"
                            </p>
                            <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <FileText className="w-3 h-3" />
                              View in source documents
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Reasoning */}
                  {decision.aiReasoning && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        How AI Identified This
                      </h3>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          {decision.aiReasoning}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* AI Explanation */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    AI Analysis
                  </h2>
                </div>
                {!loadingAlternatives && alternativeAnalyses.length === 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateAlternativeAnalyses}
                    className="text-xs"
                  >
                    <GitBranch className="w-3 h-3 mr-1.5" />
                    Alternative Perspectives
                  </Button>
                )}
              </div>

              {/* Tabs for different perspectives */}
              {alternativeAnalyses.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActiveAnalysisTab(0)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      activeAnalysisTab === 0
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Lightbulb className="w-3 h-3 inline mr-1" />
                    Main Analysis
                  </button>
                  {alternativeAnalyses.map((analysis, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveAnalysisTab(idx + 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        activeAnalysisTab === idx + 1
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <GitBranch className="w-3 h-3 inline mr-1" />
                      {analysis.name}
                    </button>
                  ))}
                </div>
              )}
              
              {(loadingExplanation || loadingAlternatives) ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-purple-600"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {loadingAlternatives ? 'Generating alternative perspectives...' : 'Analyzing...'}
                  </p>
                </div>
              ) : (activeAnalysisTab === 0 && aiExplanation) || (activeAnalysisTab > 0 && alternativeAnalyses[activeAnalysisTab - 1]) ? (
                <div className="space-y-3">
                  {parseAiExplanation(activeAnalysisTab === 0 ? aiExplanation : alternativeAnalyses[activeAnalysisTab - 1]?.content)?.map((section, idx) => {
                    const IconComponent = getSectionIcon(section.title)
                    const colors = [
                      'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800',
                      'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800',
                      'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800',
                      'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800',
                      'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800',
                      'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800'
                    ]
                    const colorClass = colors[idx % colors.length]
                    
                    return (
                      <div key={idx} className={`bg-gradient-to-br ${colorClass} border rounded-lg p-3 transition-all hover:shadow-md`}>
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                            {section.title}
                          </h3>
                        </div>
                        
                        <div className="space-y-1.5">
                          {section.content.map((item, itemIdx) => {
                            if (item.type === 'bullet') {
                              return (
                                <div key={itemIdx} className="flex items-start gap-1.5 ml-0.5">
                                  <span className="text-sm leading-none mt-0.5 text-gray-700 dark:text-gray-300">•</span>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug flex-1">
                                    {item.text}
                                  </p>
                                </div>
                              )
                            } else if (item.type === 'numbered') {
                              return (
                                <div key={itemIdx} className="flex items-start gap-1.5 ml-0.5">
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5 min-w-[1.2rem]">
                                    {itemIdx + 1}.
                                  </span>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug flex-1">
                                    {item.text}
                                  </p>
                                </div>
                              )
                            } else {
                              return (
                                <p key={itemIdx} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {item.text}
                                </p>
                              )
                            }
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">No explanation available</p>
                </div>
              )}
            </div>
          </Card>

          {/* AI-Generated Visual Representation */}
          <Card>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg">
                  <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {flowchartData?.title || 'Visual Representation'}
                </h2>
              </div>
              
              {loadingFlowchart ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-orange-600"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Generating...</p>
                </div>
              ) : flowchartData && flowchartData.items && flowchartData.items.length > 0 ? (
                <div className="relative">
                  {/* Pie Chart */}
                  {flowchartData.type === 'piechart' && (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="relative w-48 h-48">
                          {(() => {
                            const total = flowchartData.items.reduce((sum, item) => sum + parseFloat(item.value || 0), 0)
                            let currentAngle = -90 // Start at top
                            
                            return (
                              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-0">
                                {flowchartData.items.map((item, idx) => {
                                  const percentage = (parseFloat(item.value || 0) / total) * 100
                                  const angle = (percentage / 100) * 360
                                  const startAngle = currentAngle
                                  const endAngle = currentAngle + angle
                                  currentAngle = endAngle
                                  
                                  // Convert angles to radians and calculate coordinates
                                  const startRad = (startAngle * Math.PI) / 180
                                  const endRad = (endAngle * Math.PI) / 180
                                  const largeArc = angle > 180 ? 1 : 0
                                  
                                  const x1 = 100 + 80 * Math.cos(startRad)
                                  const y1 = 100 + 80 * Math.sin(startRad)
                                  const x2 = 100 + 80 * Math.cos(endRad)
                                  const y2 = 100 + 80 * Math.sin(endRad)
                                  
                                  const colorMap = {
                                    blue: '#3B82F6', green: '#10B981', orange: '#F97316', red: '#EF4444',
                                    purple: '#A855F7', teal: '#14B8A6', pink: '#EC4899', indigo: '#6366F1'
                                  }
                                  
                                  const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`
                                  
                                  return (
                                    <path
                                      key={idx}
                                      d={pathData}
                                      fill={colorMap[item.color] || colorMap.blue}
                                      stroke="white"
                                      strokeWidth="2"
                                      className="hover:opacity-80 transition-opacity cursor-pointer"
                                    />
                                  )
                                })}
                                {/* Center circle for donut effect */}
                                <circle cx="100" cy="100" r="45" fill="white" className="dark:fill-gray-800" />
                                <text x="100" y="95" textAnchor="middle" className="text-xs font-bold fill-gray-900 dark:fill-white">
                                  Total
                                </text>
                                <text x="100" y="110" textAnchor="middle" className="text-sm font-bold fill-gray-900 dark:fill-white">
                                  {total.toFixed(0)}
                                </text>
                              </svg>
                            )
                          })()}
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="grid grid-cols-2 gap-2">
                        {flowchartData.items.map((item, idx) => {
                          const total = flowchartData.items.reduce((sum, i) => sum + parseFloat(i.value || 0), 0)
                          const percentage = ((parseFloat(item.value || 0) / total) * 100).toFixed(1)
                          const colorMap = {
                            blue: 'bg-blue-500', green: 'bg-green-500', orange: 'bg-orange-500', red: 'bg-red-500',
                            purple: 'bg-purple-500', teal: 'bg-teal-500', pink: 'bg-pink-500', indigo: 'bg-indigo-500'
                          }
                          
                          return (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div className={`w-3 h-3 rounded-full ${colorMap[item.color] || colorMap.blue} flex-shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{item.label}</p>
                                <p className="text-[10px] text-gray-600 dark:text-gray-400">{percentage}% • {item.value}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bar Chart */}
                  {flowchartData.type === 'barchart' && (
                    <div className="space-y-2">
                      {(() => {
                        const maxValue = Math.max(...flowchartData.items.map(item => parseFloat(item.value || 0)))
                        const colorMap = {
                          blue: 'bg-blue-500', green: 'bg-green-500', orange: 'bg-orange-500', red: 'bg-red-500',
                          purple: 'bg-purple-500', teal: 'bg-teal-500', pink: 'bg-pink-500', indigo: 'bg-indigo-500'
                        }
                        
                        return flowchartData.items.map((item, idx) => {
                          const value = parseFloat(item.value || 0)
                          const percentage = (value / maxValue) * 100
                          
                          return (
                            <div key={idx} className="space-y-0.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-900 dark:text-white truncate flex-1">{item.label}</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300 ml-2">
                                  {value.toLocaleString()}
                                </span>
                              </div>
                              <div className="relative h-7 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                                <div
                                  className={`absolute left-0 top-0 h-full ${colorMap[item.color] || colorMap.blue} transition-all duration-1000 ease-out flex items-center justify-end px-2`}
                                  style={{ width: `${percentage}%` }}
                                >
                                  <span className="text-white text-[10px] font-bold">{percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}

                  {/* Line Chart */}
                  {flowchartData.type === 'linechart' && (
                    <div className="space-y-3">
                      <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-3">
                        {(() => {
                          const values = flowchartData.items.map(item => parseFloat(item.value || 0))
                          const maxValue = Math.max(...values)
                          const minValue = Math.min(...values)
                          const range = maxValue - minValue || 1
                          
                          const points = flowchartData.items.map((item, idx) => {
                            const x = (idx / (flowchartData.items.length - 1)) * 100
                            const normalizedValue = (parseFloat(item.value || 0) - minValue) / range
                            const y = 100 - (normalizedValue * 80) // Invert Y and leave 20% padding
                            return { x, y, value: item.value, label: item.label }
                          })
                          
                          const pathData = points.map((p, i) => 
                            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                          ).join(' ')
                          
                          return (
                            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                              {/* Grid lines */}
                              {[0, 25, 50, 75, 100].map(y => (
                                <line
                                  key={y}
                                  x1="0" y1={y} x2="100" y2={y}
                                  stroke="currentColor"
                                  strokeWidth="0.2"
                                  className="text-gray-300 dark:text-gray-600"
                                />
                              ))}
                              
                              {/* Area under line */}
                              <path
                                d={`${pathData} L 100 100 L 0 100 Z`}
                                fill="url(#lineGradient)"
                                opacity="0.3"
                              />
                              
                              {/* Line */}
                              <path
                                d={pathData}
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="0.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              
                              {/* Data points */}
                              {points.map((point, idx) => (
                                <g key={idx}>
                                  <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="1.5"
                                    fill="white"
                                    stroke="#3B82F6"
                                    strokeWidth="0.8"
                                    className="hover:r-2 transition-all cursor-pointer"
                                  />
                                </g>
                              ))}
                              
                              <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#3B82F6" />
                                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                            </svg>
                          )
                        })()}
                      </div>
                      
                      {/* X-axis labels */}
                      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${flowchartData.items.length}, 1fr)` }}>
                        {flowchartData.items.map((item, idx) => (
                          <div key={idx} className="text-center">
                            <p className="text-[10px] font-semibold text-gray-900 dark:text-white truncate">{item.label}</p>
                            <p className="text-[10px] text-gray-600 dark:text-gray-400">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline View */}
                  {flowchartData.type === 'timeline' && (
                    <div className="space-y-2">
                      {flowchartData.items.map((item, idx) => {
                        const colorClasses = {
                          blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700',
                          green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700',
                          orange: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-300 dark:border-orange-700',
                          red: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700',
                          purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-300 dark:border-purple-700',
                          teal: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-300 dark:border-teal-700'
                        }
                        
                        return (
                          <div key={idx} className="relative">
                            <div className={`bg-gradient-to-br ${colorClasses[item.color] || colorClasses.blue} p-3 rounded-lg border transition-all hover:shadow-md`}>
                              <div className="flex items-start gap-2">
                                <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-700 dark:border-gray-300 flex items-center justify-center font-bold text-gray-900 dark:text-white flex-shrink-0 text-xs">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 text-xs">
                                    {item.label}
                                  </h3>
                                  <p className="text-xs text-gray-700 dark:text-gray-300">
                                    {item.value}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {idx < flowchartData.items.length - 1 && (
                              <div className="flex justify-center my-1">
                                <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600"></div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Pros/Cons View */}
                  {flowchartData.type === 'proscons' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5 mb-2">
                          <CheckCircle className="w-4 h-4" />
                          Pros
                        </h3>
                        {flowchartData.items.filter((_, idx) => idx % 2 === 0).map((item, idx) => (
                          <div key={idx} className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-2.5 rounded-lg border border-green-300 dark:border-green-700">
                            <div className="flex items-start gap-1.5">
                              <span className="text-sm text-green-600 dark:text-green-400 mt-0.5">✓</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white text-xs">{item.label}</p>
                                <p className="text-[10px] text-gray-700 dark:text-gray-300 mt-0.5">{item.value}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5 mb-2">
                          <Shield className="w-4 h-4" />
                          Cons
                        </h3>
                        {flowchartData.items.filter((_, idx) => idx % 2 === 1).map((item, idx) => (
                          <div key={idx} className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-2.5 rounded-lg border border-red-300 dark:border-red-700">
                            <div className="flex items-start gap-1.5">
                              <span className="text-sm text-red-600 dark:text-red-400 mt-0.5">✗</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white text-xs">{item.label}</p>
                                <p className="text-[10px] text-gray-700 dark:text-gray-300 mt-0.5">{item.value}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comparison View */}
                  {flowchartData.type === 'comparison' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {flowchartData.items.map((item, idx) => {
                        const colorClasses = {
                          blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700',
                          green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700',
                          orange: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-300 dark:border-orange-700',
                          red: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700',
                          purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-300 dark:border-purple-700',
                          teal: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-300 dark:border-teal-700'
                        }
                        
                        return (
                          <div key={idx} className={`bg-gradient-to-br ${colorClasses[item.color] || colorClasses.blue} p-3 rounded-lg border transition-all hover:shadow-md`}>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-xs">
                              {item.label}
                            </h3>
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                              {item.value}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Default: Flow/Process/Stakeholders */}
                  {(!flowchartData.type || flowchartData.type === 'flow' || flowchartData.type === 'stakeholders' || flowchartData.type === 'costbenefit' || flowchartData.type === 'roadmap' || flowchartData.type === 'matrixgrid' || flowchartData.type === 'impact') && (
                    <div className={flowchartData.type === 'matrixgrid' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
                      {flowchartData.items.map((item, idx) => {
                        const colorClasses = {
                          blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700',
                          green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700',
                          orange: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-300 dark:border-orange-700',
                          red: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700',
                          purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-300 dark:border-purple-700',
                          teal: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-300 dark:border-teal-700'
                        }
                        
                        return (
                          <div key={idx} className={`bg-gradient-to-br ${colorClasses[item.color] || colorClasses.blue} p-3 rounded-lg border transition-all hover:shadow-md`}>
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                                {flowchartData.type === 'matrixgrid' ? '•' : idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 text-xs truncate">
                                  {item.label}
                                </h3>
                                <p className="text-xs text-gray-700 dark:text-gray-300">
                                  {item.value}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 italic">Visualization not available</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Key Insights */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Key Insights
              </h2>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Category
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{decision.category}</p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Rationale
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {decision.rationale}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Extracted On
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{formatDate(decision.extractedAt)}</p>
                </div>
                
                {document && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Source Document
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{document.filename || document.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Uploaded: {formatDate(document.uploadedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Source Documents - Full Content */}
          {sourceDocuments && sourceDocuments.length > 0 && (
            <Card id="source-documents" className="transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Source Documents ({sourceDocuments.length})
                  </h2>
                  <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded-full whitespace-nowrap flex-shrink-0">
                    {sourceDocuments.length} analyzed
                  </span>
                </div>
                
                <div className="space-y-4">
                  {sourceDocuments.map((doc, index) => {
                    const isExpanded = expandedDocId === doc._id
                    return (
                      <div 
                        key={doc._id || index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        {/* Document Header - Always visible and clickable */}
                        <button
                          onClick={() => setExpandedDocId(isExpanded ? null : doc._id)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <div className="text-left">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {doc.filename || doc.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {doc.fileType || 'TXT'} • {doc.content?.length.toLocaleString() || 0} characters
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {isExpanded ? 'Hide' : 'View'} Content
                            </span>
                            <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </button>

                        {/* Document Content - Expandable */}
                        {isExpanded && doc.content && (
                          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50">
                            <div className="max-h-[500px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                              <div className="space-y-3">
                                {doc.content.split('\n').map((line, idx) => {
                                  const trimmedLine = line.trim()
                                  if (!trimmedLine) return <div key={idx} className="h-2"></div>
                                  
                                  // Check if it's a heading
                                  const isHeading = trimmedLine.startsWith('#') || 
                                    (trimmedLine === trimmedLine.toUpperCase() && 
                                     trimmedLine.length < 80 && 
                                     trimmedLine.length > 3)
                                  
                                  return (
                                    <p 
                                      key={idx} 
                                      className={`leading-relaxed ${
                                        isHeading 
                                          ? 'font-bold text-gray-900 dark:text-white text-base mt-4' 
                                          : 'text-gray-700 dark:text-gray-300 text-sm'
                                      }`}
                                    >
                                      {trimmedLine.replace(/^#+\s*/, '')}
                                    </p>
                                  )
                                })}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3">
                              <span>{doc.content.length.toLocaleString()} characters</span>
                              <span>{doc.content.split(/\s+/).length.toLocaleString()} words</span>
                              <span>{doc.content.split('\n').length.toLocaleString()} lines</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 This insight was generated by analyzing all {sourceDocuments.length} document{sourceDocuments.length > 1 ? 's' : ''} together. Click on any document above to view its full content.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Chat Hint Popup */}
      {showChatHint && !chatOpen && (
        <div className="fixed bottom-24 right-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-2xl shadow-2xl z-40 animate-bounce">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Have questions? Ask me anything!</p>
            <button
              onClick={() => setShowChatHint(false)}
              className="ml-2 hover:bg-purple-800 rounded-lg p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Chatbot */}
      {!chatOpen ? (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full shadow-2xl transition-all hover:scale-110 z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      ) : (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-purple-200 dark:border-purple-700">
          {/* Chat Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Ask About This Decision</h3>
                <p className="text-xs text-purple-100">AI-powered clarification</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 hover:bg-purple-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <p className="text-sm">Ask me anything about this decision!</p>
                <p className="text-xs mt-2">Try: "What are the main risks?" or "How do we implement this?"</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
