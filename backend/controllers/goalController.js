const dbService = require('../services/dbService');

const goalController = {
  getGoals: async (req, res) => {
    try {
      const userId = req.user.id;
      const goals = await dbService.getGoals(userId);
      res.json(goals);
    } catch (err) {
      console.error('Get Goals Error:', err);
      res.status(500).json({ message: 'Server error fetching goals.' });
    }
  },

  create: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, targetAmount, currentAmount, targetDate } = req.body;

      if (!name || !targetAmount || !targetDate) {
        return res.status(400).json({ message: 'Name, targetAmount, and targetDate are required.' });
      }

      const goal = await dbService.createGoal(userId, {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        targetDate
      });

      res.status(201).json(goal);
    } catch (err) {
      console.error('Create Goal Error:', err);
      res.status(500).json({ message: 'Server error creating goal.' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      if (updates.targetAmount) updates.targetAmount = parseFloat(updates.targetAmount);
      if (updates.currentAmount) updates.currentAmount = parseFloat(updates.currentAmount);

      // Check auto-completion
      if (updates.currentAmount !== undefined && updates.targetAmount !== undefined) {
        if (updates.currentAmount >= updates.targetAmount) {
          updates.status = 'Achieved';
        } else {
          updates.status = 'In Progress';
        }
      } else if (updates.currentAmount !== undefined) {
        // We need to fetch the goal first to compare
        const goals = await dbService.getGoals(userId);
        const goal = goals.find(g => (g._id || g.id).toString() === id.toString());
        if (goal && updates.currentAmount >= goal.targetAmount) {
          updates.status = 'Achieved';
        } else {
          updates.status = 'In Progress';
        }
      }

      const updated = await dbService.updateGoal(id, userId, updates);
      if (!updated) {
        return res.status(404).json({ message: 'Savings goal not found or unauthorized.' });
      }

      res.json(updated);
    } catch (err) {
      console.error('Update Goal Error:', err);
      res.status(500).json({ message: 'Server error updating savings goal.' });
    }
  },

  contribute: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { amount } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Contribution amount must be positive.' });
      }

      const goals = await dbService.getGoals(userId);
      const goal = goals.find(g => (g._id || g.id).toString() === id.toString());
      if (!goal) {
        return res.status(404).json({ message: 'Savings goal not found.' });
      }

      const newCurrentAmount = (goal.currentAmount || 0) + parseFloat(amount);
      const updates = { currentAmount: newCurrentAmount };
      
      if (newCurrentAmount >= goal.targetAmount) {
        updates.status = 'Achieved';
      }

      const updated = await dbService.updateGoal(id, userId, updates);
      res.json(updated);
    } catch (err) {
      console.error('Goal Contribution Error:', err);
      res.status(500).json({ message: 'Server error making contribution.' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await dbService.deleteGoal(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Savings goal not found or unauthorized.' });
      }

      res.json({ message: 'Savings goal deleted.', goal: deleted });
    } catch (err) {
      console.error('Delete Goal Error:', err);
      res.status(500).json({ message: 'Server error deleting savings goal.' });
    }
  }
};

module.exports = goalController;
