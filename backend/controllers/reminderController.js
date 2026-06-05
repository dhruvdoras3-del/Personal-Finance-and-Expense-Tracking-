const dbService = require('../services/dbService');

const reminderController = {
  getReminders: async (req, res) => {
    try {
      const userId = req.user.id;
      const reminders = await dbService.getReminders(userId);
      res.json(reminders);
    } catch (err) {
      console.error('Get Reminders Error:', err);
      res.status(500).json({ message: 'Server error fetching reminders.' });
    }
  },

  create: async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, amount, dueDate, category } = req.body;

      if (!title || !amount || !dueDate || !category) {
        return res.status(400).json({ message: 'Title, amount, dueDate, and category are required.' });
      }

      const reminder = await dbService.createReminder(userId, {
        title,
        amount: parseFloat(amount),
        dueDate,
        category
      });

      res.status(201).json(reminder);
    } catch (err) {
      console.error('Create Reminder Error:', err);
      res.status(500).json({ message: 'Server error creating reminder.' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      if (updates.amount) updates.amount = parseFloat(updates.amount);
      if (updates.isPaid !== undefined) updates.isPaid = !!updates.isPaid;

      // If marked as paid, we can optionally create an automatic expense transaction
      // e.g., if updates.isPaid is true and was false before.
      if (updates.isPaid) {
        const reminders = await dbService.getReminders(userId);
        const rem = reminders.find(r => (r._id || r.id).toString() === id.toString());
        if (rem && !rem.isPaid) {
          // Auto create expense transaction!
          await dbService.createTransaction({
            userId,
            type: 'expense',
            category: rem.category,
            amount: rem.amount,
            date: new Date().toISOString().split('T')[0],
            description: `Paid Bill: ${rem.title}`
          });
        }
      }

      const updated = await dbService.updateReminder(id, userId, updates);
      if (!updated) {
        return res.status(404).json({ message: 'Reminder not found or unauthorized.' });
      }

      res.json(updated);
    } catch (err) {
      console.error('Update Reminder Error:', err);
      res.status(500).json({ message: 'Server error updating reminder.' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await dbService.deleteReminder(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Reminder not found or unauthorized.' });
      }

      res.json({ message: 'Reminder deleted successfully.', reminder: deleted });
    } catch (err) {
      console.error('Delete Reminder Error:', err);
      res.status(500).json({ message: 'Server error deleting reminder.' });
    }
  }
};

module.exports = reminderController;
