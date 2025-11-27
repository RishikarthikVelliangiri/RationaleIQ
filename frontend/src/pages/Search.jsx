import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchAPI, decisionsAPI } from '../services/api'
import api from '../services/api'
import Card, { CardHeader, CardBody } from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Search as SearchIcon, Calendar, Lightbulb, Sparkles, Filter, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const Search = () => {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchMode, setSearchMode] = useState('hybrid') // 'hybrid', 'semantic', or 'keyword'
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [embeddingsGenerated, setEmbeddingsGenerated] = useState(false)

  useEffect(() => {
    fetchCategories()
    checkEmbeddings()
    
    // Check if there's a query in the URL
    const urlQuery = searchParams.get('q')
    if (urlQuery) {
      setQuery(urlQuery)
      // Trigger search automatically
      setTimeout(() => {
        const form = document.querySelector('form')
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
        }
      }, 500)
    }
  }, [searchParams])

  const fetchCategories = async () => {
    try {
      const response = await decisionsAPI.getAll()
      const decisions = response.data
      const uniqueCategories = [...new Set(decisions.map(d => d.category))]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const checkEmbeddings = async () => {
    try {
      const response = await decisionsAPI.getAll()
      const decisions = response.data
      const hasEmbeddings = decisions.some(d => d.embedding && d.embedding.length > 0)
      setEmbeddingsGenerated(hasEmbeddings)
    } catch (error) {
      console.error('Error checking embeddings:', error)
    }
  }

  const generateEmbeddings = async () => {
    try {
      toast.loading('Generating AI embeddings for all decisions...', { id: 'embeddings' })
      const response = await api.post('/search/generate-embeddings', {})
      
      toast.success(`Generated embeddings for ${response.data.successCount} decisions!`, { id: 'embeddings' })
      setEmbeddingsGenerated(true)
    } catch (error) {
      toast.error('Error generating embeddings', { id: 'embeddings' })
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setLoading(true)
    setSearched(true)
    try {
      let response;
      
      if (searchMode === 'semantic') {
        // Semantic search
        response = await api.post('/search/semantic', {
          query,
          limit: 10,
          minSimilarity: 0.3,
          category: selectedCategory || undefined
        })
      } else if (searchMode === 'hybrid') {
        // Hybrid search (semantic + keyword)
        response = await api.post('/search/hybrid', {
          query,
          limit: 10,
          minScore: 0.2,
          category: selectedCategory || undefined
        })
      } else {
        // Legacy keyword search
        response = await searchAPI.search(query)
        setResults(response.data)
        setLoading(false)
        return
      }
      
      if (response.status === 200 || response.status === 201 || response.status === 204 || response.status === 304 || (response && response.data)) {
        const data = response.data || await response.json()
        setResults(data)
      } else {
        toast.error('Search failed. Please try again.')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exampleQueries = [
    'Why did we choose AWS?',
    'What were the cost considerations?',
    'Technical decisions about the database',
    'Team preferences for tools',
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto page-transition">
      {/* Header */}
      <div className="text-center animate-fade-in-up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
          Search Decisions
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg">
          Ask questions about past decisions and get instant AI-powered answers
        </p>
      </div>

      {/* Search Form */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardBody className="p-5">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What do you want to know?
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                  placeholder="e.g., Why did we choose React over Vue?"
                />
              </div>
            </div>

            {/* Search Options */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search Mode */}
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <select
                  value={searchMode}
                  onChange={(e) => setSearchMode(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="hybrid">🎯 Smart Search (AI + Keywords)</option>
                  <option value="semantic">🧠 AI Semantic Search</option>
                  <option value="keyword">🔤 Keyword Search</option>
                </select>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* AI Setup Notice */}
            {!embeddingsGenerated && (searchMode === 'semantic' || searchMode === 'hybrid') && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      AI-powered search requires one-time setup. Generate embeddings for all decisions to enable semantic search.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={generateEmbeddings}
                      className="text-yellow-700 dark:text-yellow-300 border-yellow-400 dark:border-yellow-600"
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      Generate AI Embeddings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              <SearchIcon className="w-4 h-4 mr-2" />
              {searchMode === 'semantic' ? 'AI Search' : searchMode === 'hybrid' ? 'Smart Search' : 'Search'}
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Example Queries */}
      {!searched && (
        <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              Try these example searches
            </h2>
          </CardHeader>
          <CardBody className="p-5 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(example)
                  }}
                  className="text-left px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all hover:shadow-md animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{example}</span>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* AI Answer */}
      {results?.answer && (
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 animate-scale-in">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 p-5">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              AI Answer
            </h2>
          </CardHeader>
          <CardBody className="p-5">
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{results.answer}</p>
          </CardBody>
        </Card>
      )}

      {/* Search Results */}
      {results?.results && results.results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {results.results.length} {results.results.length === 1 ? 'Result' : 'Results'}
            </h2>
            {results.searchType && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {results.searchType === 'hybrid' ? '🎯 Smart Search' : '🧠 Semantic Search'}
              </span>
            )}
          </div>
          
          {results.results.map((decision) => {
            const score = decision.similarityScore || decision.searchScore;
            const scorePercent = score ? Math.round(score * 100) : null;
            
            return (
              <Card key={decision._id} className="card-hover animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <CardBody className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Link 
                      to={`/decisions/${decision._id}`}
                      className="flex-1 pr-4"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                        {decision.decision}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {scorePercent && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <TrendingUp className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                            {scorePercent}% match
                          </span>
                        </div>
                      )}
                      <Badge variant={decision.category}>{decision.category}</Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rationale:</h4>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{decision.rationale}</p>
                  </div>

                  {decision.summary && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Summary:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">{decision.summary}</p>
                    </div>
                  )}

                  {decision.matchedKeywords && decision.matchedKeywords.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1.5">
                        {decision.matchedKeywords.map((keyword, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(decision.extractedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    {decision.confidenceScore && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        AI Confidence: {decision.confidenceScore}%
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* No Results */}
      {searched && results?.results && results.results.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try rephrasing your question or use different keywords.
            </p>
            <Button variant="outline" onClick={() => setQuery('')}>
              Clear Search
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default Search
