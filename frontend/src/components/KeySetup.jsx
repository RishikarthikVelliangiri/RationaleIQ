import { useState } from 'react'
import { Key, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import Card, { CardHeader, CardBody } from './Card'
import Button from './Button'
import ThemeToggle from './ThemeToggle'

const KeySetup = ({ onKeySubmit }) => {
  const [apiKey, setApiKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API key')
      return
    }

    setTesting(true)
    
    // Test the API key by making a simple request
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Hello' }]
            }]
          })
        }
      )

      if (response.ok) {
        // Key is valid, store it and notify parent
        localStorage.setItem('gemini_api_key', apiKey)
        onKeySubmit(apiKey)
      } else {
        const data = await response.json()
        setError(data.error?.message || 'Invalid API key. Please check and try again.')
      }
    } catch (err) {
      setError('Failed to validate API key. Please check your connection.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl w-full space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-6 shadow-2xl shadow-purple-500/30 animate-scale-in">
            <Sparkles className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400 mb-4">
            Welcome to RationaleIQ
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            AI-powered decision tracking and rationale extraction
          </p>
        </div>

        {/* Setup Card */}
        <Card className="shadow-2xl border-2 border-purple-100 dark:border-purple-900/30">
          <CardHeader className="p-6 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Key Setup</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Your key is stored locally and never sent to our servers
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  How to get your Gemini API key:
                </h3>
                <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200 ml-7 list-decimal">
                  <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-blue-600">Google AI Studio</a></li>
                  <li>Click "Get API Key" or "Create API Key"</li>
                  <li>Copy the key and paste it below</li>
                </ol>
              </div>

              {/* API Key Input */}
              <div>
                <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg font-mono"
                  />
                </div>
                {error && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-semibold mb-1">🔒 Your data is secure</p>
                    <ul className="space-y-1 ml-1">
                      <li>• API key stored locally in your browser only</li>
                      <li>• Key is never sent to our servers</li>
                      <li>• All AI requests go directly to Google</li>
                      <li>• You can clear it anytime from settings</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" loading={testing} className="w-full py-4 text-lg">
                {testing ? (
                  <>Validating API Key...</>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Continue to RationaleIQ
                  </>
                )}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Demo Notice */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This is a demo service. Your API key enables all AI features including decision extraction and semantic search.
          </p>
        </div>
      </div>
    </div>
  )
}

export default KeySetup
