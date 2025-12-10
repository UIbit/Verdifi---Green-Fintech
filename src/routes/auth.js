/**
 * Authentication Routes
 * Handles user registration and login
 */

import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Sign Up Route
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username or email already exists' 
      });
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.email = user.email;

    res.json({ 
      success: true, 
      message: 'Account created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error creating account' 
    });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.email = user.email;

    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error logging in' 
    });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Error logging out' 
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check Auth Status
router.get('/status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ 
      success: true, 
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        email: req.session.email
      }
    });
  } else {
    res.json({ 
      success: true, 
      authenticated: false 
    });
  }
});

export default router;

