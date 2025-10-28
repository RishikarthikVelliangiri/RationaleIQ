import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { dashboardAPI, decisionsAPI } from '../services/api'
import Card, { CardHeader, CardBody } from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { FileText, Folder, TrendingUp, Calendar, Upload, Clock, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import recentlyViewedManager from '../utils/recentlyViewed'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [quickSearch, setQuickSearch] = useState('')

  useEffect(() => {
    loadStats()
    loadRecentlyViewed()
  }, [])

  const loadRecentlyViewed = async () => {
    try {
      const recent = recentlyViewedManager.getAll()
      
      // Validate each decision still exists and belongs to current user
      const validatedRecent = []
      for (const item of recent) {
        try {
          // Try to fetch the decision - if it fails (401/404), it doesn't belong to this user
          const response = await decisionsAPI.getOne(item.id)
          if (response.data) {
            validatedRecent.push(item)
          }
        } catch (error) {
          // Decision doesn't exist or doesn't belong to this user - remove it
          recentlyViewedManager.remove(item.id)
        }
      }
      
      setRecentlyViewed(validatedRecent)
    } catch (error) {
      console.error('Error loading recently viewed:', error)
      setRecentlyViewed([])
    }
  }

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats()
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between animate-pulse">
          <div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>

        {/* Quick Search Skeleton */}
        <div className="h-12 max-w-2xl bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardBody className="p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <Card>
          <CardBody className="p-4 space-y-3 animate-pulse">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const handleQuickSearch = (e) => {
    e.preventDefault()
    if (quickSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickSearch)}`)
    }
  }

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Overview of your decision archive</p>
          </div>
          <Link to="/projects">
            <Button className="shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-shadow">
              <Folder className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Quick Search Bar */}
        <form onSubmit={handleQuickSearch} className="relative max-w-2xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Ask anything about your decisions... (Ctrl+K)"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
          />
        </form>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-hover animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Documents</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_documents || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-lg shadow-blue-500/10">
                <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="card-hover animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Decisions</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_decisions || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl shadow-lg shadow-green-500/10">
                <TrendingUp className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="card-hover animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Categories</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {Object.keys(stats?.categories || {}).length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl shadow-lg shadow-purple-500/10">
                <Calendar className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recently Viewed Decisions */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <Card className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <CardHeader className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-sm">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recently Viewed</h2>
              </div>
              <button
                onClick={() => {
                  recentlyViewedManager.clear()
                  setRecentlyViewed([])
                  toast.success('Cleared recently viewed')
                }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Clear
              </button>
            </div>
          </CardHeader>
          <CardBody className="p-5 pt-0">
            <div className="space-y-2">
              {recentlyViewed.map((item, index) => (
                <Link
                  key={item.id}
                  to={`/decisions/${item.id}`}
                  className="block p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all hover:shadow-md animate-slide-in-right border border-gray-200/50 dark:border-gray-700/50"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 mb-2">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Badge variant={item.category} className="text-[10px] px-2 py-1">
                          {item.category}
                        </Badge>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span>Viewed {new Date(item.viewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
      {/* Categories Breakdown */}
      {stats?.categories && Object.keys(stats.categories).length > 0 && (
        <Card className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <CardHeader className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Decision Categories</h2>
          </CardHeader>
          <CardBody className="p-5 pt-0">
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.categories).map(([category, count], index) => (
                <div 
                  key={category} 
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Badge variant={category}>{category}</Badge>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">({count})</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Projects & Insights */}
      {stats?.recent_projects && stats.recent_projects.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Projects & Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.recent_projects.map((project, index) => (
              <Card key={project._id} className="card-hover animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardBody className="p-5">
                  <Link to={`/projects/${project._id}`} className="block mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
                          <Folder className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        </div>
                        <span className="truncate">{project.name}</span>
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                        {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 ml-10">
                        {project.description}
                      </p>
                    )}
                  </Link>
                  
                  {project.decisions && project.decisions.length > 0 ? (
                    <div className="space-y-2 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      {project.decisions.map((decision) => (
                        <Link 
                          key={decision._id} 
                          to={`/decisions/${decision._id}`}
                          className="block p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all hover:shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                                {decision.decision}
                              </p>
                              <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-1">
                                {decision.rationale}
                              </p>
                            </div>
                            <Badge variant={decision.category} className="text-[10px] px-2 py-1 flex-shrink-0">
                              {decision.category}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                      No insights yet
                    </p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats?.total_documents === 0 && (
        <Card className="animate-scale-in">
          <CardBody className="text-center py-16">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl mb-6 shadow-lg shadow-purple-500/10">
              <FileText className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No documents yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Upload your first meeting transcript or document to start capturing decision rationales with AI.
            </p>
            <Link to="/upload">
              <Button className="shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-shadow">
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Document
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default Dashboard
