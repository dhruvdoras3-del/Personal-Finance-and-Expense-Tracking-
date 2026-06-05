const dbService = require('../services/dbService');

const budgetController = {
  getBudgets: async (req, res) => {
    try {
      const userId = req.user.id;
      const month = req.query.month || new Date().toISOString().substring(0, 7); // Format: YYYY-MM

      const budgets = await dbService.getBudgets(userId, month);
      
      // Fetch actual expenses for the month to see how much has been spent
      const transactions = await dbService.getTransactions(userId, {
        type: 'expense',
        startDate: `${month}-01`,
        endDate: `${month}-31`
      });

      // Group actual spending by category
      const actualSpends = {};
      transactions.forEach(t => {
        actualSpends[t.category] = (actualSpends[t.category] || 0) + t.amount;
      });

      // Merge budget and actual values
      const mergedBudgets = budgets.map(b => {
        const spent = actualSpends[b.category] || 0;
        return {
          id: b._id || b.id,
          category: b.category,
          limitAmount: b.limitAmount,
          spent,
          remaining: Math.max(0, b.limitAmount - spent),
          isOver: spent > b.limitAmount,
          month: b.month
        };
      });

      // Add any category that has spending but no explicit budget limit, as "no limit"
      // to give the user a full spending layout
      const categoriesWithBudgets = new Set(budgets.map(b => b.category));
      Object.keys(actualSpends).forEach(cat => {
        if (!categoriesWithBudgets.has(cat)) {
          mergedBudgets.push({
            id: null,
            category: cat,
            limitAmount: 0,
            spent: actualSpends[cat],
            remaining: 0,
            isOver: true,
            month
          });
        }
      });

      res.json(mergedBudgets);
    } catch (err) {
      console.error('Get Budgets Error:', err);
      res.status(500).json({ message: 'Server error fetching budgets.' });
    }
  },

  setBudget: async (req, res) => {
    try {
      const userId = req.user.id;
      const { category, limitAmount, month } = req.body;

      if (!category || limitAmount === undefined) {
        return res.status(400).json({ message: 'Category and limitAmount are required.' });
      }

      const activeMonth = month || new Date().toISOString().substring(0, 7); // YYYY-MM
      const budget = await dbService.setBudget(userId, category, parseFloat(limitAmount), activeMonth);

      res.status(201).json(budget);
    } catch (err) {
      console.error('Set Budget Error:', err);
      res.status(500).json({ message: 'Server error setting budget.' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await dbService.deleteBudget(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Budget not found or unauthorized.' });
      }

      res.json({ message: 'Budget removed successfully.', budget: deleted });
    } catch (err) {
      console.error('Delete Budget Error:', err);
      res.status(500).json({ message: 'Server error removing budget.' });
    }
  }
};

module.exports = budgetController;
