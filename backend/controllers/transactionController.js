const dbService = require('../services/dbService');

const transactionController = {
  create: async (req, res) => {
    try {
      const { type, category, amount, date, description, source, isRecurring, recurringInterval } = req.body;
      const userId = req.user.id;

      if (!type || !category || !amount || !date) {
        return res.status(400).json({ message: 'Type, category, amount, and date are required.' });
      }

      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: 'Type must be either "income" or "expense".' });
      }

      let nextOccurrence = null;
      if (isRecurring && recurringInterval) {
        // Calculate next occurrence date based on current date
        const tDate = new Date(date);
        if (recurringInterval === 'daily') tDate.setDate(tDate.getDate() + 1);
        else if (recurringInterval === 'weekly') tDate.setDate(tDate.getDate() + 7);
        else if (recurringInterval === 'monthly') tDate.setMonth(tDate.getMonth() + 1);
        else if (recurringInterval === 'yearly') tDate.setFullYear(tDate.getFullYear() + 1);
        nextOccurrence = tDate.toISOString().split('T')[0];
      }

      const transaction = await dbService.createTransaction({
        userId,
        type,
        category,
        amount: parseFloat(amount),
        date,
        description,
        source,
        isRecurring: !!isRecurring,
        recurringInterval,
        nextOccurrence
      });

      // Recalculate health score asynchronously
      res.status(201).json(transaction);
    } catch (err) {
      console.error('Create Transaction Error:', err);
      res.status(500).json({ message: 'Server error creating transaction.' });
    }
  },

  getAll: async (req, res) => {
    try {
      const userId = req.user.id;
      const { category, type, startDate, endDate, search } = req.query;

      const transactions = await dbService.getTransactions(userId, {
        category,
        type,
        startDate,
        endDate,
        search
      });

      res.json(transactions);
    } catch (err) {
      console.error('Get Transactions Error:', err);
      res.status(500).json({ message: 'Server error fetching transactions.' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      if (updates.amount) updates.amount = parseFloat(updates.amount);
      if (updates.isRecurring !== undefined) updates.isRecurring = !!updates.isRecurring;

      const updated = await dbService.updateTransaction(id, userId, updates);
      if (!updated) {
        return res.status(404).json({ message: 'Transaction not found or unauthorized.' });
      }

      res.json(updated);
    } catch (err) {
      console.error('Update Transaction Error:', err);
      res.status(500).json({ message: 'Server error updating transaction.' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await dbService.deleteTransaction(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Transaction not found or unauthorized.' });
      }

      res.json({ message: 'Transaction deleted successfully.', transaction: deleted });
    } catch (err) {
      console.error('Delete Transaction Error:', err);
      res.status(500).json({ message: 'Server error deleting transaction.' });
    }
  },

  getSummary: async (req, res) => {
    try {
      const userId = req.user.id;
      const { month } = req.query; // Format: YYYY-MM
      
      const transactions = await dbService.getTransactions(userId, {
        startDate: month ? `${month}-01` : null,
        endDate: month ? `${month}-31` : null
      });

      let totalIncome = 0;
      let totalExpense = 0;
      const categoryTotals = {};
      const monthlyTrends = {}; // For historical charts

      transactions.forEach(t => {
        const amt = t.amount;
        if (t.type === 'income') {
          totalIncome += amt;
        } else {
          totalExpense += amt;
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
        }

        // Monthly trends data group
        const mKey = t.date.substring(0, 7); // YYYY-MM
        if (!monthlyTrends[mKey]) {
          monthlyTrends[mKey] = { month: mKey, income: 0, expenses: 0 };
        }
        if (t.type === 'income') {
          monthlyTrends[mKey].income += amt;
        } else {
          monthlyTrends[mKey].expenses += amt;
        }
      });

      // Format trends for frontend Chart.js/Recharts
      const trendsArray = Object.values(monthlyTrends).sort((a, b) => a.month.localeCompare(b.month));

      res.json({
        totalIncome,
        totalExpense,
        savings: Math.max(0, totalIncome - totalExpense),
        categoryTotals,
        monthlyTrends: trendsArray,
        recentTransactions: transactions.slice(0, 5)
      });
    } catch (err) {
      console.error('Get Transaction Summary Error:', err);
      res.status(500).json({ message: 'Server error fetching transaction summary.' });
    }
  },

  exportCSV: async (req, res) => {
    try {
      const userId = req.user.id;
      const transactions = await dbService.getTransactions(userId);

      let csvContent = 'Date,Type,Category,Amount,Description,Is Recurring,Source\n';
      
      transactions.forEach(t => {
        const desc = t.description ? t.description.replace(/"/g, '""') : '';
        const sourceVal = t.source || '';
        csvContent += `"${t.date}","${t.type}","${t.category}",${t.amount},"${desc}",${t.isRecurring ? 'Yes' : 'No'},"${sourceVal}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);
      res.status(200).send(csvContent);
    } catch (err) {
      console.error('Export CSV Error:', err);
      res.status(500).json({ message: 'Server error exporting transactions.' });
    }
  }
};

module.exports = transactionController;
