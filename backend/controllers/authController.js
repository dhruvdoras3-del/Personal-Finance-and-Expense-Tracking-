const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbService = require('../services/dbService');

const JWT_SECRET = process.env.JWT_SECRET || 'finance_tracker_secret_key_12345';

// Helper to generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      // Check if user exists
      const userExists = await dbService.findUserByEmail(email);
      if (userExists) {
        return res.status(400).json({ message: 'User already exists.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await dbService.createUser({
        name,
        email,
        password: hashedPassword,
        role: 'user'
      });

      const token = generateToken(user);

      res.status(201).json({
        token,
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          healthScore: user.healthScore || 70
        }
      });
    } catch (err) {
      console.error('Registration Error:', err);
      res.status(500).json({ message: 'Server error during registration.' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const user = await dbService.findUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          healthScore: user.healthScore || 70,
          profilePic: user.profilePic
        }
      });
    } catch (err) {
      console.error('Login Error:', err);
      res.status(500).json({ message: 'Server error during login.' });
    }
  },

  // Simulated Google Login for local/offline runnability
  googleLogin: async (req, res) => {
    try {
      const { email, name, googleId, profilePic } = req.body;

      if (!email || !name) {
        return res.status(400).json({ message: 'Google email and name are required.' });
      }

      let user = await dbService.findUserByEmail(email);

      if (!user) {
        // Create user with a random high-entropy dummy password
        const dummyPassword = Math.random().toString(36).slice(-10) + Date.now().toString();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(dummyPassword, salt);

        user = await dbService.createUser({
          name,
          email,
          password: hashedPassword,
          googleId,
          profilePic,
          role: email.includes('admin') ? 'admin' : 'user' // Admin detection fallback
        });
      } else {
        // Update user's googleId or profilePic if not set
        const updates = {};
        if (!user.googleId && googleId) updates.googleId = googleId;
        if (profilePic && user.profilePic !== profilePic) updates.profilePic = profilePic;

        if (Object.keys(updates).length > 0) {
          user = await dbService.updateUser(user._id || user.id, updates);
        }
      }

      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          healthScore: user.healthScore || 70,
          profilePic: user.profilePic
        }
      });
    } catch (err) {
      console.error('Google Login Error:', err);
      res.status(500).json({ message: 'Server error during Google Login.' });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await dbService.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      res.json({
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        healthScore: user.healthScore || 70,
        profilePic: user.profilePic,
        createdAt: user.createdAt
      });
    } catch (err) {
      console.error('Get Profile Error:', err);
      res.status(500).json({ message: 'Server error fetching profile.' });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { name, password, profilePic } = req.body;
      const updates = {};

      if (name) updates.name = name;
      if (profilePic) updates.profilePic = profilePic;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(password, salt);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No updates provided.' });
      }

      const updatedUser = await dbService.updateUser(req.user.id, updates);

      res.json({
        id: updatedUser._id || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        healthScore: updatedUser.healthScore || 70,
        profilePic: updatedUser.profilePic
      });
    } catch (err) {
      console.error('Update Profile Error:', err);
      res.status(500).json({ message: 'Server error updating profile.' });
    }
  }
};

module.exports = authController;
