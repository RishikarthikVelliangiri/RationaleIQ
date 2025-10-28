import { Link } from 'react-router-dom'
import { Brain, Settings, LogOut, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Button from './Button'
import Card, { CardBody } from './Card'

const Navbar = () => {
  const [showSettings, setShowSettings] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse user data')
      }
    }
  }, [])

  const handleClearApiKey = () => {
    if (window.confirm('Are you sure you want to clear your API key? You will need to enter it again.')) {
      localStorage.removeItem('gemini_api_key')
      toast.success('API key cleared. Refreshing...')
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('gemini_api_key')
    localStorage.removeItem('last_user_id')
    toast.success('Logged out successfully')
    // Force redirect to root path and reload
    window.location.href = '/'
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/30">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                RationaleIQ
              </span>
            </Link>
            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {user.username || user.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Dropdown */}
      {showSettings && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSettings(false)}
          ></div>
          <div className="fixed top-16 right-6 z-50 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl animate-scale-in">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Settings</h3>
            </div>
            <div className="p-4 space-y-3">
              {user && (
                <div className="text-sm text-gray-600 dark:text-gray-400 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-semibold mb-1">Account</p>
                  <p className="text-xs">@{user.username}</p>
                </div>
              )}
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-semibold mb-2">API Key Status</p>
                <div className="flex items-center gap-2 text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-green-700 dark:text-green-300">Active</span>
                </div>
              </div>
              
              <button
                onClick={handleClearApiKey}
                className="w-full px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg transition-colors"
              >
                Clear API Key
              </button>
              
              <button
                onClick={() => {
                  setShowSettings(false)
                  setShowLogoutModal(true)
                }}
                className="w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your data is private and only accessible to you.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Confirm Logout
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to log out? You'll need to sign in again to access your projects and data.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  )
}

export default Navbar
