import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import DecisionDetail from './pages/DecisionDetail'
import Search from './pages/Search'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Layout from './components/Layout'
import ShortcutsHelp from './components/ShortcutsHelp'
import KeySetup from './components/KeySetup'
import UserSetup from './components/UserSetup'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

// Wrapper component that uses router hooks
function AppContent({ hasApiKey, hasUser, onKeySetup, onUserSetup }) {
  // Enable global keyboard shortcuts (must be inside Router)
  useKeyboardShortcuts();

  // If no user, show user setup (login/register)
  if (!hasUser) {
    return <UserSetup onUserSetup={onUserSetup} />
  }

  // If no API key, show setup screen
  if (!hasApiKey) {
    return <KeySetup onKeySubmit={onKeySetup} />
  }

  return (
    <>
      <ShortcutsHelp />
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white',
          style: {
            borderRadius: '12px',
          }
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="decisions/:id" element={<DecisionDetail />} />
          <Route path="search" element={<Search />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
}

function App() {
  const [apiKey, setApiKey] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check for existing user in localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('user')
      }
    }

    // Check for existing API key in localStorage
    const storedKey = localStorage.getItem('gemini_api_key')
    if (storedKey) {
      setApiKey(storedKey)
    }
  }, [])

  const handleUserSetup = (userData) => {
    setUser(userData)
  }

  const handleKeySetup = (key) => {
    setApiKey(key)
  }

  return (
    <ThemeProvider>
      <Router>
        <AppContent 
          hasUser={!!user} 
          hasApiKey={!!apiKey} 
          onUserSetup={handleUserSetup}
          onKeySetup={handleKeySetup} 
        />
      </Router>
    </ThemeProvider>
  )
}

export default App
