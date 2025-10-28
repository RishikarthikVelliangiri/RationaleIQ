import express from 'express'
import User from '../models/User.js'
import { generateToken, authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, username, password } = req.body

    // Validate input
    if (!name || !username || !password) {
      return res.status(400).json({ 
        error: 'Please provide name, username, and password' 
      })
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      })
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        error: 'Username must be at least 3 characters long' 
      })
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Username already taken' 
      })
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      password
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        createdAt: user.createdAt
      },
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ 
        error: messages.join('. ') 
      })
    }
    
    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    })
  }
})

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Please provide username and password' 
      })
    }

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() })
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      })
    }

    // Generate token
    const token = generateToken(user._id)

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        createdAt: user.createdAt
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    })
  }
})

// Get current user (protected route)
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({ user: req.user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ 
      error: 'Failed to get user information' 
    })
  }
})

export default router
