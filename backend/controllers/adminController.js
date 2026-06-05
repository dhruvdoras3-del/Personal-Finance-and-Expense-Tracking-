const dbService = require('../services/dbService');

const adminController = {
  getMetrics: async (req, res) => {
    try {
      const metrics = await dbService.getPlatformMetrics();
      res.json(metrics);
    } catch (err) {
      console.error('Get Admin Metrics Error:', err);
      res.status(500).json({ message: 'Server error fetching platform metrics.' });
    }
  },

  getUsers: async (req, res) => {
    try {
      const users = await dbService.getAllUsers();
      // Remove passwords from response list
      const sanitizedUsers = users.map(u => ({
        id: u._id || u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        healthScore: u.healthScore || 70,
        createdAt: u.createdAt
      }));
      res.json(sanitizedUsers);
    } catch (err) {
      console.error('Get Admin Users Error:', err);
      res.status(500).json({ message: 'Server error fetching user list.' });
    }
  },

  updateUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body; // 'user', 'admin', 'blocked'

      if (!role || !['user', 'admin', 'blocked'].includes(role)) {
        return res.status(400).json({ message: 'Valid role is required ("user", "admin", "blocked").' });
      }

      const updated = await dbService.updateUser(id, { role });
      if (!updated) {
        return res.status(404).json({ message: 'User not found.' });
      }

      res.json({
        message: `User role successfully updated to ${role}.`,
        user: {
          id: updated._id || updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role
        }
      });
    } catch (err) {
      console.error('Update User Role Error:', err);
      res.status(500).json({ message: 'Server error updating user role.' });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent deleting oneself
      if (id.toString() === req.user.id.toString()) {
        return res.status(400).json({ message: 'You cannot delete your own admin account.' });
      }

      const deleted = await dbService.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: 'User not found.' });
      }

      res.json({ message: 'User account and all associated data deleted successfully.' });
    } catch (err) {
      console.error('Delete User Error:', err);
      res.status(500).json({ message: 'Server error deleting user.' });
    }
  }
};

module.exports = adminController;
